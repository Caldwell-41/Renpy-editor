# Phase 1H — Integrated vertical-slice acceptance

**Prepared:** 2026-09-22.
**Planning:** approved for documentation publication and review.
**Execution state:** `not_started`.
**Entry:** Phase 1G closure and integration, accepted Phase 1F retained, fresh refs and
explicit user selection of 1H. Planning publication/merge does not authorise execution.
**Parent:** [Phase 1 plan](phase-1-vertical-slice.md).
**Prerequisite contracts:** [1G brief](phase-1g-branches-runtime-git.md), integrated 1F,
[TESTING](../../TESTING.md), [TRANSACTIONS](../../TRANSACTIONS.md), [UI](../../UI.md),
[SECURITY](../../SECURITY.md) and [WORKFLOW](../../WORKFLOW.md).

## 1. Purpose and preparation

Verify the implemented workflow from new project through real play and a reviewed local
Git checkpoint, on Windows x64 and macOS ARM64. This is acceptance, not permission to
hide missing features in the test milestone. Assign demonstrated missing behaviour to
its owning milestone and return with a bounded correction request. Preserve failed
evidence; never weaken an assertion to close the phase.

Inspect actual integration and current implementation branch/PR before creating a
matching acceptance branch. Record the exact final candidate, supported toolchain/SDK
versions, package hashes, host details and operation ownership. Use fresh checkouts and
isolated synthetic projects, never personal game assets or private paths in artifacts.
Preserve the Phase 2 planning prerequisite; no Phase 2 implementation starts here.

Create or extend one deterministic representative mini-game and an expected-outcome
manifest. Reuse [existing fixture intent](../../fixtures/REPRESENTATIVE_GAME.md) and
prior regressions where suitable, but demonstrate authoring through real production
services/UI. Handwriting a finished fixture alone does not prove the authoring workflow.
The manifest fixes expected source/metadata, route outcomes, values, media identities,
history effects and checkpoint file set. Record asset provenance/licences.

Normal Run Game begins at standard entry. A synthetic automation driver may exercise
choices and record outcomes, but must run the authored source and assert observable
dialogue/state/assets; launch success, screenshots alone, labels and entity counts do
not prove route correctness. Keep any test instrumentation isolated from shipped games.

## 2. Required matrix — all twelve parent cases retained

| ID | Scenario | Required observable evidence |
| --- | --- | --- |
| H01 | Create with local Git and pinned SDK | Successful staged creation; normal menu, save/load, preferences and history/rollback remain functional; failure does not expose a half-created project |
| H02 | Supporting authoring | Two Characters and Appearances, copied backgrounds/character images/music/SFX, bool/int/string definitions including an exact integer beyond JavaScript safe-integer precision; source, reload and runtime preserve intended values |
| H03 | Multiple Chapters/Scenes and Beats | Dialogue/narration, background/staging, appearance, Left/Centre/Right, supported transitions, music play/stop, SFX and assignments produce intended source and runtime state/assets |
| H04 | Unconditional Choice and two destinations | Both routes execute from normal entry to distinct expected outcomes; Choice/Jump/Return and common Scene/Source/Branches semantic edges agree; tree order does not change flow |
| H05 | Reorder/edit/history | Repeated undo/redo returns expected source, metadata, all projections and committed revisions; failed inverses/external boundaries do not overwrite newer bytes |
| H06 | Compiled Scene lifecycle | Compile, then safely move/delete a disposable Scene; incoming/unknown-reference policy, inverse operations and close/reopen hold; no orphan `.rpyc` or duplicate-label execution |
| H07 | Source and partial/external content | Supported edits synchronise Scene/Branches; opaque/incomplete/unmapped content stays exact; drafts, stale/partial state, safe Apply Both and refused overlap remain truthful; selection never guesses |
| H08 | Diagnostics, play and Git | Real compile/lint failures navigate safely; explicit trust and normal Run/Stop work; reviewed checkpoint tree contains exactly selected accepted changes with unrelated staging preserved |
| H09 | Restart and metadata independence | Close/reopen and continue editing with valid selection and durable accepted content; a copy runs without `.renpy-editor/`; editor reconstruction without metadata remains out of scope |
| H10 | Interrupted mixed transactions and recovery | Retain accepted and competing external bytes; inspect blocked state without executing project; explicitly resolve safe cases and continue; ambiguity remains blocked without deleting evidence |
| H11 | Session and completion races | Failed switch preserves current project; old-session requests, delayed/reordered success/error, cancelled import and rapid navigation cause no wrong-session write, obsolete selection or false Saved state |
| H12 | Bounds, discovery and sustained use | Metadata/resource limits and precision, discovery/case collisions and long terminal history preserve reloadability; successful authoring continues beyond the former journal-count boundary |

For each row record scenario/test name, exact expected/actual observations, command,
candidate, target, outcome and evidence location. A skip or unavailable target remains
open. Prior evidence can support unchanged requirements only under actual repository
policy; it cannot substitute for the integrated workflow on the final candidate.

## 3. Additional integration cases from the planning review

