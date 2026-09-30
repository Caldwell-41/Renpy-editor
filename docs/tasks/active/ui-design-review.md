# UI design review

**Updated:** 2026-09-30. **State:** review_ready, automated qualification passed; human acceptance open.
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


### Qualification dispatch and same-chat wait — 2026-09-30

- Implementation candidate published and verified on origin:
  `a82e89cf0210af328531727b171d050745216b53`; draft PR 17 updated, still conflicting.
  Fresh main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`. No merge.
- One request accepted: workflow `production-scaffold.yml`, `upload_packages=true`,
  [run 36647015944](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36647015944),
  attempt 1, created 2026-09-29 23:47:09 UTC on that exact feature candidate.
  Observed 23:47:35 UTC: in progress; Preflight repository/privacy/selector/frontend
  checks passed, Source real-browser step running. Supported target jobs follow.
- Cumulative refresh allowance: one early Mac debug build and one native launch;
  zero Windows early proofs; one final production dispatch, zero retries. This run
  selects six packaged runtime cases per target (including UI refresh) and retained
  boundary smoke. Actual build/start/artifact totals must be audited, not assumed.
  Prior Q1 totals are unchanged. No further expensive retry is automatically allowed.
- Latest comparison also measured normal theme text across principal surfaces: minimum
  contrast 5.99:1 Dark / 4.50:1 Light; primary button text 7.01:1 / 6.11:1. This does
  not certify every platform or arbitrary game preview. Final native acceptance stays
  open. Current browser captures remain ignored local evidence with synthetic content.
- Publish this meaningful wait record; stop model polling. Resume in the same chat to
  audit the recorded run, preserve failed/skipped results and inspect packages before
  delivery. An ended normal turn is not a claimed autonomous Goal pause. Remaining
  native input/drop/live SDK/create checks and human acceptance are unchanged.


### Qualification failure and downstream driver audit — 2026-09-30

**UI-QUAL-1: FAILED native qualification, driver defects diagnosed and corrected.**
User resumed the recorded run, then explicitly requested an audit for similar
problems downstream. This authorizes the bounded fixes and local regressions here,
not another expensive qualification dispatch or merge.

- Run **36647015944**, attempt **1**, tested **a82e89cf0210af328531727b171d050745216b53**,
  tree **99c03b5e099e6b7683ef71b8a1ff97749285eb2f**. Started
  2026-09-29 23:47:09 UTC; completed failed 2026-09-30 00:05:04 UTC.
- Preflight passed: repository/privacy, gate rejection controls, selectors, 67 frontend
  tests, Source/browser suite and Rust formatting. Both targets passed frontend build,
  ordinary core, separate flow observation, browser, official archive-backed SDK,
  runtime service/diagnostic SDK, desktop boundary, Tauri package build and source scan.
  Routine core: Mac **178 passed / 39 ignored / 3 separately filtered**; Windows
  **173 passed / 36 ignored / 3 separately filtered**. Flow, lifecycle, SDK handoff,
  runtime service, runtime diagnostics and desktop gates each passed **1 / 0 ignored**
  on each target. Archive cache hits skipped the conditional fetch step; that is not
  live first-install/download UI evidence.
- Both targets failed all six packaged UI reports. The five runtime cases timed out
  at `open`: the exact whole-button-text selector no longer matched a project title
  after the new date child was added. UI-refresh reached the native editor then
  rejected a legitimate service-busy observation (Mac `project.current`, Windows
  `source.list`) while draft retention owned the service. All twelve reports confirmed
  cleanup. No successful native acceptance is inferred from these failures.
- Required-report gates failed. Packaged boundary smoke, dependency/license inventory
  and normal success-only installer upload were skipped. Failure-time diagnostic
  package retention and deferred browser gates passed. Two actual Tauri builds and
  twelve top-level native case starts occurred; boundary smoke did not run.

| Retained evidence | Artifact identity | Executable SHA-256 |
| --- | --- | --- |
| macOS ARM64 | `11069123007`, `phase-1-q1-package-evidence-macos-26` | `3fe875fa3855e2c10a291020ebdf6c1444203a0c8146ef537c94027b7ac69657` |
| Windows x64 | `11068968502`, `phase-1-q1-package-evidence-windows-2025` | `eb78718316f00eb1a1c9f6aa8d637b5f97483b5393154b025d3f67fb40a76d20` |

Both artifacts expire 2026-10-07 UTC. Retrieved manifests match run/attempt/SHA/tree;
retained bytes and Mac archived executable were hash-verified. Mac tar SHA-256:
`767e7b92310a68cb6bd4c0fa175af7dfb66cbb92d96d4060ef8b2bfa6454bac4`.
Ignored local review copies retain the failed candidate, with an explicit unqualified
README. No binary was installed or launched during this audit. Raw logs, six reports
per target and screenshots remain in downloaded evidence, not committed host logs.

**Corrections and downstream inspection:**

- Recent titles match exactly without the date child; a similarly prefixed title is
  rejected. Only busy read observations and explicitly idempotent preference writes
  receive bounded retries; real errors and expired deadlines still fail. Gameplay
  mutations, Save, grants and launches are never automatically retried by this helper.
- The shipped runtime scripts open Branches details and the Runtime panel before using
  their controls. Diagnostic navigation focuses CodeMirror and waits for its retained
  DOM selection; exact normalized line start and failing-line contents remain asserted.
  Final reopen waits for the new rendered project before querying its session.
- The smoke driver now opens New character, New variable, Import assets and Scene
  details through visible controls. The optional Branches probe uses the shared recent
  selector/editor adapter and opens its inspector. This compatibility repair does not
  select or validate the retired native Branches performance exercise.
- The existing runner executed six cases, but the standalone report validator and
  retained package manifest listed only five. All three now import the same ordinary
  case list. New negative controls reject absent or failed UI-refresh evidence and
  prove its failure/cleanup state is included in the retained manifest. The original
  runner already rejected the UI-refresh failure; no earlier failed run is relabelled.
- A new browser preflight executes the actual shipped five runtime scripts against
  the real rendered application and CodeMirror at 1100×720, with a strict fixture
  service and busy read injections. It rejects hidden/disabled synthetic button
  clicks and unexpected operations. The same check runs before packaging through
  `npm run test:source-browser`. Existing smoke/UI-refresh browser paths also check
  unavailable clicks/busy observations. These are driver compatibility checks;
  fixture runtime output, retention, trust and close results do not prove native
  execution, filesystem persistence, process ownership, security or physical input.

**Local failures retained and classified:** the first diagnostic browser run exposed
an unfocused DOM selection; focus alone still raced CodeMirror's next view update.
Observed post-failure selection had the correct offset/text, so the final driver
waits for that actual update without setting the expected selection. Compile/lint
then passed. Both routes passed before the runtime-error fixture timed out: its
constant output sequence prevented the renderer requesting diagnostics. Correcting
that fixture to mirror native sequence advancement made the unchanged runtime-error
script pass. No production semantics or success assertions were relaxed.

**Final local verification:** 69 frontend tests pass, zero skipped; full updated
`npm run test:source-browser` passes its legacy rejecting control, textarea/CodeMirror
Save/mapped selection, mixed-newline edits, visual/layout checks, shipped smoke,
UI-refresh contention and all five runtime driver cases. Both route scripts retain
9.5-second observation assertions. Rust formatting and desktop compile check pass.
Package-retention CLI: 9 tests pass; gate self-tests and source selector audit pass.
Repository/link/privacy validation and whitespace check pass at publication.

Cumulative refresh cost remains one early Mac debug build/launch; one final hosted
request/attempt, two final Tauri builds and twelve native case starts; **zero retries**.
Local driver diagnostics added no native launch or hosted run. Prior Q1 evidence and
its totals remain unchanged. Corrected native qualification is still required, as
are physical keyboard/IME, OS drag/drop, live SDK/create progress and focused human
acceptance. Next decision: one additional corrected Windows/macOS production dispatch,
no automatic retry or merge. No workflow is pending.


### Corrected qualification dispatch and same-chat wait — 2026-09-30

- User explicitly answered “Yes” to one corrected Windows/macOS qualification with
  no automatic retry or merge. Published/local branch heads matched
  `d129d9c016517ffecf7276bb04a4bb8e6fe996b1`; working tree was clean. The prior run was
  terminal and no competing pending production run was listed before dispatch.
- Dispatched once: `production-scaffold.yml`, `upload_packages=true`, branch
  `feature/phase-1g-branches-runtime`. Confirmed
  [run 36653112288](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36653112288),
  attempt **1**, created **2026-09-30 01:01:26 UTC**, tested exact SHA **d129d9c016517ffecf7276bb04a4bb8e6fe996b1**.
- Last observation **01:01:58 UTC**: in progress. Preflight repository/privacy,
  rejection fixtures, case/selector audit and frontend checks passed; full browser
  preflight running. Supported target jobs had not yet been observed. No result or
  build count for this second run is inferred in advance.
- Cumulative refresh: two accepted hosted dispatches (initial plus one approved
  correction), each attempt 1; no attempt rerun or duplicate. First-run totals remain
  two production Tauri builds/twelve top-level native starts, plus the separate early
  Mac debug build/launch. Audit second-run totals and artifacts at completion. The
  added allowance is consumed; further costly retries require a new decision.
- State **awaiting_ci**. Publish this docs-only wait record, stop model polling and
  resume the same chat on user command to inspect this exact run/attempt, current refs,
  all required gates, evidence and package identity. Deliver verified review packages
  while retaining explicit native input/drop/live progress and human-acceptance gaps.
  No merge, autonomous Goal, automatic watcher or claimed client runtime pause.

### Second qualification failure and timing reassessment — 2026-09-30

**UI-QUAL-2: FAILED; timing gaps reproduced locally, bounded corrections verified.**
The user resumed after both platform jobs failed and asked why local checks passed.
The previous fixture tests modeled immediate commits and small project reads; they
proved selector compatibility but omitted native operation timing and the compact
route-b viewport. Passing that preflight on both CI hosts did not close those gaps.
This audit adds no native launch/build or hosted dispatch.

- [Run 36653112288](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36653112288),
  attempt **1**, tested **d129d9c016517ffecf7276bb04a4bb8e6fe996b1**, tree
  **9b1deccc879d092c6e4323a87615c51d5b28e7c2**, input `upload_packages=true`.
  Created 2026-09-30 01:01:26 UTC; completed failed 01:28:10 UTC.
- macOS job **109691837741** and Windows job **109691837781** passed preceding
  frontend/core/isolated-flow/browser/official archive SDK lifecycle and handoff,
  runtime service/diagnostic SDK, desktop, package build and source-scan gates.
  Preflight passed 69 frontend tests plus browser checks; those browser checks also
  passed on both supported targets. SDK cache hits skipped fetch; no live download
  UI evidence is inferred.
- Required packaged report gates failed. Boundary smoke, dependency/license inventory
  and normal success installer upload were skipped. Failure retention and deferred
  browser gates passed. All twelve reports confirmed cleanup; two Tauri production
  builds and twelve top-level case starts occurred. No boundary-smoke start occurred.

| Packaged UI case | macOS ARM64 | Windows x64 |
| --- | --- | --- |
| compile | PASS | PASS |
| lint | PASS | PASS |
| route-a | FAIL: overlapping persistence | FAIL: overlapping persistence |
| route-b | PASS | FAIL: overlapping persistence |
| runtime-error | PASS | PASS |
| ui-refresh | PASS | FAIL: opening/editor timeout |

**Route failures — exact local reproduction.** Three reports stopped at
`branches-real-edit-restored`, with app status Saved, runtime idle and notice
`Runtime action failed: Another persistence operation is still in progress.` The
status layer intentionally delays Saving/Checking text by 200 ms to prevent flicker.
The driver waited 30 ms then accepted the previous Saved label, although the commit
still held authoring ownership. Its next controlled-play installation was correctly
refused. Existing fixtures returned immediately and hid the race. A 150 ms delayed
`scene.apply` updateBeat receipt reproduces that exact notice. The driver now waits
for the original expanded Beat form to disconnect after its accepted receipt before
continuing. The test keeps the delay. No expected state is written, assertion removed,
mutation replayed or long-play minimum reduced. Helper-install failures now report
immediately instead of waiting through a 190-second timeout.

**Windows UI-refresh — application race reproduced, native cause still uncertain.**
The report had no completed checks and only `stage: welcome` / `Timeout at welcome`;
that label covered opening, navigation and editor readiness. The native fixture has
500 scenes, 506 files and 105627 source bytes; the local visual fixture was tiny.
Initial `scene.list` bypassed the renderer request lane while the Source navigation
button was already visible. Holding the read for 1200 ms and refusing overlapping
Source reads reproduces the old timeout. Scene/authoring/flow reads now join the lane,
with runtime Stop/control still independent. A separate early-navigation test clicks
Source during the held read and asserts editor readiness with zero overlapping
Source requests. The UI-refresh probe waits for real initial Story content and records
separate project/Story/Source stages plus bounded failure state. That additional setup
wait does not replace the early-navigation application regression. The original
Windows native report cannot conclusively identify its cause; native confirmation
remains required. Do not present the reproduced race as complete native diagnosis.

**Compact layout coverage.** The packaged route-b case runs at 640×720, whereas the
previous browser preflight used 1100×720 for all cases. Preflight now matches both
native sizes; the driver opens the collapsed Scenes/files tree before selecting a
Source file. Both route scripts pass with delayed receipts and retained 9.5-second
observation assertions.

| Retained evidence | Artifact ID / name | Executable SHA-256 |
| --- | --- | --- |
| macOS ARM64 | `11071683431` / `phase-1-q1-package-evidence-macos-26` | `dc7883e1ef4e5488c8a698238ce1265591903cacb06d32ed4687a973f0041576` |
| Windows x64 | `11072380234` / `phase-1-q1-package-evidence-windows-2025` | `9fbdf2ef0110ccd08939d5d2eeb5c0f60af54782c1a81a7b097d3896510eeef4` |

Manifests match run/attempt/candidate/tree and correctly retain all six cases. Retained
bytes and the Mac archived executable were hash-verified; Mac tar SHA-256
`799956ccefe2d586ebf7edb76100f50ad5358aae665c602c1a1c5aa87ff07de4`.
Mac artifact expires 2026-10-07 01:19:56 UTC; Windows 01:28:04 UTC. Both are diagnostic
packages of a failed candidate. Raw logs, screenshots and reports remain in ignored
local evidence; no binary was installed or launched during this audit.

**Verification and limits.** Expected failures are retained locally: delayed-save
route refusal, delayed-startup timeout and ordering-unit failure against the old lane.
After correction, 70 frontend tests pass with zero skips; full Source/browser suite
passes its legacy rejecting control, editor/save/selection/undo checks, both-theme
visual/layout tests, shipped smoke/UI-refresh, separate early navigation and all five
shipped runtime scripts. Rust formatting and desktop compile check pass. No core or
package-retention code changed; their preceding results are not a new native pass.
Repository/link/privacy validation and whitespace checks pass at publication.

**Reassessment and budget.** Two hosted qualification dispatches, each attempt 1,
have now produced four production Tauri builds and 24 top-level native case starts,
plus the separate early Mac debug build/launch. No attempt rerun or duplicate occurred;
prior Q1 totals remain separate. The second allowance is consumed. Avoid another
full matrix based only on fixtures: propose one focused local macOS build and one
native start each of route-a, route-b and UI-refresh first. That allowance is not yet
approved; no new CI dispatch, automatic retry or merge is selected. Publish this
checkpoint and continue the same chat after the user's decision. Windows native
confirmation, physical input/drop, live SDK/create progress and human acceptance
remain open. Neither failed run is superseded into a pass by local corrections.


### Focused native macOS correction proof — 2026-09-30

**UI-NATIVE-1: PASS 3/3; current-candidate Windows qualification remains open.**
User explicitly approved one local macOS build and one native start each of route-a,
route-b and UI-refresh, then confirmed “Go ahead.” The branch was clean at correction
candidate **996737c0bea196416c11afea7ed5660c61e408ae**, tree
**adf733cdde3b2f89f400ed66493a183b1764ba29**. No existing Loomlight instance was running.

- Built one optimized release app bundle with the existing Tauri configuration and
  `--locked`, choosing the app bundle without a DMG. First invocation misplaced
  `--bundles` after the cargo argument separator and was rejected before native
  compilation; frontend build had succeeded. Preserved that failed log and corrected
  argument order using local CLI help. The resulting command was
  `npm exec -- tauri build --bundles app -- --locked`; native compilation/bundling passed.
  There was one completed native build, not a retried failing native executable.
- Host: macOS ARM64 / Darwin 25.6.0; Node 24.19.0, Cargo/Rust 1.90.0. Executable SHA-256:
  **44a09231de931d1ffc41eb1c72e86fc7b179f2029359174820a1653d09d217a6**.
  Existing input recorder captured all tracked application/workflow hashes before
  launch; those hashes and executable digest matched again after the cases completed.
- Existing runner selected exactly `route-a route-b ui-refresh`, one start each,
  disposable profiles/projects and the pinned SDK archive. No source/driver changes
  followed this build, no assertions were weakened and no failed case was retried.

| Case | Result | Wall time | Retained native evidence |
| --- | --- | --- | --- |
| route-a | PASS / exit 0 | 89.292 s | Branch destination commit/reopen/restore; controlled play; 9504 ms running observation; Source save during play; Stop; disk reopen |
| route-b | PASS / exit 0 | 113.265 s | Same route boundaries at 640×720 plus draft refusal/cancel; 10000 ms running observation |
| ui-refresh | PASS / exit 0 | 7.190 s | CSP editor styles; session draft retention; stable editor geometry; Settings return; preference read/write round trip |

All three emitted exactly one passing native report with `cleanupComplete: true`;
none timed out. Runner exit 0. Real native WebView, IPC, service and route SDK/process
paths were exercised; editor input remains synthetic, not physical keyboard/IME proof.
The UI-refresh fixture uses the real 500-scene/506-file native project. This is macOS
supporting proof only: it cannot establish the exact cause or resolution of the
original Windows timeout, qualify the three unselected cases at this candidate, or
replace the previously skipped packaged boundary smoke/dependency inventory.

Full build/runner logs, source/executable identity and three reports remain ignored
under `.toolchains/reports/ui-refresh-native-996737c`. Bundle remains local under
`app/target/release/bundle/macos/Loomlight.app`; no Applications installation occurred.
This evidence update is docs-only; repository/privacy/link validation and whitespace
checks pass at publication. Earlier failed run evidence remains unchanged.

Cumulative refresh cost: two accepted hosted dispatches (attempt 1 each), five
production builds (four hosted and this one local), 27 top-level native starts,
plus the separate early Mac debug build/launch. Retain the rejected pre-compilation
CLI invocation separately. No new hosted dispatch, attempt rerun or native case retry.
This allowance is consumed. Next decision is one current-candidate hosted production
qualification; the existing workflow includes both platforms and has no target input.
That next allowance and merge are not authorized. No workflow is pending; continue
in this chat after the user's decision. Windows confirmation, final native input/drop/
live-progress checks and human acceptance remain open.


### Third qualification dispatch and same-chat wait — 2026-09-30

- After the 3/3 native Mac passes, the user explicitly approved one Windows/macOS
  qualification with no automatic retry. Local/published branch head matched
  **d690d7f8ffc08fbc76411c95147f04422620afbc** and the working tree was clean. The
  previous workflow runs were terminal; no pending production run was listed.
- Dispatched once: `production-scaffold.yml`, `upload_packages=true`, existing branch
  `feature/phase-1g-branches-runtime`. Confirmed
  [run 36661814610](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36661814610),
  attempt **1**, created **2026-09-30 02:52:15 UTC**, tested SHA **d690d7f8ffc08fbc76411c95147f04422620afbc**,
  tree **0948ced672f8c95c16df74c5da52d7c6d9212c77**. Candidate differs from locally
  native-tested `996737c` only in its published evidence documentation.
- Observed **02:52:25 UTC**: in progress, Preflight job **109718037425**; repository/
  privacy, gate rejection fixtures and selector audit passed; Node setup in progress.
  Supported-target jobs/results/build totals have not yet been observed.
- Cumulative refresh: three accepted hosted dispatches, each attempt 1; no attempt
  rerun or duplicate. Before this run, five production builds and 27 native case starts,
  plus the separate early Mac debug build/launch. Preserve the rejected local CLI
  invocation separately. Audit actual additional builds/starts/artifacts at completion;
  do not assume success or counts in advance. Prior Q1 totals remain separate.
- State **awaiting_ci**. Publish this docs-only wait record and stop model polling.
  Resume the same chat to inspect this exact run/attempt, fresh refs, required gates,
  all native reports/cleanup and package identity. Failures/skips remain unresolved;
  local Mac passes do not pre-approve Windows. The new allowance is consumed: no
  automatic retry, further dispatch, merge or new feature phase. No autonomous Goal
  or client pause is claimed. Native physical input/drop/live progress and human
  acceptance gaps remain separate from this qualification.


### Third qualification terminal audit — 2026-09-30

**UI-QUAL-3: PASS on Windows x64 and macOS ARM64; review builds delivered.**
User resumed the recorded workflow. No new run/build/launch was performed by this
audit. Branch and main refs matched their previous records; working tree was clean.

- [Run 36661814610](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36661814610),
  attempt **1**, tested **d690d7f8ffc08fbc76411c95147f04422620afbc**, tree
  **0948ced672f8c95c16df74c5da52d7c6d9212c77**, input `upload_packages=true`.
  Created 2026-09-30 02:52:15 UTC; completed successful 03:12:29 UTC.
- Preflight **109718037425**, Mac **109718361890**, Windows **109718361892** passed.
  Preflight includes 70 frontend tests and full browser regressions. Both targets
  passed frontend/Source-browser, ordinary core, isolated flow, runtime/Branches
  browser, official archive lifecycle and handoff, runtime service/diagnostics,
  desktop, package build, report gate, boundary smoke, privacy, retained package
  identity, dependency inventory, deferred browser gate and successful installer upload.
- Core: Mac **178 passed / 39 ignored / 3 separately filtered**; Windows **173 / 36 / 3**.
  Separate flow, lifecycle, handoff, runtime service, runtime diagnostics and desktop
  each passed **1 / 0 ignored** per target. SDK download-on-cache-miss was the only
  conditional gate skipped; archive cache hits do not prove live SDK-download UI.

| Native case | macOS result / seconds | Windows result / seconds |
| --- | --- | --- |
| compile | PASS / 47.298 | PASS / 51.718 |
| lint | PASS / 44.401 | PASS / 50.797 |
| route-a | PASS / 55.820 | PASS / 60.782 |
| route-b | PASS / 51.648 | PASS / 61.562 |
| runtime-error | PASS / 37.757 | PASS / 49.984 |
| ui-refresh | PASS / 5.295 | PASS / 11.907 |

All twelve case reports have exactly one passing native result, exit 0, no timeout
and confirmed cleanup. Boundary smoke on both targets additionally confirms Source
Save command traces, recovery/conflict handling, Scene/supporting authoring, lifecycle,
navigation/pop-up/webview restrictions and single-instance secondary refusal. Each
target started a smoke primary and secondary; the latter was rejected before lifecycle
setup. Physical keyboard/IME is not inferred from synthetic keyboard events.

The previously failing three Windows cases and Mac route-a now pass with real native
IPC/service/SDK. This verifies the corrected behavior; it cannot retrospectively prove
which individual correction resolved the old Windows timeout with sparse telemetry.
Earlier failed runs remain failed evidence, not relabelled passes.

| Artifact | ID | Expiry (UTC, 2026-10-07) |
| --- | --- | --- |
| Mac production package | `11075500136` | 03:07:43 |
| Mac package evidence | `11075380277` | 03:07:41 |
| Windows production package | `11075580402` | 03:12:18 |
| Windows package evidence | `11075655302` | 03:12:16 |

All four artifacts were available/unexpired and downloaded. Manifest run/attempt/
candidate/tree, input-manifest digest, retained bytes and Mac archived executable were
verified. These are the successfully tested candidate's packages, not rebuilt copies.

| File | SHA-256 |
| --- | --- |
| Mac executable | `9f1770707cb344fb4f9f7d4db88e6dc64e96d6c5577038e3d3d2e196431cf8dc` |
| Mac app tar | `41ff5260f86a2357d89f715978592a8142c711a982b200e77d28a50d52dbad53` |
| Windows executable | `14eafda7e1fa4a40840f4c39cc798842288d972807f9d501cba98cefce66ed2c` |
| `Loomlight_0.1.0_aarch64.dmg` | `00439927529891a4773ae885067543665c3577abd3e7005f54619893c944669b` |
| `Loomlight_0.1.0_x64-setup.exe` | `adb905d7eb69de9f03e1e900020ddd5fc599f43cd436df610d04c72cc104be36` |
| `Loomlight_0.1.0_x64_en-US.msi` | `f53dd8c4c7280e14e54ddf318f283b9f86c4eeccb961aee512ff3e355fbbc66d` |

Installer digests above identify downloaded workflow artifacts; retained executable
identity is linked independently through the probe-input/package manifests. No DMG/MSI
installation or extraction-and-launch was performed by this audit. Review installers,
README and checksum file are copied under ignored
`.toolchains/review-builds/ui-refresh-d690d7f/`; full evidence remains under
`.toolchains/reports/ui-refresh-ci3-audit/`. No host paths/raw logs are committed.

**Cost and continuation.** This run adds two production builds, twelve native scenarios
and four boundary-smoke process starts. Cumulative refresh: three accepted dispatches,
attempt 1 each; seven production builds (six hosted, one local); 39 scenario starts
plus four smoke starts = **43 top-level native starts**, plus the separate early Mac
debug build/launch. Preserve the rejected local pre-compilation CLI invocation; no
GitHub attempt rerun, duplicate dispatch or native case retry. Prior Q1 totals remain
separate. No workflow is pending, and no further build/dispatch or merge is authorized.

State **review_ready**. The UI implementation and automated qualification are complete;
focused human review, physical input/IME, OS asset drop and live SDK first-install/
project-creation progress remain open. Do not archive the task as fully accepted or
merge unreviewed work. Continue this same chat with review feedback. This audit changes
docs only; repository/link/privacy and whitespace checks pass at publication.


### User-requested new-chat transfer — 2026-09-30

The user explicitly requested a handover prompt and continuation in another chat.
Published terminal audit is `ad97c6c7388cdf4e866a80e5015a1d22d5e91a98`; qualification
candidate remains `d690d7f` / run 36661814610 attempt 1, PASS on both targets. Transfer
changes no code, evidence, budget or authorization. CURRENT/HANDOVER now direct the
next chat to the existing branch, verified review installers and remaining human/
actual-device acceptance. No workflow is pending. Inspect fresh refs, preserve newer
work, reuse validated artifacts and do not start a new build/test dispatch or merge
merely because the conversation moved. No new task was created automatically.

### Hands-on review preparation — 2026-09-30

The user resumed UI review on local macOS ARM64 and selected the existing qualified
installers. Fresh remote feature head and clean local HEAD matched transfer checkpoint
`b8301f8a6357e5ba15c5b1fbb8c6ef4ab7b2364b`; main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
PR #17 was freshly confirmed open/draft/conflicting. Only documentation differs
between candidate `d690d7f` and the incoming checkpoint. All three local installers
passed `shasum -a 256 -c SHA256SUMS.txt` against the recorded terminal-audit digests.
No installer was opened, installed or launched by this preparation; no new visual or
physical-input result is claimed. The stale top-level `awaiting_ci` label is corrected.

**Install and compare.** On this Mac, open
`.toolchains/review-builds/ui-refresh-d690d7f/Loomlight_0.1.0_aarch64.dmg`, copy its
Loomlight app to Applications, then launch that copy. If an older Loomlight is running,
close it first; the displayed version alone does not distinguish these 0.1.0 builds.
The x64 setup EXE and MSI are for Windows; Windows physical/native review requires
a Windows host. Reuse these exact artifacts rather than rebuild.

Use disposable review content and the [saved reference index](../../design/ui-refresh/README.md).
Compare layout, hierarchy, spacing, density, alignment, colour roles and responsive
panels; generated sample artwork/text and OS font differences are illustrative.
Start with Welcome and the four-step wizard, then Story and Source, followed by the
remaining catalogue/Branches/Settings surfaces. Preserve written corrections over
generated details. Both themes and the actual laptop window need final feedback.

| Remaining row | Focused hands-on action and expected result | Current evidence |
| --- | --- | --- |
| Physical keyboard / IME | In Source and inline Story dialogue, type with the real keyboard and an available IME; finish composition, select/copy/paste, undo/redo and use Cmd/Ctrl+S or dialogue Cmd/Ctrl+Enter. Confirm text is retained, commits occur after composition and status updates do not move caret/editor/footer. | Open; synthetic events do not close this row |
| OS asset drop | Drag disposable image/audio files from Finder or Windows Explorer into Assets. Indicator appears only during dragging; choose asset type before import, inspect resulting entries and dismiss a staged import without unintended changes. | Open; actual OS gesture required |
| Live SDK download | At wizard step 2, use Install verified 8.5.3 when a genuine download is needed. Observe measured bytes/total when available, then distinct Verify and Install stages, responsive UI and stable controls. A cache hit does not prove network progress; retain installed SDKs/caches. | Open; prior qualification used cache hits |
| Project creation | Create a disposable project through all four steps. Observe actual Prepare/Generate/(Git if selected)/Validate/Finalise/Open stages, indeterminate activity and no guessed overall percentage; enter the workspace only after successful completion. | Open; final visual/native progress feedback required |
| Visual / UX | Compare wide/compact layouts and both themes with the controlling references, including saved-state cues, roughly one-third initial Story preview, writing focus, Source tabs and Settings hierarchy. Record actual size/scaling and any clipping, awkward density or unstable status. | Open on both supported targets |

Record each finding here with platform, installer candidate, surface/theme/window,
action, expected versus observed behaviour and reproducibility. Keep screenshots/logs
with personal paths or project content ignored/local; commit only sanitized findings.
Do not mark an acceptance row passed before the corresponding observation is supplied.

**Continuation:** user installs/opens the verified Mac package and begins Welcome/wizard
comparison in this same chat. No workflow is pending. No further build, native automated
scenario, CI dispatch, conflict resolution, merge or new phase is selected. This
preparation adds zero builds/launches and preserves the cumulative totals above.
Repository validation and whitespace checks are required before publication.

### Welcome feedback — 2026-09-30

The user supplied a running macOS Welcome screenshot in Light theme and reported
three corrections during review of the delivered `d690d7f` candidate. The supplied
image supports the missing icon and undifferentiated column backgrounds; absent
hover feedback is a user-observed interaction finding, not something a still image
proves. Compare with `welcome-light-dark.png`, which shows a cog beside Settings and
separate tones for the intro/actions and Recent Projects areas. Logical window size
and display scaling are not inferred from screenshot pixels. The screenshot contains
personal paths and remains conversation evidence, not a committed repository asset.

| Finding | Observed / source inspection | Requested correction and completion check | State |
| --- | --- | --- | --- |
| WELCOME-01: Settings affordance | Footer Settings has no cog and resembles the adjacent passive footer labels. `shell()` creates a text-only `shell-settings` button; its refresh styling only prevents wrapping. | Add a cog consistent with the existing line-icon family beside the Settings label and clear button/hover styling, with a visible keyboard focus state. Keep it at the bottom and distinguish it from Local workspace/Ready without changing footer height. Check both themes and compact width. | Recorded; correction pending |
| WELCOME-02: Column separation | Intro/actions and Recent Projects share the page background. The refresh rules give neither column its own background. | Use distinct palette surface tones for the two column areas, matching the reference hierarchy: a panel tone behind intro/actions and the main page tone behind recents. Retain a clear boundary and readable contrast in Light/Dark; preserve compact stacking. | Recorded; correction pending |
| WELCOME-03: Recent-project hover | User reports no colour response when hovering a project. Refresh styles provide a fixed raised card background and no recent-project hover treatment. | Give available project entries a visible hover colour and pointer affordance, with equivalent keyboard focus feedback. Preserve Remove as a separate action and unavailable projects as disabled; hover must accurately indicate the opening action. Check enter/leave without layout shifts. | Recorded; correction pending |

These are concrete visual/interaction findings against the accepted Welcome design;
they do not reopen the passing automated results or close final Welcome acceptance.
Only docs changed in this feedback checkpoint. No application correction, build,
agent app launch or dispatch occurred; user review observations are separate from
the retained automated-start totals. Continue collecting feedback in this same chat.
The current installer remains the comparison baseline; implementation/qualification
of accumulated corrections is not selected by this review-only checkpoint.

### Project details initial inspection — 2026-09-30

The user opened New Project. Read-only inspection of the existing Loomlight window
confirmed step 1 of 4 in Light theme with blank Game title/Folder name, no selected
parent, final-path placeholder and Back to home/Continue. No fields were changed,
navigation invoked or project created by the agent. Editable Folder name is the
intentional retained capability absent from the generated four-step reference.

**WIZARD-01 — user-confirmed correction, implementation pending:** the shaded
step rail ends below its four entries, leaving a white lower-left area inside the
wizard card. The saved `new-project-four-steps.png` shows the rail extending to the
action-row boundary. The user explicitly requests that this column extend to the
**bottom of the entire wizard box**, including beside the right-hand action area.
Use that full-height background and divider on all four side-by-side wizard steps;
keep the step labels grouped at the top and preserve the horizontal step rail at
compact widths. Check both themes, no lower-left white gap and no clipping or added
scrolling. This user direction controls the exact extent over the generated reference.
Do not infer a breakpoint or logical size from captured screenshot pixels. This is
visual evidence only, not validation of title generation, destination selection,
input preservation, download or creation progress. Next: user reviews this layout,
types a disposable title, checks generated/editable folder name and chooses a parent
to inspect the exact final-path preview before continuing.

The user's subsequent screenshot confirms the same gap and selects this correction.
Only the finding/continuation wording changed; no application code, build, launch or
dispatch was performed. Continue the existing build review; correction remains pending.

### Project details user checks and SDK review — 2026-09-30

The user reports all three requested Project details checks work on this Mac:
title-generated folder name, independent folder-name editing and parent selection
with the exact final-path preview. Record these as **user-reported PASS** for this
session, not Windows evidence or blanket physical keyboard/IME acceptance.
WIZARD-01 remains pending; functional success does not close its layout correction.

Fresh read-only native observation found the user already on step **2 of 4 — Ren'Py
SDK**, with compatible managed **8.5.3** selected, Install verified 8.5.3 and Browse
existing SDK available, and Back/Continue controls. No agent click, installation,
download or new app launch occurred. The same short step-rail background is visible
here and belongs to WIZARD-01. Continue reviewing SDK presentation, then Game
configuration using the selected existing SDK. Live network-download progress stays
open because discovering an installed SDK does not exercise it. No creation occurred.

### SDK wording feedback — 2026-09-30

**SDK-01 — user-requested wording correction, implementation pending:** the user
finds "Browse existing SDK" awkward and suggests "Select Existing SDK" or similar.
Use **"Select existing SDK…"**, matching the other controls' sentence case and using
an ellipsis to indicate that a folder picker opens. Preserve the existing selection,
compatibility validation and cancellation behaviour; this is a label correction.
Review the rendered/accessibility label and any affected wording-based selectors when
implementing the accumulated corrections. The running qualified build remains
unchanged. Continue SDK visual review, then Game configuration; live download remains
open. This feedback record adds no build, launch or dispatch.

### Accepted resolution-picker correction — 2026-09-30

**CONFIG-01 — accepted design, implementation pending.** Native observation found
Game configuration, step 3, with Full HD 1920 × 1080 selected. The user reports the
resolution picker is small and hard to read, requested suggestions and a small mockup,
then explicitly accepted the proposed larger dropdown with aspect-ratio preview.

- Target a comfortable 44–48 logical-pixel control height, roughly 16-pixel readable
  text and an approximately 420-pixel maximum width that fits the available panel.
  Use normal density/scaling rules and generous padding with a clear dropdown arrow;
  achieve the rendered native control size, not only a nominal CSS declaration.
- Keep the supported Full HD, HD, QHD and Custom choices, default selection and
  dimension validation. Show name and dimensions clearly, e.g. Full HD · 1920 × 1080.
- Below the selector, show a small rectangle computed from the selected valid width
  and height, with its aspect ratio and the caption "Game resolution, not editor size."
  Fit the preview within a bounded area while preserving actual proportions. Retain
  Width/Height fields on Custom and handle incomplete/invalid input without a false
  ratio. Apply the existing Light/Dark palettes and compact layout rules.
- This is the resolution-block correction inside the existing wizard shell; the
  cropped mockup does not redefine the whole wizard or its navigation/actions.

The accepted final image is saved unchanged as
[game-configuration-resolution-picker.png](../../design/ui-refresh/game-configuration-resolution-picker.png).
The [reference index](../../design/ui-refresh/README.md) routes to it; the
[manifest](../../design/ui-refresh/manifest.json) records original name, SHA-256,
built-in image-generation method and final edit prompt. Original generated images
remain preserved. Written dimensions/proportions control over approximate raster
details. This acceptance is design approval, not implementation/native acceptance or
authorization for another build/CI dispatch.

Six accumulated corrections remain pending: WELCOME-01/02/03, WIZARD-01, SDK-01
and CONFIG-01. Title/folder/destination checks retain their user-reported Mac pass;
resolution preset/Custom input checks have not yet been reported passed. Continue
those checks on the qualified existing build, then Review & Create and actual creation
progress. Live SDK download, physical keyboard/IME, OS drop and final two-platform
visual acceptance remain open. This checkpoint changes docs/design references only;
no application code, build, app launch or dispatch occurred.

### Review & Create checkbox feedback — 2026-09-30

Read-only native observation found the user's wizard at step 4, with the summary
and expanded Advanced section visible and Initialize local Git repository unchecked.
No agent navigation, selection or project creation occurred. Resolution preset/Custom
checks are not inferred passed merely because the user reached this step.

**REVIEW-01 — user-requested layout correction, implementation pending:** the Git
checkbox appears below its label, which the user finds awkward and unpolished.
Place the checkbox immediately to the left of "Initialize local Git repository" on
one aligned row inside Advanced. Make the label clickable with the checkbox and
retain visible keyboard focus. Allow long text to wrap within the label column while
the checkbox stays aligned with the first line; use the same checkbox-row treatment
as comparable application controls. Preserve the existing selected value, default,
Local Git summary update and creation behaviour. The current `field()` form layout
stacks a label span above its control; this checkbox needs an appropriate horizontal
row rather than changing the layout of every text-input field.

Seven accumulated corrections now remain pending: WELCOME-01/02/03, WIZARD-01,
SDK-01, CONFIG-01 and REVIEW-01. Continue reviewing the summary, then observe actual
project-creation progress in the existing qualified build. This checkpoint changes
only the review record; no application code, build, agent app launch or dispatch.
