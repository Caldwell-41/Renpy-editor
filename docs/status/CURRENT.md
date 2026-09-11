# Current status

**Updated:** 2026-09-11<br>
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
  the first file/process/security boundary. Its initial Windows x64/macOS ARM64 matrix
  passes shared tests, Electron package/launch smoke, Tauri Rust tests, and Tauri
  packaging; process parity and the broader behavioral measurements remain open.
- Confirmed targets are Windows x86-64 and macOS ARM64. Intel macOS is out of scope.
- No production application or package manifest exists.
- There are no blocking product questions. Remaining uncertainties are empirical
  and are captured in the active spike brief.

## Next action

Make the Tauri mock-SDK boundary equivalent to Electron for bounded streaming,
cancellation, timeout, and redacted events. Add packaged denial tests on both target
runners, then proceed to media/accessibility, credentials, graph-scale measurements,
and official SDK platform evidence.
