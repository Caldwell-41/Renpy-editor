# Phase 3B ticket sizing review

User-approved ticket design, unpublished, 2026-10-22. This refines the
[reviewed migration](phase-3b-github-migration-review.md) and its
[11 outcome drafts](phase-3b-github-issue-drafts.md). The proposed
[27 vertical work ticket bodies](phase-3b-vertical-ticket-drafts.md) contain the approved sizing and start edges.
No issue, ownership record or product implementation changes in this review.

## Recommended structure

Keep P3B and its confirmed 11 direct children B01-B11. Use those children as outcome
and acceptance groups. Add 27 narrower work tickets under them, with one primary
parent per work ticket. The user approved 39 issues, refining the earlier 12-issue design, and approved
the start edges with no further merges or splits. This is ticket-design approval
only. Publication of the complete hierarchy remains unapproved.

Select a work ticket for implementation, not an entire outcome group. Each selected
outcome still needs explicit authorization and a finite cumulative allowance.
Splitting work creates no allowance and never resets the same problem's counts.
Keep needs-triage and no assignees for the unselected backlog. The skill's default
ready-for-agent label does not override that confirmed decision.

Approved product requirements, evidence/recovery ownership, the parent live coverage
map, acceptance-based closure, publication prerequisites and the published cutover
receipt stay as confirmed. B07 retains its required deferred grill-with-docs session.
This review chooses no rendering architecture, property syntax or pixel tolerance.

## Findings and refinements

| Existing scope | Problem | Proposed refinement |
| --- | --- | --- |
| B01 ownership/creation | A general service could grow before anything is usable. | L01 proves Choose/create/Source/history/reopen and only the ownership change that path needs. |
| B02 nodes/properties | A horizontal source-service ticket contains most of the grammar and postpones usable controls. | L02-L04/L13 each implement actual controls through source and SDK proof. Other features add only their needed syntax. |
| B03 assets/reuse | Fonts, images, styles and components have independent outcomes and failure modes. | Separate them into L05-L08. |
| B04 then B05 | Every action need not precede the first useful normal-play screen. | L09/L10 deliver panel Show/Hide and dialog Call/Finish vertically; L11-L13 extend actions and controls. |
| B06 whole editor | Full-outcome blockers also prevent useful work on the existing Help layout/forms. | L14 has no work-ticket blocker; L15/L16 wait only for the base canvas contract they use. Full visual acceptance stays separate. |
| B07 decision/proof | Unresolved rendering choices could become hidden implementation assumptions. | L17 retains the deferred grill-with-docs session, confirmed ADR and bounded proof before L18. |
| B08 whole renderer | One all-subset renderer ticket has a large matrix without intermediate qualified output. | L18 covers base Help composition; L19 nested/container/component behavior; L20 marked variable/control states. |
| B09/B10 adapters | Bundled templates have distinct protected semantics; menus need not wait for choices. | L21 establishes the first adapter/input contract. L22-L25 independently extend it to their contexts. |
| B11 implementation/acceptance | Deferring sample inputs here prevents earlier adapters demonstrating their complete action. | L21-L25 implement their own shared-job inputs. L26/L27 qualify and accept completed features. |

No wide mechanical refactor is established by the source audit. A speculative
prefactoring ticket has no demonstrated finish line. L01 introduces a compatible
ownership/migration extension as part of its usable path. Justify any later
necessary refactor against the selected slice and its allowance.

## Numbered breakdown for review

Blocked by names tickets that must complete before this work starts. Every entry
also requires the unchanged external Phase 2/3A gate or explicit bounded exception,
outcome selection and allowance. No ticket blocker is not execution permission.

1. L01, create an owned blank screen. Blocked by no work ticket. Delivers Choose
   creation, stable ownership, exact Source, migration, history and reopen.
2. L02, compose and reorder a simple Help layout. Blocked by L01. Delivers editable
   fixed/frame/vbox/text/textbutton nodes, grouped hierarchy operations and SDK proof.
3. L03, edit numeric layout and anchors. Blocked by L02. Delivers qualified coordinate,
   anchor, size/limit, padding and spacing edits through Design and SDK geometry.
4. L04, author nested and clipped layouts. Blocked by L03. Delivers editable
   window/hbox/grid/viewport composition and qualified container/clipping behavior.
5. L05, format text with a project font. Blocked by L02. Delivers TTF/OTF import,
   typed font selection, text properties and actual font output.
6. L06, import and place a UI image. Blocked by L02. Delivers typed image import,
   insertion, displayed size/aspect editing and SDK output.
