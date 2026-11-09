# Screens arithmetic and decimal controls #97

## Assignment and operation map

The prepared branch `t3/screens-decimal-arithmetic-controls` was clean at
`9ce14db2f2e44e5ceab408c9b206c259319045ac`. Base ancestry was verified before edits.
Live #97 and parent #87 were read through `gh`. The confirmed test seams are
production controls/public commands, accepted source, shared history and reopen.

The approved reference is `screens-arithmetic` / `equation-v2` (A2), source
`ce6264279188fca4c81218a5cd93b50c393bf9a3`, fingerprint
`e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b`.
The existing reference checkout is clean at `82d30d6e`; its source and captures
remain read-only. Integration's `sourceMatches:false` remains expected.

| Control/state | Real operation and result |
| --- | --- |
| Ordered textbutton/imagebutton equations, target, seven operations, grouping and suggestions | Existing per-button drafts and `screens.compose`; operands remain source text, numeric suggestions use declared variables. |
| Types, capabilities, diagnostics, unknown state | `screens.inspect` and revision-bound `screens.compose` with `validateOnly:true`; use proposed inspection only for feedback. Defaults never supply current route values. |
| Apply | Existing text/control composition owner commits against the original document, authoring and target revisions with fresh core admission. One shared history entry. |
| Context, eight actions, Finish-last, reorder/remove | Existing interaction preparation and core admission. Stable draft row identities and independent button drafts. |
| Protected timing/source | Core protection reason and existing Source navigation. No renderer evaluation or source conversion. |
| Cancel/discard, stale/dirty/session refusal | Existing draft owner; refusal retains input, Cancel restores accepted state. |
| Decimal creation/defaults | `variable.create` / `variable.update`; fixed type, finite numeric decimal transport, lossless i64 strings and unchanged bool/text transport. |
| Numeric conditions | Existing condition editor and revision-bound `scene.apply`; decimal literals remain source strings and numeric comparisons use core. |
| Text insertion at selection | Existing text draft and composition owner inserts the declared token and restores caret. |
| Editor samples/canvas selection | `screens.canvasPlan` through existing preview owner; finite decimal samples, no source/history write or action execution. Bars remain integer-only. |
| Undo/Redo and reopen | Existing shared history and project lifecycle. |

This assignment allocates zero SDK invocations, native editor/package launches or
manual CI dispatches. Development uses the Mac's pinned Node/npm, Rust and Python.
Backend evidence is reusable only for unchanged inputs. Coordinator owns status,
registries/configuration, integration, PR and tickets. The only core exception is
`variable.update` in the existing Help driver allowlist.

## Implementation and ownership exception

Coordinator checkpoint `1e77b68ca11e580921725e15b8d4b5134c73cb70` authorizes
variable creation/default history wiring in `authoring.rs`, existing public-core
tests and the DATA_MODEL paragraph. It was merged normally as a fast-forward;
only coordinator ledger/handover files changed. No history internals were edited.
The complete source/metadata proposal now uses `commit_history`; source-identical
updates return without a transaction. Existing type, revision, dirty-source and
recovery guards remain. This applies to bool/int/decimal/string definitions.

Screens retains `ScreenText` and `ScreenControlEditor` as the per-button draft
owners. The A2 equation presentation uses the existing Story operation definitions
and the approved Screens grouping/menu/suggestion presentation. It introduces no
parser or evaluator. Numeric target switches retain the formula and operation;
non-numeric targets keep literal controls. Action kind changes use Remove/Add.
Stable rows, order, independent drafts, context eligibility, eight actions and
Finish-last remain with the existing interaction owner.

`screens.compose` with `validateOnly:true` validates the captured action list and
returns proposed inspection. Production never adopts its candidate document revision.
Apply still sends its original document, authoring and reviewed-target revisions
through the existing combined composition operation and fresh core admission.
Generation/detachment checks prevent old feedback replacing new input. Numeric
errors mark/reveal the retained field. Protected actions expose core's timing reason
and existing Source review/navigation. New, uncommitted imagebutton additions also have live feedback through the
subsequently authorized complete-creation validation extension below. Existing
text/image buttons retain their actions validation path.

