# Studio assistance refinement — approval concepts

Generated 2026-10-13 using the built-in imagegen skill, two calls, public fixture
content only. These are **proposed**, not implemented, verified or accepted screens.
The selected refinement in the [owning task](../../../tasks/evidence/phase-2-execution.md#studio-ui-refinement-selection-and-finite-allowance--2026-10-13)
owns scope, allowance and approval. Current written contracts and accepted
[UI guidelines](../../../UI.md#accepted-uiux-guidelines-for-implementation-agents)
take precedence over generated details and Section 18's older proposal.

| Board | Direction | Exact generation prompt |
| --- | --- | --- |
| [Settings, Assist and review](workflow-proposed-v1.png) | Group connection/key/defaults; show one next action; keep exact send inspectable; lead review with readable saved/proposed text. | [Prompt](workflow-proposed-v1.txt) |
| [Cards, Lorebook and compact review](references-compact-proposed-v1.png) | Preserve direct manual editing; move generated approval comparison before disabled fields; label selection/status; stack compact review in charcoal/copper. | [Prompt](references-compact-proposed-v1.txt) |

[Manifest](manifest.json) records actual image sizes and SHA-256 digests. Requested
2400×1600 framing was returned as 1536×1024; pictured type and geometry are schematic.
The first call used inspected existing Settings/Assist/review fixture screenshots as
identity references; the second used explicit accepted palette/contract instructions.
Neither call used private game content or credentials.

## Written implementation corrections

- Keep existing application navigation. The second board's Scenes/Project/Settings
  rail entries are generated illustration, not selected shell changes.
- The compact Review screen must highlight **Review**, not its pictured Prepare step.
  Actual state controls actions; no decorative progress or unearned readiness.
- Keep fixture meaning consistent: the first board accidentally says train in one
  comparison and tram in the other. Implementation evidence uses tram in both.
- A new Manage key disclosure only groups existing native Replace/Remove actions.
  Saved configured keys are reused; no key read/export, renderer entry or storage change.
- Only selectable Edit Scene operations have checkboxes. A single rewrite remains
  one whole change; no arbitrary patch selection or new editing authority.
- Keep exact effective prompt/body, destination/model/locality, reference revisions,
  exclusions and estimated total/budget available before explicit Generate. Disclosure
  does not remove required information or invalidate exact-send inspection.
- Stacked saved/proposed comparisons use readable full-width prose when narrow. Tiny
  storyboard columns do not set real control/font sizes. Proposed library revisions
  remain frozen; displayed Category/Tags are passive summaries, not editable fields.
- Approve/Reject remain separate from Save proposed and per-send inclusion. Stale
  support explains refusal beside approval, retains approved/proposed material and
  writes nothing. A preview is not a game validation pass.
- Preserve current Source/history/transaction ownership. Apply-and-save wording
  describes the existing one-change commit; there is no new persistence path.
- Manual cards/lore retain Save/Discard without an Edit unlock or approval toolbar.
  Prompt edit/restore remains project-local with preview, draft protection and Undo.

## Baseline and research

Ignored `.toolchains/phase2-ui-refinement/` holds the read-only public-fixture browser
harness and 24 partial baseline captures: Settings, Assist preparation, complete-send
and proposal review, light/dark at 1440×900 and 600×720, plus 600×720 large-interface
variants. These are renderer screenshots, not native acceptance. The harness permits
only fixture adapters and no actual provider network or persistence. It never loads
the ordinary configured profile/key.

Observed screenshots: at 1440×900 the Settings key/setup/save actions are below the
initial viewport; at 600×720 Assist task/profile/limits fill the viewport before
references/actions. Proposal review keeps seven actions above the comparison, with
two primary-styled actions. These establish density/access problems, not measured
page-wide horizontal overflow. Library selection already has a highlight; preserve it.

Three baseline attempts were consumed: sandbox localhost EPERM (environment), a
nonexistent controller preview method (harness), then a hidden compact list click
timeout (harness). Last attempt captured 24 screens before the reference stage; no
complete metrics/QA result or card/lore baseline capture exists. The harness has been
corrected to use its already-selected record, reset initial viewport and avoid that
click; the correction is unexecuted. No failed attempt is called a pass.

One user-requested GPT-6.1 Sol/high agent researched the source and primary guidance,
including [Microsoft forms](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/forms),
[Apple disclosures](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls),
[WAI reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
[WAI tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
[WAI validation](https://www.w3.org/WAI/tutorials/forms/validation/),
[focus visibility](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html),
and [HAX correction](https://www.microsoft.com/en-us/haxtoolkit/guideline/support-efficient-correction/).
Source findings include missing Studio draft guards on profile/category/close,
incomplete tab keyboard semantics, no deliberate Assist focus return, incidental
Task sizing, uneven field validation and JSON-heavy reference approval. Implementation
must reproduce and address supported issues; source findings are not native proof.

The same Sol/high agent independently inspected both boards and accepted the design
direction for presentation **with the written corrections above**. No visual scope
blocker remains under those corrections; this review is not implementation proof.

The user approved both boards and written corrections on2026-10-13. The refinement
is **review_ready** at462cf08. [CI1run38324391511](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38324391511),
attempt1, passed on Windowsx64/macOSARM64 and was independently audited:32DOM cases
and36renderer captures per host, no failures/skips/runtime errors/page overflow,
controlled controller/native-service five-action/selectable/history/reopen/cleanup
proof. Both ZIP digests and43-file manifests match; final focus regressions pass.
Core/source/history/key storage and frozen929 technical evidence remain intact.

| Public renderer comparison | Before | Delivered candidate |
| --- | --- | --- |
| Proposed card review at1440×900, same owner browser | 2540px view; long frozen form and JSON precede the decision | 684px view; readable saved/proposed prose leads the decision |
| Proposed lore review at1440×900 | 2071px view | 684px view |
| Settings Save at initial wide/compact view | Below initial viewport | Visible, with draft state |
| Assist toolbar | Seven actions; two primary styles | One primary per actionable stage, reachable in wide/compact/scaled captures |
| Horizontal viewport overflow | None measured | None on both CI hosts |

Complete baseline/after and exact CI screenshots/metrics remain in ignored
`.toolchains/phase2-ui-refinement/`; the owning task records exact digests and audit
limits. Local rapid-resize image limitations remain historical; settled CI screenshots
establish the delivered inputs.12owner and six independent representative actual
captures were inspected across hosts/themes/layouts/surfaces. Fixture navigation is
schematic; compact reference approval is reached by scrolling its comparison.

No new editor package/Tauri WebView physical interaction/screen-reader/native UI proof,
model discovery, paid/live send, merge, release or human acceptance is claimed.
The [guided feedback prompt](../../../tasks/evidence/phase-2-execution.md#prepared-guided-feedback-session--not-started)
is prepared as a separate session and has not started.
