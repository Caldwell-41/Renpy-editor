# Desktop-shell spike results

**Status:** Complete; equivalent candidate evidence supports ADR 0003<br>
**Targets:** Windows x86-64 and macOS ARM64<br>
**Intel macOS:** Out of scope by confirmed product decision

## Fair-comparison structure

The disposable spike at `spikes/desktop-shells/` uses one TypeScript operation schema,
one Monaco-based UI, one synthetic `.rpy` fixture, and equivalent named operations.
Electron implements the boundary in its main/preload processes. Tauri implements it
as registered Rust commands with one local-window capability.

The initial surface is deliberately narrow:

| Operation | Electron | Tauri | Initial evidence |
| --- | --- | --- | --- |
| Project-relative UTF-8 read | Implemented | Implemented | Shared tests pass on both targets |
| SHA-guarded same-directory replacement | Implemented | Implemented | Node and Rust tests pass on both targets |
| External file watch | Implemented | Implemented | Packaged target latency/event counts recorded |
| Allowlisted mock SDK process | Bounded stream/cancel/timeout events | Equivalent threaded supervisor | Shared and Rust lifecycle tests pass on both targets |
| Unknown operation/path traversal | Denied | Denied | Shared and Rust denial tests pass on both targets |
| Local CSP/navigation boundary | Implemented | Implemented | Packaged E2E passes on both targets |

## Packaged security/filesystem checkpoint

Question: can both packaged candidates enforce the same narrow renderer-to-core,
process, and project-filesystem boundary on Windows x64 and macOS ARM64, while a failed
assertion reliably fails CI?

Success requires packaged denial of unlisted operations, arbitrary processes, external
network/navigation/popups, traversal, and symlink escape; successful contained read,
SHA-guarded same-directory replacement, external watch, missing-file, and complex-path
behavior; redacted absolute paths and synthetic sensitive values; recorded watch/path
measurements; and non-zero process status for any false assertion.

Run 34691607349 is partial and includes failed evidence despite both jobs concluding
success. Its shared Node suite recorded Windows watch latency 2 ms with two events and
macOS latency 1 ms with two events. The packaged Tauri core probe recorded:

| Target | Path length | First watch event | Events in 100 ms | Symlink |
| --- | ---: | ---: | ---: | --- |
| Windows x64 | 265 characters | 0 ms | 2 | Denied |
| macOS ARM64 | 277 characters | 12 ms | 3 | Denied |

Both packaged Electron WebViews reported renderer Node globals absent, a frozen narrow
bridge, and denial of unknown IPC, traversal, network, popup, and navigation attempts.
However, expected rejected IPC calls made Electron print stack traces containing the
absolute hosted-runner application path. This fails the log-redaction criterion.

The packaged Tauri core probe passed contained read, replacement, stale-hash,
traversal, missing-file redaction, arbitrary-process, symlink, watch, and spaces/
Unicode/deep-path cases. Its WebView probe passed unknown IPC, traversal, network, and
popup denial on both targets and navigation denial on macOS. Windows explicitly logged
`navigationDenied: false`, but `AppHandle::exit(1)` did not produce a failed shell step.
Therefore Tauri Windows external-navigation denial and the workflow gate were not
proven by that run.

The corrective implementation keeps expected Electron denials out of privileged stack
logs, drives Electron file behavior through its packaged renderer bridge, makes Tauri
navigation allowlisting explicit, requires symlink creation/denial, and uses a hard
non-zero process exit after flushing probe output.

Corrective run 34699898544 passed quality and the complete Windows x64 job. Windows
recorded Electron watch latency 13 ms/two events at 255 path characters, Tauri watch
latency 0 ms/two events at 265 characters, and successful packaged denial/filesystem/
redaction assertions for both candidates. Crucially, the explicit Tauri policy now
reported `navigationDenied: true` on Windows. The macOS Electron probe passed every
assertion except `sensitiveRedacted`, then correctly exited non-zero; later steps were
skipped. Follow-up run 34700215108 reproduced the same isolated macOS failure despite a
50 ms fixture delay, ruling out a simple fast-child event race. The remaining platform
difference is the packaged Electron executable used as the internal mock runtime:
macOS does not reliably execute the JavaScript child without explicitly setting
`ELECTRON_RUN_AS_NODE=1`. The next correction sets that flag only in the allowlisted
child's minimal environment, adds exact redaction of known absolute process arguments
containing spaces in both adapters, and lengthens the Electron path beyond the legacy
Windows 260-character boundary.

