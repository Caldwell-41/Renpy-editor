import { layoutFor, saveLayout } from "./preferences.ts";
export interface FlowLocation { readonly path: string; readonly revision: string; readonly byteStart: number; readonly byteEnd: number }
export interface FlowNode { readonly sceneId: string; readonly name: string; readonly label: string; readonly location: FlowLocation | null; readonly partial: boolean; readonly stale: boolean }
export type FlowDestination = { readonly kind: "resolved"; readonly sceneId: string } | { readonly kind: "missing"; readonly label: string } | { readonly kind: "unknown"; readonly label: string | null; readonly location: FlowLocation | null } | { readonly kind: "terminal" };
export interface FlowEdge { readonly id: string; readonly sceneId: string; readonly beatId: string | null; readonly optionOrdinal: number | null; readonly text: string; readonly kind: string; readonly location: FlowLocation; readonly destination: FlowDestination; readonly editable: boolean }
export interface FlowWorkspace { readonly observation?: { readonly status: string; readonly fromCache?: boolean; readonly checkedAt: number | null }; readonly entryLocation?: FlowLocation | null; readonly entryNotice?: string; readonly revision: string; readonly entrySceneId: string; readonly nodes: readonly FlowNode[]; readonly edges: readonly FlowEdge[]; readonly partial: boolean; readonly stale: boolean; readonly overLimit: boolean; readonly notice: string }
export interface BranchesActions {
  readonly layoutKey?: string;
  readonly load: (refresh: boolean) => Promise<FlowWorkspace>;
  readonly source: (location?: FlowLocation) => void;
  readonly scene: (node: FlowNode, edge?: FlowEdge) => void;
  readonly status: (message: string, kind?: "normal" | "error") => void;
}
export interface Point { readonly x: number; readonly y: number }
/** Deterministic layers of the known graph. Cycles stay bounded; no execution claim. */
export function layoutFlow(nodes: readonly FlowNode[], edges: readonly FlowEdge[] = []): ReadonlyMap<string, Point> {
  if(nodes.length>500 || edges.length>2000)return new Map();
  const sorted=[...nodes].sort((a,b)=>a.label.localeCompare(b.label)||a.sceneId.localeCompare(b.sceneId));
  const links=new Map(sorted.map(n=>[n.sceneId,[] as string[]]));const incoming=new Set<string>();
  for(const e of edges)if(e.destination.kind==="resolved"&&links.has(e.sceneId)&&links.has(e.destination.sceneId)){links.get(e.sceneId)!.push(e.destination.sceneId);incoming.add(e.destination.sceneId);}
  links.forEach(a=>a.sort());const levels=new Map<string,number>();let offset=0;
  const visit=(id:string):void=>{const queue:[string,number][]=[[id,offset]];for(let i=0;i<queue.length;i++){const [current,depth]=queue[i]!;if(levels.has(current))continue;levels.set(current,depth);for(const next of links.get(current)??[])if(!levels.has(next))queue.push([next,depth+1]);}offset=Math.max(...levels.values())+1;};
  for(const n of sorted.filter(n=>!incoming.has(n.sceneId)))if(!levels.has(n.sceneId))visit(n.sceneId);
  for(const n of sorted)if(!levels.has(n.sceneId))visit(n.sceneId);
  const rows=new Map<number,FlowNode[]>();for(const n of sorted){const depth=levels.get(n.sceneId)!;rows.set(depth,[...(rows.get(depth)??[]),n]);}
  const width=Math.max(1,...[...rows.values()].map(r=>r.length))*280;
  const result=new Map<string,Point>();rows.forEach((row,depth)=>row.forEach((n,i)=>result.set(n.sceneId,{x:40+(width-row.length*280)/2+i*280,y:50+depth*160})));return result;
}
function button(text: string, action: () => void): HTMLButtonElement { const node = document.createElement("button"); node.className = "button"; node.type = "button"; node.textContent = text; node.addEventListener("click", action); return node; }
export function renderBranches(host: HTMLElement, actions: BranchesActions): () => void {
  let disposed = false; let sequence = 0; let loading = false; let queued = false; let model: FlowWorkspace | undefined; let selectedScene: string | undefined; let selectedEdge: string | undefined;
  const retained=actions.layoutKey?layoutFor(actions.layoutKey).graph:undefined;
  let zoom = retained?.zoom??1; let panX = retained?.x??0; let panY = retained?.y??0; let drag: { x: number; y: number } | undefined;
  const title = document.createElement("h2"); title.textContent = "Branches";
  const note = document.createElement("p"); note.className = "branches-notice"; note.setAttribute("role", "status"); note.textContent = "Last observed saved flow; custom/runtime routes may be incomplete.";
  const observation = document.createElement("p"); observation.className = "branches-observation"; observation.setAttribute("role", "status"); observation.textContent = "Checking disk";
  const toolbar = document.createElement("div"); toolbar.className = "branches-toolbar";
  const refreshButton = button("Refresh flow", () => { void refresh(); });
  const viewport = document.createElement("div"); viewport.className = "branches-viewport"; viewport.tabIndex = 0; viewport.setAttribute("aria-label", "Branch graph. Arrow keys pan; plus and minus zoom; Home fits the graph.");
  const canvas = document.createElement("div"); canvas.className = "branches-canvas"; viewport.append(canvas);
  const controls = document.createElement("div"); controls.className = "branches-controls";
  const select = document.createElement("select"); select.setAttribute("aria-label", "Selected Scene");
  const details = document.createElement("div"); details.className = "branches-details";
  const edgeSelect = document.createElement("select"); edgeSelect.setAttribute("aria-label", "Selected route");
  const transform = (): void => { canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; };
  const bounds=():{width:number;height:number}=>{const points=[...layoutFlow(model?.nodes??[],model?.edges??[]).values()];return {width:Math.max(280,...points.map(p=>p.x+240)),height:Math.max(200,...points.map(p=>p.y+120))};};
  const remember=():void=>{if(actions.layoutKey)saveLayout(actions.layoutKey,{graph:{zoom,x:panX,y:panY}});};
  const fit = (): void => {const b=bounds();zoom=Math.max(.05,Math.min(1,(viewport.clientWidth||900)/b.width,(viewport.clientHeight||500)/b.height));panX=viewport.clientWidth?(viewport.clientWidth-b.width*zoom)/2:0;panY=viewport.clientHeight?Math.max(0,(viewport.clientHeight-b.height*zoom)/2):0;transform();};
  const scale = (factor: number): void => { zoom = Math.min(2, Math.max(.05, zoom * factor)); transform(); };
  toolbar.append(refreshButton, button("Zoom in", () => scale(1.2)), button("Zoom out", () => scale(1 / 1.2)), button("Fit graph", fit), button("Open Source", () => actions.source()), button("View project start", () => actions.source(model?.entryLocation ?? undefined)));
  const inspector=button("Scene details",()=>{controls.hidden=!controls.hidden;inspector.ariaExpanded=String(!controls.hidden);});inspector.ariaExpanded="false";toolbar.append(inspector);controls.hidden=true;
  toolbar.append(button("Focus selection",()=>{const point=layoutFlow(model?.nodes??[],model?.edges??[]).get(selectedScene??"");if(point){zoom=1;panX=viewport.clientWidth/2-point.x-100;panY=viewport.clientHeight/2-point.y-30;transform();}}));
  controls.append(select, edgeSelect, details); host.replaceChildren(title, toolbar, observation, note, viewport, controls);
  // Captured targets are checked by Source/Scene at navigation. Panning and clicks
  // do not require a project-wide scan; enabled clicks also work during refresh.
  const navigate = (action: () => void): void => {
    if (disposed) return;
    if (!model) { actions.status("Flow is not available yet.", "error"); return; }
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
    const positions = layoutFlow(model.nodes,model.edges);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.classList.add("branches-lines"); svg.setAttribute("width", String(bounds().width)); svg.setAttribute("height", String(bounds().height)); svg.setAttribute("aria-hidden", "true"); canvas.append(svg);
    const defs = document.createElementNS(svg.namespaceURI, "defs"); const marker = document.createElementNS(svg.namespaceURI, "marker"); marker.setAttribute("id", "branches-arrow"); marker.setAttribute("viewBox", "0 0 10 10"); marker.setAttribute("refX", "10"); marker.setAttribute("refY", "5"); marker.setAttribute("markerWidth", "6"); marker.setAttribute("markerHeight", "6"); marker.setAttribute("orient", "auto-start-reverse"); const arrow = document.createElementNS(svg.namespaceURI, "path"); arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z"); marker.append(arrow); defs.append(marker); svg.append(defs);
    for (const edge of model.edges) {
      if (edge.destination.kind !== "resolved") continue;
      const from = positions.get(edge.sceneId); const to = positions.get(edge.destination.sceneId); if (!from || !to) continue;
      const path = document.createElementNS(svg.namespaceURI, "path");
      const d = from === to ? `M ${from.x+200} ${from.y+30} C ${from.x+260} ${from.y-50}, ${from.x-30} ${from.y-50}, ${from.x} ${from.y+30}` : `M ${from.x+100} ${from.y+60} C ${from.x+100} ${(from.y+60+to.y)/2}, ${to.x+100} ${(from.y+60+to.y)/2}, ${to.x+100} ${to.y}`;
      path.setAttribute("d", d); path.setAttribute("marker-end", "url(#branches-arrow)"); path.setAttribute("data-edge-id", edge.id); svg.append(path);
      if(edge.text&&model.edges.length<=100){const label=document.createElementNS(svg.namespaceURI,"text");label.textContent=edge.text.length>34?edge.text.slice(0,31)+"…":edge.text;label.setAttribute("x",String((from.x+to.x)/2+100));label.setAttribute("y",String((from.y+to.y)/2+24));label.setAttribute("text-anchor","middle");label.classList.add("branch-edge-label");svg.append(label);}
    }
    for (const node of model.nodes) {
      const option = document.createElement("option"); option.value = node.sceneId; option.textContent = node.name; select.append(option);
      const point = positions.get(node.sceneId)!; const card = button(`${node.name}${node.sceneId === model.entrySceneId ? " · Entry" : ""}`, () => { selectedScene = node.sceneId; selectedEdge = undefined; select.value = node.sceneId; controls.hidden=false;inspector.ariaExpanded="true";showDetails(); });
      card.addEventListener("dblclick",()=>{if(!node.stale&&node.location)navigate(()=>actions.scene(node));});card.className = "branch-node"; card.dataset.sceneId = node.sceneId; card.style.left = `${point.x}px`; card.style.top = `${point.y}px`; card.title = node.label; canvas.append(card);
    }
    select.value = selectedScene ?? ""; showDetails(); transform();
  }
  function showObservation(next: FlowWorkspace): void {
    const state = next.observation;
    observation.textContent = state?.status === "savedEdits" ? "Updated from saved edits"
      : state?.status === "incomplete" || next.stale || next.overLimit ? "Could not refresh completely. Inspect the flow notice or open Source."
      : state?.checkedAt != null ? `Checked at ${new Date(state.checkedAt).toLocaleTimeString()}` : "Last observed saved state";
  }
  async function refresh(disk = true): Promise<void> {
    if (disposed) return;
    if (loading) { queued = true; return; }
    loading = true; const request = ++sequence;
    observation.textContent = "Checking disk";
    try {
      const next = await actions.load(disk); if (disposed || request !== sequence) return;
      const initial = model === undefined; const focus = document.activeElement;
      const focusScene = focus instanceof HTMLElement ? focus.dataset.sceneId : undefined;
      const focusDetail = focus && details.contains(focus) ? focus.textContent : undefined;
      showObservation(next);
      // Display accepted edits immediately; opening an existing view also checks disk.
      if (!disk && (next.observation?.fromCache || next.observation?.status === "savedEdits")) queued = true;
      if (model && model.revision === next.revision && model.stale === next.stale && model.notice === next.notice && model.overLimit === next.overLimit) { model = next; note.textContent = [next.notice, next.entryNotice].filter(Boolean).join(" "); return; }
      // An incomplete acquisition must not erase the last usable graph.
      if (model && !next.overLimit && (next.stale || next.observation?.status === "incomplete")) { note.textContent = `${next.notice} Showing the last usable observed graph.`; return; }
      model = next; draw(); if (initial&&!retained) fit();
      if (focus === select) select.focus(); else if (focus === edgeSelect) edgeSelect.focus();
      else if (focusScene) [...canvas.querySelectorAll<HTMLElement>(".branch-node")].find(node => node.dataset.sceneId === focusScene)?.focus();
      else if (focusDetail) { const replacement = [...details.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === focusDetail); if (replacement && !replacement.disabled) replacement.focus(); else select.focus(); }
    } catch (error) {
      if (!disposed && request === sequence) { observation.textContent = model ? "Could not refresh. Showing the last observed saved state." : "Could not refresh. Open Source to inspect."; actions.status(error instanceof Error ? error.message : "Flow unavailable", "error"); }
    } finally {
      if (!disposed && request === sequence) { loading = false; if (queued) { queued = false; void refresh(); } }
    }
  }
  viewport.addEventListener("keydown", (event) => { if (event.target !== viewport) return; const moves: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }; const move = moves[event.key]; if (move) { panX += move[0]; panY += move[1]; } else if (event.key === "+" || event.key === "=") scale(1.2); else if (event.key === "-") scale(1 / 1.2); else if (event.key === "Home") fit(); else return; event.preventDefault(); transform(); });
  viewport.addEventListener("wheel",event=>{event.preventDefault();const box=viewport.getBoundingClientRect();const x=event.clientX-box.left,y=event.clientY-box.top;const previous=zoom;zoom=Math.min(2,Math.max(.05,zoom*Math.exp(-event.deltaY*.001)));panX=x-(x-panX)*zoom/previous;panY=y-(y-panY)*zoom/previous;transform();},{passive:false});
  viewport.addEventListener("pointerdown", (event) => { if (event.target !== viewport && event.target !== canvas) return; drag = { x: event.clientX, y: event.clientY }; viewport.setPointerCapture?.(event.pointerId); });
  viewport.addEventListener("pointermove", (event) => { if (!drag) return; panX += event.clientX - drag.x; panY += event.clientY - drag.y; drag = { x: event.clientX, y: event.clientY }; transform(); });
  viewport.addEventListener("pointerup", () => { drag = undefined; }); viewport.addEventListener("pointercancel", () => { drag = undefined; });
  const onFocus = (): void => { void refresh(); }; window.addEventListener("focus", onFocus);
  void refresh(false);
  return () => { remember();disposed = true; sequence += 1; window.removeEventListener("focus", onFocus); };
}
