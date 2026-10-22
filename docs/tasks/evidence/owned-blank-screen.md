# Owned blank-screen evidence

Owning work ticket: [L01 #34](https://github.com/Caldwell-41/Renpy-editor/issues/34).
Observation period starts 2026-10-22. Baseline `867528d`, Mac ARM64 sole writer,
branch `codex/phase3b-screen-designer`. The issue owns selection, finite cumulative
allowance and bounded acceptance. This file records detailed results, not a second brief.
Existing documentation/instruction edits and protected native recovery are preserved.
L01 is accepted as a bounded functional outcome. Current correction `58b191c` has no
remaining independent review findings. CI3 passes both portable targets and Windows
native/SDK proof; signed Mac package 5 and its native attempt 2 pass. The unchanged
Mac SDK path retains its scoped qualification. Detailed accounting and original failures
remain retained. Later editor/canvas/phase acceptance is separate.

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

## L01 acceptance map

| Criterion | Evidence and state |
| --- | --- |
| One collision-checked definition/transaction/history entry; Cancel and refusal do not write | Focused IPC tests, real eight-group renderer/core run and existing 11-group Help regression pass. |
| Metadata-only migration, extras/source preservation, no-op reopen, newer-schema refusal | Focused IPC migration and reopen tests pass. |
| Source edits/offsets reconcile; rename/deletion/ambiguity stays unresolved | Focused IPC tests and real Source Save/browser path pass. |
| Actual Choose/core/Source/history/reopen | Production renderer and strengthened controller pass. CI3 packaged Windows and signed Mac package 5/native attempt 2 pass all ordered stages, with exact accepted source, distinct identities, process and fixture cleanup. |
| Deliberate preview of created screen | Exact browser-accepted source passes actual pinned SDK proof on both Mac and Windows. The latest correction changes renderer read ordering and the qualification controller, with no SDK/runtime or source-generator changes. |
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

## Confirmed second dispatch

The verified workflow-only correction is published at
`81465339401ba1c118a31a92b8f3e3856e9feeb4`. Its entire `app` tree matches the signed
package candidate `79496c2`; the source-tree equality receipt is retained privately.
[CI2 run 39751077426](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39751077426),
attempt 1, is confirmed at that exact full SHA, created `2026-10-22T08:52:50Z`, last
observed in progress. Inputs are exact candidate, `owned_blank=true`, ordinal 2.
The same-thread ci-watch registration is next, with its default 30-second interval
and one-hour deadline. The terminal job/artifact/identity/case/cleanup audit remains
required. Local cumulative use remains 22/18 (ceiling 27), CI 2/2 (ceiling 3); other
counts and reservations remain as recorded above. No new Mac package is attempted.

## CI2 terminal audit and native correction

The second watcher resumed this same thread; its identity matched and its receipt
is recorded. GitHub confirms run `39751077426`, attempt 1, exact
`81465339401ba1c118a31a92b8f3e3856e9feeb4`, completed failure. Local HEAD and the
remote branch still matched before correction. Mac's required portable job passed.
Both hosts passed frontend 223/223, six Python gates, selected Screens/metadata/Source/
migration cases, eight real creation groups, the exact controller rehearsal and
11 Help regression groups. The closed Help job was deliberately unselected.

Windows verified the official archive checksum and passed actual pinned SDK compile,
lint, ordinary-game-context blank render, PNG capture, explicit Stop and complete
scratch cleanup. The accepted renderer source SHA256 is
`636faca7e3122dee42d0837fc538b9bef97cf9128a8032354ccc5bc1f4ef7477`, matching the
SDK receipt. Validation exited 0; owned Stop ended cancelled with raw Windows
`-1073741510`, complete cleanup and no error output. The retained PNG is blank as
expected. Virtual dimensions remain 1280 by 720. This is SDK service proof, with
no native WebView claim.

The Windows application and NSIS installer built, but native verification failed
with `Timeout: open` and no completed stages. The report independently records host,
request and credential cleanup true. The old Python runner then raised on empty
ownership before writing its result or removing its owned fixture. The identity
step separately failed because PowerShell used `$RUNNER_TEMP` instead of its
environment variable. These failed and skipped states are not passes. Both privacy
scans and artifact uploads passed. Downloaded candidate files and executable hashes
match their manifests. The Mac core hash remains the CI1 hash; Windows core is
`6fcedc641ecaf9488c9f5f2cfe1912758806c8f9f48134e13f07eb6342dc7a9d`, and the
Windows desktop executable is
`e661286e83e2e783e120b5e5b518f0afe475a624ad015d19eb08a1a6d4b884b1`.
Its PE header independently verifies x64. Exact artifacts/logs remain under `ci-02`.

The first empty-fixture reproduction command used the wrong working directory and
stopped before building; the corrected invocation used pinned tools. That browser/
controller run with the exact native empty-screen fixture passed, disproving missing
initial screen files as the cause. A later driver restore reused the temporary
example in a shared Cargo target directory, so the ordinary browser fixture lacked
its expected initial Help screen. Explicitly recompiling the original example fixed
the experiment setup; the final eight-group creation and 11-group Help runs pass.
Modified export experiments need separate targets or an explicit original rebuild.
Neither setup failure is a product pass or an erased attempt.

After the user confirmed unlock, the preflight expected an explicit false lock flag
but received no flag. The initial assertion failed; it is not recorded as a passing
lock check. Native CUA inspection then confirmed the accessible owned app window.
Mac native attempt 1 used signed package 4 and reproduced the startup failure. Its
Screens view showed the busy refusal and no Choose creation action. The new
`screens.list` operation was missing from the existing ordered observation and
bounded read-only retry lists. The window observation and a browser refusal of the
first renderer catalog read establish the same cause. The original browser probe
failed at `open`; the held-service lane regression failed for `screens.list`.
The correction adds catalog/inspection reads to the lane and catalog reads to the
existing bounded read retry, preserving single-dispatch writes, trust and starts.
The old runner's leftover public fixture was identified by its unique owned name,
expected public project title and empty ownership map, then its metadata was retained
and that exact fixture removed. No Loomlight process remains.

The strengthened rehearsal enables the actual rich Source editor. It exposed the
controller's textarea-only wait, then its assumption that an unfocused contenteditable
DOM selection was already observable. The revised controller uses the existing
rendered-editor adapter, focuses the control and waits for the exact existing Source
selection without setting it. It records the awaited control on failure. The final
busy-read/rich-editor controller passes all required stages against real core services.
The Python runner now preserves early native failures, records ownership errors and
cleans its owned fixture. PowerShell uses the correct environment path.

Independent follow-up compares `8146533...0cf5753`.

### Standards follow-up

Standards found one P2: unreadable metadata could also fail its retention copy, skipping cleanup and the
result. The controlled regression fails before the correction in `58b191c` and passes
after it. The independent follow-up closes that finding with zero remaining Standards
breaches or baseline smells.

### Spec follow-up

Spec reports zero actionable code defects or scope additions and one pending native-proof
group. Ordered reads preserve write, trust and runtime-start behavior; the probe observes
the existing selection. Required current native proof prevents acceptance.

### Current verification and allowance

Final correction proof is frontend/typechecking 223/223, focused lane/Screens UI
16/16, real creation eight groups, retained Help 11 groups, the exact busy/rich-editor
controller and nine Python evidence/runner tests. No core/SDK implementation changed;
the earlier 401/0 routine core and both-target SDK proofs keep their stated scope.
No native pass is inferred from these checks. Current product correction is at
`0cf5753`, with the runner review correction at `58b191c`.

Local batches 23–25 cover CI2/native diagnosis, the reproduced fixes, verification
and independent review, bringing cumulative local use to 25/18 within ceiling 27.
CI remains 2/2, ceiling 3; Windows package/native reservations are 2/2 each, ceiling
3, and SDK operations 4/4, ceiling 6. Mac remains packages 4 under the explicit
one-package supplement, native 1/2 and SDK operations 4/4. No CI3, Mac package 5
or second Mac launch is attempted. The changed frontend/controller means package 4
cannot qualify this correction. One additional signed Mac package requires explicit
authorization beyond the four consumed attempts. Keep L01 open; later editor/canvas/
phase acceptance remains separate.

## Approved fifth package and final CI contingency

The user approved exactly one additional signed Mac package, attempt 5, and explicitly
selected the root-cause skill. This is a one-attempt supplement beyond the consumed
four attempts, with no new contingency or reset. Local batch 26 covers the audit,
package/native qualification and final dispatch preparation; cumulative local use is
26/18, within the original ceiling 27.

The root-cause audit confirms that the host can legitimately have its service checked
out for ordinary concurrent work. It returns `RUNTIME_BUSY` before dispatch. The first
wrong renderer decision was excluding the new catalog read from the existing ordering
and bounded read retry. Both Screens reads now share the lane and eligible read retry;
no mutation, trust decision or process start is replayed. The native observation,
held-service regression and real renderer/core refusal reproduce this omission.
Separate rich-editor and metadata-recorder failures were reproduced and corrected at
their owners. No widened timeout or fixed delay replaces the product correction.
The failed probe now identifies its awaited control; the recorder keeps disk errors
separate from cleanup, making the deciding observation available in the next failure.

Signed package 5 in ignored `mac-package-05` passes at exact candidate
`9313cc5ee593549df70a80f6dde1e09f16a49b89`. Application/workflow inputs were unchanged
through the build. ARM64, strict signature, unchanged approved certificate-backed
requirement and read-only installer-content checks pass. Executable SHA256 is
`7fa6c606eeac5c7a1713926c85213e57464b76563b3a89b556d2421f248377d5`; DMG SHA256 is
`8e89ab10b18c8627d730444354ba61e66aae7b20cec8d359519d9a6d0e833ab5`.
No sixth package is authorized. The desktop has locked again: the active-console row
explicitly reports `CGSSessionScreenIsLocked=true`, with no Loomlight process. The
unlock request is pending. Mac native attempt 2 has not been reserved or started.

While that capability is unavailable, independent focused
[CI3 run 39756288431](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39756288431)
is confirmed, attempt 1, exact full SHA above, created `2026-10-22T09:33:01Z`, last
observed in progress. Inputs are exact candidate, `owned_blank=true`, ordinal 3.
Contingency entry was announced and recorded before dispatch: CI 3/2 at ceiling 3;
Windows package/native reservations 3/2 each at ceilings 3; SDK operations 6/4 at
ceiling 6. Failed/skipped prior reservations remain charged. Mac remains packages 5
under the two explicit one-attempt supplements, native 1/2 and SDK operations 4/4.
No limits reset or compound. There is no fourth CI dispatch authorized.

Register ci-watch for this confirmed run/attempt/SHA in the same thread, require its
running-worker acknowledgement, then yield. Terminal audit remains necessary for
required jobs, cases, artifact identities, exact executable hashes and cleanup.
Current Mac native proof remains required separately. The ticket stays open. These
new continuation records remain local; the issue records approval and exact run.

## CI3 terminal audit, current Mac native pending

The third registered watcher resumed this thread. Its thread/run/attempt/full-SHA
identity matches and receipt is recorded. GitHub confirms completed success for
run `39756288431`, attempt 1, exact candidate
`9313cc5ee593549df70a80f6dde1e09f16a49b89`. Local HEAD and remote ref matched that
candidate before audit. Both required portable jobs pass frontend 223/223, nine
Python evidence/runner cases, Screens 10/10, metadata 3/3, Source 16/16, the exact
legacy-migration case 1/1, desktop check, eight real creation groups, the strengthened
busy/rich-editor controller and 11 retained Help groups. The closed Help job is
unselected. Mac CI intentionally does not package, launch native or run SDK; it does
not replace those local scoped gates.

Windows verifies the official pinned checksum, compiles/lints and actually renders
the accepted blank screen in ordinary game context. Renderer source SHA256
`fc24f470356f1c601a2d3a071652c1f01131e4d32b45859242a6a9f17c07e538` matches the
SDK receipt. Validation exits 0; explicit owned Stop ends cancelled with raw
`-1073741510`, complete untruncated cleanup and no runtime error markers. The retained
blank PNG is inspected: virtual dimensions are 1280 by 720, physical capture 922 by
518. These measurements are distinct.

The actual packaged Windows WebView passes ordered Cancel, creation, exact Source
selection, shared history, reopen and complete stages. Distinct persistent screen/root
IDs and accepted bytes match the retained source and revision. Process exit is 0 with
no timeout, all host/request/credential cleanup owners are true, disk errors are empty
and fixture cleanup is complete. Disk proof finds no source bytecode, saves or scratch
jobs. This uses injected DOM input in the native WebView, not physical-keyboard proof.
The SDK proof above is separate; the native creation probe reports SDK not executed.

Windows executable SHA256 is
`caad54eb401aef53ff117aa1911a0ea7361d9a318b0798e527ab4100065150ef`, matching its
package and retained-executable manifests. PE architecture is independently x64.
Windows core SHA256 is
`e10addf6cf406d545c834069eac1251f98c6d13dba23bae466c8de3c4645fb79`; Mac core SHA256
is `26062d188c0b7fc1b3b25f123ccb995917f80a4a6c1304bd66c98606c10b893c`.
Both downloaded candidate files and exact executable bytes match their identity
manifests. Both privacy scans and artifact uploads pass. Artifact IDs are
`12415858420` (Windows) and `12416346177` (Mac); exact bytes, complete logs and the
structured audit are retained under ignored `ci-03`. Original CI1/CI2 failures remain.

The CI audit is complete. The final local verification cycle is batch 27/18 at the
original ceiling 27; its remaining current Mac native check is pending capability,
not a fresh cycle or renewed allowance. CI and Windows reservations remain at original
ceilings 3/3/6. Mac packages remain 5 under explicit supplements, native 1/2 and SDK
operations 4/4. No new package or CI is authorized. Package 5 at the same exact product
inputs is ready, but the current console lock flag is still true and no app process
is running. Mac attempt 2 has not been launched or charged. Continue only that already
authorized verification when the desktop is unlocked. Keep L01 open until it passes;
no required native proof is waived by CI success. No worker/run remains pending.

## Final Mac native audit and L01 completion

The user confirmed unlock. Active-console preflight verifies an unlocked session with
no Loomlight process, the exact approved package-5 executable hash, unchanged tested
application/workflow inputs and a fresh output directory. Mac native attempt 2 is
reserved and completed inside the already-open final verification cycle, batch 27.
The existing `owned-screen` runner launches the exact signed executable with its
isolated public fixture. It exits 0 in 4.585 seconds, with no timeout.

The report passes ordered Cancel, creation, exact Source selection, shared Undo/Redo,
reopen and complete stages. Screen UUID `c9127833-cbf1-4c24-b4d9-2473c429e452` and
root UUID `22419de7-7d65-406c-96e5-fa0652696542` are distinct and persist through
reopen. Retained accepted source exactly matches the owned marker and blank
`travel_notes` definition. Its SHA256 is
`819a9594e4c0bf4614c174d635f27678f0e4e560aac559806d2501a79bdfff5d`, matching
the reported source revision. Native WebView is true and SDK execution in this probe
is false. This proves synthetic DOM input in the actual signed WKWebView/core path;
physical-keyboard and human visual acceptance are not inferred.

Independent host/request/credential cleanup owners all report true. Disk errors and
external errors are empty, accepted bytes match, no source bytecode/saves/scratch jobs
remain and fixture cleanup is complete. A separate process/owned-root check confirms
no Loomlight process or owned probe fixture remains. The executable SHA256 still
matches `7fa6c606eeac5c7a1713926c85213e57464b76563b3a89b556d2421f248377d5`.
Detailed native receipt, accepted source, preflight and structured audit remain under
ignored `mac-native-02`. The exact tested application inputs remain those of
`9313cc5ee593549df70a80f6dde1e09f16a49b89`; later commits only maintain evidence/status.

All four L01 criteria now pass at their stated scope: collision-safe transactional
creation/refusal; metadata-only migration/source preservation; conservative Source
reconciliation; and actual UI/core/Source/history/reopen plus deliberate pinned-SDK
preview. Existing Help regressions pass. Both independent code-review axes have no
remaining code findings, and the previously pending native-proof group is satisfied
by the audited Windows CI3 and signed Mac evidence. B01/P3B aggregate, full editor/
canvas fidelity, physical keyboard and later human/phase acceptance remain separate.
No successor work is selected by this completion.

Final cumulative use is local 27/18 at original ceiling 27; CI 3/2 at ceiling 3;
Windows package/native reservations 3/2 each at ceilings 3 and SDK operations 6/4
at ceiling 6, including skipped reservations. Mac packages 5 comprise original
ceiling 3 and two explicitly approved one-attempt supplements; native launches 2/2
(ceiling 3), SDK operations 4/4 (ceiling 6). No limit reset or compounded; original
failed attempts remain charged. The L01 allowance closes with this bounded outcome.
No extra package, SDK operation or CI was started for final documentation.
