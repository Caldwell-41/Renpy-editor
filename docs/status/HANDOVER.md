# Current checkpoint handover

**Prepared:** 2026-09-23 (Australia/Brisbane).
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** independent 1F-CLOSEOUT-CORRECTION review complete; closeout **blocked** on F4 (P2).
**Reviewed application:** `f452d0a8c1599b05650ae2e835d14d9f86f14653`.
**Evidence:** [production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675), attempt 1, success.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Review entry head:** `01e9a857f447f3ffa1d6fe0c1f15ee5b2dd3eca7`; all changes after the application candidate were documentation.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`.
**Authority:** independently review F1–F3 against #88, preserve native Save passes, publish findings and stop. No fix, redispatch, merge, branch deletion or Phase 1G.
**Canonical findings:** [ledger section 7.25](../tasks/active/phase-1f-save-correction.md#725-independent-correction-review--f4-blocks-closeout).

## Review result

F1's core review binding closes the inspected stale-write path. F2 retains the selected
Beat insertion anchor and verifies persisted ordering. F3 clears Characters/default-layer
uncertainty on Background while retaining unrelated uncertainty. No additional findings
in F2/F3. F1 remains incomplete because of the new F4 availability regression.

**F4 (P2):** unchanged selection retention leaves Apply Both disabled. The controller
updates controls while the completed retention remains in its pending map, then removes
it without updating controls again. A Source textarea click/selection reproduces
`pending=false`, `disabled=true`, zero Apply Both calls and no stale-review notice.
A normal unchanged background observation does not repair it. Both retained DOM and
real Chrome probes assert required behavior and fail. The application was not changed.

The next bounded correction should update controls after retention cleanup while
preserving current-document/disposal guards, newer pending input, failure handling and
stale-review refusal. Promote the retained probes into normal regressions. This is a
recommendation for a separately selected checkpoint, not execution authority.

## Validation and preserved evidence

Fresh #88 metadata/logs independently confirm exact SHA/attempt and successful Preflight,
Windows and macOS jobs. New JSON/core and race tests ran on both targets. Core totals:
147 Windows / 153 macOS passed; 0 failed; 4 ignored worker entries each. Explicit SDK
and desktop gates passed. All four retained artifact ZIPs matched fresh metadata hashes
and sizes and passed CRC checks; both smoke reports have all assertions true and five
checkpoints. Links/hashes remain in ledger 7.24. No installer was run or package rebuilt.

Local typecheck and all 38 normal tests pass; original F1–F3 probes: 3 pass. New F4 probes:
1 DOM failure and 1 browser assertion failure. The green suite does not cover the new
finding. Node/npm differ from pinned CI; no Rust/SDK rerun was necessary for review.
Repository/link/privacy and whitespace validation passed. Review publication contains
only documentation and diagnostic probes, with no application or workflow changes.

All six user-reported #87 native Save passes remain intact; #87 installations and macOS
26.6.2 were confirmed, numeric Windows build unspecified. No native #88/F1–F3 observation
is claimed. Do not repeat unchanged Save cases. F2/F3 require no additional native gate
for this targeted review. After an authorised F4 fix, focus native follow-up on Apply
Both selection re-enabling and stale draft/external refusal using verified corrected
packages. Existing #88 cannot validate a future fix.

Local legacy Python SDK testing remains 23 pass / 1 `os.killpg` permission error.
DIST-MAC-01 remains outside Phase 1 scope. Phase 1F stays unaccepted and PR #14 draft.
No pending production operation exists. No branch cleanup or Phase 1G is authorised.

## Publication and next boundary

Publish this review ledger, retained red probes and handover on the existing branch,
and post the finding on PR #14. No application fix is included. Stop after verifying
publication; do not automatically dispatch a correction or repeat the review.

Optional next-chat selector, only if the user chooses the correction:

```text
Correct only F4 in Caldwell-41/Renpy-editor on feature/phase-1f-source-synchronisation,
draft PR #14. Read AGENTS.md, HANDOVER.md and correction ledger 7.25. Preserve F1–F3
safeguards and all native Save passes. Fix settled-selection Apply Both availability,
promote the probes, validate locally, publish and stop. No production dispatch, merge,
branch deletion or Phase 1G.
```
