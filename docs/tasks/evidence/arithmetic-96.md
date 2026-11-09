# Story arithmetic controls #96

## Assignment and control map

Prepared branch `t3/story-arithmetic-controls` began clean at integration commit
`5ecfd6f742e07bffce1bbab806c4ebf56c116f6a`; ancestry verified before edits.
The T3-prepared worktree is recorded in the ignored local receipt
`.toolchains/arithmetic-96/identity.txt` (absolute machine paths stay out of Git).

Target: Story Combined v1, `story-revamp` / `combined` / `combined-v1`, approved
source `6ecf64704044a6fee9fc4ee6b3a54985d84b9b10`. #88 approves the equation row.
#94's canonical public contract and both-target numeric qualification are prerequisites.

| Visible control or state | Existing public owner and observable result |
| --- | --- |
| Variable, operation picker, formula | Revision-bound `scene.validateAssignment`; types, capabilities, diagnostics and constant-only draft state come from core. |
| Commit/Add Beat | Existing `scene.apply` update/insert body command; smallest accepted source patch and one shared history entry. |
| Formula suggestions | Declared numeric names/types, inserted as source text; no evaluation. Parentheses are typed in the formula. |
| Cancel and keyboard | Existing Story draft owner; suggestion arrows/Enter/Tab/Escape and operation menu keyboard; cancelled work writes nothing. |
| Unknown/protected | Core state/reason; no default-derived current values; existing revision-bound Source navigation. |
| Captions and assignment links | Current accepted payload and variable names, including operation and operand. |
| Undo/Redo, Save, reopen | Existing shared transaction, shell and project lifecycle owners. |
| Writing focus | Existing workspace focus mode; retains the mounted arithmetic draft and selection. |
| Tracks/Reel and branch/view switching | No production views exist. #110 owns integration and its retained-draft behavior; no production acceptance claimed from mocks. |
| Palette and full layout | #110 owns Brass and slate and full layout; #96 scopes control-level fidelity in the existing workspace. |

Tests use the boundaries Kris confirmed in #87: actual authoring controls/public
commands, accepted source, shared history, reopen, and actual frontend-to-core
journeys. No additional test boundary approval is needed.

No SDK invocation, native/package launch, CI dispatch, push or issue mutation is
allocated. #94 SDK evidence can be reused only for unchanged core/runtime inputs.

## Implementation and public contract

Production replaces the literal-only numeric field in `scene-ui.ts` with
`story-arithmetic-editor.ts`. The same editor serves existing beats and explicit
body insertion. It presents seven approved operation labels/symbols, numeric name
suggestions, grouped source text, core diagnostics and typed feedback. Boolean and
string targets retain literal controls. The renderer contains no arithmetic parser,
evaluator, default-derived state or alternate transaction owner.

`main.ts` calls `scene.validateAssignment` with the same command and captured
project/map/authoring/source revisions used by `scene.apply`. Existing edits use
`updateBodyBeat` with `expectedBody`; insertion uses `insertBodyBeat` with explicit
body and position. Core success is read from `value`. Formula operands stay text;
i64 results remain strings and decimal results remain finite numbers. Capability
responses supply supported operation keys, operators and limits. An old reply,
detached editor or changed session/revision cannot replace current feedback.
Commit still performs fresh core admission. A validation response grants no write.

`assignmentCaption` replaces both Story's `[object Object]` summary and the same
literal-only assumption in Variables' "Assigned in" links. These links continue
to use the current scene revision. Protected imported source exposes core's reason
and the existing revision-bound Source navigation. Cmd/Ctrl+Enter commits; menu
and suggestion Escape retain the draft. Cancel returns focus to the beat. Variable
switches retain each target's operation/text within the current editor.

Owned files: `app/src/scene-ui.ts`, `app/src/story-arithmetic-editor.ts`, Story-only
wiring/captions in `app/src/main.ts`, scoped rules in `app/src/styles.css`, the three
`app/tests/story-arithmetic*` consumers, `tests/fixtures/arithmetic-96/story.rpy`,
this note and `docs/UI.md`. The sole core edit adds `scene.validateAssignment` to
the existing Help controller driver's allowlist. No arithmetic/core semantics,
Screens controllers/contracts or shared registries were changed here.

Coordinator checkpoints `e0a9fe3b` and `53cb37fa` were merged normally as
fast-forwards. They own the protocol registry correction and CI's exact approved
reference fetch. Existing fixture discovery already selects both new consumers.

## Red/green and retained failures

- The first DOM slice failed because imported arithmetic had no Formula field.
  The equation editor made that slice pass. A separate Cmd/Ctrl+Enter slice failed
  with no command, then passed through the existing Story save handler.
- Real-core journey attempts 01/02 exposed fixture mistakes: the helper already
  declares `flag`, and a comment is the first beat. Attempt 03 correctly showed
  integer-target incompatibility for ordinary division before zero division.
  The zero-divisor witness now uses integer floor division. These were harness
  corrections; backend admission stayed unchanged.
- Attempts 04/05 ended with exit 137 while an assertion compared whole DOM nodes.
  Their raw logs remain. Replacing that assertion with a boolean identity assertion
  exposed the actual lost-focus failure in 06. The large assertion rendering is
  the suspected cause of those exits, not a diagnosed product memory defect.
- The actual suggestion failure identified a product defect: a composite equation
  inside a label activated an unrelated operation button. A grouped container,
  matching the approved mock, fixes it. Journey 07 passed; 08 adds all seven menu
  operations, literal compatibility and nested insertion/history/reopen and passes.
