# UI checkpoint

## Accepted redesign direction — 2026-09-29

The [UI design review and implementation plan](tasks/active/ui-design-review.md)
records the user-accepted replacement designs for the workspace, Settings, Welcome
and creation wizard. They supersede the initial dark/indigo palette below: Dark uses
warm charcoal/copper, Light uses paper/deep teal, with Follow system as the default.
Game preview colours remain independent. The redesign also requires optional
inspectors, remembered panel layout, truthful operation progress and status feedback
that does not move editing content. Settings is available without an open project.

The user authorized implementation on 2026-09-30. The implementation now includes
both palettes, a stable shell/footer, Settings, onboarding progress and the redesigned
workspaces. Qualification status and exact tested inputs belong in CURRENT/HANDOVER
and the linked task; implementation does not imply final native/human acceptance.

### Implemented refresh behaviour

- Settings separates Application from Current project. Wide windows use labelled
  categories; narrow windows use a category dropdown. Theme, interface size, Source
  size and remembered/reset layouts save in device-local preferences. Current project
  shows pinned version/resolution and links to the existing SDK/trust controls.
- The shell keeps Save, Validate, Run and Stop available. Longer runtime state and
  diagnostics live in an optional drawer. Fixed footer and Source-warning regions
  preserve editor geometry; routine saving/loading labels are coalesced. Dirty Source
  says **Unsaved Source draft**, not that validation is repeatedly running.
- Welcome includes recent-project search, last-opened dates and remove-from-recents.
  The four-step wizard preserves folder name, custom resolution and optional Git's
  existing default. SDK downloads show measured bytes/percentage only when total size
  is known; creation shows actual stages. Failure retains inputs, and a created project
  that could not open gets an Open action rather than another Create action.
- Story uses a letterboxed preview above Beats, a keyboard/pointer divider, optional
  context and writing-focus mode. Dialogue commits on Cmd/Ctrl+Enter; Shift with that
  shortcut commits and continues. Navigation settles pending dialogue through the
  existing transaction path; IME composition and failed commits preserve input.
- Source uses bundled CodeMirror with tabs, Ren'Py highlighting and current-file
  find/replace. Closing a tab retains its session draft. Selection, mixed newline bytes,
  grouped undo/redo and explicit Save remain owned by the existing Source controller.
- Characters and Assets provide filterable grid/list cards and optional details;
  Variables provides a table and known Set Variable Beat assignments. No general
  source-reference index or new variable type/rename semantics are implied.
- Native multiple-file selection/drop stages each file's kind and metadata. Imports
  use existing grants/transactions sequentially; failed rows remain and successful
  files are not retried. Leaving unsubmitted catalogue forms/staging asks whether to
  retain editing or discard those inputs. Already-started operations retain existing
  session/generation completion rules. New Assets audio preview stays disabled;
  existing explicit Story audition remains available.

### Hands-on review corrections — 2026-10-02

