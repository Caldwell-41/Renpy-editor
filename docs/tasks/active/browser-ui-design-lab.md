# Browser UI design lab

State: full-app prototype comparison `review_ready`, 2026-10-21. Branch publication
authorised on `codex/phase3a-story-logic`. Twelve app pages have two layouts
each, including the final Characters Writing/Game setup refinement. All remain drafts.

The user's 2026-10-21 instruction authorises committing all local changes and
pushing this branch. This supersedes the browser-only publication restriction
below without approving layouts or authorising app integration. Publication checks
reuse the retained 448-case/19-group browser report and include repository validation
and staged whitespace checks. Generated reports, captures and toolchains stay ignored.

## Full-app comparison and Characters refinement, 2026-10-20

Selected outcome: extend the same Design Lab approach to every remaining app page,
with one subagent per page and a final subagent for Characters. Give every agent the
user's experience principles verbatim. Two distinct layouts per page share fictional
content and capabilities. The inventory is Story (including rewrite), Source, Branches,
Lorebook, Assets, Variables, Home, New project, Settings (including provider/project
settings), Runtime & diagnostics and Studio request. The final Characters agent owns
Writing refinement and a Game setup prototype. All versions remain unapproved drafts;
preserve previous references and capabilities while making less-used controls secondary.

Chosen development/evidence host: this local Mac with the pinned repo toolchain.
Use the existing checkout and lab; start a loopback server if the earlier one has ended.
Each page has one preparation/verification cycle and up to two focused repair cycles.
Integration has one full local verification cycle and up to two focused repair cycles.
Track failures by cause, reuse valid proof, and reassess two unsuccessful corrections
of the same cause. These are new finite allowances for this broader outcome; old
Characters/native/CI allowances remain closed. Root owns registration, shared browser
helpers, combined checks and status records. Page agents own separate screen/design
directories and checks, so work can proceed without overlapping edits.

Keep real project operations, native windows, packages, model calls, CI, commits and
pushes outside this browser-only work. Preserve the three unrelated user edits and
all existing uncommitted lab/workflow changes. Local save, import, run, provider and
credential interactions are fictional simulations. Recheck approval/source isolation
and production build exclusion before review. Page cycles and review fixes are recorded
below and in each page's notes. The combined integration allowance is complete.

Shared preparation adds a themed sample frame, a layout gallery and a page-specific
browser runner with isolated reports/captures. Its initial starter check failed because
an empty Vite-client stub removed required exports. Blocking only the disposable test
page's WebSocket keeps normal module exports and prevents concurrent-edit reloads.
The corrected starter check passes 16 cases and interactions. The final combined check
continues to use real HMR and verify the lab's shared boundaries.

One agent owned each page. Characters was assigned last, as requested. Every agent
received the user's principles verbatim; [the comparison notes](../../design/design-lab-app/README.md)
retain that text and link each page's capability map, layout tradeoffs, limits and
failure history. Shared work stayed with the root owner.

| Page | Agent | Cases in final combined run |
| --- | --- | --- |
| Story | `story_page` | 32 |
| Source | `source_page` | 40 |
| Branches | `branches_page` | 32 |
| Lorebook | `lorebook_page` | 32 |
| Assets | `assets_page` | 32 |
| Variables | `variables_page` | 32 |
| Home | `home_page` | 40 |
| New project | `new_project_page` | 40 |
| Settings | `settings_page` | 32 |
| Runtime & diagnostics | `runtime_page` | 32 |
| Studio request | `studio_request_page` | 32 |
| Characters | `characters_final` | 56 |

The starter retains 16 cases. Each page used its initial and two focused repair
cycles. Page notes distinguish product defects, check mistakes and Chromium's
sandbox-only Mach-port refusal. Lorebook's final focus source correction, Story's
control ordering, Home's compact chooser, Settings' feedback/palette/sticky actions,
Studio's reload-close guard and Characters' persistent Game actions/feedback were
handed to root verification without reopening their page allowances. Root also
corrected the fictional Settings SDK pin to 8.5.3. Characters now opens at prose,
keeps metadata secondary and supports linked dialogue/appearance drafts plus explicit
planning create/link source review. Its two Game states bring it to seven states.

The common frame links all project pages, Studio request, Runtime and Home, keeps
Settings at the navigation bottom, warns before resetting a dirty sample and marks
disabled primary actions consistently. The gallery lists 12 page comparisons plus
the preserved starter. It supports page search, theme and preview-size selection.
The combined runner scopes default selections to each page's registered definition;
page-owned journeys can use the same interface as the isolated runner.

