# Phase 2 — Initial LLM assistance

## Active scope amendment — Unsloth Studio only — 2026-10-12

The user revised Phase 2 to **Unsloth Studio only**. This amendment supersedes the
generic/OpenAI-compatible provider requirements and two-provider acceptance gates in
this plan, the ROADMAP and PRODUCT. Generic provider profiles, auth/wire adapters,
compatibility modes and live qualification are deferred outside Phase 2; their earlier
design and execution records remain historical evidence. Do not implement or test a
generic provider as part of Phase 2 closeout.

The Studio integrated/live slice and selectable proposal-editing slice are already
qualified. The remaining outcome is to reconcile the residual applicable verification
matrix, then run the final integrated Studio workflow on one coherent candidate and
complete the required final human acceptance. Reuse valid evidence from the exact
candidate and unchanged inputs. The user selected the closeout prompt and its finite
allowance on 2026-10-12. The entry audit identified material Studio scope gaps before
qualification execution; see the
[requirement map and decision](#studio-only-closeout-entry-audit-and-requirement-map--2026-10-12).
Earlier slice exclusions are not automatic full-phase waivers. The subsequent
[user decisions and sampling implementation](#closeout-user-decisions-and-local-sampling-implementation--2026-10-12)
select sampling work, remove session-only credentials from the product requirement,
and commission separate read-only route feasibility research. Final same-candidate technical qualification is now complete through CI1, owner
live/SDK and [CI9 final audit](#ci9-terminal-audit-and-scoped-technical-closeout--2026-10-13).
Explicit final human acceptance remains pending.
The user's subsequent deferral of AI Scene-ending/connection changes removes that
family from Phase 2 closeout; it remains possible separately selected future work.
See [the deferral record](#ai-scene-ending-and-connection-changes-deferred--2026-10-12).
The subsequent user direction also **defers selected-route context (item 1)** and
selects the remaining sampling, explicit setup-readiness test and verified HTTPS
changes (items 2–5). See [the current amendment](#route-deferral-and-remaining-studio-changes--2026-10-12).

**Scope owner:** Phase 2 requirements, acceptance and the shared delivery sequence;
[ROADMAP](../../ROADMAP.md) owns phase boundaries. Phase 1 and the bounded nested-source
foundation are accepted; Phase 2 remains incomplete. Studio settings and credentials
are implemented; the selected Windows remembered-credential qualification and cleanup are complete. [CURRENT](../../status/CURRENT.md) owns
project status; [HANDOVER](../../status/HANDOVER.md) owns continuation and recovery.

The bounded first rewrite, Continue Scene, Draft Scene, Generated Character cards
and Generated lorebook entries
are qualified on both targets. See the [first rewrite audit](#final-pinned-windows-audit-and-both-target-qualification--2026-10-10),
[Continue Scene closure](#continue-scene-both-target-qualification-and-closure--2026-10-10),
[Draft Scene closure](#draft-scene-qualified-closure--2026-10-11),
[Generated Character cards closure](#generated-character-cards-qualified-closure--2026-10-11)
and [Generated lorebook entries closure](#generated-lorebook-entries-qualified-closure--2026-10-11).
The [selected Phase 2 qualification](#phase-2-qualification-selection-and-prerequisite-audit--2026-10-11)
is [qualified for the selected Studio-only integrated/live slice](#studio-only-integratedlive-qualification-and-closure--2026-10-11).
The user has now made Studio the complete Phase 2 provider scope; generic support is
deferred outside the phase. Residual verification and final human acceptance remain
incomplete; individual action qualification and the Studio slice do not establish
those broader outcomes.
The [selectable proposal-editing outcome](#selectable-live-qualification-and-outcome-closure--2026-10-12)
is implemented and qualified. Studio-only closeout execution is selected, with its
allowance unconsumed at the material-scope stop recorded below.
Read its CI-first amendment/selection only when continuing or reviewing that slice,
then only the relevant requirement sections. Completed credential/request selections below
are evidence, not current execution instructions. Detailed planning/source/provider/native attempts through `015579a` are in
the [historical ledger](../archive/2026-10-09-phase-2-execution-history.md); old prompts
there are evidence, not live instructions. Future capabilities require their own
selection; preserve the approved provider, reference, prompt and Phase 2/3 scope.

Implementation agents follow the accepted [UI/UX guidelines](../../UI.md#accepted-uiux-guidelines-for-implementation-agents),
including plain interface language, optional technical help, completion/submission
validation and shared control ownership. These guide future implementation; they do
not claim the current application already satisfies every interaction.

## CI-first platform qualification amendment — 2026-10-10

The user accepted CI-first routing, grouped qualification for selected related work
and local handoff only for an identified missing native capability. They then requested
an instruction-conflict audit. [WORKFLOW](../../WORKFLOW.md#test-host-routing-and-ownership)
owns routing and waiting; [TESTING](../../TESTING.md#cost-and-harness-discipline) owns
evidence sufficiency. This amendment supersedes the mandatory serial Windows handoff
and prohibition on CI other-host execution for the current dialogue-rewrite outcome.
Earlier local routing directions in this selection and its Mac transfer record are
historical; their acceptance assertions, evidence and consumed allowances remain intact.

Continue one GPT-6.1 Sol High owner in the current session on
`codex/provider-qualification`; no subagents or direct access to the user's other
computer. Prepare focused Windows CI coverage for the selected core, transport/native
worker, controller, pinned SDK and packaged rewrite checks. Preserve all required
assertions and observation gates. Identify any native cases CI cannot establish and
request a Windows handoff only for those cases. A green generic matrix cannot replace
the selected rewrite walkthrough or its light/dark/compact and Generate/Accept evidence.

Mac qualification remains complete on unchanged production inputs. Cumulative use
remains **Mac 1/4 package builds, 3/6 app launches; Windows 0/4 builds, 0/6 launches**.
CI consumes the same remaining allowances; preparation, host changes and this amendment
do not reset them. Preserve the selected exclusions and prior both-target foundations.
CI authorization does not authorize merge, release, signing-policy changes, secret
provisioning, provider expansion or another feature. Publication remains within the
existing selected branch/outcome authority.

**Instruction audit:** aligned AGENTS, WORKFLOW/TESTING, this completion loop and prompt,
Phase 3 routing, CURRENT/HANDOVER and stale Windows-contract entry links. Clarified that
Mac identity gates and abandoned W0/OPT-1A orchestration do not prohibit ordinary
authorized CI. ROADMAP/SECURITY release wording now explicitly preserves the current
Mac signing policy; app/README recognizes an already selected build allowance without
fresh per-step approval. Historical credential prompts and local acceptance records retain
their exact scope; they are not live continuation instructions. CI-native coverage and
Mac signing availability still require verification; no workflow implementation,
dispatch, new build/launch or platform acceptance is claimed by these wording changes.
Repository validation passes for 482 files, added Markdown fragment links resolve and
diff whitespace passes. At that audit checkpoint the changes were local-only and
uncommitted; the focused CI preparation below owns subsequent publication/execution.


### Focused Windows CI preparation and first selection — 2026-10-10

User authorized completing the remaining rewrite qualification through focused CI,
preserving the accepted uncommitted instruction audit. Fresh local/remote branch
state matches `684b95f`; no Actions run exists on this branch at entry. Actions are
enabled and existing workflow dispatch access is available. Reviewed instruction
changes retain signing/credential, scope and budget boundaries; they are included
with this scoped CI candidate rather than discarded or resetting the branch.

The existing `production-scaffold.yml` now has an isolated
`dialogue_rewrite_windows=true` selection. It runs only Windows x64 on `windows-2025`;
the generic preflight/package matrix is skipped. Existing pinned checkout/Node/npm,
Rust-cache, SDK-cache and artifact actions are reused. No Mac build, generic native
smokes, release, secret provisioning or other feature is selected. GitHub's official
runner definition establishes Windows x64 availability, not an interactive desktop;
the job checks actual native capability before any Loomlight build/launch.

Actual runner preflight requires Windows x64, unlocked `Default` input desktop,
interactive session, UI Automation availability and a nonblank desktop capture large
enough for the 1280x900 layout. A supported existing `Set-DisplayResolution` cmdlet
may adjust only the ephemeral runner display; no infrastructure or security policy
is installed/changed. Failure remains missing capability. Independent focused/SDK
and package work may finish, but native acceptance is withheld.

| Required proof | Focused route and evidence |
| --- | --- |
| Selected core/transport/native worker and renderer | Locked rewrite 9, transport 8, native worker 6; renderer check; selected count assertions and retained logs |
| Controller integration | Existing real controller/native Credential Manager/strict loopback HTTP driver, held owner, acceptance/history and zero-write refusals |
| Literal SDK behavior | Official published checksum equals pinned 8.5.3 archive hash; existing safe installer and adapter; compile/lint/substitution/text tokens plus named standard-template startup/say/return |
| Package identity | One recorded ordinary Windows Tauri build, scanned executable/installers, candidate tree/input hashes and exact binary digest retained even after later failure |
| All 20 phase-1 assertions/five HTTP bodies | Existing packaged rewrite probe and rejecting report gate remain intact; all five captured request digests must equal exact reviewed bodies |
| Light/dark/compact native observation | Owned PID/path/hash-bound UI Automation controls and viewport, actual PNG/hash/dimensions/nonblank/theme/compact checks before each acknowledgement |
| Generate/Accept | Actual OS `SendInput` mouse clicks on enabled native controls; before/after captures plus inert-proposal/saved-once native state; stage validator alone releases acknowledgement |
| Separate-process persistence/cleanup | Dependent phase 2 only after phase-1 success; three required checks, whole-project byte equality, zero HTTP, native credential read/removal, owned fixture cleanup |

The native driver never writes `.done` markers. `rewrite_native_evidence.py` rejects
missing/foreign/changed captures, wrong stage/PID/binary/desktop, missing control or
OS action/result checks, wrong theme/compact geometry and incomplete before/after
proof. The existing runner acknowledges only validated driver evidence; failed
driver evidence leaves the marker absent so the packaged observation deadline emits
its failed cleaned report. Driver actions are automated native input, not human or
subjective acceptance. Terminal artifact review must inspect screenshots and actual
reports; a green generic badge is insufficient. No marker or assertion is relaxed.

SDK harness now reuses the existing version-specific Windows console launcher
adapter, retaining command and SDK logs including timeouts; Mac arguments and fixture
assertions remain unchanged. Local harmless SDK helper recheck passes. All 116 retained
Mac production-input hashes still match; completed Mac qualification remains valid.
No demonstrated production defect or production change occurred.

Published preparation candidate `3451137` was verified remotely. GitHub's push-time
workflow validation failed before scheduling jobs: run `38023810828`, attempt 1,
no jobs, diagnostic `(Line: 461, Col: 25): Unrecognized named-value: 'runner'`.
The new job-level environment used a step-only context. Diagnosed harness correction
moves the evidence path into the first runner step via `GITHUB_ENV`; native and
acceptance gates remain unchanged. Local YAML parsing did not establish Actions
expression-context validity. No package build or app launch was consumed.

Cheap local checks: native evidence rejection tests **4/4**, original rewrite report
gate **2/2**, Python AST, workflow YAML/isolated matrix guards and diff whitespace pass.
Repository validation/link/privacy passes for **486 files**. Windows PowerShell/UI
Automation runtime remains to verify on the actual runner; it is not a local pass.

**Selected first CI attempt:** workflow `production-scaffold.yml`, same branch,
`dialogue_rewrite_windows=true`, `upload_packages=false`, build ordinal **1**,
first launch ordinal **1** (dependent phase 2 uses **2**). Fresh dispatch only;
workflow reruns are refused before consumption. Runner `attempt-ledger.jsonl`
records each build/launch immediately before execution. Known cumulative use remains
**Mac 1/4 builds, 3/6 launches; Windows 0/4 builds, 0/6 launches**, with up to one
Windows build and two launches reserved. Reconcile actual failed/skipped/completed
attempts from terminal evidence before any further dispatch; reservations are not
passes or an allowance reset.

Publish/verify this instruction/CI candidate before dispatch. After obtaining a
confirmed run/attempt/head identity, record it, publish the wait checkpoint and use
manual same-thread wait/resume. No automatic polling/wake-up or new CI controller.
Terminal audit must check selected jobs, counts, package/input identity, SDK proof,
all native captures/receipts, both reports, exact HTTP digests and cleanup. Classify
failures and complete bounded fixes/review only within remaining allowance. Local
handoff is requested only for a specifically demonstrated missing native case after
all feasible CI work; no handoff is currently inferred.

### Confirmed focused Windows dispatch — 2026-10-10

**State: awaiting_ci.** Instruction/CI preparation and diagnosed workflow correction
are published; remote branch was verified at source candidate
`a2e82f4d27ef4ad5154027b2d63899d42e1d730d` before dispatch. Confirmed workflow
**357322921**, `production-scaffold.yml` (Phase 1 production gates),
[run **38023888008**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38023888008),
**attempt 1**, event `workflow_dispatch`, branch `codex/provider-qualification`,
exact head matches that candidate. Created **2026-10-10 04:23:22 UTC**; last observed
**in_progress at 04:23:32 UTC**. Windows x64 job `114130507223` started and setup
passed; checkout was in progress. Generic preflight and package matrix are skipped.
Material inputs: `dialogue_rewrite_windows=true`, `upload_packages=false`,
`rewrite_build_ordinal=1`, `rewrite_first_launch_ordinal=1` (phase 2 ordinal 2).

Artifact selection: `rewrite-windows-38023888008-1`, **7 days retention after upload**;
upload/completion are not yet observed. Known Windows consumption at checkout was
**0/4 builds, 0/6 launches**, with up to one build/two launches reserved; reconcile
actual terminal attempt entries and logs before any further dispatch. Mac remains
**1/4 builds, 3/6 launches**, with unchanged production inputs/evidence reused.
All Windows required cases remain pending until terminal artifact audit, including
actual runner capability; no marker/acceptance is claimed from dispatch.

Publish this coherent docs-only wait successor and stop active model polling.
Manual user resume in the same chat triggers inspection of this exact run/attempt,
fresh refs/local changes and the terminal audit listed above. A newer docs-only
branch head does not replace the tested source candidate. No autonomous polling,
wake-up, duplicate dispatch, merge or release. The zero-job validation failure at
`3451137` remains recorded as a harness failure, not a qualification attempt/pass.

### First Windows terminal audit and bounded correction — 2026-10-10

User resumed run `38023888008` and explicitly authorized fixing demonstrated issues
and rerunning within the selected outcome. Fresh checkout is clean at published
`233d4e6`; remote branch matches. No subagents, direct other-computer access or
production behavior change. Source run **38023888008**, attempt **1**, head
`a2e82f4d27ef4ad5154027b2d63899d42e1d730d`, is terminal **failure**, completed
**2026-10-10 04:31:07 UTC**. Only the selected Windows job executed; generic jobs
were skipped. Artifact **11659236668**, `rewrite-windows-38023888008-1`, downloaded
and audited; expires **2026-10-17 04:31:02 UTC**. All **42** manifest entries verify
(after interpreting Windows path separators); retained executable matches SHA256
`6e4699d437f6f61a70b990008ac8ef28d112a28e9cab29e85ed6fc83952beaf9`.
Installer/executable and evidence privacy scans pass. Logs/receipts remain ignored
in `.toolchains/rewrite-windows-ci-38023888008`; no evidence binaries/logs are committed.

Actual raw step outcomes and artifact reports override continue-on-error conclusions.
Confirmed successes: renderer **123/123**, transport **8/8**, literal-driver build,
checksum-verified official SDK **8.5.3**, compile/lint/substitution/text-token assertions
and named standard-template runtime **1 test/3 assertions**, package build **1**.
Native walkthrough was skipped; neither phase report nor native marker exists.
`attempt-ledger.jsonl` contains only package-build ordinal **1**, corroborated by
workflow logs. There was **no Loomlight app launch**, fixture or owned credential to
clean up. Missing walkthrough cleanup proof remains pending rather than a pass.
Cumulative consumption: **Mac 1/4 builds, 3/6 launches; Windows 1/4 builds, 0/6
launches**. Remaining Windows allowance: **3 builds, 6 launches**.

| Failure classification/evidence | Smallest correction |
| --- | --- |
| Test harness: core rewrite 8/9; success case panics on source snapshot lookup because keys use Windows separators while authoritative source paths use `/` | Canonicalize only snapshot keys to `/`; preserve byte equality and all assertions |
| CI setup: native-worker test cannot compile Tauri context because `frontendDist` does not exist | Build the renderer before native tests; no app package build or launch |
| Example harness: controller driver path-import seeks `src/windows.rs`, missing actual credential child module | Import the actual unchanged `ai_native/windows.rs` implementation directly in the example; same native Windows parent type/factory and Mac file-store factory |
| Capability missing/unresolved: Default unlocked interactive session and UIA succeed, but capture remains 1024x768 after supported display command | Replace cached WinForms geometry with fresh user32 `GetSystemMetrics` for preflight and capture containment; record before/after geometry and display-command result. Cached size is a hypothesis until actual rerun; unchanged required viewport remains blocking |

No application production code changed. The sole changed entry in the retained Mac
116-input inventory is `src-core/src/rewrite/tests.rs`, included only under `cfg(test)`;
other 115 entries match. Example/bootstrap and external CI drivers do not enter the
packaged runtime. Completed Mac package/native/SDK evidence remains valid.
Local corrected core selection **9/9** and actual controller integration pass; the
initial local loopback attempt was sandbox `EPERM`, then approved native access passed.
Retained-evidence rejection tests **3/3**, unchanged native/report gates **4/4, 2/2**,
AST, focused Rust formatting, Actions expression/schema validation via existing
`actionlint`, repository/link/privacy and diff checks pass. No Windows native result
is inferred from these local checks.
The full downloaded-source reuse check also passes locally, emulating only Git's
declared Windows checkout line endings for current inventory comparison; artifact,
binary and SDK log hashes use their actual downloaded bytes. This verifies reuse
logic, not Windows native capability or walkthrough acceptance.

**Selected retry:** a fresh dispatch (not Actions rerun) of the same isolated workflow,
`dialogue_rewrite_windows=true`, `upload_packages=false`,
`rewrite_reuse_run_id=38023888008`, first launch ordinal **1** (dependent phase 2 **2**).
Build ordinal **2** is unused in reuse mode: **zero new package builds**, up to **two
Loomlight launches** reserved. Reuse validates original completed run/attempt/head,
all artifact hashes, package and SDK successful case evidence, exact binary hash and
independently enumerated current runtime inputs. Only the six exact changed external
workflow/driver/test/example paths are exempted; changed/missing/added production inputs
refuse reuse with no implicit rebuild. Original failed outcomes remain retained.
Both reports, 20 phase-1 cases, five exact reviewed HTTP bodies, actual native captures
and OS input plus process persistence/zero HTTP/cleanup remain required. Audit actual
retry consumption before any subsequent dispatch. If the corrected fresh native API
still cannot establish the viewport, identify those native cases for local handoff
only after finishing feasible selected checks. Publish/verify before dispatch, record
confirmed run identity, then follow manual same-thread wait/resume.

### Confirmed corrected Windows retry — 2026-10-10

**State: awaiting_ci.** Scoped fixes/reuse gates published and remote verified at
`c6c9cb05f87f1ec748423a8c1d0d96f515a56832` before fresh dispatch. No active duplicate
operation existed. Confirmed workflow **357322921**, `production-scaffold.yml`,
[run **38027478869**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38027478869),
**attempt 1**, event `workflow_dispatch`, branch `codex/provider-qualification`,
head exactly matches that candidate. Created **2026-10-10 05:25:56 UTC**; last
observed **in_progress at 05:26:06 UTC**. Selected Windows x64 job **114141299161**
started, setup passed, checkout was in progress; generic jobs are skipped.
Inputs: `dialogue_rewrite_windows=true`, `upload_packages=false`,
`rewrite_reuse_run_id=38023888008`, `rewrite_build_ordinal=2` (unused in reuse mode),
`rewrite_first_launch_ordinal=1` (dependent phase 2 ordinal 2).

New terminal artifact: `rewrite-windows-38027478869-1`, **7 days after upload**;
completion/upload and actual reuse/native results are not yet observed. Original
source artifact expires **2026-10-17 04:31:02 UTC** and has a retained local audit
copy. Known use at retry checkout: **Windows 1/4 builds, 0/6 launches**, with **zero
new builds/up to two launches reserved**; later actual consumption remains unknown
until terminal attempt/log audit. **Mac 1/4 builds, 3/6 launches**, unchanged valid
production evidence reused. No native acceptance or observation marker is inferred.

Publish the docs-only wait successor and end active model polling. User resumes this
same chat to audit this exact run/attempt, fresh refs/local edits, reuse source and
all terminal cases/captures/cleanup. A docs-only branch successor is not a new tested
candidate. Bounded further corrections stay within this outcome and remaining
allowance, with diagnosis before retry and two-correction reassessment. No autonomous
watcher/wake-up, merge, release, secret provisioning or other-host direct access.

### Corrected Windows retry audit and child-driver hash repair — 2026-10-10

User resumed run `38027478869`, then explicitly requested the error explanation,
fix and rerun. Fresh checkout is clean at remote-verified `5f22e18`; one GPT-6.1 Sol
High owner, no subagents. Workflow **357322921**, run **38027478869**, attempt **1**,
head `c6c9cb05f87f1ec748423a8c1d0d96f515a56832`, is terminal **failure**, completed
**2026-10-10 05:38:23 UTC**. Selected job only; generic jobs skipped. Downloaded
artifact **11660353959**, `rewrite-windows-38027478869-1`, expires
**2026-10-17 05:38:17 UTC**. All **50** manifest hashes verify; original retained
package/SDK reuse receipt passes and the binary SHA remains
`6e4699d437f6f61a70b990008ac8ef28d112a28e9cab29e85ed6fc83952beaf9`.
Ignored local audit copy: `.toolchains/rewrite-windows-ci-38027478869`.

The previous corrections are established: core **9/9**, transport **8/8**, native
worker **6/6**, actual controller/native Credential Manager/strict HTTP integration,
renderer **123/123** and renderer build pass. Native preflight records Default unlocked
interactive session 2, UI Automation and actual nonblank **1920x1080** capture after
fresh user32 metrics (original 1024x768 was cached WinForms geometry). Package/SDK
source identity, inputs and hashes validate; no package build or SDK execution repeats.

**New demonstrated harness failure:** Python-launched child PowerShell at first
`observe-light` cannot resolve `Get-FileHash`, despite its availability in the workflow's
preflight context. The driver fails before setting executable digest or observing the
window; no observation marker is released. Packaged probe honestly reports
`Native observation timeout at observe-light`, with **4/20** preparation assertions
and one reviewed payload digest; it is not phase-1 acceptance or five-body proof.
Phase 2 is not launched. PID **3252**, launch ordinal **1**, is the sole app attempt;
terminal failed report confirms cleanup. Outer cleanup receipt confirms credential
references removed and owned fixture deleted; exact fixture hashes are retained.
Cumulative consumption is **Mac 1/4 builds, 3/6 launches; Windows 1/4 builds, 1/6
launches**. Remaining Windows allowance: **3 builds, 5 launches**.

Smallest repair removes this optional cmdlet dependency: the driver computes identical
file SHA-256 with `System.Security.Cryptography.SHA256` and file streams for executable
and PNGs. It retains the same ownership, digest equality, native capture, OS input and
observation gates. Receipt includes PowerShell version/hash provider. A prelaunch
check exercises that exact Python-to-child-PowerShell context and compares its binary
hash to Python before recording or consuming another app launch. No production code,
credential/signing policy or acceptance assertion changes; Mac evidence remains valid.
Native runtime of the repaired driver is pending CI, not claimed as a local pass.

Reuse the newly passing portable checks with independently enumerated source-input
comparison, original run/attempt/head, full artifact hashes, successful individual
case exits and exact count/controller logs. Unlike package reuse, this stricter gate
also refuses changed core-test or controller-example inputs. Original native failure
remains a failure. Retain source receipts/logs with explicit provenance. Local reuse
rejection tests **4/4**, unchanged native/report gates **4/4, 2/2**, AST, existing
`actionlint` Actions contexts/schema, repository/link/privacy and diff checks pass.
Actual downloaded focused-source admission passes locally with only Git's declared
Windows checkout line endings emulated for current input comparison; artifact hashes
use actual downloaded bytes. No redundant portable compilation or package matrix.

**Selected next dispatch:** existing isolated workflow, `dialogue_rewrite_windows=true`,
`upload_packages=false`, package/SDK source `rewrite_reuse_run_id=38023888008`, passed
portable source `rewrite_focused_reuse_run_id=38027478869`, build ordinal **2** unused,
first launch ordinal **2**, dependent reopen ordinal **3**. Reserve **zero builds/up to
two app launches**. Prelaunch failure consumes none; no implicit rebuild or broader
fallback. All 20 phase-1 cases/five exact reviewed HTTP bodies and native light/dark/
compact plus actual Generate/Accept remain required, then independent-process
persistence/whole-project byte equality/zero HTTP/cleanup. Publish and remote verify
before dispatch, record confirmed identity and use manual same-thread wait/resume.

### Confirmed child-driver repair dispatch — 2026-10-10

**State: awaiting_ci.** Remote verified repair candidate
`587ce6bdec8025be3b9f1674c58b6c3272f63efd` before dispatch; no active duplicate run.
Confirmed workflow **357322921**, `production-scaffold.yml`,
[run **38029621084**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38029621084),
**attempt 1**, event `workflow_dispatch`, branch `codex/provider-qualification`,
head exactly matches the published repair. Created **2026-10-10 06:03:36 UTC**;
last observed **in_progress at 06:03:46 UTC**. Selected Windows x64 job
**114147625037** started, setup passed, checkout was in progress; generic jobs skipped.
Inputs: `dialogue_rewrite_windows=true`, `upload_packages=false`,
`rewrite_reuse_run_id=38023888008`, `rewrite_focused_reuse_run_id=38027478869`,
`rewrite_build_ordinal=2` unused, `rewrite_first_launch_ordinal=2` (phase 2 ordinal 3).

Artifact `rewrite-windows-38029621084-1`, **7 days retention after upload**;
completion/upload, child-context prelaunch and native results remain unobserved.
Source artifact expiry/retained audit copies are recorded above. Known Windows totals
at checkout **1/4 builds, 1/6 launches**; **zero builds/up to two launches reserved**.
Later actual entries are unknown until terminal audit. Mac remains **1/4, 3/6** with
valid unchanged production evidence. All required native cases remain pending.

Publish the reviewed wait successor and stop active model polling. User manually
resumes this same chat to audit this exact run/attempt, fresh refs and all required
source/input/hash/portable reuse/prelaunch/native/HTTP/persistence/cleanup evidence.
No automatic wake-up/polling, duplicate dispatch, merge or release. This docs-only
successor does not replace the tested candidate; all earlier failures remain recorded.

### User-requested prepublication recheck — 2026-10-10

User requested another code/workflow review before publication and another try.
Repair candidate `587ce6b` and run `38029621084` had already been published/dispatched;
its wait-record edits were still local. Rechecked workflow ordering/contexts, artifact
admission and input identity, child prelaunch before launch entries, cumulative
ordinals, native marker refusal, phase dependency and terminal cleanup/failure gates.

Review found a narrow **dispatch harness defect**: multiple Python validations were
followed by further commands without immediately checking their exit codes, so a
later success could mask an invalid earlier selection. Add a PowerShell throw after
each validation. Executed the exact workflow Python expressions locally: selected
valid inputs pass; **8** invalid branch/attempt/upload/ordinal/reuse selections refuse,
with immediate failure checks verified. Actions schema/contexts via `actionlint`,
native gate **4/4**, report gate **2/2**, reuse gate **4/4**, repository validation
**487 files** and diff whitespace pass again. No production code or native-driver
behavior changed in this final hardening; no package build/launch is selected for it.

User-requested current-state recheck still observed run `38029621084` **in_progress**:
Windows setup through dependency cache steps completed; rejection/repository gates
were in progress. Generic jobs remained skipped, exact head remained `587ce6b`.
This observation was made before **2026-10-10 06:06:15 UTC**; it is not terminal
acceptance or raw continue-on-error proof. Later consumption remains unknown.
Recorded run inputs meet all hardened guards, so its qualification can continue
without a duplicate dispatch. Publish the reviewed workflow hardening with the wait
record, retaining `587ce6b` as the tested candidate. This successor contains workflow
validation hardening and records, rather than being labelled docs-only; its delta
does not change the selected valid native run, production inputs or package identity.
Manual same-thread terminal audit remains next; all missing native evidence is pending.

### Third Windows terminal audit and serial reviewer repair — 2026-10-10

[Run **38029621084**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38029621084),
workflow **357322921**, attempt **1**, candidate
`587ce6bdec8025be3b9f1674c58b6c3272f63efd`, completed **failure** at
**2026-10-10 06:08:39 UTC** (run updated 06:08:40 UTC). Selected Windows job
**114147625037** only; generic jobs skipped. Artifact **11661896616**,
`rewrite-windows-38029621084-1`, expires **2026-10-17 06:08:33 UTC**. All **64**
manifest hashes verify in ignored `.toolchains/rewrite-windows-ci-38029621084`;
raw workflow log is retained separately outside Git.

The child PowerShell **5.1.26100.33438** prelaunch hash/desktop check passes,
confirming the previous .NET repair. Package/SDK reuse from **38023888008** and
portable-case reuse from **38027478869** pass with independent input/hash admission.
Original binary SHA256 remains
`6e4699d437f6f61a70b990008ac8ef28d112a28e9cab29e85ed6fc83952beaf9`.
Core 9/9, transport 8/8, native worker 6/6, actual controller/strict HTTP,
renderer 123/123 and pinned SDK proof remain individually passed evidence.

Launch ordinal **2**, PID **1396**, establishes actual native light/dark/compact
observation. Receipts bind the exact binary/PID, Default desktop and visible controls;
all three captures were visually inspected: **1296x939** light/dark, mean brightness
**226.91/50.74**, and **736x819** compact, brightness **54.17**. Physical Generate
input was submitted, but its post-click driver failed with
`You cannot call a method on a null-valued expression.` The only subsequent nullable
instance method is the UIA name's `Contains`; this is a strong harness diagnosis,
not a stack-confirmed location because the original receipt lacked a stack. No
production defect is demonstrated. The observation marker stays locked and the app
honestly times out at physical-send. Phase 1 has **7/20** assertions and one reviewed
body digest, without the required five-body proof. Accept and phase 2 remain missing.
Do not promote the continue-on-error step's success conclusion: raw native outcome
and terminal audit are failure. No new build; phase 2 was not launched. App terminal
cleanup and outer receipt prove credential references removed/root deleted, retaining
**48** fixture hashes. Cumulative **Windows 1/4 builds, 2/6 launches**; remaining
**3 builds, 4 launches**. Mac remains **1/4 builds, 3/6 launches**, qualified.

The user's latest request explicitly authorized one new **GPT-6.1 Sol High** agent to
review/fix this failure, narrowly superseding earlier no-subagent directions. Work
was serial: parent audited, the sole child reviewed/applied the two harness files,
then released writer ownership; parent independently reviewed and verified. No
other agents, other-computer access or extra allowance. The existing driver now
ignores unnamed UIA nodes, requires a present button with exact enabled/disabled state,
and retries only stale `ElementNotAvailableException` (including wrapped exceptions)
within the unchanged **20-second** poll. Other errors propagate. Control inventory
uses the same bounded stale handling. Receipts retain error type/ID/stack/position
and stale retry count. Missing controls can never establish disabled-state proof.

The existing admitted reuse-test file adds a Windows-only regression executing the
real PowerShell helpers through AST extraction and synthetic UIA states, before any
app launch: null/empty/singleton names, absent/wrong button states, direct/wrapped stale
exceptions and immediate propagation of other failures. Parent/reviewer checks pass:
native gate **4/4**, report gate **2/2**, existing reuse gates **4/4**, Python syntax,
Actions schema/context checks, repository/privacy **487 files** and diff whitespace.
The new actual PowerShell regression is **skipped on Mac**, where PowerShell is
unavailable; it must pass on Windows before a native launch. No new admitted paths,
production edits, package rebuild or inferred Windows runtime pass.

Next authorized retry selects the same workflow, package/SDK source **38023888008**,
portable source **38027478869**, build ordinal **2** unused, first launch **3** and
dependent phase-2 launch **4**. Reserve **zero builds/up to two launches**. Required
20 checks/five exact HTTP bodies, all five native stage receipts/captures, physical
Generate/Accept, separate-process persistence/whole bytes/zero HTTP and cleanup remain.
Publish/verify before dispatch, confirm identity, then manual same-thread wait/resume.
Mac and accepted prompt/context evidence remain valid; no merge/release/next feature.

### Confirmed native polling repair retry — 2026-10-10

**State: awaiting_ci.** Parent reviewed, published and verified the repair at
`69ddf5a8b6cbb9e3e3adae863a5a1e2eb58b029d` before dispatch. No active duplicate
existed. Workflow **357322921**, `production-scaffold.yml`,
[run **38030871532**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38030871532),
attempt **1**, event `workflow_dispatch`, branch `codex/provider-qualification`,
exact head `69ddf5a8b6cbb9e3e3adae863a5a1e2eb58b029d`.
Created **2026-10-10 06:25:20 UTC**; last observed **in_progress at 06:25:33 UTC**.
Selected Windows job **114151363778** started, setup/checkout passed, bounded guards
in progress; generic jobs skipped. Material inputs: `dialogue_rewrite_windows=true`,
`upload_packages=false`, `rewrite_reuse_run_id=38023888008`,
`rewrite_focused_reuse_run_id=38027478869`, build ordinal **2** unused,
first launch ordinal **3**, dependent phase-2 ordinal **4**. Artifact
`rewrite-windows-38030871532-1` has **7 days retention after upload**; upload and
terminal results are pending. Known totals at checkout **Windows 1/4 builds,
2/6 launches**, reserving **zero builds/up to two launches**. Actual later consumption
requires terminal audit. Mac remains **1/4 builds, 3/6 launches**, qualified.

Docs-only successor records this tested candidate without replacing it. Stop active
polling; manual same-chat resume audits the exact run/attempt, PowerShell regression,
source reuse/prelaunch, attempt ledger, all five native receipts/PNGs, required
20 phase-1 assertions/five exact HTTP bodies, separate-process persistence/whole bytes,
zero HTTP and cleanup. Missing/failed/skipped evidence stays unresolved. No new
runtime pass or allowance reset is claimed; no merge/release/next feature.

### Successful Windows native audit and npm pin finding — 2026-10-10

[Run **38030871532**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38030871532),
workflow **357322921**, attempt **1**, exact candidate
`69ddf5a8b6cbb9e3e3adae863a5a1e2eb58b029d`, completed **success** at
**2026-10-10 06:29:05 UTC**. Selected Windows job **114151363778** only; generic
jobs skipped. Artifact **11661993663**, `rewrite-windows-38030871532-1`, expires
**2026-10-17 06:28:02 UTC**. All **73** manifest hashes verify in ignored
`.toolchains/rewrite-windows-ci-38030871532`; raw workflow log is retained outside Git.
All five terminal raw outcomes are success; both reports pass with no terminal errors.
Actual Windows PowerShell polling regression passes (reuse test suite **5/5**, no skip),
confirming the serial reviewer's repair. Native/report gates **4/4, 2/2** pass.

App launch **3**, PID **9196**, passes all **20 distinct phase-1 assertions** in
**26.75 seconds** (21 recorded entries include a repeated preparation check, not an
extra required case). Five actual HTTP request SHA256 digests equal all five reviewed
bodies in order. Light/dark/compact and physical Generate/Accept receipts independently
validate against the exact PID/binary, Default desktop, visible controls, captures and
observed resulting states. All **7** PNGs were visually inspected: light/dark
**1296x939**, compact/actions **736x819**; before/after action captures differ, display
inert proposal then saved state. Every observation marker had actual validated native
evidence before release. Stale retry counters are zero; no relaxed gate was needed.
Physical acceptance saves once/blocks duplicate action; literal encoding/protected
source, custom neighbors, byte-exact Undo/Redo, malformed/unsafe/cancel/stale zero
writes and project reopen pass. This is actual UIA/OS-input automation, not a claim
of human native acceptance.

Separate app launch **4**, PID **7200**, passes **3/3** process-reopen assertions in
**3.41 seconds**: accepted literal source/protected tokens, custom prompt and native
credential readability. Zero HTTP and whole-project before/after bytes compare equal
in the executed probe; all four metadata hashes match phase 1. Both processes finish
successfully; terminal native credential cleanup and outer fixture deletion pass,
retaining **71** fixture hashes. Package/SDK source **38023888008** and portable source
**38027478869** were reused; original executable remains
`6e4699d437f6f61a70b990008ac8ef28d112a28e9cab29e85ed6fc83952beaf9`.
No new build. Cumulative **Windows 1/4 builds, 4/6 launches**; remaining **3 builds,
2 launches**. Mac remains **1/4 builds, 3/6 launches**, qualified. Native behavior
proof is passed, while the following newly identified toolchain mismatch prevents
unqualified closure of the required pinned package candidate.

Audit of actual identity/commands found **npm 11.17.0**, despite the workflow's global
installation of repository-required **11.9.0**. The same mismatch exists in the
original package and portable-source identities; earlier claims of selected pinned
npm must be read with this correction. Node **24.19.0**, Rust/Cargo **1.90.0**,
Python **3.12.10**, Windows AMD64 runner image **20260925.250.1** are recorded.
This is a CI command-route defect, not a production/native failure. Installing global
npm did not select it over the Node toolcache's bundled executable; the Python route
also derived the CLI from whichever shim PATH found. Source/lock bytes remain unchanged,
but the required toolchain cannot be inferred from a successful install command.

Scoped fix selects the actual installed global npm CLI, checks **11.9.0** before
installing dependencies, prepends its shim directory for nested scripts/next steps,
and exports its exact CLI path to the existing Python recipe. Candidate identities
and reuse admissions now reject Node/npm versions differing from app/package.json;
old drifted source artifacts remain honest historical evidence and cannot establish
pinned-toolchain reuse. No production, signing, credential, SDK or dependency changes.
Local explicit CLI/version execution passes **Node 24.19.0/npm 11.9.0**. New drift
rejection test passes; native/report/reuse suites **4/4, 2/2, 5 passed + 1 Windows-only
skip**, Python syntax, actionlint, repository/privacy **487 files** and diff checks pass.
The previously skipped actual PowerShell test has now passed on the audited Windows
run. Windows runtime of the new npm route remains pending CI.

Next bounded run uses the same focused workflow with **no package or portable reuse**,
package-build ordinal **2**, first launch **5**, dependent phase-2 launch **6**.
Reserve **one build/up to two launches** within the original allowance. Re-run selected
renderer/core/transport/native/controller, pinned SDK and coherent package walkthrough
because the actual toolchain changes. Completed Mac proof remains valid. Publish/verify
before dispatch, record exact identity, then manual same-chat wait/resume. No additional
agent, merge/release or next feature; missing proof is not waived or reset.

### Confirmed pinned npm package qualification — 2026-10-10

**State: awaiting_ci.** Reviewed correction published and remote verified at
`95ce9c4fbad12cec24e8eda851b1baff1c4beec8` before dispatch. No active duplicate
existed. Workflow **357322921**, `production-scaffold.yml`,
[run **38031993657**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38031993657),
attempt **1**, event `workflow_dispatch`, branch `codex/provider-qualification`,
exact head `95ce9c4fbad12cec24e8eda851b1baff1c4beec8`. Created
**2026-10-10 06:44:43 UTC**; observed **in_progress at 06:44:55 UTC**.
Selected Windows job **114154697854** setup passed, checkout in progress;
generic preflight/package matrix skipped. Material inputs:
`dialogue_rewrite_windows=true`, `upload_packages=false`, build ordinal **2**,
first launch ordinal **5**, dependent phase-2 ordinal **6**, both reuse inputs **empty**.
Reserve **one package build/up to two launches**; actual use must be audited.
Known cumulative Windows **1/4 builds, 4/6 launches**, Mac **1/4 builds, 3/6 launches**.
Artifact `rewrite-windows-38031993657-1` has **7 days retention after upload**;
upload/terminal results remain unobserved. Successful native proof from the preceding
run stays preserved on its real binary/toolchain; no pinned-npm runtime pass is inferred.

Docs-only successor records this tested correction. End active polling for manual
same-chat resume. Audit npm CLI/version **11.9.0**, exact candidate/source/binary,
fresh selected cases/official SDK, package scan, attempt ledger, all native receipt/PNG
assertions, 20 phase-1 checks/five reviewed HTTP bodies, independent process reopen,
zero HTTP/whole-project bytes and cleanup. Failed/skipped/missing proof stays unresolved;
these are final launch slots if both are consumed, with no allowance reset or inferred
extra retry. No merge/release or next feature.

### Final pinned Windows audit and both-target qualification — 2026-10-10

**Selected first safe dialogue rewrite: accepted.** Mac proof remains valid; the
remaining Windows selected qualification is complete. This accepts this bounded
slice, not full 2B.1/2A.2/Phase 2, a live provider, merge or release.

[Run **38031993657**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38031993657),
workflow **357322921**, attempt **1**, exact tested candidate
`95ce9c4fbad12cec24e8eda851b1baff1c4beec8`, tree
`232d369885e6a61d13be2869229a6e5f5816bcc5`, completed **success** at
**2026-10-10 06:55:14 UTC** (run updated 06:55:15 UTC). Selected Windows job
**114154697854** only; generic matrix skipped. Material inputs: focused Windows true,
package upload false, both reuse IDs empty, build ordinal **2**, launch ordinals **5/6**.
Artifact **11662561927**, `rewrite-windows-38031993657-1`, expires
**2026-10-17 06:55:08 UTC**; ignored local copy
`.toolchains/rewrite-windows-ci-38031993657` and raw workflow log are retained.
All **76** manifest file hashes verify. Candidate/tree agree with Git and package
inventory; all **228** overlapping focused/package input hashes agree (SDK spike and
phase-1h fixture inventories deliberately have different scopes). Fresh checks and
package have no reuse receipts. All five raw terminal outcomes are success, both
reports present/passed, no terminal errors.

Actual **Node 24.19.0/npm 11.9.0/Rust and Cargo 1.90.0/Python 3.12.10** are recorded
on Windows AMD64 image **20260925.250.1**; actual npm route/pin checks pass, closing
the prior mismatch. Fresh renderer **123/123**, core rewrite **9/9**, transport
**8/8**, native worker **6/6**, actual controller/native credentials/strict HTTP and
frontend build pass. Native/report/reuse-drift gates **4/4, 2/2, 6/6**, including
actual PowerShell null/stale polling and version-drift rejection, pass without skips.
Official Ren'Py **8.5.3** archive equals published SHA256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`;
fresh compile/lint/substitution/token and named startup/say/return test pass:
**1 case, 3 assertions, zero failures/skips/not-run**. Owned SDK extraction is removed.

Package build **2** passes and retained executable/installers are privacy scanned.
Exact executable SHA256:
`0ddcdca0f6af13f9a7fcfb9cc97fa8f79aad332785c03e48cdfbff18e22616a3`.
App launch **5**, PID **588**, passes **20 distinct phase-1 assertions** in
**22.05 seconds**; repeated preparation entry is not an extra required case.
All five actual HTTP body hashes equal reviewed bodies in order. Every native stage
receipt independently validates against this exact PID/binary, unlocked Default
desktop, actual visible controls and intact captures. All **7** PNGs visually inspected:
light/dark **1296x939**, compact and actions **736x819**; before/after Generate/Accept
states show inert review and saved-once result. Receipt/marker ordering retains actual
evidence before acknowledgement; zero stale retries. UIA/OS-input automation is
native proof, not a human-acceptance claim. Literal generated expressions/tags,
protected tokens/custom neighbors, one transaction/duplicate refusal, byte-exact
Undo/Redo, malformed/unsafe/cancel/stale zero writes and project reopen all pass.

Separate launch **6**, PID **2228**, passes **3/3** persistence assertions in
**4.55 seconds**. Accepted literal source/protected tokens, custom prompt and native
credential remain readable; zero HTTP and whole-project before/after bytes match
in the executed probe. All four metadata hashes match phase 1. Both distinct PIDs
finish successfully; native synthetic credential removed, listener lifetimes closed
and owned fixture deletion confirmed, retaining **71** structural hashes.

Final cumulative consumption: **Mac 1/4 builds, 3/6 launches; Windows 2/4 builds,
6/6 launches**. Windows remaining package allowance **2**, launch allowance **0**;
no more launch is authorized by this slice. Earlier failed setup/geometry/hash/UIA
and mismatched-npm evidence remains historical, not converted to passes. Completed
Mac signing/identity and prompt/context/manual-reference evidence are unchanged.
No product/signing/credential policy or dependency changes were needed for these CI
repairs. No local Windows handoff is required; no outstanding selected case or CI
operation. Docs-only closure successor records this tested candidate; publish/verify
records without another package matrix. Further feature, merge or release needs its
own selection.

## First safe dialogue rewrite selection — 2026-10-10

**Routing superseded:** the [CI-first amendment](#ci-first-platform-qualification-amendment--2026-10-10)
owns current execution routing. The original selection and completed local records
below preserve scope, evidence and allowance history.

User-selected outcome on published `e5f09c44e11549da3bf46b29ec8dc6061d0251de`,
branch `codex/provider-qualification`. One local Mac ARM64 GPT-6.1 Sol High owner,
no subagents or direct other-host execution. Finish local implementation, focused
checks, review and packaged proof, then publish/verify and transfer the same branch
serially to Windows x64. Both hosts are required because send/review/source and
transaction paths change. The prompt/context and manual reference foundations are
qualified on both hosts; reuse their unchanged evidence.

Scope: one saved ordinary dialogue/narration Beat, explicit exact approved references,
complete destination/body review, one explicit send, closed structured response,
static semantic/exact source review, one acceptance through shared transaction/history,
Undo and reopen. Protected existing interpolation/formatting uses core-owned
revision-bound opaque tokens; generated literals are encoded for source and display.
Malformed, cancelled, unsafe and stale output writes nothing. No paid/public calls,
project-code execution during inspection, generated references, route expansion,
other action, full 2B.1/2A.2/Phase 2 acceptance or merge/release.

**Cumulative allowance for this distinct outcome:** Mac **0/4 package builds,
0/6 app launches**; Windows **0/4 builds, 0/6 launches**. Count failures/cancellations
and implicit launches; preparation or handoff does not reset this outcome's totals.
Prior outcome allowances remain recorded in their ledgers and are not borrowed.

### Request/credential prerequisite and remote reconciliation

The initial clean Mac checkout was `baf7dbf`; fresh remote inspection found Windows
qualification `e5f09c4`, and the owner fast-forwarded before editing. Existing native
credential capture, profile/session revision binding, one-worker cancellation and
loopback-only bounded transport can support the selected disposable synthetic send.
The existing API emits only a fixed diagnostic body, so reviewed body/schema/token
integration is necessary implementation within this selected outcome, not a claim
that the preview-only API already sends context. Destination expansion is excluded.

Focused baseline proof: `cargo test -p loomlight-core --locked ai_request::tests`
passes **8/8**; `cargo test -p loomlight-desktop --locked ai_requests::tests` passes
**6/6** (existing Windows-selector unused warning). The first sandboxed core run
passed four parser/body tests and failed four local socket binds with EPERM before
transport; the exact selected suite passed with authorized loopback access. No
provider call, native credential entry, package build or app launch occurred.
Implementation and required changed-path qualification remain in progress.

### Implementation, review and Mac package entry — 2026-10-10

Core now owns a transient reviewed request, closed response schema, revision-bound
protected tokens and stored exact proposal; only explicit native send uses the
captured body and existing credential reader. Acceptance revalidates source and
metadata identities, relevant draft generations, profile and session, then consumes
once through the shared transaction/history. The renderer shows passive complete
body, semantic text and exact source/map patches. It retains tasks across refusal,
shares the persistence lane and refuses dirty or changed author input.

Review found and fixed a zero-write defect: validating stale external source through
context preview could reconcile source-map metadata. Raw read-set validation now
precedes any projection refresh. Review also found the nonmodal Scene input gap;
author-input generation binding and Source retention barriers now guard prepare,
send and acceptance. Typecheck passes; selected renderer checks pass 18/18; core
rewrite filter passes 9/9 (four rewrite workflow, four literal boundary, one existing
source-preservation case); transport 8/8 and native worker 6/6 pass. Actual controller
→ native synthetic credentials/strict loopback HTTP → core review/accept/history
passes, including held-owner, cancellation, malformed and stale no-write cases.
Pinned Ren'Py 8.5.3 compile/lint and actual substitution/text tokenizer assertions
prove generated calls/action tags display literally and existing protected tokens
still work. Native evidence gate self-tests pass 2/2, with partial/zero/unclean
reports refused. Repository validation and diff whitespace pass.

A Python compile-cache permission failure was harness-only; AST parsing and tests
with an ignored cache passed. Native Computer Use can enumerate and inspect Finder,
although the initial binding took unusually long; no Loomlight app was launched.
Sandbox signing inventory was unavailable; authorized native read found exactly
the pinned local identity. Its existing self-signed trust status is unchanged.

Mac package **attempt 1/4** is now entered using the approved wrapper and unchanged
identity/requirement. Mac launches remain **0/6**. Windows remains **0/4 builds,
0/6 launches**. Build/fixture/observations remain to qualify; no pass is inferred.

Mac build 1/4 passed strict signature/pinned identity/designated requirement and
installer-content checks. Executable SHA256
`6dd22e8e5f9ac8614c45c066c3ec663377560331b307fa518145a3129dba28a6`;
installer SHA256
`028affe7b63ebd7ecee59c4cd186710a310ab7b928ee4cb7f7dc2cf534b131ab`.
Artifact privacy scan passed. Initial scan named a nonexistent installer filename;
corrected artifact discovery used the produced `Loomlight.dmg` and passed.
Mac launch **1/6** is entered for phase 1, retaining structural receipts/logs under
ignored `.toolchains/rewrite-mac-launch-01`. No accepted native result yet.

### Mac native capability stop and published implementation checkpoint

Mac launch 1/6, PID 95027, reached `observe-light` after exact choices, preparation
and body/disclosure checks, but Computer Use returned: “The Mac is locked and
automatic unlock could not unlock it.” Manual unlock was requested. No physical
Generate/Accept occurred and no provider request was made. The observation deadline
elapsed without a terminal WebView report; the exact verified owned PID was
terminated and the runner exited 1, correctly refusing missing required proof.
This is missing native capability/evidence, not acceptance or an established product
defect. Failed stage/log/structural receipt and project hashes are retained ignored
under `.toolchains/rewrite-mac-launch-01`; owned project and synthetic file credentials
are removed. No retry on a locked desktop and no pending test process remains.

Final renderer regression passes **122/122**, zero failures/skips/cancellations.
One additional focused lane regression proves all four rewrite operations wait for
Source retention once while status/cancellation remain responsive; the affected
renderer selection now passes **19/19**. This test-only addition does not change
packaged production inputs.
Packaged production source inputs still match the ignored build-1 manifest. The
additional required standard-template SDK smoke generates the normal GUI/assets,
passes compile/lint and real substitution/token assertions, then its named GUI test
remains unproven. First invocation had wrong SDK cwd; corrected invocation exposed a
fixture `import renpy` shadowing the script API; aliases fixed that harness defect.
The next named startup/say/return test timed out after 60 seconds on the locked host,
with no owned residual process. It is not counted as a pass or a source defect.
Initial minimal-template literal assertions remain valid. Retry the corrected named
test when interactive execution is available; preserve these failure classifications.

**Current cumulative use:** Mac **1/4 builds, 1/6 app launches**; Windows **0/4
builds, 0/6 launches**. Package 1 is valid and unchanged; no rebuild is indicated
solely for unlock or the SDK-harness correction. Required Mac walkthrough/reopen,
standard-template runtime and then serial Windows proof remain open. Implementation
is published as an incomplete qualification checkpoint; full 2B.1/2A.2/Phase 2 is
not accepted. One local owner, no subagents or direct other-host execution.

Published implementation `515cd8538efc7ead72ef3d0e8852a192729ec8a2` on the same
branch; local HEAD and fresh `git ls-remote` matched. Repository-local noreply
identity used; worktree, exact failed PID and disposable fixture confirmed clean.
No merge/release/install or other-host execution. Native/manual unlock remains the
only next host capability needed before retrying required runtime proof.


### Unlocked Mac resume and retained candidate — 2026-10-10

Resumed clean verified `12c99de`, preserving implementation `515cd85`; fresh remote
lookup matches. Computer Use Finder AX and screenshot confirm unlocked native
observation before another Loomlight launch. All 116 retained build-input hashes
match; executable remains `6dd22e8e5f9ac8614c45c066c3ec663377560331b307fa518145a3129dba28a6`.
No rebuild is indicated; prior both-target prompt/context acceptance is preserved.

Unlocked SDK rerun passes compile/lint and literal assertions but times out after
60 seconds. Live SDK log narrows the harness failure: startup menu and say assertions
pass; the final menu assertion runs while dialogue remains. Pinned SDK `Advance`
waits for another dialogue line; corrected test uses `advance until screen
"main_menu"` and suite teardown `exit` so failure also terminates. Corrected rerun
passes compile/lint, literal substitution/tokenization and named startup/say/return
smoke. This changes only the SDK fixture, not production/package inputs.

Mac launch **2/6** is entered for retained-package phase 1 with fresh ignored output
`.toolchains/rewrite-mac-launch-02` and owned temp-child `loomlight-rewrite-mac-02`.
Physical Generate/Accept and light/dark/compact observations remain required; no
native pass is inferred. Cumulative use is **Mac 1/4 builds, 2/6 launches; Windows
0/4 builds, 0/6 launches**. One serial Mac owner, no subagents or other-host execution.


Mac launch 2 phase 1 **passes**, exact owned PID `98778` exited 0. Required native
light/dark/720px compact observation and Computer Use physical Generate/Accept
were completed before their stage markers. Native review shows passive generated
`[str(7)]`/`{a=jump:label}` prose and source encoding, preserved `[flag]`/bold tokens,
comments/custom neighbors and accessible scrolling/sticky controls. Required gate
accepts all 20 distinct checks; all five HTTP body digests match reviewed payloads.
Undo/Redo are byte exact; malformed/unsafe/cancelled output and stale external-source
acceptance write nothing. Project reopen passes; cleanup is reported complete.
Evidence is retained ignored in `.toolchains/rewrite-mac-launch-02/phase-1.json`
and its log. Owned fixture/credential remain only for dependent process-reopen proof.

Mac launch **3/6** is entered for phase 2 with the same verified executable, root
and output. It must retain byte-exact whole-project state, custom prompt and native
credential readability, send zero HTTP and remove the owned synthetic credential.
Cumulative use: **Mac 1/4 builds, 3/6 launches; Windows 0/4 builds, 0/6 launches**.


### Mac qualification complete and serial Windows transfer — 2026-10-10

**Routing superseded:** the [CI-first amendment](#ci-first-platform-qualification-amendment--2026-10-10)
replaces this record's local transfer directions. Required cases, Mac results and
cumulative usage below are preserved.

Mac launch 3 phase 2 **passes**, exact owned PID `98832` exited 0. All three
process-reopen checks pass in 3.18 seconds; zero HTTP requests and byte-exact
whole-project comparison pass. The accepted literal source/protected tokens and
custom prompt persist; native credential readability is proved before cleanup.
All four project metadata digests match phase 1. Phase 1 elapsed 120.68 seconds.
Reports/logs remain ignored in `.toolchains/rewrite-mac-launch-02`; its cleanup
receipt retains whole-fixture hashes. Profile credential references are confirmed
removed, all exact owned app/SDK PIDs are absent, and only the owned disposable
fixture is deleted. Prior launch-1 failure evidence remains untouched.

Retained signed package 1 is the qualified Mac candidate, continuing implementation
`515cd85`: executable SHA256
`6dd22e8e5f9ac8614c45c066c3ec663377560331b307fa518145a3129dba28a6`.
All 116 input hashes match before reuse. Native wrapper verification again passes
strict signature, pinned certificate and designated requirement. A sandbox-only
`codesign` check returned `CSSMERR_TP_NOT_TRUSTED`; the approved wrapper with native
Keychain access passes without a signing/trust/policy change. Installer/privacy
proof from unchanged build 1 is reused. SDK harness review confirms the corrected
bounded `advance until screen "main_menu"` plus teardown retains all assertions
and exits on failure; actual pinned 8.5.3 standard-template smoke passes. No
production change or package rebuild was necessary. Existing core/native/controller
and 122/122 renderer regression evidence remains valid on unchanged inputs.

**Final Mac cumulative use: 1/4 package builds, 3/6 app launches. Windows remains
0/4 builds, 0/6 launches.** Mac selected-slice qualification is complete; required
Windows proof is outstanding, so the both-target outcome remains incomplete.
Prior prompt/context/manual-reference both-target acceptance is preserved. One
GPT-6.1 Sol High serial owner, no subagents or direct other-host execution.

Final in-scope review found no production defect in the successful native path;
the SDK harness correction preserves all assertions and gives deterministic teardown.
Repository validation passes for 482 files; link/privacy and diff-whitespace checks
pass. Publish the coherent SDK-harness/qualification continuation on the same
authorized branch and verify remote equality before transfer. No merge, release,
installation or broader Phase 2 acceptance.

Windows next owner: reconcile/pull this same branch without resetting unrelated work;
read AGENTS/CURRENT/HANDOVER and this selected ledger. Confirm interactive native
observation and pinned toolchain/official checksum-verified Ren'Py 8.5.3 readiness
before package entry. From `app`, run affected `cargo test -p loomlight-core --locked
rewrite`, `cargo test -p loomlight-core --locked ai_request::tests`, `cargo test -p
loomlight-desktop --locked ai_requests::tests`, renderer `npm run check`, and build
examples `rewrite-controller-driver` (desktop) / `rewrite-literal-driver` (core).
Use `node tests/rewrite-controller.dispatch.mjs` with the actual native example
executable and `scripts/rewrite-literal-sdk.py` with pinned SDK/literal driver.
Run native gate self-tests, repository validator and diff/privacy checks. Record
cumulative package/launch entry before the ordinary Windows package command.

Qualify the Windows package with `scripts/dialogue-rewrite-probe.py --phase 1`,
a fresh ignored output and a fresh immediate temp-child `loomlight-rewrite-*` root.
Verify the exact owned executable/PID; observe light/dark/compact, physically
Generate/Accept through Computer Use, and acknowledge each stage only after its
actual observation/action. Do not relax markers or gates. Phase 1 must pass all
20 distinct checks and five exact reviewed HTTP digests before phase 2. Retain
its owned root/output, record the separate-process launch, run `--phase 2`, and
prove whole-project byte equality plus zero HTTP and native credential cleanup.
Remove only the owned fixture after confirmed process exit. Diagnose failures
before retry within Windows 4-build/6-launch allowance. Review/fix in scope,
update records, publish/verify; do not repeat unchanged Mac proof unless changed
production inputs require reassessment. No paid/public calls, private game content,
project execution during inspection, generated references, route expansion, other
AI action, full 2B.1/2A.2/Phase 2 acceptance, merge or release.

## Prompts and context preparation selection — 2026-10-10

User-selected new outcome on published `92a33180604ce851aa8ebc47e5c336da81aedf57`,
branch `codex/provider-qualification`. One GPT-6.1 Sol High serial owner, no subagents.
Local Mac ARM64 first; publish/verify this branch, then transfer one owner to Windows
x64 without direct other-host execution. The clean Mac checkout safely fast-forwarded
from `dc889d6`; the unrelated planning worktree is preserved.

Scope: project-local `rewriteDialogue` authoring prose, explicit Save, installed baseline
comparison/confirmed restore, shared Undo/Redo and reopen; exact approved card/lore
revision selection and deterministic bounded read-only preview for one saved dialogue
or narration Beat. Show effective system instructions, separate task/style notes,
core response/authority contract, inclusion/exclusion, dependencies, source/metadata
read revisions and full serialized content/size accounting. Refuse stale selections,
relevant drafts/conflicts and over-budget totals; never truncate or silently drop.
Provider sends, credential/HTTP changes, proposals/application, generated references,
automatic retrieval, import/export, finite-route expansion, full 2B.1 and Phase 2 claims
are excluded. Bundled prompts have one versioned resource location; overrides use the
canonical `.renpy-editor/ai.json` and existing transactional metadata history.

User-authorized publication is limited to this outcome on the same branch. No merge,
release or installation. Cumulative ceiling per target: **3 package builds / 4 app
launches** including handoffs and implicit launches. Entry usage: Mac **0/3, 0/4**;
Windows **0/3, 0/4**. Diagnose a failure before retry; two-correction reassessment applies.
Focused core and controller/dispatch proof precedes affected signed native qualification.
Disposable fixtures only; unchanged manual-library/provider evidence is reused.

### Prompt/context focused gates and package preflight — 2026-10-10

Five core production-handler tests pass: prompt Save/restore/consecutive Undo/Redo,
source and unrelated-settings preservation, reopen/isolation, deterministic exact card/lore
payload and dependencies, exact budget/capacity boundaries, stale selections/citations,
external prompt edit, invalid/newer/duplicate-key metadata, relevant Source draft and
prompt size refusals, installed baseline update retaining custom prose/extensions.
Two controller DOM tests and ten selected protocol/reference tests pass. The real
controller → `ApplicationHost` dispatch → persistence integration passes Save,
restore preview/cancel/confirm, Undo/Redo, complete payload and budget refusal. The
native report gate rejects missing/zero/partial checks, failed results and incomplete
cleanup. Typecheck, native JS syntax, Python source compilation and desktop test
compilation pass. No provider sends or SDK/game execution.

Cheap preflight failures were diagnosed before correction: positive fixture initially
contained proposed lore, then its unresolved citation was correctly refused; the
positive fixture now explicitly supplies approved uncited lore. Controller/protocol
allowlist expectation lacked the four new typed operations; updated that contract.
Probe-only Rust conversion was corrected. Python bytecode output initially targeted
a non-writable system cache; source compilation and an owned temp cache pass.
No package or app launch was consumed by those cheap checks.

**Package attempt 1/3** stopped before compilation: the sandboxed signing lookup
returned zero identities. Identical read-only lookup outside the sandbox found the
exact pinned `358372708164C7273A551D746449357C12A3A806` local development identity.
Classified as sandbox access limitation; no signing/trust/ACL/credential policy change.
No bundle/build log directory or app process was produced. **Attempt 2/3** uses the
same reviewed wrapper and pinned identity outside that sandbox. App starts remain
Mac **0/4**, Windows **0/4**; Windows builds remain **0/3**.

### Prompt/context review corrections and final Mac candidate — 2026-10-10

Package attempt **2/3** passed the unchanged identity/signature/installer gates.
Executable SHA256 `24b078a9a02584b422b73e34507932b7bfd0a2c7585a3169b7d96f65dfe93147`;
installer `726b70a8955fd87da76bb3e92fbd88efc2b41534e393953cb104ed3cd470ed73`.
It was not launched. Review identified two in-scope findings before native attempts:

- A native textarea normalizes CRLF to LF. Comparing displayed text against raw saved
  text would falsely mark an unchanged override dirty and block navigation indefinitely.
  Compare with the captured displayed baseline; untouched stored bytes are never saved.
  Actual Chrome reproduces the prior comparison, then passes the corrected controller
  with zero writes. The browser first failed inside the sandbox, then its disposable
  HTML harness lacked an HTML content type; neither result was a product pass. The
  corrected harness explicitly exercises the previous comparator as the rejecting
  control and the current comparator as the passing case. Probe-author input uses LF,
  matching actual textarea input; core tests separately retain exact CRLF prompt bytes.
- Dependency disclosure initially covered linked lore and unresolved issues but omitted
  resolved links, relationship/knowledge/citation edges and included speaking/default
  definitions. These are now enumerated without automatic expansion. Stale-reference
  diagnostics name the exact record/revision. Unknown nested extensions remain excluded
  from payload and preserved on disk. Undo/Redo labels correctly describe shared project
  history, and hidden controls are excluded from Settings focus trapping.

Five prompt core tests, controller tests/typecheck and probe syntax pass after corrections.
**Package attempt 3/3** rebuilds those changed inputs with the same pinned identity;
no further Mac package attempt remains after it. Native starts remain Mac **0/4**;
Windows remains **0/3 builds, 0/4 starts**. Same outcome and cumulative allowance.

### Final signed candidate and locked-Mac qualification stop — 2026-10-10

Final package attempt **3/3** passed approved bundle name/identifier, pinned certificate,
certificate-bound designated requirement, strict signature and installer-content gates.
Executable SHA256 `fe90b9069630db56b156ddab9f26dd49bc4dda60219608d329a3e3a6988edf0e`;
installer `82d97392b7c4da69f3933ae1e61ee58f293156dadeee8d1f11cd996a7054f1a9`.
Privacy scan passed for all five app/installer files. Signed package, receipts and
source-input hashes remain ignored under `.toolchains/releases/prompt-context-mac-03`.
No installation, SDK/game execution, provider send or signing-policy change occurred.
Final real-controller/production-dispatch integration, core/controller/typecheck and
three actual-transaction history-continuity regressions pass. Repository link/privacy
validation passes for 467 files. Self-review corrected the two scoped findings above;
no independent reviewer was requested/delegated.

**Native launch 1/4**, PID 85833, reached `manual-save` after synthetic form entry.
Computer Use reported the Mac locked and automatic unlock unavailable. The user was
asked to unlock and reply ready. No physical Save, focus, screenshot/layout observation
or marker release occurred; **zero native acceptance checks**. The WebView remained
at the pause after more than three minutes, consistent with unavailable locked-screen
observation/suspended timers. Stop only that owned PID with SIGTERM; the runner exits
failed rather than accepting absent results. This is **cancelled, missing evidence**,
not a product pass. PID absence was confirmed outside the filesystem sandbox, and the
exact owned synthetic root was removed. No process/fixture/pending operation remains.
The log and structural `phase-1-cancelled.json` retain hashes under
`.toolchains/reports/prompt-context-mac-01`; no success phase-1 or reopen receipt exists.

**Current state: blocked on required native UI access**, with implementation/focused
proof reviewed and complete for the selected portable paths. Cumulative usage is Mac
**3/3 package attempts, 1/4 launches**; Windows **0/3 builds, 0/4 launches**. The final
unchanged signed package may use a remaining Mac launch after actual unlock/capability
restoration; use a fresh owned root and new output directory, then phase 2 on the same
accepted fixture for byte-exact process reopen. No new package allowance, automatic
retry, other-host execution/ownership transfer or next feature is selected.

Work is committed locally for recovery. The user's sequence is finish this host,
publish/verify, then transfer Windows; publication is therefore pending required Mac
qualification rather than a new approval request. The remote checkpoint remains
`92a3318`. HANDOVER contains a same-host continuation, not a next-distinct outcome.
Both-target acceptance, full 2B.1 and Phase 2 remain incomplete.

### Unlocked Mac launch 2: diagnosed UI corrections and build allowance stop — 2026-10-10

The user unlocked Mac and selected same-outcome continuation with the retained signed
package. Its executable/installer and source-input hashes matched the retained candidate
before launch. **Launch 2/4**, owned PID 88105, used that unchanged executable in a fresh
disposable project. Computer Use succeeded when selecting the exact retained bundle;
initial name lookup timed out, and bundle-ID lookup was ambiguous. Neither lookup started
another process. Physical Cmd+S passed UI → dispatch → exact persisted custom prose,
with unrelated AI settings retained. The native accessibility state then showed focus
on document content; Tab moved to Application instead of continuing from the editor.

Twenty-four individual checks preceded failure: explicit Save, current/baseline preview,
Cancel/confirmed restore, Undo/Redo, protected draft, Settings reopen, exact approved
card/lore payload, determinism, budget/stale-selection refusal and external-prompt refusal/
retained draft/reload. At the next light-theme Settings reopen, the native UI displayed
“Another request is in progress.” with every prompt/context control disabled. The report
timed out with the last announced stage `external-prompt`; that stage label does not mean
the external-edit check failed. **Failed/incomplete native qualification**, not a phase-1
pass. Theme/compact observations, terminal source-preservation/project reopen and separate
process reopen remain missing. The app exited with cleanupComplete; PID absence was
confirmed and the exact owned fixture removed. Structural `phase-1-failed.json` and log
remain ignored under `.toolchains/reports/prompt-context-mac-02`. No pending app/fixture.

Classification: demonstrated product focus defect and unrecoverable initial-load refusal.
Source inspection found focus attempted while the textarea was disabled; all four new
operations also bypassed the existing renderer request lane, and the two safe reads
omitted its bounded busy retry. The exact competing request in the native run is unknown;
ordinary held-owner reproductions establish the missing ordering/recovery behavior.
Small corrections now queue prompt/context operations with persistence, retry only
prompt/choice reads, offer explicit initial-load Reload project prompts, and restore
focus after reenabling controls. Mutation/preview requests are never replayed. Review
also aligned the draft guard's displayed/keyboard-selected prompt tab. No core data,
source, provider, credential, HTTP, signing or unrelated settings change.

Failing-first held-request and missing-reload tests failed on the prior implementation;
the corrected implementation passes. Actual Chrome reproduces unfocused keyboard-button
Save/refusal before the correction and passes Save/refusal/reload focus afterward.
An initial Chrome expectation assumed disabling a focused textarea blurred it as on
Mac; Chrome retained focus. The harness was corrected to focus the real Save button,
without changing production behavior to satisfy that assumption. A happy-dom selector
was corrected to inspect its ARIA property, which its simulation does not reflect as
an attribute. Neither harness failure counted as native/product proof.

Final focused proof passes **17 TS cases** (3 prompt controller, 5 request lane, 9
protocol), actual controller → held `ApplicationHost` busy refusal → explicit reload →
persisted Save/restore/history and bounded preview/refusal, actual Chrome focus and
unchanged-CRLF checks, typecheck and probe syntax. The native gate now requires all
**21 phase-1 / 4 phase-2** checks, including physical enabled editor focus and three
observed layouts; its self-test rejects omission of each required check, failed/partial/
zero and unclean reports. Unchanged five core prompt and history/reference proofs are
reused. Integrated changes were self-reviewed; no independent reviewer/subagent.
Repository validation passes for 468 files and whitespace checks pass. CURRENT/HANDOVER
are 331/882 words. Read-only remote verification still resolves this branch to `92a3318`;
the unrelated planning worktree and repository-only noreply identity are preserved.

**Current usage: Mac 3/3 package attempts, 2/4 launches; Windows 0/3 builds, 0/4 launches.**
The prior package is retained as failure evidence and cannot qualify the corrected
inputs. No rebuild or third launch has occurred. One additional Mac package attempt
is the smallest necessary allowance change; the existing two remaining launches can
cover corrected phase 1 and byte-exact phase 2. This is a request pending user decision,
not renewed authorization. Local corrected work/records remain unpublished; the user's
finish-Mac → publish/verify → Windows sequence is preserved. No distinct next feature
is selected. HANDOVER owns the same-host continuation after that decision.

### Two additional Mac package attempts approved — 2026-10-10

The user explicitly approved **2 Mac package builds** after the diagnosed allowance
stop. This adds attempts 4/5 to the same outcome: Mac ceiling is now **5 package attempts,
4 app launches**, with entry consumption **3/5, 2/4**. Windows remains **0/3, 0/4**.
No launch renewal, signing/Keychain change, other-host execution or scope expansion.
Attempt 4 packages reviewed correction `33bf97f` once; attempt 5 is reserved and may
be used only after diagnosing any new failure. The remaining two launches cover corrected
phase 1 and byte-exact phase 2. Existing publication/Windows transfer authority applies
once this host qualifies; preserve all failed evidence and cumulative counts.

### Corrected Mac packaged acceptance and Windows transfer — 2026-10-10

Package attempt **4/5** built implementation/correction `33bf97f` through the existing
wrapper. Unchanged pinned certificate/identifier/designated requirement, strict signature,
installer contents and artifact privacy gates pass (five files). Executable SHA256
`384bf40030c5ece0000fa234a5f91c2cc0b63b0a224f4c510319d9a86add4e18`;
installer `be632bb96f3f5a4df683b246b7d4806b23eb57e8d90fb4de26ca0a079987a5ee`.
Source-input hashes include request-lane.ts and match the reviewed candidate. Package/
receipts/source binding remain ignored under `.toolchains/releases/prompt-context-mac-04`.
No installation, signing/Keychain policy change, provider send or game execution.

**Launch 3/4**, PID 89816, passed phase 1: **32 recorded checks, all 21 required gates**,
131.57 seconds, exit 0, cleanupComplete. Exact-path Computer Use observed the retained
corrected bundle. Physical Cmd+S saved exact custom prose; physical Tab moved to Restore
baseline and Shift+Tab returned to enabled editor focus. After releasing that observed
marker, the real UI/dispatch path passed preview/Cancel/confirmed baseline restore,
Undo/Redo, guarded draft, Settings reopen, exact approved card/lore inclusion,
deterministic full payload, budget/stale-selection refusals and external prompt conflict
with retained draft/explicit reload. The prior busy-load stop did not recur.

Wide light/dark and actual **720 × 780** compact dark windows were observed before
releasing their markers. Exact revision controls, input/output/margin totals, component
bytes, disclosure summaries and wrapped full inert payload remained readable/reachable.
Expanded dependencies showed excluded links without automatic expansion; compact Other
exclusions listed custom code/assets/extensions/credentials/Git/external files, and Tab
continued to Unrelated source drafts excluded. A Computer Use section-scroll call after
resize returned windowNotFoundAtPosition; a fresh tree and visible-label scroll succeeded
in the same launch. This was an observation-driver mapping issue, not a product correction
or skipped layout pass. Project close/reopen retained baseline removal and every game
source matched the initial text.

**Launch 4/4**, PID 89870, passed phase 2: **5 recorded checks, all 4 required gates**,
3.78 seconds, exit 0, cleanupComplete. The separate process displayed the installed
baseline and rebuilt the exact baseline/reference preview through production UI/IPC.
Complete AI/reference metadata bytes were identical across processes: ai.json SHA256
`9a583212a11cb30c4af6886cf953bfaa8c3055c127a6cc3b02865bac2b6644e4`;
references.json `7514646b62a56993b376931f23786f5151aebdc27d6dd523a0845a7a83160988`.
Unrelated futureAction/futureSettings/style notes are retained. Every source remains
unchanged. Both exact PIDs are absent; the sole owned accepted fixture was removed.
No process/fixture/pending operation remains; never observe a stopped app implicitly.

Both positive reports, logs and structural final-audit.json remain ignored under
`.toolchains/reports/prompt-context-mac-03`. The audit revalidates required gates, matching
metadata, source bindings and actual executable/installer hashes, and records cleanup.
Previously failed/cancelled reports retain their dispositions. Five focused core cases,
17 TS checks, actual held-host controller/dispatch/persistence integration, browser
focus/newline and history/reference regressions are reused on unchanged code. Final
self-review found no remaining selected Mac issue; no independent reviewer or subagent.

**Mac host is qualified for this selected outcome only. Usage: 4/5 builds, 4/4 launches.**
Attempt 5 is unused; no Mac launch remains. Windows is still **0/3 builds, 0/4 launches**
and requires focused target checks plus packaged prompt/context/physical focus/theme/
compact/source/process-reopen proof before both-target acceptance. This does not accept
full 2B.1 or Phase 2 or select dialogue sends. Canonical prompt/context and UI contracts,
CURRENT and HANDOVER now carry the implemented behavior and serial Windows continuation.
Publication covers this implementation and evidence successor on the same branch under
the user's existing outcome authority; the sender verifies the exact remote checkpoint
before handing ownership to Windows. Final repository validation passes for 468 files,
with clean whitespace and compact live records. No force-push,
merge, release, new feature or direct other-host execution.

### Windows prompt/context packaged acceptance — 2026-10-10

The serial Windows x64 owner fast-forwarded the clean existing
`codex/provider-qualification` checkout from `92a3318` to verified published
`baf7dbf`, retaining implementation `33bf97f` and preserving unrelated work.
Mac acceptance remains valid at **4/5 package attempts, 4/4 launches**. Windows
entry was **0/3 builds, 0/4 launches**. The same selected scope/exclusions and
cumulative allowance apply; no subagents or direct other-host execution.

Focused Windows proof: five `prompts::tests` core cases passed outside the
filesystem sandbox. Initial sandboxed failures were all `probe state: Io` at
temporary-profile creation, before prompt behavior. Typecheck, 17 selected
prompt UI/protocol/request-lane tests and the Python native-gate self-test passed.
Actual controller → held `ApplicationHost` dispatch → persistence covered busy
refusal/explicit reload, Save/restore/history, full preview and budget refusal.
Its sandboxed run likewise failed at profile creation. Outside the sandbox,
functional assertions passed but the driver exited 101 while removing its
Windows-held fixture. A one-line test-driver correction drops the shutdown host
before fixture removal; the exact rerun passed exit 0. Actual Chrome
failing-first/corrected CRLF and Save/refusal/reload focus checks passed outside
the loopback-restricted sandbox. No production behavior/dependency change was
made on Windows.

Final repository validation passed for 465 files and `git diff --check` passed.
The changed example passed direct `rustfmt --check`. Whole-workspace
`cargo fmt --check --all` reports formatting drift in unchanged source files
already present at `baf7dbf`; that global formatting gate is not claimed as a
pass and no unrelated formatting rewrite was made.

Windows package attempt **1/3** built the production x64 executable and NSIS
bundle offline, using the already diagnosed Tauri `build --bundles nsis -- --locked`
separator and ignored build-only npm shim. Both retained artifacts passed the
repository privacy scanner. Executable SHA256:
`39f790e530e8daf5f43ad0a775e888326ae345544ba136b9a26bc080e18c71f6`;
installer SHA256:
`f69772a55efca62d585f9e2df8dcdd9521118a788b42e3b39443243aa1543c76`.
No installation, SDK/game execution, provider send or profile change occurred.

Launch **1/4**, PID 24948, reached `manual-save` in a fresh owned fixture.
Computer Use listed exactly the retained package window but timed out getting
its state; the 180-second observation gate expired. The runtime emitted
`passed:false`, `cleanupComplete:true`, zero checks and exit 1. This is failed
missing observation evidence, not a product PASS. PID absence and exact fixture
cleanup were verified; the failed report/log remain ignored. Before retry, the
owner diagnosed window-access failure, verified the same package hash and used
separate window-list, binding, activation and state calls. No rebuild or product
change occurred.

Launch **2/4**, PID 50364, passed **32 checks/all 21 required phase-1 gates**,
exit 0 and cleanupComplete on the unchanged package. Physical Ctrl+S persisted
exact custom prose, and actual Tab/Shift+Tab moved focus to Restore baseline and
back to the enabled prompt editor. The production UI/IPC path passed installed/
current baseline preview, Cancel/confirmed restore, shared Undo/Redo, guarded
draft, Settings/project reopen, exact approved card/lore revision inclusion,
complete deterministic serialized payload, explicit dependency/exclusion/read
accounting, budget/stale selection/external prompt refusal without losing author
input, explicit reload, and unchanged game source. Direct Windows observations
passed wide light/dark plus compact dark: revision choices, input/output/margin
totals, disclosure contents and the wrapped complete payload remained reachable
by scrolling. A disclosure-index click initially mapped outside window bounds;
fresh screenshot/coordinate selection succeeded in the same launch, with no
skipped required observation or product correction.

Launch **3/4**, PID 54296, passed **five checks/all four required phase-2 gates**,
exit 0 and cleanupComplete. Separate-process reopen retained confirmed baseline
restore, displayed the actual installed baseline, rebuilt the effective preview
and preserved every game source. Whole `ai.json` bytes match before/after reopen
at SHA256 `2bd97c8092d138973bfe02d2e9842541f8465af6967e0c84054f96b96379ac64`;
whole `references.json` bytes match at SHA256
`66d6beb553b5a73c0d064789cbce5a05d6c54a36032baff949e93fc6fa0eb566`.
Ignored `app/.toolchains/prompt-context-windows/final-audit.json` rechecks phase
reports, log/package hashes, metadata identity and exact PID/fixture cleanup.
PIDs 24948/50364/54296 are absent and the sole accepted synthetic root was
removed. Failed launch 1 remains failed evidence; no native observation of an
exited app or implicit start occurred.

**Final cumulative use:** Windows **1/3 package builds, 3/4 launches**; Mac
**4/5 package attempts, 4/4 launches**. Remaining attempts are unused. Selected
both-target Prompts and context preparation is accepted; full 2B.1, Phase 2,
provider sends, credentials/HTTP, proposal application, generated references,
automatic retrieval/import-export and release remain open. Self-review and
canonical CURRENT/HANDOVER reconciliation are complete. Publish/verify the
same branch under the selected outcome authority. The next distinct queue item
is First safe dialogue rewrite; it is not started by this result.

## Manual reference library selection — 2026-10-09

Selected by the user after accepted Phase 1/source foundations and bounded synthetic
request evidence: manually create/edit/approve/organize cards and lore with one
versioned references service, coherent history, lossless saved prose and reopen.
This is only the manual portion of 2B.1; full 2B.1, 2A.1/2A.2 and Phase 2 remain incomplete.
Use one serial Local Mac ARM64 owner and zero subagents. Windows follows on the same
branch after reviewed Mac implementation and explicit publication approval; no direct
other-host execution or second writer. Required evidence hosts: Mac ARM64 and Windows x64.

**User correction, 2026-10-09:** manual authoring must be ordinary Save updates, not
Approve/Reject/Supersede. The first A/B layouts were rejected as messy; Edit unlocking
was unclear and creation placement was criticized. Select an entry, edit directly,
Save changes or Discard changes; Save updates the current authored revision in one
undoable transaction. Status/revision/provenance preservation remains internal.
The user explicitly authorized one research subagent to compare apps/UI practice;
that agent researched only, wrote no files and spawned no agents. Implementation
remains one serial owner. This correction supersedes original manual UI requirements
in sections 9/18 and the initial selection, not later generated-content review rules.

**Entry:** clean checkout and existing worktree `codex/provider-qualification` at
published `54f562d5d3721595b2f8d7c5ed0454e9cd297a5f`. Ref refresh confirms remote equality;
no fast-forward/reset necessary. Unrelated planning worktree is untouched.

**Prepared before the editor:** [v1 schema/bounds](../../REFERENCE_LIBRARY.md) and
public `app/tests/fixtures/reference-library/` empty/replacement/manual-save/newer/malformed files.
Schema defines shared lifecycle, bounded current/approved/prior revision retention,
extensions, source citations, missing/stale links and exact transaction/history ownership.
Schema/fixtures preceded the editor; the implementation is local with Mac native
acceptance complete and Windows required. Preparation history remains in the scoped earlier commits.

**UI approved:** user requires A/B approval and requested images when the inline
preview was not visible. [A/B layout review](../../design/manual-reference-library/README.md)
records revised A (Browse and write), B (Focused writing),
both themes and compact preview limitations. Do not treat the recommendation or preview
interactions as approval. The user subsequently approved the revised layouts; the owner selected A, Browse and write, for implementation.
Revised preview checks passed direct editing/Save/Discard, both themes, lore and 390 px
list-to-form return without script errors/overflow. Repository validation and diff
whitespace checks passed. No production/native behavior is proved by these checks.

**Current allowance, cumulative across chats/handoffs:** Mac **7/9 package-build
attempts, 10/13 starts** after the user's renewed allowance; Windows **0/2 builds,
0/3 starts**. Preserve all failures and independent request budgets. Reserve attempts
require a diagnosed failure and recorded correction; no unchanged repeat is needed.

**Current result:** the independently confirmed shared-history boundary defect is
fixed without weakening external-edit checks. Failing-first production dispatch and
actual transaction regressions pass. The corrected signed Mac package passes manual
authoring/replacement, consecutive history, refusal/data retention and exact process
reopen; keyboard/focus, light/dark and compact layout were observed. See
[final Mac acceptance](#final-manual-library-mac-acceptance--2026-10-09) for evidence
layers and limits. All historical failures below remain failed historical attempts.
Implementation and self-review are complete on Mac. The user approved the normal push;
implementation checkpoint `f48c446` is published and verified. The later
[Windows acceptance](#final-manual-library-windows-acceptance--2026-10-10) completes
this selected both-target outcome; no full 2B.1 or Phase 2 completion.

### Manual-library Mac implementation and first native run — 2026-10-09

UI A (list beside directly editable fields) is approved by the user. Local core
schema/validators and typed dispatch share `commit_history` and ordinary recovery;
Characters → Character cards and Lorebook use Save changes / Discard changes.
The first signed package uses the existing approved identity; executable SHA256
`419167622403907fb8f008226999cefd11e67cbd40bdde166774e557e07db801`.
Selected allowance consumed: Mac **1/2 builds, 1/3 launches**; Windows **0/2, 0/3**.

Native launch 1 proved physical Command-S UI → production IPC → metadata Save,
replacement preserving prior text/record ID, exact Undo/Redo, cancelled/accepted
Discard, bounds refusal without writes, search/tag filtering and stale-save refusal
for an ordinary external replace. It **failed**: subsequent reload/save timed out;
readback proves revisionCounter remained 2 and the external extension persisted.
No follow-up save committed; no automatic write replay. Cleanup was confirmed.
The probe lacked a precise returned-error marker, so do not claim an exact native
error code. A deterministic persistence-lane reproducer separately failed because
reference reads/writes bypassed the shared lane. Correction routes both through the
lane and waits for native UI completion before probe readback, avoiding independent
probe read/write contention. Native post-save focus also failed: fields were focused
while disabled. Corrected ordering enables fields before focusing Name. The reserved
second package is justified by these diagnosed defects and focused regressions.

Early focused checks passed 112 renderer tests. Core selected reference checks passed
10 references plus one incidental preferences test; an additional exact external-reload
regression passed. Harness development failures (wrong Source request shape/mapped
source, uncanonical fixture root, happy-dom Option) were corrected without product
changes or package/native allowance. Required revised-package/native evidence remains
pending. Owned first fixture was subsequently cleaned at allowance stop; reports/packages
are ignored local evidence. Prior credential/request allowances remain unchanged.

### Manual-library allowance stop — 2026-10-09

The reserved corrected signed package built and passed signature/installer verification;
executable SHA256 `b1fb411f7af5d819cf46cc77f5bf9875cc7731897b3c61e9bce3ef80539010bb`,
installer SHA256 `714da98a95d616345f1ff35558765844def426a4281c9f1cdf2a695489b40e0b`.
Focused post-correction checks passed the reference form/focus test and all four request
lane tests (5/5 total). An exact core external-replace/reload/fresh-Save regression
passed, resolving the no-commit readback and proving that service behavior in isolation.

**Actual cumulative Mac starts:** (1) native fixture PID 73306, functional checks above
then failed external-reload/save timeout; (2) CUA observation after that process exited
implicitly reopened package 1, PID 73435, in its normal welcome view; (3) corrected
probe PID 74021 immediately exited before fixture initialization because PID 73435
held the single-instance guard. The third attempt produced no probe report and an
empty captured log; process inspection confirmed the conflicting package path.
The owner missed the implicit CUA restart until diagnosing attempt 3. Count it fully;
do not reclassify it as a free inspection. Mac allowance is **2/2 builds, 3/3 app
launches**, exhausted. No further native attempt or package build is authorized.
Windows remains **0/2 builds, 0/3 launches** for this same outcome.

Owned unintended PID 73435 was verified by its exact package executable path and
terminated. The failed synthetic root and uninitialized corrected root were removed.
Local ignored receipts/logs and structural failure metadata (IDs/statuses/hash only,
no prose) retain unique evidence; no owned process or fixture remains. CUA must never
observe/select an app after its probe has exited: Mac `getApp`/observation can launch it.
Before any future launch, inspect processes without UI observation and verify that
no owned instance remains; stop at budget exhaustion. No credentials/network/SDK
execution or personal project editing occurred.

**Missing Mac acceptance:** corrected queue/focus behavior in the native package;
follow-up external reload/save, lore creation, native malformed/newer retention,
close/reopen and separate-process byte-exact reopen; scope/knowledge/link forms;
physical keyboard/focus after corrected Save, compact width and both themes;
complete distribution exclusion proof and final review. Deterministic core covers
schema/bounds/extensions, shared source history, project switching, Prepared recovery,
stale/missing links and refusal. Earlier native passing assertions do not qualify the
changed package. Windows production metadata/UI behavior is entirely unaccepted.

Stop here under the user's exhausted-allowance instruction. Implementation/contract
work is committed locally for recovery; publication still requires approval after a
concrete reviewed result. Do not push or start a next feature. Continue the same outcome
on Mac only with a renewed allowance, then seek publish approval and hand Windows the
same branch/commit. The planned Windows continuation below is conditional on that
publication, not an instruction to run another host now.

### Renewed Mac native allowance — 2026-10-09

The user approved two additional Mac app launches of existing corrected package 2.
No additional package build, push or other-host execution was approved. Cumulative
ceiling is now Mac **2 builds / 5 app starts**, with **2 builds / 3 starts** consumed
on resume; Windows remains **0/2 builds, 0/3 starts**. Historical failures and implicit
restart count remain unchanged. Resume inspection found the clean local `c1fa943`
checkout on the intended branch, with the unrelated planning worktree untouched and
no Loomlight/probe instance remaining. Verify process ownership without UI tools
before every start. Never inspect the app after probe termination.

### Renewed native results and review correction — 2026-10-09

Mac start 4, PID 75122, used corrected package 2. Its real native controller/IPC
checks passed physical Command-S Save, stable IDs, replacement retaining prior text,
exact document Undo/Redo, cancelled/accepted Discard, bounds refusal, search/filter,
ordinary external stale-save refusal, explicit reload/fresh Save retaining the unknown
extension, lore creation, malformed/newer refusal, restored metadata, close/reopen and
unchanged `.rpy` source. Physical Save focused enabled Name; Tab moved to Aliases.
The light-theme wide form was inspected. Physical linked-lore/knowledge-note Save
committed counter 4 with approved status. An initial offscreen typing attempt saved
the checked link but no note; scrolling the field into view corrected the interaction.
A host readback initially used the wrong collection name (`lore`); corrected
`loreEntries` assertions confirmed both optional fields. These are harness issues.

**Phase 1 did not pass overall:** its 240-second `observe-light` pause timed out
while the owner was observing; dark/narrow stages were not reached. Process cleanup
was confirmed. The last optional Save could not be undone after termination. The
owned fixture was restored from its pre-observation bytes by the host (not credited
as project Undo), retaining a structural optional-Save receipt. The runner now permits
an explicit phase-2-only reopen after this exact diagnosed visual timeout, without
creating or accepting a phase-1 receipt. Start 5, PID 75430, passed separate-process
reopen with exact bytes/hash `e74ab6a0fa0be5e3de76267ca73276dd15bf6f7dfce0087f7a40b87d82d09300`.
Card counter 3, current/approved revision pointers and superseded r2/approved r3
survived, as did the external extension and both collections. Structural receipts
remain ignored under `manual-reference-mac-04`; owned process/root/prose baseline
are removed. An attempted Python bytecode syntax check was denied outside writable
cache roots; AST syntax checking passed without changing permissions.

Focused distribution proof used only the trusted pinned SDK 8.5.3 classifier helpers
and default hidden-root patterns against the owned synthetic project. `.renpy-editor`
was excluded without descent while game files were included. No game/project Python
was executed; author-defined custom distribution overrides are outside this proof.

Review reproduced one correction: changing a relationship target rebuilt its link
object and dropped nested unknown fields. The form now changes known type/ID while
retaining the existing link object extensions; choosing Not linked explicitly removes
the target. The focused renderer regression and typecheck pass. A test fixture type
annotation initially failed compilation and was corrected before the passing check.
The native probe adds representative relationship-extension, repeated-route,
linked-lore and knowledge-note Save/Undo assertions. Package 2 predates this correction.

The user authorized **two further Mac launches** after start 5: cumulative launch
ceiling is **7**, with **5 consumed**. Build allowance remains **2/2 exhausted**.
One additional package build has been requested for the concrete reviewed correction;
its approval is pending. No build/start is performed while that decision is pending.
Windows stays **0/2 builds, 0/3 launches**; no publish is authorized. Remaining native
proof is the corrected relationship form, representative scope/knowledge/link Save,
dark theme and narrow layout, and final corrected-package reopen. No full 2B.1 or
Phase 2 completion claim.

### Third package attempt: toolchain launcher failure — 2026-10-09

User approval granted a third package build, with launch ceiling 7 unchanged.
The owner ran the launcher from `app/` but incorrectly used root-relative paths for
the preceding ledger update and toolchain activation. Those commands failed, and the
shell continued into packaging without the pinned Cargo path. Tauri exited 1 at
`cargo metadata --no-deps --format-version 1`: Cargo was unavailable. No Rust/frontend
compilation, signature, installer or app launch occurred. This avoidable owner error
is counted as build attempt **3/3**, not reclassified as free preflight. Two launches
remain unused (**5/7**). Failed `manual-reference-mac-03/build.log` is retained locally.

Corrected fail-stop preparation uses `source ../.toolchains/enter-macos.sh && ...`
from `app/`; Cargo 1.90.0, Node 24.19.0, npm 11.9.0 and locked/offline workspace
metadata preflight pass. No security/identity changes were made. A replacement build
must use a fresh output directory and requires explicit allowance renewal before the
launcher is invoked. Production correction stays committed/tested at `483407c`.
No native retry, push or other-host execution occurred. Updated live status/handover
record exact missing acceptance and the required decision.

### Two replacement build attempts authorized — 2026-10-09

The user approved two additional Mac package-build attempts after the diagnosed
working-directory/toolchain failure. Cumulative ceiling is now **5 build attempts / 7
app starts**, with **3 attempts / 5 starts consumed** before resuming. A reserve
attempt still requires a diagnosed failure and recorded correction; do not consume it
for unchanged inputs. Existing identity/policy, serial owner and publication boundary
remain unchanged. Windows remains **0/2 builds, 0/3 starts**. Resume found the clean
`b94eb1d` checkout and untouched unrelated worktree, with no Loomlight process.

### Replacement build 4 and native start 6 — 2026-10-09

Build attempt 4 succeeded with the corrected pinned preflight. Strict signature,
certificate-bound designated requirement and installer contents passed. Executable
SHA256 `a0a91d53d8ca01a4ef58f69bdab427306bc599254c2010589a5500d4c412d9ba`;
installer `33e63662799f317a813b47032290e15066b3e5cacebbcb6b3e83705f4921d362`.
Native start 6, PID 76596, repeated the full authoring/refusal/external/reopen checks,
physical Command-S and enabled Name/Tab focus, identified stale/missing citations,
and passed relationship target unknown-field retention through the real form/IPC.

The harness failed its next assertion by comparing `JSON.stringify` on newly
constructed fixture objects to parsed metadata objects with sorted keys. Host readback
proves citations/links semantically exact, nested relationship extensions retained,
and repeated route/linked lore/knowledge saved at counter 5. This is a harness
object-key-order failure, not a product failure or an accepted overall receipt.
Process cleanup is confirmed. Corrected comparison canonicalizes object keys while
preserving array order and values. The reserved fifth build is justified by this
specific diagnosed probe correction; it changes no production storage/UI behavior.
Cumulative usage before reserve is **4/5 build attempts, 6/7 starts**. Use final
start 7 for the fresh full walkthrough. Reuse valid separate-process exact reopen
from start 5: production storage/reopen code is unchanged by the UI-only retention
fix and probe-only correction. Preserve all earlier failures; no automatic replay.

### Reserve build 5 / native start 7: confirmed shared-history blocker — 2026-10-09

Build attempt 5 passed strict signature and installer verification with unchanged
identity/policy. Executable SHA256
`fe69ccde3a31e32b3cb5194862a02b33c0978d9f23577fd7ec07d984bfc1ccfd`;
installer `ec6c7f67bb6ca320f19c07e640f81228309c8ab5fab06d466f449b7e16f5ac51`.
Native start 7, PID 77043, passed 23 assertions through physical Save, replacement,
exact single Undo/Redo, refusals/Discard/search, external edits/reload/Save, lore,
malformed/newer retention, close/reopen, unchanged source, stale/missing link display,
relationship target nested extensions, canonical citation/link preservation and
repeated-route/linked-lore/knowledge Save. Physical Name/Tab focus was observed again.

The first representative Undo committed (counter 5 → 4); the second refused. Its
exact native returned code was not captured. Final metadata retained counter 4,
current/approved pointers and superseded r3/approved r4; refusal preserved data.
A minimal real production-dispatch reproducer (two manual Saves, two Undos, no external
edit) then failed at the second Undo with `HISTORY_BOUNDARY`: "Undo or redo stopped at
an external revision boundary." This is a **product defect in shared history**, not
another object-key-order harness issue. `HistoryStack::accepted_undo_with_revisions`
updates the undone entry's before identity but not the older touching entry's after
identity. The transaction creates a new file identity; the next Undo sees a false
boundary. Consecutive Redo requires symmetrical investigation. Preserve real external
revision boundaries when correcting shared history; do not simply ignore identities.

Cumulative Mac **5/5 package-build attempts, 7/7 starts**: exhausted. No further
native/build attempt is authorized. Dark/narrow observations remain unperformed;
latest overall phase-1 receipt is failed. Previous separate-process reopen remains
valid for unchanged storage code but cannot accept broken multi-step history.
Ignored `manual-reference-mac-07` retains failure receipt, structural readback and
minimal reproducer; no failing regression was left in the tracked suite. Owned process,
fixture and preflight file are cleaned. The implementation is not publishable/accepted;
Windows remains **0/2 builds, 0/3 starts**. User now requests a GPT-6.1 Sol independent
read-only assessment; pause implementation and report its findings before proposing
further work. No push or next feature.

### Independent GPT-6.1 Sol assessment — 2026-10-09

At the user's explicit request, one GPT-6.1 Sol High reviewer independently inspected
the code, owning ledger and retained receipts, using a read-only simulation. It made
no repository edits, builds, app launches, other-host execution or delegation.
It confirms the shared-history diagnosis with high confidence: accepted Undo refreshes
only the undone entry, leaving the nearest older touching entry's expected file
identity stale. Its independent simulation reproduces the false boundary. Consecutive
Redo has a symmetric code defect; that direction remains a code-derived prediction,
not observed native evidence.

The reviewer identifies preventable owner/harness repetition: implicit CUA restart
and resulting single-instance conflict, working-directory/toolchain launcher mistake,
delayed visual-pause handling, and object-key-order assertion discovered after
packaging. Existing real-dispatch tests already performed two Saves but checked only
one Undo/Redo cycle; adding the ordinary consecutive sequence would have exposed the
product blocker cheaply. Passing assertions are useful but do not prove coherent
multi-step history. The probe's click helper only waits for not-busy while the UI
catches errors, so it failed to retain the precise native refusal code. Every required
mutation needs an expected-result gate and opt-in failure-code evidence.

Recommended continuation: restore the failing real-dispatch regression; correct
both directions in shared history, including nearest touching entries, interleaved
paths, multi-file transactions and branches after Undo. Propagate identities only
across a proven matching historical transition; preserve changed-content and
same-content external replacement refusals, original bytes and cursor. Validate the
harness/comparisons/ownership/observation sequence cheaply before another finite
native allowance. Native multi-step history, dark/narrow layouts, post-history reopen
and Windows qualification remain required. Card knowledge/lore-link assertions do not
qualify every lore knowledge annotation control. Assessment delivered to user;
implementation stays stopped under exhausted allowance, no publish authorization.

### Shared-history repair allowance — 2026-10-09

The user resumed the same outcome and approved four additional Mac package-build
attempts and six launches. Cumulative ceilings are **9 builds / 13 starts**, with
**5 builds / 7 starts consumed** on resume. Windows remains **0/2 builds, 0/3 starts**.
Follow the independent assessment: failing-first real-dispatch and shared-history
coverage, both directions and real external boundaries, cheap harness checks, then
native authoring/layout/post-history reopen. No further subagents, other-host execution
or publish is authorized. Resume found clean `e1718c1`, the intended branch and
unchanged unrelated worktree. Preserve all earlier failures and evidence.

### Shared-history repair: deterministic gate — 2026-10-09

The real-dispatch reference regression was extended from one cycle to repeated
consecutive Undo/Undo/Redo/Redo, including deletion/recreation of the initial metadata
file. It failed first with `HISTORY_BOUNDARY`, then passed after correction. Accepted
Undo/Redo now propagates returned file identity to the nearest connected entry touching
each path, only when both the prior full revision and bytes match that historical
transition. Real external boundaries stay intact; no identity check was weakened.

Passing focused core checks: three new actual-transaction continuity tests cover
interleaved paths/multi-file commits/repeated cycles/branching, changed-content and
same-content external replacements between entries, and both-direction refusal after
Undo without cursor changes. All 11 references tests plus one incidental preferences
test passed; existing create/delete identity and external-history-boundary tests passed.
Source/Scene shared-history and Save All/failed-inverse regressions passed. Typecheck
passed. No package/native allowance consumed by these checks.

The initial revised opt-in probe attempted to observe actual reference IPC replies,
requiring success or the exact expected refusal, capturing only command type/status/
error code, checking state after each consecutive Undo/Redo and restoring baseline
through history. Its interception assumption failed natively as recorded below and
was replaced by controller outcome observation. A cheap VM regression initially used
a writable mock; it checked failure-code capture, expected refusal and canonical
comparisons without logging reference prose. Its first source extraction
also selected probe teardown; corrected selection passed before any packaging. The
runner rejects reused phase logs before launching. Existing renderer form and four
persistence-lane tests passed (5/5). No visual product redesign was made.

At this checkpoint the selected next action was build attempt 6, fresh native phase 1 and separate
post-history process reopen under launch ceiling 13. Reserve attempts require a new
diagnosed failure and recorded correction. No push or other-host execution authorized.

### Build 6 / launch 8: native trace-hook limitation — 2026-10-09

Build attempt 6 passed unchanged identity/signature/installer gates. Executable
`6050712ff152dbdcf4c2e60f3340c1647ea58699b9bd409ab56a3933b904ce80`, installer
`d2c006700258317756f6e0b784faac3ec33cfed1330a3ec0f2a8941d4fbb2a35`.
Native start 8 PID 78593 proved physical initial Save/focus; its next update committed
counter 2, but the probe timed out waiting for a trace reply. Pinned Tauri 2.11.5
`core.js` defines `invoke` as read-only; the attempted interception silently did not
install. The cheap mock incorrectly modeled a writable property. This is a diagnosed
harness capability failure, not history acceptance. Failed overall receipt/readback
are retained under ignored `manual-reference-mac-08`; owned fixture/process are cleaned.

Correction: controller records completed mutation sequence, command, committed/refused
outcome and fixed error code in its existing DOM state, without reference prose. The
probe reads that state; it does not override Tauri internals or add capabilities.
Renderer regression verifies refused code/sequence, successful completion and code
clearance. Probe regression models read-only invoke and verifies expected refusal and
semantic equality. Both tests and typecheck pass before retry; native JS syntax passes.
Build attempt 7 is justified by this correction. Cumulative usage before retry is
**6/9 builds, 8/13 starts**; shared-history core gates remain valid unchanged.

### Final manual-library Mac acceptance — 2026-10-09

Build attempt **7** contains the shared-history correction and controller-based
mutation outcome probe. Unchanged signing identity, strict signature and installer
content verification passed. Executable SHA256
`047ef606a7720700808350449531c9d9734d18356b9bb356236e88f160892c5f`;
installer `9db9cb203d133c31baaf92bb9c22cb8b9993e8c67471f0ca46a968cba33d5dba`.
Native start **9**, PID **79201**, passed **29** required assertions; separate-process
start **10**, PID **79253**, passed **3** reopen assertions and the runner's whole-file
byte comparison. Overall receipts report passed and cleanupComplete, exit code 0.

| Requirement | Decisive evidence | Result/limit |
| --- | --- | --- |
| UI → dispatch → persisted authoring | Physical Command-S creates the card; native controller Save replaces it and creates lore; IDs/current/approved pointers and prior superseded text checked. | Mac PASS. Synthetic inputs plus physical initial Save; no mock requester. |
| Consecutive shared history | Native Undo/Undo/Redo/Redo compares exact seeded/edited/pre-fixture documents, then repeats Undo twice to restore baseline. Core regression repeats three cycles including initial file deletion/recreation. | PASS; exact revisions/statuses and bytes, no fixture restoration credited as Undo. |
| External edits and refused actions | Native stale Save returns REFERENCE_CONFLICT and retains draft; Reload/Save retains external extension. 161-byte title returns INVALID_REFERENCE without writes. Core same-content/changed-content history boundaries preserve cursor/data. | PASS; actual safe refusal codes captured. |
| Malformed/newer/unknown data | Native Reload diagnoses retained malformed/newer files and disables creation; explicit restored data reloads. Core duplicate/wrong-project/depth/file/array/counter/boundary cases pass. Nested relationship target extension survives form edit. | PASS; malformed/newer byte retention also covered in core. |
| Links and scope | Native stale citation/missing link visible; relationship edit, repeated route, linked lore and knowledge notes persist; original citations/links retained exactly in meaning. | PASS; no inferred knowledge or refreshed citation revision. |
| Reopen/source preservation | Native close/reopen same project compares full document; separate process compares whole metadata file bytes. Source text readbacks unchanged. | PASS; saved metadata hash before/after below. |
| Ordering/project isolation/recovery | Real core dispatch moves card, undoes exact bytes, shares Source history, switches to another empty project and refuses old session. Non-crashing prepared recovery blocks Save retaining library. | PASS at core production dispatch; native representative probe reopens same project rather than switching to a second one. |
| Keyboard/focus | Native Personality focus + Command-S; after Save Name focus is enabled and Tab selects alias M. Compact All character cards focuses Search; Tab/Tab/Return opens card and focuses Name. | Mac physical PASS. |
| Themes/layout | Wide light card and dark lore observed; no collisions in new controls. Compact dark list/form navigation and vertical scroll retain reachable fixed Save/Discard controls. | Mac PASS. Programmatic resize did not visibly apply; native right-edge drag during the same pause produced a 1424-pixel capture (about 712 logical width), activating the compact layout. No extra launch. |
| Prose/privacy/distribution | Safe fixed diagnostics and primitive structural receipts; source unchanged; unchanged trusted pinned-SDK default classifier excludes hidden metadata. | PASS for selected default path; no game execution/custom author classification override proof. |
| Windows x64 | No Windows execution selected on Mac. | REQUIRED, 0/2 builds and 0/3 starts consumed. |

Ignored structural receipts `.toolchains/reports/manual-reference-mac-09/phase-1.json`
SHA256 `ec4e9f17f07a63819b6ac8eadc2352e0419389e862d561f09659efe6167941d9`;
phase-2.json `64986988c07ef917e80817e7f089ad90633ddc0809451ec2f0d4b6d6dfc79a3b`.
Both metadata hashes:
`7744980072c1d1dae9420f1ae845705059086ec1b6833e6db7539b4e431a71e1`.
Structural current card: stable ID `eb1a81c2-b339-40a4-b100-0db4a5b2b94f`,
counter 3, current/approved `40225ae0-86b8-4d9c-8c64-27611cb70e35`;
retained r2 `8d0f7526-4abf-4798-aceb-fbcf78a2df5c` superseded, r3 approved.
Both collections and exact complete metadata survive process reopen.

Focused checks were not repeated unchanged: all 11 reference tests plus one incidental
preferences test, three actual-transaction continuity regressions, existing external
boundary/create-delete history, Source/Scene shared mapping history, Save All and failed
inverse cases pass. Renderer form plus four persistence-lane cases passed (5/5);
after the diagnosed trace correction renderer/probe helper cases passed (2/2),
typecheck/test compilation/native JS syntax passed. Cheap probe tests explicitly
model read-only Tauri invoke; they remain harness tests, not native acceptance.

Self-review checked the actual history propagation, service/controller ownership,
unknown-field retention, mutation gates and history/refusal regressions. No further
blocking finding remains on Mac. Review preserves exact boundary checks, shared history,
narrow IPC and existing signing/credential policy. Canonical DATA_MODEL/reference
contracts and live status/handover now describe the final behavior. Final repository
validation/whitespace/privacy review and the scoped local commit complete this local
checkpoint; push requires explicit approval. Repository validation passed for 453
files and diff whitespace checks passed. CURRENT is 332 words and HANDOVER 879,
within the status-maintenance review targets; no excess explanation is needed.

**Cumulative:** Mac **7/9 builds, 10/13 starts**; Windows **0/2, 0/3**. Both native PIDs
were confirmed exited before cleanup; owned synthetic root and preflight file removed.
Structural receipts/packages remain ignored local evidence. No pending process, HTTP,
other-host action, install/security change, CI or merge/release. Both explicitly
requested read-only subagents remain complete, with one implementation writer.
Unchanged credential/request evidence and its budgets are reused unchanged. Windows
acceptance still gates the selected outcome; full 2B.1/Phase 2 and live Studio
compatibility are incomplete. Same-outcome Windows prompt is in HANDOVER.

### Approved publication and Windows transfer — 2026-10-09

The user approved pushing the reviewed seven scoped local commits and requested the
Windows prompt, with code changes only if necessary. Entry inspection found clean
`f48c446` on the correct branch and preserved the unrelated planning worktree. Fetch
confirmed remote `54f562d` remained an ancestor; normal push succeeded without reset,
history rewriting or force. `git ls-remote` verified
`f48c446e629c238d9d190c33b9c727cd73002b7e` on the exact remote branch. CURRENT/HANDOVER
and this transfer record are updated in a subsequent docs-only commit, published under
the same approval; the final remote tip is verified after that push.

Windows is verification first. Code changes require a demonstrated required-acceptance
blocker, exact diagnosis and focused reproducer; apply only the smallest necessary
correction. Harness failures and missing evidence are not automatically product defects.
Passing checks mean unchanged code with acceptance/status updates only. No redesign,
refactor, speculative improvements or new feature. Windows remains **0/2 builds,
0/3 starts**; no Mac build/start or other-host execution was added by publication.
Both-target acceptance remains required. No full 2B.1/Phase 2 completion claimed.

### Manual-library Windows verification pause — 2026-10-10

**State: blocked on native observation capability; Windows acceptance is incomplete.**
The clean Windows worktree fast-forwarded from `de29e49` to the published
`dc889d65f85beeeb388ce8581f8e7d977b292f18`, containing Mac checkpoint
`f48c446`. No product code changed. The unrelated worktrees and local changes were
preserved. One serial Windows owner used no subagents or other-host execution.

Focused Windows checks: TypeScript typecheck, Python probe compilation and native
JavaScript syntax passed; 15 selected frontend/protocol/controller tests passed.
Eleven reference tests plus one incidental preferences test, three shared-history
continuity tests and the external Undo/Redo boundary test passed outside the
filesystem sandbox. Their first sandboxed run failed before any reference operation
at temporary profile creation (`probe state: Io`); a single identical test passed
outside the sandbox, identifying a host restriction rather than a product defect.
The unchanged Mac and prior credential/request evidence remains valid only for its
recorded cases.

Windows package attempt **1/2** failed at the Tauri CLI argument parser, exit 2:
direct `build --locked --bundles nsis` put Cargo's `--locked` before Tauri's `--`
separator. No compilation/package occurred. CLI help established the exact cause;
the recorded correction used `build --bundles nsis -- --locked` on attempt **2/2**.
That attempt built the production frontend, release executable and x64 NSIS bundle
offline. The host lacks `npm`, so an ignored build-only shim executed the repository's
exact `tsc -p tsconfig.json` and `vite build` commands for Tauri's
`beforeBuildCommand`; the preflight completed before the package attempt. Retained
executable SHA256 `86192e75dfdea3e4435bef1f3e672519b00f5bd2745c5bbd9fe26e8420d546cc`;
installer SHA256 `7f9b975ae16dbb1e87df41b0a8b61659ace39990a41b4b19d4b6e100d57f95c1`.
Both artifacts passed the privacy scan. No installation or policy change occurred.

Native launch **1/3**, PID **14960**, reached `manual-save` in the packaged WebView
after synthetic form entry. Computer Use listed exactly one Loomlight window, then
timed out requesting access to its state. The required physical Ctrl+S and visual
observation never occurred; the probe's 240-second observation pause expired, emitted
`passed:false` with `Observation timeout at manual-save`, and exited with code 1.
There are zero accepted native assertions, no saved reference metadata and no phase-2
reopen proof. Classify this as unavailable observation capability/missing evidence,
not a demonstrated product defect. No unchanged retry is justified until window
access can be established before launch. The failed receipt and package are retained
under ignored `app/.toolchains/manual-reference-windows/`; the exact owned fixture
root was removed after PID absence was checked. No app or owned fixture remains.

**Cumulative Windows allowance: 2/2 package attempts, 1/3 app launches; 0 builds
and 2 launches remain.** The accepted Mac allowance remains 7/9 builds and 10/13
starts. Resolve the Computer Use access timeout before another launch; use the
retained package and a fresh owned launch identity, then verify window access
promptly. Production Save/readback must
come first, followed by the remaining representative native checks and process
reopen within the two remaining launches. If capability remains unavailable, retain
this blocked state and exact missing proof. No Windows acceptance, both-target
completion, full 2B.1 or Phase 2 completion is claimed. Do not push this local
records-only continuation without the user's approval.

### Final manual-library Windows acceptance — 2026-10-10

**Selected manual-library outcome: accepted on Windows x64 and Mac.** The preceding
pause remains the historical result of launch 1. At the user's request, Computer
Use window access was retried using the retained production package, without an
allowance increase, product code change, package rebuild or other-host execution.
One serial Windows owner used no subagents. The worktree is based on published
`dc889d65f85beeeb388ce8581f8e7d977b292f18`, including Mac implementation
`f48c446e629c238d9d190c33b9c727cd73002b7e`.

The Windows x64 NSIS executable SHA256 is
`86192e75dfdea3e4435bef1f3e672519b00f5bd2745c5bbd9fe26e8420d546cc`;
installer SHA256 is
`7f9b975ae16dbb1e87df41b0a8b61659ace39990a41b4b19d4b6e100d57f95c1`.
Both passed privacy scanning. Build attempt 1 failed before compilation at a
diagnosed Tauri CLI argument separator; the corrected attempt 2 built and packaged
offline. The host's missing `npm` was handled by an ignored build-only shim running
the repository's exact TypeScript/Vite commands. Cumulative builds: **2/2**.

Launch 1, PID 14960, timed out awaiting Computer Use access before native input;
its failed receipt remains failed. Launch 2, PID 21212, obtained the packaged
WebView window. A physical Ctrl+S produced Saving then Saved; direct UI and disk
readback confirmed a new approved card, revision counter 1 and current/approved
revision `53cb9644-908e-404d-97c3-bc0e67a36242` before the runner advanced.
Physical Tab then moved Name focus to Aliases. Subsequent synthetic form input
used real production UI, IPC and storage; it was not browser-mock acceptance.

Launch 2's phase-1 receipt passed **29** assertions, exit 0 and
`cleanupComplete:true`: card replacement and lore creation, ordinary Save/Discard,
bounded refusal preserving draft/data, search/tag filter, stale external Save
conflict then explicit Reload/Save, malformed/newer refusal and restored data,
unknown extension retention, stale citation and missing link, repeated route,
linked lore, knowledge notes, source-text preservation, exact native
Undo/Undo/Redo/Redo and repeated Undo. The form has no manual review controls.
Final card ID `e3067b71-9232-426b-af48-582d3dbcd08b`, counter 3,
current/approved revision `598d4e41-0e3b-4045-b125-4198f3b6153f` (r3
approved); retained r2 `bd0471c7-30e0-44dd-a1e8-137d71d1e07e` is superseded.
The complete metadata SHA256 was
`78f45911a83206fd4bb1109185a64fc03ace4679a5eb2778ffd576b4328ffbba`.

In the same launch, visible wide light and dark forms showed top creation and
ordinary Save/Discard without control collisions. Compact dark list and form
remained usable with visible Save/Discard. Search focus, physical Tab/Tab and
Return opened a card and focused Name. The observation did not independently
establish compact vertical scrolling. The runner released observation markers
only after these actual observations. Launch 3, PID 18108, passed **3**
separate-process reopen assertions in 4.16 seconds, exit 0 and
`cleanupComplete:true`: both collections, exact revision/status data and the
external unknown extension persisted. Its full metadata hash was identical to
phase 1, establishing byte-exact process reopen. Cumulative launches: **3/3**.

Windows focused gates passed before packaging: TypeScript typecheck, Python/JS
probe syntax, 15 selected frontend/protocol/controller tests, eleven reference
core tests plus incidental preferences, three history-continuity regressions and
the external history boundary. The first sandboxed core run failed at temporary
profile creation before a reference operation; identical checks passed outside
the filesystem sandbox. Real core dispatch covers project isolation, ordering,
recovery and extended malformed/bounds cases; native probe covers the
representative scenarios above. Mac final acceptance provides the other required
target. No custom author distribution override or game execution was tested.

Ignored `app/.toolchains/manual-reference-windows/final-audit.json` records both
passing reports, the matching metadata hash and log hashes. All three PIDs were
confirmed absent and the exact owned synthetic root was removed; the package and
receipts remain ignored local evidence. No product code changed. Only acceptance
and live status records were updated. Both-target acceptance applies to this
selected manual-library outcome alone; full 2B.1, Phase 2 and live Studio remain
incomplete. This local documentation checkpoint requires approval before push.

## Windows synthetic request selection — 2026-10-09

The user selected review, focused fixes and packaged Windows x64 qualification of
the non-streaming Studio synthetic request lifecycle, continuing published `0a91e20`.
One serial Local Windows owner; no subagents or other-host execution. The existing
clean `codex/provider-qualification` worktree fast-forwarded from `9d7a6d6` after
ref/ancestry inspection. Preserve accepted Windows/Mac credential evidence and Mac
request acceptance; do not repeat unaffected credential scenarios.

Required proof: explicit Send only; immutable native configuration/credential capture;
pre-send refusal; bounded off-thread transport and parsing; truthful status/usage;
cancel/deadlines/size/error handling; stale configuration/project/shutdown rejection;
no retry/provider switch/output application. A compact packaged native walkthrough
must show completion, unknown usage, cancellation/error, editing and Save during a
stall, normal exit and active-request exit/cleanup. Deterministic checks supplement
visible observations. Public synthetic keys and isolated loopback only.

Selected ceiling is **two package builds / three application launches**, currently
**1/2 and 3/3** (final Windows acceptance complete; no launches remain). Historical Windows **7 builds / 12 launches** and completed Mac request
**1 build / 2 launches** remain unchanged. Reserves require diagnosed failure and a
concrete correction; ambiguous dispatch must be resolved before retry. Establish
supported native input/capture and the approved build route before spending an attempt.
Operator observations have separate bounds from product response deadlines. Preserve
all original captures, failed receipts and cumulative accounting outside Git.

Complete scoped review/fixes/checks and ownership-aware credential/fixture/process/
listener cleanup, update acceptance/CURRENT/HANDOVER and commit locally. **No push
before explicit user approval of the concrete reviewed result.** No real endpoints,
project-content sends, SSE/provider/auth expansion, proposals, policy/install changes,
CI, other host, merge/release or next feature. No full 2A.2/live Studio claim.

### Windows request review and preflight

Native accessibility, keyboard focus and literal typing passed on a precisely owned
Explorer preflight folder after the user approved the app-access retry. The user
waived screenshots. Preserve the earlier unrelated-window automatic-review refusal,
app-access timeout and click geometry failure; no package/launch was consumed.
The existing pinned MSVC/SDK, Rust 1.90.0, Node/npm and offline Tauri NSIS route is
reused without installation/security changes. Sandbox loopback and Tauri build-script
access failed; host loopback passed all eight original request tests.

Focused regressions demonstrated two shared defects: partial usage with prompt 4097
was accepted against context 4096, and completion while Save checked out the service
was incorrectly expired. Corrections bound every reported usage component and defer
publication off-thread while Save owns the service, retaining cancellation/configuration/
shutdown guards and the original response deadline. All six desktop request tests now
run on Windows with an injected test-only public credential reader and isolated native
references, without OS credential operations. Initial test-fixture revision/name and
controller manifest-separator failures are retained as harness failures.

The compact native selection uses the existing fixed-body server and fresh request
fixture: reported completion, stall/edit/Save/cancel, authentication error, unknown
usage completion, and a fifth stalled request followed by normal native exit. The
accepted exact-target ownership-metadata removal flow will clean the one newly
app-created Windows credential after active-request exit, without blob inspection,
enumeration or a cleanup relaunch. Package/launch receipts preserve source inputs,
identities and all original failures. Operator observation 180 s, walkthrough 1800 s,
application response 600 s, connection 1 s and client cleanup 2 s are distinct bounds.

Mac's four native scenarios and credential foundation are unchanged, but corrected
shared behavior needs a focused Mac `ai_request` and `ai_requests` test recheck. No
other-host execution or new Mac native/package run is selected here.

### Windows request acceptance and capability blocker — 2026-10-09

**Historical stop, subsequently resolved by explicit capture approval and the final
acceptance below.** This section and its partial metadata preserve the failed attempts.

**State: incomplete, blocked on supported native input/capture permission.** No push
is authorized or requested while native acceptance remains incomplete. Shared product
fixes are committed locally as `0cec43ff7785713d9d9ba0a8f53391cd92ccdfe1`; controller,
verification and blocker records accompany the local continuation. Entry was published
`0a91e20`; no unrelated work was reset, no delegation or other-host execution occurred.

| Gate | Evidence/result |
| --- | --- |
| Production review | Explicit Send is the sole request dispatch. Native profile/body/credential capture and pre-send validation, off-thread bounded loopback transport, safe errors/unknown usage, no retry/provider switch/output application, and cancel/config/project/shutdown guards inspected. |
| Demonstrated defects | Partial prompt/reasoning usage could escape saved bounds; valid completion during a busy Save boundary was falsely expired. Rejecting regressions reproduced both before correction. Fixes preserve credential backends, namespaces, identity and security policy. |
| Focused checks | Core request 8, desktop request 6 (including synchronized completion/Save with cancel/change/shutdown), fresh fixture 1, frontend/protocol 11, Windows controller 6 and affected shared controller 4 PASS. TypeScript, scoped Rust formatting and repository validation pass. |
| Package | Build 1 PASS, 70.224 s; existing offline pinned Tauri NSIS route; privacy scan passes two artifacts. Executable SHA256 `b293c4340dd52af528ff5c5b5467f51273698984b4339e7a745dff49b1848266`; installer SHA256 `a73e4ec2c440be3f83bef8cf3d0819d26abf336d7d5db4d3c5dfa8fe047c42fb`. No installation. |
| Launch 1 | Controller failure before window: Windows text write changed marker LF to CRLF; native fixture refused, exit 101 at 0.886 s. Zero HTTP/credentials. Corrected byte write and regression before reserve launch. Original marker hex/error/receipts retained; exact marker-only root removed. |
| Launch 2 | Same binary opened the synthetic welcome screen. Accessibility observations passed; native Tab/F6 left focus on the WebView container, and current-app accessibility click refused with `coordinate input geometry is unavailable`. Zero HTTP/credential references. Native Alt-F4 exited normally, code 0 at 509.029 s; native cleanup receipt says zero active workers/complete. |
| Required native request/UI/Save proof | **MISSING:** explicit Send, completion/reported and unknown usage, cancel/auth error, source editing/Save during a stall, and active-request exit. No internal test or welcome-screen observation substitutes for these. |
| Cleanup | Both exact app PIDs absent; both listener lifetimes stopped; Windows listener query succeeds with no listener on fixture port. Both exact roots removed after marker/seed ownership checks. Zero native credentials created/accessed/deleted. Preflight window closed and its task file removed; original observations/receipts retained. |
| Mac consequence | Prior native four-request/credential evidence remains valid for unchanged scenarios. Corrected partial-usage and busy-Save publication behavior still needs focused Mac `cargo test -p loomlight-core ai_request --locked` and `cargo test -p loomlight-desktop ai_requests --locked`. No Mac execution or full current cross-platform acceptance claimed. |

The user said screenshots were not needed. Automatic approval review then rejected
an optional task-app screenshot on that basis. Native capture is needed by this tool's
click geometry; keyboard alternatives and an actual current-app accessibility click
failed to enter the WebView. A clarification asking to allow task-app captures for
input remains unanswered. Stop at this capability decision; do not spend launch 3
unchanged. The initial unrelated-window capture refusal, app-access approval timeout,
first observation wrapper's undefined-state error, sandbox loopback/Tauri/TEMP failures,
test scaffolding corrections and all failed receipts remain failures. An external
`connect_ex` audit assertion failed before preserving its return value, so no port-refusal
result is claimed; the later successful Windows listener metadata query supplies absence.

**Cumulative:** this Windows request selection **1/2 builds, 2/3 launches, 0 HTTP,
0 credentials, 2 removed roots, 2 stopped listener lifetimes**. Historical Windows
7 builds/12 launches become **8 builds/14 launches**; Mac request totals remain
1 build/2 launches. No allowance reset. Native operator captures were individually
recorded; the first tool approval/wrapper failure has no saved duration and is not a
passed bounded observation. Launch 2 was within the 1800-second whole-walkthrough cap.
One build/one launch remain; reserves require a concrete diagnosed correction.

Private originals are under ignored `app/.toolchains/windows-studio-request/`:
`build-1-{attempt,preflight,runtime,terminal}.json`, package artifacts, both launch
folders with state/launch/exit/cleanup receipts, native accessibility originals,
pre/post-fix test logs, `listener-audit.json` and `blocked-final-audit.json`.
[Public partial metadata](../evidence/2026-10-09-windows-studio-request-partial.json)
contains only safe identities/results. Never publish the ignored logs or private paths.
For continuation, resolve capture permission and prove native click/focus on a task-owned
preflight window, record `launch-3-correction.json`, verify unchanged package/runtime
hashes, then use the final launch for the compact five-request walkthrough. Do not
reacquire exited windows or repeat credential qualification. No full 2A.2/live Studio,
CI, merge/release, policy changes or next feature is selected.

### Final Windows request acceptance — 2026-10-09

**Selected Windows scope: complete and ready for explicit push approval.** The user
approved task-app captures after the earlier waiver was interpreted as a prohibition.
Before consuming launch 3, native screenshot-backed clicking selected the exact public
Explorer fixture and focused literal typing was visibly verified. A quoted Windows
path corrected the initial Explorer dispatch that did not open the intended folder.
The exact correction receipt preceded launch; package/runtime identity was unchanged.

| Gate | Final evidence/result |
| --- | --- |
| Explicit Send boundary | Native project opening, settings/profile loading, public credential entry and request-panel loading produced zero HTTP. The five native Send actions produced exactly five accepted POSTs, each the same 279-byte fixed synthetic body, SHA256 `27d6a326c2a7543348d55e518ca744a8cad4b1a8463fdc3e7342dfa7661e860f`. No project content, extra GET, retry, provider switch or output application. |
| Completion | Native UI showed Completed, HTTP 200, 8025 ms, finish stop, usage input 42/output 4/total 46/reasoning 0 and the fixed response text. |
| Stalled edit/Save | Native source editor accepted the public comment `# Windows synthetic Save during stalled request`; Save visibly returned to Saved/Clean while the panel still showed sending. Production Save receipt: success, 280 ms, active workers 1 before and after. Server still had exactly two requests and the second connection remained active. |
| Cancellation/error | Native Cancel showed client cancelled, HTTP status unknown, and the server observed client closure. A separate explicit Send showed the safe HTTP 401 authentication error in 3 ms, without displaying the untrusted response body. |
| Unknown usage | Native completion showed HTTP 200 in 4 ms and input/output/total/reasoning all unknown, not fabricated zeros. |
| Active-request exit | Fifth explicit Send was observed active; native Alt-F4 exited normally, code 0, no forced termination. The stalled client connection closed before server teardown; app receipt reports zero active workers and cleanup complete. Whole launch 273.953 s. Launch 2 separately established ordinary idle normal exit. |
| Deterministic supplementation | Previously passed core 8 cover immutable body/destination/context refusal, usage variants, malformed/deep/invalid UTF-8/truncated/oversized/unsupported responses, auth/error/no retry, cancellation before connect/during headers/body, unavailable server and response deadline. Desktop 6 cover one owned worker/native capture, stale payloads, configuration/project/shutdown/late-result rejection and synchronized Save races. No unchanged passed credential scenarios repeated. |
| Cleanup | All three exact app PIDs/fixture roots absent, three listener lifetimes stopped, final Windows listener query empty on 46082. One app-created synthetic native credential removed through the accepted exact-target ownership-metadata flow, then absence checked. No enumeration/blob inspection/uncertain ownership recovery. Exact preflight window/file removed; all original captures/receipts retained outside Git. |

The final native modal initially returned an unavailable cached accessibility index.
Freshly observed modal screenshot geometry resolved input, with no duplicate credential
save or request dispatch. Preserve this tool failure alongside earlier failures; it is
not a demonstrated product defect. All **29** saved launch-3 native observations took
at most **2448 ms**, below the separate 180-second operator bound. The whole walkthrough
was below 1800 s. Application response 600 s, connection 1 s and cleanup 2 s remained
their own limits; cancellation/exit connection elapsed times are not response deadlines.

**Final accounting:** selected **1/2 builds, 3/3 launches, 5 HTTP requests, one credential
created/removed, three roots removed and three stopped listener lifetimes**. Historical
Windows 7 builds/12 launches becomes **8 builds/15 launches**; Mac remains 1 build/2
launches. No reset or fourth launch. Build 1 executable/installer hashes above remain
valid; no UI production changes or second package build were needed.

Private originals remain in ignored `app/.toolchains/windows-studio-request/`, including
launch-3 captures, source-save/exit/credential cleanup receipts, corrected preflight,
`final-listener-audit.json` and `final-audit.json` with original JSON hashes. The
[public final metadata](../evidence/2026-10-09-windows-studio-request-final.json) contains
safe results only; the prior partial snapshot is retained as history. Shared fixes
are local `0cec43f`; controller/checks/historical blocker records are local `d8139eb`;
final records follow locally. Nothing has been pushed.

The exact outstanding Mac consequence remains the two focused core `ai_request` and
desktop `ai_requests` test commands above. No other-host execution, current full
cross-platform acceptance, full 2A.2 or live Studio compatibility is claimed. Credential
backends/ownership/package identities/security policy remain unchanged. No real key or
endpoint, project-content send, SSE, provider/auth expansion, proposals, installation,
CI, merge/release or next feature was added.

### Focused Mac shared-request verification — 2026-10-09

**Selected recheck: PASS; records committed locally, push requires explicit approval.**
One serial Local macOS ARM64 owner, no subagents or other-host execution. Inspected
refs, branch, worktrees and local changes; the clean existing Mac checkout safely
fast-forwarded from `0a91e20` to the exact published Windows continuation
`de29e496f52a42194f528a57293d5aa06aae4967`. This publication supersedes the earlier
local-only Windows state above; historical failures and budgets remain unchanged.

Both commands ran serially from `app/` on macOS 26.6.2 (25G83), using the existing
Rust/Cargo 1.90.0 `aarch64-apple-darwin` toolchain. Host execution reused the established
loopback-capability route; `CARGO_NET_OFFLINE=true` prevented dependency downloads.
Public synthetic credentials, injected fixture reader and isolated loopback only;
no credential-store operation, secret inspection or project-content send.

| Command | Result on `de29e49` |
| --- | --- |
| `cargo test -p loomlight-core ai_request --locked` | PASS: 8 passed, 0 failed/ignored, 277 filtered; test time 0.11 s |
| `cargo test -p loomlight-desktop ai_requests --locked` | PASS: 6 passed, 0 failed/ignored, 15 filtered; test time 0.97 s |

Core rechecks reject partial prompt 4097 against saved context 4096 and partial
reasoning 1025 against response 1024. Desktop rechecks preserve valid completion while
Save owns the service and retain cancel/configuration/project/shutdown and late-result
rejection. No product, harness or toolchain failure occurred in these commands. Desktop
emitted one unused `WINDOWS_SELECTOR` warning; no assertion or policy was relaxed.

Original combined stdout/stderr, exit codes, toolchain identity and cleanup receipts
are retained outside Git under ignored `.toolchains/reports/mac-request-recheck-de29e49/`.
After each command, its process group was absent, process metadata had no owned process,
and the owned-group listener query had no output (exit 1, no diagnostics). Both isolated
temporary fixture directories were empty and removed. No owned runtime resource remains.

**No code changes, package builds or application launches.** Reuse the
[accepted Mac native walkthrough](../archive/2026-10-09-mac-studio-request-lifecycle.md#final-mac-acceptance--2026-10-09)
and unchanged Windows/Mac credential evidence. These deterministic results close only
the outstanding focused Mac consequence of shared fixes `0cec43f`; they do not claim
a Mac package containing those fixes, new native walkthrough, full 2A.2, Phase 2 or live
Studio compatibility. No existing Windows/Mac evidence is invalidated by this records-only
verification. Mac request history remains **1 build/2 launches** (selected **1/2, 2/3**);
Windows remains **8 builds/15 launches** (selected **1/2, 3/3**). All historical failures
and unused allowances remain intact. Documentation/link/privacy/whitespace checks passed.
Only this acceptance, CURRENT and HANDOVER are selected for the local records commit;
no push, CI, merge/release or next feature is authorized.

## Current Windows qualification contract

**Selected outcome: complete.** Packaged Windows x64 remembered Studio credentials
are qualified for retained input after refusal, Retry/Cancel, exit/reopen, replacement,
explicit authenticated synthetic loopback discovery, confirmed-save/reload recovery,
and supported removal with other-profile/foreign ownership preserved. Scoped synthetic
cleanup is complete. Full 2A.1, real Studio/generation, generic/session/no-auth paths,
clean-OS/locked-store and general cross-build continuity remain outside this slice.

**Execution and authority:** one serial Local Windows owner on
`codex/provider-qualification`, continuing from published `ecc02c4`. The final user
amendment adopted the Astra audit: reuse valid run-14 phase-1 evidence, separate bounded
observation from application response timing, accept original screenshots, and permit
a strictly probe-only rebuild. It authorized at most **two additional builds and three
additional launches** above the ten combined attempts consumed. Completion used
**one build (7) and one launch (16)**: selected-task totals **5 builds / 7 launches,
12 combined**. The unused reserve was not exercised; this completed task grants no
new feature, installation, real endpoint/key, generation, CI, merge/release or host work.

**Evidence reuse:** run 14 remains the full phase-1 PASS on build 6. Build 7 is a
different binary, not an identical-package claim. The source comparison permits only
the controller/tests, Windows probe and the opt-in watchdog block in `main.rs`;
production credential, Settings, transport and persistence logic is unchanged.
`run-16-reuse.json` records both binary hashes and every changed input. Build 7 and
run 16 independently passed complete installed/generated/toolchain/environment gates.
No old manifest or failed result was backfilled. Final documentation changes do not
change the tested runtime or require another package.

**Timing and observation:** build 1200 s (+2 terminate/+2 reap); product waits 15 s,
native entry 120 s, GET 15 s plus 2 s cleanup. Phase-2 observation/acknowledgement and
post-exit receipt collection each have a separate 180 s bound, inside a 1800 s whole
walkthrough watchdog. Phase-1 timing is unchanged. Status is scrolled into view;
original JPEG/PNG/WebP evidence is accepted with exact hash/size checks. Native
screenshots/accessibility establish visible state; probe assertions supplement them.
An observation taking longer than a product deadline is not a product timing failure.

**Closure:** run 16 completed every outstanding native behavior and normal exit.
Run-14 alpha/gamma plus replacement beta are absent after supported removal. The two
run-12 leftovers were separately deleted only after exact recorded target, service,
origin/revision-bound comment, owner, type, persistence, flags and attribute checks.
No enumeration, secret-value inspection or uncertain-ownership recovery occurred.
Earlier three synthetic entries retain their established absence receipts. All eight
known created entries are accounted for; failure roots/receipts and foreign metadata
remain preserved. There is no pending app, build or listener and no required work
remaining for this selection. See the acceptance table below for exact proof/limits.

## Windows qualification evidence — 2026-10-09

The following preserves the earlier ten-attempt sequence and its failures. The
completion amendment and final acceptance are recorded below. One Local Windows
owner; no subagents or other-host access.

| Attempt | Result and authoritative evidence |
| --- | --- |
| Build 5, attempt 4 | PASS on `00370accde1d1d2c12c1b2896daa346d1c7b44bd`; 209.745836 s receipt, 209.836335 s terminal, exit 0/PID absent. EXE SHA256 `c9eed6d86483e6a46debe834061512053fa11296ecaff6281b95dad5a667ebb4`, 14,836,224 bytes. Installer SHA256 `1475f925d0bf8b466974966e1a67bde984bfe26f0fd94b253ea62423776c466d`, 3,691,169 bytes; not run. Complete source/installed/generated/toolchain/environment equality. |
| Run 8, attempt 5 | FAIL, 123.145129 s, exit 1/PID absent, alpha-entry timeout. Returned app window, but optional activation failed with foreground-process-ID error; recovery found no window after exit. No input/Save/fault/GET. Initial root unchanged. |
| Run 10, attempt 6 | FAIL, 123.141790 s, exit 1/PID absent, alpha-entry timeout. Direct capture worked; masked alpha at 52.54–53.61 s, refusal/retained input at 100.97–101.95 s, exact restore. No Retry/successful Save/GET. Initial helper referenced unavailable Node `process`; corrected. Sandboxed fault PID access refused before mutation; authorized external controller succeeded. No late input dispatched. |
| Run 12, attempt 7 | FAIL, 244.551526 s, exit 1/PID absent. Actual masked input, alpha unreadable refusal at 53.50–54.61 s; Retry without retyping confirmed at 82.35–83.33 s; gamma Save at 140.86–141.73 s; stale-origin refusal at 206.48–207.45 s; Cancel after exact restore at 236.13–236.92 s. One accepted alpha GET. Probe failed `Client discovery timing missing`; no complete/reopen proof. A later capture still showed Cancel and is not discovery observation. |
| Build 6, attempt 8 | PASS on `4698a88c11fc689f9ef4da76754324fc2deafcbe`; 258.111509 s receipt, 258.194984 s terminal, exit 0/PID absent. EXE SHA256 `67fd69d2e6bb231c290d67f1270d7c7651fa0cb7ecc8c77f569aa3cdcc796986`, 14,836,224 bytes. Installer SHA256 `81aec132aecb794a26f2adc93afc971d3b03ff211da35925058a8e63301fff45`, 3,688,667 bytes; not run. Complete input equality passed. |
| Run 14, attempt 9 | Full phase-1 PASS, 243.865653 s, exit 0/PID absent. Actual masked alpha; unreadable refusal 46.50–47.64 s; Retry without retyping 77.56–78.48 s; gamma Save 112.08–112.93 s; stale refusal 179.92–180.96 s; Cancel after exact restoration 203.92–204.68 s. Two authenticated alpha GETs and native result observations; request times 0.008900/0.006500 s, cleanup 0.095900/0.096700 s. Complete ordered native receipt, exact store/restoration checks and two remembered-entry presence reads passed. |
| Run 15, attempt 10 | FAIL, 18.078178 s, exit 1/PID absent, `Timeout: get-1-complete`. Correctly gated on full run-14 PASS and identical package/root. Probe checks proved reopen plus one accepted alpha GET (client request 0.012300 s, cleanup 0.095300 s). Initial native capture at 6.75–7.22 s produced a JPEG but null accessibility despite requested text; host text access failed. Refresh reported foreground-process-ID failure after hold expiry. No acknowledgement, beta input, replacement/removal or reload recovery. Internal results are partial evidence, not a native acceptance pass. |

Private original receipts, snapshots, JPEGs and audits remain under the existing
ignored `app/.toolchains/windows-studio-acceptance/` and `windows-studio-step3/`.
`goal-readiness-audit.json` verified 25 preserved earlier evidence hashes and exact
second-root fixture bytes. All 131 checked documentation fragment links resolved.
No old manifest was backfilled. Package-5 source remained fixed; later controller
changes used the existing recorded controller-only input exception.

Run 12's renderer/native observations and exact alpha/gamma/Cancel snapshots establish
those partial behaviors, not full phase 1. The controller stopped before presence
reads when the report failed. Two newly owned synthetic entries remain referenced in
its preserved root; no uncertain ownership is recovered or unrelated key accessed.
At the earlier boundary, task totals were 4 builds/6 launches (10 combined), 6 server lifetimes, 9 native
entry dialogues (8 typed sessions including old late run 6), 9 Save submissions
(4 confirmed, 5 refused), 2 Retry saves, 2 Cancels, 4 GETs, 4 new owned entries,
2 new presence reads. Cumulative Windows totals including earlier work: 6 builds/
11 launches, 6 GETs, 7 owned entries created, 7 presence reads. Earlier counters and
failures remain in history. Four known entries remained across the run-12/run-14 roots at that boundary; final cleanup is below.

Run-14 full proof is retained in `run-14.json` and `run-14-observed.json`; failed
run-15 capture/exit/probe evidence in `run-15.json`, `run-15-exit.json` and
`run-15-host-partial.json`. Both final PIDs were independently rechecked absent;
no test listener remained. Phase-1-complete, reopened and current store bytes share
SHA256 `a26f9b908fc4b3d9480b2768a847e31d5cacd401399ab62f99d6028167622130`.
At that boundary there was no pending app/server/build, changed threshold, extra launch or credential cleanup.
Final documentation validation passed for 412 repository files; whitespace passed.

Root cause of run 12: Tauri 2.11.5 `scripts/core.js` uses `Object.defineProperty` for
`invoke` without writable/configurable flags. The earlier monkey-patch silently did
nothing in the packaged WebView; the previous DOM mock was writable. The corrected
opt-in bridge emits operation/response timing at the real invocation boundary, with
no request payload or native key. Only native-entry response metadata is emitted;
other operations expose name/timing only. The probe uses that event for discovery
and reload/Retry observation. The DOM mock now uses the actual immutable descriptor.
Focused checks: controller 28 PASS, Settings/probe DOM 10 PASS, both TypeScript
compilations PASS. Previous targeted Rust 1 PASS (15 unrelated filtered) remains
valid for unchanged Rust; the initial sandbox OUT_DIR failure is retained.

### Final Windows acceptance and cleanup — 2026-10-09

| Required behavior | Result and evidence |
| --- | --- |
| Native Save/refusal/Retry/Cancel and first exit | PASS, reused full run 14 with unchanged production code; no repeated phase-1 scenarios. |
| Reopen without entry or automatic discovery | PASS, run-14 saved bytes equal reopened bytes; native configured A / not-checked status observed before discovery; both remembered references configured in the native-backed snapshot, no entry or GET before release. |
| Replace A with beta while preserving B/foreign metadata | PASS, one native masked beta entry and one confirmed Save. Whole-store comparison preserves B and foreign ownership exactly; pre-removal audit proves old A absent and beta/B present. |
| Explicit authenticated synthetic discovery | PASS, exactly two accepted GET `/v1/models` requests, alpha then beta, each with native model-available observation. Client request times 0.009200/0.007500 s; cleanup 0.096900/0.107400 s. No real provider or project content. |
| Confirmed Save despite Settings reload failure | PASS, actual saved-success/reload-required message captured. Native accessibility identifies every mutation/discovery field/action disabled and read-only Retry enabled. Confirmation observed 0.430 s after submission. |
| One read-only Retry | PASS, native configured A restored. Probe operation sequence proves one UI `ai.profiles` read, no additional entry/Save/discovery; before/after snapshots and persisted bytes identical. Supporting inspection reads are separately present. |
| Supported credential/profile removal | PASS, native A shows missing/disabled and Removed; B snapshot remains unchanged. Supported controls then remove A/B profiles and B credential; final native state is unconfigured. Old A, beta and B exact targets are absent. |
| Normal exit and stopped listener | PASS, exit 0 at 344.570925 s, approximately 0.268 s after final release; owned window/PID absent. Final external audit confirms no loopback listener. Receipt completion including observation was 360.997468 s. |
| Run-12 leftovers | PASS, two exact targets verified against recorded fixture and Windows ownership metadata, deleted and verified absent. Original failed root bytes unchanged; no credential values read. |

Build 7 (attempt 11) passed in 56.141596 s, terminal 56.209407 s, exit 0/PID absent.
EXE SHA256 `98fe719010dd029965401dd09ae7919dcf27b0f45f99aae8bf0b65c10d925fc6`,
14,853,632 bytes. Installer SHA256
`c6592b17191afbcb6f1f584d36e87370fc73944a6ba1566a08c115c47244f5df`,
3,690,870 bytes; installer not run. Run 16 (attempt 12) passed on that package and
the preserved run-14 root. Final store SHA256
`904ccb5e041ba1121fd653359b9f4f1e9a52ae79e45ee38853641acd2760e141`.

Original native screenshots and accessibility are retained in `run-16-*-native.json`
and JPEGs. The first capture took 114.843 s and succeeded within its separate hold;
later captures took fractions of a second. One stale accessibility index refused
before input; refreshed screenshot coordinates focused the field successfully.
The screen-transition captures are retained, not relabelled as final states. These
are observation-tool issues, not demonstrated credential product defects.

Authoritative private receipts under `app/.toolchains/windows-studio-acceptance/`:
`build-7.json`, `build-7-terminal.json`, `run-16-reuse.json`, `run-16.json`,
`run-16-observed.json`, `run-16-reload-observed.json`, `run-16-replacement-audit.json`,
`run-16-exit.json`, `run-12-scoped-cleanup.json`, and `completion-final-audit.json`.
The latter verifies original capture hashes and terminal state. Run-15 root markers
were copied intact to `run-15-root-markers/` before reuse. The exact cleanup script
is retained privately in `windows-studio-step3/cleanup-run12.py`. Earlier three-key
absence evidence remains in `windows-studio/phase-2.json` and
`windows-studio/local-completion-audit.json`; no passed cleanup was repeated.

Additional accounting: 1 build, 1 launch/listener lifetime, 1 native entry/typed
session, 1 confirmed Save, 1 read-only Retry, 2 GETs, 1 owned entry created; 3 entries
removed through the product (old A/beta/B), 2 exact leftover deletions. Selected-task
totals are 5 builds/7 launches/6 GETs; cumulative Windows totals including earlier
work are **7 builds/12 launches/8 GETs/8 created entries, all removed**.

Focused verification: controller 30 PASS, changed probe DOM 6 PASS, test TypeScript
compilation PASS, package build PASS. The initial controller check hit sandbox TEMP
access errors; the corrected existing workspace TEMP rerun passed. No new Rust or
broad suite was needed for unchanged credential logic. Review confirmed only opt-in
probe behavior changes, preserved product deadlines/ownership, accurate evidence
reuse and completed scoped cleanup. Final review removed a leftover controller comparison between screenshot duration
and request duration; each now has its own deadline. The added regression and
offline revalidation of run 16 passed (`post-review-check.json`); only controller/tests
and README changed after build 7, not packaged runtime. Documentation/link/privacy
and whitespace checks passed. No production defect was demonstrated or fixed.

## Mac non-streaming request lifecycle — 2026-10-09

**Complete on Mac for the selected synthetic subset.** Explicit authenticated Send,
completion/reported or unknown usage, cancellation/safe errors, responsive source
editing and Save, normal exit and owned cleanup passed through the approved signed
production app. Save took 161 ms with the request worker active before/after.
Cumulative allowance: **1/2 builds, 2/3 launches**; four fixed-body loopback POSTs,
one new synthetic credential removed through the product, both owned roots cleaned.

[Archived plan, attempts and final acceptance](../archive/2026-10-09-mac-studio-request-lifecycle.md#final-mac-acceptance--2026-10-09)
owns proof and preserved failure/overrun receipts; [public metadata](../evidence/2026-10-09-mac-studio-request-qualified.json)
owns exact package hashes/results. Accepted Mac development storage/signing policy
and Mac/Windows credential evidence remain unchanged. Focused Windows request/UI/
Save/cancel/stale/shutdown proof remains necessary. This does not close full 2A.2 or
establish Windows request-service qualification/live Studio compatibility. No next
feature, CI, installation or merge/release is selected.

## In plain language

| Part | What you can do when it is complete |
| --- | --- |
| 2A — Connect and configure | Choose a provider/model, securely configure access, set context and maximum response tokens, test the connection and cancel a request. |
| 2B — Give the LLM the right references | Write/edit Character cards and a lorebook, choose which approved entries to include, edit system prompts or restore the baseline, and inspect the complete context before sending. |
| 2C — Generate, review and apply | Rewrite/continue/create Scenes, generate or update Character cards and lore entries, review changes, accept a valid subset and undo them. |

**At the end of Phase 2:** write with an LLM that receives your selected character
and world references, under prompts and size limits you control. Generated game
changes and reference material become durable only through your review. These are
capability summaries; sections 14 and 19 order shared foundations and a small complete
rewrite early, then overlap the remaining AI work with richer Story logic.

## 1. Outcome and scope

An author can select narrative content, choose an assistance action, inspect the exact proposed context/destination, generate a structured proposal, review semantic and file changes, accept a dependency-valid subset, and undo normally. Runnable truth remains authoritative Ren'Py source. All writes use the existing core transaction, revision, history and recovery boundary.

The only Phase 2 provider is **Unsloth Studio**. Generic/OpenAI-compatible adapters,
profiles, auth modes, wire compatibility and live qualification are deferred outside
this phase by the 2026-10-12 scope amendment above. Studio remains a named product
capability with dedicated setup, settings, diagnostics, documentation, fixtures and
live acceptance. Older generic-provider material below is retained as historical
design unless a clause is explicitly included in the Studio-only gates.

| Action | Bounded initial behavior |
| --- | --- |
| Rewrite dialogue | Replace selected dialogue/narration. Preserve speaker, order and staging unless another supported change is explicitly included in the request scope. |
| Continue Scene | Insert supported beats at an explicit anchor. Retain the existing terminal beat; AI terminal/connection changes are deferred. Refuse insertions across ambiguous/custom boundaries. |
| Draft Scene | Propose one new Scene in a selected Chapter with its explicit Return ending. AI-created incoming connections are deferred. Preserve nonempty and explicit terminal invariants. |
| Draft/update Character | Propose a new or revised Character card; optionally propose supported runnable definition fields and existing Appearance references as separate visible operations. Allocate real IDs in core; validate identifiers and collisions. |
| Draft/update lorebook | Propose individually reviewable entries or revisions from selected material or instructions, with provenance and explicit applicability. |

Character cards and the lorebook are required Phase 2 reference features, not just
transient prompt text. Both support manual authoring and user-initiated LLM generation
or revision. Viewable/editable system prompts with Restore baseline and explicit
context/response size controls are required; sections 5, 6 and 9 own their contracts.

Use only the accepted Phase 1 beat subset. Phase 2 does not introduce arbitrary Python/code generation, conditions/calls, screens/ATL, image generation, arbitrary-project import, state simulation, Run From Here, narrative consistency analysis, embeddings/vector search, background summarisation, autonomous tools, model training, provider installation or GitHub remote workflows. Preserve adult-content support without application-level filtering.

## 2. Evidence for the Unsloth contract

Official documentation was reviewed on 2026-09-22. These are upstream statements, not evidence that an installed version was tested:

- [API overview](https://unsloth.ai/docs/basics/api): external clients authenticate with a Studio API key; models must be loaded; the actual endpoint/port is configurable. Studio's API monitor can display prompts, replies and usage. Older versions may lack the external API.
- [HTTP integration](https://unsloth.ai/docs/integrations/connect-curl-and-http-to-unsloth): loaded-model discovery uses GET /v1/models and exact returned IDs; generation uses POST /v1/chat/completions. JSON and SSE responses, enable_thinking, request-level sampling/output controls and server-side tool options are documented.
- [Python integration, JSON decoding](https://unsloth.ai/docs/integrations/connect-python-sdk-to-unsloth#json-decoding-response_format): response_format with a JSON schema is documented. Loomlight must still validate syntax, semantics, references and source ownership locally.
- [LAN access](https://unsloth.ai/docs/basics/lan): Studio can serve another device on the user's network.
- [API overview, remote access](https://unsloth.ai/docs/basics/api): Cloudflare quick-tunnel clients are instructed to use non-streaming requests.
- [Studio chat](https://unsloth.ai/docs/new/studio/chat): inference settings and connected external providers exist. A local connection address alone does not establish the eventual inference location.

The reviewed pages do not establish a stable external HTTP load/unload contract, guaranteed server-stop cancellation, exact tokenizer/context introspection, or minimum compatible Studio version. 2A.0 must record measured support; do not invent these APIs or infer them from the Studio browser UI.

One API-page reasoning example has contradictory prose/flag direction. Use the HTTP guide's explicit request field and measured behavior rather than copying that example.

## 3. Required Unsloth behavior

| ID | Requirement |
| --- | --- |
| U1 | Named Unsloth Studio provider, setup instructions and dedicated connection diagnostics. It is not presented as an untested generic preset. |
| U2 | Accept the actual Studio endpoint; normalise an origin or /v1 base exactly once, preserve explicitly configured proxy prefixes, and reject ambiguous completion-path input with useful guidance. Never assume one fixed port or scan ports. |
| U3 | Native secret entry; a saved key is reused across application sessions through the approved remembered-storage policy. No session-only mode. Core injects Bearer authentication. Never read Studio's credential database, scrape its console or retain API keys in renderer/project/config/log data. |
| U4 | Explicit authenticated Refresh models; use returned IDs unchanged, keep friendly names separate, allow manual IDs when discovery is unavailable. Do not treat loaded models as a complete downloadable catalogue. |
| U5 | Distinguish untested, ready, no loaded model, selected model unavailable, authentication failure, unreachable, busy, interrupted and unsupported capability. Only show loading/OOM/version claims when actual evidence supports them. |
| U6 | JSON-schema output is the preferred tested mode. Validate a synthetic schema probe against the selected configuration; invalidate capability evidence after relevant changes. A capability test is evidence, not a proof of every future response. |
| U7 | Thinking mode supports provider default/on/off when qualified. Keep final response content separate from reasoning fields; never interpret reasoning or tool output as an applicable proposal. |
| U8 | Separate server context capacity, Loomlight input budget and response allowance. Do not send invented num_ctx/max_seq_length fields or claim an output limit resizes the loaded server context. |
| U9 | Support local and explicitly configured network connections, non-streaming baseline and a separately qualified SSE option. Tunnel mode selects non-streaming before send; no hidden retry with another transport. |
| U10 | Disable server-side tools in every qualified Studio request; expose no client tools, persistent tool sessions or autonomous tool loop. Test the disable behavior before project sends; reject unexpected tool events/results. |
| U11 | Dedicated errors and recovery guidance for revoked keys, missing model, server restart, unsupported fields, truncation and interrupted streams. Preserve the author's input and project. |
| U12 | Live synthetic acceptance for the supported Studio version/configuration, including structured proposals and disabled tools, plus packaged Loomlight client evidence on both supported operating systems. |

Model lifecycle baseline: users load/switch models in Studio; Loomlight refreshes availability and requires a selected model before sending. No silent model substitution. If discovery changes, invalidate the pending send review. Check returned model identity where the server provides it, with documented alias handling; do not claim identical-model proof where the protocol cannot provide it.

Investigate managed load/unload during 2A.0. If a documented stable public interface exists, propose an explicit follow-on contract covering ownership, shared users, cancellation and unloading. Until separately approved, do not launch Studio, download models, kill its processes or unload models used by other clients. First-class inference support does not depend on undocumented management APIs.

## 4. Shared provider and credential architecture

The concrete 2A.0 contract is [ADR 0013](../../adr/0013-provider-request-and-transport-contract.md).
The corrected Studio-scoped reference/design is accepted for the first bounded
remembered-profile 2A.1 slice. Generic/full-phase acceptance remains incomplete;
the [qualification ledger](../archive/2026-10-09-phase-2-execution-history.md#25-provider-qualification-ledger--2026-10-07)
distinguishes deterministic proof, partial production preparation and missing native evidence.

Keep privileged effects in Rust/core and the trusted desktop host. Add narrow services for provider profiles, credential references, request execution, context assembly and proposal preparation. Keep the existing IPC envelope and deny-by-default WebView capability model. Renderer actions reference opaque configuration/request/proposal IDs; no generic HTTP, shell or filesystem capability.

Candidate module boundaries, to confirm against accepted Phase 1 before coding:

- core llm/provider, llm/request, llm/context, llm/proposal and lore modules;
- desktop native credential UI/OS-store adapter and background-request integration;
- renderer assistance/context/proposal-review modules and existing semantic theme tokens;
- versioned prompt resources and strict response schemas;
- deterministic provider fixtures plus a bounded live compatibility runner.

Keep existing HTTP infrastructure if it meets cancellation and streaming requirements. Add or change a dependency only after a documented gap/licence review; do not conduct a broad stack replacement.

A provider profile stores a UUID, provider kind, label, canonical endpoint, optional selected model, authentication/storage mode, opaque credential reference, transport choice, capability evidence and bounded generation settings. Profiles and project-to-profile bindings are machine-local. Moving a project requires explicit profile selection and credential setup; project text never imports or activates an endpoint. [ADR 0011](../../adr/0011-ai-settings-secrets-and-reference-storage.md) records the accepted design, not implemented behavior.

Credential entry, replace and delete use native controls. Use **Remember on this
computer** under the approved storage policy and reuse the saved key across sessions.
The user's 2026-10-12 correction removes **Use for this app session** from the product
requirement; no session-only implementation or automatic fallback is selected.
Qualification uses the ordinary saved Studio profile through native/core access;
do not create a disposable credential store for each live session or delete the
user's saved key as test cleanup. Owned synthetic project/test roots and explicitly
temporary fixture credentials remain disposable. Only an app-reported missing or
unreadable saved credential requires fresh native entry; never read/export the key
through tools or chat.
A generic profile may choose **No authentication**; Studio requires its API key.
Authenticated v1 profiles use Bearer keys, not arbitrary headers or OAuth. OS-store
failure is actionable and cannot fall back to plaintext. Renderer sees only mode and
configured/missing/unavailable state; there is no read-secret IPC. Key changes
invalidate prepared sends. Never pass keys to Ren'Py, Git, subprocess environments,
request previews or diagnostics. Memory/swap/OS internals are not claimed perfectly secret.

### Storage ownership and credential lifecycle

The selected [temporary Mac development plan](2026-10-08-macos-development-credential-storage.md)
supersedes Mac API-key storage only. Native entry/Rust-only secrets remain; Keychain
API-key operations, session escape and Apple Development signing are deferred. Source/
synthetic implementation is separate from the bounded packaged reuse/recovery result.
That sequence passed on its recorded inputs; subsequent review corrections have their
own evidence boundary in the [independent review](../archive/2026-10-09-phase-2-execution-history.md#mac-development-independent-local-review--2026-10-08).

| Content | Planned location and contract |
| --- | --- |
| Profiles and device-local project bindings | Versioned `ai-profiles.json` under the existing application-data root; validated safe replacement, separate from UI preferences. Defaults/capability evidence bind to model/configuration. |
| Remembered keys | Baseline macOS Keychain / Windows Credential Manager design; the selected temporary Mac development exception uses encrypted local files and an unencrypted local unlock key, retaining all native ownership as deferred. |
| Session-only keys | Excluded by the user's 2026-10-12 saved-key-only decision; earlier session-mode designs are historical. |
| Bundled prompts | One versioned packaged prompts resource directory; no duplicate handler literals. |
| Project prompts/style notes | Versioned `.renpy-editor/ai.json`, full override text plus baseline version/digest; existing metadata transaction/history/recovery. |
| Cards/lore | Versioned `.renpy-editor/references.json`, shared record service with separate collections; section 9 owns the format. |
| Prepared requests/replies | Memory-only; section 8 governs explicitly saved proposed references. |

OS entries and profile files cannot share one filesystem transaction. Prepare a
replacement key under a fresh opaque credential ID, then safely switch the validated
profile reference. A failed profile write preserves the previous working reference
and attempts cleanup of the new entry. Delete obsolete entries only after the switch.
Report cleanup failures and retain their references for bounded retry. For removal,
make the profile unusable for sends before deleting its owned OS entry; a failure
retains a non-secret cleanup reference and reports incomplete removal. Apply the same
publish-before-retire rule to session-key/mode replacement: a failed profile save retains
the prior usable state. Never delete another profile's entry. Use deterministic failure fixtures, not a new transaction
framework or hostile/crash programme.

Local removal does not revoke a provider key; explain revocation separately. Project
copies/backups contain no credentials. Key export, cloud sync and portable vaults are
deferred. Specify native adapter persistence/access attributes to match machine-local
storage; keep application/entry identifiers stable across updates and test namespaces
separate. Qualify packaged reopen/update identity, retaining unsigned macOS prompt
limits without requiring a signing purchase. The credential spike had no entry UI;
it cannot qualify production entry/store/request/replace/delete behavior.


Endpoint policy: permit loopback HTTP and verified HTTPS. Private-network/VPN HTTP is selected with distinct per-profile opt-in and unencrypted-transport disclosure; ADR 0011 records the choice. Test ordinary address classification and credential/redirect mistakes, reject non-private plaintext destinations, and never globally disable TLS verification. Show connection location and inference locality separately, including unknown. Do not infer confidentiality from a hostname. Reject credentials in URLs, unsupported schemes and unreviewed redirects; bind the credential to the exact reviewed origin. Explicitly govern proxies and DNS/address changes so credentials cannot be redirected silently. No endpoint is imported or activated from project/model text.

Unsloth provider setup explains that Studio can inspect request content in its own monitor; Loomlight's log redaction does not control provider retention. A sensitive-content warning identifies remote/unknown inference or an intermediary service without content filtering.

## 5. Request execution and budgets

Network work must not hold the project mutation lock or block Save, editing or cancellation IPC. Capture an immutable input snapshot under a short read/validation boundary, release it, then send in a cancellable worker. Re-enter the existing mutation boundary only for final accepted changes.

One active generation per project is the initial limit; another request requires cancellation or completion. Bound outstanding connection tests globally as well. No hidden queues or model-wait polling.

Request states: prepared, sending, receiving, validating, review_ready, failed, cancelled, expired and consumed. Cancellation and late-result publication arbitrate against the same request/session generation. A cancelled or replaced session cannot become review_ready/applicable. Disconnection may not stop provider computation or billing; report cancellation of the client request truthfully.

Proposed initial resource limits, to be confirmed in 2A.0 with evidence: 10-second connect timeout, 180-second no-progress timeout, 600-second total generation timeout (editable per profile within a bounded 30-1800-second range), 2 MiB serialised outbound body, 2 MiB assembled final text, 8 MiB total response stream and 256 proposal operations. Do not silently truncate. These are application limits, not promises about model capacity. Non-streaming requests have no token progress, so their no-progress timeout uses the total response deadline. Bounded worker cancellation must release application resources promptly.

Require a configured effective context ceiling when reliable introspection is unavailable. Estimate the complete outbound prompt, task instructions, schema, selected context and message framing. Reserve requested output and a labelled estimation margin; reasoning may consume part of the model's generation/context allowance. Never equate max output with total context. Use provider-specific parameter mappings and reject unsupported combinations before sending.

### User-visible size controls

Settings expose **Context budget (tokens)** and **Maximum response (tokens)** for
each provider/model profile, with explicit per-request overrides shown before Send.
Show the known model/server capacity separately; if unknown, require a user-supplied
capacity labelled unverified. Context budget is the total request allowance, including
input and reserved output. Show an input breakdown for instructions/schema, selected
story, Character cards and lorebook, plus the output reserve and estimation margin.
Reject requests whose estimated total exceeds the configured budget or known capacity.
Do not silently drop entries, shrink output, clamp a value or reload a server model.

Map maximum response to the qualified provider's output-limit field. This is a ceiling,
not a promise of exact prose length; schema text and, where applicable, reasoning use
the allowance too. A requested word/beat count belongs in the visible task instruction
and remains a soft target. A truncated structured response cannot be applied. Saving
or overriding either setting invalidates a prepared send and updates its preview.
Reopen restores profile defaults; switching provider/model cannot silently reuse an
incompatible limit. If the server's loaded context must change, explain the required
external configuration rather than pretending Loomlight changed it.

Use server sampling defaults unless the author overrides supported settings. Preserve editable temperature/top-p/output allowance and qualified thinking controls; optional provider-specific fields require a typed allowlist. No arbitrary headers or unchecked extra JSON overrides of tools, endpoint, auth or context.

Show provider-reported tokens/finish reason/latency when available. Distinguish measured from estimated counts, and missing usage from zero. Optional monetary estimates require user-supplied prices and remain estimates. Do not include a model/price catalogue.

Start with non-streaming complete responses. SSE adds bounded incremental parsing, UTF-8/chunk/event limits, timeouts, progress and cancellation without exposing partial JSON as accepted edits. Every generation still requires an explicit send. No automatic retry, repair request, continuation, fallback provider or downgrade of response mode.

## 6. Deterministic context and prompt control

Prepare context from committed source plus validated editor metadata; unresolved target drafts/conflicts must be resolved before an applicable request. Unrelated drafts may remain but are excluded and disclosed.

The manifest records project/session identity, action/targets, allowed mutation scope,
selected ordered beats/Scenes, all source and metadata revisions read, approved
Character-card and lorebook revisions, referenced entity IDs, prompt/schema version,
exclusions, uncertainty and size estimate. The user's 2026-10-12 direction defers
selected-route context, repeated visits and bounded route cycles beyond Phase 2.
Stored reference applicability may still use a finite route; that does not assemble
route context or claim runtime reachability.

Defaults: selected narrative content, relevant runnable Character definitions, approved cards linked to selected Characters, explicitly selected approved lorebook entries, and the necessary variable/asset references. Show suggested card inclusion and allow the author to exclude it before Send; list every included entry and its revision. Lorebook scope/Character tags help selection but do not silently inject every matching entry. Dependency expansion is visible in the review; its inclusion grants no mutation authority. Variables are labelled as defaults or supported scene-local observations. Unknown conditions/custom effects are not invented as known state. No automatic asset binary, whole-project, hidden file, credential, Git history or external-file inclusion.

Protected source remains unchanged. Default to a visible custom-code marker; explicit inclusion of exact custom text requires a preview and still grants no right to execute or edit it. Treat all project prose, filenames, lore and model output as untrusted data. Prompt injection cannot add tools, expand files or change the configured destination.

Use stable ordering/deduplication and explicit budget refusal. Do not silently shorten dialogue or remove dependencies. Defer automatic summaries/embeddings; any later selected summary needs matching provenance revisions and stale invalidation.

Store editable task prompt resources in one versioned prompts directory; no duplicate hardcoded prompt text in handlers. Provide project-local author instructions/style notes separately from machine provider configuration. Schema, operation permissions and security checks remain core-owned. Preview the effective instructions and context; save template edits explicitly and include their digest in the manifest.

### System prompt editor and baseline

Expose the actual system/authoring instructions for each assistance action in Settings.
Users can inspect and edit them, save project-local overrides, and choose **Restore
baseline** for the selected prompt or explicitly for all prompts. Show the bundled
baseline version and whether the current prompt is customized. Uncustomized prompts
use the installed app's baseline; a changed version/digest appears on the next send
review. Updates never overwrite custom text. Show its saved baseline version and allow
comparison with the installed baseline. Restore baseline removes the override and
restores the installed app's bundled text
through the ordinary undoable metadata change path, leaving cards, lore, credentials
and generation settings intact. Changing or resetting a prompt invalidates prepared
sends and requires a fresh preview. Baseline prompts remain maintained in one versioned
resource location, with overrides stored separately.

Preview the complete effective instructions and context, including any adapter mapping
to system/developer roles. Character cards and lore are reference data, not hidden
system prompts. Core-owned schema, path, operation and transaction validation is
visible as the response contract but is not disabled by editing prompt prose. Prompt
editing does not introduce application-level content filtering. Protect unsaved prompt
edits across navigation; persisted overrides and reset/undo survive normal reopen.

Custom prompts belong to each Ren'Py game project, not this chat or a personal shared
library. An override replaces that action's authoring prose; project style notes remain
separately visible. V1 uses literal text and core-owned context assembly: no executable
templates, recursive macros or card-supplied system-prompt overrides. Save/reset use
project metadata history; editing prose cannot disable the response/operation contract.

A prepared-send token binds the exact request body, profile/model/capability configuration, read-set revisions and disclosure. Send rechecks that token before dispatch. Relevant edits require rebuilding and reviewing; unrelated changes should not invalidate a provably unaffected request. Never rebuild silently after consent.

## 7. Structured proposals and source preparation

Use a versioned, closed proposal schema with typed semantic operations and proposal-local references. Core owns real UUID allocation and source/path derivation. Initial operation families are dialogue/narration replacement, supported beat insertion, one Scene creation with Return, runnable Character creation/update within scope, and Character-card/lorebook entry proposals. AI replacement of existing terminal Beats or story connections is deferred by the user's 2026-10-12 decision. Approval is an explicit user operation; model output cannot approve itself.

Responses cannot choose arbitrary paths, patch custom source, rename technical identifiers implicitly, execute code, import assets, invoke tools or write outside the allowed target set. Enforce existing string/metadata/integer/source bounds, including exact decimal representation for large integers.

**Generated text boundary (selected 2026-10-07):** generated dialogue, narration,
choice captions and other displayed source strings are literal prose by default.
Core must encode them for both the source string and Ren'Py's display-text syntax;
escaping quotes/backslashes alone does not neutralize interpolation or text tags.
Model-supplied bracket/brace syntax must not become active Python interpolation,
hyperlinks, control-flow tags or asset references. This is operation validation,
not content filtering. Cards/lore remain ordinary metadata text; do not apply runnable
text escaping to their stored prose.

For rewrites, preserve existing reviewed placeholders and formatting through opaque,
revision-bound tokens owned by core. The model may rewrite literal segments but may
not supply, alter, reorder, duplicate or remove protected tokens. Show preserved tokens
in the review and restore their exact original source representation. Refuse a target
when its literal/token boundaries cannot be established safely; do not silently strip
markup or escape the entire existing line. New active markup/expression generation is
outside this initial contract. Manual Source editing remains unchanged. Final emitted
source and the preview digest must reflect this validation before acceptance.

Before the first applicable rewrite, add focused planner/emission tests for expression
and function-call interpolation, action-bearing tags, ordinary literal brackets/braces,
existing placeholders/formatting, token tampering and unsupported-target refusal.
Use harmless synthetic strings and a bounded pinned-SDK assertion that accepted literal
text displays literally; no hostile payload execution is needed. Rejected proposals
write nothing, and valid accepted changes retain ordinary undo/reopen behavior.

Validation order:

1. Require successful protocol completion, a single final result and a usable finish reason. Truncation, refusal, empty response or interrupted stream is non-applicable.
2. Parse one complete JSON document with depth/size/count limits, duplicate-key rejection and no arbitrary regex extraction or heuristic repair.
3. Validate schema version, exact fields, action allowlist, target scope, values and proposal-local references.
4. Resolve dependencies; reject cycles/missing definitions, ambiguous references and unsafe custom-boundary crossings.
5. Revalidate all context and target revisions, lifecycle identity and current draft/recovery state.
6. Compile the selected semantic operations into one previewed final mutation set using the existing source/transaction primitives.

The former text-JSON compatibility mode was for generic endpoints and is deferred
outside Phase 2. Studio acceptance uses its documented schema mode, with the same
strict local validation. No silent downgrade when a schema request fails.

Build a non-mutating proposal planner over the actual accepted Phase 1 services. Existing single-operation apply handlers must not be looped to simulate a batch. Prepare a transient candidate, apply supported semantic intents in dependency order, combine changes to the same file, check final invariants, and produce exact minimal source/metadata patches. This transient object exists only for review; it is not a competing runnable document.

The displayed file diff must derive from the exact core-prepared mutations later accepted. SDK validation is an explicit separate trust action because it can execute project code; ordinary proposal preview is static and non-executing.

## 8. Review, partial acceptance, history and lifetime

Provide semantic and file views, readable explanations, affected entities, dependencies and uncertainty. Reuse the accepted UI refresh and semantic theme tokens in both supported themes, accessible checkboxes/keyboard focus, responsive panels and clear empty/error/stale states. Untrusted output renders as passive text; no injected HTML or provider links automatically opened.

Selection units are whole semantic operations or inseparable operation groups, not arbitrary diff lines. Selecting dependent dialogue requires its Character definition or explicit remapping. Changing selection rebuilds dependencies and patches and shows a fresh diff. Never auto-select hidden changes.

Accept binds proposal ID, selected operations and preview digest; core rechecks the complete read/write set and target draft generation immediately before commit. A stale source/context/card/lore revision requires fresh preparation and review; no automatic rebase. Recovery blocking and optimistic concurrency remain the established Phase 1 policies.

Commit the accepted subset through one journalled semantic transaction and one coherent undo entry. It is a recoverable multi-file sequence, not a claim of universal atomicity. Commit failure retains evidence and cannot report success. Failed pre-commit validation writes no runnable source.

After any partial acceptance, consume the original proposal; unaccepted suggestions stay visible as a reference until dismissed. Applying more requires a new prepared review against the current project. Retrying acceptance with the same token must not duplicate mutations; recovery and actual revisions determine ambiguous outcomes.

Initial transient context snapshots and generated proposal reviews are memory-only. Navigation may retain them within the same project session; close/switch warns before discarding unaccepted work. Restart does not silently persist raw prompts/replies or resume requests. Explicitly saved author instructions, Character cards and lorebook entries are durable. Unsaved generated proposals remain transient; explicitly saved proposed entries persist with their proposed status, without becoming approved reference material. Existing transaction recovery covers acceptance interrupted by a crash. Persistent proposal archives are deferred.

## 9. Character cards and lorebook

For the selected manual-library outcome, the
[2026-10-09 user correction](#manual-reference-library-selection--2026-10-09) replaces
manual status controls with directly editable forms and ordinary Save/Discard.
The shared schema retains lifecycle states for later generated-content review.

### Character cards

A Character card is persistent editor-only reference material, distinct from Ren'Py's
runnable Character definition. It has a stable ID, optional linked Character ID,
name/aliases, description/appearance notes, personality, motivations, background,
relationships, speaking style and example dialogue. Optional explicit Scene/route
applicability and knowledge notes control what the author intends to include; they
are not computed runtime knowledge. Field bounds and exact schema are defined before
implementation. Card appearance prose never imports/generates an image or changes an
Appearance asset implicitly.

Create/edit cards by hand, or request a draft/update from instructions and selected
story/reference material. Cards can exist before a runnable Character is created.
Review generated changes per card/field group; accepting a card does not implicitly
create or modify source. A linked runnable definition change is a separate visible
proposal operation with dependency checks. Keep one card record; reference shared
facts by lore-entry ID rather than duplicating independent canonical copies.

Use the same proposed/approved/rejected/superseded status and provenance rules as
lorebook entries. Only approved, current, included cards become ordinary generation
references. Manual save can explicitly approve the author's own entry; LLM generation
cannot approve itself. Changing accepted reference text requires a new approved
revision before it is used. Retain unresolved links when Characters are removed.
Source-derived facts become stale when their supporting revisions change; explicitly
authored intent remains distinct from a claim extracted from source.

The required baseline is native Loomlight cards, without external card-format import,
PNG-embedded cards or third-party lorebook compatibility. Those are separately
selectable interoperability work, not assumed by the word card.

### Lorebook

The lorebook is a browsable/editable collection of entries for world rules, locations,
factions, history, relationships and other selected story facts. Entries have titles,
text, categories/tags, links and explicit scope. Support manual creation, LLM drafting
of one or several bounded entries, and proposed updates from selected material.
Search/filter/select entries for generation; expose inclusions and exclusions in
context review. Automatic keyword injection, recursive retrieval, embeddings and
whole-book sends are outside the initial baseline.

Introduce a versioned editor-only lore document through the shared metadata transaction boundary. Records include stable ID, text, subject/category, explicit Scene/route applicability, optional Character knowledge annotations, source citations/revisions, inferred-versus-user-authored provenance, status, supersession relationship and review/change metadata.

Statuses are proposed, approved, rejected and superseded. Display contradictory alternatives without silently selecting a winner. Automated contradiction detection and runtime knowledge inference remain later phases.

Saving a proposed fact is distinct from approving it. Only explicit approval enables default context inclusion. An approved fact with changed supporting revisions becomes stale and requires reconfirmation before default inclusion. If supporting Scene/Character entities are deleted or missing, retain the fact and unresolved citation; do not cascade-delete or silently broaden its scope.

Provide list/edit/filter/approve/reject/supersede controls for cards and lorebook entries with undo and reopen tests. Preserve unknown metadata fields, validate migrations and bound accepted data so it remains reloadable. Lore never changes runnable variables automatically and the game must remain runnable without this metadata.

### Native format, scope and revision rules

Use JSON with `schemaVersion`, `cards` and `loreEntries`; one service owns their IDs,
revisions, approval, citations, migrations and undo. Shared records have a stable ID
and revisions with revision ID, title, tags, status, provenance/citations, scope,
optional supersession link and preserved extension data. Cards contain the descriptive
fields above, optional runnable Character ID and linked lore IDs. Lore contains text,
category, subject/entity links and knowledge notes. Relationships may link entity IDs
with explanatory prose; missing links stay visible and do not cascade-delete content.

V1 scope is project-wide, selected Scene IDs, or an explicit finite selected route
retaining repeated visits. Scope aids author selection; it does not infer reachability
or inject references silently. Use written knowledge/spoiler notes. Structured
before/after variants, game-day/time validity, keyword/recursive injection and runtime
knowledge inference are deferred. Only the reviewed approved revision is sent.
An approved revision remains available while a replacement is proposed/reviewed,
unless its own citations become stale. Rejection preserves the approved text; approval
explicitly supersedes it. Existing history supports undo. Manual Save may explicitly
approve the author's own text without an additional approval ritual.

Before the 2B.1 editor, record concrete schema/fixtures for required/optional fields,
IDs/links/scope, revision selection, string/record/file bounds, migrations and unknown
fields. Derive bounds from existing metadata/reload and selected-context limits. Keep
useful approved/proposed state in the document; history owns undo rather than an
unbounded reply archive. A missing document means an empty library; malformed existing
or unsupported newer data is retained with a diagnostic, never replaced as empty.
Project AI/reference metadata is editor-only and excluded from game distributions.

Research reviewed 2026-10-07: [Character Card V2](https://github.com/malfoyslastname/character-card-spec-v2),
[V3](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md) and
[SillyTavern World Info](https://docs.sillytavern.app/usage/core-concepts/worldinfo/)
offer useful descriptive fields. Their roleplay prompt overrides and keyword/recursive
inclusion do not fit exact reviewed authoring context. Retain native storage and defer
external JSON/PNG import/export.

## 10. Checkpoint sequence and gates

These are dependency checkpoints, not mandatory chat boundaries. Select one coherent
outcome with internal implementation/test/review checkpoints under [WORKFLOW](../../WORKFLOW.md);
resume that same outcome/chat after a wait. The completed bounded selections linked
at the top own current evidence; historical first-Studio preparation records are not
current `not_started` status. The table below retains the applicable Studio
requirements baseline; completed Studio/selectable slices do not establish every
operation/evidence cell. The original generic-provider requirements are superseded
by the active scope amendment above. Planning does not authorize provider connections
or execution.

| Checkpoint | Deliverable | Acceptance and next boundary |
| --- | --- | --- |
| 2A.0 — Studio qualification and contracts | Bounded synthetic Studio probes; version/capability matrix; request/credential/transport contract; confirm limits and management-API findings. | Record actual Studio success/failure/unknown. Prove Studio schema mode and tools-disabled behavior or record a blocker. No project sends. Return for review before production integration. |
| 2A.1 — Studio settings and credentials | One Studio provider, native credential entry, explicit context/response settings, connection/model tests and dedicated setup/readiness/error UX. | Production native entry/store/request/replace/delete, saved-key reuse across sessions, packaged reopen/identity, controlled unavailable-store failures, zero reflection, no requests on project open, origin binding and invalidation. Session-only mode is excluded by the 2026-10-12 user decision. Physical locked-store/signed-upgrade behavior is proved where accessible or retained as a limit; no enterprise-policy gate. |
| 2A.2 — Studio request service | Background Studio transport, qualified non-streaming behavior, cancellation/timeouts/resource bounds, settings mapping and usage results. | Delayed/out-of-order responses, cancellation races, dead server, bad auth, request limits and Save responsiveness. Test the Studio adapter without project writes. SSE remains outside the active outcome unless already selected and qualified. |
| 2B.1 — Context and prompts | Manual Character-card/lorebook storage and editing, deterministic manifests, budgets, dependency disclosure, revisions/provenance and system-prompt editing/baseline reset. | Golden payloads; exact selected card/lore revisions; prompt edit/reset/undo/reopen; no whole-project leakage; no silent truncation; input/output budget accounting. Selected-route context/repeated visits/bounded cycles are user-deferred beyond Phase 2. |
| 2B.2 — Assistance and send review | Five action entry points, context/destination preview and request snapshot binding. | Exact reviewed payload sent once; relevant changes force renewed review; sensitive/locality disclosures; session and pending-draft safeguards. |
| 2C.1 — Proposal planner | Strict schemas, semantic/dependency checks, literal generated text/protected existing tokens and non-mutating batch-to-patch preparation. | Malicious/invalid output writes nothing; interpolation/tag and token-tampering checks, same-file batch edits, new IDs, terminal constraints, Unicode/custom preservation and exact previewed mutations. |
| 2C.2 — Proposal acceptance | Semantic/file review, dependency-valid subsets, stale rejection, one transaction/undo and explicit transient lifetime. | Core/renderer/native acceptance, duplicate-click/retry protection, concurrent drafts, external edits, interrupted-acceptance recovery using non-crashing fault/state fixtures, no partial success claims. |
| 2C.3 — Character and lore completion | LLM draft/update of Character cards and lorebook entries, separate runnable definitions, statuses, provenance and approvals on the manual foundation from 2B.1. | No implicit lore approval or source execution; migration/reopen, stale citations, missing entities, repeated undo/redo and metadata-free game behavior. |
| 2C.4 — Integrated Studio acceptance | Real authoring workflow through all five actions on Studio and both supported client targets. | Applicable Studio matrix below passes; remaining limitations explicit; complete independent review and final human acceptance; no automatic merge or new execution scope. Selected 3A overlap follows section 19. |

Dependency detail: 2B.1 supplies manual cards/lorebook and their approved-reference selection before the first rewrite. 2C.1 defines their proposal operations; 2C.3 completes LLM generation/update and lifecycle UX. Until each generated action is complete it is visibly unavailable; the five-action release claim is made only at 2C.4. Confirm schema ownership during 2A.0 to avoid circular prerequisites.

At each checkpoint, update its ledger and canonical behavior/ADRs, run cheap relevant gates, then the required supported-target evidence for the changed candidate. Do not implement all rows as one goal.

## 11. Verification matrix

| Layer | Required evidence |
| --- | --- |
| Studio fixtures | Auth redaction; endpoint/base-path normalization; redirect/proxy refusal; unavailable/no-model/busy errors; capability mismatch; exact model IDs; malformed schema responses; tools-disabled fields; qualified transport framing and usage/finish-reason handling. Generic compatibility parsing and provider-specific adapters are outside Phase 2. |
| Lifecycle/concurrency | Studio profile/model change, key rotation, project switch, cancel/complete race, old-session callback, competing Source draft, accepted source/card/lore change, prompt reset, size-setting change, stale send token and duplicate acceptance. Save remains responsive during a stalled request. |
| Context | Manual and LLM-generated cards/lorebook; exact approved inclusions/exclusions; stale reference rejection; prompt customization, baseline reset and reopen; context/output boundary refusal; deterministic order, dependency accounting, excluded custom code/assets, unknown state, exact large integers, stale summaries/lore, over-budget rejection and no implicit sends. Selected-route context/repeats/cycles are user-deferred; stored reference route applicability remains supported. |
| Transactions | Multiple operations touching one file; new Character plus dialogue; partial dependency refusal; terminal beat validity; external edits; Unicode/BOM/newline preservation; undo/redo; failed commit; ordinary interrupted-save/recovery fixtures; metadata limits and reopen. |
| Security/privacy | Native credentials absent from renderer/project/logs/artifacts; prompt-injection fixtures cannot expand authority; unsafe names/paths/HTML refused; no ambient WebView HTTP/shell privilege; no tool execution; provider retention disclosure. |
| UX/native | Windows x64 and macOS ARM64 packaged action/context/diff/accept workflow; keyboard/focus; small window/overflow; readable status; cancel/error/retry; authoritative native credential interaction. Browser tests support but do not replace packaged evidence. |
| Live Studio compatibility | Record exact client commit, Studio version or unknown, selected model ID/quantization where known, configured context/output, transport and actual results. Use synthetic content on the selected Studio configuration. Generic endpoint testing is outside Phase 2. |
| Integrated product | Rewrite with selected cards/lorebook and a customized system prompt, restore baseline, vary context/response limits, continue/create Scene, draft/update Character cards and lorebook, approve references, inspect both diffs, accept subset, undo/redo, close/reopen, explicit SDK validate/run, and execute a copy without editor metadata. |

Both client platforms may connect to the same controlled inference host; GPU inference does not need to run on every CI worker. Deterministic CI uses a bounded fake server. Required live evidence is separately recorded, not replaced by mocks or an unavailable-provider skip. No paid/public-provider calls or GPU downloads occur in routine CI without explicit setup.

Use current repository commands from AGENTS/TESTING and add focused test commands in each implementing brief once actual paths exist. Preserve failed evidence and exact run/attempt/SHA. No full package matrix for this documentation-only plan; no duplicate unchanged acceptance runs or model polling during external waits.

### Component selection and proof cost

This selection supplements sections 10-11 and existing TESTING selectors; it does not
waive requirement IDs or implement new evidence reuse. Map focused cases to requirements
and record counts/skips, affected hosts and finite expensive allowance before execution.
Share source/transaction fixtures and test the narrowest actual controller/service seam.

| Component | Decisive focused proof | Native/live boundary |
| --- | --- | --- |
| Profiles/keys | Persistence, replacement/removal failure ordering, unavailable store, session exit/clear, origin/redirect refusal and no reflection | Early packaged entry/store/request/reopen path on both targets; mocks do not prove physical locked stores or signed upgrades. |
| Requests | Final response, auth/protocol error, timeout/cancel, stale completion and responsive Save | Fake-server failures routinely; bounded synthetic Studio configuration live. |
| Prompts/context | Exact payload, edit/reset/undo/reopen/update, selected approved revisions, exclusions and budget refusal | Controller/dispatch integration and milestone native send review; no exhaustive models/providers. |
| References | Manual/generated review, rejected replacement retains approved text, stale/missing links, malformed/newer schema refusal and migration | Shared deterministic fixtures and representative native forms. |
| Proposals | Literal text/protected-token emission, rewrite/same-file batch, valid subset, invalid/stale output writes nothing, external conflict, one undo and ordinary interrupted acceptance | First complete user action early, including harmless pinned-SDK literal-display proof, then integrated milestone. |
| 3A Story | Conditional routes, all-false continuation, call/return, nested edits and source preservation | Targeted pinned-SDK normal-play assertions on affected supported hosts. |
| 3B Screens | Nested round trip, opaque neighbor, representative dialogue/choice/menu behavior and cancel/undo | Early Ren'Py layout/interaction comparison. |
| 3C Timeline/media | Placement, idle continuity, qualified profile/mask/end state, transform/audio order and save/load/rollback | Early actual media/runtime risk proof; combined final 3C checks, not a full matrix per increment. |
| 3D State/launch | Normal-play equivalence, unresolved screen-effect refusal, passive/conventional-screen eligibility, screen-revision invalidation, save isolation and scratch cleanup | Qualified normal versus reconstructed launch at supported boundaries; no interaction recorder required. |
| Milestones | Representative game, close/reopen, metadata-free play and package privacy | Coherent-candidate affected-platform qualification; both targets at 3F. |

Keep rejecting assertions and ordinary external-edit/data-loss coverage. Use controlled
fault/state fixtures; no renewed hostile/crash, enterprise-policy or exhaustive-model
programme. Repeat native/live checks for relevant changed inputs, not documentation.
Missing access stays missing evidence. Explicit connection/capability checks disclose
potential provider billing; this plan grants no paid calls, installation or downloads.
Non-streaming is the first workflow; SSE remains separately qualified. Exclude keys,
raw replies, prompts and reference prose from routine diagnostics; future explicit
support exports preview/redact their contents. Do not transfer routine checks to users.

## 12. Entry risks and decisions

| Issue | Disposition |
| --- | --- |
| Phase 1 prerequisite | Accepted/integrated/closed on 2026-10-07. Inspect live state and preserve other work; no implementation selected by this update. |
| Actual installed Studio compatibility | 2A.0 must qualify the configured version/model. Documentation alone is insufficient. |
| Tools disabled and inference locality | Mandatory Studio qualification and disclosure; no silent fallback if unsupported. |
| Managed load/unload | Public stable interface not established in reviewed docs; explicit follow-on investigation, no guessed private APIs. |
| Context/token introspection | Use explicit configured capacity and labelled estimation when unavailable; never claim exactness. |
| Multi-operation preparation | Extend existing safe primitives; ADR/test the preparation boundary before acceptance UI. |
| Non-loopback plaintext connections | Explicit opt-in proposal requiring an ADR; do not weaken the existing TLS baseline implicitly. |
| Provider/model creative quality | Measure separately from protocol correctness using synthetic rewrite/continuation/character/lore examples. No guarantee for arbitrary model names. |

Confidence is high in the bounded architecture. Live Studio capability qualification and safe multi-operation planning remain measured gates, not assumed passes.

## 13. Planning checkpoint and continuation

The initial planning checkpoint is [historical evidence](../archive/2026-10-09-phase-2-execution-history.md#13-planning-checkpoint-and-continuation).
Use the current contract above and HANDOVER for execution scope. The sections below
retain product requirements and future delivery choices, not independent grants of
execution authority. Keep new results compact and link detailed past attempts.

## 14. October milestone sequencing

Section 19 owns the single live scheduling/ownership map; section 20 maps bounded
results to existing requirement gates. This anchor preserves links. The duplicate
October delivery table was consolidated on 2026-10-07; Git history retains it. The
first useful rewrite still includes manual references, prompt/reset and size controls,
native credentials, exact reviewed send, strict review, one transaction and undo.
It does not replace five-action/two-provider acceptance. The [bounded source assignment](../archive/2026-10-09-phase-2-execution-history.md#21-first-bounded-source-foundation-assignment)
is accepted; provider qualification is the current selected slice.

## 15. Provider expansion recommendation — 2026-10-02

The user asked about more providers and scaffolding without live testing. Recommendation,
not approval of additional first-class providers: keep required Studio and one
representative OpenAI-compatible endpoint; implement a small shared provider contract
and deterministic fixture tests. Additional compatible endpoints may be user-configured
and labelled unverified until explicit synthetic configuration checks pass. Passing
one probe is configuration evidence, not full release qualification of that provider.

| Option | Relative incremental work after the baseline | Proposed treatment |
| --- | --- | --- |
| Compatible endpoint using existing request/response behavior | Small: configuration/help and capability fixture coverage; little or no transport code. | Use the generic profile, not a separate provider implementation. |
| Branded preset with parameter/routing differences | Small to medium: explicit field mapping, errors and unsupported-capability handling. | Optional later preset; live support remains unverified until checked. |
| Native API with a different protocol | Medium to large: authentication, message/schema mapping, streaming, errors, usage/cancellation and live acceptance. | Keep an extension seam; defer the concrete adapter until selected. |

These are engineering estimates, not measured effort or calendar promises. No production
LLM subsystem exists yet, so implementation effort depends on the 2A.0 result. Do not
generate placeholder production adapters or provider buttons with no tested behavior.
Scaffolding means a tested interface, capability model and fake-server contract fixtures;
it does not mean claiming a wholly untested provider is supported. Extra providers are
not new Phase 2 exit gates. The required baseline still needs its existing live evidence.

Official documentation inspected 2026-10-02; no inference request or account connection:

- [LM Studio](https://lmstudio.ai/docs/developer/openai-compat/structured-output)
  documents schema output through Chat Completions, with model capability limits.
- [OpenRouter](https://openrouter.ai/docs/guides/features/structured-outputs)
  documents schema-capable models and requiring supported parameters in routing.
  Any future preset must disclose intermediary/inference locality and routing/fallback
  behavior; it cannot silently change the approved destination or response contract.
- [Gemini compatibility](https://ai.google.dev/gemini-api/docs/openai) remains described
  as beta. Treat compatibility as something to qualify, not universal field support.
- [Claude compatibility](https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk)
  explicitly ignores response_format and points to its native API for structured output.
  Do not label it schema-qualified through the generic adapter without actual evidence.
- [OpenAI API guidance](https://developers.openai.com/api/docs/guides/migrate-to-responses)
  keeps Chat Completions supported and recommends Responses for new OpenAI integrations;
  Responses uses a different result/schema shape. A dedicated Responses adapter is
  separate scope, not a base-URL preset or an automatic migration of all local providers.

## 16. Reference-and-control refinement record — 2026-10-02

User-selected requirements: persistent manual/LLM-generated Character cards and lorebook
for generation context; visible editable system prompts and baseline reset; explicit
context and response size controls; simple phase outcomes. These are now part of the
Phase 2 scope and gates. Provider expansion remains a documented recommendation.

Planning remains on `codex/phase-2-3-planning`; Phase 1 files/acceptance and implementation
remain untouched. Updated canonical PRODUCT, DATA_MODEL, UI and ROADMAP describe planned
behavior, not shipped support. Documentation-only validation and publication apply;
no provider test, application build, native launch or production dispatch is selected.

Refinement validation: repository structure/text/privacy/link checks passed across
315 files; whitespace and eight-document scope review passed. No application files
changed and no live inference or native gate was run.

## 17. Provider scope correction — 2026-10-02

User direction removes Ollama support. Required configuration and live acceptance
now cover Unsloth Studio and one representative generic-compatible endpoint. The
generic endpoint field does not imply tested or named Ollama support. No implementation
exists to remove. Phase 3 scope remains under discussion following the user's request
for a simpler explanation; its proposed capability list is not accepted scope.

## 18. Proposed LLM screen and interaction design

**2026-10-02 design proposal; not accepted or implemented.** The user requested the
same detailed UX planning and generated-screen treatment as the Phase 3 Story concept.
The [four screen concepts](../../design/phase-2-llm/README.md) extend the saved actual
synthetic-fixture Story UI. The host was locked, so no live capture or acceptance of
current Phase 1 changes is claimed. Written contracts in sections 5–9 take precedence
over generated details. Reuse the accepted paper/teal and charcoal/copper tokens,
shared buttons, inputs, spacing and shell; generation does not select a new theme.

### Surface map

| Surface | Purpose and entry | Main completion action |
| --- | --- | --- |
| Story → Assist | Select supported dialogue, a continuation anchor, or a Chapter for a new Scene; prepare a bounded request beside the selection. | Generate proposal after inspecting the send. |
| Proposal review | Compare semantic operations and exact Source/metadata changes against the captured saved revision. | Accept a dependency-valid selection once, then return to authoring. |
| Characters → Character card | Write reference text beside the existing Game character tab, or request a reviewed draft/update. | Save as proposed, or explicitly save and approve reviewed text. |
| Lorebook | Search/filter entries, inspect scope/citations and edit or request drafts/updates. | Save, separately approve/reconfirm, then choose inclusion in Assist. |
| Settings → AI | Machine-local provider profiles and project-local per-action prompt templates with labelled scope. | Save profile or Save prompt; each invalidates affected send preparation. |

Assistance is a contextual action surface, with Prepare and Review changes steps rather
than a permanent chat workspace. Keep the selected Scene/Beat visible on wide windows;
opening Assist, Settings, a reference or a proposal never sends content. A single primary
action completes the current step. Support the five section 1 actions as they become
implemented; unavailable actions explain their incomplete checkpoint instead of opening
a nonfunctional composer. Screens, Calls, conditions and other Phase 3 constructs remain
outside the Phase 2 proposal schema.

### First useful journey: prepare a rewrite

1. Select one or several supported Dialogue/narration Beats and choose Assist → Rewrite
   dialogue. Show Scene, selection and intended replacement; preserve speaker/order/staging
   by default. If the target has unsubmitted Scene or Source input, offer Return to editor,
   use its explicit existing commit/save flow, or Cancel. Do not implicitly submit input
   or run against a hidden older target. Disclose excluded unrelated drafts.
2. Enter the task in a labelled multiline field. Retain it during navigation within this
   project session, provider errors and cancellation. The task is separate from reusable
   system prompts; a word/Beat target is an instruction, not a promised output count.
3. Show suggested approved/current linked cards and explicitly chosen approved/current
   lore entries with checkboxes, type, revision and scope. Suggested card inclusion is
   visible and removable. Matching lore tags suggest selection but never auto-inject.
   Proposed, rejected, superseded and stale references cannot quietly become ordinary
   context; offer View reference / Review or reconfirm / Exclude as applicable.
4. Show provider, endpoint class, exact model ID, connection location and inference
   locality separately. Unknown inference locality stays Unknown, even on loopback.
   Provide Change profile and View/edit system prompt without discarding the task.
5. Show Context budget and Maximum response together, profile default versus request
   override, and known server capacity or explicitly configured unverified capacity.
   The breakdown includes instructions/schema, selected story, cards/lore, other
   required references, reserved output and estimation margin. Context budget is the
   **total** allowance. The illustrative image's 3,036 total is arithmetic, not a
   measured tokenizer result. Over-budget refusal names the excess and offers explicit
   removal/adjustment; never silently shorten text, drop dependencies or clamp limits.
6. View complete send exposes effective instructions, immutable ordered context,
   revisions, allowed mutation scope, destination, exclusions and estimated total.
   Inspect exact custom text only when explicitly included. Core-owned schema/security
   constraints are visible but cannot be weakened by editing author prompt text.
   Generate proposal dispatches that reviewed snapshot once. Changes to targets,
   relevant references, prompt, profile, credential, model or limits invalidate it
   and require renewed preview; do not silently refresh and send another payload.

Continue Scene uses an explicit insertion anchor and shows the existing terminal Beat.
Draft Scene names its Chapter and proposed title; an incoming connection is a separate
visible operation. Card/lore drafting selects the destination and supporting material;
Update shows the current revision. Scope controls remain action-specific, avoiding a
large generic prompt form whose defaults imply unrelated write authority.

### Receiving and proposal review

During sending/receiving/validation, keep task and context visible with a stable Cancel
request action and plain phase label. Non-streaming has no invented token progress.
Qualified streaming may show bounded inert progress; partial JSON never becomes an
applicable edit. Save and unrelated editing stay responsive. One active generation
per project means a second Generate visibly asks the author to finish/cancel the first.
Cancellation stops the client request; provider computation may continue. A late result
from cancellation, a replaced project session or an expired request cannot reopen review.

A valid result opens Review changes; no source or metadata changed merely by generation.
The [proposal concept](../../design/phase-2-llm/review-rewrite-light-v1.png) shows one
whole dialogue replacement. For larger proposals, the operation list includes target,
type, affected files/entities, dependency and uncertainty. Selection units are semantic
operations or inseparable groups; no arbitrary line checkboxes. A dependent operation
offers its visible required group or explicit remapping, never hidden auto-selection.
Changing selection rebuilds the dependency closure and shows a new exact preview.

Story view explains before/proposed content; Source view shows exact patches, including
multi-file changes and metadata. Show generated Character-card text separately from a
runnable Character definition and existing Appearance-reference operation. Lore/card
field groups follow the same review flow. Provider reasoning remains separate from final
proposal content and is never an applicable operation. All returned text renders inertly.

Accept N changes rechecks the complete captured read/write set and draft generation,
then commits one semantic transaction and one undo entry. Disable duplicate acceptance
while in flight. A changed target, reference, prompt or relevant metadata shows
“Project or context changed; prepare again” with review retained for comparison; no
automatic rebase. Failed validation writes nothing. Ambiguous persistence/recovery
uses the established project recovery state and cannot claim success or invite a blind
retry. On success, identify accepted operations and return to the affected authoring
surface, retaining focus/selection where valid. Undo uses normal history. The concept footer refers to undoing this new acceptance;
existing project history is not disabled while reviewing a proposal.

Partial acceptance consumes the original proposal. Remaining suggestions can remain
visible as a reference, labelled not applied; accepting more needs new preparation.
Discard proposal clears only the transient suggestion. Project close/switch warns
before discarding pending task/proposal work; restart does not archive raw requests or
resume generation. Explicitly saved proposed card/lore records are durable without
becoming approved. This distinction must remain visible at close/reopen.

### Character cards and Lorebook

The selected manual-library UI now follows ordinary direct editing and Save/Discard,
with no Edit unlock or manual Approve/Reject/Supersede toolbar, under the
[2026-10-09 correction](#manual-reference-library-selection--2026-10-09). The original
generated review behavior below remains a later, separately selected outcome.

Characters retains runnable Game character controls and adds the Character card tab.
Cards may be unlinked; linking does not create a runnable Character. The editor groups
description/appearance prose, personality/motivation/background, relationships, speaking
style/examples, explicit applicability and knowledge notes. Link shared facts to lore
IDs rather than duplicate canonical text. Card prose does not generate/import images.

Lorebook entry: choose Lorebook in navigation, search/filter and select an entry, then
Edit to change its labelled title/text/category/tags, scope, links and citations. New
lore entry opens that same form with empty fields; Save as proposed persists it, explicit
Approve makes its current revision eligible, and choosing it in Assist controls the
next send. Cancel retains the accepted record and discards only the author-confirmed
form change through the existing draft guard. A selected Character-card tab filters
cards; Lorebook filters lore, despite the concept's illustrative mixed list.

Lorebook uses the same reference editor controls with searchable title/category/tags,
text, linked entities, explicit Scene/route scope, knowledge annotations and citations.
Show approved/proposed/rejected/superseded status, current versus stale supporting
revisions, authored versus inferred provenance and unresolved links with text labels.
A missing entity retains the record/citation rather than deleting or broadening it.

An idle record is read-only until Edit; no pending edits disables both Save actions.
Pending edits are visibly separate from the prior approved revision and use explicit
Save/Cancel. View revisions is bounded saved reference revision/provenance inspection,
not a persistent archive of raw model requests or replies.

Keep three concepts separate: editor input, approval of a saved revision, and inclusion
in a particular request. Save as proposed persists an unapproved revision. Manual
authors may explicitly Save and approve. Generated content remains a proposal until
reviewed by the author; an explicit Save and approve action may combine persistence
and approval of the reviewed revision. Save as proposed remains available separately. Save after editing
approved text requires a newly approved revision before use. Approve/reconfirm displays
the exact revision and supporting citations; generated updates never approve themselves.
Reject and Supersede preserve the established undoable lifecycle rather than destroy
evidence. Approval changes no runnable game variables or definitions.

Draft with AI / Update with AI opens the same Prepare step with destination visible.
Generation remains transient until explicit semantic acceptance/Save as proposed;
the image's saved-as-Proposed helper describes that save, not generation alone.
After Save as proposed the editor displays Proposed and generation provenance,
then offers explicit review/approval. An explicitly approved acceptance displays
Approved for that exact reviewed revision; generation alone never approves it. No background updates, contradiction detection,
automatic keyword injection or whole-book sends. Assist's selection records included
revision IDs; a reference editor's scope is guidance, not a runtime knowledge claim.

### Settings, prompts and baseline restore

Provider profiles offer only Unsloth Studio in Phase2. Generic setup and session-only
credentials are user-excluded. Show endpoint input
and normalized destination, saved credential reused across sessions,
status, native Manage credential entry, exact loaded model discovery/manual ID, transport and qualified
settings. No renderer API-key text field or provider buttons implying extra verified
support. Distinguish Refresh models, synthetic connection/capability tests and a project
generation; tests do not send project content. Changed configurations are Untested until
their actual probes pass. Model loading stays an explicit action in Studio.

Use two real tabs, Provider profile and System prompts, with only the selected editor
shown; the generated simultaneous panes are an overview of both, not the tab behavior.
Keep machine-local profile defaults distinct from project-local prompt templates.
Per-action system-prompt editing shows effective scope, saved/installed baseline versions and customized
status; task instructions and project style notes have their own labels. Save prompt
is explicit. Restore baseline previews the installed app's bundled replacement against current text,
then applies only that prompt after confirmation. Cancel preserves custom text; applying
is undoable, with the previous text retained, and saving/reopening preserves the restored
revision. Restore does not reset references, credentials, other prompts or size limits.
It invalidates any send using the prior prompt. The image shows the editor before the
restore preview; the written interaction is authoritative.

### Failure, draft and compact-window behavior

| State | Visible recovery without losing author input |
| --- | --- |
| No configured profile/model; required key or selected OS store unavailable | Explain the specific missing item and open its settings/native action; no silent model substitution or plaintext fallback. |
| Provider unavailable/busy, timeout or interrupted response | Retain task/selected references and show actual known cause; Retry means a new explicit reviewed send, never an automatic request. |
| Malformed/truncated/unsupported/tool response | No applicable proposal; show bounded inert diagnostics and return to preparation. Do not auto-repair or downgrade modes. |
| Over budget or stale reference | Name the failing total/revision; explicit correction rebuilds preview and requires review. |
| Competing target draft, external edit or recovery blocking | Retain proposal/task, explain affected target, return to editor/recovery; safe unrelated editing remains available. |
| Empty references or new project | Manual New card/New lore entry and useful empty-state guidance; generation requires configured readiness. |

At insufficient width, collapse project/tree rails and use the central workspace for
Assist or review with Back to Story and the captured target always labelled. Replace
parallel before/after columns with stacked labelled panels; retain the same operation
selection, exact Source view and primary action. Reference and settings secondary
panels become ordered sections. No fixed multi-column min-width or horizontal scrolling
for form actions; Source diff scrolling remains explicit and localized. At short height,
scroll content while keeping the primary action and request status accessible without
covering the focused field. Never hide required context totals or approvals behind hover.

Provide logical keyboard traversal, labelled checkboxes/selectors, visible focus, a
keyboard operation-selection alternative, multiline text behavior consistent with
Source/Scene, and focus restoration on Back/error/Cancel. Announce request phases,
budget refusal and acceptance once; do not announce every streamed token. Color is
paired with labels; test both themes, text scaling and narrow windows. Generated
screens establish hierarchy, not exact contrast, geometry, font size or physical-input proof.

### Implementation proof and planning record

Before the UI completion gate, exercise the real boundaries: manually author card/lore,
explicitly approve and choose revisions, edit/restore/undo/reopen a prompt, inspect the
exact dispatched payload, refuse an excessive total, cancel and reject late callbacks,
review whole operation groups, reject stale acceptance, accept a valid subset once,
undo/redo, and close/reopen with saved references and discarded transient proposals.
Add narrow/keyboard/error checks to the existing section 11 matrix. Browser evidence
supports packaged target evidence; mockups do not satisfy these assertions.

Original concept-generation and review receipts are in the
[historical planning record](../archive/2026-10-09-phase-2-execution-history.md#ui-concept-planning-record).
The design index retains assets and visual limitations; current execution follows
the selected outcome above.

## 19. Selected shared foundations and two-lane delivery

The user selected this delivery approach after reviewing the rework risks: bring a
bounded part of 3A's source foundations forward, prove one complete Phase 2 rewrite,
then overlap Phase 2 completion with 3A. After Story logic, develop Screens and Timeline
in two lanes. Phase 1 acceptance through 1H remains the entry prerequisite. This is
the selected sequence, not blanket execution authority. Source foundation is accepted;
select each remaining outcome against the actual baseline and live continuation.

This section owns the cross-phase delivery sequence and team allocation. Section 10
keeps Phase 2 requirement/gate IDs; the [Phase 3 brief](phase-3-initial-wysiwyg-release.md)
keeps 3A–3D/3F requirements. The phases retain separate completion gates. Delivery
stages below neither add product scope nor count as accepted implementation outcomes.

### Build shared capabilities once, when first needed

The inspected application has flat Scene Beats, blanket terminal Choice handling and
a scene-local TypeScript preview reducer. Building an expanding AI planner around
those assumptions would create avoidable restructuring in 3A. Reduce that risk with
small proven capabilities, not a framework implementing every future syntax up front.

| Shared capability | First implementation boundary | Later consumers |
| --- | --- | --- |
| Source structure and stable locations | Bring forward the minimum 3A.1/3A.2 support needed for parent/block ownership, stable Beat/source locations, revisions and explicit insertion anchors. Prove one nested child edit and lossless reopen before expanding AI mutation families. | AI targets/context, nested Story editing, and typed screen/transform source locations. Screen/ATL grammar adapters arrive with those features, not in this first slice. |
| Semantic edit preparation | 2C.1 prepares supported typed operations into exact candidate patches; review and acceptance reuse the existing Phase 1 transaction/history/recovery path. Manual visual controls reuse the relevant preparation primitives. | Dialogue/Scene AI edits, nested Story controls, Screens and Timeline. Each domain retains its own validation. |
| Reference records | 2B.1 establishes shared IDs, revision/status/provenance and inclusion contracts for cards/lorebook, then their distinct manual forms. 2C.3 adds generated operations on those same records. | Both reference editors, selected context, proposal review and stale detection. No duplicated card-versus-lore lifecycle/storage system. |
| Core story semantics | 3A owns the supported condition/call/continuation interpretation and known/unknown results. Agree its contract early; implement it with actual 3A behavior. | Story/Branches, source-derived context facts and later 3D trace/state inspection. Do not implement separate evaluators in the AI panel and preview. Full route reconstruction stays in 3D. |
| Explicit scratch runtime job | Introduce the shared snapshot/preparation/process/cleanup service at the first 3B/3C runtime-preview consumer; extend its typed purpose and inputs for 3D. | Screen preview, Timeline comparison and Run From Here. Static AI proposal review remains non-executing and does not wait for this service. |

`.rpy` remains authoritative. Extend the existing source/metadata services and preserve
their migration/no-op guarantees; do not create a second saved document or replace
the transaction system. Integrate shared schema changes through one migration path
and preserve existing IDs/unknown fields. Do not preallocate speculative screen/ATL
schemas merely to force every feature into one version bump.

AI operations address stable authoring targets and semantic intent, not model-chosen
byte ranges, paths or executable patches. A compatible parent/block-aware model does
not authorize AI generation of conditions, calls, screens or ATL. The first rewrite
can target ordinary Phase 1 dialogue using the new location contract. Nested targets
or later constructs need explicit action-scope qualification; otherwise refuse or
mark them excluded. Preserve the existing Phase 2 proposal allowlist. Cards/lorebook
are author references and never become runtime state implicitly.

### Staged lane assignments and integration points

| Delivery stage | Implementation lane 1 | Implementation lane 2 | Dependency/proof before expansion |
| --- | --- | --- | --- |
| 1 — Foundation and Studio feasibility | Minimum source structure/locations from 3A.1/3A.2; introduce only the relevant reusable edit-preparation seams. | 2A.0 Studio qualification, followed by approved 2A.1/2A.2 credentials/request work. | One nested child edit through dispatch, undo and reopen preserves source/IDs; qualified Studio yields a valid bounded synthetic response. 2A.0's review boundary remains before provider production integration. |
| 2 — First useful AI workflow | Deterministic context and strict proposal planning/acceptance using stage 1 locations/preparation (necessary 2B/2C parts). | Shared manual card/lore records/forms, prompt/limit settings and Assist preparation/review UI against agreed interfaces. | One complete rewrite with selected manual references: exact reviewed send, valid proposal, acceptance, undo and reopen. No hidden draft acceptance or shortened context. Native credentials and affected target checks remain required. |
| 3 — Overlap milestone completion | Complete 3A conditions/calls, flow/history and Story/Branches controls against the shared model. | Residual Studio verification and 2C.4 integrated/final acceptance. | Reconcile every shared-model change with context/proposal targeting. Existing Phase 2 operations remain correct or visibly refuse unsupported boundaries; complete each milestone's own gates. 3A may be selected after the first safe rewrite without waiting for all 2C.4 work. |
| 4 — Visual authoring | 3B Screen source adapters, canvas/hierarchy/properties and runtime comparison. | 3C static staging → PNG/ATL idles → native video → supplied transparency → play-once controls, then remaining Timeline/audio inventory. Reuse shared assets/appearances and runtime comparison. | Accepted 3A and Phase 2; stable source/asset/history contracts. Integrate one shared runtime job before independent preview expansion. Each lane proves one real round trip before broadening its inventory. |
| 5 — State and integrated release | 3D trace/state inspection and isolated launch, using accepted 3A semantics and qualified 3C effects. | Remaining cross-workspace/UI and affected-target release qualification; fix bounded integrated findings. | Normal-run comparison for supported entry points, then 3F's integrated release gate. Unknown state/timing still refuses unsupported launch; release acceptance follows all required capabilities. |

Stage 1 brings forward source foundations only, not the full 3A UI or state engine.
Minimum block support must not delay the first rewrite until Screens/Timeline exist.
Stage 2 is one integrated authoring outcome across both lanes, not separate backend
and frontend completion claims. Stage 3 overlap is intentional; 2C.4 remains required
for declaring Phase 2 complete and for stage 4 entry. Story logic precedes Screens;
3B/3C can then overlap. Portions of 3D state inspection may be scoped earlier once
3A is accepted, but final launch qualification needs the supported 3C effects.

The assignments are defaults for bounded tasks, not fixed ownership of an entire
phase. Stage 2's record service and renderer work are sequenced inside lane 2; lane 1
consumes the agreed records contract. The owner may rebalance independent pieces
while preserving explicit ownership of shared files and the completion points above.

### Team operation

The owner coordinates shared UI controls and field-validation contracts using the
[accepted UI/UX guidelines](../../UI.md#accepted-uiux-guidelines-for-implementation-agents);
both lanes reuse the same patterns.

Use **one GPT-6.1 Sol owner at high reasoning effort and zero, one or two GPT-6.1 Sol
implementation agents at high reasoning effort** for useful independent assignments.
Two lanes are a maximum, not an occupancy target. Short fixes and shared contract/
migration work remain serial; the owner can implement them directly.

- The owner defines contracts and task/file boundaries, resolves shared-model decisions,
  reviews both lanes, integrates coherent changes and verifies the combined outcome.
  The owner coordinates shared-core ownership instead of becoming an unplanned third
  independent feature lane. Implementation agents build the assigned foundations too.
- Each implementation lane uses an isolated worktree with a bounded assignment and
  declared source files/interfaces. Assign one writer for each shared model, migration,
  dispatch/transaction seam and fixture; dependent lanes consume its reviewed checkpoint.
  Keep UI fixtures/types synchronized with actual core contracts.
- Integrate at each real operation/completion point above rather than accumulating
  two phase-sized branches. Review actual dispatch/source/persistence behavior early;
  rendered controls or mocked APIs alone cannot establish the combined outcome.
- The owner selects combined changed-scope checks and records evidence against the
  integrated candidate. Lanes run focused checks for their work; use shared fixtures
  without duplicating expensive native/package matrices for unchanged inputs.
  WORKFLOW/TESTING allowances, target requirements and manual waiting still apply.
- Owner review covers integration. Any independently required checkpoint review remains
  a separate pass. This team plan creates no new reviewer mandate or CI allowance and
  does not authorize merges, service installation, spending or provider requests.

Record the first paired assignment's useful output, waiting, integration rework and
duplicate checks in the existing ledger. Report timing/usage only when available;
never invent speedup/cost savings. Continue parallelism where output outweighs overhead.
Source versus Studio feasibility and Screens versus Timeline are suitable candidates;
shared schema/transaction/runtime changes need a single writer. No recursive agent tree.

Technical prerequisites differ from scheduling defaults. Missing provider access need
not stop independent authorised portable work. Stage 4 defaults to accepted Phase 2/3A;
a narrower earlier 3B/3C slice requires explicit selection and accepted source/asset/
history/runtime prerequisites, not an automatic phase waiver. Final gates are unchanged.

Reconcile actual accepted interfaces and ownership when selecting each remaining
outcome. Earlier planning-only checks and publication instructions are retained in
the [historical delivery record](../archive/2026-10-09-phase-2-execution-history.md#delivery-planning-record);
CURRENT/HANDOVER own execution state.

## 20. Bounded deliverables and next-outcome prompts

The user selected deliverable-sized execution on 2026-10-03: an owner with bounded
subagent assignments completes one target, checks the actual result, fixes in-scope
findings, updates canonical docs/the task ledger/HANDOVER, and returns a prompt for
the next outcome. Do not one-shot Phase 2, Phase 3 or an entire lane. Section 19's
five stages are a scheduling/dependency map, not five phase-sized agent goals.

The targets below are planning selections for future briefs, not extra requirement
IDs or execution approval. Existing 2A–2C and 3A–3D/3F gates retain authority. Before
starting each target, fix its concrete allowed operations, affected test hosts,
finite expensive-run allowance and dependencies against the then-current baseline.
Split a target further when it cannot be proved as one coherent bounded result;
do not silently turn it into delivery of the remaining phase.

### Deliverable queue

| Target | Finished result and decisive proof | Requirement/dependency |
| --- | --- | --- |
| Shared source foundation | One nested child edit preserves surrounding source and stable locations through undo/reopen. Introduce minimum structure/preparation only. | Bounded 3A.1/3A.2; Phase 1/1H entry. Can overlap provider qualification. |
| Studio-only Phase 2 closeout | Reconcile the applicable 2A–2C/Section 11 gaps, then run all five actions and selectable proposal editing in one coherent candidate; prove review, valid acceptance, Undo/Redo, reopen and metadata-free SDK behavior on both targets. | Reuse exact unchanged evidence; complete independent review and final human acceptance. Generic provider work is outside Phase 2. |
| Request lifecycle | Complete/cancel a bounded synthetic request; failures, limits and late replies preserve responsiveness. | 2A.2 using accepted settings/credentials. Scope streaming to qualified behavior. |
| Manual reference library | Create/edit/approve manual cards and lore on shared records/forms, undo and reopen with exact statuses/revisions. | Necessary 2B.1. Can overlap provider settings work after contracts agree. |
| Prompts and context preparation | Edit/restore a prompt and save/reopen; select exact reference revisions and inspect a bounded payload without silent truncation. | Remaining necessary 2B.1 on the manual library; shared prompt/limit settings. |
| First safe dialogue rewrite | Prepare and inspect one exact send with selected references, review one response, apply once, undo and reopen; invalid/stale output changes nothing. | Bounded 2B.2/2C.1/2C.2 using the prior foundations. One integrated owner outcome across both lanes. |
| Continue Scene | Generate supported Beats at an explicit insertion anchor, review the group, apply/undo and retain terminal/custom boundaries. | Bounded remaining 2B.2/2C.1/2C.2 after first rewrite. |
| Draft Scene | Review/create one new Scene with core IDs and explicit terminal state; any incoming connection stays a separate visible operation. | Next bounded 2B.2/2C.1/2C.2 increment on the same proposal path. |
| Generated Character cards | Draft/update a card with explicit acceptance/approval, provenance and undo/reopen; any selected runnable definition/Appearance operation is separate and reviewed. | Character portion of 2C.3 on manual records/proposal infrastructure. |
| Generated lorebook entries | Draft/update reviewable entries with applicability, citations, approval/staleness and undo/reopen. | Lore portion of 2C.3; reuse the same reference lifecycle. |
| Conditional Story logic | Author supported nested conditions/choice guards; Story, Source and Branches agree; native routes match the declared variables. | Necessary 3A.1–3A.4 after shared foundation/first rewrite. Can overlap remaining Phase 2. |
| Scene calls and Story completion | Call a Scene, return to the following Beat and preserve guarded continuation/return labels through edits and persistence; qualify 3A's combined behavior. | Remaining 3A.1–3A.4; build on conditional source/flow. |
| Screen round trip | One supported custom screen can be edited via synchronized canvas/tree/properties, undone and reopened; unsupported neighbors survive and native layout agrees. | Bounded 3B.1/3B.2/3B.4; accepted Phase 2 and 3A. Introduce shared scratch runtime job once. |
| Custom screen Story connection | Visually Show/Hide an owned panel or Call an owned screen and finish its interaction before returning to the following Beat; normal play, source, undo and reopen agree. | 3B.2a after Screen round trip, before Screen completion; typed parameterless subset and 3D effect summaries. |
| Dialogue and choice screens | Edit declared dialogue/choice layout/style slots without breaking speaking, choices or required bindings in the actual game. | Bounded 3B.3 on the proven screen services. |
| Menu screens and Screen completion | Complete the declared menu/preferences/save/load adapters and remaining supported inventory; qualify native interactions, Source reconciliation and persistence. | Remaining 3B.1–3B.4; split adapters further in the brief if required. |
| Static character staging | Drag/resize and numeric/keyboard edits give accurate native placement at game resolution/window sizes; one gesture is one undo and Escape writes nothing. | Bounded 3C.1/3C.2; independent of full Timeline UI. Can overlap Screen round trip after shared runtime/asset contracts agree. |
| PNG/ATL idles | Frame sequences and the supported transform idle continue through dialogue, change/stop correctly and survive undo/reopen. | First bounded 3C.1a/3C.3 media increment on shared placement. |
| Native looping video | One qualified opaque/silent clip starts on Show and stops on Hide using shared placement; then qualify the declared embedded-audio/mixer behavior. | Next 3C.1a/3C.3 increment; bounded media delivery and native profile proof. |
| Prepared transparent video | Supplied side-mask playback has correct transparency and logical geometry; qualify any selected separate-mask route before exposing it. | Next 3C.1a; no mask generation/conversion. |
| Play-once video | Declared disappear/hold-last/supplied-still end states and replacement/restore behavior work in native playback. | Next 3C.1a/3C.3; no frame-exact resume promise. |
| Transform Timeline | Add/move/edit supported keyframes and interpolation on the same source/placement/history model; native state/timing agrees. | Remaining transform parts of 3C.1/3C.2/3C.4. |
| Audio Timeline and 3C completion | Place declared music/SFX cues, waits/fades/queues and interaction boundaries; qualify combined staging/idles/video/transforms/audio. | Remaining 3C.3/3C.4. Full selected inventory still required. |
| State inspection | A chosen finite route shows known values, provenance and explicit unknowns, including unresolved screen interactions, without executing project code. | 3D.1/3D.2 after accepted 3A; accepted 3B screen-effect summaries for screen-dependent state and 3C descriptors for supported effects. |
| Run from Scene entry | An isolated scratch launch matches normal play at a supported Scene entry and preserves real project/saves; refuse unknown or stale state. | 3D.3 with qualified 3A/3C semantics, relevant 3B effect summaries and shared runtime service. |
| Run from supported Beat boundaries | Extend only to proven stable statement boundaries; qualifying normal/reconstructed runs agree and unsupported starts refuse. | 3D.4 after Scene-entry proof; active call-stack reconstruction remains excluded. |
| Integrated initial release | Complete one real authoring workflow across writing, Assist, Screens, Timeline and State; close the required combined acceptance evidence. | 3F after all required capabilities, not a new feature sweep. Git remains deferred. |

Within the two parallel lanes, choose only currently independent targets from this
queue. The owner can have a paired outcome where both lanes jointly deliver one user
action (especially the first rewrite); do not launch unrelated phase-sized assignments.
When one lane completes a target, integrate its proof and prepare its next prompt;
do not automatically broaden the other lane or repeat unchanged expensive checks.
Story logic precedes Screens. Screens and animation targets then overlap; State and
release consume their accepted semantics. The exact sequence follows dependencies,
not a requirement to serialize every row of this table.

### Completion loop and stop boundary

Complete implementation, review and required automated platform qualification from
the current development session, using [CI-first routing](../../WORKFLOW.md#test-host-routing-and-ownership)
where suitable. Transfer to another local platform only for an identified remaining
native capability, carrying completed evidence and the unchanged outcome/budget.
Keep one active writer and all selected both-target acceptance gates.

Related deliverables may be selected together with one cumulative allowance and a
shared qualification point. Internal checkpoints do not automatically require a
machine switch. Record each deliverable's evidence separately; incomplete platform
qualification remains pending and is not reported as accepted. This scheduling option
does not select another feature or waive a dependency's required acceptance.

1. **Select one result.** Record the target, user-visible outcome, exclusions, branch/
   baseline, required dependencies, affected test hosts and finite execution allowance.
2. **Assign bounded work.** Use the selected GPT-6.1 Sol High owner and zero to two
   GPT-6.1 Sol High implementation agents on independent declared files/contracts.
   Use one writer for shared mutable code; sequence dependent work. A short serial
   target need not occupy both implementation agents. No recursive agent tree.
3. **Build the complete target.** Integrate at real operation boundaries. Continue
   through required source/dispatch/persistence/UI work within the selected result.
4. **Check and fix.** Run relevant cheap checks and required actual-path/native proof;
   self-review the integrated diff and real UI where changed. Correct in-scope findings
   and rerun affected checks. Preserve independent review where already required.
   Existing cumulative budgets and two-correction reassessment rules remain.
5. **Close the record.** Update canonical behavioral docs/ADRs as needed, the existing
   task ledger and live HANDOVER/CURRENT with exact refs, evidence, failures/skips,
   remaining limitations and any pending operation. Commit and publish only within
   actual authorization; disclose local-only/unpublished work.
6. **Return the result and next prompt.** Report what now works, compact check results,
   known limitations, review status and the next dependency-ready target. Supply a
   paste-ready prompt with its fresh continuation refs. Stop before that distinct
   outcome; the user selects it. A returned prompt is not permission to execute it.

Internal commits/checks/fixes do not force a new chat or approval request. Resume the
same target in the same chat after waits using the repository's existing workflow.
If the target is genuinely blocked or awaiting acceptance, provide a continuation/
review prompt for that target and retain its unresolved state; do not present a blocked
deliverable as complete or advance to dependent work. A new outcome may use a new chat,
but it is not required merely because a checkpoint was committed.

### Next-outcome prompt contract

Keep the prompt below 4,000 characters. Put durable rules in the repository and link
the selected task section; avoid copying entire phase plans, UI rules or AGENTS into
each message. Preserve these concrete fields:

```text
Deliver <one target>: <observable finished result>.
Repository: Caldwell-41/Renpy-editor
Continuation: <current branch/PR, published checkpoint or explicit local-only state>
Codex machine: <preferred development host; retain the current session>
Test hosts: <affected Windows x64/macOS ARM64 CI requirements and verified prerequisites>
Local handoff: <only named required cases CI cannot establish; otherwise none>
Reason: <why this result is next and which accepted dependencies it uses>
Read AGENTS.md, CURRENT, HANDOVER and <exact selected task section>.
Use one GPT-6.1 Sol High owner and zero to two GPT-6.1 Sol High implementation agents
only for useful independent assignments with declared file/contract ownership.
Scope: <included operations and explicit exclusions>.
Prove: <decisive user-action/source/persistence checks and required native evidence>.
Allowance: <finite builds/dispatches plus existing problem budget, not a fresh reset>.
Complete implementation, focused checks, review and in-scope fixes; update canonical
docs, task ledger and HANDOVER. Publish within the recorded authorization.
Prepare and dispatch focused CI within scope/allowance; follow WORKFLOW's waiting
policy and audit case/artifact evidence. Do not transfer merely to run automated checks.
Return the result and a prompt for the next distinct deliverable; do not start it.
Resume this same target/chat after any workflow wait. <Specific review/publish limits>.
```

Guidance checked: [official GPT-6 prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices)
recommends explicit delegation/autonomy and testing proportionate to changed scope.
Its behavior examples are based on Astra and must be evaluated for the selected Sol
team. [OpenAI's multi-agent guidance](https://developers.openai.com/api/docs/guides/deployment-checklist#use-multi-agent-for-parallel-work)
supports concrete independent assignments and serial ownership of dependent/shared
work. These inform the cadence; the deliverable queue and repository gates are
Loomlight decisions, not a mandated OpenAI milestone count or new orchestration system.


### Continue Scene selection — 2026-10-10

State: `in_progress`. User selected bounded Continue Scene on
`codex/provider-qualification`, reconciled clean local/remote `e69782c`; fresh main
remains `5f448ca`. One GPT-6.1 Sol High owner; shared implementation stays serial.
Preserve any independently required review. This selection does not advance the queue.

Acceptance: action-specific editable prompt and exact context/send review; explicit
saved, source/structure/session-bound insertion **before** an eligible root Beat;
closed response of 1–8 dialogue/narration Beats (10,000 UTF-8 bytes total), existing
reviewed Characters only, core-owned IDs and literal display encoding. Static semantic
and exact Source/metadata preview binds one whole group, one transaction/Undo entry
and one acceptance. Surrounding source and existing terminal Beat/ID remain unchanged.
Refuse custom/nested/unsupported boundaries and invalid terminals; no edge replacement.
Prove exact HTTP body, passive rendering, byte preservation, Undo/Redo/reopen,
duplicate refusal, and zero writes for malformed/unsafe/cancel/stale output, competing
drafts and ordinary external writers. Reuse unchanged provider/reference/credential,
protected-token and transaction evidence; add focused official pinned-SDK literal/runtime
proof and changed-action native evidence on Windows x64/macOS ARM64.

New cumulative allowance per target: **4 package-build attempts, 6 app launches,
4 focused CI dispatches**; initial use **0/4, 0/6, 0/4** on both. Failed/cancelled and
implicit attempts count. Reassess after two unsuccessful corrections of one hypothesis.
Earlier slice allowances/results are retained and not borrowed or reset.

CI capability inspection: existing focused Windows UIA/OS-input driver and
`windows-2025`; ARM64 automated checks can use `macos-26`. Repository Actions secret
and self-hosted runner inventories are empty. README's approved certificate-backed
Mac package policy therefore prevents hosted signed-package/native credential proof;
retain the current Mac session for that named required case, using its existing
approved identity without provisioning/export/trust changes. CI still owns automated
both-target qualification. Actual native preflights must pass before launching.

No paid/public provider call, provider expansion, generated reference, Draft Scene,
terminal/edge replacement, route expansion, signing-policy change, merge or release.
Commit/push coherent work to the existing branch; audit actual CI cases/artifacts.
Manual same-thread wait/resume applies after a confirmed nonterminal dispatch.


### Continue Scene implementation and local preparation — 2026-10-10

Core reuses the transient rewrite pipeline with `continueScene`, action-specific prompt
resources/context, one revision-bound safe root boundary and a 1–8 Beat/10,000-byte
closed group. A dedicated internal insertion edit emits the group once in memory,
allocates IDs, checks resulting IDs and prepares one source/map transaction. Semantic
text/IDs and exact patches share the acceptance digest. Existing prefix/suffix, Beat IDs,
payloads and terminal survive; one Undo/Redo and independent reopen are covered.
Settings/Story/Assist expose the action, explicit terminal/anchor, whole-group passive
review and one Accept Beat group. Unsupported adjacency/terminal entry disables and
core independently refuses. Provider, credential, transport and recovery policies stay.

Focused local proof with pinned Node 24.19.0/npm 11.9.0/Rust 1.90.0: core rewrite
**15/15**, prompts **5/5**, transport **8/8**, native worker **6/6**, final focused action
DOM **9/9**. Actual renderer controller/native credential reader/strict loopback HTTP
passes exact reviewed body, inert preview, held-owner refusal, one acceptance/Undo/Redo,
malformed/cancel/stale zero writes and responsive Save. Full renderer initially
**124/124** passed; final coherent candidate with the action-selector regression passes
**125/125**, zero fail/cancel/skip, and frontend production build passes. Report/native evidence gates **3/3 and 4/4** pass;
reuse-drift gate **5 pass / 1 Windows-only skip** on Mac, with that actual PowerShell
case required in Windows CI. Actionlint and Python source compilation pass.

Retained ignored logs `.toolchains/logs/continue-*` record failures accurately: initial
controller/network worker binds were sandbox `EPERM`/permission denials, then passed
with authorized loopback capability. Python bytecode cache initially tried the system
cache and was refused; redirected contained cache compiled successfully. The new
prompt DOM test initially used an unsupported happy-dom ARIA-property selector; a
named control selector resolves the harness-only failure, now 9/9. No package/editor
launch/CI consumption for these checks. No failed case is represented as a pass.

Owner integrated review follows sections 6–8/10–11/20: context source exclusion,
closed action/target/Character authority, generated literal bounds, core IDs, immutable
source/map review, single consumption/commit, raw revision identities, draft/lifecycle
and stale refusal. Source review removed unrelated formatter-only changes from files
outside selected scope. Existing independently required checkpoint review is retained;
this bounded deliverable adds no new independent reviewer mandate (section 19).

The isolated existing workflow has action-specific Windows native receipts/report
assertions and Mac automated evidence. Continue forbids old package/SDK/focused reuse;
changed inputs require actual fresh cases. Canonical contracts explicitly label target
qualification pending. Next: finish coherent local checks, commit/push candidate and
perform one focused CI dispatch; then publish wait identity and pause this same thread.
Current use remains **Mac 0/4 builds, 0/6 launches, 0/4 CI; Windows 0/4, 0/6, 0/4**.


### Continue Scene focused CI wait — 2026-10-10

State: `awaiting_ci`; Continue Scene remains unfinished. Coherent implementation
**`3432288ea64ff24f88e7efe89c42798bd52b6377`** committed and verified pushed to the existing
`codex/provider-qualification`. Working tree was clean. Final renderer **125/125** and
production frontend build pass; final actual Continue controller/native-reader/HTTP
fixture passes. No package/native launch was performed locally. Canonical contracts,
selection/acceptance and live status are published with the implementation.

Confirmed [run **38035948157**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38035948157),
workflow **357322921** (`production-scaffold.yml`), attempt **1**, event
`workflow_dispatch`, exact head **3432288ea64ff24f88e7efe89c42798bd52b6377**, branch
`codex/provider-qualification`. Created **2026-10-10 07:52:56 UTC**; last observed
**in_progress**, run updated **07:53:05 UTC**, identity observed **07:53:32 UTC**.
Material inputs: `continue_scene=true`, `dialogue_rewrite_windows=false`, Windows
build ordinal **1**, first launch ordinal **1** (dependent process reopen **2**),
both reuse IDs empty, `upload_packages=false`. No job/run retry or other dispatch.
Generic production matrix skips; only focused Windows and Mac ARM64 jobs are selected.

Cumulative dispatch use is **1/4 on each target**. Mac builds/launches remain **0/4,
0/6**. Windows run reserves **build 1 and launches 1/2**; actual consumption must be
read from the run's attempt ledger/artifacts on resume, including failed/cancelled or
implicit attempts. Those reservations are unavailable for another run until audited.
Conservative unreserved remainder: Windows **3 builds/4 launches/3 dispatches**;
Mac **4 builds/6 launches/3 dispatches**. Earlier slice allowances are unchanged.

Pending audit: exact run/attempt/SHA, runner architecture/toolchains, native capability,
125 renderer/15 core/5 Mac prompt/8 transport/6 worker cases, real Continue controller,
official pinned SDK checksum/literal/two say/terminal/return cases, Windows package
input/binary hashes and all **22** distinct phase-1 assertions/five exact HTTP bodies,
all five action-specific native stages/seven captures, independent phase-2 **3** checks,
zero HTTP/unchanged whole-project bytes, privacy and credential/fixture/process/listener
cleanup. Audit downloaded `rewrite-windows-38035948157-1` and
`continue-macos-38035948157-1` evidence if produced; retain failures and do not normalize
missing/skipped/partial artifacts. No artifact ID/expiry is known before completion.

Per WORKFLOW, publish this docs-only wait successor and **end active model polling**.
Normal chat needs the user's same-thread resume message; no autonomous Goal lifecycle
control was invoked or claimed. No watcher, automation, next feature, merge or release.
On resume, reconcile fresh refs/local edits, verify this exact run and audit artifacts,
continue only authorized in-scope fixes within unchanged allowances. Then establish
the named local approved signed Mac Continue native case, complete final review and
closure, and return the next-outcome prompt without starting it.


### Continue Scene failed-run audit and review repairs — 2026-10-10

State: `in_progress`. User resumed the same thread, explicitly requesting audit of
failed run 38035948157, correction and another review before any new run. Fresh fetch
reconciles clean local/remote `3ff1e18`; main remains `5f448ca`. No reset or unrelated
work changes. The earlier wait is superseded; the failed evidence remains failed.

Exact run **38035948157**, workflow **357322921**, attempt **1**, candidate **3432288**
completed **failure** at **2026-10-10 08:05:36 UTC**. Actual artifacts audited:

- Windows **11664456884**, `rewrite-windows-38035948157-1`, expires
  **2026-10-17 08:05:28 UTC**; ZIP digest
  `9e94a81aaced8cfffe21828678e216dd8f302a069a1af97bfb682c27c51b5e49`.
  All **45** manifest entries match. Package succeeds; retained executable SHA256
  `45474b8c3bb49304e156ab1ca8de8cb23d1f6b6fe546384331fe485685efd9fb`
  matches its input inventory. Native preflight proves interactive Default desktop,
  UIA and 1920×1080 observation. Pinned Node/npm/Rust match. Actual renderer 125,
  core 15, transport 8, native worker 6 and controller pass individually. The focused
  result gate fails with **`name 're' is not defined`**. Overall focused proof fails.
- Mac **11664581107**, `continue-macos-38035948157-1`, expires
  **2026-10-17 07:57:42 UTC**; ZIP digest
  `b38c26a81ee7a2de10533836d2485a47b75727f03ed437b5601013464c1da739`.
  All **22** manifest entries match. ARM64/pinned tools, renderer 125, core 15,
  prompts 5, transport 8, native worker 6, controller/build and literal-driver build
  pass individually; SDK fails. SDK scratch cleanup and privacy scan pass.
- Both SDK runtime cases fail at the immediate first exact `say` assertion after
  Start. Init substitution/token assertions, compile/lint and template startup pass.
  Local diagnostic proves initial `say.scope["what"]` is **empty** before populated
  dialogue, and pinned Character.prefix_suffix substitutes source before the screen.
  Classified **harness defects**, not evidence of a product literal failure. Windows
  native is skipped, both reports/cleanup receipt absent because no editor launched;
  missing required proof remains missing. No fixture/native credential was created.

Actual cumulative use after this audit: Windows **1/4 package builds, 0/6 editor
launches, 1/4 dispatches**; Mac **0/4, 0/6, 1/4**. Windows attempt ledger contains
only package-build ordinal 1. Unused launch reservations are released. Remaining:
Windows **3 builds/6 launches/3 dispatches**; Mac **4/6/3**. Earlier slice counts are
unchanged. SDK/test binaries are focused checks, not editor-process launch entries.

Corrections: import and exercise the actual Windows renderer gate, requiring 126
passes and zero failure/cancel/skip/todo; both target expected totals track the new
regression. Runtime waits use pinned SDK `pause until eval ... timeout 10` for each
exact substituted narration/dialogue/terminal payload, followed by exact assertions;
init token checks still prove original literal prose and no active generated tokens.
The first local substitution-only correction failed; one diagnostic then established
the empty screen race. The second, state-wait correction passes. This is one unsuccessful
correction of the original SDK hypothesis, followed by decisive evidence and success;
no blind CI retry or budget reset.

Owner reviewed shared prepare/send/complete/accept bindings, closed schema and IDs,
anchor/terminal insertion, zero-write transitions, source/map preservation, action UI,
HTTP fixture, native stage gates, SDK timing and workflow outcome/attempt recording.
Review found and fixed **a product prompt-cache defect**: Undo from one action can
change the other action's saved prompt while its cached text remains stale. Shared
Undo/Redo now reloads both saved action models; failed post-commit refresh keeps the
committed result and disables stale choices until explicit reload. One DOM regression
proves cross-action Undo and failed-refresh/Redo recovery. Native gate regressions
also explicitly reject absent/wrong action receipts before allowing Continue evidence.
No additional independently required review is waived or newly claimed.

Focused final local proof: **126/126 renderer**, zero fail/cancel/skip/todo; frontend
build and native JS syntax pass; actual Windows renderer gate admits that real output
and rejects missing/partial/unsuccessful fixtures (6 portable tests pass; Windows-only
PowerShell case remains CI-required). Report gates **3/3**, native gates **4/4**,
Python syntax and actionlint pass. Corrected official pinned SDK compile/lint/literal/
runtime passes **8/8** named smoke assertions (two say Beats, terminal and return),
with no skipped/not-run cases. Original failures and diagnostic logs stay ignored.
Unchanged core/transport/controller evidence above is reused; no redundant local core
suite or provider call. Windows changed renderer/SDK/native proof still requires CI.

Retained Mac native capability inventory is available; Loomlight is not running.
Before redispatch, perform only the named approved signed Mac native case missing
from hosted CI, count every package/editor attempt, audit its exact candidate and
cleanup, and fix any evidenced in-scope issue. No signing or Keychain policy change.
Then publish and dispatch the coherent repaired candidate within this same allowance;
Windows build ordinal 2 and first launch 1 remain available. Record exact new run,
inputs and consumption; follow manual same-thread wait/resume. No next deliverable.


### Continue Scene repaired candidate, Mac capability stop and second CI wait — 2026-10-10

State: `awaiting_ci`. Reviewed repair candidate **8931fa85178ca22430fa5984e693f609970f4995**
committed/pushed to the same branch; remote identity verified and working tree clean.
No next deliverable or unrelated work was started.

Mac package **1/4** built this exact candidate through the unchanged approved wrapper.
Strict/deep signature, exact pinned certificate/designated requirement, permanent
bundle/installer identity and installer contents all pass. Executable SHA256
`921c33f2e06c1e78719416e39d63092d006f061875354875cbcf232ec5218f59`;
installer SHA256 `55c467310a514c7d6cba72e92ffafc71d9d1a00100e2721150d24ee437f87b9a`.
Privacy scan passes; candidate/runtime input inventory and receipts remain ignored
under `.toolchains/releases/continue-mac-01`. Public certificate pin and policy unchanged.
Sandbox identity lookup was unavailable; authorized native read confirms the existing
approved identity. No signing fallback or trust/namespace/provisioning change.

Native inventory succeeds and says Loomlight is not running. Prelaunch Finder native
observation returns **“The Mac is locked and automatic unlock could not unlock it.”**
This is an environment capability blocker; manual unlock requested. **Zero Mac editor
launches**, no owned native fixture, credentials, server or process. No retry on a
locked desktop. The named native proof remains missing; available package proof is
retained and reusable. CI continues independently under the user's fix/review/new-run
request. User unlock response must precede any dependent native launch.

Confirmed new [run **38039472619**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38039472619),
workflow **357322921**, attempt **1**, `workflow_dispatch`, branch
`codex/provider-qualification`, exact head **8931fa85178ca22430fa5984e693f609970f4995**.
Created **2026-10-10 08:53:52 UTC**, updated **08:54:02 UTC**, initial identity observed
**08:54:05 UTC**, status **in_progress**. Material inputs: `continue_scene=true`,
`dialogue_rewrite_windows=false`, `rewrite_build_ordinal=2`,
`rewrite_first_launch_ordinal=1` (dependent reopen 2), both reuse IDs empty,
`upload_packages=false`. Only focused Windows and Mac automated jobs selected.
Existing run inventory was terminal before dispatch; no job/run rerun or duplicate send.

Cumulative dispatch use **2/4 per target**. Known actual Windows build use **1/4**,
editor launches **0/6**; active run reserves build **2** and launches **1/2**, with actual
consumption to audit from retained attempt ledger. Mac use **1/4 builds, 0/6 launches,
2/4 dispatches**. Conservative unreserved remainder: Windows **2 builds/4 launches/2
CI**, Mac **3 builds/6 launches/2 CI**. Reservations do not convert to actual attempts
until evidence; failure/cancel/implicit attempts count. Earlier allowances unchanged.

Pending audit: exact run/attempt/head, target architecture/pinned tools, **126** renderer
passes/zero unsuccessful cases, 15 core/5 Mac prompts/8 transport/6 native worker,
actual Continue controller, corrected official pinned SDK compile/lint/literal/runtime
and exact three say payloads/return, Windows package/input hashes, 22 native phase-1
checks/five exact bodies/all five action-specific stages/seven captures, process phase-2
three checks/zero HTTP/unchanged project bytes, privacy and owned credential/fixture/
process/listener cleanup. Expected artifacts `rewrite-windows-38039472619-1` and
`continue-macos-38039472619-1`; IDs/expiry unknown until actual production. Required
Mac native observation/physical send/accept/reopen remains pending on manual unlock.

Publish this docs-only wait successor, then **end active model polling** under
WORKFLOW manual same-thread resume. No watcher, automation or autonomous Goal lifecycle
pause is invoked/claimed. Next prompt: **“Resume Continue Scene; audit run 38039472619
and continue the existing outcome. The Mac is unlocked.”** Reconcile fresh refs and
actual counts; reuse candidate 8931fa8's unchanged signed Mac bundle after input/hash
verification, complete only authorized fixes/native proof/review/closure. No new
run/job retry without a diagnosed case and available cumulative allowance.


### Continue Scene both-target qualification and closure — 2026-10-10

State: **`complete` for this bounded outcome**; Phase 2 remains incomplete. Same-thread
resume explicitly confirms the Mac is unlocked. Fresh refs reconcile clean local/remote
**675ad05**, main **5f448ca** unchanged. Final tested implementation is
**8931fa85178ca22430fa5984e693f609970f4995**; closure is docs-only. No reset, unrelated
work removal, next feature, extra owner or local Windows handoff.

#### Exact CI/artifact audit

Run **38039472619**, workflow **357322921**, attempt **1**, exact candidate **8931fa8**,
completed **success** at **2026-10-10 09:05:01 UTC**. Selected focused Windows and Mac
ARM64 jobs succeed; generic preflight/matrix intentionally skip. Actual artifacts:

| Target | Artifact and expiry UTC | ZIP SHA256 | Verified manifest |
| --- | --- | --- | --- |
| Windows x64 | **11665238830**, `rewrite-windows-38039472619-1`; 2026-10-17 09:04:52 | `493885ae98f2f2d514b90f04b22e6b25794b08385cff6bcef4d4329469c40ed4` | All **76** entries match |
| Mac ARM64 | **11665396226**, `continue-macos-38039472619-1`; 2026-10-17 08:59:13 | `bd8683cbd9674da4af217335c3f2894f68aa49de24090ba60d1dde455f4f2ab9` | All **23** entries match |

Identity inventories bind run/attempt/candidate/action/architecture and pinned
Node **24.19.0**, npm **11.9.0**, Rust/Cargo **1.90.0**. Both renderer runs pass
**126/126**, zero fail/cancel/skip/todo; frontend builds pass. Each target passes
core rewrite **15**, transport **8**, native worker **6** and real controller/native
credential reader/exact strict-schema HTTP; Mac prompts **5** also pass. Official
Ren'Py **8.5.3** archive SHA256 matches published checksum
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45` on both targets.
Compile/lint, init literal substitution/token checks and named runtime smoke pass
**8/8** assertions, zero skipped/not-run: two exact generated say payloads, preserved
terminal say and return. Actual SDK logs/identities audited; no badge-only acceptance.

Windows terminal audit has all five required outcomes successful, no errors; package
input/executable digest matches **60571ec3b5925ffa3acdd591dc94954fd9db27a3b4526ad78a2a2c67f1db60aa**.
Its real Default desktop/UIA capability passes. All five Continue-specific native
receipts bind PID/binary/action, viewport controls and OS SendInput before stage release;
seven intact captures were individually visually inspected for light/dark/compact and
before/after Generate/Accept states. Phase 1 passes **22 distinct** required checks
(**23** entries, reference availability repeated), with all five reviewed digests equal
to actual HTTP body digests. Phase 2 passes **3/3**, zero HTTP, unchanged whole-project
bytes and native credential readability. Owned credential references removed, fixture
cleanup complete, processes/listener exit and privacy scan pass. The attempt ledger
records package build **2**, editor launches **1/2**, exact run/attempt/head.

#### Retained signed Mac native case

Before launch, Computer Use successfully observes the unlocked existing desktop.
The retained `.toolchains/releases/continue-mac-01/Loomlight.app` passes strict signature/
exact approved pin/designated requirement again; every recorded runtime input remains
byte-identical to candidate **8931fa8**. No rebuild for docs-only successors. Approved
executable SHA256 remains **921c33f2e06c1e78719416e39d63092d006f061875354875cbcf232ec5218f59**;
installer SHA256 **55c467310a514c7d6cba72e92ffafc71d9d1a00100e2721150d24ee437f87b9a**.
No trust, signing identity, credential namespace or provisioning change.

Mac editor launches **1/6** (owned PID 15516) and **2/6** (PID 15625) use the signed
bundle with isolated disposable profile/project and synthetic loopback only. Native
Computer Use observes light/dark **1280×900** and compact **720×780** layouts, reachable
controls/focus/scroll, passive whole-group/assigned-ID/Character/anchor/terminal review
and exact Before/After source. Physical Generate creates an inert review; physical
Accept saves once and disables duplicate acceptance. Observed Source retains BOM,
comments, mixed newline/Unicode/custom Python, protected existing text and terminal;
core/native byte assertions establish exact preservation.

Phase 1 passes all **22 distinct** checks, five exact body matches, new/existing IDs
and payloads/terminal, one Undo restoring prior bytes, Redo restoring accepted bytes,
malformed/unsafe/cancel/stale zero writes and project reopen. Independent process
phase 2 passes **3/3**, zero HTTP and whole-project byte equality while retaining group,
terminal, action prompt and native credential readability. Reports, attempt ledger,
structural hashes and cleanup receipt retained ignored under `.toolchains/continue-mac-native-01`
and `.toolchains/continue-mac-native-attempts.jsonl`. Both PIDs exited; native credential
references are absent. Only the verified owned non-link disposable root was removed
after hashing its contents. Server/listener terminated by the runner. Privacy scan
passes; no owned fixture, credential, listener or editor process remains.

#### Acceptance/review and final allowance

Owner integration/source/native review is complete, retaining independently required
prior checkpoint reviews and the future integrated Phase 2 review. No new reviewer
mandate was introduced for this bounded outcome. Review-discovered prompt-cache defect
and both demonstrated harness failures are fixed and qualified. Old run 38035948157
and the locked-desktop capability failure remain honest failures, not retroactive passes.
No further implementation defect was identified in exact dispatch, lifecycle/read-set/
draft binding, closed bounds/IDs, anchor/terminal, minimal source/map proposal,
consumption/history or native flow. Existing recovery and unrelated foundation evidence
is reused; no broad matrix, destructive experiment or duplicate expensive verification.

| Target | Actual cumulative package builds | Actual editor launches | Focused dispatches | Unused remainder |
| --- | --- | --- | --- | --- |
| Windows x64 | **2/4** | **2/6** | **2/4** | 2 builds, 4 launches, 2 dispatches |
| Mac ARM64 | **1/4** | **2/6** | **2/4** | 3 builds, 4 launches, 2 dispatches |

No outstanding reservations or pending CI operations. Failures/cancel/implicit attempts
count; prior selected allowances remain separate and unused remainder is not carried
into a future outcome. CI/platform defaults and manual same-thread waits were followed.

Acceptance is met: bounded 1–8 dialogue/narration group at explicit revision-bound
saved root insertion anchor; action prompt/context/full exact body review; core-owned
UUIDs/literal encoding/semantic and exact source/map digest; one transaction/Undo entry;
duplicate refusal; byte-exact surroundings/existing IDs/payloads/terminal; Undo/Redo/
reopen; zero writes for malformed/unsafe/cancel/stale/drafts/competing requests/external
edits; unsupported/custom/nested/invalid-terminal refusal. Both target native changed-
action and pinned SDK evidence qualify. Canonical contracts, CURRENT and HANDOVER agree.

Limits retained: agent/automated native evidence is not final human phase-wide
acceptance; new paid/public/live provider behavior was not exercised. No provider/route
expansion, generated references, Draft Scene, terminal/edge replacement, merge, release
or signing-policy change. Full Phase 2/2C.4 and its independent review remain pending.

#### Next-outcome prompt — proposal only, not executed

```text
Deliver Draft Scene: review and create one bounded Scene in an explicitly selected
saved Chapter, accept once, Undo/Redo and reopen while preserving all existing source.
Repository: Caldwell-41/Renpy-editor
Continuation: codex/provider-qualification; qualified Continue Scene implementation
8931fa8 plus its published closure. Reconcile fresh refs; preserve unrelated work.
Codex machine: retain the current Mac ARM64 session.
Test hosts: focused local checks and Windows x64/macOS ARM64 CI for changed shared
proposal/creation/transaction behavior; verify capabilities first. Local native work
only for a named required case CI cannot establish; reuse unchanged signing evidence.
Reason: Continue Scene is qualified; reuse accepted provider/reference/prompt/literal,
context-review, bounded group and transaction foundations.
Read AGENTS.md, CURRENT, HANDOVER and phase-2-initial-llm-assistance.md sections
6–8, 10–11 and 20. Record selection and exact acceptance in the existing task.
Use one GPT-6.1 Sol High owner; shared implementation serial; retain required review.
Scope: one bounded dialogue/narration Scene, existing reviewed Characters, core-owned
IDs/source path, reviewed title/Chapter and explicit terminal Return. Action-specific
prompt/context/full-send and exact semantic/source/metadata preview. No incoming
connection, edge replacement, custom source generation, generated references, provider
or route expansion, paid/public calls, signing-policy changes, merge or release.
Prove exact reviewed dispatch, inert preview, one transaction/Undo, duplicate refusal,
byte-exact existing source, Undo/Redo/reopen, stale Chapter/project/session and competing
draft/external-edit/malformed/unsafe/cancel zero writes, plus changed-action native and
official pinned-SDK literal/runtime proof on both targets. Reuse unchanged evidence.
New cumulative allowance per target: at most 4 package-build attempts, 6 editor launches
and 4 focused CI dispatches for this distinct outcome; prior allowances stay closed.
Count failures/cancellations/implicit launches; reassess after two unsuccessful
corrections of one hypothesis.
Complete implementation, focused verification, review and in-scope fixes. Commit/push
coherent work to the existing branch; update canonical contracts, task, CURRENT and
HANDOVER. Follow WORKFLOW manual same-thread CI wait/resume and audit actual artifacts.
Return result, limitations and next prompt. Do not start the next deliverable.
```


### Draft Scene selection — 2026-10-10

User selected delivery of one bounded Scene in an explicitly selected saved Chapter,
accept once, Undo/Redo and reopen with all existing source preserved. Fresh local and
remote branch `codex/provider-qualification` match closure `23c251b`; main is unchanged
`5f448ca`. Checkout clean; no reset or unrelated change. Retain Mac ARM64 session;
one GPT-6.1 Sol High owner, serial shared implementation and independent review.

Reuse provider/reference/prompt/literal/context/bounded-group/transaction foundations.
Author reviews Chapter and title before exact dispatch. Closed response: 1–8 supported
dialogue/narration Beats, at most 10,000 total UTF-8 text bytes, existing reviewed
Characters and explicit terminal Return. Core owns IDs, technical label and source path.
Passive semantic/exact source/project/source-map preview; Accept binds digest and
rechecks session, configuration, complete revisions, drafts and transaction preconditions.
One journalled transaction/Undo entry; duplicate refusal; byte-exact existing source,
Undo/Redo/project and process reopen. Malformed/unsafe/cancelled/stale Chapter/project/
session, competing draft/request and external edits must write nothing. No incoming
connection, edge replacement, custom generation, generated references, provider/route
expansion, paid/public calls, signing-policy change, merge or release.

CI-first affected shared behavior on Windows x64/macOS ARM64, including changed-action
native and official pinned-SDK literal/runtime proof. Windows runner's prior audited
interactive UIA/input capability is reusable, rechecked in each selected run. Hosted Mac
has no approved signing identity: automated controller/service/SDK proof uses CI; named
signed changed-action native case remains on the retained Mac host. Computer Use
inventory works; no app launch for capability inspection. Existing local pinned tools,
SDK and approved signing configuration retained.

New cumulative allowance per target: 4 package attempts, 6 editor launches, 4 focused CI
dispatches. Initial actual use/reservations Windows **0/4, 0/6, 0/4**; Mac **0/4, 0/6, 0/4**.
Prior allowances remain closed. Failures/cancellations/implicit launches count; reassess
after two unsuccessful corrections of one hypothesis. Required independent review
remains independent. Manual same-thread CI wait/resume applies; next deliverable excluded.


### Draft Scene implementation and reviewed preflight — 2026-10-10

Implemented Chapter-level Assist selection, author-reviewed title and dedicated editable
versioned prompt. Shared exact-send/proposal path accepts a closed 1–8 Beat Scene with
explicit Return, core IDs/label/path, combined source/project/map preview and one
transaction/history. Every existing source path/revision and retained Source draft is
guarded without outbound story inclusion. Empty Chapter preview creates no directory;
acceptance materializes it. No incoming connection or existing-source mutation.

Focused local core **21/21**, renderer **127/127**, prompt **5/5**, actual controller/
native credential/strict loopback HTTP and pinned-SDK Draft literal/runtime pass.
Evidence gates **15 tests, 14 pass/1 Windows-only PowerShell skip** locally; Windows
will execute that required target-only gate. Actionlint and JavaScript/Python syntax
checks pass. Production and gate assertions reject incomplete/missing/wrong-action
results, malformed/unsafe/extra-field terminal output and zero-test results.

Independent GPT-6.1 Sol High read-only review found title-only retention and disappeared
source/retained draft gaps. Both fixed; DOM/core regressions pass. It additionally
required actual saved bytes in the SDK driver, native BOM-preserving byte hashes
including Undo metadata, and Mac mutually exclusive selector preflight. All corrected
before packages/CI. Review fixes remain within this same outcome.

Failures retained: initial new terminal test exposed serde unit-variant extra-field
acceptance (18 passed/1 failed); replaced with a closed terminal object, then 4 Draft
cases and full 21 passed. Harness test expected historical renderer count 126; updated
its explicit rejecting fixture to current 127 and passed. No gate threshold relaxed.
A broad formatter touched entry-clean unrelated Rust files; exact pinned-rustfmt
comparisons proved all ten changes formatting-only before guarded restoration.
Automatic approval review initially rejected the broad restore; explicit equality
guards then allowed only those proven formatter deltas to be removed. No user work
was lost. Tests/builds of examples are not editor-process launches or package attempts.

Approved signing capability verified outside sandbox: existing pin/identity available;
its retained local trust limitation remains unchanged. Hosted Mac cannot provision it.
Reserve named signed Mac Draft native case: **package attempt 1**, then at most two
editor launches for action and process reopen. Actual prior use remains zero on both
targets; planned Windows CI **1 build/2 launches**, one focused dispatch per target.
No dispatch or app launch yet. All failures/cancellations/implicit launches count.


### Draft Scene focused CI wait — 2026-10-10

State: **`awaiting_ci`**; Draft Scene acceptance remains incomplete. Reviewed candidate
**b51229d4b0d8b2dc319b157adba528a6240ec7f2**, tree
**ec7b90e87fd2d576613d5356e97832a32a34d6b6**, was committed/pushed nonforced to the
existing branch and remote identity verified. Independent production and evidence
review closed all actionable findings. Canonical contracts and local focused checks
are published; no PR, merge, release or following deliverable.

Confirmed Production scaffold workflow **357322921**, [run **38046543055**]
(https://github.com/Caldwell-41/Renpy-editor/actions/runs/38046543055), attempt **1**,
event `workflow_dispatch`, branch `codex/provider-qualification`, exact head candidate
above. Created **2026-10-10 10:54:32 UTC**; last observed **in_progress**, updated
**10:54:44 UTC**. Inputs: `draft_scene=true`, `continue_scene=false`,
`dialogue_rewrite_windows=false`, `rewrite_build_ordinal=1`,
`rewrite_first_launch_ordinal=1`, both reuse run IDs empty, `upload_packages=false`.
No changed-action native evidence reused. Windows focused package/native/SDK and Mac
ARM64 focused controller/core/SDK selected; generic jobs intentionally unselected.
Required artifact/case audit is outstanding. No model polling or automatic wake-up.

Named local case: signed Mac Draft native layout/physical Generate/Accept/history and
process reopen, which hosted Mac lacks approved signing capability to establish.
Package attempt **1 passed**, approved pin
`358372708164C7273A551D746449357C12A3A806`; strict signature and installer contents
verified without trust/ACL/signing-policy changes. Retain
`.toolchains/releases/draft-mac-01/Loomlight.app` and `.dmg`, package-inputs.json
(244 runtime inputs match candidate) and identity-receipt.json. Executable SHA256
`cb90ead399ca02c9d131a84cf1ddb17d841676a0902069ac5cef7d33765a060c`;
installer SHA256 `e81face2ecd8c60308bf10817c3c03d0432424a672262e9c2c036bae572f2db9`.
Reuse this package if runtime input/signature/identity equality still holds.

Native launch **1** reached `observe-light`, PID **19147**, owned fixture
`/private/tmp/loomlight-rewrite-draft-mac-01`, evidence
`.toolchains/draft-mac-native-01/phase-1.log`. Computer Use reported the Mac locked
and automatic unlock unavailable; user unlock requested. No actual native observation
or physical action can be credited, and no stage marker was forged. Renderer deadline
180 seconds is not guaranteed to advance while the locked WebView is suspended;
existing native watchdog bounds the process to 900 seconds. At checkpoint the owned
harness/process remain pending; no terminal/credential-cleanup claim. On resume audit
the retained failed/incomplete report and process, explicitly verify native credential
cleanup (watchdog host shutdown alone does not establish it), retain fixture until
that is established, then use a fresh owned root/log for a required retry. No process
reopen launched. Record failure/cancellation even if no native click occurred.

| Target | Actual packages | Actual editor launches | Focused dispatches | Reserved execution / unused allowance |
| --- | --- | --- | --- | --- |
| Windows x64 | 0/4 known before artifact audit | 0/6 known before artifact audit | **1/4** | Run reserves build1, launches1–2; audit actual attempts before retry |
| Mac ARM64 | **1/4** | **1/6** (incomplete native attempt) | **1/4** | 3 builds, 5 launches, 3 dispatches remain; hosted Mac has no signed package/launch |

Windows reserved work is not claimed as completed consumption. Its run artifacts must
establish actual failures, cancellations and implicit launches. Prior outcome allowances
remain closed. Reassess after two unsuccessful corrections of one hypothesis.

Local pinned SDK final saved-byte proof at `.toolchains/draft-sdk-local-saved-02`
passes one named test, **8/8 assertions**, zero skips/failures/not-run with official
Ren'Py **8.5.3.26051504** on macOS ARM64. It reads the accepted disk file and asserts
exact preview equality before executing it; supersedes the initial preview-byte proof.
This and local core21/renderer127/prompt5/controller/strict HTTP are local proof only.
Both-target CI, Windows native and remaining Mac native/reopen evidence are required.

Resume in this same chat after workflow completion: audit exact run/attempt/SHA and
actual artifacts/cases, reconcile refs without resetting, close only in-scope findings
within the remaining allowance, complete unlocked Mac native/reopen using unchanged
package where qualified, then publish acceptance/closure and next-outcome proposal.
No subsequent deliverable is selected or started. WORKFLOW requires this manual wait;
normal chat resume message is sufficient, no autonomous Goal/watchers were created.


### Draft Scene CI artifact audit and Redo correction — 2026-10-10

State: **`in_progress`**. User resumed this same chat to audit run38046543055 and fix
CI issues. Fresh refs match published checkpointfdc5f90; main unchanged5f448ca,
checkout clean on entry. No reset or unrelated change. Exact recorded run/attempt1
completed **failure**, updated **11:07:36 UTC**, headb51229d (not later docs head).
Mac job114197123264 succeeded; Windows job114197123383 failed its terminal evidence
gate. Generic Preflight/matrix intentionally unselected. No incoming scope added.

Downloaded artifacts `rewrite-windows-38046543055-1` (ID11668525333,
archive digest9aa2ca4bd885b1e44de3fe97f2c7993704ed546f6342e8491cc4f3e005b137d2)
and `continue-macos-38046543055-1` (ID11666799536,
digest27feda166380277c4d8fe119da47e6a34064d965190947118ff88189870b45ea).
Legacy artifact name is not action proof: both identities explicitly draftScene,
correct b51229d/run/attempt/pinned Node24.19.0/npm11.9.0/Rust1.90.0 and target
architectures. Verified **72 Windows / 23 Mac manifest file hashes**. Retained ignored
`.toolchains/draft-ci-38046543055`; raw Windows job log also audited.

Both actual target logs: core21, renderer127, transport8, native-worker6 and actual
controller/strict HTTP pass with zero failures/skips/ignored; Mac prompt5 also passes.
Windows gate suites4+4+7=**15 pass**, including the previously local-only skipped
PowerShell child-context case. Both official SDK archive SHA256 matches published
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`;
compile/lint and raw runtime named test each **8/8 assertions**, zero skip/fail/not-run,
Ren'Py8.5.3.26051504. Windows SDK Python3.12.7, Mac3.12.8/macOS26.6.2 ARM64.
Mac all10 required automated cases pass and SDK root removed; these unchanged
successful proofs remain historical evidence, not completion of the corrected candidate.

Windows one package build succeeded (244 runtime inputs; executableSHA256
935ee2ec2f487bd57387848694f83dbbb83b8417b843fbc497c2a55b4a1e2d26). Actual
attempt ledger has **build1 and launch1 only**; no phase2 launch. All five native
UIA/OS-input stage receipts validate action/PID6120/executable/capture hashes and
nonblank controls. Send/Accept captures inspected. Physical Generate/Accept, inert
preview, exact IDs/path/Return, byte preservation and one Undo pass. Then report
times out awaiting Redo, with15 of22 required phase1 checks and only1 reviewed body;
phase2 absent. Gate correctly refuses this incomplete report; native outcome remains
failed. Windows credential references and owned root cleanup receipt confirmed.

Local first Mac native process19147 exited with explicit observe-light timeout,
passed=false/cleanupComplete=true,4 preliminary checks only. Profile credentials all
null, cleanup queue empty and development records empty, then guarded exact owned
fixture removed after structural hashes saved to ignored native cleanup.json. No
credential/signing policy change. Failure remains retained/counts1launch; no reopen.

Product diagnosis reproduced BEFORE fix in existing Draft history test: read accepted
source, Undo removes file, inventory refresh marks its cached clean buffer unavailable,
Redo refuses DIRTY_SOURCE. Successful app deletions now evict only exact accepted-
revision clean buffers with no draft/external/unavailable/invalid state; failed commits
do nothing. All ordinary external missing-source/draft protections remain. Extended
test also proves draft-blocked Undo has zero writes, discard/one Undo, refreshed saved
status, Redo and process reopen. Native probe labels undo/redo stages accurately.
Initial helper compile used optional instead of concrete Revision; corrected type,
then core21 and source16 all pass. One correction, no repeated failing hypothesis.
Independent GPT-6.1 Sol High read-only repair review reports no actionable blockers;
no reviewer tests/writes/packages/launches. Canonical architecture/testing updated.

Actual cumulative use now Windows **1/4 builds,1/6 launches,1/4 dispatches**; Mac
**1/4,1/6,1/4**. Prior allowances closed. Production inputs changed: old packages
cannot qualify the repair. Reserve package2 and native launches2–3 on each target,
second isolated focused both-target dispatch. Verify Mac observation capability before
launch; unlock requested while independent work continues. Count every failure/cancel/
implicit attempt. Remaining before reservation:3builds/5launches/3dispatches each.
Do not retry ambiguously or expand scope. After confirmed next dispatch, publish exact
identity/allowance and end model polling under manual same-thread WORKFLOW policy.


### Draft Scene signed Mac repair proof and clear UI — 2026-10-10

User continued the existing outcome and requested concise, plain UI text with no
internal terminology. Shared implementation remains serial; no following deliverable.
Redo correction published as c4c7763a139596d15d59eed7d7e99855bc755d72,
tree a21b87c165b127a944618dd0372d3deee2e50530. Independent repair review closed.

Mac native observation capability verified on the unlocked retained host before launch.
Named required signed/native case remains local because hosted Mac lacks approved
signing capability. Package2 uses unchanged approved pin
358372708164C7273A551D746449357C12A3A806; strict signature and installer-content
checks pass. Executable SHA2569fabc51ab6ece88243282851c9d36c512fed769211988c25176f0f28a51fbfa2,
DMG SHA2567a26c47d549ddbda4bf1fe651693b90de6242d05aae59b9e920f63ef0e4acd52;
244 runtime-input hashes match c4c7763. Evidence retained in ignored
.toolchains/releases/draft-mac-02 and .toolchains/draft-mac-native-02.
Launch2 PID22320: actual native light/dark/compact review, complete request and inert
source/project/map preview, physical Generate/Accept, 22 distinct phase1 checks,
five exact reviewed/dispatch body matches, one Undo/Redo and ordinary refusals pass.
Launch3 PID22655: process reopen3/3, zero HTTP and unchanged project bytes pass.
Both owned processes exited; credential references/queue/records cleared, exact owned
fixture guarded cleanup confirmed. Failed attempt1 remains retained, never normalized.

Native inspection exposed internal IDs/anchor/terminal wording on the main Draft
preview. Draft-only copy now uses Scene title, Chapter, reviewed Character names,
**Dialogue and narration**, **Ends here. No connection is added.** and explicit passive
preview wording. Exact complete request/context and source/project/map disclosures
remain expandable. Character names are local guarded authoring metadata, excluded
from outbound body and included in semantic digest. Existing source/name revisions
still invalidate stale review. Continue/Rewrite UI unchanged. Passive rendering tested
with hostile display-name text; main summary hides technical IDs and terminology.
Final renderer127 passes with zero failures/cancellations/skips/todo; core rewrite21
passes, followed by the updated meaningful Draft history/name/outbound test passing.
Native JS syntax and diff checks pass. Independent GPT-6.1 Sol High read-only copy
review reports no actionable blockers; no reviewer writes/tests/packages/launches.
Canonical UI/context contracts updated.

Actual cumulative Windows1/4 packages,1/6 launches,1/4 dispatches; Mac2/4 packages,
3/6 launches,1/4 dispatches. Changed UI requires fresh Mac package3/native launches4–5;
reserve Windows package2/launches2–3 and focused dispatch2 on both targets. Count all
failures/cancellations/implicit launches; prior budgets closed. No unbounded retries,
signing-policy change, paid/public call, merge/release or subsequent outcome.


### Draft Scene focused CI wait 2 — 2026-10-10

State **`awaiting_ci`**, selected bounded outcome remains incomplete. Clear UI and
Redo repair published on existing branch as **1320d0a6507625abdd3fa20aa6a3eccffaccfcd6**,
tree **42b36ee3e6180419837774300c9626a600ade328**; local/remote equal and clean.
Required independent reviews closed; canonical contracts/task/status updated.
No reset, unrelated changes, PR, merge/release or following deliverable.

Final signed Mac **package3** passes exact approved pin, strict signature and installer
contents without signing-policy/trust/ACL change. Executable SHA256
624c90d7863e5c7269026a9e44a2c91298b367b3048a69b29614ad36475febdc;
DMG SHA2563f4ef2964a9adf571495e227b658735c70a7c4769647456aa47cb93596850e1b.
All244 runtime-input hashes match published candidate. Retain ignored
.toolchains/releases/draft-mac-03 identity/input receipts, app/installer and build log.
Required native case performed on unlocked retained Mac ARM64 host (hosted CI lacks
approved signing capability). **Launch4 PID23942**, physical Generate/Accept and
native light/dark/720x780 compact review observed through Computer Use. Main summary
uses reviewed title/Chapter/Character names and plain ending/preview wording; exact
request/context and source/project/map details reviewed. Stage acknowledgments written
only after actual observation/actions with PID/binary/action/time receipts. Phase1
**22 distinct required checks**, five exact reviewed body/HTTP digest matches, byte-exact
existing source/BOM/custom preservation, one Undo, repaired Redo, duplicate refusal,
malformed/unsafe/cancel/external stale zero-write refusal and project reopen pass.
**Launch5 PID24030**, process reopen **3/3**, zero HTTP and unchanged whole project bytes
pass. Both processes exited; credential references/cleanup queue/development records
clear, exact owned fixture removed only after structural hash receipt. Retain
.toolchains/draft-mac-native-03 phase1/2 logs/reports/native-observations/cleanup;
privacy scan6files pass. No native proof or status from failed launch1 normalized.

Before dispatch verified no competing nonterminal production workflow on this branch.
Confirmed Production scaffold workflow357322921, [run38056790759]
(https://github.com/Caldwell-41/Renpy-editor/actions/runs/38056790759), attempt1,
event workflow_dispatch, branch codex/provider-qualification, exact head1320d0a above.
Created **2026-10-10 13:43:01 UTC**; one initial observation **in_progress**, updated
**13:43:09 UTC**. Inputs: draft_scene=true, continue_scene=false,
dialogue_rewrite_windows=false, rewrite_build_ordinal=2,
rewrite_first_launch_ordinal=2, both reuse run IDs empty, upload_packages=false.
Windows focused package/native/SDK and Mac ARM64 automated controller/core/SDK selected;
generic preflight/matrix intentionally unselected. Windows workflow rechecks interactive
native capability before execution; prior exact run1 capability passed. No changed-action
package/native reuse requested. Both targets' actual final cases/artifacts await audit.

| Target | Actual packages | Actual editor launches | Actual focused dispatches | Reservation / remaining allowance |
| --- | --- | --- | --- | --- |
| Windows x64 | 1/4 audited | 1/6 audited | **2/4** | Run reserves package2/launches2–3; reconcile actual terminal ledger before further work |
| Mac ARM64 | **3/4** | **5/6** | **2/4** | 1 package,1 launch,2 dispatches remain; hosted automated job has no signed editor package/launch |

All failures/cancellations/implicit attempts count; prior allowances remain closed.
Mac native final candidate evidence complete; final CI core/controller/SDK both-target
and Windows packaged native acceptance remain unqualified until actual artifact audit.
Original both-target SDK8/8 and valid unchanged foundations retained without blanket
cross-SHA waiver. Corrected runtime inputs are being requalified explicitly.

WORKFLOW manual same-thread wait applies: after this confirmed dispatch publish this
documentation-only checkpoint and end active turn, no polling/watchers/automatic Goal
or wake-up. Resume this same chat on user command to audit exact run/attempt/head,
required actual cases, package/runtime-input/SDK/native receipt/manifest hashes,
failed/skipped/cancelled outcomes, privacy/cleanup and actual cumulative consumption.
Then finish only in-scope fixes within remaining allowance and publish qualified
closure/limitations/next prompt. No next deliverable is selected or started.


### Draft Scene qualified closure — 2026-10-11

State: **`accepted` for this selected bounded agent-owned outcome**. User resumed this
same chat to audit run38056790759 and continue Draft Scene. Fresh local/remote match
published wait checkpoint3e614cb008d27e6c7731c4dda6c6bb39c28b649c; main remains
5f448ca683a905f4ea77d4580bbc89fda69f2b93. Checkout clean, no reset/unrelated work.
Retained Mac ARM64 session, one serial GPT-6.1 Sol High owner; implementation and
required independent read-only reviews closed. Full Phase2/final human acceptance
remain incomplete; no subsequent deliverable selected or started.

#### Exact CI identity and actual artifacts

Production scaffold357322921, [run38056790759]
(https://github.com/Caldwell-41/Renpy-editor/actions/runs/38056790759), attempt1,
event workflow_dispatch, branch codex/provider-qualification, exact implementation
**1320d0a6507625abdd3fa20aa6a3eccffaccfcd6**, tree
**42b36ee3e6180419837774300c9626a600ade328**, completed **success** at
**2026-10-10 13:56:50 UTC**. Windows job114226816944 and Mac job114226816763 both
succeed; generic Preflight/matrix intentionally unselected. Material input selection
matches recorded isolated Draft true, other actions false, buildordinal2/firstlaunch2,
reuse IDs empty, upload_packages=false. No second attempt or ambiguous redispatch.

Downloaded retained ignored artifacts .toolchains/draft-ci-38056790759:
Windows rewrite-windows-38056790759-1 ID11671427645, archive digest
c86a394a0277f9387ab430416f8d7910f747ade42a1f0a0d507ea75449326ef2;
Mac continue-macos-38056790759-1 ID11671108253, digest
cf3f7e49e2ca059a2b9cfd442b0b1c8f00e73b0fda8f98f4087101bad6668f1c.
Legacy artifact names are not action evidence: both identities explicitly draftScene,
exact candidate/run/attempt, correct AMD64/arm64 and locked Node24.19.0/npm11.9.0/
Rust1.90.0. Verified **76Windows/23Mac manifest file hashes**,243 candidate checkout
input hashes each and Windows244package runtime inputs/binary. The audit's initial
raw-Git/current-file comparison rejected the PowerShell hash; .gitattributes explicitly
requires CRLF on both hosts. Exact candidate blob plus declared checkout transform
matches the recorded hash; this is expected checkout representation, no product/evidence
waiver or changed source. No tests/builds/launches/CI rerun occurred during this audit.

Actual raw logs on both targets: core21, renderer127, transport8, native-worker6 and
actual frontend controller/native credential/strict loopback HTTP pass with zero
failures/cancellations/skips/ignored. Mac prompt5 also passes; all10required Mac
cases succeed and disposable SDK root removed. Windows target rejection gates4+4+7=
15pass, including PowerShell child-context; interactive/UIA desktop preflight passes
and native prelaunch is rechecked. Actual Windows job log retained ignored separately.

Both official SDK archive hashes match published SHA256
eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45.
Compile/lint and actual metadata-free standard-template runtime pass on accepted disk
source (driver verifies exact preview equality), Ren'Py8.5.3.26051504. Raw named
runtime cases/hooks each1/1, **8/8 assertions**, zero failed/skipped/not-run on each
target. SDK Python Windows3.12.7/Mac3.12.8, Mac runtime macOS26.6.2 ARM64. Harmless
literal expressions/action tags display literally and explicit Return executes.

#### Changed-action native and source/history proof

Windows package attempt2 passes; executable SHA256
9453ab9cb7f566e4ec87efee7d7ad0748fcc859b889dd69d97f33ab122c88f99,
244inputs match exact candidate/checkout. Actual ledger records one build2 and exactly
launch2PID8816/launch3PID8560. All five native stage receipts pass action/PID/binary/
capture hash/nonblank/viewport/UIA/OSSendInput validation. Physically generated inert
proposal and accepted-once captures plus compact capture inspected; plain title/Chapter/
Character review and passive exact source/metadata remain available. **22distinct**
phase1 checks pass, five exact reviewed/HTTP body digests match; one acceptance/Undo,
repaired Redo, all existing source/BOM/custom byte preservation, duplicate refusal and
malformed/unsafe/cancel/stale external zero writes pass. Separate process reopen **3/3**,
zeroHTTP and unchanged whole project bytes. Both native terminal cleanup reports and
owned fixture credential-reference/root removal receipt pass; terminal audit contains
no errors, all actual outcomes success. Artifact privacy74files passes.

Retain final signed Mac package3/native launches4–5 exact1320d0a evidence from the
prior same-thread wait record: approved pin/strict signature/installer and244matching
runtime inputs; actual light/dark/compact/physical Generate/Accept22distinct checks,
five exact bodies, oneUndo/Redo/refusals and separate process reopen3/3. Processes
exited, credential references/queue/records cleared, owned root cleanup complete;
privacy6files passes. Mac automated artifact privacy22files passes. This named local
signed/native case is required because hosted Mac lacks approved signing capability;
no additional handoff or duplicate native repeat. Signing/trust/ACL/names unchanged.

#### Acceptance, limits and final allowance

Selected acceptance met: explicit saved Chapter/reviewed title, one bounded1–8
supported dialogue/narration Scene and reviewed existing Characters, core-owned IDs/
label/path and explicit Return; exact prompt/context/body dispatch and inert semantic/
source/project/map review; one transaction/Undo entry, duplicate refusal, byte-exact
all existing source, Undo/Redo/project and process reopen. Closed malformed/unsafe/
cancel/stale Chapter/session/prompt/project, competing prepared request/draft and
ordinary external-edited/disappeared-source states refuse with zero writes, including
retained drafts. Empty saved Chapter materializes only on acceptance. Changed-action
native and official pinned SDK proof qualify both targets. Clear main UI uses reviewed
names and plain ending text; detailed exact disclosures remain available.

Independent implementation, Redo correction and clear UI reviews reported no actionable
blockers. Final independent GPT-6.1 Sol High read-only audit finds no actionable
evidence gap or improper bounded acceptance claim: manifest/input/capture identities,
native22+3/five bodies, SDK8/8, signed Mac receipts/cleanup and cumulative totals
confirmed. Reviewer performed no tests/writes/network/builds/launches; full Phase2/
human acceptance distinction retained. Unique prior failures remain honest: run38046543055 Windows Redo defect
reproduced/fixed, first Mac locked-desktop observe timeout, initial malformed terminal
extra-field and helper compile/harness count corrections. No gate weakening or claim
that earlier failed native acceptance passed. Unchanged foundation/recovery evidence
reused; no broad matrix, hostile/crash experiment or further provider/live calls.

| Target | Actual cumulative packages | Actual editor launches | Focused dispatches | Unused remainder |
| --- | --- | --- | --- | --- |
| Windows x64 | **2/4** | **3/6** | **2/4** | 2packages,3launches,2dispatches |
| Mac ARM64 | **3/4** | **5/6** | **2/4** | 1package,1launch,2dispatches |

No outstanding reservation, pending CI or owned native process/fixture/listener. All
failures/cancellations/implicit launches count; prior allowances closed. This outcome's
unused allowance closes here and does not silently carry into another deliverable.
Agent/automated native acceptance is distinct from final human/full Phase2/2C.4
acceptance and remaining independent phase review. No paid/public calls, provider/route
expansion, generated refs, custom source, incoming connection/edge replacement,
signing-policy changes, merge or release. Canonical UI/context/testing and live status
updated; docs-only closure does not replace the qualified implementation candidate.

#### Next-outcome prompt — proposal only, not executed

```text
Deliver Generated Character cards: draft or propose an update to one editor-only
Character card, review exact changes, accept once, explicitly approve, Undo/Redo and
reopen without changing runnable source or an existing approved revision silently.
Repository: Caldwell-41/Renpy-editor
Continuation: codex/provider-qualification, published Draft Scene closure atop qualified
implementation1320d0a; reconcile fresh refs, preserve unrelated work, do not reset.
Codex machine: retain the current Mac ARM64 session.
Reason: manual reference records, prompts/context, proposal/transaction lifetimes and
bounded Scene assistance are qualified; the next queue target is Character-card generation.
Read AGENTS.md, CURRENT, HANDOVER and phase-2-initial-llm-assistance.md sections6–11
and20, including the manual-library correction and latest Draft Scene closure.
Record selection/acceptance in the existing task. Use one GPT-6.1 Sol High owner;
shared implementation serial, retain required independent review.
Scope: one bounded card draft/update from explicitly reviewed saved context, core-owned
ID/revision, closed field groups, provenance/citations/status, passive semantic and
exact metadata review. Preserve the current approved record until explicit replacement
approval; generated content cannot approve itself. Reuse exact-send, draft/stale guards
and shared metadata history. No runnable Character/Appearance/asset/source change,
lore generation, external-card import, retrieval expansion, paid/public calls,
provider/route expansion, signing changes, merge or release.
Prove exact dispatch, inert review, one transaction/Undo entry, duplicate refusal,
approval separation, no unapproved/stale inclusion, zero writes for malformed/unsafe/
cancel/stale/competing-draft/external changes, byte-exact all runnable source and
unrelated references, Undo/Redo/reopen. Verify capabilities before focused Windows x64/
macOS ARM64 CI and changed-action native checks. Local handoff only for a named
required case CI cannot establish; reuse unchanged SDK/source/signing evidence.
Proposed new cumulative allowance per target:4package attempts,6editor launches,
4focused dispatches, effective only when this distinct outcome is selected. Draft Scene
allowance remains closed; count failures/cancellations/implicit launches and reassess
after two unsuccessful corrections of one hypothesis.
Complete implementation, focused checks, review and in-scope fixes; commit/push to the
existing branch and update canonical contracts/task/CURRENT/HANDOVER. Follow WORKFLOW
manual same-thread CI wait/resume and audit actual cases/artifacts. Return result,
limitations and next prompt; do not start the following deliverable.
```

### Generated Character cards selection — 2026-10-11

User selects one bounded editor-only card draft/update on the qualified reference,
prompt/context/proposal/transaction foundations. Fresh origin refs reconcile at
f03ea0f1f4d9ad36d0828e519a1635fb55e23861; clean retained Mac ARM64 checkout,
`codex/provider-qualification`, repository-only noreply identity, no reset.
One GPT-6.1 Sol High implementation owner, serial shared edits; independent read-only
review after implementation. Scope: selected saved story Beat and explicitly selected
approved references; one new card or one existing card replacement, core-owned record
and revision IDs, provenance, passive field and exact metadata review. Accept saves
one proposed revision in one transaction/Undo; explicit approval separately replaces
approved text. Rejection retains approved text. Generation cannot choose approval,
source paths, runnable definitions, Appearance assets, lore or tools.

Acceptance: exact reviewed dispatch; inert preview; one transaction/Undo; duplicate
refusal; approval separation; zero writes on malformed/cancelled/stale/competing/
external state; all runnable source byte-exact; Undo/Redo and reopen. Required focused
Windows x64/macOS ARM64 CI plus changed-action packaged native checks. Hosted Mac
lacks the approved signing identity: only the named signed changed-action native case
uses this retained local Mac; no signing-policy change or broader local handoff.
Per target fresh allowance: 4 package attempts, 6 editor launches, 4 focused dispatches;
currently Windows 0/0/0, Mac 0/0/0. Failures/cancellations/implicit launches count.
After two unsuccessful corrections of one hypothesis reassess before continuing.
Manual same-thread CI wait/resume; audit actual artifacts. Commit/push authorized;
no paid/public provider call, expansion, merge/release or following deliverable.
Full Phase 2 and final human acceptance remain outside this bounded closure.

### Generated card implementation and independent review — 2026-10-11

Implemented bounded `generateCard` on the existing exact-send/strict-response/proposal
owner, one references.json transaction and shared history. Core assigns IDs/provenance;
Accept saves proposed text; separate approval/rejection preserves/replaces approved
text explicitly. Plain nonmodal Story action, new/existing card selection, passive
field/exact metadata review, Settings prompt and frozen proposed library review.
Canonical architecture/context/data/UI/testing contracts updated.

Independent GPT-6.1 Sol High read-only review found four actionable defects before
packaging: proposed form mutation could bypass approval, missing nullable recordId
was accepted, nested extension data could be lost, supporting definition staleness
was omitted. Owner repaired these and follow-up stale inclusion/support-map handling.
Final review finds no actionable implementation defect; no reviewer writes/launches.
Supporting persistent source bindings cover only actually sent story/definitions;
transient all-source guards still protect acceptance. Missing authored links are retained.

Focused local core26, references12, prompts5 and renderer129 pass; actual production
controller/native credential reader/strictHTTP fixture passes exact body, inert review,
held-owner refusal, acceptance/Undo/Redo, malformed/cancel/stale zero writes and responsive
Save. New field/extension/dependency regression passes. Initial core fixture assertions
and controller reference-count assumption were harness defects, corrected with evidence;
one sandbox loopback denial resolved with authorized focused execution. Gate tests21
pass with one explicit Windows-only polling case unavailable locally (required on Windows).
Workflow actionlint/repository validation/JS and Python syntax/diff checks pass.
No package/editor/native acceptance is claimed yet. Windows0/4packages,0/6launches,
0/4dispatches; Mac0/4,0/6,0/4. Next: signed Mac package1 and native launches1–2,
then focused both-target CI dispatch1; audit artifacts after manual same-thread resume.

### Generated card signed Mac proof and CI wait — 2026-10-11

Implementation published as67faeaa8bd1a6f0a0c2596d204bc0e28230f49d6. Signed Mac
package attempt1 passes approved pin358372708164C7273A551D746449357C12A3A806,
strict signature and installer-content verification. Binary SHA256
dd0cc88fb44f0e0577d0077fb605cfcf13555c9c13e4e981ed9890314a032b79;
installer SHA256e4be29c9ad9004d09dbcdc515b131adb4e3eac1e184d31844cbd2e307cde6fc9.
Runtime input receipt binds the candidate/app inputs and binary; package privacy passes.
CUA observed light/dark/compact layout and physically clicked Generate, Save proposed
card and separate Approve in signed PID32017. Native25distinct checks and five exact
HTTP bodies pass: passive metadata/field review, proposal-only acceptance, old approved
pointer retained, duplicate refusal, byte-exact all runnable source, Save/approval Undo
and Redo, malformed/model-approval/cancel/stale external zero writes, project reopen.
Separate process PID32183 reopen3/3 retains exact metadata and custom prompt, reads
the native fixture credential, sends zero HTTP and writes no project bytes. Both exited;
terminal credential cleanup/profile references and owned fixture removal audited.
Native evidence privacy5files passes. No signing/trust/namespace changes. This is the
named local signed case unavailable on hosted Mac, not a broader local handoff.

**Pending operation:** workflow357322921 (`production-scaffold.yml`),
[run38083896396](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38083896396),
attempt1, `workflow_dispatch`, branch `codex/provider-qualification`, exact head67faeaa8bd1a6f0a0c2596d204bc0e28230f49d6.
Created2026-10-10T20:28:43Z; observed2026-10-10T20:28:48Z: overall queued,
Windows focused job114306261864 in_progress/setup, Mac automated job114306261970 queued.
Inputs: `generate_card=true`; draft/continue/dialogue selectors and upload_packages=false;
build ordinal1, first launch ordinal1, both reuse-run inputs empty. Generic jobs skipped
by selector as intended; required focused jobs remain pending, not passes.

| Target | Confirmed actual packages / launches / dispatches | Reservation | Unreserved remainder |
| --- | --- | --- | --- |
| Windows x64 | 0/4,0/6,1/4 at initial setup observation | package1,launches1–2 in recorded run | 3packages,4launches,3dispatches |
| Mac ARM64 | 1/4,2/6,1/4 | automated CI only; no package/editor launch | 3packages,4launches,3dispatches |

Windows actual starts/failures/cancellations must be reconciled from artifacts on resume;
reservation is not evidence of execution. No local owned editor/listener/fixture remains.
No autonomous Goal/watcher/polling: end this normal turn under manual same-thread policy.
User resume audits exact run/attempt/head, both required jobs, Windows package/input/
native capture identities and25+3/five bodies, Mac automated9checks, all focused counts,
privacy and cleanup. Unchanged SDK evidence1320d0a/run38056790759 is explicit reuse,
not a new execution. Docs-only wait successor does not replace the runtime candidate.
Required CI acceptance and final independent evidence audit remain pending; no bounded
closure/full Phase2/human acceptance claim. Continue in-scope fixes within allowance,
then record acceptance and return the next proposal-only prompt without starting it.

### Generated card first CI failure and correction — 2026-10-11

User resumed the same thread to audit run38083896396 attempt1 and diagnose/fix before
another dispatch. Fresh local/origin refs reconcile at55ef6e5; clean checkout retained.
Recorded candidate67faeaa remains the tested runtime. Terminal overall failure:
Windows focused worker5/6 fails `ordinary_external_configuration_change_and_project_session_reject_results`;
server read reports `TimedOut` at ai_requests.rs491 then join panic628. The test built
the entire project fixture after opening the stalled request's two-second socket
deadline. Mac worker6/6 and automated9checks pass. This is diagnosed fixture timing,
not proof of a product cancellation defect; corrected Windows execution remains required.

Owner moves only fixture construction/drop before starting the request, keeping the
original host unopened and captured session None. Actual open_path still expires it.
Two-second deadlines, expired/null completion, finish/socket EOF and shutdown assertions
remain unchanged. All six worker tests pass locally; production code before cfg(test)
is byte-identical. Independent GPT-6.1 Sol High read-only review finds no actionable
correction defect; diagnosis is consistent with the retained failure, and Windows must
confirm it. No reviewer writes/tests/packages/editor launches.

Actual artifacts audited: Windows11681444634,37 manifest hashes; Mac11681780109,13
manifest hashes. Both245input inventories match exact head/tree, with only repository-
prescribed CRLF .ps1 checkout normalization. Raw Windows renderer129/core26/prompts5/
references12/transport8/controller pass; native-worker5/6 fails. Package/privacy passes,
binary SHA256f2d706c5f6831738c2b07050254fee9df5f406545eae2670a924ed65d945b2d4.
Ledger proves one package attempt, no editor launch; native stage skipped and both
phase reports absent, so no Windows acceptance/cleanup claim. No fixture was started.
Mac actual9checks includes worker6/controller/reference12; no package/editor launch.
SDK receipts explicitly reuse prior qualified runtime evidence; no new SDK execution.
Downloaded artifact privacy52files passes. Failure/results/manifests retained unchanged
in ignored evidence; no gate weakened. Repository validation496files/diff check pass.

Current actual totals Windows1/4packages,0/6launches,1/4dispatches; Mac1/4,2/6,1/4.
First correction of this hypothesis passes locally; no repeated unsuccessful correction.
Next fresh focused dispatch2 selects build ordinal2/first launch1, no reuse/upload/
generic matrix. Windows reserves one package and two launches; Mac automated repeat
checks the changed test only, signed native evidence remains valid because production
code is unchanged. Required corrected CI/native proof and final evidence review pending.

### Generated card corrected CI wait — 2026-10-11

Correction/failed-run audit published asf1a1a8bffd74b542f1b87d744454a067017b0131;
production inputs retain67faeaa behavior, only cfg(test) worker fixture setup changed.
Confirmed fresh workflow357322921 (`production-scaffold.yml`)
[run38085719737](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38085719737),
attempt1, branch `codex/provider-qualification`, exact headf1a1a8bffd74b542f1b87d744454a067017b0131.
Created2026-10-10T20:56:43Z; observed20:56:48Z overall queued,
Windows114311669919 in_progress/setup, Mac114311669778 queued. Inputs generate_card=true;
draft/continue/dialogue/upload_packages=false; build ordinal2, first launch1, both reuse
inputs empty. Focused dispatch cumulative2 each; generic jobs deliberately skipped.

Confirmed actual Windows1/4packages,0/6launches,2/4dispatches; reserves package2,
launches1–2. Confirmed Mac1/4packages,2/6launches,2/4dispatches; no native/package
reservation. Windows unreserved remainder2packages/4launches/2dispatches; Mac
3packages/4launches/2dispatches. Reconcile actual starts/failures from new artifacts on
resume; no implicit retry. Original failure remains separate. No local owned process,
listener or fixture. Manual same-thread end of normal turn; no Goal/watcher/polling.
On user resume audit exact new run/attempt/head, corrected Windows worker6/6, required
native25+3/five exact bodies/six native stages/nine captures, package and input/binary
identities, Mac9actual automated checks, privacy/cleanup and allowance. Valid signed
Mac proof remains reusable; test-only change does not require another signed package.
Complete remaining independent evidence review and in-scope fixes, then bounded closure,
commit/push and next proposal-only prompt. No next deliverable started.

### Generated card second CI audit and independent reassessment — 2026-10-11

User resumed recorded run38085719737 attempt1 and requested a fresh GPT-6.1 Sol High
subagent assessment of both failures and milestone changes, with a concrete fix plan.
Fresh local/origin refs reconcile atbc9a9c2; clean checkout retained. Exact tested
candidatef1a1a8b. Terminal overall failure, Windows job114311669919 failed, Mac job
114311669778 passed. The first worker correction is established: Windows worker6/6
passes in1.12seconds. Second failure is a different hypothesis, transport7/8:
`cancellation_aborts_stalled_headers_and_body_and_before_connect` reports server read
TimedOut/Windows10060 at ai_request.rs818, then client elapsed<2seconds assertion837
fails; total2.03seconds. It is unclear whether headers/body or transport/test timing.
Cancelled return alone cannot establish prompt cancellation: server timeout/drop may
have released the client. No harmless-harness or product-defect conclusion yet.

Actual artifacts11682841627Windows/11682252169Mac audited:37/13manifest hashes,
245input hashes each match head/tree with only prescribed PowerShell CRLF. Windows
renderer129/core26/prompts5/references12/worker6/controller pass; transport7/8 fails.
Package/privacy pass, binary SHA256
2db3be3277a9a85ff6cfee072d6973b9a3c9f973263885de116da052ee4a6de3.
Ledger records package ordinal2 only, no editor launch. Native stage skipped, both
phase reports absent; no Windows acceptance/cleanup claim, no fixture started. Mac
actual9checks pass, no packages/launches. SDK receipts explicitly reuse prior runtime
evidence. Downloaded privacy52files passes; original failure evidence retained unchanged.

Actual cumulative Windows2/4packages,0/6launches,2/4dispatches; Mac1/4,2/6,2/4.
Remaining Windows2packages/6launches/2dispatches, Mac3packages/4launches/2dispatches.
No pending CI/reservation/owned local process/listener/fixture. No third dispatch or
runtime mutation during assessment. Fresh independent reviewer is read-only, no tests/
builds/launches/network; its reviewed plan follows before any new execution selection.
First hypothesis corrected successfully; second newly observed cancellation failure
requires evidence-based discrimination, preserving two-second gates and no blind retry.

#### Independent plan and reviewed diagnostic correction

Fresh GPT-6.1 Sol High subagent independently assessed both failed artifacts, the full
milestone diff and prior correction. No additional actionable generated-card defect:
closed schema/nullable target, core IDs/provenance, one metadata mutation, passive review,
separate approval/prior text preservation, extension/staleness/history/source boundaries
remain sound. Windows changed-action integration is missing, especially physical Approve
scroll/focus/UIA, exact Save/review text and six receipts/nine captures. The first fixture
correction is established; second transport diagnosis remains provisional. Socket
publication/cancel flag share the correct mutex handoff; no obvious lost-cancel race.
Ignored shutdown errors and unlabelled header/body phases prevent precise diagnosis.

Reviewed plan:1 preserve failure as separate hypothesis;2 add test-only phase/shutdown/
elapsed diagnostics and synchronize server EOF deadline to cancellation, keeping
immediate request-ready cancellation and both two-second gates;3 require raw focused
success before generated-card packaging and prevent cache promotion on skip;4 review
and focused local checks;5 one coherent both-target CI attempt, continuing to native
only after focused passes. A separate diagnostic-only dispatch wastes finite allowance.
If it fails, discriminate from new phase/raw-OS/shutdown/elapsed evidence before final
dispatch; a demonstrated production socket failure requires a narrow transport repair
and affected native requalification. No deadline inflation/sleep/retry/blanket test skip.

Owner implemented this plan. Test-only shutdown observation and header/body messages,
bounded completion channel, common cancellation instant for worker and actual EOF;
socket ownership/successful shutdown/Cancelled/EOF are explicit. Cancellation still
immediate after original request-ready, no wait for reception. Production shutdown
behavior is unchanged. `--nocapture` both recipes retains phase observations and raw OS
errors. Workflow build prerequisite scoped to generate_card; terminal audit remains
always, retains produced partial failures but never a skipped build's cached executable.
Regression proves skipped/failed cases cannot pass terminal audit or promote cache.

Independent exact-patch review reports no blocker/weakened gate; optional raw OS error
detail included. Reviewer performed no edits/tests/builds/launches/network/dispatch.
Local final transport8/8: both phases owned socket, shutdownOk/EOF, completion<0.2ms;
worker6/6 passes. Package gate7pass/oneWindows-only case pending there; syntax/actionlint/
repository496files/diff checks pass. Python bytecode sandbox-cache refusal repaired by
workspace cache prefix, no expensive allowance consumed. Local green does not establish
Windows root cause. Next fresh dispatch3/build3/firstlaunch1; Windows conditional package
3 and launches1–2 reserved only if prerequisites pass. Existing signed Mac proof retained:
test observation/fixture and workflow changes introduce no production cancellation policy
change. Acceptance remains pending actual corrected Windows/native and final artifact audit.

### Generated card independently reassessed CI wait — 2026-10-11

Reviewed diagnostic/prerequisite plan and patch published as
3246190b5052966035796758619748397197f0c5. Confirmed fresh workflow357322921,
[run38090637300](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38090637300),
attempt1, `workflow_dispatch`, branch `codex/provider-qualification`, exact head3246190
above. Created2026-10-10T22:13:56Z; observed22:14:01Z overall queued,
Windows114326170036 setup/in_progress, Mac114326169859 queued. Inputs generate_card=true;
draft/continue/dialogue/upload_packages=false; build3/firstlaunch1, both reuse IDs empty.
Generic jobs deliberately skipped; required focused cases pending.

Actual confirmed Windows2/4packages,0/6launches,3/4dispatches; Mac1/4,2/6,3/4.
Windows conditionally reserves package3/launches1–2 after successful prerequisites;
Mac has no package/native reservation. Unreserved Windows1package/4launches/1dispatch,
Mac3packages/4launches/1dispatch. Actual new starts/skips/failures must be reconciled
from artifacts; reservation is not execution. Prior failures remain separate, first
worker hypothesis corrected, second cancellation hypothesis now instrumented, no
production cancellation-policy repair claimed. No local owned process/listener/fixture.

Manual same-thread end of normal turn; no autonomous Goal/watcher/polling. Resume audits
exact recorded run/attempt/head, raw header/body owned/shutdown/OS/elapsed observations,
transport8/worker6/core26/prompts5/references12/renderer129/controller, actual conditional
package inputs/binary, Windows native25+3/five exact bodies/six stages/nine captures,
Mac9checks, privacy and cleanup. If focused fails, skipped package/native remain missing
and cache cannot be promoted. Classify new evidence before selecting the final dispatch.
If all required cases pass, complete independent artifact review/acceptance and publish
closure/result/limits/next proposal-only prompt. No following deliverable started.

### Generated card third CI audit and exact-handle repair — 2026-10-11

User resumed run38090637300 and requested a clear account of three consecutive
failures. Fresh refs reconcile clean at9facb23; retained Mac ARM64 session, no reset.
Exact run attempt1/candidate3246190, terminal failure. Windows114326170036 ended
2026-10-10T22:24:19Z; Mac114326169859 succeeded22:16:51Z.

The failures concern two distinct problems. Run38083896396 constructed a project
fixture after starting a two-second worker timer; moving construction earlier fixed
that case, and both later Windows runs establish worker6/6. Run38085719737 then failed
partial-response cancellation. Run38090637300 added discriminating diagnostics and
package gating, but left production cancellation unchanged, so it exposed the same
fault again. That third dispatch established the failed phase/handle rather than
fixing it; no claim that all three were unrelated or that local green proved Windows.

Raw transport7/8: stalled headers owns socket, shutdownOk, completion239.3microseconds,
server EOF37.4microseconds. Partial body owns socket, shutdownNotConnected/Windows10057,
completion2.0095955seconds, server TimedOut10060 after2.0256242seconds. This is a Windows
cancellation/cleanup failure, not harmless timing: the server never observes timely
EOF and the worker remains blocked. Core26/prompts5/references12/renderer129/controller/
worker6 pass. Required Windows native remains missing.

Actual artifacts11684286059Windows (SHA256331323f51b85c1a9c167678d4cb692607c827a5f168db39ab4761e3f339c0bf9)
and11684120789Mac (SHA256de20df1b4e98199730b58489fc147f77aa924dcf439cc1b9d59ce87eb88f2432)
audit26/13manifest hashes and245input hashes each against the exact Git tree; only
prescribed PowerShell CRLF differs on both hosts. Download privacy41files passes.
Mac9actual checks pass, no package/launch. Windows package/native steps skipped, no
attempt ledger/executable/native report/fixture. Conditional reservation released;
actual cumulative Windows2/4packages,0/6launches,3/4dispatches; Mac1/4,2/6,3/4.
Remaining Windows2packages/6launches/1dispatch; Mac3packages/4launches/1dispatch.

Fresh independent GPT-6.1 Sol High reviewer reassessed actual raw observations and
ureq body ownership. The app's cancellation descriptor is introduced with try_clone;
ureq moves the same connection into its body handler. Narrow selected repair shares
one actual TcpStream through Arc between cancellation and transport, eliminating
that avoidable separate-handle path. This does not establish that Rust's documented
clone semantics are generally defective, or prove the exact Winsock internal cause.
Windows confirmation is required. No ignoredNotConnected, retries, polling, sleep,
timeout inflation or weakened EOF assertion. Publication mutex/flag recheck and
one-second connect/response bounds remain. Canonical architecture/ADR/testing updated.

Independent exact-patch review found no actionable defect or weakened gate. Local
transport8/8, worker6/6 and actual generated-card controller pass; both phases report
shutdownOk, Cancelled and EOF well within2seconds. Initial sandbox fixture binds
refused and were rerun with authorized loopback capability; no package/launch/dispatch
used. cargo fmt --check reports broad pre-existing differences, so no unrelated
reformat was applied; focused diff whitespace remains checked. Production repair
requires renewed coherent signed Mac package2/native launches3–4 before final focused
dispatch4, Windows build3/firstlaunch1 with focused-success prerequisite retained.
Prior outcome allowances stay closed. No acceptance/closure until actual Windows/native
and final artifact audit. No following deliverable started.

#### Renewed signed Mac native proof before final dispatch

Repair8a230a9619ec7504f1a91dc8504e6e9667108190 committed/pushed. Package attempt2
and editor launches3–4 completed on the retained Mac, named signed native capability
unavailable in hosted CI. Approved identity/name/requirement unchanged. Strict signature
and actual installer-content verification pass. Binary SHA256
f917c0c3295404f666a8b8d7be8bf5d30974f8820c2e536214b4596366e46984;
DMG SHA25605860d271e4e9d9a8d67e9223086f0f05a6f51ee516ea7f1a30d1aee0199b9b7.
246input hashes match exact Git candidate. Package privacy7files/native5files pass.

Actual packaged phase1 has25distinct checks/five exact reviewed and HTTP bodies;
phase2 has3checks/zeroHTTP/all project bytes unchanged. CUA observed light/dark/720
logical-width compact exact review, physically clicked Generate once, Save once,
and separate Approve once after reviewing retained approved/proposed text. Script
asserts inert preview, duplicate refusal, core IDs/provenance, prior approval retained,
byte-exact runnable source, acceptance/approval Undo/Redo, malformed/model-approval/
cancelled/stale zero writes and reopen. Native reports are automated with CUA physical
operation, not final human acceptance. No extra implicit launch: OS process inventory
confirmed only owned binary39065; separate reopen39163. Both exited, credential cleanup
reported, owned disposable fixture removed after recording source/metadata hashes.
Ignored local receipts retain all evidence; historical Mac package1 remains unmodified.

Actual cumulative Mac2/4packages,4/6launches,3/4dispatches; Windows2/4packages,0/6launches,
3/4dispatches. Final both-target dispatch4 reserves Windows package3/launches1–2 only
if focused prerequisites pass; Mac automated9checks adds no package/launch. Remaining
Mac2packages/2launches, Windows2packages/6launches, each1dispatch before submission.
No local owned process/listener/fixture remains. Independent exact-repair review clear;
final renewed-evidence review precedes dispatch. Bounded acceptance remains pending
Windows cancellation/native and final actual-artifact audit.

### Generated card exact-handle final CI wait — 2026-10-11

Independent GPT-6.1 Sol High renewed-evidence review verified all246inputs/tree/binary/
DMG/signing, actual25+3reports/five exact bodies/zeroHTTP reopen/equal metadata,
CUA observation and cleanup receipt. No blocker found. Fresh retained privacy output
native5/package7files. Existing raw failures and prior package/native remain intact.

Confirmed workflow357322921,
[run38093296977](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38093296977),
attempt1, workflow_dispatch, branch codex/provider-qualification, exact candidate
8a230a9619ec7504f1a91dc8504e6e9667108190. Created2026-10-10T22:57:04Z; last observed
22:57:22Z in_progress. Windows114333962162 and Mac114333962141 in_progress;
generic Preflight/matrix deliberately skipped. Inputs generate_card=true, all other
selectors/upload_packages=false, build3/firstlaunch1, both reuse IDs empty. Docs-only
successor records proof/wait and never substitutes for the exact tested candidate.

Actual cumulative Windows2/4packages,0/6launches,4/4dispatches; Mac2/4packages,
4/6launches,4/4dispatches. Windows package3/launches1–2 conditional on focused pass;
reservation is not actual execution. Confirmed remaining Windows2packages/6launches,
Mac2packages/2launches; focused dispatch allowance exhausted on both targets. Prior
allowances stay closed. Count actual starts/failures/cancellations/skips from artifacts;
no additional dispatch/job rerun authorized. No local owned process/listener/fixture.

Manual same-thread normal-turn end, no autonomous Goal/watcher/status polling. Resume
must audit exact run/attempt/head/refs and actual terminal artifacts: Windows transport8
with both shutdownOk/Cancelled/EOF<2secs, worker6/controller/core26/prompts5/references12/
renderer129, conditional package/input/binary, native25+3/five bodies/six PID/action
receipts/nine intact captures; Mac9actual checks, manifest/input hashes, privacy/cleanup
and actual allowance. Failed/skipped/missing is not accepted. If required proof passes,
finish independent artifact review, bounded acceptance and canonical task/CURRENT/
HANDOVER closure commit/push, result/limitations/next proposal-only prompt. If it fails,
record diagnosed blocker and stop dispatch execution under exhausted allowance;
remaining cheap in-scope review/fixes do not imply extra CI. No next deliverable,
merge/release, provider/signing expansion, paid/public calls, generated lore or runnable
Character/Appearance changes. Full Phase2/final human acceptance remain separate.

### Generated Character cards qualified closure — 2026-10-11

User resumed recorded run38093296977 to audit actual evidence and close only this
selected outcome within its allowance. Fresh local/origin branch refs reconcile at
728c7cddb71206b6dd4f2fd68766349e1858ae3d, origin/main5f448ca unchanged; clean retained
Mac ARM64 checkout, repository-only noreply identity, no reset. Runtime candidate
8a230a9619ec7504f1a91dc8504e6e9667108190 (treeed3934caeac5cc5aa8513965d3dfada0b61b91af)
contains implementation67faeaa, worker fixture correctionf1a1a8b, diagnostics/package
prerequisite3246190 and independently reviewed exact-handle cancellation repair.
Successor728c7cd changes only task/CURRENT/HANDOVER; runtime inputs remain identical.
This docs-only closure does not replace the tested candidate or require another package.

#### Final CI and actual artifact audit

Workflow357322921, [run38093296977](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38093296977),
attempt1, workflow_dispatch, branchcodex/provider-qualification, exact8a230a9 candidate
above, terminal **success** at2026-10-10T23:08:17Z. Required Windows114333962162
succeeded23:08:16Z; Mac114333962141 succeeded22:59:41Z. Actual inputs generate_card=true,
all other selectors/upload_packages=false, build3/firstlaunch1, both reuse IDs empty.
Generic Preflight/matrix deliberately skipped; no required focused/native case skipped.
SDK download/execution omitted; prior qualified runtime evidence explicitly reused
under the selected metadata-only contract.

Artifacts11685720298Windows/11684614330Mac retained and downloaded. API artifact digests
SHA2560dc897e5a024ca110b9dac4cca4d670e39db3a1edc8ac6f460b951446d1b16f6 and
fbf0d67c2acdf49f9538d1fc72073c24e9b5459d5a04dd7397308fec97e6600b respectively.
All71Windows/13Mac manifest hashes verified against actual files;245focused input hashes
per target and246Windows packaged input hashes verified against the exact Git candidate.
Only .gitattributes-prescribed PowerShell CRLF conversion differs on both hosts; no
blanket source normalization/exemption. Package/identity/tree/action/run/attempt bindings
match. Windows retained executable SHA256
3838e4f300e4457bc8dfce7f7f6dd6693ea2dc63f6e5fba05a3a50e9eb1f0ebb;
setup SHA256d838dd2e76c9b5f6ee08e388fbac7d5c3563d7f48a8c99da607de539bff68385;
MSI SHA256ae7b3d0325c440b34269c30d461c454c54d5f64cf570beee1da8a08c1cbf4bab.
Actual package build3 passes; no cache/reuse promotion substitutes for this build.

Both targets establish core26/prompts5/references12/renderer129/transport8/worker6 and
actual controller exact-schema HTTP proof. Mac9actual automated checks all pass with
0package/0editor launches. Windows worker6 completes0.89seconds. Decisive raw transport
observations: stalled headers owned/shutdownOk, completion344.2microseconds/serverEOF37;
partial body owned/shutdownOk, completion153.2microseconds/serverEOF22.4. Both return
Cancelled and satisfy unchanged <2second worker/EOF bounds. Mac observations likewise
prompt/Ok. This establishes the repaired Windows cancellation behavior; it does not
prove a general Rust clone defect or the precise internal Winsock cause.

Windows native wrapper records launch1PID7944 and separate reopenlaunch2PID3460, same
exact packaged binary.25distinct phase1 checks (26listed, one repeated foundation check)
and3separate-process checks pass; five reviewed/actual HTTP body hashes match exactly.
Six generateCard stage receipts bind action/PID/binary, actual UI Automation/OSSendInput,
viewport and light/dark/compact evidence; nine captures pass SHA256/PNG/dimension/
nonblank/change validation. Compact and physical Approve before/after pixels inspected:
Approve is visible and the approved saved state follows the action. Generate creates
an inert preview; Save creates proposed metadata once with old approval retained;
separate Approve supersedes it. One acceptance Undo/Redo and separate approval Undo/Redo
restore exact library bytes. All runnable source stays byte exact. Malformed/model
approval/cancelled/stale external cases refuse without writes. Reopen sends0HTTP and
changes0project bytes; all four reported metadata hashes equal both phases and cleanup
receipt. Terminal audit has all actual outcomes success and no errors. Owned fixture
root removal and credential-reference removal reported, both native terminal cleanup
reports pass; no surviving fixture/controller/editor operation is pending.

CI privacy scans Windows69evidence/6package and Mac12files pass. Downloaded combined
artifact privacy86files passes. SDK receipts explicitly reuse qualified official pinned
runtime candidate1320d0a6507625abdd3fa20aa6a3eccffaccfcd6/run38056790759; this card-only
metadata mutation adds byte-exact source proof, not a new SDK execution claim.

Renewed signed Mac package2/native launches3–4 on exact8a230a9 remains the coherent
changed-action native proof. Approved identity/name/requirement/signing policy unchanged;
strict signature and actual installer contents verified.246exact inputs, retained
binaryf917c0c3/DMG05860d27 full hashes in prior proof section, CUA physical Generate/
Save/Approve, light/dark/720logical compact,25distinct+3/five exact bodies/0HTTP reopen,
history/refusals/source preservation and scoped credential/process/root cleanup pass.
Package7/native5file privacy passes. This named local capability is required because
hosted Mac lacks approved signing credentials; no further local handoff/repeated launch.

#### Acceptance, review and closed allowance

Selected outcome **accepted and complete**: one bounded new/update editor-only Character
card from a saved ordinary Beat and explicitly selected approved references, core-owned
IDs/revision/provenance/supporting citations, passive field/exact metadata review,
exact prepared dispatch, one Save transaction/Undo and duplicate refusal. Generation
cannot approve itself. Existing approved text remains until separate explicit replacement
approval; Reject retains it. Shared history and reopen preserve IDs/status/provenance/
unknown extensions and all runnable source bytes. Focused core/controller assertions
also establish new-card acceptance, replacement rejection, malformed responses, missing
recordId/wrong target/unsafe/oversized fields, competing request/draft/session/prompt/reference/source-identity/
external-edit zero writes, generated manual-approval bypass refusal, stale supporting
story/Character/default-source approval and later reference-inclusion refusal.

Independent GPT-6.1 Sol High implementation/failure reassessment/exact-repair reviews
and final read-only actual-artifact audit find no actionable acceptance blocker. Final
review separately verifies manifest/input/package/capture identities, raw cancellation
bounds, native25+3/five bodies, source/history/approval boundaries, cleanup and totals.
Reviewer performed read-only hash/gate validation, no writes/network/tests/builds/apps/
dispatch. Owner audited the same evidence and inspected native captures; no broad tests
or expensive repeats. Canonical context/UI/testing/architecture/ADR/data contracts retain
the delivered semantics; closure links and roadmap/live status reconciled.

Unique failed evidence remains unchanged: run38083896396 worker fixture setup consumed
its deadline, corrected and later6/6; run38085719737 partial-response cancellation failed;
run38090637300 instrumentation left production unchanged and diagnosed the same Windows
shutdown10057/noEOF fault. Third run was diagnostic progress, not a production fix or
native pass. Final exact-handle repair establishes successful cancellation without
deadline inflation, ignored errors, sleep, polling, retry or skipped required gates.
Pre-existing broad cargo fmt differences were not reformatted or claimed as a pass.

| Target | Actual cumulative package attempts | Actual editor launches | Focused dispatches | Unused remainder, now closed |
| --- | --- | --- | --- | --- |
| Windows x64 | **3/4** | **2/6** | **4/4** | 1package,4launches,0dispatches |
| Mac ARM64 | **2/4** | **4/6** | **4/4** | 2packages,2launches,0dispatches |

Actual attempt ledgers include failures/cancellations/implicit starts; reservations
were never counted as execution. No outstanding reservation, pending CI, owned native
process/listener/fixture or required in-scope work. Prior allowances remain closed;
this outcome's unused remainder closes here and cannot fund the following deliverable.
No runnable Character/Appearance/asset changes, generated lore, provider expansion,
paid/public provider calls, signing changes, merge or release. Agent/automated native
acceptance is distinct from full Phase2/2C.3/2C.4 and final human acceptance. Controlled
synthetic loopback evidence does not establish live Studio or generic-provider coverage.
The following deliverable is proposed only, not started.

#### Generated lorebook entries next prompt — proposal only

```text
Deliver Generated lorebook entries: draft/update one bounded editor-only entry, review
exact changes, accept once, explicitly approve, Undo/Redo and reopen while preserving
runnable source and existing approved reference text until replacement approval.
Repository: Caldwell-41/Renpy-editor
Continuation: codex/provider-qualification, published Generated Character cards closure
atop qualified8a230a9619ec7504f1a91dc8504e6e9667108190/run38093296977. Reconcile fresh refs;
do not reset. Retain the current Mac ARM64 session.
Read AGENTS.md, CURRENT, HANDOVER and the active phase-2 task sections6–11 and20.
Record selection/acceptance in that task. One GPT-6.1 Sol High owner; shared edits
serial, independent review. Reuse qualified references/prompts/context/proposals/history.
Scope one entry with core-owned ID/revision, provenance, explicit applicability and
supporting citations; passive semantic/exact metadata review. Generation cannot approve
itself. Preserve prior approval until separate replacement approval; Reject retains it.
Keep UI wording plain. Prove exact dispatch, inert preview, one transaction/Undo,
duplicate refusal, approval separation, zero-write malformed/cancelled/stale/competing/
external refusal, byte-exact runnable source, Undo/Redo and reopen.
Use focused Windows x64/macOS ARM64 CI and changed-action native checks. Local handoff
only for a named required capability CI cannot establish. Proposed fresh allowance per
target:4package attempts,6editor launches,4focused dispatches. Prior allowances closed;
count failures/cancellations/implicit launches, reassess after two unsuccessful
corrections of one hypothesis. No automatic keyword/recursive injection, runtime-state
inference, runnable Character/Appearance/source changes, provider expansion, paid/public
calls, signing changes, merge or release. Complete implementation/checks/review/in-scope
fixes; commit/push and update canonical contracts/task/CURRENT/HANDOVER. Follow manual
same-thread CI wait/resume and audit actual artifacts. Return result, limitations and
next prompt. Do not start the following deliverable.
```


### Generated lorebook entries selection — 2026-10-11

User selects one bounded new/update editor-only lore entry on qualified candidate
`8a230a9`/run `38093296977`, closure `f25605d`. Fresh origin refs match the clean
retained Mac ARM64 checkout on `codex/provider-qualification`; main remains `5f448ca`.
No reset or unrelated edits. One GPT-6.1 Sol High owner; serial shared implementation
and independent GPT-6.1 Sol High read-only review. Reuse reference/prompt/proposal/
approval/history foundations. Core owns IDs, provenance and supporting citations;
author reviews applicability. Exact passive semantic/metadata review precedes one
Save of proposed text. Separate explicit approval supersedes existing approved text;
Reject retains it. Unknown extensions and unresolved links survive. Stale support
blocks approval/inclusion. No model approval or runnable-source mutation authority.

Acceptance: exact dispatch, inert preview, one Save transaction/Undo, duplicate refusal,
approval separation, zero-write malformed/cancelled/stale/competing/draft/external
refusal, byte-exact runnable source, Undo/Redo and project/process reopen. Focused
Windows x64/macOS ARM64 CI and changed-action native proof; the named approved signed
Mac native capability remains local because hosted CI lacks that signing identity.
Fresh per-target allowance: 4 packages, 6 editor launches, 4 focused dispatches;
Windows 0/4,0/6,0/4; Mac 0/4,0/6,0/4. Prior allowances closed. Count failed/cancelled/
implicit attempts and reassess after two unsuccessful corrections of one hypothesis.
Commit/push authorized; manual same-thread CI wait/resume and actual artifact audit.
No keyword/recursive injection, embeddings, runtime inference, runnable Character/
Appearance/source changes, provider expansion, paid/public calls, signing changes,
merge/release or following deliverable. Implementation/evidence/final human acceptance
remain distinct.


### Generated lore implementation and independent review — 2026-10-11

Implemented `generateLore` using the exact-send/strict-response/session proposal owner
and shared generated-reference planner/history. Author-selected applicability is
reviewed; model returns only text/category/subject/tags/knowledge notes. Core owns
IDs/provenance/support/citations. One Save creates proposed text; separate reviewLore
approves/rejects the exact revision, retaining prior approval through Save/Reject.
Plain Story/Assist/Lorebook/Settings controls provide passive semantic and exact
metadata review. Unknown extensions, scope/knowledge and unresolved links/citations
remain. Supporting-source and cited-reference freshness blocks approval/inclusion.
Canonical architecture/context/data/UI/testing contracts updated.

Independent GPT-6.1 Sol High read-only review identified scope validation rejecting
every prepare (product defect), lore support issues checked only for cards (product),
stale cited-reference support behind unchanged approved IDs (shared product defect),
and Windows SDK-reuse action label (harness). Owner repaired each before packaging.
Reviewer then found old route Scene IDs restored by recursive revision merge after
selecting whole project (product); owner assigns already-merged content exactly and
adds semantic/exact/saved scope equality with extension preservation. Final independent
pre-package re-review finds no actionable blocker. Reviewer made no shared edits or
package/launch/dispatch attempts.

Renderer131 passes; controller through actual native credential reader/HTTP/core passes
exact send, inert review, held-owner refusal, one Save/Undo/Redo, explicit approval,
malformed/cancelled/stale zero writes and responsive Save. Sandbox loopback EPERM was
an environment limitation, resolved by authorized focused execution. Initial lore
core failures reproduced the empty synthetic scope defect; one later cited-support
fixture expected a Character path absent from selected narration's read set (harness),
corrected to an extra guard-only source excluded from sent/persistent own support.
The cited-support and route-to-project regressions pass. Full focused final run in
progress; earlier full34 already passes. Rejecting gates28 pass with one explicit
Windows-only native polling skip requiring Windows. Repository validation, actionlint,
JS/Python syntax and diff checks pass. No broad formatting pass is claimed.

No package/editor launch or CI dispatch yet: Windows0/4,0/6,0/4; Mac0/4,0/6,0/4.
Existing approved public signing identity is available through the package script's
matching-identity query; its known self-signed trust status is unchanged. Next is final
focused verification, signed Mac package1/native1–2, then isolated both-target CI1.
No bounded acceptance claim until actual native/CI artifacts are audited.

Final local focused inputs: core34/reference12/prompt5/renderer131 pass; transport8
and worker6 pass with exact loopback capability (initial sandbox four-listener
PermissionDenied failures classified environment, no product repair). Final actual
controller and build pass. All product/harness repairs were confirmed before any
package/editor launch or CI dispatch. Current remote workflow inventory has no
pending operation; last run remains the qualified Character cards run38093296977.


### Generated lore native audit and CI1 — 2026-10-11

State **`awaiting_ci`**. Published implementation candidate
**`233454b4a0ae4c369d00c2dcd352c789829290b2`**, tree
`e467eeeea0b83d92ea799b54e7751b8fbe185a11`. Fresh remote branch still matches this
candidate; main remains5f448ca. No other pending workflow existed before dispatch.

Signed Mac package1 passed strict signature, approved identity/designated requirement
and mounted-installer content verification. Executable SHA256
`6bd847ea76c4bb279ace79ae4cfcf0baa1c892192034253e42c2729f04e09b49`, installer
`b6f3db892b1cffe827ef3848eceb2ba0921a023e14fb6bbadbe2bdcd82fc3ca1`.
Native launches1–2 passed25 distinct phase1 +3 process-reopen checks. Owner observed
light/dark/compact send UI and physically clicked Generate, Save and separate Approve
through CUA. Passive semantic and exact metadata disclosure, inert markup, one Save,
duplicate refusal, proposed/approved separation, approval Undo/Redo, unchanged runnable
source, malformed/model-approval/cancelled/stale-external zero writes and project reopen
passed. Five actual HTTP body digests equal reviewed digests. Process reopen sends zero
HTTP and preserves all metadata hashes/custom prompt/credential readability.

Owner and independent GPT-6.1 Sol High reviewer audited248 exact Git input hashes,
matching tree/binary/installer and complete reports. No native acceptance blocker.
Reviewer sandbox could not establish certificate trust/process inspection; owner
approved-host strict verification and exited-process/listener checks establish those
capabilities. No signing/trust change. Disposable profile/credential development
generation and fixture removed after probe credential-record cleanup. Local evidence
retained under ignored `.toolchains/lore-mac-native-01`, output logs, package receipts,
privacy reports and attempt ledger. Visual actions are owner-observed agent evidence,
separate from final human acceptance. No new SDK execution: unchanged source/runtime
proof1320d0a/run38056790759 reused because this action changes no runnable bytes.

User expressly authorized polling **all CI runs in this chat** and review/fix/rerun,
overriding earlier manual same-thread no-polling directions for this chat. Finite
allowance remains unchanged; failures must be classified before corrections/redispatch.
Confirmed focused run[38105665896](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38105665896),
workflow357322921 (`production-scaffold.yml`), attempt1, branch
`codex/provider-qualification`, head233454b4a0ae4c369d00c2dcd352c789829290b2,
created/last observed queued2026-10-11T02:35:48Z. Exact inputs: generate_lore=true;
generate_card/draft_scene/continue_scene/dialogue_rewrite_windows/upload_packages=false;
rewrite_build_ordinal=1, rewrite_first_launch_ordinal=1; both reuse IDs empty.
Windows x64 package/native and macOS ARM64 automated jobs only; generic matrix skipped
by selected scope, packages not published. Actual jobs/artifacts must be audited.

Cumulative actual use: Mac1/4packages,2/6launches,1/4dispatches; Windows0/4packages,
0/6launches,1/4dispatches before runner artifact audit. Windows build1/launches1–2
reserved by CI1; count actual failed/cancelled/implicit attempts from artifacts.
Review/fixes remain serial. No full bounded acceptance claim until required CI cases,
input identity, native artifacts and independent final audit pass. No next deliverable.


### Generated lorebook entries qualified closure — 2026-10-11

Selected outcome **accepted and complete** on implementation candidate
**233454b4a0ae4c369d00c2dcd352c789829290b2**, tree
`e467eeeea0b83d92ea799b54e7751b8fbe185a11`. Published checkpoint c3be621 changes only
task/CURRENT/HANDOVER; this closure also changes documentation only and does not replace
the tested runtime candidate. Retained Mac ARM64 host; origin/main 5f448ca unchanged,
repository-only noreply identity, clean candidate/refs and no reset/unrelated changes.
User expressly authorized polling all CI in this chat, superseding earlier no-polling;
no new allowance or following outcome authorization was inferred.

#### Required CI and artifact evidence

Workflow 357322921 production-scaffold.yml,
[run38105665896](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38105665896),
attempt1, workflow_dispatch, branch codex/provider-qualification, exact candidate above,
terminal **success** at 2026-10-11T02:48:47Z. Windows job 114370557450 succeeded at 02:48:46Z;
Mac ARM64 job 114370557543 succeeded at 02:38:18Z. Inputs generate_lore=true; other action
selectors/upload_packages=false; Windows build1/firstlaunch1; both reuse IDs empty.
Generic Preflight/matrix skipped by explicit focused scope; no required case skipped.
No CI failure, correction, package retry or second dispatch.

Downloaded artifacts 11689597279 Windows and 11690086025 Mac, API SHA256 digests
`d7e3d0ff71ba9b8c9d38f852ecce3e897432c53d7bcd7bf83bcc54beb24ca683` and
`e0bceb1381c1ce98dee6f135f10d9f43890eaaf1a9ea4ba91ddb4f58366e0d1d` respectively.
All 71 Windows/13 Mac manifest hashes verified.247 exact focused checkout inputs per target
and 248 Windows packaged inputs bind to Git candidate, action/run/attempt/tree/toolchains.
Only committed .gitattributes PowerShell CRLF transformation differs from canonical Git
LF bytes; exact transformed bytes verified, no blanket normalization/exemption. Initial
Mac literal-blob comparison refused that path; classified owner audit-harness mismatch,
corrected expected checkout comparison without source/artifact mutation or CI rerun.
Windows executable SHA256
`c6151ea6281e8e34e35bbad90ced722845676fc94d3be5801cbc31b3c6e4d7fd`;
setup `004eec0f1d65f5cb3d84fdf8440045aea4b151525b2372539809c29f14ddf1e6`;
MSI `617df5156097c79a488a69a23b4f710b69255bc7a2200e9d3b4b1f8596ec5436`.
Actual package build1 succeeds; no cached or skipped result substitutes for it.

Both targets pass core34 (eight lore cases), references12/prompts5/renderer131,
transport8/worker6 and actual renderer/native-credential/HTTP/core controller proof.
Mac nine actual automated cases pass, zero packages/editor launches/new SDK execution.
Windows rejecting gates14+6+8=28 pass, including actual native polling regression.
Clarification of earlier local gate wording:28 total,27 passed and one Windows-only
skip; the required skipped capability is now proved on Windows. Windows cancellation
raw observations remain shutdownOk/Cancelled within unchanged <2second completion/EOF
bounds: stalled headers341.2microseconds/EOF54.2; partial body209.6/EOF46. Worker six
cases finish in 0.84 seconds. Mac corresponding cancellation gates also pass.

Windows native launch1 PID 7924 and separate process-reopen launch2 PID 2164 use the same
exact package.25 distinct phase1 checks (26listed, one repeated availability label) and
three reopen checks pass; five reviewed/actual HTTP body digests match. Six generateLore
receipts bind action/PID/binary, UI Automation/OS SendInput and viewport observations;
nine intact PNG captures pass hashes/dimensions/nonblank/change validation. Owner and
reviewer inspect native captures, including compact send disclosure, physical Generate,
Save and separate Approve before/after. Inert generated markup, passive semantic/exact
metadata review, one Save/duplicate refusal, proposed versus approved text, separate
approval, both Undo/Redo boundaries, all-source byte preservation, malformed/model
approval/cancelled/stale-external zero writes and project reopen pass. Process reopen
sends zero HTTP and preserves four metadata hashes. Terminal audit outcomes all success,
no errors; credentials/owned root removed and both terminal cleanup reports pass.

Signed local Mac package1/native launches1–2 remain coherent changed-action evidence:
248 exact input hashes, approved certificate/name/designated requirement, strict signature,
actual mounted installer contents, retained binary/DMG hashes in prior native audit.
CUA light/dark/756logical compact and physical Generate/Save/Approve,25 distinct+3 checks,
five exact bodies/zero reopen HTTP, history/refusals/source preservation and owned
credential/profile/generation/process/listener/root cleanup pass. Reviewer sandbox trust/
process restrictions are capability limitations covered by owner approved-host receipts;
no identity/trust/policy change. No further local handoff or repeated launch required.

CI privacy Windows69evidence/6package, combined downloaded artifact89files and local
package7/native8files pass. Ignored raw logs, receipts, manifests, attempt ledgers and
owner audits retained; no secrets, private content, binaries/logs or user paths committed.
Qualified unchanged SDK source/runtime1320d0a/run38056790759 reused explicitly; this
metadata-only outcome proves runnable bytes unchanged, not new SDK execution.

#### Acceptance, independent review and closed allowance

Delivered one bounded new/update editor-only lore entry with core ID/revision/provenance
and supporting citations, author-reviewed applicability, exact prepared dispatch,
passive semantic/exact metadata review and one Save transaction/Undo. Generation cannot
approve itself. Existing approved text remains through Save until separate explicit
replacement approval; Reject retains it. Duplicate acceptance refuses. Unknown
extensions/knowledge/scope and unresolved links/citations survive. Stale own/cited
support blocks approval/inclusion. Core/controller proof also establishes new-entry
acceptance, Reject retains old approval, strict schema/target/bounds, competing request,
draft/session/prompt/reference/source identity/external zero-write refusal and reopen.

Independent GPT-6.1 Sol High implementation/re-review and final read-only actual native/
CI artifact review find no actionable acceptance blocker. Shared edits remained serial;
reviewer made no shared writes, package/editor/dispatch attempts. Owner audited actual
artifacts and captures, corrected only the checkout comparison expectation during audit.
All implementation findings were repaired and focused-checked before expensive attempts.
No package matrix or runtime rerun for docs-only successors. Canonical contracts,
TESTING and live CURRENT/HANDOVER reconciled.

| Target | Actual cumulative package attempts | Editor launches | Focused dispatches | Unused remainder, now closed |
| --- | --- | --- | --- | --- |
| Windows x64 | **1/4** | **2/6** | **1/4** | 3packages,4launches,3dispatches |
| Mac ARM64 | **1/4** | **2/6** | **1/4** | 3packages,4launches,3dispatches |

No outstanding reservation, pending CI, owned process/listener/fixture or required
in-scope work. Failed/cancelled/implicit attempts counted; no failed expensive attempt
for this outcome. Earlier product/harness/environment findings remain recorded above.
Prior allowances and this unused remainder stay closed; no transfer to following work.
Full Phase2/2C.3/2C.4/live Studio or generic-provider/final human acceptance remain
separate and incomplete. Synthetic controlled loopback qualification cannot claim
live provider coverage. No runnable Character/Appearance/source changes, provider/
signing expansion, paid/public calls, merge or release. Next outcome proposed only.

#### Phase 2 qualification next prompt — proposal only

```text
Deliver Phase 2 qualification: qualify one coherent candidate through the five
implemented Assist actions on Studio and one representative generic endpoint,
including an integrated authoring/review/acceptance/Undo/Redo/reopen workflow.
Repository: Caldwell-41/Renpy-editor
Continuation: codex/provider-qualification, published Generated lorebook entries
closure atop qualified 233454b4a0ae4c369d00c2dcd352c789829290b2/run38105665896.
Reconcile fresh refs and preserve unrelated work; never reset. Retain current Mac
ARM64 development session. Use focused Windows x64/macOS ARM64 CI; local handoff
only for a named required capability CI cannot establish.
Read AGENTS.md, WORKFLOW, CURRENT, HANDOVER and existing Phase2 task sections 6–11,
20 and this next prompt. Record selection/acceptance in that existing task.
Use one GPT-6.1 Sol High owner and independent GPT-6.1 Sol High reviewer; shared
implementation serial. Reuse accepted references/prompts/proposals/history,
credentials/request service and each action's valid unchanged evidence.
Scope integrated qualification and in-scope defects of existing five actions.
Identify available local Studio and a representative generic configuration;
record exact provider/model/capability/configuration and required access. Missing
live access stays missing evidence; do not substitute loopback or install/expand
providers. Use only synthetic content on expressly authorized local/free endpoints.
No paid/public calls, runnable Character/Appearance changes, embeddings/retrieval,
runtime inference, signing changes, new feature sweep, merge or release.
Prove exact sends, schema/tool behavior, passive review, zero-write refusals,
proposal/approval separation, source/custom preservation, shared Undo/Redo,
project/process reopen, metadata-free game behavior and responsive Save/cancel.
Reuse unchanged cases; distinguish product/harness/environment/missing evidence.
Proposed fresh per-target allowance4packages,6editor launches,4focused dispatches;
prior allowances stay closed. Bound live probes to2 synthetic attempts per action
per selected endpoint. Count failed/cancelled/implicit attempts and reassess after
two unsuccessful corrections of one hypothesis. Validate cheap rejecting gates
before packaging. Complete focused verification, independent review/in-scope fixes;
commit/push and update canonical contracts/task/CURRENT/HANDOVER. Follow WORKFLOW
wait/resume; express polling authorization applies only if continuing this same
chat. Audit actual artifacts. Return result/limitations/next prompt; do not start
another deliverable. Keep final human acceptance distinct.
```


### Phase 2 qualification selection and prerequisite audit — 2026-10-11

User selects the saved Phase 2 qualification next prompt above, continuing closure
**d03c1173d6a7493353a4df01463175a1404d545d**, retaining the Mac ARM64 development
session. Fresh authenticated fetch/remote refs match the clean local branch
`codex/provider-qualification`; origin/main remains
`5f448ca683a905f4ea77d4580bbc89fda69f2b93`. No reset, unrelated edits or open branch PR.
Latest branch run38105665896 is completed/success on exact233454b; the three latest
branch runs are terminal. Restricted-shell `gh auth status` initially reported an
invalid token; authenticated approved-network fetch/API calls succeeded. This was
an environment limitation, not lost GitHub access or a failed dispatch.

Selected scope: one coherent integrated five-action qualification on Studio and one
representative generic endpoint, with in-scope existing-action defects only. Reuse
accepted references/prompts/proposals/history, credentials and unchanged action proof.
One serial owner and independent GPT-6.1 Sol High read-only reviewer; no second writer.
No provider/signing expansion, provider installation/model download, paid/public calls,
runnable Character/Appearance changes, retrieval/embeddings/runtime inference,
merge/release or following deliverable. Commit/push of this outcome is authorized.
Polling permission from the prior chat is not inherited; WORKFLOW manual same-thread
wait/resume applies unless the user expressly changes it here.

Acceptance still requires exact production sends and strict schema/tools behavior,
passive semantic/exact review, zero-write refusals, separate proposed/approved reference
revisions, preserved source/custom text, mixed source/reference/prompt Undo/Redo,
project/process reopen, responsive Save/cancel and metadata-free SDK game behavior.
An integrated session must exercise all five actions with reviewed approved references,
customize/restore prompts, vary context/output limits, and persist/approve generated
cards/lore before reviewing their exact inclusion in later actions. Both client targets
require coherent candidate/input/native evidence; live synthetic inference may use one
controlled host. Existing single-action closures are reuse evidence, not that integrated
session or live provider proof. Final human acceptance remains distinct. The broader section11 subset/new-Character
operation matrix is not implemented by the current one-operation/inseparable-group
actions. It is not permission to add multi-operation or runnable Character features
here; reconcile that broader requirement before a full Phase2 completion claim.

#### Evidence reuse and remaining proof

| Accepted bounded action | Existing candidate / successful run | Reuse boundary |
| --- | --- | --- |
| First rewrite | 95ce9c4 / 38031993657 | Qualified bounded native/source/token path; later shared changes need final coherent-input assessment. |
| Continue Scene | 8931fa8 / 38039472619 | Qualified group/source/history action; no live endpoint claim. |
| Draft Scene | 1320d0a / 38056790759 | Qualified Scene creation/history and pinned-SDK literal/metadata-free behavior. |
| Generated Character card | 8a230a9 / 38093296977 | Qualified metadata/proposed/approval path and repaired native cancellation. |
| Generated lore entry | 233454b / 38105665896 | Current coherent shared/action automated inputs and signed Mac/native Windows proof; no integrated/live claim. |

Closure d03c117 changes documentation only after233454b. No implementation has changed
in this selection. Do not rerun all individual cases or package solely for this record.
New integrated cross-action and live results remain missing; SDK reuse must be assessed
against the eventual integrated accepted source, not inferred from unchanged metadata.

#### Concrete prerequisite blockers

State **blocked**, not accepted. Two prerequisites cannot be established inside the
saved qualification-only/no-provider-expansion boundary:

1. **Studio production destination — requirement mismatch.** The recorded local Studio
   configuration in the historical ledger uses direct private-LAN HTTP, exact model
   `unsloth/gemma-4-12B-it-qat-GGUF`, API-advertised UD-Q4_K_XL/context262144 and
   user-reported v0.1.902-beta. Those are historical observations; current availability,
   version/model configuration and credential readability have not been verified.
   The shared production `rewrite.send` calls `ai_request::prepare_reviewed`, which
   requires literal loopback HTTP and rejects LAN before dispatch. This is the deliberate
   accepted bounded transport contract, not a newly introduced product regression.
   The existing offline exact test
   `ai_request::tests::immutable_body_context_and_destination_refusal` passes **1/1**,
   **0 skipped**, at d03c117 and proves LAN/hostname/HTTPS refusal without HTTP.
   No supported local inference listener was identified on the retained Mac; this
   observation does not test the recorded LAN server. The old Python live spike cannot
   substitute for production five-action/client qualification. Smallest prerequisite:
   an explicitly agreed existing supported Studio configuration, or a bounded approved
   production LAN completion preserving address/origin, credential, no-proxy/no-redirect,
   immutable consent, cancellation and resource guarantees. No tunnel/proxy workaround.
2. **Generic production capability/access — missing implementation and evidence.**
   Production records expose only StudioSettings/StudioProfile; the request path requires
   a bound nonempty credential. Shared action serialization unconditionally emits Studio
   extensions. No generic kind/auth/capability selection or generic wire mapping exists;
   ADR0013 still records generic deferred. Entering a generic URL as Studio cannot qualify
   the distinct generic contract. No selected exact endpoint/model/auth/schema configuration
   or expressly authorized free/local access is available. Smallest prerequisite: select
   that configuration and explicitly amend scope to implement its production generic
   profile/auth/capability and wire behavior. No automatic fallback or provider installation.

Independent read-only review confirms both prerequisite findings and the no-expansion
scope conflict. Reviewer made no writes, sends, packages, editor launches or dispatches.
Final independent review of this docs-only selection/status diff finds no actionable
finding. Repository/link/privacy validation passes498files and `git diff --check`
passes; CURRENT291words/HANDOVER536words are compact complete recovery records.
No package matrix is required for this documentation-only prerequisite record.
Owner requested the missing nonsecret generic configuration/free-local authorization and
an explicit scope decision for the two production prerequisites. No API key requested in
chat, credential read/export/change, discovery or generation attempted. Existing owned
qualification credential/reference is untouched; historical access is not current proof.

Fresh selected cumulative allowance remains **Windows0/4packages,0/6editor launches,
0/4focused dispatches; Mac0/4packages,0/6editor launches,0/4focused dispatches**.
Live probes **0/2 per action per endpoint**; discovery allowance/configuration must be
made explicit before connection. Earlier allowances stay closed; no reservation,
ambiguous dispatch or unsuccessful correction. Validate cheap rejecting gates before
any package. Reassess after two unsuccessful corrections of one hypothesis.
No new process/listener/fixture, package or CI operation is owned by this selection.

Resume this same outcome after the user supplies the selected free/local generic
configuration and resolves the prerequisite scope. Retain the same allowance and Mac
session; reconcile fresh refs, implement only an authorized amendment, then complete
focused rejecting/integrated checks, independent review, necessary both-target/native
qualification and live attempts. Missing live access remains missing evidence. No
following deliverable is selected.

#### Qualification continuation prompt — blocked outcome

```text
Resume the selected Phase 2 qualification on codex/provider-qualification from its
published prerequisite-audit checkpoint, retaining this Mac ARM64 session. Read
CURRENT, HANDOVER and the Phase 2 task's “Phase 2 qualification selection and
prerequisite audit — 2026-10-11”. Preserve qualified233454b/run38105665896 and
unrelated work; reconcile fresh refs without reset. Resolve the recorded production
LAN/generic scope amendment and exact expressly authorized free/local endpoint/model/
auth/capability access before dependent implementation or calls. No installation,
paid/public calls, signing expansion, merge/release or next deliverable.
Continue the same selected five-action integrated/live outcome, serial owner and
independent GPT-6.1 Sol High reviewer. Existing allowance remains per target
0/4packages,0/6editor launches,0/4focused dispatches; live0/2 per action per endpoint.
Reuse unchanged proof, establish missing rejecting/integrated/native/live evidence,
audit actual artifacts and keep final human acceptance distinct. Follow WORKFLOW
manual same-thread CI wait/resume unless expressly authorized otherwise here.
Commit/push authorized results and maintain the existing task/CURRENT/HANDOVER.
```


### Studio-only qualification amendment — 2026-10-11

User confirms the recorded Unsloth Studio LAN address remains available, authorizes
required production LAN support, offers a temporary API key for agent native entry
with later user rotation, and explicitly defers generic: “just do unsloth initially”.
This supersedes the prerequisite scope stop for Studio only. Generic implementation,
access and two-provider qualification remain deferred; no full Phase2 completion.
Retain the existing exact selected Gemma model unless refreshed discovery or user
configuration requires a concrete decision. No other model/provider or installation.

State **in_progress** on clean published d175705; fresh fetch and latest branch run
still match recorded refs/terminal baseline. Owner implements literal private-LAN
HTTP with saved opt-in through the existing address policy and fixed SocketAddr;
DNS/HTTPS/public HTTP, proxy/redirect/retry remain unsupported. Native temporary-key
entry/storage and exact-owned cleanup use existing policy; never echo/commit keys.
The user authorization for agent entry supersedes the prior no-chat-key direction;
no key has yet been supplied. Historical spike credentials remain untouched.

One shared writer/independent GPT-6.1 Sol High reviewer, integrated five-action
controller/history/reopen and metadata-free SDK workflow, focused both-target
CI/native proof and separately bounded real Studio synthetic attempts. New native
inputs invalidate transport reuse; unchanged individual semantic/theme/credential
proof remains subject to exact input assessment. Hosted CI is not assumed to access
home LAN; local Mac can establish named required live/signed capabilities. Internal
server tool suppression remains unknown absent actual configuration/monitor proof.

Allowance unchanged: each target0/4packages,0/6editor launches,0/4focused dispatches;
Studio0/2live attempts per action. Up to2explicit model discoveries selected for this
amendment (preflight and post-live), count errors/ambiguous sends, no automatic retries.
Generic0calls. Cheap destination admission/refusal tests precede packages. No signing
changes, runnable Character/Appearance edits, paid/public calls, merge/release or next
outcome. WORKFLOW manual same-thread CI wait/resume still applies.

### Studio LAN implementation and integrated local proof — 2026-10-11

Production preparation and native dispatch now share pure literal-address admission:
loopback HTTP or saved opt-in private LAN HTTP through existing address policy,
with one fixed SocketAddr. DNS/public/link-local/CGNAT/multicast/unspecified/HTTPS
refuse. Credential origin and profile revision/consent remain bound; no proxy,
redirect/retry or trust/signing change. All five passive reviews disclose unencrypted
transport and unknown inference locality. Generic remains explicitly deferred.

Focused local final inputs pass core35, transport8, native worker6, references12,
prompts5, renderer131, frontend build and existing actual native lore controller.
New five-action controller passes on an owned RFC1918 interface with actual native
credential reader/HTTP/core: exact reviewed body digests, strict schema/tools off,
passive zero writes, card/lore proposed Save plus separate approval, later exact
approved inclusion with custom rewrite prompt, generated-reference staleness,
prompt restore/limit overrides, source/custom preservation, mixed transactional
Undo/Redo, project/process reopen with zero HTTP, retained extensions and cleanup.
Controlled responses are not real Studio compatibility evidence.

Pinned Ren'Py8.5.3 compile/lint/named integrated runtime passes on the reviewed
controller's exact accepted synthetic source without editor metadata. Fixture SHA256
`839268cfcbae49c73d637ded118433c1a1c601a44886ba26016b61b65615c236`;
five SDK commands, exact source hashes retained. Standard-template scaffolding fills
only initially empty GUI files. Actual entry rewrite, Continue group, terminal Return
and new Draft Scene run; generated brackets/tags remain passive and original protected
formatting stays active. First SDK attempt failed harness say-screen synchronization;
waiting for the exact expected scope fixes it. Earlier controller failure was a
harness reference-order mismatch, repaired with canonical kind/ID order and server
error capture; owned retained fixture/credential cleanup completed. Neither was
promoted to product or acceptance success.

Independent GPT-6.1 Sol High read-only review found Draft hid the connection disclosure
and new driver startup/reply reads could hang after exit. Owner repaired both before
packages. Five-action controller asserts visible transport/locality on every review;
new bounded driver observes spawn/exit/error/invalid lines/deadlines, reaps its exact
child and attempts exact-owned cleanup once, recording incomplete cleanup honestly.
Ordinary fake startup/reply/malformed/timeout/missing executable failures pass. New
rejecting gates4 pass; existing gates28 pass with one explicit Windows-only polling
skip that requires Windows. Repository503-file validation, actionlint, Python syntax
and diff checks pass. A mistaken npm alias did not execute any check; documented
`npm test` then passed131/131 with no unsuccessful cases.

Final independent re-review finds no remaining code/harness blocker before packaging;
reviewer made no writes, credential access, builds, launches or dispatches. Exact
candidate Windows/macOS/native and real Studio evidence remain pending. Package and
focused CI recipes add required integrated LAN/SDK gates without hosted Mac signing
or package uploads; Windows representative native action stays generateLore while
artifact qualification is phase2Studio. Prior package proof is not reused across
changed production inputs. New live ordinary-UI fixture creates only disposable
synthetic project state and never auto-creates a profile/key/discovery/send.

Usage before packaging: Windows0/4packages,0/6editor launches,0/4focused dispatches;
Mac0/4packages,0/6editor launches,0/4focused dispatches; Studio0/2 attempts per action
and0/2 model discoveries. No temporary key supplied or real Studio HTTP/credential
entry. Existing owned synthetic processes/listeners/fixtures cleaned; no CI pending.
Next publish candidate, build approved-identity Mac package1, native1–2, then focused
both-target CI1. User key is required only for the remaining real Studio checks.

### Studio qualification signed Mac evidence and CI1 — 2026-10-11

State **awaiting_ci** plus missing real Studio access. Published candidate
**4d1120dbb6f8d85dc861554ba93e8d26db6c1f82**, tree
`6e7e4a63f80ba7f12526c388866bedb6f7117052`;253 exact app/workflow/fixture inputs
inventoried locally. Fresh remote branch publication matched candidate and main5f448ca;
last three prior focused runs were terminal before dispatch. Docs-only successors must
retain this implementation/package/run identity, not promote an untested candidate.

Mac package1 passes host strict signature, approved certificate-leaf designated
requirement and mounted installer contents. Executable SHA256
`f79d46cedd6ec664fe8a9d69d5d37df2ff035757610c0b3996d530d25673f7b7`;
installer SHA256
`56e887fdc37adfed8d330629dcab77c7d55499cb34864c6d8bc6e8e3de8d100d`.
Identity/names/signing/Keychain policy unchanged. Independent reviewer matches identity
and executable; reviewer-sandbox CSSMERR_TP_NOT_TRUSTED is the established host trust
boundary, not a requested workaround. Host strict verification receipt is retained.

Mac native1 reached six stage-ready rows but exited before terminal report; it remains
incomplete/unsuccessful. A following CUA action showed a normal workspace and exact
process inventory identified an implicit candidate relaunch2. Suspected stale CUA
identity/window binding is an observation/ownership hypothesis, not a proven product
crash. No new crash report was found. Failed raw log retained, exact native credential
cleanup helper exited0 and removed only that owned root; exact implicit app PID was
stopped. Both launches count. CUA state was refreshed and owner/reviewer observation
made serial before physical actions; no production/package edit or rebuild required.

Same-package retry native3 and process reopen4 pass:25 distinct phase1 checks
(26 rows includes repeated reference availability) plus3 reopen checks. Owner physically
clicked Generate, Save and separate Approve; observed light/dark/compact send, passive
literal metadata and proposed-versus-approved forms. Independent read-only native
inspection confirms the explicit separate approval and passive compact review; actual
terminal receipts/raw logs agree. Five HTTP digests equal all reviewed digests; all four
project metadata hashes are unchanged across process reopen, which sends zero HTTP.
Malformed/model-approval/cancelled/stale-external refusals preserve bytes/task, shared
history and project reopen pass, runnable source stays exact. Both terminal reports
confirm service/credential cleanup. Outer failed/successful temp roots removed after
retaining synthetic evidence locally; exact four consumed editor PIDs are absent.
No owned listener/process/credential remains. These controlled native checks do not
prove real Studio compatibility or final human acceptance.

Focused both-target dispatch1 is confirmed:
[run38111920210](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38111920210),
workflow357322921 `production-scaffold.yml`, attempt1, exact candidate4d1120d,
branch `codex/provider-qualification`, created2026-10-11T04:32:41Z; initial API status
**in_progress** at04:32:50Z. Inputs `phase2_studio=true,generate_lore=true`, all other
action selectors/upload false, build ordinal1/first launch ordinal1, both reuse IDs
empty. Required jobs Focused Assist—Windows x64 and Focused Scene automated—macOS ARM64
must establish current integrated/controller/private-LAN/SDK proof; Windows adds new
package and native physical evidence. Generic matrix is deliberately unselected, not
a missing required job. Neither success nor artifacts have been audited yet.

Cumulative allowance: Mac **1/4packages,4/6editor launches,1/4focused dispatches**;
Windows **1/4focused dispatches**, package1/editor1–2 reserved for this run until actual
terminal attempt audit (do not spend them again). Studio **0/2 live attempts per action,
0/2 discoveries**; generic0calls. First failed/implicit Mac launches stay consumed;
remaining two Mac launches cover the selected ordinary live session/reopen only.
No temporary key supplied or real Studio connection made. User-approved key entry is
still pending. Earlier allowances closed; no additional package/launch/dispatch grant.

Independent GPT-6.1 Sol High implementation/re-review and actual Mac receipt review
find no remaining actionable blocker to this focused CI dispatch. Shared edits stayed
serial; reviewer performed no writes/builds/editor launches/dispatches or credential
access. Commit/push checkpoint authorized. WORKFLOW manual same-thread wait/resume
applies; no autonomous polling/watcher. Pause now, then audit exact run/head/attempt/
required artifacts on user resume and continue real Studio only after key availability.
Generic qualification, broader subset/new-Character requirements and final human
acceptance remain distinct. No merge/release/following outcome.

#### Same-outcome continuation prompt

```text
Continue the existing Studio-only Phase 2 qualification on codex/provider-qualification.
Retain Mac ARM64 and reconcile fresh refs without reset or unrelated changes. Read the
live CURRENT/HANDOVER and Studio-only amendment/implementation/native-CI records in
the existing Phase2 task. Implementation candidate4d1120d/tree6e7e4a6,
CI1run38111920210/attempt1 audited: Mac automated passes; Windows native clipped-window
failure/cleanup retained, actual package1/editor1 only. Reviewed harness successor
fd2872e/tree2619824; CI2run38114055500/attempt1 initially queued05:12:49Z.
Signed Mac package1/native retry3+reopen4 accepted with failed native1/implicit2
preserved and consumed. Audit CI2 exact required Windows/macOS jobs,
identities, manifest/input hashes and actual native/SDK/controller artifacts; missing,
failed or skipped proof remains unresolved. Keep one serial owner and independent
GPT-6.1 Sol High review for in-scope fixes/final artifact acceptance. Temporary Studio
key was supplied and user explicitly approved temporary local storage/cleanup after
automatic review rejected native Remember. Mac unlock is now required. Do not repeat
or export the key. After unlock, inspect recorded owned launch5 before UI binding and
reuse it if alive; prior launcher control is unavailable and its intended timeout was
not enforced. Never implicitly relaunch; if stopped, reassess the
live/reopen requirement against the single remaining launch. User authorized native
entry and later rotation. Use only
the existing exact local Studio/Gemma configuration and disposable synthetic content;
no echo/export of key, no paid/public calls or generic/provider installation/expansion.
Real Studio allowance0/2 per action, discovery0/2; Mac1/4packages5/6launches2/4dispatches,
WindowsCI2/4; CI1 actual package1/editor1, CI2 package2/editor2–3 reserved pending audit.
CI1 unused reopen reservation released. Earlier
allowances closed. Continue authorized fixes only within actual remaining allowance;
manual same-thread CI wait/resume unless the user explicitly amends it here. Publish
compact status/limitations; no full Phase2/human acceptance claim, merge/release or
next deliverable.
```

User subsequently supplied the authorized temporary key while this checkpoint was
being finalized. Receipt is acknowledged without recording the value. Real Studio
ordinary native session/reopen may proceed within remaining Mac launches5–6 and
existing live/discovery allowance. CI remains unaudited; no polling grant inferred.
Key has not yet been entered or used at this update. Next owner's key availability
statements above are superseded by this receipt; secret stays in the conversation/native
entry only, never task/source/arguments/logs/reports.

Native ordinary live session launch5 is running in the exact disposable fixture;
profile saved without network, existing exact local Studio/Gemma selected with private
HTTP opt-in, unverified capacity262144/budget32768/response2048. Key entry plus native
Remember was rejected by automatic approval review: entry authorization was recognized,
but persistent local credential storage requires explicit approval. The existing Mac
development encrypted-file/local-unlock policy was disclosed in the native dialog and
approval request; no policy workaround or alternate entry attempted. Explicit temporary
local storage plus cleanup approval is now pending. No discovery/generation occurred,
and no key value is recorded here. Live0/2 per action and discovery0/2 remain untouched.
Mac package1/editor5/dispatch1; one final reopen launch remains. Do not attempt Remember
or any dependent live connection before explicit approval arrives.

Recovery: the ignored `live-studio/phase-1-launch.json` receipt identifies the exact
owned launch5 PID, root basename/parent and owner session, with receipt timestamp and
approximate deadline (confirm process state rather than assuming timeout completion).
The launcher originally intended a20-minute bound; the later owner-control correction
below supersedes that guarantee. Do not assume it terminates the child;
the disposable root needs explicit owner cleanup. Check process/root/dialog state
before continuing and retain all consumed launches. Prior native cleanup receipts
cover launches1–4 only. Final launch6 is reserved for the live process-reopen evidence;
a stopped launch5 requires allowance reassessment, not an implicit replacement launch.

### Studio-only qualification CI1 audit and unlock boundary — 2026-10-11

User explicitly approves temporary local credential storage and cleanup. The earlier
automatic review rejection is resolved, but Mac UI control reports the desktop locked;
manual unlock requested. Key remains unsaved and real Studio discoveries/generation
remain0. Exact live launch5 PID58371 still points to signed4d1120d package, parent1,
observed05:06:38Z. Prior owner session84533 is unavailable and the intended timeout did
not stop the child. This is an owner-control limitation, not an app/provider failure.
The ignored launch receipt now records this disposition. Confirm exact live PID/path
before reuse/cleanup; do not bind a stopped app or consume an implicit replacement.

Recorded CI1 run38111920210/attempt1/head4d1120d completed failure04:47:46Z. Exact
artifacts11692111982 (Mac) and11692123047 (Windows) are present/unexpired and downloaded
into ignored `ci1`. Owner and independent reviewer audit agree: both manifests intact
(23/61entries);252 exact identity inputs match candidate with `.gitattributes` PS1
checkout CRLF accounted; Windows package253 inputs and executable
`fbdafc819864e4ae3f689b17ed81640e007647fef3881a2ba79978fc33e17a1b` match.
Mac12 cases pass including real five-action private-LAN controller and metadata-free
pinned SDK named runtime; Windows focused/controller/LAN/SDK/package pass. Raw suites
core35/prompt5/transport8/worker6/reference12/renderer131 agree; no failed/cancelled/
skipped/todo renderer cases. SDK accepted-source hashes and nine runtime assertions
match each exact exported fixture. These passes do not supply missing native proof.

Windows native failed before Generate at observe-light: full1920x1080 preflight passed,
owned control checks passed, but whole-window capture refused `Owned window clipped
outside observable desktop`. Phase1 reports failure/cleanup, four preliminary checks
and one reviewed-body hash; no phase2 or real send. This is a diagnosed native geometry
harness/environment failure; no product assertion is proven defective. Actual attempt
ledger consumes package1/editor1 only; unused editor2 reopen reservation released.
Failed native evidence remains failed and preserved; exact owned credential/root cleanup
passes. Overall CI1 is not a qualification pass.

Serial repair adds owned-HWND position clamping into the actual desktop after owner/
foreground verification, records before/desktop/after bounds, preserves requested size,
refuses oversized layouts/failed move/size drift and retains all capture/control/theme/
compact assertions. New Windows regression executes the actual AST helper with platform
test doubles; Mac reports7 reuse tests pass and2 Windows-only skips, native gates14 pass,
repository503-file validation passes. Windows-only cases remain required in fresh CI2.
Independent review before publication/dispatch; selected retry uses packageordinal2,
firstlaunch2 (dependent reopen3), generate_lore+phase2_studio, no reuse/uploads. No
additional Mac package/editor launch; focused dispatch2 consumes the same allowance.

Independent GPT-6.1 Sol High code/terminal artifact review finds no blocking issue in
the repair. Published harness successor **fd2872e8fba26b05e3bdeac0054fe8871bfc3c95**,
tree**2619824ecd52fd3c7faf00b2c594dabe01af5292**. Production4d1120d code and signed Mac
executable remain unchanged; this successor changes only native Windows driver and its
real-helper regression, which differ from the retained Mac inventory. Keep the original
Mac package identity; no claim that it was built from the harness successor. Source
checks/503-file validation pass; Windows actual
helper execution/native layout acceptance remain required.

Confirmed fresh [CI2run38114055500](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38114055500),
workflow357322921/attempt1/headfd2872e/branchcodex/provider-qualification, created
05:12:41Z, initially queued05:12:49Z. Inputs generate_lore=true,phase2_studio=true,
all other action/upload flags false, buildordinal2/firstlaunchordinal2, both reuse IDs
empty. Exact initial identity and owner dispatch receipt retained in ignored
`dispatch-receipt-02.json`. No subsequent polling or terminal claim. Required Windows
native+reopen and both focused/controller/SDK artifacts require same-thread audit.
Mac1/4packages,5/6editor launches,2/4dispatches; Windows2/4dispatches with actual CI1
package1/editor1 and CI2 package2/editor2–3 reserved until actual ledger audit. Studio
0/2 per action,0/2discoveries; generic0. Mac unlock and CI2 are actual blockers; storage
approval is resolved. Preserve running owned launch5/fixture for reuse after unlock;
if it exits, reassess the single remaining launch rather than silently replacing it.


### Studio-only CI2 audit, live progress and completed-Assist repair — 2026-10-11

CI2 run38114055500/attempt1/headfd2872e completed success05:27:56Z. Owner and
independent reviewer audited required Mac/Windows artifacts11693300722/11693301650:
23/84-entry manifests intact,252 candidate inputs and253 Windows package inputs match
with PS1 checkout CRLF accounted. Windows executable31aac7a7 matches native PIDs4584/5884.
Native25 distinct checks plus3 reopen pass, six physical/layout stages, five reviewed
body digests equal actual HTTP digests, exact metadata preserved and zero reopen HTTP.
Both actual five-action renderer/native credential/private-LAN chains and pinned8.5.3
metadata-free accepted-source runtime pass. Raw Windows log confirms all9 reuse tests
pass, including actual polling/placement helper regressions; no skips. Placement receipts
are in bounds without a move; the clamp branch is established by the actual-helper
regression. Owned native credentials/root cleanup passes. CI1 failure is retained.

User unlocked the Mac and saved the temporary key through the native modal. Owner
observed configured/API-key-saved status without reading/exporting its value. Storage
and cleanup are explicitly authorized; historical credentials remain untouched. Exact
owned live launch5 PID58371 and signed4d1120d package verified before reuse. Explicit
discovery1/2 found the exact selected Gemma model. Ordinary real Studio generation
card1/lore1/rewrite1/continue1 each returned valid production proposals. Card/lore were
saved unapproved, then separately approved through their libraries. Rewrite explicitly
included both generated approved revisions and the seed references, using a saved
custom prompt and changed limits; acceptance retained all protected tokens. Installed
rewrite baseline restored through explicit confirmation. Continue accepted one narration
before the unchanged terminal. Generated references then correctly became unavailable
because their supporting source read-set was stale; no forced inclusion. Draft remains
0/2: the Mac locked again before its review/send. Manual unlock requested.

Live evidence and public synthetic snapshots remain ignored. Provider-internal tool
suppression/configuration is still unknown; reviewed client bodies disable tools,
streaming and thinking and require strict schema. Live HTTP-body equality has not been
independently captured; controlled integration/CI establishes that transport assertion.
Live mixed history, project/process reopen, exact accepted-source SDK and credential/root
cleanup remain required. No full qualification or final human acceptance claim.

Observed product defect: successful Save leaves Assist classified as unfinished, so
ordinary Close retains the panel. Clearing completed fields safely dismissed it in the
old package; a WKWebView-confirm cause remains unproven. Repair marks completion only
after successful acceptance, uses one unfinished predicate for Close/navigation, and
resets completion on edit/reprepare. Failed accept/cancel guards remain. Renderer131
passes, build/desktop check pass; tests cover saved Close without confirmation, refused
accept/cancel and reprepare/edit guards. Independent reviewer finds no blocking UI issue.
New lore native stage physically clicks Close after successful Save, requires panel
dismissal and unchanged full public snapshot, before existing Undo/Redo/approval. Seven
Windows stages and the new named result are mandatory; old stale/refused cleanup remains.
Rejecting native14/probe6 gates pass; reuse7 pass with2 Windows-only skips, requiring CI.
Final independent harness review and fresh coherent package/native/CI evidence remain.

Actual cumulative allowance: Mac1/4packages,5/6launches,2/4dispatches; Windows2/4packages,
3/6launches,2/4dispatches. Live card/lore/rewrite/continue1/2 each, draft0/2, discovery1/2.
Final Maclaunch6 remains reserved for existing live reopen. Conventional fixed-candidate
native acceptance plus process reopen needs two additional Mac launches; no extension
is implied. Prepare the reviewed fix/package within existing build allowance, then ask
for the concrete launch-limit change6→8. Fresh CI3 package3/editor4–5/dispatch3 fits
Windows allowances; Mac automated dispatch3 fits. Preserve same problem/allowance,
manual CI wait/resume, credential cleanup, serial owner and independent reviewer.


#### Reviewed repair package2 and CI3 dispatch checkpoint

Independent final code/harness review finds no blocking issue. Published candidate
**481c64bd210719365a18fc753e9d55eae0a88d27**, tree
**e273c897fb7d5b5c091b22be89a266ce4e087b53**. Signed Macpackage2 passes strict
signature/permanent identity/approved leaf requirement and installer contents;
253 exact inputs match committed candidate before/after build. Executable SHA256
`b49959bd367701d6de321e5088ecc9c20a84f05f5492f42b323c220d2b60ae52`; installer
`dc3cf6203218fe778c08962e57e93d7f32c58b660097be4d683ff0e156cd33e7`.
No updated-package launch has occurred. Original live package1 remains unchanged.

Confirmed [CI3 run38129660338](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38129660338),
workflow357322921/attempt1/head481c64b/branchcodex/provider-qualification, created
09:48:04Z, initially in_progress09:48:31Z. Inputs generate_lore=true,phase2_studio=true,
all other actions/upload false, buildordinal3/firstlaunch4, both reuse IDs empty.
Windows package3/editor4–5 are reserved until actual audit; dispatch3 consumed on both
targets. Audit required Windows/macOS artifacts and seven native stages on user resume;
no polling. Earlier CI2 success remains valid only within its exact inputs.

Mac now2/4packages,5/6launches,3/4dispatches; Windows2/4actual packages,3/6actual launches,
3/4dispatches with CI3 package3/editor4–5 reserved. Studio counts unchanged. Owner
requested Mac unlock and concrete launch-limit6→8 approval after reviewed fix and
verified package were ready. No reply/extension or cleanup is assumed. Finish existing
live Draft/history/reopen6 and credential/root cleanup after unlock. If extension is
approved, run updated signed native acceptance/ordinary Close and process reopen7–8;
otherwise retain missing updated Mac native evidence. Publish status, pause and resume
the same outcome; no full acceptance, generic calls, signing change, merge or release.

### Studio-only live completion, Mac native and CI3 repair — 2026-10-11

User unlocked/saved the key and explicitly approved two additional Mac launches,
changing this outcome's Mac launch limit6→8, and requested CI audit/continuation.
No other allowance changes. Fresh refs reconcile at b981303; origin/main remains
5f448ca. Unrelated work preserved; no reset or new outcome.

Real Studio Draft1 returned two valid narrations plus terminal, reviewed and accepted
once into a second Scene. All five live actions now1/2 each; discovery1/2, generic0.
Together with the earlier separately approved card/lore, generated-reference inclusion,
custom/restore prompt, changed limits and protected-token rewrite/Continue, nine Undo
operations restored all11 baseline public files exactly and removed the new Scene;
nine Redo restored all12 accepted public files exactly. Ordinary project reopen and
live process reopen launch6/PID69463 preserved both Scenes and all12 hashes. This is
package1 live evidence, not proof of the completed-Assist fix. No ambient provider
operation was initiated on live reopen; independently observed zero HTTP is not claimed
for that live session. Provider-internal configuration remains unknown; controlled
CI/native transport establishes exact sends, client strict schema/tools behavior and
zero reopen HTTP separately.

Pinned official Ren'Py8.5.3 ran compile/lint and eight named startup/first-Scene rewrite
and Continue/terminal/new-Scene two narrations/terminal assertions in five commands using
the exact eight accepted `.rpy` files, preserving UTF-8 BOM/CRLF. Editor metadata was
absent; only existing empty GUI scaffold files received SDK defaults. Accepted source
hashes unchanged. Ignored `live-studio/sdk-01/result.json` and command logs retain proof.
The user-entered temporary credential was removed through ordinary Settings; missing
credential/disabled profile observed. Exact owned live PIDs58371/69463 stopped and
owned temporary root removed. Historical credentials untouched; no secret read/export.
Only public synthetic accepted fixture and nonsecret receipts are retained.

Updated signed Macpackage2/native launches7/PID69512 and8/PID69576 use exact481c64b
executableb49959bd. Owner observed all seven native stages, including ordinary physical
Close immediately after Save without clearing fields: Assist disappeared, Story/Saved
remained and full public snapshot was unchanged before history/separate approval.
Phase1 passes26 distinct checks/27 rows and five reviewed/actual body digests; phase2
passes all three reopen checks, four identical metadata hashes and observed zero HTTP.
Owned synthetic credential/root and both processes cleaned. Ignored `native-mac-03`
phase receipts/public fixture/outer-cleanup retain exact proof. Mac launches8/8 exhausted.

CI3 run38129660338/attempt1/head481c64b is terminal failure. Owner and independent
audit retain intact23/79-entry manifests,252 exact inputs each and253 Windows package
inputs with `.gitattributes` PS1 CRLF on both targets. Windows executable5aeca5ca matches
native PID5932. Both integrated five-action/controller/SDK chains and raw suites pass;
Windows actual polling/placement regressions9 pass/no skips. Native passes13 checks
through physical Save, then physical-close five-condition gate times out; no phase2.
Only pre-Close state was captured, so neither a product Close failure nor successful
panel closure is proven. Preserve original failure; overall CI3 is not a pass. Cleanup
passes. Actual Windows package3/editor4 consumed; unused editor5 reservation released.
Ignored `ci3/owner-terminal-audit.json` records hashes/failed disposition and raw job log.

Concrete harness hazard: BOM-less driver contained exactly one non-ASCII literal in
the exact Story-name Close predicate; launcher uses Windows PowerShell5.1 `-File`,
which interprets such source as ANSI ([Microsoft encoding documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding?view=powershell-7.6)).
This fits CI3 but is not proven its sole cause. Narrow repair constructs the same label
with `[char]0x00B7` in ASCII source, retains all five individual postconditions and
captures failure state without acknowledging/normalizing a failed stage. Regression
executes the actual helper through BOM-less `powershell.exe -File`, verifies exact
label code point and rejects each missing condition. Mac reuse7 pass/2 Windows-only
skips; native gate14 pass. Actual Windows regression/native success requires fresh CI.

Independent GPT-6.1 Sol High final repair/native/live SDK receipt review finds no
blocking issue. All12 accepted public hashes match; eight named SDK assertions pass.
Current totals Mac2/4packages,8/8launches,3/4dispatches; Windows3/4packages,4/6launches,
3/4dispatches. Final permitted CI4 selects fresh package4/editor5–6/dispatch4, lore+
Studio integrated, no reuse/uploads; Mac automated dispatch4 without package/editor.
Only Windows driver/test inputs change from481; retained Mac production/probe/native
proof may be reused within that exact boundary, not described as a new full package.
Manual same-thread wait/resume applies. No further automatic retry beyond cumulative
limits; missing, failed or skipped required checks remain unresolved. Generic/full
Phase2/final human acceptance and merge/release remain distinct.

#### Reviewed Windows correction and final CI4 dispatch

Published **3b3e8681a7bae2ddc8964409bf6f4e615b788eba**, tree
**7a56dc5e5e2fbeff0d365216a43456345d52fdcd**, after independent final repair/evidence
and task-record review passed. Repository503-file validation and diffcheck pass.
Confirmed [CI4 run38134089028](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38134089028),
workflow357322921/attempt1/head3b3e868/branchcodex/provider-qualification, created
11:02:04Z, initial in_progress11:02:23Z. Material inputs lore+Studio true, other actions/
upload false, build4/firstlaunch5, both reuse IDs empty. Ignored dispatch-receipt-04 and
initial run JSON retain exact identity. Final focused dispatch4 consumed on both
targets; Windows package4/editor5–6 reserved pending actual ledger. Mac2/4packages,
8/8launches,4/4dispatches; Windows3/4actual packages,4/6actual launches,4/4dispatches.
No new Mac package/editor. Required both-target exact artifact/Windows helper/native/
reopen audit remains; no terminal claim or polling. Same-thread user resume continues
this outcome. CI3 stays failed, Mac reuse remains at unchanged481 production/probe
inputs, temporary credential/owned roots remain cleaned, generic/full Phase2/human
acceptance remain distinct. No further automatic retry beyond cumulative allowances.

### Studio-only integrated/live qualification and closure — 2026-10-11

User resumed the recorded CI4 with “audit CI and continue”. Fresh authenticated refs
match clean local/origin35792e3; origin/main remains5f448ca. No reset, unrelated work
discard, new outcome, extra build/launch/dispatch or credential operation. State:
**qualified/accepted for the selected bounded Studio integrated/live slice**, subject
to the exact evidence boundaries below; generic/full Phase2/final human acceptance
remain distinct. This does not certify unknown server-internal configuration.

#### Final CI4 exact artifact audit

[CI4 run38134089028](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38134089028),
workflow357322921/attempt1/head**3b3e8681a7bae2ddc8964409bf6f4e615b788eba**,
tree**7a56dc5e5e2fbeff0d365216a43456345d52fdcd**, completed success. Required Mac job
114454280091 completed11:05:51Z, Windows114454279985 completed11:15:20Z. Unselected
generic matrix/preflight skipped by the focused selector; no required check skipped.
Material inputs remain lore+Studio true, other actions/upload false, build4/firstlaunch5,
reuse IDs empty. Downloaded exact unexpired artifacts11700481279 Mac and11700921379
Windows;23/88-entry manifests intact. Both252 identity inputs and Windows253 package
inputs match3b3e868 with `.gitattributes` PS1 CRLF on both target checkouts. Windows
executable SHA256 **b3754ed9ce0d1f790fbf3b6aa7eb7863abfd58cc4ab34ef63e3b4b211e0a458d**
matches native PID3832/reopen9936. Owner receipt `ci4/owner-terminal-audit.json` retains
full manifests/input/source/job-log hashes and acceptance measurements in ignored storage.

Both targets pass actual integrated five-action renderer/native credential/private-LAN
HTTP/core chain, immutable exact sends/passive review, separate generated approvals,
supporting-reference staleness, mixed source/reference/prompt Undo/Redo and project/
process reopen with controlled zero HTTP/cleanup. Raw renderer131/core35/prompts5/
transport8/native-worker6/references12 all pass, no failed/ignored/skipped required
cases. Each exact exported eight-file accepted game, with editor metadata absent,
passes pinned official Ren'Py8.5.3 compile/lint and nine named runtime assertions in
five commands. Source hashes remain exact; empty GUI scaffolding only uses SDK defaults.

Actual Windows prelaunch regression9 tests pass/no skips, including production helper
through BOM-less PowerShell5.1 `-File`, exact U+00B7 label and refusal of each missing
Close predicate. All seven native stage receipts pass owned process/executable and
intact capture checks; the four physical stages record OS input and distinct before/
after captures, while three observation stages each retain one capture. Physical Close
immediately after Save passes all five recorded postconditions; owner inspected screenshots showing
saved review before and Story/Saved afterward. Whole public snapshot unchanged.
Phase1 passes all26 required distinct named checks/27 rows, five reviewed body hashes
equal five actual HTTP hashes. Refusals/cancel/stale-source checks remain zero-write;
separate approval/history/project reopen pass. Phase2 passes all three reopen checks,
four unchanged metadata hashes and independently observed zero HTTP. Terminal audit,
owned credential/root cleanup and actual attempt ledger pass. CI1/CI3 failures remain
failed at their original inputs; CI4 establishes success of the corrected Windows path.
The encoding hazard is no longer a pending hypothesis requiring another attempt.

#### Coherent input, live evidence and limits

Retained signed Mac481c64b package2 and native7–8 proof match unchanged production/
Mac probe inputs. Explicit253-input inventory comparison finds only Windows driver
and Windows helper test changed in3b3e868; other251 inputs unchanged. Ignored
`ci4/mac-input-reuse-audit.json` retains that assessment. No claim that the complete
Mac package was built from3b3e868. Final shared behavior is covered by fresh both-target
CI4 plus481 signed/native proof; earlier individual action closures retain their exact
unchanged semantic/theme/credential boundaries.

Previously independently reviewed real Unsloth synthetic session covers all five
actions1/2 each, discovery1/2, exact selected Gemma, separately saved/approved generated
card/lore and explicit later inclusion, custom/restore prompt, varied limits and
protected-token/source preservation. Nine Undo/Redo restore11/12 exact public files;
project/process reopen and exact metadata-free live accepted-source SDK8.5.3 runtime
pass. Live package1 evidence covers those inputs; completed-Assist repair is proved
by updated Mac481/native and fresh Windows CI4. Real temporary credential was removed
through ordinary Settings, exact owned live/native processes stopped and roots cleaned.
No key was read/exported or included in committed evidence; historical credentials
remain untouched. No owned pending CI, app process/listener/root or temporary credential.

Reviewed client bodies disable tools/streaming/thinking and require strict schema;
observed live responses satisfy the five action contracts. Server version/internal
tools configuration and independent live reopen HTTP observation remain unverified.
Do not generalize controlled CI/native transport observations into those claims.
Generic provider capability/endpoint, broader section11 operation matrix/new-Character,
final human acceptance and full Phase2 remain open; none is selected for execution here.
No merge/release or following deliverable is authorized by this closure.

#### Independent review and closed allowance

Independent GPT-6.1 Sol High terminal-artifact review finds no qualification blocker;
final closure-record review finds only a corrected wording overstatement about captures
in observation versus physical stages. No acceptance blocker remains. Reviewer made
no writes/tests/builds/launches/sends/dispatches/credential reads. Owner audit,
repository/link/privacy validation (503 files) and diffcheck pass. CURRENT227words/
HANDOVER589words retain complete compact recovery/acceptance boundaries. This is a
docs-only closeout; no additional package matrix.

Actual cumulative totals: Mac**2/4packages,8/8editor launches,4/4focused dispatches**;
Windows**4/4packages,6/6editor launches,4/4focused dispatches**. Both CI4 Windows
launches5–6 occurred; no reservation remains. Real Studio**1/2 per action**, discovery
**1/2**, generic**0**. Prior failure/implicit launch counts retained. All unused
remainder is closed with this outcome, not transferred to future work. A separately
selected remaining Phase2/human/generic outcome must reconcile current refs/contracts
and approve its own concrete scope/capability/allowance; do not restart old attempts.

### Selectable proposal editing — scope and allowance proposal — 2026-10-11

**State: proposal only, awaiting user approval.** User requests definition of the
remaining proposal-editing scope and allowance; generic support stays deferred.
This authorizes inspection/planning/local records, not implementation, native launches,
provider calls or CI dispatch. Fresh local/origin branch matches
**f3346e9666bcee06b9dd3e53343af33e1a8919f5**; origin/main remains5f448ca. Preserve
unrelated work and the accepted Studio closure. Its consumed/unused allowance stays
closed. No new execution allowance has been granted or consumed.

#### One observable next outcome

An author explicitly requests several edits in one existing Scene, reviews each
operation and its exact file changes, chooses a valid subset, and saves it as one
undoable change. A proposed new Character plus its dialogue demonstrates dependency
selection: excluding the Character makes its dependent dialogue inapplicable, while
unrelated narration remains selectable. This advances sections7–8/2C.1–2C.2 and the
section11 same-file/new-Character/subset matrix; it is not full Phase2 completion.

Code inspection confirms current Assist has one text replacement or an inseparable
Beat/Scene/reference group; AcceptRequest binds only proposal ID/preview digest.
Scene preparation already returns a transaction proposal, but manual Character
create/update commits immediately. Preparation must be made non-mutating for compound
review; do not call immediate-commit handlers repeatedly to simulate a batch.

#### Proposed operation boundary

- Extend the existing Rewrite Assist with an explicit several-Scene-edits mode.
  The author selects text targets and separately enables an insertion anchor and/or
  Character change before reviewing the send. Existing single-Beat behavior remains.
- One existing saved Scene and **1–8 explicit operations** in one response. Context,
  target Beat IDs and mutation permissions are selected/reviewed before Send.
- Replace text in selected existing dialogue/narration Beats, preserving speakers,
  ordering and protected tokens. Each replacement is a selectable operation.
- At most one insertion group of1–8 dialogue/narration Beats at one selected saved
  anchor. The group is inseparable and retains the existing terminal/custom boundary.
- At most one separately selectable runnable Character creation **or** update.
  Fields are the existing supported display name/dialogue colour only; new technical
  name is entered/confirmed by the author before Send and validated for collisions.
  Existing technical names are never renamed. Core allocates stable IDs and paths;
  model-local references can bind inserted dialogue to the proposed new Character.
- Exact existing Character update ID/allowed fields and permitted existing inserted-
  dialogue speaker IDs are bound before Send. New speaker references require the
  explicitly enabled proposed Character. Only currently supported owned definitions
  can be updated; custom/unsupported definitions refuse without source rewrites.
- Existing generated cards/lore and Draft Scene retain their accepted whole-group
  semantics. No implicit card creation, card linking, lore approval or Appearance edit.
- The eight-operation cap includes the Character/group operations. Retain current
  aggregate generated-text limit10000 UTF-8 bytes, individual field/source/metadata
  limits and context/output/deadline boundaries; refuse overflow, never truncate.

Wrong-Scene/unselected targets, duplicate operation/target IDs, dangling references,
identifier collisions and overlapping/conflicting edits refuse the whole malformed
response with zero writes. Never silently drop model operations to make a reply valid.

Batch creation of Scenes/cards/lore, new terminal/edge proposals and broader supported
Beat families remain separate remaining-scope decisions. This outcome does not waive
those original phase requirements. No arbitrary source/code, technical renames,
asset import/generation, conditions/calls, provider expansion/SSE, signing change,
generic implementation, merge/release or following deliverable.

#### Review and acceptance contract

Selection units are typed operations or declared inseparable groups, not file-diff
lines. Display every dependency; do not silently add selected operations. Invalid
selection explains the missing dependency and disables Save. Changing selection
prepares a fresh core-owned semantic/file preview and digest; Save binds proposal,
selected IDs and that exact digest, rechecking read/write/session/draft revisions.
One transient candidate combines same-file edits and authoring/source-map metadata
into one ordinary journalled transaction/history entry. Stable assigned IDs survive
selection changes. Comments, BOM/newlines, custom/unsupported source and unrelated
metadata remain byte exact. Accepted subsets consume the original proposal; remaining
suggestions are read-only until a fresh proposal is prepared. Duplicate Save refuses.

Acceptance proof covers same-file nonadjacent edits; new Character+dialogue+independent
narration; valid partial selection and missing-Character refusal; supported existing
Character update with exact definition/source/metadata review, one Undo/Redo, reopen
and SDK behavior; aggregate10000-byte boundaries across replacements/insertion/
Character fields; exact selected preview/source; one Undo/Redo across source and
metadata; project/process reopen;
stale source/reference/prompt/profile, cancelled/late response and competing-draft
zero-write refusal; normal fault/recovery fixtures without false success; keyboard/
focus/light/dark/compact native selection/review/Save; literal text/protected-token
encoding and pinned SDK8.5.3 metadata-free runtime. Preview never executes project
code. Existing protections remain; no specialist crash/hostile-filesystem programme.

#### Proposed execution and cumulative allowance

One serial GPT-6.1 Sol High owner and independent GPT-6.1 Sol High read-only reviewer.
Retain Mac ARM64 development and `codex/provider-qualification`; reconcile fresh refs
at execution. Implement/prepare focused checks, review, correct in-scope findings,
qualify changed native behavior, audit actual artifacts and maintain canonical docs/
task/CURRENT/HANDOVER through closure. Commit/push of this outcome is included in the
requested approval; no merge/release. Follow WORKFLOW manual same-thread CI wait;
no polling/watcher. No second writer or access to the user's other computer.

| Proposed maximum for this outcome | Mac ARM64 | Windows x64 |
| --- | --- | --- |
| Packaged build attempts, including failures | 4 | 4 |
| Editor process launches, including implicit/failed/reopen/live starts | 8 | 8 |
| Focused CI dispatches, including failures/cancellations | 4 | 4 |

A shared two-target workflow consumes one dispatch on each target, so at most four
paired focused runs, not eight. CI/local attempts use the same totals. These are
ceilings, not required repetitions; reuse unchanged valid proof. Cheap focused tests/
development compilation and independent reviews are included within this one outcome.
After two unsuccessful corrections of one hypothesis, reassess before continuing;
exhaustion or a material scope/capability decision stops execution without extensions.

Proposed real Unsloth budget: **two synthetic batch generations total and one explicit
model discovery**, only the already selected endpoint/model. No key is needed for
implementation preparation. Native credential entry must be available before live
calls; retain explicit temporary-storage/cleanup policy and never recover the old key
from logs/chat or read/export credential files. Live process starts count within Mac8,
not in addition. Controlled failures remain fixture tests. No paid/public calls,
provider/model installation or server modification. Credential/root cleanup required.
Old server-internal/live-observer limitations remain unless actually established;
this outcome cannot claim generic or final human/full Phase2 acceptance.

Planning review: independent GPT-6.1 Sol High read-only review finds the bounded
outcome/caps coherent; exact update/speaker authority and Character-update/aggregate-
limit proofs were added on review. No implementation/execution allowance is inferred.
Repository/link/privacy validation and diffcheck apply to these local-only records;
no package matrix for planning. The proposal is ready for the user's scope/allowance
decision; no implementation or publication has begun.


#### Approved selection and user-requested new-chat transfer — 2026-10-11

User explicitly approves the scope and allowance above, requests proposal-editing
implementation with generic later, and asks to be notified when native key entry is
needed for live generations. They then expressly stop this chat and request a prompt
for a new chat. State **paused for user-requested transfer**, not a completed outcome.
Approval persists; the next owner must not request it again or reset allowance.

Only repository/code inspection and approved scope/status records have occurred.
No implementation files changed, tests/builds/editor launches/provider discovery/
generations or CI dispatches occurred after selection. All approved totals remain
**Mac0/4packages,0/8editor starts,0/4focused dispatches; Windows0/4packages,
0/8editor starts,0/4focused dispatches; Studio0/2batch generations total,0/1discovery**.
Prior Studio qualification allowances remain closed. Planning-record503-file validation
passed; no implementation evidence is inferred. Three owned documentation edits are
published for this transfer within the approved commit/push boundary; unrelated work
preserved. Implementation baseline remainsf3346e9 until a real code change.

Resume from the transfer checkpoint in the same repository/Mac ARM64 session and
existing branch. Read this selection, its exact scope/acceptance, CURRENT/HANDOVER and
AGENTS; inspect current refs/working tree without reset. Proceed with the approved
one-outcome preparation/implementation/focused verification/independent review/fixes/
qualification/closure. One serial GPT-6.1 Sol High owner and independent read-only
reviewer; no second writer. Manual same-thread CI waits. No following outcome, generic,
merge/release or signing/provider expansion. Notify the user when live synthetic
qualification is ready for fresh native key entry; do not retrieve the old key from
chat/logs or credentials. Cleanup policy remains explicit. No key is needed for initial
implementation preparation. No new chat has been created automatically.


### Selectable proposal editing implementation and focused proof — 2026-10-11

User resumes the approved outcome from4bcfee097df2343902fbc5fb6fae6933b08c4f28.
Fresh fetched local/origin branch matches that continuation; origin/main remains
5f448ca683a905f4ea77d4580bbc89fda69f2b93. Worktree was clean; no reset or unrelated
work discarded. One serial owner and independent GPT-6.1 Sol High read-only reviewer
implement only the approved selectable scope. Approval/allowance is unchanged; previous
budgets remain closed. This is implementation with qualification pending, not closure.

`editScene` binds one saved Scene, selected root text targets, insertion anchor,
permitted existing speakers and exact Character create/update permission before Send.
The response validates1–8 typed operations, at most one1–8-Beat inseparable group and
one Character; malformed/unselected/duplicate/unknown/dangling/over-limit replies
refuse as a whole. Non-mutating Character preparation and in-memory Scene composition
produce one mutation per source/metadata path and one history transaction. Core owns
stable IDs/paths, protected tokens, fresh selection previews/digest and acceptance
rechecks. Missing dependencies/empty selection cannot Save; no implicit additions.
Partial acceptance consumes remaining suggestions. Existing whole-group actions remain.

Independent review corrected generated-name interpolation/tag encoding, BOM/signed
priority collisions, custom-source reinterpretation preflight across all saved Scenes,
and root-target eligibility. SourceDefinition literalDisplayName:true keeps generated
names passive while raw displayName stays author-visible; manual updates preserve it.
Canonical architecture/data/context/UI/testing records describe the final contract.
A followup review finds no remaining actionable implementation issue. Reviewer performs
no writes, tests, package/editor/live operations. Required native/CI evidence remains
separate from this source review.

Focused local Mac ARM64 proof: renderer check132/132, broader rewrite43/43 (including
unchanged prior action regressions), final selectable8/8, authoring32/32, prompt5/5,
native worker6/6 and gate tests8/8, all with zero skipped/ignored cases. Frontend build
and3-file dist privacy scan pass. Real renderer/controller→native credential/loopback
HTTP→core integration passes bound permissions, stable exact subset previews,
held-owner/refusal/cancel/stale zero writes, create/update and one history/reopen.
Pinned official SDK8.5.3 archive matches the saved published checksum and
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Ten SDK commands pass exact accepted create/update source compile/lint/named execution,
protected tokens, literal generated Beat/Character who text, Return, metadata absence,
source hash preservation and temporary-root cleanup. Owner and reviewer audit the
23-file ignored local evidence manifest;24-file evidence privacy scan passes.
Undefined interpolation and markup
in names would fail runtime if activated. These helper/SDK processes are not editor
starts or packaged attempts.

Unique failed harness evidence is retained in ignored selectable logs: the first
recovery test incorrectly expected AcceptLoomlight to resolve a partially exchanged
compound proposal; the existing recovery policy correctly refuses that mixed state.
After reassessment, the final test asserts blocking/no false Save for a mixed state
and exact explicit acceptance only after all four exchanges. SDK command5 originally
used a final plain advance after Return and timed out after five passing assertions;
the harness now advances until the main menu and checks every say/Character name.
The sandboxed native-worker test failed all six at loopback bind PermissionDenied
before product execution; the socket-authorized run passes6/6. None is normalized
as a pass or charged as a package/editor start. No protection/signing policy changed.

`.github/workflows/selectable-proposals.yml` and `qualify-selectable.py` prepare one
fresh paired dispatch with exact head/tree/input/tool/SDK identity, positive exact
counts, native receipts and manifests. Windows schedules one package/two launches;
Mac CI has no approved signing identity, so signed local native proof remains required.
Native selectable probe/driver require19 phase1 checks,2 process-reopen checks and6
exact request body digests. Native keyboard selection must show missing-Character
refusal, disabled Save and retained focus, alongside light/dark/compact/Generate/Save.
Before editor launch, supported native inventory reports the Mac is locked and cannot
unlock automatically. User was asked to unlock; no Loomlight app binding/implicit
launch occurred. Continue unaffected CI preparation; do not claim native acceptance.

Pre-dispatch cumulative totals: **Mac0/4packages,0/8editor starts,0/4dispatches;
Windows0/4packages,0/8editor starts,0/4dispatches; live0/2batch generations total,
0/1discovery.** No user/real-provider key requested/retrieved/read/exported; no live request.
Existing selected endpoint/model only, fresh native user entry and explicit temporary
storage/cleanup remain required when live qualification is ready. No owned editor,
listener/root or temporary credential remains from controller/SDK tests. No pending CI
was found during fresh branch run inspection. Next: publish the implementation,
dispatch paired CI1 with exact identity, record status/counts and end polling under
manual same-thread wait. After terminal audit, finish signed Mac/native/live checks
when desktop/key entry capability is available. No merge/release/generic/next outcome.


First implementation is published asdcb106c06b9fa1d9fda6de3b6ed6d4d0be39aaae.
GitHub callable workflow inventory does not expose the new branch-only recipe; no
failed dispatch was attempted. Add an exclusive selectable_proposals selector to the
registered production workflow357322921, which calls the branch-local reusable recipe.
This changes no main/default branch and runs no older/package matrix selectors.
Admission refuses mixed action/upload/reuse inputs; the recipe still owns paired
bounds/identities. Both wrapper and recipe are captured as material input hashes.
Supplemental shared probe-gate discovery reports27pass/2Windows-only skips locally;
those platform helper regressions are not claimed passed. The required new8 gates
and listed local suites have zero skips. Cumulative dispatch/package/start/live totals
are still zero until the recorded first dispatch/actual attempts below.


#### Selectable CI1 dispatch and manual same-thread wait — 2026-10-11

Independent narrow routing review passes after explicit Windows prefix/PATH/pinned
npm CLI and Mac global npm CLI selection. Gate8 and actual pinned Mac npm11.9.0
identity checks pass; structure/link/privacy validation passes511 files. Implementation
commitdcb106c is followed by reviewed route commit
**54ac943dda15f55d353f359fd3785d52f89ecdc5**, published on the same branch. No main
change/merge, failed dispatch or editor/package/live attempt was needed for routing.

Registered workflow**357322921** (`production-scaffold.yml`) dispatches
**run38144885050/attempt1**, exact head**54ac943dda15f55d353f359fd3785d52f89ecdc5**,
branch`codex/provider-qualification`, created2026-10-11T13:52:06Z. Inputs:
`selectable_proposals:true`, `selectable_dispatch_ordinal:1`,
`rewrite_build_ordinal:1`, `rewrite_first_launch_ordinal:1`; dialogue_rewrite_windows,
continue_scene, draft_scene, generate_card, generate_lore, phase2_studio and
upload_packages are allfalse; both reuse IDs empty. Exclusive admission calls the
same-commit reusable selectable recipe. API returned the exact run URL; the immediate
list did not yet expose it. One identity-resolution read confirms that same run;
no second dispatch. Last observed **in_progress**, no conclusion, at
**2026-10-11T13:52:50.420970Z**; run updated13:52:23Z. Stop polling now.
[Exact run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38144885050).

Cumulative **paired dispatch1/4 on each target**. Mac remains**0/4packages,
0/8editor starts**; live**0/2batch generations total,0/1discovery**. Windows CI1
is authorised for packageordinal1 and launches1–2, but actual package/start attempts
have not yet been observed; do not report planned attempts as actual passes/counts.
On terminal resume audit the emitted attempt ledger, including failures and early
stops, before deciding remaining Windows counts. There are no local editor/listener/
fixture roots or real-provider credentials owned by this continuation. Mac remains
locked at the last supported observation; user unlock and later fresh native key
entry are prerequisites for the remaining signed Mac/native/live work.

Manual same-thread pause leaves this outcome unfinished. User returns here when CI
is terminal; verify exact run/attempt/head and both required paired jobs, download/audit
unexpired manifests and input/source/package hashes, positive count gates, SDK results,
Windows real native stage receipts/PNGs/body digests and cleanup. Missing/failed/
skipped/cancelled evidence cannot pass. Reconcile fresh refs without reset; subsequent
status-only commits do not replace this candidate. No automatic polling, watcher,
retry or new outcome. Continue in-scope fixes and remaining native/live qualification
only within existing cumulative caps; notify when ready for fresh native user key entry.
Retain old Studio/full Phase2/generic/human distinctions and unchanged evidence.


#### Selectable CI1 failure audit and acquisition correction — 2026-10-12

User explicitly authorised reviewing/fixing CI and another run, and **polling CI for
this chat only**. This overrides manual waiting only here; no watcher/automation or
new allowance. Fresh refs match local/origin f03bfb5; main remains5f448ca. No reset.

CI1 run38144885050/attempt1/head54ac943 completed **failure** at
2026-10-11T13:54:23Z. Admission passed and four older jobs intentionally skipped.
Required Mac job114486071577 and Windows job114486071616 both failed curl28 connecting
to the official checksum host before qualification. All tests/package/native steps
were skipped; artifact count is zero. Actual Mac and Windows **packages0/4,
editor starts0/8**, paired dispatches**1/4**; live**0/2**, discovery**0/1**. No
qualification pass is claimed. Ignored complete failed-job log SHA256: `a4225506c14bc8017f67b6f8f9ffdb994616ab0216b0d1b5c45128217d3f6c43`.

Bounded local www/apex/explicit-IPv4 probes also timed out; no IPv6 diagnosis or
unverified alternate download is assumed. Reuse the previously qualified official
SDK8.5.3 archive in existing Mac/Windows SHA-keyed caches, preserving the same published
archive pin. Retain the identical public official checksum manifest with provenance;
verify full snapshot and archive bytes. Fresh controller/SDK runtime remains required.
Cache miss permits one bounded official HTTPS download; corrupted cache is refused.

Bootstrap receipts now precede tool/network acquisition, and always-run sealing/upload
retains early failures, zero actual attempts and complete outer manifest. The qualifier
uses a fresh child directory, with no stale-output or qualification reuse. Terminal
promotion binds candidate/run/attempt/platform, child manifest, cleanup and ledger.
Twelve focused gates pass without skips, including malformed/identity/cleanup/manifest
refusal; actual cached official archive verification and early-failure manifest pass.
No package/editor/live attempt occurred during this correction. Independent read-only
review covers acquisition/provenance and evidence gates. CI2 will use dispatchordinal2,
Windows packageordinal1/starts1–2, counting actual attempts from retained evidence.


#### Selectable CI2 dispatch with chat-only polling — 2026-10-12

Independent read-only correction review passes. Published candidate
**a16c5f701313eebb26f23fd2ab643a0a4deaf044** includes SDK cache/checksum and retained
bootstrap corrections. Gates12/12, actionlint, four-file bootstrap privacy and structure/
links/privacy514 pass. System Python bytecode-cache write was sandbox-denied; the same
syntax check passes with its cache routed to ignored workspace storage. No app attempt.

Fresh registered workflow357322921 accepted **run38146108645/attempt1** at
2026-10-11T14:10:26Z, exact candidatea16c5f7 and branchcodex/provider-qualification.
The returned URL was resolved directly, no duplicate dispatch. Inputs are CI1’s
exclusive selectors/empty reuse IDs, with selectable_dispatch_ordinal2; packageordinal1
and starts1–2. [Exact CI2 run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38146108645).
Initially queued. **Paired dispatch2/4 each**; actual Mac/Windows packages0/4 and
starts0/8 until emitted attempts are audited. Live0/2, discovery0/1. Current chat-only
polling is explicitly authorised; no automation/watcher or widened budget. Required
failed/skipped/missing checks cannot pass; retain terminal manifests/input/native/SDK/
cleanup audit. Signed local Mac/native/live and full Phase2/human acceptance remain pending.


#### Selectable CI2 Windows harness failure and narrow correction — 2026-10-12

CI2 Windows job114489708098 completed failure after successful SDK cache acquisition,
renderer132/frontend/selectable8/prompts5. Gate suite had11 passes and1 failure:
the npm argument-array test expected Unix `/public/node`, while Windows `Path`
correctly produces native separators. This is a fixture assertion defect; no product
failure is inferred. Correct the expected argument with `str(Path('/public/node'))`,
retaining direct pinned Node/npm invocation without shell. Local gates12/12 pass.

Artifact11705176491 has13 files. Exact outer/child manifests, candidatea16c5f7/run/
attempt1, every input hash and cleanup pass audit. The only git-blob byte difference
is the explicit `.gitattributes` CRLF checkout for rewrite-windows-native.ps1; its
checkout hash verifies. Failed result remains failed. No package/editor attempt
ledger exists because both operations were unreached; Windows actual packages0/4,
starts0/8. Artifact privacy13 passes. Ignored full Windows job log SHA256: `68fcb7da8f0cd34f68b0bfb1d4771027171ffce8a794d11cb2d9f39dcc058b12`.
Mac CI2 remains running pending its required audit. Paired dispatch2/4; no CI3 yet,
no live call or broader scope. Review the narrow fixture correction independently,
await Mac terminal result, then publish and dispatch within the remaining two paired
runs. Original caps remain; chat-only polling permission persists.


CI2 terminal at2026-10-11T14:16:38Z is overall **failure**, with Mac job114489707995
**success** and the diagnosed Windows harness gate failure. Mac artifact11704517908
contains31files: outer30-entry/child26-entry manifests,264material inputs with the
same declared PowerShell CRLF transform, exact a16c5f7/run/attempt/platform and privacy
all verify. Renderer132/selectable8/prompts5/gates12/nativeworker6, actual controller,
pinned SDK8.5.3 ten commands/two metadata-free create/update cases all pass; literal
Character/Beat/protected-text runtime, accepted-source hashes and cleanup pass.
Mac CI contributes no package/editor launch. Both actual platform counts remain0/4
packages,0/8starts; paired dispatch2/4. Independent read-only review confirms the
one-line Windows expected-path correction; all12 local gates pass. Publish that
correction and use fresh paired CI3 with dispatchordinal3/packageordinal1/starts1–2.
No old-run rerun, artifact substitution, or native/live/human acceptance claim.


#### Selectable CI3 dispatch — 2026-10-12

Reviewed correction published **78a638984118515991494755fcabc69a16ddba01**. Fresh
registered workflow357322921 accepted **run38146640617/attempt1**, exact head78a6389,
branchcodex/provider-qualification at2026-10-11T14:18:25Z, initially queued. Direct
returned URL identity resolves; no duplicate. [Exact CI3 run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38146640617).
Inputs remain exclusive selectable selectors/empty reuse IDs; dispatchordinal3,
packageordinal1/starts1–2. **Paired dispatch3/4 each**; actual Mac/Windows packages0/4
and starts0/8 until emitted attempts audit. Live0/2, discovery0/1. One paired dispatch
remains after this accepted run. Continue bounded chat-only polling, terminal artifact
and native evidence audit; never report planned package/launch attempts as passes.
Mac desktop remains locked; no binding/start. Signed Mac/native/live/human/full Phase2
acceptance remains pending, with generic/provider/signing/merge/release deferred.


CI3 Mac job114491300060 **success**, artifact11704998015 audited31files. Independent
read-only audit agrees: exact outer30-entry/child26-entry file sets and hashes,
264material inputs versus78a6389 with declared PowerShell CRLF checkout, exact run/
attempt/DarwinARM64/pinned tools. All10 receipts pass; raw counts renderer132/core8/
prompts5/gates12/workers6 and controller marker verify. SDK8.5.3 ten commands/two
metadata-free cases/17 runtime assertions, fixture/export/source hashes, accepted
source unchanged and cleanup verify. Artifact privacy31 passes. Mac CI no package
or editor start. Windows job114491300090 remains running; overall CI3 not yet passed.
Signed local Mac/native/live/final human/full Phase2 remain separate pending.


#### Selectable CI3 Windows native selection failure and correction — 2026-10-12

CI3 overall **failure**, terminal2026-10-11T14:34:43Z. Windows job114491300090 passed
renderer132/frontend/core8/prompts5/gates12/workers6/controller/SDK/preflight/package/
package privacy and native light/dark/compact/physical Generate. It failed physical-select
postconditions at native driver line254. Receipt proves Space injection but no prior
checkbox keyboard focus observation. The before capture shows Save focused; the earlier
UIA inventory contains enabled typed Character CheckBox. Which control received Space
is not proven; do not declare a product defect or completed native selection/Save.

Artifact11705393402 contains57files. Exact outer56-entry/child52-entry manifests,
264material inputs with declared PowerShell CRLF checkout, exact candidate78a6389/run/
attempt/WindowsAMD64, copied executable/package-input hash and privacy57 pass. Owned
SDK/root/credential-reference cleanup passes. Emitted ledger charges **Windows package1/4
and editor start1/8**; reopen was unreached. Mac actual0/4packages,0/8starts; paired
3/4 each. Prior reservations do not charge unused starts. Live0/2, discovery0/1.

Independent read-only diagnosis confirms absent preinput focus proof. Correction uses
unique typed CheckBox, enabled/focusable/ToggleOn, actual OS Tab navigation from observed
Save, typed keyboard focus and viewport before Space, ToggleOff/dependency/disabledSave
and retained focus after re-render. Strengthened gate requires all new observations.
Failed selection retains focus/toggle diagnostics and PNG. Product/core/probe behavior
is unchanged. Local gate12 and native-evidence14 pass with no skips; required new
focus/toggle fields cannot be omitted or false. No local Windows native proof is
claimed; the required host remains CI. Review before the **last paired CI4**, planned
dispatchordinal4/packageordinal2/starts2–3. No allowance extension or later dispatch.


Final independent driver review passes after treating temporary checkbox absence as
not ready during bounded re-render waits, preserving strict preinput uniqueness and
duplicate-control refusal. OS Tab begins at verified Save; no UIA checkbox SetFocus
assumption. Gate12/native14 pass, workflow actionlint and repository514 validation
pass. PowerShell5.1 syntax reviewed by inspection; native runtime remains required on
CI4. Fresh Mac inventory still locked; user unlock requested asynchronously while
continuing CI. No local Mac build/start or real-provider operation. Publish this
reviewed correction, preserving CI3 failure and final remaining dispatch boundary.


#### Selectable CI4 final dispatch — 2026-10-12

Reviewed native correction published **923d9aad644ccc01bde3f087f3bd7888eee96e6d**.
Fresh registered workflow357322921 accepted **run38148312472/attempt1**, exact head923d9aa,
branchcodex/provider-qualification, created2026-10-11T14:43:05Z, initially queued.
Direct returned URL identity confirms; no duplicate dispatch. [Exact final CI4 run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38148312472).
Inputs retain exclusive selectable selectors/empty reuse IDs; dispatchordinal4,
packageordinal2/firststart2 (reopen3). **Paired4/4 each, fully consumed**. No further
CI dispatch/rerun without a real new allowance decision. Last audited actual Mac
0/4packages,0/8starts; Windows1/4packages,1/8starts; CI4 actual attempts await emitted
ledger audit, including early failures. Live0/2/discovery0/1. Continue only this exact
run’s bounded current-chat polling and terminal artifact audit. Signed Mac/native/live
remain blocked by the locked host pending user unlock; no native entry or live call.
No approval extension, watcher, provider/signing change, merge/release or next outcome.


#### Selectable CI4 terminal audit and portable snapshot correction — 2026-10-12

CI4run38148312472/attempt1/head923d9aad644ccc01bde3f087f3bd7888eee96e6d completed
**overall failure** at2026-10-11T14:57:30Z. Mac job114496251905/artifact11705730682 passes
all automated/controller/SDK proof;31files, outer30/child26 manifests,264inputs and
privacy audited. Windows job114496251860/artifact11706505640 contains62files with exact
outer61/child57 manifests,264inputs (declared PowerShell CRLF), candidate/run/attempt/
platform/tool identities, copied executable/package hash and privacy62 verified.
Independent audit agrees. SDK8.5.3 two metadata-free cases/ten commands/17 runtime
assertions and accepted export/source digests pass on both targets; cleanup complete.

All **six Windows native stages pass**: light/dark/compact/Generate, stricter typed
checkbox selection and physical Save. Exact native PID/executable ownership, receipts
and before/after PNG hashes verify. Character checkbox keyboard focus and ToggleOn→Off,
dependency refusal/disabledSave and retained focus observed; physical Save consumed
one transaction and disabled controls. The keyboard correction is established.
Full phase1 still **fails** after10/19 checks at `Exact selected patch differs`; phase2
is unreached. Do not infer exact saved bytes, native Undo/Redo/update/failure-path/project/
process reopen qualification from those partial passes.

Independent read-only diagnosis confirms a deterministic **probe path-key defect**:
Rust snapshot used native relative Path string (`game\...` on Windows), while the
renderer probe indexes core forwardslash preview paths (`game/...`), comparing an
absent value to a SHA. Recovery prefix filtering has the same mismatch. This is a
sufficient cause for this failure; no product transaction change is indicated, and
artifact does not retain a post-Save source snapshot that could prove every saved byte.

In-scope correction joins UTF8 normal relative path components with `/`, retaining
containment/link refusal and exact bytes/digests; duplicate keys refuse. Product patch
logic is unchanged. **Two local Mac snapshot_paths tests pass**, covering actual nested
BOM/mixed-newline hashes, preview-key/recovery-filter shape and Unicode/nonrelative
refusal. Independent correction review passes; future qualifier explicitly gates2tests.
This is a locally verified harness correction, **not post-fix Windows native proof**.
No new package/editor/live attempt or additional CI dispatch for this correction.

Actual cumulative **Windows2/4packages,2/8editor starts**: CI3 ordinal1/1 and CI4
ordinal2/2. Reopen reservations were unused. Mac**0/4packages,0/8starts**.
**Paired CI4/4 on each target, exhausted**; no CI5/rerun under this allowance.
Live**0/2batch generations,0/1discovery**. Prior allowances remain closed.
Ignored CI4 Windows complete-job log SHA256: `a0be89f04795cb540a8ae75760316b15622bd9563cd12b53539bdcb56a09d206`.

Qualification is **blocked by the exhausted focused CI allowance** for corrected
Windows native proof, and locked Mac for signed local native/live work. User unlock
request remains unanswered; no native app binding or key entry. Publish reviewed
snapshot fix and accurate current/handover records. A concrete additional paired-run
allowance or named alternative required-host capability decision is necessary before
another CI operation; do not request original scope approval again or extend limits.
Fresh native key entry is needed only when the unlocked signed app is ready for the
remaining live checks; never retrieve old keys/read or export credentials. No watcher,
provider/signing/merge/release expansion or following deliverable. Full Phase2/generic/
final human acceptance remains incomplete; unchanged prior evidence remains reusable.


#### Selectable CI5 additional paired allowance — 2026-10-12

User explicitly approved “another ci run” after the CI4 audit and published portable
snapshot correction2446501. This grants **one additional paired focused run**, extending
the selectable cumulative dispatch ceiling **4→5 per target**; package4/editor8 and
live2total/discovery1 ceilings remain unchanged. Prior outcome allowances remain closed.
Current-chat polling permission persists; no watcher or automatic follow-up.

Fresh refs match2446501 locally/origin; main remains5f448ca, clean worktree, no reset.
Only selectable workflow dispatch guards/descriptions extend to5. Plan fresh attempt1
CI5 with Windows packageordinal3/firststart3 (reopen4 if reached), exclusive selectable
selectors, no prior-run reuse/uploads. Actual pre-dispatch totals: Windows2/4packages,
2/8starts; Mac0/4packages,0/8starts; paired4/5 each; live0/2, discovery0/1.
Published candidate will include the reviewed snapshot fix and its exact2-test gate.
Independent read-only review before publication/dispatch; then terminal artifact audit.
Mac signed native/live remains blocked by locked desktop; no fresh key entry yet.


#### Selectable CI5 confirmed dispatch — 2026-10-12

Reviewed amendment published as8174811e9a06a6e6cfa3aa684077f1c39f1b4e49.
[CI5run38172627199](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38172627199),
workflow357322921, attempt1, exact head8174811, branchcodex/provider-qualification,
created2026-10-11T20:32:19Z; initial statusqueued, no conclusion. Direct returned URL
resolved once; no duplicate dispatch. Inputs selectabletrue/dispatch5/build3/firststart3,
all older selectors/uploadfalse, both reuseIDs empty. Ignored selectable-ci5-dispatch.json
retains receipt/exact identity. Paired5/5 each now consumed; no sixth run or rerun.
Actual pre-terminal Windows2builds/2starts, Mac0/0; emitted attempts await audit.
Live0/2, discovery0/1. Current-chat polling explicitly permitted through terminal audit.


#### Selectable CI5 terminal audit and probe ownership correction — 2026-10-12

CI5run38172627199/attempt1/head8174811e9a06a6e6cfa3aa684077f1c39f1b4e49 completed
**overall failure2026-10-11T20:46:25Z**. Mac job114568274597/artifact11715280446
passes11 automated/controller/SDK checks, including2snapshot tests; audited32files,
outer31/child27 manifests,264inputs. Windows job114568274585/artifact11715256960
audited63files, outer62/child58 manifests,264inputs. Both exact candidate/tree/run/
attempt/platform/tool/SDK identities and declared PS1CRLF transform verify. Independent
read-only audit agrees; local final privacy scans32/63 pass, because Windows terminal
evidence-privacy gate was unreached. SDK8.5.3 two cases/ten commands/17 assertions,
exact exported source hashes, metadata absence and unchanged accepted source pass.

Windows package3 copied executable SHA256
`0bfb6e5829d47b0fd24d10bafc0e3130e5efdd4c1315af05cf9105d43f921c13`
matches nativePID1232 and all6 exact receipts/intact PNGs. **Exact selected files
committed now passes**, establishing the portable path fix. Phase1 stops after11/19
at `Fixture unavailable` during async Undo/snapshot waiting; phase2 is unreached.
Native Undo/Redo/update/refusal/project/process reopen still have missing proof.

Diagnosis is a grounded **probe race inference**: snapshot stage bypassed the host
checkout while the probe Undo click starts asynchronous source/history mutation;
recursive snapshot reads can overlap file exchange or recovery cleanup. The generic
error omits operation/path/OS error, so the exact failing filesystem read is unknown.
A separate concrete cleanup defect short-circuited host.shutdown when credential
cleanup failed; credential cleanup also lacked pre-dispatch busy waiting.
CI5 cleanup is explicitly **unresolved**: SDKroot removed, owned root and public
synthetic credential references unconfirmed. No real-provider credential or key
was involved; do not relabel the failed report clean from runner termination.

In-scope correction serializes snapshot through ApplicationHost checkout, returning
typed RUNTIME_BUSY only for pre-dispatch checkout contention so existing bounded
read retry applies. Inner I/O/path/link errors stay failures; recovery bytes remain
included. Probe credential cleanup waits up to10seconds only for outer checkout-busy
and executes once after entry; inner failure is never retried. Host shutdown always
executes independently; terminal report records each cleanup owner and cannot pass
when any owner fails. No product transaction behavior or provider authority changed.

**Four focused local probe tests pass**:3snapshot paths/ownership and1cleanup deadline/
inner-failure case. Held-host test refuses a deliberately absent in-flight fixture with
typed busy, then hashes exact committed bytes after release; cleanup deadline invokes
zero tasks and inner failure invokes exactly once. Future qualifier gates exact3+1.
Initial local compile function-signature mismatch was corrected with the owned-service
closure; ignored compile1 log retained. Local gate12, actionlint, structure/privacy
and diff checks apply; no new package/editor/live/CI operation for this correction.
Independent correction review precedes publication.

Actual cumulative **Windows3/4packages,3/8starts** (CI5 package3/start3; reopen4 unused);
**Mac0/4packages,0/8starts**. Paired**5/5 each exhausted**, including explicitly granted
CI5; no CI6 or old-run rerun. Live0/2total generations, discovery0/1. Windows complete
job log SHA256 `e72b91bfbff45ad11bb73474884b74f59020baee2dc3c24bff079020052c1180`.
Post-correction Windows/native cleanup proof needs a new allowance decision or approved
required-host capability. Mac remains locked, no app binding or fresh key entry.
Publish reviewed correction and accurate blocked records, preserving all unique failed
artifacts. Full Phase2/generic/final human acceptance remains incomplete.

Independent final read-only correction/gate/status review passes. The Undo probe step
uses the production button’s DOM click; OS-native input proof covers Generate/selection/
Save. Local4probe/12gate, actionlint, rustfmt, Python syntax and514-file validation pass;
no post-correction native/cleanup acceptance or additional execution is inferred.


#### Independent Sol review and approved CI6 allowance — 2026-10-12

User requests an independent GPT-6.1 Sol review/fix of CI5 issues and then explicitly
authorises one additional CI run. Fresh refs/worktree matched6246b8b locally/origin,
main5f448ca; no reset/discard. A fresh GPT-6.1 Sol High agent held sole serial code
ownership while the parent made no writes. It independently inspected CI5 evidence,
6246b8b and downstream Undo/Redo, Character update, malformed/unselected/cancel/stale,
project/process reopen and cleanup. Existing correction addresses the grounded race
hypothesis and definite shutdown short circuit; no additional concrete defect found.
No artificial code changes. Sole-writer ownership returned;6246b8b retained.

Independent focused checks passed4/4desktop rewrite_probe,2/2native helper/busy retry,
12/12selectable rejection gates and clean-tree/diff check. Ignored
selectable-ci6-independent-review.txt records commands/observed results, not raw stdout.
Agent used zero packages/editor starts/CI/network/provider/credential operations.
Post-fix Windows native and cleanup remain missing proof; CI5 cleanup remains unresolved.

One new paired run extends dispatch ceiling**5→6 each**, preserving cumulative prior
consumption and package4/editor8/live2total/discovery1 ceilings. Plan fresh attempt1
CI6, Windows packageordinal4/firststart4 (process reopen5 if reached), exclusive
selectable selectors/no upload/no old-run reuse. This is the last remaining Windows
package attempt under the original cap. Pre-dispatch totals: Windows3/4packages,3/8
starts; Mac0/4packages,0/8starts; paired5/6each; live0/2, discovery0/1. Prior outcome
allowances stay closed; no CI7/rerun authorised. Current-chat polling permission
persists, no watcher/automation. Publish reviewed allowance amendment after independent
read-only review, then dispatch and audit exact candidate/run/artifact/actual attempts.
Mac inventory still locked; no local editor binding/start or key entry.


#### Selectable CI6 confirmed dispatch — 2026-10-12

Reviewed independent-review/allowance amendment published2a3bd895c5dd3e941cae06191c385d541751d448.
[CI6run38174608600](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38174608600),
workflow357322921/attempt1/exacthead2a3bd89/branchcodex/provider-qualification, created
2026-10-11T21:01:05Z, initialqueued/no conclusion. Direct returned URL resolved once;
no duplicate dispatch. Inputs selectabletrue/dispatch6/build4/firststart4, all older
selectors/uploadfalse, both reuseIDs empty. Ignored selectable-ci6-dispatch.json retains
exact receipt/identity. **Paired6/6each consumed**; no CI7/rerun. Actual pre-terminal
Windows3packages/3starts, Mac0/0; final build4/starts4–5 await emitted-attempt audit.
Live0/2/discovery0/1 unchanged; prior allowances closed. Current-chat polling permitted.


#### Selectable CI6 terminal audit and idempotent remount correction — 2026-10-12

CI6run38174608600/attempt1/head2a3bd895c5dd3e941cae06191c385d541751d448 completed
**overall failure2026-10-11T21:15:45Z**. Mac job114574226140/artifact11715536298
passes all12 automated/controller/SDK checks;33files, outer32/child28 manifests.
Windows job114574226187/artifact11716160731 contains64files, outer63/child59
manifests. Both exact candidate/tree/run/attempt/platform/pinned-tool identities,
264material input hashes with declared PS1CRLF transformation and all artifact hashes
verify. Historical CI6 raw counts are renderer132/core8/prompts5/gates12/snapshot3/
cleanup1/workers6; controller build/dispatch and SDK pass. SDK8.5.3 two metadata-free
cases/ten commands/17 assertions, exact accepted exports and unchanged source verify.
Owner final privacy33/64 passes, including Windows where terminal pipeline privacy
was unreached. Independent read-only artifact audit agrees; failure remains failure.

Windows copied executable SHA256
`e34fa263383bdf955c7fba8a9cd03852ff7a8c08b5e1fb69144bed095da9813a`
matches package4/nativePID2244. All6native light/dark/compact/Generate/selection/Save
receipts and intact captures pass. **Exact selected files committed, one Undo and
one Redo pass**, establishing the earlier ownership/snapshot correction. Phase1 stops
after13/19 with `Error: Timeout at physical-accept`, a stale stage label; only1reviewed
body digest. Supported Character update, later refusals/project/process reopen and
phase2 remain unpassed. Do not infer later native qualification from controller proof.

CI6 **cleanup passes**: request/credential/host owners alltrue, SDKroot/ownedroot/public
synthetic credential references removed and cleanupComplete true. This establishes the
6246b8b cleanup correction, not retrospective CI5 cleanup; CI5 remains unresolved.
No real-provider key or credential operation occurred. Ignored terminal receipts, exact
artifacts, owner audits and complete Windows job log retain the unique failure.
Windows job log SHA256 `bf74523eba38b969d51cc416bf828006b57f358f72ca141fe7abdf1ea30d3980`.

The user-requested fresh **GPT-6.1 Sol High independent owner** resumed sole serial
code ownership after CI6. It found a concrete downstream **harness defect**:
mount(false) unconditionally clicks the narration Beat disclosure. Production Scene
selection toggles; accepted Save selects that Beat and Undo/Redo preserve it. The
remount click therefore deselects it and disables Assist Edit Scene. A regression
using actual production Scene/history controls reproduces this exact failure.

In-scope five-file correction adds an idempotent rendered fixture selection helper,
requires unique target, clicks only when unselected and observes selected state before
Assist. Mount records create/update stage; wait records the fixed awaited control.
Failure diagnostics retain bounded panel/control/state/count facts without project text,
paths or credentials. Production toggle/core/transaction behavior is unchanged. The
new regression covers fresh/already-selected behavior, missing-target refusal, actual
probe timeout reporting and private DOM text absence. Exact renderer gate is now133,
and rejects old132; historical CI6 evidence remains132.

Local **renderer133/133, native helper3/3 and gate12/12 pass**, zero failed/cancelled/
skipped/todo. Exact final renderer log gate and diff check pass. Ignored raw focused,
renderer-final and gate logs plus selectable-ci6-repair-audit.txt retain commands,
results and hashes. Initial renderer test failed because HappyDOM did not reflect the
production ariaExpanded property through getAttribute; helper/wait/test now use the
production property. Initial failed log retained. Initial direct Python verification
lacked scripts import path and did not invoke its gate; corrected invocation passes.
Independent read-only code review passes with no findings. Sole writer returned to
parent; no new package/editor/CI/network/provider/credential operation for this repair.
This is local harness/renderer proof, **not post-fix Windows native qualification**.

Actual cumulative **Windows4/4packages,4/8starts**, including CI6 package4/start4;
reopen5 unreached. **Mac0/4packages,0/8starts; paired6/6each exhausted**, including both
explicit one-run extensions. Live0/2total batch generations, discovery0/1. Prior
allowances closed. **No CI7/rerun or Windows package5 authorised**. Corrected Windows
native update/refusal/reopen proof requires both a new Windows package and paired-CI
allowance or approved required-host capability decision; original scope approval
persists. CI6 polling completed, no watcher/automation remains. Mac inventory is still
locked, no app binding/start/key entry; fresh native entry needed only when signed app
is ready. Never retrieve old keys/read or export credentials. Publish reviewed repair
and accurate blocked records. Full Phase2/generic/final human acceptance remain incomplete.

Final independent read-only code/status release review passes with no findings.
JavaScript/Python syntax,514-file structure/privacy validation and diff check pass;
fresh refs still match2a3bd89/main5f448ca. Authorized publication preserves all failed
evidence and exhausted limits; no additional native/CI/live qualification inferred.


#### Remaining Windows suite review and approved CI7 — 2026-10-12

User asks to check the rest of the Windows CI suite for similar issues, fix, then run
another CI. This explicitly grants one additional **Windows package attempt4→5** and
**paired focused dispatch6→7 each**, as needed for the requested run after the stated
exhaustion. Mac package4, editor8perplatform, live2total/discovery1 caps remain unchanged.
No cap reset, CI8/Windows package6/rerun, generic/provider/signing/merge/release or next
outcome. Pre-CI7 actual Windows4packages/4starts, Mac0/0, paired6, live0/discovery0.
Plan fresh attempt1 Windows package5/firststart5/reopen6 and paireddispatch7, exclusive
selectable selectors, no upload/reuse. Current-chat polling permission persists.
Fresh refs match4c85929 locally/origin/main5f448ca, clean baseline; unrelated work preserved.

User-requested GPT-6.1 Sol High owner resumed sole serial code ownership while parent
made no tracked writes; independent GPT-6.1 Sol High reviewer audited the entire
remaining native/Python/PowerShell/controller/probe/evidence chain. Three concrete
harness/failure-path gaps were found and fixed before the next package:

- Watchdog used short-circuit shutdown and omitted synthetic credential cleanup.
  Shared owner cleanup now attempts requests, bounded synthetic credential cleanup
  and host independently, records each fact and keeps watchdog passed:false.
  Successful phase1 native credential retention remains unchanged.
- Qualifier selected reports[-1] from unordered glob. It now records the actual phase
  before launch and consults only that exact phase receipt. Failed/missing/malformed
  phase2 cannot use older phase1 success to remove the root or claim cleanup.
- Subprocess TimeoutExpired lost partial output. Raw byte/text stdout/stderr are now
  retained, check remains failed and timeout is rethrown.

New renderer integration uses the actual production main shell, Scene, Assist/controller,
helper and unmodified selectable JS probe through19phase1/2phase2checks, six sends/two
Saves/UndoRedo/update/refusals/cancel/stale/project and simulated process reopen. Controlled
IPC is explicit: this is renderer/probe sequencing, not actual core/filesystem/native
input/credential/process qualification. Late cancelled completion and delayed preparation,
accept/discard/history are covered. A reviewer readiness inference was challenged with
asserted renderer status250ms and scene-list250ms versus probe15ms; it did not reproduce.
Production RequestLane/discard sequencing supplies ordering on this chain, so no
speculative readiness fix. No additional product/UI/core defect was established.

Final raw verification passes **renderer134/134, helper3+sequence1=4/4, gates14/14,
cleanup2/2**, zero failures/skips; exact retained-log134/14/2 gates and diff check pass.
Ignored selectable-ci7-repair-audit.txt binds five final code/test inputs and six final
raw logs by SHA256. Initial three sequence logs have TypeScript compile failures then
runtime passes from a non-fail-fast shell; these are retained **failed combined checks**.
Final checks compile clean with set-e. Formatter-only spill into unrelated files was
removed by reverting only the owner's formatting, preserving baseline bytes; final
code diff is five owned files. Independent final code/log review passes, no findings.
No new package/editor/CI/network/provider/credential operation during this repair.

Sole writer returned to parent. Narrow selectable workflow/qualifier caps extend to
build5/dispatch7, editor caps stay8 and legacy gates unchanged. TESTING/current/handover
track134/14/cleanup2 without rewriting historical132/133 evidence. Final workflow/docs
review and structure/privacy checks precede authorized commit/push and CI7 dispatch.
Mac remains locked with no native app binding/start/key entry. Full Phase2/generic/
final human acceptance and signed Mac/native/live remain incomplete.

Final independent workflow/docs/source/log review passes, no findings. Actionlint,
Python syntax,515-file structure/privacy validation and diff check pass. Five source
hashes/six successful log hashes still match owner audit. CURRENT339/HANDOVER571words
are compact complete records. Fresh refs remain4c85929/main5f448ca. Publish reviewed
coherent candidate, then dispatch once and audit exact identity/actual attempts.


#### Selectable CI7 confirmed dispatch — 2026-10-12

Reviewed coherent candidate5f593225fad2ebdb2970663d56ee83631b27ecef is published.
[CI7run38178036314](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38178036314),
workflow357322921/attempt1/exacthead5f59322/branchcodex/provider-qualification, created
2026-10-11T21:50:49Z, initialqueued/no conclusion. Direct returned URL resolved once,
no duplicate dispatch; ignored selectable-ci7-dispatch.json retains exact receipt.
Inputs selectabletrue/dispatch7/build5/firststart5, all older selectors/uploadfalse,
both reuseIDs empty. **Paired7/7each consumed**; no CI8/rerun or Windows package6.
Actual pre-terminal Windows4packages/4starts, Mac0/0; package5/starts5–6 await emitted
attempt ledger audit, including failures. Live0/2/discovery0/1 unchanged; prior caps
persist. Current-chat polling explicitly authorised, no automation/watcher.
Terminal exact artifacts/native reports/privacy/cleanup/actual counts remain to audit.


#### Selectable CI7 terminal qualification and unlocked Mac continuation — 2026-10-12

CI7run38178036314/attempt1/head5f593225fad2ebdb2970663d56ee83631b27ecef completed
**overall success2026-10-11T22:07:44Z**. Mac job114584496211/artifact11716217918
passes12checks;33files, outer32/child28 manifests. Windows job114584496091/artifact
11717112693 passes17checks;68files, outer67/child63 manifests. Both exact candidate/
tree/run/attempt/platform/tools,265material inputs with declared PS1CRLF, child/outer
file sets and hashes verify. Raw renderer134/core8/prompts5/gates14/snapshot3/cleanup2/
workers6 and actual controller/native HTTP pass. SDK8.5.3 two metadata-free cases,
ten commands/17runtime assertions, exact accepted exports/unchanged source/cleanup pass.
Owner final privacy33/68 passes separately from pre-sealing artifact privacy logs.
Independent Mac read-only audit agrees; Windows independent audit follows.

Windows package5 copied executable SHA256
`5fd03b0f8f3080ea3d258d30ff23eadaf8d3aa3ce05ca631670265f0327605ae`
matches native PIDs9260/6908. All6native receipts/capture hashes verify. **All19phase1
and2phase2 checks pass**, six exact reviewed/HTTP bodies and zero HTTP on phase2;
four metadata hashes match. Exact selected Save/UndoRedo, supported Character update,
malformed/unselected/cancelled/stale zero-write refusal, project/process reopen and
native credential readability are established on Windows. The remount correction is
qualified; full-sequence local regression complements actual native/core proof.
Both phases' requests/credentials/host cleanup owners true; SDKroot/ownedroot/public
synthetic credential references removed. CI5 remains historically unresolved cleanup;
new success does not relabel earlier failures. Watchdog failure path is unit-tested,
not deliberately timed out or crashed for acceptance.

CI7-terminal pre-build totals **Windows5/5packages,6/8starts; Mac0/4packages,0/8starts;
paired7/7each exhausted**. CI7 package5/start5/reopen6 emitted; old unused reservations
stay unused. No CI8/Windows package6/rerun authorised. Live0/2total/discovery0/1 remains.
No watcher or CI process remains after terminal current-chat polling. Source candidate
5f59322 is qualified; docs-only successors do not replace that evidence identity.

User answered prior unlock request: Mac now unlocked. Supported inventory verifies
access and Loomlight stopped; no implicit app binding/launch. Public approved signing
fingerprint availability preflight passes without credential reads/exports. Existing
certificate/names/Keychain policy unchanged. Proceed to named signed local Mac package/
19+2 native selectable proof within Mac4packages/8starts, then notify when ready for
fresh native key entry for existing selected endpoint/model and remaining live2/GET1.
Do not retrieve old keys/read or export credentials. Preserve temporary-storage and
owned cleanup rules, historical cross-update/signing limitations and unchanged proof.
Full Phase2/generic/final human acceptance remains incomplete.

Independent Windows read-only audit passes, no findings:68files/265inputs, package
hash/PIDs/six receipts/PNGs,19+2checks/six bodies/metadata, SDK17 assertions and cleanup
all verify. Pre-sealing privacy60files differs from the owner final68-file scan; both
pass. Both platforms are audited, not merely green. Signed Mac/native/live remains.

#### Selectable signed Mac qualification and fresh live entry — 2026-10-12

Mac package1 passes strict existing certificate-leaf identity/names/signature and
read-only mounted installer contents; no signing/Keychain change. Executable SHA256
`724a405c34c43ee7659785fda4132b001d2037c0440c33bb0c668cb136fc01d9`; installer SHA256
`f06c21b2a95855c3ba449c695bc0e31bcb8d23c2ec6cab3fb28cdf4e2344a611`.
All265material inputs match qualified5f59322 with only declared PS1CRLF comparison.
Initial local comparison refused that known transform before reserving/building; no
attempt consumed by preflight. Package privacy5 passes; no implicit editor start.

Same bundle native1/PID412 and process reopen2/PID485 pass19+2checks: bound permissions,
inert proposal, keyboard Character unchecked/dependency refusal/disabledSave/retained
focus, independent subset/stable restored preview, exact selected files, one UndoRedo,
Character update and zero-write malformed/unselected/cancel/stale, project/process
reopen/native credential readability. Owner CUA observes light/dark/720logical compact,
physically Generate/keyboard selection/Save; raw AX/PNG and launcher PID/hash receipts
are retained. All six reviewed/HTTP body hashes match; process reopen sends zero HTTP,
four metadata hashes identical. Both cleanup request/credential/host owners true;
credential references/owned root removed and exact PIDs exited. Public accepted fixture
retained; native privacy115 passes before audit-manifest addition. Independent audit
follows; native automation/owner observations do not establish final human acceptance.

Live start3/PID659 uses same bundle/fresh public disposable fixture. Existing selected
Studio endpoint/model saved without connection and native credential entry requested;
user notified to enter/save fresh key natively and keep it out of chat. Pending user
handoff, no credential read/export, discovery or generation occurred. Owned launcher
has actual one-hour wait/group termination; timeout would not establish credential/root
cleanup. No screenshot or AX read of real native entry. Temporary storage/cleanup
consent persists. Next bounded live proof remains two synthetic batch generations total,
one discovery, subset/history/reopen/exact-sourceSDK and ordinary credential/root cleanup.
Actual Mac1/4packages,3/8starts; Windows5/5packages,6/8starts; paired7/7each exhausted.
No CI8/Windows package6/rerun. FullPhase2/generic/final human remains incomplete.

Independent Mac read-only audit agrees: all265inputs, exact bundle/executable/installer,
launch receipts/PIDs,115native manifest hashes,19+2checks/six exact bodies/metadata,
AX/captures/dependency/focus/Save and cleanup verify. Final native privacy116 passes.
Reviewer sandbox strict verification returns CSSMERR_TP_NOT_TRUSTED; original package
and approved-host read-only strict app/DMG reverify pass without policy changes. Both
contexts retained; no universal trust claim or signing/Keychain workaround.

User confirmed fresh native entry/save; UI configured/API key saved. Discovery1/1
passes exact selected Gemma availability. Synthetic selectable create generation1/2
sent, explicit narration/Character technical name/insertion authority, references and
reviewed payload digest retained. Public baseline copied before Send, no file/key read
outside synthetic project and no credential export. Result/acceptance remain pending.

#### Selectable live qualification and outcome closure — 2026-10-12

Selected implementation and owner qualification complete; independent live artifact
review precedes closure publication. Coherent code5f59322/CI7 remains the qualification
identity; documentary successors do not trigger new package/CI attempts. Implementation
contracts/core/controller/SDK/native evidence together establish the bounded outcome,
not fullPhase2/generic/final human acceptance.

User fresh native key entry/save was observed only as configured/API key saved;
no key retrieval from chat/logs or credential-file read/export. Discovery1/1 found exact
existing selected Gemma. Exactly two synthetic selectable generations total returned
valid3operation proposals. First: narration replacement plus new Mira Character and
one2-Beat group; removing Character disables Save/explains dependency with zero writes.
A valid Character+group subset excludes the narration replacement; fresh core preview/
digest is reviewed and saved once. Original protected narration remains byte exact.
Second: two nonadjacent narration replacements plus supported Mira update, no insertion.
Text-only subset preview changes file set/digest; restored full selection retains exact
digest/stable IDs, then saves once. Character technical name/ID stay stable. Both exact
source results match reviewed patches, preserving custom neighbours/comments/BOM/mixed
newlines and protected tokens; unrelated authority remains unchanged. Consumed proposals
are read-only and ordinary Close works without clearing completed fields.

Each single Undo/Redo restores all12authoritative source/metadata files to corresponding
baseline/accepted hashes. Initial first-Undo comparison failed because recovery was
excluded only from actual; both-sided ordinary authoritative comparison passes and
receipt retains that failure. Ordinary project reopen and actual same-package process
reopen preserve all12final files; native configured credential readability survives.
Live start3/PID659 and4/PID1334 quit0. No owner discovery/generation initiated on reopen;
independently captured zero live HTTP or exact live transport-body equality is not
claimed. Controlled native/controller evidence separately establishes those assertions;
server-internal configuration and historical cross-update limitations remain unknown.

Two exact seven-file live accepted exports, metadata absent, run pinned officialSDK8.5.3
compile/lint/named runtime in ten commands. Existing SDK archive matches published
SHA256; actual protected interpolation/bold/literal escapes, Character who names,
dialogue/narration and Return are asserted; accepted source hashes remain unchanged and
SDK temporary roots removed. Both named runtime logs show6assertions each (12total),
plus startup literal/name assertions. Only the existing three empty GUI scaffold files
receive standard SDK template contents; all nonempty accepted source stays byte exact.
Eight unrelated authoritative paths remain byte exact; only four selected Scene/Character/
authoring/source-map paths change. Ignored live harness adapts qualified adapter/assertions
to actual public source and does not rewrite accepted source. Initial Python syntax
check cache destination was sandbox-denied; approved workspace cache syntax check passed
before any SDK execution. No package/editor attempt consumed by that preparation failure.

Temporary key removed through ordinary Settings, missing/disabled observed; cleared
profile removed/not configured observed. Exact owned live root deleted without reading
credential files; old/historical credentials untouched. Cleanup receipts, public-only
snapshots/AX/launcher receipts/SDK commands/hashes retained ignored. Live privacy223
passes before223-entry manifest; final scan follows. All required selected layers pass;
independent final live/harness review is pending. Earlier unique CI/harness failures
remain failed, including CI5's unresolved cleanup; later cleanup does not relabel it.

Final cumulative actual **Mac1/4packages,4/8starts; Windows5/5packages,6/8starts;
paired7/7each; live2/2batch generations total, discovery1/1**. Explicit extensions remain
accounted and prior budgets closed. No CI8/rerun/Windows package6/merge/release/provider/
signing expansion/generic/following outcome authorised. After independent audit and
record validation, commit/push only documentation and verify refs/clean worktree.
No requested selectable implementation or qualification work then remains; fullPhase2/
generic/final human acceptance continues to be distinct incomplete future scope.

Live discovery and first-send retained AX files initially contained only later unchanged-
state diffs. Labeled retrospectively retained verbatim relevant excerpts from the original
successful current-chat CUA tool results supply exact model-available/destination/body-
digest evidence; original empty diffs stay intact. These excerpts are not fresh captures,
new discovery or replay. No live HTTP/body equality or final human proof is inferred.

Final independent live/harness audit agrees with no findings:12authoritative snapshots/
hashes, recomputed exact selected patches, stable Character/Beat IDs/order, eight untouched
paths, seven-source exports, harness/fixture hashes, ten SDK commands/6+6named assertions
and ordinary cleanup/exit receipts verify. Three empty GUI scaffold exception and original
retrospective excerpt provenance are explicit. Final live manifest226entries matches the
exact file set/hashes; final privacy227files passes. Macnative manifest115/finalprivacy116,
packageprivacy5 and both CI terminal audited artifacts remain valid exact evidence.

**Selected outcome implemented and qualified; closure approved for publication.** No
implementation, in-scope correction or selected qualification remains. Original scope/
allowance approval and commit/push authorisation persist. Repository515-file validation,
privacy and diffcheck pass; CURRENT/HANDOVER are compact live records, full unique failure/
recovery evidence stays here. Publish only the three owned documentary records on the
existing branch, preserve code candidate5f59322 and reconcile fresh refs without reset.
Human acceptance/fullPhase2/generic and any following deliverable remain incomplete and
unselected; no further execution is inferred from unused Mac/Windows start allowance.

### Generic deferral clarification — 2026-10-12

User explicitly reiterates generic support is deferred. The local generic scope/allowance
proposal is withdrawn; it was not selected, committed or published and triggered no
implementation, package, editor launch, provider call or CI. No new allowance exists.
Qualified Studio/selectable outcomes, exact evidence and closed actual counts remain
unchanged. Any next Phase2 scope proposal must respect this deferral; no following
outcome is selected by the clarification. This correction is local documentation only.

### Studio-only Phase 2 closeout proposal — 2026-10-12

**State: scope revision approved; closeout execution and allowance are proposed, not
active.** The user revises Phase 2 to Unsloth Studio only and requests a prompt to close
the remaining applicable verification-matrix gaps and run the final integrated
workflow on one coherent candidate. This supersedes the preceding generic-deferral
note's statement that no following scope is selected. Generic support remains deferred
outside Phase 2. No implementation, check, package, launch, Studio request or CI was
started for this documentation change.

#### Proposed finite allowance

| Maximum for this closeout outcome | Windows x64 | macOS ARM64 |
| --- | ---: | ---: |
| Package attempts, including failures | 3 | 3 |
| Editor launches, including reopen/implicit/failed starts | 6 | 6 |
| Focused CI dispatches | 3 | 3 |

The three CI dispatches are **three paired Windows+Mac runs**, not six independent runs.
Reuse exact successful package/native/SDK evidence wherever inputs are unchanged; the
caps are ceilings, not a target. The budget permits one full focused closeout attempt
and up to two correction/confirmation attempts per platform, matching WORKFLOW's
reassessment point. After two unsuccessful corrections of one hypothesis, reassess
before continuing. All local and CI attempts consume the same per-target totals.

Live allowance: at most **two synthetic generations per each of the five Studio
actions** (10 total). This permits one integrated send per action and at most one
diagnosed retry per action. Reuse the previously selected Studio model; allow **zero
new model discoveries**. If its configuration has changed, it is unavailable, or
rediscovery is needed, stop and request a scoped allowance amendment. Use only the
selected Studio endpoint/model and disposable synthetic project. No paid/public calls,
provider expansion, model installation, or key read/export. If credentials are absent,
pause for the user to enter them through native Settings; never request a secret in chat
or retrieve an earlier key. Remove any temporary credential and owned fixture/root
during cleanup.

This allowance is sized for a residual-matrix audit, one coherent two-target integrated
qualification, and up to two bounded corrections. If the audit shows material product work or the
remaining matrix cannot fit, return the gap and evidence before expanding scope or cap.
Prior package/start/dispatch/live allowances remain closed and do not roll into these
proposed counters.

#### Paste-ready closeout prompt

```text
Close the remaining Studio-only Phase 2 verification matrix and final integrated workflow.
Repository: Caldwell-41/Renpy-editor
Continuation: codex/provider-qualification. Reconcile fresh local/origin refs and preserve unrelated work; never reset. Use qualified code 5f593225fad2ebdb2970663d56ee83631b27ecef as the behavioral baseline, then identify one exact coherent candidate for the final workflow.

Read AGENTS.md, WORKFLOW, TESTING, PRODUCT, ROADMAP, CURRENT, HANDOVER, ADR 0011/0013, and this task's active Studio-only amendment plus sections 1–12, 19–20 and the closeout proposal. The user revised Phase 2 to Unsloth Studio only. Generic/OpenAI-compatible providers are out of scope. Do not implement provider expansion or Phase 3 features.

First map every applicable 2A–2C and Section 11 requirement to reused exact evidence, missing proof, or excluded/out-of-scope with a reason. Retain failed evidence as failed. Reuse unchanged valid evidence; do not rerun complete matrices for unchanged inputs. Close only the identified Studio-only gaps. Add focused tests or make the smallest in-scope repair only where evidence demonstrates a real gap/defect. Independently review the resulting candidate.

On the same exact candidate, run the integrated Studio workflow across both supported targets: review the exact destination/context/payload; exercise rewrite, Continue Scene, Draft Scene, generated Character card and lorebook actions; include the selectable multi-operation proposal and dependency-valid subset; separately approve generated references and use the selected revisions later; edit/restore prompts and vary context/response limits; reject malformed/stale/cancelled proposals with zero writes; accept a valid subset once; verify source/custom preservation, Undo/Redo, project and process reopen, explicit SDK validate/run, and a game copy without editor metadata. Use synthetic content. Run actual Studio live sends only from the authorized owner machine and selected Studio configuration; CI uses controlled fixtures and never receives the Studio credential. Capture exact candidate/input/package identities and native evidence.

Allowance for this outcome: at most 3 package attempts, 6 editor launches and 3 focused CI dispatches per target; CI dispatches must be paired Windows+Mac runs. All failures, retries, implicit starts and local/CI attempts count. Live Studio ceiling: 2 synthetic sends per action, 10 total across the five actions; zero new model discoveries. Reassess after two unsuccessful corrections of one hypothesis. Reuse exact unchanged evidence; stop and report before exceeding any cap or if model discovery, new provider access, or material scope is required. No paid/public calls, key in chat, credential-file reads/exports, provider/model installation, signing changes, merge or release. If credentials are absent, pause for fresh user entry through native Settings; clean up temporary credentials/owned roots.

Run the required focused checks, CI/native qualification and independent review within these caps. Update canonical contracts, this ledger and CURRENT/HANDOVER with matrix disposition, exact refs, failures, limits, counts and cleanup. Do not claim final human acceptance without the user's explicit sign-off; present the concrete integrated evidence for that final decision. Keep the work local unless current publication authorization explicitly covers it. Stop before any new outcome.
```

Selecting this prompt activates only the stated scope and caps. This record itself does
not authorize execution or publication.

### Studio-only closeout entry audit and requirement map — 2026-10-12

**Selected, then blocked at the required material-scope decision.** The user supplied
the preceding closeout prompt verbatim, activating residual Studio-only verification,
the final coherent workflow, independent review and its finite allowance. Generic and
Phase 3 remain excluded. No publication authority for this new outcome was established;
this audit and status/contract clarifications remain local and uncommitted.

Fresh `git fetch origin --prune` succeeded without resetting or changing source. Local
HEAD and origin continuation both equal **c1e14bf7756a550a0ecaf8fd3b8b736baf07018d**;
origin/main equals **5f448ca683a905f4ea77d4580bbc89fda69f2b93**. Preserve the six
pre-existing scope-document edits and the unrelated planning worktree. The one code
candidate assessed for the final workflow is the already qualified exact
**5f593225fad2ebdb2970663d56ee83631b27ecef**, tree
**e8a455ca224943b9079a7fd0cedbeeb7dcd71647**. HEAD and the working app/workflows
have zero delta from that candidate; documentary successors do not change its identity.
This identifies a coherent candidate, not an accepted final Phase 2 candidate.

#### Exact evidence inventory and reuse boundary

`R` means reused proof only for the named exact inputs/behavior. `M` means missing
proof or implementation, with the reason stated. `X` means an explicit exclusion or
conditional limit, not a pass. A mixed row retains all three dispositions as needed.
These symbols are local to this map and introduce no new requirement IDs.

| Evidence | Exact identity and usable boundary |
| --- | --- |
| E-S | [Selectable CI7/native/live closure](#selectable-ci7-terminal-qualification-and-unlocked-mac-continuation--2026-10-12), run38178036314/attempt1, candidate5f593225fad2ebdb2970663d56ee83631b27ecef. Mac job114584496211/artifact11716217918; Windows job114584496091/artifact11717112693. Fresh read-only audit verifies both265input inventories, declared PS1CRLF only, outer32/67 and child28/63 manifest hashes. Renderer134/core8/prompts5/workers6 and controller/SDK proof retain exact scope. |
| E-N | Same E-S candidate: Windows executable5fd03b0f8f3080ea3d258d30ff23eadaf8d3aa3ce05ca631670265f0327605ae, starts5–6; signed Mac executable724a405c34c43ee7659785fda4132b001d2037c0440c33bb0c668cb136fc01d9, installerf06c21b2a95855c3ba449c695bc0e31bcb8d23c2ec6cab3fb28cdf4e2344a611, starts1–2. All19+2checks/six native stages/six bodies, zero reopenHTTP and cleanup qualified. Mac live starts3–4/two selectable batches and exact-sourceSDK follow in [closure](#selectable-live-qualification-and-outcome-closure--2026-10-12). Agent/native input is not final human acceptance. |
| E-I | [Studio integrated CI4](#studio-only-integratedlive-qualification-and-closure--2026-10-11), run38134089028/attempt1, candidate3b3e8681a7bae2ddc8964409bf6f4e615b788eba, tree7a56dc5e5e2fbeff0d365216a43456345d52fdcd. Mac job114454280091/artifact11700481279 and Windows job114454279985/artifact11700921379. Fresh audit verifies declared23/88manifest entries. Five-action exact-body/private-LAN/controller/history/approval/reopen and metadata-freeSDK proof applies to those historical inputs. There are33changed app/workflow paths between E-I and E-S, including dispatch, prompts, planner and renderer; E-I is **not** final integrated proof for E-S. |
| E-A | Exact bounded action closures: rewrite95ce9c4fbad12cec24e8eda851b1baff1c4beec8/run38031993657; Continue8931fa85178ca22430fa5984e693f609970f4995/run38039472619; Draft1320d0a6507625abdd3fa20aa6a3eccffaccfcd6/run38056790759; card8a230a9619ec7504f1a91dc8504e6e9667108190/run38093296977; lore233454b4a0ae4c369d00c2dcd352c789829290b2/run38105665896. See [prior reuse table](#evidence-reuse-and-remaining-proof). They retain individual historical qualification; no wholesale cross-SHA final-workflow pass is inferred. |
| E-C | [Windows credential closure](#final-windows-acceptance-and-cleanup--2026-10-09), exact executable98fe719010dd029965401dd09ae7919dcf27b0f45f99aae8bf0b65c10d925fc6; native entry/replace/remove/reload-required/reopen. [Mac development store result](../archive/2026-10-09-phase-2-execution-history.md#development-file-native-qualification-result--2026-10-08) and its independent corrections retain their exact package boundaries. Credential services/ownership are unchanged in E-I→E-S; E-N supplements current-package remembered readability/entry/removal. Neither proves session-only, Mac Keychain update reuse or physical locked-store behavior. |
| E-R | [Windows request closure](#final-windows-request-acceptance--2026-10-09) and [focused Mac recheck](#focused-mac-shared-request-verification--2026-10-09), exact sharedde29e496f52a42194f528a57293d5aa06aae4967. Controlled Save under stalled request/cancel/auth/usage/exit. E-I transport8 and native-worker6 retain exact service-input proof: ai_request/ai_discovery/profile/credential service files are unchanged E-I→E-S. E-S also runs workers6; no live server-stop guarantee. |
| E-P | E-S prompts5 cover exact payload/references/dependency/budget/stale/draft and save/reset/history/reopen/baseline-update preservation. E-I reference12 covers shared lifecycle/bounds/extensions/malformed/newer/external/recovery/missing/stale citations; reference service/tests are unchanged E-I→E-S. E-I integrated approves generated card/lore and sends their exact revisions later; this integration still requires fresh E-S proof. |
| E-L | E-I live selection used4d1120dbb6f8d85dc861554ba93e8d26db6c1f82/signed Macpackage1/executablef79d46cedd6ec664fe8a9d69d5d37df2ff035757610c0b3996d530d25673f7b7: exact selected Gemma, all five actions1send each, fresh native key, later approved references, prompt/reset/limits/history/reopen and exact accepted-sourceSDK. E-N adds two live selectable batches on E-S. Historical reported Studiov0.1.902-beta, exact modelunsloth/gemma-4-12B-it-qat-GGUF, advertisedUD-Q4_K_XL/context262144; current installed/server-internal state remains unknown. These are distinct sessions, not one final integrated workflow on E-S. |

Ignored `phase2-closeout-01/entry-audit.json` owns the fresh public-evidence hash/input
audit, entry diff digest, refs and counters. An initial audit failed with `KeyError:
files` because historical CI4 uses a flat manifest and CI7 uses a versioned envelope.
That harness assumption is retained as failed; corrected format-aware verification
passes. It was no package, launch, dispatch, product test or provider attempt.

#### Applicable 2A–2C gate disposition

| Gate / requirement clauses | Disposition and remaining work |
| --- | --- |
| 2A.0 actual Studio version/configuration, schema, tool policy, limits, lifecycle findings | R E-L/ADR0013 records exact selected configuration, successful off/JSON and failed thinking/default probes; unknown backend/server tools remain unknown. M U5/U6 configuration-bound product capability readiness, and final E-S integrated live proof. X undocumented model management/installation; zero new discovery in this outcome. |
| 2A.1 native entry/store/request/replace/delete; zero reflection; origin binding; no open sends | R E-C/E-N remembered paths and unchanged ownership/origin services. M configuration/schema readiness and full-phase disposition of Windows session-only/HTTPS generation. X temporary Mac file-store policy expressly defers Keychain/session escape; locked store, signed upgrade and enterprise policy retain limitations. |
| 2A.2 delayed/out-of-order/late responses, cancel races, dead server, bad auth, size/deadline/cleanup; Save responsiveness | R E-R/E-I exact controlled service inputs and E-S workers6. M final same-candidate workflow integration; no re-run of unchanged complete worker matrix. X product SSE not selected/qualified by §10; spike SSE is not production proof, server-stop remains unknown. |
| 2B.1 manual references, deterministic manifests, exact approved revisions, provenance/staleness, prompt edit/reset/undo/reopen, no leakage/truncation, accounting | R E-P; E-I integrated chain provides historical generated-reference/prompt proof. M fresh E-S integration and selected finite-route context/repeated visits/bounded cycles, absent from production request shape. Stored reference route applicability is not route context assembly. |
| 2B.2 all five entries, destination/locality/sensitive disclosure, exact reviewed send once, stale token/session/draft guards | R E-A/E-I historical five-action workflow; E-S/E-N current selectable binding and guards. M one final all-five-plus-selectable chain on E-S and configuration capability readiness. |
| 2C.1 closed schemas, strict protocol/JSON, semantic ownership/dependencies, literal/protected text, same-file preparation/core IDs/Unicode/custom/exact patches | R E-S/E-N current selectable8core tests/controller/native and two metadata-freeSDK cases; E-A/E-I retain individual action/SDK cases. M final combined E-S game/chain. X arbitrary code/assets/Phase3 operations. Wider terminal/edge replacement family in §7 has no full-phase disposition; current Continue retains terminal, Draft creates Return only. |
| 2C.2 semantic/file/selection review, valid subset/dependency refusal, stale/external/draft/recovery guards, one transaction/Undo, duplicate refusal, transient lifetime | R E-S/E-N exact current dependency subsets/consumption/one history entry/zero-write refusals/reopen; ordinary fault-state recovery case passes, no crash experiment. M same final integrated chain. |
| 2C.3 manual/generated cards/lore, proposed Save versus approval, current approved replacement/rejection/supersession, provenance, extensions/migration/missing/stale citations/history/reopen | R E-P/E-A/E-I lifecycle proof; card/lore services unchanged; separate runnable Character create/update R E-S. M later exact approved generated revisions within final E-S chain. X external formats/automatic retrieval/implicit source or lore approval; Appearance operations remain outside selected bounded authority. |
| 2C.4 both-target five-action+selectable integrated Studio acceptance and independent/final human review | M required final chain, exact exported accepted game/SDK, both-target native disposition and explicit human sign-off. E-I and E-N cannot be joined into a claim that this same final chain already ran. Independent entry scope review is complete; final execution review remains pending. |

#### U1–U12 and remaining contract disposition

| Requirement | Disposition |
| --- | --- |
| U1 named Studio/setup/diagnostics | R dedicated Settings/Assist and E-C/E-R/E-N; no generic preset substituted. |
| U2 endpoint normalization/prefix/exact port/useful refusal/no scanning | R canonical_endpoint and E-I transport/profile input proof. M §4 verified-HTTPS/hostname **generation**; discovery's checked resolver/TLS path is a different service. |
| U3 native secret/Bearer/renderer exclusion | R E-C/E-N; X explicitly selected Mac development exception. M Windows session-only full-phase decision; CredentialStorage has Native/DevelopmentFile only. No fallback/key export permitted. |
| U4 explicit authenticated exact-ID discovery/manual IDs | R E-C/E-L; model text is entered directly or taken unchanged from discovery. X zero new discoveries/current availability unmeasured; loaded list is not catalogue. |
| U5 distinct readiness/availability/auth/unreachable/busy/interruption/unsupported | R discovery-only status and safe transport categories E-R. M full configuration readiness/capability state: current Settings explicitly says generation compatibility remains unverified. No loading/OOM/version fact invented. |
| U6 selected synthetic schema probe, configuration-bound capability evidence/invalidation | R E-L historical measured probe and strict local validation. M product capability/version/schema/tool-policy record and admission gate; StudioProfile contains no such record. Binding a send to profile revisions is not capability evidence. |
| U7 qualified thinking default/on/off; final versus reasoning | R off-only action bodies, separate response handling E-R/E-L. X on/default are unqualified; their output-cap failures stay failed, not unsupported. Any new control/config qualification requires a decision. |
| U8 server ceiling/input/output separation; no invented resize fields | R E-P/E-S exact serialized byte estimate/margin/reserve and refusals; user ceiling labelled unverified. X capacity/tokenizer measurement is not inferred from advertised metadata. |
| U9 local/network nonstreaming/SSE/tunnel | R literal loopback and opted-in RFC1918/ULA nonstreaming E-I/E-N. X SSE/tunnel/explicit proxy not selected in production. M verified-HTTPS/hostname full-phase boundary; previous LAN amendment excluded them only from its slice. |
| U10 disable server tools; no client tools; reject returned tools | R exact strict wire fields and returned-tool refusal E-R/E-I/E-S/E-L. X stronger internal/server-wide suppression is a retained unknown limitation under ADR0013, not an additional implementation blocker. A benign tool-free reply proves neither server-stop nor internal suppression. |
| U11 safe revoked-key/model/server/field/truncation/interruption recovery with retained input | R E-R categories/retained input, E-A invalid/cancel/stale cases, E-S zero-write refusals. M any unproved provider-specific readiness distinctions; interrupted SSE excluded with product SSE. |
| U12 live exact Studio and both-client package evidence | R E-L/E-N bounded actions; M final same-candidate integrated workflow and human acceptance, current configuration confirmation without discovery. |
| §4 profile/model/project binding, storage/version/malformed/cleanup ordering, narrow IPC and origin consent | R E-C/E-N/E-P existing profiles/binding/transaction/refusal. M Windows session-only, config capability evidence, TLS/hostname generation. X generic/no-auth/OAuth/headers/export/sync/native Mac migration/signing changes. |
| §5 lock release/one worker/no queue, states/cancel/deadlines/bounds/usage/latency/finish | R E-R/E-I/E-S worker and bounded JSON path; absent usage unknown. X monetary catalogue/SSE/automatic retry/repair. Limits are application bounds, not measured server maximums. |
| §5 editable temperature/top-p/output and qualified thinking | R output controls. M editable temperature/top-p: StudioSettings has no fields and all action bodies omit sampling. Qualified off-only thinking remains a recorded limit; historical on/default failures retained. Implementing/mapping/qualifying new controls is material work. |
| §6 committed source/read set/ordered dedup/default definitions/explicit approved references/exclusions/unknown/custom/budget | R E-P/E-S bounded target context. M selected finite multi-Scene/route context; PreviewRequest has one Scene/Beat/Chapter, no route/repeated visits. X automatic summaries/embeddings/whole project/binaries/Git/external files/runtime state inference. |
| §6 action prompt resources/full overrides/style/baseline comparison/update/reset/history/reopen/stale send | R E-P five tests and E-S selection guard; M final integrated customization/reset on exact candidate. No executable template or prompt-supplied authority. |
| §7–8 literal encoding/token refusal/strict schema/core IDs/path ownership/passive rendering/batch subset/exact diff/journal/history/consumption/transience/recovery | R E-S/E-N; E-A/E-I historical individual families. M final combined chain and wider terminal/edge-family scope disposition. X arbitrary code/Phase3/assets/persistent reply archives/specialist crashes. |
| §9 native manual/generated records, stable IDs/links/revisions/scopes/knowledge notes/citations/statuses/unknown extensions/bounds/newer refusal | R E-P/E-A/E-I; source-free acceptance and separate generated approval retain boundary. Stored finite-route scope is supported; M route **context** assembly is separate. X external card/PNG formats, contradiction detection/keyword injection/inferred runtime knowledge. |

#### Section 11 cell-by-cell disposition

| Matrix layer / cells | Disposition |
| --- | --- |
| Studio fixtures: auth redaction, base-path normalization, redirect/proxy refusal, exact model IDs, qualified framing, usage/finish | R E-C/E-R/E-I unchanged service inputs. M generation TLS/hostname and capability mismatch/readiness; X generic adapters/parsing. No public provider fixture needed or allowed. |
| Studio fixtures: unavailable/no-model/busy, malformed schema, disabled tools | R controlled error/protocol cases E-R/E-I, schema refusals E-S/E-A. M distinction between availability-only diagnostics and qualified generation readiness; internal tools remain unknown. |
| Lifecycle: profile/model/key changes, project switch/old-session callback, cancel/complete race | R E-R/E-S workers, stale profile/reference/prompt/draft selectable test and E-N refusal. No implicit send on open/reopen. |
| Lifecycle: competing Source draft, accepted source/card/lore change, reset/limits/stale send, duplicate acceptance | R E-P/E-S exact rejecting/consume cases; E-I historical cross-action integration. M final combined E-S integration. |
| Lifecycle: responsive Save while request stalls | R E-R actual packaged Windows Save280ms and accepted Mac controlled path; transport/worker inputs unchanged. No complete stalled-request matrix rerun selected. |
| Context: manual/generated refs, exact inclusions/exclusions/stale rejection, prompts/reset/reopen, context/output refusal | R E-P/E-I bounded proof. M final E-S chain with generated revisions and customized prompt/varied limits. |
| Context: order/dependencies/custom/assets/unknown/no implicit sends | R E-P exact payload and E-S authority; X executable custom inclusion/asset binaries/runtime state inference. |
| Context: selected route repeats/bounded cycles | M production context shape/selector absent; reference applicability route does not pass it. This is a material 2B.1 capability gap. |
| Context: exact large integers | M no explicit phase2 variable-in-context large-integer assertion identified in the inspected focused evidence; existing Phase1 JSON bounds alone are not relabelled as this proof. Narrow assertion can follow scope disposition if needed. |
| Context: stale summaries/lore, overbudget/no silent truncation | R stale lore/budget E-P; X summaries/embeddings expressly deferred by §6. |
| Transactions: same-file multiple edits/new Character+dialogue/partial dependency/terminal/custom/Unicode/BOM/newlines | R E-S/E-N exact source cases. Wider terminal/edge replacement remains an unresolved contract boundary, not a passing case. |
| Transactions: external edits/history/failed commit/interrupted recovery/metadata bounds/reopen | R E-S ordinary compound fault-state recovery and external/draft guards, E-P bounds/history; X deliberate crash/hostile filesystem programme. M final mixed chain reopen on exact accepted game. |
| Security/privacy: native secret exclusion, injection authority, names/paths/HTML, narrow WebView, no tools, retention | R E-C/E-S/E-N/E-P passive rendering/exact authority/scanned fixtures/disclosures. No credential file read/export, live credential in CI, automatic HTML or tool action. X server-internal suppression remains an explicitly retained unknown limitation, not client permission. |
| UX/native: both packages/context/diff/accept, focus/keyboard, compact overflow/status/cancel/error/retry/native credentials | R E-N exact current selectable stages plus scoped E-A/E-C native interactions. M final same-candidate combined all-five chain/native coverage disposition; browser support cannot replace it. Subjective final human acceptance stays missing. |
| Live compatibility: exact client/version-or-unknown/model/quant/context/output/transport/results | R E-L historical scoped results. M final E-S all-five-plus-selectable session with current nonsecret configuration confirmation and exact candidate/input identities, zero discovery. No live body capture/server certification inferred from controlled tests. |
| Integrated: approved refs+custom prompt/reset/limits, five actions, both diffs/subset once/refusals/history/source/reopens | M one coherent E-S combined workflow across targets. E-I/E-N remain reusable scoped evidence, not a composite final pass. |
| Integrated: explicit pinnedSDK validate/run and metadata-free game | R E-I exact eight-file integrated games and E-S two exact selectable games passed SDK8.5.3. M SDK of final combined accepted-source export; old exports cannot substitute for a new combined game. |

#### Independent review, stop decision, counts and cleanup

Independent read-only review agrees the baseline is narrower than the retained full
Studio contract. Reviewer inspected real profile/request/prompt/dispatch/UI shapes and
the explicit older exclusions; no edits/tests/packages/launches/dispatches/sends or
credential access. Decisive source: `PreviewRequest` in `app/src-core/src/prompts.rs`
has no finite-route input; `StudioSettings` and `StudioProfile` in `ai_profiles.rs`
have no sampling/capability state; `ai_request::destination` requires literal HTTP;
`CredentialStorage` has no session variant; `rewrite_prepare` has no capability gate
and all action bodies fix thinking off. The recorded prompt slice excluded finite-route
expansion/full2B.1, LAN slice excluded TLS/hostnames, and Mac exception deferred session
escape. None automatically removes the corresponding full-phase requirement.

**Concrete decision needed:** either explicitly narrow the full Studio Phase 2 boundary
to the implemented literal-HTTP/remembered/off-only/single-target capability and name
the deferred route/sampling/capability/TLS/session/terminal-edge requirements, or select
the missing capabilities as material implementation with concrete qualification scope
and allowance. This audit makes neither decision for the user. A verification rerun
cannot implement them. The original outcome says to stop if material scope is required;
therefore no expensive/native/live work was started and no final acceptance requested.

Historical failures remain failed: Studio thinking-on/default truncation; earlier
per-action/native/CI failures; selectableCI5 historically unresolved cleanup; reviewer
sandbox trust failure alongside unchanged approved-host strict signature success. Fresh
audit format failure above remains a harness failure. No unsuccessful product correction
or new qualification hypothesis was attempted; two-correction allowance remains intact.

| Closeout actual / ceiling | Windows x64 | macOS ARM64 |
| --- | ---: | ---: |
| Package attempts | 0/3 | 0/3 |
| Editor launches, including implicit/process reopen | 0/6 | 0/6 |
| Paired focused CI dispatches | 0/3 | 0/3 |

Live closeout counts: rewrite0/2, Continue0/2, Draft0/2, card0/2, lore0/2; **0/10total**,
**0/0new discovery**. Prior closed counts remain separate. No owned process, listener,
synthetic project, temporary credential, SDK install, CI operation or watcher was created;
only ignored public audit evidence remains. No credential files were read/exported or
native Settings opened. Fresh entry, if later needed, belongs in native Settings.
No push/merge/release/signing/provider access/next outcome occurred. Final candidate
workflow, final execution review and explicit final human sign-off remain incomplete.

Independent final documentary review agrees with the material-scope stop and truthful
exact-reuse/missing-proof boundaries. Its one wording finding was corrected above:
stronger server-internal suppression is an ADR0013-permitted unknown limitation, not
another mandatory gap. No other actionable finding; reviewer performed no writes or
execution. Repository structural/privacy/relative-link validation passes515files;
103Markdown fragment links resolve and diff whitespace passes. CURRENT270words and
HANDOVER543words retain compact current recovery without repeating the historical ledger.

### Closeout user decisions and local sampling implementation — 2026-10-12

The user responds to the entry map: (1) create a new chat to investigate selected-route
feasibility and return a decision/proposal; (2) sampling is required and should be
implemented with sensible creative-writing defaults; (3) explain whether capability
readiness is possible/needed and model/provider dependent; (4) explain whether HTTPS
can be tested without an actual provider; (5) **no session-only credentials**, just the
saved key reused across sessions; (6) explain terminal/connection changes further.
These directions select local sampling implementation and remove session-only from
the active contract. They do not select route/TLS/capability/terminal-edge implementation,
publication, another provider/model, discovery or more expensive allowance.

Created user-owned chat **Investigate selected-route context feasibility**, local
thread `01a12eb3-214e-7810-83f4-773eae1fc621`, same Loomlight project. Initial snapshot
confirms active read-only investigation. Its brief permits source/contract research and
a feasibility decision/bounded proposal only; no writer/build/launch/CI/Studio/credential
operation. The user follows its report there; no messaging back to another chat is
inferred. The sampling owner remains the only writer. Route research returned
**feasible with constraints** and a bounded proposal; user subsequently requested a
workflow explanation there. Neither research nor explanation selects implementation.

Local sampling now adds saved **Temperature** and **Top-p** to Studio Settings. Defaults
are **1.0/0.95**, editable finite ranges **0–2/0–1**. They match the selected Gemma's
[published sampling guidance](https://huggingface.co/unsloth/gemma-4-12B-it-qat-GGUF);
Studio's [current request schema](https://github.com/unslothai/unsloth/blob/main/studio/backend/models/inference.py)
and [client serializer](https://github.com/unslothai/unsloth/blob/main/unsloth_cli/_inference.py)
support the named fields. This is a documented starting point, not a measured creative
quality result or installed-Studio compatibility pass. No hardcoded model catalogue,
top-k/other sampling control, thinking-mode change, automatic probe or retry is added.

Old profiles omit both fields and retain identical serialized shape until explicit
Save. Missing fields use the stated effective defaults in the reviewed outgoing body;
explicit null/string/bool/nonfinite/out-of-range values refuse. Explicit Save uses the
existing profile transaction/revision and preserves the credential origin/reference;
changes invalidate prepared sends. All five actions plus selectable editing, and the
synthetic diagnostic, send `temperature`/`top_p` in their core-owned exact body. Assist
full-body review reveals the effective values before Send. No read/save initiates inference.

Independent read-only review found an overbroad constructor edit accidentally adding
sampling fields to native Pending; corrected before the desktop check, without adding
new request state. Reviewer then found no further code defect, and requested explicit
default/custom assertions for the second synthetic serializer; those were added.
No reviewer tests/launches/builds/dispatches/sends/credential operations occurred.

Focused local evidence: frontend typecheck/test compilation; Settings DOM **5/5**,
no skips; core sampling **2/2**, no skips, covering legacy exact serialization/ranges,
all six action envelopes, actual profile Save/readback, credential preservation,
stale-review refusal and no source writes; affected synthetic-body **1/1**, no skips,
with default/custom fields; desktop `cargo check --tests --locked --offline` passes.
Existing unused Windows selector warning remains. Rustfmt applied only to the changed
profile module; no broad source reformat or package matrix. Source-level checks do not
establish both-target native or live Studio acceptance.

Failed preparation evidence is retained: an incorrect relative activation path prevented
the first Cargo invocation; the first new DOM test used a non-reflected Happy DOM aria
selector, then a non-bubbling synthetic input event; an incorrect edit working-directory
path left that event correction unapplied on one retry. The corrected label association
and realistic bubbling event pass. These are harness/command failures, not product
passes or editor/package attempts. No repeated unsuccessful product-correction hypothesis
or expensive attempt occurred.

Qualified5f59322 remains the behavioral baseline; current sampling code is local and
uncommitted on HEADc1e14bf. Earlier265input/exact-body/package receipts remain historical
for changed inputs, not current-candidate qualification. Final coherent candidate must
be frozen after scope/implementation settles. Source-bound literal/custom/history
evidence remains reusable only within unchanged boundaries; do not join earlier chains
into a final pass. Capability readiness and TLS/terminal scope decisions remain pending;
session-only is now **X/user-excluded**, superseding the earlier map's open disposition.

Closeout counters remain Windows/Mac **0/3packages,0/6editor launches,0/3paired CI**;
live **0/2each,0/10total**, new discovery **0/0**. Only disposable core test roots were
created and cleaned by their fixtures; no real credential file read/export, provider
call, native Settings, package/SDK installation, app process/listener, merge/release or
publication. The route research and explanation are complete; no further implementation
is selected by that chat's creation. Ordinary saved-key storage/signing/namespaces are unchanged.

Final independent review found the existing qualification renderer gate still expected
134cases. Updated it and its rejecting fixture to135; old134/zero/skipped results are
refused. Added the focused sampling2/synthetic-body1 stages to the existing bounded
selector without dispatching it. Actual `npm run check` passes **135/135**, no skips;
qualification rejection fixtures pass **14/14**, no skips. Documentation/privacy
validation passes515files and diff whitespace passes; CURRENT313words/HANDOVER667words.
The source/synthetic-only ignored `phase2-closeout-01/sampling-local.json` owns the
local265input snapshot/digest, focused results, failed preparations and zero expensive
counters. The final workflow candidate is still unfrozen/local; no publication or
qualified native/live sampling result is claimed. Independent product review has no
remaining finding; its harness/document precision findings were corrected.

### AI Scene-ending and connection changes deferred — 2026-10-12

The user explicitly chooses to hold off on item6, because it may introduce additional
complexity while remaining desirable later. Defer AI proposals that replace existing
Scene endings, alter outgoing Choice/Jump connections or create incoming connections
to a new Scene. This removes that wider terminal/edge operation family from Phase 2
closeout; the entry map's previously unresolved disposition is now **X/user-deferred**,
not missing required proof and not an implemented/pass claim.

Continue retains the existing ending; Draft creates an unconnected Scene with Return.
Terminal validity, supported text/Beat/Character operations, source preservation and
ordinary manual Scene/connection authoring remain governed by their existing contracts.
Keep the deferred AI capability as possible future work, with no automatic phase
assignment or implementation authority; a future selection must define permissions,
separate visible structural operations, dependencies, source/history and qualification.

Only active scope/status/contracts were corrected. Sampling source/tests and all
unrelated edits remain intact. No package, editor launch, CI, provider send/discovery,
credential operation, commit/push or allowance change occurred. Remaining route,
capability-readiness and TLS decisions, sampling native/live proof and final integrated
acceptance remain separate pending work. Prior failures/evidence and zero expensive
closeout counters retain their actual disposition.

### Route deferral and remaining Studio changes — 2026-10-12

The user now says **“Defer 1 as well. Make the other changes if you haven’t already.”**
This defers selected-route context/repeated visits/bounded cycles beyond Phase 2,
alongside item6 AI ending/connection changes. The separate route feasibility chat
and proposal remain available as future research; no route implementation is selected.
Items2–5 select editable writing defaults, an explicit saved-configuration setup test,
verified HTTPS/hostname generation and one saved credential reused across sessions.
Generic providers, thinking expansion, Phase3 and signing/storage-policy changes
remain excluded. This supersedes the entry audit's scope-blocked disposition, while
retaining its evidence map and failed results as history.

| Entry map cell | Current disposition |
| --- | --- |
| 2B.1, §6, §11 selected-route context/repeats/cycles | **X/user-deferred**; not a pass. Existing Scene/Beat/Chapter manifests and stored reference route applicability remain in scope. |
| §7/2C terminal/edge replacement/connection family | **X/user-deferred**; Continue retains ending, Draft unconnected Return; terminal validity remains required. |
| U3/2A.1 session-only credentials | **X/user-excluded**; existing remembered key reused across sessions; no storage adapter/signing change. |
| §5/U7 editable sampling | Local implementation/proof; defaults1.0/.95; native/Windows/live exact-body qualification still missing. |
| 2A.0–2/U5/U6/U11/§11 configuration readiness | Local explicit Test setup and strict publication implemented/proved with fixtures; actual selected Studio and packaged proof still missing. Internal tools/backend/loaded capacity remain unknown. |
| U2/U9/§4/§11 HTTPS/hostnames | Local verified transport and controlled TLS proof; native/Windows/live proof still missing. Literal IPv6 HTTPS explicitly unsupported by pinned adapter; no insecure fallback/dependency replacement. |
| 2B.2/2C.4/§11 integrated all-five plus selectable | Same-candidate source integration preparation in progress; final both-target native/SDK/live evidence and independent execution review remain missing. |

Implementation adds optional legacy-safe saved sampling, configuration-digest readiness
with a checked timestamp, and narrow `ai.testCompatibility` IPC. The tiny synthetic
request/closed response is core-owned, previewed and uses the same single cancellable
worker. Relevant saved configuration/key changes and unavailable/changed discovery
clear readiness. Cancelled/stale/replaced sessions cannot publish; completed durable
publication wins late cancellation. Project review requires a tested setup; fixtures
seed public controlled readiness explicitly and never masquerade as live proof.
The core/native credential boundary remains unchanged; renderer receives no key.

HTTPS resolves and validates all answers, binds the sorted set to exact reviewed
addresses, rechecks before connecting and refuses ordinary DNS changes. Native DNS
runs outside the project lock, with one global OS worker maximum and bounded waits.
Certificate/hostname validation retains production WebPKI roots. DNS, connect, TLS,
reads, partial writes and validation share one absolute deadline. Public synthetic
fixture CA/server certificates/key are test-only; CA issuance key deleted; no trust
installation, provider connection, management/discovery call or dependency change.
Pinned ureq3.1.4's bracketed literalIPv6 certificate-name limit receives a useful
refusal; HTTPIPv6 and HTTPS DNS names resolvingIPv6 remain supported.

Focused Mac checks: core compatibility3/3, sampling2/2, affected rewrite45/45;
desktop readiness-discovery1/1 and native compatibility3/3 (two worker tests plus
the discovery selector); desktop tests/examples compile; TLS transport15/15;
SettingsDOM8/8; final renderer138/138; qualification rejecting gates14/14. No skips.
The first final renderer run failed138total/137pass on a stale thrown-status error
overwriting the late-cancel success message. Added a generation check in the catch
and after profile reload; Settings8/8 and final138/138 then pass. This is one successful
correction, not an erased failure. Independent review found discovery invalidation,
late-cancel truthfulness and deadline gaps; those are repaired with focused fixtures.
Final re-review after the thrown-status finding remains required.

Retained preparation failures: initial desktop compile before API adaptation; sandbox
native/TLS listener denial; wrong-host fixture127.0.0.2 bind unavailable on Mac,
replaced with a wrong certificate on127.0.0.1; cancellation assertion accepted actual
TCPreset as closed only while still requiring owned socket shutdown. These are failed
harness/preparation results, not native/provider passes. The TLS deadline correction
passed15/15 after explicit partial-write recalculation. No hypothesis received two
unsuccessful corrections. Prior audit/sampling/CI5/thinking/signing failures stay failed.

Closeout counts remain per-target packages0/3, editorstarts0/6, pairedCI0/3; all five
live action counters0/2, total0/10, discovery0/0. Any live setup test consumes this same
ten-send total and has a separate counter; no automatic preflight or retry. One setup
plus up to nine action sends can fit the ceiling, with each action still capped2;
exact configuration changes that need additional setup must be planned within it or
stop before sending. Current selected Studio credentials are not assumed available;
fresh user entry through native Settings is required if absent. No credential files
were read/exported. Disposable fixtures/listeners/workers cleaned; no actual editor,
new SDK install, package, CI, live send, commit or push yet. Local changes preserve
the six pre-existing scope edits; candidate freeze/publication and remaining native
qualification are still pending, with no final human acceptance claimed.

#### Combined source workflow and final review

Optional `phase2-controller.dispatch.mjs --selectable-integrated` passed on its first
synthetic run: same project, five actions then a full selectable replacement/Character/
insertion proposal; missing Character dependency refuses with zero writes; selection
returns to the exact full preview, then declines all replacements and accepts only
Character+dependent insertion once. Earlier five-action prose, custom/BOM/newline
source, shared Undo/Redo, separate generated-reference approvals, later exact selected
revisions, project/process reopen and cleanup pass. Six fixture HTTP bodies match
the exact reviewed destination/model/sampling/body. The affected selectable controller
also passes malformed/cancelled/stale/held-owner zero-write checks and create/update
selection cases. These are native-service/controller evidence, not editor launches
or actual provider sends. Public exact game exports remain ignored local evidence.

The combined export passed pinned SDK8.5.3 compile/lint/normal entry, Continue, Draft,
Return, generated Character name and dependent dialogue/narration checks in a game
copy without editor metadata; accepted source hashes remain unchanged. SDK attempt1
failed its7th assertion because the oracle compared displayed `who` with escaped
source `Character.name`. Corrected to the SDK's substituted name, already checked for
literal text/no active generated tags; attempt2 passed all five SDK commands. Retain
both receipts. This is one successful harness correction; no source defect or erased
failed result. No new SDK install or editor start occurred.

Final source review additionally found uncaught thrown IPC errors in Cancel setup.
Guarded catch retains Cancel for explicit retry; generation/active checks prevent
late callbacks after profile reload. Existing DOM fixture now proves bridge failure,
explicit retry with completed publication and stale thrown status. Renderer138/138
passes after this fix, no skips. Independent source/combined SDK/CI review has no
remaining concrete defect. Final native/execution review remains pending. Reviewer
caught ignored PEM fixture files; the four intentionally public synthetic files must
be explicitly force-added and inventoried before freezing, never production trust.

The existing paired selectable workflow now includes core compatibility3, transport15,
readiness invalidation1, nativeworker8, combined controller and combined SDK gates,
alongside unchanged selectable checks. It includes TLS fixture inputs and enforces
this outcome's package3/editor6/paired-dispatch3 ceilings, retaining all failed artifacts
and attempt ledgers. Mac CI still cannot supply an approved signed package; local signed
Mac/native and actual Studio evidence remain separate. No dispatch or publication yet.

#### Privacy fixture repair, exact-value proof and next requested handoff

The unchanged artifact privacy scanner rejected the static synthetic TLS PEM/key
files. Rather than waive the scanner, remove those four owned new files from the
candidate. The fixture now uses existing host OpenSSL to generate an ephemeral CA
and CA-issued leaf/keys under a Rust-owned temporary root. Only the public CA enters
test trust; child kill/wait precedes root removal, including panic/cancellation.
No certificate/key is tracked, no system trust/signing policy changes and no install.
Windows PATH/existing Git OpenSSL capability is still pending CI and fails closed.
The first ephemeral run failed12pass/3fail because CA:true self-signed leaf was refused
by strict WebPKI. One correction issues a CA:false leaf from a separate runtime CA;
transport15/15 and owned-root cleanup pass. Both failures remain failures. Unchanged
artifact scanner now passes the two fixture source files; repository validator passes.
This supersedes the preceding static fixture/force-add plan without erasing its findings.

U5 now distinguishes an empty model list (“No models returned by Studio; loaded state
unknown”) from a missing selected ID and available/discovery-only; focused unit passes.
This invents no loaded-state/version/OOM information. The remaining exact-large-integer
context proof passes for9007199254740993 and both signed64 boundaries: exact source
default statements survive serialized body/digest, runtime values remain unknown.
Initial external-edit fixture failedSourceConflict; the next full-Source fixture
failedINVALID_SOURCE; semantic Scene.apply then exposed a wrong selected Beat in the
test. After explicit reassessment, bind the fresh context input to the saved narration
Beat being edited; focused1/1 passes. Retain all three fixture failures; no numeric
product defect or source-recovery relaxation is claimed. Independent review confirms
the exact target/revisions and raw-source string serialization. Prompt CI selector is6.

Actual live Studio remains the selected owner-machine LAN configuration; controlled
TLS proof does not require new live HTTPS access/provider/tunnel. Actual TLS live
compatibility remains unmeasured. Native package proof must cover the changed Settings
sampling/setup/cancel/readiness controls; fixture readiness seeding alone is insufficient.

The user requests a UI refinement prompt **after this closeout**, then a separate
agent-guided test-client/feedback session after refinement. Relevant plan is section18
and `docs/UI.md`, especially the accepted UI/UX guidelines. Prepare those handoffs
from the exact completed candidate/evidence; do not start a following outcome or
claim final human acceptance. Refinement must retain the revised Studio-only scope,
saved-key-only behavior and both user deferrals, with its own bounded verification
selection. A guided client should explain each step plainly, collect the user's
feedback, and distinguish observations from explicit acceptance.

#### Frozen candidate and signed Mac package1

Fresh ref fetch again leaves origin/codex/provider-qualification at
c1e14bf7756a550a0ecaf8fd3b8b736baf07018d and origin/main at
5f448ca683a905f4ea77d4580bbc89fda69f2b93. Freeze independently reviewed local
candidate **929af6f23f1fe79af2665a4cc71c276a64ffd80d**, tree
**9f034ca6cae69ef11e87d6a95a332152a9998eaa**. No reset/unrelated work loss/push.
269tracked material app/workflow/source/SDK/TLS fixture inputs have canonical sorted
JSON SHA256 **3c244dc28f7a4fd201ffd00b92d0df462aa2429c4d2139cf10adf6e91f97a1bd**;
ignored `phase2-closeout-01/candidate.json` owns exact hashes and local receipts.
No TLS key/certificate is tracked. This is the one candidate selected for remaining
qualification; historical5f59322 remains the behavioral baseline, not new-input proof.

Approved-host public identity/owned-process preflight passes (the earlier sandbox
process query failed capability and remains failed). Reserve Mac package attempt1
before invocation. Existing approved certificate-backed `macos-package.py` builds
Loomlight.app/Loomlight.dmg once, passes strict pinned bundle signature/designated
requirement, installer signature/included-app inspection and detach. Executable SHA256
**618d31e5ba6ff817dcfcb5353c5938689d172fa123e6b90361508724f8878215**; installer SHA256
**fb449b8f77a60d1fcddd236ecf40ffe7097474d097a1e614d1316e1fa55124b1**.
Unchanged artifact privacy scanner passes7files. No signing identity/trust/ACL change,
installation, editor start or live provider request. Retain local signed artifacts.

Actual closeout consumption is now **Mac1/3packages**, Windows0/3packages;
both0/6editorstarts,0/3pairedCI; each action0/2, setup0, total0/10; discovery0/0.
No user/temp Studio credential was created or read/exported. Test workers/listeners/
owned roots cleaned; no editor/watcher/CI active. Final canonical evidence updates
are local docs-only changes after the frozen material candidate. Remaining proof:
paired Windows/Mac CI, actual packaged workflow/new Settings behavior, owner-machine
selected Studio preflight/actions and independent execution-evidence review. Final
human acceptance remains pending explicit sign-off. Publication requires concrete
user permission under “keep the work local unless current publication authorization
explicitly covers it”; current closeout has no such authorization. No following
UI/test-client outcome starts while this qualification is pending.

### Express CI authority and ordinary saved-profile correction — 2026-10-12

The user expressly authorizes CI and reiterates native/live verification. Publication
of the reviewed candidate and one focused paired dispatch are now authorized; no
merge/release/signing/provider expansion. User objects to repeated key entry: one
saved credential must persist and be reused. Prior disposable qualification roots
were cleaned, so asking for a new key merely because the next test root was fresh
was a workflow mistake, not evidence that the product's remembered storage failed.

Fresh ref reconciliation before publication leaves origin atc1e14bf and main5f448ca;
push929af6f23f1fe79af2665a4cc71c276a64ffd80d fast-forwards the selected branch, no
reset/force-push. Pre-dispatch listing finds no active matching run. Reserve first
paired dispatch before invocation; registered production selector is exclusively
selectable_proposals, dispatch/package/first-start ordinals1, all older selectors
false/empty. GitHub returns
[run38224940778](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38224940778).
Initial exact-commit list is empty during indexing, not a failed dispatch or a reason
to duplicate it; one identity confirmation proves fresh attempt1/exact929af6f and
in_progress. Exclusive admission succeeds; required Windows/macOS jobs in_progress,
nonapplicable older jobs skipped. No Studio credential is provided to CI. No rerun,
terminal success or package/start completion inferred. Ignored dispatch/confirmed
receipts retain exact run/head/branch/status/jobs; audit on manual same-thread resume.

Reserve Mac editor start1, launch exact signed package in the **ordinary application
profile**, with no disposable live profile/key/root or automatic provider send.
Owned PID19193/executable hash matches package1. CUA display-name lookup times out;
retain the failure and conservatively charge one possible implicit start asMac2/6.
Exact bundle-path binding selects the already-owned process, no further start.
Initial native blank/loading observation later resolves to the normal app. Native
Settings reports only New Studio profile/credential not configured; no prior saved
profile exists there. Earlier cleaned temporary keys cannot be silently recovered.
Do not inspect credential files or ask for a key merely from this assumption.

Save the exact previously selected Studio LAN/model configuration in the ordinary
profile without network: unverified ceiling262144, budget32768, response2048,
Temperature1/Top-p.95 and private-HTTP opt-in. Initial AX Save clicks only focus/scroll
without submission; native Tab focus plus Return submits successfully. Retain this
input/harness observation rather than call it a numeric/product defect. Saved profile
then reports Credential:missing, which establishes an actual native entry prerequisite.
User takes over native secure dialog, clicks Remember and replies Saved. Native
Settings confirms Credential:configured/API key saved. No renderer key field/value,
key in chat, raw credential read/export, discovery or Studio send. Native saved-profile
receipt records only metadata/status, never the key. Preserve this user's profile/key
through later sessions and cleanup; it is not a temporary test credential.

Ordinary native Quit succeeds and read-only PID check confirms process exited. No
post-quit UI observer reacquires/relaunches it. **Counts:** Mac1/3packages,2/6starts
conservatively charged (one confirmed plus possible implicit lookup); pairedCI1/3each
target. Windows CI reserves package1/starts1–2, actual ledger consumption pending
terminal artifact audit. Live setup0, each action0/2,total0/10; discovery0/0. Temporary
test workers/listeners/roots are cleaned; ordinary saved Studio credential deliberately
remains, no local app/watcher active. Next Mac launch is conservatively ordinal3.

WORKFLOW's manual same-thread CI wait now applies: no autonomous polling or watcher.
On user resume audit this exact run, both required jobs/artifacts/manifests/269inputs,
native PNG/control/input evidence, package/start attempts and cleanup. Then reopen
the exact local signed candidate, confirm configured credential without asking for
entry, and complete remaining native/live all-five/selectable integrated workflow
within caps. Use synthetic project content and the selected owner-machine Studio,
count the explicit setup probe toward ten total, do no new model discovery. Preserve
ordinary key/profile; only app-reported unreadability/missing data warrants re-entry.
Final execution review and explicit human sign-off remain pending. Future UI refinement
and guided feedback prompts remain queued; no following outcome started.


#### Closeout CI1 independent terminal audit and remaining native gap — 2026-10-12

Fresh refs reconcile local/origin1d03e45be39c0ac73ce3618f5aeb00c7876b2dce,
origin/main5f448ca683a905f4ea77d4580bbc89fda69f2b93; no reset/unrelated work loss.
Frozen product929/tree9f034ca/269input digest3c244dc remains unchanged.
Paired run38224940778 attempt1 succeeds on both required targets; independent audit
validates both manifests/identities/positive cases, actual Windows package1/starts1–2,
MacCI0packages/starts, combined SDK5commands/12assertions and selectable SDK10commands/
two cases. Windows executable0231a7cd751cd2c52c63c5936db532a2cc156cb020ba46f990a78142c0419b76.
Windows artifact11736026789 ZIPe6fbc03a1ab74749724c038614ccccaf044873187d28e4a75200e718e2ff4345;
Macartifact11735996238 ZIPfbcc886ed660e0a3b5f9f58610185ef5d5143a69c8d07606633d10fd04c7ee80.
Windows25checks/82outer78child files; Mac20checks/47outer43child files; cleanup passes.
Nine native PNGs independently inspected. Only declared PowerShell CRLF input
normalization occurs on both targets. Retain auditor's initial Windows-only
normalization assumption as failed; evidence corrected, protections unchanged.

Matrix advancement: applicable automated 2A/2B/2C and Section11 new-controls/TLS/
readiness/integer cells now have exact both-target controlled CI proof; combined
five-action-plus-selectable source/reference/prompt/history/export/SDK cells pass
on both targets. New packaged Windows Settings controls remain missing proof;
CI1 native images cover selectable review, not these controls. External focused
harness plus receipt tests are being prepared to reuse this same executable on
Windows starts3–4, paired with Mac fixture/identity gates. Separate harness ref/input
identity prevents labeling verification-script changes as a new product candidate.
No new package/full unchanged matrix is proposed. No CI2 dispatch yet.

Owner signed Mac ordinary process reopen is charged start3; native UI access is
blocked by the locked Mac, confirmed through CUA. No setup/action request sent.
User unlock is the sole immediate owner UI prerequisite; the saved Studio key remains
preserved and needs no entry unless the app actually reports unavailable. Synthetic
project prepared: seven source/35metadata files, full digest
aaba4fbcea3125a4248d9b2700b53dd13829314927c7443148147d08b469146d,
source5fd3d8d721c35a8db5a2a52bda234c300746fcbf3ec9f0c173b3f00cb14f44d4,
metadata8b207c06733572ca7855d52075fb40bcc409df925744c56ac786a0e3c19ef694.
Seed driver and reopen used public fake key only; owned fake credential/root cleanup
passes. No Studio credentials copied/read/exported and no model discovery.

Cumulative consumption: ownerMac1/3packages,3/6starts (including possible implicit
lookup); Windows1/3packages,2/6starts; pairedCI1/3 each target; setup0, five families
0/2 each, total0/10, discovery0/0. Temporary source-fixture roots cleaned, synthetic
live root retained for authorized workflow, ordinary user profile/key preserved.
Source baseline and final human acceptance remain distinct; final owner integrated
native/live/SDK evidence and explicit human sign-off are still pending.

External proof preparation failures remain failed: first workflow edit selected an
older similarly named environment line and failed YAML indentation; repaired before
any dispatch, actionlint passes. Default local py_compile attempted its OS cache and
hit sandbox denial; task-owned temporary pycache syntax check passes. No package,
editor start, dispatch, live send or product defect resulted from either preparation
failure. Acquisition/receipt rejecting gates14/14 pass locally; harness native gates
and independent review remain in progress.


Independent external-harness review found two evidence defects before dispatch:
PNG signature-only validation admitted a fake image, and terminal-only count
collection could lose reserved starts on early cleanup failure. Both findings are
retained as failed harness evidence. PNG gates now check actual IHDR dimensions,
minimum bytes, checksum/chunk/compressed pixel integrity and claimed dimensions;
public positive fixture is a real generated PNG. Failure sealing counts reserved
starts independently of missing/malformed terminal reports, retains conservative
terminal counts, and revalidates nine native receipts/images against actual launch
PIDs. Acquisition/failure gates17/17 and native receipt gates7/7 pass locally;
workflow syntax and six-file source privacy scan pass. No native launch, package,
CI dispatch, Studio send or product repair was used for these harness corrections.
Independent re-review is pending; no CI2 dispatch yet.


Independent external-harness re-review passes: no remaining publication/pairedCI2
blocker. The two earlier review findings remain failed evidence with focused repairs.
Exact local pre-dispatch checks17+7 pass, actionlint and seven-file changed-source
privacy pass; product renderer/core/desktop/dependency inputs remain unchangedvs929.
Focused CI2 will validate actual Windows behavior; local fixture/review results do
not establish native success or cleanup. Publication is covered by express CI authority.


#### Focused closeout CI2 confirmed dispatch — 2026-10-12

Published reviewed external harness36a11c9822b400143bc593232af17067cd963ed0,
treeec20bc685998cc5af7c61643f72890a98ed502a0. Fresh local/origin match; no unrelated
changes/reset/force-push. Explicit CI authority covers this publication/dispatch.
No active prior workflow or existing run for this harness SHA was found.
[Run38232733035](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38232733035),
attempt1, workflow_dispatch, branchcodex/provider-qualification, exact harness36a11c9;
created2026-10-12T09:52:52UTC, confirmed queued2026-10-12T09:52:54UTC.
Selectors selectable_proposals=true/studio_setup_only=true, dispatchordinal2,
Windows firstlaunch3; older selectors false, upload false, legacy reuse inputs empty.
No duplicate request or retry. Product checkout explicitly929; existing Windows
CI1 package/executable reused. Separate seven-file harness inventory/digest is recorded
alongside frozen269product inputs at execution. No build/SDK acquisition/live key.

Cumulative paired dispatches now2/3 each target, one remaining. Actual beforeCI2:
Windows package1/3/starts2/6; CI2 reserves starts3–4, no package. OwnerMac package1/3/
starts3/6, hostedMacCI2 zero packages/starts. Live setup0, five actions0/2 each,
total0/10; discovery0/0. Actual CI2 attempts/failures and cleanup require terminal
artifact audit; independent reservation counts survive missing/malformed terminal.
Owner Mac remains locked, ordinary saved profile/key preserved, synthetic project
retained for authorized continuation, no fresh credential entry needed. No final
native/live acceptance or human sign-off claimed.

Manual same-thread pause: on user resume audit this exact run/attempt and both
required artifacts, exact product/harness/ZIP/input/executable bindings, new native
Settings controls/PNG/request/cancellation/reopen evidence, reservations and cleanup.
Retain every failure; do not retry or claim skips/missing proof pass. Reuse CI1's
unchanged integrated evidence. Finish owner native/live after unlock, then independently
review integrated execution for the user's final decision. Requested UI prompt/guided
feedback handoff follows verification; no new outcome has begun.


#### CI2 terminal audit and unlocked owner continuation — 2026-10-13

Fresh local/origin5273e3b5d899b1087eb3255f70c6f5cf087eb76d; main unchanged5f448ca.
Exact CI2run38232733035/attempt1/harness36a11c9 remains FAILED. Both downloaded ZIP
identities, complete outer/reused manifests and269canonical product inputs validate;
seven harness inputs bind to36a11c9 with declared PS1CRLF. Windows91outer/82reused/
78child entries; Mac54outer/47reused/43child. Windows acquisition passes, native
validator7 passes, but archive gate17 has one failure: ZipInfo normalizes unsafe
backslash names on Windows. Native execution is skipped, no native directory or
reservations; zero new starts/packages. Mac17+7passes, zero starts/packages.
Windows cumulative remains package1/start2; Macowner package1/start3; dispatch2/3.
Retain privacy/terminal failures caused by missing native execution as failed too.
Ignored independent-ci-02-audit.json and ci-02-artifacts own exact receipts.

First narrow repair preserved writer filename but still asserted normalized
namelist; independent review rejected it before dispatch. This unsuccessful correction
remains failed evidence. Reassessment inspected writer AND reader normalization:
ZipInfo.orig_filename retains raw input, filename may normalize it. Second repair
asserts raw fixture names and rejects raw/normalized differences before safe extraction.
An explicit Windows-separator normalization regression proves raw a-backslash-x can
become a/x and must still be refused. Local18/18pass and independent re-review pass;
workflow now requires18+7 and admits only last paired dispatch3 with Windows start3
(still unused). No frozen product change/build/launch/send for this correction.
Initial 'fixture-only' audit classification is corrected to fixture plus external
extractor raw-name guard; no product defect. No CI3 dispatch yet.

User unlocked Mac. Already-running signed process21809 was rebound without a launch.
Ordinary native Settings shows the selected endpoint/model/limits/sampling unchanged
and Credential:configured after process reopen. No key read/export/reentry or model
refresh. Fixed synthetic Test setup reviewed and explicitly sent once; native result
is Setup tested for structured proposals. Every generated result still needs review.
Saved credential is reused successfully. Setup consumes1/10, discovery0; no project
content in that probe. The compact Settings preview exceeds the visual line and AX
text is limited to512characters; qualified core fixed payload/visible prefix/config
were reviewed. Record this presentation issue for the later UI refinement; do not
claim full native text capture of this tiny setup preview.

First synthetic native open failed because preparation renamed its root live-project
while metadata folderName remained synthetic-project. Rename only the owned root to
synthetic-project; all42file bytes unchanged. Native second open succeeds, no source
execution. Retain the first invalid-fixture open as failed, not a product defect or
extra editor start. Native prompt edit/save, explicit baseline restore, Undo/Redo,
then Undo to the edited custom prompt pass; original protected source unchanged.
Generated-card action reviewed exact selected Studio/address/model, Iona target,
manual Mara card revision2/The last tram lore revision1, budget8192/response1024,
strict schema/tools/thinking off and payloaddigest
0722950ce1b2bd5b2679319f925d36865cd675d61038e99079985baf356864a4.
Native scrolling inspects wrapped manifest/body/schema and tail sampling. Card send1
reserved and sent once; total2/10, card1/2, other four families0/2. Result, separate
Save/approval and later inclusion remain pending. Saved user profile/key preserved;
owned synthetic root retained for continuing the authorized chain.


Owner generated card1 successfully received with zero project writes before Save.
Saved once, duplicate Save disabled; separately approved through native Characters.
Iona record035aa71f-f732-467f-8910-fccf90586ec2, approved revision
2711eca8-eab9-4cdc-85b5-47be42980f99/number1. Original seven game source hashes remain
unchanged; futureLibrary extensions remain preserved. Lore Night bell send1 includes
this exact approved card revision plus The last tram lore1, explicit project scope,
budget16384/response768, estimate6301+768+631=7700, strict closedschema and actual
digestc5ef30a277c3d89df2e5b3783b1207b83d51709a9ba19cc1945afc6f747eb23e.
Native Mac locked again during lore send; result unobserved. All synthetic files
remain equal to pre-send snapshot. No automatic resend/relaunch/key entry. Unlock
requested; source/project/user key preserved. Actual totals setup1/card1/lore1=3/10,
otherfamilies0, discovery0; Macstarts3 and Windowsstarts2 unchanged. No CI3 yet.
A local receipt-writing Python syntax error failed before execution; corrected
snapshot/ledger write passes. This preparation failure is retained, no extra send.


#### Final allowed paired CI3 confirmed dispatch — 2026-10-13

Reviewed external harness published934decc1e402b96dc7d795e22c69bf8f24aecbe1,
treed699336efc0af4397bd57dc34265e26e86377c6f, exact local/origin before dispatch.
Product remains929, CI1Windows executable reused. No active prior workflow or prior
run for this harness found. [Run38277737024](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38277737024),
attempt1/eventworkflow_dispatch/branchcodex/provider-qualification/head934decc,
created2026-10-12T16:29:22UTC, confirmed in_progress2026-10-12T16:29:47UTC.
Primary+studio_setup_only selectors true, dispatchordinal3/Windows firstlaunch3;
older selectors false/uploadfalse/legacyreuseempty. Single dispatch accepted and
returned exact run URL. Initial list-based identity assertion failed due missing/
ambiguous head match; direct returned run-ID read confirms exact head/attempt/event.
Retain initial confirmation failure; no duplicate dispatch/retry.

PairedCI now3/3 each target, zero further dispatches allowed. New builds0;
Windows starts3–4 reserved (actual beforeCI3 package1/starts2), hostedMaczero starts/
packages; ownerMacpackage1/starts3. Live setup1/card1/lore1 total3/10, otherfamilies0;
discovery0. Lore result still unobserved during renewed Maclock, synthetic root and
saved user key preserved. Required native proof/results/cleanup await exact terminal
artifact audit. Full Phase2/final human acceptance unclaimed. Manual same-thread
wait: audit exactCI3 on resume, retain failures and actual reservations, then finish
owner chain after unlock if within caps. Any new CI attempt needs a real allowance
decision; do not infer renewed caps or start the requested later UI outcome.

#### CI3 terminal audit and explicit CI allowance extension — 2026-10-13

CI3 run38277737024/attempt1/harness934decc/product929 remains **failed**.
Independent audit confirms both exact artifact ZIPs, manifests, 269 product inputs
and seven external harness inputs. Both targets pass18+7 focused fixture validators.
Windows rejected the native root before output/listener/launch: RUNNER_TEMP and
Python's temporary parent differed. No product defect is demonstrated; added
builds, starts and reservations are all zero. Mac fixture job passed. Preserve
missing native terminal/privacy evidence as failed. Ignored independent-ci-03-audit.json
owns exact receipts.

The smallest external repair binds TMPDIR, TEMP and TMP to runner.temp in the
Windows native step; Python and the inherited Rust child then use the same parent.
Existing containment, prefix and fresh-root checks remain. Independent review and
local temporary-parent smoke pass; local smoke is not Windows native evidence.
The user explicitly approved **one additional paired run** after reviewing this
concrete correction. Only the cumulative CI ceiling increases3→4 per target;
three are consumed and exactly one remains. Admission now requires dispatchordinal4;
startordinal3 and attempt1 remain. Frozen929/existing CI1 package are reused, no builds
or Studio credentials in CI. Windows actual package1/starts2; planned starts3–4.
Mac package1/starts3, all other ceilings unchanged. No CI4 dispatch yet.

Owner process21809 continues with the ordinary saved Studio key and no reentry.
Generated Night bell lore was saved once and separately approved; Iona card1 and
Night bell lore1 exact revisions were then selected in Rewrite. Rewrite accepted
once as an exact single prose patch; native Undo/Redo restores exact source/metadata.
After that source change, the generated references correctly become unavailable
because their supporting source is stale. Continue uses selected manual Mara2 and
The last tram1, makes zero writes before acceptance, then inserts exactly two
narrations before the unchanged Return, preserving all other source bytes.
Ignored native-lore-approved, native-rewrite-before/accepted/undo/redo and
native-continue-before/accepted receipts own hashes and actual source text.
Live setup1, card1/2, lore1/2, rewrite1/2, Continue1/2, Draft1/2 reserved/sent;
total6/10, discovery0. Draft is pending; no batch send yet. Human acceptance pending.

#### Owner live batch refusal and reopen — 2026-10-13

All five action families now have valid owner-native Studio results on exact929.
Draft Scene send1 creates standalone Platform after midnight Scene
3d2f6fcc-a522-4016-b384-930f2a20e363 with two narrations and Return.
All existing game bytes remain unchanged; zero project writes before acceptance;
Accept becomes disabled after the single save.

Selectable Edit Scene send7 (charged second Rewrite-family send) is **failed live
evidence**: native status “Studio response is unsupported or incomplete. Response
discarded.” Complete project hash snapshot before/after proves zero writes. No raw
response is exposed, so the exact provider/model/schema failure cannot be diagnosed
from this evidence. Do not call it a product defect, a model limitation, a token
truncation or a pass. No retry is permitted: Rewrite-family ceiling2 is exhausted
although total7/10 leaves other-family headroom. Successful controlled CI1 native
subset/dependency and combined-controller tests remain reused evidence, distinct
from missing successful owner live batch/subset proof. Final live integrated workflow
cannot be claimed complete while this remains failed.

After refusal Close Assist did not visibly close while task text remained; clearing
the disposable task through its native field allowed closure, without source writes.
Retain this observation for a future UI refinement; root cause unproven.
Project close/reopen preserves all project bytes. Normal process21809 quit succeeds;
Mac start4 is reserved before invocation, same exact package starts29432. Settings
shows persisted Studio endpoint/model/limits/sampling and Credential:configured,
without key reentry, new send or discovery. Original approved references and edited
prompts persist. Native explicit Validate uses registered verifiedSDK8.5.3 revision
8bb3d5b7102f9069e4fa13f385303113807cc9b11a86b0a31c56f3e65defbe58, after explicit
synthetic-project session trust; native status validation exit0. Existing project
bytes unchanged;14 SDK cache/output files added. Native Run and metadata-free copy
audit remain pending at this checkpoint. Ignored native-* receipts own exact details.

Independent owner receipt review confirms all114 project hashes match through live
batch refusal and both reopens; exact single rewrite, Continue insertion and Draft
new file/meta changes preserve existing bytes, reference/prompt/authoring extensions.
Native Validate preserves prior114files and adds14 SDK outputs. Tracked current
changes are external harness/status only: one frozen269 path, production-scaffold.yml,
has an input-description delta in the harness checkout; frozen product checkout929
is unchanged. New harness ref must bind this distinction. Fresh origin reconciliation
leaves local/origin continuationb5fd4f3 and main5f448ca unchanged. No reset/discard.
Focused external checks18+7, actionlint, diff check and six-file changed-source privacy
scan pass. Review found stale HANDOVER wording about Windows OpenSSL capability;
corrected to reuse independently audited CI1 transport15, with no rerun.
Native Run is currently blocked by renewed Mac lock; unlock requested, savedkey
and process29432 preserved. No new launch/send/discovery from this lock.

#### Explicitly extended paired CI4 confirmed dispatch — 2026-10-13

Reviewed external harness8b0efbb9143fdc4c68c7a7ee5d074f1a96e00a0c, tree
99082f98f2fd1a30cf8de80dd5d96ac04879e13f, published normally from fresh matched
b5fd4f3 local/origin, no reset/unrelated loss. Frozen product929/tree9f034ca/269digest
unchanged. Seven separate harness input digest
db547aec3cc0333ffcb1dc3dc68d3c16f6c1413bfcaf0a1bd10de39fec936279.
User-approved one-run extension is consumed: paired CI4/4 per target, zero further
dispatches. [Run38283334874](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38283334874)
is confirmed attempt1/workflow_dispatch/exact8b0efbb/branchcodex/provider-qualification,
queued2026-10-12T17:18:40Z. Both selectorsselectable_proposals/studio_setup_onlytrue,
dispatchordinal4, firstWindowsstart3. Other selectors defaultfalse; no builds/credential.
Reuse CI1 exact Windows package; Windows actualstarts2 beforeCI4, starts3–4 planned;
hostedMac0packages/starts. OwnerMac package1/starts4, live7/10 Rewrite2/2 and
discovery0 unchanged. CI3 failure and all earlier failed corrections remain failed.

Support owner metadata-free copy compile/lint/named runtime is reported passed on
exact accepted live source; independent exact-receipt audit remains. First preflight
literal-brace oracle failed before any SDK command; corrected from actual bytes.
Second attempt SDKcommand1 failed from inherited working directory/relative launcher;
absolute launcher and SDK cwd correction succeeds in third attempt5commands. Keep
both distinct external-driver failures; neither demonstrates a product defect. Native
Validateexit0 passed; nativeRun remains blocked by renewed Mac lock/unlock pending.

Manual same-thread pause under WORKFLOW: end turn after recording this checkpoint,
no watcher/polling/redispatch. User resume cues one terminal identity/artifact audit,
then remaining nativeRun after unlock and exact-copy independent review. Failed live
subset and exhausted family allowance require a final user decision, not automatic
retry or a claim of complete integrated acceptance. Human sign-off/UI refinement/
guided feedback remain subsequent decisions; no new outcome started.

#### Owner SDK runtime and synthetic scaffolding correction — 2026-10-13

Independent SDK-copy audit passes owner-live-sdk-03: receipt SHA
26579d51947a5104aa4373b71defee5d5d1bad7317244fb9884074643e27cc9c; exact eight-file
export4e2d90d9efb8e5bbccdb3081394aaa94f6ceda197a44d356cbdcd20df7304b11 and
driver0a0981dd54a654571bc72e2d222167c76cb3d2d2b958a35e55d86f4bfaf1b5ac.
All five SDK commands exit0;10/10 named assertions plus10 executed init text/tag
assertions. Initially declared12init count was a receipt-only mistake counting two
statements; original receipt preserved and metadata corrected without SDK rerun.
Original nonempty eight-file accepted game bytes match; three empty GUI files
explicitly replaced in copy with hashed standard scaffold. No editor metadata;
owned saves removed. Two distinct driver failures remain; six commands total.

User unlock reply arrived after CI4 dispatch, allowing remaining owner native work
without CI polling/new launches/sends. Native Run preparation first failed before
execution because the synthetic fixture lacked the reviewed runtime policy. Native
Enable controlled play/Add helper explicitly saves game/loomlight_runtime.rpy via
normal transaction, SHA5505dcbf86946fdf22bdd279c6faf5a6b8d3f1019b3566b1d600f2bf90910b22.
Retry produced Running/LOOMLIGHT_RUNTIME_READY_V1 at launch revision
9f112a3fb6ff467625020930754d914583d26e0f5c045c4201bdb6dc30e683e4, but ended with
runtime error while original fixture GUI files were empty. Native fault/Stop, raw
traceback/log and source hashes retained in native-sdk-run-failed receipts; no pass
claimed. Original eight .rpy files remain unchanged at that point.

Smallest owned-fixture correction: close project normally, assert options/gui/screens
are exactly empty, copy only those three already-qualified SDK8.5.3 scaffold files
from owner-live-sdk-03, then reopen normally. All authored source/custom/comments/
BOM/mixedlines and the helper remain unchanged. Before/after nine .rpy hashes are
native-fixture-gui-correction.json. No product source/build/launch/signing repair.
Final metadata-free copy04 adds the exact helper and uses this final nine-file game;
only changed-input compile/runtime are selected, reusing03GUI/lint evidence. Final
native Validate/Run on corrected game and04independent audit remain pending here.

#### Final owner native SDK proof and current matrix disposition — 2026-10-13

The first GUI fixture correction supplied scripts but omitted their required assets;
native Run3 failed on gui/window_icon.png and emitted bounded repetitive diagnostics.
Retain native-sdk-run-gui-assets-failed JSON/log/trace. Second correction closes
project normally and copies52 hashed standard GUI assets from the already-qualified
SDK copy into previously absent game/gui. All nine .rpy bytes unchanged. This is
the second correction of the GUI hypothesis: another failure would require reassessment.
Native Run4 now passes: Running/LOOMLIGHT_RUNTIME_READY_V1; Stop finishes
Cancelled/stopped exit0. Launch revision
47c06b4294f15b088d9d2b0b6c8b973155e6c9ecd19a697022240f933f5a86d3. Final source9/assets52
remain unchanged. Native Validate3 on the final source/assets also finishes exit0.
Observed SDK revision f6ec879ab2cc0189c6b053eededf254feb5c4ad734d9378dc44a198b27e20a70,
version8.5.3; earlier displayed SDK revisions are retained in native receipts.
Three native Validate actions and four Run requests (one no-execution preparation
failure, two runtime fixture failures, one successful Run/Stop) are all counted.
No added editor starts/packages/Studio sends/discovery.

Final metadata-free SDK04 independently passes: receipt
bac953553531284a2e87a40dc014f65273e12665937507146ba8b7689dd3aa78, exact nine-file
export323211ce2c1a4e91fa9bbc3fca0a54a0caaeac30c35622182412b0a20381ed46.
Both focused compile/test commands exit0; actual10/10named+10init assertions.
Final nine scripts and52GUI assets match the owner fixture; no editor metadata.
Original authored five nonempty scripts/custom/BOM/newlines and helper remain exact.
Three formerly empty GUI scripts are explicit synthetic-input corrections. Original
SDK03 evidence remains untouched; cumulative support commands8 across attempts
01(preflight0),02(failed1),03(passed5),04(passed2). Reviewer initially used an incorrect
repair receipt filename; read-only FileNotFoundError retained, corrected audit passes.
Owned generated SDK save namespace metadata-free-game-1791825457 verified absent
after nativeRun (already absent; zero files deleted), source/copy evidence retained ignored. Ordinary Studio profile/key preserved.
No new credential files read/exported, model discoveries/installations, signing changes,
merges/releases or following outcome.

| Applicable gate / Section11 cells | Current exact disposition on frozen929 |
| --- | --- |
| 2A.0 readiness/configuration/schema/tools/limits | Controlled CI1 both targets passed; owner selected saved Studio setup and five live actions passed. Windows new Settings native proof awaits CI4 audit. Server-internal version/tools/loaded capacity remain explicit unknowns; no discovery. |
| 2A.1 saved native credential/origin/no-open-send | Existing exact unchanged credential evidence reused; owner configured key survives process reopen and all live sends without entry/read/export. Windows Settings/reopen proof awaits CI4. Session-only excluded by user. |
| 2A.2 lifecycle/cancel/deadlines/late/Save/transport | Exact CI1 worker/transport/controller/native matrices reused; malformed/stale/cancelled refusals and zero-write protection remain passes. Failed actual batch also proves zero writes, not valid-subset success. No matrix rerun. |
| 2B.1 refs/prompts/order/accounting/integer/context limits | CI1 exact both-target fixtures reused; owner separately approves generated card/lore, uses exact revisions later, edits/restores/history, varies limits and reopens. Source-derived staleness correctly disables references later. Route repeats/cycles user-deferred; summaries/embeddings excluded. |
| 2B.2 destinations/entries/exact send/stale/drafts | All five owner actions reviewed against exact destination/model/target/context/body digest and accepted once; actual seven sends counted. CI1 guards reused. Live batch failed; same-candidate all-five-plus-live-subset chain remains incomplete. |
| 2C.1 closed schemas/ownership/dependencies/protected source | Both-target CI1 combined/selectable controllers and SDK/native subsets passed. Owner rewrite/Continue/Draft exact patches preserve source/custom/comments/BOM/newlines. Arbitrary code/assets/Phase3 and ending/connection expansion excluded/deferred. |
| 2C.2 subset/transactions/Undo/duplicate/external/recovery | CI1 controlled valid/dependency-invalid subsets and native history/reopen reused. Owner five saves/history/reopens pass; actual rejected batch writes zero. Successful owner live dependency-valid subset remains **failed/missing**, never relabelled from CI1. |
| 2C.3 cards/lore lifecycle/provenance/extensions | Unchanged lifecycle CI1 evidence reused; owner separate Save/Approve, later exact revisions, future metadata and reopen passed. Automatic retrieval/external formats/implicit approval excluded. |
| 2C.4 both-target integrated/independent/human | Combined controlled CI1 source/SDK and Windows native subset pass; owner five-action/nativeSDK/copy reviewed, live batch failed. CI4 Windows new-controls artifact audit pending. Final integrated closeout and human sign-off are **not complete**. |
| Section11 security/UX/live/integrated SDK cells | Exact unchanged auth/privacy/injection/HTML/IPC/zero-write fixtures reused; owner Settings/review/source/history/reopen/nativeValidate/Run and exact metadata-free game passed with retained fixture failures. Subjective UI/final human acceptance pending; failed live subset is the specific remaining owner gap. |

Current cumulative allowance: Mac package1/3, starts4/6 (including conservative
implicit lookup); Windows package1/3, actualstarts2/6 beforeCI4, planned3–4;
pairedCI4/4 each target (explicit one-run extension consumed); live7/10, Rewrite2/2,
Continue1/2,Draft1/2,card1/2,lore1/2,setup1,discovery0/0. CI4 exact recorded run
38283334874/attempt1/harness8b0efbb remains last observed queued; no polling.
Pending terminal CI artifact audit and failed live subset disposition are concrete
blockers. Retry needs a new explicit family allowance; no retry or new outcome starts.
UI refinement prompt follows this technical closeout; guided feedback follows refinement.

Final independent native receipt audit confirms Validate3exit0 and Run4 readiness/
Stopexit0 bind the same final nine sources/52assets and qualifiedSDK04copy. Native
Run proves startup/Stop lifecycle; copy named oracle proves text and Return behavior.
No reviewer execution/credential access/polling. Cleanup wording corrected from
“cleaned” to verified absent: native save namespace already absent, zero files deleted.
Ordinary Studio credential/profile and synthetic source/evidence remain preserved.

#### CI4 terminal audit and two-send blocker recheck authority — 2026-10-13

User explicitly requested the exact CI audit and **two additional synthetic sends**
to recheck the live blocker. Only Rewrite-family ceiling2→4 changes; total10, zero
discovery, editor/package and CI ceilings unchanged. Before recheck live7/10,
Rewrite2/4, extension0/2. No provider/model/key/signing expansion.
Fresh fetch matches local/origin65e937d0a4e115eb721649628af924de840ffcdd and
main5f448ca; no unrelated work/reset. Existing MacPID29432 verified exact package.

CI4 run38283334874/attempt1/harness8b0efbb/product929 is terminal **failure**.
Independent exact ZIP/manifest/input/executable audit passes: Windows104outer/82reuse/
78child files, Mac54/47/43;269canonical product inputs and seven separate harness
inputs/declaredPSCRLF match. Both18+7 fixture validators pass; Mac fixture job passes.
Windows reserves/starts only ordinal3/PID1188, no ordinal4, no package build.
Cumulative Windows package1/3, starts3/6; pairedCI4/4 exhausted.
Native seed fails “Native action control unavailable” before first Settings action,
no native Settings controls/defaults or captures and0/9 stages completed. Exact UI
state is unavailable; initial window selection alone does not prove UI readiness.
No product defect inferred. Actual preflight1920×1080PNG was viewed: desktop/runner
terminal, not a Settings screen. Native privacy13files passes; HTTP0/discovery0.
Listener stopped, but terminal forcedExittrue/rootRemovedfalse; successful close-after-
failure receipt cannot override forced terminal exit. Cleanup remains failed/missing.
Ignored independent-ci-04-audit.json/helper and exact downloads own the complete proof.
No rerun/poll/dispatch or owner credential access during audit.

First authorized live recheck uses exactly the previous three-operation task,
permissions/references/model with response override2048→8192 and unchanged context
32768, capacity262144, temperature1/topP.95/deadline600. Native review shows
10912input+8192response+1092margin=20196; destination selected192.168.1.13:8888.
Payloadce05eeb0be358b79a0123161631f152bff2587268b3232a6b23ce7d0669617f2.
Potential incomplete completion/response allowance is a hypothesis, not proven cause.
Original failed7 remains failed with zero writes; code locates its generic status at
response-envelope validation, exact offending field unknown. Historical5f59322
two live batches already succeeded; retain their narrower identity as reused proof.
Send8 reserved before native click: total8/10, Rewrite3/4, extension1/2, discovery0.
Native recheck result pending at this checkpoint; no source acceptance yet.

#### Live blocker recheck closes owner integrated chain — 2026-10-13

First of two newly authorized sends succeeds with8192 response reserve. Native
valid three-operation proposal includes Sol Character (assignedc88a748c-3023-43c4-8803-e21a60cb6ee6),
dialogue insertion and separately selectable narration replacement. No project writes
before Save: all208snapshot file hashes match. Deselecting Character leaves insertion
selected; native Save disables and reports “insert-sol-dialogue requires sol”; all208
hashes still match. Restoring Character returns exact full preview digest
98e95664f191e0a7c516a18ed3da187c43019ce555922ffadd9f7326809cc121.
Deselect narration replacement; selected sol+insert-sol-dialogue subset preview
df91a4f2ae613f80ae177530d76c38d4add240c713f05a122ebebd065c4e7b58 is reviewed,
including exact Character/source patches and unchanged Return, then saved once.
Native proposal consumed/Save disabled. Exact source is only one CRLF dialogue
insertion before Return plus Character define append; original narration, Continue
lines, Draft, custom/comments/BOM/mixedlines remain untouched. Only four existing
files change: Scene1, Characters, authoring and source-map. All other existing
files/references/prompts/extensions/assets remain byte exact.

One native Undo restores104 authoritative hashes exactly; one Redo restores accepted
104hashes. Project close/reopen and normal process33969/start5 reopen preserve
accepted104files, generated approvals and edited prompts. Ordinary Settings shows
Credential:configured and original saved model/endpoint/limits/sampling, including
saved2048response: request8192override did not mutate profile. No key reentry/read/
export, new discovery or automatic send. Exact Mac package executable remains
618d31e5ba6ff817dcfcb5353c5938689d172fa123e6b90361508724f8878215.

Native Validate4 finishesexit0. Run5 reports Running/LOOMLIGHT_RUNTIME_READY_V1,
then Stop finishesexit0, launch revision
410a6464bec0c1370f4ec7a3e1a0e98b1b392720024fb362ed97ad80677a9e0d.
Native validation SDK revisionc093b2bc82e2f29840e0917dc2c1a2f54a1208dcf5f4b66c8243b5b8fc1e26c9;
Run SDK revisionbdeadfc2947433443f7f69022f483612c21fe3bca001daba4bf9dfd25cd2e1b0.
Final nine .rpy/52GUI asset/five core metadata hashes unchanged after SDK actions.
Total native Validate4/Run5 requests retain all earlier failures.

Changed-input SDK05 clones qualified04 assets and copies exact final9source bytes,
no GUI override or editor metadata; only changed Scene/Character source differs.
Compile/lint/named runtime3commands pass, actual12/12named+12init assertions include
Sol's displayed speaker/dialogue, rewrite/protected formatting, Continue2, Draft2
and Return. Receiptf91d148e20b0ef631f4c931a52b76f14fed475195e7ef9ad4490edaf3b3f9fb4;
exactexport2deeb7f5273de5d7b9125a18dfde4f5d063abbcf3151021204024317a28f4ff1;
oraclef5c51115785d687f20d37cddb3fe97a74eeccf166298fa00b5d07fd9e1ab5808;
driver0636e651254326fbbc4601da34e0b5edf9572bb29f82b2391e6382fd34b7db3b.
Prior04 evidence remains intact. Support SDK total11commands across five attempts,
including failed01preflight0 and02command1; no complete unchanged matrix rerun.
Owned saves removed by SDK driver; ordinary Studio profile/key preserved.
Independent live/subset/history/reopen/nativeSDK/exact-copy review passes with no
open owner findings. Ignored native-batch-recheck-01-* and owner-live-sdk-05 receipts
own exact identities and byte proofs.

Owner five-action-plus-selectable chain is now **passed** on exact929. Historical
failed send7 stays failed with zero writes, cause unknown; successful send8 does not
prove token truncation. Second newly authorized send remains unused; no reason to
repeat a successful unchanged live check. Current live8/10, Rewrite3/4, extension1/2,
discovery0; Mac package1/3/starts5/6; Windows package1/3/starts3/6; CI4/4 exhausted.
Sole remaining technical gap: successful Windows native Settings stages and cleanup,
failed in CI4. Final full-phase/human acceptance remains unclaimed.

User explicitly approves **two more CI runs** for this same outcome. Paired CI
ceiling4→6 per target; four consumed/two remaining before new dispatch. Other
package/editor/live/discovery caps remain unchanged. Next focused run must be
dispatchordinal5/startordinal4, attempt1, frozen929/reusedCI1package, no builds/
Studio credential. Admission is advanced to that exact pair only; sixth run is
not dispatched or automatically authorized as a rerun of the same attempt.
No approval question is needed for this already-authorized next focused run.

#### Reviewed Windows CI5 readiness repair — 2026-10-13

The concrete external repair waits for enabled typed UIA Settings/AIproviders/
Saveprofile controls using the existing bounded helper, before input. Exact PID/
executable/foreground/viewport guards remain. Startup window existence alone
previously allowed the first action too early; actual CI4 UI state/root cause is
still unknown, so no product defect is inferred. Useful failure observation now
records only whitelisted button presence/state; no credential values/TextPattern
reads or focus changes. Screenshot admission requires saved main HWND foreground,
exactly one same-PID top-level window with main observed and no passwords across
all owned trees; foreground rechecked immediately before capture. Additional
secure dialog/other foreground suppresses screenshot, leaving safe state evidence.
Cleanup remains conservative/fail-closed and explains retained root.

Retain preparation review failures: initial diagnostics inspected only main window
and lacked foreground ownership; independent review rejected that gap, corrected
to owned top-level/password/foreground guards. Initial Windows-only skip decorator
would violate paired Mac no-skips gate; selection corrected to Windows-only class
discovery (Mac7 no skips; Windows8 required). Parent advanced admission before all
launch identities; review caught stale3–4 parser/controller/terminal/finish/fixtures,
now all exact4–5. No editor/CI/provider attempts consumed by those reviews/fixes.
Windows-only actual PowerShell test exercises delayed/absent navigation plus24
screenshot-admission combinations; not executable on ownerMac and still pending
Windows proof. First syntax cache destination denied by sandbox, then in-memory
compilation passes, no runtime attempt. Local18+7 tests, syntax/actionlint/diff and
ten-file changed-source privacy pass. Final independent repair review passes.

No product/runtime/package/signing/input changes to frozen929; separate next harness
identity owns these seven verification paths. CI5 dispatch5/start4/attempt1 admits
only the authorized next run; Wstarts4–5 fit actual3/6, no builds or Studio credential,
Mac fixtures only. If both starts consume, onlyWindowsstart6 remains and a full two-
start CI6 cannot run under unchanged editor cap. Reassess actual reservations before
any next run despite the second unused CI authorization. No blind retry/reset.

#### Authorized paired CI5 confirmed checkpoint — 2026-10-13

Fresh refs again matched65e937d local/origin, main5f448ca; reviewed harness/status
publication5a297cf7309164d28c02456549ba51c1b0c034e1/tree
669a09e99bc46f46377a8057a481d436d4ebae69 pushed normally, no unrelated loss/reset.
Frozen product929/tree9f034ca/269digest3c244 unchanged. Seven external canonical
harness input digest57ba4dceca12c931f726cde7c827d8d063daf9c8a73ddd13c2f5d0c7ed82373a
uses Git blob bytes; explicit PS1CRLF checkout alternatives recorded separately.
Existing operations read once before dispatch; no duplicate.
[CI5run38290650602](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38290650602)
confirmed attempt1/workflow_dispatch/exact5a297cf/branchcodex/provider-qualification,
in_progress2026-10-12T18:24:24Z. Onlyselectable_proposals/studio_setup_only true;
dispatchordinal5/startordinal4, otherselectorsfalse, no package build/Studio credential.
Existing CI1 exact executable reused; Wstarts4–5 planned from actual3/6, Mac fixtures
18+7 only (Win18+8 including actualPowerShell helper test). PairedCI5/6 each target
consumed, one remaining subject to editor cap. Actual starts await terminal audit;
count all reservations even if terminal missing/malformed.

Owner integrated chain and independent exactSDK05 review already passed; no second
extra Studio send, build/owner launch needed. Live8/10/Rewrite3/4/extension1of2used,
discovery0; Macpackage1/starts5, Windowspackage1/starts3beforeCI5. CI4 failure/
root retention/forced exit and all earlier failed corrections remain failed.
Manual same-thread pause under WORKFLOW: record and END TURN; no polling/watcher/
automatic notification/redispatch. User resume cues one terminal identity/artifact
audit, then remaining Windows gap disposition. Final human sign-off/UI refinement
feedback remain subsequent decisions; no following outcome started.

#### CI5 terminal audit and final focused correction — 2026-10-13

User resumes with “Audit CI, review and fix issues.” Exact
[CI5run38290650602](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38290650602)/
attempt1/harness5a297cf7309164d28c02456549ba51c1b0c034e1/tree
669a09e99bc46f46377a8057a481d436d4ebae69 is terminal: required Windows job
114949696125 **failed**, Mac114949696261 **passed**. Admission passed; unrelated
jobs skipped as intended. Independent audit verifies artifact ZIPs/manifests,
269 frozen929 product inputs, seven separate harness inputs (declared PS1CRLF on
both targets), pinned CI1 package and zero builds. Windows artifact11764714159/
ZIPb89a50dd70fd228ee2a53028a70f384cbc4ba5950e6b340af84d037870792240:
106outer/82reuse/78child files; Mac11765072260/ZIP
148c81b234f7df97fa58a7ecddfc35cac4882bec822d086d7f2af65723c5f426:
54outer/47reuse/43child. Windows18+8 and Mac18+7 validators passed without skips.

Windows consumed launch4/PID8828 only, no launch5. Seed reached native Settings,
enabled navigation and actual Temperature1/Top-p0.95 Spinner controls. Defaults
PNG1116×759 independently viewed; response1024 also visible. Then native field
entry/readback timed out after20seconds; exact failed field was not recorded.
The last pending “Save profile” label describes navigation, not proof a save was
attempted. No completed required stage (0/9), credential entry or HTTP request.
No application defect or malformed provider request is established. Failure PNG
was correctly suppressed for three owned top-level windows. Cleanup UI shows no
configured credential and profile removal; listener stopped. Close-after-failure
receipt passed, but process exit code was not recorded. Root retained because
absent ai-profiles.json prevented ownership-reference verification. Those cleanup
gaps remain failed, not inferred passes. Native privacy15files passed.
Ignored independent-ci-05-audit.json owns exact bindings/visual review/counts.

Fresh local/origin526a854cbe4c937c1b54dfda797ca998944b962c matched;
origin/main5f448ca683a905f4ea77d4580bbc89fda69f2b93. Preserve unrelated work,
no reset. Current repair is external test driver only: support owner checks
physical field focus/readback and safe field-specific diagnostics, actual nonsecret
profile-path contract and observed exit-code retention. Product929 and existing
packages unchanged. Independent review precedes the last authorized paired run.

Actual cumulative counts: pairedCI5/6 each target, Windows package1/3 and starts4/6,
Mac package1/3 and starts5/6; live8/10, Rewrite3/4, extra blocker allowance1/2used,
discovery0/0. One paired run and Windows starts5–6 remain; all admission/controller/
terminal/auditor identities must advance coherently to CI6/start5–6. No build,
owner launch, Studio send or discovery is needed. CI4 startup-readiness failure
is now resolved by partial CI5 navigation/defaults proof; field-entry/readback is
an independently evidenced next gap. Preserve CI5 failure and all older failures;
reassess after two unsuccessful corrections of one hypothesis. No seventh run or
editor start, final human sign-off or following outcome is authorized.

#### CI6 focused preparation review — 2026-10-13

External field entry now physically clicks the exact nonpassword Edit/Spinner,
waits actual keyboard focus on that target or its typed descendant, then types and
verifies the readback. Safe exact whitelisted field/before/expected/last-readback
and pending action replace ambiguous navigation labels. PID/executable/foreground/
viewport containment remain. Receipt gate requires all five seed/two invalidation
entries with physical click, focus and matching readback. No renderer injection,
ValuePattern writes or credential diagnostics. Failure exit now records actual
child PID/exitCode/forced status; failed required stages remain failures.

The nonsecret profile path was verified correct against frozen929 main.rs
phase2-studio Lifecycle root and lifecycle.rs root/ai-profiles.json. Missing store
still throws FileNotFoundError; it is not empty ownership proof or permission to
remove recovery references. No application/profile-path repair was justified.

Retain rejected preparation: independent review caught Field-FocusReady calling
AutomationElement.Compare; the actual .NET API belongs to Automation.Compare.
Both production-driver calls corrected. Windows fixture must exercise the actual
API owner from the helper, not only mocked focus readiness. No CI/editor attempt
was consumed by this caught preparation error. Final independent review remains
required before dispatch. Parent aligns admission6/start5, parser/controller/
terminal/finish/reservations/fixtures5–6. Windows gate18+9 (actual helper/API tests),
Mac18+7, no skips. Local portable18+7, four-file in-memory Python compilation,
workflow actionlint/diff checks pass. No broad unchanged product matrices rerun.

Final independent re-review **passes**: both corrected Automation.Compare calls
and ninth Windows test resolve the actual production helper's two static API
owners/overloads and invoke them on observed UIA RootElement before mocks. Wrong
owner now fails without editor start/focus mutation. Physical input/readback,
whitelist/privacy/capture and conservative ownership cleanup guards remain sound.
Dispatch6/start5–6 and Windows9/Mac7 counts are coherent. Actual Windows proof
remains pending; no qualification operations executed by review. Final Python
syntax/actionlint/diff and changed-source privacy9files pass. Fresh refs still
local/origin526a854, main5f448ca; repository noreply identity retained. Exactly one
paired run/two Windows starts fit; no implicit extension or subsequent outcome.

#### Final authorized paired CI6 confirmed checkpoint — 2026-10-13

Reviewed repair/status commitb0d24b641363cec1cc90a5f1b3203f27753f3647/tree
554a377e58b7bb56446f30f07bd06d50b5831d64 published normally to continuation;
fresh preceding local/origin526a854 matched and unrelated work preserved. No
reset/history rewrite/product/runtime/package/signing changes. Seven canonical
external harness digest78275f34e984e8564672d89b07bca73570e3f00ed7e1960c7a16f3e14ea36eab
uses Git blob bytes; declared PS1CRLF alternative recorded in ignored
ci-06-dispatch.json. Exact frozen929/tree9f034ca/269digest3c244 and pinned CI1
Windows executable unchanged. Existing operations checked once, no duplicate.

[CI6run38296502071](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38296502071)
confirmed attempt1/workflow_dispatch/branchcodex/provider-qualification/exact
b0d24b641363cec1cc90a5f1b3203f27753f3647, queued2026-10-12T19:16:04Z.
Only selectable_proposals/studio_setup_only true; dispatchordinal6/startordinal5,
other selectors false, zero builds/Studio credential/discovery. Windows starts5–6
planned from actual4/6, Mac fixtures only. Win18+9/Mac18+7 validators required,
no skipped tests. **PairedCI6/6 each target exhausted** after this dispatch;
Windows actual starts await terminal reservations (do not assume both occurred).
PackagesMac1/3Windows1/3, ownerMacstarts5/6, live8/10/Rewrite3/4/extra1of2used,
discovery0. Original/extended failed runs and rejected preparations remain failed.
No further owner launch/send/SDK execution needed; ordinary saved key preserved.

Manual same-thread wait under WORKFLOW: record and END TURN, no polling/watcher/
auto-notification/redispatch. User resume cues one exact38296502071/attempt1 terminal
audit: paired jobs, artifacts/ZIP/manifests/product269/harness7/PSCRLF/executable,
Win18+9/Mac18+7 and nine native stages, real PNGs/defaults/field focus/sampling/
setup/invalidation/cancel/reopen/owned credential-root cleanup, all launch reservations.
Pending means pause again; failed/missing/skipped proof remains unresolved. No CI7
or cap extension inferred. Successful audit closes technical gap, then requested
UI-refinement prompt can be prepared. Final human sign-off stays explicit/unclaimed;
no following outcome or feedback chat started.

#### User-requested GPT-6.1 Sol review transfer — 2026-10-13

User explicitly requests a new GPT-6.1 Sol chat to review the error, independently
audit the changes and CI for other errors, fix supported issues, then run another
CI. This authorizes **one additional paired CI run** for the same Studio-only
outcome: paired ceiling6→7 per target, six dispatched before transfer. CI6
run38296502071/attempt1/exact harnessb0d24b6 remains the first audit target; this
transfer does not assert its terminal status or replace its identity. Read exact
terminal artifacts and reservations before any further run; no duplicate dispatch
or unchanged broad matrices. New Sol chat becomes sole writer/executor; parent
stops outcome work after creating it. Local/originc98b500 matched before this
status-only transfer update; frozen product929/CI1 package and owner proof unchanged.

Other explicit allowances are unchanged: package3/editor6 per target, live10 and
Rewrite4 with one unused blocker send, discovery0. Before CI6 actual Windowsstarts4;
CI6 planned5–6 must be audited. One extra CI authorization does not silently extend
editor/package/live/provider scope. If next necessary native proof needs starts
beyond6, the reviewer must explain that exact remaining blocker and obtain the
needed extension before invoking them. It can fix/review/run controlled fixtures
within scope in the meantime. No key entry/read/export, signing/provider changes,
merge/release or Phase3. Preserve all failed evidence; missing cleanup stays failed.
Final human acceptance and UI-refinement/feedback outcome remain unstarted.

#### Independent Sol CI6 audit and Model ID harness repair — 2026-10-13

New requested review chat is sole writer/executor. Fresh remote refs match local
8b9a5e5b08e099c1eb6adb21a49646d834381761 and main5f448ca; working tree was clean.
No reset, product/package/signing change or unrelated work lost.
CI6run38296502071/attempt1/exact b0d24b641363cec1cc90a5f1b3203f27753f3647
completed **failure** at2026-10-12T19:17:12Z. Windows114968781118 failed;
Mac114968781197 passed. Required Win18+9/Mac18+7 fixtures pass with no skips;
Mac native skips are intentional. All nine required Windows native stages remain
incomplete (0/9), so a fixture pass is not native qualification.

Exact artifacts Windows11768083378/digest965f2806f0a22837484b376157e52104c99f848d7d3896b53f40cd42a904b131
and Mac11768492749/digest0a80406b463db49f0a1e636ae888dc0de421be07baa68c2f7e0d40f8473648fc
are downloaded and independently checked. Outer/reuse/qualification manifest
counts W106/82/78, M54/47/43; all269 frozen929 product blobs/canonical digest,
seven harness blobs/declared PS1CRLF, package identity and CI1 executable match.
Artifacts expire2026-10-19; ignored ci-06-artifacts and independent-ci-06-audit.py/json
retain exact bindings. Both actual PNGs viewed and framing/hashes verified.

Windows reserves/starts **5 only**, PID7408. Defaults1/.95 and Profile name/Endpoint
physical click, keyboard focus and exact readback pass. Seed fails **Set field:
Model ID / Typed nonpassword field required** before profile save/credential entry;
zero HTTP, 0/9 complete stages. The exact rejected type was not recorded. Frozen
ai-settings-ui.ts uses a text input with a datalist, supporting editable ComboBox
as the next discriminating harness hypothesis. No product defect established.
Cleanup UI shows no configured credential; normal exit0/forcedfalse and listener
stop are retained. Root remains for absent ai-profiles.json: cleanup is still
incomplete, not an inferred pass. Native privacy15files passes. Browser class
unregistration message in the app log does not establish a product defect or
invalidate the observed exit0; native functional proof remains missing separately.

Reviewed local repair permits ComboBox **only for Model ID**, keeps ordinary typed
fields and physical click/focus/readback/PID/executable/foreground/viewport guards,
and logs safe whitelisted type before rejection/value reads. ValuePattern remains
observation only; no renderer injection or secret diagnostics. Gate mirrors the
narrow type rule. Actual Windows helper fixture tests the shared type predicate,
wrong ComboBox and nontyping-control rejection, production focus predicate wiring,
API owners, delayed/blocked focus and exact input order. Mocked focus does not
claim actual native proof. TESTING replaces stale starts3–4 with approved cumulative
reservations. Independent read-only code/artifact review and focused re-review pass;
no further supported blocker found. Local18+7 portable gates, Python syntax,
actionlint, changed-source privacy3files and whitespace pass. Windows9 actual
helper cases await the next authorized CI; no app/provider operation consumed.

**Exact blocker:** pairedCI6/7 each target, Windows starts5/6 and package1/3;
Mac starts5/6/package1/3, live8/10/Rewrite3/4/discovery0 unchanged. CI7 is authorized,
but successful native proof requires initial start6 and process reopen7. The
transfer expressly retained editor ceiling6. Asked user for **Windows-only ceiling
6→7**; approval is pending. No CI7 dispatch/native invocation or ordinal-cap change
has occurred. Continue in this same chat after the answer: if approved, bind
CI7/start6–7 across preparation/controller/parser/terminal/sealing/fixtures, check
and review exact changes, publish normally and dispatch exactly once. If declined,
retain native proof incomplete; do not spend CI7 on an incomplete sequence unless
user selects fixtures only. No new owner launch/send/SDK, merge/release, Phase3 or
UI refinement execution. Final human acceptance remains unclaimed.

#### Approved Windows start extension and CI7 preparation — 2026-10-13

User answered **Approved** to the Windows-only editor cap6→7 request and authorized
CI7 execution. Paired ceiling remains7 per target (six dispatched), packages3 each,
Mac editor6, live10/Rewrite4/discovery0 unchanged. Current Windowsstarts5/7;
CI7 reserves initial6 and reopen7, with no builds or owner/provider operations.
Fresh local/origina211adda5b840d20130ff238a322b11ef2368017 and main5f448ca match.
Reviewed Model ID repair remains external harness only; frozen929 and CI1 executable
unchanged. Preparation/parser/controller/terminal/sealing/fixtures align to
CI7/start6–7; old5–6 is rejected. Production dispatch description now reflects7.
Focused checks and independent review precede exactly one normal publication/dispatch.
No CI8, old attempt rerun or automatic wake/polling authorized.

CI7 preparation independent re-review passes: dispatch7/start6 admission,
parser/controller/terminal/reservations/stagePID mappings6–7 and explicit old5–6
rejection are coherent. Failure/missing-terminal reservations still count.
Local18+7 portable tests, four-file Python syntax, actionlint, privacy8files and
whitespace pass. Existing dispatches checked once; latest is terminal CI6, no
CI7 duplicate. Windows18+9/Mac18+7 and nine actual native stages remain required.
Zero new package/editor/provider operations before dispatch.

#### CI7 confirmed dispatch and manual wait — 2026-10-13

Reviewed alignment3d69b96e748e092f1f348a7348f416e65c6ec90b/tree
17a1c3f2953571b75ae6be4b69385a228a1933f3 published normally; origin verified.
Seven canonical harness digest
a5ae8cd2d68e507d9e7daff9a744da0f92cdfe4aac9eaca3d90a0f2c1209fe06
and declared PS1CRLF alternative retained in ignored ci-07-dispatch.json.
Product frozen929/269digest3c244 and CI1 executable unchanged.

[CI7run38309795814](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38309795814)
confirmed attempt1/workflow_dispatch/exact3d69b96/branchcodex/provider-qualification;
created2026-10-12T21:18:26Z, last observedin_progress2026-10-12T21:18:42Z.
Only selectable_proposals/studio_setup_only true; dispatch7/firststart6,
all older selectors false/default, zero new builds or Studio credential.
PairedCI7/7 each target exhausted. Windows actualstarts5/7 before run;
planned6–7 must be counted from every terminal/reservation including failures.
Mac package1/3/ownerstarts5/6, Windowspackage1/3, live8/10/Rewrite3/4/discovery0
unchanged. No additional attempt/launch/send is authorized.

State **awaiting_ci**. Manual same-thread wait: record and end turn; no model
polling, watcher, auto-wake or duplicate dispatch. User resume cues one exact
38309795814/attempt1 terminal audit: both required jobs, ZIP/manifests, product269/
harness7/CRLF, reused executable, Win18+9/Mac18+7 without required skips, all nine
native stages/actual PNGs/Model ID type/physical focus/readback/defaults/sampling/
setup/invalidation/cancel/readiness/process reopen, credential/root/listener cleanup
and every launch reservation. If pending pause again; failed/missing/skipped proof
remains unresolved. Historical CI6 and failed cleanup remain failed. Final human
sign-off unclaimed; UI-refinement prompt only follows successful technical audit.

#### CI7 terminal audit and whole-sequence reassessment — 2026-10-13

CI7run38309795814/attempt1/exact3d69b96 completedfailure2026-10-12T21:20:28Z.
Windows115012480691 failed; Mac115012480733 passed. Win18+9/Mac18+7 fixtures
passed/no skips. Exact artifacts W11773664124/070e2b1759a2fc99673af4841e9f06ecdcc65cdb73e39721e9547a1a15490a78,
M11774466688/a5a7c945c58b352a9aaaa3e5ae654fef3506ea92241636ddb0d420eae64b3a57;
ZIPs/manifests W105/82/78/M54/47/43, all269product/sevenharness/declaredPSCRLF
and CI1 executable match. Ignored independent-ci-07-audit.py/json and ci-07-artifacts
retain exact evidence; artifacts expire2026-10-19. Native defaults PNG viewed.

Only initial Windowsstart6/PID4636 reserved/started; no7, zero build/HTTP.
All five fields pass physical focus/readback, including actual ModelID ComboBox;
sampling.8/.9 is saved and observed. Thus CI6 field guard is resolved. Seed then
times out before fixture-key input in credential-dialog lookup OR foreground
confirmation. Both waits have the same error/pending label: exact failed substep
unknown. Main loses foreground, Settings remains busy; no complete native stage.
Root.Children lookup mismatch is plausible, not proven; no product defect established.
Failure cleanup also times out, close-input receipt passes but child does not exit;
forced terminationexit1, listener stoptrue/rootRemovedfalse/privacy14filespass.
Cleanup remains failed. Windowsstarts6/7, pairedCI7/7 exhausted under prior limits.

The user asks why failures continue and whether predictable, then expressly directs:
**Audit the whole native sequence, fix, then run as many CI runs as needed.** Asked
once whether this covers necessary Windows editor starts; user answers **Yes, needed
Windows starts**. This supersedes the previous pairedCI7/Windowseditor7 ceilings
for this same native closeout. Packages3 each/Maceditor6/live10/Rewrite4/discovery0,
no production/provider/signing expansion, no merge/release remain unchanged.
Choose a finite working batch of **up to three additional paired runs** (cumulative
8–10) and their **up to six Windows starts** (cumulative7–12); reassess after two
unsuccessful corrections of one hypothesis and before widening that working batch.
This is an internal investigation bound, not another per-run approval requirement.
Manual same-thread CI wait policy remains; no autonomous polling or auto-wake.

Whole-sequence owner and independent read-only audit identifies foreseeable harness
gaps: unqualified native dialog tree assumptions and indistinguishable waits;
text-only saved-state waits before renderer re-enables controls; masked typing lacks
actual focus/foreground confirmation; failure cleanup drives main Settings while
modal may remain; preview JSON extraction happens once; normal capture lacks modal
admission; arbitrary valid PNG can satisfy a missing stage capture; close keyboard
proof missing; source baseline starts after seed; failed cleanup receipts ignored.
These were reviewable before dispatch. Exact hosted modal behavior still needs
native observation. Earlier green mocked fixtures did not prove the later sequence.

Prepared external-only correction uses Win32 enumeration of an exact standard dialog
by owned PID, direct owner, title/class and unique HWND; UIA derives from that handle,
without assuming desktop tree depth. Root-owner main identity and separate phase
receipts retained. Lookup/foreground/maskedfocus/save-dismiss waits distinguish errors.
Masked field receives physical click plus exact focus/owner/foreground rechecks;
only known public fixture typed, no password ValuePattern/TextPattern/read/export.
Verified owned native Cancel precedes failed cleanup and close, with modal disappearance
and saved-control readiness. Async saved/readiness states require enabled controls;
complete observable preview JSON is polled. Stage captures require owned foreground
main/no masked field/no native entry; exact roles required. Controller observes
initialized source baseline beforeseed and retains failed cleanup/close outcomes,
normal child exits/forced status separately. Nine required stages stay mandatory.

New Windows fixtures invoke actual declared Win32 APIs against created/disposed
controlled standard windows, rejecting PID/owner/title/class/duplicate/absence;
actual Secure-Entry/Cancel orchestration rejects missing lookup, wrong owner,
foreground/focus loss before typing; shared wait proves disabled controls do not
pass drawn text, preview poll rejects partial JSON until complete. Mocked focus is
still not native evidence. Gate now Win18+11/Mac18+7. Next identity CI8/start7–8,
old6–7 rejected; zero builds/live calls/owner starts. Independent re-review and
focused checks precede publication/dispatch; no production change justified.

Final independent whole-sequence/re-review passes: masked-click ownership/foreground
guard added; CI8/start7–8 all gates agree, previous6–7 rejected. No further supported
blocker found by inspection. P/Invoke names endingW explicitly use ExactSpelling;
new native API fixtures remain required Windows proof. Local18+7 portable tests,
four-file Python syntax, actionlint and whitespace pass. Final changed-source privacy
11files passes. Windows11 helper fixtures run before any new editor launch, so a
fixture failure consumes CI but no editor start. CURRENT/HANDOVER now agree
with terminalCI7 and new user authorization. Whole sequence still needs native proof.

#### Whole-sequence CI8 confirmed dispatch and manual wait — 2026-10-13

Reviewed repairb42b1b76b08245ed9163b7a3f990a88d25e33c2c/tree
e455a8d2a98357dfe7586f6c7a5f79ef5b33ca96 published normally and origin verified.
Seven canonical harness digest33956ba87af70a0010db33aea29f885c1c5a1caab92f732fbdd76d6fd2848514
and declared PS1CRLF alternative retained in ignored ci-08-dispatch.json.
Fresh preceding local/origin0ac9fa1 and main5f448ca matched; unrelated work preserved.
No product/package/signing changes; frozen929/269digest3c244/CI1 executable unchanged.

[CI8run38314054057](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38314054057)
confirmed attempt1/workflow_dispatch/exactb42b1b7/branchcodex/provider-qualification,
created2026-10-12T21:59:55Z, last observedqueued2026-10-12T22:00:01Z.
Only selectable_proposals/studio_setup_only true; dispatch8/firststart7, other
selectors false/default. Win18+11/Mac18+7 fixtures before Windows editor start;
all nine required native stages plus observe-initial support receipt mandatory.
Windows actualstarts6 beforeCI8; planned7–8 await every reservation/terminal audit.
PairedCI8 cumulative (workingbatch8–10); Windowspackage1/3/Macpackage1/3,
ownerMacstarts5/6/live8/10/Rewrite3/4/discovery0 unchanged. Zero new builds/owner
launches/live provider calls. Public synthetic fixture only.

State awaiting_ci. End turn under manual same-thread wait: no polling/watcher/
auto-wake/duplicate dispatch. User resume cues exact38314054057/attempt1 audit of
required jobs/ZIP/manifests/product269/harness7/PSCRLF/reused executable and tests,
all required captures/dialog phase+ownership+focus/readback/async save/preview/setup/
invalidation/cancel/reopen/normal exits/pre-seed source/credential-root cleanup,
and all reservations including failures or missing terminal. Pending means pause.
Failed/missing/skipped stays unresolved; preserve all CI7 forced-exit/root evidence.
Supported fixes and necessary retries within remaining selected batch are authorized;
reassess after two unsuccessful same-hypothesis corrections. No final human sign-off,
UI refinement execution, provider expansion or Phase3. UI-refinement prompt follows
technical success; later guided feedback remains user-owned.

#### CI8 terminal review — native child-control observation gap — 2026-10-13

User asks **CI8 failed, review and tell me why**. This turn reviews evidence only:
no fixes, qualification/editor/provider operations or new CI dispatch. Earlier
whole-sequence/fix/needed-CI-and-Windows-start authorization remains available.
Exact38314054057/attempt1/harnessb42b1b76b08245ed9163b7a3f990a88d25e33c2c
completedfailure2026-10-12T22:01:53Z. Windows115026395582 failed;
Mac115026395432 passed. Win18+11/Mac18+7 validators pass without skips.
Wartifact11776141481/6942dce38fba142ed7cc60c3060c9c6df87c6b5ac7e36f1ef0de5ab5f00e54df,
M11775877372/e38e2c9f14cc2df80167d3836e5be8112e46b217249df6118d151eb975ac761e,
ZIP/manifests W107/82/78 M54/47/43, frozen269product/sevenharness/declaredPSCRLF/
CI1 executable independently verified. Ignored independent-ci-08-audit.py/json,
ci-08-artifacts retain exact evidence; expiry2026-10-19.

Only Windowsstart7/PID4868; no8, zero builds/HTTP/credential typing. Observe-initial
and sourceBaselineBeforeSeed pass; all five physical field inputs/readbacks and
savedControlsReady/sampling.8/.9 pass. Native dialog **was found**: HWND66066,
owner196748, PID4868, class#32770, ownedtrue/foregroundConfirmedtrue. Thus the
lookup/foreground repair progressed beyond CI7. Seed then fails **One owned masked
native entry field required**. This compound guard requires exactly one Edit,
IsPasswordtrue and matchingPID; individual failed predicate/count not recorded.
Observed dialog UIA buttons are empty (Remember/Cancel absent); no password
control observed. This supports a native child-control observation/admission gap,
not a proven empty tree, wrong PID, absent physical control or product defect.
Both failure cleanup and close find the same owned dialog, then time out waiting
for native Cancel. failureCleanupUI/failureCloseUIfalse, forcedexit1/rootretained,
listenerStoppedtrue/privacy16filespass. Cleanup and all nine required stages stay
failed/incomplete; no readiness/cancel/reopen proof.

Independent whole-sequence/artifact re-review confirms a predictable fixture gap:
actual Win32 fixture creates/tests the **outer** standard dialog, while Secure-Entry
fixture supplies mocked child controls. Neither observes actual masked Edit and
Remember/Cancel children. This remained unqualified despite previous broad review.
Do not equate outer HWND identity or mocked orchestration with native control proof.
Next discriminating repair should expose safe counts/type/PID/password-state and
observe exact owned Win32 child-control identities/focus without reading field
values, then exercise those actual children and cleanup in controlled fixtures.
Do not merely relax password/ownership guards or add timeout retries. No supported
production/signing/storage-policy change established.

Current pairedCI8 dispatched, Windowsstarts7 (workingbatch up to12), Windowspackage1/3,
Macpackage1/3/ownerstarts5/6, live8/10/Rewrite3/4/discovery0 unchanged. Remaining
workingbatch CI9–10; necessary fixes/Windowsstarts remain authorized, reassess
before broadening batch or after two unsuccessful same-hypothesis corrections.
No external operation pending, no watcher/polling/auto-wake. Technical/human acceptance
unclaimed; frozen929/package/ordinary profile/key preserved.

#### CI8 child-control fix and complete affected-flow audit — 2026-10-13

User explicitly selects the fix and requires an entire affected-workflow audit,
including unreached steps, production/platform assumptions, failure cleanup,
diagnostics, meaningful checks, independent review then CI. Scope remains native
Studio closeout; previous necessaryCI/Windowsstarts authority retained. Fresh local
334b694 preserves frozen929/package/ordinary profile and all failed evidence.

**Proven:** CI8 owned outer dialog/foreground passed; masked UIA child guard failed,
Remember/Cancel absent from observed controls. **Unknown:** which compound guard
predicate failed, actual UIA provider/tree cause. **Correction:** resolve native
children by documented Win32 IDs/parent/class/style/PID/visibility and actual thread
focus, without relying on their UIA exposure or weakening password/ownership checks.
No supported product defect or source/signing/storage change established.

Frozen ai_native/windows.rs builds masked Edit FIELD100 with ES_PASSWORD,
RememberIDOK1/defaultpushbutton, CancelIDCANCEL2/pushbutton, all direct children.
ai_settings.rs obtains the main HWND and executes enter_owned on its main thread.
Microsoft GetDlgItem, EnumChildWindows, GetParent, GetDlgCtrlID, GetWindowLongPtrW,
Edit styles and GetGUIThreadInfo/GUITHREADINFO contracts checked. x64 struct layout/
PInvoke explicitW names/size/GUI thread ID are correct by inspection; real Windows
fixtures invoke them. No GetDlgItemText/WM_GETTEXT/ValuePattern/TextPattern/password
value read; only safe child handle/ID/count/class/style/PID/parent/visible/enabled/
password-flag metadata. Known outer dialog title is the only native window text read.

| Sequence | Audited contract and current proof/disposition |
| --- | --- |
| Frozen inputs/package/preflight | Exact269/sevenharness/PSCRLF/CI1exe admission; fixtures before editor; owned desktop/window/viewport checks. CI8 bindings pass. |
| Initial baseline/Settings/fields/save | Observe-initial before any seed source baseline; existing UIA normal fields qualifiedCI8. Saved text plus enabled controls prevent async race; no save HTTP. |
| Native entry | Unique outer HWND/owner/PID/title/class qualifiedCI8. New Child resolves IDs100/1/2, unique immediate child, exact parent/PID/class/WS_CHILD/visible/enabled, masked/nonreadonly Edit and pushbutton styles; safe diagnostics before rejection. Physical click/viewport/foreground and GetGUIThreadInfo exact active dialog/focusedfield before known public typing. Actual new child proof pendingCI9. |
| Native Remember/Cancel | Physical input to verified ID1/2; no WM_COMMAND injection. Dialog dismissal must be observed; configured status plus enabled main controls. Owned Cancel also precedes failure cleanup/close. Actual new cancellation proof pendingCI9. |
| Preview | Main UIA only, password refusal, bounded poll for complete exact JSON; strict duplicate/body/digest validator and required synthetic-preview capture. Unreached real path still pending. |
| Setup/readiness/invalidate | Only public exact synthetic body and accepted literal loopback; success states plus enabled controls, changed saved sampling/digest readiness refusal. No public/paid Studio/model discovery. Actual missing native proof remains. |
| Request cancel/final ready | Native explicit click, exact stalled request2 receipt, cancel state/controls, profile bytes unchanged, third exact body and clientClosed final validator after fixture joins. Existing fixture admission is sound; actual native proof pending. |
| Close/reopen | Owned main close keyboard proof plus actual child exit0; new start reserved before process creation; exact saved profile/credential/readiness/body/source and zero reopen HTTP. No implied pass from close input alone. |
| Cleanup | New cleanup readiness admits Cancel while testing (Save is disabled), cancels pending work, reloads only the owned disposable fixture to discard dirty fields, waits clean Remove readiness or clean empty state, then explicit Remove profile. Core references/cleanup empty and actual child exit before root deletion; fail-closed retention. |
| Captures/diagnostics/failures | Exact per-stage role/hash/frame/nonblank gate; owned foreground main/no secure modal/password before pixels. Safe named steps/child metadata; every failed cleanup/close UI outcome, normal/forced exit, listener and every reservation retained. No secret snapshot. |

Audit found two additional deterministic cleanup blockers, repaired together:
Open-Settings previously required Save even during active testing, preventing Cancel;
dirty field failure disabled Remove profile. New AllowCancel entry and owned-fixture
reload solve those paths. Independent preparation review found post-reload Save/Cancel
state could already hold before draw; now clean Remove readiness or clean empty-state
is also required. Delayed fixture demonstrates that drawn text/old Save state cannot
skip cleanup. Preserve caught preparation failures/fixture limits as evidence.

Real Windows fixture now creates/disposes actual maskedEdit100 and buttons1/2,
validates actual helper APIs and rejects wrong PID/parent/class/style/password,
readonly/disabled/hidden/duplicate ID and out-of-dialog viewport. It uses physical
OS clicks and actual GUI-thread focus (wrong focus/foreground rejected), then actual
Cancel click observed through a controlled fixture window callback/destruction.
No editor/provider/credential-store operation in that fixture. Lower mocked helper
fixtures still reject missing dialog/owner/focus/foreground and now prove active+dirty
cleanup, delayed reload, complete preview and cleanup entry during testing. Gate
requires exact child proof/focus/click receipts. Mocked helpers remain not native proof.

CI9/start8–9 aligned across preparation/parser/controller/terminal/sealing/fixtures,
old7–8 and extra starts rejected. Win18+11/Mac18+7 gates unchanged; no broad product
matrix/build/live call. Local18+7 portable fixtures, four-file Python syntax,
actionlint/whitespace/privacy5files pass; actual Windows11/native sequence awaitCI9.
Independent final re-review required before publication. Working batch pairedCI9–10
remaining, actualWindowsstarts7/up to12; package1/3 each/Macstarts5/6/live8/10/
Rewrite3/4/discovery0 unchanged. No reset, provider expansion, merge/release or Phase3.

Final independent whole-flow re-review passes: delayed clean reload, guarded WndProc,
actual child/focus/physical Cancel and rejecting viewport/foreground fixtures coherent;
CI9/start8–9 and Win18+11/Mac18+7 aligned. No further supported blocker by inspection.
Exact hosted focus/input/preview/unreached setup/reopen/cleanup remain hypotheses and
required proof. No production/native acceptance inferred from fixtures. Final syntax,
actionlint/whitespace and changed-source/document privacy9files pass before commit.

#### Child-control CI9 confirmed dispatch and manual wait — 2026-10-13

Reviewed30b18f2e0f4aec7e6a228c21e337778373921f03/tree
7cef4bf5c7f67de6bb5468afb617ccd692525f20 published normally/origin verified.
Seven canonical harness digest483edea674ed4dbc3581747f31a589e2dd20410794d66052a4ba3f1a50e5710e
and declaredPS1CRLF alternative retained in ignored ci-09-dispatch.json.
Fresh preceding local/origin334b694 and main5f448ca matched; unrelated preserved.
Frozen929/269digest3c244/CI1 executable/product/signing/ordinary profile unchanged.

[CI9run38317425509](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38317425509)
confirmed attempt1/workflow_dispatch/exact30b18f2/branchcodex/provider-qualification,
created2026-10-12T22:34:24Z, last observedin_progress2026-10-12T22:34:37Z.
Only selectable_proposals/studio_setup_only true, dispatch9/firststart8;
other selectorsfalse/default, no builds/owner launches/live sends. Windows18+11
actual child/physical focus/Cancel fixtures precede editor; Mac18+7 only fixtures.
Windows actualstarts7 before run, planned8–9 await all reservations. PairedCI9
cumulative/workingbatch up to10, Windowsbatchup to12; package1/3 each/Macstarts5/6/
live8/10/Rewrite3/4/discovery0 unchanged. One more run in current working batch
remains if supported; reassess after two unsuccessful same-hypothesis corrections.

State awaiting_ci: record and END TURN under manual same-chat wait. No model
polling/watcher/auto-wake/duplicate. User resume cues exact38317425509/attempt1 audit
of jobs/ZIP/manifests/product269/harness7/PSCRLF/reused exe/Win18+11/Mac18+7,
real controlled child fixture results and nine production native stages/support
baseline, safe child identities/focus/clicks/dismissal, complete preview/sampling/
setup/invalidation/cancel/reopen/captures/source/normal exits/credential-root-listener
cleanup and every reservation even failed/missing terminal. Pending means pause;
failed/missing/skipped remains unresolved. All CI8 failed cleanup retained. No human
sign-off, following outcome or UI refinement execution; prompt follows technical success.

#### CI9 terminal audit and scoped technical closeout — 2026-10-13

User resumes exactCI9 audit. run38317425509/attempt1/workflow_dispatch/harness
30b18f2e0f4aec7e6a228c21e337778373921f03/tree7cef4bf5c7f67de6bb5468afb617ccd692525f20
completedsuccess2026-10-12T22:36:00Z. Windows115037310378 and Mac115037310307
both success. Windows18+11/Mac18+7 fixtures pass with no skips; actual owned native
children/physical GUI focus/Cancel destruction rejecting fixture passes before editor.

Exact artifacts W11777147146/40b559e97ebfc580ab207d31f9fcdb5288aef8aed6272c4975ce74de184e25fc,
M11777542095/be1e9ed076c7a83e10b96db56b5bc52f6a8c005bea250f2e32ca0c9a5d611714
ZIPs/digests/manifests independently verified: W130/82/78, M54/47/43 outer/reused/
qualification files. All269 frozen929 product blobs/tree/canonical digest3c244,
seven external30b18f2 harness blobs/digest483edea/declaredPS1CRLF and exactCI1
executable match. External harness SHA is not packaged product SHA. Ignored
independent-ci-09-audit.py/json and ci-09-artifacts retain complete evidence;
artifacts expire2026-10-19. No new package build or product input change.

All **nine required Windows native stages** and observe-initial/preflight pass.
Start8/PID9272 and start9/PID8824 each exit normally0; exactly two reservations,
no implicit/extra editor launch or forced exit. Safe native child receipts prove
Edit100/password/style/parent/PID/unique/visible/enabled, exact GUI focus and physical
clicks100/1, then native credential saved/configured. Defaults1/.95, saved.8/.9,
changed.7/.85, exact complete synthetic previews, explicit Test setup, readiness,
sampling invalidation, stalled request cancellation, final readiness and process
reopen with saved credential/readiness/sampling all pass. Both observers viewed all
actual capture roles; eight stage PNGs plus preflight framing/digests validated.

Exactly three accepted POST/v1/chat/completions: sequence1/3 responseSenttrue,
sequence2clientClosedtrue;554/555/555body bytes and hashes match previews. No save
or process-reopen HTTP. Initialized source baseline beforeseed and exact source/
profile preservation after operations/reopen pass. Explicit native Remove profile
returns noConfiguredCredential; core-owned profile/cleanup references empty,
rootRemovedtrue/listenerStoppedtrue. Both normal exits and nativeprivacy39filespass.
No assistant credential read/export or ordinary profile/key change. Controlled
public fixture, not a new owner Studio send or discovery.

Independent read-only terminal-artifact/native re-review **passes, no blocker**.
This closes the sole remaining scoped Windows Settings technical gap. CI1 exact
combined controlled/worker/TLS/SDK proof and owner frozen929 live/all-five/reference/
prompt/selectable/source/history/reopen/nativeSDK05 proof remain valid and reused;
no unchanged matrix rerun needed. CI2–8, forced exits, retained roots and preparation
failures remain historical failures, not converted into passes. The complete native
sequence passing supports the revised driver; CI8's exact UIA provider/tree cause
remains unknown and need not be invented. No product defect was established.

Current outcome **review_ready**: scoped technical closeout complete, **final human
acceptance unclaimed**. No operation pending or further CI needed. Counts: pairedCI9
per target; Windowspackage1/3/starts9, ownerMacpackage1/3/starts5/6, hostedMacstarts0;
live8/10/Rewrite3/4/extra1of2used/discovery0. Unused workingbatchCI10/Windowsup to12
is unused, not a reason to run. No merge/release, generic providers/Phase3, route
context or AI ending/connection implementation. Saved ordinary profile/key persists.
Requested next UI-refinement prompt follows below; not selected/executed by this audit.
Later guided feedback is separate and must not be represented as human acceptance.

#### Studio UI refinement selection and finite allowance — 2026-10-13

The user selected the prepared refinement outcome on `codex/provider-qualification`,
with one GPT-6.1 Sol/high research subagent and imagegen mockups **for approval**.
Entry is clean `357eb87`; native macOS ARM64 remains the implementation owner.
Frozen929/CI9 technical qualification above remains unchanged evidence, not proof
of changed renderer inputs. State: `in_progress`, preparation only. Mockup approval
is the user's explicit design boundary before product implementation.

Finite cumulative allowance, selected before execution: three focused local
type/build/affected-DOM verification rounds; two full affected-journey browser
capture/check rounds plus one correction round; two imagegen concept calls plus
one targeted revision; one research agent reused for independent design/code review
and one correction re-review. If changed inputs require platform proof, at most two
paired focused Windows/macOS CI batches, two signed owner Mac builds and four owner
native starts. No package/CI/native execution for planning or docs alone. A failed
attempt counts; reassess after two unsuccessful corrections of one hypothesis.
Checks use disposable public fixtures, never the ordinary saved profile/key or
paid/live sends. No model discovery/installations, provider/Phase3/route/ending/
streaming expansion, signing/storage changes, merge or release. Publication is not
selected by this prompt; work remains local unless later authorized.

Before approval: capture existing Settings, Assist/complete-send/proposal and
card/lore screens in both themes and compact/wide layouts; record measurable
overflow/density, research recommendations and exact mockup prompts. After approval:
implement the bounded hierarchy/layout/language/focus corrections, check relevant
dirty/failure/stale/cancel/reopen behavior and obtain independent review. Reuse
unchanged core/service evidence; changed renderer/native inputs need appropriate
new proof. Prepare a plain-language guided-feedback prompt only after delivery;
do not start that session or claim final human acceptance.

Usage at entry: local rounds0/3, browser0/3, images0/3, CI0/2 paired,
signed builds0/2, native starts0/4. Next: baseline capture and approval-ready concepts.

Preparation checkpoint: one requested Sol6.1/high agent completed primary-source
research and independent visual review; both boards are approval-ready with explicit
written corrections. [Concepts, exact prompts and review constraints](../../design/phase-2-llm/studio-refinement-2026-10-13/README.md)
retain two generated images/manifests. Source inspection found absent Studio draft
guards, incomplete tab/focus behavior, incidental Task width and JSON-heavy review.
No product repair is implemented yet. Partial public-fixture screenshots demonstrate
Settings actions below the1440×900 initial viewport and Assist limits crowding out
references/actions at600×720; these do not establish measured horizontal overflow.

Browser attempts3/3 spent: localhostEPERM(environment); nonexistent fixture preview
method(harness); then hidden compact reference-list click timeout(harness). Last
attempt produced24 screenshots across Settings/Assist/send/proposal light/dark,
wide/compact/large-interface. Full metrics and card/lore captures are missing; no
passing check claimed. Corrected viewport/list handling is unexecuted. Frozen929
and ordinary profile/key untouched. `git diff --check` passes for current docs/assets.
Counts now local0/3,browser3/3,images2/3,CI0/2,signed builds0/2,native starts0/4.
State remains `in_progress`, paused for **user-requested mockup approval** and spent
browser allowance. Requested two additional browser attempts(total5), not yet granted,
covering corrected complete baseline and final affected-journey before/after proof.
No budget reset, package matrix, publication or feedback session started. Next:
receive design decision/allowance; implement only after approval and retain the same
agent for independent code/whole-journey review. Guided-feedback preparation follows
delivery; final human acceptance remains unclaimed.

2026-10-13 user: **“Approved keep going”**. This approves the two mockup boards with
written corrections and the requested two additional browser attempts(total5).
Implementation continues on the existing macOS ARM64 owner; remaining allowance
local3,browser2,images1,pairedCI2,signed builds2,native starts4. No publication,
live sends, provider expansion or final human acceptance implied.

Implementation checkpoint: grouped Studio Connection/Saved key/Response defaults with
advanced/maintenance disclosure and reachable Save; guarded dirty/busy navigation,
reload/profile switch/cleanup; completion/submission field feedback. Assist has a
stable target/stage/header, scrolling body and reachable stage-specific footer;
Task is full-width, limits collapse, complete exact request remains inspectable,
prose review leads exact changes. Proposed card/lore comparisons precede frozen
fields, show exact revision/status and stale-support refusal. Tabs use keyboard
focus and panel associations. Async completion preserves unrelated authoring focus.
Core request/storage/source/transaction code is unchanged. Existing native probe
selectors were adjusted for exact-change disclosure and the clearer rewrite label;
frozen929 artifacts and records remain untouched.

Counts: local3/3 spent(product typecheck passed each); round1DOM24/25 with one
stage-label harness assertion fixed; rounds2/3 new fixture TypeScript errors, corrected
but not locally rerun. Baseline browser4 passed36captures; browser5 passed36captures,
runtimeerrors0/no viewport overflow/Assist primary visible in every recorded layout.
Some rapid-resize light screenshots show compositor framing artifacts and closed
details inflated raw control metrics. Retain them as limitations; updated CI harness
waits two animation frames and filters closed details. Later key-group/prose-order
changes require current-candidate CI images. No native/app builds or launches used.

Reserved pairedCI0/2 now selected for focused32DOM cases/build/36renderer captures
and actual same-project controller→native service all-five/selectable/history/reopen
proof on Windowsx64/macOSARM64. CI-contained checks consume the paired-batch allowance;
local browser allowance remains5/5 and is not reset. No SDK/game behavior or native
credential/signing/store code changed, so unchanged frozen SDK/package evidence is
reused; no new editor/package matrix selected. Debug native driver is not an editor
launch or native UI proof. Exact current CI candidate and images establish portable
renderer evidence; final human acceptance remains unclaimed.

Original user authorization explicitly includes necessary focused CI; publishing its
candidate to the existing branch is necessary for that operation. This supersedes
the entry's conservative local-only interpretation, not a new publish/merge/release
permission. No existing open PR or active branch CI was found on entry to dispatch.
Workflow lint initially caught a runner-context placement error, fixed before dispatch;
syntax/diff checks pass. Next: publish reviewed candidate, dispatch paired attempt1
and retain exact results; no duplicate or unchanged matrix.

#### UI refinement paired CI1 confirmed — 2026-10-13

Approved refinement published as462cf0897eb84d34390d68634f0b8cb2345d7a48.
`quality.yml` assistance_ui=true/ordinal1, all old selectorsfalse, dispatch accepted.
[Run38324391511](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38324391511),
attempt1/workflow_dispatch/exact462cf08 created2026-10-12T23:52:26Z, observed
in_progress2026-10-12T23:52:48Z. Windows115059587083 and Mac115059587332
in_progress; unrelated jobs intentionally skipped, not counted as required passes.
Required focused DOM count is32 (the final unfinished-poll focus regression added).
It uses the existing quality dispatcher and a new reusable focused workflow; no
default-branch registration or unrelated job/package/SDK selection is required.

State `awaiting_ci`. Counts: pairedCI1/2(local3/3,browser5/5,images2/3,
signed builds0/2,editor starts0/4). No new qualifying pass or native/package proof
claimed; source462cf08 is distinct from frozen929 and from this docs-only wait record.
Exact-source controller/browser/artifact/privacy/cleanup terminal audit remains, then
in-scope fixes within paired allowance1 and guided-feedback prompt preparation.
No more local test/browser rounds, duplicate CI, automatic polling/wake or feedback
session. Actual manual same-thread pause follows WORKFLOW; resume on user command.
Human acceptance remains unclaimed; ordinary profile/key and frozen evidence intact.

#### Requested next UI-refinement prompt — prepared, not executed

```text
Refine the existing Studio-only Phase 2 assistance UI in Caldwell-41/Renpy-editor,
continuing codex/provider-qualification. Read AGENTS.md, CURRENT/HANDOVER, the
active Phase 2 task's section 18 and its latest technical closeout, and docs/UI.md's
accepted UI/UX guidelines. Section 18 is a design proposal; written current contracts
and later scope decisions take precedence.

Codex machine: prefer the current macOS ARM64 owner for signed-package capability.
Use focused local UI checks and affected Windows/macOS CI/native checks where needed;
select and record a finite verification allowance before execution. Preserve the
qualified frozen929 behavior and technical evidence; changed inputs need their own
appropriate proof. No package matrix for planning/docs alone.

Refine the implemented Settings, Assist, proposal review, Character-card and Lorebook
journeys for clear hierarchy, plain language, responsive layout, keyboard/focus,
visible selection and explicit prepare/send/review/apply actions. Preserve accepted
paper/teal and charcoal/copper themes, source/transaction/history safeguards, reference
approval, truthful readiness/cancellation, saved-key reuse and exact-send inspection.
Resolve observed overflow and density using the accepted guidelines, with concrete
before/after evidence. Review the whole affected journey, including failure/stale/
dirty/reopen paths; obtain independent review and fix supported issues.

No generic providers, Phase3, selected-route context, AI ending/connection changes,
thinking/streaming expansion, model discovery/installations, signing/storage-policy
changes, paid/live sends, merge or release. Preserve the configured ordinary key;
never request it again while configured or read/export it. Final human acceptance
is still unclaimed. Deliver the bounded refinement with honest verification, then
prepare a separate plain-language guided feedback session; do not start that session.
```
