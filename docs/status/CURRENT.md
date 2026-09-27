# Current status

**Updated:** 2026-09-27.
**Current checkpoint:** **G1-O1-N native observation-boundary experiment** complete,
review_ready investigation; capability **NO-GO**. G1-O1/G1-V1 remain blocked,
G1-O2 ineligible. Continue feature/phase-1g-branches-runtime, draft/open
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
Read [HANDOVER](HANDOVER.md),
[ledger 20](../tasks/active/phase-1g-branches-runtime-git.md#20-g1-o1-n-native-observation-boundary-experiment--2026-09-27),
[pre-registration and findings](../tasks/active/phase-1g-g1-o1-n-experiment.md),
the [prior review](../tasks/active/phase-1g-g1-o1-r-review.md) and
[ADR 0009](../adr/0009-flow-observation-candidates.md).

The isolated Windows native primitive passed ordinary-file, external writer/mapping
and eight restored-time same/different-byte replacement assertions. The one ordered
safety test then **failed** because hostile leaf-symlink setup was denied with
Win32 1314. The missing-capability stop fired: **no retry, timing batch, metadata/
inventory probe, security change or CI dispatch**. Hostile parent/reparse,
remaining link, cancellation/error/resource and whole-graph evidence is missing.
This is incomplete safety qualification, not proof that native relative I/O cannot work.
The primitive stays test-only and unqualified; no production wiring was made.

No native process remains pending. The next separately selected action is a
read-only follow-up review of the missing qualification capability and retained
composition before any newly authorized experiment. No automatic retry or later
checkpoint is authorized. Freshness, cadence and <250 ms successful refresh /
<2 s cold gates remain unchanged.

Historical test-only candidate b3d696533290d91bc2ff7d4eb65562d2c68642e1 and native
run [36278262505](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36278262505),
attempt 1, remain **FAILURE**. Windows accepted 563.983 / 574.858 / 586.393 ms;
local Windows 460.195 / 464.211 / 456.588 ms; all exceed 250 ms.
macOS 98.776 / 63.796 / 66.989 ms passes historical timing only, not corrected safety.
The original S1 counterexamples and workflow guard remain intact. The local
162.344 ms maximum other-work cost leaves at most 67.656 ms for a corrected verifier
at the 230 ms engineering ceiling; no new verifier timing exists.

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

G1-O1 did not prove the secure reader or Windows timing; production integration remains blocked. G1-O2
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
