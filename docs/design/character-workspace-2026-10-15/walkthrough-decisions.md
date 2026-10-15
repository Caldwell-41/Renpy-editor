# Consolidated Phase 2 / 3A walkthrough decisions

Updated 2026-10-15. This is the current design decision index for the walkthrough;
it supersedes conflicting earlier mockup details and pending recommendations. The
[combined task ledger](../../tasks/active/phase-3-initial-wysiwyg-release.md#combined-phase-2--3a-mac-approval-walkthrough--2026-10-14)
retains the sequence, qualifications and unique evidence. The Phase 2 task owns the
[model-loading follow-up](../../tasks/active/phase-2-initial-llm-assistance.md#walkthrough-follow-up--studio-model-loading-and-one-context-setting--2026-10-14)
and [linked-character follow-up](../../tasks/active/phase-2-initial-llm-assistance.md#walkthrough-follow-up--linked-character-workspace--2026-10-15).

**Character-card design review: COMPLETE — approved on 2026-10-15.** The user also
agrees to omit generic Related story items controls while preserving stored links.
Implementation/testing and whole-phase acceptance remain separate and pending.

**Scope:** record all user feedback, consolidate the agreed design and prepare updated
mockups for approval. Application implementation, live Studio requests/model operations,
new builds and whole-phase sign-off are not selected by this request. Existing build1/1
and launches1/3 remain unchanged. Latest native observation has an unsaved Mara draft;
preserve it without Save, Discard, Reload, navigation away or closing the app.

## AI connection and settings

| Item | Current agreed direction |
| --- | --- |
| Local profiles | “Profiles are saved only on this computer.” Saving a profile does not connect. |
| Untested status | Hide for an unsaved new profile. For a saved untested profile, show “Setup not tested yet” in the connection-test section. |
| Model ID | Helper: “Enter an exact model ID, or choose one after you Refresh models.” Place Refresh models immediately below the Model ID field. |
| API key | Rename Saved key to **API Key**. |
| macOS key notice | “macOS: API keys are encrypted and stored on this computer. Software running under your user account may be able to decrypt them.” Show once; replace the redundant generic reuse/native-entry/nonrevocation paragraph. Existing native credential confirmation and encryption policy remain. |
| Context | One editable **Context length**, default **32,768 tokens**, covers the total request/response budget and requested model-load context. No second editable total-context limit. Show actual detected capacity as read-only status where available. |
| Response length | **Maximum response length**, default **8,192 tokens**. Helper: “Maximum number of tokens to generate. Reaching this limit may cut the response short.” Preserve smaller-capacity validation and refusal of truncated proposals. |
| Earlier context wording | “Total context budget” and its input/output/margin explanation informed the accepted meaning; the subsequent one-setting/model-load decision supersedes that title with Context length. Final helper should explain that the response reserve and safety margin fit within this total. |
| Sampling | Temperature and Top-p were clear; no change requested. |
| Non-HTTPS endpoint | Place the private-network HTTP option beside Endpoint. Show for nonempty non-HTTPS input; hide for HTTPS. Visibility does not enable it. Preserve address validation and explain that loopback HTTP needs no private-network opt-in. |
| Connection test | Heading **Connection test**, button **Test connection**. Help: “Send a small test request to check whether Unsloth Studio can return the response format Loomlight needs. No project content is sent.” |
| Reloading profiles | One **Reload profiles** button preserving selection. Show **Retry loading profiles** only after a read failure; preserve unsaved-input guards. |
| Removing a profile | Separate red **Danger Zone**. Confirm the named profile and local saved-key impact, with Cancel and explicit Remove profile actions. Do not imply remote key revocation. No actual removal was performed. |

### Studio loading follow-up

User initiates generation after connecting, refreshing exposed model IDs and selecting
a model. If it is unloaded, Loomlight should load it with the chosen context length,
wait for readiness, then generate. If already loaded with sufficient context, generate
without unnecessary reload. Saving, opening Settings and refreshing must not load a model.

This is a recorded functional follow-up, not an existing capability. Supported Studio
versions, authenticated inventory of unloaded models, loading/status interfaces,
actual applied context, failures/cancellation and conflicting loaded-model cases remain
to be verified. No implicit download, Studio process management or shared-model unload
is authorised. Preserve existing profiles and credential policy.

## Unified Characters workspace

| Item | Current agreed direction |
| --- | --- |
| Character/card association | One Characters list and a workspace with **Writing** and **Game setup**. Each runnable character has an initially empty card section ready to fill. Do not invent writing content. |
| Planning first | A card-only character is **Planning only**, with explicit Create game character or Link existing character actions under Game setup. A linked runnable character is **In game**. |
| Linking and source creation | Preserve stable identities and existing reference data; do not merge by name. Create source definitions through the shared transaction layer and source review. Editing prose must not silently edit game definitions or Appearance assets. |
| Chosen visual direction | **B — focused section editor**, refined for wide writing space. Warm/off-white and teal styling follows the approved examples; retain existing theme support. |
| Navigation | Horizontal writing topics; no permanent right inspector or additional inner sidebar. Collapsible character list and global navigation use the Story page's existing panel icons, placement, restore/focus behavior and remembered state. No bespoke Focus/Hide/Show buttons for ordinary collapse. |
| Stable layout | Fixed shared identity/header/list/editor alignment and New character at the top right across cards/views. Stable save/discard positions. Preserve draft, selection and deliberate scroll/focus through switching/collapse. The reported cross-card layout shift remains user-observed, not independently reproduced with the one-card fixture. |
| Writing help | Brief persistent help directly below every writing text box, separate from placeholders/errors. Give concrete AI-writing examples. One note explains that the card is used only when explicitly included in a request. |

Examples and helper copy are in [b-field-help.json](b-field-help.json). Existing
protection, approval and source ownership rules still govern later implementation.
Generated portraits, typography and approximate icons are illustrative rather than
additional product requirements. Static mockups do not prove interaction or resizing.

## Relationships

- Named compact summary rows, with one entry open for editing at a time.
- Explicit Add relationship action; edit directly without an Edit-to-unlock step.
- Approved selector label: **Relationship with**.
- Approved selector helper: **Choose who these notes are about.**
- A wide prose field describes how the selected card character feels about and acts
  toward that person. Place its AI-writing helper beneath it.
- Use the workspace Save/Discard controls, with no extra per-entry save workflow.
- Relationship notes are writing guidance, not runtime relationship scores/state.
- Preserve existing non-character targets and unknown reference data; their future
  presentation is not silently removed by a character-focused mockup.

The prior Relationships image remains evidence of the accepted arrangement. Its
“Other character” label is superseded by the approved copy above.

## Starting knowledge and the simpler card

**Chosen:** knowledge option **B — guided questions**, with one prose field. It covers
what the character knows when the story begins, what they have not learned and secrets
they keep. The questions are guidance, not three new saved fields or required steps.

Updated presentation approved by the user on 2026-10-15:

- Heading/field: **Starting knowledge & secrets**.
- Intro: **Describe Mara's perspective when the story begins.**
- Guides: **What does Mara already know?**, **What hasn't she learned yet?**,
  **What secrets does she keep?**
- Helper: **Write what Mara knows, doesn't know and keeps secret at the start of the story.**
- Inclusion note: **Used only when you include Mara's card in an AI request.**

The temporal scope, B layout and final updated copy/screenshot are approved. No automatic reclassification or overwrite of existing knowledge prose.

| Feature | Decision |
| --- | --- |
| Later discoveries / current-point knowledge | Defer to a future phase, unassigned. No scene/route-dependent learning timeline, automatic inference or “what they know here” feature is part of this design. |
| Character-linked lore | Leave out of the simplified card UI for now. Preserve existing links, the independent Lorebook and explicit lore selection for AI requests. Linking does not automatically send content or establish character knowledge. |
| Applies to | Leave out of the character-card design; defer route-specific character changes. Preserve existing saved scope, without silently flattening it. This supersedes the earlier suggestion to tuck it under More details. |
| Source notes | Remove this section from the simplified card UI. Preserve stored provenance/citations and underlying approval/freshness protections. This does not authorise bypassing missing/changed-support checks. |
| Generic Related story items | User agrees to omit this control from the simplified character-card UI. Preserve existing saved links; no data deletion or reference migration is authorised. This closes the final character-card design-review item. |

## Version history and restore

**Agreed:** keep history visible and let the user roll back to the previous saved
card. This supersedes the suggestion to hide history behind the scenes.

Approved UI: a quiet **Version history** entry in the character header,
opening a compact dialog with readable recent-version previews and an explicit
**Restore this version** action. No permanent history sidebar or raw metadata dump.

The current build only displays earlier versions; restore is a functional follow-up.
It should create a new current revision through the shared transaction layer, preserve
the character/card identity, respect unsaved-draft guards and normal validation/
approval checks, and support ordinary Undo/Redo. It must not silently discard the open
draft or destructively rewind saved IDs. Existing reference snapshots are bounded to
at most three per record; unlimited history or retention-policy changes are not selected.
Any existing AI proposal remains subject to its own review, not automatic approval.

## Open review and implementation boundaries

- User approved both final starting-knowledge and Version history mockups on 2026-10-15.
- The synthetic connection-test request preview was unavailable for the unsaved
  profile and remains unreviewed. No profile save/test was performed to reveal it.
- Generic related-story-link UI removal is approved; existing links must remain preserved.
- Studio loading, unified character/source creation and version restoration are
  separate functional follow-ups requiring implementation scope and verification.
- The Phase 2 / 3A walkthrough is incomplete. Remaining reference/AI-request review
  and Phase 3A story-logic checks are not approved merely by accepting these designs.
- All work in this record is local-only. No product source changes, additional app
  launches, live model calls, credential operations, merge or release are performed.

## Mockup consistency checklist

Updated mockups must retain B's shared frame, fixed New character/save controls,
horizontal topics and Story-style collapse/restore controls. They must show persistent
field help, starting-only knowledge, and a useful surfaced history/restore action.
They must omit linked lore, Applies to and Source notes from the simplified writing
flow. History must not add a sidebar; restoring must be a deliberate action after
preview. Existing screenshots remain historical proposals where they conflict with
this record. Record exact prompts, image hashes and visual-review limitations.

## Updated approval previews

Both are built-in ImageGen mockups within approved B, not screenshots of a changed app.

| Preview | Final image | Exact prompt |
| --- | --- | --- |
| Starting knowledge only | [Starting knowledge](b-starting-knowledge-v3.png) | [Base edit](b-starting-knowledge-v2.txt), [panel correction](b-starting-knowledge-panel-fix.txt) |
| Recent history and restoration | [Version history](b-version-history-v1.png) | [Dialog edit](b-version-history-v1.txt) |

Owner visually inspected the two final 1586×992 images and verified PNG integrity and
manifest hashes. Three built-in calls produced two final views, including one panel-icon
correction; cumulative14calls, two earlier user-requested research/workflow agents.
No additional subagent was used for consolidation. The history dialog's dimmed underlying
icons are illustrative; implementation must reuse the actual shared Story panel controls
shown in the corrected knowledge image. Static screens do not qualify interaction,
responsive wrapping or the new restore behavior. The user explicitly approved both
visual presentations on 2026-10-15; no new implementation or phase sign-off is inferred.

Historical images/prompts are preserved. The old optional-lore/applicability rows,
ambiguous temporal wording, bespoke focus controls and Other character label are
superseded by this decision record. No extra image correction or new build is selected.

## Following walkthrough section — Lorebook proposal

Character-card design review remains complete. User now requests a simpler global
Lorebook to set world state and tone. The [new Lorebook mockup and scope notes](../lorebook-workspace-2026-10-15/README.md)
propose one document per project, starting-world facts and tone/style, consistent with
approved B. The user subsequently agreed the Lorebook refinements, including visible shared context
for AI writing with per-request omission. This does not reopen the approved card design
or authorise migration/deletion or silently change current context assembly.

## Palette consistency correction

User requires the Lorebook and redesigned surfaces to match the rest of the app. Use
existing app/src/ui-refresh.css Paper/Teal and Charcoal/Copper theme tokens; approved B
images govern layout, not a separate blue/purple colour scheme. This correction preserves
character design approval and applies to implementation across redesigned surfaces.
[Corrected Lorebook preview](../lorebook-workspace-2026-10-15/global-world-tone-v2.png)
awaits feedback. No application code or theme preference changed.

## Lorebook refinements agreed

The user agrees the [four refinements](../lorebook-workspace-2026-10-15/README.md#agreed-refinements--2026-10-15):
World & starting situation, visible shared context with per-request omission, distinct
story tone/character voice, and growing fields with page scrolling/fixed Save/Discard.
No categories/tags/panels. Preserve the corrected mockup and approved application theme;
this wording/behavior amendment needs no new image. Implementation and testing remain
follow-up work, with no product or provider change during review.

## Proposed implementation outcome

The user requests a refined plan for a new Sol6.1/xhigh chat to coordinate Sol6.1/high
implementation/testing subagents, review and audited CI, with an Unsloth generation
budget. The [implementation proposal](../../tasks/active/walkthrough-redesign-implementation.md)
is the single owning plan and awaits approval. It does not start implementation or
create the chat; prior no-build restrictions remain pending the explicitly scoped plan.
