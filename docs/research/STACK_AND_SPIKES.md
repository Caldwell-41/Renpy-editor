# Stack comparison and Phase 0 spike plan

**Evidence checked:** 2026-09-10. Primary sources are linked inline. Versions must be
rechecked when a stack is accepted and before each release.

## Verified Ren'Py baseline

The official [latest release page](https://www.renpy.org/latest.html) and
[release list](https://www.renpy.org/release_list.html) both identify **Ren'Py 8.5.3**,
released 2026-05-15, as the latest stable release. It remains the initial pinned
compatibility target, not an evergreen implicit upgrade. The release page provides
official Windows/macOS-capable SDK archives and a published checksum file.

The official [CLI documentation](https://www.renpy.org/doc/html/cli.html) documents
version inspection, compile, lint with `--error-code`, automated tests, normal run,
development `--warp`, and distribution builds. It explicitly states that the CLI is
not stable across releases, which requires a versioned adapter and runtime capability
probe. The latest docs currently carry an 8.5.4 documentation header while noting the
CLI page is current to 8.5.3; release pages, not documentation headers, determine the
stable download baseline.

The SDK is not bundled during Phase 0. Redistribution is a separate decision after
review of Ren'Py's [licence inventory](https://www.renpy.org/doc/html/license.html)
and all bundled dependencies.

## Desktop candidates

### Evidence-based comparison before spikes

| Criterion | Electron | Tauri 2 | Spike question |
| --- | --- | --- | --- |
| Windows/macOS | Official Forge-based packaging supports OS-specific distributables | Official Windows installer, macOS bundle/DMG, signing, and GitHub pipeline docs | Can both produce private unsigned test artifacts and launch on x64/ARM targets? |
| UI consistency | Bundled Chromium gives consistent Monaco/canvas behavior | Uses OS WebView, reducing bundled runtime but varying by OS/version | Do Monaco, docking, media, accessibility, graph, and canvas behave equivalently? |
| Privilege boundary | Main/preload/renderer; requires hardened IPC and Electron security settings | Rust core plus WebView; capability/permission scopes can restrict each window | Can the same narrow typed API be enforced and denial-tested? |
| Files/processes | Node APIs are mature but powerful; must stay out of renderer | Rust core/plugins; sidecars and shell commands require explicit permission/scope | Can watcher, atomic replace, cancellation, and Ren'Py child I/O be reliable? |
| Credentials | `safeStorage` uses OS cryptography, with platform caveats to test | Stronghold/store exist, but OS-native credential-store choice needs validation | Which audited adapter avoids renderer/plaintext exposure on both systems? |
| Testing | Broad unit/E2E ecosystem; Electron-specific automation available | Frontend mocking and WebDriver documentation, with platform limits to measure | Can critical desktop E2E run reliably in private CI? |
| Bundle/runtime | Larger bundled Chromium/Node cost | Smaller app payload is plausible because system WebView is reused | Measure actual spike artifact and memory/startup, not marketing figures |
| Team complexity | TypeScript end-to-end lowers language count | Rust privilege core improves explicitness but adds build/toolchain expertise | Which yields clearer multi-agent boundaries and maintainable adapters? |

Electron's official [process model](https://www.electronjs.org/docs/latest/tutorial/process-model)
separates a Node-capable main process from renderers. Its
[security guidance](https://www.electronjs.org/docs/latest/tutorial/security) requires
context isolation, sandboxing, no Node integration for remote content, validated IPC
senders, restricted navigation, and a CSP. Official
[safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage) and
[update guidance](https://www.electronjs.org/docs/latest/tutorial/updates) establish
available primitives but do not prove this product's credential/update design. The
official [packaging guide](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
uses Electron Forge for Windows/macOS distributables and strongly recommends signing.

Tauri documents per-window/webview
[capabilities](https://v2.tauri.app/security/capabilities/), scoped
[shell commands](https://v2.tauri.app/plugin/shell/), architecture-specific
[sidecars](https://v2.tauri.app/develop/sidecar/), and
[GitHub build pipelines](https://v2.tauri.app/distribute/pipelines/github/), plus
[Windows installer](https://v2.tauri.app/distribute/windows-installer/) and
[macOS DMG](https://v2.tauri.app/distribute/dmg/) workflows. These are
promising controls; their configuration and cross-platform behavior must be tested.

### Third-option screen

A native cross-platform framework such as Avalonia is credible for Windows/macOS,
but it is not retained for the first working comparison: this product depends heavily
on a mature embedded source editor, dockable web-style UI, and scalable graph/canvas
libraries. Adding a third implementation before Electron/Tauri evidence would expand
the spike without testing a distinct product risk. Reconsider only if both web-shell
candidates fail a recorded gate.

## Provisional recommendation

Use **Tauri 2 as the leading hypothesis** because its capability-scoped privileged
surface aligns with least privilege and SDK/file adapters can live in a typed Rust
core. **Electron is the explicit fallback** and may win if system-WebView differences,
Monaco/canvas behavior, desktop E2E, media preview, or Rust integration materially
reduce reliability or delivery speed. This is not an accepted decision; no production
scaffold or dependency choice should precede the spike ADR.

## Equivalent desktop-stack spike

Build disposable `spikes/desktop-tauri` and `spikes/desktop-electron` variants around
the same TypeScript UI and operation schemas. Each must demonstrate:

1. Monaco editing of a representative `.rpy` file and bidirectional mock source range.
2. Dock/resize, drag/drop, image/audio/video preview, keyboard focus, and screen-reader
   labels on current Windows and macOS.
3. Watch a selected project root; detect an external edit; stage a same-directory
   atomic replacement; refuse a stale-base write.
4. Launch a harmless mock SDK executable with a direct argument array, stream bounded
   output, cancel it, redact its environment/path, and deny arbitrary command names.
5. Enforce a restrictive CSP and prove unlisted IPC/capabilities, navigation, network,
   filesystem paths, and process calls are denied.
6. Read/write a test secret through a reviewed OS-store adapter and prove it never
   reaches UI state, logs, or project files.
7. Render/filter/pan a virtualized 10,000-node graph without blocking text editing.
8. Run unit/component and one packaged-app E2E smoke test; build private unsigned
   Windows/macOS artifacts in CI.

Record source/toolchain versions, OS/architecture, artifact size, cold start, idle and
stress memory, file/process latency, graph frame responsiveness, accessibility results,
test flakiness, security-denial tests, developer complexity, and failures. Select with
security/reliability as gates; bundle size is a weighted criterion, not a gate.

## Other bounded Phase 0 spikes

### Ren'Py SDK adapter

- Download 8.5.3 only from links resolved from the official release page; fetch the
  official checksum list, verify before extraction, and retain provenance.
- Probe `--version` and `--help`; implement version-specific command descriptors.
- Run compile, lint with `--error-code`, automated test, normal run, and distribution
  help/fixture build where safe. Investigate `--warp` only in development mode.
- Capture success and failure outputs into structured file/line/severity diagnostics.
- Test spaces, Unicode, long paths, cancellation, timeout, output limits, and missing
  or incompatible SDKs on Windows and macOS.

### Secure SDK installer

Use synthetic hostile archives before the real SDK: absolute/parent paths, symlinks,
hardlinks, case collisions, duplicate entries, reserved Windows names, oversized and
deep archives, partial download, checksum mismatch, existing destination, and
interrupted promotion. Extract to a private staging directory, validate containment
and types, then atomically promote without overwriting another version.

### Preview and source mapping

Map a five-beat scene between source, visual list, preview, and timeline. Compare an
editor-native staging approximation with official Ren'Py launch for screens, ATL,
Python-dependent state, transitions, and media. Document exactly which constructs are
faithful, approximate, or runtime-only; never label approximate preview as canonical.

### Large graph

Generate deterministic graphs at 1k, 10k, and 50k nodes with choices, calls, route
filters, cycles, and reconvergence. Measure initial layout, viewport interaction,
filter/search, path highlight, memory, stable relayout, and editor responsiveness.

## Stack decision gates

The accepted ADR must include raw results and explain:

- whether every security denial and Windows/macOS packaging gate passed;
- UI/editor/graph/media/accessibility parity and known platform differences;
- child-process, file watcher, atomicity, and credential-store behavior;
- CI/E2E reproducibility, dependency/licence surface, and maintenance cost;
- why the winner's weaknesses are acceptable and when the fallback is reconsidered.
