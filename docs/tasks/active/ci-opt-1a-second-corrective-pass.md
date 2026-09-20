# OPT-1A second corrective pass

**Approved:** 2026-09-19.
**Branch / PR:** `maintenance/ci-optimisation`, PR #12.
**Scope:** bounded architectural correction of Gate P + OPT-1A, followed by a fresh
integrated acceptance review and W1 entry decision. **Do not implement W1.**

This brief is the canonical specification for the corrective chat. The chat prompt
should only select this task. Read `AGENTS.md`, CURRENT, HANDOVER, the original
Gate P/OPT-1A brief, CI_ORCHESTRATION, LOCAL_CODEX_CONFIG, the CI optimisation roadmap,
and W0 qualification before editing.

## Architectural correction

Private client/CI/runtime state must no longer normally live inside the Git worktree.
Move it from `.codex-local` to an OS-appropriate per-user Loomlight application-data
root (Windows Local AppData; macOS Application Support, via a testable platform/path
abstraction). Do not hardcode a user's path.

Retain SQLite as the durable transactional journal. It is appropriate for
intent-before-dispatch, atomic transitions, crash/restart recovery and cooperating
processes, and should be extensible for later W1 state without implementing W1 now.
New runtime state must not depend on repository-local storage.

Remove, rather than duplicate, complexity whose sole purpose was protecting live
`.codex-local` data from Git: repository-relative DB storage, runtime ignore-policy
proofs and obsolete bootstrap/tests/docs. Keep ordinary repository publication hygiene
for accidentally copied credentials, private configuration, machine identity/paths and
runtime artifacts. Gitignore may remain convenience, not the runtime-state security
boundary.

Secure the external state itself. Before identifying writes, fail closed on unsuitable
directory/file types, symlink/reparse substitution, unsafe hardlinks/link counts,
incorrect POSIX owner permissions or Windows ACLs. Cover SQLite DB and applicable
companions. Tests use redirected synthetic roots and must not print real local identity.

Existing `.codex-local` state is non-authoritative. Do not inspect deeply, publish,
overwrite or delete it automatically. Prefer explicit local reinitialisation over a
complex migration unless a simple safe migration is justified. Ambiguous old/new state
must fail closed.

## Mandatory correctness fixes

### Candidate identity / duplicate dispatch

Reproduce the current bug where candidate A reaches `dispatch_unknown`, local
HEAD/workflow changes without changing A, and another submission can create a second
operation/POST. Operation identity must derive from the actual requested
candidate/workflow/options, not unrelated mutable HEAD.

Implement the original bounded find-or-start behavior: validate identity, inspect the
durable operation, perform bounded remote reconciliation where sufficient evidence is
available, attach to one proven equivalent run, otherwise dispatch once. Ambiguous
evidence blocks. Do not claim distributed exactly-once behavior.

Tests cover duplicate local calls, restart, lost response, changed local HEAD, changed
candidate workflow, fresh local state with a provable existing remote run, ambiguous
matches, contradictory identity and no unsafe retransmission.

### Supported unresolved-dispatch recovery

Add a documented bounded reconciliation command/API for `dispatch_unknown`. It uses
stored operation identity, performs read-only reconciliation, never POSTs, atomically
attaches only to one proven run, and stays unknown/blocked for zero, multiple,
incomplete or contradictory evidence. Pagination/search exhaustion is inconclusive
unless completeness is established. Ordinary recovery must not require manual SQLite
editing or internal Python calls.

### Collector evidence

Reproduce and reject false acceptance when required jobs have missing/empty steps,
required steps have null/unknown/in-progress conclusions, mandatory
security/test/package/smoke evidence is absent, or mandatory steps are unexpectedly
skipped. Define affirmative required evidence for the validated workflow and requested
scope. Absence of failure is not success. Conditional skips are allowed only when the
actual workflow condition/scope makes them expected. Test duplicate/malformed
job/step evidence as well.

### Diagnostic publication boundary

