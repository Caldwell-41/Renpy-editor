# ADR 0003: Tauri 2 desktop runtime

**Status:** Accepted<br>
**Date:** 2026-09-13

## Context

The editor needs a Windows x86-64 and macOS ARM64 desktop shell for the shared Monaco,
canvas, and media UI, with a narrow privileged boundary for project files, Ren'Py
processes, credentials, and future network adapters. Phase 0 compared disposable
Electron 44.3.0 and Tauri 2.11.x packages around the same UI, operation contract, and
synthetic fixtures. Security and reliability were gates; artifact size, startup,
memory, dependency surface, and maintenance cost were weighted criteria.

Both candidates passed packaged denial, contained filesystem/atomic/watch, bounded
process, shared UI/WebView, native credential, and 1k/10k/50k graph evidence on both
targets. The complete results, commands, failures, and limitations are recorded in
the [desktop-shell evidence](../research/DESKTOP_SPIKE_RESULTS.md).

## Decision

Use **Tauri 2** as the production desktop runtime, with an unprivileged shared web UI
and a Rust privileged core. Expose only schema-validated commands registered by the
application and explicitly granted to the local main window. Keep filesystem, Ren'Py,
Git, credential, update, and network effects behind narrow adapters; do not grant
general shell, filesystem, or HTTP plugin capabilities to the webview.

The Phase 0 Tauri spike is disposable evidence. Phase 1 must scaffold production code
from the accepted boundaries and tests rather than promote or copy the spike as an
implicit architecture.

## Evidence and rationale

- Security, process, filesystem, credential, packaging, UI, and graph gates pass
  equivalently in both candidates on Windows x64 and macOS ARM64.
- Tauri packages measured 9,548,800 bytes on Windows and 10,787,643 bytes on macOS,
  about 98% smaller than the equivalent Electron packages.
- Tauri's observed macOS idle/stress working set was about 77% lower. Windows WebView2
  process-tree memory was 10–15% higher than Electron, so memory is not claimed as a
  universal Tauri advantage.
- Electron cold start was about 0.5 seconds faster on Windows and 1.2 seconds faster on
  macOS. Both candidates nevertheless kept the required 10k interaction and Monaco
  observations below 100 ms; Tauri was substantially faster for the synthetic macOS
  graph workload.
- Tauri adds Rust expertise, 454 transitive Cargo registry packages, and more
  candidate-specific spike code. That cost is acceptable because the typed core and
  explicit capability model align with the least-privilege architecture, while the
  size reduction is material for private desktop distribution.

## Consequences

Phase 1 requires reviewed Rust and JavaScript/TypeScript toolchains, locked dependency
updates, WebView2 coverage on current supported Windows, and WKWebView coverage on
current Apple Silicon macOS. Platform WebView behavior must remain explicit; a pass on
one engine never implies a pass on the other. Release work must add installer/package
content review, signing/notarisation, SBOM/provenance planning, and licence review.

The initial Tauri production capability set contains only the main local window and
named application commands. Credentials remain core-only in Keychain/Credential
Manager. Project inspection does not run Ren'Py; trusted SDK operations use direct
arguments, a minimal environment, bounded/redacted output, cancellation, and the
exact-version adapter accepted in ADR 0002.

Electron remains a documented fallback. Reconsider this ADR through a superseding
record if a supported system WebView causes an unresolved Monaco, media,
accessibility, graph, or packaged-E2E defect; if WebView2 deployment becomes
unreliable; or if Rust integration/maintenance materially blocks delivery. Startup
time and Windows memory should be remeasured on the Phase 1 vertical slice, but are
not by themselves reasons to change the decision.

## Alternatives considered

- **Electron:** functionally and securely viable, with faster measured startup and a
  single TypeScript/JavaScript language surface. Rejected for now because its packages
  were roughly 37–51 times larger, its macOS memory observation was much higher, and
  its broader bundled runtime did not produce a reliability advantage in the tested
  gates.
- **A third native framework:** not tested after both retained candidates passed. It
  would expand scope without answering a remaining Phase 0 risk.
- **Continue stack-neutral indefinitely:** rejected because all predeclared decision
  gates are complete and Phase 1 needs one explicit runtime boundary.
