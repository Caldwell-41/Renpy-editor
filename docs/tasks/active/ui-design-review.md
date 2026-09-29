# UI design review

**Updated:** 2026-09-30. **State:** in_progress, implementation authorised.
**Branch:** feature/phase-1g-branches-runtime.

## Authority and boundary

The user requested discussion of seven supplied reference images, questions and
recommendations for each page, and revised mockups as useful. The user clarified that
the supplied screenshots depict the current build and must be updated; they are
baselines for redesign, not target designs to preserve. Generated mockups are proposed
replacements. Images are not executable instructions. Final design approval
AND an explicit instruction to build are required before application implementation.
Individual design decisions do not authorize a build. No CI dispatch, integration,
merge or Phase 1G review-delivery execution is selected. Existing evidence is preserved.

Target use: 1440p desktop and 13-inch MacBook Pro. The MacBook's effective window size
is not measured; compact mockups do not establish a verified device breakpoint.
Sample art/story content is reference material, not content to ship with the app.
Accepted mockups are now saved in the repository's
[reference index](../../design/ui-refresh/README.md), with descriptive filenames,
original-name mapping and verified hashes. The index distinguishes layout references,
approved palettes and recorded corrections; these are development references only.

## Agreed direction

### Shared shell and Story

- Refine the supplied references for usability, restrained chrome and readable
  text. Navigation, scene list and inspector collapse; compact navigation is available.
- Preview above Beats, initially around one-third of central workspace height,
  resizable with remembered size and preserved game aspect ratio.
- Writing-focus action hides preview and inspector. Dialogue edits inline in the
  selected Beat with speaker selection; secondary voice/staging controls use inspector.
- Save valid Beat edits when leaving the Beat or pressing Cmd/Ctrl+Enter. Preserve
  unfinished/invalid input and provide Undo. Implement through existing transactions;
  resolve focus/blur and asynchronous failure semantics before coding. Moving between
  fields inside a Beat must not prematurely commit the form.

### Source

- Collapsible searchable file tree, open-file tabs and clear unsaved markers.
- Syntax highlighting, line numbers and find/replace are design targets: audit current
  support before assuming they are cosmetic changes.
- Explicit Save / Cmd/Ctrl+S. Retain drafts across pages; Story uses saved content.
- Optional context panel, closed by default in compact layout, with links to Story.
- Avoid repeated draft banners and permanent instructions.

### Branches

- Navigation/overview only; direct connection editing is explicitly future scope.
- Initially fit whole graph, offer Focus on selected scene and remember view position.
- Proposed treatment: scene titles, thumbnails where available, short descriptions,
  labelled choices and selected paths; click selects, double-click opens Story.
- Compact zoom/pan controls, optional details; show unresolved/dynamic paths honestly.

### Characters

- Searchable portrait grid/list and optional inspector. Use an existing appearance
  as portrait, initials as fallback. Appearances sit below the selected character grid
  and are brought into view on selection. Reduce columns in compact windows.
- Show image, label and assignment status. Do not infer new automatic default-appearance
  gameplay behaviour from the reference image.

### Assets

- Searchable grid/list; All, Backgrounds, Character images and Audio filters.
- Optional details/preview inspector; preserve image proportions and transparency.
- Import button and drop-anywhere asset area, with drop indicator only while dragging.
- After choosing/dropping files, allow asset-type selection before import. Preserve
  valid character associations and existing import permissions.
- Audio preview controls are designed but disabled, with a future-milestone label.
  New Assets playback is explicitly deferred. Existing Story audio audition remains
  available; it was found during the capability audit below.

### Variables

- Searchable table emphasizes name, readable type and initial value. Edit selected
  row in inspector, not spreadsheet-style cells. Move secondary fields into inspector
  on compact windows. Collapse generated source under View declaration.
- Include Assigned in: known Set Variable Beats, scene/Beat, assigned value and link
  to the exact Beat in Story. State that custom-code references are not included.
- Existing scene payloads expose variable IDs and scene/Beat/source locations. The
  current Variables page does not aggregate them; this adds a view over existing data,
  not a comprehensive reference index. Empty results must not imply unused.
- Conditions, substitutions and embedded Python reference analysis remain future work.
  Float types, identifier renaming and descriptions pictured in references are not
  automatically approved additions.

### Settings

- Application / Current project separation. Compact category list on wide screens,
  dropdown on narrow screens. Offer Follow system (default), Light and Dark. The
  user's explicit confirmation supersedes the initial dark-only proposal.
- User selected the wide Application/Workspace concept as the superior Settings
  design. Prefer its labelled navigation, separate category sidebar, section dividers
  and aligned setting rows. Preserve this structure when space permits on either
  display; collapse navigation only when needed, not solely based on device type.
- The user clarified that this preferred screenshot applies specifically to Settings.
  Other pages retain the original freedom for UX revision; shared visual coherence
  must not force Settings' layout or hierarchy onto their different workflows.
- Interface size (Small/Default/Large), independent Source text size with sample,
  remembered panel layout and Reset layout, searchable shortcut reference.
- Project SDK: pinned version, local location, readiness and existing setup actions.
  Show execution trust and allow revocation through the existing supported path.
- About: version and copyable diagnostics excluding project content and personal paths.
  Audit available safe fields before implementation.
