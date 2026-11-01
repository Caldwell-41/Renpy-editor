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
L09 temporarily owns only the corresponding module-registration lines in
`screens/tests.rs`; the coordinator leaves that file untouched until handback.
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
