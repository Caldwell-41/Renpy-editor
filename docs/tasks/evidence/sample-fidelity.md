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

### Acceptance and remaining execution

Preparation does not establish rendering agreement. Both-target, both-aspect
normal/helper capture, exact pixel/geometry comparison and resulting corrections
remain required. No tolerance or broad unsupported-content waiver is accepted.
No L20 SDK/helper/native/package/CI process has started. No issue closure, push,
PR or merge is selected.

The proposed ceiling is 16 SDK processes per target. A campaign costs eight:
compile, lint, two normal-game runs, three adapter validation/discovery starts
and one hidden helper. Failed/cancelled/uncertain starts count cumulatively.
Current use is zero, with no reservations. Windows SUNDOWN owns development;
the linked Mac ARM64 is reachable. Historical allowances stay closed.

Automatic approval review rejected the issue progress/limit comment as an external
publication without user authorization. The required limit record has not been
published to #54. Dependent SDK qualification remains pending that approval.
This file records technical evidence and recovery, not a replacement task brief.

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
was active. This is not a passing actual UI/core journey. An older export
correctly failed Python source-hash admission
after exporter edits. Current-export admission remains required.

The full inexpensive harness ran 344 Python cases, with 339 passes, four named
Windows exclusions and one unrelated failure. The existing actual Win32 credential
dialog fixture could not obtain foreground focus within its controlled wait.
Q1 rejection, Q1 source and retention groups pass. This leaves the whole harness
failed; no native credential policy or deadline changed. Full repository validation
also retains the two known untracked recovery-receipt newline failures. Tracked-file
validation passes. Raw harness/frontend results and driver failures remain in
ignored `app/target/l20/` and the original controller output directories.
