# Characters layout comparison

## Writing and Game setup refinement, 2026-10-21

Both Characters drafts now start with prose and include an interactive Game setup
simulation. They share the same fictional Last Tram cast, fields and actions. Both
remain unapproved drafts under the existing `dossier-v1` and `board-v1` records.
The starter and the earlier approved images and written decisions are unchanged.

| Draft | Writing arrangement | Practical difference |
| --- | --- | --- |
| [Continuous dossier](http://127.0.0.1:5174/?screen=characters-writing&variant=dossier&state=populated&theme=light&viewport=wide) | Character rail, section index and a continuous prose column. | Keeps the cast visible and gives each topic a full column. The rail and index reduce writing width. |
| [Writing board](http://127.0.0.1:5174/?screen=characters-writing&variant=board&state=populated&theme=light&viewport=wide) | Character shelf, horizontal topic navigation and grouped writing cards. | Shows description and personality together at wide sizes. The shelf costs vertical space; compact sizes use one column. |

For Game setup, open [linked Mara](http://127.0.0.1:5174/?screen=characters-writing&variant=dossier&state=game-linked&theme=light&viewport=wide)
or [planning Ivo](http://127.0.0.1:5174/?screen=characters-writing&variant=board&state=game-planning&theme=dark&viewport=compact).
Every link also supports the other layout, theme and size through the lab controls.
The five earlier states remain available. The two Game states make the new journeys
reachable without repeating character selection.

### Writing controls and why they stay

The main loop is select a character, write, then save. Existing cards open at
Description. Name, aliases and tags moved to Card details because writers change
those less often than prose. A new unnamed character opens with a Name field before
the prose; Card details becomes available after the first save. All writing fields
keep persistent help. No field or stored metadata was deleted.

| Control | Purpose and retained behaviour |
| --- | --- |
| Character search and list/shelf | Find a character by name or notes, see In game/Planning only/No writing yet/Proposed/Unsaved states, and switch without replacing another character's draft. |
| New character | Start an empty planning card, clear search and focus the editor. It invents no description or game definition. |
| Character and project panel icons | Reclaim writing space using the app's existing icons. Collapse/reopen transfers focus. Compact character selection closes its overlay. |
| Writing/Game setup | Keep prose and runnable definitions distinct while retaining drafts across tabs and characters. Neither tab applies the other's edits. |
| Card details | Edit the card name, aliases and tags with persistent help. Done returns to writing; Save/Discard still owns the changes. Proposed cards keep these controls read-only. Hidden metadata receives the same byte/name validation. |
| Section links and collapse buttons | Jump to a topic with heading focus, or shorten a long document. Character drafts retain caret, scroll and collapsed topics. Textareas grow; the writing scroller carries long text. |
| Description, appearance notes and background | Write who the character is, what the prose should describe and what shaped them. Appearance notes never change image assets. |
| Personality, motivations, speaking style and example dialogue | Give the writer separate places for behaviour, intent and voice. The board groups these beside the overview rather than adding new saved fields. |
| Relationships | Add, edit or remove named entries with one row open. Relationship with keeps its approved help. Existing lore/missing targets remain selectable and survive sample saves. Entries share the card's Save/Discard. |
| Starting knowledge & secrets | Keep one starting-only prose field with the guided questions. This adds no learning timeline, runtime scores or later-discovery fields. |
| Save/Discard | Keep the Writing actions at the lower edge while prose scrolls. Save shows progress, validates hidden details and retains drafts after failure. Discard names the current draft and confirms before resetting it. |
| Version history | Keep a quiet header entry, readable whole-card previews and explicit Restore this version. Restore creates a new sample version, retains the game association and refuses current unsaved writing or game edits. |
| Undo/Redo and Reload library | Travel through saved sample changes, including game settings and associations. Unsaved drafts disable travel. Reload retains drafts. |
| Proposal comparison and Approve/Reject | Keep proposed writing read-only until a deliberate decision. Card approval here affects fictional content only; it never approves a layout. |

The inclusion note appears once. Existing links, scope and provenance stay outside
the simplified writing controls and survive clone-based sample saves/restores.
The shared frame supplies every project destination, bottom Settings and the browser
Studio/Runtime links. Leaving with unsaved writing or game setup opens the sample
navigation guard. Keep editing returns to the current draft.

### Game setup controls and why they stay

Linked characters open at dialogue settings and illustrated appearance placeholders.
Planning characters open at creating a game identity, with linking as a secondary
alternative. Technical names and source definitions remain secondary; source review
becomes explicit before creation or linking. The Game action row occupies the same
lower edge as Writing's actions. Its feedback stays outside the scrolling content.

| Control | Purpose and simulated result |
| --- | --- |
| Display name and Dialogue colour | Preview the name above a fictional dialogue line. The game name stays separate from the writing-card name. Save game settings applies only this character's game draft. |
| Appearance selection | Preview a fictional coat, scarf or uniform illustration and show its expression/default state. It never opens private media. |
| Set default | Change which saved appearance starts selected, then save with the other game settings. |
| Edit appearance | Change the expression token and replace its illustration with a sample. Unique-token validation keeps the dialog open on error. Cancel leaves the game draft unchanged. |
| Add appearance | Choose a fictional sample and a unique expression. The first appearance becomes the default; later additions retain the existing default. |
| Save game settings/Discard game edits | Apply or explicitly reset the linked character's game draft. Save failures retain entered values and show feedback. Neither action changes writing drafts. |
| Game source definition | Reveal the fixed Ren'Py variable, saved identity and fictional declaration without putting source code before the dialogue/appearance controls. |
| Ren'Py name | Supply the fixed variable required for a new definition. Validation rejects empty, malformed and duplicate names. |
| Review game character source | Refuse dirty writing, validate game fields, then open the proposed fictional declaration. Back to setup preserves the fields. Create game character in sample is a separate apply action after review. |
| Link an existing game character | Choose an unlinked saved identity. Review character link shows that identity, its source revision and existing definition before Link character in sample. The writing-card identity and prose remain intact. The old game-only row no longer appears twice. |
| Discard setup draft | Reset unsaved planning setup fields with confirmation while retaining the writing card. |
| Apply failure | Keep the source-review dialog and entered setup after a simulated failure. No game association changes. |

Theo is the available unlinked saved identity in this fixture. Linking Elsie's card
to Theo in the check deliberately proves that names do not merge identities. This
is a test of explicit association, not a proposed story relationship. Both layouts
use the same identities and fixture content.

### Impact and simulation limits

A writer reaches editable prose before name/alias/tag administration. Saved cards
and new cards have different entry needs, so new cards ask for a name once. Writing
and Game setup retain separate drafts and use different save labels. Appearance
and source work no longer depend on context-only disabled buttons.

For the next maintainer, both layouts still share one writing controller, fixture
and interaction check. `game.ts` owns the sample game draft, validation and review
flow. The production renderer, transaction layer and native bridge are untouched.
The lab imports production typography, theme tokens and icons, plus the same sample
frame used by sibling pages. No new package, artwork dependency or generated raster
asset was added.

All content starts fresh on mount and stays in browser memory. Fictional source
review, associations, saves, appearance selection, history and errors prove sample
interaction only. There is no file input, native picker, private project/media read,
provider/model/credential call, SDK execution or real source operation. The protected
native Loomlight window and its retained draft were not touched. Durable saves,
source transactions, native media decoding and production identity mapping still
need later implementation and acceptance under ADR 0017. No approval was promoted,
no commit/push occurred and earlier design authority remains intact.

### Refinement check history

Chosen host: the local Mac with the repository's pinned Node 24.19.0/npm 11.9.0.
One initial page cycle and two focused repair cycles are used. CI, packaging and
native execution stay outside this browser task.

1. TypeScript caught an optional tuple value in the new game module; preparation
   fixed it. A sandboxed Chromium launch then failed on its macOS Mach-port check,
   before any browser case. The report is retained as
   `report-refinement-launch-blocked.json`.
2. The authorized initial browser run passed all 56 matrix cases. Its journey
   stopped on a test helper that clicked the hidden character-list restore button
   unconditionally. `report-refinement-initial-failed.json` preserves that failure.
3. Repair 1 corrected the helper. All 56 cases passed again; the journey found a
   real duplicate Name input when clearing an existing name and reopening details
   for validation. `report-refinement-repair-1-failed.json` preserves the failure.
4. Repair 2 separated new-card naming from existing-card metadata validation and
   moved the board toolbar into the page heading. The final page run passed all
   56 cases and both full journeys on Chromium 155.0.8059.85, with no browser errors.
   `report.json` records that pass. The matrix covers two layouts, seven states,
   both themes and 1100×720 / 560×640 viewports.
5. Visual review then found a scarf illustration class collision and game feedback
   outside the visible scrolled area. Review fixes renamed the illustration
   variants, moved Game actions/feedback outside its scroller and hid Writing's
   disabled actions while Game setup is open. The same review fixed tab scroll
   retention, proposed metadata read-only state and hidden metadata byte checks.
   TypeScript passes after those changes. Root's combined check on 2026-10-21
   confirms the added focus/visibility and Game capture assertions. All 56
   Characters cases and both complete journeys pass after these edits. The
   page-owned allowance is closed; its earlier report remains a separate result.

The completed journeys cover independent writing drafts/caret/scroll, list/project
collapse, tabs, save/discard/validation/errors, history/restore/Undo/Redo/reload,
relationships and retained legacy targets, guided knowledge, new/game-only/planning
characters, search and proposal decisions. Game journeys cover retained dialogue
settings, navigation cancellation, default/add/edit/preview, validation, save/discard,
Undo/Redo, guarded creation, explicit create/link review and retained apply failure.

Temporary reports and captures live under ignored
`.toolchains/design-lab/pages/characters-writing/`. Visual review inspected both
layouts in light/dark and wide/compact, the writing error/knowledge/history/relationship/
proposal captures, linked/planning Game setup and create/link/error review states.
The root integration check refreshed final Game captures after the last review
fixes. Parent visual review covered linked/planning setup, source review and compact
retained failure with visible actions/feedback. These remain temporary review outputs,
not retained approval captures. The full-app report is `.toolchains/design-lab/report.json`.

## Original draft notes, 2026-10-19 (historical)

Two runnable drafts, prepared 2026-10-19. Neither has design approval. The earlier
focused editor's image and written approvals remain intact. The user requested
fresh layout alternatives using the same fictional content and capabilities.

| Draft | Arrangement | Practical tradeoff |
| --- | --- | --- |
| [Continuous dossier](http://127.0.0.1:5174/?screen=characters-writing&variant=dossier&state=populated&theme=light&viewport=wide) | Vertical character rail, section index and one continuous writing column. | Gives prose more width and keeps the character list visible. The rail and index use horizontal space. |
| [Writing board](http://127.0.0.1:5174/?screen=characters-writing&variant=board&state=populated&theme=light&viewport=wide) | Horizontal character shelf and writing cards in two columns, with compact header controls. | Lets the writer see different topics together. The shelf uses vertical space; columns become one below 1051 CSS pixels. |

Both use the production Paper/Teal and Charcoal/Copper styles, fonts and icon import.
The lab controls switch theme, sample state and viewport. A direct preview supports
manual resizing. At compact widths the character picker opens over the editor and
closes after selection. Its existing panel icons transfer focus when it collapses
or reopens. Pane state lasts for the mounted sample; Reset and scenario/layout changes
start a fresh document.

## Shared content and interactions

Both drafts mount fresh copies of the same Last Tram fixture. Mara is linked to a
game character, Ivo and Elsie are planning-only, and Theo is in game with no invented
writing. Samples cover populated, empty, long, save-error and proposed cards.

- Search characters, switch among them, create a fictional character and retain
  separate unsaved drafts. Switching restores field selection and writing scroll;
  section navigation focuses its heading. Collapsing panels preserves draft values.
- Edit name, aliases, tags, description, appearance notes, background, personality,
  motivations, speaking style and example dialogue. Textareas grow with prose;
  the writing area scrolls while Save and Discard stay available.
- Jump to or collapse writing sections. Persistent help sits beneath each input.
  The local field-help snapshot follows
  [the approved copy](../character-workspace-2026-10-15/b-field-help.json) and is inside
  the lab's source fingerprint. The inclusion note appears once per editor.
- Add, edit and remove relationships through compact named rows, with one row open.
  A fictional legacy lore target remains selectable and survives sample saves.
  Relationships share the card's Save/Discard workflow.
- Edit one starting-knowledge prose field with the agreed guided questions. There
  is no later-discovery timeline or runtime knowledge state.
- Simulate Save, progress, validation, retained save failures and confirmed Discard.
  Reload retains drafts. Undo/Redo operate on saved sample changes and stay disabled
  while any character has unsaved writing.
- Preview recent saved cards in a modal and explicitly restore a whole card as a
  new sample version. Dirty drafts block restore; the current game association stays
  intact. The modal supports Escape, contained keyboard focus and return focus.
  Proposed-card samples provide a read-only comparison and simulated approval/rejection.
- Open the Writing/Game setup tabs without losing writing. The latter shows the
  existing association or planning-only linking/source-review context. Its source
  actions are disabled and no source editor or native operation runs.

Hidden scope, links and provenance remain outside the writing controls. Fictional
retained metadata survives clone-based sample saves and restores. This demonstrates
the intended UI boundary; it does not prove production data preservation.

## Review boundaries and evidence

These drafts replace the focused topic-at-a-time arrangement only inside their own
previews. The dossier adds a section index. The board relocates character selection
above the editor and groups writing in columns. Both add optional section collapse.
No existing approved reference is superseded. Card approval in the proposed sample
is fictional and does not approve either layout.

All saves, history, restore, proposal decisions, Undo/Redo and reload use browser memory.
Reloading the document resets the sample. Other project destinations are disabled.
There are no real project, provider, asset, source or persistence operations.

The [owning task](../../tasks/active/browser-ui-design-lab.md#two-characters-writing-drafts-2026-10-19)
records the allowance, failures, fixes and final evidence. Local Design Lab checks pass
56 rendering cases, including 40 cases for these drafts, and six check groups. The
interaction check runs the same journey against both layouts. Screenshots and the
report are ignored under `.toolchains/design-lab/`; they are temporary review outputs,
not retained approval captures. [approval.json](approval.json) keeps both approvals
and the current-approved pointer null. Source pinning and retained captures follow
[the integration procedure](../../../app/design-lab/INTEGRATION.md) only after selection.
