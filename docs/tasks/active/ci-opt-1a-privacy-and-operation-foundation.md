# Combined delivery: privacy corrections and OPT-1A

**Approved:** 2026-09-19, by the user's instruction to do both the review corrections
and 1A in the next chat, self-review, publish a handover and provide a W1 prompt.
**State:** Approved, not started. This publication updates documentation only.
**Repository / working branch / PR:** `Caldwell-41/Renpy-editor`,
`maintenance/ci-optimisation`, [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12).
**Reviewed starting candidate:** `33d0e202b2116d11e12c316313f9c1bd0888731e`.
**Parent roadmap:** [ci-optimisation.md](ci-optimisation.md).
**Live continuation:** [HANDOVER](../../status/HANDOVER.md).

This is the canonical implementation brief for this combined delivery. The chat
prompt is only a selector. Read [AGENTS](../../../AGENTS.md),
[WORKFLOW](../../WORKFLOW.md), [local privacy](../../LOCAL_CODEX_CONFIG.md) and the
[W0 report](../../research/CODEX_WAIT_WAKE_QUALIFICATION.md). Inspect actual remote
refs, PR changes, worktree and any nested agent instructions before editing. Preserve
unrelated work and reuse the existing branch/PR; do not reset to the reference SHA.

## 1. Authority, order and limits

This is an explicit exception to one checkpoint per chat: the next implementation
chat performs Gate P (privacy corrections), THEN Gate A (OPT-1A), THEN final self-review
and handover. Passing Gate P authorises continuing directly to Gate A in that same
chat; no additional approval question is needed. Both gates have separate evidence.
Failure in Gate P must be fixed before any sensitive local bootstrap or Gate A write.
Do not merely review the defects and defer fixes to another chat.

Included: bounded changes to local bootstrap/validator/tests, CI submission and
collection tooling, minimal candidate-validation wiring in the existing production
workflow, cheap tooling tests, documentation and the existing PR description.
The user authorises scope-appropriate validation and one final full production matrix
for a ready changed workflow candidate. Avoid repeated equivalent expensive runs.
An actual failed candidate may need a corrected run; preserve failures and justify it.

Excluded: W1 implementation, automatic Codex queue/resume or goal manipulation, W0 live
pause/unload recovery, services/listeners/notifications, new model/subagents, runtime
upgrades, host migration, application features, OPT-2A preflight/concurrency redesign,
OPT-2B cross-commit evidence reuse, merges, branch deletion and history rewriting.
Do not silently promote a planned feature or a skipped test into implemented support.

W0 currently remains no-go/unqualified for automatic support. Passing privacy and
OPT-1A does not repair that separate prerequisite. This chat must assess W1 entry
readiness and give the appropriate short next-chat selector under section 8; it must
not start W1 or invent a W0 pass merely to produce the requested prompt.

## 2. Gate P: reproduce and correct the privacy review findings

Use synthetic temporary Git repositories, not actual private endpoints or credentials.
Add the two missing failing regressions FIRST and confirm they reproduce on the
reviewed implementation; keep that failure evidence separate from final passing tests.
No real identifying configuration may be created until destination protection passes.

### P1. Validate the staged bytes, not just working-copy bytes

`scripts/validate.py` currently checks index filenames but reads template/content from
the working tree. A populated template can be staged and then replaced locally with
blank content, bypassing the intended publication guard.

Obtain index entries with NUL-safe Git plumbing (for example `git ls-files --stage -z`),
inspect stage/mode/object identity, and read the actual blob bytes by object ID with
`git cat-file` or an equivalent raw-object operation. Do not enable external textconv,
smudge filters or symlink following. Share the existing content/placeholder checks
between staged and working-copy inputs instead of duplicating their semantics. [GIT1-GIT2]

Validate the staged template AND staged publishable text, including force-tracked
ignored files. Keep the independent local-only-name guard: those files fail without
being opened or echoed. A clean working copy, unstaged deletion or changed ignore rule
cannot excuse private content remaining staged. Missing/invalid required staged
objects, unmerged index entries and disallowed modes fail safely. Never mutate or
restage the user's index to make validation pass.

Retain separate validation of public working-copy/non-ignored new files. Track which
snapshot each result covers. Detect relevant index changes during validation, and
revalidate the exact staged candidate before commit/push; do not claim protection
against every arbitrary concurrent writer. Use bounded subprocess time/output and
safe path decoding. Diagnostics must not echo private values, paths, Git stderr or
raw configuration; return a reason code and a local inspection procedure.

