# Character workspace concepts — 2026-10-15

Status: **All walkthrough feedback consolidated; updated knowledge/history mockups awaiting visual approval**.

The [consolidated walkthrough decision record](walkthrough-decisions.md) owns the current
settings, unified-character, B-layout, relationship, starting-knowledge, removal/deferral
and version-restore decisions. It supersedes conflicting details in the historical
exploration below. [Current approval previews](walkthrough-decisions.md#updated-approval-previews)
show starting knowledge only and a compact version-history/restore dialog.

No application implementation, source/reference mutation, new app launch or Studio
request. Latest native observation shows an unsaved Mara draft; preserve it. The agent
has not saved/discarded the card. Design approval does not establish phase acceptance.

The user dislikes the current hierarchy, layout shifts and inconsistent creation
placement. Relationships feel cluttered; Story links & knowledge notes is unclear.
Essentials lead in every concept. Relationships become concise summaries with editing
on demand, while knowledge/lore/applicability receive separate plain labels. One cast
list, explicit Planning only/In game state, Create game character/Link existing paths,
consistent creation position and stable save actions remain shared requirements.

| Concept | Image | Why compare it | Tradeoff |
| --- | --- | --- | --- |
| A — Character notebook | [Full image](a-character-notebook.png) | Direct prose, essentials visible together, optional details in a quiet rail. Owner's suggested starting point for writing comfort. | Long notes still need document navigation; generated serif headings are illustrative, not a new accepted font system. |
| B — Focused section editor | [Full image](b-section-editor.png) | Choose a topic, then edit just that topic. Explicit section navigation separates writing from relationships and knowledge. | More navigation/panels; compact behavior needs design and verification. |
| C — Visual character overview | [Full image](c-character-overview.png) | Fixed grid summarizes identity, motivations, voice and relationships at a glance, with optional reference imagery. | More visual framing and less room for long prose. Portraits are illustrative; reference-image functionality is not separately selected by this mockup. |

Images are each1586×992. Owner inspected all three; C received one targeted refinement
to restore Writing/Game setup, remove Edit-unlock actions, quiet game-creation actions
and anchor New character independently of game status. Three initial generations plus
one refinement were used. Preserve the implementation's ordinary direct editing and
source/refusal/approval behavior; generated UI details are not authoritative contracts.
Static mockups cannot prove stable switching, keyboard use, draft retention or native
responsive behavior. Both accepted themes remain required if implementation is selected.

## Refined B — more room for writing

The user prefers B and requests helpers under every card text field, a collapsible
character list, and more editor space. These refinements are proposed, not implemented.

| State | Image | Intended behavior |
| --- | --- | --- |
| Expanded character list | [B refined — expanded](b-refined-expanded-v2.png) | Slim cast list has Hide characters. Topics move above the editor, the right inspector is removed, and game-link settings remain under Game setup. |
| Focused writing | [B refined — focus](b-refined-focus-v2.png) | Character list is hidden and app navigation becomes icons. Show characters and Exit focus provide visible restore paths. The selected name, topic, text/help and save controls remain reachable. |

**User refinement — reuse Story controls:** the user prefers the wider B and directs
that collapse/expand match the Story page. Use the same panel-icon controls, placement,
visible restore affordance, focus transfer and remembered panel state as Story's scene
list and existing application navigation. Replace the mockups' bespoke Hide characters /
Show characters buttons with that shared pattern; a separate Focus writing / Exit focus
control is not required just to hide the cast list. The two images illustrate space,
not final collapse-button design. Selection, draft and editor position survive toggling.
This is an agreed interaction refinement, not an application implementation.

Ordinary cast-list collapse should preserve the user's selection/draft and remember
the layout choice. The mockup's optional Focus action is superseded for ordinary collapse by the shared
Story panel toggles; switching topics/characters must not unexpectedly toggle panels. At compact widths, topic navigation can become one labelled
selector instead of reintroducing a sidebar. This is a behavioral design requirement,
not something the generated screenshots prove.

Persistent helper text sits immediately below each card writing field, separate from
placeholder text and errors. [Draft helper copy](b-field-help.json) covers other fields.
For the visible fields:

- Personality: describe traits, habits and reactions; concrete examples help the AI
  keep behavior consistent.
- Motivations: state what they want and why it matters; this helps give their choices
  a clear reason.

One note explains that the AI uses a card only when included in a request. Help must
not suggest automatic sends, guaranteed model compliance or automatic tracking of what
a character knows. No AI/provider operation was initiated for these examples.

Built-in ImageGen used three B-refinement calls: expanded draft, one targeted creation-
button correction, and focus state. Cumulative design calls7 (original3, C correction1,
B refinement3); researcher count remains1. Owner visually reviewed both final1586×992
outputs; no native app, fixture draft or source change. Earlier A/B/C images remain
preserved. Static examples do not prove compact wrapping, keyboard use or no layout shift.

Exact prompts: [expanded](b-refined-expanded.txt), [header correction](b-refined-expanded-header-fix.txt),
[focus](b-refined-focus.txt). Next: user review of width, collapse controls and helper text.

## Relationships — refined B

The user agreed the compact entry direction and requested an ImageGen mockup.
[Relationships mockup](b-relationships-v1.png) shows named summary rows and one open
editor: choose the other character, then describe how Mara feels and acts toward them.
A persistent helper sits below the text box. Add relationship is explicit; the ordinary
workspace Save/Discard footer owns the draft. There is no extra relationship sidebar.
The examples are invented illustration, not project edits or runtime relationship state.

The cast list is collapsed for writing room. Generated panel icons are illustrative;
implementation must reuse Story's actual controls and accessible behavior. The retained
portrait is illustrative, not a new requirement. One built-in ImageGen edit used the
previous B focus image; [exact prompt](b-relationships-v1.txt). Owner inspected the
1586×992 output and verified PNG integrity/hash. Cumulative calls8, researcher1.
User finds the layout clear and approves this copy amendment: replace “Other character”
with **Relationship with**, with persistent helper **Choose who these notes are about.**
The PNG and original prompt remain unchanged historical design evidence; this amendment
and the helper-copy record own the approved wording. Relationship notes describe the
selected card character's perspective toward the chosen person. No new image call,
source change, native relaunch or Studio request. Next: review What they know.

## Knowledge workflow alternatives

The user finds the entire section messy and asks for its goals/AI workflow to be
rethought, with a subagent and 2–3 mockups fitting approved B. The
[workflow review](knowledge-workflow-review.md) separates character writing guidance,
world references, applicability, game setup and general links. Linking lore does not
automatically send its text or give the character that knowledge.

| Option | Final mockup | Exact prompt | Main difference |
| --- | --- | --- | --- |
| A — One writing note | [Image](knowledge-a-single-note-v1.png) | [Prompt](knowledge-a-single-note-v1.txt) | One broad note; optional lore and scene guidance collapsed below. |
| B — Guided questions | [Image](knowledge-b-guided-prompts-v1.png) | [Prompt](knowledge-b-guided-prompts-v1.txt) | Concrete questions/examples guide one note; scene guidance moves to More details. |
| C — Notes and references | [Image](knowledge-c-separate-views-v1.png) | [Prompt](knowledge-c-separate-views-v1.txt) | Personal notes and world-reference organisation have separate content views. |

All three are built-in ImageGen edits, visually inspected, 1586×992; PNG CRC/hash checks
passed. Three calls, cumulative11; subagents cumulative2. No extra native operations.
A's duplicated disclosure chevrons and all generated panel icons are illustrative;
reuse the shared Story controls. The owner favors B for clearer writing guidance;
the subagent favors A's simplicity. User now prefers B; temporal meaning remains open. Notes are manual
AI-writing guidance, not automatically tracked game state. Saving does not send them.


User prefers knowledge option **B — Guided questions**, but asks whether the notes
describe the beginning world state. Temporal meaning is unresolved; the mockup does
not specify a story point. Current implementation stores manual prose and applicability,
not initial/runtime knowledge or automatic learning. Proposed for discussion: make
starting character knowledge explicit, with later scene-specific changes separately
identified; no such temporal capability or copy is approved/implemented yet.


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

## Research and design interpretation

- [Novelcrafter: Anatomy of a Codex Entry](https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry)
  documents a constant identity header and changing tab contents, with a freeform
  description and optional details. This informs stable identity and progressive disclosure.
- [Scrivener: Advanced Character Sketch Templates](https://www.literatureandlatte.com/blog/using-advanced-character-sketch-templates-in-scrivener)
  documents prose sketches and nested character documents. This informs A's notebook.
- [World Anvil: Character Template](https://www.worldanvil.com/learn/article-templates/character)
  starts with free writing and offers optional structured prompts. This informs essentials-first editing.
- [Campfire: Characters Tutorial](https://www.campfirewriting.com/learn/characters-tutorial)
  documents discrete character panels. This informs grouped, bounded overview sections.
- [Milanote: Character Profile](https://milanote.com/templates/creative-writing/character-profile)
  demonstrates visual arrangements of notes and reference images. This informs C's
  overview; its fixed grid is our adaptation, not copied product behavior.

Research used official public pages and documented interface examples, not logged-in
product testing. The three arrangements and their expected benefits are design
inferences. No other product's exact interface or branding is copied.

## Reproduction and review

- [A prompt](a-character-notebook.txt)
- [B prompt](b-section-editor.txt)
- [C initial prompt](c-character-overview.txt) and [targeted refinement](c-character-overview-refinement.txt)
- [Research records](research.json) and [image hashes/review manifest](manifest.json)

Next: choose a knowledge-workflow direction. Record the user's decision
before selecting any implementation scope, budget or replacement app build. All earlier
walkthrough feedback and the unreviewed unsaved-profile request preview remain open.