| Area | Required cases | Parent mapping |
| --- | --- | --- |
| Graph | Missing versus unknown targets, partial Choice, duplicate option text, self-loop, reconvergence, source navigation both directions, stale selection after deletion, declared size limit | H04, H07, H11, H12 |
| Draft preparation | Save All and continue, explicitly use saved revision, Cancel, refused Save All retains all input, dirty Source remains Pending validation | H07, H08, H11 |
| Trust | Untrusted open/preview/import/typing has zero SDK launch; reject stale grant after root/SDK or relevant executable change; revocation and copied-UUID rejection | H08, H11 |
| Runtime | Play beyond smoke timeout, continued authoring and earlier-revision status, no silent autoreload, targeted move/delete/inverse block, Stop-and-switch/Cancel, crash and descendants retaining pipes | H06, H08, H11 |
| Diagnostics | Multiline SDK failures, Unicode/spaces/BOM/newlines, absent location, deleted/out-of-scope file, stale revision, inert output, bounds/truncation and empty parsed list after failure | H07, H08, H11 |
| Git | First commit, no repo, missing executable/identity, binary/add/delete, source/metadata dependencies, selected partial staging, unrelated staging preserved, stale HEAD/index/review | H01, H08, H11 |
| Git failures | Hostile hooks/filters/config/helpers remain unexecuted; interruption around HEAD/index publication preserves evidence and recognises already-created commit | H08, H10, H11 |

Use deterministic fault injection and real process-termination tests where the owning
contract requires them. UI stubs alone cannot prove disk durability, process cleanup,
native keyboard delivery or Git contents.

## 4. Cross-cutting release-of-phase gates

- Golden-source no-op/minimal patches, exact Unicode/BOM/newlines, custom code and
  metadata unknown-field preservation remain intact.
- Transaction/recovery and single-instance boundaries, safe media presentation,
  hostile path/substitution denial, narrow IPC and packaged unauthorised-WebView
  probes pass with no new privilege/CSP exceptions.
- Review real rendered Scene/Source/Branches and supporting Runtime/Diagnostics/Git
  surfaces on both platforms against Quiet Studio Dark. Check keyboard-only operation,
  native Ctrl/Cmd shortcuts, accessible names, focus restoration, reduced motion,
  display scaling and narrow-window resize; no overlap/overflow or unreadable controls.
  Record any manual assistive-technology limitations explicitly; never call an
  unavailable accessibility check passed or silently transfer a mandatory gate later.
- Bounded graph/diff/output work remains responsive; synthetic graph-spike numbers
  do not establish production scale. Test declared limits and refusal behaviour.
- Privacy/secret scan and dependency/licence inventory finish successfully after
  packaged tests; a smoke checkpoint without terminal reporting is not acceptance.
  Keep logs synthetic/redacted and record evidence retention before artifacts expire.

Signing/notarisation, broad release distribution, mature graph scaling and Phase 2+
remain outside this acceptance. Report those limitations without misclassifying a
missing Phase 1 capability as deferred release work.

## 5. Execution, evidence and stop conditions

Start with the repository validator and cheap targeted tests. Follow current
[TESTING](../../TESTING.md) commands and the existing supported-target workflow.
Do not dispatch a packaging matrix for planning changes. During actual acceptance,
use one complete final matrix per changed candidate; do not rerun unchanged expensive
gates or use model polling. Capture run ID, attempt, SHA and remaining jobs before an
awaiting-CI/manual-resume handoff. Failed/skipped/cancelled are distinct from passed.

Partition scenarios so each reports its stage, monotonic timing, actual failure and
cleanup outcome; preserve a reliable final report even when an earlier assertion fails.
No one giant opaque smoke or timeout increase to mask a reporting defect. Fast DOM/
browser tests are useful but never replace the two native packaged targets.

Before closure produce an evidence matrix for H01–H12 and sections 3–4, including exact
commands/counts, manual checks, failures and limits. If any required behaviour fails,
1H is `blocked` with its owning correction identified. Fixing a harness cannot turn a
missing product behaviour into success. A changed candidate needs applicable renewed
evidence, with no invented cross-SHA equivalence claim.

Update this ledger and the one live HANDOVER/CURRENT at execution handoff; retain the
actual implementation/acceptance branch, PR and exact outstanding operation. Stop at
`review_ready` for independent user review. Phase 1 acceptance, merge and transition to
Phase 2 are separate decisions. On authorised integration, verify main, consolidate
canonical lessons and archive completed plans while preserving unique failed evidence.

## 6. Planning publication record

This brief and the [1G planning record](phase-1g-branches-runtime-git.md#10-planning-coverage-and-review-record)
form one documentation checkpoint on `docs/phase-1g-1h-planning`. All acceptance rows
are planned and unexecuted. Active 1F CURRENT/HANDOVER and correction evidence remain
owned by PR #14; no replacement handover or application change is introduced here.
The next permitted action for this PR is documentation review. Starting 1G.1 requires
integrated/accepted 1F and a user-selected goal; starting 1H requires integrated 1G.