Mandatory tests: staged populated template plus clean working copy; staged secret in
ordinary text plus clean/deleted working copy; legitimate blank staged template with
changed public working copy; renamed/deleted files; forced local-only paths; unmerged
index; spaces/Unicode and Git-valid unusual path bytes; Git/object read failure;
changed index during validation; no secret/private filename in output.

### P2. Check actual destinations and effective ignore rules

`scripts/codex_local.py` currently checks only `.codex-local/probe.json`. That sentinel
can be ignored while a later negation exposes the actual profile directory.

Compute the exact destination in memory, verify that it is untracked and effectively
ignored BEFORE directory/file creation, and recheck before writing. Include temporary,
lock and evidence paths actually used by the implementation. Interpret Git's effective
ignore decision correctly, including negated/nested/global rules and fatal errors;
matching a `!` rule is not proof of ignoring. `--quiet` applies to one path only. [GIT3]

The publication guard must also identify non-ignored untracked names under reserved
private namespaces without reading their contents or printing their private names.
A subsequent change to ignore rules must fail safe even before those files are staged.
Assess staged versus working-copy ignore-rule changes so a cleaned-up working copy
cannot hide newly published unsafe rules. Preserve the tracked-local-file guard.
Retain existing symlink/reparse/hardlink refusal; do not recursively follow private
links or auto-delete existing data. Document the non-hostile-same-user boundary.

Mandatory tests: sentinel ignored but actual destination unignored; nested negation;
exact destination missing from ignore rules; force-added profile; non-ignored existing
private file; changed/staged ignore rules; failed Git check; all used private paths
protected; no identity-bearing directories/files created on failed preflight.

### P3. Make fresh-client setup and storage safety truthful

Keep identifiable host, user, paths, endpoint, installed-build inventory, binary hashes
and runtime task/queue/turn bindings only in protected local state. Examples remain
blank. Do not put stable hashes of private identity in GitHub receipts or artifacts.

A fingerprint combining host, home directory, worktree and PATH is a routing
convenience, not owning-runtime identity. Implement explicit local client-context
selection/rebinding so two clients with the same observed environment cannot silently
inherit each other's settings. Preserve existing profiles, never overwrite them
automatically, and leave ambiguous/new/stale client bindings unverified. The agent sets
up applicable verified local fields on each actual client and rechecks ownership every
session. Native task IDs are obtained afresh, never persisted as a reusable global
default or found by `--last`. Do not enable automatic mode or perform W0 live probes.

Before collecting/writing ANY identifying bootstrap fields, including hostname/home,
verify private storage permissions. On Windows, establish an explicit current-account
ACL check or fail safely before writing those fields; POSIX mode bits are not a Windows
ACL. A preprotected local state root may be used with a documented contract. Do not
change system-wide permissions, require administrator access or install a service.
Test suitable POSIX permissions on macOS/Linux. Unknown permissions mean blocked
sensitive setup, not a false private/verified status.

CI-only tooling must still work without a qualified Codex connection. `doctor` reports
`codex_binding: unverified/unavailable` separately from CI capabilities. An inaccessible
actual client is not a reason to initialise this chat's unrelated sandbox as its proxy.
Missing local credentials require a local user action, never a request to paste secrets.

Tests cover identical observed environments but distinct explicit client contexts;
profile reuse only after revalidation; runtime/version/context changes; malformed and
copied profiles; unknown fields; concurrent initialisers; no clobber; permission denial
BEFORE identifying writes; valid/invalid Windows ACL outcomes; POSIX modes; automatic
mode stays off; stdout/stderr never contain identifying fields. Use synthetic data.
Do not claim native execution from mocks; record each actually tested host.

Gate P passes only after reproduction, corrections, regression tests, review of staged
bytes, exact ignore protection and local-storage/client limitations are documented.
A safe refusal is a valid negative-test outcome, not proof that a supported native
success path was exercised. Record unavailable native evidence explicitly.

## 3. Gate A: OPT-1A architecture and components

Create a small Python `scripts/ci.py` entry point and narrowly scoped reusable modules
(e.g. `scripts/ci_lib/`), following existing tooling. Use existing approved GitHub
credentials through structured `gh api` or a reviewed REST transport; no new secret
store, dependency framework, external service or interactive credential prompt.