Final corrective run
[34700476448](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34700476448)
passed every shared, Rust, packaging, and packaged probe step on both targets. The
allowlisted Electron child uses its packaged executable with `ELECTRON_RUN_AS_NODE=1`
in a minimal environment; no arbitrary executable or shell surface was added. Expected
IPC denials are returned as typed envelopes, so the final application probe output did
not contain Electron handler stack traces or absolute packaged-runner paths.

| Target/candidate | Complex path | First watch event | Observation window/events | Result |
| --- | ---: | ---: | ---: | --- |
| Windows / Electron | 287 characters | 9 ms | 200 ms / 2 | All assertions true |
| Windows / Tauri | 265 characters | 0 ms | 100 ms / 2 | All assertions true |
| macOS / Electron | 299 characters | 4 ms | 200 ms / 2 | All assertions true |
| macOS / Tauri | 277 characters | 8 ms | 100 ms / 3 | All assertions true |

Counts are observations, not a promise of one notification per write. Consumers must
debounce/coalesce events and confirm file hashes. Both Windows candidates crossed the
legacy 260-character boundary. Symlink creation succeeded and escape reads were denied
on both hosted targets. Same-directory replacement left no temporary sibling, stale
hashes were rejected, missing errors were redacted, and synthetic sensitive values plus
known absolute arguments containing spaces did not reach renderer-visible process
output. Unit/shared evidence remains distinct from these packaged executable probes.

The final initial matrix, [GitHub Actions run 34547542329](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329),
passed on Windows x64 and macOS ARM64. Both jobs ran the shared tests, packaged and
launch-smoked Electron, ran the Tauri Rust tests, and packaged Tauri. These are
unsigned research artifacts, not release candidates.

The retained compressed evidence bundles are 186,125,274 bytes for Windows and
416,183,152 bytes for macOS. Each bundle combines both candidates, so these figures
must not be used as a per-framework size comparison. GitHub retains them privately
for seven days, through 2026-09-18. The same shell also packaged successfully as an
unsigned Linux x64 application locally, but that is only a build-pipeline sanity check.

The process-parity matrix, [GitHub Actions run 34577431423](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34577431423),
passed on Windows x64 and macOS ARM64. Both boundaries use validated run identifiers,
10–30,000 ms timeouts, direct argument arrays, an allowlisted internal executable,
incremental stdout/stderr, one 65,536-byte combined cap, redaction, real child
cancellation, and terminal reasons for exit, cancellation, timeout, truncation, and
start failure. Deterministic version, diagnostics, stderr, delay, and flood modes drive
the tests. Unknown/stale cancellation is non-destructive and completed runs are
removed from the active registry.

The shared Node suite directly covers normal exit, denial, direct arguments, stderr,
redaction, cancellation, timeout, truncation, stale identifiers, and cleanup. Rust
tests exercise the Tauri supervisor's cancellation, timeout, truncation, redaction,
allowlist, and timeout validation with real child processes. Both packaged candidates
remain unsigned research outputs, and this result does not select a desktop stack.

## Reproduction

Local shared/Electron compilation and tests:

```bash
cd spikes/desktop-shells
npm ci
npm test
npm run build:ui
```

`.github/workflows/desktop-spikes.yml` runs the same tests plus Electron and Tauri
packaging on `windows-2025` (x64) and `macos-26` (ARM64), then retains private unsigned
artifacts for seven days. A failed job is evidence, not permission to infer behavior
from the other operating system.

## CI efficiency evidence

The matrix restores a pinned `Swatinem/rust-cache` action after recording the runner
toolchain. It caches Cargo registry/archive data, git dependencies, and dependency
build outputs for the actual `src-tauri` workspace. The action keys by job, Rust
release/host, Cargo manifests and lockfile, root Rust/Cargo configuration, compiler
environment, and an explicit matrix-runner key. This isolates Windows x64 from macOS
ARM64 and invalidates dependency outputs when relevant Rust inputs change. It excludes
workspace source outputs and incremental artifacts, and does not retain pre-existing
Cargo binaries, secrets, or private project content.

