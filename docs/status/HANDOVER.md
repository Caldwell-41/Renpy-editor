# Current outcome handover

## Windows Studio credentials: independently reviewed, publication approved

**Outcome/state:** independent review of the complete Windows local diff, including
seven untracked files, is complete. Three qualification-controller findings were corrected
with rejecting regressions; no remaining in-scope production source finding. The local
22-file candidate is **review_ready**; the user explicitly approved commit/push. This is a
source publication checkpoint with stated native evidence limits, not Studio 2A.1,
Phase 2, integrated main or release acceptance. Continue publication in the same chat.

**Location/refs:** local Windows x64, `worktrees/provider-qualification`, branch
`codex/provider-qualification`. HEAD/fresh tracking/remote base remains
`c9f3e37f1fd43200cc1efbbb804a347927932351`. Fresh remote main
`5f448ca683a905f4ea77d4580bbc89fda69f2b93` is already contained by this continuation.
Before publication, all 22 reviewed file hashes matched the approved candidate and the
index was empty. The checkpoint is the commit carrying this handover; the final
publication response verifies its exact remote SHA.
The primary checkout's unrelated HANDOVER edit and all other worktrees are preserved.
No reset, stash, new branch, blanket staging, history rewriting or force-push.

**Review/corrections:** traced CredRead/Write/Delete ownership and blob disposal,
fixed services/complete-reference digest, foreign Mac refusal, size limits, dialog
resource/callback/context lifetime/window-thread ownership, retained Retry/Cancel,
secret-free typed IPC, channel/service routing and exact transactional publication/
retirement. Mac production behavior, identity and signing gates are preserved.
Corrected complete saved-store assertions: extra/duplicate/reordered profiles,
unknown fields, wrong global revision and reused retired IDs now reject. Partial failed
entry reuse requires its exact marker/envelope result. Full/Cancel report envelopes
and GET method/path are checked. Expanded the package inventory to root frontend/build/
toolchain files, permissions and optional public/.cargo trees; incomplete manifests reject. Missing/out-of-budget build selection rejects before
preparation or execution.
See [independent review](../tasks/active/phase-2-initial-llm-assistance.md#windows-independent-review-and-publication-checkpoint--2026-10-08)
for exact findings and regressions. No packaged runtime/probe/fixture/dependency/build
input changed during review; no additional native allowance requested for this checkpoint.

**Fresh source verification:** core **30 PASS, 237 filtered, 0 failed/ignored**; desktop
**11 PASS, 0 failed/ignored/filtered**; frontend typecheck/test compilation and **104 PASS,
0 failed/skipped/cancelled/todo**; corrected Python controller **6 PASS**; formatter PASS.
Independent retained-receipt/snapshot audit PASS. Repository validator/privacy/local-link
and whitespace results are in the ledger. Native, credential-store, provider and CI
operations added by review: **zero**. Unit test executables do not consume app-launch
allowance; desktop tests refuse before OS access or use mocked/file-only stores.

**Retained native evidence:** package 2 EXE SHA256
`9e3e14c5ea3957620b9c001a83a9299aa9bcf8db24309cffcd1265716eda5102`,
14,804,480 bytes. Both EXE hashes and package-2 installer digest verified; installers
were never executed. Run 1 approval-timeout, run 2 unintended Cancel, run 3 entry-step
restore/Cancel timeout remain FAIL. Run 3's validated alpha/gamma saves were inputs to
run 4's independently passed reopen/alpha-beta discovery/replacement/removal sequence
(40.062 s, exit 0, stopped/cleanup true). Run 5's separate failed-save Cancel assertion
passed (115.500 s, zero GETs, exact original fixture bytes); its unchanged Save-expecting
packaged full-flow report remains FAIL/exit 1. Host retained-input observations and
prior fixed-target presence audit remain original evidence, without re-observation or
new OS-store access. Run-1 receipt predates `run`; build-1 installer digest was not
recorded originally. Details/failures remain in the Windows ledger.

**Equivalence limit:** all original recorded package-2 inputs except the external runner
still match, but eight frontend/build/permission inputs were omitted from both old
manifests. Unchanged current Git content cannot prove their build-time hashes. The
corrected complete-equivalence gate rejects both legacy manifests. Earlier completion/
all-input assertions are superseded to this recorded-subset limit; old audits/patches
are historical and retained. No prior binary's native action proof is invalidated by
an external-controller correction; complete candidate equivalence remains missing.
Future complete-manifest packaged proof needs concrete separate allowance, without
backfilling receipts or waiving the rejecting gate.

**Budget/recovery:** cumulative **2/2 builds, 5/5 native runs, 2/4 GETs**; remaining
build/native allowance zero, two GETs unused and unselected. The original isolated root
belongs to `app/.toolchains/windows-studio/state.json`; never renew it. Final root bytes
match preserved run-4 removed state: profiles empty, foreign Mac cleanup/generation
metadata retained. Run-5 Cancel after-snapshot and all faults/backups/restorations remain.
Ignored `app/.toolchains/windows-studio` retains packages, attempts, logs, old audit/patch
and new `independent-review-audit.py/json`. Keep all out of Git. Native operations are
not pending; do not reacquire an exited app through a UI observer.

**Publication authority:** user replied **"i approve"** to the explicit commit/push
request in this same chat. Fresh remote refs/base and all reviewed hashes were unchanged.
Approved title:
`Add reviewed Windows Studio credential storage and qualification gates`.
Scope: 22 reviewed implementation/dependency/fixture/test/canonical-doc/ledger/status
files; exclude ignored evidence/packages, credentials and personal data. Stage only the named reviewed files, verify the staged diff, commit/push this branch
and verify its exact remote SHA. No PR, merge, release or CI.
After verified publication, return the dependency-ready Mac section-15 fixture
preparation prompt under plan sections 19–20: portable/source/unit/DOM work only, zero
native/package/store/provider/CI allowance, publication approval before commit/push.
Mac packaged proof and Windows complete-manifest qualification remain separate gaps.
Do not execute that prompt or automatically advance to request lifecycle.

**Remaining limits/host routing:** original full phase-1/alpha-alpha flow, confirmed-save/
unavailable-reload packaged branch, locked-store behavior, cross-build Windows continuity,
clean-OS reinstall and real Studio/generation remain unproved. Mac original temporary
file proof remains historical; corrected pending-status/reload packaged proof awaits
its unapproved [section 15 proposal](../tasks/active/2026-10-08-macos-development-credential-storage.md#15-independent-review-correction-and-proposed-narrow-native-follow-up).
No Mac native/signing operation or exhausted-budget renewal. Mac plan/evidence stays
active; transfer only published source/docs to a local macOS ARM64 agent when selected,
with one active writer and no direct other-host access.
