# Current status

**Updated:** 2026-09-27.
**Current checkpoint:** G1-OBS `awaiting_ci`; observed Branches implemented.
**Branch:** feature/phase-1g-branches-runtime, draft/open
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Implementation candidate:** 1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88.
**Native qualification:** [36289951468](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36289951468), attempt 1, both targets verified running.
Read [HANDOVER](HANDOVER.md), [ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md)
and [ledger 22](../tasks/active/phase-1g-branches-runtime-git.md#22-g1-obs-observed-branches-implementation--2026-09-27).

Branches now uses session-owned observed source inputs with accepted-mutation
invalidation. Open/focus/Refresh acquires disk observations, Source reconciliation
retains drafts/conflicts, and status distinguishes last check, saved edits and failed
refresh. Graph navigation, writes and execution keep their independent authority.
The Branches timer/all-source verification pass is removed. Historical native/timed
namespace experiments remain preserved and explicitly specialist, with ordinary
path/link, external-writer, recovery, session and process/privacy regressions retained.

Local release Windows G1-U2 passed three fixed samples: accepted updates 41.25–44.76 ms,
initial/explicit refresh 242.97–253.91 ms. Chromium interaction p95 was 3.6 ms during a
pending refresh. Local core/Source/renderer checks are recorded in ledger 22 with
capability/SDK exclusions. Supported-target qualification is still pending; no native
CI pass, package result, final human acceptance or integration is inferred.

G1-OBS remains the only selected checkpoint. After its bounded Windows/macOS run,
collect results and publish the handover, then stop. R2/final 1G package and human work,
optional Git, Phase 2 and merge are outside this selection. Existing historical
worktree and local G1-O1/O1-N raw evidence remain preserved.

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
