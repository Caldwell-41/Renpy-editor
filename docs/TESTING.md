# Testing strategy

## Current production scaffold and Phase 0 regression commands

From `app/`, the Phase 1A production checks are:

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

The Phase 1C durability/race correction adds
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
| Desktop E2E | Project create/save/close/reopen, Scene edit, source sync, external conflict, preview/run, Git checkpoint |
| Cross-platform | Windows and macOS file watching, paths, subprocesses, credential store, package/install/launch |
| Security/privacy | IPC denial, traversal/symlinks, hostile projects, redacted logs, fixture/package PII scan |
| Performance | Large scripts/assets/graphs, incremental parse, patch latency, preview responsiveness, memory budgets |

Phase 2 LLM-specific schema/adversarial/context/consent tests are intentionally not a
Phase 1 Desktop E2E requirement.

## Phase 1 milestone gates

The implementation sequence in
[`tasks/active/phase-1-vertical-slice.md`](tasks/active/phase-1-vertical-slice.md) is
quality-gated rather than one large feature branch:

| Milestone | Minimum evidence before proceeding |
| --- | --- |
| 1A scaffold | Locked fresh install/build/test; command/capability denial; CSP/navigation/network/ambient host denial; privacy/licence checks; packaged Windows x64/macOS ARM64 smoke; semantic theme tokens/reduced-motion foundation |
| 1B transactions | External-writer races, stale revisions, path/file/recovery identity and symlink substitution, crash-point recovery, durability semantics, undo/redo conflict boundaries on both targets |
| 1C project lifecycle | New-project staging/failure cleanup; parent/stage child-process and promotion races; restart-safe verified SDK installation/provenance; crash-safe Recent Projects; detected/install/browse SDK; conventional Ren'Py template paths and standard GUI; create/validate/close/reopen; game runs without `.renpy-editor/` |
| 1D authoring models | Character/appearance, copied image/audio assets, automatic-discovery naming collisions, basic variables, source round-trip/reload identity |
| 1E Scene | Bounded Beat workflow, preview/partial state, choice linking, Story tree file lifecycle, stale `.rpyc` cleanup/ghost-script regression, undo/redo, accessibility, Quiet Studio Dark conformance |
| 1F Source | Partial CST/range mapping, no-op/minimal-patch golden tests, direct source→Scene sync, exact custom-code preservation, external conflicts |
| 1G completion | Branch graph from shared edges, authoritative SDK diagnostics/run, local Git status/diff/checkpoint, technical-surface design consistency |
| 1H acceptance | Fresh end-to-end Windows/macOS create→author→save→close→reopen→validate→run→Git workflow plus transaction, source, privacy/security, packaged app, accessibility, and visual-system gates |

A green result from one platform cannot close a cross-platform milestone. Failed and
flaky runs remain evidence; isolate and fix defects rather than retrying until green.

The Phase 1B core suite launches a child copy of the Rust test process and exits it at
prepared, staged, commit-intent, exchanged, verified, committed, and durable journal
boundaries. A fresh service then classifies the retained state. In-process hooks
deterministically race external content/identity/path changes before and after the
platform operation. The latest suite also proves recovery-directory namespace
substitution cannot convert unresolved recovery into an empty successful scan. The
production Windows/macOS matrix runs the same platform-appropriate suite in release
mode and retains its log with the existing packaged-boundary and dependency evidence;
it is not duplicated in a second expensive matrix.

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

## Required quality gate by change type

| Change | Minimum gate |
| --- | --- |
| Documentation/governance | Validator, link/privacy scan, `git diff --check` |
| Source model/serializer | Unit + golden + targeted fuzz + fixture SDK lint |
| Files/SDK/process | Unit + hostile-path/archive/transaction tests + platform integration |
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
within 250 ms for a typical Scene file, responsive pan/filter on a 10,000-node graph
through virtualization where that graph work is in scope, and no UI-thread blocking
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
