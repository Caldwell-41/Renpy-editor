# Task: Phase 1D UI operation/Flush follow-up

**Status:** Implementation and complete local gate passed; supported-target gate and integration pending.<br>
**Baseline:** `main` at `98855eb23a284f500cd3285247738e4c5f250bcd`<br>
**Branch:** `corrective/phase-1d-ui-operation-race`<br>
**Scope:** One post-integration R5 correction only; Phase 1E remains unstarted.

## Finding and boundary

A post-merge review reproduced a same-view ordering defect in the supporting-authoring
renderer. The single global operation generation allowed `Ctrl/Cmd+S`, close, or an
unrelated operation to invalidate an in-flight mutation completion without changing
the project view or session. A later success could leave submitted controls disabled
and labelled unsubmitted; a later failure could lose its error, focus restoration and
retry state. The reproduced successful sequence ended with:

```json
{"status":"Unsubmitted input — accepted changes saved","submitDisabled":true,"technicalValue":"score","markedUnsubmitted":"true"}
```

The core transaction either commits or refuses independently, so no source-corruption
path was found. The defect nevertheless reopens R5's truthful-persistence and usable
failure requirements. N1 and R1–R4/R6 remain unchanged.

Do not implement Scene/Beat authoring, multi-Scene metadata, Scene file lifecycle,
history integration, recovery UI, Preview, Source or later work here.

## Correction

- Scope completion generations to the operation that owns them while retaining the
  view and session checks that reject genuinely obsolete callbacks.
- Serialize supporting-authoring operations per active project session and prevent
  authoring from starting while that session's explicit Flush is active.
- If explicit Flush is requested while authoring is active, do not start another
  bridge operation or claim persistence; report the in-progress operation and let its
  own success/failure path complete.
- If navigation makes that completion's view obsolete, never navigate back; after it
  settles, refresh persistence for the still-current view and session.
- Preserve input and restore controls/focus on the delayed failure path.
- Cover delayed success and failure in the real DOM test. Delay the packaged
  supporting-authoring bridge and prove an overlapping Flush is suppressed before a
  later explicit Flush succeeds.

## Acceptance ledger

| Gate | State | Evidence |
| --- | --- | --- |
| Baseline reproduction | Passed | One-off Happy DOM sequence reproduced disabled control and stale `unsubmitted` state on merged `main` |
| Implementation | Passed locally | Operation-scoped generations plus one active authoring operation per session in `app/src/main.ts` |
| Behavioral DOM | Passed locally | Delayed status, mutation success/failure and Flush in both directions; success reloads Saved, failure retains value/error/focus/retry, neither side starts while the other is active, and navigation settles to current-view Saved state |
| Packaged regression | Implemented | Smoke delays Variable update, requires overlapping Flush suppression, then performs an explicit Flush |
| Prescribed local gate | Passed | Validator 194 files; diff and smoke syntax checks passed; Python 26/26 and 24/24; frontend 8/8 plus build; core 115 passed/4 ignored; fmt and strict Clippy passed |
| Windows x64/macOS ARM64 | Pending | Run the existing production workflow once for the final application candidate |
| Integration | Pending | New bounded PR only after target closure; do not replay PR #7 |

## Completion rule

Archive this brief only after the final application candidate passes local validation,
repository quality and the full existing Windows x64/macOS ARM64 production workflow,
then the guarded corrective PR is merged and post-merge state is verified. Phase 1E
still requires a separate explicit approval after this corrective gate closes.

## Local evidence

The final pre-publication worktree passed `python3 scripts/validate.py`,
`git diff --check`, both prescribed Python discovery suites, `npm ci --ignore-scripts`,
`npm run check`, `npm run build`, `node --check src-tauri/src/smoke_probe.js`,
`cargo fmt --check --all`, `cargo test -p loomlight-core --release --locked`, and
strict all-target core Clippy. Four Rust subprocess-worker entry points remained
intentionally ignored and were exercised by their parent crash tests. Desktop
packaging is reserved for the supported Windows/macOS workflow.
