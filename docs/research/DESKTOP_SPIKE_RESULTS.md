# Desktop-shell spike results

**Status:** Process parity complete; corrective packaged security/filesystem checkpoint in progress<br>
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
| External file watch | Implemented | Implemented | Compiles/packages on both targets; latency tests pending |
| Allowlisted mock SDK process | Bounded stream/cancel/timeout events | Equivalent threaded supervisor | Shared and Rust lifecycle tests pass on both targets |
| Unknown operation/path traversal | Denied | Denied | Shared and Rust denial tests pass on both targets |
| Local CSP/navigation boundary | Implemented | Implemented | Packaged E2E partial; Tauri Windows navigation correction pending target verification |

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
skipped. That fast-exiting stderr child exposed an observation race specific to the
packaged macOS run. The follow-up delays only the disposable stderr fixture by 50 ms,
adds exact redaction of known absolute process arguments containing spaces in both
adapters, and lengthens the Electron Windows path beyond the legacy 260-character
boundary. This follow-up still requires one target matrix.

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

## Measurements still required

- Packaged launch/E2E, cold start, idle/stress memory, artifact size, and flakiness.
- Verified corrective target results for packaged filesystem equivalence, WebView
  navigation denial, application-log redaction, watch counts/latency, and complex paths.
- Keyboard/screen-reader, drag/drop, and image/audio/video behavior.
- Native credential-store prototype with log/UI/project leak checks.
- 10,000-node graph interaction without blocking Monaco.
- Dependency/licence inventory and developer-complexity comparison.

No desktop stack is accepted by this partial result.

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
