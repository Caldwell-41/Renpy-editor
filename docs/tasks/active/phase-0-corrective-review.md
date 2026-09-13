# Task: Phase 0 corrective review

**Status:** Implementation complete; fresh target validation pending<br>
**Baseline:** remote `main` at `831c9e3e753c2cacbdb8e79db8db2db097382729`

## Baseline record

- Review workspace branch: `phase-0-corrective-review`, initially at a clean local
  snapshot whose tree exactly matched remote `main`/`831c9e3`.
- Relevant remote HEAD before editing: private `origin/main` at `831c9e3`; the earlier
  review's SHA was therefore still current rather than merely historical.
- Uncommitted changes before editing: none in the review workspace.
- `phase0-source-review-reproducer.zip` was not present in the supplied workspace.
  The reported cases were independently reproduced against current source rather than
  treating the missing archive as repository truth.

## Bounded corrections

- Correct semantic dialogue recognition, safe replacement encoding, and conservative
  refusal; validate a trusted fixture through the official Ren'Py SDK path.
- Move project-root approval into the privileged core and use opaque project IDs.
- Declare Tauri application commands explicitly and prove authorised/unauthorised
  packaged webview behavior.
- Add deterministic save-race/recovery tests and distinguish atomicity, durability,
  and conflict detection without claiming compare-and-swap.
- Decode and advance valid repository-controlled MVP media in packaged targets.
- Correct memory/payload interpretation, retain Tauri conditionally, and preserve the
  production graph-layout and source-transaction gates.

## Validation required before archive

- Repository validator, Python source/mapping suite, SDK adapter suite and benchmark.
- Desktop TypeScript suite/UI build and locked Rust tests.
- Fresh Windows x64 and macOS ARM64 packaged desktop workflow at the tested commit.
- Fresh Ren'Py 8.5.3 compile/lint workflow for the corrective trusted fixture.
- Record exact run IDs, URLs, commit SHA, passed/failed/skipped/not-run checks, then
  archive this task and mark the corrective checkpoint closed or explicitly blocked.

Phase 1 remains out of scope.