Implementation status: the [chat-to-implementation audit](tasks/active/ui-design-review.md#chat-to-implementation-audit--2026-10-02)
identified nine gaps, corrected in the 2026-10-03 source continuation. Choice fields
stack at compact widths with a separate grouped action row. Discard resets the full
Variable form, its dependent controls and persistence status. Selected appearance
identity survives edits, default changes and view restoration; previously generated
aliases can be reused only while their exact owned declarations remain intact.
Sidebar controls expose initial/updated panel state and transfer focus on hide/restore.
The preview divider shares one allocation update for pointer, keyboard and reset.
Beat creation disables duplicate submission/dismissal while pending, restores input
after failure, and reveals/focuses the saved collapsed row. Media shows loading,
bounded read-error detail and explicit retry. Beat grips use captured pointer gestures,
with cancellation and protected-boundary checks, while native OS asset-drop ownership
remains enabled. Local verification does not establish native acceptance; the user
explicitly deferred [Windows testing](tasks/active/ui-design-review.md#deferred-windows-review-checklist--2026-10-03).

Source keyboard Save retains the typing caret/focus after its temporary write
barrier is released, so typing can continue without clicking the editor again.

The CONFIG-01 resolution select uses a rendered 48-pixel height and 16-pixel text,
with a theme-aware chevron while retaining native option/keyboard semantics.
The resolution block shows dimensions and their reduced aspect ratio with
the caption “Game resolution, not editor size.” Valid previews preserve proportions
within 100 × 64 logical pixels, including portrait resolutions. Empty or invalid
Custom input shows guidance without a shape or ratio; preview and Continue share
the existing even-dimension limits. Native/visual acceptance remains in the task ledger.

- Welcome distinguishes the introduction from Recent Projects; available projects
  have a hover/focus treatment. Settings has a cog and a button hover treatment.
  Wizard steps fill the rail, SDK selection says **Select existing SDK…**, resolution
  uses a readable 48-pixel picker with aspect preview, and Git has an inline checkbox.
- Main navigation has its own top icon toggle and a 64-pixel collapsed rail. The
  Scene/file list has independent hide/restore controls. Both header controls fit
  their existing panel widths at 32px, with left arrows when expanded and right arrows
  for reopening. The restore control has a reserved slot beside the editor heading/
  Source tabs, and never covers their text. Collapsed Settings uses a labelled cog.
  Expanded navigation keeps a 12px icon-to-label gap on every surface, including
  compact Story/Source layouts; collapsed links and panel controls keep zero icon margin.
  Chapter disclosure keeps
  the selected Scene and its editing state. Writing focus hides both sidebars,
  preview and context; exiting restores the previous panel choices.
- New Beats save when confirmed once, returning a collapsed row. Choice creation
  uses a compact action and fields below the editor. The redundant Preview size
  slider is removed; the accessible preview divider and saved/reset allocation remain.
  Beat grips reorder supported non-terminal rows in one transaction/Undo; keyboard
  arrows remain available. Protected regions, pending drafts and stale source refuse.
- Source groups filename, draft marker and Close in one tab. Overflow exposes scroll
  controls and an Open files chooser; opening selects and reveals the active tab and
  corresponding file row. Close continues to retain the session draft.
- Branches ignores indented screen-language label controls when finding story labels.
  Saved literal choices and project entry retain their actual routes. Custom/dynamic
  source stays uncertain. The details popup has a Close X, Escape and focus return.
- Runtime has a sticky header and visible Close X. Diagnostics, output, launch details
  and advanced SDK/trust controls expand on demand. A reported runtime error remains
  visible even when Ren’Py exits zero; closing the drawer does not stop the process.
- Characters, Assets and Variables use whole-card/row selection, inspector Close X,
  and consistent create/edit modals with guarded Cancel/Escape and focus return.
  Character rows have thumbnails and direct Edit. Appearances can be selected for
  preview and edited by expression and/or replacement image; preview selection does
  not change the default. Ordered media reads, cache reuse and Retry preview address
  the initial inspector/default-refresh failure.
  Character grid and list layouts share a summary block; image and initial-letter
  placeholders occupy the same list column. Variable names, types, initial values
  and Edit actions share the table header's four columns, including compact windows.
- Assets always shows All, Backgrounds, Character images, Music and Sound effects,
  plus a visible Drop/Browse area. Native drag state highlights that area; Drop and
  Browse enter the same staged import modal and require confirmation before writing.
  Native file-drop acceptance is still separate from browser fixture checks.
  After selection, the initial Choose files section is replaced by a preview of
  each staged image, its dimensions/size and import fields. Add files remains a
  smaller action; removing/discarding all staged files restores the empty chooser.
  Preview loading/errors/Retry do not import anything. Audio shows file information;
  passive raster limits apply. Closing/discarding releases preview URLs.
- Technical-name inputs across all three libraries suppress OS capitalization,
  correction and spelling, and canonicalize uppercase ASCII at blur/submission
  without changing display names or text values. Focusable naming guidance explains
  Loomlight's lowercase, letter-first, 64-character contract and descriptive names.

Qualification and remaining native/human review are recorded in CURRENT/HANDOVER;
these corrections have not yet been delivered as a replacement installer.

## Accepted UI/UX guidelines for implementation agents

The user accepted these cross-workspace guidelines and the plain-language/validation
refinements on 2026-10-03. They extend Quiet Studio and the latest written interaction
decisions; they do not select an application implementation or reopen Phase 1 acceptance.
Read this section before designing Phase 2/3 controls. Use accepted decisions and
corrections over illustrative generated details or older layout descriptions below.

1. **Preserve the visual identity.** Use paper/teal and charcoal/copper, system fonts,
   restrained borders and modest corners. Reuse shared semantic tokens and controls.
   Story content, selected Beats and game artwork take priority over shell decoration.
2. **Keep workspaces familiar.** Keep navigation on the left, authoring in the centre,
   optional properties on the right and diagnostics below where appropriate. Preserve
   selection, scroll position and remembered panel layout across tools. Expand advanced
   details on demand; do not duplicate global Save/Run/status controls in every panel.
3. **Make selection explicit.** Highlight the selected item and identify its name/type
   in the inspector. Synchronize canvas/hierarchy selection for the same object; keep
   keyboard focus distinct from selection. Previewing an appearance does not change
   its default. An inspector must never silently edit a previously selected item.
4. **Make commitment clear.** Use inline editing for frequent writing and bounded dialogs
   for catalogue creation/editing. Distinguish draft, applied and saved states using the
   existing editor contracts. Navigation and failed submissions preserve unfinished work.
   Label fields, group related controls, show units and place errors beside their fields.
5. **One meaningful action, one coherent Undo.** A character drag/resize, Beat move or
   accepted proposal uses one transaction/history path. Name undo actions where useful
   and reveal or identify the affected item. Escape cancels an unfinished gesture;
   continuous feedback is not a separate source commit per pointer movement.
6. **Provide alternatives to dragging.** Offer numeric position/scale/time fields,
   clickable move commands and keyboard controls. Make grips and handles easy to hit.
   The operation must work both with keyboard input and with clicks without dragging.
7. **Keep Assist understandable.** Preserve preparation, explicit generation, review
   and application. Show target, references, effective prompt and limits before sending;
   show changes before acceptance. Generated references never approve themselves.
   Applying a proposal is undoable and is not a validation pass. Use the existing
   operation-group/editability rules rather than inventing an unrestricted patch editor.
8. **Report factual state without disturbing authoring.** Distinguish saved work,
   unsaved drafts, generation, validation failure and stale previews. Keep status regions
   stable. Percentages require measured progress. Label partial embedded previews and
   provide deliberate Ren'Py playback; a browser rendering is not native runtime proof.
9. **Interrupt in proportion to loss.** Keep routine undoable editing quick. Confirm
   actual draft loss or irreversible consequences with specific action labels. Dialogs
   have a visible Close/Cancel route, guarded Escape and focus return. Respect in-flight
   write ownership; cancellation must not imply a started write has been rolled back.
10. **Adapt without shrinking everything.** Collapse secondary panels before squeezing
    the main editor. Stack forms/comparisons at compact widths; keep actions reachable.
    Maintain visible focus, readable text, both themes and user text/interface sizing.
    Pair colour with text/shape, use keyboard-accessible semantics and respect reduced
    motion. Keep horizontal scrolling local to content that needs it, such as Source.
11. **Use straightforward language.** Write short, concrete labels and messages in
    familiar authoring terms. Reduce implementation jargon; expose necessary Ren'Py
    terms with plain explanations and optional deeper help. Keep terminology consistent.
    Do not hide information needed to make a decision in a tooltip.
12. **Validate after field completion and again on submission.** Check applicable
    formats, names, required values, types and ranges when a user finishes a field;
    recheck all submitted values before writing or sending. Explain the correction,
    preserve input and avoid interrupting typing. The detailed contract below applies.

### Interface language and help

Use action labels that describe the result: **Move to scene**, **Apply changes** or
**Discard changes**, rather than internal vocabulary or ambiguous Yes/No buttons.
Explain failures as what went wrong and what the author can do next. For example,
“Enter a whole number from 1 to 60” is preferable to “Invalid scalar”; “This preview
cannot show this animation. Preview in Ren'Py” is clearer than a compositor error.

Preserve precision where it matters. Technical-name fields still distinguish the name
used in Ren'Py from a display name; dimensions show pixels, durations show seconds and
LLM limits show tokens. A label such as **Maximum response length (tokens)** needs a
short explanation of tokens. Keep **System prompt** with an explanation of its role.
Do not relabel technical concepts so broadly that authors mistake scale for size,
preview zoom for game resolution or applying changes for saving/validation.

Tooltips or a labelled help affordance can explain anchors, ATL, Ren'Py naming
conventions and other optional technical detail. Make help available on keyboard focus
as well as hover, with a discoverable access route for icon-only controls. Longer or
interactive explanations belong in expandable help. Required syntax, units, constraints
and error recovery remain visible beside the field; placeholders are not labels.
Keep credentials and raw internal exception dumps out of routine copy. Show relevant
project/file paths where they help identify the target; keep unrelated machine detail
in bounded diagnostics rather than requiring it to understand an ordinary error.

### Input validation timing and recovery

- **Before interaction:** show persistent labels, required/optional status, units and
  useful examples/rules. Do not mark untouched empty fields erroneous on opening.
- **While typing:** allow incomplete values. Do not show new format errors on every
  keystroke, steal focus, rewrite user text or validate during IME composition. If an
  error is already shown, update/clear it as the correction becomes valid. Cheap
  nonintrusive feedback may update, but inactivity alone does not prove a complete
  identifier, number or multiline statement.
- **On field completion:** validate text/numeric fields on blur and on an explicit
  field commit where the editor has one. Validate discrete selections/file choices
  when selected. Enter only commits where it already does; ordinary Enter in multiline
  text continues to insert a newline. Run normal name/format checks at these boundaries.
- **On submission:** revalidate the whole form, including untouched fields and dependent
  values, regardless of prior results. Invalid input performs no write/provider send;
  preserve every field, identify the errors and focus the first invalid field. A summary
  can link multiple errors. Do not rely only on a disabled button to explain invalidity.
- **Error presentation:** use text beside the affected field with accessible association
  and invalid state. Say the expected format/range and show a useful example. Announce
  meaningful error transitions without repeatedly announcing each typed character.
- **Shared rules:** use the existing authoritative validators and consistent UI checks,
  not divergent per-workspace definitions. Submit still goes through core validation,
  source/revision checks and the existing transaction contract. Client checks do not
  establish current source ownership, file availability or runtime compatibility.
- **Asynchronous checks:** bind any necessary result to the current value/session and
  ignore stale replies. Show checking/unavailable separately from invalid. Routine
  field validation never initiates LLM sends, model loading or project execution;
  existing explicit connection/native test controls retain their own boundaries.
- **Preserve meaning:** apply only established, documented normalization. Do not silently
  truncate, change prose, repair source syntax or coerce an invalid number to a fallback.
  Name checks apply to technical identifiers, not dialogue or lore prose. Source edits
  retain the lossless-source and unsupported-region contract.

### Shared ownership and proportionate review

The owner maintains shared tokens and interaction conventions for buttons, fields,
selection, inspectors, dialogs, draft handling, validation and status. Both lanes reuse
those patterns; extend existing helpers when needed rather than creating independent
forms/validation systems. Inspect the accepted baseline at implementation entry.

For the changed surface, review representative content in both themes and wide/compact
layouts; keyboard/focus, text scaling, selection retention and relevant empty, busy,
error/stale states. Exercise one action through undo/cancel and failed submission.
For field changes, check untouched/incomplete input, blur, invalid submission,
correction/resubmission and applicable IME/dependent/asynchronous cases. Verify no
mutation occurs on refusal and values survive. Canvas changes need actual Ren'Py
comparison for their declared behavior. Use existing task-ledger and changed-scope
gates; these guidelines add no blanket package matrix, certification or approval flow.

Research supports the interaction recommendations; the specific Loomlight controls
and commitments above are accepted product decisions. Useful primary references:
[Microsoft forms](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/forms),
[WAI tree focus/selection](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/),
[Apple undo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo),
[Apple alerts](https://developer.apple.com/design/human-interface-guidelines/alerts),
[WCAG non-drag alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html),
[HAX proposal correction](https://www.microsoft.com/en-us/haxtoolkit/guideline/support-efficient-correction/)
and [accessible status](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## Design intent

Project Loomlight is a restrained, professional writing and game-authoring tool.
Routine VN authoring should be faster in the Scene workspace than by opening modal
property forms, while the generated source remains visible and ordinary. The editor follows system appearance by default; meaning never depends on colour alone.
Panels are keyboard reachable, resizable, collapsible, and compatible with
screen-reader semantics where the chosen desktop/webview stack permits them.

Phase 1 makes Scene, Source, and Branches the functional centre workspaces. Characters,
Assets, Variables, project setup and Diagnostics/Runtime are supporting surfaces.
Git status/diff/checkpoint is a deferred optional supporting surface, outside Phases
1–3 and initial-release acceptance; GitHub/remotes remain deferred too.
UI Designer and Timeline are later major workspaces and must not appear as functional
Phase 1 features; they may be omitted or clearly labelled as future work.

## Visual design language — Quiet Studio

Loomlight should look like a carefully designed native creative application, not a
web dashboard, generic IDE skin, or stylised AI-product mockup. The working visual
direction is **Quiet Studio**: warm charcoal/copper or paper/teal surfaces, a restrained
accent, medium density, strong typography, subtle separation between regions, and very
little decorative chrome. Narrative content, the game preview, and the selected Beat
must dominate attention; branding and shell furniture recede once a project is open.

Phase 1A establishes the design-system foundation. Phase 1E implements the first full
visual polish pass around the real Scene authoring interactions. Source, Branches,
Diagnostics, Git, and later workspaces extend the same system rather than introducing
independent styling.

### Design tokens and theme architecture

Do not hard-code dark-theme colours directly into components. Use semantic tokens from
the shared theme system so either palette works without rewriting components. The initial system should cover at least:

```text
surface.app
surface.panel
surface.raised
surface.hover
surface.selected

text.primary
text.secondary
text.muted
text.disabled

border.normal
border.strong

accent.primary
accent.hover
accent.subtle

status.success
status.warning
status.error
status.info
status.partial
```

The accent is copper in Dark and deep teal in Light, used sparingly for focus, selection,
active tabs, links, and rare primary actions. Semantic status colours are reserved for
meaning such as saved/success, warning/partial state, error/conflict, and information;
every status also has text and/or an icon so colour is never the sole signal.

Both accepted palettes are maintained together. The implementation must avoid assumptions such as
literal white text on literal `#222` backgrounds.

The Phase 1A implementation defines these semantics as CSS custom properties under an
explicit `data-theme` selector. Both dark and light value sets exist;
components consume semantic variables only. Shared primitives also define the system UI
stack, `SFMono-Regular`/Consolas/Liberation Mono/Menlo Source stack, 4 px and 6 px
radii, one restrained preview elevation, visible focus, and a reduced-motion override.
The minimal boundary-status shell is scaffold evidence, not the Scene workspace or a
visual-polish milestone.

### Typography

Use the platform/system UI font stack for application and narrative authoring surfaces,
for example `system-ui`, `-apple-system`, and `Segoe UI`; do not bundle a decorative
brand font merely to create visual identity. Source uses a reviewed monospace stack.
Dialogue, Beat text, story hierarchy, and Character/Asset surfaces use the normal UI
font so Loomlight continues to feel like a writing application outside Source.

Typography and spacing, not colour or effects, carry hierarchy. Secondary text must
remain readable and must not be reduced to tiny low-contrast copy simply to make the
interface look dense or premium.

### Density and spacing

Use medium density overall, with two deliberate density zones:

- **Narrative/content surfaces** such as Beats, choices, Character appearances, and
  visual asset selection have slightly more vertical breathing room for scanning and
  writing.
- **Technical surfaces** such as Source navigation, Diagnostics, Git, compact
  inspectors, and property grids may be denser.

Dialogue Beats should never be compressed into file-tree-height rows. Staging Beats can
be more compact, producing a visual rhythm where story content receives more space and
structural commands recede.

### Surfaces, borders, radius, and elevation

Prefer subtle surface differences, spacing, and thin dividers to a collection of
floating cards. Avoid boxing every section. Use modest corner radii, approximately the
visual equivalent of 4–6 px, and minimal shadows. Stronger framing is appropriate for
the Editor Preview so it reads as a game monitor embedded in the tool rather than just
another panel.

The Welcome/New Project experience may carry slightly more product identity than the
working editor, but it must remain restrained. Once a project is open, large logos,
marketing taglines, and ornamental brand elements should largely disappear.

### Beat visual identity

Beats are Loomlight's most distinctive recurring component. Do not render every Beat
as a large independent rounded card. Use compact rows with a restrained type/status
rail or icon, generous enough line height for dialogue, and stronger expansion only for
the selected Beat. A selected Beat may use the primary accent rail/focus treatment;
inactive Beats remain neutral.

Different Beat types use consistent line icons and textual labels rather than a rainbow
of category colours. Dialogue/narration receive more vertical space than structural
staging commands. The visual treatment must reinforce the mental model `Scene → ordered
Beats → resulting state` rather than resembling a generic task list.

### Icons and controls

Use one reviewed, coherent line-icon family at normal desktop scale (roughly 16–18 px
for common controls). Icons supplement labels; important or unfamiliar actions must not
be reduced to unexplained glyphs. Do not mix multiple icon families or use colourful
illustrative icons simply to decorate navigation.

Primary-button styling is intentionally rare. Creation, Run/Validate where appropriate,
and conflict-resolution confirmation may receive stronger emphasis; ordinary editing
controls remain neutral. Avoid making every toolbar action a bright accent button.

### Motion

Motion is functional and restrained: Beat expand/collapse, panel transitions, focus
movement, and short save-state feedback may animate subtly. Do not use bouncing,
decorative parallax, animated gradients, or attention-seeking easing. Respect reduced
motion and ensure disabling animation does not remove information.

### Explicit visual anti-patterns

The following are design failures unless a later reviewed requirement provides a
specific functional reason:

- glowing purple/blue or multicolour gradients;
- gradient primary buttons or decorative gradient borders;
- glassmorphism/frosted translucent working panels;
- large soft-radius cards for every row, panel, or setting;
- rounded rectangles nested repeatedly inside rounded rectangles;
- excessive pills/chips for ordinary labels, state, or navigation;
- arbitrary category colours for every icon/Beat type;
- decorative sparkles, stars, "AI" motifs, or visual cues that imply intelligence
  without communicating product state;
- dashboard-style metric tiles on authoring surfaces;
- heavy drop shadows or floating-card elevation throughout the desktop app;
- huge empty marketing headers inside functional views;
- every panel receiving an icon + title + bordered card treatment regardless of need;
- microscopic low-contrast secondary text used as visual decoration;
- over-branding the working editor or making Loomlight resemble a SaaS landing page;
- copying VS Code, Unity, Godot, or the Ren'Py launcher closely enough that Loomlight
  loses its narrative-authoring identity.

Borrow established desktop conventions for tabs, command/navigation behavior,
keyboard access, inspectors, and Source editing, but let Loomlight's identity come from
story hierarchy, Beat presentation, preview treatment, typography, and interaction
quality rather than decoration.

## Phase 1 application shell

| Region | Phase 1 contents |
| --- | --- |
| Top toolbar | Project · persistence state · undo/redo · validate · run game |
| Left sidebar | Story (chapters/scenes) · Characters · Variables · Assets |
| Centre tabs | Scene · Source · Branches |
| Right inspector | Selected-beat/staging properties and contextual asset/character information |
| Bottom panel | Diagnostics · runtime |

The centre owns flexible space. Side and bottom panels collapse. When room becomes
constrained, preserve a usable Beats editor first: collapse/shorten bottom diagnostics,
shrink the aspect-ratio preview, then collapse inspector/sidebar before reducing Beats
below its preferred minimum.

The top toolbar always shows persistence truth such as `Saved`, `Saving`,
`Pending validation`, `Conflict`, or `Recovery required`. The shell owns one
`Ctrl/Cmd+S` route: outside Source it flushes pending accepted work, while a focused
Source editor settles and accepts its captured draft. A clean settled Source performs
the ordinary Flush; a refused Source draft never falls through to a false Saved result.

## Welcome and project lifecycle

The startup surface contains Recent Projects plus `New Project` and
`Open Loomlight Project`. Recent entries show enough title/path context to identify a
moved or missing project rather than silently disappearing. `Open Loomlight Project`
selects a directory containing valid `.renpy-editor/project.json`; general import of an
arbitrary Ren'Py project is not a Phase 1 flow.

The New Project workflow is:

1. **Project details:** game title, auto-generated but editable project folder name,
   parent directory, and exact final-path preview. Refuse unsafe overwrite/non-empty
   destinations.
2. **Ren'Py SDK:** choose a detected compatible installation, securely install the
   supported Ren'Py 8.5.3 baseline, or browse for an existing SDK. Show incompatible
   installations with an explanation rather than silently hiding them.
3. **Game configuration:** default `1920×1080`, common resolution presets, or custom
   width/height. Advanced GUI/theme configuration is not part of Phase 1.
4. **Review & create:** show title/path, exact SDK/version, resolution, and an
   `Initialize Git repository` checkbox enabled by default. An expandable section may
   preview files/directories to be created.
5. **Transactional creation:** generate the runnable scaffold and `.renpy-editor/`
   metadata in staging, optionally initialise local Git, validate through the pinned
   SDK, then finalise. Failure must not present a half-created project as successful.
6. Open directly into `Chapter 1 → Scene 1`.

A created project can be persisted, closed, reopened from Recent Projects or Open
Loomlight Project, and continued. If `.renpy-editor/` is deliberately deleted, the
Ren'Py game still runs but Phase 1 does not reconstruct the metadata; that is future
existing-project import.

Phase 1C implements this lifecycle surface using the existing semantic tokens: a
restrained two-column Welcome/Recent layout, a four-step wizard with native trusted
folder selection and exact path preview, bounded creation progress, and a minimal
Story shell with Chapter 1 / Scene 1 selected. Missing and invalid recent entries stay
visible; removing one changes only application-local history. No Scene authoring,
Preview, Beats, inspector, dashboard metrics, gradients, or card-heavy layout is
introduced.

## Story hierarchy

The Phase 1 Story tree is `Project → Chapter → Scene`. Chapters are organisational and
map naturally to directories; each Loomlight-created Scene normally owns one `.rpy`
file and a globally unique technical label. The sidebar supports create/rename/reorder
chapters and scenes, move a Scene between chapters, and safe deletion with incoming
reference checks.

Display names are separate from stable technical names. Renaming `Trivia Night` does
not silently rename `chapter_01_scene_002` or `scene_002.rpy`. A technical rename is a
separate future/reference-aware operation.

## Scene workspace — default and first polished surface

The Scene workspace is built around the mental model:

`Scene → ordered Beats → resulting supported visual state`

The preview is a projection of explicit beats, never a hidden parallel document.

### Layout

The centre column uses a resizable vertical split between Editor Preview and Beats.
The default is approximately **52% preview / 48% Beats**. Preserve the project's aspect
ratio inside the preview allocation rather than allowing a 16:9 canvas to consume all
available height. The default layout should keep both areas immediately useful;
approximate Phase 1 minimums are 280–320 px for preview and about 300 px for Beats,
subject to implementation/accessibility testing. Persist the split per project/
workspace.

| Area | Responsibility |
| --- | --- |
| Editor Preview | Scene-local supported state through the selected beat; selection and staging context |
| Beats | Primary high-frequency authoring surface; ordered compact/expanded beat rows |
| Inspector | Less-frequent beat/staging properties; never the only way to write normal dialogue |

Writing- and staging-focused presets may be added later; the Phase 1 requirement is the
resizable split and sensible sizing behavior.

### Beats as the primary editor

Unselected beats are compact. Selecting a beat expands it in place into the editor
needed for its common properties. Normal dialogue/narration editing stays in the Beats
area rather than opening a modal or forcing constant use of the right inspector.

The bounded Phase 1 visual beat set is:

- Background/scene
- Show character
- Hide character
- Change character appearance
- Placement/transform reference
- Dialogue
- Narration
- Play music
- Stop music
- Play sound
- Transition reference on the relevant visual change
- Set simple variable
- Choice
- Jump
- Return/end
- Custom/unsupported source region

Hovering between safe beats exposes a subtle insertion affordance; a permanent
`Add Beat` action opens a grouped picker such as Write, Stage, Flow, State, and Audio.
Normal supported beats have drag handles plus keyboard-accessible Move Up/Move Down.
Moving across an opaque custom-code boundary is refused unless safety can be proven.

Choice, Jump, and Return/end are terminal alternatives. Adding Choice or Jump to a
Scene that ends in Return replaces that terminal Beat; it does not place flow after an
unconditional transfer and does not leave an unreachable Return behind. The terminal
Beat stays last and is not removable or reorderable through Scene authoring.

### Dialogue workflow

Dialogue is the highest-frequency action and must be efficient:

- speaker is searchable/keyboard accessible;
- narration is an explicit mode rather than a fake Character;
- normal `Enter` creates a newline;
- `Ctrl/Cmd+Enter` commits the current natural edit burst;
- `Shift+Ctrl/Cmd+Enter` commits and creates the next Dialogue beat;
- the current speaker may carry forward as a convenience and remains immediately
  changeable;
- typing is grouped into a short-lived edit buffer so one natural typing burst becomes
  one semantic transaction/undo step rather than a disk write per character.

Appearance/staging changes remain explicit beats. A Dialogue shortcut such as
`Change appearance…` may insert a visible Change Appearance beat immediately before the
dialogue; it must not secretly generate a `show`/appearance mutation as an invisible
side effect of the line.

### Editor Preview

Selecting Beat N reconstructs deterministically supported scene-local state from the
start of that Scene through Beat N. Phase 1 reconstruction includes current background,
visible character appearances, placements, simple variable assignments, basic music
state, and selected dialogue/menu where known. It does not attempt arbitrary
branch-global state reconstruction.

If Python, unsupported source, or runtime-only behavior makes the state uncertain, the
preview preserves provenance for facts it can still prove, clears affected values that
are no longer proven current, and displays an explicit `Partial preview` /
`Runtime-dependent state required` indicator rather than guessing.

Selecting a visible Character in the preview must distinguish current state from the
beat that contributed it. Offer actions such as `Edit Beat 2` and `Add change here`;
do not silently edit an earlier beat merely because the Character remains visible at
the current playhead. `Add change here` inserts a new explicit staging beat before the
current beat. The insertion form retains that Beat ID while selection changes; a stale
anchor refuses through the existing revision/identity guards instead of appending.
A Background Beat emits `scene` on the default layer, so Preview clears visible
Characters and their layer uncertainty at that Beat. Music and variable uncertainty
from Custom Code remains explicit.

Phase 1 placement exposes Left, Centre, and Right preset references. Do not offer
arbitrary drag positioning that implies a freeform transform editor. Preview navigation
does not repeatedly start/stop audio; audio beats have explicit audition controls.

### Backgrounds, appearances, placement, audio, and transitions

Asset pickers should be visual where useful, including background/appearance thumbnails
and an Import action. Character appearance and placement are references to extensible
models, not raw filenames or hard-coded coordinates. Phase 1 appearance UI exposes
expression with implicit default outfit/pose; future outfit/pose/layered-image support
extends the same model.

Initial placement presets are Left/Centre/Right. Initial transitions may be None,
Dissolve, and Fade. Initial audio controls cover play/stop music and play SFX plus
explicit audition. These are narrow Phase 1 UIs over extensible transform, transition,
and audio references intended for later Timeline/advanced staging work.

Phase 1E thumbnails and preview images are resolved by stable Asset ID through the
current project session. The renderer never receives a project path or `file://` URL.
It keeps only content-keyed memory/object-URL state, cancels obsolete view generations,
and revokes every URL on invalidation or project/session switch. Selecting an audio
Beat never plays it; only the labelled audition action requests and starts audio.

### Choices

Choice is visually first-class in Beats. Each option has text and a destination Scene.
The acceptance fixture uses two options, but the data/UI should support an arbitrary
list of unconditional options rather than hard-code exactly two. Conditions are later
work.

The destination picker lists Scenes and includes `Create New Scene`; creating a Scene
from a Choice both creates the destination and establishes the same semantic edge used
by Branches. Scene and Branches must not maintain separate branch truths.

### Variables

Phase 1 visually supports `bool`, `int`, and `string` definitions and simple assignment.
The Set Variable beat accepts values the editor can represent. Arbitrary expressions
such as computed Python assignments remain Source/custom code rather than being
misrepresented visually.

### Custom/unsupported source

Unsupported source appears in sequence as a protected Custom Code beat with a reason/
warning. It can be selected and inspected, but Phase 1 does not freely drag/reorder it
or allow safe-looking operations to cross its boundary unless the source transaction
layer can prove the operation. Phase 1F makes `View in Source` select the exact current
mapped range; a Source cursor maps back only when containing-Beat ownership is proved.

### New Scene state

A new Scene is immediately valid and explicit, normally ending with a visible
Return/End beat. Empty-state helpers offer Background, Character, Dialogue, Narration,
and other supported additions before the end. The generated first project is runnable
before the user adds content.

## Source workspace

Source is a proper centre tab rather than an embedded `Visual/Split/Source` toggle in
the Scene workspace. It provides syntax-aware source, scene/beat anchors, mapped-range
highlights, custom-code boundaries, staged/conflict information, and diagnostics.

Typing creates a bounded, session-local draft. It is accepted only by Save Source or
Source-focused `Ctrl/Cmd+S`; tab/workspace navigation keeps the draft without writing.
Both Save entry points use the same document-bound executor. During its short retention
and acceptance barrier the editor and conflicting navigation/actions are disabled
without replacing the text control, so selection and native draft undo survive a
refusal. Failed retention preserves the newest local text for retry, copy, or an
explicitly confirmed discard.
Dirty drafts show Pending validation and a crash/restart warning. Close, project switch,
and normal exit offer Save All / Discard All / Cancel. Save All preflights every draft
before its one recoverable multi-mutation transaction, so a refusal writes nothing.
Text-focused undo/redo stays native to the draft; committed project history remains a
separate revision-checked action.

Selection is bidirectional: `View in Source` opens the exact mapped range; supported
direct source edits update the Scene representation after the shared transaction/source
path succeeds; Source can navigate back to the owning Scene/Beat. Source-only mode never
hides whether a range is supported. External edits are parsed against the last
revision; supported changes update visual views and overlapping/unsafe changes enter
explicit reconciliation. A conflict keeps draft and external text. Apply Both appears
only for proven non-overlapping exact patches and shows the combined result first;
otherwise the user may copy the draft, explicitly reload/discard, or cancel.

## Branches workspace

Phase 1 Branches shows the basic Scene/label/choice graph using the same semantic edges
created in Scene. Individual dialogue lines are excluded from the default graph. A
Choice edge navigates back to its originating Choice beat and destination Scene.

Large-story virtualization, stable layout, search, minimap, scoped subgraphs, advanced
reachability/state diagnostics, and test/run-from-node remain architectural requirements
for later maturity but must not be falsely presented as Phase 1-complete features.

## Character supporting surface

Phase 1 Character fields are deliberately small:

- technical variable/ID;
- display name;
- dialogue colour;
- default appearance;
- internal stable UUID/source definition mapping.

The user-facing visual list is named **Appearances**, not Expressions/Sprites. In
Phase 1 `Add Appearance` imports/copies an image and asks for an expression name; outfit
and pose are implicit defaults. Underlying appearance attributes are extensible so
future outfit, pose, hairstyle/accessory, layered-image, animated, or other rendering
support extends the model rather than replacing it.

Phase 1D implements this as a restrained project-sidebar destination with a Character
list, creation form, immutable-technical-name copy, dialogue colour, per-Character
Appearances rows, native `Add Appearance` import, and default selection. Existing
semantic tokens, border-separated rows, visible focus, labels, and reduced-motion
behavior remain in force; no Scene staging controls are present.

New Character technical names and Appearance expression tokens suppress automatic
capitalisation/spelling correction and normalize surrounding whitespace and ASCII
capitals before submission. The fixed technical token uses lowercase letters,
numbers and underscores, begins with a letter and is limited to 64 characters;
display names keep their case. Invalid input stays available with actionable feedback.

## Asset supporting surface

Phase 1 imports by copying files into the project. Assets are grouped sufficiently for
backgrounds, Character appearances, audio, and project/UI files, with visual pickers
where useful. Missing/duplicate checks are required; external absolute asset references,
advanced tagging/search, conversion/optimisation, and bulk management are later work.

Phase 1D groups Backgrounds, Character appearances, Music, and SFX. Each row exposes
the safe project-relative filename, normalized Ren'Py discovery name, and status.
Import is one explicit native-picker action; linking, generation, media editing, and
bulk processing remain absent.

Asset import suggestions derived from filenames use the same lowercase technical
token contract. Edited Ren'Py names and expression tokens are normalized on submission;
uppercase filenames and display labels are preserved. This does not rename existing
authoritative source symbols or imported assets.

## Variable supporting surface

The Phase 1 Variable surface creates/edits `bool`, `int`, and `string` variables with a
default value and source definition mapping. Reads/writes can be surfaced where already
known, but advanced state simulation, constraint systems, and computed-expression
builders are deferred.

Phase 1D provides the typed list/create flow for `bool`, `int`, and `string` defaults.
Technical identifiers are labelled fixed after creation. Arbitrary expressions,
computed defaults, conditions, and state simulation are absent.

## Validation, run, Git, and persistence

Loomlight performs cheap continuous checks it can know confidently, such as missing
assets, invalid generated labels, missing choice destinations, and references to
removed Characters/Variables. Explicit `Validate` invokes the pinned SDK for
authoritative compile/lint diagnostics and navigation.

Phase 1 provides normal `Run Game` from the project's standard entry point. Correct
`Run From Here` is deferred until state simulation can establish effective prior state.
A local Git repository may be initialised during project creation (checked by default),
but new status/diff/checkpoint controls belong to the deferred
[optional Git milestone](tasks/active/optional-local-git.md), not Phases 1–3. Do not add
a required Git panel or checkpoint step to initial-release authoring or acceptance.

Validate and Run use one input/revision preparation path: retain Source drafts and
uncommitted Scene forms; explicitly save/commit through existing commands, use the
saved revision with input retained, or cancel. Run does not add a hidden lint cycle.
During play supported script editing/saving continues; saving does not automatically
restart or reload the game. Show launch revision separately from persistence/diagnostic
state. Changing script references to existing assets is allowed; importing, replacing,
moving/renaming or deleting asset files requires Stop first, including asset-changing
undo/redo or compound operations. Existing asset browsing/preview stays available.
Do not offer live asset refresh. Stop then Run deliberately starts the latest saved
script revision; external file changes do not become a promise of isolated runtime input. Conflicting file lifecycle/history operations offer
Stop and retry; do not lock the entire editor for the duration of play. The detailed
[1G.2a proof](tasks/active/phase-1g-branches-runtime-git.md#5-1g2a--runtime-and-trust-foundation)
is required before claiming this behaviour works.

If an external change affects one Scene file, block unsafe writes/reconciliation for
that file/Scene rather than freezing unrelated project files when they can remain safe.
Undo/redo spans the shared transaction stream across visual/source edits but stops at
external revision boundaries rather than overwriting newer work.

## Later workspaces

### Proposed Phase 2–3 interaction direction — 2026-10-02

The [Phase 2 interaction journey](tasks/active/phase-2-initial-llm-assistance.md#18-proposed-llm-screen-and-interaction-design)
places reviewed assistance next to writing, extends Characters with cards, introduces
Lorebook, and exposes prompt/context/response controls. Its
[four generated LLM screen concepts](design/phase-2-llm/README.md) illustrate preparation,
semantic proposal review, reference editing and AI settings, with explicit schematic
corrections. Approval and inclusion remain separate, context budget includes output
and margin, and unaccepted proposals are transient. The
[Phase 3 Story interaction design](tasks/active/phase-3-initial-wysiwyg-release.md#story-interaction-design)
keeps the Beat list and adds expandable, labelled conditional bodies, explicit insertion
parents and continuations, returning Call rows and an honest manual branch preview.
Its [generated concept](design/phase-3-story/README.md) uses a saved actual Story UI
screenshot. The same brief outlines Screens, Timeline and state-panel journeys.
These are proposed later-phase designs, not accepted replacements for the existing
Phase 1 shell or proof of implemented behavior. The task briefs own interaction details;
the accepted theme, shared controls and pending Phase 1 corrections remain authoritative.


### Screen/UI designer

| Component hierarchy | Constraint canvas | Properties/source |
| --- | --- | --- |
| Frames, containers, text, images, buttons, bars, grids, viewports, components | Selected resolution/aspect preview with layout guides and interaction state | Layout/style/action fields; synchronized screen language; protected custom regions |

This remains a hybrid hierarchy-and-constraint editor, not a freeform drawing canvas.
Unsupported code stays at its source location and marks only the affected screen region
partially visual.

### Animation/audio timeline

| Track list | Time canvas | Inspector/transport |
| --- | --- | --- |
| Background; character layers; camera/transforms; effects; music; ambience; SFX; voice; dialogue; movie | Clips/events, keyframes, transitions, synchronized selected beat | Time/value/easing/media; play, scrub, loop; generated Ren'Py preview |

The Timeline authors VN staging, not arbitrary video compositing. Phase 1's appearance,
placement, transition, audio, and Beat abstractions are intentionally designed to feed
this workspace later.

Selected 3C interaction: click a character in Story Preview, drag it and resize via
aspect-preserving handles, or use position/anchor/scale fields and keyboard controls.
Static staging does not require keyframes or Timeline setup. The saved transform uses
game virtual coordinates, with editor zoom kept separate. The Appearance picker adds
qualified native animation choices and explicit Play once/Loop/end controls. An idle
continues while dialogue waits and stops on hide/replacement; base placement edits
preserve its animation binding. Preview play/stop is deliberate, with native Preview
in Ren'Py when the WebView cannot faithfully decode that profile. Import refusal lists
supported exports; no GIF/video conversion action is offered. The
[3C contract](tasks/active/phase-3-initial-wysiwyg-release.md#selected-staging-native-media-and-idle-playback)
owns exact format, source/persistence and runtime proof requirements.

The [agreed implementation sequence](tasks/active/phase-3-initial-wysiwyg-release.md#agreed-implementation-order-and-source-bindings)
delivers static controls, PNG/ATL idles, native looping video, prepared transparency
and play-once/end choices in order. Frame/video content shares the same placement
controls. Play once exposes a declared end state: disappear, hold last frame or show
a supplied still. An idle is shown once across dialogue; speak-only/text-reveal triggers
remain later scope. Embedded playback is profile-dependent, with an explicit real
Ren'Py preview when unavailable; it does not claim native parity from a browser alone.

### State simulation and run from here

Reachable, saved, synthetic, and contradictory states will use distinct labels/icons.
Before a later run-from-here launch the user sees effective variables, decisions,
day/time, and known facts. Development harness content is visibly non-release and
cannot be packed into a game distribution.

### LLM operation flow

LLM remains an action surface rather than a dominant permanent chat. Before send, show
provider, endpoint class, model, local/remote status, selected context/exclusions,
estimated size, and private/adult remote-send warning. Output remains untrusted
structured data reviewed through semantic/file diffs.

Planned Phase 2 reference editors expose Character cards and a searchable/filterable
lorebook, manual editing and Generate/Update actions, approval/stale state and explicit
context inclusion. Settings exposes per-action system-prompt editing and Restore
baseline, with customized/baseline version indicators. Context budget and maximum
response tokens are editable per provider/model with visible request overrides.
Before Send, show the effective prompt, selected card/lore entries and token breakdown;
over-budget input requires a visible correction. Prompt reset is undoable and does
not reset references, credentials or size settings. These controls are not Phase 1 UI.

## Resolution and accessibility checks

- Author at project resolution (default `1920×1080`) while previewing alternative
  window sizes/aspects without changing canonical project settings.
- Full keyboard traversal, visible focus, labelled controls, logical reading order,
  resizable text/panels, and reduced-motion behavior are acceptance requirements.
- Beat/status colour has an accompanying icon and label. Canvas-only information has
  an equivalent hierarchy/list representation.
- Beat reordering has keyboard alternatives to drag handles; asset/Scene/choice
  selection remains keyboard searchable.
- Narrow windows protect dialogue/Beats readability before preview size.

## Corrective persistence and exact-value behavior

The Phase 1D shell obtains persistence truth from a read-only current-session status
request; rendering a view never implies Saved. `Ctrl/Cmd+S` invokes the separate
current-session flush operation. Unsubmitted form input is explicitly distinguished
from accepted durable changes, so Flush cannot claim that pending controls were saved.
Conflict, recovery-required, validation, and stale-session failures remain visible.
View/operation/session generations reject late success, error, cancellation, mutation,
open, close, and navigation completions. Operation generations are scoped to their
own flow so an unrelated same-view request cannot discard a still-relevant completion.
Supporting-authoring operations and explicit Flush are mutually serialized per project
session. If either is requested while the other is active, no competing bridge request
begins and the UI does not claim persistence; the active operation's own success or
failure remains responsible for reload, error, controls and focus. A late read-only
status response cannot overwrite an active authoring or Flush state.
If the user navigates within the same project while an operation is active, its old
callback cannot navigate back; settlement triggers a fresh persistence check for the
current view instead of leaving that surface indefinitely in a checking state.

Create/edit boolean input is explicit and integer text is validated losslessly before
IPC rather than coerced through JavaScript `Number`. Character, appearance, and
variable editing use labelled in-application editors that preserve their inputs after
failure; browser prompts are not part of the supporting authoring flow.

Phase 1E applies the same ordering to Scene editors. A dirty inline Beat buffer has
explicit Commit/Cancel actions, blocks navigation that would discard it, and makes
Flush say that editor input remains unsubmitted. Ctrl/Cmd+Enter on Dialogue submits one
natural semantic operation; adding Shift continues with the next Dialogue. Ordinary
Enter remains a newline. Failed validation retains text and restores focus. Scene switching, workspace
switching, and close cannot silently convert draft text into persisted work.

Phase 1F Source drafts follow the same session/view generation rules but remain
per-file across same-project navigation. A dirty file blocks Scene, definition, file
lifecycle, and committed-history writes that touch it while unrelated files remain
available when recovery scope permits. Invalid source retains its draft and accepted
visual revision; missing/renamed source shows unavailable/stale state and is never
recreated or retargeted. Recovery required retains project-wide precedence.
The shell combines fresh project status with newer local/unretained input. Conflict and
recovery retain precedence, delayed status reads cannot overwrite an active operation,
and a post-acceptance status failure reports accepted-but-unconfirmed rather than
resubmitting or claiming Saved.

When transaction state blocks writing, the recovery surface remains available without
executing the project. It lists affected paths and retained evidence, offers only
core-proven resolutions, requires confirmation for destructive resolution, and
revalidates the project before returning to Scene authoring. Ambiguous recovery stays
blocked; acknowledging a warning or deleting a journal is not an available resolution.

### 1G.1 Branches interaction contract

Branches displays accepted core flow with an deterministic layered layout (with bounded placement for cycles and disconnected scenes), directed
routes, an entry badge only when runnable `start` proves it, and separate partial/stale
notices. Dialogue rows are omitted. Select a Scene and route using either graph nodes
or labelled selectors; duplicate option text remains separate. The selected rounded
orthogonal connector treatment uses 3px palette-accent lines, visible arrowheads and
14px route text on opaque bordered pills. Adjacent forward links use row gaps;
backward, long, same-layer and self links use distinct outside channels. Paths avoid
Scene node interiors, reciprocal/parallel routes have distinct ports and lanes, and
Fit includes route/label bounds. The accepted entry anchors cyclic components;
missing/unknown/terminal destinations never acquire invented arrows. Fixed 200×60px
nodes ellipsize long names with full name/label in the tooltip and existing details.
The existing >100-edge label suppression/34-character label truncation and graph
limits remain; details retain full route text. This is a saved-flow display, not graph
editing or runtime certainty. Arrow keys pan the
focused graph, +/- zoom, Home fits; equivalent buttons remain available. Pointer pan
is optional. Under [ADR 0010](adr/0010-local-project-safety-and-observed-flow.md),
Branches displays the last observed saved state, including accepted app edits.
Open/focus/Refresh checks disk; coalesce triggers and avoid mandatory two-second
full scans. Show Checking disk, Checked at <time>, Updated from saved edits, or
Could not refresh/conflict. G1-OBS implements these statuses. Failed/incomplete
refresh keeps the last usable graph, labelled as such; navigation still checks its
captured target independently. Reopening a cached view shows it before checking disk.
Preserve focus/selection/pan for valid targets; clear ambiguous deleted mappings.
An enabled navigation click must be processed or visibly refused during refresh.

Edit Choice / Jump opens the existing mapped Scene controls, including their existing
Create New Scene action. Source navigation carries exact bytes/revision and retains
an existing draft/caret rather than applying accepted offsets to dirty or stale text.
Uncommitted Scene forms retain their existing commit/cancel navigation guard. No graph
write path, layout metadata or new Save owner exists. Failed refresh retains the
last usable graph with a visible failure/conflict status. Navigation independently
checks current source and gives a clear changed-target message instead of guessing
offsets. Over-limit graphs show an explicit Source escape without truncation.

The current limits are 500 Scenes and 2,000 edges. Layout, pan and zoom live only in the
view. Large-story layout/search/minimap and execution from graph nodes remain deferred.
Supported-target and final human evidence remains in the active 1G ledger.


### Runtime UI and safe diagnostic navigation (1G.2b)

The session toolbar provides Validate, Run Game, Stop, inspect/revoke execution consent,
Choose SDK, and a separate explicit controlled-play helper installation. Inspection and
editing never execute the project. Validate compiles then lints only if compilation
succeeds; Run invokes normal entry without an extra lint pass. The existing Source
lease captures input; Save All / Use saved revision / Cancel remains explicit. Pending
Scene input offers Return to Scene Commit / Use saved revision / Cancel. No implicit
Scene commit or draft discard occurs. Choosing a browsed SDK is explicit executable
validation; runtime preparation checks the pinned version and identities again.

Runtime controls and the bottom Diagnostics / Runtime panel survive editor navigation.
Runtime state, launch/test revision, filesystem freshness and persistence status have
separate labels. Script edits remain available during play. Stop then Run selects new
saved work. Close offers Stop and continue / Cancel and waits for confirmed cleanup
before the ordinary Source leave dialog. Cleanup failure keeps the project open.

SDK output is inert, bounded text; no output becomes HTML, a URL or a host file opener.
Diagnostic location buttons recheck the current operation, source identity and revision
through the core, then use the existing Source navigation path. Dirty, deleted, replaced
or stale files do not select a nearby Beat. Locations outside approved game `.rpy`
Source scope remain non-navigable. Static Source/Branches findings stay separate from
SDK validation, and an empty diagnostic list cannot turn process failure into success.

Diagnostic navigation also translates retained Source CRLF/UTF-16 offsets to the
editor's normalized LF offsets. Selection-only observations preserve original text,
including mixed line endings; rich-editor transactions patch only changed ranges and
persistent raw-text history preserves exact bytes through grouped undo/redo. This uses the
existing Source controller and does not silently accept or rewrite source on navigation.

Native main-window close and application quit route into the same Runtime Stop/Cancel
and existing Source draft leave flow as Close Project. The narrow desktop-only
`complete_application_close` command accepts no payload, rejects other windows and
requires the core service to have no open project plus confirmed process cleanup before
exiting. It grants no filesystem/process-launch privilege. Explicit scaffold-smoke exits
retain their existing independent harness behavior. OS termination still uses shutdown.