| Component | Required responsibility |
| --- | --- |
| Doctor/preflight | Capability detection, safe local setup status, cheap relevant checks and explicit unavailable checks. |
| Operation store | Versioned durable local request/run/checkpoint/result state; single-host ownership and restart-safe transitions. |
| GitHub transport/submission | Current version-qualified API; exact candidate dispatch, correlation, attach or safe refusal. |
| Collector/report | Attempt-specific paginated jobs, bounded failure evidence, structured result and sanitised handover summary. |
| Workflow candidate gate | Reject wrong candidate before allocating native jobs; pin all jobs to the validated commit. |
| Tests and operations guide | Offline fault tests, cheap real-host tooling checks and actual workflow validation. |

Required interfaces, with exact options/exit codes finalised and documented in code:

```text
python scripts/ci.py doctor
python scripts/ci.py preflight
python scripts/ci.py submit --ref <branch> --sha <full-sha>
python scripts/ci.py collect --run <id> --attempt <n>
```

Permit operation selection/resume by a recorded operation ID when required. Avoid
multiple parallel entry points or silent implicit repository/branch selection. Do not
invoke a nonexistent command before implementing it. Reuse the corrected privacy
helpers and configuration contract; do not couple CI operation to Codex qualification.

### A1. Capability and preflight behavior

Detect Git, Python, approved GitHub authentication/permissions and relevant Node/Rust
checks without dumping environment or credentials. Keep exact client inventory local.
Report available/unavailable separately; retry missing prerequisites only when relevant
configuration changes. No repeated Linux desktop build attempts after a known missing
GTK/platform dependency. Read-only collect needs less authority than dispatch; never
request broad write/admin permissions merely to read a run.

Local preflight runs repository/staged privacy validation, privacy/CI-helper tests and
applicable cheap frontend/format checks. Record scope, commit/index identity and results.
Unavailable supported-target work is explicitly delegated to the existing native gate,
not marked passed. Full shared CI preflight DAG optimisation belongs to OPT-2A.

### A2. Durable operation and checkpoint identity

Use a bounded versioned private local journal/store, preferably small SQLite if needed
for atomic request/ownership transitions. Keep it separate from Codex's internal DB.
Validate protection before writes; no profiles/journals/artifacts in Git. Persist:
repository, workflow identity/path/source revision, ref, full candidate SHA, requested
validation/package options, fresh operation/request ID, attempt, run/job references,
state, deadlines, completed local checks, next bounded action and redacted result.
Optional private runtime binding remains nullable/unverified and is not exercised here.

A dispatch request ID may be an opaque random per-operation correlation value visible
to GitHub; it must not encode hostname, path, username, client/thread ID or a hash of
these. It is distinct from the private client identity. Repository-safe handover fields
are allowlisted; never export the entire local record.

Persist intent BEFORE POST and the run receipt after it. Crash recovery does not create
a replacement operation silently. Protect cooperating same-host submissions with an
atomic lease/reservation keyed to candidate/workflow/options; recover stale ownership
conservatively. This does not promise distributed cross-host exactly-once dispatch.
If another owner or contradictory state is detected, attach or refuse; never guess.
Suggested states: prepared, dispatching, dispatch_unknown, attached, running, completed,
blocked. Lost local state may be reconstructed read-only only when identity is provable.

### A3. Current API and find-or-start submission

At implementation verify the installed transport and supported API version. Current
GitHub workflow docs show a dispatch `200` response containing `workflow_run_id`,
`run_url` and `html_url`; the February 2026 introduction described opt-in
`return_run_details` with older `204` behavior. Prefer structured direct run receipts
on the qualified contract, not parsing human CLI output or polling to find the latest
run. Do not blindly send version-incompatible fields. Keep a tested 204/lost-response
path only when applicable; API success without an ID is not evidence to redispatch.
Pin/document the version/capability used and test 200, 204 and response-loss handling. [GH1-GH2]

Require an explicit branch/tag accepted by the dispatch API and full candidate SHA.
Validate ref resolution and permitted repository/workflow BEFORE writing. Search
matching queued/running runs with bounded, complete pagination and validate their
candidate/workflow/options. Attach only to an unambiguous equivalent request. A run
using different workflow logic or package/validation scope is not the same operation.

