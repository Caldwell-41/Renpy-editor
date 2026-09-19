# Current checkpoint handover

**Prepared:** 2026-09-19.
**Repository:** `Caldwell-41/Renpy-editor`.
**Branch / PR:** `maintenance/ci-optimisation`, [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12).
**Delivery:** [OPT-1A second corrective pass](../tasks/active/ci-opt-1a-second-corrective-pass.md).
**State:** Gate P + OPT-1A final bounded hardening complete; ready for final independent
review; not merged.
**Implementation candidate:** `a9631343bb9ab4099ed36750a29eb757a7960ed2`.
**W1 prerequisite:** W0 automatic support remains unqualified/no-go and is not waived.

## Delivered correction

Private client and CI state now defaults to protected per-user Loomlight application
data outside the Git worktree. Profiles and SQLite/companion files fail closed on
unsafe type, containment, link count, symlink/reparse, POSIX mode or Windows ACL/owner
evidence. The pre-existing `.codex-local` entry was acknowledged only by presence; it
was not opened, migrated, modified or deleted. The actual Windows profile remains
runtime-unverified with automatic waiting false.

CI operation identity binds repository, ref, candidate SHA, the candidate's production
workflow blob and options. Durable intent precedes the sole POST; complete remote
reconciliation can attach one exact existing run, while incomplete, multiple or
contradictory evidence blocks. Direct-receipt metadata delay and lost-response recovery
are read-only and never retransmit. The workflow checks out the immutable candidate,
recomputes the operation key, then gates Windows/macOS allocation.

Collection is attempt-specific, exhausts pagination, rejects missing/duplicate jobs and
requires every mandatory step to conclude affirmatively. Only documented scope/cache
conditions may skip. Provider text is never public output; bounded raw failure evidence,
operation/request selectors and routing remain in protected local SQLite. No W1,
automatic wake, goal manipulation, OPT-2 or application feature was added.

The final hardening makes saved direct receipts non-attached until both run and attempt
identity are validated, treats unresolved `blocked` as a collision barrier across option
changes, and exposes a local-only `ci.py operations` recovery inventory so a first
failure can be selected after restart without SQLite editing. Existing SQLite companions
are validated before open, and POSIX state requires current-effective-user ownership.
Incomplete attachment transitions roll back atomically. Private selectors remain local.

## Acceptance evidence

- Final hardening candidate validation: automatic Repository quality push run
  `35435261321` and PR run `35435263405`, attempt 1, passed at exact SHA
  `a9631343bb9ab4099ed36750a29eb757a7960ed2` on repository validation, Windows x64
  and macOS ARM64 jobs.
- Earlier corrective candidate validation: push run `35431546974` and PR run
  `35431548846`, attempt 1, passed on Windows x64 and macOS ARM64.
- Production run `35431721525`, attempt 1, passed and was accepted by the exact
  collector. Jobs: Validate candidate `105867412640`, macOS ARM64 `105867451179`,
  Windows x64 `105867451191`; all matched the candidate and all required steps passed.
- Live delayed-receipt recovery entered `dispatch_unknown`, reconciled the same run
  read-only, and a second identical submit attached the completed operation without a
  new POST.
- Final local evidence: Python compilation passed; privacy/local-state 37 passed with
  three explicit Windows-host skips; CI operation/recovery 47 passed; exact staged
  repository validation passed 216 files; lossless/source 26 passed; the 620,000-byte /
  40,000-node benchmark passed at 159.46 ms median across seven samples.
- Preflight passed repository/privacy/tooling and truthfully marked absent local
  frontend/Rust tools unavailable. The accepted native matrix supplies those gates.
- The legacy SDK spike retains its known unsupported-Windows result (24 tests: four
  failures, five errors, two skips); it is not target evidence or a new regression.
- Retained failed quality runs and their bounded fixes are recorded in the corrective
  ledger. They are not counted as passes.

## Review and next action

Perform final independent review of PR #12 against the
[corrective ledger](../tasks/active/ci-opt-1a-second-corrective-pass.md).
Merge/branch cleanup requires separate review/authorisation and is not performed here.
Do not rerun the accepted production matrix for this helper/local-storage hardening or
the documentation-only receipt, repeat W0 live probes, edit the protected journal, or
implement W1.

W1 entry remains blocked by the independent W0 no-go: no supported external
owning-runtime observation/reconciliation, ownership-safe control restoration,
loaded/unloaded continuation with restored tools, or authoritative zero-wait-inference
evidence exists. The next bounded selector is therefore PR #12 review/merge, or a
separately authorised W0 recovery investigation if its prerequisites have materially
changed—not W1 implementation.
