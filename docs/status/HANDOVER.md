# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** **1F-CLOSEOUT-CORRECTION**, **review_ready**; automated validation complete, stop for independent review.
**Corrected application candidate:** `f452d0a8c1599b05650ae2e835d14d9f86f14653`.
**Run:** [production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675), **attempt 1**, terminal **success**, `upload_packages=true`.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Verification entry head:** `caad2ad0fcedf5af3251568d493d1cdf8e4d7510`; only documentation changed after the tested candidate.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`.
**Authority:** user resumed to verify #88 without redispatch, publish results, and stop for independent review. No merge, branch deletion or Phase 1G.
**Detailed evidence:** [ledger sections 7.23–7.24](../tasks/active/phase-1f-save-correction.md#724-build-88-corrected-candidate-verification).

## Completed correction and verification

F1 binds Apply Both to the exact reviewed base/draft/external revision and combined
text, checks before/after retention, and rejects stale confirmation while preserving
drafts/external bytes. F2 retains Preview's selected Beat insertion anchor. F3 clears
Characters and default-layer uncertainty on Background while preserving unrelated
uncertainty. All three retained probes were reproduced red then promoted to passing
normal regressions. Real JSON/core persistence, stale-session and commit-race tests
exercise the corrected candidate; existing transaction/recovery guarantees remain.

Build #88's exact SHA/attempt, terminal jobs, logs and downloaded artifacts were
verified. Preflight `106762105167` passed 38 frontend tests, typecheck, browser Save
regression and formatting. Windows `106762349561`: 147 core passed / 0 failed / 4
ignored workers; macOS `106762349306`: 153 passed / 0 failed / 4 ignored workers.
All new correction tests ran on both targets. Desktop boundary: 1 test each passed.
Explicit official-SDK lifecycle/Scene/Source and network-handoff gates passed; the
initial general-sweep SDK skips were followed by actual explicit runs. Only the
cache-miss download workflow step was skipped after cache hits.

Both packaged smoke reports have all assertions true, complete traces and five
checkpoints. Secret scans, inventories and package/evidence uploads passed. All four
ZIPs matched GitHub size/SHA-256 metadata and passed CRC checks; installers are present.
Download links and installer hashes are in ledger 7.24. No installer was run here.

This verification changed documentation only. No new workflow was dispatched, no
application input changed, and no further package run is warranted. No production
operation remains pending. Publish this evidence on the existing branch/PR; keep the
worktree clean and stop for independent review.

## Remaining review and limitations

Phase 1F is not accepted or merged. Independently review candidate `f452d0a8` against
findings F1–F3 and the exact #88 evidence. Do not assume CI success grants acceptance.
Assess whether focused native F1–F3 testing is needed using the verified #88 packages;
no native #88 installation or manual correction pass has been claimed.

Preserve all six user-reported native Save passes from #87. The user confirmed #87
installations and macOS 26.6.2; Windows was “the latest windows version”, without a
numeric build. Do not ask to repeat unchanged native Save cases. Local legacy Python
SDK testing remains 23 pass / 1 `os.killpg` permission error; the new CI Rust/official-SDK
passes do not erase that local result. Local Node/npm differed from pinned CI; #88
provides the pinned-toolchain evidence. DIST-MAC-01 remains outside Phase 1 scope.

PR #14 stays draft; preserve all branches and active 1F records. No merge, cleanup,
signing work, duplicate planning or Phase 1G implementation is authorised.

Next-chat selector:

```text
/goal — Independent Phase 1F correction review only
Repository: Caldwell-41/Renpy-editor. Continue feature/phase-1f-source-synchronisation
and draft PR #14. Read AGENTS.md, docs/status/HANDOVER.md and correction ledger 7.23–7.24.
Review candidate f452d0a8c1599b05650ae2e835d14d9f86f14653 against F1–F3 and build #88,
35732725675 attempt 1. Preserve native Save passes; assess only affected missing evidence.
Publish findings and handover, then stop. No redispatch, merge, branch deletion or 1G.
```
