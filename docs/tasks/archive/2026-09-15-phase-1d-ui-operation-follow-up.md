# Task: Phase 1D UI operation/Flush follow-up

**Status:** Completed — implementation, local gate and supported-target gate passed; PR #8 integration is tracked separately.<br>
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
| Windows x64/macOS ARM64 | Passed | Run `34992890658`: macOS ARM64 job `104461734419`; Windows x64 job `104461734679`; exact head `4f6fef7`, tree `06b5609` |
| Integration | Pending | Draft PR #8 contains the bounded correction; do not replay PR #7 |

## Completion rule

This implementation brief closes only after the final application candidate passes
local validation, repository quality and the full existing Windows x64/macOS ARM64
production workflow. PR integration and post-merge state remain distinct status items.
Phase 1E still requires corrective integration to close and separate explicit approval.

## Local evidence

The final pre-publication worktree passed `python3 scripts/validate.py`,
`git diff --check`, both prescribed Python discovery suites, `npm ci --ignore-scripts`,
`npm run check`, `npm run build`, `node --check src-tauri/src/smoke_probe.js`,
`cargo fmt --check --all`, `cargo test -p loomlight-core --release --locked`, and
strict all-target core Clippy. Four Rust subprocess-worker entry points remained
intentionally ignored and were exercised by their parent crash tests. Desktop
packaging is reserved for the supported Windows/macOS workflow.

## Supported-target evidence

Repository-quality run `34992162418` passed at exact remote candidate
`4f6fef7a543ef817fc6e9a6d8f44744724686730`, tree
`06b560987278148d741716d7f550034454368b5c`. Production run `34992890658`
then passed:

- macOS ARM64 job `104461734419`;
- Windows x64 job `104461734679`.

Both jobs passed frontend/DOM validation, 115 core tests with four intentional
subprocess-worker entry-point ignores, the official SDK lifecycle/authoring/discovery
gate, `phase-1c-network-handoff-gate: passed`, desktop Rust, packaging, packaged
WebView/single-instance/supporting-authoring smoke, artifact privacy scanning and
dependency/licence inventory. The official archive came from the keyed cache on both
targets, so the conditional cache-miss download step was correctly skipped; the
official-archive test gates themselves ran and passed.

Retained redacted evidence artifacts:

| Target | Evidence artifact | Digest | Package artifact | Digest |
| --- | --- | --- | --- | --- |
| macOS ARM64 | `10406636489` | `sha256:5abca06971650f30c22ce00dca010e712ccc69e1c17bdafa9c4cd3f3a066bcf9` | `10406162573` | `sha256:663a35806c8f9502560199ba92d046de920d8fc9e427a6dd9ef7aef22345ca37` |
| Windows x64 | `10407037260` | `sha256:b6dc1f590312e0a9e68e0b946f7b8de65a90d131b5e7c94362fc25897b261493` | `10406757979` | `sha256:d09299965767bf54cc0974e2d35f3c6046aaa47401dd3593d9a8780c35475afd` |

No target failure or test skip occurred. Only the cache-miss download step was skipped
because the verified official archive was restored from cache. PR #8 remains draft and
unmerged at this record; integration must not be represented as complete until verified.
