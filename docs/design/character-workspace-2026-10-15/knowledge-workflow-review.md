# Knowledge and story-link workflow review

User request: rethink the confusing whole Story links & knowledge notes section,
using one subagent and two or three mockups consistent with approved B. This is
design exploration; no implementation or whole-phase approval is selected.

One explicitly requested read-only subagent examined the product code/contracts.
Its main finding: the section combines five author jobs. The central writing goal
is to tell the AI how to write Mara without giving her facts she has not learned.

| Current control | Purpose and actual AI behavior | Proposed home |
| --- | --- | --- |
| Knowledge & spoiler notes | Author-written prose in an explicitly selected approved card revision. Not automatic runtime knowledge. | What they know |
| Linked lore | Organises links to shared world facts. Link IDs/dependencies do not automatically include target prose or establish that Mara knows it. | Optional related world notes |
| Applies to | Whole-project, Scene or finite-route author guidance. Does not automatically include/filter the card or enforce spoilers. | Optional disclosure in A; More details in B/C |
| Related story items | General organisational links. Target content is not automatically expanded. | More details |
| Game character | Associates a card with a runnable definition; current control does not create the definition. | Game setup, consistent with agreed unified-character direction |
| Source notes/citations | Provenance and supporting saved revisions, separate from character knowledge. | More details / Sources |

Workflow: write/save character guidance; organise optional world references; when
initiating an AI writing operation, explicitly select approved card/world-note
revisions and review the request before sending. Linked lore must be chosen separately
to include its prose. No mockup initiates a provider request or promises compliance.

Primary evidence: app/src/reference-ui.ts (drawEditor, drawLoreLinks, drawEntityLinks),
app/src-core/src/prompts.rs (known_content and selected-reference assembly), and Phase 2
task section 9. The subagent performed source review, not a new native acceptance test
or external product research. Two explicitly requested design subagents cumulatively.

## Three alternatives within approved B

| Option | Design | Tradeoff |
| --- | --- | --- |
| A — One writing note | One prose field, compact optional lore and applicability disclosures. | Least instruction; optional settings still share the page. |
| B — Guided questions | Three concrete question/example prompts above one prose field; optional lore below, applicability in More details. | More on-screen guidance; directly addresses uncertainty about what to write. |
| C — Notes and references | Small content-view switch separates Mara's notes from world-reference organisation; applicability in More details. | Most separation, but another click to inspect linked lore. |

The subagent recommends A as the simplest baseline. The owner recommends comparing B
first because the user's stated problem is uncertainty about what to enter. These were reviewer recommendations; the user subsequently chose B. B's prompts are writing guidance, not three new saved fields;
all three preserve the existing single knowledgeNotes prose concept. Keep legacy notes,
unknown data and source untouched if implementation is later selected.

All retain approved B's broad editor, horizontal topics, collapsible cast with Story
controls, persistent below-field help and fixed creation/save actions. Generated icon
shapes/portrait are illustrative. A has duplicated disclosure chevrons; implementation
must use the existing single Story disclosure affordance. Static images do not verify
keyboard behavior, responsive layout or draft preservation. Examples/counts are synthetic.

Three built-in ImageGen edits used the Relationships image as their shared visual
reference. Final PNG integrity/hashes and exact prompts are in the manifest. No new
application build, native launch, source/reference change or Studio request. The user subsequently chose B; see agreed scope below.

User prefers knowledge option **B — Guided questions**, but asks whether the notes
describe the beginning world state. Temporal meaning is unresolved; the mockup does
not specify a story point. Current implementation stores manual prose and applicability,
not initial/runtime knowledge or automatic learning. Proposed for discussion: make
starting character knowledge explicit, with later scene-specific changes separately
identified; no such temporal capability or copy is approved/implemented yet.

**Open temporal-workflow gap:** user asks how to record later discoveries and how AI
knows a character's knowledge at the current writing point. Source review confirms
current prompt assembly includes selected approved reference content and action-specific
story context, without a resolved per-character knowledge timeline. Today the author
must supply the relevant state in the request and review included reference text.
Starting knowledge alone is insufficient. Proposed for discussion only: author-reviewed
discoveries anchored before/after a Scene/Beat and conditional route/choice, assembled
into a current-point summary for request preview; ambiguity requires route selection
or clarification, with later/other-route discoveries excluded. No automatic execution,
source inference, new capability or implementation scope is approved by this proposal.

## Agreed scope — starting knowledge only

The user chooses knowledge option **B — Guided questions** and explicitly limits this
section to the character's knowledge when the story begins. Later discoveries, scene/
route-dependent knowledge and a resolved “what they know here” preview are deferred to
a future phase; no specific phase is assigned and they are not current acceptance gates.
Keep one prose field with guided questions about starting facts, unknowns and secrets.
Draft title: **Starting knowledge & secrets**. Draft helper: **Describe what this
character knows, doesn't know and keeps secret when the story begins.**
The draft copy reflects the agreed scope; no additional approval or implementation is
inferred. Existing notes must not be automatically reclassified or overwritten. Current
AI inclusion remains explicit; there is no new automatic timeline or runtime inference.
Original PNGs/prompts remain preserved; no image regeneration or product edit is selected.

**Voice walkthrough decision — simplified linked lore:** user questions the relevance
of character-to-lore linking and agrees to leave it out of the lean character-card
setup for now. Defer its visible controls/workflow; revisit later if useful. This does
not remove the Lorebook, prohibit explicit lore selection for AI requests, or authorise
deleting existing saved links. B's related-world-note block and pending helper proposal
are superseded for the lean card design. Starting knowledge remains selected. No native
field changed, image regenerated, source edited or Studio request sent.
Next review: applicability (current Applies to), which is manual whole-project/Scene/
route guidance, not runtime knowledge. Owner proposes Whole project by default with
optional applicability tucked under More details; this proposal awaits feedback.

**Voice simplification decisions:** user agrees to omit Applies to from the character-
card design and defer route-specific variants. User explicitly requests removal of the
Source notes section from this simplified UI. Preserve existing stored scope/provenance/
citations and underlying approval/freshness protections; no destructive migration or
bypass is selected. Generic links remain an unreviewed separate concern.

**Version-history review:** user asks whether all previous card versions are needed
and questions the visible Earlier saved text section. Source inspection confirms the
reference document already retains at most3 revision snapshots per record, pruning to
prior approved/current plus the new revision on save; it is not unlimited history.
Recommendation: omit the visible version dump from the main editor while retaining
bounded revision storage, AI approval and ordinary transactional Undo/Redo. Retention-
policy changes and removal of recovery are not user-authorised. Display decision pending.
Latest native observation: Earlier saved text opened by user; card has Unsaved changes,
Applies to shows Whole project. The agent did not change/save/discard any field; preserve
this draft. No app launch or provider request. Previous Saved observation is superseded.

**Agreed history direction:** user prefers a surfaced history feature with an option
to roll back to the previous card version. This supersedes the owner's suggestion to
hide history. Proposed presentation: compact **Version history**, readable preview of
previous saved content and explicit **Restore this version** action. Current Earlier
saved text only displays revisions; restoration is a functional follow-up, not existing
behavior or an authorised live rollback. Restore should use the shared transactional
change layer, preserve the card's identity, respect current unsaved-draft guards and
approval/freshness checks, and create a new current revision rather than rewind IDs or
silently delete newer data. Ordinary Undo/Redo should apply. Keep existing bounded
snapshot retention; no unlimited archive or destructive pruning change is selected.
No app/source edit, native restore, save/discard, extra image or provider send performed.
