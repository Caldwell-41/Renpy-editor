# Current status

**Updated:** 2026-09-12<br>
**Phase:** 0 — Foundation and proof<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- The repository foundation, canonical document set, security baseline, CI
  validation, fixture proposal, UI checkpoint, and bounded spike plans exist.
- Ren'Py 8.5.3 remains the verified stable compatibility baseline as of this date.
- ADR 0001 accepts exact source bytes plus a conservative partial CST and verified
  range patches as the source architecture. The Phase 0 Python tokenizer is disposable.
- ADR 0002 accepts an exact-version, allowlisted SDK adapter and checksum-first staged
  installation boundary; only Linux integration evidence exists so far.
- The Crossroads at Sundown corpus has byte/hash baselines, BOM/CRLF cases, 12
  lossless-source tests, and a Linux Ren'Py 8.5.3 compile/lint/test/run/warp/PC-build
  pass. The SDK and generated artifacts remain outside Git.
- The SDK boundary has 19 dependency-free security/adapter tests. Windows and macOS
  SDK, filesystem, package install/launch, signing, and quarantine behavior are open.
- No desktop stack is accepted. The shared-contract Electron/Tauri spike now has green
  Windows x64/macOS ARM64 packaged evidence for narrow IPC/capabilities, arbitrary-
  process denial, network/popup/navigation denial, selected-root containment,
  SHA-stale rejection, same-directory replacement, external watching, symlinks,
  missing files, complex paths beyond 260 characters, and path/synthetic-sensitive-
  value redaction. Corrective run 34700476448 closes this checkpoint; preceding runs
  34691607349, 34699898544, and 34700215108 retain the discovered Windows navigation-
  gate, Electron log-path, and packaged macOS child-mode failures.
- The shared Monaco surface passes the same packaged wide/narrow UI behavior probe in
  Electron Chromium and Tauri WebView2/WKWebView on both targets. Run 34701370897
  covers docks/resizing, keyboard/focus, accessibility semantics, reduced motion,
  synthetic media drag/drop, codec observations, responsive layout, and a loose
  Monaco edit-latency guard. Manual NVDA/VoiceOver interaction and real media quality
  remain physical-device limitations, not inferred successes.
- Phase 0 evidence CI remains path-scoped and now cancels superseded push runs per
  workflow and branch. Desktop jobs cache platform/toolchain/dependency-specific
  Cargo inputs and dependency outputs; a verified warm run reduced Windows from
  15:23 to 5:42. The pinned SDK archive is cached by version and digest but is still
  checksum-verified before every extraction; its warm run remained about 1:10 because
  the probe, not the download, dominates.
- Confirmed targets are Windows x86-64 and macOS ARM64. Intel macOS is out of scope.
- No production application or package manifest exists.
- There are no blocking product questions. Remaining uncertainties are empirical
  and are captured in the active spike brief.

## Next action

Complete equivalent native credential-store prototypes in both packaged candidates.
Prove that synthetic credentials stay out of the renderer/UI, logs, project files,
retained artifacts, and source control; record Windows and macOS behavior separately.
Keep the work stack-neutral and disposable.

The exact continuation state and implementation checklist are recorded in the
[Phase 0 continuation handover](HANDOVER.md).
