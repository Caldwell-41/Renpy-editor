# UI design review

**Updated:** 2026-10-02. **State:** review_ready; scoped authoring/startup fixes locally verified and Mac package ready; human acceptance open.
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
  The 2026-10-02 review correction below adds a compact persistent drop target;
  its stronger drag-over indicator still appears only during dragging.
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

### Creation observation and Story review — 2026-10-02

The user reports project generation completed rapidly with no specific issues noticed
and requests continuation to Story. Fresh read-only native observation confirms the
created disposable project is open in Story with Scene 1, starter Narration and
Return / End Beats. Record successful fast completion and workspace entry as a
**user-reported Mac pass**, supported by the visible resulting workspace. No elapsed
measurement, detailed stage-by-stage observation or long-running progress behaviour
is claimed. This report introduces no creation defect or demand for an artificial
delay/repeated creation solely to inspect a brief progress display.

Current Story observation: Light theme, navigation and scene list visible, preview
above Beats, scene details collapsed, Writing focus off. Preview allocation control
reads 59%; the reason for that value is not inferred. The accepted initial allocation
is roughly one-third with remembered user adjustments, so this observation alone is
not classified as a default-size defect. The starter project has no background, and
the preview honestly shows that empty state. Compare structure with the saved Story
layout and colour with the accepted palettes, rather than importing mockup artwork.

Next: review Story spacing/panel proportions, open the starter Narration for inline
editing, observe physical typing/commit/undo and status stability, and try Writing
focus and panel controls. Do not infer these checks passed from initial inspection.
Seven existing visual/wording corrections remain pending implementation. Live SDK
download, physical keyboard/IME, actual OS drop, resolution preset/Custom user checks
and final visual acceptance on both targets retain their open/unreported limits.
This continuation changes documentation only; no agent project edit, creation, app
launch, build or dispatch occurred. User-driven creation is separate from retained
automated scenario/build totals.

### Story controls and Choice layout feedback — 2026-10-02

The user supplied a Light-theme Story screenshot with preview hidden, an expanded
Choice and its Create New Scene form open. It demonstrates an oversized creation
button and fields displaced to the right, with content at the card edge. The user
requests removal of the redundant Preview size slider and an overall consistency
pass on buttons. Do not touch the user's active form or infer successful commits,
undo or IME checks from the screenshot. No native action is required to record it.

| Finding | Requested correction / implementation considerations | State |
| --- | --- | --- |
| STORY-01: Redundant preview slider | Remove the Preview size label/range from the Beats toolbar, including while preview is hidden. Retain the divider as the resize control with pointer and existing ArrowUp/ArrowDown keyboard operation, remembered allocation and roughly one-third initial default. Update layout reset and resize state so they do not depend on the removed visible slider. Review affected selectors using the remaining divider rather than removing resize coverage. | User-selected correction; pending implementation |
| STORY-02: Choice scene creation layout | Make Create New Scene a normal-sized secondary action, with intrinsic height/width rather than grid stretching. Place the revealed form in its own full-width section beneath the choice options/action area: labels above Choice text, New Scene name and Chapter, fields aligned in columns where space permits and stacked in compact layouts. Keep its Cancel/Create Scene and option controls grouped inside that section, distinguish them from the Choice's Cancel/Commit Beat actions, prevent clipping and unnecessary text wrapping. Preserve staged input, explicit creation/commit and the existing transaction/draft rules. | User-selected correction; pending implementation |
| BUTTON-01: Shared button consistency pass | Review Welcome, wizard, Story, Source, Branches, catalogues, Settings and Runtime for coherent button roles, height/padding, text size/weight, radius, alignment, spacing, hover/focus and disabled styling. Define deliberate normal/compact variants through shared styles; primary emphasis comes from role/colour, not accidental oversizing. Keep button dimensions stable when busy; prevent grid/flex stretch and cramped multi-line labels. Preserve all operations and existing specialised toolbar needs. This is a visual/control-layout pass within the UI refresh, not new authoring features. | User-selected correction; pending implementation |

Source inspection supports these observations: `scene-ui.ts` currently renders both
the slider and keyboard-enabled divider; `main.ts` layout reset queries that slider.
The Choice editor uses the general `beat-fields` grid and appends creation actions
and `choice-new-scene` directly into it. This supports a grid-placement/stretch
explanation for the screenshot; rendered correction still needs verification.

Ten accumulated findings now remain pending: WELCOME-01/02/03, WIZARD-01, SDK-01,
CONFIG-01, REVIEW-01, STORY-01/02 and BUTTON-01. Continue gathering Story feedback,
then physical editing/commit/undo and Source review using the qualified existing build.
No application changes, agent draft edits, launches, builds or dispatches occurred in
this checkpoint; prior pass/failure evidence and budgets remain unchanged.

### Choice overflow and single new-Beat confirmation — 2026-10-02

The user's additional screenshot shows a horizontal scrollbar across the Beats area:
the new-scene fields/actions overflow the Choice card, the view pans horizontally
and the left-hand Beat content is clipped. This strengthens STORY-02's observed
layout defect beyond inconsistent styling. Its correction must keep the form and
both action groups within the card at wide/compact sizes, with vertical stacking
instead of requiring horizontal scrolling to reach Create Scene and option.
Preserve the user's active draft; no UI interaction or mutation was performed here.

**STORY-03 — user-requested confirmation correction, implementation pending:** after
confirming creation of a new Beat in the Add Beat form, the user should not see a
second required-looking Commit Beat step. Source inspection of `renderNewBeat()`
shows the confirming Add Beat button already submits `insertBeat` through
`actions.apply`; after success it selects the inserted Beat and redraws its existing-
Beat editor. That editor displays Commit Beat despite the creation already being
saved. This explains the reported extra confirmation; it is not evidence that the
initial insertion was never saved.

On successful creation, close the new-Beat form and leave the new Beat as a saved,
collapsed row, brought into view with suitable focus/selection feedback. Do not
automatically reopen an edit form or create a fresh draft requiring another commit.
Only a deliberate subsequent edit opens its editor. Keep one creation transaction
and truthful Saved feedback after its receipt; prevent duplicate submission while
pending. Invalid input or failed save must keep the creation form/input available
with the actual error rather than presenting a saved row. Cancel still discards
only unsubmitted input. Keep toolbar Add Beat as the entry to the type/details form;
the completed form's confirmation is the one save. Intentional dialogue continuation
remains its separately selected workflow, not an automatic extra creation commit.

Eleven accumulated findings are now pending: WELCOME-01/02/03, WIZARD-01, SDK-01,
CONFIG-01, REVIEW-01, STORY-01/02/03 and BUTTON-01. Continue Story feedback and
physical editing/undo review before Source. This checkpoint records the requested
behaviour and source explanation only; no application correction, agent draft edit,
launch, build or dispatch occurred. Existing qualification and budgets are unchanged.

### Chapter disclosure and Writing focus feedback — 2026-10-02

**Writing focus — user-accepted Mac UX:** the user says "Writing focus is good".
Record positive acceptance of the behaviour reviewed in this session. This does not
infer completion of typing/IME, commit/undo, all compact layouts or Windows checks.

**STORY-04 — user-requested chapter disclosure, implementation pending:** the user
should be able to collapse and expand individual chapters in the Story tree. Add a
clear chevron/disclosure control beside each chapter name; default chapters expanded.
Collapsing hides that chapter's scene list without changing the selected scene,
navigating away from its editor or modifying source. Preserve chapter menu actions,
pending inputs and normal selection/navigation contracts. Provide Enter/Space keyboard
activation, accurate expanded state and appropriate focus return if a focused child
is hidden. Keep the state stable through ordinary workspace redraws within the
project; this is tree presentation, not game metadata or new chapter authoring.
Source currently renders chapter headings and child scenes without a disclosure.

Twelve corrections now remain pending: WELCOME-01/02/03, WIZARD-01, SDK-01,
CONFIG-01, REVIEW-01, STORY-01/02/03/04 and BUTTON-01. Continue remaining Story
editing/commit/undo observations, then Source review. This checkpoint records
feedback only; no application correction, agent draft edit, app launch, build or
dispatch occurred. Existing qualification and cumulative budgets are preserved.

### Character/background authoring blocker — 2026-10-02

**AUTHORING-01:** the user cannot create a Character or import a Background and sees
"The authoring value is invalid." The user explicitly selected fixing this blocker,
one new local macOS ARM64 review build, and restarting review at Story. This supersedes
the earlier review-only build restriction for this defect only. The twelve accumulated
UI corrections remain pending; no CI dispatch, Windows build, conflict resolution,
merge or new feature phase is selected.

Initial hypothesis: renderer identifier rules accept uppercase ASCII letters while
the core accepts only lowercase identifiers, 1–64 characters beginning with a letter.
Background import derives its suggested name from the filename without lowercasing it;
Character creation sends entered technical names unchanged. All invalid identifier,
colour, payload and variable-value errors currently share the same vague message.
Confirm the user-action boundaries with rejecting frontend checks and real core IPC,
normalize only new technical names (retain display names), preserve failed input and
existing transaction/import authority rules, then package once after focused checks.
Use existing toolchains and the packaged UI-refresh probe where relevant. First
correction attempt; zero new builds/native starts/dispatches so far. Two unsuccessful
corrections of this hypothesis require reassessment under WORKFLOW.

User clarification confirms the background succeeds after lowercasing its name and
macOS was capitalising the Character technical input. A Character is now visible
with Saved status in the unchanged qualified app. Colour was also changed during
the user's retry, so that observation does not separately implicate the default colour.
Added checks separately exercise the default `#c5c8d0` and canonical names. Frontend
rejecting checks failed on the old paths; correction passes all 71 frontend tests.
Real core IPC creation/import/reopen passes. Its first test run failed because the
inspection-only fixture lacked `game/images`; fixture setup was corrected, not the
transaction policy or production code.

**STARTER-GUI-01:** the user additionally reports a real-game startup exception for
missing `gui/button/*background.png`. Include this blocker before the same single
new Mac build. Pinned SDK source shows normal launcher creation performs `gui_images`
after `generate_gui`; Loomlight currently omits that command. Compile/lint cannot
prove the standard menu renders. Add the missing version-owned generation step in
the private stage and an exact SDK regression for the generated assets. Direct
inspection of the user's Downloads project is unavailable under macOS privacy
restrictions even with shell escalation; do not infer file absence from denied reads.
The first exact SDK check was blocked by sandbox access to Ren'Py's save-token path;
rerun that check with the required host access. No app package/CI run started yet.

Implementation: new Character/asset/expression technical inputs suppress automatic
capitalisation, spelling correction and autocorrect, normalize ASCII capitals and
surrounding spaces before IPC, and retain display-name case. Invalid identifiers
and colours have specific error text. Existing source identifiers are never renamed.
The SDK adapter now runs desktop `gui_images` inside the controlled private stage.
Opening/updating existing projects does not execute that generator or overwrite GUI
assets; restart review with a fresh disposable project after installing the new app.

Pre-package checks: 71/71 frontend tests; existing UI-refresh browser regression PASS
(both themes/all workspaces, layout/draft/smoke driver checks); routine core 179
passed, 40 ignored, 3 separately filtered; exact core IPC create/import/reopen PASS;
exact official-SDK lifecycle creation plus standard-menu/first-dialogue PASS. The
browser's initial local listener was sandbox-blocked; its first host run exposed a
static fixture that did not implement Character creation. The fixture now models
validation, collision, creation and the source definition, with a unique probe name.
Those changes repair the test model rather than weakening the native assertions.

SDK-check development failures retained in ignored reports: sandbox save-token
write; incorrect expected slider filename (corrected against pinned SDK source);
strict lint of the raw SDK demonstration script's intentionally absent sample art
(replaced with the actual Loomlight lifecycle); incorrect expected creation receipt
`created` (actual contract is `complete`). These are fixture/assertion failures;
one production correction per blocker, zero production packages/CI dispatches yet.
No hypothesis was retried through another package. Whitespace/repository validation
passed. Next: one Mac package and its enriched packaged UI-refresh case. Windows
qualification remains only for the unchanged earlier candidate.

**Correction package ready:** implementation candidate
`01d089624ca2113db673116561b8ba0298216cb5`. One local macOS ARM64 release build
produced app + DMG; an initial CLI invocation rejected `--locked` before compilation
or bundling, then corrected forwarding (`-- --locked`) started the sole actual build.
Both logs remain under ignored `.toolchains/reports/ui-refresh-01d0896/`.
The enriched packaged `ui-refresh` case passed all nine checks in **5.07 s**, exit 0,
no timeout, exactly one passing report and `cleanupComplete: true`. It separately
confirms default hex colour, canonical new Character name and actual persisted `.rpy`
definition. Its input is synthetic, not physical keyboard/IME acceptance.