Integration used one initial cycle and one focused repair cycle. The initial browser
run passed 208 rendering cases and five completed page groups, then timed out during
Lorebook's parallel save-refusal check. The final Characters README write at local
00:15:42 coincided with that interruption; the lab watches design notes and reloads
previews on their changes. The timeout report ended at 00:15:51. All agents then
finished writing, and the same code passed the full rerun. This is classified as a
live-reload check interruption, with no Lorebook source correction. The failed report
is retained as `.toolchains/design-lab/report-full-app-initial-failed.json`.

Final `npm run design:check` passes TypeScript, approval/source validation, all 448
rendering cases and 19 check groups on Node 24.19.0, npm 11.9.0 and Chromium
155.0.8059.85. The matrix covers 25 layouts, including the starter, all registered
sample states, light/dark and 1100×720 / 560×640. Thirteen page interaction groups
pass. Shared proof covers cancelled/confirmed dirty navigation, theme retention,
Home/Settings/Runtime/Studio links, gallery search/links/compact layout, approval
history/scope/changed-source HMR refusal, reset and invalid selections, memory-only
preferences, native refusal, read-only serving, network CSP and production-build
exclusion. The build was inspected in memory without writing dist.

Owners inspected their page captures in both themes/sizes and relevant long/error/
progress states. Parent review inspected the layout pairs and refreshed Characters
Game linked/planning/source-review/error, Settings validation/connection failure,
Home chooser and Runtime cleanup captures. Final actions and feedback remain visible.
The final report is `.toolchains/design-lab/report.json`. Root captures are beside it;
page-specific journeys retain additional captures under `pages/<screen>/`. The previous
56-case Characters report/captures were preserved under
`.toolchains/design-lab/history/characters-writing-2026-10-19/` before replacement.
These are ignored review artifacts, not approval captures.

Repository validation passes for 767 files. Tracked and new lab/design whitespace
checks pass, and the three unrelated user-edit SHA256 digests match entry. CURRENT
is 400 words and HANDOVER 945, within their review targets. Source review finds no
new native, HTTP, file-picker or persistent-storage call in the page implementations.

No further repair or operation is selected. All 24 app layouts and the starter remain
unapproved; earlier approved references are intact. No CI, package, native app action,
real project/model/SDK operation, commit or push occurred. Next is user comparison
and layout selection through the gallery. Promotion and product integration remain
separate under ADR 0017 and INTEGRATION.

## Two Characters Writing drafts, 2026-10-19

Selected outcome: two working layouts in the existing lab, with identical fictional
content and simulated capabilities. The continuous dossier uses a character rail and
section index. The writing board uses a horizontal character shelf and grouped cards
in two columns. These experiments may change the earlier focused editor's layout;
they do not replace its approval. Both new approval records remain drafts.

Development and evidence host: this local Mac, using the pinned repo Node/npm tools
and browser checks. Reuse the existing server on port 5174. Allow one initial local
verification cycle and up to two focused repair cycles, including preparation, review
and in-scope fixes. Reassess after two unsuccessful corrections of the same cause.
CI is deferred for this browser-only step. No commit, push, native app interaction,
package, real project operation or model request is authorised.

Capability map from the existing renderer and walkthrough: character search/selection,
new and game-only characters, retained drafts and field selection/scroll, list/global
collapse, Writing/Game setup navigation, name/aliases/tags, description/appearance/
background, personality/motivations, voice/examples, compact relationship entries,
starting-only knowledge with persistent help, shared Save/Discard, validation/error,
history preview/guarded restore, Undo/Redo and reload with draft retention. Game setup
is navigation context only; its real source operations remain outside this prototype.
Hidden legacy links/scope/provenance stay outside the simplified writing UI.

Entry inspection preserved the existing uncommitted lab setup and all three unrelated
user edits. The protected native window and retained draft remain untouched. Verification
usage is one initial cycle and 0/2 repair cycles. Typing and approval/source checks
pass. The sandbox's loopback `EPERM` required the authorised local run with loopback
access. Its first browser run reached the relationship check and found two entries
briefly open before asynchronous toggle handling. A native named details group now
enforces one-open behaviour synchronously. Repair cycle 1 verified that correction,
then exposed a check error: it clicked an already-open retained relationship after
Save and closed it before looking for Remove. The check now opens the row only when
needed. Visual review also compacted the board's header to show more writing. Review
fixed remembered section-heading focus and cleared search when creating a character.
Usage is one initial cycle and 1/2 repair cycles; repair cycle 2 is next.
Repair cycle 2 passed all 56 rendered cases and both screens' interaction groups.
The remaining shared approval test then failed at a test-only bare virtual-module
import introduced to preserve the new screen's records in its synthetic metadata.
It now reads records through the existing registry module. Source review also moved
the field-help snapshot inside the lab so the approval fingerprint covers every
runtime fixture input. The final cycle includes this shared-check correction; no
product failure remains from its completed interaction checks.

