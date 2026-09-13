type EditProbe = () => number;

type GraphArrays = {
  kind: Uint8Array;
  route: Uint8Array;
  next: Int32Array;
  branch: Int32Array;
  cycle: Int32Array;
  x: Float32Array;
  y: Float32Array;
};

const CASES = [1_000, 10_000, 50_000] as const;
const CHUNK = 512;
const FILTER_CHUNK = 1_024;
const round = (value: number) => Math.round(value * 100) / 100;
const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function generate(size: number): Promise<GraphArrays> {
  const graph: GraphArrays = {
    kind: new Uint8Array(size), route: new Uint8Array(size),
    next: new Int32Array(size), branch: new Int32Array(size), cycle: new Int32Array(size),
    x: new Float32Array(size), y: new Float32Array(size),
  };
  graph.next.fill(-1); graph.branch.fill(-1); graph.cycle.fill(-1);
  for (let start = 0; start < size; start += CHUNK) {
    const end = Math.min(size, start + CHUNK);
    for (let index = start; index < end; index += 1) {
      const choice = index % 11 === 0;
      const call = !choice && index % 17 === 0;
      graph.kind[index] = choice ? 1 : call ? 2 : 0;
      graph.route[index] = index % 7;
      if (index + 1 < size) graph.next[index] = index + 1;
      if (choice || call) graph.branch[index] = Math.min(size - 1, index + (choice ? 5 : 31));
      if (index > 50 && index % 101 === 0) graph.cycle[index] = index - 47;
    }
    await yieldToUi();
  }
  return graph;
}

async function layout(graph: GraphArrays): Promise<number> {
  const columns = Math.ceil(Math.sqrt(graph.kind.length));
  let checksum = 0;
  for (let start = 0; start < graph.kind.length; start += CHUNK) {
    const end = Math.min(graph.kind.length, start + CHUNK);
    for (let index = start; index < end; index += 1) {
      graph.x[index] = (index % columns) * 48 + graph.route[index] * 2;
      graph.y[index] = Math.floor(index / columns) * 28 + graph.kind[index] * 3;
      checksum = (checksum + Math.trunc(graph.x[index] * 31 + graph.y[index] * 17 + index)) >>> 0;
    }
    await yieldToUi();
  }
  return checksum;
}

async function filterGraph(graph: GraphArrays): Promise<number> {
  let matches = 0;
  for (let start = 0; start < graph.kind.length; start += FILTER_CHUNK) {
    const end = Math.min(graph.kind.length, start + FILTER_CHUNK);
    for (let index = start; index < end; index += 1) {
      if (graph.route[index] === 3 && (graph.kind[index] !== 0 || index % 13 === 0)) matches += 1;
    }
    await yieldToUi();
  }
  return matches;
}

async function highlightPath(graph: GraphArrays): Promise<{ visited: number; reached: boolean }> {
  const seen = new Uint8Array(graph.kind.length);
  const queue = new Int32Array(graph.kind.length);
  let head = 0; let tail = 1; let visited = 0;
  seen[0] = 1; queue[0] = 0;
  const target = graph.kind.length - 1;
  while (head < tail) {
    const node = queue[head++]; visited += 1;
    if (node === target) return { visited, reached: true };
    for (const adjacent of [graph.next[node], graph.branch[node], graph.cycle[node]]) {
      if (adjacent >= 0 && seen[adjacent] === 0) { seen[adjacent] = 1; queue[tail++] = adjacent; }
    }
    if (head % 1_024 === 0) await yieldToUi();
  }
  return { visited, reached: false };
}

function cull(graph: GraphArrays, left: number, top: number): number[] {
  const visible = [];
  const right = left + 960; const bottom = top + 600;
  for (let index = 0; index < graph.kind.length; index += 1) {
    if (graph.x[index] >= left && graph.x[index] <= right && graph.y[index] >= top && graph.y[index] <= bottom) visible.push(index);
  }
  return visible;
}

function draw(context: CanvasRenderingContext2D, graph: GraphArrays, visible: number[], left: number, top: number) {
  context.clearRect(0, 0, 960, 600);
  for (const index of visible) {
    context.fillStyle = graph.kind[index] === 1 ? "#d8a657" : graph.kind[index] === 2 ? "#7aa2f7" : "#8fbf8f";
    context.fillRect(graph.x[index] - left, graph.y[index] - top, 5, 5);
  }
}

function p95(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
}

