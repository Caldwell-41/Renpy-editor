# Optional milestone — Local Git checkpoints

**Decision:** 2026-09-25. **State:** deferred; GIT.1 and GIT.2 are `not_started`.
**Authority:** the user removed new Git work from Phase 1 and requested a separately
selectable optional milestone. This preserves the design; it does not start work.
**Entry:** explicit later selection, current refs/ownership and implementation reviewed,
and accepted source/session/recovery foundations. No automatic phase dependency or date.

## 1. Scope and preparation

Local status, reviewed diff and exact user-confirmed checkpoints are optional. Phase 1
and Phase 2 do not require them. Existing optional `git init` during project creation
stays implemented and retains its regressions; do not remove it or expand it now.
This changes the Loomlight product scope, not the developer repository Git workflow.
The former 1G.3a/1G.3b requirements become GIT.1/GIT.2 below; V1/V2 identifiers remain
for traceability. Remote/authentication and destructive restore remain excluded.

Before implementation, read AGENTS, WORKFLOW, CURRENT/HANDOVER, TRANSACTIONS, SECURITY,
DATA_MODEL and the current Source Save contract. Reuse the operation-preparation path
from [1G](phase-1g-branches-runtime-git.md#3-cross-cutting-accepted-behaviour) without a
new Save authority. Reassess runtime/Git compatibility if play exists at selection time.

At GIT.1 entry define an explicit inclusion table against actual metadata schemas:
source/assets/GUI resources and durable metadata versus transient/private/generated
content, with reasons. Define dependency detection for companion files and the review
UI for partially staged selected paths. These are design deliverables, not settled
algorithms. Pin supported Git capabilities and selected-path index semantics before
privileged implementation. Do not infer full Git support from the existing init helper.

## 2. GIT.1 — Local Git checkpoint safety

Deliver core-owned local status, inert diff and checkpoint operations with opaque session
and review tokens. Preserve the existing `git init` option. A project without a repository
shows Git unavailable for that project; it remains authorable. Do not silently initialise,
install Git, change global identity/configuration or run authentication/network commands.
Report missing executable/identity actionably; an explicitly entered checkpoint identity
is validated and scoped locally. Record the supported Git version/capabilities.

### Review and file inclusion

Default candidates are conventional game source, copied game assets, project-owned GUI
resources and durable editor metadata (`project.json`, `authoring.json`, `source-map.json`
where present). Inspect actual schemas at entry: exclude transient fields/files, recovery
journals, credentials, machine paths, SDKs, logs, saves, caches, `.rpyc`, distributions
and build output. Ignored/private files do not become candidates just because already
tracked. Never use blind `git add .`. Display exclusions with reasons.

The user selects full files and reviews additions/modifications/deletions, text diffs
or binary hash/size summaries, identity and commit message. Detect source/metadata
dependencies; require review of needed companion changes or refuse an incoherent set,
never silently include them. Preview is bounded/cancellable. Checkpoint includes only
the exact reviewed bytes; drafts are excluded unless explicitly accepted first.

### Index, concurrency and crash contract

Preserve unrelated staged index entries and worktree bytes on success and failure.
Do not globally refuse checkpoint merely because unrelated files are staged. Detect
partially staged selected paths: show staged versus working content and refuse ambiguous
same-path intent until the user resolves/reviews it; do not silently consume that staging.
This milestone does not add a general staging editor or hunk selection.

Bind preview to canonical repository/project identity, HEAD/ref, selected file bytes,
relevant metadata and captured index state. Recheck at commit; stale HEAD/index/selected
content requires a fresh review. Safe unrelated changes may remain untouched, but must
not be included. Handle an unborn HEAD/first commit, no-op selection, additions, deletions,
binary files, unusual filenames and concurrent external Git processes. Unsupported merge,
rebase, unmerged index, detached/worktree/submodule/redirected configurations must be
identified; support only proven cases, otherwise refuse with no modification.

Before UI work, choose and prove the index strategy (for example an isolated temporary
index plus guarded ref/index reconciliation). An example is not an approved algorithm.
Document selected-path post-commit index semantics and recovery across object creation,
HEAD publication and index reconciliation; these are not magically atomic together.
Never overwrite an external index/HEAD to repair a partial result. Reopening must detect
a published commit after a lost response and avoid duplicate checkpoints. Preserve
ambiguous state with instructions; Git recovery is separate from editor journals.

### No project-controlled command execution

Use argument arrays, bounded subprocess/output, safe path handling and an allowlisted
environment. Prove hooks, clean/smudge/process filters, external diff/text conversion,
fsmonitor, signing helpers, pagers, config includes/redirects and attributes cannot run
unexpected commands or redirect writes. Do not assume a local status/diff is inert.
Unsupported transformations are refused, not silently bypassed with different bytes.
No remote fetch/push, credential lookup or project-controlled executable invocation.
Record the security/index decision in a focused ADR and tests before checkpoint writes.

**V1 gate:** actual Git repositories on both targets prove exact commit-tree content,
first commit, text/binary/deletion behaviour, identity handling, unrelated staged/worktree
preservation, partially staged selected-path refusal, stale review rejection, hostile
configuration non-execution, symlink/path substitution, external index/HEAD races and
interruption at each publication boundary. A successful exit code alone is insufficient.
If the contract cannot be proven, report `blocked` here; do not substitute blanket
staged-index refusal or a UI that claims the safety foundation is complete.

## 3. GIT.2 — Git UI and capability closure

Add the supporting Git surface: unavailable/clean/changed states, separate staged and
working changes, selection, inert bounded diff, binary summary, exclusions/dependency
messages, identity/message entry and explicit checkpoint confirmation. Use the V1 review
token; stale/busy/failure outcomes preserve user selection/message and require refresh
where appropriate. Show resulting commit identity and exact included file list only after
the verified result. Keep Git state independent of persistence/recovery indicators.

**V2 gate:** real service plus UI and packaged tests demonstrate the reviewed set equals
the actual commit, unrelated staging survives, stale confirmation is refused, missing
Git/identity/no-repo are usable, drafts are truthful, cancellation/session replacement
cannot commit to another project, and success-after-lost-response is recognised. Include
keyboard/focus/resize and hostile output rendering. Then review V1/V2 evidence on the
final candidate. Optional Git remains unaccepted
until its supported-target gate and user review are complete; its status never blocks
Phase 1 closure or Phase 2 entry.

## 4. Verification and handoff

The implementing agent owns core, literal IPC, real Git repository and changed-path
packaged tests on Windows x64/macOS ARM64. Reuse the existing test infrastructure;
prove real UI-to-service-to-commit contents, not only mock responses or exit codes.
Fault injection, hostile configuration and staging races are automated. If selected
later, define its own focused final human usability check; no Git physical testing
belongs to Phase 1. Missing platform access is blocked evidence, not a user testing chore.

Preserve the former 1H Git cases here: first commit, absent executable/identity/repo,
text/binary/add/delete, companion dependencies, partial selected staging, unrelated
staging preservation, stale HEAD/index/review, hostile hooks/filters/helpers, and
interruption/lost response around commit publication. Also verify init-to-checkpoint
integration when this milestone is selected. Record exact candidates, tests, target
results and failures in this brief and the single live handover. No implementation
branch or PR exists for this optional milestone. Complete one selected checkpoint per
chat, retaining its branch/PR; GIT.2 requires proven GIT.1 and separate selection.
