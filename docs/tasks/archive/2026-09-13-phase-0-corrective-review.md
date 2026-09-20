# Task: Phase 0 corrective review

**Status:** Complete 2026-09-13<br>
**Baseline:** remote `main` at `831c9e3e753c2cacbdb8e79db8db2db097382729`

## Baseline record

- Review workspace branch: `phase-0-corrective-review`, initially at a clean local
  snapshot whose tree exactly matched remote `main`/`831c9e3`.
- Relevant remote HEAD before editing: private `origin/main` at `831c9e3`; uncommitted
  changes before editing: none.
- `phase0-source-review-reproducer.zip` was not present in the supplied workspace.
  Every reported case was independently reproduced against current source.

## Completed corrections

- Semantic dialogue recognition targets narrator, character, and literal-speaker text;
  replacements encode delimiters/backslashes; Python, ambiguous, and multiline forms
  are preserved and refused.
- Both retained adapters keep approved canonical roots in the privileged core and
  accept only opaque project IDs plus normalized relative paths from renderers.
- Tauri commands are declared in the build manifest, named in a custom permission, and
  granted only to `main`; packaged tests exercise allowed and denied webviews.
- Saves serialize internal transactions, recheck content/path/file identity after temp
  sync, replace atomically, and retain recovery data for known races/failures. The
  remaining non-cooperating-writer window and Windows durability limit keep production
  Gate E writing blocked.
- Valid Ogg Vorbis and VP9 WebM fixtures decode and advance in all packaged target
  engines. Graph results remain synthetic; production layout/authoring is still gated.
- Tauri remains selected. Payload is distinguished from installer/first-install size,
  `downloadBootstrapper` is the Windows WebView2 strategy, and incomplete macOS memory
  attribution is excluded from the decision.

## Validation

- Local: 26 source/mapping tests, 24 SDK tests, 27 desktop tests, UI build, benchmark,
  repository validator, and `git diff --check` passed.
- [SDK 34742452653](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34742452653):
  Linux, Windows x64, and macOS ARM64 passed at `2b78d067`.
- [Desktop 34743055306](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055306):
  Windows x64 and macOS ARM64 complete jobs passed at `08de1e4e`.
- [Quality 34743055274](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055274):
  passed at `08de1e4e`.
- Runs 34742452515, 34742542992, and 34742865491 retain the compile/probe failures that
  were corrected; skipped target steps in those runs are not reported as passes.

## Stopping point

Phase 0 corrective checkpoint complete; ready for Phase 1 planning. Phase 1 remains
unimplemented and requires explicit approval.