Arbitrary provider log text is private diagnostic evidence, not repository-safe output.
Keep bounded raw/redacted evidence only in protected local state. Public results use an
allowlisted structured summary: run/attempt/candidate, provider and required-gate
statuses, generic reason codes/evidence availability and next action. Test synthetic
credentials, user paths, endpoints, host/client/runtime-like values, signed URLs,
control sequences and oversized/malformed logs. Public safety must not depend on regex
redaction recognizing every future secret format.

## Fresh integrated review

After corrections pass, re-read the complete original Gate P + OPT-1A requirements and
review the integrated implementation, not only changed lines. Build an acceptance
checklist and classify every material criterion as directly tested pass, native/live
validated, explicitly unavailable/not demonstrated, or blocker.

Explicitly review: public/private state boundary; external state security; candidate,
ref, workflow and options identity; intent-before-POST/crash boundaries; state-machine
and concurrent/restart behavior; remote reconciliation and pagination completeness;
exact run/attempt binding; fail-closed missing/unknown evidence; workflow candidate
pinning/native allocation; package/test/security/smoke gates; malformed API responses;
subprocess/network bounds; read versus dispatch credentials; Windows/macOS behavior;
documentation accuracy; and absence of accidental W1 implementation.

Any new significant in-scope defect found by this review must be fixed with a regression
test before completion. The purpose is to avoid a third narrow corrective cycle.

## Validation and CI cost

Run cheap/local validation first, then all relevant repository, privacy/local-state,
CI-operation, recovery/fault, formatting/static and existing regression suites. Obtain
Windows/macOS evidence where platform behavior matters. Review the final complete diff
and publication safety, push coherently, and inspect the exact PR/head checks.

Do not rerun a full production package matrix solely because the helper/docs SHA
changed. Determine whether corrections affect production workflow execution, candidate
pinning/gate allocation, application tests, packaging or packaged application/runtime.
If yes, run exact required production validation. If not, retain the existing immutable
production evidence with precise scope. Never broaden reuse beyond justified evidence.
Preserve historical failures.

## Documentation and completion

Reconcile the original Gate P/OPT-1A ledger, CI_ORCHESTRATION, LOCAL_CODEX_CONFIG,
roadmap, AGENTS if needed, CURRENT, the single HANDOVER, and PR #12. Remove stale
instructions treating repository-local `.codex-local` as normal storage.

Do not declare completion merely because new regressions or CI are green. Completion
requires the external-state architecture, removal of obsolete repository-local
complexity, all mandatory fixes, a clean integrated acceptance review, appropriate
native/live evidence, accurate docs, coherent pushed state and verified GitHub checks.

Then perform the W1 entry review. W1 still independently requires a genuine W0 go:
supported owning-runtime reconciliation/observation, ownership-safe user-control
preservation, required loaded/unloaded continuation and restored tools, and authoritative
inactivity/zero wait-driven inference evidence. Do not repeat live W0 probes without
separate authority and do not implement W1 here.

If W0 remains unqualified, record Gate P/OPT-1A complete (if true) and W1 blocked.
If W0 genuinely passes, HANDOVER may select W1. Finish with a concise assessment,
remaining blockers, exact branch/head/PR and evidence, confirmation of updated handover,
and one short next-chat /goal selector appropriate to the actual state.

## Execution ledger

### Defect reproduction and architectural correction — 2026-09-19

The remote branch was fast-forwarded from `f3ec56f` to selected-plan head `a86dd8e`
before edits. Focused corrective regressions were added first and failed on the reviewed
implementation: external-state APIs were absent; a `dispatch_unknown` candidate could
produce a second POST after a local-HEAD-only workflow change; empty/null step evidence
was accepted; incomplete reconciliation posted; and an unrecognised synthetic secret
was returned in `failure_diagnostics`. The initial focused run reported five failing
assertions plus four errors across eight test methods/subtests. No real identity or
credential was used.

