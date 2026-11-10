# Choice #98 delivery

## Selection and ownership

Kris selected [#98](https://github.com/Caldwell-41/Renpy-editor/issues/98)
with the implement-spec workflow and instructed the agent to start building on
2026-11-10. The spec owns requirements; #101–#106 own bounded acceptance.
Delivery is `in_progress`. #101 is integrated with portable and Mac SDK evidence;
its acceptance and the combined feature remain pending.

Integration branch `codex/choice-98` starts at accepted integration
`63221b44d72c1c100815e9e638cbec5133ffc1eb` from
`codex/phase3b-screen-designer`. The coordinator owns this branch, live status,
sequencing and combined evidence. Each implementer owns one ticket's production
code, affected tests and canonical technical contracts in a managed isolated
worktree. A merger receives integration ownership explicitly. Workers leave
CURRENT, HANDOVER and this file to the coordinator.

The first assignment is #101. It owns the Choice/option model, source recognition,
mapping and writing, explicit-body operations, flow projection, real Story controls
and affected tests. No other implementation writer starts against those interfaces
before that checkpoint is integrated. Later assignments must declare overlap.

## Dependencies and approved design

GitHub native blockers were checked at entry:

- #101 depends on closed design handoff #99 and is ready.
- #102, #103 and #104 depend on #101.
- #105 and #106 each depend on #102, #103 and #104, independently of each other.

Use Story Combined v1, `story-revamp` / `combined`, revision `combined-v1`,
pinned in [the approval record](../../design/story-revamp/approval.json).
[Choice controls](../../design/story-revamp/README.md#post-delivery-revision)
guide this feature in the current editor. The full workspace and palette remain
with #110. Material uncovered design decisions require a preview and Kris's
approval before production edits. Kris authorized separate design chats named
`Choice Spec - {description}` for that iteration and approval handoff.

## Verification and operation limits

Use the spec's selected public app-controller/core-command boundaries for source,
history, reopen, exact patches and draft/conflict refusal. Apply TDD one behavior
at a time. Inspect affected consumers before changing shared models. Lab evidence
establishes design only.

Development is on macOS ARM64. Affected runtime behavior requires macOS ARM64 and
Windows x64 qualification under host routing. Linked SUNDOWN answered at entry;
its OS, checkout and tools need verification before assignment.

SDK qualification for the entire #98 outcome is capped at 20 harness invocations
per host, including failed or cancelled starts. One invocation may launch compile,
lint and named normal-play children; retain each child's result without charging
them again as harness starts. This allows focused coverage across six tickets and
bounded corrections. The #101 implementer may use at most four Mac invocations
from the shared ceiling after cheap fixture preflight and official pinned-SDK
verification. Windows runs remain coordinator assigned. Usage is Mac 3/20,
Windows 0/20, zero reservations.

Native editor/package and manual CI campaigns need recorded selection and limits
before starting; none has started. Routine compilation, focused tests, review and
automatic PR checks need no numerical allowance. Historical arithmetic and
protected native-session limits remain separate and unchanged.

## Next action

Entry records passed `python3 scripts/validate.py` for 1,883 repository files and
`git diff --check`. At entry, CURRENT was 317 words and HANDOVER was 901 words;
both were within their maintenance targets. No product tests or runtime operations
ran at entry.

The fresh merger integrated #101 in normal merge
`c9055fb673214365271f6ec557c92c00ce7b5f8b`. The coordinator resumes sole ownership
of `codex/choice-98` and live status on the merger's return. Next actions are the
draft PR, Windows qualification and dependency-ready ticket assignments, followed
by combined review. The worker's managed worktree and temporary evidence remain
retained. No acceptance or ticket closure follows from this merge.

## #101 implementation return

The worker delivered ordered option bodies, stable mapped Choice/option identities,
legacy source-map refinement to schema 9, shared continuation, explicit body
commands/history, flow inspection and production Story controls. Approved lab
source and coordinator records were untouched. Nested bodies/Calls, prompts,
locked options, Repeat and picked-state behavior remain later tickets.

Worker checks passed 107 Scene, 16 Source and five metadata tests, targeted
identity/migration tests, the production UI-to-core journey, browser route fixture,
frontend typecheck/build, formatting and repository validation. The Scene group
retained seven explicitly ignored specialist cases. The frontend suite reported
391 passes and one environment failure: its existing Windows Studio validator
could not import `tomllib` with the selected Python. No skip or installation was
added. The targeted resolution below preserves that original full-suite result.

Mac SDK use is three harness starts. Start 1 reached shared continuation but its
driver timed out at game end; start 2 exposed an invalid post-game store assertion.
Both are retained harness failures. Start 3 passed all 14 named children, covering
compile/lint, Yes/No convergence once, Jump, callerless Return, caller resumption
and a deliberately wrong outcome rejected at the expected assertion. Every run
reported owned scratch cleanup complete. SDK 8.5.3 archive SHA-256 was verified as
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The SDK-qualified source candidate was `a64b4bb1`; subsequent fixes affected editor
targeting, inspection labels and the negative oracle without changing generated
game source. The latest UI-to-core journey used the reviewed final Rust/UI code.

Detailed commands, red/green logs, authored receipts and per-child SDK results
remain in the worker's temporary `choice101-handoff.md`, `choice101-controller-07`
and `choice101-sdk-01` through `choice101-sdk-03` artifacts. Preserve them for the
target handoff and final audit. Windows x64 qualification, matching native/human
evidence and combined review remain pending. #101 is implemented, not accepted or
closed. No code was pushed and no PR was opened by the worker.

## #101 integration result

The fresh merger inspected the clean integration checkout at
`d91d9bea043048a45b192cc8baf171ed68179368` and worker
`070365fac417edba137c57841708574cd6ddbeb2`. Their common base was `15e90f2c`.
The integration-only changes were the three coordinator status/evidence files.
Normal merge `c9055fb673214365271f6ec557c92c00ce7b5f8b` completed without conflicts
or implementation edits. Source/body/mapping, completion/flow, Story controls,
caller migrations and fixture changes showed no material integration defect.
This bounded inspection does not establish feature acceptance or visual fidelity.

The merged `app` tree is exactly the worker's
`c78205212d927e3bf86e1680ebaee3a88ccfe30f`; the `tests` tree is exactly
`3c1c6cd689ede5c361c1cd9101f2e7fa5f013cb3`. The only worker-to-integration
differences are CURRENT, HANDOVER and this record. Approved lab/design source is
unchanged. Worker checks therefore apply to the same implementation inputs;
this documentation successor adds no new product-test candidate.

Integration checks passed `python3 scripts/validate.py` for 1,887 repository files
and `git diff --check`. No combined implementation change required another product
test campaign. The coordinator found an existing complete Python 3.12.16 with
`tomllib`. With the existing locked Node toolchain, the merger ran
`HARNESS_PYTHON=<existing-python-3.12> node --test dist-tests/tests/windows-studio-probe.dom.test.js`
in the retained worker's `app` directory using its existing compiled tests. All
eight tests passed, with zero failures or skips. `choice101-merge-windows-studio.log`
retains the result. This resolves the known interpreter failure at that file's
boundary; the original full-suite run remains 391 passes and one failure and was
not repeated. No install, source edit or test exemption was needed.

Read-only comparison of SDK 3's frozen authored receipt with final
`choice101-controller-07` found only fresh fixture entry/target UUID labels.
Replacing those exact labels made every runtime source value equal. The current
driver hash equals SDK 3's recorded driver hash. Its retained wrong-outcome child
also satisfies the strengthened validator's exact failing-assertion check.
`choice101-merge-checks.json` retains this comparison. SDK proof remains bound to
`a64b4bb1` and its frozen fixture; it is reused only for those unchanged runtime
semantics. No SDK, browser, native, package or CI operation ran in this merge pass.
Usage stays Mac 3/20, Windows 0/20, zero reservations. Windows qualification,
matching native/human evidence, draft publication, remaining tickets and combined
review remain coordinator-owned. All work is local-only, and worker artifacts
remain retained.