Completed success may be returned for the EXACT already-tested candidate and requested
scope after verifying required evidence. No cross-commit equivalence, docs-descendant
reuse, cache-based acceptance or automatic rerun of a failed candidate. A failed or
cancelled existing run is reported; another dispatch needs explicit retry authority.
A caller's explicit diagnostic force-full request never bypasses an unresolved request
or colliding active owner. Reuse/force semantics must not accidentally become OPT-2B.

After POST, verify the returned run matches repository/workflow/event/ref/candidate
and record its attempt. If response is lost, reconcile using the saved random request
ID and validated metadata (for example a bounded workflow run-name field carrying the
request ID). Do not infer request inputs that an API response does not actually expose.
Unknown, multiple, stale or unauthorized results block; do not automatically repeat POST.
Eventual consistency and rate-limit retries belong in ordinary bounded code, not extra
model turns. No task content or client identifiers in workflow names.

### A4. Minimal production workflow integration

Reuse `.github/workflows/production-scaffold.yml`; do not create an alternative
acceptance path that bypasses it. Add candidate/request inputs and a cheap validation
job only as needed for this contract. Distinguish manual inputs from existing push
runs, which derive their SHA from the event. Dispatch passes the full `expected_sha`;
validate strict syntax and compare it with the immutable event's resolved revision.
Checkout the validated SHA in ALL downstream jobs, not the moving ref.

Perform validation before native Windows/macOS job allocation. Pass inputs through
safe data/env channels, never interpolate untrusted ref/request text as shell code.
Make every current production gate conditional on successful candidate validation,
without weakening/reclassifying tests, expected markers, smoke/denial/privacy checks
or inventories. A failed/absent candidate gate must fail the workflow visibly.
Preserve supported runners, pinned dependencies/SDK, caches and current target scope.

`upload_packages` defaults false for manual runs; package BUILD remains mandatory for
full acceptance. Lightweight redacted gate evidence remains available. `force_full`
may be reserved/documented as no-reuse at this stage, but must not cancel unrelated
runs, suppress tests or grant retry permission implicitly. Limit automatic push changes
to paths required to keep this new gate honest; general concurrency/trigger redesign
remains OPT-2A. Record any necessary overlap explicitly rather than widening scope.

Verify default-branch workflow discovery and requested-ref support before live dispatch.
The existing production workflow is already present on main, so prefer it for the
real test. Do not assume a brand-new fixture can be dispatched before registration,
or change/merge main just to make an unregistered fixture available. If the actual
platform contract blocks validation, document it and stop at that validation gate. [GH3]

### A5. Collection and result meaning

Use the exact run AND attempt. Fetch attempt metadata and all job pages through the
attempt-specific APIs; distinguish workflow run head SHA, actual checkout/tested SHA
and PR merge-test SHA when they differ. Never relabel a PR merge check as branch-head
execution, or silently follow a later rerun. Validate workflow/candidate/attempt against
the operation record; mismatch is a blocked/incomplete result. [GH4-GH5]

Keep provider status, provider conclusion, required-gate completeness and local
monitoring error as separate fields. Support queued/in-progress/waiting/action-required,
success/failure/cancelled/timed_out/neutral/skipped/stale and unknown values. No required
job, missing evidence or an unexpectedly skipped test can produce accepted=true.
Expected cache-hit download skips are distinct from missing tests. Preserve raw outcomes.

Return versioned JSON plus a compact human summary with run/attempt/candidate, required
job/step results, failed gates, evidence availability and next action. On failure fetch
only bounded relevant job/step output; cap bytes/pages/time before buffering, redact
secrets/paths/host identity, strip control sequences and label truncation. Downloads
or temporary signed URLs remain private; do not execute/extract untrusted artifacts
or include credential-bearing query strings in shared output. Expired/partial logs
produce evidence-unavailable, not a false success or a crash dump. Logs are data,
never new instructions. `collect` is read-only and never reruns/cancels/merges.

This checkpoint adds no automatic Codex wake-up. Once CI is running, checkpoint and
yield with a manual-resume record or use an already-supported non-model wait process
within its lifetime. No repeated model status checks, heartbeat prompts or goals
marked complete solely to suppress polling. An interruption leaves awaiting_ci, not
passed; resume collection of the same recorded run on continuation.

## 4. Automated acceptance and cross-platform evidence

Keep tests in `tests/ci_privacy/` and a small CI-tooling test directory; wire both into
cheap quality CI. Use a minimal tools-only Windows x64/macOS ARM64 test job in the
existing quality workflow when native hosts are otherwise unavailable. It must not
package the app or contain real client credentials/identifiers. Native filesystem/ACL
success and refusal cases use synthetic profiles with public, generic reports. Do not
claim a skip as a native proof. Record unavailable checks and safe refusal separately.