Variables uses the approved selected-inspector default editor and a flat list.
Creation retains the existing dialog/lifecycle owner. Decimal form values become
finite JSON numbers; whole numbers remain exact strings. Invalid raw defaults stay
in the editor, Cancel restores the accepted default, and fixed names/types cannot
change. Numeric conditions preserve imported literal type/text, accept numeric
mixed comparisons and refuse non-finite input. Text insertion and samples extend
the current owners. Bars retain integer-only selection and bounded stepping.

## Verification

Confirmed seams are those in #87. No new test registry, dependency, protocol,
configuration, CI, approval record, Story arithmetic editor or Story layout changed.
Pinned tools were Node 24.19.0/npm 11.9.0, Rust/Cargo 1.90.0 and Python 3.12.
Installed locked dependencies were reached through a temporary owned node_modules
link; the link is removed for the returned clean candidate.

The actual `startApplication` journey sends production controls through the existing
Help driver and `ApplicationHost`. Happy DOM supplies events. Its successful
`journey-18-creation/result.json` under ignored `.toolchains/arithmetic-97/` retains complete
requests/responses, accepted Screens/variable source, driver exit 0 and fixture
cleanup. It proves decimal creation/default Undo/Redo, all seven operation keys,
textbutton/imagebutton ordered arithmetic and Finish, validation without writes,
unknown state without default seeding, type/zero/session/dirty-dependency/stale-source
refusals, protected captured-timing Source navigation, decimal token selection/caret,
finite/invalid inert samples, close/reopen and decimal condition history. It also
interleaves an actual screen-text edit and a default edit, including an intervening
no-op, and verifies their shared Undo/Redo order. This is not native or SDK proof.

The inherited `screen-interactions-core.dispatch.mjs` and
`screen-controls-core.dispatch.mjs` also pass against the real core. They retain
combined text/appearance/layout/action history, large integers, literal bool/string,
independent drafts, stale revisions, image states, refusal/focus/remount, samples,
integer bars and reopen. Superseded numeric-literal assertions now exercise formula
transport and core zero-division refusal. The renderer no longer rejects arithmetic
using the old literal-only integer check.

The public-core history test checks all four declaration types, exact metadata and
source revisions, creation/default Undo/Redo, stale/invalid refusal, no-op history,
a real scene edit interleaved with defaults and session-local reopen. Focused
arithmetic, action and authoring selections pass. SDK gates remain explicitly
ignored, not counted as passes. Final commands/counts and source identity follow
in the candidate receipt below.

## Retained failures and corrections

All evidence is ignored and retained, including failed runs.

- Decimal creation and numeric equation tests first failed because those controls
  were absent. The condition test first lost an imported decimal threshold.
- The actual-main default journey exposed absent shared history. The public-core
  test reproduced it before the authorized owner correction. An earlier test compile
  failure needed the qualified `serde_json::Value` name.
- Harness corrections included catalogue dialog reparenting, Story-only Undo buttons,
  expanding an arithmetic row before testing live feedback, Source review before
  navigation, and refreshing Story after public Source setup. These did not weaken
  admission. Existing literal-only action selectors/assertions were migrated.
- The full renderer run had 384 passes and two failures: the obsolete Finish type
  selector and a Python without tomllib. Corrected focused runs use the pinned Python
  and the required app working directory. A first focused retry used the wrong cwd;
  that failure remains separately recorded.
- The dependency link made Vite's default config bundling try to write outside this
  candidate. `npm run build -- --configLoader runner` uses the same pinned config and
  builds successfully without that write. The existing large-chunk warning remains.
- The first comparison server hit sandbox `listen EPERM`; scoped loopback execution
  resolved it. Incorrect Vite middleware order initially loaded native bootstrap;
  the correction serves the explicit production entry with every bootstrap stylesheet.
  Initial screenshots omitted those styles and followed system light mode. They are
  retained as invalid comparison evidence. Later captures force identical dark mode.