`scripts/local_state.py` now resolves protected per-user application data with testable
Windows/macOS/XDG routing. Profiles and the schema-2 SQLite operation journal live there,
outside the worktree. Directory/file type, containment, symlink/reparse, hardlink count,
POSIX `0700`/`0600`, Windows owner and allow-ACE checks cover profiles, DB and applicable
companions before sensitive use. Synthetic roots are redirectable; actual paths and
identity never enter test output. Legacy `.codex-local` is checked only for presence,
blocks by default, and requires an explicit external-reinitialisation acknowledgement
that does not inspect, migrate, overwrite or delete it. Git ignore remains convenience;
the publication validator retains exact staged-blob/working-copy scanning and rejects
copied runtime DB/legacy names without reading them.

CI operation identity now hashes the requested repository/workflow/ref/candidate,
candidate workflow blob and options. The production workflow independently recomputes
that key after immutable checkout. A separate random UUID remains the GitHub request
correlation. New operations reserve intent and advisory deadlines atomically; local
checks, run/attempt, job references, structured result and private diagnostics are
checkpointed. Active same-candidate option collisions, including `force_full`, refuse.

Every prepared request performs bounded complete remote reconciliation before its sole
POST. The current API request opts into the HTTP-200 run receipt; 204, lost response,
eventual direct-metadata delay and restart paths remain fail-closed. `ci.py reconcile`
uses the stored identity, never POSTs, attaches only one exact run, and leaves zero /
incomplete evidence unresolved or multiple/contradictory evidence blocked.

Collection now requires complete attempt pagination, unique required jobs and affirmative
completion of every named candidate/test/security/package/smoke/inventory/evidence step.
Only cache-miss download and non-requested package upload may skip according to actual
scope. Missing/empty/duplicate/malformed/null/unknown/in-progress/unexpected-skip evidence
cannot pass. Provider-controlled text is absent from public JSON; bounded raw job logs
are stored only in the protected journal, with public generic availability/reason codes.

### Fresh integrated acceptance review — local result

| Material criterion | Classification before publication | Evidence |
| --- | --- | --- |
| Public/private boundary and external state location | Directly tested pass | Redirected external roots, in-worktree refusal, legacy acknowledgement and copied-runtime publication regressions. |
| Directory/profile/SQLite/companion security | Native Windows pass plus direct tests | Owner-verified ACL creation/classification, hardlink refusal, exact POSIX mode assertions for native POSIX quality; local Windows symlink creation remains unavailable and explicit. |
| Candidate/ref/workflow/options identity | Directly tested pass | Candidate-blob key, local-HEAD-change regression, changed-candidate-workflow, malicious/moved ref and contradictory SHA/options tests; workflow recomputation step. |
| Intent-before-POST, state machine, concurrency and restart | Directly tested pass | Atomic reserve/transition, cooperating-store duplicate, crash/lost-response/restart/direct-delay and no-retransmission tests. No distributed exactly-once claim. |
| Remote find-or-start and pagination completeness | Directly tested pass | Fresh-state exact attach, zero complete, incomplete, ambiguous, duplicate/malformed and contradictory listings. |
| Supported unresolved-dispatch recovery | Directly tested pass | Public CLI/API, direct-ID and operation-key recovery; zero/incomplete/multiple/contradictory outcomes; POST-count assertions. |
| Exact run/attempt and affirmative job/step evidence | Directly tested pass | Attempt-specific pagination, newer-attempt refusal, PR/non-dispatch refusal, required job/step contract, package scope and every provider conclusion. |
| Diagnostic publication boundary | Directly tested pass | Future-format secret, endpoint/control text, 64 KiB bound/truncation, malformed logs, signed redirect and private-only DB capture tests. |
| Workflow pinning/native allocation/package/test/security/smoke gates | Native/live validated | Candidate `b6e064dcbc4be0692a4ad1c7ba08ada29b38b76d`, production run `35431721525`, attempt 1; candidate, Windows and macOS jobs all passed and the exact collector accepted every mandatory step. |
| Malformed API/subprocess/network bounds | Directly tested pass | Shape/count/identity failures, bounded pages/body/logs, subprocess timeout and value-free error tests. |
| Read versus dispatch authority | Directly reviewed | Public collect is tokenless; POST uses approved Actions-write credentials; private log capture only with selected protected operation. |
| Windows/macOS behavior | Native/live validated | Windows local ACL/profile/SQLite suite passed; quality runs `35431546974` and `35431548846` passed on Windows x64 and macOS ARM64. macOS exercised POSIX/symlink behavior; its APFS raw-byte-name capability is explicitly skipped because the filesystem rejects fixture creation. |
| Documentation accuracy and accidental W1 scope | Direct review pass | Canonical docs describe external state/recovery/private logs. Searches show no queue/goal/wake implementation; automatic mode remains false. |

