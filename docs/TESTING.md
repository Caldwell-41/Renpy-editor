# Testing strategy

## Current scope: proportionate hobby-editor acceptance

[ADR 0010](adr/0010-local-project-safety-and-observed-flow.md) governs new work.
Routine gates prioritize save/reopen/undo, external in-place and replace-on-save
conflicts, interrupted-save recovery, draft/session retention, malformed input,
basic path/link refusal, explicit execution and usable response times.
Use deterministic ordinary writer interleavings where they protect against lost work.

Deliberately timed same-user root/parent/reparse attacks, persistence-process
termination, SDK-install crash recovery and the G1-O native-reader experiments are
specialist historical tests, not blockers for last-observed Branches.
Preserve them and their failures; do not acquire symlink privileges or change security
settings to pass a hobby-editor gate. Existing robust write/recovery code remains.
Historical corrective evidence below keeps its actual result.

[WORKFLOW's delivery rules](WORKFLOW.md#proportionate-delivery-rules) exclude deliberate
process-termination experiments from routine selection. The
[TEST-AUDIT-1 selector disposition](tasks/archive/2026-10-06-testing-policy-alignment.md#selector-disposition)
records the rationale and exact specialist cases. The four persistence-termination
parents and two embedded SDK specialist tests are explicitly ignored. Production and
quality broad-core selectors skip the separately selected flow fixture and the two
archive-backed SDK gates; ordinary Prepared recovery now uses a non-crashing fault-state
fixture. These source selectors are prepared here; this checkpoint does not compile or
execute them. Controlled game failure, Stop and descendant cleanup remain required.

G1-OBS updates production code, test classification/selectors and real-service gates
together. Historical `g1_o1` tests and seventeen named timed namespace substitutions use
explicit specialist `#[ignore]` attributes; ordinary writer interleavings, baseline
path/link rejection, recovery, session/process/privacy remain routine. The one-shot
G1-O1-N native test remains separately ignored and is never selected by routine CI.
Use `--ignored --exact <test>` only for a separately selected specialist task; report
all exclusions and target capability limits honestly.

Branches acceptance is G1-U1 observed-state behavior, G1-U2 <250 ms accepted-model
update and <2 s initial/explicit disk refresh, plus the retained G1-V2 rendered
interaction gate and data-loss/authority regressions in ADR 0010. Same fixture,
three fixed successful samples per supported target; changed semantics require new
evidence. A quickly returned unchanged graph cannot pass an accepted-edit case.
No second complete source pass, final leaf-binding matrix, 230 ms verifier allocation
or fixed 1,006/503/504 source-pass count is required.

## SDK hashing regression

Keep large SDK hashing buffers on the heap. The Windows release main thread has a
1 MiB stack reserve; a 1 MiB local array plus the function frame can overflow before
any hashing begins, even when the ordinary empty-profile startup works. A passing
test-harness thread does not prove the same allocation fits the desktop main thread.

`renpy::tests::sdk_hashes_match_multichunk_empty_and_missing_inputs` covers exact
file/tree digests and framing across chunk boundaries, empty files and missing
inputs. `sdk_file_hash_retains_cancellation_and_deadline` preserves request controls.
Use ordinary correctness checks and the existing disposable application scenarios
for this regression. Deliberate crash reproduction was local diagnostic evidence;
it is not a new routine test or a reason to run hostile filesystem/race experiments.
See the archived Phase 1G/UI ledgers for scoped Windows evidence and final closeout.

## Current production scaffold and Phase 0 regression commands

These command references describe the existing scaffold, not a run-all instruction.
Select changed-scope checks under WORKFLOW using the routine selectors below;
an archive-backed SDK wrapper returning a skip marker is not qualification evidence.
From `app/`, the Phase 1A production command references are:

```bash
npm ci --ignore-scripts
npx playwright install chromium  # only when no system Chrome is available
npm run check
npm run test:source-browser
npm run build
cargo fmt --check --all
cargo test -p loomlight-core --locked
cargo test -p loomlight-desktop --locked
npm exec -- tauri build -- --locked
```

The unfiltered core line above is a general command reference only. For routine broad
core coverage, both workflows use the same three exclusions and verify positive Cargo
summaries plus named ordinary regressions:

```bash
cargo test -p loomlight-core --release --locked -- \
  --skip scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges \
  --skip lifecycle::tests::official_sdk_phase_1c_target_gate \
  --skip renpy::reconciliation_tests::official_sdk_download_handoff_target_gate \
  --nocapture
cargo test -p loomlight-core --release --locked \
  scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges -- --exact --nocapture
```

Run SDK gates separately with their pinned archive and exact test path. Supply `--ignored`
only for explicitly selected SDK tests needing an archive, and always combine it with
`--exact`. Specialist persistence/namespace cases stay excluded.

Phase 1H additionally selects
`renpy::tests::phase1h::phase1h_integrated_authoring_sdk_gate` with
`LOOMLIGHT_RUNTIME_SDK_ARCHIVE` on each supported target. It creates and authors the
representative game through real services, compares fixed source/media expectations,
reopens, validates through explicit runtime trust and runs both routes from normal
entry using the pinned SDK test driver. Original assets and outcome/source expectations
live in `tests/fixtures/phase-1h/`. Its ignored state means ordinary core does not repeat
SDK execution; a missing archive is a failure. The production workflow requires the
named positive Cargo result and completion marker and retains the independent case log.
The disposable driver sets SDL's dummy audio output before SDK audio initialization,
so hosted runners need no speaker device. It records actual PCM initialization and
music/SFX channel filenames before asserting them, and still requires real playback
and stopping. This verifies decoding/channel state, not audible speaker output.
The routine core also selects actual authoring/reopen after 4,097 terminal journals.

For changes to starter GUI generation, explicitly select the ignored pinned-SDK
regression `renpy::tests::official_sdk_starter_contains_runtime_gui_assets` with
`LOOMLIGHT_RENPY_SDK` pointing to the verified 8.5.3 SDK. It creates disposable
projects through the real lifecycle at 1280×720 without Git and custom 1600×1000
with Git. It checks generated files, SDK metadata, reopening, actual runtime
dimensions/title/build name, Preferences/Load/Save menus, first dialogue and return
to the main menu. The custom game runs without editor metadata. Each execution
requires a positive named SDK test result in addition to generic GUI asset presence.
It is separate from routine core and from
the two ignored runtime SDK gates; absence of the SDK is a failure, not a skip pass.
The workflow result checker rejects missing/malformed summaries, zero selected tests,
missing/ignored/filtered required cases and failures. Packaged case evidence must contain
exactly one successful report per required scenario with cleanup complete.
The shared Q1 workflow helpers use `python` on Windows and `python3` on macOS via
the job's `Q1_PYTHON` setting, selected from `matrix.runner`. Job-level `env` cannot
use the `runner` context; the focused source audit rejects the original invalid
expression and incorrect interpreter mappings. For changes to these workflows, run
`actionlint -shellcheck= -pyflakes= .github/workflows/production-scaffold.yml .github/workflows/quality.yml`
from the repository root before dispatch. This checks YAML and Actions expression
semantics independently of the focused source audit (validated with actionlint 1.7.12).
The disabled integrations are external shellcheck/pyflakes, not workflow rules.
Gate self-tests and synthetic package-retention CLI
tests run in preflight; they do not launch or qualify an application.

The full desktop Rust test, package, and injected packaged-WebView probe run separately
on Windows x64 and macOS ARM64 in `production-scaffold.yml`. The core-only Cargo test is
also runnable where a complete Tauri desktop build environment is unavailable. This is
not a substitute for either target gate.

The retained Source Save browser regression first executes the historical
unconditional-dirty fake and requires it to demonstrate the false re-dirty after one
completed Source Save and zero Flushes. It then executes the faithful accepted-text
model and requires the same selection notification to remain clean. The launcher uses
system Chrome when available and otherwise the locked Playwright Chromium binary.

The packaged probe also starts a primary Loomlight process, waits for its explicit
post-setup readiness marker, and launches the same packaged executable again. The
primary must receive the maintained Tauri single-instance callback, find the existing
main window, and remain functional through the lifecycle/UI/WebView checks. The losing
process must exit and its isolated log must not contain the readiness marker emitted
after `LifecycleService` construction. This is deterministic evidence that the second
launch does not reach writable lifecycle initialization; arbitrary delays alone are not
accepted as the assertion.

The completed single-instance correction is evidenced by production run
`34906232240` at `e1e8dac`: Windows x64 job `104183422740` and macOS ARM64 job
`104183422612` both passed the full core/lifecycle suites, desktop tests, packaging,
dual-launch smoke, existing WebView restrictions, secret scan, and dependency/licence
inventory. Their secondary logs are empty while each primary log records readiness,
secondary rejection with `primaryWindowFound: true`, and `singleInstancePassed: true`.
Evidence artifacts are `10372748134` (Windows, SHA-256
`949213ab719c6d8c895cae933839459d97670f89dbdb37281f62a0b483af38e7`) and
`10373200561` (macOS, SHA-256
`75fc9d2b01dcdcce046b4f1a838e5496129989a1fad1031ea28cb2c06515bb03`).
Quality run `34906232244` passed.

Phase 1C extends that same cost-scoped production matrix rather than adding a duplicate
Windows/macOS workflow. Each target restores/downloads the exact official 8.5.3 SDK
archive, then production code verifies/extracts it and exercises staged create, Git
init, compile/lint, bounded run, close/recent/open, stable selection, metadata-free
copy compile/run, standard screen presence, and arbitrary-project rejection. The
lifecycle log joins the existing lightweight evidence artifact. Without
`LOOMLIGHT_PHASE1C_SDK_ARCHIVE`, the target-only SDK test records a local skip and does
not count as target evidence.

The original Phase 1C gate was
[run 34814995559](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34814995559)
at `1b241954e936f943d558f267a86f5e3592ab99cb`: Windows x64 job `103883726104`
and macOS ARM64 job `103883726218` both passed the production lifecycle test, desktop
tests, packaging, packaged denial smoke, secret scan, and dependency/licence inventory.
Evidence artifacts are `10335964464` (Windows) and `10335279104` (macOS). The archived
[Phase 1C task](tasks/archive/2026-09-14-phase-1c-project-lifecycle.md) retains all
failed/superseded attempts and their diagnoses.


A post-closure review reopened Phase 1C for a bounded correction: private stage and SDK
capabilities now retain/revalidate filesystem identity, approved SDK launch/template
fingerprints are checked around execution, managed SDK reuse requires checksum-derived
provenance, child environments are allowlisted, Git configuration/path redirection is
neutralized, Tauri dispatches lifecycle work off the UI thread, repeated SDK selection
is deduplicated, redirects are refused, and packaged smoke checks the actual
Welcome/New Project DOM.

The corrected gate is [run 34832555392](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34832555392)
at `08daf385246c345f53f46f9dedc43762a1c060e9`: Windows x64 job `103939004703`
and macOS ARM64 job `103939004630` both passed the complete core suite, official
Ren'Py 8.5.3 lifecycle test, desktop tests, packaging, packaged WebView/lifecycle UI
smoke, secret scan, and dependency/licence inventory. Evidence artifacts are
`10343096571` (Windows; SHA-256 `74b3a0b31b6a6012059cef99a3517a30432af5e0b226f09279f6472ffde66c17`)
and `10342841434` (macOS; SHA-256 `d01081e879877744a098410e51b1b1db871c6c9994f765143150afa54bb69184`).

Historical Phase 1C durability/race evidence (not current routine authorization) adds
real subprocess termination before/after managed-SDK final promotion and at partial,
durable-staged, and committed Recent Projects boundaries. Deterministic tests cover
missing/corrupt/mismatched provenance, abandoned SDK stages/downloads, app-state and
SDK symlink/reparse refusal, parent substitution during stage creation, child use
immediately after final validation and while in flight, and substitution immediately
before promotion. The production workflow requires explicit remediation markers from
the official 8.5.3 lifecycle test—including proof that discovery does not spawn an
unproven managed SDK—in addition to the complete core-suite test names.
Earlier production runs do not evidence these additions. Production run
`34849801157` at `bdc7ad60` passed Windows x64 job `103994559964` and macOS ARM64 job
`103994559633`, including the platform core suites, official SDK lifecycle/remediation
markers, desktop tests, packages, packaged smoke, scans, and inventories. Evidence
artifacts are `10350511403` (Windows, SHA-256
`30fd5e2a8479513eace75856aa9747a63cafe70be2cbf6124cc1be1e8566d675`) and
`10351240446` (macOS, SHA-256
`cf3e7dc9a913ca1b84ca5b8377e1af0422b880ed66d16e93e8d7fe684a17e9d5`). Quality run
`34849801200` passed.

Failed evidence remains explicit: first corrective production run `34829660277` at
`60406825` failed the macOS hostile-stage test because the test used the `/var` alias
instead of the canonical retained parent path, while Windows exposed verbatim canonical
SDK process paths that Ren'Py rejected. Its Windows/macOS evidence artifacts are
`10341193070` and `10340778911`. Dedicated target run `34830668266` then passed both
supported targets after canonical test setup and Windows process-path normalization;
diagnostic runs `34831041290`, `34831227053`, and `34831382649` isolated the Windows
failure without weakening the minimal child environment. No failed/skipped step is
reclassified as a pass.

Retain the Phase 0 regression suite:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check
```

The validator checks the required document structure, UTF-8/final newlines, internal
Markdown links, common secret patterns, personal email domains, and user-home paths.
The isolated source/preview spike has 26 dependency-free unit/golden tests (19 source
tests and seven fidelity-mapping tests); the SDK boundary adds 24 dependency-free
security/adapter/reporting tests. The Phase 0 SDK and desktop evidence workflows remain
available by explicit `workflow_dispatch`, but no longer run automatically on routine
pushes. This keeps the historical regression/evidence machinery reproducible without
spending Windows/macOS runner capacity during current production development.
`.github/workflows/sdk-spike.yml` performs the pinned official Windows x64, macOS ARM64,
and Linux-regression integration matrix when manually requested.
`.github/workflows/desktop-spikes.yml` packages disposable Electron and Tauri shells
on Windows x64 and macOS ARM64 when manually requested; these jobs are Phase 0 evidence,
not release builds.
The initial full matrix passed in
[run 34547542329](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329).
Later packaged-denial probes ran in 34691607349, but the recorded job conclusion is not
sufficient evidence: Windows printed `navigationDenied: false` for Tauri while the step
still passed, and expected Electron denial exceptions exposed absolute packaged paths.
Corrective runs then proved those failure paths were enforced. The final
[packaged security/filesystem run 34700476448](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34700476448)
passed every explicit assertion on Windows x64 and macOS ARM64, including long paths,
symlinks, watch events, redaction, and Tauri navigation denial. The corrected shared
UI/WebView [run 34701370897](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34701370897)
passes identical packaged wide/narrow assertions in Electron and Tauri on Windows x64
and macOS ARM64. It covers DOM accessibility semantics, docks/resizing, keyboard/focus,
reduced motion, synthetic media drag/drop, codec observations, and a loose Monaco edit
guard; it does not claim a manual NVDA or VoiceOver pass.
Corrective [run 34743055306](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055306)
additionally decoded and advanced valid repository-controlled Ogg Vorbis and VP9 WebM
fixtures in both candidates on both supported targets.
The packaged credential-store
[run 34722411465](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722411465)
passes on both targets: no renderer/credential IPC, OS-native round trip and cleanup,
bounded/redacted probe output, and zero plaintext sentinel matches in tracked source,
the project fixture, packages, executables/bundles, or retained-artifact inputs.
The packaged branch-graph
[run 34722954424](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722954424)
passes the same deterministic 1,000-, 10,000-, and 50,000-node workload in Electron
Chromium and Tauri WebView2/WKWebView on both targets. It asserts the predeclared 10k
usability budget, viewport culling, stable relayout, interaction p95, and scheduled
Monaco delay/edit bounds; the 50k case remains a separate stress result.
The preview/source-mapping follow-up
[run 34723797776](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34723797776)
also passed the trusted Ren'Py 8.5.3 Linux runtime case for the mapped transition,
named transform, screen presence, literal dialogue, and Python-dependent state. Static
and Linux evidence are supplemented by the final target SDK/install
[run 34731460283](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34731460283).
That matrix passed exact version, compile/lint/test/run/warp, bounded target
distribution, containment-checked package installation and launch, plus unsigned
Authenticode and macOS codesign/Gatekeeper/quarantine observations. Physical
SmartScreen, quarantine-origin, signing, and notarisation UX remain release checks.
The final equivalent desktop comparison
[run 34733246868](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34733246868)
passed all three fresh launches per candidate and target, recorded cold start,
descendant-tree idle/stress observations, unpacked application payload size, 10k
interaction/Monaco and 50k stress behavior, dependency/licence locks, and source
complexity. Runs 34732252587, 34732654915, and 34733107607 remain failed evidence for
sampler attribution, comparison-vs-diagnostic exit criteria, and macOS filter-yield
flakiness. ADR 0003 supports Tauri 2 from the bounded gate set. The macOS observation
may omit launchd-owned WKWebView/XPC services and cannot support total-memory savings.
The Phase 1A production workflow runs the full Windows x64/macOS ARM64 package matrix
for relevant production changes pushed to `main` and by explicit manual dispatch. It
does not run on pull requests, so a reviewed change is not charged once before merge
and again after merge, and documentation-only changes do not launch desktop packaging.
Routine runs retain lightweight packaged smoke and dependency/licence evidence only;
full application bundles are uploaded only for manual production runs. The workflow
continues to use locked npm/Cargo dependencies and commit-pinned checkout, Node setup,
Rust cache, and artifact-upload Actions.
[Run 34782008915](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34782008915)
passed the complete macOS ARM64 gate and packaged Windows x64, where one subsequently
corrected renderer-secret false positive remained. Runs 34782646465 and 34782646499
then failed at hosted-runner setup with zero steps after repository artifact storage
reported quota exhaustion; they remain failure evidence, not passes.
[Run 34792368716](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34792368716)
at `0a6a6c5d` closes the corrected gate: Windows x64 job 103818859749 and macOS ARM64
job 103818859932 each passed locked install, frontend and Rust tests, packaging,
injected packaged-WebView denial smoke, artifact privacy scan, and dependency/licence
inventory. Lightweight evidence artifacts 10328234722 and 10328548641 were retained;
full packages were intentionally not uploaded on this routine push.

The original Phase 1B closure ran on
[run 34797222616](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34797222616)
at `85690bd4ebde95f9ee707175e54336bfd83af0f8`. Windows x64 job 103832559663
and macOS ARM64 job 103832559907 each passed the same 24-test transaction suite (plus
the ignored worker invoked by its parent at seven real termination boundaries),
desktop tests, packaging, packaged denial smoke, artifact secret scan, and the 76 npm /
437 Cargo dependency inventory. Both used Node 24.19.0, npm 11.9.0, and Rust/Cargo
1.90.0. Retained lightweight artifacts are 10330271852 (Windows) and 10329987775
(macOS); routine full-package upload was intentionally skipped.

Run 34796513503 passed at the preceding implementation commit. Contract reconciliation
then found that pre-commit stage/accepted copies and journal temporaries used ordinary
`sync_all` on macOS; `85690bd4` routes them through the required platform flush, and
the final matrix above exercises that correction.

Run 34796369255 at `cc1ea6b8` is retained failed evidence. Both targets stopped at the
core step because the repository-write transport had truncated `Cargo.lock`; the
complete locally validated lockfile was restored in `ecc369a7` before the passing
matrix. This was a diagnosed committed-input defect, not a flaky target result.

A subsequent corrective review reopened Gate E: the successful historical suite did
not close pathname substitution after parent validation, and did not prove safe
`Prepared` abandonment or non-blocking terminal `Rejected` handling. The correction
relocated evidence to anchored recovery and added parent/recovery/target substitution,
same-path delete/recreate, no-out-of-root-write, actual killed-process `Prepared`
finalisation, later-commit, terminal-rejection, and conflict/recovery-blocking coverage.
Production run 34801268319 passed that suite on actual Windows x64 and macOS ARM64.

A final follow-up review then found that recovery discovery still used
`fs::read_dir(recovery.path())` after opening an anchored recovery directory. On
macOS/Unix, a same-user rename plus empty pathname replacement could therefore have
hidden unresolved journals from Save/Flush. The regression now validates that the live
pathname still names the retained recovery object, enumerates a duplicated descriptor
with `fdopendir`/`readdir`, and revalidates the chain; Windows keeps pathname enumeration
only while the recovery namespace is pinned against rename/delete.
[Production run 34804861387](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34804861387)
at `dc2efdf845fd014c57e850f2c96683fd487da592` passed the latest suite on Windows
x64 (31 passed, 0 failed, 1 ignored worker) and macOS ARM64 (33 passed, 0 failed,
1 ignored worker). The macOS suite includes
`anchored_recovery_enumeration_rejects_path_substitution`. Both targets then passed
desktop boundary tests, packaging, packaged WebView denial smoke, artifact privacy
scan, and dependency/licence inventory. Quality run 34804861410 passed. Evidence
artifacts are 10332572412 (Windows) and 10333101940 (macOS). This is the current Gate E
closure evidence.

Run 34804735119 at `c0d881a4` is retained failed evidence for this final follow-up: both
target jobs passed frontend validation/build and then stopped at `cargo fmt --check
--all`; core and later steps were skipped. The formatting diff was fixed in `dc2efdf`.
The earlier corrective run 34800849992 also remains failed evidence for the diagnosed
Windows writable-flush-handle defect; no failed or skipped step is reclassified as a
pass.

## Planned layers

| Layer | Deterministic coverage |
| --- | --- |
| Unit | Source tokens/CST, serializers, graph/state, path/archive safety, transactions, SDK adapters, schemas |
| Golden | Byte-identical no-op round trips and minimal source-range patches over representative `.rpy` files |
| Property/fuzz | Parser recovery, indentation/strings, path normalization, archive entries, transaction sequences |
| Integration | Pinned official SDK compile, lint `--error-code`, tests, run harness, diagnostics, distributions |
| Desktop E2E | Project create/save/close/reopen, Scene edit, source sync, external conflict, preview/run; Git checkpoint in optional Git |
| Cross-platform | Windows and macOS file watching, paths, subprocesses, credential store, package/install/launch |
| Security/privacy | Narrow IPC, malformed input, traversal and ordinary unsupported-link refusal, explicit execution, redacted logs and package privacy; specialist OS attack experiments separate |
| Performance | Large scripts/assets/graphs, incremental parse, patch latency, preview responsiveness, memory budgets |

Phase 2 LLM-specific schema/adversarial/context/consent tests are intentionally not a
Phase 1 Desktop E2E requirement.

## Phase 1 milestone gates

The implementation sequence in
[`tasks/archive/2026-10-07-phase-1-vertical-slice.md`](tasks/archive/2026-10-07-phase-1-vertical-slice.md) is
quality-gated rather than one large feature branch:

| Milestone | Minimum evidence before proceeding |
| --- | --- |
| 1A scaffold | Locked fresh install/build/test; command/capability denial; CSP/navigation/network/ambient host denial; privacy/licence checks; packaged Windows x64/macOS ARM64 smoke; semantic theme tokens/reduced-motion foundation |
| 1B transactions | Ordinary external-writer conflicts, stale revisions, path refusal, interrupted-save recovery, durability semantics and undo/redo on both targets; retained historical defenses remain |
| 1C project lifecycle | New-project staging/failure cleanup and basic path/link refusal; restart-safe verified SDK installation/provenance and Recent Projects via non-crashing fault/state fixtures; detected/install/browse SDK; conventional Ren'Py template paths and standard GUI; create/validate/close/reopen; game runs without `.renpy-editor/`; timed namespace/crash experiments remain specialist history |
| 1D authoring models | Character/appearance, copied image/audio assets, automatic-discovery naming collisions, basic variables, source round-trip/reload identity |
| 1E Scene | Bounded Beat workflow, preview/partial state, choice linking, Story tree file lifecycle, stale `.rpyc` cleanup/ghost-script regression, undo/redo, accessibility, Quiet Studio Dark conformance |
| 1F Source | Partial CST/range mapping, no-op/minimal-patch golden tests, direct source→Scene sync, exact custom-code preservation, external conflicts |
| 1G completion | Branch graph from shared edges, authoritative SDK diagnostics/run, continued authoring during play, technical-surface design consistency |
| 1H acceptance | Fresh end-to-end Windows/macOS create→author→save→close→reopen→validate→run workflow plus transaction, source, privacy/security, packaged app, accessibility, and visual-system gates |

Phase 1 is accepted and closed after [independent 1H review and integration](tasks/archive/2026-10-07-phase-1h-vertical-slice-acceptance.md#independent-review-integration-and-phase-1-closure--2026-10-07).
Qualification remains production 37529174148/1 at `ba01a84`; integrated main `82d4518`
has the identical reviewed input tree and required quality 37536967028/1 Pass.
The accepted limits and both earlier failed matrices remain part of that evidence.
Future corrections select affected gates under this policy rather than replay unchanged
qualification or treat historical skipped wrappers as target evidence.

Durable 1H regression lessons:

- Keep fixed expected source/media/runtime observations independent of produced output;
  exercise normal entry and both actual routes, plus a deliberately wrong assertion
  that must fail. Exact large integers and metadata-free play remain required.
- Preserve per-case terminal results, nonzero failures, process cleanup and input/package
  identity; a success marker or capture alone cannot prove accepted behavior.
- Test probes must await acknowledged draft retention before contending backend reads,
  while retaining the backend dirty-count assertion and rejecting refused writes.
  Preserve the shared deadline; do not replay input or hide a real refusal.
- Frame evidence requires strictly advancing timestamps and bounded rejection of
  malformed/backward/nonadvancing evidence. Chrome timing Fail stays diagnostic under
  the existing policy; required functional and real-service budgets still enforce.

A green result from one platform cannot close a cross-platform milestone. Failed and
flaky runs remain evidence; isolate and fix defects rather than retrying until green.

The historical Phase 1B core suite launches a child copy of the Rust test process and exits it at
prepared, staged, commit-intent, exchanged, verified, committed, and durable journal
boundaries. A fresh service then classifies the retained state. In-process hooks
deterministically race external content/identity/path changes before and after the
platform operation. The latest suite also proves recovery-directory namespace
substitution cannot convert unresolved recovery into an empty successful scan. The
implemented [selector split](tasks/archive/2026-10-06-testing-policy-alignment.md#selector-disposition)
excludes those deliberate process-termination/namespace parents from the routine
Windows/macOS matrix. Ordinary external-writer and interrupted-save recovery assertions
remain selected, including archive-backed lifecycle gates with specialist sections split
out. Historical specialist defenses/evidence are retained; no documentation-only matrix.

## Representative source coverage

Fixtures cover comments/formatting, dialogue/narration, labels, menus and conditions,
variables, calls/jumps/returns, screens, ATL/transforms, audio/movies, translations,
embedded Python, custom statements, malformed/incomplete edits, and non-ASCII text.
Details and synthetic naming rules are in
[fixtures/REPRESENTATIVE_GAME.md](fixtures/REPRESENTATIVE_GAME.md).

Phase 1 adds production fixtures for the generated conventional project scaffold,
Scene-per-file lifecycle, automatic image/audio discovery naming, stale `.rpyc`
cleanup, unsupported/custom-code placement, and external-edit/recovery cases. Fixtures
remain synthetic and must not contain private game content.

Phase 1D adds expected-absence creation, mixed create/replace recovery, a streamed
17 MiB regression above the old source-edit cap, 512 MiB limit rejection, typed
literal/identifier/source-patch tests, and stable entity/relationship reopen tests.
The existing supported-target matrix extends its controlled official-SDK lifecycle
fixture to author two Characters, three Appearances, background, music/SFX, and
bool/int/string Variables; it then closes/reopens, edits again, compile/lints, runs,
tests a metadata-free copy, packages, probes WebView denial, scans secrets, and records
the dependency inventory. No duplicate matrix is introduced.

The integrated corrective suite additionally covers direct ordinary-write recovery
blocking, zero historical-media reads during terminal readiness scans, streaming
subprocess termination boundaries, failed-switch preservation, root/session
substitution, stale/reopened sessions, lexical/context-aware exact statement matching,
semantic metadata corruption/loss, signed-64 serializer and IPC boundaries, physical
asset status and pinned-discovery collisions, idempotent compatibility declarations,
automatic FLAC discovery, more than 4096 retained terminal journals followed by a real
write, and later corrupt-record refusal. A behavioral DOM harness reorders bridge
responses and exercises supporting edits, cancellation, exact values, Flush, focus,
and unsubmitted-input truth. It also delays both successful and failed mutations while
requesting Flush, proving that no second Flush invalidates the mutation completion and
that failure restores value, controls and focus. It also proves the inverse: a mutation
cannot start during an active Flush, and a late status read cannot overwrite active
operation state. Same-project navigation during either operation must stay on the new
surface and refresh its persistence status after settlement. The packaged target probe
delays a supporting mutation, requires overlapping-Flush suppression, then performs
the later explicit Flush inside the real WebView. The target gate must exercise actual
imported assets in the pinned SDK with metadata removed from a disposable copy.
Core-only Linux results do not replace Windows reparse/macOS descriptor, desktop
package, or real WebView handler/DOM evidence. Corrective production run `34992890658`
at exact head `4f6fef7`,
tree `06b5609`, passed macOS ARM64 job `104461734419` and Windows x64 job
`104461734679`, including those official-SDK and packaged supporting-authoring gates.
PR #8 merged as `3487f7c`; post-merge repository-quality run `34995109520` and
production run `34995109499` passed. The latter passed macOS ARM64 job
`104469271124` and Windows x64 job `104469270622`. Package artifacts were correctly
omitted on the automatic push run; retained evidence artifacts are recorded in the
completed follow-up ledger.

## Phase 1E Scene authoring gate

Phase 1E keeps the same cost-scoped production matrix and adds explicit passed markers
for Scene authoring and media presentation to the official-SDK lifecycle fixture. The
fixture uses production services to migrate/reopen metadata, create and move Scenes,
author supported Beats and branching edges, exercise committed undo/redo, request
verified image/audio presentation, compile/lint with Ren'Py 8.5.3, and run the generated
project. A marker without successful fixture behavior is rejected by the workflow.

The packaged WebView probe exercises the actual Scene DOM and bridge: 52/48
Preview/Beats layout, provenance and partial-state indicators, keyboard reorder,
Dialogue Ctrl/Cmd+Enter, Choice Create New Scene, no selection-triggered audio,
explicit audition, safe confirmed recovery followed by revalidation, refused ambiguous
recovery, and conflict presentation. It must also retain the existing lifecycle,
supporting-authoring, delayed operation/Flush, WebView denial, and single-instance
checks.

The bounded 1F-SAVE correction adds a faithful fake Source service whose accepted text
is distinct from its retained draft, a retained Chromium regression for selection-only
updates after acceptance, and shell/controller DOM races for immediate Save, failed
retention and retry, duplicate command suppression, remount/stale completion, modal
focus, leave settlement, modifier/composition policy and authoritative status. Packaged
evidence records command route, synthetic versus target-native input, document
generation, completion, Source-save/Flush counts and final status. Synthetic DOM or
WebView keyboard dispatch does not certify Windows Ctrl+S or macOS Cmd+S delivery;
native input and the real-service disk/reopen target fixture remain separately named
acceptance rows.

Focused core coverage includes schema v1→v2 migration, stable identities and unknown
fields, exact-byte minimal Scene patches, protected opaque boundaries, incoming
reference refusal, source create/move/delete and exact `.rpyc` ghost prevention,
committed inverse revision boundaries, interrupted transaction classification,
safe/ambiguous recovery, bounded media formats/bytes/dimensions, stale session,
traversal, and symlink/reparse substitution. Renderer DOM tests cover all supported
Beat editors, drafts and navigation, focus restoration, preview provenance/unknown
truth, media cache cancellation/disposal, accessible reordering, responsive collapse,
and reduced motion. Exact final run/job/artifact results belong in the archived Phase
1E execution ledger after both supported targets pass.

## Phase 1F accepted regression contract

[Final closeout review](tasks/archive/2026-09-23-phase-1f-save-correction.md#729-final-phase-1f-closeout-review)
records exact current production evidence and preserves the earlier native Save passes.
Keep the frontend L1-L16, real-service Source tests, packaged P1/P2/P5 and separately
reported native P3 evidence distinct. A documentation-only delta does not imply a new
package or native execution.

Apply Both must bind confirmation to the displayed base/draft/external/combined text
identity in renderer and core, using the reviewed external revision as the transaction
precondition. Selection-only retention must refresh controls after cleanup for the
live document/latest input; failures, pending newer input and barriers still block.
Keep the retained DOM and real-browser regression in normal production gates. Test
literal renderer JSON through the real IPC/service boundary, including persistence
and reopening, so enum-field casing cannot silently invalidate all Scene operations.
Retain the actual Preview insertion-anchor and Background/Character state regressions.
A packaged probe must construct its terminal report on success and guarded failure;
lexical-scope/report errors must fail a retained full-probe test, not prompt timeout
increases or unsupported causal claims about application Save routing.

## Phase 1G testing ownership and cadence

**Phase 1G completion, 2026-10-06:** both-platform native/human review, required
qualification and exact-input integration are accepted in the
[closeout ledger](tasks/archive/2026-10-06-ui-design-review.md#phase-1g-integration-and-closeout--2026-10-06).
The staged completion sequence is historical. Phase 1H is accepted and integrated; its
integrated H01–H12 evidence belongs to the archived acceptance ledger. Apply the narrow human
reuse policy below; do not automatically repeat the accepted full human session.
Corrections invalidate affected results and require relevant cross-platform rechecks.

**Agent-owned Mac review amendment, 2026-10-05:** the user requested that the
agent perform the remaining objective tests and visual review, and report genuine
tooling limitations. Use the existing native UI controls and automated service/SDK
oracles; record agent observations separately from user acceptance. Native injected
keystrokes can prove OS delivery, but do not claim a human physically typed them.
User subjective review is optional feedback until a specific uncovered interaction
requires it. Keep genuine uncovered gates OPEN; do not waive them or manufacture
a human pass. This changes ownership, not assertions or Windows-host requirements.

**English support amendment, 2026-10-04:** the user selected English application
UI/support and standard-keyboard manual acceptance. Non-English IME/localisation
is outside the selected Phase 1 physical review; unavailable IME is not a blocker
or a claimed pass. Use English-named/content disposable projects on both targets.
Keep existing UTF-8/path preservation and composition regression tests.

**User decision, 2026-09-25:** no routine physical testing by the user during 1G build
checkpoints. Plan one focused final session on Windows x64 and macOS ARM64 after the
agent's automated gates pass. New Git work/testing is deferred to
[optional Git](tasks/active/optional-local-git.md); existing init remains a regression.
This section governs 1G and 1H test ownership over older unspecific native-gate wording.
It changes scheduling and evidence ownership, not correctness or platform requirements.

| Stage / gate | Owner and layer | Required evidence / human involvement |
| --- | --- | --- |
| Every changed checkpoint | Implementing agent: targeted core, renderer, literal IPC and relevant existing regressions | Assert changed contracts cheaply; no user physical testing |
| 1G.1 / G1 | Agent: real shared flow service plus rendered UI, limits and navigation tests | Production source/Scene edges and draft retention, not test-only edges; actual target WebView checks by final 1G closure |
| 1G.2a / R1 | Agent: real pinned SDK and child-process integration on both supported OSes | Early script-edit/reload/Stop/cleanup and asset-refusal/race proof before 1G.2b; a mock process is insufficient; no user physical testing |
| 1G.2b / R2 and final 1G | Agent: real-service packaged workflow on both targets, complete final supported-target gate | Visible controls through actual IPC/service/disk/reopen; real SDK failures, both authored routes and normal Run/Stop |
| Final 1G interaction acceptance | User: one prepared focused session per supported OS | Genuine native keyboard, focus/usability and visual review described below; agent prepares fixtures/instructions and collates results |
| 1H / H01-H12 | Agent: integrated automation and rendered-output review on final candidate | Reuse applicable final-1G human evidence; request only a specific uncovered or changed interaction |

Each new scenario must name its expected observation, test command, owner, platform,
layer (mock DOM, real browser, packaged WebView, real service, native input or human),
candidate and evidence path before implementation. Report PASS/FAIL/BLOCKED/SKIPPED
separately. Checkpoint review/selection is not a request to physically test software.
Missing automated target access is a blocked gate with an explicit host requirement;
do not silently turn the user's machines into a manual substitute or call Linux a
Windows/macOS pass. Agent-accessible local hosts may provide native evidence if the
exact toolchain/SDK/candidate/commands and results are retained; access is not assumed.

### Real-service and native-input coverage

The existing packaged authoring probe installs a mock requester and dispatches synthetic
DOM events. Keep it for rendering/race coverage. Add small named 1G scenarios through
real production IPC/services in an isolated synthetic project: graph destination edit
and reopened source; Validate failure and location; Run/Stop with captured revision.
Prove accepted bytes and outcomes. Extend literal renderer-JSON handler tests for all
new request variants, success/refusal and reopened state; Rust type-only or mock tests
cannot catch renderer/core casing mismatches. Reuse existing safe fixture/harness entry
points; no general renderer filesystem/process privilege or CSP relaxation.

Synthetic KeyboardEvent dispatch is not OS key delivery. Automated native input counts
only after the driver is proven to reach the packaged application on that target and
its evidence is labelled accurately; otherwise the small final human session owns that
remaining check. No new general desktop-automation platform is required for 1G.

### Supported-runtime responsiveness and diagnostic boundaries

Platform responsiveness claims require the packaged production frontend and real
IPC/service on that platform: WKWebView on macOS ARM64, WebView2 on Windows x64.
Chrome remains useful for portable frontend regression and browser diagnostics;
its timing alone cannot establish that the packaged application is slow or fast.
Record the exact hardware, physical/virtual host, OS/build, runtime version where
available, display/scale/refresh settings, foreground/focus state, candidate, package
and fixture hashes, toolchains and instrumentation. Mark unavailable identity fields
as unknown. Evidence from a physical Mac does not explain a virtual Mac's failure,
and macOS evidence does not qualify Windows.

Before a performance experiment, declare the hypothesis, workload, timer boundaries,
sample count, limits, build/launch allowance and stop rule. Retain all fixed samples,
nearest-rank p95, maximum, overruns, timeouts, functional failures and cleanup results.
Separate cold opening, steady interaction, refresh and accepted-edit measurements;
do not pool them. Use the ADR 0010 full fixture and unchanged budgets. A smaller
project may supply an additional usability baseline, never replace the full fixture.
Prefer ordinary untraced native measurements first; tracing or screenshots during a
series can perturb later samples. Collect visual evidence outside timing populations
and disclose any remaining instrumentation. No subtraction of idle/control time,
trimming outliers, retry-until-green or automatic allowance increase.

Name endpoints honestly. Dispatch-to-first-rAF measures callback availability after
synthetic input; a second rAF supplies another rendering opportunity. Neither proves
pixels reached the display, OS input latency, or perceived responsiveness. Verify the
intended graph transform, visible intersection, focus and full 500-node/2,000-edge
workload, and retain both intervals separately. Native WebView rAF evidence improves
runtime relevance but does not make this a physical-presentation timer. Report each
p95 against the unchanged <100 ms objective as a labelled proxy, separately from
observed usability; it does not redefine or alone close G1-V2. Genuine native-input
observations need a verified driver and visible results, and the final human session
remains separate. If a reliable presentation endpoint is unavailable, state the limit
instead of inventing one or claiming a complete end-to-end pass.

Investigate an overrun at its observed layer before changing production code. A new
bounded experiment must distinguish a concrete hypothesis; a failure is not permission
for indefinite browser/graphics tuning. Collect trustworthy supported-runtime evidence
before proposing a different role for a Chrome timing gate. The user explicitly
approved that change in [TEST-P2](tasks/archive/2026-10-06-phase-1g-branches-runtime-git.md#33-r2-p1-test-p2--chrome-timing-acceptance-role--2026-09-27)
after reviewing MAC-N1.
Historical failed runs remain failed; this prospective policy does not rerun them or
fill skipped gates. Preserve the original run, attempt, SHA and unavailable evidence.

The explicit packaged `branches-performance` probe uses the original 500-Scene /
2,000-edge source content plus empty `game/options.rpy`, `game/gui.rpy` and
`game/screens.rpy`, which ordinary lifecycle opening requires. This approved
inspection-only superset has **506 sources / 105,627 bytes**. The existing core
budget fixture remains **503 sources / 105,627 bytes**; report these populations
separately and do not claim exact fixture equivalence. `branches-interactive` prepares
the same disposable workload for the separately bounded native-input observation.
Neither case installs an SDK or runs game code. Default packaged runtime scenarios
are unchanged; select the performance case explicitly. The performance probe requires
a native-driver click on its Start control within 60 seconds, removes that control,
then waits a fixed five seconds before measurements and requires visible/focused
state. Finish AX/capture work before that settling interval ends; leave measurement
populations unobserved by capture/trace. App-driver attachment can create another
instance when multiple registered packages share an identifier: verify the exact
running fixture window, preserve targeting failures and audit process cleanup.

### Independent browser outcomes in the production workflow

The production workflow records Runtime and Branches browser steps separately. Only
these two steps defer failure with `continue-on-error`; the mandatory final browser
gate inspects their original `outcome`, not the success-normalized `conclusion`.
Both must be `success`. Failure, cancellation, skipped or missing results cannot pass.
This lets subsequent SDK, desktop and packaged checks run despite a browser failure,
while the overall production job and success-only installer upload remain blocked.
Other genuine prerequisite failures retain normal fail-fast step behavior. This is
bounded failure deferral, not a promise that every unrelated check survives every
kind of failure. Evidence upload still runs on failure. Workflow edits receive syntax
and outcome-path checks locally; no package matrix solely to verify this policy.
Chrome Branches timing now has a **diagnostic-only** acceptance role on both hosts.
Retain the strict <2,000 ms initial-layout and <100 ms synchronous-dispatch maximum,
original first-rAF p95, visible first-rAF p95 and visible second-rAF p95 thresholds.
An overrun retains `budgetStatus: "fail"`, the metric/value/limit entries, every raw
sample and a console/Actions warning, but alone does not fail the browser process.
Schema 3 `status` describes the blocking functional/evidence result; it is not a
platform performance verdict. The separate no-input population remains context only.
The diagnostic policy helper is hashed with the browser script in its source identity.

Full workload, geometry, visibility/focus, navigation, refresh, resize and page-error
assertions remain blocking, as do invalid evidence, timeouts, startup and cleanup
errors. The final workflow gate still requires both browser process outcomes to pass;
there is no blanket waiver of browser failures. Real-service/core timing gates retain
their acceptance role and thresholds. Packaged WKWebView/macOS and WebView2/Windows
measurements plus observed usability determine platform responsiveness under the
contract above; a browser diagnostic pass cannot substitute for them. The M4 native
result does not qualify Windows, all Macs or final human acceptance. No supported-
target acceptance is inferred from this edit; publication is not hosted validation.

### Final human session and narrow evidence reuse

Prepare one reproducible project and short expected-result checklist, aiming for roughly
15–20 minutes per platform (an estimate, not a substitute for completing required cases):

1. Navigate Scene/Source/Branches and change a mapped destination; check native keyboard
   operation, focus restoration and preservation of pending input.
2. Run the authored routes; edit/save scripts during play, observe earlier-launch status, Stop
   and rerun the latest saved work. The automated route oracle owns exhaustive outcomes.
3. Trigger one known SDK diagnostic and navigate to its current source safely.
4. Check ordinary resize/display scaling, relevant shortcuts, close/reopen and usability.

Asset mutation refusal, no-write/history assertions, launch-versus-import races and
retry after Stop are agent-run automated cases; live asset refresh is excluded.
No Git checkpoint case, crash injection, hostile configuration, exhaustive edge/race
matrix or repeat of the accepted 1F manual suite is assigned to the user. Automated
1F regressions remain. A changed Save/native-input path may justify a focused repeat;
name the change and affected interaction rather than reopening all earlier acceptance.
Manual screen-reader/signing/reputation limitations stay honestly recorded, not added
as an unplanned build-phase test matrix or claimed passes.

Record exact candidate, package hashes, OS/architecture, cases, results and limitations
for the final human session. 1H links those results instead of automatically requesting
a second broad session. On an identical candidate, reuse mapped human cases directly.
If the candidate changes, the agent records relevant code/test/workflow/dependency diffs
and an impact assessment for each reused interaction; missing or affected evidence stays
open and only that case is repeated. This is a narrow human-evidence policy, not a
cross-SHA automated package-check waiver. Final integrated automated 1H gates still run
as required. Neither a previous green status nor a docs-only amendment is new execution.

### Cost and harness discipline

Use targeted tests during development and early platform process tests at R1. Reserve
the full package matrix for the coherent final candidate, plus materially affected
corrections. Do not dispatch a full matrix for each checkpoint or documentation change.
Do not append every scenario to one smoke; report independent stages, monotonic timing,
cleanup outcomes and reliable terminal failure reports.

`production-scaffold.yml` is manual-dispatch-only; pushes to main, including workflow or
application changes, do not start package qualification. Each target still runs its own
functional gates. A failure-time evidence artifact retains the exact executable (the
macOS app bundle), digest, source/run identity and incomplete outcome for seven days,
after scanning the produced package for secrets. Its manifest distinguishes not built,
built-but-missing, available, and output produced during a failed package step. Installers
remain success-only. The scanned macOS bundle is retained as `Loomlight.app.tar` to
preserve executable permissions, symlinks and hidden bundle entries through artifact
upload. Verify both its recorded archive hash and the executable hash inside the tar;
extract the tar before launching a recovered package. This is not evidence reuse or a cross-SHA waiver, and does not
authorize a production dispatch during Q1-PREP.

## Required quality gate by change type

| Change | Minimum gate |
| --- | --- |
| Documentation/governance | Validator, link/privacy scan, `git diff --check` |
| Source model/serializer | Unit + golden + targeted fuzz + fixture SDK lint |
| Files/SDK/process | Unit + ordinary path/archive/conflict/non-crashing recovery tests + affected platform integration; deliberate crash/hostile-OS experiments only when explicitly scoped |
| Scene/file lifecycle | Reference checks + transaction/recovery + stale `.rpyc` cleanup + SDK lint/run |
| UI workflow | Unit/component + keyboard/accessibility + changed-path desktop E2E + visual-token conformance |
| Generated Ren'Py | Official pinned SDK compile + lint + relevant automated test + standard-template smoke |
| Packaging/release | Windows/macOS package, install/launch smoke, contents/privacy scan |
| LLM adapter/action (Phase 2+) | Schema/adversarial tests, locality/consent UI, diff/partial acceptance, no-network default |

## Result recording

Spike and CI results record exact command, OS/architecture, dependency and SDK
versions, fixture revision, outcome, timings where relevant, and known exclusions. A
green Linux-only test cannot close a Windows/macOS criterion. Flaky tests are defects
to isolate and fix, not gates to retry indefinitely.

## Initial performance hypotheses

Phase 0 established initial bounded evidence; production Phase 1 should remeasure where
the real implementation could materially differ. Starting targets to test, rather than
silently assume, are visible edit feedback within 100 ms, incremental source mapping
within 250 ms for a typical Scene file, responsive pan/filter at the declared production graph limit (1G initially 500 Scenes /
2,000 flow edges; 10,000-node virtualization remains later scope), and no UI-thread blocking
during SDK or Git operations.


## Scene JSON boundary regression

Scene UI mocks and typed Rust service calls do not validate the renderer/core wire
contract. Keep literal camelCase request coverage for every `SceneCommand` variant
and exact serialization coverage for every `BeatPayload` variant. Enum variant
renaming and variant-field renaming are separate Serde settings. Exercise starting
narration update and Beat insertion through `handle_application_request` with a real
lifecycle/project, verify accepted bytes and reopened projection, and retain refusal
checks for stale revisions and malformed payloads. These tests run in the normal core
suite on both packaged targets. Synthetic UI routing still does not replace native
keyboard acceptance.

## Retained 1G.1 development evidence

The archived [1G ledger](tasks/archive/2026-10-06-phase-1g-branches-runtime-git.md#12-1g1-execution-ledger)
records candidate, exact results and deferred supported-target evidence. Retained cases
live in `scene.rs` (`flow_*`), `lifecycle.rs` (literal `flow.list` and existing Scene
commands through the real handler), `source.rs` (revision-qualified navigation),
`branches.dom.test.ts` and the existing shell Save/navigation regression.

Run from `app/`: `cargo test -p loomlight-core --locked flow`, `npm run check`, and
`npm run test:source-browser`. For the unchanged budget workload, set
`LOOMLIGHT_FLOW_EVIDENCE` to an agent-owned temporary JSON path and run
`cargo test --release -p loomlight-core --locked flow_observed_budget_fixture -- --nocapture`;
then run `node tests/branches.browser.mjs` with the same variable. The latter requires
500 Scenes / 2,000 edges produced by the actual service, reports build/layout and
synthetic pan/frame timing, checks 640px resize and verifies origin editing navigation.
Optional `LOOMLIGHT_BRANCHES_SCREENSHOT` records the rendered review surface. A small
subview of the same fixture is used only for the screenshot, after full-scale assertions.

Browser scripts accept optional `LOOMLIGHT_BROWSER_EXECUTABLE` for an already installed
Chromium. Record its actual version: this is a development browser, not proof of the
packaged Windows/macOS WebView or OS-native key delivery. No browser binary, SDK,
measurement output or absolute machine path belongs in Git. Final 1G still owns the
real packaged graph edit/disk/reopen scenario and both supported-target measurements.


### Branches timing interpretation

The browser probe retains the original 30 one-way inputs and nearest-rank p95
<100 ms diagnostic threshold under the **dispatch-to-first-rAF continuation** name (legacy
`panFrame*` output fields remain aliases). That path moves the fitted graph offscreen;
it is historical comparison, not sustained visible-pan coverage. A separate fixed
30-input sequence alternates ArrowLeft/ArrowRight at fitted x=40/0. Every input must
change the transform, retain 500 nodes/2,000 paths, stay visible/focused and maintain
positive clipped graph/representative-node intersection. Representative IDs, positions,
dimensions and viewport geometry are checked outside the timing interval.

The visible sequence reports both first-rAF and **next-advancing-rAF rendering-opportunity**
intervals against the unchanged <100 ms p95 objective; initial layout remains <2 s.
The second endpoint requires a timestamp strictly greater than the first. Equal
timestamps are retained and awaited for at most eight further callbacks, including
all elapsed wait time in the same input sample. Backward/malformed or exhausted
sequences still fail; no input is replayed or discarded. Ordinarily this is the
second callback. The original two-callback endpoint and failures remain historical
evidence; changed probe identities must qualify again on both targets.
Neither callback proves physical presentation. Rendering opportunities can include
previous browser work. Under TEST-P2 all five Chrome timing thresholds are diagnostic;
functional/evidence failures still block. Fast dispatch does not erase an overrun or
close packaged/native rendered-input acceptance. Review the endpoint/layer evidence.
The separate core <250 ms/<2 s budgets are unchanged and not measured by this probe.
[MAC-D1 ledger 28](tasks/archive/2026-10-06-phase-1g-branches-runtime-git.md#28-r2-p1-mac-d1-macos-frame-budget-diagnosisreview--2026-09-27)
retains the original defect/failure; [MAC-M1 ledger 29](tasks/archive/2026-10-06-phase-1g-branches-runtime-git.md#29-r2-p1-mac-m1-probe-correction-and-local-proof--2026-09-27)
records the correction and fixed local proof, not retrospective CI qualification.

Set `LOOMLIGHT_BRANCHES_EVIDENCE_DIR` to an ignored output directory to save the full
report and two clipped frame captures, taken after visible inputs 0 and 1. Captures
are outside timing, retain the graph's transform and can perturb subsequent browser
work; their wall time is recorded, never subtracted. They prove the two rendered
states separately, not that either state was physically presented at the timer endpoint.
Set `LOOMLIGHT_BRANCHES_TRACE=1` as well for bounded Chromium rendering/GPU/User Timing
and screenshot trace output plus a fixed 30-sample no-input control after Fit. There
is no warm-up or sample trimming. All sequences use per-sample CDP calls; the control
also reads geometry, but omits the two explicit captures. Fit can leave graphics work
pending, so this is not a pure idle-host benchmark. A 60-second page deadline bounds
the run; `finally` attempts trace saving and both cleanups independently, retaining
partial samples and errors on failure. Abrupt process/browser loss can still prevent
trace recovery and must be reported as missing evidence.

Reports retain ordered page-clock boundaries, raw distributions, browser/GPU mode,
focus/visibility, Node/Playwright/runner identity, Git base and exact fixture/source
SHA-256s. Trace start/stop overhead is recorded separately. Compare traced/untraced
fixed launches without pooling or subtracting scheduler/instrumentation time; their
difference is not an isolated estimate of trace overhead. No automatic retry or tool
installation follows from a failure. Browser results remain separate from native
WebView, supported-runner and human acceptance. Attribute stalls using trace brackets
before choosing a renderer or environment correction; lack of reproduction cannot
waive historical failed/skipped gates.

For an explicitly approved hosted diagnostic, `quality.yml` provides the manual
`phase1g_macos_browser_diagnostic=true` selector. Keep `phase1g_flow_profile=false`
and `phase1g_candidate_proof=false`; conflicting selection fails before tool setup.
Only one `macos-26` job runs. It uses existing pinned Node/npm/locked dependencies and
the runner's installed Chrome, verifies archived R2-P1 artifact 10923840024 and its
exact service fixture, and launches this probe once with tracing. There is no core,
SDK or package build, broad suite, Windows job or automatic retry. This fixture reuse
is diagnostic input reuse, not acceptance reuse; an expired/unavailable artifact is
a blocker, never permission to substitute a new workload silently. The artifact
`r2-p1-macos-browser-diagnostic` retains report, trace, captures, identity, cleanup audit
and a SHA-256 inventory for seven days, including on failure. Job timeout is ten
minutes; the probe retains its 60-second page deadline and all measurement budgets.
Missing reports/traces/cleanup evidence fail the audit. A hosted pass does not accept
the historical run, core budgets, native WebView or final packages. Ledger 30 owns the
approved single dispatch and result; no continuing authorization follows from this
workflow selector. Follow the repository manual-resume rule while external CI runs.

The historical H1 trace reproduced both long GPU command-scheduling waits and late
BeginFrame delivery, including >100 ms controls with no new input or recorded
layout/paint/raster work. See ledger 30 for exact samples and causal limits. Inspect
ledger 32's completed native assessment and ledger 33's timing decision before any
new hypothesis. H1 remains FAIL; neither idle-time subtraction nor an unverified
browser/backend flag is a correction. Its one-dispatch allowance is consumed, and
the old proposed controls/reruns are historical, not the next routine task. No new
renderer optimization follows from Chrome timing alone. Keep physical presentation,
hosted Chromium and packaged WebView evidence distinct.

### 1G.2b named packaged scenarios

The minimal SDK runtime probe fixture supplies `config.quit_action = Quit(confirm=False)`
because it intentionally has no confirmation screen. Ordinary editor-owned Stop must
reach the retained Cancelled/cleanup assertions rather than fail in the SDK's fallback
quit layout. Production generated-game quit behavior and runtime error reporting are
unchanged; do not suppress diagnostics or loosen Stop assertions to compensate.

The existing production workflow now includes the explicit R1 SDK service and R2
compile/lint navigation tests, plus five independent real-service package cases:
`compile`, `lint`, `route-a`, `route-b`, and `runtime-error`. The native-only fixture
setup creates a fresh synthetic project before opening the UI. The injected driver
uses visible runtime/Source/Branches controls and the real requester; it never installs
the older mock smoke requester. Compile/lint select their actual Unicode/BOM/CRLF
failing line. Route cases edit/restore a destination, assert selected dialogue/state/
asset, assert exactly two choice edges and verify the changed destination source
text/revision plus graph after project close/reopen before restoring routes. During play,
they save a script, observe staleness, and measure at least 9.5 seconds from observed
route output plus Running state before Stop; preparation/trust time is excluded.
The case report records `runningObservedMs`. Accepted script bytes are checked again
on reopen after Stop. The 640px route-b case also retains an invalid
mapped draft through Cancel and refused Save All, then deliberately runs the saved
revision. Runtime failure remains separate.

`app/scripts/run-runtime-ui-probes.py` records each case, elapsed time, process exit,
timeout and cleanup result. Failure in one case does not hide later cases. The existing
legacy boundary smoke remains independently reported. Evidence includes every case log
and JSON, exact Git inputs/target/executable digest, core/SDK logs and package artifacts
when requested. Both supported targets must pass on the coherent candidate. No
native-keyboard or human acceptance claim is inferred from synthetic DOM events.

The final 1G close regression holds a saved-state read while Close Project is selected,
rejects premature shared-service dispatch and requires exactly one close after release.
Packaged route drivers report close-after-Stop request/completion separately before
reopen; failed reports retain Welcome/recent/button/modal state. The standalone runtime
browser expands the initially collapsed diagnostic disclosure before checking its
visible navigation control, then retains its focus/1100px/640px overflow checks.

### Observed-flow qualification

The production workflow and the bounded `quality.yml` flow-profile dispatch select
`scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges` with
`LOOMLIGHT_ENFORCE_FLOW_BUDGETS=1`. The test creates three independent fixed fixtures,
asserts 503 sources / 105,627 bytes / 500 Scenes / 2,000 edges, and measures initial
and explicit refresh (<2 s each) separately from accepted update (<250 ms). The
accepted timer starts at the production wrapper's successful transaction return,
before invalidation, and includes history and production observed projection. It
asserts the changed caption and completed/saved-edit statuses. No IPC, transaction
duration or rendering latency is inferred from this timer. Completion marker:
`phase-1g-observed-budget-gate: passed (3 samples)`.

The bounded dispatch is intended to run ordinary core/UI regressions and Chromium rendering on
Windows x64/macOS ARM64 without packaging or SDK download. The browser's 30 pan
samples run while a refresh response is deliberately pending; navigation remains
usable. Chromium/synthetic events do not replace final packaged WebView/native input
acceptance. Historical full-verification timings keep their original failures.
Both broad-core selectors now apply the same three exclusions. Production and quality
run the exact observed-budget fixture separately with enforcement enabled, so its three
fixed samples run once per target rather than again inside broad core.

Retain the real 500-Scene/2,000-edge workload, rendered 30-sample interaction check,
ordinary external changes (including same-length content edits and normal file
replacement), additions/deletions, metadata invalidation, Source draft/caret, session
cancellation and resource-bound tests. Explicit Refresh reads current content even
if timestamps are unchanged. A completed display observation is allowed to age
until the next trigger; deliberately timed namespace attacks are not display gates.
No native-open microbenchmark or full corrected ADR 0009 candidate is a prerequisite.

R1's old automatic branch trigger is retired into this combined final gate; explicit
manual R1 dispatch remains available for bounded future corrections. Final production
verification is manually dispatched once on the implementation branch. The production
workflow has no automatic main-push trigger; no cross-SHA/pre/post-merge reuse is claimed.
Integration and its run strategy require separate authorisation.


## UI refresh verification

The 2026-09-30 refresh adds CodeMirror, both accepted palettes, native progress and
batch/drop staging. `npm run test:source-browser` now includes
`tests/ui-refresh.browser.mjs`: all six workspaces in both themes, onboarding/Settings,
1440p and compact/laptop captures, interface sizes, fixed status/editor geometry and
exact mixed-newline edit/undo/redo. It executes the shipped smoke interactions against
real CodeMirror DOM with a stubbed desktop boundary. This is a driver/renderer check,
not native security, physical keyboard/IME, drop or SDK-download evidence.

The same preflight also runs `tests/native-runtime-driver.browser.mjs` against the
shipped compile/lint/route-a/route-b/runtime-error scripts and real application DOM
at the packaged viewports (640×720 for route-b; 1100×720 otherwise). Its strict fixture
models service responses and output sequence changes, injects temporary busy read
refusals and a 150 ms Beat commit receipt delay, and rejects unknown operations
and hidden/disabled synthetic clicks. It catches dated-recent selectors, optional
panel/form access, CodeMirror selection synchronization and reopen readiness before
packaging. `ui-refresh.browser.mjs` also executes the shipped UI refresh probe with
busy observations and a 1200 ms initial Story read. A separate early-navigation
regression switches to Source while that read is held and asserts the application
queues its Source request without contention. Commit drivers wait for the accepted
form receipt; debounced status copy is not an operation-completion signal. Native
UI-refresh waits for the rendered draft inventory to acknowledge retention before
its direct IPC observation; the draft warning alone also covers unretained input.
`tests/ui-refresh-retention.browser.mjs` reproduces the original probe read/write
collision, proves exact input retention with the corrected ordering, and rejects a
genuine refused write without polling the backend. The original backend dirty-count
assertion and shared 20-second retention deadline remain required. These fixture controls do
not close a native target failure; a changed packaged probe requires renewed evidence.
UI-refresh reports distinguish opening/Story/Source stages and retain bounded failure
state. The smoke path rejects unavailable clicks. Unit checks retain an
ambiguous-prefix negative selector case, non-busy rejection and busy-deadline failure.
These tests establish driver compatibility only: fixture persistence, runtime output,
consent and close results are not native service/SDK/security acceptance. The real
packaged gates and all rejecting assertions remain required. Optional native Branches
performance probes are not selected or revived by this compatibility audit.

Frontend tests retain rejecting Save/conflict/selection assertions and add staged
import cancellation/partial-failure, dialogue composition/commit ownership, and
ordered progress/unknown-total/failure checks through the actual frontend channel
handler. Core tests cover bounded preferences, atomic preference persistence, scoped
progress, and written-byte download accounting. The two official archive-backed SDK
gates remain separate from routine core selection; no specialist exercises are added.

The runner, report validator and package-evidence manifest share the six required
cases in `scripts/runtime_probe_cases.py`; missing/failed UI-refresh evidence is
explicitly rejected and retained. The existing packaged runtime runner selects
`ui-refresh`, using a
disposable profile to require native CSP styling, real draft IPC, status geometry,
Settings return and preference round-trip/cleanup. Its editor input is explicitly
synthetic. No second qualification matrix or new testing orchestrator is introduced.
Current exact counts, failed attempts, native capability gaps and remaining human
acceptance are recorded in the UI task and HANDOVER, not inferred from screenshots.

## Hands-on UI correction regressions

Held Beat edge scrolling must use the actual `.beats-region` scroll owner and visible
list bounds below its sticky toolbar, not the full-height non-scrolling inner list.
Retain the regression for continued down/up scrolling with a stationary pointer,
outside/toolbar refusal, Escape frame/marker cleanup and zero cancellation writes.
A focused shipped-CSS browser fixture can discriminate container/geometry failures;
physical WebView2 holding still requires the target-machine retest.

The final Windows review adds rejecting DOM regressions for two observed defects:
simultaneous Story canvas/thumbnail displays must retain live object URLs until view
disposal, and acknowledged Source input must update the sidebar dirty count and
UTF-8 byte total through repeated edits/undo without saving or moving editor focus.
Native checks additionally compare all saved project files before/after draft Undo
and import staging cancellation. Keep packaged probe diagnostics bounded and scoped
to the calls actually instrumented; their timings are not application UI-operation
timings. Single-instance forwarding with zero intended reports must remain a failed
runner result even if the process exits zero. Passing native synthetic-input probes
do not establish held-pointer or Explorer cross-window drag acceptance.

The 2026-10-02 review corrections extend the existing suites rather than selecting a
new package matrix. `npm run check` includes modal cancellation/staging preservation,
whole-row selection, composition-safe names, single-confirmation Beat insertion and
runtime-error/close semantics. `node app/tests/ui-refresh.browser.mjs` additionally
rejects unavailable control clicks and verifies independent sidebar restoration,
Chapter disclosure, Choice form bounds, repeatable modal dismissal, fixed categories,
Source tab overflow/reveal and both palettes/minimum layouts. Its fake bridge is not
physical IME, OS file-drop, native WebView, SDK or security acceptance.

`cargo test -p loomlight-core --locked review_` selects the saved-route/screen-label,
Beat reorder/history/protected/stale, Appearance name/image/reference and exact-token
regressions, alongside an existing Apply Both review test. The routine core selector
and separately enforced observed-flow fixture remain the broad qualification policy.
The existing authoring IPC test also rejects renderer paths in `appearance.update`.
Desktop tests/check compile the native drag-state presentation bridge. Exact evidence
and installer/native limits belong in the active UI task and HANDOVER.

The Windows review's selected-media regressions cover ordinary content changes
between selection and explicit Import or image replacement, including same-size
changes. Refusal must precede transaction staging: accepted metadata/source and
recovery entries stay unchanged, the project remains Saved, and explicit reselection
can succeed on the same project. Streaming retains its final content/identity checks.
Select these with `cargo test -p loomlight-core --locked review_selected_media_change`;
native staging/partial-import recovery still requires the affected packaged check.

The 2026-10-03 audit regressions also require grouped Choice actions at compact widths,
Variable discard/reopen across all three types with a truthful subsequent Boolean
submission, retained appearance selection after save/default/view changes, sidebar
focus/semantics, shared divider reset, pending Beat controls and saved-row focus,
media loading/error/retry, and real Chrome pointer capture/reorder/cancellation.
The release core appearance test includes reuse of former expressions and rejecting
custom collisions/externally edited aliases while preserving bytes and IDs.
The originally deferred Windows native testing subsequently completed; final results
and limitations are in the archived review ledger. The specific gestures, expected
results and evidence fields remain in the
[historical Windows checklist](tasks/archive/2026-10-06-ui-design-review.md#deferred-windows-review-checklist--2026-10-03).
Browser mouse events and fake native drag-state signals do not satisfy those rows.

Final 1G Branches qualification also rejects font-dependent pill clipping in the real
browser at three widths/both palettes, including a wider English font and a truncated
long caption. Routing checks use measured widths for label/channel separation and Fit
bounds. Packaged route-a/route-b reports assert actual native SVG text width plus
padding and fitted pill bounds; synthetic selection remains distinct from native input.

## Bounded nested-dialogue foundation

Use `cargo test -p loomlight-core --locked source_foundation` for focused production
dispatch/minimal-byte/ownership, migration/history/reopen, dirty draft, external writer,
stale session, identical sibling and unsupported-body regressions. The SDK test is
explicitly ignored here; this command alone never establishes SDK acceptance. Select
`renpy::tests::source_foundation::source_foundation_bool_sdk_gate` with `--ignored
--exact --nocapture` and `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` for verified archive install,
compile/lint and normal-entry true/false/reject-wrong-outcome cases. Missing archive
is a failure. `npm run check` retains child-owner dispatch/draft/keyboard assertions.

The existing runtime UI runner accepts optional `source-foundation` to run just the
disposable one-Scene native fixture. It exercises actual Story commit, exact source,
ID preservation, Undo/Redo/reopen, wrong-owner refusal and retained Story/Source drafts.
Synthetic DOM input is distinct from physical native keyboard/human acceptance. No
production matrix or specialist exercise is selected by this case. A supported-target
proof remains necessary on both Windows x64 and macOS ARM64; current allowance/results
belong in the [owning ledger](tasks/active/phase-2-initial-llm-assistance.md#23-source-foundation-implementation-ledger--2026-10-07).
