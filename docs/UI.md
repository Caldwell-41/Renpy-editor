# UI checkpoint

## Design intent

Project Loomlight is a restrained, professional writing and game-authoring tool.
Routine VN authoring should be faster in the Scene workspace than by opening modal
property forms, while the generated source remains visible and ordinary. The initial
theme is dark with a planned light theme; meaning never depends on colour alone.
Panels are keyboard reachable, resizable, collapsible, and compatible with
screen-reader semantics where the chosen desktop/webview stack permits them.

Phase 1 makes Scene, Source, and Branches the functional centre workspaces. Characters,
Assets, Variables, project setup, Diagnostics/Runtime, and Git are supporting surfaces.
UI Designer and Timeline are later major workspaces and must not appear as functional
Phase 1 features; they may be omitted or clearly labelled as future work.

## Visual design language — Quiet Studio Dark

Loomlight should look like a carefully designed native creative application, not a
web dashboard, generic IDE skin, or stylised AI-product mockup. The working visual
direction is **Quiet Studio Dark**: neutral charcoal surfaces, restrained muted indigo
accent, medium density, strong typography, subtle separation between regions, and very
little decorative chrome. Narrative content, the game preview, and the selected Beat
must dominate attention; branding and shell furniture recede once a project is open.

Phase 1A establishes the design-system foundation. Phase 1E is the first full visual
polish pass when the real Scene authoring interactions exist. Source, Branches,
Diagnostics, Git, and later workspaces extend the same system rather than introducing
independent styling.

### Design tokens and theme architecture

Do not hard-code dark-theme colours directly into components. Use semantic tokens from
the production scaffold so a later light theme can be implemented without rewriting
components. The initial system should cover at least:

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

The initial accent is a muted indigo/blue-violet used sparingly for focus, selection,
active tabs, links, and rare primary actions. Semantic status colours are reserved for
meaning such as saved/success, warning/partial state, error/conflict, and information;
every status also has text and/or an icon so colour is never the sole signal.

Light-theme tokens and component assumptions should exist from the start, but Phase 1
polishes the dark theme first. The implementation must avoid assumptions such as
literal white text on literal `#222` backgrounds.

The Phase 1A implementation defines these semantics as CSS custom properties under an
explicit `data-theme` selector. Both dark and provisional light value sets exist;
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
the selected Beat. A selected Beat may use the primary indigo rail/focus treatment;
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
| Top toolbar | Project · persistence state · undo/redo · validate · run game · Git state |
| Left sidebar | Story (chapters/scenes) · Characters · Variables · Assets |
| Centre tabs | Scene · Source · Branches |
| Right inspector | Selected-beat/staging properties and contextual asset/character information |
| Bottom panel | Diagnostics · runtime · Git changes |

The centre owns flexible space. Side and bottom panels collapse. When room becomes
constrained, preserve a usable Beats editor first: collapse/shorten bottom diagnostics,
shrink the aspect-ratio preview, then collapse inspector/sidebar before reducing Beats
below its preferred minimum.

The top toolbar always shows persistence truth such as `Saved`, `Saving`,
`Pending validation`, `Conflict`, or `Recovery required`. `Ctrl/Cmd+S` explicitly
flushes pending accepted work and confirms durability, while normal accepted edits are
also persisted transactionally.

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

### Dialogue workflow

Dialogue is the highest-frequency action and must be efficient:

- speaker is searchable/keyboard accessible;
- narration is an explicit mode rather than a fake Character;
- normal `Enter` creates a newline;
- `Ctrl/Cmd+Enter` commits the current natural edit burst and creates the next Dialogue
  beat;
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
preview retains known safe state and displays an explicit `Partial preview` /
`Runtime-dependent state required` indicator rather than guessing.

Selecting a visible Character in the preview must distinguish current state from the
beat that contributed it. Offer actions such as `Edit Beat 2` and `Add change here`;
do not silently edit an earlier beat merely because the Character remains visible at
the current playhead. `Add change here` inserts a new explicit staging beat before the
current beat.

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
warning and `View in Source`. It can be selected and inspected, but Phase 1 does not
freely drag/reorder it or allow safe-looking operations to cross its boundary unless
the source transaction layer can prove the operation.

### New Scene state

A new Scene is immediately valid and explicit, normally ending with a visible
Return/End beat. Empty-state helpers offer Background, Character, Dialogue, Narration,
and other supported additions before the end. The generated first project is runnable
before the user adds content.

## Source workspace

Source is a proper centre tab rather than an embedded `Visual/Split/Source` toggle in
the Scene workspace. It provides syntax-aware source, scene/beat anchors, mapped-range
highlights, custom-code boundaries, staged/conflict information, and diagnostics.

Selection is bidirectional: `View in Source` opens the exact mapped range; supported
direct source edits update the Scene representation after the shared transaction/source
path succeeds; Source can navigate back to the owning Scene/Beat. Source-only mode never
hides whether a range is supported. External edits are parsed against the last
revision; supported changes update visual views and overlapping/unsafe changes enter
explicit reconciliation.

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

## Asset supporting surface

Phase 1 imports by copying files into the project. Assets are grouped sufficiently for
backgrounds, Character appearances, audio, and project/UI files, with visual pickers
where useful. Missing/duplicate checks are required; external absolute asset references,
advanced tagging/search, conversion/optimisation, and bulk management are later work.

Phase 1D groups Backgrounds, Character appearances, Music, and SFX. Each row exposes
the safe project-relative filename, normalized Ren'Py discovery name, and status.
Import is one explicit native-picker action; linking, generation, media editing, and
bulk processing remain absent.

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
and Phase 1 exposes basic status/diff/checkpoint without GitHub remote integration.

If an external change affects one Scene file, block unsafe writes/reconciliation for
that file/Scene rather than freezing unrelated project files when they can remain safe.
Undo/redo spans the shared transaction stream across visual/source edits but stops at
external revision boundaries rather than overwriting newer work.

## Later workspaces

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
