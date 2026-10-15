# Project-wide Lorebook proposal — 2026-10-15

**Status: project-wide direction and four refinements agreed on 2026-10-15; implementation pending.**
The character-card design review remains
complete and approved. User dislikes the existing Lorebook layout and asks whether a
global Lorebook could set world state and tone, with a new ImageGen mockup.

Interpret “global” as one shared Lorebook **within each project**, not a cross-project
library. Interpret world state as the world's authored **starting situation**, consistent
with the accepted starting-only character knowledge and deferral of later discoveries.
The shared-project design and starting-situation framing are agreed; application behavior is unchanged.

## Proposed page

[Current mockup — corrected palette](global-world-tone-v2.png) · [palette-correction prompt](global-world-tone-palette-fix.txt)

[Initial layout prompt](global-world-tone-v1.txt); original image preserved, blue palette rejected.

- One broad page, without an entry list or extra sidebar.
- **World & starting situation**: setting, lasting world rules, initial situation and shared facts.
  This agreed label supersedes World at the start in the retained screenshot.
- **Tone & writing style**: mood, pacing, dialogue and prose guidance.
- Persistent helpers directly beneath both writing fields.
- Approved B's warm/off-white and teal visual language, global navigation and Story-style
  panel toggle; no character identity, character panel toggle or nested character tabs.
- Fixed Save changes / Discard footer, with a quiet Version history header entry matching
  the accepted card pattern. This proposes consistent presentation; Lorebook restore is
  not currently implemented or independently approved by the card decision.
- Plain request-preview note: “Review these notes in the AI request before sending.
  Saving sends nothing.” No network action on this page.

The single document does not need a New lore entry action. Fields are directly editable,
with no Edit unlock. Preserve existing theme support if implementation is selected.
Examples are invented; no private game content was read or sent.

## Workflow and implementation boundaries

The agreed author task is to maintain one project-wide world/tone reference. For AI
writing, use it as shared context by default, clearly shown in the request preview,
with an option to omit it for that request. Context is prepared only after the user
initiates a writing operation; sending remains explicit. Connection tests send no project
content. This records future behavior, not an implemented change.
Saving only stores notes. Characters' starting knowledge remains their own perspective;
world facts do not automatically establish that every character knows them.

Current implementation has a multi-entry reference library, explicit approved-reference
selection and per-action prompt/style settings. This mockup does not implement a global
document, automatic context inclusion, a new tone field or revision restoration. The
later implementation must define global-context inclusion/omission and token budgeting
visibly, and consolidate tone versus existing prompt style settings without competing
hidden instructions. Preserve reference approval/staleness checks and explicit Send.

Existing entries, saved revisions, IDs, links, citations, extensions and source authority
must be preserved. Conversion/migration is not authorised by this mockup request; do not
merge or delete existing lore automatically. Later scenes/branch-specific world state,
automatic state simulation and cross-project libraries are outside this proposal.

The current app's unsaved Mara reference draft was preserved: no native navigation,
Save, Discard, Reload, app launch or close was performed for this design. No application
source, profile, credential, project reference or Studio operation changed. Build1/1
and launches1/3 are unchanged. This is design exploration, not Phase 2 / 3A acceptance.

## Generation and review

Built-in ImageGen used one edit of the approved B starting-knowledge image. One final
1586×992 screenshot was visually inspected by the owner: broad editor, both readable
fields/helpers, clean global header, active Lorebook navigation and anchored history/
Save/Discard; no entry list, right inspector or character controls. Icon shapes and
rendered colours are illustrative; reuse the exact existing shared controls/tokens.
Static mockups do not verify resizing, keyboard behavior, history restoration or AI
context assembly. PNG CRC/hash and exact prompt hash are in [manifest.json](manifest.json).
No additional researcher/subagent was requested or used. Lorebook calls1; prior character
design calls14; cumulative walkthrough design calls15. The user subsequently agreed the refinements below.

## Palette correction — current preview

User rejects the blue/purple colour treatment and requires consistency with the existing
application. The initial mockup had visibly blue text/icons/borders despite the intended
style. Corrected [v2](global-world-tone-v2.png) uses the actual Paper/Teal token system in
[ui-refresh.css](../../../app/src/ui-refresh.css) and the approved
[light palette reference](../ui-refresh/palette-light-paper-teal.png). Keep dark neutral
headings/prose, muted grey helpers, warm paper/stone surfaces, neutral borders and muted
teal actions/selections. The actual theme overrides the earlier base stylesheet palette;
do not introduce a second page-specific palette. Preserve the existing Charcoal/Copper
dark theme in implementation; this preview illustrates light mode only.

One targeted built-in ImageGen colour edit; Lorebook calls2, walkthrough design calls16.
Owner inspected retained layout/text and corrected colour hierarchy. PNG integrity/hash
checks passed. Existing app and unsaved card remain untouched. The corrected preview was the basis for the subsequent agreed refinements below. Earlier B images are
layout references only wherever their rendered colours disagree with the actual theme.

## Agreed refinements — 2026-10-15

The user agrees to keep the simple two-field layout and all four suggested refinements:

1. Rename **World at the start** to **World & starting situation** to include lasting
   world rules alongside opening circumstances. Draft helper: **Describe the setting,
   world rules and situation when the story begins.**
2. Use this Lorebook as shared context for AI writing within the project. Show inclusion
   clearly in the request preview, with a per-request option to omit it. Save does not
   send content. Preserve token-budget disclosure, reference approval/freshness checks
   and explicit Send; no inclusion in connection tests or unrelated operations.
3. Keep story tone distinct from character voice: the Lorebook guides overall style;
   each character card guides that person's dialogue. Do not add a competing second
   tone editor or erase character-specific voice. Detailed request assembly remains
   implementation preparation, not automatically inferred runtime knowledge.
4. Let writing areas grow with content and scroll the page body, keeping Save/Discard
   fixed and reachable. Avoid small internal scrolling boxes and extra side panels.

No categories, tags or new panels are selected. The existing app's Paper/Teal and
Charcoal/Copper tokens remain authoritative. No new image call is needed for this
label/workflow amendment: preserve corrected v2 and its prompt as visual evidence,
with this record owning the newer wording and growth behavior. No implementation,
migration, source/reference save, app launch or AI request performed. Next: resume
remaining AI and Phase3A walkthrough; whole-phase acceptance remains pending.
