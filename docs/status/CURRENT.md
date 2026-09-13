# Current status

**Updated:** 2026-09-13<br>
**Phase:** 0 complete; Phase 1 awaiting explicit approval<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- Phase 0 is complete. No production application has been created and Phase 1 has not
  begun.
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
- Both disposable candidates pass equivalent packaged security/filesystem/process,
  shared UI/WebView, native credential, and deterministic 1k/10k/50k graph gates on
  Windows x64 and macOS ARM64. The final comparative run 34733246868 passed all twelve
  measurement launches and every preceding target check.
- Tauri measured about 98% smaller packages on both targets and about 77% lower
  process-tree working set on macOS. Electron started about 0.5 seconds faster on
  Windows and 1.2 seconds faster on macOS; Tauri's Windows WebView2 process tree used
  about 10–15% more memory. Both met the fixed interaction and Monaco responsiveness
  criteria. Rust/toolchain and dependency breadth are accepted Tauri costs.
- Preview/source mapping is explicitly classified: literal declarations and exact
  navigation can be faithful; engine-dependent staging is approximate; Python-driven
  screens, media decode, translations/generated behavior remain runtime-only.
- CI evidence is path-scoped, cache-safe, checksum-preserving, and green. Failed runs
  and limitations remain documented rather than hidden by retries.
- Confirmed targets are Windows x86-64 and macOS Apple Silicon ARM64 only. Intel macOS
  is out of scope.
- Manual NVDA/VoiceOver behavior, subjective media quality, physical SmartScreen and
  browser-origin quarantine, signing/notarisation, complete system accounting of
  WKWebView services, and production automatic-layout performance are later physical
  or implementation gates. They are not inferred successes and do not block the
  evidence-based Phase 0 decision.

## Next action

Do not implement Phase 1 without explicit approval. The exact bounded entry plan is
the [Phase 1 scaffold task](../tasks/active/phase-1-scaffold.md). Its first approved
work would create only the production Tauri workspace, narrow capability/command
boundary, shared validation fixtures, and CI skeleton needed for the vertical slice;
the Phase 0 spike remains disposable and must not be promoted wholesale.

The completed evidence task is archived at
[2026-09-13-phase-0-evidence-spikes.md](../tasks/archive/2026-09-13-phase-0-evidence-spikes.md),
and the exact completion handover is in [HANDOVER.md](HANDOVER.md).
