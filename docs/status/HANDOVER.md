# Current checkpoint handover

**Prepared:** 2026-09-19.
**Repository:** `Caldwell-41/Renpy-editor`.
**Branch / PR:** `maintenance/ci-optimisation`, [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12).
**Delivery:** Privacy corrections (Gate P) and OPT-1A (Gate A).
**State:** Implementation complete, self-reviewed, published and review-ready; user
acceptance and integration have not occurred.
**W1 prerequisite:** W0 automatic support remains unqualified/no-go and is not waived.

## What was delivered

Read [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md), [WORKFLOW](../WORKFLOW.md),
the [combined implementation brief](../tasks/active/ci-opt-1a-privacy-and-operation-foundation.md),
and [CI orchestration](../CI_ORCHESTRATION.md). The brief is the detailed implementation
and evidence ledger; this file records the exact continuation boundary.

Gate P now validates bounded raw staged blobs and both staged/working privacy policy,
checks every exact private destination, refuses exposed private namespaces, requires an
explicit client context, and verifies Windows ACLs or POSIX owner-only modes before
identity collection. Existing profiles are never overwritten and automatic mode stays
off. The suite has 25 passing tests locally; two symlink-creation cases were skipped in
the restricted Windows sandbox, while successful macOS quality runs exercised the
symlink-capable path.

Gate A adds `doctor`, `preflight`, candidate-bound one-POST `submit`, and exact
attempt-specific `collect`. Its private SQLite journal records intent before dispatch,
deduplicates candidate operations and preserves uncertain outcomes without resending.
Workflow identity, immutable SHA, required jobs, provider outcomes and bounded redacted
failure evidence are checked explicitly. The offline CI-tooling suite has 17 passing
tests. No Codex wake-up, queue manipulation, goal restoration or W1 code was added.

## Exact candidates and successful evidence

- Corrected workflow/application candidate
  `83e86aaacaa86993d5851283d4bb48509718b72b` passed automatic quality push run
  `35414545592` and PR run `35414547340`, attempt 1. Both passed repository validation
  plus Windows x64 and macOS ARM64 tools jobs.
- Production run `35414571185`, attempt 1, was received directly and a duplicate submit
  attached without another POST. Candidate job `105820540518`, macOS ARM64 job
  `105820559305`, and Windows x64 job `105820559328` all succeeded at exact candidate
  `83e86aa`. Mandatory package builds ran; opt-in artifact uploads were skipped.
- Re-collection of that immutable run after the bounded conditional-skip classifier fix
  returned `accepted=true`, provider success, complete required gates, no missing jobs
  and no failure diagnostics.
- Collector follow-up `609aaf4ac6a4db33c193204f610fc241cbcf08b8` passed quality push run
  `35415495692` and PR run `35415497671`, attempt 1. Each passed repository validation
  and Windows/macOS tools jobs. This follow-up did not change the workflow or application
  tree packaged at `83e86aa`, so no third equivalent production matrix was dispatched.
- Exact staged-byte repository validation passed 212 files. Local `py_compile`, 25
  privacy tests, 17 CI-tooling tests, 26 lossless/source tests, the lossless benchmark,
  and `git diff --check` passed. Local preflight truthfully left frontend/Rust checks
  unavailable; the exact native workflows supplied those gates.

## Retained failures and limits

- Candidate `64836c879cc965713c7753bc83f130ff6a7ca79c` failed quality push run
  `35412536443`, PR run `35412537941`, and production run `35413052524`, attempt 1.
  Ubuntu/macOS exposed creation of an empty private root before linked-template refusal;
  native package jobs were not allocated. The ordering regression is fixed and retained.
- Controlled wrong-SHA production run `35413322655`, attempt 1, failed immutable
  candidate validation as designed and allocated no native jobs. It is negative evidence.
- The legacy Phase 0 SDK spike on this Windows host reported 13 passes, 4 failures,
  5 errors and 2 skips because its fixtures assume POSIX launchers, paths and executable
  bits. Preserve this result; it is not a supported-target pass.
- No operation remains awaiting collection or reconciliation. Private local operation
  identifiers, credentials, profile values and paths are intentionally absent here.

## W1 entry decision and next action

Gate P and OPT-1A are complete and reviewed. W0 is still no-go because the intended
owning-runtime path lacks qualified external reconciliation/telemetry, ownership-safe
goal restoration, and demonstrated loaded/unloaded/inactivity behavior with zero
autonomous model inference. Passing CI and privacy setup does not satisfy that separate
prerequisite.

The next chat may perform only the documented W1 entry review. If W0 is still
unqualified, record the blockers and stop. Do not implement W1, repeat live W0 probes,
start W2/W3/OPT-2, merge PR #12, or clean branches without separate authority.

Suggested next-chat prompt:

```text
/goal — W1 entry review only
Repository: https://github.com/Caldwell-41/Renpy-editor
Continue maintenance/ci-optimisation and PR #12. Read AGENTS.md and
docs/status/HANDOVER.md. Check the documented W1 entry evidence. If W0 remains
unqualified, record the blockers and stop; do not implement W1 or repeat live probes.
```
