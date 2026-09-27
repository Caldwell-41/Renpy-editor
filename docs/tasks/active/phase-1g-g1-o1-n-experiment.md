# G1-O1-N native observation-boundary experiment

**State:** review_ready investigation; capability **NO-GO**. **Authority:** user selected G1-O1-N only on 2026-09-27.
**Input:** 79f2f84792f46a39140e81b33c5a569fc2e3a56f, feature/phase-1g-branches-runtime,
draft/open [PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
Follow the [review experiment](phase-1g-g1-o1-r-review.md#next-checkpoint-g1-o1-n-only).

Question: can secure directory-relative opening plus fresh final binding remove
enough repeated path work to make the complete refresh budget plausible?

## Pre-registration

One ordered native one-file safety sequence, one execution, stopping at the first
failed assertion or denied capability. Compile/format corrections before execution
are allowed and recorded; no retry of a failing native configuration. Run release,
locked, offline using the existing local Windows entry script/tools/cache, ordinary
host account, no elevation/security/affinity changes. Diagnostic source/diff hashes
and log/binary hashes are recorded locally before/after execution. Temporary synthetic
files live below the existing workspace temporary directory; no game/user data.

Order: ordinary read and fresh identity; invalid names/missing file/type; existing
writer and writable mapping; identical/different/restored-time replacement after open,
mid-read, after bytes and before binding; hostile leaf link; parent/root rename
attempts while pinned; same-identity retained-parent reparse conversion; cancellation,
deadline and injected boundary failure. Deterministic synchronous boundary hooks
establish order (no sleeps). Verify current replacement identity independently,
outside sentinel unchanged and no successful observation through an unsafe chain.
Failure means NO-GO and unexecuted suffix cases stay missing, never pass/skip.

The primitive maps canonical root/registration/recovery to entry/final checks;
fresh root and relative parent traversal plus retained attribute checks to each
chain boundary; checked read-only native leaf opens to initial/final name opens;
bounded chunked read/hash and before/after samples to content; two simultaneously
live leaves and a final chain bracket to binding. No atomic multi-file snapshot or
between-observation ABA guarantee. Historical readers and negative tests remain.

Only if the complete safety sequence passes, pre-register the fixed fixture batch
before executing it: same generator in scene/tests/candidate_proof.rs::fixed_fixture,
503 sources / 105,627 bytes / 500 nodes / 2,000 edges, four readers, one instrumented
and three fresh-process uninstrumented sequences, no warmups/retries/tuning.
Charge acquisition, canonical root, both leaf opens, all samples/read/hash/chain
checks, teardown, actual handle peaks and original cancellation/deadline.
Outer wall time includes all work; overlapping worker sums are not elapsed time.
No timing sequence is authorized by a partial safety pass.

Whole request: T = S + M + I1 + A + P + V + I2 + R + F + E. Retain unmodified
other-stage observations conservatively (maximum 162.344 ms); new V includes final
binding. Thus V must be <=67.656 ms for <=230 ms engineering margin before any
additional dirty-acquisition corrections. Missing safety stops before measurement.
At most one separately pre-registered duplicate metadata/inventory probe is allowed
if safe but over budget; no production refactor to rescue the number.

Stop on unresolved namespace/reparse/identity, missing capability, editor
incompatibility, unbounded resources, lost boundary, expected cost over margin or
need for production changes. No CI dispatch, historical comparison rerun, G1-O2,
production wiring, alternative freshness contract, merge or package matrix.

## Executed result and stop

One native sequence ran on Windows 11 x64 / NTFS on 2026-09-27 at
01:38 UTC, ordinary non-elevated host account. Exit **101**: **0 test functions
passed, 1 failed, 0 ignored, 196 filtered**. The single function deliberately
contains an ordered case sequence; the partial assertions below are not an overall
test pass. No retry, alternative flag configuration, privilege/security change,
new dependency, historical comparison or CI dispatch followed.

The first leaf-symlink setup (at Chain, before the leaf open) failed with Windows
**1314**, required privilege not held. This is a **missing adversarial-test
capability**, not evidence that the primitive accepted a hostile link. The
pre-registered missing-capability stop applies. No claim that all directory-relative
approaches are infeasible follows from this result.

| Case group | Observed result |
| --- | --- |
| Ordinary existing file, bytes and independently sampled current identity | Positive assertions passed |
| Five invalid path forms; missing leaf and directory-as-leaf | Refused; missing leaf remained absent |
| Existing writable handle and live writable mapping | Read succeeds; a mapped byte mutation is freshly observed |
| Identical and different bytes with restored modification time at Opened, first Chunk, AfterRead, BeforeBinding | All eight returned error; current replacement identity independently differs; time restoration checked |
| Hostile leaf symlink at Chain | Setup denied with error 1314; experiment stopped |
| Remaining leaf-link boundaries | Not executed |
| Pinned parent/root rename attempts | Not executed |
| Same-identity retained-parent reparse at five boundaries | Not executed |
| Cancellation, expired absolute deadline, injected boundary errors | Not executed |
| Full positive reader/graph matrix on Windows and macOS | Not established; outside this completed early-stop result |
| Four-reader verifier timing, instrumented sequence, three uninstrumented processes | **0 executed**, safety prerequisite missing |
| Optional metadata/inventory experiment | **0 executed**, ineligible |

Expected negative opens emitted NTSTATUS 0xc0000034 / Win32 2 (missing name)
and 0xc00000ba / Win32 5 (directory opened as leaf), both mapped to typed IoFailure.
The exact flags/access combinations worked for the stable local directory/leaf
case: object attributes 0x1040; directory access 0x1000a1/options 0x200021/share 3;
leaf access 0x100081/options 0x200060/share 7; disposition FILE_OPEN (1).
This establishes local API availability for those ordinary calls, not hostile
composition or hosted Windows support. The adapter uses native-opened root and
child directories, no backup intent, no create/truncate, and RAII File handles.
The initial anchor still uses existing conservative acquisition, whose cost cannot
be erased in any later measurement.

## Evidence identity and validation

Pre-registration was saved **before execution** in the local state/g1-o1-n directory,
with the complete staged diagnostic patch and five source-file hashes. No diagnostic
source changed after the run. Repository source is the durable reproducible input;
raw state/log/patch/binary records remain outside Git.

| Evidence | SHA-256 |
| --- | --- |
| Pre-run diagnostic patch, including initial pre-registration/handover text | f3bee7f50eb0706e6d3e74224521a972a8d2bd082eb68027d5f811c7eab7f1b0 |
| Executed release test binary | 72f1620fcb990e9bc56c4f8967bbc7268e9b9cacc52bad06c3ef3ea4997d8bd4 |
| Complete native safety log | 6db147647f96d778f2726ff1e29a3433266d74d09a1b8795d498622b000a696b |
| Native adapter source at execution | fb9acbdcd67616d0551308845fe2a47b961ed1dd22a7f41db0fe87a65d81a2c8 |
| Ordered safety test source at execution | 5f8235a32d2ef49ab69495bc0334277fcf8ccd41aadbb3f24f839f1d2f3c1f30 |

Build used existing enter-local.ps1, Rust/Cargo 1.90.0, MSVC 14.50.35717,
Windows SDK 10.0.26100.0, release/locked/offline. No compile repair was needed.
The existing unused runtime_handle warning remained. Commands from repository root:

    cargo fmt --manifest-path app/Cargo.toml --all
    cargo test --manifest-path app/Cargo.toml -p loomlight-core --release --locked --offline --no-run

The emitted binary was run once with:

    transaction::tests::native_boundary::g1_o1_n_ordered_safety --exact --ignored --nocapture --test-threads=1

The manual test is intentionally ignored by ordinary suites so publication cannot
rerun a privileged or expensive experiment implicitly. Its explicit invocation
failed; ignore status is never acceptance. Neither the old qualification selector
nor its counterexample guard was changed. The historical negative controls were
not executed again and remain unchanged.

## Safety and cost disposition

The new code is a retained **unqualified test artifact**, reachable only through
cfg(test) and cfg(windows). It is not a safe production fallback. Final binding
success against stable inputs and eight positive replacement rejections narrow
S1 uncertainty locally; they do not close S1 across hostile namespace cases or
whole graphs. The source's intended owner map in the pre-registration remains a
design until every corresponding positive regression exists.

Missing proof includes hostile links, same-identity parent reparse, cancellation/
failure cleanup, actual descriptor peak/leak accounting, filesystem/type semantics
outside this local NTFS fixture, full dependency and ownership binding, and both
supported-target graph matrices. Boundary callbacks return injected errors; they
would not alone prove actual allocator/query/read/thread failure cleanup. An
independent code review and those proof gaps precede any later timing qualification.

No new V or complete-request measurement exists. Conservatively retaining the
observed 162.344 ms other-work value leaves **67.656 ms** for V at the 230 ms
engineering ceiling, **87.656 ms** at the strict 250 ms gate (strictly less there).
Final binding adds one new leaf open per read (1,006/503/504 if later composed with
cold/warm/edit source passes), plus fresh chains and two live leaf handles.
Those are future operation obligations, not measured counts. Dirty acquisition,
complete metadata/dependencies and any new checks also need charging.
The conditional 230 ms model remains unproved; no local-to-hosted multiplier is used.
The whole-request feasibility gate is NO-GO for missing safety evidence regardless
of the unmeasured cost. Do not perform the optional cost rescue experiment.

Historical candidate b3d696533290d91bc2ff7d4eb65562d2c68642e1, local comparison,
raw logs/CSVs/completion state, and run 36278262505 attempt 1 remain failure
evidence under their actual inputs. No production source, loader, transaction,
Branches UI or workflow behavior changed. G1-O1/G1-V1 remain blocked; G1-O2,
package matrix, physical acceptance, merge, optional Git and Phase 2 stay ineligible.

## One next decision

Select a **read-only G1-O1-N follow-up review** to decide whether a separately
authorized, newly pre-registered continuation on an environment that already
supports the required hostile-link tests is justified. Review the retained native
composition and missing proof/cost work first. No automatic rerun, security setting
change, elevation or CI dispatch is authorized. Changing freshness/cadence/targets
or choosing revision display still needs an explicit product/ADR decision.
