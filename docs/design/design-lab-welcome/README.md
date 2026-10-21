# Home layout comparison

Two unapproved Home drafts use the same fictional projects and operations. They reuse
the production colours, system font and icons. The existing
[opening-screen reference](../ui-refresh/welcome-light-dark.png) remains intact.

- [Return desk](http://127.0.0.1:5174/?screen=welcome&variant=desk) puts the last available
  project below the start actions and a compact recent-project ledger beside it. The
  recent list is easy to scan, with each project's state beside its identity.
- [Project shelf](http://127.0.0.1:5174/?screen=welcome&variant=shelf) puts the start panel
  and a horizontal last-project card above a grid. Each project has a simple book cover,
  title, folder, availability and last-opened date. The grid gives long titles more
  vertical space and uses more scrolling when many projects exist.

Both layouts keep a last-project shortcut visible before the recent list. Compact
previews stack the start panel and shortcut. Return desk then uses rows; Project shelf
keeps two columns. The content scrolls inside the shared frame, so the project status
and browser-only notice remain visible. No SDK readiness claim appears on Home because
that state belongs to project/runtime setup.

## Controls and preserved behaviour

| Control | Purpose and sample result |
| --- | --- |
| New project / Create your first project | Open the New project mockup. The empty state explains how the recent list fills. |
| Open Loomlight project | Open a labelled fictional chooser. Cancel retains the recent list and reports cancellation. |
| Continue / available project title | Open the matching Last Tram Story mockup. Other project titles open an identity dialog that explains the separate Story fixture before offering it. |
| Find a project | Search titles and folders together. A clear action recovers from no matches and returns focus to search. |
| Availability badge | Show Available, Folder missing or Incompatible version. Unavailable project titles cannot open. |
| Project options | Show the full folder identity and availability reason. Missing projects can open the sample chooser to represent choosing a new location. |
| Remove from recents | Remove only the fictional list entry, with explicit project-not-deleted feedback and Undo. Focus returns to the list heading. |
| Undo removal | Restore the entry to its original list position and focus its options control. Only the most recent removal has Undo. |
| Retry recent projects | Recover from the named recent-list failure without changing project data. New and Open remain usable. |
| Finish sample loading | Resolve a deliberately held loading state for review. A production loader would complete through its real callback. |
| Home / New project / Settings navigation | Give the browser previews the same workspace context. All destinations are mockups. |

The chooser includes both unavailable projects to make open refusal and recovery
reviewable. A missing folder asks for another sample location; an incompatible format
explains the need for a compatible app version. There is no import, game launch,
project deletion, project pinning, cloud account or invented project statistic.

## Simulation boundary

The Last Tram, A Quiet Morning, Summer Letters and After the Tide are fictional.
Their displayed relative folders are sample text. Opening, retrying and removing use
browser memory only. No picker, file, project, clipboard, SDK, provider or model action
runs. Reload, Reset and scenario changes restore fresh data. The Last Tram's Story
preview uses its own fixture; other project titles do not pretend to change that
fixture's identity. Removal has no durable effect and cannot delete a project.

The shared fixture and interaction controller keep behaviour equal across the pair.
Each layout has its own lazy entry and scoped layout rules, so a maintainer can change
the arrangement without duplicating the recent-list logic. Promotion still requires
an explicit user choice under [INTEGRATION](../../../app/design-lab/INTEGRATION.md).

## Verification

Preparation inspected `showWelcome`, `recentRow`, recent opening/removal and the native
picker call in `app/src/main.ts`, plus the existing opening-screen reference. Required
states are populated, empty, long, error and held loading. The page check covers both
layouts, search and focus recovery, disabled unavailable titles and their explanations,
list removal/undo, chooser cancellation/refusal/recovery, identity retention, navigation,
loading/retry and compact long names.

The initial check and both focused cycles pass 40 rendered cases and both interaction
journeys. The final page run uses Node 24.19.0 and Chromium 155.0.8059.85, with no browser
errors or blocked native-operation attempts. TypeScript also passes. The first sandbox
invocation failed before rendering because Chromium could not register its macOS Mach
port. The authorised disposable-browser run with that access passed; no native Loomlight
window was involved.

Visual inspection covered both layouts in light/dark at 1100 × 720 and 560 × 640,
plus empty/error states, compact scrolled recent lists, a long-name options dialog and
the chooser's retained failure. The first refinement shortened the compact resume card,
kept error recovery visible and retained Undo while searching. The second changed the
visible resume label to Continue writing while keeping the project-specific accessible
name. Both refinements passed their page checks.

Final capture review found that compact chooser badges used a separate row and pushed
the action row below the visible dialog. The chooser could scroll, but that placement
made recovery harder to find. Its compact rows now keep the badge beside the identity;
a focused assertion requires the recovery action to fit inside the visible dialog.
Root's combined check on 2026-10-21 confirms this spacing correction and the
visible-action assertion, with all 40 Home cases and both journeys passing.
No extra page-owned cycle was run.

The page runner writes isolated captures and its report under
`.toolchains/design-lab/pages/welcome/`. All approvals remain null. Work is local and
uncommitted. No package, CI or native app check is selected for these browser-only drafts.