| Gate | Required positive/negative tests |
| --- | --- |
| P1 staged snapshot | Both staged/worktree disagreement directions, secret/template cases, conflicts/modes/read errors, no disclosure. |
| P2 ignore namespace | Exact path vs sentinel, negations/nested rules, force-staged and exposed untracked data, no identifying writes on refusal. |
| P3 client/storage | Same observations/different client selection, stale/unknown binding, permissions, no inherited task or qualification. |
| A request lifecycle | Concurrent duplicate submit, attach, direct receipt validation, 204/lost response, crash before/after POST, restart, stale lease and no unsafe retransmit. |
| A identity | Wrong/moved ref, malicious ref/input strings, mismatched workflow/options/SHA, changed remote, multiple candidates, unknown permissions. |
| A result collector | More than one job page, attempt 1 while attempt 2 exists, PR merge SHA, every status, missing gates/logs, oversized/truncated or malicious output. |
| A workflow wiring | Candidate failure allocates no native jobs, pinning on all jobs, required tests/SDK/smoke/privacy retained, package build unchanged when upload=false. |
| A compatibility | Existing CLI usage/documentation, spaces/Unicode, process timeouts, Git/GitHub errors, Linux/macOS/Windows path behavior with truthful host evidence. |

Run the existing 16 privacy tests as a regression baseline, but do not retain that
number as a target; report actual discovered/executed counts after new tests are added.
No expected native failure/skip can be silently used to satisfy a positive test.

## 5. Real GitHub validation without redundant runs

Before publishing the ready candidate, review the complete diff and run corrected
privacy/staged validation plus helper tests. Commit/push on the existing branch once
coherent. Verify automatic Repository quality on the actual tested revision. If full
acceptance already started for this candidate, attach; otherwise submit it once.

Use one final production matrix on the changed workflow candidate. Demonstrate actual
run-ID capture, second submit attaching without a second matrix, exact candidate and
attempt collection, both Windows/macOS gates and opt-in package upload semantics.
Re-exercise failed/timeout/unknown paths with offline fixtures or existing failed-run
reads instead of intentionally failing many production matrices.

Prove cheap wrong-SHA rejection through one deliberate incorrect expected-SHA manual
invocation only after reviewing the gate's ordering, with no native jobs starting.
Where the platform cannot support that bounded test, keep the live case pending;
structural tests do not become live evidence. This controlled negative run is not
accepted application evidence. Record all run IDs, attempts and true conclusions.

Do not dispatch a production matrix for this documentation publication alone. Do not
rerun an unchanged accepted candidate merely to add handover prose. No cross-commit
reuse policy is implemented here: keep tested candidate and documentation head distinct.
Any permission/rate-limit/runtime obstacle leaves a precise awaiting/blocked handover;
do not bypass policy or claim all gates passed to advance to W1.

## 6. Self-review before declaring OPT-1A ready

Review the final integrated diff, not only new lines. Verify each P/A acceptance row
against executed evidence and confirm no W1/OPT-2/application scope leaked in. Check
staged and committed privacy, Git ignore behavior, native ACL claims, result semantics,
subprocess bounds, remote-call counts and documentation/PR consistency. Correct bounded
findings and rerun affected cheap tests before another expensive run is considered.

Report separately: privacy gate, local/helper tests, native tooling coverage, actual
CI integration, known limitations, and W1 entry gate. The implementation can be
review-ready while W1 remains blocked. Do not conflate user acceptance with tests.
No merging or branch cleanup is part of this combined checkpoint.

## 7. Required repository output and handover

Update this brief's ledger with actual implementation commits, reasoned changes,
commands/counts/outcomes, native coverage, run/attempt/tested SHA/job references, failure
and incomplete evidence, and resolved local-only choices. This publication's approval
and plans must never be copied into the ledger as executed tests.

Update [LOCAL_CODEX_CONFIG](../../LOCAL_CODEX_CONFIG.md) with implemented setup/limits;
create/update `docs/CI_ORCHESTRATION.md` for actual doctor/preflight/submit/collect
commands only, explicitly stating no automatic wake support. Add an INDEX entry and
concise AGENTS usage rules after implementation; do not instruct agents to invoke
future scripts now. Update parent roadmap/CURRENT, existing HANDOVER and PR #12.

