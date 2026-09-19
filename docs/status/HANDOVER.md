# Current checkpoint handover

**Prepared:** 2026-09-19.
**Repository:** `Caldwell-41/Renpy-editor`.
**Branch / PR:** `maintenance/ci-optimisation`, [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12).
**Delivery:** [OPT-1A second corrective pass](../tasks/active/ci-opt-1a-second-corrective-pass.md).
**State:** Local implementation and fresh integrated review complete; corrective
candidate publication, native checks and one required production matrix are pending.
**W1 prerequisite:** W0 automatic support remains unqualified/no-go and is not waived.

## Corrective implementation

Private client/CI state now defaults to protected per-user Loomlight application data,
outside the Git worktree. Windows owner/ACL and POSIX mode checks cover profiles,
SQLite and applicable companion files; unsafe types, links, containment and ambiguous
legacy state fail closed. The existing `.codex-local` entry was acknowledged only as
non-authoritative for fresh external initialisation; it was not opened, migrated,
modified or deleted. The actual Windows client created a protected external profile;
runtime binding remains unverified and automatic waiting remains false.

CI identity now uses the requested candidate's workflow blob, ref, SHA and options, so
unrelated local `HEAD` changes cannot create a second operation. Prepared submissions
perform complete deterministic remote reconciliation before the one permitted POST.
`ci.py reconcile` recovers unknown dispatches without POSTing. The workflow recomputes
the deterministic operation key after immutable checkout and keeps both native jobs
behind that candidate gate.

The collector requires exact run/attempt pagination and affirmative evidence for every
mandatory candidate/test/security/package/smoke/inventory step. Provider log text is
never returned publicly; bounded raw evidence is stored only in protected local SQLite.
The integrated review also corrected Python doctor reporting, direct-receipt metadata
delay recovery, unresolved `force_full` collisions and missing journal checkpoints.
No W1/OPT-2/application behavior was added.

## Current evidence

- The focused pre-fix regression run reproduced external-state absence, duplicate POST
  after a `HEAD`-only workflow change, incomplete-search POST, false empty/null-step
  acceptance and future-format diagnostic leakage.
- Local Python compilation passed. Privacy/local-state suite: 35 tests passed on
  Windows with three explicit skips (two unavailable symlink creations and the
  POSIX-only unusual-byte path). CI operation/recovery suite: 40 tests passed.
- Exact working-tree repository validation passed 216 files before final staging.
  Lossless/source suite passed 26 tests; benchmark completed at 620,000 bytes / 40,000
  nodes with 153.23 ms median parse time across seven samples.
- The legacy Ren'Py SDK spike retained its known unsupported-Windows result: 24 tests,
  4 failures, 5 errors and 2 skips caused by POSIX launcher/path/executable assumptions.
  This is not target evidence and is not a regression from the corrective pass.
- `doctor` reports Git/Node/Python available, npm/Cargo/Rust unavailable, dispatch
  credentials configured but unverified, public collection available, external state
  resolved but generic doctor does not inspect it, Codex binding unverified and wake off.
- Historical production run `35414571185` still proves the packaged application at
  `83e86aa`; it does not prove this changed workflow identity/collector.

## Pending safe action

Stage and revalidate the exact candidate, commit/push it, and inspect both automatic
quality runs. Because the production workflow's inputs, identity gate and candidate
binding changed, submit exactly one fresh production matrix for that candidate; verify
second-submit attachment and collect its exact attempt. Do not rerun the historical
wrong-SHA probe unless separately authorised. Then publish exact receipts in the
corrective ledger/current status/this handover and update PR #12. A docs-only receipt
follow-up does not justify another matrix.

If interrupted, resume this same corrective candidate/operation from protected local
state. Do not create another operation, edit SQLite manually, implement W1, repeat W0
live probes, merge PR #12 or clean branches.

## W1 entry decision

W0 remains no-go: supported external owning-runtime reconciliation/telemetry,
ownership-safe user-control preservation, loaded/unloaded continuation with restored
tools, and authoritative inactivity/zero wait-driven inference evidence remain absent.
Passing this corrective CI delivery cannot satisfy that independent prerequisite. Once
the pending publication/CI evidence passes, the next selector remains W1 entry review
only, not W1 implementation.