- Managed-browser screenshots timed out twice. Its owned tab was closed. Scoped
  headless Chrome supplies retained captures and closes only its own browser.
  One comparison then selected two operation menus; the selector now names action 1.
  Visual review found and fixed a 76px equation overflow, a missing operation class,
  and the inherited compact Variables inspector's transparent background.

## Approved reference and visual result

The read-only reference checkout reports fingerprint
`e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b` at `82d30d6e`.
Its frontend equals the approved runnable source `ce626427`; all 13 primary and
supplementary manifest capture hashes and dimensions match. The contact sheet and
individual captures were inspected. Source/capture manifests, approval and refinement
records remain unchanged. Integration's source-mismatch warning is preserved.

`browser-shell-06/` retains paired production/reference full screenshots and control
crops at 1100×720 and 560×640, scale 1, dark theme, with page/inspector scroll reset.
It records geometry, fonts, colors and keyboard checks. Equation height is 40px;
wide 13.5px and compact 13px source fonts and field colors match the reference.
Suggestions accept Tab, menu navigation/Enter/Escape retain formula and focus, and
neither page overflows horizontally. Invalid, decimal and unknown states and decimal
default editors have supplementary paired captures. Normal action content matches;
other screenshots retain their actual fixture content and core feedback rather than
fabricating route results to match the mock.

Visual fidelity is scoped, not full-workspace acceptance. Equation ordering, menu,
fields, flat action rows and selected default editing follow A2. Production adds its
honest unknown-state line. The existing app navigation/header, source/appearance tools,
Variables search/assignment links and compact inspector overlay remain. Those differ
from the isolated reference host; field widths follow their real containers. Supplementary `browser-extended/captures-03/` captures also cover actual imagebutton
actions at both sizes, protected source, decimal text/sample controls and the compact
numeric-condition editor. The controls were brought into view before capture; the
initial extended captures with the wrong scroll position are retained separately.
The numeric-condition editor includes the approved decimal-threshold guidance and
uses a decimal input mode. Its surrounding generic Story condition/branch layout
remains the existing production layout. Native WebView and human visual acceptance
are not established by these browser captures. Functional parity and decimal
condition/text/sample authoring are proved separately above.
The full Story #110 layout/palette/Tracks/Reel and #96's existing limits are unchanged.

## Runtime qualification boundary

SDK/native/package/manual-CI use by this assignment is zero. Feature totals remain
Mac 9/20 and Windows 3/20, with zero reservations. No push, PR/ticket mutation or
worktree/evidence cleanup is selected.

The shared parser/type checker/evaluator and Screens runtime adapter are unchanged.
#94/#95's both-target SDK evidence retains its original input/candidate scope.
`authoring.rs` now changes transaction history; it emits the same declarations for
the same inputs. New UI-produced source in the journey includes decimal defaults
`2.5`, `3.75`, `4.5`, ordered `trust += bonus` then `reward = trust * 2` and Finish
for both button kinds, all seven operations on money with `(9.5 + 0.5) / 4`,
`Balance: [money!q]`, and condition `money >= 2.75`. The new imagebutton extension additionally emits
width 280, height 64, x position 23 and `money /= 2.0` with the chosen UI-image
reference; its prepared replacement-image metadata proof is SDK-free. The imported
`SetVariable("trust", trust + 1)` remains protected and unchanged. Exact complete
source and payloads are in the journey receipt. These new disposable UI fixture
inputs have not run in an SDK. The coordinator must select any required further
runtime proof; this handoff does not silently transfer earlier qualification to them.


## New imagebutton validation extension

Coordinator checkpoint `01993e91` authorizes only the `AddImageButton` admission
extension in `screens/composition.rs`, its focused existing tests and current
contract documentation. The normal merge preserves implementation `44ebbefc` and
coordinator history. The core now permits `Actions | AddImageButton` for validateOnly;
all other variants remain refused. Existing complete preparation and the pre-history
return do all the work. Evaluator, runtime generation and transaction/history
internals are unchanged.

The control editor uses one imagebutton command builder for feedback and Apply.
It includes the complete pending appearances/replacement reviews, dimensions, layout,
actions, original source/authoring revisions and target reviews. Validation creates
no placeholder. Proposed selection IDs only locate the proposed assignment feedback;
Apply sends the original parent/reviews and creates a fresh accepted ID once.

