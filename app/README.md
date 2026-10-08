# Loomlight production scaffold

This directory contains the Phase 1 production workspace, including the completed 1A
scaffold and 1B transaction foundation plus the active bounded 1C project lifecycle.
It remains separate from disposable Phase 0 evidence under `spikes/`.

## Local checks

```bash
npm ci --ignore-scripts
npm run check
npm run build
cargo fmt --check --all
cargo test -p loomlight-core --locked
```

Full desktop tests and packaging require a supported Windows x86-64 or macOS Apple
Silicon development environment:

```bash
cargo test -p loomlight-desktop --locked
# Windows packaging (Mac uses the explicit signed route below):
npm exec -- tauri build -- --locked
```

The production webview has no general filesystem, process, shell, HTTP, or credential
authority. Its only custom Tauri command is `core_request`, granted through the explicit
`allow-loomlight-core` permission only to the local `main` WebView, with a matching
Rust handler guard. Phase 1C's project/SDK/Git-init capabilities are core-owned,
picker-mediated, typed operations. Studio credentials stay in Rust/native OS entry
and Rust-only storage; the renderer receives redacted status through narrow typed operations.

## macOS local package identity

Permanent names: **Loomlight**, **Loomlight.app**, **Loomlight.dmg**. Preserve executable
`loomlight` and bundle/signature identifier `app.loomlight.desktop`. Use metadata and
separate output directories for versions, never name suffixes. Explicit user approval
is required to change names, credential namespaces or signing identity/policy.

Mac release compilation checks Tauri's effective merged configuration (including
platform files and CLI/environment overrides). It requires a matching public
certificate fingerprint and signing selector; missing/ad-hoc signing is refused.
The public fingerprint in `src-tauri/macos-signing.json` is the approved identity pin.
Neither an environment variable nor a command-line selector can override that pin.
Change it only after explicit approval and inspection of the certificate; never store
a key there. The pin records the selected identity, not successful package qualification.
Debug unit tests need no certificate. Windows signing/packaging is unchanged.
Unconfigured Mac CI release/package jobs now fail closed: provide an approved identity
before selecting such a job; no workflow dispatch or secret provisioning is implicit.

After separate approval for certificate setup and for a package build, use an existing
certificate/private-key identity in Keychain. Set `LOOMLIGHT_SIGNING_SHA1` to the approved
certificate's **public SHA-1 fingerprint** (the selector expected by `codesign`, not a
secret or the artifact-integrity hash). From `app/`, with pinned tools available:

```bash
python3 scripts/macos-package.py --identity-sha1 "$LOOMLIGHT_SIGNING_SHA1" --build ../.toolchains/releases/local/0.1.0
```

The destination must not exist. `--version 0.1.1` changes metadata for a separately
approved second build without changing names. The command refuses external `APPLE_*`
and `TAURI_*`/Cargo target overrides, builds once, signs through Tauri with the selected
certificate, checks the produced bundle, and creates a signed `Loomlight.dmg` containing
`Loomlight.app`. It mounts the installer read-only to inspect the included app, then
detaches it. It does not install, generate/import certificates or change trust.
Build output and identity receipts remain local. A failure is not a retry authorization.

The bundle gate verifies Info.plist names/versions, the executable, strict resource
signature, extracted signing certificate fingerprint, and the generated designated
requirement. The selected local self-signed requirement must bind BOTH the bundle
identifier and exact signing certificate (`certificate leaf = H"…"`); a `cdhash`, identifier-only requirement or broader
alternative fails. A different legitimate certificate scheme needs inspection and
explicit policy approval, not a bypass. Inspect an existing package without launching:

```bash
python3 scripts/macos-package.py --identity-sha1 "$LOOMLIGHT_SIGNING_SHA1" --verify path/to/Loomlight.app
python3 -m unittest discover -s scripts -p test_macos_package.py -v
```

