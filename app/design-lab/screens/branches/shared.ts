import type { LabContext } from "../../contracts.ts";
import { action, element, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { kindCaption, story, type Route, type Scene } from "./fixture.ts";
import "./style.css";

type Mode = "atlas" | "desk";
type Position = { x: number; y: number };
const ns = "http://www.w3.org/2000/svg";
export function mountBranches(host: HTMLElement, context: LabContext, mode: Mode) {
  const data = story(context.state === "long");
  if (context.state === "empty") { data.scenes = []; data.routes = []; }
  let selected = data.scenes[1]?.id ?? data.scenes[0]?.id ?? "";
  let routeId = "", detailsOpen = true, failed = context.state === "error", disposed = false;
  let zoom = 1, pan = { x: 0, y: 0 }, drag: Position | undefined;
  let positions = new Map<string, Position>();
  let graphSize = { width: 740, height: 930 };
  const page = labPage(host, context, { screen: "branches", title: "Branches", subtitle: mode === "atlas" ? "See where the story goes" : "Follow the routes around a scene" });
  page.shell.classList.add("bf-shell"); page.content.classList.add("bf-content"); page.content.dataset.mode = mode;
  const refreshed = action(failed ? "Retry refresh" : "Refresh flow", () => {
    refreshed.disabled = true; observation.textContent = "Checking fictional saved flow…";
    window.setTimeout(() => {
      if (disposed) return;
      failed = false; refreshed.textContent = "Refresh flow"; refreshed.disabled = false;
      showObservation(); page.status.textContent = "Sample flow refreshed. Selection and view retained.";
    }, 220);
  });
  const start = action("Project start", () => preview("Source", "Project start", "label start:\n    scene bg tram\n    \"The last tram stops in a city without a timetable.\"\n    jump platform"));
  start.title = "View project start in Source";
  page.tools.append(start, refreshed);
  const observation = element("div", "bf-observation"); observation.role = "status";
  function showObservation() {
    observation.dataset.error = String(failed);
    observation.replaceChildren(element("span", "bf-dot"), element("span", "", failed ? "Refresh failed. Showing the last observed saved flow." : "Last observed saved flow · Sample snapshot"));
    const notice = element("span", "bf-observation-note", "Custom routes may be incomplete."); observation.append(notice);
  }
  showObservation();
  const layout = element("div", "bf-layout");
  const index = element("aside", "bf-index"); index.ariaLabel = "Scene index";
  const search = element("input"); search.type = "search"; search.placeholder = "Find a scene"; search.ariaLabel = "Find a scene";
  const indexList = element("div", "bf-index-list");
  index.append(search, indexList);
  search.oninput = renderIndex;
  const workspace = element("section", "bf-workspace"); workspace.ariaLabel = mode === "atlas" ? "Whole-story map" : "Routes around the selected scene";
  const toolbar = element("div", "bf-toolbar");
  const picker = element("select"); picker.ariaLabel = "Selected scene";
  for (const s of data.scenes) { const option = element("option", "", s.name); option.value = s.id; picker.append(option); }
  picker.value = selected; picker.disabled = !data.scenes.length;
  picker.onchange = () => selectScene(picker.value);
  const counts = element("span", "bf-counts", `${data.scenes.length} scenes · ${data.routes.length} routes`);
  const detailsToggle = action("Scene details", () => { detailsOpen = !detailsOpen; updateDetailsVisibility(); });
  detailsToggle.ariaExpanded = "true";
  toolbar.append(picker, counts, detailsToggle);
  const viewport = element("div", "bf-viewport"); viewport.tabIndex = 0;
  viewport.ariaLabel = "Branch graph. Arrow keys pan, plus and minus zoom, Home fits the graph.";
  const canvas = element("div", "bf-canvas"); viewport.append(canvas);
  const controls = element("div", "bf-view-controls");
  const zoomLabel = element("output", "bf-zoom", "100%"); zoomLabel.ariaLabel = "Graph zoom";
  const zoomOut = action("−", () => scale(1 / 1.2)); zoomOut.ariaLabel = zoomOut.title = "Zoom out";
  const zoomIn = action("+", () => scale(1.2)); zoomIn.ariaLabel = zoomIn.title = "Zoom in";
  const fit = action("Fit", fitGraph); fit.ariaLabel = "Fit graph";
  const focus = action("Focus", focusScene); focus.ariaLabel = "Focus selection";
  controls.append(zoomOut, zoomLabel, zoomIn, fit, focus);
  const mapWrap = element("div", "bf-map-wrap"); mapWrap.append(viewport, controls);
  const mapNote = element("p", "bf-map-note", mode === "atlas" ? "Select a scene or route · Drag the canvas to pan" : "Direct neighbours shown · Route numbers match the outgoing list");
  workspace.append(toolbar, mapWrap, mapNote);
  const inspector = element("aside", "bf-inspector"); inspector.ariaLabel = "Scene details";
  layout.append(...(mode === "desk" ? [index, workspace, inspector] : [workspace, inspector]));
  page.content.append(observation, layout);

  function preview(kind: string, title: string, snippet: string) {
    const previous = document.activeElement;
    const dialog = element("dialog", "lp-dialog bf-preview"); dialog.ariaLabel = `${kind} navigation preview`;
    const head = element("div", "bf-preview-heading"); head.append(icon(kind === "Source" ? "source" : "story"), element("span", "eyebrow", `${kind} · Navigation preview`));
    const code = element("pre", "bf-source", snippet);
    dialog.append(head, element("h2", "", title), element("p", "muted", "This opens the captured location in the real app. Here, the fictional destination is read-only."), code,
      action("Back to Branches", () => dialog.close(), true));
    dialog.onclose = () => { dialog.remove(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
    page.shell.append(dialog); dialog.showModal(); page.status.textContent = `${kind} destination preview opened`;
  }
  function sceneFor(id = selected) { return data.scenes.find(s => s.id === id); }
  function routesFor(id = selected) { return data.routes.filter(r => r.from === id); }
  function selectScene(id: string) {
    selected = id; routeId = ""; picker.value = id; detailsOpen = true;
    renderIndex(); renderGraph(mode === "desk"); renderInspector(); updateDetailsVisibility();
    if (mode === "desk") focusScene();
    page.status.textContent = `${sceneFor()?.name ?? "Scene"} selected`;
  }
  function selectRoute(route: Route) {
    const changed = selected !== route.from;
    selected = route.from; picker.value = selected; routeId = route.id; detailsOpen = true;
    renderIndex(); renderGraph(mode === "desk" && changed); renderInspector(); updateDetailsVisibility();
    if (mode === "desk" && changed) focusScene();
    page.status.textContent = `${route.text} · ${kindCaption[route.kind]}`;
  }
  function renderIndex() {
    indexList.replaceChildren(); let chapter = "";
    const matches = data.scenes.filter(s => `${s.name} ${s.label}`.toLowerCase().includes(search.value.toLowerCase()));
    for (const s of matches) {
      if (s.chapter !== chapter) { chapter = s.chapter; indexList.append(element("p", "bf-chapter", chapter)); }
      const b = action("", () => selectScene(s.id)); b.className = "bf-index-scene";
      b.append(element("span", "", s.name), element("small", "", s.label)); b.ariaLabel = s.name;
      b.ariaPressed = String(s.id === selected); b.dataset.indexScene = s.id; indexList.append(b);
    }
    if (!matches.length) indexList.append(element("p", "bf-no-matches", data.scenes.length ? "No matching scenes." : "No scenes yet."));
  }
  function updateDetailsVisibility() {
    inspector.hidden = !detailsOpen || !data.scenes.length;
    layout.dataset.detailsOpen = String(detailsOpen && !!data.scenes.length);
    detailsToggle.ariaExpanded = String(detailsOpen && !!data.scenes.length);
  }
  function renderInspector() {
    inspector.replaceChildren(); const scene = sceneFor(); if (!scene) return;
    const header = element("div", "bf-detail-heading");
    header.append(element("span", "eyebrow", routeId ? "Selected route" : "Selected scene"));
    const close = action("×", () => {
      detailsOpen = false; updateDetailsVisibility();
      (canvas.querySelector<HTMLButtonElement>(`[data-scene="${selected}"]`) ?? detailsToggle).focus();
    }); close.className = "icon-button"; close.ariaLabel = close.title = "Close Scene details"; header.append(close);
    inspector.append(header);
    const route = data.routes.find(r => r.id === routeId);
    inspector.append(element("h2", "bf-detail-title", scene.name), element("code", "bf-label", `label ${scene.label}`));
    if (route) {
      const routeCard = element("section", "bf-route-context"); routeCard.append(element("span", "bf-kind", kindCaption[route.kind]), element("h3", "", route.text));
      if (route.condition) routeCard.append(element("p", "bf-condition", route.condition), element("p", "muted", "Possible guarded route. Conditions are not evaluated here."));
      const messages: Partial<Record<Route["kind"], string>> = {
        missing: 'Missing destination label "service_passage". Inspect the origin in Source.',
        unknown: "Unresolved custom flow. The graph cannot prove where this route goes. Inspect the expression in Source.",
        body: "Possible flow within this scene. Open its exact body to inspect the dialogue.",
        call: "Calls a scene, then returns to the continuation. The graph does not execute the call.",
        terminal: "Returns to the caller, or ends the story when there is no caller. There is no fixed destination.",
      };
      const message = messages[route.kind]; if (message) routeCard.append(element("p", "bf-explanation", message));
      if (route.to) routeCard.append(element("p", "bf-destination", `To ${sceneFor(route.to)?.name}`));
      inspector.append(routeCard);
    } else inspector.append(element("p", "bf-summary", scene.summary));
    const nav = element("div", "bf-nav-actions");
    const editable = route && ["choice", "jump"].includes(route.kind) && !route.condition;
    const sceneAction = action(editable ? "Edit Choice / Jump" : "Open in Story", () => preview("Story", scene.name,
      route ? `Scene: ${scene.name}\nSelected ${kindCaption[route.kind].toLowerCase()}: ${route.text}\n\nThe real app opens the existing Scene controls at this beat.` : `Scene: ${scene.name}\n\n${scene.summary}`), true);
    sceneAction.prepend(icon("story"));
    nav.append(sceneAction, action("View origin in Source", () => preview("Source", route ? route.text : scene.name, sourceSnippet(scene, route))));
    if (route?.to) nav.append(action("Open destination", () => selectScene(route.to!)));
    if (route?.kind === "body") {
      nav.append(action("Open destination body in Story", () => preview("Story", "Platform · Otherwise body", 'Mara: "I can wait a little longer."\nEli: "Then listen carefully."')),
        action("View destination body in Source", () => preview("Source", "Platform · Otherwise body", 'else:\n    mara "I can wait a little longer."\n    eli "Then listen carefully."')));
    }
    if (route?.kind === "unknown") nav.append(action("View unmapped destination", () => preview("Source", "Custom route expression", "jump expression next_stop()\n\n# This expression is not evaluated during inspection.")));
    if (route?.continuation) {
      nav.append(action("Open continuation in Story", () => preview("Story", route.continuation!, 'Eli: "Now you remember why you came."')),
        action("View continuation in Source", () => preview("Source", route.continuation!, 'call memory\neli "Now you remember why you came."\njump departure')));
    }
    inspector.append(nav);
    const routeSection = element("section", "bf-routes");
    routeSection.append(element("h3", "", `Outgoing routes · ${routesFor().length}`));
    for (const r of routesFor()) {
      const b = action("", () => selectRoute(r)); b.className = "bf-route-row"; b.dataset.route = r.id;
      b.ariaLabel = r.text; b.ariaPressed = String(r.id === routeId);
      b.append(element("span", "", `${mode === "desk" ? `${routesFor().indexOf(r) + 1}. ` : ""}${r.text}`), element("small", "", `${kindCaption[r.kind]}${r.condition ? " · Guarded" : ""}`)); routeSection.append(b);
    }
    inspector.append(routeSection);
    const incoming = data.routes.filter(r => r.to === selected);
    if (incoming.length) {
      const section = element("section", "bf-incoming"); section.append(element("h3", "", "Incoming"));
      for (const r of incoming) {
        const s = sceneFor(r.from)!; const b = action(s.name, () => selectScene(s.id)); b.className = "bf-incoming-link"; section.append(b);
      }
      inspector.append(section);
    }
  }
  function sourceSnippet(scene: Scene, route?: Route) {
    if (!route) return `label ${scene.label}:\n    # ${scene.name}\n    "${scene.summary}"`;
    if (route.kind === "missing") return '"Open the service passage":\n    jump service_passage\n\n# No label named service_passage was found.';
    if (route.kind === "unknown") return "jump expression next_stop()";
    if (route.kind === "body") return 'else:\n    mara "I can wait a little longer."';
    if (route.kind === "terminal") return "return";
    return `${route.condition ? "if has_ticket:\n    " : ""}${route.kind === "call" ? "call" : "jump"} ${sceneFor(route.to)?.label ?? "departure"}`;
  }
  function renderGraph(rebuild: boolean) {
    if (!rebuild && canvas.childElementCount) {
      canvas.querySelectorAll<HTMLElement>("[data-scene]").forEach(b => b.ariaPressed = String(b.dataset.scene === selected));
      canvas.querySelectorAll<Element>("[data-graph-route]").forEach(b => b.classList.toggle("bf-selected-route", b.getAttribute("data-graph-route") === routeId));
      return;
    }
    canvas.replaceChildren(); positions = new Map();
    if (!data.scenes.length) {
      const empty = element("div", "bf-empty"); empty.append(icon("branches"), element("h2", "", "No scenes mapped yet"), element("p", "", "Branches shows the story flow found in saved source. Open Source to inspect the starting point."), action("Open Source", () => preview("Source", "Empty story", "# Add a label and story in Source to create a mapped scene."), true));
      viewport.append(empty); controls.hidden = true; return;
    }
    let nodes: Scene[], graphRoutes: Route[];
    if (mode === "atlas") {
      nodes = data.scenes; graphRoutes = data.routes.filter(r => r.to);
      nodes.forEach(s => positions.set(s.id, { x: s.x, y: s.y }));
      graphSize = { width: Math.max(...nodes.map(s => s.x)) + 200, height: Math.max(...nodes.map(s => s.y)) + 110 };
    } else {
      const incoming = data.routes.filter(r => r.to === selected);
      const outgoing = routesFor().filter(r => r.to);
      const before = [...new Set(incoming.map(r => r.from))]; const after = [...new Set(outgoing.map(r => r.to!))];
      const ids = [...new Set([...before, selected, ...after])]; nodes = ids.map(id => sceneFor(id)!);
      positions.set(selected, { x: 240, y: 24 + Math.max(before.length, after.length, 1) * 33 });
      before.forEach((id, i) => positions.set(id, { x: 0, y: 24 + i * 110 }));
      after.forEach((id, i) => positions.set(id, { x: 480, y: 24 + i * 110 }));
      graphRoutes = [...incoming, ...outgoing]; graphSize = { width: 680, height: Math.max(before.length, after.length, 1) * 110 + 25 };
    }
    canvas.style.width = `${graphSize.width}px`; canvas.style.height = `${graphSize.height}px`;
    const svg = document.createElementNS(ns, "svg"); svg.classList.add("bf-lines"); svg.setAttribute("width", String(graphSize.width)); svg.setAttribute("height", String(graphSize.height));
    svg.setAttribute("aria-hidden", "true");
    const defs = document.createElementNS(ns, "defs"); const marker = document.createElementNS(ns, "marker"); marker.id = "bf-arrow"; marker.setAttribute("viewBox", "0 0 10 10"); marker.setAttribute("refX", "9"); marker.setAttribute("refY", "5"); marker.setAttribute("markerWidth", "6"); marker.setAttribute("markerHeight", "6"); marker.setAttribute("orient", "auto");
    const arrow = document.createElementNS(ns, "path"); arrow.setAttribute("d", "M 0 1 L 9 5 L 0 9"); marker.append(arrow); defs.append(marker); svg.append(defs);
    for (const r of graphRoutes) {
      const a = positions.get(r.from)!, b = positions.get(r.to!)!; const path = document.createElementNS(ns, "path");
      const horizontal = mode === "desk";
      const x1 = a.x + (horizontal ? 180 : 90), y1 = a.y + (horizontal ? 37 : 76);
      const x2 = b.x + (horizontal ? 0 : 90), y2 = b.y + (horizontal ? 37 : 0);
      const mid = horizontal ? (x1 + x2) / 2 : (y1 + y2) / 2;
      const d = horizontal ? `M${x1},${y1} H${mid - 8} Q${mid},${y1} ${mid},${y1 + Math.sign(y2 - y1) * 8} V${y2 - Math.sign(y2 - y1) * 8} Q${mid},${y2} ${mid + 8},${y2} H${x2}` : `M${x1},${y1} V${mid - 10} Q${x1},${mid} ${x1 + Math.sign(x2 - x1) * 10},${mid} H${x2 - Math.sign(x2 - x1) * 10} Q${x2},${mid} ${x2},${mid + 10} V${y2}`;
      path.setAttribute("d", d); path.setAttribute("marker-end", "url(#bf-arrow)"); path.dataset.graphRoute = r.id;
      if (r.id === routeId) path.classList.add("bf-selected-route");
      if (r.condition) path.classList.add("bf-guarded"); svg.append(path);
      // A wide transparent hit target keeps route selection usable at small scales.
      const hit = path.cloneNode() as SVGPathElement; hit.removeAttribute("marker-end"); hit.classList.add("bf-edge-hit"); hit.onclick = () => selectRoute(r); svg.append(hit);
      const caption = mode === "desk" ? r.kind === "choice" ? `Choice ${routesFor(r.from).indexOf(r) + 1}` : r.kind === "call" ? "Call" : kindCaption[r.kind] : r.kind === "choice" ? r.text : kindCaption[r.kind];
      const label = action(caption, () => selectRoute(r));
      label.className = "bf-edge-label"; label.dataset.graphRoute = r.id; label.ariaLabel = `Select route: ${r.text}`;
      label.style.left = `${horizontal ? mid : (x1 + x2) / 2}px`; label.style.top = `${horizontal ? (y1 + y2) / 2 - 14 : mid - 13}px`;
      label.title = r.text; canvas.append(label);
    }
    canvas.prepend(svg);
    for (const s of nodes) {
      const p = positions.get(s.id)!; const node = action("", () => selectScene(s.id)); node.className = "bf-node"; node.dataset.scene = s.id;
      node.style.left = `${p.x}px`; node.style.top = `${p.y}px`; node.ariaPressed = String(s.id === selected); node.ariaLabel = `Scene: ${s.name}`; node.title = s.name;
      node.append(element("span", "bf-node-number", s.id === "start" ? "START" : String(data.scenes.indexOf(s) + 1).padStart(2, "0")), element("strong", "", s.name));
      const uncertain = routesFor(s.id).some(r => ["missing", "unknown"].includes(r.kind));
      node.append(element("small", uncertain ? "bf-node-warning" : "", uncertain ? "2 routes need inspection" : `${routesFor(s.id).length} outgoing ${routesFor(s.id).length === 1 ? "route" : "routes"}`));
      node.ondblclick = () => preview("Story", s.name, s.summary); canvas.append(node);
    }
    transform();
  }
  function transform() { canvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`; zoomLabel.value = `${Math.round(zoom * 100)}%`; }
  function fitGraph() {
    const reserve = 0;
    zoom = Math.max(.08, Math.min(1, (viewport.clientWidth - 48) / graphSize.width, (viewport.clientHeight - 48 - reserve) / graphSize.height));
    pan = { x: (viewport.clientWidth - graphSize.width * zoom) / 2, y: Math.max(18, (viewport.clientHeight - graphSize.height * zoom - reserve) / 2) };
    transform();
  }
  function scale(factor: number) {
    const next = Math.max(.08, Math.min(2, zoom * factor)); const x = viewport.clientWidth / 2, y = viewport.clientHeight / 2;
    pan = { x: x - (x - pan.x) * next / zoom, y: y - (y - pan.y) * next / zoom }; zoom = next; transform();
  }
  function focusScene() { const p = positions.get(selected); if (!p) return; zoom = 1; pan = { x: viewport.clientWidth / 2 - p.x - 90, y: viewport.clientHeight * .36 - p.y - 38 }; transform(); }
  viewport.onkeydown = event => {
    if (event.target !== viewport) return;
    const moves: Record<string, Position> = { ArrowLeft: { x: 40, y: 0 }, ArrowRight: { x: -40, y: 0 }, ArrowUp: { x: 0, y: 40 }, ArrowDown: { x: 0, y: -40 } };
    if (moves[event.key]) { const move = moves[event.key]!; pan.x += move.x; pan.y += move.y; transform(); }
    else if (["+", "="].includes(event.key)) scale(1.2); else if (event.key === "-") scale(1 / 1.2); else if (event.key === "Home") fitGraph(); else return;
    event.preventDefault();
  };
  viewport.onwheel = event => { event.preventDefault(); scale(Math.exp(-event.deltaY * .001)); };
  viewport.onpointerdown = event => {
    if (event.target !== viewport && event.target !== canvas && event.target !== canvas.querySelector("svg")) return;
    drag = { x: event.clientX, y: event.clientY }; viewport.setPointerCapture(event.pointerId); viewport.classList.add("bf-dragging");
  };
  viewport.onpointermove = event => { if (!drag) return; pan.x += event.clientX - drag.x; pan.y += event.clientY - drag.y; drag = { x: event.clientX, y: event.clientY }; transform(); };
  const stopDrag = () => { drag = undefined; viewport.classList.remove("bf-dragging"); };
  viewport.onpointerup = stopDrag; viewport.onpointercancel = stopDrag;
  page.content.onkeydown = event => {
    if (event.key === "Escape" && detailsOpen && !page.shell.querySelector("dialog[open]")) {
      detailsOpen = false; updateDetailsVisibility(); detailsToggle.focus(); event.preventDefault();
    }
  };
  renderIndex(); renderGraph(true); renderInspector(); updateDetailsVisibility();
  let observedSize = { width: 0, height: 0 };
  const initialView = () => {
    if (!data.scenes.length) return;
    if (mode === "desk") {
      zoom = Math.min(1, (viewport.clientWidth - 40) / graphSize.width, (viewport.clientHeight - 32) / graphSize.height);
      pan = { x: (viewport.clientWidth - graphSize.width * zoom) / 2, y: (viewport.clientHeight - graphSize.height * zoom) / 2 - 10 };
    } else {
      const p = positions.get(selected)!;
      zoom = innerWidth <= 700 ? .7 : .95;
      pan = { x: viewport.clientWidth / 2 - (p.x + 90) * zoom, y: viewport.clientHeight * .3 - (p.y + 38) * zoom };
    }
    transform(); observedSize = { width: viewport.clientWidth, height: viewport.clientHeight };
  };
  const frame = requestAnimationFrame(initialView);
  const resize = new ResizeObserver(() => {
    if (!observedSize.width) { initialView(); return; }
    if (!drag) {
      pan.x += (viewport.clientWidth - observedSize.width) / 2;
      pan.y += (viewport.clientHeight - observedSize.height) / 2;
      transform();
    }
    observedSize = { width: viewport.clientWidth, height: viewport.clientHeight };
  }); resize.observe(viewport);
  return () => { disposed = true; cancelAnimationFrame(frame); resize.disconnect(); };
}