- Browser 01 failed syntax preflight before launching. Browser 02 exposed Escape
  on the menu summary; 03 reached a wrong reference-scene selector. Browser 04–06
  exposed an incorrect harness assumption about nominal 34px CSS height. The
  approved reference actually renders at 40px because of its shared input minimum;
  comparison now uses that measured reference. Browser 07 exposed focus loss when
  feedback arrived. Avoiding unnecessary option replacement did not resolve 08's
  separate delayed-toggle focus reset. The toggle now preserves an already focused
  option. Browser 09 passes both sizes and keyboard checks.

All attempts remain under ignored `.toolchains/arithmetic-96/`, with separate logs,
raw successful/refused responses, failed DOM snapshots where available, captures
and cleanup records. No previous fixture, approval record or capture was altered.
The first npm install could not reach the registry; checks use copied installed
lockfile dependencies with pinned Node 24.19.0/npm 11.9.0, without dependency edits.
Rust compilation uses installed Rust 1.90.0 and this worktree's isolated target.

## Evidence and acceptance limits

The actual `startApplication` and mounted Story controls send typed requests to the
existing Help driver and production `ApplicationHost`. Happy DOM supplies events;
it is not a native WebView or physical-input proof. The journey checks imported
compound/explicit formulas, byte-identical open/no-op, exact large-integer formula
source/result, decimal source/result, one-step shared Undo/Redo, all seven operation
keys/results, bool/string no-ops, protected-source navigation, suggestion focus,
Writing focus, refused zero/type/dirty-source/stale/session drafts and project
close/reopen. Nested insertion also proves the captured branch/position, exact
source history and reopened identity. Source preparation and competing edits use
real public Source commands. The stale-session witness sends an obsolete session
to core; it supplies no fabricated response. `journey-08/result.json` retains 122
requests and nine stages with successful normal driver cleanup.

Browser 09 uses real production main/Story/core and read-only approved reference
files. It reads pinned shared styles with `git show`, verifies unchanged Story lab,
page and icon inputs, then mounts the unchanged reference in a separate page.
No extra checkout is created. This is a scoped reference comparison, not a claim
that the changing worktree has the complete approved frontend fingerprint. Captures
at 1600×1000 and 720×850 include full views and control crops, SHA-256 records,
geometry and keyboard results. Both formula fields render at 40px with the same
13.5px monospace font. Production has no horizontal page overflow at either size.
Owned browser, server and driver cleanup passed.

Visual fidelity is partial at the control level. Equation ordering, formula font,
height, operation examples and suggestion/menu keyboard behavior match. The existing
production panel spans the writing workspace, so its wide formula is 1410.6px versus
228.9px in the mock sidebar; compact widths are 554.6px and 521.6px. Native variable
selection, breadcrumb, Commit/Cancel placement and existing copper palette remain.
Full Brass/slate, Tracks/Reel, branch-path/view transitions and their retained-draft
acceptance belong to #110. No production proof for those views is claimed.

Core draft inspection folds constants only. Production says "Draft result" or
"Current value unknown" instead of the mock's illustrative before/after route
values. Accepted state still comes from `scene.list` and the existing preview.
This follows #94 and avoids invented route values. Inline new-variable creation
is outside this declared-variable slice; #97 owns shared decimal setup.

No SDK, native editor/package, manual CI, push, PR or issue-state operation ran.
SDK consumption by this assignment is zero. #94's Mac `d1c201f1` and Windows
`cae4dfc0` numeric/runtime proof is reused only for unchanged core/parser/serializer
and #94 fixture inputs. These new UI journeys prove their emitted accepted source;
no fresh SDK execution of the #96 disposable fixture is claimed. Native and final
assembled human acceptance remain unrun under this assignment.

## Qualified local candidate

Implementation commit `3cb6e8f7354c3e05c1d77526c3babae857af632f` is based on
coordinator `53cb37fab9c07f42b28afed4dbca68f1f1b54a80`. The working tree was clean
before the frozen-candidate journey. `.toolchains/arithmetic-96/qualified-inputs.json`
records the actual worktree, branch, 252 frontend/core/reference/fixture input
hashes and the retained driver binary identity. No production input changed after
this candidate. Browser 09's production/reference inputs match it; the later
changes before freezing were evidence/UI documentation and removal of diagnostic
logging from the core journey consumer.

Focused qualification on these inputs passes:

| Check | Result and scope |
| --- | --- |
| Pinned production typecheck and test compilation | Passed. |
| Selected Story component/controller suites | 68 passed, zero failures/skips. Includes the focused arithmetic DOM slice; repeats are not additional cases. |
| Production frontend build | Passed; existing large-chunk advisory remains. |
| Actual production main/Story/core journey | `qualified-journey/result.json` passes all nine stages, with exact accepted source, real refusals, shared history and project reopen; normal driver exit and scratch removal pass. |
| Focused Chrome/reference comparison | Browser 09 passes both sizes, suggestions, operation keyboard/focus, backend-completion focus, diagnostic state, Writing focus and Cancel. Captures inspected; visual differences remain as listed above. |
| Portable core compilation | Rust 1.90.0 Help example build with `--locked --offline` passed. Only the allowlist changes; no SDK invocation. |
| Rust formatting | `cargo fmt --all --check` passed. |
| Repository and whitespace | Validator passed for 1,862 files; whitespace passed. |
| Reused numeric/runtime inputs | Core sources, Cargo inputs and #94 fixtures equal qualified `d1c201f1`; approved lab/captures and earlier fixtures equal the prepared base. No fresh engine/native qualification claimed. |

Self-review traced both existing and inserted beats through the existing save owner,
checked captured revisions/body/position, stale completion guards and literal
compatibility, and removed the old numeric-only editor/check. No parallel evaluator
or transaction path remains. Final assembled review/acceptance belongs to the
coordinator. This return is local-only; no publication or ticket closure occurred.
