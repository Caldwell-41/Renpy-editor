# Draft review notes

Kris subsequently approved A2 on 2026-11-02; [HANDOFF.md](HANDOFF.md) records that
decision and the failed required promotion gate. The draft checks below retain
their historical scope, not product acceptance. Historical approved source commits, records and
captures are unchanged. The coordinator's type-only lab correction below is the
sole shared-file change.

## Current checks

The current A2 results and control changes are in [REFINEMENT.md](REFINEMENT.md).
It passes the 128-case matrix, final focused interactions, full lab TypeScript and
approval checks. The earlier draft-v2 evidence below retains its original scope.

- The screen-local TypeScript check passes with the inherited strict lab options.
- The approval-history/source/capture validator passes. All three candidates remain drafts.
- The full Design Lab TypeScript check also passes after the coordinator's type-only correction described below.
- Offline Chromium 153.0.8010.12 passes 84 layout cases: three variants, seven states,
  both themes, and 1100 by 720 / 560 by 640 CSS viewports.
- Every focused interaction passes for A, B and C, including component extraction,
  name collision refusal, component/parent picker, insertion, explicit shared-use
  review, shared Apply, independent copy, sample Source, history, reopen, retained
  conflict drafts, more typing while stale, editor Escape, unavailable component,
  Help creation, image sizing, local Close editing, Show/Hide Beats, exact Beat Source,
  empty typed-image creation refusal, retained starter/name, explicit Blank choice,
  continued dialogue, outside click, Close/Hide/game Escape and focus, and renamed
  panel refusal. Compact review remains usable without horizontal overflow.
- The final inline HTML preview at 728 pixels wide reports no browser console errors.
- `git diff --check` passes.

The original complete lab TypeScript check failed in the approved-reference file
`app/design-lab/screens/shared-look/editor.ts:251` with TS7053, a `string | number`
index into the appearance-field labels. The coordinator supplied type-only commit
`282772a883e693dd9716667933cc5f23c03b92df`, cherry-picked here as
`f4db237` at the coordinator's explicit instruction. It narrows the key type to
`keyof typeof labels`; runtime code, layout and copy are unchanged. Historical
approved commits, records and captures remain intact. Both full-lab and focused
TypeScript checks now pass. The complete `design:check` browser gate is not claimed
as passing or run for this draft update; promotion must run it. No package,
native, SDK, installation, CI dispatch or production implementation was performed.

## Corrections during this draft

Local ignored evidence is under `.toolchains/components-and-help-panel/`.
The first sandboxed browser launch failed at macOS process registration. A disposable
browser outside that sandbox subsequently ran the checks; no protected profile or
native state was changed.

`review-01.log` retains the first 72-case matrix and a check failure that tried to
click Component Source inside a closed disclosure. `interactions-02.log` retains
the same locator mistake for Reopen sample. The checks now open those disclosures.
`interactions-03.log` caught a real mock defect: Connect refused playback after a
target rename but did not display the error. Connect now shows that refusal.
Disclosure open state also survives typing and draft rerenders.

`review-04.log` and `review-05.log` pass all 72 cases and focused interactions.
The latter checks a shorter compact shell with a visible Apply footer and a shorter
worksheet preview. `interactions-06.log` passes after playback began using accepted
sample content. `review-07.log` is the final 72-case and interaction pass after a
canvas-fit correction. `review-08.log` checks the subsequent empty typed-image state
and existing-project UI-image selection. Its 84-case matrix and all focused
interactions pass. `report.json` retains that current result.
Earlier failures remain in their named logs; they are not passes.

[Original draft captures](draft-captures.json) identify 23 retained PNGs by hash and viewport.
They include all three dark wide/compact baselines, affected-screen reviews,
retained conflict drafts, playback with dialogue continuing, plus A's light
baselines, New screen, Story and missing component. Their source identity belongs
to the committed draft candidate. Approval will require Kris's explicit revision
selection and the source/capture steps in Design Lab INTEGRATION.
The refreshed [draft-v2 captures](draft-v2-captures.json) retain the current 35 PNGs,
including the blocked Help starter in all three variants, both themes and both sizes.
The older draft-v1 files remain unchanged. Both versions are unapproved.

## Remaining simulations and deliberate limits

All source generation, writes, revisions, history and reopen use a fictional model.
There is no real source parser, ownership migration or durable storage. Source
revision admission is deliberately coarse in this mock. References/effects identify
the required concerns without defining new production request fields.

The original component sample supports one use per eligible frame and one shared definition
plus independent copies. Insertion has an explicit parent control with one eligible
parent in each fictional screen. The actual implementation must use its supported
parent choices and keep opaque neighbors. The mock leaves existing surrounding
screen content in place during insertion. Creating an independent copy requires
applying or cancelling an existing draft first, with a visible refusal and no loss.
A2 instead retains valid unsaved edits while it copies accepted source, verifies
the refreshed target and fresh child IDs, then moves the draft. Failed verification
keeps Apply disabled, acknowledges the saved copy and offers Reload copy. Cancel
keeps the copy; Copy and the later Apply have separate Undo entries.

The ordinary-node dialog exercises selected existing fields, not the entire
production editor. Broader existing layout, Style, image import, add/remove,
reordering and canvas interactions retain their earlier owners and approved designs.
The screen picker separates owned panels from components. No blocking-screen or
Call/Finish workflow is added.

Playback uses browser controls to demonstrate the desired behavior. Its focus trap
is an HTML dialog, not Ren'Py. Source-backed transaction/history/reopen and actual
Ren'Py rendering, Escape and keyboard focus still require the ticket workers' and
coordinator's evidence. This design-only chat supplies none of that qualification.