7. L07, edit and share a look. Blocked by L05. Delivers qualified text/frame/button
   styling, affected-use review and shared edit/independent copy across two screens.
8. L08, reuse an owned component. Blocked by L02. Delivers parameterless component
   creation/use, affected-use review/copy, reference continuity and conservative effects.
9. L09, create and show the Help panel. Blocked by L06. Delivers the editable starter,
   panel type, Close/Escape, Story Show/Hide and continuing dialogue in normal play.
10. L10, create and call the Help dialog. Blocked by L09. Delivers the blocking
    starter, Story Call, focus/dismissal and Finish continuing at the next Beat once.
11. L11, display variables and order button actions. Blocked by L10. Delivers typed
    variable text/assignments, bounded ordered actions and revisioned effects.
12. L12, bind an integer bar. Blocked by L11. Delivers explicit limits, typed binding,
    marked samples and runtime behavior with source/history/reopen.
13. L13, configure an image button and its appearances. Blocked by L11.
    Delivers actual state assets, size/aspect controls and a qualified typed action.
14. L14, align the existing Help editor and preserve form state. Blocked by no work
    ticket. Delivers covered flow-v1 layout/section/scroll/focus behavior using today's path.
15. L15, move and resize with pointer and keyboard. Blocked by L18. Delivers eight
    handles, constrained movement/snapping, keyboard alternatives and one-entry gestures.
16. L16, control zoom and the preview area. Blocked by L18. Delivers Fit/100%/zoom,
    preview-area resizing and Focus preview without source/game-dimension changes.
17. L17, grill and prove the canvas rendering approach. Blocked by no work ticket.
    Delivers B07's deferred grill-with-docs session, confirmed ADR and representative proof.
18. L18, render the base Help composition faithfully. Blocked by L03, L06, L07
    and L17. Delivers matched actual assets/fonts/styles/layout for the base composition.
19. L19, render nested layouts and components faithfully. Blocked by L04, L08
    and L18. Delivers matched container/component placement, clipping and layering.
20. L20, render variable and control-state samples faithfully. Blocked by L12,
    L13 and L18. Delivers inert marked samples and matched actual appearances.
21. L21, edit generated dialogue and preview its inputs. Blocked by L19. Delivers
    the first versioned say adapter, who/what scratch inputs and normal dialogue.
22. L22, edit generated choices and preserve routing. Blocked by L20 and L21.
    Delivers styled choice samples and unchanged actual choice routing.
23. L23, edit generated menu navigation. Blocked by L20 and L21. Delivers supported
    main-menu/navigation changes with protected actions and normal navigation.
24. L24, edit generated preferences. Blocked by L20 and L21. Delivers layout/style
    changes, preview samples and verified actual preference behavior.
25. L25, edit generated save and load screens. Blocked by L20 and L21. Delivers
    marked slot samples and supported changes preserving actual saving/loading.
26. L26, qualify the integrated 3B candidate. Blocked by L14, L15, L16, L22, L23,
    L24 and L25. Delivers coherent-candidate automated/native proof of completed features.
27. L27, review final 3B acceptance. Blocked by L26. Delivers the evidence audit,
    physical keyboard checks and required human/visual decisions for every requirement.

This list is retrieval order, not a serial chain. L01/L14/L17 have no work-ticket
predecessors. L23-L25 do not wait for L22 merely because choices appear earlier.
L26 lists terminal inputs instead of every transitive predecessor. All work has a
path into final acceptance. L17 is a decision/proof outcome; L27 is an acceptance
outcome. Neither hides a broad implementation task behind a review label.

## Outcome grouping and requirement coverage

Each leaf has one primary parent. A slice can supply another outcome's evidence
without acquiring another scope owner or allowance.

| Outcome | Primary work tickets | Other acceptance input |
| --- | --- | --- |
| B01 ownership/creation | L01 | L09/L10 starters and reference reconciliation |
| B02 nodes/properties | L02-L04, L13 | L05-L08/L12 mappings and complete-subset evidence |
| B03 assets/reuse | L05-L08 | Matched rendering and final use/property proof |
| B04 actions/effects | L11/L12 | L08-L10/L13 and template contexts/effect revisions |
| B05 Story connection | L09/L10 | Integrated normal-play proof |
| B06 editor workflow | L14-L16 | Feature controls and L27's final visual/keyboard decision |
| B07 rendering decision/proof | L17 | Required interview, ADR and evidence-based tolerance decisions |
| B08 canvas agreement | L18-L20 | Adapter captures and integrated visual acceptance |
| B09 dialogue/choice | L21/L22 | Integrated generated-game proof |
| B10 game menus | L23-L25 | Integrated generated-game proof |
| B11 integrated acceptance | L26/L27 | Qualified feature inputs and samples supplied earlier |

