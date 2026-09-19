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
