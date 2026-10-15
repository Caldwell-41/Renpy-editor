# Project-wide Lorebook proposal — 2026-10-15

**Status: proposed; awaiting user approval.** The character-card design review remains
complete and approved. User dislikes the existing Lorebook layout and asks whether a
global Lorebook could set world state and tone, with a new ImageGen mockup.

Interpret “global” as one shared Lorebook **within each project**, not a cross-project
library. Interpret world state as the world's authored **starting situation**, consistent
with the accepted starting-only character knowledge and deferral of later discoveries.
These are design assumptions for review, not confirmed new product behavior.

## Proposed page

[Current mockup — corrected palette](global-world-tone-v2.png) · [palette-correction prompt](global-world-tone-palette-fix.txt)

[Initial layout prompt](global-world-tone-v1.txt); original image preserved, blue palette rejected.

- One broad page, without an entry list or extra sidebar.
- **World at the start**: setting, initial situation and shared facts when the story begins.
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

The intended author task is to maintain one project-wide world/tone reference that can
appear as shared context in the AI request preview after the user initiates an operation.
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
design calls14; cumulative walkthrough design calls15. User visual/workflow approval pending.

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
checks passed. Existing app and unsaved card remain untouched. User has not yet approved
the Lorebook layout/workflow; corrected preview awaits feedback. Earlier B images are
layout references only wherever their rendered colours disagree with the actual theme.