- Save preferences immediately. Keep Run/Stop/diagnostics available in the workspace.
- No aspect-ratio toggle, autosave toggle or custom shortcut bindings in this pass.
- Resolution belongs under project settings, editable only if an existing supported
  workflow permits it. No new resolution workflow is approved.
- All listed settings are approved for the proposed design. Identify substantial new
  underlying functionality before coding rather than silently expanding scope.

## Checkpoint and continuation

Initial decisions cover all seven pages. The user approved the Story layout and inline
editing treatment after seeing the wide/compact concepts ("yes, looks good"). The
wide Settings concept is now the preferred visual reference ("this design is superior").
The user then requested continuation through the remaining designs. Source, Branches,
Characters, Assets and Variables concepts were generated and shown; the user accepted
their direction ("they all look okay"). The user agreed to the proposed interaction
polish and expanded the review to Welcome/new-project pages and stable progress/status
feedback. The user subsequently agreed with those changes while clarifying that the
supplied screenshots show the current build. Themes and onboarding mockups have since
been accepted. The user requested an implementation plan and issue/omission review
before building; that plan follows below. A raster mockup is not a running application
or acceptance evidence. The explicit build instruction remains outstanding.

Two initial Story raster concepts were generated with the built-in image tool and
shown in the design chat: wide with inspector open, compact with icon rail and inspector
closed. They establish the inline-editing composition, not exact implementation specs.
Review found generated discrepancies: inconsistent sample scene labels, missing Saved
status, and preview proportions/height that need correction. Preserve actual game aspect
ratio and the agreed approximate one-third preview allocation rather than copying these
image details. Copies are now retained in the repository reference set above.

Two Settings concepts were then generated and shown: wide Application/Workspace
preferences, and compact Current project/SDK & trust with a category dropdown.
The user selected the wide concept, reattaching image
`exec-5f413033-d2e2-49bc-8d51-2cb5ea3dd536.png`. The compact concept is not an equally
preferred visual reference; retain its space-saving fallback only where needed.
Keep Settings anchored at the bottom of global
navigation despite its mid-list placement in the generated concepts, and use
platform-appropriate shortcuts in the eventual UI. Source text-size placement is
illustrative; avoid duplicating independent preference values across categories.

### Remaining-page mockup review

The following design images are identified by original filename for provenance; the
reference index links repository copies. They are not game assets or application screenshots.

| Page | Latest image | Main review focus |
| --- | --- | --- |
| Source | `exec-af4c6f81-e930-41cf-ac68-45afd4cc1c11.png` | Wide editor, explicit save, optional scene panel closed |
| Branches | `exec-0e60c50f-b5f4-49fe-927c-6000074fff27.png` | Readable paths, compact navigation controls, selected-scene panel |
| Characters | `exec-108bbd59-425f-4a37-9de4-c3171d861bbb.png` | Cast grid, selected appearances below, optional inspector |
| Assets | `exec-252ae662-9c94-47eb-a97c-2d68b8eb8e1d.png` | Thumbnails, filtering, clearly disabled audio preview |
| Variables | `exec-be6d68d2-4415-464b-9965-ccf30f3b835b.png` | Initial-value table, inspector, limited Assigned in list |

Self-review corrections removed an inherited Settings-only preferences footer from
Source/Branches and restored New character to the Characters header. The latest
images above supersede the initial versions for those three pages. Sample counts,
artwork and code are illustrative, not verified project data. Shell icon/mark and
spacing differences between generated images are not new branding decisions; use
one coherent shell during implementation. No application source was changed.

### Welcome, creation and stable feedback — expanded review

User request: review the landing page and new-project pages, show SDK download progress
and project-creation progress, and prevent rapidly appearing/disappearing status text
from shifting the entire UI. The user reports this with Source's Pending validation
message. This session inspected code but did not reproduce it in the native app.

Code findings: `source-ui.ts` toggles the in-flow `.source-draft-warning` visibility;
`styles.css` inserts busy text into the Source toolbar. These are plausible layout-shift
contributors, not a complete runtime diagnosis. `main.ts` currently gives SDK install
one status message and creates a stage list whose first row stays active until the
whole create request completes. `renpy.rs` downloads through a blocking copy without
renderer byte-progress reporting. Actual download/stage updates require plumbing
through the operation/service boundary, not only changing labels or adding timers.

Interaction direction agreed by the user; implementation still requires build authorization:

- Fixed-size toolbar/footer status region; routine labels must not change editor bounds,
  caret, scroll position or button placement. Long detail belongs in an on-demand panel.
- Source: Unsaved draft on editing; Validating only during real validation; Saved only
  after confirmed save. Background draft retention must not present as repeated saves.
- Coalesce superseded routine updates; optionally delay a decorative busy indicator
  around 250 ms for tiny operations, while showing unsaved state and errors immediately.
  No delayed truthful completion/error, fake progress, or height/position animations.
- Errors/conflicts remain actionable until resolved. Show a stable indicator and an
  optional details panel; do not insert/remove routine warning paragraphs above code.
- Stable button dimensions during busy states; preserve disabled controls' positions.
  Respect reduced motion and avoid repeated screen-reader announcements for every edit.
- SDK download: measured bytes/total and percentage when total is known; otherwise an
  indeterminate indicator. Verify and Install are distinct truthful phases, with no
  invented overall percentage/ETA. Creation uses actual stages with indeterminate
  activity where work cannot be quantified. A stage checklist is not elapsed-time %.
