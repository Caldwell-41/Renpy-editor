# Branch-graph scale spike results

**Status:** Complete automated packaged checkpoint<br>
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

[Desktop evidence run 34722954424](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722954424)
passed every assertion on Windows x64 and macOS ARM64. The packaged Electron and
Tauri applications called the same shared measurement function. The 10,000-node
usability target passed in bundled Chromium, Windows WebView2, and macOS WKWebView;
the 50,000-node stress case also completed within its separate 15-second bound.

The deterministic topology was identical in all four packaged executions:

| Nodes | Choices | Calls | Backward cycles | Reconvergences | Filter matches | Path visited | Typed arrays |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 91 | 53 | 9 | 144 | 31 | 963 | 22,000 B |
| 10,000 | 910 | 535 | 99 | 1,445 | 300 | 9,958 | 220,000 B |
| 50,000 | 4,546 | 2,674 | 495 | 7,220 | 1,502 | 49,957 | 1,100,000 B |

Core timings in milliseconds:

| Target / engine | Nodes | Generate | Layout | Filter | Path | Stable relayout | Total | Pass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Windows Electron / Chromium | 1,000 | 13.1 | 0.3 | 0.1 | 0.5 | 9.5 | 88.8 | yes |
| Windows Electron / Chromium | 10,000 | 97.3 | 84.1 | 82.1 | 39.4 | 87.9 | 459.6 | yes |
| Windows Electron / Chromium | 50,000 | 410.5 | 401.3 | 397.4 | 199.3 | 403.1 | 1,879.8 | yes |
| Windows Tauri / WebView2 | 1,000 | 9.9 | 0.2 | 4.6 | 0.6 | 10.0 | 95.4 | yes |
| Windows Tauri / WebView2 | 10,000 | 94.2 | 87.2 | 100.7 | 40.1 | 91.2 | 479.2 | yes |
| Windows Tauri / WebView2 | 50,000 | 436.6 | 403.4 | 403.3 | 198.1 | 428.1 | 1,935.1 | yes |
| macOS Electron / Chromium | 1,000 | 6.7 | 0.3 | 0.1 | 0.2 | 66.8 | 268.3 | yes |
| macOS Electron / Chromium | 10,000 | 266.0 | 372.8 | 493.2 | 267.6 | 445.1 | 2,089.2 | yes |
| macOS Electron / Chromium | 50,000 | 2,382.4 | 2,366.8 | 2,598.2 | 1,341.5 | 2,471.3 | 11,324.4 | yes |
| macOS Tauri / WKWebView | 1,000 | 7 | 1 | 0 | 0 | 17 | 104 | yes |
| macOS Tauri / WKWebView | 10,000 | 164 | 168 | 171 | 81 | 159 | 856 | yes |
| macOS Tauri / WKWebView | 50,000 | 816 | 784 | 783 | 385 | 785 | 3,657 | yes |

Virtualization and editor-coexistence observations:

| Target / engine | Nodes | Cull | Drawn initial/max | Pan/draw p95 | Editor delay/edit | Long tasks | Heap observation |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Windows Electron / Chromium | 1k / 10k / 50k | 1.0 / 0.8 / 0.2 | 443/444; 443/444; 440/461 | 0.4 / 0.3 / 0.3 | 0.5/11.0; 4.6/2.8; 4.4/2.8 | 0 (supported) | 0 B delta (available) |
| Windows Tauri / WebView2 | 1k / 10k / 50k | 1.1 / 0.1 / 0.2 | 443/444; 443/444; 440/461 | 1.1 / 0.2 / 0.3 | 1.0/8.7; 4.4/3.1; 4.3/2.7 | 0 (supported) | 0 B delta (available) |
| macOS Electron / Chromium | 1k / 10k / 50k | 0.3 / 0.5 / 0.3 | 443/444; 443/444; 440/461 | 0.3 / 0.2 / 0.3 | 0.2/6.5; 6.8/2.3; 36.2/1.8 | 0 (supported) | 0 B delta (available) |
| macOS Tauri / WKWebView | 1k / 10k / 50k | 1 / 1 / 0 | 443/444; 443/444; 440/461 | 1 / 1 / 1 | 0/7; 8/2; 12/16 | unavailable | unavailable |

All timing cells are milliseconds. Every stable-relayout checksum matched. At most
461 nodes were drawn, below the predeclared 600-node culling limit. The worst observed
timer delay was 36.2 ms and the worst Monaco edit was 16 ms, both below 100 ms. The
Chromium Long Tasks API reported no qualifying long task; WKWebView did not expose
that observer type, so the result is recorded as unavailable rather than a zero.

The Chromium `performance.memory` surface was present but reported a zero heap delta
at all three measurement boundaries. That is an engine observation, not proof that
the workload allocated no memory. WKWebView did not expose the surface. The explicit
typed-array footprint is therefore the only comparable deterministic memory measure.

### Reproduction

Run 34722954424 used Windows Server 2025 x64 image
`windows-2025-vs2026/20260907.229` and macOS 26 ARM64 image
`macos-26-arm64/20260907.0351`, Rust/Cargo 1.98.1, Node 22.23.2 on Windows and
Node 24.20.0 on macOS. Dependency inputs pin Electron 44.3.0, Tauri CLI 2.11.4,
Tauri API 2.11.1, and Monaco 0.52.2.

After `npm ci`, `npm test`, and candidate packaging, CI invoked each packaged binary
with `LOOMLIGHT_SPIKE_GRAPH_PROBE=1`. A failed assertion makes the application exit
non-zero. The run retained the usual unsigned, private candidate packages for seven
days; it did not retain a graph-data artifact because the complete structured results
are in the job logs and the fixture is deterministically regenerated from source.

## Conclusion

This checkpoint supports a shared virtualized graph surface for either desktop
candidate and closes only the 10,000-node question for this seeded grid/canvas
workload. It does not validate an automatic-layout engine, authored graph mutations,
selection/dragging, route recomputation after edits, or production data/model costs.
Those remain a blocking production graph-performance gate after a layout engine and
interactive authoring workload are selected. This synthetic result did not distinguish
Electron from Tauri alone; the comparison is recorded in DESKTOP_SPIKE_RESULTS.md.

## Known limitations

- Hosted virtual machines do not represent all GPU drivers, display scale, power
  modes, or physical input devices. Timings are comparative observations, not product
  budgets.
- `performance.memory` is Chromium-specific and non-standard. When unavailable, the
  result retains `null` rather than inventing a WKWebView memory figure.
- A deterministic grid-like layout does not prove that a future automatic graph
  layout library can meet these timings. That production dependency remains a later
  implementation decision.
