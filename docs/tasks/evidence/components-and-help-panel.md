# Components and Help panel evidence

## Assignment checkpoint, 2026-11-01

Kris authorized implementation of [L08 #41](https://github.com/Caldwell-41/Renpy-editor/issues/41)
and [L09 #44](https://github.com/Caldwell-41/Renpy-editor/issues/44) after reviewing
the coordinator's plan. Those issues own bounded acceptance and execution state;
this file records assignments, integration decisions and candidate-specific results.

The coordinator branch is `codex/components-and-help-panel`, based on
`8a1fc41959d363e600d739868bb0b37e270e9bdd` from
`codex/phase3b-screen-designer`. Both workers integrate here, #41 before #44.
Worker branches and worktrees are allocated by T3 at dispatch and recorded below.
The primary checkout's unrelated audit and protected recovery remain untouched.

The prototype chat is bound to `codex/components-help-panel-prototypes` in the
managed worktree of the same basename, from checkpoint
`b67e1f64a0552410c12a038f4a651a800a87e061`. It owns the combined design alternatives
and approval handback. The workers' dispatch commit is
`9b7748a0eb194f55cf12502953f7b6f764d29738`; its product code matches the module
checkpoint and it additionally records the prototype handoff.

| Assignment | Actual branch | Managed worktree basename | Base |
| --- | --- | --- | --- |
| L08 | `t3/reuse-owned-component` | `t3-0eb6a9be` | `9b7748a0eb194f55cf12502953f7b6f764d29738` |
| L09 | `t3/help-panel-show-hide` | `t3-c53f7b0e` | `9b7748a0eb194f55cf12502953f7b6f764d29738` |

| Owner | Exclusive files and interfaces |
| --- | --- |
| Coordinator | Shared `screens.rs`, `screens/ownership.rs`, `metadata.rs`, `source.rs`, `lib.rs`, `screen-ui.ts`, `screen-composition.ts`, `main.ts`, canvas/helper changes, shared contracts, status and this evidence record. |
| L08 worker | `screens/components.rs`, new `screens/component_*` tests, new `src/screen-components.ts` and its CSS, new `tests/screen-components*` tests. |
| L09 worker | `screens/panels.rs`, new `screens/panel_*` tests, existing `scene.rs` and `scene/` modules, `scene-ui.ts`, new `src/screen-panels.ts` and its CSS, new panel/Story-screen tests. |
| Prototype chat | New `design-lab/screens/components-and-help-panel/`, its new `docs/design/design-lab-components-and-help-panel/` record/captures, and its entries in `design-lab/registry.ts`. |

Runtime preparation extends L08 ownership to new
`app/scripts/qualify-owned-component.py`, its validator test and any new
`tests/fixtures/phase-3b-screens/components/` driver files. L09 owns new
`screens/panel_fixture_tests.rs`, `app/scripts/qualify-help-panel.py`, its validator
test and any new `tests/fixtures/phase-3b-screens/help-panel/` driver files.
L09 temporarily owned only the corresponding module-registration lines in
`screens/tests.rs`; ownership returned with exporter checkpoint `3ad43eef`.
These assignments permit cheap fixture/export and harness checks, with no SDK
installation/execution, native session, package or CI campaign yet.

Assignments apply across branches. Workers request shared-file changes from the
coordinator and consume a reviewed checkpoint before depending on them. Any file
outside an assignment requires an explicit ownership transfer. All owners reuse
existing preparation, transactions, source mapping and history. Separate feature
modules are compiled by the shared Screens owner from the initial checkpoint.

The prototype chat establishes several alternatives and records Kris's exact
approval before production UI work. Workers may continue independent core work.
The ordinary Help starter uses existing authoring capabilities; it does not require
the new component feature. New component parameters, transclusion, Call/Finish,
arbitrary imports and wider canvas/3B acceptance remain outside these assignments.

Agreed tests use public authoring/transaction APIs, actual UI-to-core journeys and
deliberate pinned-SDK component output/normal-play panel behavior. Workers use
focused TDD cycles, regular typechecking and focused tests, and complete their
ordinary suites and review before handoff. The coordinator owns combined verification
and final independent Standards/Spec review against the full recorded base.

Development starts on macOS ARM64. Target qualification is selected from changed
behavior under the host-routing policy. Mutable projects, profiles and build outputs
are isolated per assignment. Native sessions and shared SDK resources are sequenced
by the coordinator. No costly SDK campaign, package, native session or CI matrix has
started; its limit and attempt definition will be recorded in the owning issue
before execution. Historical allowances remain closed.

## Shared identity checkpoint

Owned screens use a typed `kind` of panel or component. Existing owned screens
default to panel on read; no duplicate component-owner registry is added. Typed
component uses record owner, use-node and component IDs. Validation rejects a
non-component target, missing owner metadata or duplicate/colliding use identity.
Story bindings retain stable screen ID and source name, including missing targets,
while validating their shape and applicable Beat kinds. These additive fields
initially used additive schema-6 fields. L09 then demonstrated that recognizing
previous custom-code Show/Hide statements changes mapping meaning on reopen.
The shared contract now uses schema 7, explicitly accepts old schema 6, and reserves
versioned recognition/migration to L09. Ordinary source bytes and existing IDs remain
authoritative; the compatibility case requires its own migration test.

L09 temporarily handed `scene.rs` and `scene/logic.rs` to the coordinator for
struct-literal initializers while continuing only its panel preparation module.
The shared checkpoint returns those files to L09. Existing metadata/inventory,
composition eligibility and literal-text helpers gain only the narrow sibling-module
visibility needed by the two workers.

Both new metadata tests first failed against the existing unchecked-extra behavior,
then passed after typed validation. All five metadata tests pass with zero ignored
cases. Pinned Rust formatting passes. This proves the shared identity contract;
it does not yet prove component or Story operations, UI or runtime behavior.

## Shared target and effects checkpoint

The coordinator reviewed and integrated the Help preparation commits
`a4e1a914057dc41aed389873d32b836664a1beed` and
`4d5f7ebe3eae6bfb4fa59de60721d2205d92ee7a`, followed by the Scene context handoff
`e5c300dbc4b1f4a19bf4c7e59e08f5511e0a99b6`. The shared Source owner now passes the
same owned-screen catalog into all three reconciliation paths. No duplicate mapper
was added. L09 retains Scene ownership for recognition, migration and admission.

`screens.resolveTarget` resolves exact owned ID/name/source markers and returns
captured source/map/inventory/effect revisions. Persisted bindings retain intent;
transient revisions admit writes. The bounded effect reader preserves unknown
custom code/interpolation and records known self-Hide effects with dependency hashes.
Marked component-use verification and shared-component admission are still pending.

Two actual IPC tests pass for identity, stale-source refusal, renamed-source refusal
and unknown dynamic text. Both began with a relevant failing gate. The initial
rename assertion expected an invented error label; it was corrected to the existing
public `INCOMING_REFERENCE` code after observing the established mapping. Five
metadata tests pass after the schema bump. These are portable core results; normal
runtime, UI and native proof remain pending.

## Shared creation and component-use checkpoint

The coordinator integrated the L08 preparation commits
`518f4f51c6a54b0a587c550e2e34192047e8d468` and
`891758f656ff5120a735536e05844520ed4a5dea`. Its one Rust request initializer was
updated for the additive optional Help starter during integration; exclusive L08
file ownership returns to the worker on the next implementation handoff.

One noncommitting owned-screen creation preflight now serves both features. It
retains collision, inventory, capacity, dirty-Source and bytecode policy. One
finalizer accepts the new source/map and validated companion replacements through
the existing shared history transaction. The existing create operation remains the
committing wrapper and accepts an optional typed Help starter.

Marked parameterless `use` leaves resolve only through typed use and component IDs.
Unmarked/parameterized/custom inclusion stays opaque. Changed target tokens retain
their old binding and become unresolved. Shared component composition requires
captured review revisions and clean transitive user Source buffers. Returned
documents resolve component revisions against the same proposed inventory, fixing
an observed pre-commit/disk revision mismatch.

Four actual IPC tests pass, including atomic Help create/one-step Undo/Redo/reopen,
marked-use identity/refusal, effects propagation, shared-review admission and retained
dependent Source drafts. The missing starter field, opaque use, unguarded shared
edit and stale returned revision each produced a failing test before correction.
Help action-span qualification, UI, complete write journeys and SDK proof remain
pending. The prototype chat has draft alternatives; none is approved yet.

## Help control qualification

Exact owned-Panel `modal False`, self-Hide game-menu key, Close action and
`default_focus True` spans are qualified by one source classifier. Ordinary
subtree moves retain their bytes. Duplicate properties and other target names
remain protected and report unknown effects. The effect reader still reads the
captured raw action spans; editor qualification does not erase effect information.
The static canvas planner reuses that qualified document and omits only those
nonvisual properties. A positive plan is not a renderer, SDK or native result.

The actual Help IPC test first refused Close reordering, then passed after
qualification. It verifies exact Undo restoration, retained Hide statements,
duplicate/other-target refusal and static canvas availability. Canvas planning
first refused the key/focus properties, establishing the affected boundary before
correction. Broader component rendering remains unqualified.

L09 continues on its same branch after shared checkpoint `2fea805`; its later
coherent Scene slice `d742ceb` is not yet integrated. L08 resumes after consuming
`ea752f2`. Current gaps are complete affected-use graph admission, known-component
Style indexing, review admission for geometry writers, complete ticket journeys,
approved production UI, runtime/target qualification and final independent review.

## TLS fixture isolation

L09's ordinary release-core run exposed sandbox loopback-listener restrictions.
Before escalation, its discriminating preflight separately reproduced LibreSSL
deriving a CA serial path outside an extensionless certificate's owned fixture
root when a parent directory contains a dot. No product fix or test skip applies.
The fixture now supplies `-CAserial` under its temporary root. The coordinator
ran the actual certificate-generation portion under a dotted temporary path;
serial/certificate creation and root containment pass, and temporary material is
removed. No key contents were printed or retained. H59 indexes this cause.

The worker retains the initial failed run and will rerun the same ordinary suite
with authorized localhost capability only after consuming this correction.
No SDK, package or native campaign starts through that escalation.

The schema-7 Story binding test also demonstrated that a typed Show/Hide kind
without its persisted binding was previously accepted. Validation now requires
the binding while retaining well-formed missing-target intent. Its focused
public metadata test passes after the expected failure.

## Complete inclusion graph and writer admission

One bounded graph owner in `screens/references.rs` accounts for typed use IDs,
source names/markers, unresolved sites, every raw inclusion, executable inventory,
cycles and depth/count limits. Its captured metadata is part of the inventory
revision. Style indexing uses the same graph and expands source-derived parent
screen rows; arbitrary/unmarked/dynamic inclusions remain unavailable. Known Style
declarations and bindings contribute conservative effect dependency revisions.

Composition and all four geometry operations now require the same component-review
capture, complete inclusion graph and clean transitive Source users. The earlier
cleanliness-only admission wrapper is removed. Structural component operations
will consume `require_component_write_review` and `ComponentGraph::would_cycle`
on transfer; their interim traversal must then be removed. The latter query is
unused in the coordinator's preparation-only module until that worker integration;
no dead-code suppression was added.

Four actual shared IPC journeys pass, including incomplete/cyclic use refusal,
known-component Style scope, geometry review admission and exact history, retained
dependent drafts, accepted revision consistency and generic canvas-use refusal.
The new public gates failed before correction. Existing Style coverage passes
27 cases; its one explicitly selected SDK/helper case remains ignored. These
portable checks do not qualify component canvas rendering or normal play.

## Help and Story core integration

The coordinator reviewed and integrated L09's five exclusive commits from
`d742ceb7` through `25eda974`, producing integration candidate `72972807`.
Stable Show/Hide bindings, version-gated migration, captured revision admission,
conservative read-derived effects, exact comment-bearing target edits and validated
no-op history now use the existing Scene transactions. No production UI was added.

L09's ordinary release-core candidate `7aa82d1` passed 531 tests, with zero failures,
54 intentional default SDK/specialist/worker ignores and the three documented
exclusions. The later comment correction passed 17 focused tests and was not part
of that broad candidate. Its earlier sandboxed run remains failed (499 passes,
31 transport setup failures, 54 ignores); its log and list remain in the worker's
ignored `app/target`. These are candidate-specific results, not a combined pass.

The coordinator's first integrated panel selection passed 14 and failed three
starter tests during trusted-root fixture registration. Its worktree-local TMPDIR
contained a lexical `..`; the new fixture had not canonicalized its root. Matching
the existing component fixture fixes setup without changing production admission.
The corrected selection passes all 17 tests, with zero ignored cases.

## Component-use removal correction

The L08 worker found that ordinary composition removal deleted a resolved use's
source but left its typed binding behind. A new public IPC test first demonstrated
that orphaned record after removing a containing group. Composition now prunes only
bindings whose owned use nodes lie inside the verified removed subtree. Source and
map replacements share the same history transaction, and the returned Style index
uses the proposed map revision. The test passes exact one-step Undo/Redo, retention
of a second use and no-op reopen. Deliberate Source deletion still retains unresolved
intent; ordinary authoring removal explicitly removes that intent.

## Draft design revision and type qualification

A one-line type-only correction `282772a` narrows the existing Style mock's label
keys to the actual label object. Application and full Design Lab TypeScript checks
pass. Runtime code and approved historical records are unchanged. The prototype
chat consumed the correction and now reports draft candidate `405400c`, fingerprint
`cbed660d2ca119fb03eeb9451fd9e6038aacedf9487616be818e248976410149`.
Its 84 offline cases include the no-UI-image state: Help creation is blocked with
explicit Assets import guidance, entered name/choice retained, and Blank requires
an explicit selection. Original draft captures remain preserved. Kris has not
selected or approved a design; production UI and runtime proof remain pending.

The coordinator verified the linked Windows environment is reachable and has the
Loomlight project registered. No target checkout was changed or execution assigned.
The planned target qualification remains Windows x64 and macOS ARM64 under the
host-routing policy; linked-host checks do not replace required milestone CI.

## Normal-entry Help fixture export

The coordinator reviewed and integrated L09 checkpoint `3ad43eef` as `3ccc584`.
Its public IPC fixture imports a real typed UI-image, creates Help through the
atomic screen owner, authors two Show Beats, one Hide Beat and narration markers
through accepted Scene operations, and changes the existing entry ending to a Jump.
The original normal-start bootstrap and opaque seed neighbors remain authoritative.
The export preserves exact game bytes separately from project/source-map/authoring
sidecars, with IDs, source ranges, revisions, effects and SHA-256 records. This is
fixture preparation only; no Ren'Py command runs in the exporter.
The exact exporter test passes on the coordinator branch (one passed, zero failed
or ignored, 591 filtered). The test's synthetic output is removed on drop unless
an explicit fresh export directory is selected.

The existing isolated Python runtime reports 3.12.14. Both workers reuse it for
cheap validator checks, with bytecode caches disabled or isolated locally. System
Python 3.9.6 does not replace the documented harness requirement. No installation
was needed. Actual six-case runtime validation remains pending.

## Independent preparation review and corrections

Two fresh, read-only reviewers examined `fb2bed50...a186a7c`. The earlier review of
`4e25f6e` was interrupted when L09 corrected cleanup ordering; it supplied no pass.
The reviewed preparation is integrated through coordinator `e2f081b`.

### Standards

One P2 documented-standard violation: binary retention followed command success and
bundle validation, so an exporter failure could lose its produced executable.
`docs/testing/EVIDENCE.md` requires retention independently of test success. No
additional documented violations or actionable baseline smells were found.

The coordinator now calls the existing binary retainer on raw bounded process output
before command or bundle rejection. Results distinguish compiled, not-compiled,
unavailable and retention-failed states. A public CLI check with an external Cargo
process fixture first failed, then passed for nonzero command exit, invalid bundle,
reported-but-missing binary and no compiled artifact. No fictional binary is executed.

### Spec

One P2 preparation defect: Return input moved the virtual mouse outside after the
recorded Close-focus observation. Pinned Ren'Py input code posts a mouse-motion event
when that position changes, so the old observation did not prove focus at activation.
No other missing preparation requirement or scope creep was found.

The coordinator positions the pointer first, uses the default Down key to establish
keyboard focus, records the engine widget and pointer immediately before Return,
then keeps that position for activation. The validator rejects stale focus or a
changed pointer. Its new public admission test failed before the correction and
passes after it. This remains prepared engine automation, not runtime or OS input
evidence. The corrected checks pass 12 cases with the accepted artifact and nine
under ordinary discovery, with no skips or SDK execution. Final combined independent
review against the original implementation base remains required.

## Component core review and IPC integration

The coordinator reviewed and integrated L08's four exclusive commits from `10e9faf`
through `e5d01ca`, producing `560b3f2`. Its worker's coherent release-core candidate
passed 549 tests, with zero failures, 54 default ignores and the three documented
exclusions. Its cancelled earlier run remains cancelled; no result is transferred
to a different candidate. Full runtime and controller acceptance remain pending.

Two independent, read-only reviews examined `fb2bed50...e5d01ca`. Spec found no
core defects or scope creep. Standards found no hard breaches and one P3 possible
duplication: review and dirty-Source admission separately computed transitive users.
The coordinator moved that calculation into the canonical ComponentGraph owner;
all 21 public component tests pass after the change, with zero ignored cases.

Typed lifecycle and IPC operations now expose component preparation, extraction,
placement, copy and affected-use review. Both operation allowlists include these
commands and the existing target resolver. A public IPC journey first failed at the
missing allowlist entry, then passed preparation without writes, extraction, second
placement, complete two-screen review, unknown-field refusal, independent copy and
one-step Undo/Redo/reopen. Application typechecking and nine protocol tests pass.
An initial dependency-link command used an incorrect relative path; fixing the
command restored the existing pinned tools without an installation or product change.

The first coordinator Help preparation passed its real exporter but refused cleanup
because Cargo left one `xcrun_db` cache under its wholly owned TMPDIR. No project
fixture remained. The failed result, accepted bytes, log and exact binary are retained
under ignored `app/target/help-panel-coordinator-01`; binary retention succeeded on
this real failure. Successful preparation now removes its wholly owned temporary
directory after preserving accepted bytes and the binary, then verifies its absence.
SDK execution remains unstarted at this checkpoint.

## First Help SDK campaign and entry diagnosis

The current #44 SDK operation limit and cumulative consumption are owned by
[the selected leaf](https://github.com/Caldwell-41/Renpy-editor/issues/44#selected-implementation-and-sdk-operation-limit-2026-11-01).
This record retains attempts; it does not create a second allowance. The pinned
8.5.3 archive matches its retained official SHA-256 manifest. Preparation at `a70b941`
passes export, cleanup, frozen-input admission and all 12 artifact/rejection checks.
Its manifest hash is `8d5c66bd4c37269fd5851a43ac1ae67df865ca874476be098ae53e88064ee5ad`.

The first macOS ARM64 campaign passed version, compile and lint. Its first runtime
case failed with `JumpOutException: start`; the remaining five cases did not run.
All four launched processes terminated without timeout/output overflow, and owned
SDK/game cleanup completed. The failed result and logs remain under ignored
`app/target/help-panel-sdk-macos-01`. No runtime behavior pass is claimed.

The pinned SDK's Start action jumps out of a menu context. The fixture supplied no
main-menu interaction, so normal bootstrap had already entered the original story
when its before-test hook called Start. The correction supplies a fixture-only menu
and requires the engine's menu context before Start. It preserves all authored panel,
bootstrap and Story bytes. A new observed menu-entry field is mandatory in admission.
Diagnosis used the `principle-fix-root-causes` skill and the exact pinned SDK sources;
no production guard, retry or exception suppression was added.

Source inspection also showed that the pinned reporter counts all six defined
cases even when one is selected. Fixture teardown now exits after accounting for
the five unselected cases. Admission requires exactly six defined, one passed,
five unselected, zero failed and zero not-run per process. The combined campaign
still requires each of the six distinct named positive observations. This correction
does not waive a required case. Its actual SDK outcome remains pending.

The component fixture producer now serializes once, writes those bytes and emits
one digest record. Its exact public test passes; independently parsed stdout matches
the exported accepted.json SHA-256. L08 consumes checkpoint `0dd9618` for rejecting
mixed-run, missing and duplicate digest records before its separate SDK allocation.

## Second Help SDK campaign and reporter admission

The `f9f4240` menu correction passed version, compile and lint. Its first selected
runtime process exited zero and emitted exact normal-entry, menu-entry and two-advance
Show observations. The outer campaign still failed because admission compared the
completion line byte-for-byte and the pinned reporter appends a trailing space.
The other five cases did not run. Four additional launches and successful owned
cleanup are retained in `app/target/help-panel-sdk-macos-02`; #44 owns cumulative use.

A new admission assertion reproduced that formatting refusal before the correction.
Admission now removes trailing line whitespace only; exact status, uniqueness,
case counts, duration and source/observation checks remain mandatory. The actual
retained Show log passes that corrected admission against its exact manifest and
all ten accepted file hashes. Its outer failed campaign remains failed.

Read-only focus diagnosis also establishes that initial default focus depends on
input modality. The keyboard case now requires the actual Close widget's default
property and focus after real Down input, immediately before Return, rather than
assuming focus on initial display. Missing/default-mismatched/currently-unfocused
Close and a changed pointer still refuse. No production behavior changed. The next
campaign selects keyboard focus first because that render/input path remains unproved.
All twelve cheap admission/artifact checks pass before another launch.

## Component harness review and shared cancellation

The coordinator integrated L08 harness commits `80f1a70` and `9087d6d`. Two fresh
read-only reviews examined `6f414e9...9087d6d`. Standards found one P2: accepted
source and a successful core log did not verify their producing source/toolchain
and retained binary, so current HEAD could relabel a stale pair. A mandatory producer
preparation receipt remains required before component execution. Spec found one P2:
independently nonzero RGB and alpha admitted identical solid-white or invisible
colored images as positioned text. No other preparation defects or scope creep
were reported.

The coordinator added both rejected image profiles; each first passed incorrectly.
The gate now checks foreground variation after alpha compositing in each panel's
expected region. Both faults refuse, and all ten component harness tests pass.
Literal equality, runtime text and run/input identity requirements remain unchanged.

L08 also traced missing KeyboardInterrupt cleanup in the shared Python SDK adapter.
A real subprocess cancellation test first left its child alive, then passed after
unwind cleanup was added. That run also exposed stale noncanonical temporary-path
expectations and repeated process-group termination. An actual syscall trace showed
the first kill succeeding and repeated kills returning EPERM. Stop requests are now
idempotent; cancellation reaps the parent, drains the bounded output reader and
closes its pipe. A reader that fails to close reports an error instead of hanging.
All thirteen adapter tests pass on macOS, including timeout and output limits.
These use ordinary Python/shell subprocesses, with no SDK launches. Windows behavior
still needs its target check; unknown process cleanup receives no positive claim.

The shared adapter also preserves bounded partial output and known exit/reap/cleanup
facts on propagated errors. A real interrupted process first exposed the missing
output property, then passed with that metadata. The Help CLI's interrupted-export
case likewise first lost the produced binary, then retained it using the existing
retainer on partial Cargo output. All 13 adapter and 12 Help artifact checks pass.
Scratch cleanup and known process cleanup are now distinct in Help SDK results.
L08's larger mandatory producer-receipt correction continues in its two assigned
Python files; no component SDK allocation has been selected.

## Third Help macOS campaign and component provenance review

Help candidate `7e34c6a` passed version, compile, lint and all six separate normal-entry
cases in `app/target/help-panel-sdk-macos-03`. The frozen manifest SHA-256 is
`d79634e6f047b227dc10a0a0bb39c11d4daa23f1fff0f90027c4b9742993b470`;
result SHA-256 is `598abb7ff3c2fed33838aff23af31fc860ebe664c23afd1fce7a283636199947`.
Independent raw-log admission matches the aggregate observations and nine expected
commands. Accepted source remained unchanged. Keyboard focus is observed on the
actual Close widget immediately before Return; the pointer stays fixed. Outside
click preserves the panel; Escape removes it; two dialogue advances preserve it.
All commands exited zero and owned process/scratch cleanup completed. #44 owns the
single cumulative accounting record. Earlier failed campaign results remain failed.
This proves macOS pinned-engine behavior, not physical input, editor UI or Windows.

The coordinator integrated component producer commits `dadcdf91` and `127924bf` as
`37b8fb0` and `a137968`. Fresh read-only Standards/Spec reviews used the exclusive
two-file diff from `c71c041` to `127924bf`. Standards found two P2 defects: final
scratch cleanup could suppress an original failure, and missing/invalid duration
could pass producer admission. Spec independently found final receipt writes could
also suppress interruption, and original compiler bytes were not compared with the
retained binary. Its CARGO_HOME removal finding is contradicted by the fixed code,
which explicitly keeps CARGO_HOME; a focused execution-boundary test confirms it.

Coordinator corrections preserve the same original exception even when scratch
cleanup or receipt writing fails, record failed cleanup without a positive receipt,
require finite nonnegative numeric durations, and hash original plus retained
compiler artifacts at production and admission. Relevant fault checks first failed
(12 assertion failures and two finalization errors), then all 17 cheap checks passed,
including optimized Python. No SDK started during review or correction. Producer
receipts from before this material change remain historical and cannot qualify the
new candidate. A fresh committed producer is required before allocating execution.

## First component macOS SDK campaign

At `a97858c6ba0b16d1ab35d6cf058a93a657a1174d`, fresh public preparation retained
producer receipt SHA-256 `7eadc52df0018d16d7a4f1681abf8630572e6614df5438df7e69bd33b31a495e`
and accepted bytes `296d846956d9b881b77253a1ae83d11c6fe57ea8935c57286ac27571a1bf618b`.
The exact release fixture passed, with 607 other tests filtered, in a 43.40-second
bounded command. Original and retained binary bytes match. Read-only admission
passed before any SDK start. An earlier producer attempt refused an incorrectly
supplied expected SHA before Cargo; its failed receipt remains retained.

After selecting and reserving the campaign in #41, all eight macOS commands passed
using the checksum-pinned official 8.5.3 SDK. Four actual/literal screenshot pairs
cover shared and independent-copy states at 1280x720 and 1024x768. All have zero
differing pixels. Independent runtime text checks show two `Shared edited` uses
before copy, and `Shared edited` plus `Independent copy` afterward. Raw logs, exact
eight-command order, case identity and screenshot hashes were independently audited;
the coordinator also inspected the independent-copy image. Owned cleanup completed.
Runtime result SHA-256 is `259cb8674dbbadc273f7f10dbfb3e70762524c8da221601d1f82d7b15091ff55`.
Ignored evidence remains under `.toolchains/component-sdk-macos-01`; #41 owns the
single ceiling/accounting record. No extra Mac repetition is selected. This proves
accepted core output in the macOS SDK, not UI/controller, Windows or physical input.

## Windows readiness and binding refusal

The read-only SUNDOWN assignment completed with no source changes, fetch, build,
SDK/helper/native/package/CI execution or installs. Its actual Git repository is
one `repo` level below the folder registered with T3. The primary checkout is clean
at `039f22ce3c118f408145573ccedfeac0e93b7b70`; one existing stash and all existing
worktrees/recovery remain preserved. Rust/Cargo 1.90.0 and Python 3.13.15 are installed;
the selected Python lacks Pillow metadata. The official 8.5.3 SDK/archive and
published checksum file exist, but inventory did not rehash or launch them.
Coordinator source/base objects are absent, so exact source delivery is required.

The coordinator attempted the narrow T3 project workspace-root update. It returned
`capability_denied`, stating that changing projects/environment settings needs a live
full-access/default calling thread or full-access client. No project setting or
checkout changed. This is a T3 capability refusal, not a failed product check or an
automatic approval-review rejection. Windows work remains pending on correcting
that binding, private source delivery and Pillow availability. No alternate tool
was used to bypass the denied change. The remote assignment is complete and stopped;
its exact local continuation identity remains in the ignored assignment receipt.

## A2 refinement handback, 2026-11-02

The design owner handed back new, unapproved A2: screen `components-and-help-panel`,
revision `refined-v1`, variant `refined`, source commit
`c0ded415aba484633ac68981c48910afb82a959c`, reported fingerprint
`1d99e9d4ce1a0b450881753f19c10234ca95541043733bc1710989e6aee9fd08`.
The coordinator verified the clean prototype checkout at that commit, read
`REFINEMENT.md` and confirmed all approval entries and currentApproved remain null.
Original A/B/C and historical captures are preserved. No draft source was promoted
or cherry-picked into production.

The refined workflow places affected scope beside fields, reviews changed shared
fields, applies local edits directly and shortens dialogs. It retains typed-image
selection and blocked Help creation without an image. Copy with a valid draft uses
the agreed two-operation contract: accept a copy, verify fresh definition/revision
and child identities, then attach the retained draft. Copy returns identities only.
Failed post-copy inspection acknowledges the accepted copy, retains input and
blocks Apply until Reload succeeds. Cancel leaves the accepted copy; Undo reverses
Apply then Copy separately. These remain simulations pending user selection and
actual UI-to-core implementation proof.

The design owner reports full-lab strict TypeScript, source/approval validators,
a 128-case alternative matrix, final focused interactions and a final 32-case A2
matrix passing. Twenty-five hashed captures are in `refined-captures.json` on the
prototype branch. The full promotion browser gate was not run or claimed. Those
reports are prototype evidence only; exact Kris approval is still required.

## A2 approved and UI integration selected, 2026-11-02

Kris said "okay, go ahead, i think i like A the best". The coordinator resolved
original A versus A2, and Kris selected "A2 — Focused workflow (latest version,
shown first)". This approves screen `components-and-help-panel`, revision
`refined-v1`, variant `refined`, source `c0ded415aba484633ac68981c48910afb82a959c`,
fingerprint `1d99e9d4ce1a0b450881753f19c10234ca95541043733bc1710989e6aee9fd08`.
The design owner is preserving that source/captures, recording approval and running
the required promotion gate. Original alternatives remain. The preceding accepted
workflow explanation clarifies integration: Screens edits appearance; Use in Story
hands off to existing Story Show/Hide controls. No second Story editor is created.

Shared protocol DTOs now live in `src/screen-contracts.ts`; `screen-ui.ts` consumes
that owner and recognizes the core's typed component reference on inspected nodes.
Application typechecking passes. This checkpoint changes no visible UI.

UI ownership for the resumed work: L08 owns new `screen-components.ts` and scoped
CSS/tests, plus component-specific extensions to existing `screen-text.ts` for
shared review and retained draft transfer. L09 owns new `screen-panels.ts` and
scoped CSS/tests, plus `scene-ui.ts` and its Show/Hide tests. The coordinator alone
owns `screen-ui.ts`, `screen-composition.ts`, `screen-layout.ts`, `screen-images.ts`,
`main.ts`, shared contracts/styles/core/IPC, status, integration and final review.
Workers request hooks before editing any other owner. Core copy remains accepted
source first with identity-only result; pending drafts move only after a verified
refresh and fresh-node match, with Apply as a separate history entry. No mock save
or fabricated revision enters production. All costly-operation records remain in
the owning GitHub leaves; UI authorization creates no fresh SDK/package/CI ceiling.

## A2 approval integration and first production UI wiring

The exact approval/evidence `eb1f8f61` is integrated with its preserved source and
captures at `20c7fce8`. The full promotion command failed at initial navigation
before rendering any cases. Scoped inspection is distinct and does not replace
that failed gate. Diagnosis measured approval loading at 19,693.85 ms across 22
records and nine approved source commits. `committedFingerprint` launched Git once
per blob. A batch object read reduces the same loader plus explicit approved-source
fingerprint verification to 348.47 ms, retaining the exact A2 fingerprint. Approval
checks cover real Git/shared source and now include binary/newline and Unicode
inputs. Browser-check cache output is explicitly worktree-local. The full corrected
browser gate remains pending; no timeout was increased or approval guard bypassed.

L09's first form/Story checkpoint `10d6dd8e` and `f3a86206` is integrated as
`13267f1`/`54affa0`. The coordinator wires New screen to its Help/Blank form and real
catalog-revision-bound creation; accepted creation closes before refresh, so a
refresh error cannot invite a duplicate write. Use in Story validates the stable
Panel and navigates to the existing Story Scene with a hint, without inserting a
Beat. Main supplies real catalog/target callbacks; production bootstrap includes
the scoped form CSS. Two workspace tests and six form/Story tests pass; the selected
run including existing Screens tests passes 35 cases. Harness-only DOM selector
assumptions were corrected without changing product behavior.

The existing real-core owned-screen browser journey passes all eight groups after
explicit Blank selection in the new form, covering Cancel/Escape/refusal, minimal
creation, exact Source, Undo/Redo and reopen. Its cache override was added immediately
after that run; the functional result applies to the unchanged app UI, not a claim
that the override ran. New source and logs remain under the ignored controller
output. L09's first form/core import attempt failed before form/Story writes because
the default synthetic fixture lacked `game/images`. The default image-selection
hook now prepares that empty fixture directory; no production fallback or guard
change is added. Selection requires an open project, as existing service admission
demonstrated in the coordinator's first refused harness invocation.

## Component host wiring and Help module qualification

L08 module `f11a6067`/`768574c5` and semantic property-span correction `559e4d0`
are integrated. The coordinator supplies real refresh/selection, accepted-change
acknowledgement, draft participants and common component write admission. Shared
review returns captured exact revisions to compose/layout/size/position; ordinary
panels keep their existing synchronous input reservation. An initial selected run
exposed lost immediate locks when panel Apply awaited the component-only helper.
The focused red is retained; the corrected panel fast path passes all 27 existing
Screens tests, and the selected component/text/transfer/workspace run passes 39.
Image recovery separately proves editable retained fields, disabled Apply and
Cancel delegation. Component real-controller qualification remains in progress.

L09 final UI candidate `71938d4e` is integrated through `ed7dea8`, `c936a88` and
`f8b0fe6`. Its four-group real production module/controller-to-core journey passes
Help creation with a real imported UI image, exact Show/Hide Source, no-op/one-step
history, editor cancellation, stale refusal and protected rename/reopen intent.
Final result SHA-256 is `09dfaaf0623bef606f915c7257f662bd3f10ecc3d6f31103be357864d1fe19ca`;
raw final log is `990fb83005572d4989bcc1769f35ded8df5e5501c0705d90fd68486192771fb7`.
The ordinary app suite passes 322/322 with supported Python, after an initial
321/322 environment failure from system Python lacking tomllib. Twelve module and
36 existing Scene/Story cases pass. Whole-app navigation, visual comparison and
combined review remain coordinator proof.

A read-only diagnosis independently found the apparent reopen failure occurred
before project validation: opening a recent project refreshes its recent-record
UUID, while the harness reused its original UUID. The corrected journey reloads
recent records by stable project ID before reopening. It then passes the unchanged
header-rename assertions with old stable target intent protected. No Rust admission
or source protection was changed for that failure. All failed attempts/captures
remain in the worker's ignored handback artifacts.

## Main integration and current-source Design Lab checks

The coordinator integrated L08 through `af39a6d` at `b86a6b3`. Its Choose step
retains the ordinary element tree; definition navigation redraws after unlocking.
The real browser then exposed a host selector mismatch: the verified component
document opened, but the Screen picker still selected its prior Panel. Root
`69baa48` synchronizes both selections after refresh and guards step navigation
during active operations. The focused workspace test first reproduced the mismatch
and then passed. L08 retains its failed browser attempts and owns subsequent
copy-recovery fixes until handback.

The approved A2 starter capture has name, starter choice, project image and a
passive summary. Root `63c037b` removes the extra precreation appearance fields
from its earlier worker brief and uses the existing media service for the thumbnail.
Title, explanation and dimensions remain ordinary editable nodes after creation.
Existing text/layout/image/geometry owners provide pending-copy write blocking and
Cancel delegation. No second transaction or draft owner is introduced.

The new main Help/Story browser journey passes four groups against root `4f8c0cf`
and its recorded harness bytes: actual typed image and passive preview, one accepted
Help creation, a minimal ordinary title edit, Use in Story navigation without any
Beat write, explicit stable-target Show/Hide, one-step history and project reopen.
Its result is `.toolchains/help-ui/main-03/result.json`; captures cover dark wide
and compact creation plus Story. The initial two runs failed harness expectations
for lowercase picker text and the mixed-line-ending fixture's CRLF insertion,
respectively. Their failed receipts remain separate; no production source was
changed to satisfy them. Both cleanup paths exited the driver successfully.
This is production main/controller/core evidence, not SDK or native input evidence.

The first corrected full Lab run reached 488 cases before the actual historical
Screens guard refused changed source. The gate had assumed every historical
approval could render from one current checkout. Root `4f8c0cf` keeps the complete
current-source matrix explicitly Draft using disposable browser-only metadata,
then restores actual records and checks every current pointer and its matching-source
rendering or changed-source refusal. Repository records and reference captures stay
unchanged. Independent scoped Standards and Spec reviews each reported zero
actionable findings. Historical visual comparison remains a separate requirement.

The second full run reached 1,088 render cases and 20 check groups, then failed the
inherited production-editor check's old `3 Connect` label. Its full terminal report
is preserved as `.toolchains/design-lab-corrected-02-report.json`. Root `f24d001`
updates that one current-source expectation to the approved Use in Story behavior:
the callback-less legacy preview refuses navigation, retains its editor and writes
no history. That focused A5 interaction check passes. The third full gate is running;
neither prior full run is recorded as passing.

The third full Lab run reached 1,216 render cases and 21 check groups before the
compact prototype Copy/Escape assertion failed. A two-case keyboard/focus trace
reproduces the cause: Enter closes the naming dialog, but its asynchronous close
handler has not restored editor focus before the next Escape. Offline screenshots
had supplied that delay implicitly. Waiting for the actual title-focus restoration
makes the same Escape discard the draft and preserve the accepted copy. The full
refined interaction check now passes without screenshot waits. Only its test helper
changes; approved mock rendering/behavior source and all reference captures stay
pinned. The failed full report and both diagnostic event traces are retained.

The combined ordinary release-core suite passes 551 cases, with no failures,
54 intentional default ignores, three documented exclusions and zero doctests in
524.13 seconds. Its exact-name audit matches all 605 listed cases once. One transport
diagnostic shares a line with the next terminal test token; the initial line-anchored
audit rejected that framing and was corrected without changing test output.
The tested core tree is `283ed8cab74f9b59af09eb2d966d9209e46d25a8`, unchanged between
`4f8c0cf` and subsequent UI-only checkpoints. Local log identities and the audit are
in `.toolchains/components-help-core-receipt.json`; no SDK/native case was selected.


## Final local integration, review and qualification, 2026-11-02

Both isolated ticket workers are finished and clean. All ownership has returned to
this coordinator. The implementation checkpoint is
`0e5aff8c04d997c804051053f346c57b49808681` on
`codex/components-and-help-panel`; the original full-review base remains
`8a1fc41959d363e600d739868bb0b37e270e9bdd`. Later delivery documentation does not
become the tested implementation candidate. Source and evidence remain local;
there is no push, PR, upstream merge or ticket acceptance.

### Review corrections

Independent Standards and Spec reviews of the full base identified a Panel-local
Close qualification leaking into component extraction, omitted Style binding in
the affected-screen review, and inaccessible New screen name validation. Independent
L08 UI review also reproduced fields first edited during an accepted Copy's failed
refresh remaining attached to the original definition, and late Source inspection
navigating after the author left Screens. Correction `ebcd374` addresses all five.
Both full-review axes rechecked `8a1fc419...ebcd374` with zero remaining actionable
findings. The coordinator reviewed the subsequent scoped fidelity/test changes.

Extraction now refuses subtrees containing qualified Panel-local Hide/focus spans;
ordinary same-Panel editing and reorder still work. Keep Close local and extract a
content-only group. Components and the Help starter remain independent features.
Existing draft owners track fields first edited during Copy recovery as well as
previous drafts; no second draft store is added. Every participant prepares against
verified copied identities before any transfer commits. Style binding uses the same
changed-field review. Source navigation checks activity after asynchronous reads.

### Terminal portable checks

| Check | Candidate and terminal result |
| --- | --- |
| Ordinary app | `0e5aff8`: 342 passed, zero failed/skipped/cancelled, 36.656 seconds. Existing supported Python 3.12.14 is explicit. |
| Ordinary release core | `1a6690c`: 552 passed, zero failed, 54 default SDK/specialist ignores, three documented exclusions, zero doctests, 514.05 seconds. All 606 listed selected names have exactly one terminal result. The core tree is unchanged through `0e5aff8`. |
| Main component browser | `0e5aff8`: ten groups, zero page errors, owned cleanup complete. Real production main/Screens calls the ordinary real-core driver. |
| Main Help/Story browser | `0e5aff8`: four groups, owned cleanup complete. Real typed image import, actual empty-image blocking, Cancel/Escape focus, atomic creation, ordinary title edit, explicit Show/Hide and reopen pass. |
| Corrected full Design Lab | `c77d176`: 1,216 rendering cases, 29 groups, nine actual approval/source guards, zero errors, Chrome 156.0.8078.74. Later production fidelity changes do not change the Lab matrix. |
| Final static checks | Typecheck and whitespace check pass; repository validation passes for 1,460 files. |

The ordinary core command remains the documented release/locked/offline suite with
only the three exclusions in AUTOMATED.md. It uses controlled loopback access and
worktree-local outputs. Receipt `.toolchains/components-help-core-final-receipt.json`
binds core tree `7a3ded6d5b14c2d067809283d44bc6b1a05ccf7d`, exact-name audit and logs.
No SDK/helper/native test is silently selected by these ordinary checks.

Component browser coverage includes exact-byte incomplete-graph refusal, actual
extraction/placement, affected-screen Text/layout review and Cancel/Apply, clean and
layout-only Copy followed by newly typed recovery text, verified Reload/Cancel,
separate local Apply, both history entries, Redo/reopen, exact UTF-8 Source spans and
late-navigation refusal. Source rename preserves missing stable intent rather than
retargeting a same-name owner. Style/image/geometry reuse their existing owners and
common admission/transfer adapters with focused tests; this browser run does not
claim a full mutation campaign for every field type.

The Lab matrix renders current-source samples explicitly as drafts, then restores
actual approval records and checks matching-source rendering or changed-source
refusal. All nine historical source guards refuse this changed checkout as expected.
The exact approved A2 committed fingerprint and all 25 reference captures still
match. This passing current-source gate does not replace the original failed
promotion run or claim historical pixel fidelity, persistence or native acceptance.

### Visual and functional findings

Fourteen current component captures use matched 1,100/560-pixel viewports and all
five actual bootstrap stylesheets. Inspection covers insertion, shared fields,
changed-field review, Copy naming, refresh recovery and independent edits. Help
captures cover wide/compact New screen, the passive asset preview and empty-image
blocking. The new controls follow approved A2's hierarchy, scoped dialog dimensions,
affected scope beside fields and recovery warning. Required Source/effect details
remain available. Existing production chrome, ordinary Text/Style/layout/image
editors and the honestly unavailable component canvas remain. This is a scoped
visual finding, not a whole-screen pixel-match, OS-input or subjective acceptance
claim. Earlier component captures missing the scoped stylesheet are not fidelity
proof. The explicit Use in Story clarification still controls navigation wording.

Functional proof comes from real authoring transactions and exact Source/history
assertions above. Browser events are not physical/native input. Existing macOS SDK
component output at `a97858c` and normal-entry Help behavior at `7e34c6a` retain their
original frozen producers and scope. The later extraction refusal and UI fixes
change neither generated Help bytes nor supported runtime rendering semantics.
They introduce no fresh SDK execution or relabeled producer.

### Retained failures and artifact identities

One corrected broad core run returned 551 passes and one initial public-fixture open
failure, `Scene(RecoveryRequired)`. Its cause remains unproven. The same focused test
and all 22 ordinary Lifecycle peers passed unchanged. Before rebuilding, the failed
executable was retained under `.toolchains/core-open-recovery-failure`, SHA-256
`211fc1f1d4609568c25869bf5b03ba9a63b873a2386546af319dc3499a42cf6b`.
A test-only correction now retains the public fixture if this open fails again.
No production recovery protection or exclusion changed. The subsequent 552-pass
full run is a separate result; it does not turn the failed run into a pass.

Original zero-case Lab timeout and later 488/1,088/1,216-case failures remain
separate failed reports. Their diagnosed fixes batch Git object reads, separate
current drafts from historical approval guards, update the old Connect expectation,
and wait for actual prototype focus restoration after Enter. No timeout or approved
reference source changed. Worker/browser harness failures and Python environment
failures remain in their original output directories; corrected runs do not erase
them.

| Local artifact | SHA-256 |
| --- | --- |
| `.toolchains/component-ui/final/result.json` | `b038e5e33effecc84d6e79592218454e6f04f0b5e1d2c810c01b2e59fe828163` |
| `.toolchains/component-ui/final/receipts.json` | `17b2d1be35a0311316e78fbe1335f04b569c7b1ef2930eea05860970802ac6d7` |
| `.toolchains/help-ui/main-final/result.json` | `6aaddf2d930501a3d533f4c4e5de1c8729bec411a05e7161ad91345ce3445e11` |
| `.toolchains/help-ui/main-final/receipts.json` | `08bd6795f4b09cecf0416a08374ce4536919c7621343abdd96334c496f423535` |
| `.toolchains/integrated-app-terminal.log` | `dbecb034f8a9d5b5bedc3699d54c4e783b25c156806dc1460d992e43d713cf77` |
| `.toolchains/design-lab/report.json` | `6363b204c16f3e10cb1bfd7ea031ec5aeec93bb08176ba720edaade183a3cd10` |
| `app/target/components-help-core-final-results.log` | `50fd99770541a26ee3eb9697b18acf6e1d797c6b396f99b22729050178871e52` |

These ignored local artifacts contain only synthetic qualification content. They
remain uncommitted; hashes permit checking the retained evidence at handoff.

### Remaining target blocker and publication state

Windows qualification is unexecuted. The linked SUNDOWN T3 project still binds the
parent directory instead of its Git `repo` child. T3 refused coordinator setting
updates with `capability_denied`; no other route bypasses that denial. Kris has been
asked to correct the folder in the client. Private delivery of this unpushed branch
and availability of Pillow in the existing supported Windows interpreter remain
prerequisites. No Windows SDK launcher start is charged or reserved.

Cumulative SDK use remains #41 8/24 confirmed and #44 17/27 confirmed, zero reserved.
The leaves own those counts and limits. Windows target proof and the required
milestone native/CI gates remain open; there is no additional campaign selected by
this delivery record. Both tickets stay open. All worker ownership has returned to
the coordinator. Preserve the unrelated primary audit, existing stashes, protected
recovery, ignored evidence and pinned prototype server. Status-file size exceptions
retain unique historical accepted-baseline/recovery records, not another active
execution brief.


## Windows binding and private delivery, 2026-11-03

Kris corrected the linked T3 project to its actual Git root. Read-only inventory
confirms the clean primary checkout at `039f22ce`, its original stash, pinned
Rust/Cargo 1.90.0 and Node 24.19.0. The existing agent-runtime Python 3.12.14 imports
Pillow 12.3.0, resolving the earlier interpreter-capability gap without installation.
The old worktree ownership checks were sandbox-refused; no global Git safety
configuration was weakened. No test or native process was started by inventory.

The coordinator identified existing authenticated Tailscale Taildrop and privately
sent the prepared Git bundle. Windows verified 5,655,822 bytes and SHA-256
`8cbe364538aaf6673d218b74b53313592ac327eda45e4c307261d9ee1859ec05`, then verified
its required common base `c5f4ab18bc0fd9c1e73a5a97b5ce10d9534cd57c`. A local-file
fetch imported source `31bd8441fdd099ea27ee6f9a66153655a2e90a11` to new,
noncheckedout `codex/components-help-windows-source`, tree
`fe7f5954644d29eb7e0cb1480099ab5245c9601e`. Implementation `0e5aff8` is present
and an ancestor. Primary checkout/head/status and stash remain unchanged. No
source was pushed or published. Sender receipt is
`.toolchains/windows-private/receipt.json`; Windows retains its ignored
`.toolchains/components-help-receive-20261103/receipt.json`.

T3's remote delegate API rejected direct `isolation:worktree` before creating a
child or running tests. The next assignment uses a shared remote test session only
to invoke T3's dedicated worktree handoff with the exact imported commit, origin
fetch disabled and setup skipped. No shell-created checkout or primary branch
switch is permitted. The requested branch is
`codex/windows-components-help-qualification`; its actual binding must be verified
before tests. The assigned Windows owner may write ignored targets/logs/fixtures
only; all tracked code, docs and tracker records remain coordinator-owned.

This stage selects cheap qualifier checks, relevant public core tests, available
ordinary app checks and fresh local core-export producer receipts. It grants no
SDK/helper/native/package/CI start, download or tooling installation. Prior SDK
consumption remains #41 8/24 and #44 17/27, zero reserved. Candidate-specific
preflight results and target allocation will follow; neither private delivery nor
worktree preparation constitutes Windows qualification.


## Windows preflight fixture diagnosis, 2026-11-03

T3's dedicated handoff created `codex/windows-components-help-qualification` from
exact `31bd8441fdd099ea27ee6f9a66153655a2e90a11`; its tree matches the verified
bundle and tracked state is clean. Windows rehashed the official archive against
the pin and published checksum. The initial Python preflight ran 27 methods:
24 passed, two methods produced three errors and one method failed. Dependent core,
frontend and producer checks stopped. No SDK/helper/native/package/CI started.
The failed log/receipt remains in the Windows worktree under
`app/target/windows-preflight-31bd844`.

The component errors come from mocked SDK installations containing only `renpy.sh`.
The real adapter correctly requires `renpy.py` and its Windows Python executable.
A coordinator-side loop selecting the Windows adapter path reproduces the same
three errors in two methods. Supplying both mocked launcher layouts makes that loop
green without changing the adapter or starting an SDK.

The Help retention method expected compiled evidence but received `not-compiled`.
A safety-intercepted Windows reproduction captured a bare `cargo test` call through
`shell=False`. Fixture PATH lookup finds `cargo.cmd`, while native executable lookup
finds real Cargo. The probe blocked that launch; its injected PermissionError is not
the original unknown command failure. Explicit shim and exact-Python-emitter probes
both emitted valid artifact JSON, exited 101 and retained the exact 43-byte synthetic
binary. This identifies a fixture-resolution defect, not a retention-parser defect.
Diagnostic manifest SHA-256 is
`defc4aaa53075096a93900b80cd61168e29073ee09a2bfdee844b114d4839346`.
Its ignored `retention-diagnostic` directory preserves boundary/argv, failed-result
and emitter evidence. No real Cargo/compiler/SDK was started by that diagnosis.

The narrow correction is test-only. A child bootstrap routes the expected Cargo
fixture call directly to `[sys.executable, emitter, ...]` through the existing real
bounded adapter; the CLI logging, retention, command refusal and interruption
cleanup still execute. It refuses unexpected command names and never relies on a
shell shim. All 27 qualifier methods pass locally normally and under `-O` after
both corrections. Production source, commands, evidence admission and operation
limits are unchanged. Fresh Windows checks and producer receipts are required after
private delivery of the correction; the local pass does not relabel the failed
Windows attempt. SDK totals remain #41 8/24 and #44 17/27, zero reserved.


## Windows preflight passed and SDK selected, 2026-11-03

Candidate `50188c2d15aee8f7838037c9057bf42101a6965e` is clean in the existing
Windows qualification worktree. Both Python modes pass all 27 methods; typecheck
and the ordinary frontend suite pass 342/342. The next core attempt stopped before
compilation because the worker copied a placeholder cache; it ran zero tests.
That failed receipt and incorrect cache remain retained.

The corrected cache source contains 293 valid archives, 293 extracted packages and
473 sparse-index files. `bzip2 0.6.1` archive, source and index match Cargo.lock.
The copied registry's 12,963 files match the original, which remains unchanged.
Locked offline resolution passes with Rust/Cargo 1.90.0 and existing MSVC. Public
release component tests pass 21/21 in 109.72 seconds; debug panel tests pass 4/4 in
31.58 seconds. Both fresh public-core exporters pass one exact test each, followed
by prepared admission and three Help actual-artifact checks. No broad core or
frontend suite was repeated after unchanged passing results. Producer scratch is
removed; 27 ordinary core temporary entries remain local and recorded. A local
`.toolchains/target` junction points to this worktree's `app/target` so both existing
exporters reuse its warm build without source or timeout changes.

Receipt `app/target/windows-cache-recovery-50188c2-20261103/receipt.json` has SHA-256
`a99defd83c1cf48523951321d65ec3fa54b07df5300a886c9661915738919485`.
Its artifact manifest binds exact commands, selected/terminal names and retained
original/copied test executables. Component producer is
`e47432aa6a825e973cfb5c296076468626b8d9de31e2dafa9bd0101e04aeddf3`, with accepted
bytes `4c86317a97c2aa4d26d9ad56607b18f969bf93eb7b42a3852c41da1a4c428fe8`.
Help producing result is
`f9711381cbcd4925e39e112132585943709270755badf36755712287db9299b0`, with accepted
manifest `c79cabe017f253eb140e8896b16998f2278e37112cafdc2cd2e79db9a3af0c5f`.
The component validate-only result keeps SDK `passed:false` and records input
admission separately; no runtime pass is inferred from preparation.

The coordinator published and verified a Windows SDK selection in each owning leaf
before delegation. One owner selects exactly eight component launcher commands,
then nine Help commands only if component results and cleanup pass. Existing limits
and original cases stay unchanged. Each campaign stops on first failure; no retry,
extra version/help probe, driver/source change or diagnostic SDK start is allowed.
Before execution #41 was 8/24 confirmed and #44 was 17/27, zero reserved. Actual
starts and campaign results remain pending, so no planned maximum is recorded as
consumed or passed. No helper/native editor/package/CI or source publication is
selected. Primary checkout, stash, shared registry and previous evidence remain
protected. `.toolchains/windows-sdk-assignment.json` owns the live delegate pointer.


## Windows SDK campaigns passed, 2026-11-03

The first assigned SDK owner's disposable reader rejected a BOM in PowerShell's
`environment.json` before either qualifier ran. It started zero SDK processes;
receipt `1a658fdd763478e6844d37ce48fde17950db773f7a85e4d5403e670b794d5688` remains
separate failed preflight evidence. The replacement reads the unchanged snapshot
as `utf-8-sig`, compares its values to the producing receipt and uses fresh output.
No tracked source, qualifier, admission rule, timeout or output limit changed.

Both campaigns pass on clean Windows candidate
`50188c2d15aee8f7838037c9057bf42101a6965e`. Component launched exactly eight commands
in 49.594 seconds. Four actual/literal image pairs match with zero differing RGBA
pixels at both 1280x720 and 1024x768. Visible texts are shared/shared before Copy
and shared/independent afterward; observed renderer is angle2. Help launched exactly
nine commands in 48.079 seconds. Its six distinct normal-entry cases pass persistence
through two dialogue advances, authored Hide, re-show/Close, outside click, default
Escape and observed-focus keyboard Close. All six raw logs re-admit against the
same frozen manifest without another engine launch.

Every one of the 17 commands is PID-observed and exits 0 within its original bounds,
with no timeout, output overflow, retry or uncertain start. Actual cumulative SDK
consumption is now **#41 16/24 and #44 26/27, zero reserved**. The owning leaves have
been updated; planned commands are not counted twice. No further SDK selection,
helper/native-editor/package/CI operation or source publication follows from this
passing result. Engine events are not OS/physical input or human acceptance.

Accepted source, frozen producers, preflight/BOM evidence, primary checkout and stash
remain unchanged. Owned process trees, SDK extraction scratch and fresh profiles/temp
are cleaned up. The environment snapshot hash remains
`aa9e43f4d80fdb777c4b1c740e6e54b96dc417349c3832ad9caf3148ad27a926`.
Combined receipt is
`fcbf3a3744182fbc38dff89ca834564407770dcc9ffb4ea61837af943babc442`; its verified
120-file inventory is
`4e8951919fe9c47112fa2d4b57f2657e46815971c0ce418528fdf6dd9f7ba750`.
The Windows worktree retains both and the full command/image/case handoff under
`app/target/windows-sdk-50188c2-20261103-owner2`. A read-only data audit/private
artifact return is selected for coordinator preservation, with no new test or
engine execution. Local receipt/ZIP verification will bind that returned copy.

The coordinator prepared a local PR description using the PR skill. Source remains
unpublished, both issues remain open, and required PR CI plus broader milestone
native/human acceptance retain their explicit limits. No historical allowance or
unselected release/package gate is silently reopened.


## Coordinator artifact audit and local delivery readiness, 2026-11-03

The independent Windows data audit confirms all 120 inventoried files, actual
launcher PID/order/counts, unchanged accepted source and cleanup with no mismatch.
It starts zero test/SDK processes. Private Taildrop returns a 121-entry ZIP of the
synthetic retained evidence, 26,858,829 bytes, SHA-256
`f4e1f965e59f8f6dfbb1d74d9f0a1ccbecef1a13c93df42708cbf0c76e035707`.
The coordinator verifies that exact received archive, receipt and inventory hashes
and every inventory size/hash. ZIP paths are relative and contained, with no links,
encrypted entries or duplicate names. The verified copy remains ignored under
`.toolchains/windows-return`; the original returned download is preserved.

The coordinator independently re-runs the existing static evidence validators on
the returned data. All four component runtime records and exact RGBA image pairs
pass, including both-position visible output. The Help accepted bundle validates,
and all six raw logs re-admit against its exact manifest and accepted hashes.
Every component and Help command has a positive duration within its original bound,
exit 0, no timeout/overflow and required cleanup. Exactly 17 started PIDs agree
with eight component and nine Help rows; no uncertain start exists. Inspection of
actual screenshots confirms the shared texts at both sites and the independent
copy only at its chosen site, without clipping in the sampled sizes. The local
`.toolchains/windows-return/coordinator-audit.json` records this audit. It starts
zero SDK processes and changes no source.

The coordinator's final review is complete for the local implementation. Full-base
independent Standards/Spec reviews through `ebcd374` have zero remaining actionable
findings; the coordinator reviews subsequent scoped fidelity, test-portability and
evidence changes. Portable/connected checks retain their exact candidates, and
production core/UI is unchanged between `0e5aff8` and Windows candidate `50188c2`.
All delegates are finished. No owned SDK/test process remains, no recovery/signing
identity changed and no source is published. The primary checkout, stashes,
prototype/reference worktree and pinned server remain preserved.

Both tickets stay open. Local code is ready for publication review; the prepared PR
body is ignored under `.toolchains/delivery/pr-body.md`. Publication has not been
authorized, so neither source push nor PR creation occurred. The branch still needs
its required PR validation selection and subsequent CI before integration; broader
milestone native/human acceptance is separate. This local handoff is not a merge,
release or whole-3B acceptance. No further SDK/helper/native/package/CI campaign is
selected. Final SDK use remains #41 16/24 and #44 26/27, zero reserved.
