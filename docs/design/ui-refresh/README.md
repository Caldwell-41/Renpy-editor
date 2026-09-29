# Accepted UI reference set

Saved 2026-09-29 at the user's request for comparison during implementation.
These are design references, not working-app screenshots or bundled game assets.
The [design decisions and build plan](../../tasks/active/ui-design-review.md) own
behaviour, acceptance criteria and corrections. This index owns image selection only.
Original generated images are preserved; [manifest.json](manifest.json) records their
original filenames and SHA-256 hashes of these unchanged copies.

## Which reference controls what

Written decisions and recorded corrections take precedence over generated details.
Use the layout images for structure, and the two palette images for colour. Earlier
purple treatments are superseded. Follow system is the default theme setting.
The preferred Settings layout applies to Settings, not every page.

| Surface | Reference | Interpretation |
| --- | --- | --- |
| Story, wide | [Wide layout](story-wide-layout.png) | Preview above Beats, inline selected Beat, optional inspector |
| Story, compact | [Compact layout](story-compact-layout.png) | Collapsible navigation/inspector; adapt to available space |
| Settings | [Preferred layout](settings-preferred-layout.png) | Primary Settings structural reference |
| Settings, compact | [Fallback](settings-compact-fallback.png) | Supporting fallback only when width requires it |
| Source | [Layout](source-layout.png) | File navigation/tabs and optional context |
| Branches | [Layout](branches-layout.png) | Graph and optional scene details; no graph editing |
| Characters | [Layout](characters-layout.png) | Cast grid, appearances and optional inspector |
| Assets | [Layout](assets-layout.png) | Grid/filter/details; new audio controls remain disabled |
| Variables | [Layout](variables-layout.png) | Table/inspector and known assignments only |
| Dark theme | [Charcoal and copper](palette-dark-charcoal-copper.png) | Application palette; game preview unaffected |
| Light theme | [Paper and teal](palette-light-paper-teal.png) | Application palette; game preview unaffected |
| Opening screen | [Both themes](welcome-light-dark.png) | Actions and searchable recent projects |
| New project | [Four steps](new-project-four-steps.png) | Latest corrected Back labels |
| Progress | [Download and creation](new-project-progress.png) | Measured download, indeterminate creation stages |

## Corrections to preserve in comparisons

- Preview starts at roughly one-third of central height and preserves the game aspect
  ratio. Generated proportions are approximate. Restore the real saved-state indicator.
- Settings stays at the bottom of navigation. Use one consistent icon family and native
  window chrome; differences between boards are not new branding requirements.
- Preserve existing folder-name editing, custom resolution and Git-init default even
  where mockups omit them or illustrate a different checkbox state.
- Progress figures are illustrative. Use one active busy indicator, real stages and
  stable button/status positions. Open project means enter the workspace.
- Text, counts, sample artwork and story names are illustrative. Use disposable test
  fixtures for screenshots; never add private game content or personal paths to Git.
- Do not reproduce unsupported fields/actions. The plan explicitly bounds metadata,
  variable references, audio, graph editing and project settings.
- Compare hierarchy, spacing, density, alignment, panel behaviour and colour roles.
  Do not demand pixel identity with generated text, sample art or OS font rendering.

## Build-and-compare loop

For each implemented surface, run the actual UI with representative disposable data,
capture wide and compact screenshots, and compare with the selected references above.
Check both themes and normal, empty, busy and error states as appropriate. Fix visual
differences in that checkpoint, alongside functional verification, rather than waiting
until all pages are finished. Record intentional deviations and their reasons in the
existing task ledger. Compare again after shared-token or shell changes affect a page.

Use browser/dev captures for fast iteration and actual packaged native-app captures
for platform-dependent focus, scaling, chrome, input and final verification. Do not
run a full installer matrix for each visual adjustment. Generated-image comparisons
complement functional/native checks; they do not replace them. The build plan owns
target sizes, platform evidence and run limits.