Publish the handover even on interruption or failure. It must name exact branch/PR,
known implementation candidate, pending CI identity, safe next command, unresolved
host gaps and next checkpoint state; never include private client IDs or paths.
Keep one live handover; avoid duplicating the full plan in chat or PR comments.
Do not create receipt-only commits to chase the handover's own hash. Confirm publication
and inspect exact checks externally; a pending check is not a pass.

## 8. W1 readiness and the requested next-chat prompt

At the end perform a bounded read-only entry review, not W0 recovery or W1 coding:

- P and OPT-1A code/tests/live integration are actually complete and reviewed.
- The current W0 qualification is a demonstrated go for the intended owning-runtime
  path, including usable external reconciliation, safe user-control preservation and
  authoritative inactivity evidence. A prior no-go plus new unit tests is not go.
- The local client will revalidate its binding; public handover contains only the
  qualification result/reference. W1 stays automatic-mode-off and W2/W3 remain separate.

If every entry condition passes, publish W1 ready (execution in a separate chat) and
give this small selector after the handover is published:

```text
/goal — W1 only
Repository: https://github.com/Caldwell-41/Renpy-editor
Continue maintenance/ci-optimisation and PR #12. Read AGENTS.md and
docs/status/HANDOVER.md, then the linked roadmap. Verify W1 entry gates;
implement W1 only, self-review/test, publish the ledger and handover, and stop.
If any entry gate is not met, report it without starting W1.
```

If P/OPT-1A pass but W0 remains no-go, state that explicitly and provide a W1 readiness
selector, not a misleading implementation approval:

```text
/goal — W1 entry review only
Repository: https://github.com/Caldwell-41/Renpy-editor
Continue maintenance/ci-optimisation and PR #12. Read AGENTS.md and
docs/status/HANDOVER.md. Check the documented W1 entry evidence. If W0 remains
unqualified, record the blockers and stop; do not implement W1 or repeat live probes.
```

If P/OPT-1A are incomplete, the one next prompt selects recovery of this combined
checkpoint and its recorded run, not W1. Do not indefinitely repeat blocked W0 research;
independent later CI work remains an explicitly selectable alternative, not automatic.

## 9. Ledger

### Planning amendment — 2026-09-19

User selected privacy correction plus OPT-1A in one next chat, followed by self-review,
repo handover and a conditionally ready W1 selector. Reviewed PR #12 head was
`33d0e202b2116d11e12c316313f9c1bd0888731e`; main was
`7d634eeaf53fe0244a2739f26914797ca16ef544`. This amendment records scope and gates only;
no P correction, CI helper, runtime probe or native run is performed by publishing it.

The preceding assessment reported the staged-template/clean-worktree and sentinel/
actual-path gaps. The implementation chat must reproduce both with new tests. Existing
CI success and 16 tests do not cover them. Add P and A result entries here when run.

### Documentation publication correction — 2026-09-19

Planning commit `44625f0556a6f0b1798798defaecdeead7f590a1` triggered quality runs
`35409127200` and `35409130385`. The PR job failed repository validation before privacy
tests: slash-separated generic field lists in this brief and LOCAL_CODEX_CONFIG matched
the existing home-path detector. Reworded those lists as prose; no actual client path
was published and no validator rule was weakened. The failed runs remain failed
evidence. Check the correction commit's actual quality result; no result is predeclared.
This is still documentation-only correction, not execution of Gate P or OPT-1A.

## Primary implementation references

Checked on 2026-09-19. These describe public tool/API contracts, not the user's local
system. Verify the actual supported version before implementation or dispatch.

- [GIT1] [Git index entries and NUL-safe enumeration](https://git-scm.com/docs/git-ls-files).
- [GIT2] [Raw Git object inspection](https://git-scm.com/docs/git-cat-file).
- [GIT3] [Git effective ignore checks](https://git-scm.com/docs/git-check-ignore).
- [GH1] [Current workflow dispatch REST contract](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).
- [GH2] [GitHub introduction of dispatch run-ID receipts](https://github.blog/changelog/2026-02-19-workflow-dispatch-api-now-returns-run-ids/).
- [GH3] [Workflow dispatch syntax and inputs](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_dispatch).
- [GH4] [Run metadata and attempt endpoints](https://docs.github.com/en/rest/actions/workflow-runs).
- [GH5] [Attempt-specific paginated workflow jobs](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt).
