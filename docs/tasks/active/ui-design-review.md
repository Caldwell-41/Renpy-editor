# UI design review

### Windows evidence and first Source correction — 2026-10-06

**Live state: in_progress; all 14 rows remain incomplete.** Execution consent is
resolved by explicit user permission, with agent native clicks recorded separately
from physical observations. The installed NSIS baseline remains retained and unchanged.
Latest saved Story Run displays the exact new English text (`85`–`87`); normal game
close reports **Game finished, exit 0** (`88`–`89`). This specific pass does not waive
the two Source rerun refusals in `75`–`79`.

**Latest handoff:** user reports **“yes it all works”** for the three physical held-drag
cancellation gestures (Escape, outside-list release, focus switch). They stopped
Computer Use to demonstrate them and explicitly permit restarting it. These are user
observations, separate from agent inspection. `after-human-drag.json` independently
verifies all four scene/source-map/project/authoring hashes unchanged. The restart
inventory call nevertheless reports **Computer Use was stopped by the user with the
physical Escape key**, forbids further native calls this turn and requests a final
response. No new UI inspection inferred. Resume this same review next turn, inspect
the current window and continue; no renewed consent approval is needed.

**WIN-RUN-01: cause reproduced; correction attempt 1.** A controlled production
renderer fixture holds SDK discovery, queues the 250 ms Source observation, then
releases discovery. The background observer owns the renderer authoring lease and
Run refuses before execution (`source-run-contention-before.json`). Initial harness
setup/selector/ordering failures are preserved; they are not product correction
attempts. Restored pinned Node 24.19.0/npm 11.9.0 dependencies using the unchanged lock.
The correction removes only the background observation's renderer authoring lease;
ordered service requests, retention, identity/sequence/barrier guards and all explicit
write coordinators remain. The existing native-runtime browser driver now rejects this
race, waits for the ordered observation, and asserts exactly one start. Typecheck,
compiled tests, **29 Source/leave/runtime tests**, the **1 Save-routing test**, existing
Source browser persistence/focus checks, new contention regression and existing route-a
renderer driver pass. These are browser/fixture results, not native candidate acceptance.

**Installed focused checks (once):** `installed-focused/runtime-ui-route-a.json` PASS,
exit 0, 78.89 s, cleanup true; real installed WebView2/IPC/service/SDK but synthetic
editor input. `runtime-ui-ui-refresh.json` FAIL, exit 1, 51.266 s, cleanup true,
`Error: Timeout at editor`; seven earlier checks pass. Failure shows an editable
CodeMirror document and Unsaved Source draft with 506 files. Exact retained-draft-count
condition is unresolved; keep this failure, not a timeout waiver. Added failure-only
inventory diagnostics/stage separation to the shipped probe; its 20 s deadline and
one-draft assertion are unchanged. No blind repeat or broad unchanged matrix.

**Native partial checks:** app close/reopen restores the recent review project (`94`–
`95`); three Variable types align to their four headers and whole-row/Edit controls
(`107`); int/42 Cancel/Discard restores bool/False on reopen (`108`–`116`); string
English text delivery and Cancel/Discard (`118`–`123`) observed. Boolean True creation,
existing default edit and final reopen remain required. The prepared Beat fixture had
Choice followed by another terminal Jump: `105` truthfully refused a required invariant.
Preserved original fixture bytes, removed that erroneous trailing Jump, observed stale
projection refusal (`125`), and reconciled through native Source (`126`–`129`). Native
ordinary grip reorder then saved the expected source order; one Undo restored it and
Redo restored the reorder (`130`–`135`). IDs/history, Save/reopen, Explorer coexistence,
all cancellation/edge/protected/pending-input actions still need their full assertions.
Broken fixture image previews remain unclassified and are not image acceptance.

**Actual tooling handoff:** native API exposes one complete drag, no mouse-down/hold
operation. It cannot capture the live ghost/marker or send Escape/switch apps while
holding the mouse. User asked to perform three cancellation gestures on Beat 2 in the
open disposable Story Scene 1; reported results and hash verification are above. App stays open on
that surface; `before-human-drag.json` retains scene/map/project/authoring hashes for
comparison. Continue shell/diagnostic work while waiting; do not compete for native UI.

Counters: Windows **1 completed build / 4 native starts / 0 separate SDK menu starts**.
Isolated no-bundle production build session 25998 completed exit 0 in 3m09s,
log `source-correction-1-build.log`; no CI dispatched. Retained candidate executable:
**14,150,656 bytes**, SHA256
`ab3da29afde2e3c6fe88223421b44032bd13599f9950fba835640823869cb2fe`.
`source-correction-1-build-receipt.json` verifies exactly **3 changed / 129 unchanged**
of 132 baseline app/workflow inputs. A source comment clarification occurred after the
frontend build; independent frontend rebuilding proves every emitted file byte-identical.
The initial receipt harness normalized binary CRLF bytes and refused its input assertion;
corrected text-only normalization passes. Failed assertion remains in the tool transcript;
it is a receipt failure, not product correction or acceptance. Application/probe/driver
inputs have changed, so the 132-input baseline proof applies to `5b467a4` only. Native
correction retest, affected Mac checks and justified remote qualification remain required
before any renewed both-platform claim. Original/generated profiles and failed evidence
remain retained; restoration pending. Prior Mac/remote counters and failures unchanged.

The two earlier entry sections below are chronological history; this section and the
updated per-row table are the live continuation. Do not prepare integration yet.

### Windows review resumed — 2026-10-06

User explicitly requested retry with permission for the disposable Windows Review
execution-consent action. That direct instruction supersedes the local skill's default
handoff guideline; the native click succeeded (`46`–`47`). It is **agent action with
user permission**, not a physical-human click/acceptance. Review is **in_progress**;
the earlier awaiting-consent checkpoint below is historical. No new app start/build/CI.

Native fresh-game main menu, Preferences, Help, Load and Start render without missing
GUI assets (`51`–`56`). Runtime drawer X/reopen leaves the same game Running (`57`–`59`).
CodeMirror native focus/Home/Shift-End selection and English replacement, Ctrl+S saved
exact source bytes with the scene label intact (`61`–`70`); source receipt becomes Clean/
Saved. Launch details truthfully say “Started from an earlier revision. Stop then Run
uses saved edits.” (`72`). Stop reports Cancelled/stopped, Windows exit -1073741510
(`74`), not an exit-zero claim; explicit latest-saved rerun started (`75`). All remaining
canonical row actions and final-route/diagnostic/scaling/session checks still mandatory.

**WIN-RUN-01 — native Source rerun refusal, investigation open.** After native Source
Save receipt was Clean/Saved and the earlier game was fully stopped, Run from Source
twice ended without execution: “Another persistence operation is still in progress.”
Captures `75`–`79` preserve both failed preparations; no game start inferred. A normal
Story navigation succeeds (`80`–`81`), then Run reaches the new-revision execution
consent (`82`–`84`) without restarting the app. This discriminates Source-surface
coordination from a permanently occupied whole-session guard. Provisional hypothesis:
background Source observation contends with Runtime preparation; not yet a confirmed
code diagnosis. The production Source observer acquires the authoring coordinator;
Run performs SDK discovery before acquiring that same coordinator. Keep this genuine
unresolved failure in WIN-UI-11/final rerun coverage; a Story workaround is not a pass
for Source Run. Correction attempts 0; no changed app input/build/CI. Next: controlled
held-observer reproduction and focused installed probes, then bounded correction if
the product cause is established. Continue independent native checklist actions.

### Windows final review entry — 2026-10-06

User selected the final Windows review of qualified `5b467a4`, application source
`8ef89a8`, through all 14 canonical checklist rows. Genuine Windows x64/WebView2
host; routine/native checks owned by the agent, physical requests only at demonstrated
tooling limits. Integration, PR conflicts, history rewrite and phase closure excluded.
Existing clean clone fast-forwarded from `a2098c3` to published `e2146f6`; historical
detached G1-O1 worktree preserved. No attached managed worktree and no Loomlight
process at entry; cross-host ownership cannot be inspected from this PC. PR #17
OPEN/draft/CONFLICTING. Both named workflow attempts independently confirm success
on exact `5b467a4`; no new dispatch/build. Windows package/evidence artifacts retained
ignored under `.toolchains/reports/final-1g-windows/`, both ZIPs and installer hashes
match. Input comparison verifies 132 repository blobs on source/candidate/carrier;
four checkout-only CRLF conversions are recorded in `input-verification.json`.
Review remains **in_progress**, no checklist row passed by this preparation.
Existing Mac/remote counters and failed evidence remain unchanged.

**WIN-PKG-01 — classified requirement mismatch, resolved by user decision.** NSIS
installation exit 0; actual installed PE AMD64 has 14,145,024 bytes, SHA256
`3c9640b0dea7d29ca02096190cf60aca6be2dae7948324b6c0324c16b1480738`.
It differs from the retained tested executable `e4992dde…` at exactly offsets
10,605,976–10,605,978: `UNK` → `NSS` within
`__TAURI_BUNDLE_TYPE_VAR_…`. Every other byte is identical. P6 Windows terminal log
13:04:29Z records the NSIS patch; pinned Tauri-utils 2.9.3 platform.rs defines it.
The user explicitly selected “Continue with verified NSIS payload”; no binary was
modified to manufacture equality. Preserve `executable-difference.json`, both
original binaries and the exact failed initial installation check. The supplied hash
belongs to the unbundled tested executable, not the installed NSIS payload.
No changed application input or new candidate; targeted installed-payload verification
is selected instead of repeating the hosted matrix.

Both hosted manifests match all 132 input paths/hashes and all source/candidate/carrier
Git blobs. Checkout bytes now match too; Git diff confirms no app change. Windows 11
Pro 10.0.26200 x64, actual WebView2 154.0.4258.53, selected window DPI 96 (100%),
default System palette rendered Dark. `host.json` records process ownership.
Computer Use delivered native English title input into packaged WebView2; captures
01–03 prove visible input and slug update, not human typing. Captures 16–20 prove
no managed SDK, real official uncached download (text 120.6 MB/82%; screenshot
124.3 MB/84% of 146.5 MB), verified download/Install and SDK Ready. Captures 21–31
prove 48px resolution control/options, invalid-empty truthful preview, portrait
640×1080 16:27, 640×480 4:3 and inline default Git checkbox. Captures 32–33 prove
real staged project generation and workspace entry. Source/media fixtures retained
ignored; no private project used.

Fresh-game Run first refused the absent explicit runtime helper without execution;
agent added the reviewed helper through the production transaction action. Run now
awaits session execution consent (capture 41). Computer Use guidance prohibits acting
on security permission prompts; the user has been asked for that single physical click.
No consent, game launch or human pass is inferred. Windows native app starts +1,
builds +0, dispatches +0; keep incoming 18/71/7 and remote P5/P6 totals separate.

**Checkpoint: awaiting one physical execution-consent action; review incomplete.**
Capture `42-resume-observation` and `43-consent-foreground` confirm the same pending
prompt after the NSIS decision. The required user action is to click **Trust for this
session and continue** for the disposable **Windows Review** project, then resume this
same review. No timeout or package exception is treated as execution consent.
Computer Use plugin guidance is not a repository acceptance
waiver: the locally installed plugin says “Do not act on security or privacy permission
requests.” That denies the agent's UI click and requires the physical handoff.
The exact local skill/guidance location was supplied in chat; this repository record
omits the host's absolute user path. No automated app input proceeds past the prompt.

The current checkpoint statuses below mean **Unavailable at this checkpoint**, not a
product failure or completed attempt at every action. All remaining actions in the
canonical 14-row checklist remain mandatory. No whole row is Pass yet.

