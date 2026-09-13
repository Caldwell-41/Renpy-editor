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

Both candidates passed the original packaged checks. Corrective review found that the
caller-selected filesystem root, default application-command exposure, and save-race
claims did not establish the intended guarantees. The spike now uses a core-owned
approved-project registry, explicit application-command permissions, packaged
authorised/unauthorised-window checks, and deterministic concurrent-save tests. The
complete results, commands, failures, and limitations are recorded in the
[desktop-shell evidence](../research/DESKTOP_SPIKE_RESULTS.md).

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

- Corrective run 34743055306 passes the security, process, filesystem, media,
  packaging, UI, and graph checks on Windows x64 and macOS ARM64.
- The final corrective run measured Tauri application payloads of 9,613,312 bytes on
  Windows and 10,869,835 bytes on macOS, about 98% smaller than the unpacked Electron
  application payloads in that run. These are not installer-download or first-install
  footprint measurements.
  On Windows they exclude the shared WebView2 runtime.
- The macOS sampler saw one Tauri descendant and could omit launchd-owned WKWebView/XPC
  services. The approximately 77% difference is therefore removed as evidence of
  total application memory savings. Windows descendant-tree observations remain
  useful but do not establish a universal memory advantage.
- Electron cold start was about 0.5 seconds faster on Windows and 1.2 seconds faster on
  macOS. Both candidates nevertheless kept the required 10k interaction and Monaco
  observations below 100 ms; Tauri was substantially faster for the synthetic macOS
  graph workload.
- Tauri adds Rust expertise, 454 transitive Cargo registry packages, and more
  candidate-specific spike code. That cost is acceptable because the typed core and
  explicit capability model align with the least-privilege architecture. The decision
  rests on that fit plus source correctness and delivery feasibility, not payload size
  or incomplete macOS memory attribution alone.

## Consequences

Phase 1 requires reviewed Rust and JavaScript/TypeScript toolchains, locked dependency
updates, WebView2 coverage on current supported Windows, and WKWebView coverage on
current Apple Silicon macOS. Platform WebView behavior must remain explicit; a pass on
one engine never implies a pass on the other. Release work must add installer/package
content review, signing/notarisation, SBOM/provenance planning, and licence review.
The selected Windows strategy is Tauri's `downloadBootstrapper`: use the evergreen
system WebView2 where present and download/install it otherwise. This keeps the
runtime patched by Windows/Microsoft but requires network access when it is absent.
Offline installation and actual installed footprint remain release-validation gates.

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

- **Electron:** functionally viable, with faster measured startup and a single
  TypeScript/JavaScript language surface. Rejected for now because its broader bundled
  runtime did not produce a reliability advantage, while Tauri's typed privileged
  core and explicit capabilities better fit the intended boundary. Its larger
  application payload is supporting evidence only; incomplete macOS memory attribution
  is not used to choose between them.
- **A third native framework:** not tested after both retained candidates passed. It
  would expand scope without answering a remaining Phase 0 risk.
- **Continue stack-neutral indefinitely:** rejected because all predeclared decision
  gates are complete and Phase 1 needs one explicit runtime boundary.