Final `npm run design:check` passes typing, approval/source validation, all 56 rendered
cases and six check groups on Node 24.19.0, npm 11.9.0 and Chromium 155.0.8059.84.
The new screen accounts for 40 cases: two layouts, five states, two themes and two
sizes. The starter retains its 16 cases. The earlier progress message's total of 96
was a counting error; the report's 56 is authoritative. The shared synthetic approval
test now preserves all other screens' real draft records while injecting its starter
fixture. Native/network refusal and production build exclusion still pass.

The same interaction journey passes for both variants: selection, separate retained
drafts, caret/scroll, project/list collapse focus, Writing/Game setup, save progress,
confirmed discard/cancel, Undo/Redo, guarded history restore/undo, relationship add/edit/
remove and legacy target retention, starting knowledge, validation focus, persistent
help, planning/game-only/new characters, search, retained save refusal, compact long
prose with visible Save, empty content and proposal approval/rejection. This is sample
proof only. Source review kept all runtime fixture inputs under the lab fingerprint.

Visual inspection covered both layouts in light/dark at 1100 × 720 and 560 × 640,
plus compact long prose/starting knowledge and the board's retained save-error state.
The board's header was reduced after the first captures to show its writing controls.
Temporary images/report remain ignored under `.toolchains/design-lab/`. The
[comparison notes](../../design/design-lab-characters-writing/README.md) own layout
tradeoffs, behaviour changes and simulation limits. Both new revision approvals and
`currentApproved` remain null; the starter and earlier approved references are intact.

Cumulative use: one initial cycle and two focused repair cycles, four browser runs
(three failures, one final pass), plus the sandbox-blocked invocation. The final cycle
included the shared harness correction after product checks passed. The allowance is
complete; no further repair or operation is selected. No CI, package, model, native
window interaction, commit or push occurred. Repository validation passes for 660
files, whitespace checks pass and the three unrelated user-edit digests match entry.
CURRENT/HANDOVER stay within their review targets. Next is user comparison
and direction selection; approval/promotion uses ADR 0017 and INTEGRATION.

## Approval and integration amendment, 2026-10-19

The user approved the planned setup after the interview: one workflow ADR, per-screen
approval history, reproducible source/captures, visible status labels and an integration
procedure that separately establishes close visual matching and real functionality.
Explicit promotion changes the design reference, not task authorisation or app delivery.
Keep earlier approvals and the unapproved starter intact. Missing feature behaviour and
material layout/behaviour conflicts return to the user; routine wiring and minor sizing
adjustments remain within the existing task scope.

Selected outcome: implement this setup locally on the existing Mac host. Add ADR 0017,
the integration guide and root discovery pointer, record validation/source identity,
labels/history and focused positive/rejecting checks. Current app behaviour and old
native/CI budgets remain outside this amendment. Allow an initial local verification
cycle and up to two focused repair cycles, with review/fixes included; reassess repeated
failures under WORKFLOW. No CI, native app launch, package or model operation is selected.

Implemented [ADR 0017](../../adr/0017-design-approval-and-app-integration.md), the
[integration procedure](../../../app/design-lab/INTEGRATION.md), root discovery links,
per-screen records and derived Draft/Approved/Superseded labels. History shows the
successor, date and stated reason. Product progress remains in its owning task.

`npm run design:source` records a candidate commit/fingerprint only when the frontend
inputs match that commit and the draft records are present there. Shared styles,
icons, assets and dependency/configuration inputs are covered. Approved captures have
retained hashes and comparison conditions. A changed approved source is flagged and
its preview refused; the guide uses a separate pinned comparison checkout during app
work. The actual starter record remains null/unapproved. Browser-positive approvals
were injected only into a disposable test browser; no real approval was created.

Final `npm run design:check` passes source typing, record/source checks and all 16
rendered cases plus five browser check groups. Positive/rejecting coverage includes
supersession, missing decisions/behaviour/captures, changed or missing retained images,
shared CSS/icon changes, an uncommitted candidate/draft record, approval scope, labels,
live source/record refresh and refusal of a changed approved preview. A disposable
Git repository supplies real commit/fingerprint proof. The final control capture was
visually inspected. Production build exclusion and existing lab isolation still pass.
Repository validation and whitespace checks pass; the three unrelated user-edit diffs
match their entry digest. No production application source or existing test was changed.

