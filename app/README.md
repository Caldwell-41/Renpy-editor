# Loomlight production scaffold

This directory contains the Phase 1 production workspace, including the completed 1A
scaffold and 1B transaction foundation plus the active bounded 1C project lifecycle.
It remains separate from disposable Phase 0 evidence under `spikes/`.

## Local checks

```bash
npm ci --ignore-scripts
npm run check
npm run build
cargo fmt --check --all
cargo test -p loomlight-core --locked
```

Full desktop tests and packaging require a supported Windows x86-64 or macOS Apple
Silicon development environment:

```bash
cargo test -p loomlight-desktop --locked
npm exec -- tauri build -- --locked
```

The production webview has no general filesystem, process, shell, HTTP, or credential
authority. Its only custom Tauri command is `core_request`, granted through the explicit
`allow-loomlight-core` permission only to the local `main` WebView, with a matching
Rust handler guard. Phase 1C's project/SDK/Git-init capabilities are core-owned,
picker-mediated, typed operations; credentials and general network-provider ports
remain authority-free.
