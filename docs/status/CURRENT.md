# Current status

**Updated:** 2026-09-13<br>
**Phase:** 0 corrective checkpoint in progress; Phase 1 blocked<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- Phase 0's architecture decisions remain in force, but corrective target validation
  is pending. No production application has been created and Phase 1 has not begun.
- ADR 0001 accepts exact `.rpy` source bytes, a conservative partial CST, and verified
  minimal range patches. Authoritative source, formatting, comments, custom syntax,
  embedded Python, and unsupported regions remain losslessly preserved.
- ADR 0002 accepts the exact-version Ren'Py adapter and checksum-first staged install.
  Ren'Py 8.5.3 passes version, compile, lint, test, run, warp, diagnostics,
  distribution, containment-checked install, and package launch on Windows x64 and
  macOS ARM64 in run 34731460283, plus the Linux regression baseline.
- ADR 0003 accepts Tauri 2 as the desktop runtime: an unprivileged shared web UI over
  named schema-validated commands in a Rust privileged core. Electron is the explicit
  fallback under ADR-defined reconsideration conditions.
- Corrective source tests now refuse priority-init Python, target literal-speaker
  dialogue correctly, encode quotes/backslashes, and preserve unrelated bytes.
- Desktop adapters now use core-owned approved-project registries, explicit Tauri
  application permissions, and a bounded serialized save/recovery policy. Fresh
  Windows x64/macOS ARM64 packaged checks are required; old green runs are historical.
- Tauri's measured application payload was about 98% smaller, but this excludes
  installer/first-install footprint and Windows WebView2. The macOS sampler could omit
  WKWebView/XPC services, so the old 77% figure is not total-memory evidence. Tauri
  remains selected for architectural fit with accepted maintenance/delivery costs.
- Preview/source mapping is explicitly classified: literal declarations and exact
  navigation can be faithful; engine-dependent staging is approximate; Python-driven
  screens, media decode, translations/generated behavior remain runtime-only.
- Existing CI remains path-scoped and cache-safe. Corrective runs are not yet green;
  old runs do not validate the changed code or permissions.
- Confirmed targets are Windows x86-64 and macOS Apple Silicon ARM64 only. Intel macOS
  is out of scope.
- Manual NVDA/VoiceOver behavior, subjective media quality, physical SmartScreen and
  browser-origin quarantine, signing/notarisation, complete system accounting of
  WKWebView services, and production automatic-layout performance are later physical
  or implementation gates. They are not inferred successes and do not block the
  evidence-based Phase 0 decision.

## Next action

Do not implement Phase 1 while the corrective checkpoint remains open or without
explicit approval. The later bounded entry plan is
the [Phase 1 scaffold task](../tasks/active/phase-1-scaffold.md). Its first approved
work would create only the production Tauri workspace, narrow capability/command
boundary, shared validation fixtures, and CI skeleton needed for the vertical slice;
the Phase 0 spike remains disposable and must not be promoted wholesale.

The completed evidence task is archived at
[2026-09-13-phase-0-evidence-spikes.md](../tasks/archive/2026-09-13-phase-0-evidence-spikes.md),
and the exact completion handover is in [HANDOVER.md](HANDOVER.md).