The new public-core test first failed with INVALID_PAYLOAD, then passed after the
narrow admission extension. It starts with session history empty and prepares a
real replacement-image authoring-metadata companion. Valid constant-decimal feedback,
invalid arithmetic, absent image review, unsupported command, stale source/authoring
and dirty declaration cases preserve authoritative source, authoring metadata,
source-map bytes and empty history. Apply accepts source plus the prepared metadata;
one Undo restores both exactly and leaves no earlier validation entry. Redo/reopen
preserve the accepted creation and reset session history.

The actual-main journey now creates a new imagebutton through Add element, the real
image library, dimensions, placement and numeric actions. Its complete validation
request includes width 280, x position 23, the chosen asset and original reviews.
Valid/zero-divisor/dirty-dependency feedback retains the draft and writes no source
or authoring metadata. Combined Apply creates a different accepted ID from validation,
then one-step Undo/Redo and reopen retain that creation. Happy DOM's image decode is
a successful external decoder substitute in this journey; core image authority and
media reads remain real. No image-decoding/native/SDK proof is inferred from it.
An initial UI attempt needed the existing ariaLabel-property fallback to locate the
size fields. Its failure is retained. The extension's visual controls reuse the same
A2 presentation; it adds no new layout or design decision.


## Candidate verification receipt

The initial implementation is `44ebbefc5be6dee333575d9d73de34d734624e4e`.
Normal merge `123afa54134c7073612c072b40dbfdbed68f15ec` includes coordinator
`01993e91` and preserves both histories. The following source commit adds the
complete-creation extension; the final receipt identifies its full tested SHA.

Commands ran with the pinned toolchains and this worktree's isolated Cargo target:

| Selection | Result |
| --- | --- |
| `cargo test -p loomlight-core --locked --lib arithmetic` | 29 passed; four explicitly selected SDK gates stayed ignored and unrun. |
| `cargo test -p loomlight-core --locked --lib authoring::tests` | 33 passed. |
| `cargo test -p loomlight-core --locked --lib screens::tests::actions` | 17 passed; one overlapping SDK gate stayed ignored and unrun. |
| `cargo test -p loomlight-core --locked --lib screens::tests::controls` | 19 passed, including new creation-validation/source/metadata/history proof. |
| Existing public-core variable history case | Passed, including stale/invalid refusals and no-op history; already counted in arithmetic. |
| Pinned `npm run build:tests` plus four affected DOM consumers | 30 passed on the completed implementation. |
| Corrected existing Windows-probe renderer consumer | Eight passed with Python 3.12; this is synthetic DOM, not a Windows host result. |
| New actual-main journey plus inherited interaction and control dispatch consumers | All pass against the real Help driver/ApplicationHost. No SDK/helper/native execution. |
| `npm run typecheck`; `npm run build -- --configLoader runner` | Pass. Existing large-chunk warning only. |
| `cargo fmt --check --all`; repository validator; staged whitespace | Pass. |
| Pinned reference fingerprint and 13 capture hashes/dimensions | Match approval; reference checkout remains unchanged. |
| Scoped Chrome comparison | Passed wide/compact geometry and keyboard checks, with separately stated visual limits. |

There are 93 distinct Rust passes across those selections, without counting repeated
cases or ignored SDK gates. The four affected renderer consumers have 30 distinct
passes; the separately corrected Windows-probe consumer has eight. Earlier failed
and partial selections remain in the logs and are not represented as final-head
full-suite passes. No further expensive qualification is inferred from these counts.


The final visual correction scopes A2 Brass/slate tokens to Screens editors with
ordered actions, including their Apply/Cancel controls. It does not alter the Story
palette. Variables keeps its existing opaque compact inspector overlay. Browser
comparison covers the approved named controls; surrounding navigation, appearance
panels, canvas unavailability in this data-only fixture, and the generic Story
condition layout remain explicit context differences. Fictional reference art is
not evidence for production canvas fidelity.
