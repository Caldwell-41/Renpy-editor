# Variable and control-state canvas samples

## Review corrections and expanded scope, 2026-11-07

Kris asked for the Standards and Spec findings on draft PR #84 to be fixed, the PR
updated and CI run. Kris chose three outcomes:

- Remove the duplicated qualification code and keep the earlier proof bound to its
  own candidate.
- Make combined canvas samples open the inspector's `selected_` fields. Ren'Py's
  `scripts/generate_styles.py` gives `selected_` priority 2, above `hover_` and
  `insensitive_` at 1, and applies it to selected-hover and selected-insensitive.
- Implement bar state samples and variable samples on textbutton labels now.

Changes at this candidate:

- Bars take the canvas state prefix in the helper and the normal-game observer.
  Typed bars render literal `hover_`, `selected_` and `insensitive_` bar colors,
  which stay Source for bar edits. Ren'Py's `Bar.render` resets `insensitive_` to
  idle while the range is positive, so disabled samples show the normal bar.
- Text and textbutton labels share the `[name!q]` template grammar. Bound-text
  writes stay Text-only.
- The inspector and canvas share one prefix table. One workspace method applies
  every sample-state change.
- `fidelity_reference.py` now owns preflight, normal-game reference, cleanup and
  the command line for both L19 and L20. `fidelity_comparison.py` owns receipt
  admission and exact comparison. Each proof keeps its fixture preparation,
  case admission and environment (L20 still sets `RENPY_HIGHDPI=1.0`; L19 never
  did). The shared Rust capture restores accepted files and looks up asset bytes
  by asset row. The six state PNGs are now fixture files read by Rust and Python.
- The L20 refusal test checks each named limit, including a non-literal bar state
  color. The unused journey driver override and timings are removed.

The `76d2cf12` rendering proof no longer covers this head. The renderer, fixture,
exporter and admission changed, so criteria 1 and 2 need a new both-target
campaign. A campaign costs eight SDK starts per target. Mac has 8 of 16 left;
Windows has 4 of 16 left, so Windows needs a raised ceiling before it can run.
No SDK, helper, package or native-editor start has happened for this candidate.

| #54 criterion | State at this candidate |
| --- | --- |
| Actual assets/styles and samples for every applicable state; no source/runtime/action change | Implemented for Text, textbutton labels and styles, six imagebutton states and bar values plus bar states. Public-core export and the actual UI/core journey keep Source, defaults and actions unchanged. Both-target rendering proof pending. |
| Same accepted source/sample/state, both aspects and targets | Pending a new both-target campaign at this candidate. |
| Differences/causes and explicit limits | Stated in [DATA_MODEL](../../DATA_MODEL.md): unquoted `[name]`, non-literal bar state colors and custom control expressions refuse with named plan limits, which the refusal test checks. |
| Clear samples/drafts/stale state; inert opening/selecting/editing | Actual ScreensWorkspace/core journey covers all six states, including both combined states, with retained drafts, Cancel and Reset. DOM tests cover combined-state prefixes and cross-button selection. |

Draft PR #84 carries this candidate. Its Repository quality and both-target harness
runs are recorded on #54 when audited. The PR stays draft; acceptance, merge and
issue closure stay unselected.

## Local implementation preparation, 2026-11-06