Retained installer: ignored
`.toolchains/review-builds/ui-refresh-01d0896/Loomlight_0.1.0_01d0896_aarch64.dmg`,
SHA-256 `109758abbc8119e6f41a3708af07b6371eb2e4bc544822eeb3c142130bfeb16c`.
The retained app executable hash is
`ddb017e7418bb5380a1d3537f34227e38dbd83cd514ba463e430c24b4ff766c5`;
`SHA256SUMS.txt` and `BUILD.json` accompany it. Copied installer checksum rechecked.
No binaries, user project, SDK or full logs were added to Git.

This outcome adds **one** production build and **one** packaged native case start;
cumulative UI-refresh totals become eight production builds, forty packaged scenario
starts, plus the unchanged four boundary primary/secondary starts (44 total).
The older separate Mac debug launch remains separate. Two successful SDK test runs
of the same disposable menu/dialogue path (second requires positive named result)
and the recorded development failures are separate from packaged scenario totals.
No manual CI dispatch or Windows verification occurred. Original cross-target
qualification at `d690d7f` remains retained, not reused for changed inputs.

Native observation found the old test project Saved and its failed game process still
running. The agent clicked Stop and quit the old app normally before the isolated new
package check; no draft discard or private-source rewrite occurred. Reopen with the
new installer, replacing the Applications copy, create a fresh disposable project,
and restart Story. Existing test-project GUI assets are not repaired by an app update;
its content is preserved for any separately requested repair. Twelve accumulated
visual corrections and physical input/drop/live-download/final visual acceptance
remain open. No workflow is pending; PR #17 stays draft/open/conflicting, no merge.

### Bootstrap follow-up verification — 2026-10-02

The user requests double-checking that new Ren’Py games bootstrap correctly after
the corrected installer. Continue STARTER-GUI-01 with focused verification of the
existing production lifecycle; no new app build, workflow dispatch, integration or
visual implementation. Fresh feature refs match `3fad28f`; main is unchanged. The
separate milestone-planning worktree is preserved. Extend the exact SDK regression
to cover preset/custom dimensions, optional Git, metadata/reopen, standard menus
and execution without editor metadata. Record actual results below; do not infer
Windows or physical-input acceptance from the Mac SDK run.

**Result: PASS.** The exact official-SDK test selected one test, zero failures or
ignored cases, 221 filtered, **14.59 s**. It creates two projects through the real
production lifecycle: 1280×720/Git off and custom 1600×1000/Git on. Both complete
compile/lint and publication, have the expected scripts/metadata/GUI assets, open
Chapter 1/Scene 1, retain the 8.5.3 adapter/version and reopen with the same project
and Scene identity. Git-on is a valid repository; Git-off has no `.git` directory.
Named passing SDK executions assert the actual runtime resolution, title and build
name; render Preferences, Load and Save; start the first dialogue and return to the
main menu. The custom game succeeds after removing only its disposable editor
metadata, preserving the source-authoritative runtime boundary. No new production
defect or unsuccessful follow-up attempt occurred. Formatting and whitespace checks
pass; the full ignored report is `.toolchains/reports/starter-bootstrap-follow-up.log`.

Only regression coverage and documentation changed; packaged application inputs
remain `01d0896`. Reuse that installer. Follow-up adds two successful SDK menu test
starts (four total including the two earlier successes), zero production builds,
packaged scenario starts or dispatches. Cumulative package totals remain eight
builds and 44 starts including boundary primary/secondary. PR #17 was freshly read
as draft/open/conflicting at `3fad28f`. Windows verification for corrected inputs,
the twelve visual corrections and remaining physical/live progress acceptance stay
open. Continue fresh-project Story review in this chat.

### Sidebar controls, Beat dragging and Writing focus proposal — 2026-10-02

The user requests subagent research and a proposal for approval before application
changes. Two read-only subagents reviewed official editor examples and the current
code. No implementation, build, app launch or workflow dispatch is selected here.
Fresh feature refs match `b4d6c05`; main is unchanged. Record these alongside the
twelve earlier pending corrections; do not treat proposal preparation as acceptance.

**STORY-05 — sidebar independence and focus, awaiting approval:** replace the
"Collapse navigation" and "Scenes / files" text controls with small icon buttons at
the top of their respective panels. Main navigation alone collapses to the existing
64 px icon rail. Story tree labels, width, chapter state and selection stay intact;
its column shifts left into the reclaimed space. The Story tree/file list has its
own hide button, removing its column entirely, with a restore icon beside the
workspace title. Give each icon a tooltip, accessible name, keyboard activation and
accurate expanded/controlled state. Move focus to a surviving control when hiding
its pane. Avoid conflicting compact-layout rules or invisible retained columns.

Writing focus temporarily hides main navigation completely (including its icon
rail), Story tree/file list and any inspector, retaining the current preview hide.
Keep "Exit writing focus" in the Scene header. Exiting restores the preceding pane
visibility and widths, chapter expansion, selected Scene/Beat and draft, without
overwriting stored layout preferences. This refines the earlier positive Writing
focus feedback; that observation does not accept this expanded behaviour.

Source cause: `app/src/ui-refresh.css:10` applies navigation-collapse styling to
every descendant `.tree-item` and hides `.story-tree`, while the with-tree grid
still reserves that column (lines 25/37). The toggle at `app/src/main.ts:406` changes
only navigation state. Scope compact rules to the navigation aside. Current focus
(`app/src/scene-ui.ts:500`) only controls preview/divider visibility.

**STORY-06 — Beat drag reorder, awaiting approval:** add a small six-dot grip on
the left of each movable Beat row. Dragging from the grip shows a ghost row and a
clear insertion line; drop persists one reorder with one Undo step; Escape or drop
outside a valid destination cancels without changing source. Retain keyboard reorder
through the grip/menu, draft guards and visible failure feedback. Unsupported or
terminal/protected source boundaries remain respected. Do not drag form fields or
turn ordinary text selection into a drag.

The existing `MoveBeat` command (`app/src-core/src/scene.rs:286`) only supports
adjacent up/down movement; drag across multiple rows needs a bounded arbitrary-
destination transaction, not repeated adjacent writes. Preserve exact source bytes,
Beat IDs, expected revision, history and protected-region checks. The existing
unsubmitted-edit guard at `app/src/scene-ui.ts:302` also applies to dragging.

**STORY-04 — reaffirmed:** chapter chevrons collapse/expand only their child Scene
list, initially expanded. Retain chapter menus, selected editor/drafts and stable
expansion state across redraws. This remains pending with the earlier corrections.

