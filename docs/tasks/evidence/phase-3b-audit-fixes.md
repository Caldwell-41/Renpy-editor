# Phase 3B audit-fix evidence

The [maintenance task](../active/phase-3b-audit-fixes.md) owns scope and acceptance.
Observation begins 2026-11-01 at fetched base
`c5f4ab18bc0fd9c1e73a5a97b5ce10d9534cd57c`. The local integration branch is
`codex/phase3b-audit-fixes`; the fast-forward check found no divergence.

## Parallel assignments

Each worker uses a separate T3-managed worktree. The coordinator integrates commits
sequentially and retains one writer for each file. Worker branches and exact
candidates will be recorded when the assignments return.

| Worker | Findings | Owned production files and tests |
| --- | --- | --- |
| Core Screens | #4, #5, #6, #9, #12, #18 | `app/src-core/src/screens.rs`, `screens/ownership.rs`, `screens/composition.rs`, `screens/layout.rs`, `screens/canvas.rs`, `screens/tests.rs` and new dedicated Screens test modules. |
| Workspace and numeric | #2, #11, #17 | `app/src/screen-ui.ts`, `screen-layout.ts`, `app/tests/screen-ui.dom.test.ts`, new numeric-layout DOM tests, `app/tests/nested-layout.browser.mjs` and `screen-layout.browser.mjs`. |
| Helper lifecycle | #8 | `app/src-core/src/lifecycle.rs`, `screens/canvas_session.rs`, `renpy/runtime/canvas.rs` and dedicated lifecycle tests. |
| Text validation | #14 | `app/src/screen-text.ts`, `screen-composition.ts`, a focused shared text-validation helper if needed, `app/tests/screen-composition.dom.test.ts`, text DOM tests and `project-font.browser.mjs`. |
| Image previews | #16 | `app/src/screen-image-media.ts`, `screen-images.ts`, `app/tests/screen-images.dom.test.ts`. |
| Coordinator | Integration and review | Contracts, status, task evidence, CI selection/workflows and in-scope integration corrections after worker ownership ends. |

Workers may not edit another owner's files. A required shared-interface change
must return to the coordinator before it is made. Existing IPC payloads should
remain stable unless the coordinator records a necessary migration.

## Preparation and test boundaries

The selected root-cause and TDD skills, including the TDD test and mocking
references, were read. Kris confirmed Screens DOM, public core/IPC plus real
controller/core journeys, and public canvas lifecycle with a controlled helper
boundary. Workers must retain the actual failure and passing result per vertical
slice, rather than writing a batch of tests against imagined behavior.

The environment entry script resolves Node 24.19.0, npm 11.9.0 and Rust/rustc 1.90.0.
System Python is 3.9.6, below the harness's 3.11 minimum; use a verified supported
interpreter for Python-driven checks or preserve the named limitation. Do not
change pins or install system prerequisites silently.

The linked Windows host SUNDOWN is reachable. No remote command, build, test,
SDK launch, package or native operation has run for this outcome yet.

Creating an additional GitHub maintenance issue was rejected by automatic approval
review because it was outside the explicit branch/fix/draft-PR/CI publication
authorization. No issue was published. Execution continues under the local task;
the authorized draft PR remains the publication destination.

## Verification and costly operations

No new tests, CI qualification, helper, SDK, package or native session has started
at this preparation checkpoint. Costly operations will be selected and bounded
before execution. Routine worker checks and local builds need no numerical limit.
Historical candidate evidence retains its scope and does not become a new pass.
