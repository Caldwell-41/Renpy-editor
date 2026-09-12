# Shared UI and WebView spike results

**Status:** Complete automated packaged checkpoint; manual assistive-technology checks remain a later physical-device task<br>
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

Initial target run
[34701229006](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34701229006)
passed repository quality and each Electron wide probe, then failed both narrow
Electron probes only because the test focused the inspector after responsive CSS had
hidden it. Windows wide was 1008×655 with a 6.3 ms Monaco edit; macOS wide was
1024×645 with a 2.6 ms edit. Both jobs stopped before Tauri as required by the failed
gate. This was a test-fixture defect, not evidence that focus return worked.

The correction selects the visible left project dock in narrow mode and the right
inspector in wide mode. Final run
[34701370897](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34701370897)
passed the shared tests, both packaged candidates, and both viewport modes on each
supported target. Every row passed dock positions, keyboard resize, shortcut,
focus-return, accessible-name/separator/live-region, reduced-motion, three-file
synthetic drag/drop, labelled image and controlled audio/video preview, responsive
layout, and Monaco's 250 ms edit guard.

| Target / packaged engine | Mode | Inner viewport | Monaco edit | WAV | MP3 | H.264 MP4 | VP9/Opus WebM |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| Windows / Electron Chromium | Wide | 1008×655 | 6.8 ms | `maybe` | `probably` | `probably` | `probably` |
| Windows / Electron Chromium | Narrow | 704×535 | 7.5 ms | `maybe` | `probably` | `probably` | `probably` |
| Windows / Tauri WebView2 | Wide | 1028×749 | 7.4 ms | `maybe` | `probably` | `probably` | `probably` |
| Windows / Tauri WebView2 | Narrow | 720×600 | 8.3 ms | `maybe` | `probably` | `probably` | `probably` |
| macOS / Electron Chromium | Wide | 1024×645 | 2.9 ms | `maybe` | `probably` | `probably` | `probably` |
| macOS / Electron Chromium | Narrow | 720×568 | 2.6 ms | `maybe` | `probably` | `probably` | `probably` |
| macOS / Tauri WKWebView | Wide | 1024×645 | 4.0 ms | `maybe` | `maybe` | `probably` | `probably` |
| macOS / Tauri WKWebView | Narrow | 720×568 | 3.0 ms | `maybe` | `maybe` | `probably` | `probably` |

Windows WebView2 matched bundled Chromium's recorded codec strings. On macOS,
WKWebView reported MP3 as `maybe` where bundled Chromium reported `probably`; this is
an engine observation rather than a playback guarantee. Native window decorations
also produced different actual content dimensions from the same requested size,
especially for wide Windows Tauri. The responsive assertions therefore use observed
content dimensions rather than assuming cross-shell pixel identity.

## Known limitations

- GitHub-hosted runners can validate DOM semantics and packaged WebView behavior but
  not a human screen-reader workflow, subjective keyboard comfort, or media quality.
- `canPlayType` depends on runtime/OS codec support and does not guarantee decode.
- Synthetic drag/drop proves Web API and application handling; native shell/file-
  manager drag gestures still require a later physical-device UX check.
- Wide/narrow launches prove responsive behavior at two native window sizes, not all
  DPI, zoom, monitor, or accessibility text-scale configurations.