Reference patterns: [VS Code Custom Layout](https://code.visualstudio.com/docs/configure/custom-layout)
documents independent visibility controls in top chrome; [JetBrains Tool Windows](https://www.jetbrains.com/help/idea/tool-windows.html)
documents pane-header hide controls and hiding/restoring previously open panes.
The proposed placement adapts these patterns to Loomlight's existing separate columns.

Next: obtain the user's approval of this concrete proposal before implementation.
No package/native/SDK starts or CI dispatches added; existing evidence and cost
totals are unchanged. Continue the same review branch/chat; no integration selected.

### Runtime panel feedback and earlier-project launch — 2026-10-02

**RUNTIME-01 — presentation correction, implementation pending:** the user finds
the Runtime & diagnostics panel awkward and its Close control hard to see. The
supplied screenshot shows a low-emphasis text Close control above four advanced
buttons, then the title/status, long revision wording and an expanded traceback.
Current constructor (`app/src/runtime-ui.ts:65–78`) prepends Close and advanced
controls before the heading; the overlay (`app/src/ui-refresh.css:15/41`) scrolls
as one block with fixed left offsets. This is the Loomlight diagnostics panel,
not the separate Ren’Py game window.

Proposed correction for review: use a compact fixed panel header with the title on
the left and a clear X close button at the top-right (tooltip/accessible name,
visible focus, comfortable target). Keep it visible while scrolling diagnostics;
return focus to the footer toggle when closing. Put a concise run/error summary
first, with the full traceback, process output and revision details expandable.
Put trust/SDK/policy actions under Advanced, preserving their explicit consent and
execution contracts. Closing hides the panel; Stop remains a separate process
action. Fit the drawer to the current editor layout instead of hard-coded navigation
offsets, including collapsed panes and Writing focus. Preserve bounded output and
revision-rechecked source links.

The observed summary says "Game finished · exit 0" alongside a runtime error.
The redesign should keep a detected runtime error visible in the summary even when
the process exits zero, reporting the actual exit code as detail. Current runtime
error status only overrides the normal text while cleanup is incomplete
(`app/src/runtime-ui.ts:189–212`); do not reinterpret process cleanup as a successful
game run. This is a presentation correction, not a change to process ownership.

**STARTER-GUI-01 follow-up classification:** the user again reports the same missing
`gui/button/*background.png` exception. Read-only verification confirms the app in
Applications matches the retained `01d0896` executable SHA-256
`ddb017e7418bb5380a1d3537f34227e38dbd83cd514ba463e430c24b4ff766c5`. The user explicitly
confirms this is the earlier test project reopened, not a new project generated by
the corrected build. Updating Loomlight does not repair its earlier incomplete
GUI assets. This does not constitute a failed fresh-project bootstrap correction;
retain the observed exception and existing passing fresh-project evidence. No
private project was inspected, altered or regenerated. No app launch, build, SDK
run or workflow dispatch added.

Next: resume Story in a fresh disposable project created with `01d0896`, preserving
the earlier project. Repairing its GUI assets is a separate explicitly selected
operation; do not regenerate over custom game files automatically. RUNTIME-01 joins
the twelve earlier pending corrections; STORY-05/06 remain proposals awaiting
approval. The wider UI proposal is still unapproved. Fresh feature refs matched
`e84cec9`, main unchanged; no conflict resolution, integration or new phase selected.

The user chooses to create a fresh project. Await their hands-on Story/Run Game
observation; project creation or launch success is not yet reported. Existing-project
repair is not selected.

**Fresh-project human result:** after choosing the fresh restart, the user reports
"new project works fine" on the local Mac. Record positive acceptance of the fresh
project flow for STARTER-GUI-01, alongside the existing exact SDK bootstrap/menu
evidence. The earlier project remains unchanged; its missing assets were not
repaired. This does not infer acceptance of every Beat type, physical input/IME,
OS drop, live download/progress or Windows. Next: continue Story review; RUNTIME-01
and the accumulated visual corrections remain pending, with STORY-05/06 still
awaiting proposal approval. No new agent build/run/dispatch.

### Source tab presentation and active-file visibility — 2026-10-02

The user moves review to Source in the fresh project and reports that the script
Close button looks detached from its tab, and additional files can open off-screen
without a clear indication. They additionally require the latest opened file to
have focus in the file bar. The supplied view shows one open `.rpy` tab and a Clean
editor/Saved project. This does not infer completion of all Story acceptance or
physical Source typing, save/reopen, conflict and compact-layout checks.

**SOURCE-01 — integrated tab Close, implementation pending:** render filename,
draft indicator and Close X as one visual tab, sharing selected/hover background,
height and boundary. Keep the X attached at its right edge with a useful target,
accessible name and visible focus. Closing a tab retains its draft under the
existing transition contract; do not turn Close into Discard or Save. Long labels
truncate within the tab, with the full relative path available to distinguish
duplicate filenames. Current `app/src/source-ui.ts:775–778` groups name and Close
buttons structurally, but CSS at `app/src/ui-refresh.css:21/29` gives the active name
and Close different backgrounds and applies the selection indicator to the name
only. Correct the unified visual surface without merging their separate actions.

**SOURCE-02 — overflow and active-file reveal, implementation pending:** keep the
open-tab strip inside the available editor width, with visible previous/next scroll
controls and an open-files menu when tabs overflow. Opening or switching to a file
makes its tab active and reveals it in the strip, rather than selecting an invisible
off-screen tab. Keep the matching Source Files row highlighted. The user's "focus"
requirement means the current file must be visibly selected/revealed; preserve the
editor's cursor and readiness for typing without stealing keyboard focus on every
redraw. Preserve independent drafts, selections, undo state and dirty indicators.
Selection after closing the active tab must likewise be visible.

The tab strip currently uses `overflow:auto`, but has no explicit overflow controls
and `openFile`/tab rendering has no active-tab scroll/reveal (`source-ui.ts:692/775`).
A clarification was asked whether the reported overflow refers to top tabs or the
left Source Files list; the follow-up refers to the file bar and active opened file,
so the proposed correction targets tabs. If the left list is also affected, retain
a bounded independently scrollable list with its heading/search visible, rather
than allowing it to spill beyond the window. Do not claim a many-tab reproduction
from the supplied single-tab screenshot.

This checkpoint records feedback/proposed acceptance only. No application code,
private project edits, UI navigation, launch, build or test/CI run added. Fresh
feature refs matched `fc8e0e1`, main unchanged. Source is the current review surface;
continue its feedback and retain uncompleted Story checks. The earlier sidebar/drag
proposal still awaits approval; no integration or new feature phase selected.

### Branches saved routes missing — 2026-10-02

**BRANCHES-01 — confirmed functional blocker, correction pending:** the user moves
to Branches (called "beats" in the message) and reports no connections or Choice
indications. They confirm the Choice routes are saved. The supplied native view has
four isolated Scene cards, "Could not refresh completely" and an unresolved project
start notice. Do not classify this as normal empty flow or only a colour/layout issue.

Bounded native inspection of the existing running `01d0896` app, without source
edits or execution: "View project start" with an unavailable target opened the
current Scene instead. Opening the entry router in Source showed a normal saved
`start` jump to a mapped Scene. That Scene has a saved jump to the Choice Scene;
the Choice Scene contains a standard menu with three saved literal destinations
matching mapped Scene labels. Source was Clean, with no unaccepted drafts and
Saved status. Return to Branches and one explicit Refresh retained the disconnected
graph and incomplete notice. No private source text, labels or IDs are copied into
this ledger. This confirms the graph is not representing the accepted source routes.

Likely cause from code: `app/src-core/src/scene/flow.rs:600–629` checks every lexical
line whose first whitespace-separated word is `label`, including indented screen-
language UI labels. The official pinned GUI `screens.rpy` contains such controls
(e.g. `label title` inside `screen game_menu`). They are not story-label declarations,
but this collector marks the entire label inventory incomplete. Destination resolution
requires a complete inventory (lines 148–183), so mapped destinations become Unknown
and the project entry is not inferred. The renderer draws connections/Choice text
only for resolved destinations (`app/src/branches-ui.ts:89–95`). This explains the
observed warning and lack of arrows. Treat this as a code-backed hypothesis until
a focused rejecting production-service regression establishes the correction. No
parser implementation or test changes have been made in this review checkpoint.

Required correction/acceptance: distinguish screen controls from actual Ren’Py label
declarations without weakening duplicate/dynamic/custom-label uncertainty. Add a
focused case with ordinary SDK screen-language labels and mapped saved jump/Choice
routes; assert entry resolution, all expected literal routes and Choice option text.
Retain genuine unknown/missing/stale notices and bounded ordinary external-edit
coverage. Confirm arrowheads and readable Choice labels in the actual graph; opening
a route must navigate to the correct existing origin/destination. Use source-authority
checks, not guessed connections or chapter order. Branches remains read-only graph
navigation; graph editing is not selected. No need to recreate the already-correct
source project to address this projection defect.

Current surface: Branches, returned there after read-only Source inspection. The
Source tab bar gained entry/Choice tabs as normal presentation state; project files
were not changed, saved, discarded or executed by the agent. This adds zero app
launches, SDK/native case starts, builds or CI dispatches. Fresh feature refs matched
`42c4df6`, main unchanged. Continue feedback gathering; implementation/package scope
for this blocker has not been separately selected. Earlier pending corrections and
sidebar/drag proposal approval remain open; no integration/new phase selected.

### Branches detail popup dismissal — 2026-10-02

**BRANCHES-02 — close affordance, implementation pending:** the user reports that
clicking a graph item opens a modal with no way to close it. Native inspection of
the existing running app reproduces the detail popup on selecting a Scene node.
It exposes Scene/route selectors and navigation actions but no Close control within
the popup. Escape while graph-focused makes no change. Clicking the expanded
"Scene details" toolbar toggle closes it; this existing route is not discoverable
from the popup. The agent closed it with that toggle and left the project in
Branches/Saved. No source edit, save/discard or execution occurred.

This is currently a nonmodal overlay inspector (`branches-controls`), not an
accessible blocking dialog. Add a compact popup header with a clearly visible X at
the top-right, accessible Close scene details label, tooltip and visible keyboard
focus. Escape dismisses the inspector while focus is in it or its graph scope,
without interfering with another active modal. Return focus to the selected graph
node (or the Scene details toggle if the node no longer exists). Keep toolbar
expanded state accurate and provide the same close behaviour in all dismissal
paths. Closing retains selection, graph pan/zoom and source/editor drafts; it does
not navigate or execute. Treat it consistently with the pending sidebar/close
affordance pass, preserving nonmodal graph access rather than introducing a new
blocking overlay.

Read-only code confirms the toolbar toggle changes `controls.hidden` in
`app/src/branches-ui.ts:51`; node selection opens it at line 99. There is no internal
Close or Escape handler. The confirmed missing routes remain the separate functional
BRANCHES-01 blocker. This checkpoint changes docs only; zero new app launches,
SDK/native cases, packages or dispatches. Continue Branches feedback; implementation
and the earlier wider proposal are still pending.

**Remaining Branches human checks — 2026-10-02:** the user reports pan/zoom/Fit
"acceptable for now but needs refinement"; record provisional Mac usability, not
final polish acceptance or a newly specified gesture/layout redesign. The user
confirms Open Scene / View origin in Source reaches the correct place; those
observed navigation paths pass on this Mac. Do not infer resolved Choice-route
navigation or graph completeness: BRANCHES-01/02 remain pending. Next planned
review surface is Characters; moving on does not close either blocker or remaining
physical/cross-target checks. No app changes or additional runs/builds/dispatches.

### Characters preview and appearance controls — 2026-10-02

The user reviews Characters and reports an uploaded image showing "Preview
unavailable", no way to view the other appearances and no way to edit them. Their
supplied view has a rendered Character card image and two appearance rows; the
inspector preview fails. Do not equate that failure with an unsuccessful import.

**CHARACTERS-01 — inspector preview failure, correction pending:** Character card
and selected appearance inspector must show the same valid imported media. Keep
loading distinct from unavailable/error, retain actionable failure information and
allow recovery rather than leaving an initial failure permanently blank. Present
media read-only through the existing bounded, session-owned service.

Code-backed hypothesis: `catalog-ui.ts:25` immediately clones the card thumbnail
into an auto-opened inspector. If it has no src yet, it enqueues another media load;
all caught failures become only "Preview unavailable" (`:20`). Character rendering
starts that load before a persistence read (`main.ts:675–678`), while `media.present`
is outside RequestLane's ordered reads and safe-read retry list (`main.ts:234–245`,
`request-lane.ts`). Concurrent host service checkout may refuse the initial preview;
the later thumbnail can succeed independently. Investigate with a focused rejecting
case for initial auto-selection during loading and host busy/refusal, plus bounded
cache/session disposal. This cause is not yet proven by a test; no implementation
or qualification run has occurred. Reuse valid media/cache where appropriate and
never replay an ambiguous write to recover a presentation read.

**CHARACTERS-02 — view appearances, correction pending:** show each appearance as a
selectable row or thumbnail with its expression/name and a clear selected state.
Selecting one displays its own image and supported details in the inspector. Keep
"Set default" separate: viewing an appearance must not modify the Character's
default or source. Retain the selection through ordinary redraws and allow keyboard
selection; missing media must not make the other appearances inaccessible.

**CHARACTERS-03 — edit appearances, correction pending:** each
appearance needs its own Edit control with Save/Cancel, distinct from Edit Character.
The user explicitly selects both expression/name editing and image replacement.
Keep the fields together in the appearance editor; do not add new render modes.
Current rows (`main.ts:705`) contain only labels, fixed default outfit/pose text and
Set default. Character Edit at line 702 updates only display name/dialogue colour.
The typed API currently exposes `appearance.setDefault`, not appearance update;
editing requires a bounded transaction-backed extension, not a decorative button.
Preserve appearance identity, references, source formatting, expected revisions,
original external images and failed/cancelled input. Any expression rename must
safely update supported references or report protected/unsupported references,
never rewrite scripts with regex. Keep existing static-import scope.

Live read-only AX observation found the user had independently moved to Assets:
both Character images are listed as available and the selected asset has an image
in its inspector. The agent did not navigate away, change defaults, import, edit
or run the project. This observation supports an inspector presentation defect,
not complete acceptance of Assets or proof of the preview failure's exact cause.
Review position: Characters findings recorded; live user view Assets. Continue that
feedback if the user selects it. Fresh feature refs matched `569d57d`, main unchanged.
Only docs changed; zero new launches, native/SDK cases, builds or dispatches. Earlier
blockers/corrections and sidebar/drag approval remain open; no new phase/integration.

**Characters follow-up — 2026-10-02:** the user confirms search and Grid/List switching
work, but calls the list layout unprofessional and wants editing directly from it.
They confirm Edit Character saves display name/dialogue colour correctly. They also
confirm Set default works and retains the choice, but the image only loads after
leaving Characters and returning. These are observed Mac results, not Windows or
all physical-input acceptance. The latest supplied view is Characters in list mode
with the inspector image now loaded and Saved status.

**CHARACTERS-04 — polished list rows and direct Edit, correction pending:** replace
the oversized sparse card-like list row with consistently aligned compact rows:
small thumbnail, display name/technical name, appearance count and a visible Edit
action at the row's trailing edge. Keep search, grid/list switching and selection
functional. Row Edit opens the same existing Character form/transaction pathway
used by the inspector; do not duplicate save logic. Grid cards should likewise
expose a discoverable Edit action without requiring an extra details-selection
step. Preserve draft guards and stable selection; use the accepted Characters
reference for spacing/hierarchy. Per-appearance editing remains CHARACTERS-03.

Extend **CHARACTERS-01** acceptance: importing or changing the default refreshes
both card/list thumbnail and inspector preview immediately within the current
view. Never require leave/re-enter to recover valid media. A later successful
image does not close the initial-load/default-change defect. Test safe media
request ordering, successful retry and stale/session completions with rejecting
assertions before claiming a cause/fix. Persistence of the default is accepted;
immediate preview refresh remains failed. No new agent UI interaction, code,
launch, verification run, package or dispatch. Continue review; all recorded
corrections and the earlier sidebar/drag proposal remain pending.

### Assets categories, drop target and supporting-workspace modals — 2026-10-02

The user moves to Assets and requests a category selector at the top, a visible
area for dropping images, creation-details modals for Characters/Assets/Variables,
and selection from anywhere on a card or list row. The supplied view shows two
available Character-image entries with rendered thumbnails and selected inspector
preview. This does not prove fresh import, OS drop, audio or all Assets acceptance.
The user explicitly requests one subagent to research online drop-zone examples;
that read-only research is complete. No application implementation/build selected.

**ASSETS-01 — persistent category selection, correction pending:** expose All,
Backgrounds, Character images, Music and Sound effects at the top beside search/view controls,
including empty categories. Keep a clear selected state and category-specific empty
message; search combines with the category. These filter the existing library,
not create user-defined folders or new asset types. Current `catalog-ui.ts:9,39`
derives categories only from present kinds and hides the selector for one kind,
explaining its absence here. The user confirms separate Music/Sound effects
categories rather than combined Audio on 2026-10-02.

**ASSETS-02 — discoverable drop target, correction pending:** replace the hidden-
until-dragging-only affordance with a compact, always-visible drop strip above the
cards, labelled "Drop images here or Browse files". Use a subdued border at rest
and stronger accent/background during a valid native drag; retain the existing
Assets-wide drop route and keyboard/native-picker alternative. Drop and Import
assets open the same staged details modal; dropping alone must not write. Confirm
per-file type/name and Character association/expression where required. Preserve
the existing 32-file bound, original external files, authority/session checks and
honest partial-success behaviour. Successful imports are retained, failed entries
stay editable, and Cancel does not undo already completed imports. Actual Finder/
Explorer gesture acceptance remains open. This target initially belongs to Assets;
no new cross-page Character drop workflow is inferred.

Official examples researched by the requested subagent:

- [Carbon file uploader](https://www.carbondesignsystem.com/building-blocks/core/components/file-uploader/guidelines):
  visible drop area, browse alternative, drag-over emphasis and file feedback.
- [Adobe Spectrum DropZone](https://react-spectrum.adobe.com/DropZone):
  compact drop areas with Browse files and accepted-type handling.
- [Adobe Creative Cloud Libraries](https://www.adobe.com/creativecloud/business/enterprise/cc-libraries-collaboration.html):
  native files dropped into an asset library.

The compact strip and modal flow are Loomlight proposals inferred from these
patterns, not copied product guarantees. Category controls filter one library;
[Carbon tabs guidance](https://carbondesignsystem.com/components/tabs/usage/)
distinguishes content filtering from navigation tabs.

**CATALOG-01 — creation and editing modals, correction pending:** New Character, Import assets
and New Variable open consistently styled dialogs with a clear heading, header X,
Cancel and one primary confirm action. Remove their below-content creation forms.
Focus enters the first meaningful field, remains in the modal, and returns to its
trigger on close. Escape/Cancel follow the existing unsaved-input guard; an active
write cannot be discarded by dismissing presentation. Keep validation errors/input
inside the dialog and disable duplicate submission. Asset batches use a bounded
scrollable staging list with fixed heading/actions. Reuse the existing typed
transactions and draft/session completion guards. Current `catalog-ui.ts:40`
unhides and scrolls the creation section; `asset-import-ui.ts` already stages each
file and retains failed imports. The user confirms that Character, appearance and
Variable Edit actions use the same modal style as creation on 2026-10-02. Inspection
remains in the details panel; editing opens the dialog through the existing save
pathway or the separately recorded appearance-update extension. This does not add
unsupported Asset editing operations or select implementation/package work.

**CATALOG-02 — whole-card/list-row selection, correction pending:** clicking the
image, name, metadata or empty row/card space selects that entity and its details.
Use a coherent hover/focus/selected treatment and keyboard activation. Direct Edit,
Set default and other controls retain their own actions without accidental extra
selection/activation; avoid nested buttons and preserve unsubmitted-input guards.
Apply this across the supporting catalogue views, including list mode. Current
`catalog-ui.ts:32–34` wires only the title button and image; metadata/blank space
has no selection handler. This confirms the user's report without native mutation.

Continuation: the user confirms both proposed preferences: separate Music/Sound
effects filters and modal editing as well as creation. Design decisions are recorded;
implementation remains pending. Proceed with remaining Assets feedback, then Variables.
Fresh feature refs match `7fda210`, main remains `4d7ba03`; preserve the separate
planning worktree. Reuse `01d0896`; zero new launches, native/SDK cases, builds or
dispatches. Earlier functional blockers, corrections and sidebar proposal approval
remain open. This documentation/research checkpoint changes no app or project data.

### Variables naming and shared catalogue affordances — 2026-10-02

The user reports macOS capitalising a new Variable name and making it invalid,
requests consistent prevention across Characters/Assets/Variables, replaces small
Close details text with X, confirms Variables selection works only from the name
column, and requests naming-best-practice tooltips on creation fields in all three.
Record these as pending corrections; no new build or general implementation selected.

**VARIABLES-01 — consistent technical-name input, correction pending:** code confirms
the Variable creation field/submission at `main.ts:744–745` does not call
`technicalNameInput` or `technicalName`; Character creation/Appearance expressions
and staged Assets already do in corrected candidate `01d0896`. Extend the shared
helper to Variables and audit every technical/expression creation field across all
three surfaces. Suppress autocapitalisation, autocorrection, spelling suggestions
and inappropriate autocomplete; normalize surrounding whitespace and ASCII capitals
before validation/submission. Make the resulting technical name visible before
confirming; do not rewrite during active IME composition or disturb the caret.
Keep display names and Variable text values unchanged. Preserve immutable existing
identifiers and authoritative source; this is new-name input handling, not rename.
Reject invalid/duplicate input with specific feedback while retaining entered data.
Focused future verification must cover mixed-case typing/paste, all three real
creation paths and actual macOS keyboard/IME; HTML attributes alone are not native
acceptance. Existing Character/Asset helper evidence remains valid; the new report
does not prove those corrected paths have regressed. No rejecting test/fix yet.

**CATALOG-03 — inspector Close X, correction pending:** replace the small shared
Close details text (`catalog-ui.ts:15`) with a clearly visible top-right header X
on Characters, Assets and Variables. Give it an accessible Close details label,
tooltip, consistent click target and visible hover/focus treatment. Escape closes
the active inspector where appropriate and returns focus to the selected entity;
respect pending-input guards and another active modal. Closing details does not
delete, save or change the selected entity. Align with the previously requested
Branches/runtime/modal close-affordance work without changing their ownership.

**CATALOG-02 follow-up:** the name-only Variable selection is the same shared
catalogue defect already recorded. Extend whole-row selection acceptance to the
type, initial-value and blank-space columns; direct Edit remains independent and
keyboard activation remains available. Do not create a separate competing fix.

**CATALOG-04 — contextual naming help, correction pending:** provide a consistent
focusable information icon beside the name label in Character, Asset and Variable
creation dialogs (and Appearance expression fields). Its tooltip opens on hover
and keyboard focus/activation; essential format/validation hints remain available
without hover. Explain the distinction between display name and fixed technical
name, with meaningful surface-specific examples (`bec`, `uni_night`,
`relationship_score`, `happy`). Suggested technical-name copy: "Use a descriptive
lowercase name, starting with a letter. Separate words with underscores; avoid
spaces and punctuation. Loomlight saves technical names in lowercase (1–64 letters,
numbers or underscores)." Display-name help permits readable words/capitalisation.
Keep actual field rules authoritative and state which names are fixed after creation.

Reference [Ren'Py language basics](https://www.renpy.org/doc/html/language_basics.html)
and [reserved names](https://www.renpy.org/doc/html/reserved.html): avoid reserved
engine names and leading underscores for user identifiers. Do not claim that Ren'Py
itself requires lowercase or Loomlight's 64-character limit; these are Loomlight's
creation contract. Do not imply a comprehensive reserved-name analysis exists.
No new generic identifier renaming or speculative metadata scope is selected.

Continuation: Variables review is active; type/default editing, persistence and
known-assignment navigation remain unreported, not inferred passes. Shared creation/
editing modals and separate Music/Sound effects filters were confirmed previously.
Only review docs changed; reuse `01d0896`, zero new launches, native/SDK cases,
builds or dispatches. Existing blockers and sidebar proposal approval remain open.

### Hands-on review stopped for now — 2026-10-02

The user says "i think we are done for now" after recording Variables feedback.
Stop this hands-on session and preserve its findings; this is not final UI acceptance
or authorization for unattended implementation. Incoming published checkpoint
`ab68b098a21fb23fe59a8394343794d8467d844f`, branch
`feature/phase-1g-branches-runtime`; preserve newer work and the separate planning
worktree. No workflow/build pending, no automation/Goal/client pause state changed.

Recorded follow-up spans Welcome/wizard/button consistency; Story creation/Choice
layout/chapters/sidebar controls/Beat dragging/Writing focus; Source tabs/overflow;
Branches route resolution and popup dismissal; runtime panel presentation; Character
preview/appearance editing/list polish; Assets categories/drop target; and shared
catalogue modals, selection, technical-name handling, Close X and naming help.
Confirmed preferences include separate Music/Sound effects categories, modal creation
and editing, and appearance name plus image replacement. The earlier sidebar/drag
proposal still awaits its requested approval. All corrections remain pending.

Preserve positive human observations: fresh corrected project launches successfully;
Characters search/view switching, editing and default persistence work; Branches
navigation works and pan/zoom/Fit is acceptable provisionally. These do not close
the failed preview refresh or missing graph routes. Variables type/default editing,
persistence and known-assignment navigation are unreported. Physical keyboard/IME,
actual OS asset drop, live SDK download/progress and detailed creation progress,
remaining cross-target checks and final visual acceptance stay open.

Reuse installer `01d0896` for Mac continuation; earlier `d690d7f` cross-target
qualification and all failed/superseded evidence remain preserved. PR #17 is still
draft/open with recorded conflicts; no merge/conflict resolution/new phase or new
build/dispatch selected. Next user-directed continuation may select a bounded
correction implementation outcome or resume remaining checks. This pause record
changes docs only, adding zero launches, native/SDK cases, builds or dispatches.

### Review corrections implementation selection — 2026-10-02

The user says "i want the fixes i have suggested implemented" and asks whether to
continue here or another chat. Continue the same chat/branch from published
`27f1fe92bcb857237a627303e8e6f41d99f09769`. This selects implementation of the
recorded corrections, including the sidebar/Beat-drag proposal previously awaiting
approval; no further design permission is required for those proposed behaviours.
Use internal checkpoints: shared catalogue/name/modal/media and appearance editing;
Welcome/wizard/buttons; Story/sidebar/reorder; Source/Branches/runtime; focused
regression checks/self-review and canonical docs/publication. Preserve original
source/draft/session/transaction safeguards and previously passing tests. Investigate
functional blockers with rejecting regressions before claiming root causes.

Scope includes WELCOME-01/02/03, WIZARD-01, SDK-01, CONFIG-01, REVIEW-01,
STORY-01 through 06, BUTTON-01, SOURCE-01/02, BRANCHES-01/02, RUNTIME-01,
CHARACTERS-01 through 04, ASSETS-01/02, CATALOG-01 through 04 and VARIABLES-01.
No unsupported metadata/new feature phase, old-project GUI repair, merge/conflict
resolution, expensive installer/native-package or hosted CI run is selected. Focused
frontend/core/browser checks and ordinary compilation follow changed-scope policy;
reuse SDK evidence unless changed boundaries justify a focused SDK regression.
Keep cumulative counts; physical/native Windows acceptance remains distinct from
local automated evidence. A new package will require separate user selection.

### Review corrections implemented and locally verified — 2026-10-02

Implementation candidate **`e4013fa76672205b9166bb97752da1aeb8856a86`**, parent `27f1fe9`, implements
the selected correction paths. The subsequent audit below identifies unmet parts;
this checkpoint does not complete every finding. Keep it distinct from installed `01d0896`
and cross-target-qualified `d690d7f`. Canonical behaviour is in UI, DATA_MODEL and
ARCHITECTURE; testing selection is in TESTING.

| Finding group | Implemented correction |
| --- | --- |
| WELCOME-01/02/03, WIZARD-01, SDK-01, CONFIG-01, REVIEW-01 | Settings cog/button treatment, tonal split/project hover, full-height steps, SDK label, 48px resolution/aspect preview, inline Git checkbox |
| STORY-01–06, BUTTON-01 | Redundant slider removed, compact Choice action/responsive fields, one-confirmation insertion, independent top sidebar controls, chapter disclosure, full writing focus, drag grips/one Undo, shared button sizing |
| SOURCE-01/02 | Integrated filename/Close/draft tabs, overflow controls/chooser, active tab and file-row reveal |
| BRANCHES-01/02 | Screen-label inventory correction restores known saved routes/entry; details X/Escape/focus return |
| RUNTIME-01 | Sticky Close header; compact expandable diagnostics/output/evidence/advanced controls; runtime error retained despite exit zero; close preserves process ownership |
| CHARACTERS-01–04 | Ordered/reused media presentation with retry; immediate current-view reload after mutations, appearance selection and name/image editing, compact rows/direct Edit |
| ASSETS-01/02, CATALOG-01–04, VARIABLES-01 | Persistent categories/drop area, shared creation/edit modals, full-card/row selection, inspector X, capitalization prevention/canonicalization and naming guidance |

Functional diagnosis and rejecting evidence: indented SDK screen `label` controls
made the story inventory incomplete; the collector regression first failed, then
passes along with a real flow-service test proving two saved literal Choice routes
and project entry. Arbitrary Beat reorder preserves CRLF bytes/IDs and one Undo;
protected/terminal/stale moves refuse. Appearance editing preserves IDs/defaults and
updates supported references for name-only, image-only and combined edits; an external
edit refuses without changing source or metadata. Final rename patches only the
recognized expression token, including exact spacing/trailing-text/newline retention.
Original and prior imported images remain untouched; protected mappings and normal
name collisions still refuse rather than rewriting custom source.

Bounded corrections during qualification: the initial replacement filename exceeded
an image-token limit (`CorruptMetadata`); one UUID plus an explicit declaration
corrected it. A stale-reorder test initially used Undo-restored identical bytes; it
now makes a genuine external edit. Modal attribute/hidden-form test assumptions and
shipped smoke locators were updated for the actual new affordances; suppression
still asserts zero overlapping Flush and a recorded modal/authoring reason. Browser
checks exposed a small-window tree overlay intercepting navigation, an extra grip
breaking the two-column Beat header, hidden direct Edit specificity, and incorrect
Source-tab relative offset; each received a bounded correction and rejecting check.
No failing gate was relabelled as a pass or removed.

Final local evidence (ignored reports under `.toolchains/reports/`):

- Frontend check: **74 passed, 0 failed/skipped**; production web compilation passes
  (existing large-chunk advisory remains). Rust format and diff checks pass.
- Routine release core: **185 passed, 40 ignored, 3 separately filtered**, no failure;
  exclusions match TESTING. Focused `review_`: **7 passed** (six new regressions and
  the existing Apply Both review test). Exact updated authoring IPC: **1 passed**.
- Enforced flow fixture: **3 samples**, initial **32.14–49.99 ms**, explicit refresh
  **31.24–38.29 ms**, accepted update **20.83–27.37 ms**; existing limits pass.
- macOS desktop compile and test: pass, **1 desktop test**, no package/native launch.
- Chrome fixture regression passes both themes/all six surfaces, onboarding/Settings,
  minimum/laptop layouts, sidebar restoration, chapter collapse, Choice/modal bounds,
  Source overflow/reveal, stable geometry, lossless rich-editor Undo, shipped smoke
  interactions with unavailable-click rejection, and busy-contention UI probe.
  Screenshots were inspected for Story, Choice, wizard, Characters/list/modal and
  Source overflow. Actual macOS WebView/OS gestures and Windows remain unverified.
- Repository validator: **322 files**, passed. No extra SDK test was selected because
  starter-generation/bootstrap inputs are unchanged; earlier menu evidence is reused
  only for that unchanged path, not as qualification of the new correction candidate.

Cumulative expensive counters remain **8 production builds; 40 native scenario starts
plus 4 boundary starts = 44**, and the separately recorded **4 successful explicit SDK
menu test starts**. This implementation adds zero installer builds, native/SDK starts
or manual CI dispatches. PR #17 remains draft/open/conflicting; main `4d7ba03` and the
separate planning worktree are preserved. Branch publication may trigger the existing
Repository quality workflow; that does not authorize a packaging dispatch.

Next user-selected step is a corrected Mac installer, then restart at **Story** and
review the changes before Source/Branches/Characters/Assets/Variables. Remaining
acceptance includes physical keyboard/IME, actual OS asset drop, live SDK download
and detailed creation progress, Windows native checks and final visual/UX approval.
The earlier user-confirmed fresh-project launch remains valid for `01d0896`; existing
old-project GUI repair is still outside scope. No further operation/automation is
pending or selected after publication; do not merge or resolve conflicts.

### Chat-to-implementation audit — 2026-10-02

The user requested review against this chat and the saved findings. Audit input is
published `ad6ad7fcf2b830bd21c1121c3b450696fcb70cf9`; application source remains
`e4013fa`. Fresh local/remote feature refs matched `ad6ad7f`, main matched `4d7ba03`,
and the planning worktree remained `8a9da37`. The previous claim that all corrections
were complete was too strong: passing the main-path tests did not prove all recorded
acceptance details. No reset, merge or conflict resolution occurred.

**Confirmed omissions/regressions, awaiting correction:** these map to existing
finding IDs, rather than selecting a new feature phase.

| Audit item / original findings | Evidence and impact | Required follow-up |
| --- | --- | --- |
| A1 — STORY-02, BUTTON-01 | Choice creation still puts three fields, Cancel and Create into five separate grid cells (`scene-ui.ts:585`, `ui-refresh.css:310`). At 1440px Create is 178×53px with a wrapped label; Cancel occupies a separate 178px-wide, 15px-high cell. At 560px there are two 150px columns and Create is still 53px tall. Overflow is corrected, but grouped actions/intrinsic button sizing are not. | Separate grouped action row, shared sizing and compact stacking without stretching/wrapping. |
| A2 — CATALOG-01 | New Variable → int → default 42 → Cancel → Discard → reopen: Type is bool, but Default value is still the numeric input with 42. `catalog-dialog.ts:37` restores values without rebuilding dependent controls; the initially detached text input was never captured. A Boolean save then reads the hidden Boolean selector instead of the visible 42. Footer also remains Unsubmitted input after discard. | Restore complete form state/dependent controls, clear discarded values and refresh truthful status; test each type and reopen/submission. |
| A3 — CHARACTERS-02 | Select non-default happy → Edit Character → Save unchanged: preview resets to neutral and no appearance is pressed. `CatalogState` retains entity selection, not appearance selection; `main.ts:709` initializes selectors false. | Retain selected appearance identity through redraw/edit/default changes and view restoration while it exists; viewing must not change the default. |
| A4 — CHARACTERS-03 | Real disposable core fixture: happy → calm → thoughtful succeeds, then thoughtful → calm refuses with DiscoveryCollision. Retained former declarations collide with their own appearance (`authoring.rs:956/1360`), preventing correction/reuse of a former expression with no other owner. | Distinguish owned aliases from genuine collisions while preserving source/files/references; test rename-back and true collision rejection. Protected/stale refusal remains a separate safeguard. |
| A5 — STORY-05 | Hiding Scenes/files leaves focus on its invisible toggle. Initial tree toggle has no aria-expanded/aria-controls and never updates them; main toggle initializes expanded state only after clicking. These details were explicit in the saved proposal. | Accurate initial/updated panel semantics and focus transfer to visible restore/workspace controls on hide/restore. |
| A6 — STORY-01 | ArrowDown resizes 34 → 36, then Reset layout changes CSS to 34fr but aria-valuenow remains 36. Reset still queries the hidden range (`main.ts:843`). | One allocation update for pointer/keyboard/reset, keeping persisted/layout/accessibility values synchronized; remove hidden-slider dependency. |
| A7 — STORY-03 | Deferred creation receipt: Add Beat and Cancel stay enabled. Second confirmation shows Another persistence operation is still in progress.; the operation guard correctly limits actual writes to one. Successful creation leaves a saved collapsed row but focus falls to BODY, with no new-row reveal/focus. | Disable duplicate confirmation/dismissal while pending, restore on failure, reveal/focus the saved collapsed Beat without reopening its editor. |
| A8 — CHARACTERS-01 | Source inspection: `catalog-ui.ts:21` discards presentation errors, showing only Preview unavailable/Retry preview. Initial requests use the entity label rather than a loading state. Ordering/cache/retry exist, but distinct loading and retained actionable failure information are incomplete. | Explicit loading and bounded useful read error, preserving retry and stale/session guards; never replay writes. |
| A9 — STORY-06 / ASSETS-02 integration | Beat grips use HTML5 draggable/dragstart/dragover/drop (`scene-ui.ts:548`). The main window is built from configuration with native dragDropEnabled at its default true, and OS asset imports depend on native DragDrop events. The pinned CLI schema and [official Tauri configuration reference](https://v2.tauri.app/reference/config/#dragdropenabled) state that the native handler must be disabled for HTML5 frontend dragging on Windows. This is a source-backed platform incompatibility, not a Windows reproduction. | Make internal Beat dragging coexist with native asset drops, for example using pointer-driven internal reorder. Do not simply disable the native handler and break asset importing. Verify actual gestures on affected targets; Windows needs Windows. |

Coverage reconciliation for the other selected findings:

- WELCOME-01/02/03, WIZARD-01, SDK-01, CONFIG-01 and REVIEW-01: controls, wording,
  tonal/hover treatment and layout are present; prior fixture screenshots/browser
  checks support them. Accepted resolution mockup/written decisions remain the
  reference. Final native visual acceptance remains open.
- STORY-04: chapter disclosure preserves the selected editor. STORY-06: left grip,
  insertion markers, bounded reorder/one Undo and protected/stale guards are present;
  the real transaction was tested previously, but A9 leaves native integration incomplete.
  Actual macOS WebView dragging and
  Windows acceptance remain open, not inferred from core/browser tests.
- SOURCE-01/02: unified tabs, overflow arrows/chooser, active-tab reveal and matching
  scrollable file-list selection are present, with prior many-tab checks. Physical
  Source editing acceptance remains separate.
- BRANCHES-01/02, RUNTIME-01: saved literal routes, closable details, sticky runtime
  X/expandable sections/error summary are present, with prior rejecting core/DOM/
  browser checks. Graph pan/zoom refinement was acceptable for now; do not invent
  unselected graph styling requirements.
- CHARACTERS-04, ASSETS-01/02, CATALOG-02/03/04, VARIABLES-01: direct Edit,
  categories/drop strip, creation/edit dialogs, full-card/row selection, inspector X
  and naming guidance/normalization are present. A2/A5 concern interaction details,
  not missing entire controls. Actual OS drop and physical capitalization/IME remain
  unverified.
- Earlier STARTER-GUI-01/naming/default-colour blockers were corrected in `01d0896`;
  the user confirmed a fresh project works. Reopening the earlier project does not
  invalidate that result or authorize silent repair.

Audit evidence: focused Chrome harness using the actual renderer, synthetic data,
two appearances, discard/reopen and deferred Beat creation confirmed A1/A2/A3/A5/
A6/A7. One exact release core test with a temporary assertion confirmed A4
(`Err(DiscoveryCollision)`): **1 passed, 227 filtered**, no SDK/process start. A8 is
code inspection, not a reproduced native failure. A9 additionally verifies the pinned
Tauri schema/default, actual builder/drop code and official documentation; it is
an inference about Windows behaviour, not target evidence. Ignored evidence:
`.toolchains/reports/ui-corrections-audit-{browser,core}.log`,
`ui-corrections-audit.json`, `ui-refresh/audit-*.png`. Early harness attempts had an
incorrect Type-field locator and a click blocked by the intentionally open compact
tree overlay; the final run used the actual hide control and completed. Temporary
harness/core assertions were removed; application/test source is unchanged. No
broad suite was rerun or prior pass relabelled. Earlier 74/185 results still describe
the candidate, with newly identified coverage gaps.

Continuation: correct A1–A9 with focused regressions before packaging or resuming
hands-on Story acceptance. This turn records an audit, not application fixes or
installer selection. Keep the existing implementation selection/branch/PR; no
hosted CI/package matrix/integration/new phase is selected. Counters remain 8
packages, 44 native/boundary starts and separately recorded 4 SDK menu starts.
Physical keyboard/IME, OS drop, live SDK download/detailed creation progress,
Windows native verification and final UX feedback remain open. No manual workflow
or automation is pending.


### Audit corrections selected and implemented — 2026-10-03

The user selected fixes for every audit item and explicitly deferred Windows testing.
Incoming published checkpoint `41ddf2c755b334c4a291dc40a565628b2e440ce7` was preserved;
fresh feature/main refs matched the recorded state. The separate planning worktree
remains at `8a9da37`. This is the existing UI correction outcome, with local verification
and a later Windows checklist; no additional installer, hosted dispatch, integration
or new phase was selected.

| Audit item | Implemented correction | Focused proof / remaining limit |
| --- | --- | --- |
| A1 | Three Choice fields with a separate grouped action row; intrinsic, single-line buttons; compact fields stack. Removed a duplicate CSS rule that overrode compact stacking. | Actual-renderer wide/compact dimensions and action grouping; native DPI/visual review deferred. |
| A2 | Discard resets the complete Variable form including detached defaults, rebuilds the Boolean control and refreshes persistence status. | int/string/bool discard → reopen, empty discarded text and a subsequent Boolean payload; no silent write on discard. |
| A3 | Retain selected Appearance UUID per Character through save, default change and view restoration; pressed state and inspector preview follow that UUID. | Actual-renderer save/default/view round trip; viewing does not change the default. |
| A4 | Record exact generated image aliases for the same Asset; reuse only canonical declarations with one intact source owner. Preserve IDs/defaults, old images, custom source and transactional companions. | Real core happy → calm → thoughtful → former names; custom-name and externally edited alias refusals preserve bytes. Unknown historical declarations remain refusals. |
| A5 | Initialize/update panel controls and expanded state; hide focuses the visible restore control, restore focuses the tree toggle. | Actual renderer and visible-focus assertions; native screen-reader/keyboard checks deferred. |
| A6 | Use one numeric allocation update for pointer/keyboard/reset; remove the hidden slider; reset updates CSS and accessible value together. | ArrowDown 34 → 36 → Reset 34, no range input; native divider gestures deferred. |
| A7 | Disable new-Beat fields, confirmation and Cancel while a receipt is pending; reject duplicate confirmation; retain input on failure; reveal/focus the saved collapsed row. | Deferred success and failure DOM checks plus actual-renderer pending/saved-focus checks. |
| A8 | Explicit loading state, bounded useful read-error detail, explicit Retry preview; retain ordered/cache/session guards. | Deferred read failure/retry/cache regression; native first-load/default/image-replacement acceptance remains open. |
| A9 | Captured pointer-driven Beat reorder replaces HTML5 drag ownership. Preserve the native asset-drop handler; show insertion markers/ghost, edge scroll, cancellation and protected/gap checks; dispose capture/listeners. | Real Chrome mouse capture/reorder/Undo, Escape/outside/protected refusals and DOM checks; Windows WebView2 plus Explorer coexistence explicitly deferred. |

Source checkpoint **`1d4bf147a120c1e0e8977b07f68f4cb6948e1473`**, parent `41ddf2c`, carries the fixes
and permanent regressions. The verification closeout below records exact evidence. Local browser/DOM fixtures are not a native application or SDK qualification.
Earlier failed/superseded qualification remains unchanged. The installed `01d0896`
contains none of these new UI corrections; a corrected review installer still needs
selection. Counters remain 8 packages, 44 native/boundary starts and separately 4
explicit SDK menu starts. No manual workflow or automation is pending.

### Deferred Windows review checklist — 2026-10-03

**Status: DEFERRED by the user; every row below is unexecuted on Windows.** Use an
explicitly selected corrected Windows x64 package when one exists; record its commit,
installer SHA-256, Windows/WebView2 version, display scaling, palette and results.
The existing `d690d7f`/`01d0896` artifacts do not prove these new corrections. Use a
disposable project and synthetic files, retain failed evidence, and record each row
Pass/Fail/Unavailable without inferring a pass from macOS or browser fixtures. This
checklist does not dispatch a workflow or select another package build.

| ID | Specific actions | Expected result |
| --- | --- | --- |
| WIN-UI-01 — Beat and native asset drag coexistence (A9) | With native drag/drop enabled, drag the left Beat grip up/down across several ordinary rows. Undo once; redo; save and reopen. Immediately drag PNG/JPEG/WebP files from Explorer into Assets, then reorder another Beat. | Visible insertion marker/ghost, exactly one saved reorder and one Undo; IDs/text/source preserved. Explorer drag highlights the drop area and opens the staged import modal; both gesture types continue working. |
| WIN-UI-02 — drag cancellation/bounds (A9) | Escape during a drag; drop outside the list/on the same row; switch focus to another app; drag toward Choice/Jump/Return/protected code or a source gap. Try while an editor has unsubmitted input. Drag through a long list near both scroll edges. | Cancelled/forbidden gestures write nothing, leave no ghost/marker/capture, retain input and remain responsive. Allowed edge scrolling follows the pointer. Keyboard move controls remain usable. |
| WIN-UI-03 — Assets staging | Drop several image files, change categories, set kind/name/Character-expression metadata, cancel and keep/discard, reopen via Browse. Include a duplicate or unsupported file and complete the valid rows. Drop while away from Assets. | Drop/Browse use the same guarded modal, categories remain available, originals remain intact, valid imports occur once, failed rows remain actionable, and no off-surface accidental import occurs. |
| WIN-UI-04 — physical names and IME | In Character, Asset/expression and Variable creation, type/paste uppercase ASCII technical names, blur and submit. Use a Windows IME in dialogue, narration, display names and text defaults, including Enter during composition. Open the naming guidance with the keyboard. | Creation identifiers canonicalize consistently without OS correction; guidance distinguishes Loomlight rules from Ren’Py syntax. Display/text content stays intact; composition is not prematurely committed. Existing source identifiers are unchanged. |
| WIN-UI-05 — Variable discard/type integrity (A2) | New Variable: int/42 → Cancel → Discard → reopen; repeat with string text and bool/True. Switch type again after reopening, then create Boolean True. Edit an existing default; Keep editing/Escape/Discard; save/reopen. | Reopened form is bool/False, discarded text is empty, control matches Type, footer returns to Saved, and the submitted/persisted value matches what is visible. Cancel/discard does not write. |
| WIN-UI-06 — Character selection and image refresh (A3/A8) | Select a non-default appearance; save Character unchanged; change the default; switch Grid/List and leave/return. Replace an appearance image. Test a missing/unreadable image then restore it and Retry preview. | Selected UUID, pressed state and preview remain aligned. Default is distinct from viewing. New images load immediately; loading and useful bounded errors are visible; retry recovers without replaying a write or showing another Character’s image. |
| WIN-UI-07 — appearance rename reuse (A4) | Rename happy → calm → thoughtful → calm → happy, with/without an image replacement. Save/reopen and inspect Show/Change Appearance Beats. Try a name belonging to another image; edit a retained alias externally and try reusing it. | Stable Appearance/Asset/default IDs and supported references; old files/custom source stay intact. Own unchanged aliases can be reused; genuine collisions/edited aliases refuse without partial writes. |
| WIN-UI-08 — compact Choice/buttons (A1) | Open Choice → Create New Scene at minimum window size and typical laptop size, light/dark, 100% and higher Windows scaling. Type names/select Chapter; cancel/reopen; create once. | Fields remain inside the editor and stack when compact. Cancel/Create share a clear action row and consistent height; no stretched/wrapped button labels or horizontal escape. Creation establishes the saved route. |
| WIN-UI-09 — sidebar/focus/layout (A5/A6) | Use Tab/Enter to collapse main navigation and hide/restore Scenes/files independently. Collapse Chapters with a Scene selected. Enter/exit Writing focus. Resize preview with pointer and Arrow keys, Reset layout, reopen. At 100%/higher DPI, compare icon/label spacing across all six surfaces above/below the 1100px breakpoint, with main navigation expanded/collapsed and Scenes/files visible/hidden; verify header alignment, fixed control/panel widths, reverse opening arrows, and restore separation from the Story title/Source tabs (including no file open). Inspect with Narrator if available. | Main collapse leaves tree text/geometry intact; hide/restore focus stays visible; controls announce accurate state. Chapters retain the editor. Writing focus hides sidebars and restores previous choices. Preview allocation and separator value agree after reset. |
| WIN-UI-10 — Beat confirmation/pending (A7) | Create each applicable Beat with one confirmation; simulate a slow receipt through an approved test driver and attempt duplicate confirmation/Cancel. Exercise a stale-source failure, correct it and retry. Use a long list. | Pending controls are disabled, only one write occurs, failure retains editable values, and success reveals/focuses the saved collapsed row without another Commit. |
| WIN-UI-11 — earlier Source/Branches/Runtime corrections | Open more Source files than fit; open another and close its tab with a draft. Save Choice routes and Refresh Branches; open details and dismiss with X/Escape. Run a disposable game; close/reopen diagnostics, including an error with exit zero. | Active tab and file row reveal together; Close is attached and retains draft. Saved graph routes appear; details close and return focus. Runtime X stays visible, errors remain reported, and closing the drawer does not stop the game. |
| WIN-UI-12 — onboarding and remaining acceptance | Review Welcome cog/hover/column tones, full-height wizard rail, SDK wording, resolution picker, inline Git checkbox. Observe a real uncached official SDK download and staged creation; run a fresh game through its menus. | Clear click affordances, readable controls, truthful download/create progress and no missing GUI-image crash. Preserve the earlier-project distinction; no silent repair. Record final visual/UX feedback separately from automated checks. |
| WIN-UI-13 — approved B connector routing | In a disposable project save reciprocal Scene 1/New Scene jumps, a long jump skipping a node, two choices with the same target/text, a self-loop, a same-layer link and a missing/custom destination. Review both palettes at 100%/higher DPI, zoom/pan/Fit, select routes and use Source navigation. Include long/Unicode names and choice text. | Every known arrowhead meets its correct node boundary; heavier rounded paths avoid all node interiors; reciprocal/duplicate/backward routes remain distinguishable. Label pills stay legible and clear of nodes; Fit includes outer routes/pills. Long node names retain full tooltips/details. No guessed link for missing/custom/terminal flow; saved source, selections, notices and navigation remain correct. Record zoom/scale-specific readability separately. |
| WIN-UI-14 — catalogue columns and staged preview | Review Characters with both image-backed and zero-appearance entries; toggle Grid/List, open/close details and resize at 100%/higher DPI. Review bool/int/string Variable rows against all four headers. Browse/drop PNG/JPEG files, inspect their previews before Import, add another file, remove all, Cancel/discard/reopen, change a selected file externally and retry. Include audio and an oversized/unsupported raster. | No image/initial/title overlap; matching Character list columns and Variable header/cell alignment. Whole-row selection and Edit remain reachable. Initial Choose section disappears after selection; real images/dimensions are shown, Add files remains available, empty staging restores chooser, footer actions remain visible. Errors offer Retry without a write; only explicit Import creates assets, no successful partial import is replayed. Native preview/drop/cleanup and OS scaling are still unverified until this is run. |

Remaining macOS hands-on review uses a corrected installer when selected and resumes
at Story, then Source/Branches/Characters/Assets/Variables. Physical IME, OS file drop,
live download/detailed creation progress and final UX acceptance remain open on the
relevant targets. Windows deferral is not a pass or a reason to widen this outcome.


### Audit correction verification closeout — 2026-10-03

At source checkpoint `1d4bf147a120c1e0e8977b07f68f4cb6948e1473`:

- `npm run check`: **78 passed, 0 failed/skipped**. Includes deferred Beat creation
  success/failure/recovery/focus, drag cancellation and media loading/error/retry.
- Routine release core selector: **185 passed, 40 existing ignores, 3 separately
  filtered**. Includes the extended Appearance rename/reuse/collision regression
  and existing transaction, ordinary external-edit, reorder/history and IPC guards.
  The exact rename regression first failed with `DiscoveryCollision` before the fix
  (**0 passed/1 failed/227 filtered**), then passed; the broad final suite also passes.
- `cargo test -p loomlight-desktop --locked`: **1 passed** on macOS.
- Existing `ui-refresh.browser.mjs`: **PASS**, production renderer with synthetic IPC.
  Covers both palettes/all six surfaces, Source overflow/Undo, shipped smoke/busy
  contention and the new audit assertions. Real Chrome pointer capture verifies one
  reorder/Undo plus cancellation/protected refusals; no native Windows claim.
- Production web compilation, `cargo fmt --check --all`, `git diff --check` and
  repository/link/privacy validation (**322 files**) pass. The existing >500 kB web
  chunk advisory is retained. Final compact Choice and loaded/retained Appearance
  screenshots were inspected. No unrelated SDK/timing/package gate was repeated.

Failure classification and corrections: new DOM tests initially omitted selecting
Narration before querying its textarea and assumed Happy DOM exposed the default
`draggable=false` property. The fixture now chooses the actual control and grips
explicitly disable HTML5 dragging. Early browser attempts used an inaccessible
hidden-control role locator and nonexistent `.app-toolbar` as an outside-drop target;
locators now address the retained element and `.app-header`. The new compact assertion
then exposed a real duplicate `.scene-draft` rule: **compact fields 2 columns instead
of 1**. Removing that overriding rule corrected the layout. A deferred fake receipt
mutated the renderer's previous model by shared reference, causing a saved-focus
assertion failure; the fixture now clones IPC responses, matching native serialization.
Final rejecting checks pass unchanged in intent. These failures remain recorded here;
none was counted as a native/platform pass or used to select an expensive retry.

Ignored evidence: `.toolchains/reports/ui-audit-fixes-{frontend,core,core-before,
core-focused,browser,web,desktop,validation}.log` and
`ui-refresh/audit-fixed-{choice-compact,appearance}.png`. Original audit/qualification
logs and all failed/superseded hosted runs remain untouched. The user-owned public
repository and signed-in owner's push permission were rechecked before publication;
only source/tests/canonical review docs are included, no private fixtures or logs.
No further build, hosted dispatch, native/SDK start, integration or new phase is
selected. Windows is deferred under the checklist above; macOS/native/final acceptance
awaits a selected corrected installer.


### Full-chat request reconciliation — 2026-10-03

The user requested another check against every request in this chat, an issue list
and a brief change summary. Audit input is published `9208da8`; application source
remains `1d4bf147a120c1e0e8977b07f68f4cb6948e1473`. The working tree was clean at
entry. Rechecked current controls/handlers/styles against the saved findings,
including the accepted resolution-picker image and written criteria. No application
change, new suite/package/native/SDK start or workflow dispatch was selected here.

**One remaining accepted-design omission: CONFIG-01 detail.** The larger 48px/16px
picker, presets/Custom fields and dynamic rectangle are implemented. However,
`renderConfiguration` displays only width × height beside the rectangle; the accepted
mockup/written criteria also require an aspect-ratio label and the caption
“Game resolution, not editor size.” Neither is rendered. Empty Custom dimensions
use the `w || 16` / `h || 9` fallback, so the preview can suggest a ratio for invalid
input. Complete the label/caption and valid-dimension preview handling, including
bounded portrait proportions; add a focused actual-renderer check. This is a
source/reference finding, not a new native reproduction or new feature phase.

The other original findings are represented in current source: Welcome cog/tones/
hover; full wizard rail, SDK wording and inline Git; shared buttons, Choice layout,
single-confirmation Beats, chapter collapse, independent top sidebar icons, Writing
focus and drag grips; authoring capitalization/default colour and fresh-game GUI
bootstrap; Runtime/Branches dismissal and saved routes; Source unified tabs/overflow/
active-file reveal; Character previews/appearance name-image edits/list direct Edit;
Assets categories/drop area; shared creation/edit modals, whole-row selection, X
controls and naming help. A1–A9 corrections remain present, including discard/type
reset, stable appearance selection/alias reuse, visible focus, divider reset, pending
controls, loading/error/retry and pointer/native-drop separation. No additional
implementation omission was identified in this bounded source reconciliation.

Do not equate this with final native/visual acceptance. The earlier local checks
remain evidence for their exact input; they were not rerun or relabelled. The installed
`01d0896` remains older, a corrected installer is still unselected, physical/IME/OS
drop/live-progress review remains open, and the 12 Windows rows remain user-deferred.
Record CONFIG-01 as partial rather than repeating the full-completion claim.


### Local corrected Mac installer selection — 2026-10-03

The user requested a local build and link. Selected input is clean/published
`19cdcaa2e4d249d6be99fb18bf4f9613b011fadf`, app source `1d4bf14`, on the existing
feature branch; fresh main remains `4d7ba03`. One local macOS ARM64 release app/DMG
package, static artifact verification and delivery are selected. Use the existing
pinned tools and earlier unchanged-input local qualification; do not dispatch a
hosted or Windows build, change/install over the user's running application, launch
a game, integrate or add a feature phase. CONFIG-01's remaining accepted-preview
detail stays documented as incomplete. Record actual output hashes and continuation
below after packaging.


### Local Mac installer delivery — 2026-10-03

Requested local package build completed at input
`19cdcaa2e4d249d6be99fb18bf4f9613b011fadf`, app source `1d4bf14`. Source tree was
clean; the selection/handover docs written before compilation were the only changes.
`npm exec -- tauri build -- --locked` ran once with the pinned ARM64 toolchain and
passed production web compilation, optimized Rust compilation and app/DMG bundling.
Retained the existing web chunk advisory. No source changes, hosted dispatch, Windows
build, SDK/game/native scenario launch, application install or integration occurred.

Delivered file (ignored):
`.toolchains/review-builds/ui-refresh-19cdcaa/Loomlight_0.1.0_19cdcaa_aarch64.dmg`,
**5,683,777 bytes**, SHA-256
`4e83485c968b12bc843382a4136301ccc13e68fa51202f27813a22f2f449a1da`.
Retained final app executable SHA-256
`7105c6f96baa17ed1fd0ef2ec0bce855b0729f8b3f193b265f5403b3a633e491`.
`SHA256SUMS.txt`, portable `BUILD.json` and installation README accompany the files.

Failure classification: the sidecar checksum script initially used `hashlib.file_digest`,
unavailable in the system Python; portable streaming SHA-256 corrected this without
recompilation. Original Tauri DMG integrity passed, but its app had only a linker
ad-hoc signature and strict bundle verification reported “code has no resources but
signature indicates they must be present.” Applied a local ad-hoc resource signature
to the retained app, verified it, and repacked the same compiled payload into the final
DMG with an Applications shortcut. Preserved the original `-unsealed.dmg`, SHA-256
`0cd136078053d139774c45320073a9c7b1a63b1a1fa7f9c7ebfcfa5b336a70e7`; do not
deliver it as the corrected installer. One Tauri production build, two DMG containers
(original and post-processing correction), no duplicate source build or waiver.

Final checks PASS: `hdiutil verify`; read-only/no-browse mounted payload executable
checksum equals retained app; strict/deep `codesign --verify`; `lipo -archs` is arm64;
Info.plist bundle identifier `app.loomlight.desktop`, version 0.1.0; Applications
symlink present. Mounted volume was detached and temporary staging removed. Signature
is local ad-hoc with sealed resources, not Developer ID/notarized distribution;
existing distribution limits remain. No app execution was used as proof.
Ignored reports: `ui-review-19cdcaa-{build,final-dmg,dmg-verify}.log` and
`ui-review-19cdcaa-payload.json` under `.toolchains/reports/`.

Totals become **9 production package builds**, unchanged **44 native/boundary starts**
and separately **4 explicit SDK menu starts**. Existing 78 frontend/185 core/1 desktop/
browser results remain for the unchanged source, not new native qualification.
CONFIG-01's accepted-preview details remain incomplete. Windows stays user-deferred.
The older installed app/private projects were untouched. Provide the final DMG link;
the user quits Loomlight, installs/replaces from that DMG and resumes at Story. No
manual operation is pending. Keep PR #17 draft/open/conflicting and preserve both
worktrees. Publish only this documentation, never binaries/logs or private data.


### Sidebar control alignment follow-up — 2026-10-03

The user reports that both sidebar close controls are misaligned and enlarge their
panels, the hidden Story tree restore control covers the Scene title, and the arrows
do not reverse to indicate reopening. This selects a bounded source correction;
no new installer/hosted dispatch/integration was requested. Fresh feature/main refs
match incoming `254fe36`/`4d7ba03`; planning worktree is newer at `2c5a164` and was
preserved. PR #17 remains draft/open/conflicting.

- Give both header controls fixed 32×32px bounds, centre their 20px icons without
  navigation-link margins, and place them at the same inset within existing tracks.
  Remove float-driven tree-heading layout and the extra navigation-toggle row.
- Keep main navigation 180px/64px and tree 230px (or the user's saved width).
  Reserve space for the restore icon beside the Scene title/Source tabs, including
  the empty Source prompt. Compact positioning uses the actual navigation width
  and editor inset. Writing focus does not retain an unused title indent.
- Use matching panel icons with left-pointing collapse and right-pointing restore
  arrows; navigation updates its arrow and tooltip immediately on state changes.
  Preserve expanded/controls ARIA, visible hide/restore focus, chapter/editor state,
  independent tree width and Writing focus restoration.
- The collapsed Settings label was visibly clipped and caused horizontal rail
  overflow. Use the existing cog alone with an accessible label and tooltip.

Verification: `npm run check` **78 passed**, production web compilation PASS
(existing chunk-size advisory), full existing `ui-refresh.browser.mjs` PASS, diff
and repository validation PASS. New rejecting geometry checks cover **48 combinations**
(Story/Source × light/dark × 1440/960/560px × main expanded/collapsed × tree visible/
hidden): exact existing track widths, contained 32px controls, no horizontal nav
scroll overflow, matching header height, distinct/opposite arrow paths, restore
separation from actual Scene text/visible Source tabs, focus transfer on hide, and
saved state restoration. Existing chapter/focus/Source/Beat/catalogue checks remain.
Inspected expanded/compact captures in ignored `.toolchains/reports/ui-refresh/`;
synthetic preview images are not native asset-loading evidence. Check/build/browser
logs are `.toolchains/reports/sidebar-alignment-*.log`.

Intermediate evidence preserved in this record: initial browser start was blocked
by sandbox loopback EPERM; rerun with authorized local test capability. First geometry
run rejected the real collapsed Settings overflow, corrected above. A later Source
assertion measured a hidden tab-scroll arrow (zero box); changed to the visible tab
itself. The new geometry loop left Source's persisted tree state hidden for an old
file-list test: reset event alone does not persist preference changes, so the fixture
now restores through the actual controls. These are harness corrections, not product
exceptions or waived failures; final full regression passes.

The delivered `19cdcaa` Mac installer predates these edits. No package/install/native/
SDK start, workflow dispatch, merge/conflict resolution or new phase was added.
Cumulative totals remain 9 packages, 44 native/boundary starts, separately 4 SDK menu
starts. Windows testing remains explicitly deferred; WIN-UI-09 includes alignment,
control widths, arrow direction and title/tab/empty-Source separation at scaling.
CONFIG-01 remains pending. Continue the existing hands-on review; select a corrected
installer separately when needed. Publish this source/docs checkpoint and verify.


### Branches connector design options — 2026-10-03

The user reports four presentation issues in the delivered Mac build: arrows need
more visual weight; route text is hard to read; backward links run behind Scene
nodes; and opposite Scene 1/New Scene routes overlap. Select **BRANCHES-03** as
mockup/choice review first. The user explicitly requests a subagent and 2–3 raster
image choices, mentioning GPT sunburst. Available built-in image generation has no
model selector; do not attribute these previews to a selectable Sunburst model.
Use the imagegen skill/built-in generator, with one separate call per variant.

Incoming feature `59f0323`, main `4d7ba03` and planning worktree `2c5a164` are preserved;
PR #17 remains draft/open/conflicting. This request selects proposals and repository
review state, not Branches implementation, a new package/CI run, integration or a
new phase. Earlier saved-flow resolution and navigation evidence remains separate.

Read-only renderer inspection explains the presentation: `branches-ui.ts` uses the
same bottom-centre to top-centre cubic template for every non-self edge, regardless
of direction or other nodes, with midpoint label placement. Normal edges are 1.5px
at 0.55 opacity (`styles.css`); labels are 12px secondary text with an app-background
stroke (`ui-refresh.css`). There is no route-avoidance or parallel-lane allocation.
The user screenshot is evidence of this visual problem, not a source-completeness
or execution failure. No private project files were read or copied into fixtures.

Proposals share paper/teal colours, heavier connectors, distinct arrowheads and
opaque readable label pills. Compare the SAME illustrative graph in each:
Scene 1 (Entry) → New Scene (Start); New Scene → Scene 1 (Back); New Scene → Three
(Three); New Scene → Four (4); Scene 1 → Four (Jump); Four → Scene 1 (Jump back).
Backward links here mean authored routes returning to an earlier Scene, not the
Ren’Py Return/End terminal Beat. Samples are design concepts, not a runtime trace.

- **A — Curved:** retain a top-down tree with smooth forward curves and outer
  backward-route lanes; closest to the existing composition.
- **B — Rounded orthogonal:** separate connector channels, rounded corners and
  labels on straight segments; prioritize explicit direction and dense readability.
- **C — Horizontal:** left-to-right progression, separated forward/backward curves
  above/below the nodes; a different graph orientation for comparison.

Generated mockups are unaccepted previews under ignored
`.toolchains/reports/branches-mockups-2026-10-03/`; they do not replace the accepted
reference set. Record inspected output paths/limitations before delivery. Wait for
the user's choice before implementing a connector/layout direction. Preserve
sidebar source `59f0323`, which also predates any corrected installer delivery;
CONFIG-01 and native/physical acceptance remain open. Windows verification stays
deferred; after a direction is selected add overlapping reciprocal links, long
backward links, labels/arrowheads at zoom and higher display scaling to its list.
No tests, app/native/SDK starts, packages or hosted dispatches are selected by this
proposal. Counters remain 9 packages, 44 native/boundary starts, separately 4 SDK
menu starts. No background workflow or integration is pending.


**Mockup delivery:** generated and inspected three separate PNGs in the ignored
preview directory: `option-a-curved.png`, `option-b-orthogonal.png`,
`option-c-horizontal.png`. `PROMPTS.md` retains the final prompt set, edits and
inspection notes. A keeps the existing top-down arrangement with separate outer
backward curves; C provides the clearest complete horizontal example. B demonstrates
rounded orthogonal routing channels and is a useful top-down direction, but its
raster misses the `4` arrowhead and imperfectly attaches the Jump tip. These are
explicit generated-preview limitations, not approved production behaviour; every
implemented directed route must have a visible arrowhead and stop at its proper
node boundary. No paths pass behind unrelated nodes in these concepts. A originally
had Start pointing upward and the illustrative Return label; one targeted image
edit corrected direction and renamed it Jump back. B's targeted edit separated
Jump from the `4` port, with the residual arrow-tip issues above disclosed.

Preview generation used the built-in image tool, not a claimed Sunburst model.
Application source remains `59f0323`; no production tests were rerun because this
turn changes design docs only. Repository validation passes **322 files** and diff
check passes. Deliver A/B/C inline, with B's residual raster limitations, and obtain
the user's choice before implementation. No mockup is accepted yet. Save selection
and any refinements here when the user replies; do not reproduce the shortened
illustrative toolbar as a new product requirement. The user requested connector
refinement, not graph-editing ports; drawn attachment dots are conceptual.


### Option B selected and implemented — 2026-10-03

The user chose **B**, selecting the rounded orthogonal connector implementation
within the existing Branches review. This supersedes the mockup-choice wait above;
no horizontal orientation, graph editing, shortened toolbar, new package/CI run or
integration is selected. Source checkpoint **`88add80972ca29c81086a5476ad6ed0bde342fe4`**, parent `c771493`, preserves
sidebar `59f0323`, main `4d7ba03` and planning worktree `2c5a164`. The unchanged
selected image is now saved in `docs/design/ui-refresh/branches-connectors-rounded.png`
with its hash, prompt set and generated limitations in the existing manifest/index.
The missing mockup arrowhead/imperfect tip are corrected in actual SVG output.

Implemented:

- 3px opaque palette-accent connectors, rounded orthogonal corners and a visible
  10px arrowhead at every known destination boundary. Selection increases line
  weight without changing source, navigation or route ownership.
- Stable, separate node ports and outside channels for backward, long, same-layer,
  self and duplicate routes. Adjacent forward links use clear inter-row gaps. Labels
  that do not fit a direct gap can move with their route to an outside channel.
  Node interiors remain clear; reciprocal routes do not reuse the same path.
- 14px primary text on opaque rounded bordered pills, drawn above all connectors.
  Full text remains in existing route details/tooltip. Caption truncation respects
  Unicode character boundaries. Existing >100-edge label suppression and graph
  limits remain; unknown/missing/terminal destinations do not acquire guessed links.
- Fixed 200×60px nodes keep render/routing bounds aligned; long names ellipsize with
  their full name/technical label in the tooltip and existing details. The accepted
  entry Scene seeds cyclic placement, with no inferred entry when it is unproven.
- Fit includes outside connectors and label rectangles, including negative extents;
  pan/zoom, selected targets, focus, stale/partial notices and captured navigation
  remain. No source/service writes or SDK execution were added.

Focused verification at the source checkpoint's file contents:

- `npm run check`: **83 passed, 0 failed/skipped**. Five new rejecting routing cases
  cover reciprocal/duplicate/long/same-layer/self routes, ragged rows, label/node
  separation, determinism, unchanged flow data, unresolved/terminal refusal, limits
  and Unicode captions. Existing Branches refresh/navigation/focus cases pass.
- Production web compilation PASS; existing chunk-size advisory remains.
- Full existing actual-renderer `ui-refresh.browser.mjs` PASS. Added eight directed
  links (the six illustrative routes plus duplicate/self) at 1440/960/560px in both
  themes. Sample actual rounded SVG geometry every 2px to reject node interiors;
  require all eight distinct paths and arrow markers, 3px/full-opacity strokes,
  exact rendered node size, readable pill text bounds, opaque fill and Fit visibility.
  Inspected ignored `ui-refresh/branches-b-{light,dark}-{1440,960,560}.png` captures.
- Existing 500-node/2000-edge Branches browser check PASS, reusing retained synthetic
  service fixture SHA-256 `8f9e8deba12cf6bc2c1453b81515307308119113463f5c01e80de72982d30196`.
  Final measured initial layout **40.4ms**, pan-frame p95 **15.7ms**, visible dispatch/
  rAF p95 **14.6ms**, rendering-opportunity p95 **31.3ms**; all retained diagnostic
  thresholds pass. Browser/server cleanup complete. This is Chrome development
  evidence, not packaged macOS/Windows timing or native/physical acceptance.
  The evidence hash list now includes `branches-routing.ts`.
- Repository validation **325 files** and diff check PASS. No unchanged core/SDK gate
  was repeated: this is renderer geometry/style, without a changed service contract.

Initial cheap checks classified and corrected before final proof: a helper cleanup
left an unused parameter (`TS6133`), SVG creation returned `Element` without typed
`dataset` (`TS2339`), and a CSS-edit script initially used a repository-prefixed path
from `app/`. Removed the unused parameter, used `setAttribute` and corrected the
working-directory path. Final checks pass; no failed gate was waived. Early/final
large-graph development runs passed; the final report includes the router's exact
source identity. Logs/JSON remain ignored under `.toolchains/reports/branches-b-*`.

Windows **WIN-UI-13** below remains DEFERRED. Actual native/final UX approval remains
open; source/browser proof is not a new installer acceptance. Delivered `19cdcaa`
predates sidebar/Branches changes. No additional package/install/native/SDK start,
hosted dispatch, merge/conflict resolution or new phase; counts remain 9 packages,
44 native/boundary starts and separately 4 SDK menu starts. CONFIG-01 remains open.
Continue hands-on feedback or separately select a corrected installer. Publish and
verify source plus this meaningful verification/continuation record on the same branch.

### Catalogue layout and staged import preview follow-up — 2026-10-03

**CATALOG-05 / ASSETS-03 — selected and implemented locally.** The user calls the
current work acceptable for now with further review possible, then reports broken
Character/Variable layouts and the retained top Choose files section instead of a
selected image preview. This is provisional feedback, not final acceptance. The
Character screenshot is the list state (Grid view is the toggle destination);
Variables remains the approved table. Correct both Character view states and the
Variable table rather than inventing a Variable grid.

Preserved incoming feature/source `002c753` / `88add80`, main `4d7ba03`, separate
planning worktree `2c5a164` and draft/conflicting PR #17. Explicit surface/summary
classes replace parent-wide image/placeholder column inference. Mixed Character
rows share list slots; grid titles remain below media; all four Variable columns
share the header template. Whole-row selection, direct Edit, search/type filtering,
retained views, appearance selection and transaction owners remain.

Selected-image staging now replaces the initial description/Choose files with
per-file passive preview, dimensions/size, existing import fields and smaller Add
files. Empty removal/discard restores the chooser; image loading/errors have Retry,
audio has file information. The typed `asset.previewImport` session/project-bound
read accepts only retained selection authority, never a renderer path/URL. It
rechecks identity/size/hash, uses existing PNG/JPEG passive limits (16 MiB, dimensions
1–8192), writes nothing and preserves explicit import authority. Ordered reads and
32 MiB object-URL retention bound staging; remove/success/discard/dispose revoke,
and detached receipts are ignored. Hidden chooser focus is avoided when opening a
staged dialog. WebP still imports under the existing contract but has explicit
unsupported preview feedback; no format expansion is selected.

Local evidence: **85 frontend tests** (including two preview lifecycle rejecting
cases), production web build, **7 focused core tests** (two retained-selection
checks, two IPC/session checks, three existing passive-media checks), **1 macOS
desktop test**, and the full actual-renderer Chrome regression PASS. Added actual
mixed-media/placeholder Grid/List assertions and four-column x/row alignment at
1440/960/560 widths, both themes. Staged PNG decodes to the fixture's actual 800×450
size; initial Choose/description hide, remove/discard/reopen restore, actions remain
visible at 1440×900 and 560×480 in both themes. Inspected generated Character,
Variable and import screenshots in ignored local reports. Bridge uses synthetic
fixtures; this is not native drop/SDK or final UX acceptance.

Initial local failures were qualification setup gaps: the operation snapshot lacked
the new allowlist entry; fixture compilation used a shadowed document and the wrong
Event type; the first expanded browser case tried to click a toolbar behind the
existing compact details drawer. Corrected the explicit protocol snapshot, fixture
references/types and dismissed that drawer through its X before toggling views.
No assertions were removed, thresholds relaxed or hidden controls force-clicked.
The subsequent full checks pass. Existing web chunk-size advisory remains.

WIN-UI-14 joins the existing deferred Windows checklist (14 rows); no Windows pass
is claimed. Installer `19cdcaa` predates these/sidebar/Branches corrections.
CONFIG-01, physical IME/drop, live progress and final UX review remain open. No new
package, native/SDK application start, hosted workflow, merge/conflict resolution
or feature phase selected. Counts stay 9 packages, 44 native/boundary starts and
separately 4 SDK menu starts. Publish this correction on the existing branch and
record its exact source checkpoint in CURRENT/HANDOVER. No pending operation.

Source checkpoint **`cedef502c7f517a808319696ba3a94952377f41d`** contains these
corrections and canonical behavior/test updates. Final format/diff/repository check
passes (325 files). Fresh remote inspection finds planning `267ec2a` newer than its
separate local `2c5a164` worktree; preserve both. Main `4d7ba03` and PR #17
OPEN/draft/CONFLICTING are unchanged. Continuation details are now at the top of
CURRENT/HANDOVER; source and state are to be published together.

### Latest corrected Mac installer selected — 2026-10-03

The user explicitly requested rebuilding the installer, then the remaining Phase 1G
list. One local macOS ARM64 release app/DMG build plus artifact integrity, sealed
resource/signature, bundle identity and mounted-payload checks is selected. Input
is clean/published **`b6cc06b3496e20288de8a06211dfd599e29f9bf3`**, app source
`cedef502c7f517a808319696ba3a94952377f41d`. It includes sidebar alignment,
approved Branches B and catalogue/staged-preview corrections. Existing 85 frontend,
7 focused core, 1 desktop, full browser/format/diff validation results are retained
for these unchanged inputs; no duplicate SDK/native qualification is selected.

Fresh main stays `4d7ba03`, feature remote matches input, PR #17 remains
OPEN/draft/CONFLICTING. Remote planning `267ec2a` and separate local `2c5a164`
worktree are preserved. Use pinned local toolchains; retain earlier installer and
any raw output. Do not install over the user's running app or launch a game.
Windows remains deferred; no hosted dispatch, conflict resolution, merge or new
phase selected. CONFIG-01 remains incomplete. Build command is running with output
under ignored `.toolchains/reports/ui-review-b6cc06b-build.log`; record final
artifact hashes, cost counters and remaining Phase 1G work below before delivery.

### Latest corrected Mac installer delivery — 2026-10-03

One pinned `npm exec -- tauri build -- --locked` production build completed at
input **`b6cc06b3496e20288de8a06211dfd599e29f9bf3`**, application source
`cedef502c7f517a808319696ba3a94952377f41d`. Source inputs are unchanged from the
85-frontend/7-focused-core/1-desktop/full-browser correction evidence. Production
web/optimized Rust compilation and app/DMG bundling pass; the existing web chunk
advisory remains. No duplicate source build, SDK/native scenario or game launch.

Final installer (ignored):
`.toolchains/review-builds/ui-refresh-b6cc06b/Loomlight_0.1.0_b6cc06b_aarch64.dmg`,
**5,752,413 bytes**, SHA-256
`6209a3540756c774e88ec1e2a9d11b618f46cc370c6c81cbd390b09bec234d71`.
Retained sealed executable SHA-256
`c87235275178eedf3c1399ed5a398e306fb78eb41c4a361e791ad712dc2d6291`.
Portable BUILD.json, SHA256SUMS.txt and installation README accompany the app/DMG.
Original Tauri DMG is retained as `-unsealed.dmg`, digest
`28b9626335f002f2a1a698eee0186fc0b71a52fd557aee5a2aa0a2ceaee38336`;
use the final installer, not that evidence copy. The previous `19cdcaa` installer
remains untouched.

Applied the previously verified local ad-hoc resource seal and repacked the same
compiled payload with Applications shortcut; this is not Developer ID signing or
notarization. Original compiled executable digest
`34546b876c5ad6f905fbcc6dbf5d323006b7723e1c68735ee4f84c69ff5fd5e2` is retained
in BUILD.json. Final `hdiutil verify`, strict/deep `codesign --verify`, ARM64-only
architecture, identifier/version, mounted executable hash/execute mode, mounted
signature and Applications shortcut all pass. Mounted volume detached and temporary
staging removed. Both SHA256SUMS entries independently pass. No install over the
user's app or private-project change occurred. Logs and packaging script stay ignored.

Totals are now **10 production package builds**, unchanged **44 native/boundary
starts**, separately **4 SDK menu starts**. One source build, two DMG containers;
no hosted/Windows dispatch, conflict resolution, merge or new phase. Main `4d7ba03`,
remote planning `267ec2a`/local separate `2c5a164` worktree and OPEN/draft/conflicting
PR #17 remain. No operation pending. User quits Loomlight, replaces its Applications
copy from the final DMG, and resumes at the changed sidebar/Branches/catalogue/import
surfaces. Installer compilation/static checks do not constitute new native acceptance.

**Remaining Phase 1G work:**

1. Complete CONFIG-01: aspect-ratio label, “Game resolution, not editor size.” caption,
   truthful empty/invalid Custom preview and bounded portrait proportions. These are
   the known remaining accepted-design details, not a new feature phase; this build
   request does not expand into their implementation.
2. Finish final macOS native/UX review with this installer: corrected sidebars,
   Branches B, Character Grid/List/Variable columns and staged previews; physical
   keyboard/IME, Finder file drop, genuine uncached SDK progress and detailed creation
   progress. Keep provisional feedback separate from final acceptance. TESTING's
   short final 1G session also covers Scene/Source/Branches navigation and pending
   input, authored routes, script save during play/Stop/rerun, an SDK diagnostic's
   Source location, resize/scaling and close/reopen. Reuse applicable prior observations
   narrowly and record candidate/platform/results instead of repeating accepted suites.
3. Windows x64 remains explicitly deferred: later agent-run affected native/packaged
   qualification for final source, genuine WebView2 input/responsiveness and the
   focused final user session, including the existing 14-row Windows action/result
   checklist. Earlier green candidates do not qualify subsequent fixes automatically.
4. After acceptance, separately select PR #17 conflict resolution, affected integrated
   checks and reviewed merge. 1G is not integrated; 1H follows as a separately selected
   integrated vertical-slice acceptance outcome. Optional Git features remain outside
   Phase 1 and are not a blocker.

No unresolved hosted operation exists. Retain historical failed runs and their
corrections; the earlier `d690d7f` cross-platform UI qualification is evidence only
for its recorded candidate, not a new qualification of this local build.


### Story/Source navigation spacing regression — 2026-10-03

The user reports touching sidebar icons/labels on Story and Source after the latest
Mac delivery; the other surfaces remain readable. Fresh feature refs are `0474e04`;
main `4d7ba03`, remote planning `267ec2a` and separate local planning `2c5a164` worktree
remain preserved. This selects a bounded spacing correction, not another installer,
CI request, integration or feature phase.

Root cause: the legacy max-width 1100px `.with-tree` override removed all icon
margins even when navigation remained expanded. Removed only that override so the
shared 12px icon-to-label gap applies to Story/Source too. Explicit collapsed-link
and fixed panel-control zero margins remain. Panel widths, independent collapse,
arrow direction, restore slots and editor content retain their existing behavior.

Rejecting actual-renderer evidence: the new text-Range geometry assertion fails on
unchanged CSS at light Story/1100px with **0px rather than 12px**. After correction,
full browser regression PASS: all six surfaces, both themes, five widths
1440/1101/1100/960/560px (**60 surface/width/theme combinations, six labels each**).
Existing sidebar geometry coverage now checks **80 combinations** of Story/Source,
both themes, those widths, navigation expanded/collapsed and tree visible/hidden;
collapsed labels/margins, 32px controls, widths, overflow, arrows and restore
separation pass. Frontend check **85 passed**, production web build PASS (existing
chunk-size advisory). Inspected light Story/Source/Branches captures; synthetic
preview-image loading is not native asset evidence. Ignored evidence is in
`.toolchains/reports/sidebar-spacing-{before,after,check,build}.log` and existing
`ui-refresh/` screenshots. WIN-UI-09 now includes this exact breakpoint/parity check.

The delivered `b6cc06b` installer predates this source fix. Windows remains deferred;
no package/install/native/SDK start, hosted dispatch, merge/conflict resolution or
new phase. Counters remain 10 packages, 44 native/boundary starts and separately
4 SDK menu starts. CONFIG-01 and final 1G acceptance/integration remain open.