The integrated review also corrected four significant in-scope omissions found beyond
the mandatory list: Python capability was absent from `doctor`; direct-receipt metadata
delay was conflated with contradiction; `force_full` could collide with unresolved
state; and journal checkpoints omitted deadlines/local-check/job references. Regressions
cover each correction. No W1, OPT-2, application feature, merge or cleanup code was added.

### Validation and CI-cost decision

Final local evidence: Python compilation passed; 35 privacy/local-state tests passed
on Windows with three explicit skips (two sandbox-denied symlink creations and the
POSIX-only unusual-byte case); 41 CI operation/recovery tests passed; exact-staged
repository validation passed 216 public files; 26 lossless/source tests and
the 620,000-byte/40,000-node benchmark passed. The legacy SDK spike retained its known
unsupported-Windows outcome (24 tests: 4 failures, 5 errors, 2 skips) and is not target
evidence. Preflight truthfully reported repository/privacy/tooling pass and unavailable
local frontend/Rust tools, delegating those native gates to the production matrix.

Unlike the prior collector-only follow-up, this pass changes the production workflow's
dispatch inputs, operation-key validation and candidate gate. It therefore affects
candidate pinning/native allocation and requires one fresh full production matrix on the
corrective candidate. Historical run `35414571185` remains valid only for the packaged
application/workflow tree at `83e86aa`; it is not broadened to the corrected workflow.
The implementation candidate required its own matrix; documentation-only receipts do
not justify another.

### Publication and W1 entry — accepted result

Implementation candidate `b6e064dcbc4be0692a4ad1c7ba08ada29b38b76d` is published on
`maintenance/ci-optimisation` / PR #12. Automatic Repository quality push run
`35431546974` and PR run `35431548846`, attempt 1, both passed. Candidate-bound
production run `35431721525`, attempt 1, passed with exact jobs: Validate candidate
`105867412640`, macOS ARM64 `105867451179`, and Windows x64 `105867451191`.

The production submit first recorded `dispatch_unknown` because GitHub's direct run
title metadata was not yet stable. Supported read-only reconciliation then attached the
same run without another POST. The exact-attempt collector reported `accepted: true`,
complete pagination, affirmative required steps, no missing jobs and no reason codes.
A second identical submit attached the completed local operation and did not dispatch.
Private operation/request selectors and provider logs remain only in protected local
state and are not part of this ledger.

Retained evidence includes the initial quality failures `35429884079` / `35429886171`
that exposed macOS temporary-root aliasing, `35430469385` / `35430470755` that exposed
the raw-byte-path syscall assumption, and `35431136205` / `35431138970` that established
APFS rejects fixture creation itself. Each bounded finding was corrected before the
final green candidate; no failed/cancelled run is treated as acceptance.

Gate P + OPT-1A are complete and review-ready. W0 remains unchanged and no live W0
probe was repeated. W1 entry is blocked: supported owning-runtime telemetry,
ownership-safe user-control preservation, loaded/unloaded continuation with restored
tools, and authoritative zero-wait-inference proof are still absent. No W1 code is
authorised or included.

### Final bounded OPT-1A hardening — 2026-09-19

A final review supplied four additional bounded findings. Each was reproduced against
published head `3882834b41d98443f709ef6bb853ba6c8714be05` before implementation. The
focused six-method run produced five assertion failures and two errors: submit trusted
an unvalidated saved run ID; a blocked operation could be bypassed by changing options;
no supported inventory could identify a first-failure operation after restart; an
unsafe existing SQLite companion reached `sqlite3.connect`; and mocked POSIX entries
with the wrong owner still passed both file and directory classification.

