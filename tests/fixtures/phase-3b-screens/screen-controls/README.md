# Integer bar and image-button runtime fixture

The public-core exporter creates the accepted game, metadata and six distinct
80x40 solid-color PNGs. `qualify-screen-controls.py prepare` retains that export
and the exact producing test binary at a committed candidate. It starts no SDK.

The SDK stage copies accepted files byte-for-byte and adds only this fixture's
driver and test suite. It checks normal menu/Story entry and a deliberate fixture
preview entry at 1280x720 and 1024x768. Both use the accepted control screen.
Built-in actions are observed with `sys.setprofile`; none is replaced. Engine
input reaches the bar's lower and upper limits, changes it by one keyboard step,
then activates the image button once. The action must set the bound variable to
7, hide the Panel and finish the Dialog once.

Six native state-prefix renders must match independent native references using
the accepted PNG for each state at the authored 160x80 size. Full RGBA pixel
hashes must agree exactly; six distinct source colors and distinct rendered
states are required. Captures are retained. These are engine appearance samples. Actual
pointer input separately checks idle and hover. Sampling must leave variables
and action-call counts unchanged. This does not claim naturally selected or
disabled runtime conditions, physical input, or native editor preview routing.

Run the admission unit tests and explicit retained-export checks before the SDK
stage. The latter require `LOOMLIGHT_SCREEN_CONTROLS_ACCEPTED` and
`LOOMLIGHT_SCREEN_CONTROLS_MANIFEST_SHA256`; absent inputs fail rather than skip.
The SDK command requires an exact committed candidate, checksum files and
`--allow-fixture-execution`. A fresh run needs seven starts. An observer-only
correction may use `--source-candidate` and `--setup-from` to reuse the original
producer and three completed setup checks on exactly the same accepted files.
Every core/SDK dependency must remain unchanged; original input and binary hashes
are checked against the producing commit. The current observer stays bound to
its own commit. The four runtime cases load that current instrumentation anew.
Run the explicit `screen_controls_prepared_checks.py` admission/rejection checks
before trusting reuse. Reserve the selected starts in #51 first.
The result retains actual starts, failures, process cleanup and source identities.
