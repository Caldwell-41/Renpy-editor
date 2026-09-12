# Branch-graph scale spike results

**Status:** In progress<br>
**Targets:** Windows x86-64 WebView2 and bundled Chromium; macOS ARM64 WKWebView and bundled Chromium

## Question

Can one stack-neutral, deterministic, virtualized branch-graph workload handle 1,000,
10,000, and 50,000 nodes in both packaged candidates without blocking Monaco, while
keeping the 10,000-node case usable?

## Success criteria

- One seeded generator creates the same node and edge arrays for every engine. Each
  size includes choices, calls, route filters, backward cycles, and reconvergence.
- Each case records chunked generation/layout, filter/search, path-highlight,
  viewport-cull, repeated pan/draw, stable-relayout, total time, topology counts,
  visible count, and defensible memory observations where exposed by the engine.
- Virtualization draws only nodes intersecting a 960×600 canvas viewport, with a
  deliberately loose maximum of 600 drawn nodes per interaction.
- A timer-scheduled Monaco edit runs during chunked graph construction. Callback delay
  and the edit itself must each stay below 100 ms; a supported Long Tasks observer
  also records count and maximum duration.
- The required 10,000-node usability case completes generation/layout within 2,000 ms,
  filter within 500 ms, path highlight within 1,000 ms, each viewport interaction at
  p95 below 100 ms, and the full case within 5,000 ms.
- The 1,000-node case must meet the same usability limits. The 50,000-node stress case
  must finish within 15,000 ms, preserve the editor/interaction/culling bounds, and is
  reported as stress evidence rather than silently weakening the 10,000-node gate.
- Every packaged Electron Chromium, Windows Tauri WebView2, and macOS Tauri WKWebView
  run uses the same function and exits non-zero if any required assertion fails.

## Implementation boundary

This is a disposable typed-array/canvas benchmark under `spikes/desktop-shells/`, not
the production graph model, renderer, or layout algorithm. Coordinates are a stable
synthetic layout intended to exercise scale, filtering, traversal, culling, canvas
drawing, event-loop yielding, and editor coexistence without selecting a graph library.

## Results

Target evidence is pending.

## Known limitations

- Hosted virtual machines do not represent all GPU drivers, display scale, power
  modes, or physical input devices. Timings are comparative observations, not product
  budgets.
- `performance.memory` is Chromium-specific and non-standard. When unavailable, the
  result retains `null` rather than inventing a WKWebView memory figure.
- A deterministic grid-like layout does not prove that a future automatic graph
  layout library can meet these timings. That production dependency remains a later
  implementation decision.
