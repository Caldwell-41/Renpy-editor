# Desktop-shell spike results

**Status:** Implementation started; target-platform evidence pending  
**Targets:** Windows x86-64 and macOS ARM64  
**Intel macOS:** Out of scope by confirmed product decision

## Fair-comparison structure

The disposable spike at `spikes/desktop-shells/` uses one TypeScript operation schema,
one Monaco-based UI, one synthetic `.rpy` fixture, and equivalent named operations.
Electron implements the boundary in its main/preload processes. Tauri implements it
as registered Rust commands with one local-window capability.

The initial surface is deliberately narrow:

| Operation | Electron | Tauri | Initial evidence |
| --- | --- | --- | --- |
| Project-relative UTF-8 read | Implemented | Implemented | Node tests pass on Linux |
| SHA-guarded same-directory replacement | Implemented | Implemented | Node stale-base test passes on Linux |
| External file watch | Implemented | Implemented | Target-platform evidence pending |
| Allowlisted mock SDK process | Stream/cancel boundary | Bounded synchronous process | Target-platform evidence pending |
| Unknown operation/path traversal | Denied | Denied | Contract denial tests pass on Linux |
| Local CSP/navigation boundary | Implemented | Implemented | Packaged test pending |

The Electron shell also packaged successfully as an unsigned Linux x64 application;
that is a build-pipeline sanity check only and does not count as target-platform
evidence. Its graphical launch was not exercised because this worker has no virtual
display service.

The synchronous Tauri process path is not parity-complete. Streaming, cancellation,
timeout behavior, and bounded redacted events must be made equivalent before scoring
subprocess reliability.

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

## Measurements still required

- Packaged launch/E2E, cold start, idle/stress memory, artifact size, and flakiness.
- Watch latency, replacement semantics, long/Unicode paths, cancellation, and output cap.
- Renderer/webview denial probes for IPC, network, navigation, and filesystem escape.
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