Implementation candidate `a9631343bb9ab4099ed36750a29eb757a7960ed2` makes attachment
success require an attached/running/completed state with positive validated run and
attempt identities. `submit` now reconciles recoverable saved receipts read-only or
fails closed. `blocked` is explicitly unresolved and remains a same-candidate collision
barrier across option changes; only a completed, affirmatively accepted exact result is
safely terminal, and `force_full` still cannot grant retry. Receipt-state validation is
part of atomic transitions so incomplete attachment updates roll back.

`python scripts/ci.py operations` now returns a minimal local-only inventory of prepared,
dispatching, dispatch-unknown and blocked records. This lets an operator select the
opaque operation ID for the existing read-only `reconcile` command after an ordinary
first failure or restart. The output is private local recovery state and must not be
copied into shared handovers, PRs, issues or logs.

Secure journal startup now validates the database and every existing WAL/SHM/journal
companion before `sqlite3.connect`, then retains the existing post-open/write checks.
POSIX classification additionally requires `st_uid` to equal the current effective
user for both directories and files. The documented same-account threat boundary is
unchanged; this is not a distributed dispatch guarantee.

Final focused regressions passed, including negative, restart, blocked retry,
reconciliation, invalid-transition rollback, pre-open companion and owner-match paths.
Python compilation passed. The complete local suites passed: 37 privacy/local-state
tests with three explicit Windows host-capability skips, and 47 CI operation/recovery
tests. Exact staged repository validation passed 216 public files; 26 lossless/source
tests passed; the 620,000-byte / 40,000-node benchmark passed at 159.46 ms median across
seven samples; and `git diff --check` passed.

Automatic Repository quality push run `35435261321` and PR run `35435263405`, attempt
1, passed at the exact implementation candidate. Each included successful Validate
repository, Tools / Windows x64 and Tools / macOS ARM64 jobs. This hardening changes
only the helper state machine, local recovery CLI, protected local-storage validation
and their tests/docs. It does not change the production workflow, candidate pinning,
native allocation, application/runtime, package inputs or packaged output. Therefore
no new full production matrix was justified; accepted production run `35431721525`
remains the exact production-workflow/application evidence and is not broadened to
claim that it tested these helper changes.

The focused review of the four fixes and adjacent transitions found and corrected the
incomplete-transition commit issue; no further significant in-scope blocker was found.
All four findings are resolved. OPT-1A is ready for final independent review, not merge.
W0 and W1 remain unchanged and outside this bounded pass.

### Windows validation repair follow-up — authorised 2026-09-20

The user-authorised OPT-1A follow-up is limited to correcting Windows validation and
the adjacent workflow failure-propagation defect. It supersedes the earlier claim that
the affected Windows quality job passed its privacy suite. Reported evidence to verify
is Repository quality run `35435261321`, attempt 1, Windows job `105876723427`, and run
`35436013835`, attempt 1, Windows job `105878666437`: both reportedly discovered 37
privacy tests with 1 failure, 15 errors and 1 skip, followed by 47 passing CI-tooling
tests, while the combined workflow step/job was incorrectly reported successful. The
repeated privacy error was the value-free refusal `Private directory permissions could
not be verified; setup refused.` These runs must be retained as failed Windows test
evidence behind successful provider statuses, not as acceptance.

This bounded repair will:

1. Separate the native privacy and CI-tooling commands in `quality.yml` so either is an
   independent required step, with a cheap synthetic negative proof under the actual
   Windows shell that a failing required command cannot be hidden by a later success.
2. Establish and fix the actual native-Windows protected-directory creation or
   verification cause using redirected synthetic fixtures only. The correction must
   retain fail-closed owner/ACL, link/type, external-root and SQLite-companion checks;
   it must not skip tests, trust CI specially, weaken permissions or redesign storage.