Outcome acceptance is an aggregate gate, not a start blocker for every child.
B06 still cannot claim complete Connect acceptance before B05. L14 can demonstrate
its existing-Help layout/form pass before future Story work. This separates start
edges from final gates without weakening an approved requirement.

The original 44 IDs and primary B/P3B owners remain intact. This table adds their
leaf evidence and replaces no requirement or historical result.

| Requirement | Primary outcome | Work/evidence coverage |
| --- | --- | --- |
| R01 | B01 | L01 |
| R02 | B01 | L01, L09, L10 |
| R03 | B01 | L01, L09, L10 |
| R04 | B02 | L02, L04 |
| R05 | B02 | L02, L04, L06, L12, L13 |
| R06 | B02 | L02, L04, L08 |
| R07 | B02 | L03, L04, L15 |
| R08 | B02 | L05, L07 |
| R09 | B02 | L06, L07, L13 |
| R10 | B02 | All source-changing leaves; L26 audits |
| R11 | B06 | Every write plus L14/L15; L26 audits |
| R12 | B11 | Every source-changing leaf; L26/L27 integrate |
| R13 | B03 | L05, L06 |
| R14 | B03 | L07, L08 |
| R15 | B04 | L09, L10 |
| R16 | B04 | L11, L12 |
| R17 | B04 | L09-L11, L13 |
| R18 | B04 | L08-L13, L21-L25 |
| R19 | B05 | L09, L10 |
| R20 | B05 | L01, L09, L10 |
| R21 | B06 | L02, L09, L10, L14 |
| R22 | B06 | L02-L04, L15 |
| R23 | B06 | L02, L15, L19 |
| R24 | B06 | L16, L18 |
| R25 | B06 | Picker/field leaves and L14; L26/L27 verify |
| R26 | B08 | L11-L13, L20 |
| R27 | B08 | L17-L20 |
| R28 | B08 | L18-L20 |
| R29 | B08 | L17-L20, L26, L27 |
| R30a | B06 | L14, L27 |
| R30b | B08 | L18-L20, L27 |
| R31 | B09 | L21, L22 |
| R32 | B10 | L23-L25 |
| R33 | B09 | L21 establishes contract; L22-L25 extend it |
| R34a | B09 | L21, L22 |
| R34b | B10 | L23-L25 |
| R35 | B11 | L21-L25 implement their inputs; L26 integrates |
| R36 | B11 | Every runtime-changing leaf preserves it; L26 audits |
| R37 | B11 | L26, L27 |
| R38 | P3B | All leaves; L27 audits |
| R39 | P3B | All leaves; L27 audits |
| R40 | P3B | UI leaves preserve the pin; L14/L27 compare |
| R41 | B11 | Every leaf retains scoped proof; L26/L27 audit |
| R42 | P3B | Every selection preserves entry, authorization and cumulative counts |

## Reconciled publication design

The [ownership proposal](phase-3b-github-ownership-proposal.md) remains unapplied.
The approved sizing revision is reconciled into its payload as follows:

- Add this review and the vertical work-ticket draft to the non-owning baseline.
  That becomes six files including the tracker guide, rather than four.
- Publish P3B, 11 outcome children and 27 work tickets. Verify all 39 issue URLs,
  primary-parent mappings and start dependencies in the cutover receipt.
- Keep the 44 primary coverage owners and extend the parent's live map with leaf
  links/evidence. Keep these local reviews as dated migration baselines.
- Route execution to the selected leaf, which owns its bounded scope and current
  allowance record. Its B group owns aggregate acceptance. Keep one current allowance
  record for the selected problem, linking leaves if the authorized outcome spans them.
- Preserve the effective boundary of verified issues/dependencies, a published
  reviewed ownership commit and one parent receipt. Local drafts transfer no ownership.

The skill normally publishes after its sizing quiz. The user explicitly requested
changes for review before publishing. Breakdown approval settles ticket design only;
publication remains a separately selected action.

## Review results

Repository documentation/privacy/link validation passes for 845 files. Draft
whitespace checks pass. All 27 work-ticket start lists match the numbered review,
all 11 outcome parents are represented, every leaf reaches final acceptance without
cycles, and the 44 primary requirement owners remain unchanged.

1. The user approved 27 work tickets within the 11 confirmed outcome groups.
2. The user approved the proposed start-blocking edges.
3. The user requested no further merges, splits or scope changes.

The design review is complete. Publication, push, ownership cutover and product
implementation remain unselected. B07/L17's canvas interview remains deferred.