async function runCase(size: number, context: CanvasRenderingContext2D, edit: EditProbe) {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const memoryBefore = memory?.usedJSHeapSize ?? null;
  const longTasks: number[] = [];
  const longTaskSupported = PerformanceObserver.supportedEntryTypes.includes("longtask");
  const observer = longTaskSupported ? new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((entry) => entry.duration))) : null;
  observer?.observe({ entryTypes: ["longtask"] });
  let editorEditDelayMs: number | null = null; let editorEditLatencyMs: number | null = null;
  const editScheduled = performance.now();
  const editPromise = new Promise<void>((resolve) => setTimeout(() => {
    editorEditDelayMs = performance.now() - editScheduled;
    editorEditLatencyMs = edit();
    resolve();
  }, 0));

  const totalStarted = performance.now();
  const generationStarted = performance.now();
  const graph = await generate(size);
  const generationMs = performance.now() - generationStarted;
  const layoutStarted = performance.now();
  const firstChecksum = await layout(graph);
  const layoutMs = performance.now() - layoutStarted;
  await editPromise;
  const filterStarted = performance.now();
  const filterMatches = await filterGraph(graph);
  const filterMs = performance.now() - filterStarted;
  const pathStarted = performance.now();
  const path = await highlightPath(graph);
  const pathHighlightMs = performance.now() - pathStarted;
  const cullStarted = performance.now();
  const initialVisible = cull(graph, 0, 0);
  draw(context, graph, initialVisible, 0, 0);
  const viewportCullMs = performance.now() - cullStarted;
  const interactionTimes = [];
  let maxDrawn = initialVisible.length;
  for (let step = 1; step <= 12; step += 1) {
    const started = performance.now();
    const left = step * 73; const top = step * 41;
    const visible = cull(graph, left, top);
    draw(context, graph, visible, left, top);
    maxDrawn = Math.max(maxDrawn, visible.length);
    interactionTimes.push(performance.now() - started);
    await yieldToUi();
  }
  const relayoutStarted = performance.now();
  const secondChecksum = await layout(graph);
  const stableRelayoutMs = performance.now() - relayoutStarted;
  await yieldToUi();
  observer?.disconnect();
  const totalMs = performance.now() - totalStarted;
  const memoryAfter = memory?.usedJSHeapSize ?? null;
  const topology = {
    choices: graph.kind.reduce((count, kind) => count + Number(kind === 1), 0),
    calls: graph.kind.reduce((count, kind) => count + Number(kind === 2), 0),
    cycles: graph.cycle.reduce((count, target) => count + Number(target >= 0), 0),
    reconvergences: graph.branch.reduce((count, target) => count + Number(target >= 0), 0),
  };
  const usability = generationMs + layoutMs < 2_000 && filterMs < 500 && pathHighlightMs < 1_000 && totalMs < 5_000;
  const stress = totalMs < 15_000;
  const passed = topology.choices > 0 && topology.calls > 0 && topology.cycles > 0 && topology.reconvergences > 0
    && filterMatches > 0 && path.reached && initialVisible.length > 0 && maxDrawn <= 600
    && viewportCullMs < 100 && p95(interactionTimes) < 100 && firstChecksum === secondChecksum
    && editorEditDelayMs !== null && editorEditDelayMs < 100 && editorEditLatencyMs !== null && editorEditLatencyMs < 100
    && (size <= 10_000 ? usability : stress);
  return {
    size, passed, usabilityTarget: size === 10_000, stressCase: size === 50_000, topology,
    generationMs: round(generationMs), layoutMs: round(layoutMs), filterMs: round(filterMs),
    filterMatches, pathHighlightMs: round(pathHighlightMs), pathVisited: path.visited,
    viewportCullMs: round(viewportCullMs), initialDrawn: initialVisible.length, maxDrawn,
    interactionP95Ms: round(p95(interactionTimes)), stableRelayout: firstChecksum === secondChecksum,
    stableRelayoutMs: round(stableRelayoutMs), editorEditDelayMs: round(editorEditDelayMs),
    editorEditLatencyMs: round(editorEditLatencyMs), totalMs: round(totalMs),
    longTaskSupported, longTaskCount: longTasks.length, longTaskMaxMs: round(Math.max(0, ...longTasks)),
    memoryAvailable: memoryBefore !== null && memoryAfter !== null,
    jsHeapDeltaBytes: memoryBefore !== null && memoryAfter !== null ? memoryAfter - memoryBefore : null,
    typedArrayBytes: graph.kind.byteLength + graph.route.byteLength + graph.next.byteLength + graph.branch.byteLength + graph.cycle.byteLength + graph.x.byteLength + graph.y.byteLength,
  };
}

export async function runGraphEvidence(edit: EditProbe) {
  const canvas = document.createElement("canvas");
  canvas.width = 960; canvas.height = 600;
  canvas.style.cssText = "position:fixed;left:-10000px;top:0";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  try {
    const cases = [];
    for (const size of CASES) cases.push(await runCase(size, context, edit));
    return { passed: cases.every((item) => item.passed), usability10kPassed: cases.find((item) => item.size === 10_000)?.passed === true, cases };
  } finally {
    canvas.remove();
  }
}