`cargo test --release --locked` retains the privileged-adapter test gate while sharing
the release dependency profile with the subsequent `tauri build`. A separate test
binary and packaged application are still built because they prove different things;
only their common release dependencies are reused. The package step, Electron evidence,
packaged denial probes, target matrix, and locked dependency behavior are unchanged.

| Run | Windows job | Windows Rust test | Windows Tauri package | macOS job | macOS Rust test | macOS Tauri package |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [Pre-change 34677919432](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34677919432) | 15:23 | 4:36 | 9:24 | 2:34 | 0:34 | 1:20 |
| [Cold cache 34691004337](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34691004337) | 13:20 | 6:30 | 3:04 | 2:38 | 0:54 | 0:53 |
| [Warm cache 34691607349](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34691607349) | 5:42 | 0:45 | 2:49 | 1:57 | 0:23 | 0:50 |

The warm run reported full matches for separate 392 MB Windows and 340 MB macOS
caches. The cold Windows run included a 1:32 initial cache save. Timings are hosted-
runner observations, not guarantees; cache eviction or a toolchain/dependency change
returns the workflow to the supported cold path.

Push runs now cancel only an older run of this workflow on the same ref. Manual runs
use their run ID as the concurrency group, so independent evidence requests are not
cancelled. Existing path filters remain limited to this workflow and
`spikes/desktop-shells/**`; broad Phase 0 documentation changes do not rebuild packages.

## Comparative measurements

### Question and success criteria

Question: with the security and functional gates already equivalent, what measurable
runtime, packaging, dependency, and maintenance costs distinguish Electron from Tauri
on each supported target?

Success requires three fresh packaged launches per candidate and target with zero
probe failures; spawn-to-ready cold-start time; process-tree idle working set and
stress peak while the identical 1k/10k/50k graph workload runs; existing 10k
interaction/Monaco guards; exact installed artifact bytes/files; dependency and
licence counts from the committed JavaScript and Rust locks; and a source/toolchain
complexity inventory that separates shared UI from candidate-specific code. Raw JSON,
runner/tool versions, limitations, and discovered failures must be retained. Security
and reliability remain gates; size, startup, memory, language/toolchain breadth, and
maintenance cost are weighted criteria rather than post-hoc pass thresholds.

Final run
[34733246868](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34733246868)
passed every preceding packaged boundary and behavior check plus three fresh
measurement launches for each candidate on both targets. Values below are medians
except stress memory, which is the maximum observed process-tree working set.
Private `desktop-comparison-windows-2025` and `desktop-comparison-macos-26` artifacts
retain the two raw candidate reports and static inventory for seven days, through
2026-09-20; complete structured summaries also remain in the job logs.

| Target / candidate | Installed bytes/files | Cold start | Idle working set | Stress peak | 10k total | 10k interaction p95 | Monaco delay/edit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Windows / Electron | 487,381,445 / 73 | 638.85 ms | 335,519,744 B | 350,429,184 B | 422.4 ms | 0.4 ms | 4.2 / 4.2 ms |
| Windows / Tauri | 9,548,800 / 1 | 1,150.16 ms | 368,054,272 B | 401,563,648 B | 436.6 ms | 0.3 ms | 5.0 / 4.3 ms |
| macOS / Electron | 401,156,591 / 257 | 408.21 ms | 451,018,752 B | 460,423,168 B | 2,395.6 ms | 0.8 ms | 33.1 / 10.6 ms |
| macOS / Tauri | 10,787,643 / 3 | 1,628.86 ms | 105,299,968 B | 105,447,424 B | 740 ms | 1 ms | 8 / 4 ms |

Each displayed 10k timing is the median of the three runs. All twelve launches exited
zero, every 10k interaction and Monaco observation stayed below 100 ms, and every 50k
case completed below 15 seconds. Electron started about 511 ms faster on Windows and
1,221 ms faster on macOS. Tauri's artifact was about 98% smaller on each target and
its observed macOS working set was about 77% lower. Windows WebView2 erased that
memory advantage: Tauri was about 10% higher at idle and 15% higher under stress.

The Windows Electron first idle/stress sample saw only the root process (100,876,288
bytes) before its descendants were visible; the other two runs saw four processes and
the reported median therefore retains the process tree. The macOS sampler can follow
only descendants of the launched process and reported one Tauri process; launchd-
owned WKWebView/XPC services may not be descendants, so the macOS Tauri number is a
useful hosted-runner observation, not a complete system-accounting claim.

