# Variable and control-state canvas samples

## Local implementation preparation, 2026-11-06

[#54](https://github.com/Caldwell-41/Renpy-editor/issues/54) owns L20 scope and
acceptance. Kris selected a new branch, Opus 5.5 high implementation advice and
parent implementation. Branch `codex/54-canvas-samples` starts at accepted
prerequisite `46fdbc1be1376ff0856df16076f26549fa35050f`. The confirmed test seams
are public `screens.canvasPlan`, actual Screens UI/core and the
helper-versus-normal-Ren'Py comparison. That base owns final review.

The existing renderer remains the production owner. Canvas state changes now
synchronize open textbutton appearance fields while retaining drafts and
variable samples. Combined states retain the chosen editing prefix. The approved
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

### Windows comparison complete; Mac pending

The formal Windows comparison passes all 22 full-frame cases at both aspects:
zero differing RGBA pixels, exact geometry, matching physical dimensions and
drawing scale, unchanged accepted inputs and cooperative exit 0 with complete
cleanup. The producing candidate is `76d2cf1290805fe40f81f406bf1e74c2c4d335d9`.
Mac comparison remains required before L20 rendering acceptance. No tolerance or
broad unsupported-content waiver is accepted. No package, native editor or CI
operation, issue closure, push, PR or merge is selected.

The recorded ceiling is 16 SDK processes per target. A campaign costs eight:
compile, lint, two normal-game runs, three adapter validation/discovery starts
and one hidden helper. Failed/cancelled/uncertain starts count cumulatively.
Windows SUNDOWN owns development; the linked Mac ARM64 is reachable. Historical
allowances stay closed. [#54's result update](https://github.com/Caldwell-41/Renpy-editor/issues/54#issuecomment-6686513561)
owns cumulative accounting: Windows 12/16 after its helper retry, Mac 0/16 before
its campaign, no reservations or uncertain starts at this checkpoint.

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

### Local checks and retained failures

Typecheck, all 380 frontend tests and the production build pass after review
corrections. The focused
state-sync test failed on the old selector mismatch and passed after correction.
The exporter passes all 22 cases and reopen replay without an SDK start. Two
offline comparison gates, the normal observer's typed-sample advancement and all
three existing L19 observer tests pass. The actual SDK observers remain unrun.

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
