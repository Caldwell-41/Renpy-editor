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
- The Crossroads at Sundown source corpus, byte/hash manifest, BOM/CRLF cases, and 12
  lossless-source tests exist. Official SDK validation remains pending.
- No desktop stack is accepted. Tauri and Electron remain the candidates to test.
- No production application, downloaded SDK, or package manifest exists.
- There are no blocking product questions. Remaining uncertainties are empirical
  and are captured in the active spike brief.

## Next action

Execute the official Ren'Py 8.5.3 SDK adapter/fixture-validation portion of
[the Phase 0 spike brief](../tasks/active/phase-0-evidence-spikes.md), then build the
smallest equivalent Electron and Tauri filesystem/subprocess prototypes.
