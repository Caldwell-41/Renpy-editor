# Branch reconciliation and SDK carry-forward — 2026-09-15

This is a branch-integration record, not closure of the Phase 1A–1D corrective gate.

## Scope

The user approved retirement of already-integrated branches and selective preservation
of the missing SDK network-install correction. No old feature branch was merged
wholesale, no history was rewritten, and no later milestone was implemented.

The baseline main commit was `0e5e8b697782ed29d61d01dbb1240b9d16561c27`.
The active branch was `corrective/phase-1a-1d-integrated` at `c1aba88266e3bafbb1a0ca84469989a1e427519a`.

## Incorporated branches

Run `34935167989`, job `104271409180`, independently verified ancestry or exact
repository-tree equivalence, unchanged branch tips and the absence of open PR
references. It then deleted and verified the following six refs:

| Retired branch | Last tip | Main integration |
| --- | --- | --- |
| `ci/cost-controls` | `3e2e5db8dc9e0ed89e369b532f6c7b29856917b2` | Same commit, ancestor of main |
| `security/public-release-hardening` | `a4909a5aa7843b455ddd980249166e89bf98dfa2` | PR #2 / `3aa30bf604f73395b820c2ff343c9e5f5851aac9` |
| `phase1c-corrective` | `5fe37d3a538d5d0514eb0347b15c7878d234c084` | PR #3 / `6040682521e69e0980a863fa80d3ab12463ddac8` |
| `phase1c-corrective-targets` | `136adc9ba14c7820980e8c3c7a7273f06db4cdbd` | PR #4 / `08daf385246c345f53f46f9dedc43762a1c060e9` |
| `phase1c-corrective-closure` | `907bab039a47e1d68baeb7fb20138e4d8d0639d9` | PR #5 / `146a3033e6af5c57a0b23f8f627b29780268f4f9` |
| `phase-1c-crash-consistency` | `91b89dc5b1dc35e8aa321be61eb569218f5e93ce` | PR #6 / `d405820b355be026dacd1905b665d38440828374` |

The five PR integrations are squash commits with exactly matching tracked trees, not
missing changes inferred from ahead/behind counts. Their source commits and PR
records are historical evidence; they are not ongoing work branches.

## Remaining source branch: delta classification

The full net delta from `d405820b355be026dacd1905b665d38440828374` to
`phase-1c-network-install-fix` at `46404b4b34afa96174b1000193a7028bb14eb972`
was reviewed in the cleanup job's log. It has three meaningful change groups:

1. The network download calls an already-prepared installer, preserving its own
   active `.partial`. This behavior was missing from main and the integrated branch
   and is the selective correction designated **N1**.
2. Retrying interrupted provenance migration was already covered by the newer main
   implementation, which checks provenance before SDK execution and quarantines
   rejected embedded provenance rather than deleting it. The old deletion helper
   must not replace that newer behavior.
3. Private-stage creation and related directory helpers represent an older approach.
   Main's `9e726892251e061219c2c0e2fd90d3b23c16ac5d` already introduced the retained-
   parent `create_project_stage` boundary, anchored writes/flushes and deterministic
   parent-substitution regression. The old `create_private_stage` and its dedicated
   `create_new_child` helper are not copied into the newer design as duplicate APIs.

## N1 contract

Prepare/recover managed SDK state once before a new network download, not again while
its active download is being installed. The transport remains a private core seam;
public archive installation still prepares once through its wrapper. Preserve pinned
URL/checksum, TLS and redirect policy, platform flushing, archive validation,
provenance-before-execution and the existing install checkpoint hooks.

The production function delegates to a private injectable download closure. Tests
inject bytes or copy the verified official archive to the actual active-download
location, then execute the real checksum/extraction/provenance/version/reuse path.
They do not mock archive validation and do not claim to test live HTTP transport.

