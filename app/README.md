# Loomlight production scaffold

This directory contains the Phase 1A production workspace. It is intentionally separate
from the disposable Phase 0 evidence under `spikes/`.

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
Rust handler guard. Future adapter traits
are empty markers until their own approved milestones.