[#54](https://github.com/Caldwell-41/Renpy-editor/issues/54) owns L20 scope and
acceptance. Kris selected a new branch, Opus 5.5 high implementation advice and
parent implementation. Branch `codex/54-canvas-samples` starts at accepted
prerequisite `46fdbc1be1376ff0856df16076f26549fa35050f`. The confirmed test seams
are public `screens.canvasPlan`, actual Screens UI/core and the
helper-versus-normal-Ren'Py comparison. That base owns final review.

The existing renderer remains the production owner. Canvas state changes now
synchronize open textbutton appearance fields while retaining drafts and
variable samples. Combined states retained the chosen editing prefix until the review corrections above. The approved
layout and status copy remain unchanged.

The L20 exporter supplies accepted source, assets, typed samples and plans for
22 cases: six explicit states plus defaults, minimum, maximum, above-maximum
and signed-64 minimum values, at 1280x720 and 1024x768. The fixture includes
integer/boolean/string Text, local/shared textbutton appearance, six imagebutton
assets and an integer bar. An inert sample contains brackets, Python-like text
and Ren'Py tags. Its literal spelling must survive rendering.

The normal-game producer loads accepted Screen Language, sets typed values
after defaults and forces explicit button prefixes before observing real
displayables. It does not reconstruct the image from the helper plan. The hidden
helper shares its capture owner with L19. Pixel/geometry comparison also shares
one implementation and detects alpha differences.

### Both-target comparison complete, 2026-11-07

The formal Windows comparison passes all 22 full-frame cases at both aspects:
zero differing RGBA pixels, exact geometry, matching physical dimensions and
drawing scale, unchanged accepted inputs and cooperative exit 0 with complete
cleanup. The producing candidate is `76d2cf1290805fe40f81f406bf1e74c2c4d335d9`.
Mac passes the identical 22-case comparison, with the same accepted-source bytes
and candidate/tree. Both targets have zero differing RGBA pixels and all 154
geometry records exact. No tolerance or broad unsupported-content waiver is
accepted. No package, native editor or CI
operation, issue closure, push, PR or merge is selected.

The recorded ceiling is 16 SDK processes per target. A campaign costs eight:
compile, lint, two normal-game runs, three adapter validation/discovery starts
and one hidden helper. Failed/cancelled/uncertain starts count cumulatively.
Windows SUNDOWN owns development; the linked Mac ARM64 is reachable. Historical
allowances stay closed. [Windows result](https://github.com/Caldwell-41/Renpy-editor/issues/54#issuecomment-6686571276)
and [Mac result](https://github.com/Caldwell-41/Renpy-editor/issues/54#issuecomment-6686874006)
retain target receipts under #54's sole accounting ownership. Final use is
Windows 12/16 and Mac 8/16, zero reservations and uncertain starts. The selected
qualification is complete; unused capacity selects no further run.

Kris approved the prepared progress/limit comment, now
[published on #54](https://github.com/Caldwell-41/Renpy-editor/issues/54#issuecomment-6686107986).
Automatic approval review then refused a separate reservation comment and SDK
launch, interpreting that approval as limited to the exact first comment. Those
denied calls started no process. Kris subsequently explicitly approved both-target
campaigns, necessary in-scope corrections and ongoing #54 reservation/result
updates within the recorded ceiling. The reservation and execution then proceeded.
This file records technical evidence and recovery, not a replacement task brief.

Offline preflight passes at local `76d2cf1290805fe40f81f406bf1e74c2c4d335d9`.
Official SDK archive/checksum, current accepted-source admission, observer syntax
and clean implementation-input checks pass. Export SHA256
`acbb300666b45457fc3108c2a24f4b2c6bf95b7f33d94cb4ac5e594210afdfaf`;
observer SHA256 `71b3a7c9230a9769a609ac8c0fa751dd257233fccf6b76c1d07aebb0d9ca5af2`.
The initial Windows campaign used eight starts. Normal compile/lint/two runs
passed with 22 admitted records, unchanged source and complete cleanup. The helper
produced 22 frames but FAILED its cooperative-shutdown gate: exit 0 and complete
core cleanup, cooperative false. Passive comparison found zero pixel differences,
exact geometry and equal scale in every row; its report explicitly remains
diagnostic-only and does not override the failed receipt.

After the concurrent broad-core load ended, the selected smallest retry reused
the same candidate, accepted export, requests and retained core test binary.
Only three adapter validation/discovery starts and one helper ran. All 22 cases,
the unchanged three-second cooperative-shutdown gate and the formal comparison
pass. The old normal-game reference was reused at the identical candidate and
input hashes. The first failure stays charged and preserved. There was no
production renderer or shutdown change and no deadline/tolerance relaxation.
Host load is a provisional explanation for the first shutdown result, not a
proved causal finding. Outputs remain under ignored `app/target/l20/normal-76d2cf12-1`,
`helper-76d2cf12-1`, `diagnostic-76d2cf12-1`, `helper-76d2cf12-2` and
`comparison-76d2cf12-2`, with the exact `core-test-76d2cf12.exe` retained.

The first Mac admission stopped at the occupied main checkout, consuming no SDK
start. T3's own handoff moved the replacement worker into an isolated checkout;
the dirty main checkout and active work stayed untouched. Mac completed one
eight-start campaign without retries. The parent audited actual command outputs,
formal comparator results, source/binary/receipt hashes and postflight metadata.
The clean source tree is `19fc1aa6c2266cbea09b11902dfc919363fc5e5b`. Mac records
GL2 at drawing scale 2.0; Windows records ANGLE2 at scale 1.0. Each target matches
its own native reference conditions. Both helpers exit cooperatively with code 0,
sources stay unchanged, scratch cleanup completes and no owned SDK process remains.

Mac host is macOS 26.6.2 ARM64, Python 3.12.16, Pillow 12.3.0 and Rust/Cargo 1.90.0.
Original Mac frames, receipts and retained binary stay under ignored
`app/target/l20-mac/` in its clean `codex/54-mac-sample-qualification` worktree.
JSON-only transfer SHA256 is
`eb2b37a2e214ed50383c1f5d39b71794e130bf5679189809e1c407b7b58c3650`.

| Receipt | Windows SHA256 | Mac SHA256 |
| --- | --- | --- |
| Retained core test | `9150b2fee0bc67e157a25443b7c4fece7e065435193c068455a57d8f68e60bcc` | `d81836701bd869b4e8c03438d6a349b91632a6ad40fac44b3f9fe9c63751f321` |
| Normal result | `8fc0cc0b99faf85da08b3987c89590c81d4b6214d0b373d2a19758b5553fb9c5` | `5c3b627119a1aacff6c67f0ee810bd2a1bc24b689fa250b24441eaab401dd455` |
| Passing helper result | `d2036b046102887c50104352f4a49f0a2a6ba2c96ea2abf6ebd89c097754efc4` | `aa07c6c1b8506e05e5b1a8be44e66317739bfa5555426ebb353a9dcbca102928` |
| Formal comparison | `b631bc83e63a44bf0dfdd456ca1da3702de1e156a18fae831e7952c6fde64ae1` | `d3743beb2c0252a7b829d57ab33d337817c5e970d7d6324e6410daef06227a61` |

Both use SDK archive SHA256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`
and renderer SHA256
`73fecc708717f8836d1b89a6c437e95d44814ca92c0be569c8500f2f132e64c7`.

### Original criterion audit

| #54 criterion | Result and bounded evidence |
| --- | --- |
| Actual assets/styles and qualified samples; no source/runtime/action mutation | Both-target exact frames cover int/bool/string Text, local/shared textbutton styles, six imagebutton assets and bar defaults/bounds/out-of-range samples. Public-core and actual UI/core checks retain source/default values and keep actions inert. |
| Same accepted source/sample/state, both aspects and targets | Identical accepted JSON and source candidate/tree feed 22 cases per target at 1280x720 and 1024x768. Formal whole-frame RGBA and geometry comparisons pass with matched native capture conditions. |
| Differences/causes and explicit limits | No visible differences remain in the qualified matrix. Bare interpolation, textbutton interpolation and custom control expressions refuse with plan limits; contracts state explicit state selection and unprefixed bar appearances. No action-based inference or unsupported-state claim is added. |
| Clear samples/drafts/saved-stale state; inert opening/selecting/editing | Actual ScreensWorkspace/core journey and focused DOM tests cover mixed sample/state requests, selector/reselection synchronization, retained drafts, Cancel/Reset, history/reopen and unchanged Source. Revision-bound stale samples and unsupported expressions refuse without execution. |

This audit covers candidate `76d2cf12` only; the review corrections above
supersede it. Leaf closure, user acceptance, merge and wider B08/Phase 3B
acceptance remain separate.

### Local checks and retained failures

Typecheck, all 380 frontend tests and the production build pass after review
corrections. The focused
state-sync test failed on the old selector mismatch and passed after correction.
The exporter passes all 22 cases and reopen replay without an SDK start. Two
offline comparison gates, the normal observer's typed-sample advancement and all
three existing L19 observer tests pass. Both-target SDK observers and the formal
comparison subsequently passed as recorded above.

Standards and Spec reviewed `46fdbc1b...c23129f1` in separate read-only agents.
Each reported one production defect: button sample prefixes leaked into frame
and window appearance fields. The parent reproduced it through ScreensWorkspace,
restricted containers to unprefixed fields and verified submitted background
edits. A second assertion reproduced stale prefixes after switching between
buttons; synchronization now updates retained button prefixes and inspector-led
changes. All 22 focused interaction/style cases pass. No review panel restarted.
The Standards duplication judgment is addressed by shared normal-game command
accounting/cleanup in `fidelity_reference.py`; L19 and L20 keep distinct fixture
preparation and expected-case admission.

The first frontend compile could not overwrite ignored files in the sandbox;
authorized compilation outside that restriction passed. Initial core fixture
admission refused unsupported bare-image/range-offset expressions and missing
owned markers. The fixture now uses canonical Transform/min/max expressions and
owned markers. No production grammar changed.

The first actual UI/core driver run timed out at existing initial Apply, before
new assertions; its final receipt shows accepted text, exit 0 and scratch removal.
An optimized-driver run during the concurrent broad-core suite timed out at
workspace load. Both failures remain retained. Operation timings and a serial
run distinguish host contention from a product defect; the five-second deadline
is unchanged. An additional unsandboxed optimized run reached later original
Apply stages but also exceeded the same deadline while broad-core verification
was active. The final serial optimized journey PASSES after that load ended,
including real source/history/planner/reopen and the new state/sample checks.
All owned drivers exit 0 and remove their fixture scratch. An older export
correctly failed Python source-hash admission
after exporter edits. The final current export passes explicit Python admission.

The ordinary release-core suite ran once with the three documented exclusions:
609 passed, seven failed and 55 ignored. Four TLS fixture failures pass in the
focused seven-test loopback group outside sandbox network restrictions. Three
Windows OS1314 symlink-privilege cases remain unqualified. The original broad run
remains failed; no security setting or required-result gate changed. Both L20
core cases passed, including stale/refusal and all-case export/reopen checks.

The full inexpensive harness ran 344 Python cases, with 339 passes, four named
Windows exclusions and one unrelated failure. The existing actual Win32 credential
dialog fixture could not obtain foreground focus within its controlled wait.
Q1 rejection, Q1 source and retention groups pass. This leaves the whole harness
failed; no native credential policy or deadline changed. Full repository validation
also retains the two known untracked recovery-receipt newline failures. Tracked-file
validation passes. Raw harness/frontend results and driver failures remain in
ignored `app/target/l20/` and the original controller output directories.