Before acceptance, inspect the installer contents and actual launched path. Two
differently built packages must have different executable hashes and equivalent
certificate-backed requirements, then prove real app-owned credential reuse across
quit/reopen and replacement at one stable installation path. A config or signature
check alone does not prove runtime access. Installation/launch steps need their own
approval and recorded allowance. Generation is not implemented by this work; the
available authenticated path is explicit `/models` discovery against a local fixture.

### Bounded remembered-key qualification

The opt-in Mac sequence reuses the existing `studio-settings` packaged probe with a
fresh disposable profile root. It never imports helper-owned keys. Each phase is one
separately approved launch with a five-minute bound; it exits completely after reporting.
The external loopback fixture checks the expected Authorization value without logging
headers or key bytes. Only these **public disposable fixture inputs** may be entered
through the app's real native dialog: `loomlight-disposable-alpha` for the initial save,
`loomlight-disposable-beta` for replacement. They are not real provider credentials.
No test secret passes through WebView IPC; the app's Rust adapter creates/reads/deletes
its own Keychain items. An opt-in Rust audit retains only owned references in memory
and verifies retired entries are absent. This historical Mac identity probe leaves
normal startup and Windows routing unchanged.

| Phase | Signed package | App-owned action | Local GETs |
| --- | --- | --- | --- |
| 1 | First | Save alpha once, repeated native reads and discovery, full exit | 2 |
| 2 | Same first | Reopen and reuse alpha without re-entry, full exit | 2 |
| 3 | Different executable/version, same certificate | Reuse alpha, replace with beta, verify old deletion, reuse beta, delete beta, full exit | 4 |
| 4 | Same second | Reopen disabled/missing state, remove disposable profile, full exit | 0 |

After explicit installation approval, use one stable `Loomlight.app` path for all phases.
Replace it only between phases 2 and 3 with a separately built and verified package;
never patch/re-sign a running bundle or loosen an ACL. The runner verifies actual signed
bundle metadata, process-reported executable path/PID, unchanged signing requirement,
and the expected same/different executable/version transition before accepting evidence.
It refuses any already-running Loomlight instance, repeated/ambiguous attempts, incomplete
reports, wrong authentication, unexpected request counts or continuation after failure.

```bash
python3 scripts/macos-identity-probe.py --bundle /approved/path/Loomlight.app --output ../.toolchains/reports/macos-identity/runtime --phase 1
```

Use the same output/path and explicitly approved phase 2, 3 or 4 afterwards. The output
must not exist for phase 1. Its ignored `state.json` owns the random temporary profile
root and reserved loopback port for later launches. Keep all attempt/result/log records
and failed profile/cleanup state; no automatic retry or root removal. The historical
Studio recovery root is separate and must not be reused. The runner starts no generation,
contacts no real provider, changes no Keychain lock/trust setting and performs no install.
Native entry can be driven by UI automation using only those synthetic inputs. Any OS
signing-key authorization must be distinguished from runtime API-key access prompts.

Preparation checks use fake IPC/DOM or pure functions and consume no live launch/GET:

```bash
python3 -m unittest discover -s scripts -p 'test_macos*.py' -v
npm run check
cargo test -p loomlight-desktop --locked
```

Passing these checks or signature inspection does not prove native remembered-key reuse.
The owning ledger records actual execution approvals, cumulative budget and limitations.

### Certificate privacy, reuse and recovery

The selected local certificate label is **Loomlight Local Development**. Use only
that generic common name; omit personal name, email, organization, location, username,
hostname, subject-alternative names and identifying URLs/extensions. Inspect all fields
before signing. The label, public key, serial number, validity dates and fingerprint
remain public in signed packages and correlate builds from the same certificate.
The private key and any export password must never appear in Git, chat, logs, build
arguments or package contents. Creation/import/trust changes are separate approvals.