3. Correct this ledger, CURRENT, HANDOVER and PR #12 description so badges are never
   substituted for inspected suite summaries and relevant failure logs.

Acceptance requires relevant cheap regressions first; regression coverage for the
diagnosed ACL cause and PowerShell failure propagation; native tools-only quality
evidence on Windows x64 and macOS ARM64 at one exact corrected candidate; and direct
inspection of the actual suite summaries and relevant logs. Record discovered, passed,
failed, errored and skipped counts separately. The protected-state positive tests and
the companion-before-open regression must demonstrably reach their intended assertions.
Only the repair and adjacent propagation receive self-review. The four preceding
hardening fixes remain preserved. No real profile or journal manipulation, production
matrix rerun, W0 recovery, W1, OPT-2, application feature, merge or branch deletion is
authorised. If CI remains pending, publish an `awaiting_ci` handover with exact
run/attempt/SHA and resume only by collecting those same runs.

#### Superseded evidence and local repair result

Read-only GitHub metadata and raw-log inspection verified the reported defect. At
`a9631343bb9ab4099ed36750a29eb757a7960ed2`, push run `35435261321` / Windows job
`105876723427` and PR run `35435263405` / Windows job `105876728690`, attempt 1,
each discovered 37 privacy tests: 20 passed, 1 failed, 15 errored and 1 skipped. At
documentation head `aad8d0a35fdcef8f59604922f5957b30af8c5bc1`, push run
`35436013835` / Windows job `105878666437` and PR run `35436015412` / Windows job
`105878671087`, attempt 1, repeated the same result. Each combined shell step then ran
and passed all 47 CI-tooling tests, so the last native command supplied exit zero and
GitHub recorded the Windows step/job and overall run as successful.

The earlier corrective candidate was affected too: at
`b6e064dcbc4be0692a4ad1c7ba08ada29b38b76d`, push run `35431546974` / Windows job
`105866946893` and PR run `35431548846` / Windows job `105866952061`, attempt 1,
each discovered 35 privacy tests: 19 passed, 1 failed, 14 errored and 1 skipped. Their
following 41 CI-tooling tests passed and likewise hid the privacy result. These six
Windows jobs are failed test evidence behind provider-success conclusions. They do not
prove native Windows acceptance. The macOS and repository-job results retain only their
own platform/job scope.

The Windows creator installed the intended restrictive DACL but never changed the
owner. The verifier correctly requires the owner SID to equal the current account, so
any Windows token whose newly created temporary directory is owned by another allowed
principal fails closed. The candidate now applies only the ACL owner section after the
restrictive DACL, setting it to the already validated current SID without rewriting the
DACL or SACL. Directory/file type, reparse, link-count, allowed-ACE, external-root and
pre-open SQLite-companion checks remain unchanged. A native regression records only a
generic default-owner category, then requires owner normalisation and the complete
private-storage verifier to pass. The corrected GitHub Windows run must establish which
generic default-owner condition the hosted runner actually exercised before this cause
is accepted as native proof.

The workflow now runs privacy and CI-tooling as separate required steps. A native
PowerShell regression demonstrated the old sequence (exit 23 followed by exit 0) returns
zero, while the same failing command in its own invocation returns 23 and a later
independent success returns zero. The workflow-structure assertion binds those suites
to separate `run` entries.

Local synthetic Windows validation passed: 40 privacy tests discovered, 37 passed,
0 failed, 0 errored and 3 skipped for explicit host capabilities; all 47 CI-tooling
tests passed. The positive external profile, SQLite journal/companion and hardlink tests
passed. `test_unsafe_existing_sqlite_companion_is_rejected_before_connect` passed with
its `sqlite3.connect` mock still uncalled, proving the pre-open assertion was reached.
Python compilation and exact repository validation passed for 217 public files; 26
lossless/source tests and the 620,000-byte / 40,000-node benchmark passed at 161.92 ms
median across seven samples; `git diff --check` passed. Native Windows x64 and macOS
ARM64 quality evidence for the published corrected candidate remains pending.
