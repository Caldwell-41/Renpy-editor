# Help dialog and Story Call prototypes

Kris requested a separate prototype for [#45](https://github.com/Caldwell-41/Renpy-editor/issues/45), then asked to view it in a local browser and refine all three alternatives with `principle-experience-first`. Kris has now approved Help A4, Inspector extension. Help B4/C4 remain drafts. [The exact approval](approval-decision.json) is "Approved", clarified as "Sorry a4". [HANDOFF.md](HANDOFF.md) owns the approved source, integration map and completed promotion results.

This study extends [Components and Help panel A2](../design-lab-components-and-help-panel/HANDOFF.md), whose source, captures and authority remain unchanged. Help A4/B4/C4 belong to this separate screen. Screens owns appearance; Use in Story hands a selected target to Story and creates no Beat. [Delivery evidence](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md) owns implementation and acceptance. This chat changes only Design Lab and design evidence.

## Open and compare

Open `.toolchains/help-dialog-story/comparison-v4.html` directly in a local browser. It is self-contained and needs no server or external assets. Its buttons switch Help A4/B4/C4; arrow keys also switch when an input is not focused. Review cases and Reset open fresh memory-only samples. The fixed earlier file is `comparison-v2.html` beside it.

The registered Lab route is `/?screen=help-dialog-story&variant=inspector-v4&state=start&theme=dark`. The other variant IDs are `steps-v4` and `story-split-v4`. The existing `npm run design:dev` entry remains available to a human using the Lab. No display server was started here.

To regenerate the file, run `node design-lab/screens/help-dialog-story/export.mjs` from `app/`, then copy the generated comparison to `comparison-v4.html`. Generated HTML remains ignored. [review.json](review.json) records the exact current source and captures; [review-v2.json](review-v2.json) preserves the replaced version-two review.

- Help A4, `inspector-v4`, keeps Choose, the canvas and a selected-element inspector. Selecting Title hides unrelated image and dismissal fields.
- Help B4, `steps-v4`, guides Create, Appearance and Story. Its document form lets the author edit the ordinary nodes together beside the canvas.
- Help C4, `story-split-v4`, starts at a Story insertion point. Its explicit Create dialog shortcut goes to Screens, then returns to that point. Appearance editing uses the canvas with fields below it.

## Experience-first decisions

Creation asks only for starter, source name, kind and typed UI image. The preview shows Help defaults; ordinary title, explanation, image and Close edits happen after creation. Public New screen defaults to Panel. The explicit Create a dialog in Screens shortcut supplies Dialog as the user's chosen kind.

Normal Close-action choices contain only the action qualified for that screen kind. An invalid loaded draft remains visible and refuses Apply without losing input. Sample conditions and raw state are in a review drawer. The Assets placeholder also identifies its simulation controls outside the ordinary creation form.

The canvas updates while typing without replacing the focused field. Source, Story and playback use accepted appearance. Use in Story retains unfinished appearance edits without applying them. A selected target is never shown as an accepted Beat. Finish displays the following dialogue so the author can see the continuation. No animation continuously repaints the page.

## Functional control map

| Control | Prototype result | Production owner / required result |
| --- | --- | --- |
| New screen; Blank / Help; Panel / Dialog | Separate creation draft; public default Panel | Existing creation request gains optional kind. Component operations stay separate. Blank remains with its existing owner and its result is outside this sample. |
| Name and UI image | Retains invalid/colliding input; Create stays disabled without a typed UI image | Existing name validation, typed asset inventory and source-preserving creation transaction; no invented asset or Blank fallback |
| Open Assets; return/cancel | Labeled simulation preserves the creation name/kind | Existing Assets workflow; return with an eligible UI image or keep the blocked draft |
| Create / Cancel / editor Escape | Creates only in memory or returns to the launching workspace | Existing transaction, draft, focus, history and cancellation owners; no write on Cancel |
| Tree, canvas and element navigation | Selects ordinary nodes without executing game actions | Existing synchronized selection, layout, Style, font, image, structure and component operations remain available in production |
| Selected fields in A/C; document fields in B | Live appearance draft with separate Apply/Cancel | Existing node editing and minimal transactional changes; no-op Apply stays disabled |
| Close action and dismissal defaults | Qualified Finish for Dialog, Hide for Panel; invalid input refuses and stays editable | Dialog modal True, game_menu Return(), Close Return(), default_focus True and no outside dismissal. No general action builder. |
| Missing screen Apply/Try | Refuses without dropping the appearance draft | Existing stable ownership, source reconciliation and unavailable-target refusal |
| Use in Story and step navigation | Selects a target and retains appearance drafts without adding a Beat | Existing navigation hint and per-target draft owners; no implicit Apply or source write |
| Insert before | Moves a pending marker and retains placement through Screens; accepted position stays explicit | Existing Scene/body/Position-before-anchor path; no new payload owner; accepted Beat movement stays with Story Move |
| Story picker and Add/Apply | Call lists dialogs; Show/Hide list panels; accepted target remains separate from its draft | Existing owned-screen picker/resolution, current action/reference revisions and Story transaction; components excluded |
| Scene Call / Return or end | Explains their existing distinct meanings | Existing Story owners; neither finishes a screen interaction |
| Cancel Beat; missing/unknown target | Retains original intent or restores the accepted Beat | Existing cancellation, validation, source/history/reopen and conservative effects owners |
| Source and effects | Saved sample nodes and only an accepted Story statement | Existing exact Source navigation and conservative effects. Static parameterless names, no arguments or return capture. |
| Try dialog; Close/Escape; Try again; Back | Waits at Call, focuses Close, blocks underlying Continue, ignores outside clicks, then shows the following Beat once | Deliberate pinned-SDK normal-entry game must qualify actual modality, focus, dismissal and continuation |
| Review cases, reset, invalid-action loader and raw state | Fresh fictional samples and explicit invalid cases | Review controls only; never production features |

## Current source and verification

Kris authorized the insertion control and action spacing only, and explicitly kept the Help image agreement. An available typed UI image remains required. That change request was not approval; the later explicit A4 decision is recorded separately.

Approved source is `8851689b62eda03127c199ca0276a776b0d623ab`, fingerprint `bd1742a2ae2576cb6fb8fce032e19f70a66d06e177b17ce3377fafa96a0f6762`. Source and evidence are local-only. The formal pointer selects only `inspector-v4`; [approval-receipt.json](approval-receipt.json) owns the completed promotion results and 40 retained A4 images. Earlier review evidence remains in review.json and review-v3.json.

The new Insert before picker previews a position before the introduction, the following dialogue, or Return/end. No option inserts unreachable flow after Return. C4 carries that insertion point through its Screens creation handoff. Source shows the accepted statement between the corresponding surrounding Beats. Before Add, the marker is a pending location and Source contains no new statement.

Placement uses the existing Story Scene/body/Position-before-anchor owner in production. These fixture keys are not new IPC or Beat payload fields. Production retains all valid positions and bodies already supported by Story. After acceptance, existing Story Move owns movement; this bounded form shows the accepted position read-only.

Add and Cancel share one action row with an 8px gap. Source and effects is an underlined secondary text button 14px below that row, with ordinary keyboard focus. This applies to all three variants at wide and compact widths.

Browser checks at `1d710f2` passed the requested insertion/Source cases (54/54), layout/keyboard cases (6/6), new-draft Cancel (6/6), missing/unknown refusals (36/36), C4 handoff/cancellation cases (12/12), Close-focused playback at all positions (36/36), and unchanged no-image requirement/return cases (6/6). There were no page/console errors or horizontal overflow. A separate outside-click-then-Escape sequence failed 6 cases because focus moved to BODY outside the host key listener. The prior implementation had the same handler arrangement, so this is not established as a v4 regression. The full focused result is 156/162, not a passing 162-case suite.

The small correction at the current source restores Close focus and captures modal keys when focus is outside the host, with listener disposal on reset. Twelve focused DOM event/focus checks pass, covering known/unknown interactions and clicks on the stage or its outside-dialog children. The original refinement pass did not rerun that corrected sequence in a real browser; A4 promotion later passed all ten selected browser sequences on the approved source. The insertion and spacing code did not change in that correction. All pre-correction captures and failures remain preserved.

Six current-source static HTML renders cover all variants at wide/compact widths without console errors. TypeScript, approval-record validation, artifact/capture hashes and whitespace checks pass. The OS accepted opening the refined local file at its Story review case. No display server was started. Those original DOM/static checks were not a promotion-gate pass. The later A4 promotion passes 36/36 offline browser cases, 18/18 actual Lab cases and the full gate: 1,324 renders, 29 check groups and 10 approval checks with zero errors. See HANDOFF.md for source, capture and comparison limits.

## Retained gate failure and simulation limits

The full `npm run design:check` ran once at `8dfd15f12e7e6acc1b2e7c842558cc9eba987195` and failed with exit 1 after 448 renders. Studio request `waitState` timed out after 8000 ms at `app/design-lab/screens/studio-request/check.mjs:66`. It did not reach Help or the later complete-gate checks. Its cause remains unresolved. It is not a passing promotion gate, a full-gate result for this source, or evidence of a production defect. No timeout/harness changed in that failed run. A single later required promotion gate on the approved source passes; the earlier failure and its cause uncertainty remain unchanged. [The retained record](withdrawn-v1-evidence.json) owns its exact source, count, uncertainty and captures. Scoped proof does not replace it.

Earlier v1 and v2 failures, corrections and captures remain preserved. Version two's [hover correction](hover-correction.json) and exact reviewed source are separate from the current refinement.

This prototype has one editable Help fixture plus fictional catalog targets. It does not authorize removing other screens or losing their drafts in production. It proves no project writes, minimal patches, actual history/Save/Undo/recovery/reopen, Source reconciliation or Ren'Py runtime behavior. No SDK, helper, package, Loomlight native app, CI or publication operation ran. Broader existing appearance/component operations retain their owners.

A4 is explicitly approved and its promotion checks pass. The direct return supplies the local evidence commit, source/fingerprint/revision/variant, exact decision, capture manifest, control map and remaining real-application acceptance limits to the Dialog/Story implementation owner, with the coordinator copied. Production implementation and #45 acceptance remain separate from this design-only result.