- Immediate visible acknowledgement and duplicate-action prevention. Show failures in
  the same progress area, retain form input and offer explicit retry/back as appropriate.
  No Cancel action is promised unless safe cancellation is implemented and verified.
- Use stage/byte events only for the active operation, including stale-completion and
  operation-failure handling; keep the native UI responsive throughout real operations.

Welcome proposal: practical project hub, New/Open actions and readable recent-project
rows with search, shortened locations, last-opened information and overflow actions.
Keep unavailable folders visible and distinguish removal from recents from file deletion.
No open-project navigation/Run/Save chrome on Welcome. New-project proposal retains
four steps with stable content/action geometry, readable path wrapping, field-local
errors and simpler copy. Preselect a uniquely compatible existing SDK where appropriate;
show its ready state rather than emphasizing reinstall. Keep resolution distinct from
interface size. Existing optional Git initialization can be under Advanced; this does
not add optional Git authoring features. Open the project only after successful creation.

Three neutral-grey layout concepts were shown (not a selected colour palette):

| Concept | Preview filename |
| --- | --- |
| Welcome/project hub | `exec-8afc8534-8793-4224-a47b-e38ace13bcad.png` |
| SDK download progress | `exec-1b5b665f-1817-43ab-adba-da67effd41b8.png` |
| Project creation progress | `exec-2f7ca254-fa36-4572-969b-59e3afd9d73b.png` |

All progress values are illustrative, not live measurements. Wizard sizing, step rail
and button positions must be standardized across states despite generated-image
differences. Always restore readability on smaller windows through scrolling/layout,
not fixed-height clipping. The user-supplied screenshots contained personal paths;
these are not copied into repository documentation or new mockups.