A country field is unnecessary. Certificate Assistant may restore a blank country;
inspect the resulting certificate instead of trusting the wizard fields. The selected
certificate has only the generic common name in both subject and issuer, RSA-4096,
SHA-256 signing and ten-year validity. Key Usage, Extended Key Usage (code signing)
and Subject Key Identifier are its only extensions. Select it by the exact fingerprint,
not a potentially duplicated label.

Keep the persistent identity in the user's Keychain. After explicit export approval,
retain an encrypted certificate/private-key backup outside the repository in protected
storage, with its password separately secured and entered through native UI. Reuse or
restore the exact identity; generating another certificate with the same label does
not restore trust. Keep the public fingerprint/requirement with recovery notes. Losing
the private key or changing certificate/identity requires a new trust/migration decision.
Do not install it as a globally trusted root or use allow-all private-key access.

A local self-signed identity establishes local signing continuity without a purchase;
it does not confer Developer ID, Gatekeeper distribution trust or notarization. See
[Apple's signing guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Procedures/Procedures.html)
and [Tauri's signing configuration](https://v2.tauri.app/distribute/sign/macos/).
The local update test failed despite matching certificate-backed designated requirements:
the app-created item's separate Keychain partition matched only the creating build's
CDHash. [Apple's securityd implementation](https://github.com/apple-oss-distributions/Security/blob/main/securityd/src/clientid.cpp)
uses team partitions for recognized Apple development/distribution signatures and a
CDHash fallback for other signed code. Stable self-signing therefore does **not** prove
remembered-key continuity across updates on this path. Older designated-requirement
guidance in [TN2206](https://developer.apple.com/library/archive/technotes/tn2206/_index.html)
is insufficient alone. Do not add root trust, weaken ACLs or rebuild the same approach
as an automatic correction. A changed signing route requires explicit approval and
fresh app-owned update proof; see the
[identity ledger](../docs/tasks/active/phase-2-initial-llm-assistance.md#stable-macos-identity-and-remembered-keys--2026-10-08).

Free Apple Development signing is a candidate for local qualification, not the currently
approved identity. [Tauri](https://v2.tauri.app/distribute/sign/macos/) supports that
account type for development/testing without notarization. It exposes developer/team
identity in the package certificate and needs explicit privacy/signing-policy approval.
[Apple TN3125](https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles)
explains that Mac apps without restricted entitlements need no provisioning profile;
do not equate free provisioning-profile limits with an automatic seven-day app lifetime.
Inspect the issued certificate's actual expiry, chain and generated requirement, then
prove a new app-owned item's partition and changed-build reuse. Do not add access-group
entitlements or alter Keychain ACLs to make this experiment pass. Existing signing-owned
keys may require one-time native re-entry; retain their references and pending cleanup.

## Temporary Mac development credentials

The Windows remembered-profile adapter is described in
[Windows native Studio credentials](#windows-native-studio-credentials) below.

The selected [development plan](../docs/tasks/active/2026-10-08-macos-development-credential-storage.md)
uses encrypted local records plus an unencrypted random local unlock key. Software under
the same login can decrypt them. Native AppKit entry stays outside the web view; failed
persistence keeps input for explicit Retry/Cancel. Healthy compatible storage is intended
to survive quit/reopen and app replacement without API-key entry; the bounded public
synthetic packaged Mac fixture passed. No production release qualification is implied.

Profiles and `credentials-dev/generations/` use the same stable Tauri app-data root.
Keys are created only on explicit save/recovery, never on Settings/Retry. Directories
are 0700, key/record/temporary files 0600. Rust verifies decryption before publishing a
new reference; saved/cleanup-pending is distinct from failed save. Re-entry after missing/
damaged storage preserves original generations and profile settings; it never regenerates
an old generation's missing key. Same-root independent store tests prove source behavior,
not packaged native UI/reuse. See [format/ownership](../docs/DATA_MODEL.md) and
[ADR 0011](../docs/adr/0011-ai-settings-secrets-and-reference-storage.md).
If Settings cannot reload after a confirmed save, its visible status still reports
cleanup pending where applicable, and mutations wait for read-only reload. The independent
review corrected this response after the original native sequence; source/DOM evidence
covers the correction. The separately approved [Mac section-15 packaged proof](../docs/tasks/active/phase-2-initial-llm-assistance.md#mac-section-15-corrected-packaged-proof--2026-10-09)
now confirms the exact saved/cleanup-pending/reload-required UI, disabled controls and
read-only Retry restoring selected configured C with unchanged persistent bytes on
source `37e3ab3`. This narrow result does not accept Studio 2A.1/Phase 2 or release.
The reviewed source now includes a deterministic public-fixture selector:
`LOOMLIGHT_STUDIO_DEV_RELOAD_FAILURE=post-save-snapshot-once`, with isolated
`studio-settings` mode and development phase `1`. It requires the exact original
A/B/C fixture at a fresh temporary development root, refuses other mutation/discovery
operations while armed, and consumes one Settings snapshot refusal only after confirmed
C file publication with deferred native cleanup. No persistent fault file or timed writer
is used. Read-only Retry restores configured C without another save/request. The pure
`reload_failure_environment` helper in `scripts/macos-development-credentials.py`
checks fresh/private fixture state and returns the explicit environment without launching
anything. The original four-phase runner refuses inherited fault selectors.
[Mac plan section 15](../docs/tasks/active/2026-10-08-macos-development-credential-storage.md#15-independent-review-correction-and-proposed-narrow-native-follow-up)
owns the separately approved and completed package schedule. Its single-use allowance
is exhausted; this selector grants no further native operations.

All legacy/native Mac API-key reads, deletes, imports and cleanup are deferred, with
owned references preserved. Historical identity/helper fixtures below are recovery
evidence, not an executable allowance for the new mode. That Mac file-storage change
preserves Windows routing; the later Windows adapter is described below.
No Keychain migration, session escape, signing-policy/certificate/trust/ACL change or
plaintext API-key fallback. The macOS package identity gates above remain mandatory;
file storage does not eliminate signing-private-key access.

Application replacement/reinstallation retains credentials only when user data remains.
App cleaners/data deletion, disk loss and clean OS installation can remove it. A coherent
backup needs profiles, generation metadata, master keys and encrypted records, with
correct restore permissions; possession of those files allows decryption. No backup,
export or sync UI is included. Never copy production data into synthetic tests.

The concrete public [synthetic fixture](tests/fixtures/macos-development-credentials.json)
has three profiles, two deferred native namespaces (including absent-profile cleanup),
public native-entry inputs and four request-phase counts. Its validity/refusal assertions
run in the focused core suite. Manual packaged qualification uses
`scripts/macos-development-credentials.py`: ordered metadata evidence, fixed loopback
request/auth counts, private fixture permissions and only the approved synthetic fault
mutations. It never creates master keys/ciphertext or reads API-key bytes. Native entry
uses the actual Settings/AppKit UI. Source-only control checks use
`python3 -m unittest discover -s scripts -p test_macos_development_credentials.py -v`.
Run signing/native process controls on the host with the required execution capability;
an empty sandbox identity listing is not evidence that the certificate is absent, and
never permits fallback or certificate/trust changes. The
[bounded native operation schedule](../docs/tasks/active/2026-10-08-macos-development-credential-storage.md#13-prepared-native-fixture-and-proposed-allowance)
requires explicit allowance before packaging/signing or runtime execution. The
[owning result](../docs/tasks/active/phase-2-initial-llm-assistance.md#development-file-native-qualification-result--2026-10-08)
records the passed bounded sequence and retained failures; it grants no further operation.
After a native quit, verify the external receipt/PID and do not call a UI observer or
`getApp` on the exited app: reacquisition can implicitly launch it without fixture state.

## Windows native Studio credentials

Windows remembered Studio keys use an app-owned modal password field and generic
Windows Credential Manager entries for the current Windows login. The renderer and
IPC receive only references/status. Failed saves retain native input for Retry save
or Cancel; confirmed saves remain successful when old owned cleanup is pending.
Windows accepts 1–2560 printable non-space ASCII characters; the shared schema's
4096-character bound is unchanged. Larger input stays in the native dialog for correction.

Exact service/profile/credential targets and ownership markers bind entries to their
origin and revision. Replacement publishes the new reference before retiring the old
owned entry; removal disables the profile before deletion. Existing targets and
mismatched markers are never overwritten/deleted. Foreign Mac development-file
references remain preserved and require explicit Windows re-entry; no Mac key/file
operation is attempted. See [ADR 0011](../docs/adr/0011-ai-settings-secrets-and-reference-storage.md)
and [the data model](../docs/DATA_MODEL.md).

The fixed public fixture is `tests/fixtures/windows-studio-credentials.json`;
`scripts/windows-studio-credentials.py` records exclusive attempts, package/source
identity, isolated loopback request counts, native snapshots and external process exit.
Input uses Windows Computer Use against the actual packaged app. The
[Windows ledger](../docs/tasks/active/phase-2-initial-llm-assistance.md#windows-remembered-credential-continuation--2026-10-08)
owns exact allowance, failed attempts and remaining native proof. Commands do not grant
new allowance. Source tests: `python -m unittest discover -s scripts -p test_windows_studio_credentials.py -v`.
No installer execution, real endpoint, production key or credential enumeration is selected.
Reuse requires complete saved snapshots, exact terminal marker/envelope/request gates
and the full input manifest. Old Windows manifests lack eight current inputs and are
rejected by the corrected reuse gate; retain their exact-binary evidence without
claiming complete candidate equivalence. See the independent review in the ledger.

The [Studio acceptance-gap review](../docs/tasks/active/phase-2-initial-llm-assistance.md#studio-2a1-acceptance-gap-review-and-windows-proposal--2026-10-09)
records the remaining Windows current-slice blockers: complete candidate inputs, full
phase-1 entry/alpha-alpha flow, and the confirmed-save/reload-required branch. Mac
section-15 proof is complete. A proposed one-build/two-launch/four-loopback-GET schedule
combines Windows reload proof with beta replacement after separately reviewed Windows
fixture/controller preparation. The [finalized Windows preparation](../docs/tasks/active/phase-2-initial-llm-assistance.md#windows-acceptance-schedule-preparation--2026-10-09)
adds `--acceptance` to the existing runner for exclusive build 3/run 6–7 receipts under
`.toolchains/windows-studio-acceptance` and a new isolated root. The opt-in Windows
`LOOMLIGHT_STUDIO_WINDOWS_RELOAD_FAILURE=beta-post-save-snapshot-once` selector is armed
only on phase 2's exact beta replacement. Full run-6 PASS is required; the combined
phase holds the reload UI for bounded native capture, then makes one read-only Retry
and continues every original assertion. Complete installed/generated inputs, whole
stores and action deadlines are rejecting gates. These switches grant no allowance;
publication and native execution require separate approval. No old manifest is backfilled; the
existing corrected manifest gate still rejects those legacy packages. Cross-build
Windows continuity, generic/session-only/no-auth and full 2A.1 remain unqualified.

The [Windows native preflight](../docs/tasks/active/phase-2-initial-llm-assistance.md#windows-native-inputcapture-preflight--2026-10-09)
found the supported Computer Use `node_repl`/`@oai/sky` route. Approval retry proved
keyboard/button input on disposable blank native-editor tabs; an owned JPEG was
exported offline to PNG. The capture/acknowledgement hold and masked entry remain
unproved, and the combined native rehearsal exceeded its 120-second limit. Read the
[prepared host sequence](../docs/TESTING.md#windows-native-preflight-and-prepared-host-sequence)
before remediation. This is a failed preflight, not native qualification; no build,
Loomlight launch, acceptance root or credential operation was consumed.
