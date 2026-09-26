# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b **G1-O1 verified-candidate feasibility proof**.
**Outcome:** investigation complete, **NO-GO**; G1-O1/G1-V1 `blocked`.
**Branch:** `feature/phase-1g-branches-runtime`.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Entry:** `1c87e2c952e67c6e39b02cf6ba6990881f9a347d`.
**Native prototype candidate:** `b3d696533290d91bc2ff7d4eb65562d2c68642e1`.

The user selected G1-O1 only, including publication and stop. Fresh refs matched the
entry; the clean existing checkout was fast-forwarded without discarding work. No
other visible active repository writer was found; unpublished cross-host work is
not independently observable. Main remains `4d7ba03`; no integration/reset/rebase.

## Findings and evidence

[Ledger 18](../tasks/active/phase-1g-branches-runtime-git.md#18-g1-o1-verified-candidate-feasibility-proof--2026-09-27)
contains the full old/new safety map, counts, all timings, native stage costs, artifact
hashes, counterexamples and remaining proof gaps. [ADR 0009](../adr/0009-flow-observation-candidates.md)
now records the rejected feasibility result.

- All new implementation paths are test-only; production flow, public transaction
  reads/writes, runtime authority and renderer are unchanged. Mandatory fresh hashes
  remain: 1,006 cold / 503 warm / 504 accepted edit; 105,627 fixture source bytes,
  500 nodes, 2,000 edges. Explicit dirty events are not production hook coverage.
- **G1-O1-S1:** same-byte replacement after verifier leaf open changes the current
  pathname identity while the old opened object still matches the candidate. Two
  deterministic local macOS counterexamples reproduce the reader and fresh-graph
  failure. They were added after the native candidate; green execution of those
  reproduction tests is negative evidence, not safety acceptance. The prototype
  must not be promoted. The permitted final-window race does not excuse this earlier
  replacement before the full verification read.
- Exactly one [native run 36278262505](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36278262505),
  **attempt 1**, on the exact candidate above completed **FAILURE**. Windows job
  **108505073512**: safety 10 pass; all three timing samples fail. Accepted
  **563.983 / 574.858 / 586.393 ms**; warm **570.423 / 584.464 / 581.168 ms**.
  macOS job **108505073353**: safety 11 pass and all three timing markers pass;
  accepted **98.776 / 63.796 / 66.989 ms**. All cold samples <2 s. The 250 ms limit
  and <=240 ms engineering allocation were not relaxed.
- Both complete job logs and artifact ZIP sizes, SHA-256 and CRCs verified; exact
  archive identities are in the ledger. Rust 1.90.0 on both; macOS 26.6.2/APFS,
  Windows Server 2025 10.0.26100. Windows filesystem type was not captured correctly
  by the OS/volume table output and is a gap. No package/executable hashes claimed.
- Local full core regression: 196 pass / 7 ignored before final test instrumentation;
  final focused prototype suite: 12 pass before adding the two negative reproducers;
  the two counterexamples both reproduced. Final formatting/workflow shell syntax/repository (264 files)/whitespace
  checks pass. Official SDK ignored gates remain unrun.

## Limits and next bounded action

G1-O2 is not eligible. Resource-exhaustion injection, complete allocator/OS descriptor
peaks, every prototype boundary and poisoned-index Source retention cases remain
explicit gaps. Source-batch accounting and reader release were measured; do not
promote their bounds to a whole-process memory/descriptor claim. Nonempty authoring
and media dependencies deliberately fail closed in this harness. Production mutation,
metadata dependency and actual Branches cancellation integration remain separate.

**Next separately selected checkpoint: G1-O1-R — review the failed feasibility proof.**
Review a final leaf pathname-to-object binding and a credible Windows secure-open
cost model using the recorded 482–503 ms verifier times and syscall counts. Decide
whether a bounded corrected prototype can qualify the same contract or whether a
new design is needed. This selector does not authorize implementation or CI by itself.
Do not wire production, weaken checks, retry timings to select a winner, or dispatch
packages. No operation from this run remains pending and no automatic watcher exists.

## Preserved state and publication

G1/R1/R2 final-source acceptance remains incomplete. Prior production failure
`36210484651` (Windows 616.686 ms), macOS G1-V2 evidence, completed profiles
`36213357271`/`36218397984`, and earlier R1 closure remain preserved on their actual
inputs in ledger 13–17. No physical test, acceptance, merge, optional Git or Phase 2.

The final publication adds two negative counterexample tests, a workflow guard that
refuses their marker before further profiling, and documentation to
native candidate `b3d6965`; it changes no measured reader behavior. Resolve the actual
published head from Git/PR. No receipt-only self-SHA commit or local-only work is
intended to remain. Keep PR draft/open and stop after verifying publication.
