# Approved Help A4 handoff

Kris approved **Help A4, Inspector extension**, screen `help-dialog-story`, revision
and variant `inspector-v4`, on 2026-11-04 in Australia/Brisbane. The exact decision
is **"Approved"**, followed by **"Sorry a4"** after the agent asked which of A4,
B4 or C4 to pin. [approval-decision.json](approval-decision.json) retains the mobile
user messages, UTC timestamps, positions and message IDs. [approval.json](approval.json)
owns the formal current pointer and source/capture record. B4/C4 remain drafts.

Source commit: `8851689b62eda03127c199ca0276a776b0d623ab`.

Source fingerprint: `bd1742a2ae2576cb6fb8fce032e19f70a66d06e177b17ce3377fafa96a0f6762`.

Local branch: `t3/help-dialog-design-prototype`. The approval/evidence commit is
supplied in the direct return message. Frontend/lab inputs remain pinned to the
approved source; documentation-only evidence commits have the same fingerprint.
No production implementation, push, PR, merge, issue mutation or release occurred
in this prototype chat.

Earlier [Components and Help panel A2](../design-lab-components-and-help-panel/HANDOFF.md)
at `c0ded415aba484633ac68981c48910afb82a959c` and Screens `flow-v1` retain their
existing authority and scope. This is the first approval of this separate Help
Call/Finish study, not a replacement of those reference sources. The new approved
controls extend the existing Screens and Story workspaces.

## Integration and control map