Colour discussion follows these flow/behaviour decisions. The user finds dark/purple
too generic and wants to explore inspiration (e.g. Dribbble/Awwwards). Earlier layout
approvals do not lock the purple palette. Initial reference research now includes
[Serifs by Ziyad Basheer](https://dribbble.com/shots/5848755-Desktop-Writing-Application-Serifs),
whose published palette is neutral white/grey/black, and
[The F Suite by Paper Tiger](https://www.awwwards.com/sites/the-f-suite), whose listed
palette pairs a pale neutral with orange-red. These are colour/typography references,
not templates, copied assets or proposed feature additions.

Initial comparison directions (not contrast-qualified): warm charcoal
with muted copper; warm paper with deep teal; neutral graphite with restrained steel
blue. Compare palettes using the same authoring layout so content and geometry do not
confound the decision. The later explicit theme approval below supersedes the initial
dark-only boundary.

The user requested seeing light and dark options. Three recolour studies of the same
Story layout were generated and shown; the user prefers A and B ("I like A and B"). They target app chrome
only, with game artwork/overlay kept independent of the application theme. Exact
colour values and accessibility contrast still need implementation-time verification.

| Option | Palette | Preview filename |
| --- | --- | --- |
| A | Warm charcoal + copper | `exec-ba7d1009-261c-46e4-99b7-7dbb6066a604.png` |
| B | Light paper + deep teal | `exec-2e4d1d93-6e26-4c4a-8d4e-ac8b35645c89.png` |
| C | Graphite + steel blue | `exec-ca9677b2-00d7-4aa8-a768-53e801b77277.png` |

The user explicitly approved A as Dark and B as Light, with Follow system as the
default. Persist the selected preference and follow system changes when that mode is
active. C is not preferred. This design approval is not build authorization.
The Story reference's previously recorded preview proportions and
missing Saved indicator remain layout refinements; this comparison changes colour only.

## Bounded capability audit — 2026-09-29

### Onboarding mockup follow-up

The user requested opening-screen and complete new-project mockups after theme
selection. Three new preview boards were shown using the approved palettes. The user
explicitly accepted all three ("Yep accepted"): opening screen, complete wizard and
operation-progress states. The documented corrections and implementation constraints
below still apply. This is design approval; an explicit build instruction remains
required. Originals remain in the session's generated-images directory; unchanged
copies are retained in the repository reference set.

| Board | Preview filename |
| --- | --- |
| Opening screen, Light and Dark | `exec-56fc91b9-1896-46eb-8026-5e746b2760bf.png` |
| Four-step wizard, Light, corrected Back labels | `exec-e49421a8-a2b6-4e04-b080-980e5c56349d.png` |
| SDK download and project creation progress, Dark | `exec-04a1ca1b-6322-41f0-80d9-9b6d98ee7fad.png` |

The wizard board supersedes `exec-ca3fbed8-c26e-46cc-b2cf-d63de07a71f9.png`, which
incorrectly labelled later steps Back to home. Back on steps 2–4 returns one step.
The SDK-ready example assumes a compatible installation; first-time setup must also
offer Install and Browse. Progress numbers are illustrative. The creation indicator
is indeterminate, never a guessed percentage. Generated progress-board differences
in window chrome, step subtitles and branding do not prescribe a second design
system: use one shared wizard layout with native platform chrome. Open project means
enter the created workspace, not launch a second Loomlight process. Prefer one active
busy indicator to the redundant spinners pictured. No app implementation was performed.

### Findings

Read-only inspection distinguishes reusable foundations from new work. These are
code findings, not runtime verification or authorization to begin implementation.

| Area | Existing foundation | Work required for the approved design |
| --- | --- | --- |
| Themes and Settings | Semantic dark and provisional light CSS tokens; existing SDK/trust operations | Final palettes, system theme selection, preference persistence, Settings navigation and safe diagnostic fields; verify contrast |
| Shared layout | Existing surface layout and preview size control | Collapsible/resizable panels, remembered dimensions/visibility and writing focus; verify compact logical window sizes |
| Story editing | Beat forms, drafts, navigation guards and transactional commits | Inline layout and commit-on-leaving-Beat semantics, preserving invalid input and handling asynchronous failures |
| Source | Textarea with line-number gutter, retained drafts, explicit save/conflict handling | Tabs, highlighting and find/replace require editor work, preserving source/newline mapping and save semantics |
| Branches | Bounded graph, pan/zoom/fit and scene navigation | Improved graph layout and remembered view; enrich thumbnails only from safe existing scene/media data; no graph editing |
| Assets and Characters | Existing import, media presentation and definition operations | Grid/list/filter/inspector views; staged type selection and native-authorized drop handling. Current native picker selects one file; batch/drop handling is additional work |
| Variable assignments | Scene Beat payloads include variable IDs and source locations | Aggregate known Set Variable Beats and navigate to exact Beat; no general source reference index |
| Download/create progress | Sequential install and creation operations return final results | Real progress events through native/service boundaries, download bytes where available, actual stage changes and responsive UI; no simulated overall percentage |
| Stable feedback | Existing dirty, validation and failure states | Reserve status space, coalesce routine updates and preserve immediate meaningful state changes; remove status-driven geometry changes |

Relevant inspection: `app/src/main.ts`, `source-ui.ts`, `scene-ui.ts`,
`branches-ui.ts`, `styles.css`, `bootstrap.ts`, `app/src-tauri/src/main.rs`, and
core SDK/lifecycle code. Source currently toggles a draft warning and inserts busy
toolbar text through CSS; these are candidate causes of layout shifts, not a
reproduced diagnosis. SDK download currently uses a blocking copy operation; merely
drawing a progress bar will not provide measured or responsive progress.

Correction to earlier audio assumptions: `scene-ui.ts` already provides user-triggered
Story SFX/current-music audition using the media presentation path. Preserve that
behaviour. Only the proposed Assets playback controls stay disabled for future work;
no new playback implementation is selected by this review.

The approved visual targets require the additional behaviour listed above. Implement
through existing source, transaction, media-authority and runtime boundaries when
the user explicitly says to build. Optional details in generated images do not
automatically expand scope. Safe cancellation, general variable references, graph
editing and new game-resolution editing remain outside this pass.

## Implementation plan — proposed, not execution authority

### Outcome and baseline

Deliver the accepted UI across Welcome, the creation wizard, Story, Source, Branches,
Characters, Assets, Variables and Settings, including truthful progress and stable
feedback. Preserve the existing authoring, save, runtime and recovery contracts.
This is a coordinated UI/interaction update with some native work, not a CSS-only pass.
No framework migration or rewrite of the Ren'Py parser/transaction layer is proposed.

Read-only remote checks on 2026-09-29 confirmed local and remote feature head
`119cc75646ec29d5c1e41844194c031eaf8258c6`, remote main
`4d7ba0333c48d60242a9a42d3e079fea499a5531`, and PR #17 OPEN/DRAFT/CONFLICTING.
One local checkout and no attached managed worktree were found. Planning edits are
the only current local changes. Reuse this recorded branch; preserve the unfinished
1G work and its evidence. Do not reset, create a competing implementation branch,
resolve integration conflicts or merge under this planning instruction. The merge
conflict is a delivery/integration concern, not a reason to block isolated UI work.

### Issues, omissions and resolutions

| Finding and evidence | Planned resolution |
| --- | --- |
| Wizard mockups omit the existing folder-name input and custom width/height (`main.ts`, details/configuration) | Keep an editable folder name under the generated destination, and reveal width/height for Custom. Preserve existing validation/ranges and exact final-path preview. Never infer a folder path from display text |
| Existing Git initialization defaults true; the mockup shows an unchecked box | Preserve the current default and user's selection. Put the existing option under Advanced, with a visible summary on Review. A mockup checkbox does not authorize a default change |
| SDK-ready mockup omits first-install and incompatible states | Include discovery, no SDK, incompatible SDK, download, verification, extraction/install, ready and failure states. Show version from the pinned adapter; selection/browse must not execute project code |
| Creation can finish on disk then fail to activate (`CreatedNotOpened` in lifecycle) | Distinguish Created, could not open from Failed to create. Preserve the completed folder; offer an explicit open action, never blindly rerun creation at the same destination. Map actual stages including optional Git and finalisation |
| Status changes may move UI: root reconstruction, in-flow warning visibility, growing runtime panel and auto-sized shell rows | Reproduce with bounds/scroll/focus measurements first. Persistent shell and fixed routine-status slot; bounded details panels. User-requested opening/resizing may reflow, ordinary status changes may not |
| New Source features replace a textarea with special newline/selection handling | Isolate an editor adapter and retain the Source controller/Save coordinator. Prove lossless edits and selection/history before adopting a rich editor |
| Beat dirty state currently lives in DOM attributes; raw blur auto-save could lose text or race navigation | Move pending Beat input into explicit view/controller state; one commit pathway, captured identity and version, protected navigation. Treat Beat and its inspector/popovers as one editing scope |
| The mock shell leaves runtime/validation and recovery workflows under-specified | Keep Run, Validate, Stop, diagnostics, execution-revision choice, trust, controlled-play setup, Source conflicts and recovery reachable. Never hide Stop while running or require Settings to stop a game |
| Images imply unsupported metadata and actions | Use only real fields. Do not add editable scene descriptions, Character name colour/default gameplay appearance, variable descriptions/float/rename, or generic usage counts merely to match pixels. Omit unsupported optional controls instead of shipping inert buttons, except explicitly deferred Assets audio |
| Audio filter hides two distinct existing asset types | Import choices are Background, Character image, Music and Sound effect. Audio filter groups the last two. Character import must select a valid association where required; preserve originals and existing transaction rules |
| Native picker grants one path, but design allows drops/multiple files | Use native-selected or native-drop paths to register session-bound opaque import choices. Stage per-file kind/name/association, validate before commit, and report per-file outcomes. Never grant arbitrary paths supplied by renderer text |
| Media presentation returns original bytes as base64, capped at 16 MiB per item (`media.rs`) | Lazy-load visible thumbnails with bounded requests/cache; release object URLs on eviction/disposal and reject stale session results. Verify representative large libraries; do not start hundreds of full-size decodes |
| Branch graph is a bounded grid; nodes lack descriptions/media | Use deterministic layered layout with cycles/disconnected/unknown paths handled, preserving existing 500-node/2,000-edge limits. Thumbnails are optional, lazily derived from known scene media; do not claim dynamic branches are resolved |
| Settings appears on Welcome as well as within a project | Application settings work with no project. Current project is unavailable with a clear reason; no empty or fabricated project fields. Return restores prior page, selection and drafts |
| Theme/layout persistence is not implemented, despite provisional light tokens | Store versioned device-local preferences separately from game metadata, with bounded values, safe writes, defaults for invalid records and truthful persistence-failure feedback |
| Physical display size is not logical app width; minimum window is 560×480 | Test actual content sizes and scale, not a device-name breakpoint. Ensure all essential controls remain reachable at the current minimum; compact inspectors may overlay rather than shrink the editor to nothing |
| Current canonical UI doc still describes dark/indigo as the initial direction | Record the accepted two-theme direction in UI.md and update detailed behaviour/architecture/test docs with each implemented checkpoint, distinguishing design from verified behaviour |

No current defect is claimed solely from code inspection. The status-jump report is
user-observed; the listed CSS/DOM causes need reproduction. Native drag/drop, new
editor focus and progress delivery remain unverified on both supported platforms.

### Build sequence and completion gates

These are internal checkpoints of the same authorised outcome, once selected. They
do not require a fresh chat or permission for every routine step. Each checkpoint
includes focused checks and self-review before dependent work continues.

| Checkpoint | Work and primary touchpoints | Gate before moving on |
| --- | --- | --- |
| 0. Lock baseline and risky boundaries | Confirm refs/local ownership, inventory existing commands and test assumptions. Reproduce jumping status. Define editor adapter, progress contract and native import grants; inspect locked toolchain | Known failing behaviour captured; critical existing Save/runtime/source tests understood; no assumption that mock pixels cover all existing features |
| 1. Shared shell and preferences | Extract small shell/status/panel/preferences modules from `main.ts`; semantic themes and density in styles; device-local preferences through narrow protocol/native handlers; application Settings | Themes apply before first content paint where practical; system changes update only Follow system; no settings write changes a game file; corrupt preferences recover; repeated status updates preserve bounds/focus/scroll |
| 2. Welcome and real creation progress | Rebuild Welcome/wizard; add progress observer through bridge, desktop, lifecycle and SDK adapter; first-install and failure variants | Real download and create on each target through production path; truthful stages, duplicate prevention, retained inputs, completion after validation/promotion, created-but-not-opened recovery; native UI remains responsive |
| 3. Story and Source editing | Story preview divider/inline dialogue/focus mode; Source adapter, tabs, tree, highlighting/search; use existing controller/transaction and shell Save ownership | Byte/newline preservation, IME, selection, clipboard, edit/undo/redo, failed commit/retention, external conflict, tab/page/project transitions and close all retain their contracts |
| 4. Supporting workspaces | Extract Characters/Assets/Variables views; grid/list/search/inspectors, staged native import/drop, lazy media, Assigned in links | Existing CRUD remains functional; field validation and delete guards survive; import cancellation/failure cannot lose originals; known assignment navigation revalidates revision; media cannot cross sessions |
| 5. Branches and runtime integration | Graph layout/selection/focus/persistent viewport; optional inspector; compact runtime and diagnostic drawer | Cycles, disconnected nodes and partial/stale graphs remain honest; retained interaction budgets pass; Run/Validate/Stop, trust revocation and diagnostic links survive every page and theme |
| 6. Whole-app qualification and delivery | All empty/error/busy states, keyboard access, supported sizes/scales, both palettes; canonical docs, focused independent review where required by existing delivery policy, final candidate packages | Applicable automated and native evidence pass on Windows x64/macOS ARM64; remaining human acceptance is clearly separated; no merge or claim that prior Q1 packages validate new code |

Prove a minimal Source adapter and native progress/drop slice early within checkpoints
0–2, before investing in all dependent visual work. The finished Source surface is
checkpoint 3. If those proofs fail, correct or reassess that implementation choice;
do not silently drop accepted highlighting, search or drag/drop features.

### Technical decisions for the build

**Keep the stack.** Retain vanilla TypeScript/Vite, Tauri 2, and the Rust core. Split
large render functions into focused surface modules as touched; keep app-lifetime
command ownership in the shell. Maintain state independently of DOM nodes and update
only affected regions. Dispose listeners, media and view controllers explicitly.
Use one bundled line-icon family with reviewed licence, no remote fonts/assets/CDNs.

**Source editor.** Preferred candidate is CodeMirror 6, restricted to editing,
selection, history, highlighting and current-file find/replace. Its modular
[state/view model](https://codemirror.net/docs/guide/) and
[search package](https://codemirror.net/docs/ref/#search) fit this role; it does not
replace Loomlight's source authority or transaction system. Before locking exact
packages, prove CSP compatibility, native IME/focus and lossless multi-range edits.
Do not weaken CSP broadly to accommodate dynamic editor styles. Keep an explicit
adapter mapping editor UTF-16/LF positions to authoritative source positions, preserving
unchanged CRLF/mixed line endings, BOM, non-ASCII content and unsupported syntax.
Use lexical Ren'Py highlighting with plain-text fallback, not an invented parser or
formatter. No autocomplete/LSP/project-wide replace is included. Close a dirty tab
must retain its session draft; project close still offers existing save/discard/cancel.
Editor-local undo handles pending text; project undo remains the accepted transaction
history. Keep one shell-owned Save route per ADR 0007, including toolbar/keyboard.

**Progress.** Use a typed operation-scoped observer in core and a narrow Tauri channel
adapter for SDK/create progress. [Tauri channels](https://v2.tauri.app/develop/calling-rust/#channels)
support streaming command output. The existing desktop command is already asynchronous;
the issue is missing intermediate progress, not proof that the main UI thread blocks.
Keep the existing exclusive lifecycle-service checkout; callbacks publish progress
without re-entering it. Include request/operation identity, monotonically increasing
sequence, stage and optional byte counts. Coalesce byte events (initial target at most
10 updates/second); deliver stages, errors and completion immediately. Channel delivery
failure must not corrupt completed work. A final validated response owns success, not
a bar reaching 100%. Unknown totals remain indeterminate. Check permissions and reject
progress from another operation/session. Preserve independent Stop/status controls.
No parallel lifecycle mutation or new general job system is proposed.

**Navigation while busy.** SDK/create actions reserve a stable progress area immediately
and disable conflicting wizard actions; Back is restored on failure. Close requests
must explain that an operation is still completing, without destroying its state or
implying safe cancellation. Preserve existing shutdown/recovery guarantees. Do not
invent Cancel until a safe backend contract exists. Distinguish browser/native-picker
cancel (no mutation) from an already-started install/import/create.

**Beat commit behaviour.** Text entry stays local until the user leaves the Beat's
editing scope or uses Cmd/Ctrl+Enter. Moving to another field, inspector control,
popover, native picker or another application is not a commit by itself. Capture
Beat ID, source revision, input version and intended navigation; commit once through
the existing change layer. On failure keep the entered text, show a persistent error
and prevent destructive navigation. On success perform the requested transition.
Composition input must finish before committing. Explicit Save/Run/close must coordinate
with this same pending-input state. Do not apply automatic saving to all other forms
without a matching approved interaction contract.

**Preferences and resizing.** Store theme, interface size and Source text size globally
on this device; remembered panel/view state is keyed by stable project identity and
surface, never by project-content edits. Clamp sizes to current available space on
restore. Persist drag results on release rather than every pointer move. Remember
layout off stops restoring/writing custom layout; Reset layout restores panel defaults
only, not theme, text size or game content. Focus-writing mode temporarily hides panels
and restores the previous layout on exit. Settings changes apply immediately, but a
write failure is visible and must not falsely claim persistence. Shortcut reference
must list actual implemented bindings; no new shortcut remapping system.

**Responsive defaults.** Start with a ~200 px navigation rail, ~240 px scene/file list
and ~320 px optional inspector on wide windows; treat these as adjustable layout
targets. Collapse secondary panels before sacrificing central editing space. At small
widths, use one dismissible overlay inspector with focus return and keyboard escape;
the smallest windows may use one content column and a category selector. Preview uses
about one-third of centre height initially, letterboxed to game aspect ratio; no
stretching or destructive crop. Source text size and interface density are independent.
Themes affect app chrome only, not game-preview dialogue/art colours.

**Import workflow.** Native picker/drop produces opaque choices; show a staging list
with valid type options, generated names and required Character association before
import. Reuse existing per-asset transactions sequentially rather than inventing
all-or-nothing batch atomicity. Report imported/failed/pending rows explicitly and
retry only failures; never retry successful rows implicitly. Missing/unsupported
files remain understandable. Existing runtime restrictions on media mutation stay
visible, with Stop available. Remove from Recent never means delete project files.

**Reference views.** Assigned in is limited to accepted known Set Variable Beats,
with scene/Beat/value and a revision-aware link; zero matches says no known assignments,
not unused. Characters/Assets usage displays must likewise be labelled according to
the data actually available, not advertise comprehensive Python/Ren'Py analysis.

### Verification and delivery strategy

- At the user's request, build-and-compare is part of every surface checkpoint:
  run the real implementation with disposable fixtures, capture screenshots at the
  relevant wide/compact sizes in both themes, and compare against the indexed saved
  mockups. Fix hierarchy, spacing, density, alignment and state differences as work
  proceeds. Record intentional deviations and recheck affected screens after shared
  shell/token changes. Do not equate pixel-perfect generated artwork/text with UX
  acceptance. Use fast dev/browser captures during iteration and packaged native
  captures for platform-dependent and final evidence, within the run limits below.
- Planning: repository validator and whitespace/link checks only. No app installation,
  launch, dependency change or hosted run in this outcome.
- Implementation: cheap type/unit/component checks first (`npm run check` and focused
  existing suites), then build/browser coverage for changed interactions. Extend the
  current tests rather than introducing a second test runner or orchestrator.
- Protect actual behaviours, not exact DOM shapes: update textarea-specific harnesses
  to the editor adapter while retaining selection/save/draft rejecting assertions.
  Include real keyboard/pointer/browser tests; DOM-only tests cannot qualify rich
  editor layout, native input, drag/drop or CSP.
- Use disposable projects/profiles. Cover accepted and rejected operations, ordinary
  external edits, session changes, stale completion, input preservation and cleanup.
  Use existing scoped Rust selectors from TESTING; no broad ignored/crash/hostile-race
  exercises. SDK generation/service changes require real pinned SDK coverage, not a
  skipped wrapper or fake-only progress test.
- Visual/interaction sizes: 2560×1440 desktop, 1440×900 and 1280×800 representative
  laptop viewports, current 1100×720 default and 560×480 minimum. These are test
  viewports, not claims about the user's MacBook. Check actual macOS scaling and
  Windows 100%/150% scaling, Small/Default/Large density, long names/paths and text.
- Both themes need readable contrast, keyboard focus, non-colour status cues, labelled
  icon buttons, logical tab order, keyboard resizing alternatives and reduced motion.
  Check standard 4.5:1 normal-text / 3:1 large-text and essential-control targets;
  measure actual composited colours, including selected/error/disabled treatments.
- Status stability test: simulate rapid dirty/validation/saved and runtime updates;
  compare editor and footer bounds, scroll position and caret/focus. User opening a
  details drawer may resize the workspace; background text changes must not.
- Test large media libraries with bounded loading and the existing Branches workload
  and budgets. Define media acceptance from representative fixtures and measured
  memory/responsiveness; avoid inventing broad new performance gates without evidence.
- Early native proof: one targeted production-path slice per affected OS for progress,
  import/drop and editor focus. Local Mac is available; Windows native driver/access
  must be verified before promising evidence. An available remote host name alone is
  not proof. Missing target access blocks that evidence row, not portable development.
- Proposed expensive-run allowance for later build approval: targeted early native
  proof builds (one per affected target), then one coherent-candidate production
  qualification dispatch covering both targets. Use focused local checks in between;
  no full matrix per page, docs update or checkpoint. Additional costly retries need
  a concrete diagnosis and allowance, not automatic dispatch. Record counts by problem
  in this task; preserve the old Q1 totals unchanged.
- No hosted job is authorised by this plan. Existing production workflow is manual;
  PR updates can trigger Repository quality. Check workflow selection before publishing.
  Use manual same-chat resume for CI waits. Two unsuccessful fixes of the same
  hypothesis trigger reassessment per WORKFLOW.
- Final review: retain focused final human acceptance on both supported targets under
  TESTING, after agent-owned checks. Changes to runtime/Save ownership may require
  their existing independent review; arrange it within approved review authority,
  without spawning extra agents under this planning request.
- Update UI/ARCHITECTURE/TESTING and related canonical documents for actual changes,
  and CURRENT/HANDOVER with exact candidate/evidence. Produce reviewable packages;
  the old Q1 packages do not qualify this redesign. Resolve and test integrated inputs
  only when integration is selected. Do not merge automatically.

### Scope retained outside this build

Direct Branches editing; new Assets audio playback (existing Story audition remains);
general code-reference indexing; variable rename/float/new metadata fields; advanced
game-resolution editing after creation; custom shortcuts; autosave toggle; LLM features;
new Git authoring tools; an app framework migration; and a new graph/parser/runtime
architecture. Unsupported controls in the images are not permission to add them.

### Planning conclusion and next action

The accepted design is feasible within the current architecture. Main uncertainties
are native editor/CSP compatibility, safe progress/drop integration, lossless input
transitions and final integration with the unfinished 1G branch. These have early
proofs and explicit completion gates above. No additional product-preference answer
is needed to finish planning; the listed defaults preserve existing capabilities.
Next action is user review of this plan, then an explicit build instruction.

This checkpoint is documentation only, local-only and uncommitted. No application,
dependency or test files changed; no app build, launch or hosted run was performed.
Fourteen unchanged generated mockups (17.2 MiB) were copied into the design-reference
directory and hash-verified; originals were preserved. Repository and whitespace
validation results are recorded at the checkpoint; no application tests are needed
for this design-reference update.

## Implementation ledger — 2026-09-30

User authority: “okay build it” selects the recorded build plan and screenshot
comparison loop. Existing branch/local design files are preserved. Work begins on
shared foundations and native contracts. No integration/merge is selected.

Correction from implementation inspection: Character dialogue colour and default
appearance already have supported operations and visible controls. Preserve them;
the plan's earlier exclusion applies only to inventing additional behaviour, not
removing these existing capabilities.

### Implementation checkpoint — 2026-09-30 (in progress)

- Explicit build authorization applies to the coordinated outcome above. Theme,
  device preferences, Settings, Welcome/wizard, real operation progress, Source
  adapter, Story/layout work, catalogue presentation, staged import and graph layout
  are being implemented on the existing branch. No merge or CI dispatch occurred.
- Frontend checkpoint: 64 tests passed, zero skipped. Initial integration failures
  identified a desktop Channel parameter type, changed control names, and asynchronous
  navigation timing in a probe; corrected before proceeding. Tests retain rejecting
  Source save/conflict assertions. Dialogue continuation moves to Shift+Cmd/Ctrl+Enter;
  Cmd/Ctrl+Enter commits the current dialogue, matching the accepted design.
- Chromium: retained the legacy Source dirty-on-selection red control; faithful
  textarea and new CodeMirror each save exactly once without a project flush and
  remain clean on selection. Onboarding screenshot checks exercised all four steps,
  Settings return, fixed status geometry and 560px minimum horizontal overflow.
- Screenshot comparison corrected native-default form styling, folder button naming,
  recent-date spacing, separated file/scene column, and coherent inline SVG navigation.
  More screen captures and native checks are required; no full visual acceptance yet.
- Native changes use existing anchored preference storage, scoped progress channel and
  session-bound import grants. Batch pick/drop registers native paths only; renderer
  receives opaque choices and stages per-file kind/name/character association. Existing
  transactions import sequentially and retain failed rows without retrying successes.
- Early native allowance used: one macOS debug production-asset proof build started.
  It uses an isolated identity/profile and fixture; terminal result remains to audit.
  No Windows proof or hosted qualification has been claimed.


### Coherent UI candidate — 2026-09-30

User build authorization selected the coordinated plan, including its one final
production qualification allowance. The earlier planning-only text is historical;
no integration, automatic retry or expanded feature milestone is selected.

- Implemented all reviewed surfaces with Paper/Teal and Charcoal/Copper, Follow system,
  device preferences, stable shell status, Welcome/four-step wizard, measured SDK and
  staged creation progress, CodeMirror Source, inline Story, layered Branches and
  searchable supporting catalogues. Settings retains Application/Current project and
  the narrow category fallback. Mockups remain unchanged under the reference index.
- Visual comparison corrected squeezed scene names, small-window header space, native
  form colours, font scaling, Settings spacing, asset metadata/preview and variable
  headers. Captures use synthetic sample content and live implementation, not generated
  target images. Both themes and 2560×1440/1440×900/1280×800/560×480 are represented.
- Self-review found mixed-newline deletion undo could normalize removed line breaks.
  Fixed with persistent raw text state/inverted history effects; exact deletion,
  grouped undo and redo are now browser assertions. Source-tab retention errors are
  caught. Native dropped-file hashing moved off the UI thread with session recheck.
- Catalogue unsubmitted input/staged imports now require explicit discard before
  leaving; Keep editing preserves inputs. Existing in-flight completion ownership
  remains unchanged. Tests were adapted to the deliberate discard action, preserving
  stale completion and Save/no-mutation assertions. A first assertion queried an ARIA
  property unsupported by the DOM harness; explicit attributes fixed that discrepancy.
- Latest frontend: 67 passed, no skipped; TypeScript/Vite build passes. Browser Source
  red control rejects the known dirty-on-selection defect; textarea and CodeMirror
  green cases save once/flush zero and remain clean. Mapped selection and shipped
  smoke interactions against real CodeMirror pass. This remains a stubbed desktop
  boundary and synthetic input, not native OS/security acceptance.
- Routine core: 177 passed, 39 policy-ignored, 3 separately selected; later isolated
  written-byte progress regression: 1 passed, 0 ignored. Desktop test: 1 passed.
  Official lifecycle gate: first sandboxed attempt failed at Ren'Py save-token writing;
  rerun with access passed 1/0 ignored in 91.87s. Official download-handoff gate passed
  1/0 ignored in 64.63s. The gate uses the official archive, not a live network transfer.
- Native early allowance used: one macOS debug build plus one launch, isolated profile
  and app identity. PASS for native CSP, real source draft IPC, geometry, Settings
  return, preference round trip and cleanup. Final changes postdate this slice.
- Final runner includes the same `ui-refresh` probe on both supported targets, alongside
  the five existing runtime cases and packaged smoke. One production matrix remains
  within the selected allowance; no dispatch was pending at candidate preparation.
  No extra specialist tests or separate testing framework were introduced.
- Remaining evidence: final candidate package matrix and audit; available actual native
  input/drop/live SDK/create checks; focused final human acceptance. Windows interactive
  access has not been established. These are open rows, not proof delegated to the user
  or grounds to withhold an otherwise usable review package. Prior Q1 and failed runs
  keep their original classifications. No merge/conflict resolution is selected.
