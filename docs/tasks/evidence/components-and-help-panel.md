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