Three synthetic tests cover current versus stale partials, failure/retry cleanup, and
preservation of caller-owned archives. The official-archive test verifies installation,
provenance and reuse without a second download. Its explicit no-archive skip marker is
not SDK evidence. The full production workflow must invoke this test after obtaining
the official archive and require `phase-1c-network-handoff-gate: passed`.

## Executed evidence and published correction

The first run `34935167989` reproduced the failing baseline, then passed the corrected
core suite (100 harness passes, four ignored subprocess workers; SDK wrappers skipped
without archive). It stopped because Clippy was not installed for the pinned Rust
1.90 toolchain. The run remains failed evidence, not a supported-target pass.

The follow-up maintenance commit `f5d800abb3e037b77ba233dbc2d5e9dab83a4e3a`
installed Clippy without weakening warnings or changing the tested SDK patch.
[Run 34935598838](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34935598838)
completed successfully:

| Job | Result and scope |
| --- | --- |
| `104272687454` — regression | Baseline fails with the expected I/O error; corrected core suite: 100 harness passes, four ignored workers; strict core Clippy and repository validation pass. Two SDK wrappers skip without archive and are not counted as runtime evidence. |
| `104272968339` — Windows x64 | Three synthetic SDK handoff tests and the explicit official-archive handoff/reuse gate pass; required passed marker verified. |
| `104272968340` — macOS ARM64 | Same exact source/test blobs; synthetic tests and explicit official-archive handoff/reuse gate pass; required passed marker verified. |
| `104273669818` — publication | Re-materialises only the exact tested blobs, removes temporary scripts/workflow, validates the staged tree and pushes to the unchanged corrective head. Archives and retires the unchanged source branch. |

Published application commit: `02fc772d93fbe6b0709691bad15a4307a0193c93`.
Verified Git blob identities used by all target jobs and publication:

- `app/src-core/src/renpy.rs`: `b1841452ebff6f44566c60a40b308b2dc03c1775`.
- `app/src-core/src/renpy/reconciliation_tests.rs`: `4dc95d31a635a47a3126564534bfc83aa530f667`.

Compared with `c1aba882`, the application delta is only `renpy.rs` (45 insertions,
13 deletions) and the new 137-line regression file. Temporary reconciliation
machinery is absent from the final tree. A small follow-up production-workflow change
runs the same SDK gate alongside the existing cached-archive lifecycle gate and
retains its lightweight log. It does not add a second matrix or change triggers.

The source branch was preserved as the lightweight archive tag
`archive/phase-1c-network-install-fix-2026-09-15`, pointing to exact old tip
`46404b4b34afa96174b1000193a7028bb14eb972`, then its unchanged branch ref was removed.
The archive preserves the entire old history, including superseded alternatives.
Only `main` and `corrective/phase-1a-1d-integrated` remained after verification.

This is targeted core/SDK acceptance, not a fresh full application matrix. Desktop
packaging, supporting-surface DOM behavior, the complete lifecycle/authoring SDK
scenario and the remaining R1–R7 regressions were not rerun or closed here.
Repository quality at the maintenance commits also passed; it is not production
acceptance.

## Full-gate boundary

R1–R7 remain open. This selective SDK correction and branch cleanup do not fix lexical
source recognition, metadata limits/identity, asset repair/discovery, stale UI,
resource-history bounds or the full packaged acceptance deficiencies. Main remains
unmerged until that work and the complete supported-target gate are finished.

Use only the current corrective branch for those remaining fixes. Do not resurrect
retired branch histories or reapply N1. After a squash integration, record the main
commit and retire the completed topic branch; start new tasks from updated main.

## Continuing work

Read [CURRENT](../status/CURRENT.md) and the
[existing R1–R7 follow-up](../tasks/archive/2026-09-15-phase-1a-1d-correction-follow-up.md).
N1 is implemented and should be preserved, not reimplemented by merging the archive.
Any final main integration still requires the complete corrected gate; this record
is not an approval to bypass that gate or begin Scene authoring.
