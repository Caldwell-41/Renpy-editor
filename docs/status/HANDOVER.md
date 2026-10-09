# Current outcome handover

## Manual reference library: shared-history blocker, assessment complete

Continue Caldwell-41/Renpy-editor, `codex/provider-qualification`, with one serial
Local Mac ARM64 writer. Entry refs matched published `54f562d5d3721595b2f8d7c5ed0454e9cd297a5f`.
Preserve local commits and unrelated planning worktree; never reset to the entry SHA.
The requested GPT-6.1 Sol High independent read-only assessment is complete. It
confirms the history diagnosis, predicts symmetric Redo failure and identifies
preventable qualification mistakes. It made no edits/builds/launches or other-host
execution. Implementation is stopped under exhausted allowance. Earlier requested
UI research is finished.

Read the [owning selection/attempt ledger](../tasks/active/phase-2-initial-llm-assistance.md#manual-reference-library-selection--2026-10-09),
[references contract](../REFERENCE_LIBRARY.md), Phase 2 sections 9/10/11/19/20,
ADR 0011 and applicable UI/WORKFLOW/TESTING guidance. Approved UI A uses direct editing,
ordinary Save/Discard, top creation control and shared themes. No manual review toolbar.
Storage revisions/statuses remain internal for future generated review.

Implemented locally: schema/bounds/fixtures, one references service, typed IPC,
Character cards/Lorebook and shell Save/Command-S, shared transaction/history and
external-edit/recovery. Focused renderer/core checks pass for previously covered
single-step behavior, but new multi-step Undo failure is a real product blocker.
Native passing assertions prove authoring/replacement/single Undo/Redo/refusal,
external reload/Save, malformed/newer retention, lore, scope/knowledge/lore links,
stale/missing citations and relationship target nested extension retention. Physical
Name/Tab focus and Command-S passed. Light wide layout observed; native dark/narrow
are unperformed. Earlier separate-process byte-exact reopen is valid for unchanged
storage code; it cannot accept the broken multi-step history.

**Budget exhausted:** Mac **5/5 package-build attempts, 7/7 starts**. Windows **0/2
builds, 0/3 starts**. No further package/native attempt or publication authorized.
Prior request/credential evidence and independent budgets remain unchanged.
All prior failures are retained in the owning ledger: first external-reload/focus
product defects (fixed), unintended CUA restart, single-instance rejection, visual
pause timeout, wrong-working-directory/Cargo launcher failure, then key-order-only
probe assertion (corrected). The latest failure is consecutive Undo, not another
semantic-key-order issue. Do not inspect a stopped Mac app via CUA: it may relaunch.
Inspect process ownership by CLI before any future authorized start.

Latest package (attempt 5) preserves identity and passed strict signature/installer
verification. Executable SHA256
`fe69ccde3a31e32b3cb5194862a02b33c0978d9f23577fd7ec07d984bfc1ccfd`;
installer `ec6c7f67bb6ca320f19c07e640f81228309c8ab5fab06d466f449b7e16f5ac51`.
Native start 7 PID 77043 passed 23 assertions, then its first representative Undo
committed counter 5 → 4 and the second refused. Final metadata retained current/
approved pointers and superseded r3/approved r4; hash
`e2f9c7f87274df1d354485e98862f26ca1039cef8b76d27af804bffc54452c91`.
The exact native returned error code was not captured. A minimal real production-
dispatch reproducer (two Saves/two Undos, no external edit) returns `HISTORY_BOUNDARY`.
Tracked tests were restored after the diagnostic; ignored `manual-reference-mac-07`
retains its fragment, failed receipt and structural readback without prose. No owned
process, synthetic root or preflight file remains.

The likely defect is in `HistoryStack::accepted_undo_with_revisions`: it refreshes
only the undone entry's before identity after transaction replacement, leaving the
previous entry touching that path with its old after identity. The next Undo sees a
false external boundary. The independent assessment confirms this diagnosis; symmetric
Redo has a code-derived flaw and needs a real-dispatch regression. A correction must preserve real external-edit boundaries, and handle interleaved
paths/multi-file mutations plus branching after Undo. Do not weaken identity checks
or bypass shared history. This affects the existing owner, not a second reference
Undo stack. No fix has been made for this newly confirmed defect at budget stop.

The independent assessment has been reported to the user. Before any more native
work, improve required-mutation failure capture and expected-result gates in the probe;
not-busy alone includes refusals. If work is explicitly resumed with a renewed allowance, implement/review the smallest shared-history
correction with a failing-first real-dispatch consecutive Save/Undo/Redo regression
and external-boundary tests, then package/native authoring/layout/reopen qualification.
Do not spend native allowance on undiagnosed dispatch or unverified harness assertions.
Finish canonical acceptance/status and a local scoped commit, then ask before pushing
an actually reviewed result. Windows remains required; no full 2B.1/Phase 2 acceptance
or next distinct deliverable until required acceptance.

## Conditional Windows pull-and-continue prompt

Use only after the shared-history blocker is fixed, Mac work is accepted, and publication is approved and completed; do not run another
host now or treat local commits as remotely available:

> Continue the same manual reference-library outcome in Caldwell-41/Renpy-editor,
> branch codex/provider-qualification, from the newly approved published Mac commit.
> Inspect refs/branch/worktrees/local changes, preserve unrelated work and fast-forward
> safely; never reset to the older 54f562d checkpoint. Read CURRENT/HANDOVER, owning
> manual-library acceptance, REFERENCE_LIBRARY, Phase 2 sections 9/10/11/19/20,
> ADR 0011 and applicable WORKFLOW/TESTING/UI guidance. Use one Windows x64 serial
> writer, no subagents or direct other-host execution. The approved UI is A with
> direct editing and ordinary Save/Discard; keep internal statuses without a manual
> review toolbar. Windows allowance for this outcome is 0/2 builds and 0/3 app starts;
> count every start, including implicit UI-tool launches. Reuse unchanged request and
> credential evidence. Verify actual production UI/dispatch/metadata card and lore
> authoring, replacement, exact Undo/Redo/reopen IDs/statuses, malformed/newer and
> unknown data, bounds/refusals, external edits/recovery, missing/stale links, project
> switching, keyboard/focus, narrow layouts and both themes. Establish production
> save/readback early; browser mocks alone cannot qualify native behavior. Clean owned
> fixtures/processes; finish focused review and necessary in-scope fixes, update
> canonical contracts/acceptance/CURRENT/HANDOVER and commit locally. Ask before
> publishing. No generation, HTTP/provider/credential, prompt/context/proposal,
> runnable source, import/export, injection/runtime inference, installation/security,
> CI, merge/release or next-feature work. Stop at exhausted allowance, unavailable
> capability or material decision with exact missing proof. Both-target acceptance
> remains required; do not claim full 2B.1 or Phase 2 completion. Return a distinct
> next-deliverable prompt only after the selected outcome is actually accepted.
