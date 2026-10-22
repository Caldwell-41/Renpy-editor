# Owned blank-screen evidence

Owning work ticket: [L01 #34](https://github.com/Caldwell-41/Renpy-editor/issues/34).
Observation period starts 2026-10-22. Baseline `867528d`, Mac ARM64 sole writer,
branch `codex/phase3b-screen-designer`. The issue owns selection, finite cumulative
allowance and bounded acceptance. This file records detailed results, not a second brief.
Existing documentation/instruction edits and protected native recovery are preserved.

## Implemented path and limits

Choose opens a named blank-screen dialog. Accepted creation adds one owned file and
screen/root UUIDs through shared transactions/history. The created root opens its
exact Source range. Source body edits and byte-offset shifts retain ownership;
rename, deletion, ambiguous markers/declarations and malformed Source remain explicit
unresolved references. Older maps migrate to v6 without adopting existing screens.
The [data contract](../../DATA_MODEL.md#project-lifecycle-metadata) owns persistence.

The design reference remains flow-v1 at `3c7ea31`. The new dialog follows its modal
pattern. Existing editor-layout differences and the separate canvas-rendering gate
remain unaccepted. No child-node authoring, Help starter, Story connection or canvas
architecture is included.

## Local evidence and original failures

Ignored receipts are under `.toolchains/owned-screen/`. Public fixture data only.
Node 24.19.0, Cargo/Rust 1.90.0, TypeScript 7.0.2; Python 3.9.6 was initially on PATH,
then the existing bundled Python 3.12.14 was selected for checks requiring `tomllib`.

- Core TDD first refused `screens.list` as not allowlisted. The creation/history/reopen
  test passed after adding typed catalog/create dispatch and source-map v6 ownership.
- The reconciliation test then exposed a catalog error on malformed source. The
  correction retains the UUID as unresolved and refuses creation with an incomplete
  collision inventory. The initial eight focused Screens tests pass, including the existing Help
  transaction/source cases, collision/dirty/stale refusals and migration/reopen.
- `browser-01`, `browser-02` and the final browser run exercise eight real
  renderer/ApplicationHost/core groups. `help-regression-01` passes all 11 existing
  Help groups. These prove production renderer/core behavior, with synthetic browser
  input; they do not establish native WebView or physical keyboard delivery.
- The exact packaged controller passes browser rehearsals in `probe-controller-01`
  through `probe-controller-03`. The Python gate rejects incomplete stages, wrong
  identities, false native claims and missing cleanup.
- SDK attempt 1 (`sdk-01`) compiled/linted and rendered the exact browser-created
  blank source, returning 1280.0 by 720.0 and a PNG. A test assertion compared JSON
  integer and floating-point number representations and failed before the explicit
  Stop/terminal-cleanup assertions. Retain that failure. A process-name check found
  no remaining SDK/app process after test teardown.
- SDK attempt 2 (`sdk-02`) corrects that numeric assertion. The release-mode exact
  test passes compile/lint, actual ordinary-game-context blank render, PNG capture,
  explicit Stop, terminal diagnostics, unchanged accepted source, no source bytecode
  or saves, and removal of scratch jobs after process cleanup. It consumes two SDK
  operations. The verified official archive hash is
  `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`,
  matching the retained published Ren'Py 8.5.3 checksum metadata.
- The first package invocation supplied a wrong public certificate selector and
  failed the repository pin check before building. It stays charged. The corrected
  invocation reads the policy's exact selector and passes ARM64 bundle/signature and
  read-only DMG-content verification in `mac-package-02`. No signing or Keychain
  policy changed. Executable SHA256 is
  `fe76f994c1c7e1859a59c74c587a8090a2043e7857eca983b3107cfd341161c8`;
  DMG SHA256 is `769c3a7992cbbac3587891df33acfd3f14bc4d86720db06b398e066208a63c09`.
- The first full frontend run passed 218/220. Its failures were the expected-operation
  fixture missing the two selected operations and a validator launched with Python
  3.9 lacking `tomllib`. Update the protocol fixture and select existing Python 3.12.
- The first broad core attempt ran inside the filesystem sandbox. Its controlled
  loopback listeners failed with `Operation not permitted`; stop that owned attempt
  and retain its log. The replacement run uses the required local socket permission.
  Neither failed run is a pass.

## Acceptance map and pending proof

| Criterion | Evidence and state |
| --- | --- |
| One collision-checked definition/transaction/history entry; Cancel and refusal do not write | Focused IPC tests, real eight-group renderer/core run and existing 11-group Help regression pass. |
| Metadata-only migration, extras/source preservation, no-op reopen, newer-schema refusal | Focused IPC migration and reopen tests pass. |
| Source edits/offsets reconcile; rename/deletion/ambiguity stays unresolved | Focused IPC tests and real Source Save/browser path pass. |
| Actual Choose/core/Source/history/reopen | Browser production path and packaged-controller rehearsal pass. Current signed Mac package passes; its native run needs an unlocked desktop. Windows native proof awaits dispatch 1 below. |
| Deliberate preview of created screen | Exact browser-accepted source passes actual pinned SDK proof on Mac. Windows SDK proof remains pending. |
| Retain revision-bound Help behavior | Existing focused core and 11-group real renderer/core regression pass. Earlier unchanged native/SDK Help evidence remains scoped to its accepted candidate. |
| Whole editor/canvas visual acceptance | Pending under later owners; L01 does not waive those gates. |

The prepared existing Screens workflow selects `owned_blank=true` with exact
candidate/ordinal. It runs affected frontend/core/controller checks on Windows x64
and Mac ARM64, plus the missing Windows SDK and packaged WebView proof. Mac uses its
local signed package and SDK evidence, avoiding another SDK launch. Publication and
dispatch were pending at the original local checkpoint. The approved dispatch is recorded below.


## Independent review and corrections

The initial review compares `867528d...da2f8d3`. Two independent read-only reviewers
checked Standards and Spec. Follow-ups compare `da2f8d3...d43edfe`, then the final
namespace correction at `6be4f24`.

### Standards

The initial reviewer found one P2 breach of the dirty-buffer/external-edit contract.
An unowned Source file could retain a dirty draft after external deletion; checking
only present inventory paths let creation write at that missing destination.
The destination now participates explicitly in the clean-buffer check. Its regression
proves refusal, retained input, absent destination and unchanged metadata.
The independent follow-up reports zero remaining documented-standard breaches and
zero baseline smell findings.

### Spec

The initial reviewer found three P2 defects against the ticket's collision, preview
and never-retarget requirements. Static collision inspection missed continued,
init-prefixed and explicit-version screen declarations. Private double-underscore
creation names used a different runtime name in the scratch helper. Separate catalog
and inspection reads could display a different declaration under the original owned
UUID. The corrections recognize those headers, refuse private/portable reserved names
and require the catalog's exact source revision and name before showing an owned tree.
Unavailable inspection also retains an explicit unresolved reference.

The first follow-up closed those three defects but found one remaining P2 collision
through Ren'Py's filename-mangled `_m1_` namespace. The final correction reserves that
namespace and bounds nested init-prefix recognition. Its exact IPC regression failed
before the guard and passes after it. The last independent follow-up at `6be4f24`
reports zero remaining actionable Spec code defects. Native/Windows qualification
remains a pending-proof group; no scope additions were found.

Final focused proof is 10/10 Screens tests and 10/10 Screens UI tests, including
three catalog/inspection race cases. The final complete frontend suite passes
223/223. Production browser/controller runs pass after the revision-binding fixes.
The first non-sandboxed broad core run passed 398 cases and failed one historical
migration assertion that still expected schema 5. That assertion now expects the
current schema, and its exact test passes. The final coherent-candidate broad-core
run is recorded below.

## Package ceiling at the original local checkpoint

Mac package attempt 3 uses the single original contingency and passes signing and
installer checks at `d43edfe`. Executable SHA256 is
`0bea54c59628ac8d443ae67c4df3157248968598500ee1f997d0119f03d72823`;
DMG SHA256 is `d0336f536409f150a6e03c7cd56a31534064366397d5183d297e82bc24b9c659`.
It predates the final namespace guard and does not qualify `6be4f24`.
No fourth package is attempted or authorized. A current signed build/native run
requires explicit approval beyond the consumed package ceiling, plus an unlocked
desktop. The earlier unlock request did not receive an answer during implementation.
No unrelated draft/window was opened, closed, discarded or reloaded.

The implementation is committed locally in `da2f8d3`, `d43edfe` and `6be4f24`.
No push, remote CI, PR, merge or release occurred. Publication of these concrete
commits and the prepared focused CI route needs authorization. Keep L01 open.
The current package and Windows evidence gaps prevent acceptance/closure even
though both independent code-review axes have no remaining code findings.


## Final local result and retained candidate

Code candidate `6be4f24` passes 401 routine core tests, with zero failures, 45
intentionally ignored SDK/specialist cases and three documented broad-run exclusions.
The final exact executable is retained privately with SHA256 `bdcb7e3388d225bd32461f51dc332b9dfbb5627ca1100108697907b4d90236a6`.
The SDK case above was explicitly selected and passed separately; ignored cases are
not claimed as passes. The earlier pre-namespace broad run also passed 401/0, and all
original failed/sandboxed runs remain retained. No code changed during the final run.

The frontend passes 223/223, typechecking passes, final real renderer/core creation
passes eight groups, the exact packaged controller rehearsal passes, and the retained
Help renderer/core regression passes 11 groups against the final driver. Six focused
Python evidence-gate tests, workflow actionlint, repository validation and whitespace
checks pass. The actual Mac SDK source SHA256 is
`ff94e44deb297d5e75a86070dbf790fff0432c70fb5b7c098d920c94833cabf9`;
validation exits 0 and explicit Stop ends the run in cancelled phase with exit 0,
complete cleanup and no error diagnostics. That unchanged generated public-name
source/runtime path remains qualified; the final changes add creation refusals and
revision binding, with no scratch-preview implementation changes.

Visual finding: the unresolved-state captures remain readable at wide/compact light
and dark sizes without page overflow. The blank SDK capture is blank as expected.
The new creation dialog follows the modal pattern, but this task does not claim a
full flow-v1 layout match or canvas agreement. Functional finding: the named portable
creation/ownership/Source/history/reopen operations pass. Current-package native and
Windows proof remain missing, so the task is not accepted or closed.

Final cumulative use is 18/18 local batches, CI 0/2; Mac package attempts 3/3 at the
absolute ceiling, native launches 0/2 and SDK operations 4/4; Windows counts are zero.
Only the single Mac package contingency was used. Local/CI/native/SDK original limits
and their original contingency calculations remain unchanged. No allowance resets.
Both parent/group issue bodies read back exactly after their bounded L01 status
updates, preserving coverage maps and dependencies.

CURRENT (658 words) and HANDOVER (1,370 words) exceed their soft review targets because the pre-existing local
policy/status edits and unique protected recovery were retained. This task adds one
compact current L01 continuation and leaves the unrelated documentation work intact.
At that checkpoint the blocker was a decision for one additional current signed Mac package,
publication of the reviewed branch commits and the focused CI dispatch. No operation
was left running or pending remotely.

## Approved package and CI continuation, 2026-10-22

The user approved exactly one additional signed Mac package beyond the exhausted
three-attempt ceiling, publication of the four reviewed commits and focused CI.
The user then explicitly selected the ci-watch skill over the repository's manual
wait default for this run. This supplement adds no contingency and resets no limit.
Local batch 19 enters the original contingency; batch 20 covers publication, dispatch
and watch registration. Local cumulative use is 20/18, within the original ceiling 27.

Package attempt 4 in ignored `mac-package-04` passes at exact candidate
`79496c28aba9c91db2a93a97c7b3736396b503e1`, with product code at `6be4f24`.
Application and workflow inputs are unchanged from that commit. The approved public
certificate pin and certificate-backed designated requirement remain unchanged.
Strict signature, ARM64 bundle and read-only installer-content checks pass.
Executable SHA256 is `d923809dfacc58e0f6c3306921429d2b013d74bbbd4b6ff3abf4677fe692ff15`;
DMG SHA256 is `6f08875b167dff98c8240dcf9e036f9b561b2b604577aea3c5b57425846efaf3`.
The current desktop lock checks return true and no Loomlight process is running.
No Mac native launch was attempted or charged. Unlocking remains a real prerequisite;
the protected drafts and historical recovery remain untouched.

The four approved commits through `79496c2` are pushed to the existing branch.
[Screens qualification dispatch 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39749388462)
is confirmed as run `39749388462`, attempt 1, exact full SHA above, created
`2026-10-22T08:39:36Z`, last observed queued. Inputs are `owned_blank=true`,
`ordinal=1` and the exact candidate. Both affected portable targets are selected;
Windows additionally reserves package 1, native launch 1 and two SDK operations.
Mac reuses the scoped local signed package and SDK proof. CI cumulative use is 1/2,
within the original ceiling 3. The ticket stays open pending the terminal artifact
audit and current Mac native proof. No PR, merge, release or acceptance is selected.

The ci-watch launcher will register this exact run/attempt/SHA to the existing thread,
with a 30-second interval and one-hour deadline. Registration must acknowledge a
running worker before monitoring is claimed. Its completion event resumes the same
task for run/job/artifact identity, required-case and cleanup audit. A timeout is not
a CI result. These continuation records remain local; the GitHub ticket records the
current approval, accounting and confirmed run.

## CI1 terminal audit and workflow correction

The registered worker acknowledged `watcher_running: true`, then resumed the same
thread with the failure event. Its receipt is recorded after matching thread, run,
attempt and full SHA. GitHub confirms run `39749388462`, attempt 1, completed failure
at the approved `79496c2` candidate; local HEAD and remote branch still matched it.
Both required targets passed 223 frontend tests, six Python evidence-gate tests,
Screens 10/10, metadata 3/3, Source 16/16 and the exact legacy migration case 1/1.

Both jobs then failed at the desktop check. Tauri's `generate_context!` reported
that configured `frontendDist` at `../dist` did not exist. The L01 workflow placed
`npm run build` after `cargo check -p loomlight-desktop`; existing local output had
masked the prerequisite. This is a demonstrated workflow ordering defect, with no
demonstrated product defect. The correction moves the existing frontend build
immediately before the same desktop check and preserves every selector and check.

A disposable tracked-source export without `app/dist` reproduces the exact failure.
Running the frontend build and then the same desktop check in that export passes.
Generated frontend file hashes match the signed package's input files exactly.
Actionlint passes. No application/package input changes and no fifth Mac package
is attempted. Local batches 21 and 22 cover this audit/correction and its publication
and second dispatch, bringing cumulative local use to 22/18, within ceiling 27.

Both privacy scans and failure-artifact uploads passed. The downloaded Mac core
executable hashes to `26062d188c0b7fc1b3b25f123ccb995917f80a4a6c1304bd66c98606c10b893c`;
the Windows core executable hashes to
`d8c1ccdceac2f58511744e0e290574105c5a9773bda85f831d6480a8d2fdce5c`.
Both match their retained identity manifests and candidate files. Artifact IDs
`12413011891` (Mac) and `12413655900` (Windows), exact logs and executable bytes are
retained under ignored `ci-01`. No desktop executable was produced. Browser,
Windows SDK/package/native steps were skipped; none is claimed as passing.
Their dispatch reservations remain charged: Windows package 1, native 1 and SDK
operations 2. The second dispatch reserves cumulative Windows package/native 2
and SDK operations 4, and CI 2/2. Mac remains packages 4 under the one-package
supplement, native 0/2 and SDK operations 4/4. No ceiling resets or compounds.

Current-package Mac native proof still needs an unlocked desktop; repeated actual
lock checks remain true, so no launch is attempted. L01 remains open pending that
proof and the terminal second-run audit. The closed Help route is unchanged.