The amendment used the initial local cycle and two repair cycles, with five browser
runs: three passed against successive inputs and two failed during harness review.
The first failing reload test emitted `change` instead of the watcher's `all` event;
correcting that allowed navigation. The next run treated expected `ERR_ABORTED` iframe
document cancellation during parent reload as a broken asset. The narrow cancellation
exception preserves failed script/style and HTTP-error checks, while readiness checks
still require the replacement document. Both corrections pass. A later capture showed
an apparent repeated header; DOM assertions confirmed one header/stage and two animation
frames produced the correct capture. This was capture timing, not a product defect.

This setup is complete locally and uncommitted. CI, packages, native launches, real
project/provider operations and app integration were not selected. Original module
proof below remains historical; no closed allowance was renewed. The next increment
remains the two Characters Writing proposals, with no automatic starter promotion.

## Selected outcome

Create a runnable repo-owned browser playground that future agents use by default
for Loomlight UI mockups. Deliver the reusable setup and a small example first.
The two full Characters Writing layouts follow as a separate increment; product
integration follows the user's chosen direction. Existing unrelated edits remain
in their owning design and Phase 2/3 records.

The user agreed to Loomlight-specific reuse, one default playground and an initial
working example. Earlier decisions retain current fonts/colours/icons, allow
disposable prototype code, preserve existing capabilities, compare two layouts,
use interactive fictional samples and defer CI to app implementation. Prior layouts
can change. Minor spacing/sizing fixes need no new approval; navigation and behaviour
changes return to the user. Finish one integrated screen before expanding the workflow.

## Setup and acceptance

- Development host: current local macOS ARM64 workspace with pinned Node/npm.
  Selected proof is local browser/module verification; no CI/native/package/model
  operation is selected and no previous allowance is renewed.
- Put code in `app/design-lab/`, with its own Vite entry, registry, sample states and
  scoped agent guide. Reuse existing dependencies and production styles/icons.
- Provide a local launch command and a check command. Prove sample editing,
  switching, retained drafts, simulated save refusal and reset, plus themes/sizes,
  native refusal and exclusion from the production build.
- Root instructions point agents to the module when doing browser UI work. Keep
  module rules in its scoped guide and design decisions in their existing owners.
- Local allowance: an initial verification cycle and up to two focused repair cycles.
  Reassess after two unsuccessful repairs of the same cause. No remote checks.

## Initial module verification

Final `npm run design:check` passes with Node 24.19.0, npm 11.9.0 and local
Chromium 155.0.8059.84. It covers 16 rendering cases (four states, two sizes, two
themes) and four check groups: example interactions; native/server/network refusal;
preview controls/reset/invalid selections; production build exclusion. The production
build is inspected in memory and leaves existing `dist` contents intact. Source
typecheck and repository validation also pass. Wide light and compact dark screenshots
were visually inspected. Raw screenshots/report stay ignored under
`.toolchains/design-lab/`.

The initial cycle and two repair cycles include six browser runs, two failing and
four passing against successive inputs. Distinct failures and corrections:

- Initial typecheck widened the theme return type; explicit readonly return typing
  corrected it before browser work.
- The sandbox refused loopback binding with `EPERM`; the authorised local check ran
  outside that restriction. This was an environment limit, not a product result.
- A test imported preferences through a second Vite URL and observed a fresh
  singleton with layout persistence enabled. Canonical source URLs correct this;
  both Windows and POSIX URL forms have regression assertions.
- The iframe inherited border-box sizing, reducing the selected content width by
  two pixels. Content-box sizing now preserves the actual selected viewport.

Review added navigation synchronisation for Reset, failed-asset checks, a network
probe using an ordinary port with intercepted fallback, and an assertion that the
inspected production build contains JavaScript chunks. The final run has zero errors.
CI, Windows runtime, native input, real persistence and model operations were not
selected. Browser sample proof does not qualify them or the pending walkthrough.

## Initial delivery and continuation

The root agent guide and documentation index point to the module. Its README owns
the usage recipe; scoped AGENTS owns rules. Production application sources, old
qualification suites, dependencies and lockfile remain unchanged. The three unrelated
user edits remain intact. No commit or publication is claimed.

Next increment: use this module for the two Characters Writing proposals under the
agreed existing-feature and visual-style constraints. The example has no design
approval. Actual integration follows the selected direction and existing task gates.

Module rules and usage live in [Design Lab](../../../app/design-lab/README.md).
