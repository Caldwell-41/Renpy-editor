"""Retain the exact packaged executable and identity, even after later gate failure."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tarfile


def stream_digest(stream):
    value = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
        value.update(chunk)
    return value.hexdigest()


def digest(path):
    with path.open("rb") as stream:
        return stream_digest(stream)


def retain_package(executable, bundle, output):
    expected = digest(executable)
    if bundle is None:
        retained = output / "loomlight.exe"
        shutil.copy2(executable, retained)
        actual = digest(retained)
    else:
        # Artifact ZIP uploads discard Unix permissions and can dereference links.
        # Keep the whole scanned bundle in a tar before uploading it.
        retained = output / "Loomlight.app.tar"
        with tarfile.open(retained, "w", dereference=False) as archive:
            archive.add(bundle, arcname=bundle.name)
        with tarfile.open(retained, "r") as archive:
            member = archive.extractfile("Loomlight.app/Contents/MacOS/loomlight")
            if member is None:
                raise RuntimeError("retained archive is missing the executable")
            with member:
                actual = stream_digest(member)
    if actual != expected:
        raise RuntimeError("retained executable digest does not match the produced executable")
    return retained


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", choices=("Windows", "macOS"), required=True)
    parser.add_argument("--package-outcome", required=True)
    parser.add_argument("--scan-outcome", required=True)
    parser.add_argument("--runtime-outcome", required=True)
    parser.add_argument("--runner", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--run-attempt", required=True)
    parser.add_argument("--sha", required=True)
    args = parser.parse_args()

    app_root = Path.cwd()
    if args.platform == "Windows":
        executable = app_root / "target/release/loomlight.exe"
        bundle = None
    else:
        bundle = app_root / "target/release/bundle/macos/Loomlight.app"
        executable = bundle / "Contents/MacOS/loomlight"
    executable_present = executable.is_file()
    scan_ok = args.scan_outcome == "success"
    if not executable_present:
        state = "built-but-missing" if args.package_outcome == "success" else "not-built"
    elif not scan_ok:
        state = "withheld-by-scan"
    elif args.package_outcome == "success":
        state = "available"
    else:
        state = "produced-during-package-failure"

    output = args.output
    output.mkdir(parents=True, exist_ok=True)
    retained_files = []
    retained_hashes = {}
    binary_hash = digest(executable) if executable_present else None
    if executable_present and scan_ok:
        retained = retain_package(executable, bundle, output)
        retained_files.append(retained.name)
        retained_hashes[retained.name] = digest(retained)

    head = subprocess.run(["git", "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()
    tree = subprocess.run(["git", "rev-parse", "HEAD^{tree}"], check=True, capture_output=True, text=True).stdout.strip()
    manifest = {
        "schema": 1,
        "artifactState": state,
        "packageOutcome": args.package_outcome,
        "sourceScanOutcome": args.scan_outcome,
        "runtimeCasesOutcome": args.runtime_outcome,
        "target": {"platform": args.platform, "runner": args.runner},
        "runId": args.run_id,
        "runAttempt": args.run_attempt,
        "workflowSha": args.sha,
        "checkoutHead": head,
        "tree": tree,
        "executablePath": str(executable.relative_to(app_root)).replace("\\", "/"),
        "executableSha256": binary_hash,
        "retainedFiles": retained_files,
        "retainedSha256": retained_hashes,
        "retentionWithheldByScan": executable_present and not scan_ok,
        "runtimeCases": [],
    }
    for case in ("compile", "lint", "route-a", "route-b", "runtime-error"):
        report_path = Path(args.output).parent / f"runtime-ui-{case}.json"
        try:
            record = json.loads(report_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            manifest["runtimeCases"].append({"case": case, "state": "missing-or-malformed-report"})
            continue
        package_reports = record.get("reports") if isinstance(record, dict) else None
        report = package_reports[0] if isinstance(package_reports, list) and len(package_reports) == 1 else None
        passed = (
            isinstance(record, dict)
            and record.get("case") == case
            and record.get("passed") is True
            and record.get("exitCode") == 0
            and record.get("timedOut") is False
            and isinstance(report, dict)
            and report.get("evidence") == "runtime-ui-packaged"
            and report.get("passed") is True
            and report.get("cleanupComplete") is True
        )
        manifest["runtimeCases"].append({
            "case": case,
            "state": "passed" if passed else "failed-or-incomplete",
            "cleanupComplete": report.get("cleanupComplete") if isinstance(report, dict) else None,
            "exitCode": record.get("exitCode") if isinstance(record, dict) else None,
            "timedOut": record.get("timedOut") if isinstance(record, dict) else None,
        })
    inputs = Path(args.output).parent / "runtime-ui-inputs.json"
    manifest["runtimeInputsSha256"] = digest(inputs) if inputs.is_file() else None
    (output / "package-evidence.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, sort_keys=True))
    if args.package_outcome == "success" and state != "available":
        raise SystemExit(f"successful package output is {state}")
    if executable_present and not scan_ok:
        raise SystemExit("package evidence withheld because source artifact scan did not pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
