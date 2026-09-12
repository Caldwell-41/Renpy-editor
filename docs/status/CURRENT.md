# Current status

**Updated:** 2026-09-12<br>
**Phase:** 0 — Foundation and proof<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- The repository foundation, canonical document set, security baseline, CI
  validation, fixture proposal, UI checkpoint, and bounded spike plans exist.
- Ren'Py 8.5.3 remains the verified stable compatibility baseline as of this date.
- ADR 0001 accepts exact source bytes plus a conservative partial CST and verified
  range patches as the source architecture. The Phase 0 Python tokenizer is disposable.
- ADR 0002 accepts an exact-version, allowlisted SDK adapter and checksum-first staged
  installation boundary; only Linux integration evidence exists so far.
- The Crossroads at Sundown corpus has byte/hash baselines, BOM/CRLF cases, 12
  lossless-source tests, and a Linux Ren'Py 8.5.3 compile/lint/test/run/warp/PC-build
  pass. The SDK and generated artifacts remain outside Git.
- The SDK boundary has 19 dependency-free security/adapter tests. Windows and macOS
  SDK, filesystem, package install/launch, signing, and quarantine behavior are open.
- No desktop stack is accepted. A shared-contract Electron/Tauri spike implements
  the first file/process/security boundary. Its Windows x64/macOS ARM64 matrix passes
  shared process lifecycle tests, packaging, and most packaged denial probes. Run
  34691607349 proved Electron IPC/network/popup/navigation denial and Tauri core
  filesystem/process denial on both targets, but also exposed two unresolved defects:
  Electron expected-denial logs contained packaged runner paths, and the Tauri Windows
  WebView reported `navigationDenied: false` without failing its workflow step.
- Phase 0 evidence CI remains path-scoped and now cancels superseded push runs per
  workflow and branch. Desktop jobs cache platform/toolchain/dependency-specific
  Cargo inputs and dependency outputs; a verified warm run reduced Windows from
  15:23 to 5:42. The pinned SDK archive is cached by version and digest but is still
  checksum-verified before every extraction; its warm run remained about 1:10 because
  the probe, not the download, dominates.
- Confirmed targets are Windows x86-64 and macOS ARM64. Intel macOS is out of scope.
- No production application or package manifest exists.
- There are no blocking product questions. Remaining uncertainties are empirical
  and are captured in the active spike brief.

## Next action

Complete and verify the corrective packaged security/filesystem checkpoint: exercise
Electron filesystem behavior through its packaged renderer bridge, keep denial errors
out of privileged-process stack logs, enforce Tauri navigation policy explicitly, and
make a false packaged assertion fail the process on both targets. Record the resulting
path/watch measurements before proceeding to shared UI/WebView behavior.

The exact continuation state and implementation checklist are recorded in the
[Phase 0 continuation handover](HANDOVER.md).
