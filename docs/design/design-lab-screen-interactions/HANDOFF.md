# Approved A integration handoff

Kris approved A on 2026-11-05 with the exact decision "A is approved". No reason
or acceptance waiver was stated. `inspector-v2` is the current approved design;
B, C and all v1 revisions remain drafts. This records design authority, not ticket
acceptance. Promotion verification remains blocked as described below.

## Reproducible reference

- Source commit: `7090a036032ce3f225a857b30259a9c91716ac60`.
- Full frontend/Lab fingerprint: `a976830817d848d1263bbbc7f8a101c92c322ce2e369eb4c79c9ce7805bbb85e`.
- Standalone HTML SHA-256: `962252fbd2d14e5937cc6f02206f46afe40b9a58f4eef582c32577f4bf21e18d`.
- Approval and reference hashes: [approval.json](approval.json).
- Ten retained PNGs and provenance: [capture manifest](captures/inspector-v2/manifest.json).
- Scores and unresolved design findings: [REFINEMENT.md](REFINEMENT.md).
- Current verification and blocker: [VERIFICATION.md](VERIFICATION.md).

The source commit includes the draft approval catalog. To inspect the approval
at that pinned source, copy the later approval record and retained captures into
a separate reference checkout without changing its frontend inputs. Do not rebase
this reference onto the integration branch. The private Tailscale comparison
remains live; its local route and hosting metadata remain ignored.

The ten dark captures cover button at 1280x720, 1024x768 and 390x844; eight-action,
invalid and text/sample states at desktop and phone sizes; and the clean 1440x900
counterpart of the highlighted A screenshot shown immediately before approval.
The last view has a pending Coins value of 42 while the canvas sample remains 12.
Each capture records CSS dimensions and PNG display scale. Other dimensions and
light theme are outside retained visual comparison coverage.

## Controls and real owners

| Visible control or capability | Production owner and required observable result |
| --- | --- |
| Screen picker, task rail, chooser, tree, canvas selection | Existing `ScreensWorkspace` and composition controller. Preserve selection, drafts and existing navigation. |
| Text editor and Insert variable | Existing Text/composition editor and transactional source changes. Replace the selected range, retain draft/focus, and preserve source-only regions. |
| Add, type, value, target, reorder and Remove | Existing typed ordered-action source owner and coordinator-owned callers, assigned by integration. Persist the sequence transactionally, keep Finish last and the eight-action bound, and retain validation/drafts. Migrate legacy dismissal to the same owner. |
| Show/Hide target choices | `screens.resolveTarget.canShowHide` from `qualified_panel_targets`, prepared by parent commit `23fc113`. Panel kind, nonblocking status and `effects.unknown` cannot establish eligibility. Finish continues to use blocking context. |
| Apply and Cancel | Existing selected-change transaction, source revision/conflict handling, history and recovery. Apply must save real supported edits; Cancel restores pending changes. Lab memory-only success is not a production implementation. |
| Samples and reset beneath canvas | Existing editor-only sample payload and canvas-render owners. Keep samples separate from source values and runtime state; retain last valid sample on invalid input. |
| Layout, appearance, Source, Story, history and Test in Ren'Py | Existing application owners and task scope. Their presence in the mock does not authorize a replacement owner or new functionality. |

The mock imports the actual Screens renderer and production styles. Its fixture
services, source edits, history and canvas output remain fictional and inert.
Unsupported service calls fail visibly. No fixture, native stub or memory-only
save implementation belongs in production.

## Remaining obligations

Round three scored A 8.5 design, 8.5 ease of use, 8 UX and 8.5 UI. The requested
9/10 goal was not reached. Work stopped after the requested three rounds.
Known findings are local recovery after removing an action within a draft,
uneven integer-input/select heights and weak desktop continuation cues for long
sequences. Approval does not waive existing history/recovery requirements or
production fidelity and functional checks.

The required full Design Lab check is not a pass. A focused matrix passed 132
render combinations, and live approval/source/capture inspection passed. An
unchanged interaction assertion then failed on an ambiguous error locator; later
assertions did not run. Full promotion verification remains open. Preserve the
approved source while correcting and verifying the harness in a separately
identified candidate. No new design approval has been inferred for that candidate.

The integration parent assigns production source/action ownership after this
preparation. Existing Screens `flow-v1`, Components/Help `refined-v1` and Help
`inspector-v4` approvals remain intact. No production, SDK, helper, package,
native, engine, CI, publication or PR work was performed in this approval step.
Old stopped workers were not resumed.

Direct recipient:
<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/eacbb889-046f-4429-ac3e-83d28b6a2520>