[README.md](README.md#functional-control-map) maps every visible control and existing
capability. Reuse the actual UI/controller/core owners and the shared transactional
change layer. Keep all fixtures, simulated Apply/Source/Assets/playback and raw review
controls in Design Lab. The dialog/Story implementation owner receives this handoff
directly; the coordinator is copied and retains shared-file ownership.

| Approved control group | Production operation / observable result |
| --- | --- |
| New screen, Blank/Help, Panel/Dialog | Extend the existing creation request with optional kind; public default Panel. Help creates ordinary editable title, explanation, image and Close nodes. Blank and component operations keep their existing owners. |
| Required UI image and Assets handoff | The earlier image agreement is unchanged. Help requires an available typed UI image; missing images block creation and retain name/starter/kind. No optional image, invented asset or silent Blank fallback. |
| Choose/tree/canvas/selected inspector | Select and edit the ordinary node without executing game actions. Preserve existing layout, font, Style, image, structural, component, Source and history controls. |
| Appearance draft, Apply/Cancel and workspace navigation | Canvas shows the retained draft; Source and Story use accepted appearance. One minimal accepted transaction/history entry per real operation. Navigation never silently applies or drops edits. Preserve invalid/stale/conflicted drafts, no-op, Undo/Redo, recovery and reopen through existing owners. |
| Close and dismissal defaults | Dialog modal True, game_menu Return(), Close Return(), default_focus True. Outside clicks keep it open. Finish is distinct from Hide and from Story Return. Wrong-context actions refuse and retain input; custom/unknown effects stay conservative. |
| Use in Story | Navigate with the stable selected screen binding and insertion context. Add no Beat and perform no implicit appearance Apply. |
| Insert before and pending marker | Reuse the existing Story Scene/body/Position-before-anchor owner. Fixture keys are not new IPC fields or Beat payload data. Preserve all supported production bodies/positions; never add unreachable flow after Return. Existing Story Move owns movement after acceptance. |
| Screen Beat picker and Add/Apply | Call screen lists owned parameterless Dialogs; Show/Hide list Panels; components are ineligible. Refresh relevant source/reference/action/effect revisions before admission. Accepted Source places exactly the selected statement at its chosen anchor. |
| Cancel, missing reference and unknown interaction | Restore captured operation context or accepted target/position. Retain unavailable original identity and unfinished input. Refuse conservatively without silent retargeting or assumed continuation. |
| Add/Cancel/Source action hierarchy | Add/Apply and Cancel share an 8px-gap row. Source and effects is an underlined secondary text action 14px below, with visible keyboard focus. |
| Source and effects | Resolve exact accepted source spans/references through existing owners. Keep static parameterless names, no arguments or captured return values. Scene Call and Story Return remain separate operations. |
| Try dialog / normal play | Use the existing deliberate pinned-SDK execution route. Qualify modal blocking, initial focus, outside-click retention, Close/Escape and exactly-once continuation at the actual following Beat in normal-entry play. Browser simulation is insufficient for this acceptance. |

The mock contains one editable Help fixture and three root-body anchors. It does
not authorize removing other screens, drafts, supported insertion positions or
existing Move controls in production. No general action builder or #47 work is
selected. Fictional names, guide art, sample text and dimensions are comparison content; preserve established starter/default owners while adding Dialog. Never invent a bundled asset from the sample. The source version labels and prototype tools are review chrome only.

## Reference captures and validation

Promotion checks pass on the approved source. [approval-receipt.json](approval-receipt.json) records the results and all reference hashes; detailed sanitized reports are under `verification/approved-a4/`.

- The single required `npm run design:check` invocation exits 0: 1,324 rendered cases, 29 check groups, 10 approval checks, zero errors. It includes all 108 Help rendering combinations, A4 matching-source approval protection and production build exclusion. This is current-source Lab validation, not historical pixel fidelity or app/native acceptance.
- Offline A4 validation passes 36/36 cases. Its 38 captures cover all nine registered states at both 1100×720 and 560×640, plus placement/Source, action spacing, image refusal/return and waiting/finished playback.
- Ten current A4 outside-click/Escape sequences pass, including child-outside and forced-body-focus cases. The actual following Beat runs once at each fixture insertion anchor, including Return/end. This resolves the prototype-browser gap for A4; it does not qualify Ren'Py behavior or promote B4/C4.
- The actual registered Lab passes 18/18 A4 state/size cases and six check groups. A4 is Approved with matching source; B4/C4 are Draft. The native substitute refuses `project.flush` without native transport.
- The standalone source rebuild matches the reviewed file byte for byte, SHA-256 `1137b4a18bbe5c7805ea9b8848d0bf5b01a29c41c4ad74bce0ad4ea13034670a`. Source identity is unchanged before/after validation.

Forty A4 images are retained: the two originally displayed inline Story captures, 18 browser initial-state references, and 20 additional interaction captures from the same pinned source. The formal approval record has 20 comparison conditions. The additional interaction conditions and replay provenance stay in the receipt/manifest. Browser viewports are 1100×720 and 560×640 at scale 1; full-page PNG heights can exceed those viewport heights. The original inline image heights 675 and 1087 describe their rendered documents.

The scoped Lab check ran before the 18 new reference conditions were appended, so it correctly showed those viewports outside the original two comparison conditions. After appending the references, approval parsing, all hashes, source match and the shared `referenceStatus` logic pass for all 18 state/viewport conditions as Approved. B4/C4 remain Draft. Metadata-only capture additions do not change the approved frontend source.

The capture script initially took a finished-state image after a second Escape had returned to the editor. Its sequencing was corrected before the final reference run; images now capture the first Escape's result, followed by the separate no-double-continuation assertion. No prototype code or gate timeout was changed during promotion.

The pre-correction browser result at `1d710f2` remains 156/162 with six failures. The earlier full gate at `8dfd15f` also remains failed after 448 renders in Studio request `waitState`, timeout 8000 ms at `check.mjs:66`. Its cause is unresolved. The new passing gate does not explain or rewrite that failure or establish a production defect. [withdrawn-v1-evidence.json](withdrawn-v1-evidence.json) and the prior review reports retain those exact identities and limits.

## Acceptance and comparison limits

**Visual finding.** The selected design is A4 at the source/fingerprint above.
Retain the reference images and explicit capture conditions. Compare the working
app to this pinned reference under identical state, content, theme, CSS viewport,
scale and scroll position. No production visual-fidelity comparison was performed
in this prototype chat. Material navigation/layout/behavior changes need a new
user decision; preserve the approved reference.

**Functional finding.** Browser/DOM fixture behavior and approval metadata checks
are separate from real application correctness. The owning implementation must
qualify every mapped operation through the actual UI-to-core path, minimal source
writes and one history entry, cancellation/no-op, invalid/stale/conflicted drafts,
source reconciliation, Undo/Redo, recovery and reopen. Pinned-SDK normal-entry
blocking/focus/dismissal/continuation and all applicable native/CI acceptance remain
with #45 and the coordinator. Missing or failed proof is not a pass. No SDK, helper,
Loomlight native app, package or CI operation ran here.
