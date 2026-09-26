# Current status

**Updated:** 2026-09-27.
**Current checkpoint:** Phase 1G.2b G1-V1 observation redesign review is
`review_ready`; G1-V1 remains `blocked` on native feasibility. No implementation
was performed in this design-review checkpoint.

Continue `feature/phase-1g-branches-runtime`, draft/open
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
Read [HANDOVER](HANDOVER.md) and
[ledger 17](../tasks/active/phase-1g-branches-runtime-git.md#17-g1-v1-observation-redesign-review--2026-09-27).
The reviewed proposal is [ADR 0009](../adr/0009-flow-observation-candidates.md).
The next separately selected implementation checkpoint is **G1-O1: verified-candidate
feasibility proof**, before production wiring. No CI dispatch is pending from this review.

Recommend a core-owned candidate index that removes duplicate acquisition of unchanged
source bytes while retaining fresh secure full-content verification of every source
on every refresh. A one-Scene edit would require 504 source hashes rather than 1,006.
Metadata/watchers/periodic audits cannot replace this verifier. Windows still needs a
proved reduction in duplicated secure-open work; index-only performance is unproved.
The accepted-update budget remains **<250 ms** and initial projection **<2 s**.

## Completed evidence and current blockers

| Evidence | Current assessment |
| --- | --- |
| Production [36210484651](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36210484651), attempt 1, `ec6a76adbf78bc09baf7daba067d70eedbc38699` | FAIL: Windows isolated accepted update 616.686 ms; downstream Windows package/runtime gates skipped. macOS full production job passed, accepted update 66.483 ms, rendered pan p95 58 ms, all five packaged real-service cases passed. |
| Profile [36213357271](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36213357271), attempt 1, `8303d4e057b2b137c770d65f7ab660bfbc5b1285` | Completed diagnostic: ~94% of Windows accepted-update time in secure source acquisition and verification. This is not a latency pass. |
| Concurrency [36218397984](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36218397984), attempt 1, `7e4234a041b446d01ad5244002f1ce945d58046d` | Completed diagnostic: Windows 501–784 ms across 1/2/4/8/16 readers. Tuning cannot close G1-V1. Temporary reader override/sweep retired; ordinary four-reader bound retained. |

G1 remains failed/incomplete. G1-V2 compositor work is retained with macOS evidence;
final cross-platform G1/R1/R2 and 1G acceptance remain incomplete. Preserve every
historical failure and prior pass under its actual inputs in
[ledger 14–16](../tasks/active/phase-1g-branches-runtime-git.md#14-1g2b-execution-ledger).
No new package, executable/hash verification or user acceptance is claimed.

G1-O1 must prove the secure reader and timing before production integration. G1-O2
must wire dependency-complete metadata, central mutation invalidation and actual
Branches cancellation/session ownership, then pass the enforced native real-service
budget gate. The diagnostic workflow alone does not enforce that budget.
Physical testing, merge, optional Git, Phase 2 and another full production/package
matrix remain outside the current checkpoint.

## Preserved baseline and earlier closure

- Integrated application: Phase 0, corrected Phase 1A–1F and CI-SIMPLE. Phase 1F is
  accepted/merged through [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
  Integrated closeout `973e3565d7cf41c6dca936df088ced10969821ac`; existing post-merge
  [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755)
  passed both targets and is closed. The six original Save passes and native F4 A/B/C
  reports remain preserved in [1F ledger 7.28–7.30](../tasks/archive/2026-09-23-phase-1f-save-correction.md#728-corrected-packages-and-native-f4-evidence).
  DIST-MAC-01 remains a later distribution limitation.
- Phase 1G.1 candidate `fde8cdafd77fe807f2307fb607fc7546ca66ffec` and targeted Linux
  evidence remain preserved; final target acceptance is separate.
- R1-B1/B2 closure: `c12d953548992adc60b38682d0dcfda8cdeb9f94`, tree
  `3f8f6e769672572b008b2ffb4f283888afecfc31`, native run `36148942247`, attempt 1,
  both targets passed with complete logs/artifacts and all 60 input hashes verified.
  Earlier prerequisite `36126490939` and production `36136466567` evidence is distinct;
  see [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger).
  Final-source regression remains part of 1G.2b.
- Main inspected for this review: `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
  Its bounded workflow-dispatch addition is already represented on the feature branch.
  No integration was performed here. Phase 1G is not merged.
- [Optional Git](../tasks/active/optional-local-git.md) remains deferred, not a
  Phase 1/1H or Phase 2-entry requirement. Editing during play remains script-only;
  asset mutations require Stop. One final human 1G session follows agent verification.
