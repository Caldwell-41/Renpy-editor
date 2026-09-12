# Shared UI and WebView spike results

**Status:** In progress<br>
**Targets:** Windows x86-64 WebView2 and bundled Chromium; macOS ARM64 WKWebView and bundled Chromium

## Question

Can one shared Monaco-based disposable UI provide equivalent dock/resizing, keyboard/
focus, accessibility semantics, reduced-motion, synthetic drag/drop, and local image/
audio/video behavior in packaged Electron and Tauri candidates on both supported
platforms?

## Success criteria

- Both candidates pass the same packaged wide (1180×760 requested) and narrow
  (720×600 requested) evidence function on Windows x64 and macOS ARM64.
- Left, right, and bottom dock positions are semantic and collapsible; keyboard
  separators update their exposed values and cause Monaco to relayout.
- A documented shortcut collapses/restores a panel, visible focus can enter controls,
  and collapsing a focused panel returns focus to its toggle.
- Buttons have accessible names, dock toggles expose state/relationships, separators
  expose orientation/range/value, and live regions exist. Hosted automation does not
  claim a manual NVDA, VoiceOver, or other screen-reader interaction pass.
- The OS reduced-motion query is reflected in UI state and a CSS reduced-motion rule
  exists regardless of the runner's current preference.
- One synthetic drag event carries an SVG image, WAV audio, and WebM video `File`.
  The UI creates labelled local object-URL previews with controls for audio/video and
  no network operation.
- Each engine records `canPlayType` observations for WAV, MP3, H.264 MP4, and VP9/
  Opus WebM. Capability strings are observations, not proof that every real asset
  decodes or plays correctly.
- A trivial Monaco edit completes within the deliberately loose 250 ms spike guard;
  detailed interaction/startup/memory measurements remain a later comparison gate.
- Any false assertion exits the packaged process non-zero. Results record engine,
  platform, requested mode, actual inner dimensions, measurements, failures, and
  limitations.

## Implementation boundary

The shared surface remains under `spikes/desktop-shells/` and is disposable. It adds
no production framework or Phase 1 architecture. Synthetic media is constructed in
memory and is neither committed as binary content nor uploaded. Tauri's UI result
command is accepted only while the explicit evidence environment mode is present.

## Results

Target evidence is pending. Local TypeScript compilation, shared Node tests, and the
Vite UI build must pass before the changed-path matrix is published.

## Known limitations

- GitHub-hosted runners can validate DOM semantics and packaged WebView behavior but
  not a human screen-reader workflow, subjective keyboard comfort, or media quality.
- `canPlayType` depends on runtime/OS codec support and does not guarantee decode.
- Synthetic drag/drop proves Web API and application handling; native shell/file-
  manager drag gestures still require a later physical-device UX check.
- Wide/narrow launches prove responsive behavior at two native window sizes, not all
  DPI, zoom, monitor, or accessibility text-scale configurations.
