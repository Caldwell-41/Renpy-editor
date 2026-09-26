# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b G1-V1 observation redesign review, `review_ready`.
**Capability state:** G1-V1 `blocked` on native feasibility; no implementation yet.
**Branch:** `feature/phase-1g-branches-runtime`.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Reviewed entry head:** `f1e24d5f3a22ccbaa4a0978ab03fdcae508daf43`.
**Last production application candidate:** `ec6a76adbf78bc09baf7daba067d70eedbc38699`.

The user authorised documentation-only adversarial design review and publication,
then stop. Fresh refs/PR/worktree showed no newer implementation or local work.
Cross-host unpublished work is not independently observable; inspect again before
continuing. Main `4d7ba0333c48d60242a9a42d3e079fea499a5531` contains a profiling-dispatch
addition already represented on the feature branch; no reset/rebase/merge was needed.

## Reviewed decision

Read [ledger 17](../tasks/active/phase-1g-branches-runtime-git.md#17-g1-v1-observation-redesign-review--2026-09-27)
and [ADR 0009](../adr/0009-flow-observation-candidates.md).
Use a core-private candidate index, retaining bounded source bytes/revisions, with
**mandatory fresh secure content verification of every source after projection on
every refresh**. Reacquire only cold/dirty/missing candidates. No watcher, timestamp
shortcut, persisted index, long-lived leaf handles or cached write/trust authority.

For 503 source files, normal one-Scene update work becomes 504 source hashes rather
than 1,006. That alone is insufficient Windows proof: qualify a narrow consolidation
of duplicate per-file secure-open/metadata queries without losing any safety boundary.
The engineering allocation is <=240 ms; the actual success requirement remains
**<250 ms**, with no stale/timeout/background-result substitute. Initial remains <2 s.

The reviewed design covers external edits/replacements, inventory and namespace races,
transaction invalidation, restart, limits, cancellation, stale states and alternatives.
Remaining risks: Windows timing margin; the compound reader's per-boundary proof;
complete authoring/loader dependencies; production mutation-hook coverage; and actual
Branches cancellation context. Existing per-file optimistic observation is not an
atomic snapshot. ADR 0004 write checks and ADR 0008 runtime inventories remain unchanged.

## Existing evidence — completed, do not duplicate

- Production `36210484651`, attempt 1, candidate above: Windows accepted update
  **616.686 ms**, FAIL; downstream Windows packages/runtime gates skipped. macOS
  complete production job passed, **66.483 ms** update and **58 ms** pan p95.
- Profile `36213357271`, attempt 1, `8303d4e057b2b137c770d65f7ab660bfbc5b1285`:
  ~94% of Windows time is secure acquisition/verification; whole update **588.586 ms**.
- Concurrency `36218397984`, attempt 1, `7e4234a041b446d01ad5244002f1ce945d58046d`:
  Windows readers 1/2/4/8/16 gave **508.416 / 536.401 / 749.559 / 784.488 / 501.102 ms**.
  macOS all <106 ms. Diagnostic success is not budget acceptance. Reader sweep retired.

This review read target logs and fresh job/artifact metadata; it did not redownload
archives or claim additional package/input-hash verification. G1/R2 remain incomplete;
prior R1 closure and G1-V2 evidence are preserved on their actual candidates.
No run is pending from this review; no workflow was dispatched.

## Exact next checkpoint

**G1-O1 — verified-candidate feasibility proof only**, when the user selects it.
Implement the core-private test-driven prototype and narrow secure-reader proof in
[the checkpoint plan](../tasks/active/phase-1g-branches-runtime-git.md#implementation-checkpoints).
Reuse the fixed fixture and real Scene transaction; leave production flow/write paths
unwired. Record full read counts and native suboperation costs, prove hostile-path and
same-length external-write correctness, then run one cheap Windows/macOS profiling
job pair with three fixed samples per target. No reader sweep or broad matrix.
Publish PASS/FAIL/gaps with exact inputs and stop. If proof or <250 ms timing fails,
remain blocked; do not implement a weaker cache or advance to G1-O2.

Only after a reviewed G1-O1 pass may a separately selected G1-O2 wire production
invalidation, metadata dependencies and cancellation and enforce the unchanged
real-service budget gate. The current profiling workflow does not set the enforcement
variable: a green diagnostic run alone cannot qualify production readiness.

## Validation and publication

Documentation-only changes: ledger 17, proposed ADR 0009 and ADR index, CURRENT and
this single HANDOVER. `python3 scripts/validate.py` **PASS (258 files)**;
`git diff --cached --check` **PASS**. Local links, five-file docs-only scope and
adversarial document review passed. No application/physical testing or production dispatch
was performed. The published commit contains these documents; resolve its actual head
from Git/PR rather than making a self-referential receipt commit. No local-only work
is intended to remain after verified publication.

Stop before physical testing, acceptance, merge, optional Git, Phase 2 or a full
production/package matrix. The next prompt selects G1-O1 only; this plan does not
itself authorise later checkpoints.
