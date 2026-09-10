# Current status

**Updated:** 2026-09-10<br>
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
- No desktop stack is accepted. Tauri and Electron remain the candidates to test.
- No production application or package manifest exists.
- There are no blocking product questions. Remaining uncertainties are empirical
  and are captured in the active spike brief.

## Next action

Build the smallest equivalent Electron and Tauri filesystem/subprocess prototypes
from [the Phase 0 spike brief](../tasks/active/phase-0-evidence-spikes.md), with the
same typed operations and denial tests. Run SDK platform evidence on Windows and macOS
when those runners are available.
