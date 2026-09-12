# Disposable desktop-shell comparison

This Phase 0 spike compares Electron and Tauri around the same TypeScript UI and
operation contract. It is research code, not the production application.

Target platforms are Windows x86-64 and macOS ARM64. Intel macOS is explicitly
out of scope.

## Demonstrated boundary

- Monaco edits a representative project-relative `.rpy` file.
- Reads and writes stay inside an explicitly supplied project root.
- Writes require the expected SHA-256 and use a same-directory atomic replacement.
- Both adapters watch external changes; packaged target latency and coalescing are
  recorded for Windows x64 and macOS ARM64.
- Mock SDK work accepts only named operations and direct argument arrays, and emits
  bounded/redacted streaming and terminal events with cancellation and timeout.
- Electron exposes only a frozen preload API; Tauri registers only named commands.
- The local UI has a restrictive content-security policy and no remote content.

## Commands

```bash
npm ci
npm test
npm run build:electron
npm run tauri:check   # requires the Rust toolchain
npm run tauri:build   # run on a target-platform runner
```

The test fixture is synthetic and contains no private game content. Build output,
downloaded runtimes, and measurements remain ignored unless a reviewed evidence
summary is intentionally committed.

## Deliberate limitations

The shells are disposable. Packaged security-denial and filesystem/watch E2E are
complete. Shared packaged UI/WebView behavior is also complete. Native credential-
store evidence is the active checkpoint; graph-scale measurement, preview/source
mapping, official target SDK integration, and comparative runtime/maintenance evidence
remain required before the stack ADR can be accepted.
