#!/usr/bin/env python3
"""Explicit local certificate build and produced-bundle verification. Never installs.

The public SHA-1 fingerprint is a signing identity selector, not a secret or a
replacement for signature verification. No key generation/import/trust changes.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time

APP = Path(__file__).resolve().parents[1]
PRODUCT = "Loomlight"
BUNDLE_ID = "app.loomlight.desktop"
EXECUTABLE = "loomlight"


def fingerprint(value):
    if not re.fullmatch(r"[0-9a-fA-F]{40}", value):
        raise ValueError("An explicitly approved certificate SHA-1 fingerprint is required.")
    return value.upper()


def approved_fingerprint(value):
    pin = fingerprint(value)
    policy = json.loads((APP / "src-tauri/macos-signing.json").read_text())
    if not isinstance(policy.get("certificateSha1"), str) or policy["certificateSha1"].upper() != pin:
        raise ValueError("Certificate is not the approved repository identity; changes require explicit approval.")
    return pin


def remaining(deadline, limit):
    if deadline is None:
        return limit
    seconds = deadline - time.monotonic()
    if seconds <= 0:
        raise ValueError("Package build exceeded its 20-minute deadline; no retry.")
    return min(seconds, limit)


def run(args, deadline=None, **kwargs):
    return subprocess.run(args, check=True, timeout=remaining(deadline, 120), capture_output=True, **kwargs)


def check_plist(bundle, info):
    expected = {"CFBundleName": PRODUCT, "CFBundleDisplayName": PRODUCT,
                "CFBundleIdentifier": BUNDLE_ID, "CFBundleExecutable": EXECUTABLE}
    if bundle.name != PRODUCT + ".app" or any(info.get(k) != v for k, v in expected.items()):
        raise ValueError("Produced bundle name, executable or identity drifted.")
    if not info.get("CFBundleVersion") or not info.get("CFBundleShortVersionString"):
        raise ValueError("Version metadata is missing.")


def check_requirement(requirement, pin):
    # The approved local self-signed route must bind both identifier AND exact signing certificate.
    # Reject cdhash, identifier-only and widened OR requirements, even if signed.
    actual = requirement.removeprefix("designated => ").strip()
    matched = re.fullmatch(r'identifier "app\.loomlight\.desktop" and certificate leaf = H"([0-9a-fA-F]{40})"', actual)
    if not matched or matched[1].upper() != pin.upper():
        raise ValueError("Unexpected designated requirement; inspect and obtain approval, never weaken it.")


def verify(bundle, pin, deadline=None):
    pin = fingerprint(pin)
    info = plistlib.loads((bundle / "Contents/Info.plist").read_bytes())
    check_plist(bundle, info)
    run(["codesign", "--verify", "--deep", "--strict", "--verbose=2", str(bundle)], deadline=deadline)
    display = run(["codesign", "--display", "--verbose=4", "-r-", str(bundle)], text=True, deadline=deadline)
    details = display.stdout + display.stderr
    if "Signature=adhoc" in details or f"Identifier={BUNDLE_ID}\n" not in details:
        raise ValueError("Certificate-backed bundle signature required.")
    lines = [line.removeprefix("# ") for line in details.splitlines() if "designated => " in line]
    if len(lines) != 1:
        raise ValueError("Missing or ambiguous designated requirement.")
    check_requirement(lines[0], pin)
    with tempfile.TemporaryDirectory(prefix="loomlight-public-certificate-") as temp:
        prefix = str(Path(temp) / "certificate")
        run(["codesign", "--display", "--extract-certificates=" + prefix, str(bundle)], deadline=deadline)
        certificate = Path(prefix + "0").read_bytes()
        if hashlib.sha1(certificate).hexdigest().upper() != pin:
            raise ValueError("Produced bundle uses a different signing certificate.")
    executable = bundle / "Contents/MacOS" / EXECUTABLE
    return {"bundle": bundle.name, "identifier": BUNDLE_ID, "certificateSHA1": pin,
            "designatedRequirement": lines[0], "bundleVersion": info["CFBundleVersion"],
            "executableSHA256": hashlib.sha256(executable.read_bytes()).hexdigest(),
            "strictSignatureVerified": True}


def build(output, pin, version):
    deadline = time.monotonic() + 1200
    if sys.platform != "darwin":
        raise ValueError("This package route requires macOS.")
    if output.exists():
        raise ValueError("Choose a fresh version/evidence directory; existing packages are preserved.")
    # Do not inherit a certificate import, notarization request or another config.
    forbidden = [k for k in os.environ if k.startswith(("APPLE_", "TAURI_")) or k in ("CARGO_TARGET_DIR", "CARGO_BUILD_TARGET")]
    if forbidden:
        raise ValueError("Clear external APPLE_*, TAURI_* and Cargo target overrides before this explicit local build.")
    identities = run(["security", "find-identity", "-p", "codesigning"], text=True, deadline=deadline).stdout
    if pin not in identities.upper():
        raise ValueError("Selected certificate/private-key identity is unavailable; no fallback.")
    override = {"bundle": {"macOS": {"signingIdentity": pin}}}
    if version:
        if not re.fullmatch(r"\d+\.\d+\.\d+", version):
            raise ValueError("Use a numeric major.minor.patch metadata version.")
        override["version"] = version
    env = dict(os.environ, APPLE_SIGNING_IDENTITY=pin, LOOMLIGHT_SIGNING_SHA1=pin)
    output.mkdir(parents=True)
    started = time.time()
    # Preserve the exact invocation output, including a failed build. No retry.
    with (output / "build.log").open("wb") as log:
        build_timeout = remaining(deadline, 1200)
        process = subprocess.Popen(["npm", "exec", "--", "tauri", "build", "--bundles", "app",
                        "--config", json.dumps(override), "--", "--locked"],
                       cwd=APP, env=env, stdout=log, stderr=subprocess.STDOUT,
                       start_new_session=True)
        try:
            code = process.wait(timeout=build_timeout)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                pass
            # npm may exit before its compiler children; stop the entire owned group.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait()
            raise ValueError("Build exceeded 20 minutes; owned process group stopped. No retry.") from None
        if code:
            raise ValueError(f"Build exited {code}; retain build.log. No retry.")
    source = APP / "target/release/bundle/macos/Loomlight.app"
    if (source / "Contents/Info.plist").stat().st_mtime < started:
        raise ValueError("Expected bundle was not regenerated by this build; refuse stale artifact.")
    receipt = verify(source, pin, deadline)
    if version and receipt["bundleVersion"] != version:
        raise ValueError("Produced version does not match the explicitly selected metadata version.")
    bundle = output / "Loomlight.app"
    shutil.copytree(source, bundle, symlinks=True)
    if verify(bundle, pin, deadline) != receipt:
        raise ValueError("Copied bundle identity changed.")
    # Create the installer with its permanent name and volume label; versions live
    # in metadata and output directories. The app is already signed and verified.
    with tempfile.TemporaryDirectory(prefix="loomlight-installer-") as temp:
        stage = Path(temp)
        shutil.copytree(bundle, stage / "Loomlight.app", symlinks=True)
        (stage / "Applications").symlink_to("/Applications")
        dmg = output / "Loomlight.dmg"
        run(["hdiutil", "create", "-volname", PRODUCT, "-srcfolder", str(stage),
             "-format", "UDZO", str(dmg)], deadline=deadline)
    run(["codesign", "--sign", pin, "--timestamp=none", str(dmg)], deadline=deadline)
    run(["codesign", "--verify", "--strict", str(dmg)], deadline=deadline)
    # Inspect the actual installer contents read-only, without installing/launching.
    with tempfile.TemporaryDirectory(prefix="loomlight-installer-check-") as mount:
        attached = False
        try:
            run(["hdiutil", "attach", "-readonly", "-nobrowse", "-mountpoint", mount, str(dmg)], deadline=deadline)
            attached = True
            if verify(Path(mount) / "Loomlight.app", pin, deadline) != receipt:
                raise ValueError("Installer bundle differs from the verified source bundle.")
        finally:
            if attached:
                run(["hdiutil", "detach", mount])
    receipt["installerSHA256"] = hashlib.sha256(dmg.read_bytes()).hexdigest()
    receipt["installerContentsVerified"] = True
    (output / "identity-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--identity-sha1", required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--verify", type=Path, metavar="Loomlight.app")
    group.add_argument("--build", type=Path, metavar="NEW_OUTPUT_DIRECTORY")
    parser.add_argument("--version", help="Optional metadata-only version for a changed-build proof.")
    args = parser.parse_args()
    try:
        pin = approved_fingerprint(args.identity_sha1)
        receipt = verify(args.verify.resolve(), pin) if args.verify else build(args.build.resolve(), pin, args.version)
        print(json.dumps(receipt, indent=2))
    except (ValueError, OSError, subprocess.SubprocessError, plistlib.InvalidFileException) as error:
        # No child stdout/stderr, certificate subject, environment or credential values.
        print(f"Package verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