| Row | Checkpoint result | Exact evidence / remaining actions |
| --- | --- | --- |
| WIN-UI-01 | Unavailable; partial evidence | `130`–`135` native reorder/one Undo/Redo with saved source order; fixture invariant failure `105` preserved and corrected through Source. IDs, Save/reopen, live marker/ghost and Explorer coexistence pending. |
| WIN-UI-02 | Unavailable; partial evidence | User reports Escape/outside/focus-switch cancellations work; all four saved hashes independently unchanged. Native restart API remains stopped by physical Escape; live UI not re-inspected. Same-row, protected/gap/pending-input, both scroll edges and keyboard actions pending. |
| WIN-UI-03 | Unavailable; not run | `media-manifest.json` records valid PNG/JPEG/WebP/audio and unsupported/oversized media; staging/drop/import actions pending. |
| WIN-UI-04 | Unavailable; partial evidence | `01`–`03` native English wizard title/slug delivery; Character/Asset/Variable/content/shortcut actions pending. No physical-human keyboard claim. |
| WIN-UI-05 | Unavailable; partial evidence | `108`–`116` int/42 Cancel/Discard/reopen bool/False; `118`–`123` English string/Discard. Boolean True creation/discard and existing default/Keep/Escape/save/reopen actions pending. |
| WIN-UI-06 | Unavailable; not run | Two Character entries/appearance UUIDs prepared; native selection/default/replacement/error/retry actions pending. |
| WIN-UI-07 | Unavailable; not run | Alias/collision fixture prepared; full rename sequence, reference preservation and external-edit refusal pending. |
| WIN-UI-08 | Unavailable; not run | Compact Choice creation, both palettes and measured higher OS DPI pending. |
| WIN-UI-09 | Unavailable; partial evidence | `host.json`: actual WebView2 ownership and 96-DPI window; six-surface/sidebar/focus/divider/breakpoint/higher-DPI checks pending. |
| WIN-UI-10 | Unavailable; not run | Each Beat creation, approved slow receipt, duplicate/Cancel and stale-source correction/retry pending. |
| WIN-UI-11 | Fail; incomplete | WIN-RUN-01 `75`–`79` two native Source Run refusals; first correction passes local renderer checks but native/Mac/remote retest pending. Story latest text/normal exit0 `85`–`89` passes specific checks. Installed route-a PASS and ui-refresh FAIL retained. Overflow tabs, graph details and SDK diagnostic actions pending. |
| WIN-UI-12 | Unavailable; partial evidence | `15`–`20` uncached official SDK download/verified install; CONFIG-01 `21`–`31`; stages `32`–`33`; native fresh menus/Start `51`–`56` PASS specifics; Welcome dark/recent restore `95`. Hover/light/earlier-project distinction/scaling completion pending. |
| WIN-UI-13 | Unavailable; not run | `interaction-fixture.json` prepares reciprocal/duplicate/long/self/missing links; native routing, Fit/navigation/palettes/scaling pending. |
| WIN-UI-14 | Unavailable; partial evidence | `107` bool/int/string four-header alignment and selection/Edit visible at 96 DPI, Dark. Character, media preview/import/external-change/retry/cleanup/higher-DPI actions pending; broken prepared-fixture image preview unclassified. |

All captures/JSON/fixtures are local ignored evidence under the established
`.toolchains/reports/final-1g-windows/`. `installation.json` independently re-verifies
archive, installer, tested and installed binaries and the exact three-byte exception;
the initial failed assertion remains intact. `profile-backup-verification.json` proves
all **3,226 Roaming + 282 local** original file hashes and file sets unchanged in the
guarded backups. Backups remain in place while this app session is open; **Windows
profile restoration is pending**, not claimed complete. Native app data is redirected
to the packaged host's LocalCache profile; first Welcome/SDK captures show no recent
project/managed SDK, and newly created metadata corresponds only to disposable review.
The actual SDK consent path and process ownership are retained locally. No private
project was opened. Preserve both original and generated profiles during recovery.

After the physical click, inspect the actual result before another action. Complete
fresh menus, TESTING's Save-during-play/earlier-launch/Stop/latest-rerun/diagnostic/
close-reopen checks and every checklist action. The selected focused installed-payload
checks are existing `route-a` and `ui-refresh` probes, only after the interactive app is
closed (single-instance ownership); pinned official SDK archive is retained. They are
not another broad matrix, native keyboard or physical acceptance. Neither has run yet.
No new application input, correction attempt, build, SDK menu start or CI dispatch.
Windows counters: **0 builds / 1 native start / 0 separate SDK menu starts**.
Existing Mac/remote counters, failed runs and WORKFLOW budgets remain unchanged.
Repository validation and whitespace check pass for this documentation checkpoint.
Publish this partial evidence; do not hand over for integration until Windows rows pass.

**Updated:** 2026-10-06. **State:** final Mac completion/review and exact-candidate remote qualification PASS; Windows-PC review started and awaits one physical execution-consent click; all 14 rows remain incomplete, integration follows separately.
**Branch:** feature/phase-1g-branches-runtime.

## Authority and boundary