The committed locks contain 128 npm packages across shared UI/build tooling and both
candidates, and 454 transitive Cargo registry packages for the Tauri target/build
graph. Recorded licence identifiers are permissive/MPL families with no Phase 0
conflict, but redistribution still requires the planned release review. Candidate-
specific disposable code measured 458 nonblank lines in five Electron files versus
707 lines in eight Tauri files; shared UI was 637 lines in five files. Tauri therefore
adds Rust/toolchain and a larger privileged-adapter dependency surface, while Electron
keeps one language but ships the much larger ambient Chromium/Node runtime.

Runs 34732252587 and 34732654915 are retained failed evidence. They exposed an
asynchronous memory-stage attribution defect and then observer interference with the
graph spike's internal generation/layout bit. Commit `f5c42a6` made the comparison
exit on its predeclared interaction/Monaco/50k criteria while preserving the full
diagnostic graph result. Run 34733107607 then caught a standalone macOS Electron
filter result of 506.2 ms against the fixed 500 ms limit. The filter's 512-node chunks
caused twenty timer yields; increasing only that chunk to 1,024 retained chunking and
sub-100-ms edit responsiveness, and the final run passed without changing a limit.

Shared packaged UI/WebView behavior is recorded separately in
[UI_WEBVIEW_SPIKE_RESULTS.md](UI_WEBVIEW_SPIKE_RESULTS.md). Automated semantics,
docking/resizing, keyboard/focus, reduced motion, synthetic drag/drop, media elements,
codec observations, and Monaco edit guards pass in run 34701370897; manual
screen-reader and physical media-quality checks remain explicit limitations.

Packaged native-store behavior is recorded in
[CREDENTIAL_STORE_SPIKE_RESULTS.md](CREDENTIAL_STORE_SPIKE_RESULTS.md). Run
34722411465 passed Electron's DPAPI/Keychain-backed `safeStorage`, Tauri's direct
Credential Manager/Keychain entries, cleanup, no-renderer/no-IPC assertions, and a
zero-match plaintext scan of source, project, logs, packages, and retained-artifact
inputs on both supported targets.

Packaged branch-graph scale is recorded in
[GRAPH_SCALE_SPIKE_RESULTS.md](GRAPH_SCALE_SPIKE_RESULTS.md). Run 34722954424 passed
the identical deterministic 1,000-, 10,000-, and 50,000-node workload in Electron
Chromium and Tauri WebView2/WKWebView on both targets. The required 10,000-node case
met every predeclared timing, culling, stable-layout, and Monaco-coexistence bound;
the 50,000-node stress case also passed. Engine memory surfaces remain too limited
for a comparative heap conclusion.

These measurements complete the stack comparison. Together with the earlier
security, filesystem/process, UI/WebView, credential, and graph gates, they support
selecting Tauri 2 in ADR 0003. Electron remains the explicit fallback if system-
WebView differences, packaged E2E reliability, or Rust maintenance cost becomes a
material delivery blocker.

## Integration findings

The first target-platform run was intentionally retained as failed evidence. Windows
showed that shell-quoted regular expressions in an npm packaging command are not
portable to `cmd.exe`; packaging now uses the packager's JavaScript API. Apple Silicon
successfully packaged and launched Electron, then Tauri compilation correctly failed
because its required application icon was absent. A minimal non-product spike icon is
now explicit. Neither finding changes the product design, but both inform the eventual
build boundary.

The corrected run then packaged and launch-smoked Electron on both targets. Tauri's
Rust tests and packaging passed on macOS ARM64. Windows reached the Tauri build script
and required an ICO resource distinct from the PNG accepted on macOS; both formats are
now generated from the same disposable vector mark. The runner-generated dependency
resolution is committed as `Cargo.lock` and later tests use `--locked`.

With the icon present, the Windows-only `ReplaceFileW` branch compiled far enough to
expose two handle parameters that require explicit null pointers in `windows-sys`
rather than integer zeroes. This is corrected without weakening atomic replacement;
the final Windows job compiled, tested, and packaged that branch. The final matrix
passed only after these portability defects were fixed; the failed runs remain useful
integration evidence rather than being hidden by retries.
