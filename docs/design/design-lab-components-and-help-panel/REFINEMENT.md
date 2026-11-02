# A2 refinement

Kris requested unslop and principle-experience-first over the mock on 2026-11-02.
This created A2, variant `refined`, revision `refined-v1`, initially as a draft.
Kris explicitly selected and approved it later on 2026-11-02.
[HANDOFF.md](HANDOFF.md) owns the approval, written navigation clarification and
remaining full-gate failure. A/B/C remain available and historical captures stay intact.

The original mock required a walkthrough to explain what to do. It put source
ownership terms beside routine fields, reviewed unchanged values, and made the
author discard or apply a draft before copying a shared use. A2 keeps the inspector
layout and changes those parts of the workflow.

| Change | Author's experience |
| --- | --- |
| Start with the supported Help group | The first screen has editable content and a Make component action. The sample no longer begins halfway through a shared-edit task. |
| Shared by Help and About beside the fields | The author sees who receives the edit before typing. Source names, IDs, revisions and effects remain under Source and effects. |
| Make a copy for Help | The control names the screen that becomes independent. It replaces Make independent copy in A2. |
| Carry a valid draft after copying | The author can decide to change only Help after typing. The copy uses accepted content first. The draft follows only after verification. |
| Review only changed fields | Shared review lists every affected screen and compares Current with After Apply. Unchanged explanation, image and size are omitted. |
| Apply local edits directly | The author uses one Apply for ordinary local changes. Shared edits still require affected-screen review. |
| Shorter dialogs | Component naming, insertion, image sizing and Story pickers keep their necessary fields. Repeated ownership explanations and duplicate Cancel controls are removed. Enter submits a single-line form; Escape cancels it. |
| Project image in New screen | A valid existing UI image is preselected. Title, explanation and size remain editable defaults. The empty-image state blocks creation and gives the next action. |
| Action-specific feedback | Updates name the affected screens. Copy feedback distinguishes the saved copy from unsaved edits. Simulation stays visible in the footer and playback. |
| Existing layout and typography | A2 retains Choose / Design / Connect, the canvas, Source, history and the approved palette/icons. No decorative cards, pills or continuous animation were added. |

## Copy, then Apply

Copy and Apply remain separate operations and separate history entries. The core
Copy result contains `componentId`, `screenId` and `useId`, with no revision or
child-ID map. The mock does not pretend that a revision arrives in that result.

With a valid pending shared draft, A2 first copies the accepted definition and
changes the selected use. The original unsaved values, their original target and
base revision stay retained. A separate simulated inspection then verifies the
new definition, the copied accepted values and the corresponding fresh child IDs.
Only after that verification does the draft attach to the new independent target
at its inspected revision. The other uses retain the accepted original content.
The author sees the retained fields and presses Apply separately.

If Copy refuses a stale or unavailable intent, no copy is accepted and the draft
stays. If Copy succeeds but the subsequent inspection fails, A2 says "Copy created.
Your edits are still unsaved." Apply remains disabled and Reload copy retries the
verification. The author can keep typing or inspect Source. Starting another write
or switching targets is refused until Reload or Cancel resolves that retained
intent. No rollback or automatic Apply is claimed.

The **Copy created · reload required** scenario opens this failure after an accepted
copy. Reload verifies the target before moving the edited values. Cancel discards
only the unsaved edits and leaves the accepted copy in place. After a successful
Apply, the first Undo reverses the edit and the next Undo reverses Copy. The focused
check also exercises Redo in the same order.

These are browser-memory simulations. The refreshed definition and child IDs are
fictional data, not evidence of a production source-map round trip. The coordinator
confirmed this draft direction fits the existing two-operation contract. That
feedback is not user design approval or permission for production UI changes.

## Review and verification

Refresh `http://localhost:5177/comparison.html` while the requested local server is
running. A2 opens first; the original alternatives remain in the comparison row.
The new failure scenario is in the sample selector. The exported HTML remains
reproducible through the existing export command and needs no server to run.

Full lab TypeScript, approval validation and source checks pass. The offline matrix
passes 128 cases, four variants by eight scenarios by two themes by two sizes.
The original interaction checks pass, as do the A2 flows for minimal changed-field
review, copy with pending edits, successful and failed copy inspection, retained
input, Cancel keeping the copy, separate Undo/Redo, stale/missing refusal, image
selection/sizing, Help creation, Story target defaults, playback dismissal and the
empty-image block. Compact Apply stays inside 560 by 640 without horizontal overflow.

`refined-review-01.log` retains the matrix and interaction pass before the final
guard against starting another operation during copy recovery. The final focused
`refined-interactions-02.log` verifies that guard and all original/A2 interactions.
The final A2-only run, `refined-final-03.log`, checks all 32 A2 state/theme/size cases
and its focused interactions after the guard and copy changes. It refreshes the A2
captures, including the shorter initial conflict message. The final inline preview
at 728 pixels wide has no console errors.
The logs remain local under `.toolchains/components-and-help-panel/`.

[A2 captures](refined-captures.json) retain its baseline states, shared review,
pending-copy fields, failed-copy inspection, continued dialogue and compact states.
Earlier draft-v1/v2 manifests and PNGs are unchanged. A2's approval is now recorded;
original A/B/C entries remain null. No production code, SDK, package, native session,
CI dispatch or agent was added.