**Live selection:** the [2026-10-04 completion sequence](#selected-1g-completion-sequence--2026-10-04) controls the stages; the [terminal Mac/remote audit](#final-mac-terminal-qualification-and-windows-transfer--2026-10-06) now transfers the exact passing candidate to Windows-PC review. Earlier review-only/no-build/no-dispatch boundaries below are historical. Historical allowances and failures remain evidence, not renewed authorization.

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

**CONFIG-01 — accepted design; Mac implementation/review complete.** The original
2026-09-30 requirements follow; final evidence is in the
[terminal audit](#final-mac-terminal-qualification-and-windows-transfer--2026-10-06). Native observation found
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

**Status: DEFERRED to a subsequent genuine Windows-PC chat; all 14 rows remain
unexecuted as Windows-PC acceptance.** The selected passing candidate is
`5b467a402b14c7b371838645a9daa555ba315349`, production run 37312593480 attempt 1.
Use the retained Windows NSIS installer identified in the
[Windows transfer](../../status/HANDOVER.md#windows-agent-prompt--exact-passing-candidate).
Hosted WebView2 synthetic-input results pass, but do not replace these physical/native/
visual checks. Record installer/executable hashes, Windows/WebView2 version, scaling,
palette and each row Pass/Fail/Unavailable. Use disposable projects and synthetic files;
preserve failures and user observations separately. Older d690d7f/01d0896 packages
cannot qualify these corrections. This checklist adds no workflow/build dispatch.

| ID | Specific actions | Expected result |
| --- | --- | --- |
| WIN-UI-01 — Beat and native asset drag coexistence (A9) | With native drag/drop enabled, drag the left Beat grip up/down across several ordinary rows. Undo once; redo; save and reopen. Immediately drag PNG/JPEG/WebP files from Explorer into Assets, then reorder another Beat. | Visible insertion marker/ghost, exactly one saved reorder and one Undo; IDs/text/source preserved. Explorer drag highlights the drop area and opens the staged import modal; both gesture types continue working. |
| WIN-UI-02 — drag cancellation/bounds (A9) | Escape during a drag; drop outside the list/on the same row; switch focus to another app; drag toward Choice/Jump/Return/protected code or a source gap. Try while an editor has unsubmitted input. Drag through a long list near both scroll edges. | Cancelled/forbidden gestures write nothing, leave no ghost/marker/capture, retain input and remain responsive. Allowed edge scrolling follows the pointer. Keyboard move controls remain usable. |
| WIN-UI-03 — Assets staging | Drop several image files, change categories, set kind/name/Character-expression metadata, cancel and keep/discard, reopen via Browse. Include a duplicate or unsupported file and complete the valid rows. Drop while away from Assets. | Drop/Browse use the same guarded modal, categories remain available, originals remain intact, valid imports occur once, failed rows remain actionable, and no off-surface accidental import occurs. |
| WIN-UI-04 — physical English names/input | In Character, Asset/expression and Variable creation, type/paste uppercase ASCII technical names, blur and submit. Use the standard keyboard in English dialogue, narration, display names and text defaults; select/copy/paste, undo/redo and Save/commit. Open the naming guidance with the keyboard. | Creation identifiers canonicalize consistently without OS correction; guidance distinguishes Loomlight rules from Ren’Py syntax. Display/text content stays intact, keyboard Save/commit works and focus remains stable. Existing source identifiers are unchanged. |
| WIN-UI-05 — Variable discard/type integrity (A2) | New Variable: int/42 → Cancel → Discard → reopen; repeat with string text and bool/True. Switch type again after reopening, then create Boolean True. Edit an existing default; Keep editing/Escape/Discard; save/reopen. | Reopened form is bool/False, discarded text is empty, control matches Type, footer returns to Saved, and the submitted/persisted value matches what is visible. Cancel/discard does not write. |
| WIN-UI-06 — Character selection and image refresh (A3/A8) | Select a non-default appearance; save Character unchanged; change the default; switch Grid/List and leave/return. Replace an appearance image. Test a missing/unreadable image then restore it and Retry preview. | Selected UUID, pressed state and preview remain aligned. Default is distinct from viewing. New images load immediately; loading and useful bounded errors are visible; retry recovers without replaying a write or showing another Character’s image. |
| WIN-UI-07 — appearance rename reuse (A4) | Rename happy → calm → thoughtful → calm → happy, with/without an image replacement. Save/reopen and inspect Show/Change Appearance Beats. Try a name belonging to another image; edit a retained alias externally and try reusing it. | Stable Appearance/Asset/default IDs and supported references; old files/custom source stay intact. Own unchanged aliases can be reused; genuine collisions/edited aliases refuse without partial writes. |
| WIN-UI-08 — compact Choice/buttons (A1) | Open Choice → Create New Scene at minimum window size and typical laptop size, light/dark, 100% and higher Windows scaling. Type names/select Chapter; cancel/reopen; create once. | Fields remain inside the editor and stack when compact. Cancel/Create share a clear action row and consistent height; no stretched/wrapped button labels or horizontal escape. Creation establishes the saved route. |
| WIN-UI-09 — sidebar/focus/layout (A5/A6) | Use Tab/Enter to collapse main navigation and hide/restore Scenes/files independently. Collapse Chapters with a Scene selected. Enter/exit Writing focus. Resize preview with pointer and Arrow keys, Reset layout, reopen. At 100%/higher DPI, compare icon/label spacing across all six surfaces above/below the 1100px breakpoint, with main navigation expanded/collapsed and Scenes/files visible/hidden; verify header alignment, fixed control/panel widths, reverse opening arrows, and restore separation from the Story title/Source tabs (including no file open). Inspect with Narrator if available. | Main collapse leaves tree text/geometry intact; hide/restore focus stays visible; controls announce accurate state. Chapters retain the editor. Writing focus hides sidebars and restores previous choices. Preview allocation and separator value agree after reset. |
| WIN-UI-10 — Beat confirmation/pending (A7) | Create each applicable Beat with one confirmation; simulate a slow receipt through an approved test driver and attempt duplicate confirmation/Cancel. Exercise a stale-source failure, correct it and retry. Use a long list. | Pending controls are disabled, only one write occurs, failure retains editable values, and success reveals/focuses the saved collapsed row without another Commit. |
| WIN-UI-11 — earlier Source/Branches/Runtime corrections | Open more Source files than fit; open another and close its tab with a draft. Save Choice routes and Refresh Branches; open details and dismiss with X/Escape. Run a disposable game; close/reopen diagnostics, including an error with exit zero. | Active tab and file row reveal together; Close is attached and retains draft. Saved graph routes appear; details close and return focus. Runtime X stays visible, errors remain reported, and closing the drawer does not stop the game. |
| WIN-UI-12 — onboarding and remaining acceptance | Review Welcome cog/hover/column tones, full-height wizard rail, SDK wording, resolution picker, inline Git checkbox. Observe a real uncached official SDK download and staged creation; run a fresh game through its menus. | Clear click affordances, readable controls, truthful download/create progress and no missing GUI-image crash. Preserve the earlier-project distinction; no silent repair. Record final visual/UX feedback separately from automated checks. |
| WIN-UI-13 — approved B connector routing | In a disposable project save reciprocal Scene 1/New Scene jumps, a long jump skipping a node, two choices with the same target/text, a self-loop, a same-layer link and a missing/custom destination. Review both palettes at 100%/higher DPI, zoom/pan/Fit, select routes and use Source navigation. Include long English names and choice text. | Every known arrowhead meets its correct node boundary; heavier rounded paths avoid all node interiors; reciprocal/duplicate/backward routes remain distinguishable. Label pills stay legible and clear of nodes; Fit includes outer routes/pills. Long node names retain full tooltips/details. No guessed link for missing/custom/terminal flow; saved source, selections, notices and navigation remain correct. Record zoom/scale-specific readability separately. |
| WIN-UI-14 — catalogue columns and staged preview | Review Characters with both image-backed and zero-appearance entries; toggle Grid/List, open/close details and resize at 100%/higher DPI. Review bool/int/string Variable rows against all four headers. Browse/drop PNG/JPEG files, inspect their previews before Import, add another file, remove all, Cancel/discard/reopen, change a selected file externally and retry. Include audio and an oversized/unsupported raster. | No image/initial/title overlap; matching Character list columns and Variable header/cell alignment. Whole-row selection and Edit remain reachable. Initial Choose section disappears after selection; real images/dimensions are shown, Add files remains available, empty staging restores chooser, footer actions remain visible. Errors offer Retry without a write; only explicit Import creates assets, no successful partial import is replayed. Native preview/drop/cleanup and OS scaling are still unverified until this is run. |

Mac final review and exact-candidate remote qualification now pass; see the
[terminal audit](#final-mac-terminal-qualification-and-windows-transfer--2026-10-06).
The app supports English; non-English IME is outside selected scope. Windows-PC
native input, Explorer drag/drop, uncached SDK/creation progress, scaling and visual
review remain outstanding in these rows. Windows deferral is not a pass.


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


### Selected 1G completion sequence — 2026-10-04

The user selected this order: a new Mac chat completes the resolution picker and
conducts final Mac review, then publishes/runs remote build checks and fixes issues;
a different agent on a Windows PC verifies the passing candidate; a final separate
chat handles integration. This documentation turn executes none of those stages.

**Stage 1 — next Mac chat (selected scope):**

- Start from current feature branch, incoming checkpoint `9456972`, latest app source
  `f287a7e`; inspect fresh refs and preserve newer work. Complete CONFIG-01 only:
  dimensions plus reduced aspect ratio, accepted caption “Game resolution, not editor
  size.”, truthful empty/invalid Custom handling and bounded proportional portrait
  preview. Preserve the existing resolution constraints unless separately selected;
  they are Loomlight policy, not a universal Ren'Py limit. No new presets/format scope.
- Run focused automated checks, self-review and bounded corrections. Build one pinned
  local macOS ARM64 installer for the corrected source; verify payload identity,
  signature/integrity and checksums using the retained packaging procedure. Reuse
  unchanged validated inputs honestly. The retained `b6cc06b` installer predates the
  sidebar spacing fix and cannot qualify the new candidate.
- Prepare disposable fixtures and guide the user through the final Mac session after
  local automated gates pass: picker invalid/Custom/portrait; Story/Source navigation
  spacing and independent panels; approved Branches B; catalogue/media/modal/import
  corrections; physical keyboard/IME, Finder OS drop, real uncached SDK progress and
  creation progress. Include TESTING's focused runtime/route/Save/Stop/diagnostic and
  scaling/close/reopen checks. Agents own routine automated/service verification;
  user input owns physical/visual acceptance. Record actual results and exact package,
  source SHA, SDK, platform, evidence, failures and remaining acceptance. Earlier
  provisional observations are not a blanket final pass. Fix selected review issues
  within existing 1G scope and retest affected interactions before advancing.

**Stage 2 — same Mac chat, after Mac review passes (selected scope):**

- Publish the corrected candidate on the existing branch/PR and verify the remote SHA.
  Use Repository quality and the existing `.github/workflows/production-scaffold.yml`
  final production qualification, with package retention (`upload_packages=true`),
  rather than a new workflow or standalone R1/feasibility/performance matrix.
- One initial final-candidate production dispatch is selected. Necessary corrections
  and verification of changed inputs are selected too: classify failures, prove the
  cause locally when possible, retain exact failed/superseded runs and justify any
  correction rerun in the ledger before dispatch. No duplicate unchanged successful
  matrix, automatic ambiguous-dispatch retry, or repeated same-hypothesis correction
  beyond WORKFLOW's two-unsuccessful-correction reassessment rule.
- Record run ID/attempt/branch/tested SHA/input policy, update continuation before
  waiting, and use the existing manual same-chat waiting rule without model polling.
  Resume that chat to audit terminal evidence, fix failures and complete affected
  checks; do not waive failed/skipped/missing gates. Do not transfer until required
  remote evidence passes for the recorded candidate. Hosted Windows automation does
  not replace the subsequent Windows-PC/native/human review.

**Stage 3 — subsequent Windows-PC agent (future separate chat):**

- Review the exact passing source/package candidate on Windows x64 with the existing
  14-row deferred checklist and affected production/native/service/input gates.
  Verify the driver reaches WebView2 where automation claims native input; synthetic
  DOM/Chrome observations do not count. Prepare remaining physical/human checks.
- Windows remains deferred now. Do not invent Windows results from Mac. Any Windows
  correction changes the candidate: repeat affected Mac checks, remote qualification
  as justified by changed scope, and relevant user interactions; identify superseded
  acceptance. Keep candidate identity consistent across both platforms.

**Stage 4 — final separate integration chat (future selection boundary):**

Resolve PR #17 against freshly inspected main while preserving both intended changes,
verify affected combined-input gates on required hosts, then reviewed integration.
Conflict resolution is not a merge and pre-conflict candidate passes do not qualify
changed combined code. The next Mac chat does not resolve conflicts, rebase/rewrite
history, merge, close 1G/1H or implement a new feature phase. Later chat selections
remain explicit; optional Git is outside Phase 1.

Fresh refs for this plan: feature `94569725d152f3bfae8d67b347b0b6be168fdc67`,
Git remote main and REST main `4d7ba0333c48d60242a9a42d3e079fea499a5531`, remote
planning `267ec2a`, separate local planning worktree `2c5a164`. PR #17 is OPEN/draft/
CONFLICTING. GraphQL PR `baseRefOid` reports `924619d`, differing from current Git/REST
main; do not assume that PR snapshot is the current integration ref. Refresh live
refs at the integration stage. No operation pending. Historical evidence is retained;
counters remain 10 packages, 44 native/boundary starts and separately 4 SDK menu starts.

### Final Mac completion execution — 2026-10-04

**State: in_progress; Mac physical/visual review pending.** User selected the staged
sequence above in this same Mac chat. Entry local/remote feature `a15e923`, clean;
Git main `4d7ba03`, remote planning `267ec2a`, separate local worktree `2c5a164`
preserved. PR #17 remains OPEN/draft/CONFLICTING; GraphQL base `924619d` still
differs from Git main. No conflict resolution/integration or Windows execution.

CONFIG-01 now shows dimensions/reduced ratio and the exact accepted caption. Preview
and Continue share the unchanged even-dimension limits; empty/invalid Custom input
shows guidance without any shape or ratio. Border-box previews preserve proportions
inside 100 × 64 logical pixels, including extreme portrait/landscape. Existing presets
and source `f287a7e` Story/Source spacing are included. Canonical UI description updated.

**Focused evidence:** frontend check 85 passed, 0 skipped; production web build PASS
(existing chunk advisory); Source-save and selection browsers PASS; full UI browser
PASS, including all presets, nine invalid cases that cannot advance, reduced Custom
ratios, four proportions at two widths/both palettes, bounded geometry and no overflow.
New ratio assertion first rejected old source. Reviewed compact light portrait capture.
Repository validator PASS (325 files), diff check PASS. Existing unchanged core/service
proof is reused; these renderer tests do not claim native/physical/SDK acceptance.
Ignored logs: `config-01-red.log`, `config-01-check.log`, `config-01-browser.log`.

**Driver failure classification/corrections:** the full browser command failed at
compile diagnostic navigation because its shipped probe clicked a link inside closed
Details. Correction 1 opens the matching diagnostic row via Summary; compile/lint then
passed, but route-a exposed the same omitted reveal for Advanced/controlled play.
Correction 2 opens Advanced via Summary. All five driver cases now PASS, retaining
hidden/disabled click rejection and actual failing-line/route/Save/Stop/reopen assertions.
This is a harness correction, not an application or SDK result; no threshold waived.
Failed logs `config-01-browser.log` and `config-01-driver-corrected.log` retained;
passing `config-01-driver-corrected-2.log`. No third same-hypothesis correction.

Next: pin corrected source, one local ARM64 build with retained sealing/repack procedure,
verify final mounted payload/hash/signature, prepare disposable review files and conduct
manageable Mac review steps. Initial final remote production dispatch remains **0/1**;
only after Mac review passes. Incoming cumulative counters: 10 production builds,
44 native/boundary starts, separately 4 SDK menu starts. Windows stays deferred.


**Prepared Mac review sequence (human rows remain OPEN):** use corrected local
candidate `580740f`, macOS ARM64, official SDK 8.5.3 and synthetic content only.
The ignored `.toolchains/final-1g-mac-review/` contains generated background/two
appearance PNGs, PCM WAV, unsupported text, hashes and an empty projects directory.
A guarded `profile-session.py` is prepared but **not executed**: with Loomlight quit,
it can preserve the whole original application profile intact, activate an empty
review profile for a genuine uncached SDK download, then retain the review profile
and restore the original. No deletion, cache purge or private-project mutation.
Application Support writes still need the host's sandbox approval when executed.

| Session step | User physical/visual observation | Agent responsibility / current result |
| --- | --- | --- |
| MAC-01 — installer, welcome and wizard | Confirm installed copy, both palettes, full-height steps, real download bytes/Verify/Install and stable creation stages. On picker test presets, Custom 1600×1000 (8:5), 1080×1920 (9:16), empty/odd/out-of-range rejection. | Verify installer/payload, prepare clean preserved profile, record actual SDK/network/creation observation; human OPEN. |
| MAC-02 — Story/Source and physical input | Expanded icon/label gap above/below 1100px, independent navigation/tree/focus/restore, Writing focus and divider reset. Type English text in dialogue and Source, native Save/commit/undo/redo, pending input across navigation; Beat pointer drag/cancel alongside keyboard moves. | Automated renderer checks PASS; prepare disposable authoring content, record keyboard/IME availability, scaling and actual results separately; human OPEN. |
| MAC-03 — Branches B | Review reciprocal/long/duplicate/self/same-layer/missing routes, long English captions, arrow destinations, labels, Fit/zoom/pan, details dismissal and mapped destination edit with pending input. | Prepare saved synthetic routes after project creation; ordinary graph/service proofs retained, native/human OPEN. |
| MAC-04 — catalogue/import | Image/empty Character entries and Grid/List; appearance retention/default/alias reuse/replacement/retry. Variable bool/int/string columns and discard/reopen. Browse and Finder multi-file image/audio drop, preview, category/metadata, Add/remove/Cancel, unsupported-row failure, once-only import. Use the standard keyboard for English naming/display/text. | Synthetic files ready; agent owns ordinary service/rejecting/no-write cases, user owns Finder/physical/visual observations; OPEN. |
| MAC-05 — final runtime and reopen | Run both authored routes, save a script while playing, earlier-launch status, Stop/rerun latest save; one known SDK diagnostic → current Source; resize/scaling/shortcuts, close/reopen retained work and usability. | Retained packaged real-SDK cases executing on this candidate; prepare concise reversible diagnostic and route fixture after creation. Physical/visual OPEN. |

Present one manageable step at a time in this same chat; do not assign routine
service/race tests to the user. Record Pass/Fail/Unavailable per actual observation,
platform/version/display scale/palette and package identity. Remote production
qualification remains gated on passing Mac review, initial dispatch **0/1**.


**Verified installer / native wait checkpoint:** built input/app source
`580740f85c03118b37846a2413e849a4187555bb`, one release compilation, retained local
ad-hoc sealing/repack procedure. Final DMG
`.toolchains/review-builds/ui-refresh-580740f/Loomlight_0.1.0_580740f_aarch64.dmg`,
5,751,732 bytes, SHA-256
`9e6df6905f7f16d2d30ba58578e9d461d6fc8e1b5fc671d72c378d53e1abf0c1`.
Sealed executable `6114877e6f441b18d7af0186241c83506a44bba27b6ea03def5422b68710e7a9`;
raw container `6723a958ebdc3bf176cd381a9d880b8904e9bf54959b35d58da13e4b638a7bb4`
retained separately. Final integrity/mounted signature/hash/execute mode/identifier/
version/ARM64/Applications shortcut and two checksum entries PASS; privacy scan 7 files
PASS. Not Developer ID/notarized. Original app installation/profile and prior installers
preserved. Exact 132 app/workflow input hashes recorded at source `580740f`; all match.
Platform macOS 26.6.2 (25G83), arm64; official pinned SDK archive 8.5.3.

One existing six-case local packaged runner launched against the sealed retained app,
using independent disposable profiles and real IPC/service/SDK. Compile PASS 304.392 s
(including 283.884 s diagnostic navigation), lint PASS 27.763 s; cleanup true for both.
Route-a FAIL 307.637 s: `Timeout: source-save-click`, awaiting the earlier-launch
observation after saving during play. Preserved JSON/log, no acceptance waiver.
CUA showed native Stop-before-close and saved Source states during observation; an
agent window Raise was used, not a physical-user result. Subsequent CUA reports the
Mac locked and automatic unlock unavailable. **Classification provisional environment
limitation/missing unlocked-host evidence; product/harness cause remains unresolved.**
No production change or automatic identical retry is selected from that timeout alone.
User asked to unlock Mac; further native UI-dependent work waits for that capability.

Pending bounded runner: exec session 14077, ignored `final-1g-mac/native-summary.log`
and individual case reports. It continues the originally selected cases within its
existing 420-second per-case watchdog; do not start a second writer/app/probe. On
same-chat resume, audit all terminal reports and exact process/input state first.
Do not rerun compile/lint success unchanged. Assess failed/missing affected cases on
an unlocked host and justify any necessary local correction or rerun before execution.
Then verify native picker and prepare physical review one step at a time. Profile
isolation helper remains unexecuted. No remote dispatch; production allowance **0/1**.
Counters now 11 production builds; incoming 44 native/boundary starts plus currently
started local cases (see pending logs); separate 4 SDK menu starts unchanged. Final
Mac acceptance, remote qualification, Windows transfer and integration remain open.


**Same-chat unlocked resume — 2026-10-04:** user says ready. Clean local/remote
feature `273b8e7`; main remains `4d7ba03`. Installed Applications executable matches
sealed candidate `580740f` digest exactly; normal app is at Welcome, no open project.
Original runner handle expired and no runner/probe remains. Compile/lint retain their
positive reports. Route-a negative report additionally records SDK quit-prompt error
(`Layout.yesno_prompt`) after route readiness; no source fix inferred from it.
Route-b log contains one failed `native-watchdog` report with cleanup true; wrapper
JSON/exit evidence is missing. Runtime-error/UI-refresh never started. Preserve this
incomplete run; do not fabricate wrapper success. CUA access now works on unlocked Mac.

Selected next discriminating action: quit the idle normal app through the UI; rerun
only route-a/route-b under unlocked conditions, then execute missing runtime-error/
ui-refresh once. Exact same retained sealed candidate/SDK archive, separate output
`final-1g-mac/unlocked-native/`, bounded existing runner and original assertions.
No repeat of unchanged compile/lint successes; no build or remote dispatch. This is
local environment recovery/assessment, not a package matrix retry or pass waiver.
If unlocked failure repeats, reassess actual failing stage/driver/fixture before any
further run. Incoming counters remain 11 builds, 48 automated/native starts; these
four selected starts add only as actually launched. User physical review remains OPEN.


**Unlocked discrimination — fixture Stop defect confirmed:** route-a again FAIL,
227.965 s, same misleading retained stage `source-save-click`. Its actual progress
includes long-run duration after the Save; the pending expectation is Cancelled/Stop,
while native runtime reports a real SDK quit-prompt error. CUA revealing the runtime
panel confirms the error rather than a still-dirty Source. The official local 8.5.3
`Quit` implementation defaults to confirmation outside the main menu and calls
`layout.yesno_screen`, matching the failing `Layout.yesno_prompt` traceback. The minimal
probe's screens omit any quit confirmation. This changes classification from a purely
provisional lock explanation to a **confirmed fixture defect**, with lock delay retained
as a separate observed limitation. No product error is hidden or accepted.

Bounded correction hypothesis F1: give only the minimal explicit native-test fixture
`config.quit_action = Quit(confirm=False)`. It has no confirm UI and editor-owned Stop
already owns cleanup; production generated games and runtime diagnostic behavior stay
unchanged. Preserve all assertions (normal route duration, Save/earlier revision,
Cancel close, Stop status, disk reopen, positive report/cleanup). Build a corrected
candidate because this fixture is compiled into the probe-capable desktop binary;
`580740f` installer remains historical review input, not the final corrected candidate.
One changed-input local build is justified. Verify F1 with the real SDK/native route
cases, plus affected fixture compile/lint and missing runtime-error/UI-refresh; no
remote dispatch before Mac acceptance. No identical-success matrix repeat or third
same-hypothesis correction. Old/unlocked reports stay in their original directories.
Physical keyboard standard only (user report); IME composition **UNAVAILABLE**, not PASS.


**F1 passes — corrected local candidate:** source/build input
`28e44b0dd3a3454223f65667722419878952cb66`. One changed-input build, verified sealed
ARM64 installer `.toolchains/review-builds/ui-refresh-28e44b0/Loomlight_0.1.0_28e44b0_aarch64.dmg`,
5,750,827 bytes, SHA-256 `c9cbb43685209886600de5ccdf491222fee36348dfaea798819ccfe01d2f2eb1`;
sealed executable `7ac773ff7f2fe2e79f99d89be63092945d6d02d3bb6df137a167459dc2fd94e5`.
Retained procedure passes integrity/mounted identity/hash/execute mode/ad-hoc strict
signature/ARM64/Applications shortcut and checksums; privacy scan PASS. Format and
repository validation 325 files PASS. Exact 132 input hashes recorded; only changed
app/workflow input from `580740f` is `src-core/src/lifecycle/runtime_probe.rs`.

All six F1 native real-service/SDK reports PASS with cleanup: compile 25.073 s,
lint 24.351 s, route-a 36.110 s, route-b 36.664 s, runtime-error 25.631 s,
ui-refresh 4.388 s. Exit zero, exactly one positive report each, no watchdog timeout.
Both routes retain saved-byte/reopen, at least 9.5-second running duration,
Cancel-close/Stop and earlier-launch checks. This confirms the missing fixture quit
screen cause without suppressing runtime errors. Logs/JSON/input hashes stay ignored
under `final-1g-mac/fixture-f1-*`; synthetic input, not physical-user acceptance.
The superseded unlocked run has route-a/route-b FAIL with cleanup (227.965/226.727 s),
runtime-error/UI-refresh PASS (26.083/4.355 s); retain all reports on `580740f`.
Counters **12 production builds, 58 native/boundary starts** (44 incoming + original
four + unlocked four + F1 six), separately 4 SDK menu starts. No remote dispatch (0/1).

**English scope clarification (user, same chat):** app support is English; prepare a
fresh English-named/content review project through the normal wizard and verify it.
The non-English diagnostic filename in automated fixtures is intentional path/byte
preservation coverage, not app UI localisation. Every probe already creates a fresh
project; actual Stop failure was in English-named `options.rpy`, now corrected.
Manual review uses English only; non-English IME/input/localisation is not a required
physical acceptance exercise for this selected English scope. Preserve existing
source bytes/UTF-8/path regressions and composition safeguards; no destructive
conversion or unsupported translation feature is selected. User has standard keyboard
only. Create the English disposable review project next, with a preserved clean profile
for genuine SDK progress; collect user's visual observations separately.

**Native picker correction P1:** the normal macOS WKWebView still rendered the
resolution select about 23 logical pixels high despite its nominal minimum height.
This fails CONFIG-01’s actual 44–48px requirement. Target only the resolution select:
retain native select/keyboard/options semantics, remove platform appearance, set 48px
height and draw a theme-token chevron. Existing browser checks now reject height/width
regressions in both palettes and wide/compact layouts. Verify in the actual retained
Mac app before human acceptance; no remote dispatch yet.

**Fresh English normal-wizard review:** preserved the original whole application
profile intact at ignored `.toolchains/final-1g-mac-review/preserved-app-profile`;
`profile-state.json` is `isolated`. The clean review profile genuinely downloaded
official SDK 8.5.3 through Install (agent observed starting 0 and SDK Ready, but not
measured intermediate bytes/Verify/Install; human observation still OPEN). Normal
Create captured Generate game and staged progress, then opened a Saved project.
Project `.toolchains/final-1g-mac-review/projects/loomlight-final-mac-review`, title
Loomlight Final Mac Review, 1600×1000, Git enabled. Nine generated/helper `.rpy`
filenames are ASCII; source hashes retained ignored. Explicit helper consent and
session trust enabled normal Run, which reports Running without an SDK diagnostic.
Agent could not bind the game window through app inventory; a display-name selector
opened an unrelated SDK launcher, which was immediately quit. Do not count it as
game/menu acceptance. User observation requested separately.

**Recovery requirement:** after final review, quit Loomlight and the game, execute
ignored `profile-session.py restore` with host approval. It retains the review
profile/SDK and restores the original intact without overwriting/deleting either.
Until then only the clean review profile is active; private project folders were
not changed. Counters before P1: 12 production builds, 59 native/boundary starts
(58 recorded probes plus this normal review app), separately 5 SDK menu/launcher
starts (4 incoming plus unintended launcher). No remote dispatch, 0/1.

**P1 verified retained candidate:** source/build input
`8104ed78afe26cf102f394f4d9e6f1a74215dfc0`, final installer
`.toolchains/review-builds/ui-refresh-8104ed7/Loomlight_0.1.0_8104ed7_aarch64.dmg`,
5,750,844 bytes; SHA-256
`7ab87687e52120d5070c4a57b8830775737b8e57e6e6d44b7375cb5c0a1826b1`.
Sealed executable `19a456755251ac5a7694129603fa7d2d03c124cab7af248204109d1e2d6ff1b2`.
Release, retained seal/repack/mounted checks, artifact privacy (7 files), source hash
manifest (132 inputs) PASS. Web build/UI browser and validation (325 files) PASS.

Normal retained P1 app launched against the clean review profile. Actual WKWebView
CUA screenshots show selector 96 physical pixels high / 48 logical at the observed
2× display scale, 840 physical / 420 logical wide, readable text/chevron in Light
and Dark. Native option popup retains all four presets; Custom selected; empty Width
refuses Continue with guidance/no shape/ratio; 1080×1920 shows 9:16 bounded portrait
and advances to Review. No project created by this inspection; returned to home
and reopened the saved English review project. Earlier F1 normal Run/Stop reported
Cancelled/stopped exit 0 without SDK diagnostic; user menu/first-line observation
remains OPEN. Normal P1 Run launched for the next human check. Agent screenshot/
native observations are separate from human acceptance.

P1 changes only picker styling/test plus English scope docs relative to F1; unchanged
SDK/transaction/backend evidence retained under its exact identities, not called a
new full-candidate matrix. Exact final remote qualification still required after Mac
acceptance. Counters: **13 production builds, 60 native/boundary starts**, separately
5 SDK menu/launcher starts. Initial final production dispatch remains **0/1**.

**Local-only publication boundary:** automatic approval review rejected the combined
checkpoint/push command before execution, citing publication to an unverified remote
before the user-selected Mac-review gate. Saved the checkpoint locally instead;
no push/workflow request sent, no workaround or duplicate dispatch. Remote remains
last verified `273b8e7`; source `28e44b0`/`8104ed7` and later evidence are local only.
Normal retained P1 English Run now reports Running/no structured diagnostic. Next
collect user menu/Start/first-line feedback, then remaining five-step review; publish
only after the selected Mac gate passes. Original-profile restoration still pending.

### Agent-owned final Mac review — 2026-10-05

User selected agent-run objective tests and UI judgment, with tooling limitations
reported explicitly. Review retained P1 `8104ed7` on macOS ARM64, official SDK 8.5.3,
clean preserved profile and English project. Fresh local HEAD `353f1f7` contains a
user-authorized documentation-only planning merge; app/test/workflow inputs equal
P1, preserve that work and explicit no-push boundary. No rebuild for docs.

Cases before execution: native English Source/Story edit, clipboard/undo/redo,
Cmd+S/commit, focus/navigation and reopen; Source edit while running/earlier-launch/
Stop; known diagnostic/current navigation; native catalogue Browse staging and
visual columns/appearance/discard; native Branches fixtures/navigation; actual
window resize/interface density. Expected accepted bytes, stable focus and geometry,
no unintended writes, truthful status and readable both-palette/compact views.
Agent owns actual UI/SDK/service checks; automated route oracle is retained separately
under exact F1 identities. Game-window binding/Finder cross-app drag and already
completed intermediate download stages need capability audit; do not claim passes.
No duplicate unchanged SDK matrix, final remote dispatch or new feature scope.

**Fresh English SDK menu check selection:** to avoid assigning game-menu assertions
to the user, run one bounded SDK built-in testcase on an exact source/GUI copy of
the normal-wizard review project. Assert dimensions/title/build name, main menu,
Preferences/Load/Save, first narration and return. Original review project is read
only; copied game source hashes must match before/after. Reuse the existing testcase
shape and verified installed SDK, no download/build or second matrix. This is a
game test oracle, not native keyboard or human window-visibility evidence.

**Locked-host checkpoint:** native CUA Source click refused: Mac locked and automatic
unlock unavailable. Asked only for desktop unlock, not user-run tests. No native
input success claimed. Fresh English copied-project SDK testcase started, timed out
at 40 seconds, terminated its own process group (SIGKILL after 5-second termination
grace); exit -9, no positive named PASS. Original nine ASCII-named `.rpy` hashes
remain identical. Failed log/JSON retained at ignored `final-1g-mac/english-menu-native.*`;
classification is provisional environment/capability while locked, not a waived SDK
pass or proven game defect. Reassess once unlocked; no automatic same-condition retry.
Counters: 13 production builds, 60 native/boundary starts; separately 6 SDK menu/
launcher starts (new bounded testcase +1). Existing exact starter-menu regression
passes retained; it does not turn this failed fresh-project check into a pass.

Input audit: all 132 P1 app/workflow hashes match current checkout after planning
merge; DMG/executable checksums match BUILD manifest. No source rebuild needed.
Saved browser captures reviewed: sidebar spacing/alignment, Source text hierarchy,
Character image/empty-card separation, Variable header/cell columns and compact
staged-import sticky actions are legible/consistent. Branches B routes terminate
at node boundaries and labels remain readable in the inspected dark fixture.
These are fixture/rendered observations, not native acceptance. Story fixture has
unresolved media URLs, so image composition must be checked with real imported
assets after unlock. Native key/Finder/drop/resize and game-window binding remain
OPEN; do not automatically transfer them to the user. No remote dispatch/push.
Next: user unlocks desktop and replies Ready; resume same chat, use native controls
on retained P1 app; bounded unlocked reassessment of failed menu check if needed,
then objective five-group review. Original-profile restoration still pending.

**Unlocked menu reassessment PASS:** user replied Ready; same exact English menu
assertions on a new disposable copy complete in 5.829 seconds, exit 0, named PASSED,
eight assertions, original source unchanged. Retain failed locked run separately;
this supports environment blockage rather than a fresh-game content/GUI defect.
No native game-window visibility claim; SDK oracle now owns menu outcomes.
Counters SDK menu/launcher starts **7**, native/boundary 60, builds 13.

**SOURCE-FOCUS-P2 selected correction:** native P1 Command-S accepts exact comment
bytes but focus becomes HTML; an immediate period is ignored. Undo/Redo before
Save PASS; earlier-launch details correctly state earlier revision; Stop exit 0 PASS.
Rich CodeMirror is recreated while the Save barrier keeps it non-editable, so its
render-time focus call cannot work. Capture prior typing focus, then restore after
barrier release only for the same document, no modal and body focus (avoid taking
focus from another control). Existing textarea behavior and transaction contract
remain. Native proof plus corrected browser rejection: rich keyboard Save loses
focus; faithful textarea PASS. First test measurement mistakenly read textarea
textContent; fixed to value, retained both logs, no false product diagnosis.

After P2, frontend 85 tests/0 skipped, production web build, Source save/focus browser
and selection browser PASS. Existing faithful accepted-text/no-Flush and selection/
failed-commit assertions retained. Two editor modes accept direct subsequent keyboard
typing without locator refocus. Native retest/new pinned ARM64 package required;
no backend/SDK matrix duplication. Native Character ALEX → alex/Alex/default-colour
creation PASS; Browse appearance uses synthetic image (under ignored assets), pending
completion/visual review. Original private profile remains preserved and active
clean profile unchanged. No push/remote dispatch, no extra phase.

**Native appearance pending observation (P1):** after Add Appearance HAPPY and
normal image Browse/Open of synthetic assets/review_happy.png, the modal remained
Saving/Choose disabled for several minutes. No image/appearance declaration or
imported file appeared. Brief local stack sample retained ignored at
`final-1g-mac/appearance-pending-sample.txt`; app main loop/workers appeared idle,
which does not establish a backend deadlock. Normal Cmd-Q quit succeeded. Preserve
observation and reassess once in fresh corrected P2 session; no unbounded retries,
no forced profile discard, no product cause claimed yet.

**P2 package/native proof — 2026-10-05:** source/build input `4b77b547f53b3f2a6f2c85f9c7e6d7d90a4a19e7`,
retained final ARM64 installer `ui-refresh-4b77b54/Loomlight_0.1.0_4b77b54_aarch64.dmg`
under ignored review-builds, 5,751,006 bytes, SHA-256
`0d0e3bdc123f861763e86e2ba27548633ab3f597debb58b4eaec94c1f2d33a2c`.
Sealed executable `bec88eec76dc01fbb6a2a9c3c38bbbd1a2b29368fea36bebddfd363bb5e29be6`;
release, retained seal/repack/integrity/read-only mount/identity/ARM64/checksum and
privacy checks PASS. Native Source Command-S followed immediately by typing PASS;
native paste/save restores exact original Scene bytes and remains focused/clean.
No new core/SDK matrix: those inputs unchanged. This package includes P1/F1/sidebar.

**Appearance wait classification:** fresh P2 reopened the saved happy appearance.
A second normal selection from the review assets folder stalled before importing
calm. A full stack inspection (both retained samples) identifies `select_import` →
`DirectoryAnchor::open_root` → native `open`, not a renderer or native-dialog deadlock.
Scoped macOS permission log confirms a pending Documents-folder TCC prompt and
changed ad-hoc code requirement. The first provisional “idle” reading was incomplete;
the earlier observation is not a proved failed import. Browser now explicitly waits
for Character Save dialog closure and PASS; the simple orphan-dialog hypothesis is
rejected, no application fix applied. Sandbox-refused localhost attempt retained;
approved local browser run completed. Evidence stays ignored in final-1g-mac.

CUA refuses access to UserNotificationCenter for safety reasons, so that permission
alert cannot be inspected/answered by the agent. No broader Documents permission was
granted or TCC protection changed. Normal Cmd-Q removed the window but left the
permission-blocked review process; scoped TERM ended only that disposable process
before a fresh start. No calm import existed then. Changed-input reassessment uses
the same synthetic PNG copied to the temporary folder: native Browse/Open completes,
dialog closes, Saved appears, two appearances render. Select non-default calm → Edit
Character → Save retains calm and closes the dialog. This classifies the wait as a
host permission limitation; it does not qualify an unanswered Documents prompt.
Native real happy/calm media are proportional and legible in cards/details.
Counters now **14 production builds, 62 native/boundary starts**, separately **7 SDK
menu/launcher starts**. No push or remote dispatch; final Mac review still OPEN.

**Catalogue/Browse continuation:** native mixed Alex image/Morgan empty rows and
cards align; default calm changes card media; Variable bool false/int 42/string
English text share aligned headers/cells. A dirty Boolean form asks discard and
reopens empty/default False. Four supported native chooser selections stage actual
PNG dimensions/decoded previews and WAV file information. Remove calm/happy leaves
background/audio; Add files → native Cancel retains staging; close asks discard,
Keep editing preserves it; one Import creates exactly four distinct total media
files (two prior appearances plus background/music). Ignored hashes/byte counts in
`native-import-evidence.json`; no imported-row replay or private content.

Q1 source selector audit, rejection self-test and nine package-retention tests PASS;
repository validation 340 files/diff check PASS. Fresh remote heads unchanged:
feature `273b8e7`, main `4d7ba03`, planning `267ec2a`; preserve local merge/worktree.
No build for this test/evidence-only change: app code remains P2. Added explicit
Character Save dialog-close assertion passes on existing full browser; its named
`catalog-dialog-red-corrected.log` is a passing hypothesis check, not product red.

**Actual wait/continuation:** Finder opened the temporary synthetic-media folder;
initial CUA binding took 272.529 s, later navigation worked. The documented API exposes
separate cropped app windows and no shared desktop positions, so a reliable Finder
cross-app drop cannot be driven from observed coordinates. User asked for a clickable
folder link; supplied in this chat. Await their drop of background/WAV/unsupported
text into Assets, leave unimported; inspect staged supported rows/unsupported error,
then discard duplicate staging. This human result stays separate from Browse PASS.
Continue same Mac chat with native Story/sidebar/focus, prepared ASCII saved Branches
payload and mapped-input checks, affected P2 runtime/routes/diagnostic/scaling/reopen
and missing intermediate genuine download observation. Prepared Branches payload is
outside the active project and has not been applied. Original profile remains safely
preserved; restore before final transfer. No runner/remote dispatch/push pending.


**Finder physical result / unsupported-only P3 — 2026-10-05:** user reports the
actual Finder drop works, with an error for `unsupported.txt`. This is the human
physical observation, separate from native Browse and synthetic callback proofs.
Agent inspection sees the unsupported error and no staged supported rows (the user
may already have dismissed them); do not invent another staged-preview observation.
No physical test request remains pending.

The same native inspection exposes a small real presentation defect: an
unsupported-only batch unhides the empty import form outside its modal. P3 leaves
the host hidden when there are no supported choices, still reports all errors,
imports nothing and preserves existing staging. Existing modal DOM regression first
rejects the original behavior (`false != true`), then passes with the fix. Native
probe adds error/form/dialog/no-write assertions via the production asset callback
and real authoring service; it is explicitly synthetic, not another Finder result.
85 frontend tests/0 skipped and production web build PASS. Full UI browser first
fails its stale expected probe count (11 actual/9 expected); count updated for the
two added checks, all behavior assertions PASS. Retain both logs and original red.
Changed-input ARM64 build and affected native checks remain required before acceptance.

Story fixture setup: arbitrary extra labels in a managed Scene are truthfully
refused; free-label jumps project as protected Custom Code. Correct the disposable
fixture by creating two managed Scenes through the native UI and pointing the
primary menu at their recorded technical labels. No parser/product fix or source
rewrite is selected. Native paste/Command-S accepts the controlled single-label
source. Story shows the imported background and two mapped choices; native Narration
paste, pending-navigation refusal, Commit, Undo and Redo all PASS with Saved status.
Branches native graph renders the entry, both destinations, distinct route channels,
bounded long caption pill and arrowheads at node boundaries; details initially closed.
Standalone labels preserved in script are source content, not managed graph nodes.
No new build/native start/remote dispatch yet; original profile restoration pending.


**Native continuation / caption P4:** mapped Branches route selection opens the
existing Choice editor. Native English paste/Tab then attempted Source navigation
is truthfully blocked until Commit; accepted fourth caption appears in preview and
source. Independent navigation collapse/tree hide/restore arrows and restored focus
PASS; Writing focus hides chrome/preview and returns to the prior independent layout.
Native edge drag resizes the actual window from 1100×720 to about 802×552 logical
pixels at 2× scale. Compact tree is the designed overlay; hide it to expose the
workspace. No OS display setting changed.

A short preview exposes a real remaining visual issue: a long four-option caption
extends above the canvas and is clipped. P4 adds a bounded scrollable overlay (88%
maximum height, border-box, zero minimum) so its end remains reachable; no game/source,
preview resolution, persistence or graph behavior change. Existing browser test with
real Story Choice structure and long English caption at 90px preview first rejects
outside bounds, then proves bounded geometry and end-of-caption scroll reachability.
85 frontend checks/0 skipped, production web build and full UI browser PASS. Original
red/green logs retained under final-1g-mac; native corrected inspection still required.

P3 source/build `b0d9d1985a675612b9107629f3104d5b97dd1f74` was compiled/retained before
P4 was discovered: verified ARM64 DMG 5,751,294 bytes, SHA-256
`80e38d3417e56d498cb4e3ed455f86372bf70d40e9c7366fb47e297c0d17ae35`, executable
`3c841e3a4637705567137088d498b8dc52c663da3887b0697b0b77d93be71d58`.
Retained seal/repack/read-only mounted identity/ARM64/signature/checksum PASS.
It is superseded for final review by changed-input P4, not failed native evidence;
no P3 app launch/native suite duplicated. Counters now **15 builds, 62 native/boundary
starts**, separately 7 SDK menu/launcher starts. Remote initial dispatch still 0/1.


**P4 retained package / affected native PASS:** source/build
`efb52edebd934277f7643a6978f59a343e6c447b`, ARM64 DMG 5,751,326 bytes, SHA-256
`5da26bf4bfd537edd18bd5356ce07bdb8f2d2658c9aa86f2ba84a9f7c1f5b980`;
sealed executable `d2883d2e7c014dd38b785cc805e0a50d369e22734673639af11ae181236b5daa`.
Retained release/seal/repack/integrity/read-only mount/identity/ARM64/signature/hash/
Applications shortcut PASS, artifact privacy 9 files PASS. Installer link supplied in
this chat. Exact 132 app/workflow hashes retained; from P2 only import UI, preview CSS,
UI probe and their two tests change. Core/SDK/services and Source implementation are
unchanged; retain prior identities, no duplicate broad-core/SDK matrix.

Three affected real-SDK/package cases PASS with exit 0 and cleanup: route-a 37.161 s,
route-b 35.978 s, ui-refresh 4.446 s. Both routes retain destination edit/reopen,
accepted Save during play, earlier-launch state, at least 9.5 seconds Running,
Stop/reopened bytes and route-b invalid-draft refusals. Eleven native UI checks include
unsupported-only error/no empty form/no dialog/no new asset through the real service.
Normal retained P4 app then starts and reopens the saved English project. Native
preview shows caption beginning within bounds; native scroll reaches final words.
Actual minimum window about 562×482 logical at 2× scale remains usable with hidden
tree and wrapping header. Previous independent layout and saved fourth caption reopen.

Native known `$ if True` diagnostic: Source accepts controlled unsupported statement,
real SDK compile fails at Scene 3 line 2; expanded diagnostic Open navigates to current
Source with line 2 highlighted. Restored station narration/return accepts Save and
retains typing focus. Next validation truthfully detects the intentionally missing
free-label fixture in script; preserve that source in ignored failure evidence, restore
normal comment/start jump through native Source transaction. Final normal validation
then PASS exit 0/no structured diagnostics. These are fixture corrections, not app
fixes or waived SDK results. Re-grants reflect SDK common `.rpyc`/`.rpymc` rewritten
by real compile and the existing SDK content/identity consent contract; no weakening.
Counters **16 builds, 66 native/boundary starts**, separately 7 SDK menu/launcher.
No remote dispatch (0/1). Genuine intermediate download observation and profile
restoration remain; normal native Run/Stop finishing. Keep original profile intact.


**Final Mac review PASS — 2026-10-05:** agent-owned objective/native/visual review
on macOS ARM64, standard English input, exact P4 retained package above. User physical
Finder result remains separate (works, unsupported text error). Non-English IME is
outside the selected English support scope; no physical human typing claim. Genuine
normal P4 Run reaches Running/no diagnostic, native Stop reaches Cancelled/stopped
exit 0. Saved Story/Choice edits and independent layout reopen; exact route/service
cases above own both route outcomes, Save/staleness/Stop/rerun/reopen assertions.
Known native SDK diagnostic navigates to current highlighted line and corrected
normal validation passes. Both-palette picker and unchanged service/alias/replacement/
retry/pointer-cancel/missing-flow contracts reuse their recorded unchanged-input
proofs; native real-media/mapped-edit/sidebar/minimum-window observations are additional
acceptance, not a claim every browser gesture was physically performed.

The one remaining uncached progress check now PASS: empty second disposable profile,
normal native Install downloads official 8.5.3. AX shows 63.8 MB of 146.5 MB / 43%;
contemporaneous screenshot 65.6 MB / 44%, then Verify download, then Install SDK.
Stage rows turn complete/active correctly, indeterminate indicator is used after
measured download, and final managed compatible SDK/Ready/Continue enabled appears.
No fake requester or cached archive supplies this observation. First normal-wizard
creation Generate/stages/completion proof is retained under its unchanged creation
inputs; no duplicate new project/SDK matrix. Ignored native observation record and
this chat's actual tool captures retain the layer. Counter +1 normal progress app:
**16 production builds, 67 native/boundary starts**, separately **7 SDK menu/launcher**.

Recovery COMPLETE: after normal Stop/quit, both guarded helpers retain second profile
`sdk-progress-profile` and first `review-app-profile`, then restore original whole
user profile intact. Both state JSONs confirm restoration; no app remains running,
no private project modification, deletion or overwrite. Disposable SDKs/projects and
all failed/superseded evidence stay ignored. `/Applications` still original older
installer; corrected P4 link supplied without replacing it.

Selected next action is Stage 2: publish one exact candidate on the existing feature
branch/PR, verify remote identity, Repository quality and one initial production
qualification with upload_packages=true (allowance 0/1 before dispatch). New checkpoint
contains acceptance/continuation docs only; its 132 app/workflow inputs must match P4
before dispatch. No remote acceptance yet. Preserve planning branch/worktree/local
merge; its earlier no-push instruction governed the planning merge operation, no
planning branch publication is selected. Stage 2 publication of the final feature
candidate was explicitly selected in this Mac completion sequence. No conflicts,
history rewrite, integration, Windows-PC execution, closure or new feature phase.


**Confirmed remote qualification wait — 2026-10-05:** state `awaiting_ci`.
Published and verified candidate `94ffa25c016740eb541bba4e883f6ab683cb93d6` on
`feature/phase-1g-branches-runtime`; PR #17 still OPEN/draft/CONFLICTING, no integration.
All 132 app/workflow inputs match tested/package source `efb52ed`; exact acceptance
remains tied to those identities, not every future branch head.

Repository quality [37300945634](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37300945634),
attempt **1**, workflow_dispatch, tested SHA **94ffa25c016740eb541bba4e883f6ab683cb93d6**:
PASS. Actual required Validate repository job and every step success (structure/link/
privacy, bounded Q1 rejection/retention tests, selector audit). Optional flow-profile
and traced diagnostic jobs skipped because selectors false; no optional pass claimed.

Production [37300975410](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37300975410),
attempt **1**, workflow_dispatch, branch above, tested SHA
**94ffa25c016740eb541bba4e883f6ab683cb93d6**, `upload_packages=true`: confirmed **queued**
at the one identity read. Initial final-candidate dispatch allowance **1/1 consumed**;
changed-input correction reruns **0**. No duplicate/ambiguous request or pending
local runner. Local counters stay **16 builds / 67 native starts / 7 separate SDK
menu/launcher starts**; remote build/start counts are not preclaimed before audit.

Manual same-chat waiting now selected: stop model polling. Resume this same chat
with “Resume: audit production run 37300975410 attempt 1 on 94ffa25.” Inspect that
recorded operation plus fresh refs/worktree/diff. If still pending, pause again without
a loop or dispatch. If terminal, audit required preflight, both platform gates, native/
SDK case logs, cleanup, retained input manifests and success-only final installers.
Classify failures and preserve evidence; only justified changed-input corrections
and affected verification/reruns remain authorized. Do not retry unchanged success,
an ambiguous dispatch or historical unrelated matrix. After required remote PASS,
update existing docs/handover and provide Windows-PC exact candidate/retained installer/
14-row prompt. Windows physical review deferred; PR conflict resolution and combined-
input integration remain a later separately selected chat. No phase closure/1H/new phase.

This documentation pause record follows the tested candidate without app/workflow
changes. Verify input equality and repository checks; publish it without a duplicate
package matrix. The recorded candidate remains 94ffa25, not the receipt commit's SHA.
No Codex Goal lifecycle was created in this chat; ending this active turn stops model
polling. Do not claim a live Goal pause was verified from this repository state.


**Remote attempt 1 terminal audit / P5 correction — 2026-10-05:** production
37300975410 attempt 1, exact candidate `94ffa25c016740eb541bba4e883f6ab683cb93d6`,
FAILED Preflight / Run Source Save real-browser regression at UI browser line 421:
`pill clips route text`. 85 frontend tests and preceding Source/selection browser
checks passed; Rust formatting and both platform jobs skipped. Neither package job
started; artifact inventory is empty. Full log/job metadata/inventory retained in
ignored final-1g-mac reports. Repository quality 37300945634 attempt 1 remains PASS
for its exact 94ffa25 input only. Fresh feature ref is 3264665; main 4d7ba03 and the
separate planning worktree 2c5a164 remain intact. No conflicts/integration touched.

Cause hypothesis P5: character-count widths underestimate some platform fonts. Local
actual SVG diagnostic reproduces English `Jump`: Verdana text 42.359375px + the
unchanged 12px clipping assertion > old 52px pill. This establishes font sensitivity;
we do not claim the hosted runner's precise font was captured. The rejecting browser
regression fails on unchanged product code with those exact values. Renderer batches
at most 100 unique caption SVG writes/reads with the visible text class, then uses
ceil(rendered width)+20px for pills, routing channels and graph bounds. Above 100
edges labels remain suppressed with no measurement work; 500-node/2000-edge limits,
Unicode-safe truncation, full tooltip/details and saved-source/navigation contracts
remain. DOM-only test environments retain the previous estimate; real browser/native
acceptance uses measured SVG widths. No app font, preset or supported-language change.

Focused proof: 86 frontend tests PASS/0 skipped; UI browser PASS at both palettes,
1440/960/560px, default and wider font, with long truncated English caption/full title
and unchanged clipping/Fit/path/card assertions. Router test proves measured widths,
channel/label separation, deterministic order, node avoidance and Fit extents.
Browser screenshots reviewed: captions stay inside opaque pills, node interiors are
clear and outer paths/labels fit; compact Fit naturally scales this large graph down.
The full required browser command passes build/Source/selection/UI and compile/lint
drivers, then an intermediate probe report used an undefined variable and failed
route-a; retained failed log. Corrected report variable now receives all five shipped
driver checks separately. Earlier test-only Refresh button-name and unchanged-revision
fixtures were corrected and their failed logs retained; no production assertion was
relaxed, no failed result relabelled. Product P5 is one correction hypothesis.

Self-review: actual font reads occur only after batch writes in the attached SVG;
unique captions reuse widths, hidden measuring group is removed, pan/zoom coordinates
remain local, and the routing algorithm receives the same width used in the pill.
UI and TESTING own the behavior/affected gate. Repository validation 340 files and
whitespace PASS. No backend, dependency, workflow, Save/import/SDK lifecycle change.
Next: pin this source, build/verify one ARM64 installer and run affected packaged
route-a/route-b with native SVG width/Fit assertions through real IPC/SDK. Other
completed Mac/physical evidence is reused only on proven unchanged interaction inputs.
Counters before P5: 16 builds / 67 native starts / 7 separate SDK starts. Initial final
production 1/1 consumed; changed-input correction dispatches 0. One correction run is
justified after affected Mac PASS because source/test inputs changed to fix a genuine
failed gate; no unchanged successful platform matrix is duplicated (neither started).


**P5 pinned package / affected native verification:** source
`0e3077df10bd713ca1d956dfc84be2bd8384eb16`; one production build completes (17 total).
Retained corrected local installer
`.toolchains/review-builds/ui-refresh-0e3077d/Loomlight_0.1.0_0e3077d_aarch64.dmg`,
5,752,010 bytes, SHA-256 `d0154be1e24dca11a80fb1bef300d7cceded0f1bd84504c09f9f92fbdb671797`.
Sealed executable `3e8ee00ea907e1ac3abe4aac916f3580bd162f1a06674af5634d2dde0b283f80`;
compiled executable `0bec37dd39b46deaedf115037d3d9498cf9d88c54a1b0395c7d4de5da9d8efce`.
Mounted identifier/version/ARM64/payload equality, strict ad-hoc resource signature,
DMG integrity and privacy scan PASS (9 files). Raw Tauri DMG, P4 and all previous
failed/superseded evidence retained. No installed app overwrite or Developer ID/
notarization claim. Input manifest: 132 entries, exactly 5 changed from P4 — Branches
renderer/router, their two test files and shipped runtime probe assertions; 127
unchanged including backend, SDK/import/Save/preview controls and workflow.

Finalized shipped driver component PASS for compile/lint/route-a/route-b/runtime-error;
intermediate combined command's report-variable failure stays failed. Together with
its unchanged successful build/Source/selection/UI components this supplies local
browser preflight proof, not a claim that the failed command itself passed. Format,
repository validation (340 files), whitespace and scoped self-review PASS. Actual
remote preflight still required on the correction candidate.


**P5 affected Mac acceptance PASS / correction dispatch selected:** packaged route-a
37.016s and route-b 36.007s both PASS, exit 0, no timeout, cleanupComplete true.
Actual native SVG text widths 49.052978515625/49.6357421875px map to 70px padded
pills; both Fit bounds pass. Native source/route edit, accepted bytes/revision/new
session reopen, restored distinct destinations, real SDK Running >9.5s, Save/earlier-
launch status, Stop and saved reopen pass. Route-b draft refusal/Cancel passes.
These are packaged WebView/synthetic DOM selection with real IPC/SDK; no physical
keyboard or Windows-PC claim. Probe owns its disposable profile; original user
profile remains restored. No pending local app/game/runner after both exit/cleanup.
Counters **17 production builds / 69 native starts / 7 separate SDK menu/launcher
starts**. Unaffected P4 native UI/runtime-error/diagnostic/catalogue/import/picker/
English input/progress/Finder results retain their original identities and limits;
exact input comparison (5 changed/127 unchanged) plus interaction impact mapping
justifies reuse, not blanket acceptance of this source or future heads.

One changed-input production correction dispatch is now selected after P5 Mac PASS.
Publish the coherent docs/application checkpoints on the existing feature branch;
resolve exact candidate from Git and verify all 132 app/workflow inputs equal tested
0e3077d before dispatch. Required Repository quality must test this new exact SHA.
Production uses existing workflow and upload_packages=true; initial final allowance
1/1 consumed, corrections 0 before dispatch. Failed 37300975410 attempt 1 stays failed;
no platform started there, so no successful unchanged matrix is repeated. Preserve
all failed evidence and record confirmed run/attempt/SHA before manual same-chat wait.
No PR conflict work, integration, Windows physical test, closure or new phase.


**Confirmed P5 correction qualification wait — 2026-10-05:** state awaiting_ci.
Published/verified exact candidate `cab39e101af7a3cb37c10d207f9af31b2450818d`;
all 132 app/workflow inputs equal packaged/tested source 0e3077d. Existing branch/
PR preserved; no integration. Required Repository quality
[37307638008](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37307638008),
attempt 1, workflow_dispatch, exact cab39e1: PASS, actual Validate repository job
and every step success; optional diagnostic/profile jobs intentionally skipped.
Production [37307663113](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37307663113),
attempt 1, workflow_dispatch, exact cab39e1, upload_packages=true: confirmed
in_progress / Preflight at one initial identity read, about 12:11 UTC. No further
model polling selected. Original failed run 37300975410 attempt 1 remains FAILED,
no artifacts/platform jobs; no result retroactively waived.

Initial final dispatch allowance 1/1 consumed; justified changed-input correction
dispatches 1. No duplicate/ambiguous request. Local totals 17 builds / 69 native
starts / 7 separate SDK menu/launcher starts; remote package counters not preclaimed.
No local runner/app/game pending and original profile restored. This wait checkpoint
changes docs only; app/workflow equality with cab39e1 must hold. Publish/verify it
without new qualification; tested candidate stays cab39e1, not the wait carrier SHA.

Continue SAME chat: “Resume: audit production 37307663113 attempt 1 on cab39e1.”
Read that recorded operation plus fresh refs/worktree/diff once. Pending -> pause,
terminal -> audit every required preflight/platform/SDK/native/cleanup/input manifest/
retained installer; classify/fix selected genuine failures and retest affected inputs.
After required remote PASS update existing docs/HANDOVER and provide exact Windows
candidate/retained installer/14-row prompt. Windows physical review and later separate
PR conflict resolution/combined qualification/integration remain deferred. No merge,
rewrite, closure/1H/new feature. No Goal lifecycle created; ending the turn stops model
polling and does not claim a verified live-Goal pause.


**P5 terminal audit / P6 and F2 — 2026-10-05:** production 37307663113 attempt 1,
exact cab39e1, FAILED; required Repository quality 37307638008 remains PASS for that
candidate. Preflight and both frontend/Source/selection/UI/shipped-driver/format gates
PASS. Core routine selectors PASS (Mac 187/40 ignored, Windows 182/37 ignored, each
3 filtered) plus actual independent enforced flow/lifecycle/download/SDK diagnostics/
desktop gates. Branches browser PASS with timing diagnostics retained under TEST-P2.
Runtime browser has failure outcome on BOTH hosts, though continue-on-error normalizes
its step conclusion; mandatory deferred enforcement correctly FAILS both jobs.

F2 confirmed stale harness: runtime-ui.browser waits at line 33 for the hidden
`Open game/雪 diagnostic.rpy:2` button inside a closed details row. Local unchanged
script reproduces that same timeout. Locate attached hidden control, assert initially
collapsed, explicitly click the disclosure summary, then require visible control and
unchanged focus/1100px/640px/page-error assertions. First local correction omitted
includeHidden on the role locator and still timed out; retained intermediate failure.
Corrected locator PASS in 0.869s. No product diagnostic layout or Unicode/UTF-8 guard
changed, no navigation assertion/timeout relaxed. This is one harness alignment fix.

Mac packaged cases: compile/lint/route-b/runtime-error/ui-refresh PASS, route-a FAIL
62.743s exit 1, cleanup true. Route-a saved/stale/Running >9.5s/Stop all passed, Stop
reports Cancelled/stopped exit 0; timeout is later close/reopen with Clean Source,
Saved status, no runtime modal/notice. Windows all six cases PASS/cleanup true, both
route measured-font/Save/Stop/reopen cases and full boundary smoke PASS. Mac boundary
smoke/licence inventory skipped, both success-only installer uploads skipped. These
missing gates remain open; Windows hosted results are not Windows-PC verification.

Artifacts 11345087791 (macos-26) / 11345392511 (windows-2025) are retained under
ignored remote-p5-artifacts alongside whole-run logs/API metadata/inventory. Both
input manifests match all 132 candidate/P5 inputs, runtime-input file hashes and
retained payload hashes verified. Mac retained App tar SHA256
8ab413c7a204459938d64e62489fc6969dfa9608d825ce9540c29c38aa4715af;
Windows retained executable 7f2a8eca3be415f176ac6764157e79e50203a3183002864233055486a6d661f5.
These failed-candidate payloads are not passing final installers. No artifact expiry,
cleanup failure, skipped native result or deferred browser error is called success.

P6 cause hypothesis: project.close bypasses RequestLane while the terminal poll's
refreshPersistence project.status (unlike independent runtime.status) checks out the
shared service. dispatch.rs confirms ordinary concurrent requests are rejected before
dispatch with RUNTIME_BUSY; request-lane regression holds saved-state read and rejects
premature close/exactly-once contract on unchanged code. Queueing project.close fixes
that confirmed collision and never replays the write. Runtime Stop/token controls
remain independent. Precise failing native request interleaving was not captured;
this mechanism is consistent with the Mac evidence, not proof of its sole CI cause.
Driver now records close-after-stop-requested/completed and bounded modal/recent/Welcome
state on failure; no retry or longer deadline. Both browser shipped route drivers PASS
with those stages; 87 frontend tests PASS/0 skipped. Product P6 first correction only.

Fresh feature 380813a / main 4d7ba03 / separate planning worktree 2c5a164 preserved.
Local totals before next build 17 builds / 69 native starts / 7 separate SDK starts;
this remote run adds 2 package builds / 14 app starts (Mac six, Windows six plus two
boundary processes), recorded separately rather than inventing historical totals.
Initial final allowance 1/1 used, correction dispatches 1. Next one pinned P6 package,
focused native route-a/route-b close/Save/Stop/reopen proof, then a justified changed-
input correction qualification after Mac PASS. New renderer ordering affects both
platforms; the prior Windows job was failed by its runtime-browser gate, so no unchanged
successful full matrix is duplicated. Full production run still required on corrected
coherent inputs. Preserve failures and manual same-chat wait; no specialist/performance
expansion, ambiguous retry, Windows-PC claim, conflicts/integration/closure/new phase.


**P6 pinned package / focused proof — 2026-10-05:** source
`8ef89a85c3e8233ab5c8b73bfce7e166cdd03275`, one build (18 local total). Retained
corrected installer `.toolchains/review-builds/ui-refresh-8ef89a8/Loomlight_0.1.0_8ef89a8_aarch64.dmg`,
5,752,249 bytes; SHA256 `6cf320e94bded5403172b846152164871fa5dbec12c93d161eae56197a6d9adb`.
Sealed executable `36328bbb46be07b1ad64274048f7a5c223065d9152f9daade1fe5046f6e75de1`,
compiled executable `1c8e6a4df5d9f0e55e2ee4ddde82cd482332860ee12004d72835eb22db2f870c`.
Raw Tauri DMG retained; strict ad-hoc resource signature, ARM64/identifier/version,
mounted payload equality, DMG integrity and privacy scan (9 files) PASS. Installed
app untouched; no Developer ID/notarization claim. Every earlier failed/superseded
package/report is preserved.

132 input manifest versus P5: exactly four changed — request-lane.ts, its test,
runtime-ui.browser.mjs and shipped runtime_ui_probe.js; 128 unchanged. Branches font
measurement/routing, resolution/sidebar/catalogue/import/preview and all backend,
SDK, dependency and workflow inputs unchanged. All 87 frontend tests PASS/0 skipped,
standalone runtime disclosure/focus/resize PASS, both browser shipped routes PASS with
explicit close-after-stop completion/reopen. Native affected route-a/route-b is the
remaining local proof; no broad unchanged local SDK/service matrix is repeated.

Self-review: project.close joins the existing shared-service lane exactly once; no
request/response ambiguity is retried, Stop/cancel/status/diagnostics retain separate
controls and Source transition/refusal guards remain. Unit test holds a real-shaped
checked-out observation, rejects premature close on old code and asserts one successful
close after release on new code; independent Stop regression remains passing. Browser
harness changes only the disclosure action and initial hidden locator; no failure or
budget relaxed. Native driver preserves deadline/no replay and records the exact close
stage plus bounded failure state. UI/TESTING document these contracts. Repository
validation 340 files, formatting and whitespace PASS. P6 is one correction of a newly
confirmed ordinary race; sole attribution of the prior hosted failure remains inferred.


**P6 affected packaged Mac PASS / next correction selected:** source 8ef89a8 exact
retained sealed app runs route-a 88.942s and route-b 111.598s: both PASS, exit 0,
no timeout, cleanup true. Each reports close-after-stop-requested/completed, then new
session/read accepted Source bytes on reopen. Native font/Fit pills, changed/restored
destinations, real route output/assets/state, Save/staleness, Running >9.5s, Stop and
route-b invalid-draft refusal/Cancel all pass. Raw SDK/start/poll/stage times retained;
no physical keyboard/presentation-latency or Windows-PC claim. Original profile remains
restored; bounded probe profiles isolated, no app/game/local runner pending after
reported cleanup and process exit. Local cumulative counters **18 builds / 71 native
starts / 7 separate SDK menu/launcher starts**. Failed remote correction's extra
2 builds/14 starts stay separately recorded. All failed/superseded evidence retained.

Mac changed-scope acceptance PASS. P5 Branches measurement/routing/style proofs and
P4 unaffected picker/sidebar/catalogue/import/Finder/English-input/progress/diagnostic
results are reused by exact unchanged inputs and interaction impact. No blanket future
candidate acceptance. P6 sole attribution of the prior hosted failure remains an
inference pending actual required qualification; passing local correction does not
relabel cab39e1's failed remote run. One next existing production correction dispatch
is justified by changed request-lane/browser/probe inputs after affected native PASS.
Required Repository quality must run the coherent new exact candidate. Before dispatch,
publish/verify existing branch and all 132 app/workflow inputs equal tested/package
8ef89a8, record remaining allowance (initial 1/1 consumed, corrections 1 so far).
Windows prior full job FAILED its browser gate and new shared-service close ordering
affects both hosts; no unchanged successful full matrix is duplicated. Existing
production upload_packages=true remains required. Preserve run/attempt/SHA/evidence
and manual same-chat wait, then terminal audit/fix. Windows transfer follows required
remote PASS; no conflict/integration/closure/new feature or ambiguous retries.


**Confirmed P6 correction qualification wait — 2026-10-05:** awaiting_ci.
Published/verified candidate `5b467a402b14c7b371838645a9daa555ba315349`; all
132 app/workflow inputs equal tested/package source 8ef89a8. Repository quality
[37312556784](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37312556784),
attempt 1, workflow_dispatch, exact 5b467a4: PASS; actual required job/all steps
success, optional profile/diagnostic selectors false/jobs skipped intentionally.
Production [37312593480](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37312593480),
attempt 1, workflow_dispatch, exact 5b467a4, upload_packages=true: confirmed
in_progress / Preflight at one initial identity read, about 12:53 UTC. Stop model
polling now. Initial final allowance 1/1 consumed; changed-input correction dispatches
2. No duplicate/ambiguous request or unchanged successful full matrix repeated.
Old 37300975410/37307663113 failures remain failed with all evidence preserved.

Local totals 18 builds / 71 native starts / 7 separate SDK starts; prior remote
correction added 2 builds/14 app starts, separately audited. New remote package/start
counts await terminal evidence. No local runner/app/game pending after actual native
exits/cleanup; original profile preserved. This documentation wait carrier has no
app/workflow change; verify/publish without another qualification. Tested identity
stays 5b467a4, not the carrier's SHA. No Goal lifecycle or verified live-Goal pause.

SAME-chat continuation: “Resume: audit production 37312593480 attempt 1 on 5b467a4.”
Inspect recorded operation + fresh refs/worktrees/diff once. Pending -> pause, terminal
-> audit all required preflight/platform/SDK/native/cleanup/input/package evidence,
including true deferred browser outcome rather than normalized continue-on-error
conclusion. Preserve/classify failures; only justified changed-input fixes/rechecks
within cumulative WORKFLOW hypothesis budgets remain. Required remote PASS precedes
Windows prompt with exact candidate/retained installer/14-row checklist. Windows-PC
review, conflict resolution/combined-input integration/closure/1H/new features remain
separate later selections. No ambiguous retry, threshold waiver or new orchestration.


### Final Mac terminal qualification and Windows transfer — 2026-10-06

**Selected Mac completion outcome COMPLETE; Windows-PC acceptance remains DEFERRED.**
Qualified candidate **`5b467a402b14c7b371838645a9daa555ba315349`**, application/package
source **`8ef89a85c3e8233ab5c8b73bfce7e166cdd03275`**. All 132 app/workflow hashes in
both hosted input manifests match the local P6 inputs and docs continuation; exact
checkout/tree `cf6361fed36aa088102dcd6edbc4afffa7b0a0a6`, run/attempt, executable,
manifest-file and retained payload hashes verified. Later docs carriers do not replace
this qualified SHA. Current ref inspection preserved feature 525d251, main 4d7ba03,
planning remote 267ec2a and separate planning worktree 2c5a164; PR #17 OPEN/draft/
CONFLICTING. No integration, history rewrite or phase closure.

Repository quality **37312556784 attempt 1 PASS** on exact 5b467a4: all required
Validate repository steps success; optional diagnostics/profile selectors false.
Production [**37312593480 attempt 1 PASS**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37312593480)
on exact 5b467a4, upload_packages=true. Preflight and both required platform jobs
success; actual required steps, case reports and cleanup accepted after terminal audit.

| Required evidence | macOS ARM64 / macos-26 | Windows x64 / windows-2025 |
| --- | --- | --- |
| Routine core selector | 187 passed, 40 existing ignores, 3 filtered | 182 passed, 37 existing ignores, 3 filtered |
| Real-service Branches budgets | PASS, 3 samples | PASS, 3 samples |
| Explicit SDK lifecycle/1D/1E/1F, handoff/reuse, runtime service and diagnostic gates | All execute/PASS, no skip marker | All execute/PASS, no skip marker |
| Desktop Rust boundary | 1 passed | 1 passed |
| Packaged compile/lint/route-a/route-b/runtime-error/ui-refresh | 6/6 PASS, exit 0/no timeout/cleanup true | 6/6 PASS, exit 0/no timeout/cleanup true |
| Route-a / route-b elapsed seconds | 47.067 / 44.719 | 45.797 / 42.734 |
| Deferred Runtime/Branches actual browser outcomes | success/success; functional and diagnostic timing PASS | success/success; functional and diagnostic timing PASS |
| Boundary smoke / privacy / licence inventory / success-only package upload | PASS / PASS / present / present | PASS / PASS / present / present |

Preflight frontend **87 passed / 0 failed or skipped**; source/selection/UI/shipped
compile/lint/routes/error driver browsers, formatting, validator and rejecting Q1
fixtures/selectors pass. Hosted Mac Darwin 25.6.0 ARM64, Windows 2025Server AMD64;
Node v24.19.0, cargo/rustc 1.90.0 both, Python 3.14.7/3.12.10. Inventories retain
97 npm/519 cargo package entries per platform. Pinned Ren’Py 8.5.3 SDK archive cache
restore succeeds both; production installer checks published pinned SHA256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Only the cache-miss download step is conditionally skipped. This is real cached SDK
execution, not a new uncached-progress observation. Earlier genuine Mac normal SDK
download/creation evidence remains separately recorded on unchanged inputs.

Native route reports retain measured-font pill widths (Mac 73px, Windows 70/71px),
Save/earlier-launch state, Running >9.5s, Stop, explicit close completion and disk/new-
session reopen. Route-b refusal/Cancel stays tested. Boundary logs retain primary-
ready/secondary-refusal and all privilege/navigation/lifecycle/Scene/Source/save-trace
assertions. Hosted input is synthetic DOM, not physical keyboard or Windows-PC UX.
No threshold was waived, runtime write replay added or precise P5 race interleaving
retrospectively claimed; P6 proves correction/acceptance, not sole prior causation.

**Retained artifacts:** all four ZIP SHA256 digests match actual downloads and archive
integrity checks; extracted payload/executable hashes match manifests. GitHub expiry
is 2026-10-12; local ignored archives and installers are already retained beyond expiry.

| Artifact ID / name | ZIP SHA256 |
| --- | --- |
| 11347845379 / phase-1-production-package-macos-26 | c3a6fe6325f4b44417a57eb9a583dcabbc97947fd92e20c7c82e96647290f7eb |
| 11346956654 / phase-1-production-package-windows-2025 | 4fdbc7bbff48921800e34d8a9e1c1f0cff2bf2946f82c0f2a4bea8f92eb31314 |
| 11346724976 / phase-1-q1-package-evidence-macos-26 | 3cc95fd0765e4efb26441bb0dafeba68741a6943c2b6192d0400908abc76db89 |
| 11347016700 / phase-1-q1-package-evidence-windows-2025 | 1257308b9925959bb089565e821a62dc84439264e12356eb236c133c69fff44b |

| Retained success-only installer | Bytes | SHA256 |
| --- | --- | --- |
| Windows nsis/Loomlight_0.1.0_x64-setup.exe — selected PC review installer | 3,544,277 | cf2d4a004923863b57f28a481c0703076363faf380368948d3d876ef7505d408 |
| Windows msi/Loomlight_0.1.0_x64_en-US.msi — alternate, uninstalled here | 5,079,040 | 2c8e3d5fdb0f77ff0dc2f0f16265265d573fb1a3b2070c009f653e64909f6007 |
| Hosted Mac dmg/Loomlight_0.1.0_aarch64.dmg — distinct from local sealed review DMG | 5,196,937 | e5b280224a80b5d00bedc7234278a607e78e4f267eedbe8276007f4a67bee954 |

Tested Windows executable SHA256
`e4992dde5dc3a2521de8df075cdbb3843a54414b43fc348560c44f8b1eeb1afc` (PE AMD64 verified);
tested hosted Mac executable `4a9d7f99043171cecf96a143c9e0ecaec4fc007ee3074be5b87bd773fd4dab1e`.
Mac retained App tar `4b4180e03f0c3f5b99d4eab048b3b7a36dacdc79460dc16acc405d05307875bd`.
Windows installer execution and installed-executable equality remain Windows-PC work.

Ignored evidence base `.toolchains/reports/final-1g-mac/`: remote-production-p6-resume.json,
-artifacts.json, -terminal-logs.zip and extracted remote-p6-terminal-logs;
remote-p6-artifacts, four *-p6.zip archives and remote-p6-audit-summary.json. Earlier
cached CLI partial log is preserved; the terminal run/attempt archive was retrieved
and audited rather than trusting that truncated view. Uploaded evidence lacks individual
.log files, but terminal logs retain actual gate output and required JSON/smoke/manifest/
screenshot/inventory evidence is present. No required gate is missing. Failed initial
37300975410 and P5 37307663113 remain FAILED with their unique evidence intact.

Counters: **18 local builds / 71 native starts / 7 separate SDK starts** unchanged;
remote P5 **2 builds / 14 starts**, current P6 **2 builds / 16 starts** separately
verified (12 case processes + 4 boundary processes). Initial final allowance **1/1**
consumed, justified changed-input correction dispatches **2**. No duplicate unchanged
full matrix, ambiguous retry, automation or new operation. No app/game/local runner
pending; original user profile restored.

CONFIG-01 (dimensions/reduced ratio/caption/truthful invalid Custom/bounded portrait),
f287a7e sidebar spacing and selected Mac correction/review are complete. P4 unaffected
English-input/Finder/catalogue/import/picker/progress/diagnostic evidence and P5 routing
proofs are reused by mapped unchanged inputs; P6 changed close/Save/Stop/reopen paths
have fresh local and both-platform hosted proof. User Finder observation is separate
from agent-driven native OS input/visual and synthetic service results; non-English
IME is outside selected English app support, with Unicode source protections retained.

Continuation: use the [Windows-agent prompt](../../status/HANDOVER.md#windows-agent-prompt--exact-passing-candidate)
and all 14 canonical rows on a genuine Windows PC, preserving profiles/fixtures and
recording physical/native/visual limitations. Any correction supersedes affected
candidate acceptance and needs mapped Mac/remote checks. Final conflicts/combined-input
integration belong to another chat after both platforms pass. This docs-only transfer
receives validation/whitespace/input equality checks and publication, not a package
matrix; tested identity stays 5b467a4. No Goal lifecycle or workflow wait remains.

Transfer verification: repository structure/text/privacy/local-link validator **PASS
for 340 files**, whitespace PASS, both hosted manifests still match **132 unchanged
app/workflow inputs**, and the saved Windows prompt is **3,982 characters**. Only
CURRENT/HANDOVER/this task ledger changed; no extra build, native start or remote
dispatch. Publish/verify this coherent documentation transfer on the existing branch.
