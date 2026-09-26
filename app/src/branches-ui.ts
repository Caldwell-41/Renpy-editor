export interface FlowLocation { readonly path: string; readonly revision: string; readonly byteStart: number; readonly byteEnd: number }
export interface FlowNode { readonly sceneId: string; readonly name: string; readonly label: string; readonly location: FlowLocation | null; readonly partial: boolean; readonly stale: boolean }
export type FlowDestination = { readonly kind: "resolved"; readonly sceneId: string } | { readonly kind: "missing"; readonly label: string } | { readonly kind: "unknown"; readonly label: string | null; readonly location: FlowLocation | null } | { readonly kind: "terminal" };
export interface FlowEdge { readonly id: string; readonly sceneId: string; readonly beatId: string | null; readonly optionOrdinal: number | null; readonly text: string; readonly kind: string; readonly location: FlowLocation; readonly destination: FlowDestination; readonly editable: boolean }
export interface FlowWorkspace { readonly entryLocation?: FlowLocation | null; readonly entryNotice?: string; readonly revision: string; readonly entrySceneId: string; readonly nodes: readonly FlowNode[]; readonly edges: readonly FlowEdge[]; readonly partial: boolean; readonly stale: boolean; readonly overLimit: boolean; readonly notice: string }
export interface BranchesActions {
  readonly load: () => Promise<FlowWorkspace>;
  readonly source: (location?: FlowLocation) => void;
  readonly scene: (node: FlowNode, edge?: FlowEdge) => void;
  readonly status: (message: string, kind?: "normal" | "error") => void;
}
export interface Point { readonly x: number; readonly y: number }
/** Deterministic bounded grid; positions are convenience, never execution order. */
export function layoutFlow(nodes: readonly FlowNode[]): ReadonlyMap<string, Point> {
  if (nodes.length > 500) return new Map();
  return new Map([...nodes].sort((a, b) => a.label.localeCompare(b.label) || a.sceneId.localeCompare(b.sceneId)).map((node, index) => [node.sceneId, { x: 40 + (index % 5) * 250, y: 40 + Math.floor(index / 5) * 110 }]));
}
function button(text: string, action: () => void): HTMLButtonElement { const node = document.createElement("button"); node.className = "button"; node.type = "button"; node.textContent = text; node.addEventListener("click", action); return node; }
export function renderBranches(host: HTMLElement, actions: BranchesActions): () => void {
  let disposed = false; let sequence = 0; let loading = false; let model: FlowWorkspace | undefined; let selectedScene: string | undefined; let selectedEdge: string | undefined;
  let zoom = 1; let panX = 0; let panY = 0; let drag: { x: number; y: number } | undefined;
  const title = document.createElement("h2"); title.textContent = "Branches";
  const note = document.createElement("p"); note.className = "branches-notice"; note.setAttribute("role", "status"); note.textContent = "Loading accepted flow…";
  const toolbar = document.createElement("div"); toolbar.className = "branches-toolbar";
  const refreshButton = button("Refresh flow", () => { void refresh(); });
  const viewport = document.createElement("div"); viewport.className = "branches-viewport"; viewport.tabIndex = 0; viewport.setAttribute("aria-label", "Branch graph. Arrow keys pan; plus and minus zoom; Home fits the graph.");
  const canvas = document.createElement("div"); canvas.className = "branches-canvas"; viewport.append(canvas);
  const controls = document.createElement("div"); controls.className = "branches-controls";
  const select = document.createElement("select"); select.setAttribute("aria-label", "Selected Scene");
  const details = document.createElement("div"); details.className = "branches-details";
  const edgeSelect = document.createElement("select"); edgeSelect.setAttribute("aria-label", "Selected route");
  const transform = (): void => { canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; };
  const fit = (): void => { const rows = Math.max(1, Math.ceil((model?.nodes.length ?? 0) / 5)); zoom = Math.min(1, (viewport.clientWidth || 900) / 1330, (viewport.clientHeight || 500) / (rows * 110 + 60)); zoom = Math.max(.05, zoom); panX = 0; panY = 0; transform(); };
  const scale = (factor: number): void => { zoom = Math.min(2, Math.max(.05, zoom * factor)); transform(); };
  toolbar.append(refreshButton, button("Zoom in", () => scale(1.2)), button("Zoom out", () => scale(1 / 1.2)), button("Fit graph", fit), button("Open Source", () => actions.source()), button("View project start", () => actions.source(model?.entryLocation ?? undefined)));
  controls.append(select, edgeSelect, details); host.replaceChildren(title, toolbar, note, viewport, controls);
  const navigate = async (action: () => void): Promise<void> => {
    if (loading || !model || model.stale) return;
    const before = model.revision; const current = await refresh();
    if (disposed) return;
    if (!current || current.stale || current.revision !== before) { actions.status("Flow changed. Select a current route before navigating.", "error"); return; }
    action();
  };
  const showDetails = (): void => {
    details.replaceChildren(); const node = model?.nodes.find((item) => item.sceneId === selectedScene);
    const routes = model?.edges.filter((edge) => edge.sceneId === selectedScene) ?? [];
    edgeSelect.replaceChildren(); const placeholder = document.createElement("option"); placeholder.value = ""; placeholder.textContent = "Choose a route"; edgeSelect.append(placeholder);
    for (const edge of routes) { const option = document.createElement("option"); option.value = edge.id; option.textContent = `${edge.optionOrdinal === null ? "" : `${edge.optionOrdinal + 1}. `}${edge.text} — ${edge.destination.kind}`; edgeSelect.append(option); }
    if (!routes.some((edge) => edge.id === selectedEdge)) selectedEdge = undefined;
    edgeSelect.value = selectedEdge ?? "";
    canvas.querySelectorAll<SVGElement>("[data-edge-id]").forEach((item) => item.classList.toggle("selected", item.dataset.edgeId === selectedEdge));
    canvas.querySelectorAll<HTMLElement>(".branch-node").forEach((item) => { item.classList.toggle("selected", item.dataset.sceneId === selectedScene); item.setAttribute("aria-pressed", String(item.dataset.sceneId === selectedScene)); });
    if (!node) return;
    const description = document.createElement("p"); description.textContent = `${node.name} · ${node.label}${node.sceneId === model?.entrySceneId ? " · Entry" : ""}${node.partial ? " · Partial" : ""}${node.stale ? " · Stale" : ""}`; details.append(description);
    const edge = routes.find((item) => item.id === selectedEdge);
    const openScene = button(edge?.editable ? "Edit Choice / Jump" : "Open Scene", () => { void navigate(() => actions.scene(node, edge?.editable ? edge : undefined)); }); openScene.disabled = Boolean(model?.stale || node.stale || !node.location); details.append(openScene);
    if (edge || node.location) { const source = button("View origin in Source", () => { void navigate(() => actions.source(edge?.location ?? node.location ?? undefined)); }); source.disabled = Boolean(model?.stale); details.append(source); }
    if (edge?.destination.kind === "resolved") { const id = edge.destination.sceneId; const destination = model?.nodes.find((item) => item.sceneId === id); if (destination) details.append(button("Open destination", () => { void navigate(() => actions.scene(destination)); })); }
    if (edge?.destination.kind === "unknown" && edge.destination.location) { const location = edge.destination.location; details.append(button("View unmapped destination", () => { void navigate(() => actions.source(location)); })); }
    if (edge) { const text = document.createElement("p"); text.textContent = edge.destination.kind === "missing" ? `Missing label: ${edge.destination.label}` : edge.destination.kind === "terminal" ? "Return / End has no destination edge." : edge.destination.kind === "unknown" ? "Unresolved / custom flow. This graph does not prove every route." : "Use the existing Scene controls to change or create a destination."; details.append(text); }
  };
  select.addEventListener("change", () => { selectedScene = select.value || undefined; selectedEdge = undefined; showDetails(); });
  edgeSelect.addEventListener("change", () => { selectedEdge = edgeSelect.value || undefined; showDetails(); edgeSelect.focus(); });
  function draw(): void {
    if (!model) return; canvas.replaceChildren(); select.replaceChildren(); note.textContent = [model.notice, model.entryNotice].filter(Boolean).join(" ");
    if (model.overLimit || model.nodes.length > 500 || model.edges.length > 2000) { note.textContent = model.overLimit ? model.notice : "Graph limit exceeded. Open Source to continue."; selectedScene = undefined; selectedEdge = undefined; showDetails(); return; }
    if (!model.nodes.some((node) => node.sceneId === selectedScene)) { selectedScene = undefined; selectedEdge = undefined; }
    const placeholder = document.createElement("option"); placeholder.value = ""; placeholder.textContent = "Choose a Scene"; select.append(placeholder);
    const positions = layoutFlow(model.nodes);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.classList.add("branches-lines"); svg.setAttribute("width", "1330"); svg.setAttribute("height", String(Math.ceil(model.nodes.length / 5) * 110 + 60)); svg.setAttribute("aria-hidden", "true"); canvas.append(svg);
    const defs = document.createElementNS(svg.namespaceURI, "defs"); const marker = document.createElementNS(svg.namespaceURI, "marker"); marker.setAttribute("id", "branches-arrow"); marker.setAttribute("viewBox", "0 0 10 10"); marker.setAttribute("refX", "10"); marker.setAttribute("refY", "5"); marker.setAttribute("markerWidth", "6"); marker.setAttribute("markerHeight", "6"); marker.setAttribute("orient", "auto-start-reverse"); const arrow = document.createElementNS(svg.namespaceURI, "path"); arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z"); marker.append(arrow); defs.append(marker); svg.append(defs);
    for (const edge of model.edges) {
      if (edge.destination.kind !== "resolved") continue;
      const from = positions.get(edge.sceneId); const to = positions.get(edge.destination.sceneId); if (!from || !to) continue;
      const path = document.createElementNS(svg.namespaceURI, "path");
      const d = from === to ? `M ${from.x + 30} ${from.y} C ${from.x - 20} ${from.y - 40}, ${from.x + 180} ${from.y - 40}, ${from.x + 140} ${from.y}` : `M ${from.x + 100} ${from.y} C ${from.x + 100} ${Math.min(from.y, to.y) - 30 - (edge.optionOrdinal ?? 0) % 4 * 8}, ${to.x + 100} ${Math.min(from.y, to.y) - 30 - (edge.optionOrdinal ?? 0) % 4 * 8}, ${to.x + 100} ${to.y}`;
      path.setAttribute("d", d); path.setAttribute("marker-end", "url(#branches-arrow)"); path.setAttribute("data-edge-id", edge.id); svg.append(path);
    }
    for (const node of model.nodes) {
      const option = document.createElement("option"); option.value = node.sceneId; option.textContent = node.name; select.append(option);
      const point = positions.get(node.sceneId)!; const card = button(`${node.name}${node.sceneId === model.entrySceneId ? " · Entry" : ""}`, () => { selectedScene = node.sceneId; selectedEdge = undefined; select.value = node.sceneId; showDetails(); });
      card.className = "branch-node"; card.dataset.sceneId = node.sceneId; card.style.left = `${point.x}px`; card.style.top = `${point.y}px`; card.title = node.label; canvas.append(card);
    }
    select.value = selectedScene ?? ""; showDetails(); transform();
  }
  async function refresh(): Promise<FlowWorkspace | undefined> {
    if (loading || disposed) return; loading = true; refreshButton.disabled = true; const request = ++sequence;
    try { const next = await actions.load(); if (disposed || request !== sequence) return; const initial = model === undefined; const focus = document.activeElement;
      if (model && model.revision === next.revision && model.stale === next.stale && model.notice === next.notice && model.overLimit === next.overLimit) return next;
      model = next.stale && !next.nodes.length && model && !next.overLimit ? { ...model, stale: true, partial: true, notice: next.notice } : next; draw(); if (initial) fit();
      if (focus === select) select.focus(); else if (focus === edgeSelect) edgeSelect.focus();
      return next;
    } catch (error) { if (!disposed && request === sequence) { if (model) model = { ...model, stale: true }; note.textContent = "Last projection is stale; refresh failed. Open Source to inspect."; showDetails(); actions.status(error instanceof Error ? error.message : "Flow unavailable", "error"); } return;
    } finally { if (!disposed && request === sequence) { loading = false; refreshButton.disabled = false; } }
  }
  viewport.addEventListener("keydown", (event) => { if (event.target !== viewport) return; const moves: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }; const move = moves[event.key]; if (move) { panX += move[0]; panY += move[1]; } else if (event.key === "+" || event.key === "=") scale(1.2); else if (event.key === "-") scale(1 / 1.2); else if (event.key === "Home") fit(); else return; event.preventDefault(); transform(); });
  viewport.addEventListener("pointerdown", (event) => { if (event.target !== viewport && event.target !== canvas) return; drag = { x: event.clientX, y: event.clientY }; viewport.setPointerCapture?.(event.pointerId); });
  viewport.addEventListener("pointermove", (event) => { if (!drag) return; panX += event.clientX - drag.x; panY += event.clientY - drag.y; drag = { x: event.clientX, y: event.clientY }; transform(); });
  viewport.addEventListener("pointerup", () => { drag = undefined; }); viewport.addEventListener("pointercancel", () => { drag = undefined; });
  const onFocus = (): void => { void refresh(); }; window.addEventListener("focus", onFocus);
  const interval = "__TAURI_INTERNALS__" in window ? window.setInterval(() => { if (!document.hidden) void refresh(); }, 2000) : undefined;
  void refresh();
  return () => { disposed = true; sequence += 1; window.removeEventListener("focus", onFocus); if (interval !== undefined) window.clearInterval(interval); };
}
