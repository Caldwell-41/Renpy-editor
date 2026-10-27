# Phase 3B architecture refactors

## Selected outcome

On 2026-10-27 Kris selected both architecture-report recommendations, each in a
separate subagent worktree, with an unchanged IPC contract. The coordinator owns
integration, a third subagent's two-axis code review, P1/P2 corrections, PR/CI,
merge after passing checks, safe cleanup and the requested completion notification.
[Maintenance issue #64](https://github.com/Caldwell-41/Renpy-editor/issues/64)
owns live scope and acceptance. The user approved the builds, tests, CI and SDK
runs needed for this outcome without a numerical cap. Historical closed selections
retain their original results and limits.

Base is `0d469a6e2c52132d9365f9d2b3a56120c5c51a9c`. The integration branch is
`codex/phase3b-architecture`, targeting `codex/phase3b-screen-designer`.
The issue records both implementation branches, worktrees and file ownership.
Mac ARM64 is the development host. The unrelated untracked Phase 1 audit and
protected native recovery remain outside this change.

## Implementation and verification

The Rust assignment is `6a31a9e456720d609dab4cde65ec0b2a8518c79e`.
The existing composition module owns shared Add structural eligibility; the canvas
planner reuses it. Saved-text validity, unfinished draft text, planner limits,
revision/source protection and existing refusal codes retain their distinct rules.
Two dispatcher/lifecycle tests exercise paired saved/draft cases and unfinished
text. The ordinary Screens scope passes 28 named cases with Rust 1.90.0; the
existing ignored SDK integration case was excluded from that local scope. Rust
formatting and whitespace checks pass. No native or SDK result is inferred.

The separate `architecture_refactor` Screens qualification selector reuses the
existing composition checks. It binds this branch and exact candidate, rejects
conflicting selectors before the expensive job, and preserves the old L02 branch,
ordinal and attempt restrictions. Local shell checks pass five selector cases and
ten candidate/task cases. Actionlint passes. The guard checks execute the actual workflow shell blocks.

The TypeScript assignment is `20d33e2f07c96bd82aa498f28c16b5a696d7cfa0`.
`ScreenCanvasFrames` owns request identity/freshness, render and health polling,
PNG installation, stale/error status and geometry readiness. The workspace retains
source/drafts, gestures and selection guides. Five module-interface cases cover
held replies, image readiness/error, helper health, hidden polling and disposal;
existing workspace cases retain mid-gesture, focus and accepted-addition checks.
All 264 frontend tests and the production build pass with Node 24.19.0, npm 11.9.0
and Python 3.12.14. The first full frontend run used Python 3.9 and failed one
existing validator because `tomllib` was unavailable; selecting the documented
Python version resolved it without code or fixture changes. The existing build
chunk-size advisory remains unchanged.

At integrated candidate `e3c75ef3e80be7031c06cff1178bab9103506f49`, the
production renderer/core sequence passes all seven required groups, exact source,
identities/history/reopen and cleanup. Additional pointer reorder, stationary
confirmation, stale-removal retention and selection-preference contention checks
pass at wide and compact widths. The wrapper identifies this as controller-only
Chrome proof; raw probe flags do not establish native WebView execution.

## Independent review

The third subagent applied the code-review skill to
`0d469a6e2c52132d9365f9d2b3a56120c5c51a9c...e3c75ef3e80be7031c06cff1178bab9103506f49`.
Its Standards and Spec reviewers ran separately and read #64 plus applicable
repository contracts. Standards has zero findings and no worst issue. Spec has
zero findings and no worst issue. No P1/P2 correction is required by that review.
The coordinator also inspected both assignment diffs and their integration.
Runtime qualification and CI remain pending; the source review does not supply
those results. Detailed raw checks are retained under ignored `.toolchains/architecture-64/`.
