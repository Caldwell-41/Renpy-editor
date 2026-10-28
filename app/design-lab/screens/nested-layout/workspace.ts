import type { LabMount } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { elementIcon } from "../screens/elements.ts";
import "./style.css";

// Three structural proposals in the existing Screens shell. All data is fictional.
type Variant = "focused" | "worksheet" | "source-led";
type Kind = "screen" | "fixed" | "frame" | "window" | "vbox" | "hbox" | "grid" | "viewport" | "text" | "textbutton" | "custom";
type Item = { id: string; parent: string; kind: Kind; text: string; props: Record<string, string> };
const names: Record<Kind, string> = { screen:"Help", fixed:"Free layout group", frame:"Frame", window:"Window", vbox:"Vertical group", hbox:"Horizontal group", grid:"Grid", viewport:"Viewport", text:"Text", textbutton:"Text button", custom:"Custom footer" };
const containers = new Set<Kind>(["screen","fixed","frame","window","vbox","hbox","grid","viewport"]);
const single = new Set<Kind>(["frame","window","viewport"]);
const variants = ["focused", "worksheet", "source-led"] as const;
const titles = ["A · Focused inspector", "B · Hierarchy worksheet", "C · Source split"];
const make = (id:string,parent:string,kind:Kind,text="",props:Record<string,string>={}):Item => ({id,parent,kind,text,props});
const initial = () => [
  make("root","","screen"), make("fixed","root","fixed"),
  make("window","fixed","window","",{xsize:"880",ysize:"560",left_padding:"24",right_padding:"24",top_padding:"24",bottom_padding:"24"}),
  make("stack","window","vbox","",{spacing:"16"}), make("title","stack","text","Help"),
  make("row","stack","hbox","",{spacing:"24"}),
  make("nav","row","vbox","",{spacing:"12",xsize:"160"}), make("basics","nav","textbutton","Basics"), make("keys","nav","textbutton","Keys"),
  make("viewport","row","viewport","",{xsize:"580",ysize:"260"}),
  make("grid","viewport","grid","",{columns:"2",rows:"3",order:"rows",spacing:"16"}),
  ...["Advance","Click or Enter","Backlog","Mouse wheel up","Hide interface","H key"].map((t,i)=>make(`cell${i}`,"grid","text",t)),
  make("close","stack","textbutton","Close"), make("custom","fixed","custom","use custom_help_footer()"),
];
const descriptions: Partial<Record<Kind,string>> = {
  window:"A styled container with one direct child. Put a layout group inside it for several items.",
  hbox:"Places children from left to right. Source order controls their position.",
  vbox:"Places children from top to bottom. Source order controls their position.",
  grid:"Source order fills each row from left to right. Empty cells are allowed. Reorder siblings to change their cell.",
  viewport:"Clips its one child to the visible area. Scrolling controls remain in Source in this proposal.",
  frame:"A background container with one direct child.", fixed:"Children can be positioned independently. Later siblings draw in front.",
};
export function mountLayout(variant: Variant): LabMount {
 return (host, context) => {
  let nodes=initial(), selected=context.state==="constrained"?"cell0":context.state==="source-only"?"viewport":"grid";
  let step="design", conflict=context.state==="conflict", sequence=0, adding=false, sourceOpen=variant==="source-led";
  if(context.state==="source-only") nodes.find(n=>n.id==="viewport")!.props.ysize="panel_height()";
  const drafts=new Map<string,Item>();
  const history: {nodes:Item[];selected:string}[]=[], future: typeof history=[];
  const current=()=>nodes.find(n=>n.id===selected)!;
  const children=(id:string)=>nodes.filter(n=>n.parent===id);
  const display=(n:Item)=>n.kind==="text"||n.kind==="textbutton"?n.text:names[n.kind];
  const value=()=>drafts.get(selected)??current();
  const f=labPage(host,context,{screen:"screens",title:"Screens",subtitle:"",dirty:()=>drafts.size>0});
  f.shell.classList.add("nested-lab"); f.shell.dataset.variant=variant;
  f.heading.querySelector("p")?.remove(); f.shell.querySelector(".lp-sample")!.textContent="#42 · Prototype";
  f.shell.querySelector(".lp-fiction")!.textContent="Prototype · Fictional data · Memory only";
  const undo=action("Undo",()=>travel(history,future)),redo=action("Redo",()=>travel(future,history));
  const sourceToggle=action("Source",()=>{sourceOpen=!sourceOpen;render();});
  f.tools.append(action("Add element",()=>{adding=true;step="design";render();}),undo,redo,sourceToggle);
  const address=el("div","nl-address","Help / game/ui/help.rpy"),rail=el("nav","nl-rail"); rail.ariaLabel="Screen building steps";
  for(const [key,title] of [["choose","1  Choose"],["design","2  Design"],["connect","3  Connect"]]) {
    const b=action(title!,()=>{step=key!;render();});b.dataset.step=key;rail.append(b);
  }
  const work=el("div","nl-work"),outline=el("section","nl-outline"),stage=el("section","nl-stage"),inspector=el("section","nl-inspector"),sourcePanel=el("section","nl-source-panel");
  outline.ariaLabel="Element hierarchy"; inspector.ariaLabel="Layout inspector";
  const message=el("p","nl-feedback");message.role="alert";message.hidden=true;
  const stageHead=el("div","nl-stage-heading"),resolution=el("select");resolution.ariaLabel="Sample resolution";
  for(const t of ["1280 × 720","1024 × 768"])resolution.append(el("option","",t));
  resolution.onchange=()=>draw();
  stageHead.append(el("h2","","Help"),resolution);
  const canvas=el("div","nl-canvas"),path=el("nav","nl-path"),caption=el("p","nl-caption");path.ariaLabel="Selection path";
  const coverage=el("div","nl-coverage"); coverage.append(el("span","","Partial coverage · Custom footer stays in Source"), action("Inspect footer",()=>choose("custom")));
  stage.append(stageHead,canvas,path,caption,coverage);
  work.append(outline,stage,inspector,sourcePanel);f.content.append(address,rail,work);
  const switcher=el("nav","nl-switcher");switcher.ariaLabel="Prototype variations";
  function switchVariant(delta:number){const q=new URLSearchParams(location.search);q.set("variant",variants[(variants.indexOf(variant)+delta+3)%3]!);location.search=q.toString();}
  switcher.append(action("Previous variation",()=>switchVariant(-1)),el("span","",titles[variants.indexOf(variant)]!),action("Next variation",()=>switchVariant(1)));
  f.shell.append(switcher);
  const keyboard=(e:KeyboardEvent)=>{if(e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable]"))return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();switchVariant(e.key==="ArrowLeft"?-1:1);}};
  window.addEventListener("keydown",keyboard);
  function report(text:string,error=false){f.status.textContent=text;message.textContent=text;message.hidden=!error;}
  function snapshot(){return {nodes:structuredClone(nodes),selected};}
  function accepted(change:()=>void){history.push(snapshot());future.length=0;change();render();report("Applied in sample. One history entry added.");}
  function travel(from:typeof history,to:typeof history){if(!from.length)return;if(drafts.size){report("Apply or cancel pending edits before using history. Drafts retained.",true);return;}to.push(snapshot());const n=from.pop()!;nodes=n.nodes;selected=n.selected;render();}
  function choose(id:string,design=false){selected=id;adding=false;if(design)step="design";render();}
  function depth(n:Item):number{return n.parent?1+depth(nodes.find(p=>p.id===n.parent)!):0;}
  function ordered(id="root"):Item[]{const n=nodes.find(n=>n.id===id)!;return[n,...children(id).flatMap(c=>ordered(c.id))];}
  function edit(key:string,text:string){const n=structuredClone(value());if(key==="text")n.text=text;else n.props[key]=text;if(JSON.stringify(n)===JSON.stringify(current()))drafts.delete(selected);else drafts.set(selected,n);message.hidden=true;sync();draw();renderSource();}
  function blocked(){if(conflict){report("Source changed outside this draft. Input retained. Review Source or cancel before refreshing.",true);return true;}return false;}
  function apply(){const draft=drafts.get(selected);if(!draft){report("No change. No history entry added.");return;}if(blocked())return;
    for(const [key,text] of Object.entries(draft.props)){
      if(key==="order"||!text||text===current().props[key])continue;
      if(!/^\d+$/.test(text)||Number(text)>(key==="rows"||key==="columns"?64:16384)||Number(text)<(["xsize","ysize","rows","columns"].includes(key)?1:0)) {report(`${fieldNames[key]??key} needs a whole number within the supported range. Input retained.`,true);inspector.querySelector<HTMLInputElement>(`[data-field="${key}"]`)?.setAttribute("aria-invalid","true");return;}
    }
    if(draft.kind==="grid"&&Number(draft.props.columns)*Number(draft.props.rows)<children(selected).length){report(`Grid has ${children(selected).length} children. Its capacity must hold all of them. Input retained.`,true);return;}
    const focus=(document.activeElement as HTMLElement)?.dataset.field;
    accepted(()=>{nodes[nodes.indexOf(current())]=structuredClone(draft);drafts.delete(selected);});
    if(focus)inspector.querySelector<HTMLInputElement>(`[data-field="${focus}"]`)?.focus();
  }
  function cancel(){drafts.delete(selected);render();report("Changes cancelled. Accepted sample source is unchanged.");}
  function reorder(delta:number){if(drafts.size){report("Apply or cancel pending edits before reordering. Drafts retained.",true);return;}if(blocked())return;const n=current(),siblings=children(n.parent),i=siblings.indexOf(n),target=siblings[i+delta];if(!target)return;
    if(n.kind==="custom"||target.kind==="custom"||ordered(n.id).some(c=>c.kind==="custom")||ordered(target.id).some(c=>c.kind==="custom")){report("This move crosses a Source-only region. Edit its order in Source.",true);return;}
    accepted(()=>{const a=nodes.indexOf(n),b=nodes.indexOf(target);[nodes[a],nodes[b]]=[nodes[b]!,nodes[a]!];});
  }
  function renderOutline(){outline.replaceChildren();const h=el("div","nl-section-heading");h.append(el("h2","","Elements"),action("Add element",()=>{adding=true;step="design";render();}));outline.append(h);
    const tree=el("div","nl-tree");tree.role="tree";tree.ariaLabel="Help elements";
    for(const n of ordered()){const row=action("",()=>choose(n.id));row.classList.add("nl-tree-row");row.role="treeitem";row.ariaSelected=String(n.id===selected);row.ariaLevel=String(depth(n)+1);row.dataset.node=n.id;row.style.paddingLeft=`${6+depth(n)*12}px`;row.append(elementIcon(n.kind),el("span","",display(n)),el("small","",n.kind==="custom"?"Source":drafts.has(n.id)?"Draft":""));row.ariaLabel=`Select ${display(n)}`;row.ondblclick=()=>choose(n.id,true);row.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();choose(n.id,true);}if(e.altKey&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();choose(n.id);reorder(e.key==="ArrowUp"?-1:1);}};tree.append(row);}
    outline.append(tree);
  }
  const fieldNames:Record<string,string>={xsize:"Width",ysize:"Height",spacing:"Spacing",left_padding:"Left padding",right_padding:"Right padding",top_padding:"Top padding",bottom_padding:"Bottom padding",columns:"Columns",rows:"Rows",order:"Fill order",text:"Text"};
  function field(key:string){const n=value(),input=el("input");input.type="text";input.inputMode="numeric";input.dataset.field=key;input.value=n.props[key]??"";input.placeholder="Inherited";input.oninput=()=>edit(key,input.value);
    const sourceOnly=!!input.value&&(!/^\d+$/.test(input.value)||["rows","columns"].includes(key)&&(+input.value<1||+input.value>64));if(sourceOnly){input.readOnly=true;input.title="Expression remains in Source";}
    const label=labelled(fieldNames[key]!,input);if(!["rows","columns"].includes(key))label.append(el("span","nl-unit",sourceOnly?"Source":"px"));return label;
  }
  function group(title:string,keys:string[],expand=false){const g=el(expand?"details":"section","nl-group");g.append(el(expand?"summary":"h3","",title));const fields=el("div","nl-fields");fields.append(...keys.map(field));g.append(fields);return g;}
  function renderInspector(){inspector.replaceChildren();const n=value(),parent=nodes.find(p=>p.id===n.parent);const head=el("div","nl-section-heading");head.append(el("h2","",adding?"Add element":display(n)),el("span","nl-draft-state",drafts.has(selected)?"Draft":"Accepted"));inspector.append(head,message);
    if(adding){renderAdd();return;}
    if(step==="connect"){inspector.append(el("p","nl-note","Connect keeps the existing screen and button actions. This prototype covers layout. Canvas clicks select elements; they do not run game actions."));return;}
    if(n.kind==="custom"){inspector.append(el("p","nl-note","This custom statement stays in Source. Its bytes and location remain unchanged by supported edits."),el("pre","",n.text),action("Show source region",()=>{sourceOpen=true;render();}));return;}
    inspector.append(el("p","nl-description",descriptions[n.kind]??"Literal text and existing actions retain their source ownership."));
    if(parent&&(parent.kind==="hbox"||parent.kind==="vbox"||parent.kind==="grid")){const p=el("div","nl-constraint");p.append(el("p","",`${names[parent.kind]} controls ${parent.kind==="hbox"?"horizontal":parent.kind==="vbox"?"vertical":"cell"} placement. Change sibling order or edit the parent.`),action("Edit parent layout",()=>choose(parent.id,true)));inspector.append(p);}
    if(n.kind==="text"||n.kind==="textbutton"){const input=el("textarea");input.value=n.text;input.oninput=()=>edit("text",input.value);inspector.append(labelled("Text",input));}
    if(n.kind!=="screen")inspector.append(group("Size",["xsize","ysize"]));
    if(n.kind==="grid"){
      const g=group("Grid",["columns","rows"]);g.append(el("p","nl-grid-count",`${children(n.id).length} children / ${Number(n.props.columns)*Number(n.props.rows)} cells · Across rows`));inspector.append(g);
    }
    if(n.kind==="vbox"||n.kind==="hbox"||n.kind==="grid")inspector.append(group("Child spacing",["spacing"]));
    if(n.kind==="window"||n.kind==="frame")inspector.append(group("Padding",["left_padding","right_padding","top_padding","bottom_padding"],true));
    if(n.kind==="viewport")inspector.append(el("p","nl-constraint","One direct child. Content outside the visible bounds is clipped. Wheel, drag, scrollbars and adjustment expressions are Source-only in this proposal."));
    const details=el("details","nl-group");details.append(el("summary","","Position, anchors and size limits"),el("p","nl-note","Keep the approved paired numeric inspector here. Parent-controlled axes remain explained and protected."));inspector.append(details);
    const order=el("div","nl-order");const prev=action("Move earlier",()=>reorder(-1)),next=action("Move later",()=>reorder(1));prev.disabled=!parent||children(n.parent).indexOf(current())===0;next.disabled=!parent||children(n.parent).indexOf(current())===children(n.parent).length-1;order.append(prev,next);inspector.append(order);
    const actions=el("div","nl-actions");actions.append(action("Apply layout",apply,true),action("Cancel",cancel));inspector.append(actions);
    inspector.onkeydown=e=>{if(e.isComposing)return;if(e.key==="Escape"){e.preventDefault();cancel();}else if(e.key==="Enter"&&e.target instanceof HTMLInputElement){e.preventDefault();apply();}};
  }
  function renderAdd(){const type=el("select");type.ariaLabel="Element type";for(const kind of ["window","hbox","grid","viewport","fixed","frame","vbox","text","textbutton"] as Kind[]){const o=el("option","",names[kind]);o.value=kind;type.append(o);}type.value="hbox";
    const parentSelect=el("select");parentSelect.ariaLabel="Inside parent";for(const n of nodes.filter(n=>containers.has(n.kind))){const o=el("option","",`${display(n)} · level ${depth(n)}`);o.value=n.id;parentSelect.append(o);}parentSelect.value=containers.has(current().kind)?selected:current().parent;
    const detail=el("p","nl-constraint"),text=el("input");text.value="New text";text.ariaLabel="New element text";
    const update=()=>{const p=nodes.find(n=>n.id===parentSelect.value)!;detail.textContent=single.has(p.kind)&&children(p.id).length?`${names[p.kind]} already has its one child. Choose a group inside it or another parent.`:p.kind==="grid"?"Children fill rows in source order. This grid needs capacity for one more child.":`Add ${names[type.value as Kind].toLowerCase()} as the last child of ${display(p)}.`;};type.onchange=update;parentSelect.onchange=update;update();
    inspector.append(labelled("Element type",type),labelled("Inside parent",parentSelect),detail,labelled("New element text",text),el("p","nl-note","New grids start as an empty 2 × 2 layout. Windows and viewports start empty and accept one direct child."));
    const actions=el("div","nl-actions");actions.append(action("Add to sample",()=>{if(blocked())return;if(drafts.size){report("Apply or cancel pending edits before adding. Drafts retained.",true);return;}const parent=nodes.find(n=>n.id===parentSelect.value)!;if(single.has(parent.kind)&&children(parent.id).length||parent.kind==="grid"&&children(parent.id).length>=Number(parent.props.columns)*Number(parent.props.rows)){report("This parent cannot accept another child through this draft. Choose a different parent.",true);return;}accepted(()=>{const id=`added${++sequence}`,kind=type.value as Kind;nodes.push(make(id,parent.id,kind,text.value,kind==="grid"?{columns:"2",rows:"2",order:"rows",spacing:"12"}:kind==="viewport"?{xsize:"360",ysize:"180"}:{}));selected=id;adding=false;});},true),action("Cancel addition",()=>{adding=false;render();}));inspector.append(actions);
  }
  function draw(){canvas.replaceChildren();canvas.style.aspectRatio=resolution.value.startsWith("1024")?"4 / 3":"16 / 9";
    const game=el("div","nl-game"); const scale=canvas.clientWidth/(resolution.value.startsWith("1024")?1024:1280);
    game.style.width=resolution.value.startsWith("1024")?"1024px":"1280px";game.style.height=resolution.value.startsWith("1024")?"768px":"720px";game.style.transform=`scale(${scale})`;
    function paint(id:string):HTMLElement {
      const accepted=nodes.find(n=>n.id===id)!, draft=drafts.get(id), n=draft&&Object.values(draft.props).every(v=>!v||v==="rows"||/^\d+$/.test(v))?draft:accepted;
      const box=el(n.kind==="text"||n.kind==="textbutton"?"button":"div",`nl-render nl-render-${n.kind}`);box.dataset.pick=id;box.dataset.selected=String(selected===id);
      box.onclick=e=>{e.stopPropagation();choose(id,true);};
      if(n.kind==="text"||n.kind==="textbutton")box.textContent=n.text;
      if(n.kind==="custom"){box.hidden=true;return box;}
      const px=(key:string,fallback:number)=>/^\d+$/.test(n.props[key]??"")?Number(n.props[key]):fallback;
      if(n.props.xsize&&/^\d+$/.test(n.props.xsize))box.style.width=`${px("xsize",0)}px`;
      if(n.props.ysize&&/^\d+$/.test(n.props.ysize))box.style.height=`${px("ysize",0)}px`;
      if(n.kind==="window"||n.kind==="frame")box.style.padding=`${px("top_padding",24)}px ${px("right_padding",24)}px ${px("bottom_padding",24)}px ${px("left_padding",24)}px`;
      if(["hbox","vbox","grid"].includes(n.kind))box.style.gap=`${px("spacing",0)}px`;
      if(n.kind==="grid"&&["columns","rows"].some(k=>!/^\d+$/.test(n.props[k]??"")||+n.props[k]!<1||+n.props[k]!>64)){box.classList.add("nl-unrendered");box.textContent="Source-only grid dimensions. Canvas cannot represent this grid.";return box;}
      if(n.kind==="grid")box.style.gridTemplateColumns=`repeat(${Math.min(64,px("columns",2))},minmax(0,1fr))`;
      if(n.kind==="viewport"&&n.props.ysize&&!/^\d+$/.test(n.props.ysize)){box.classList.add("nl-unrendered");box.textContent="Source-only height expression. Canvas cannot represent this viewport.";return box;}
      for(const child of children(id))box.append(paint(child.id));
      if(n.kind==="viewport"){const edge=el("span","nl-clip-edge","Clipped edge");box.append(edge);}
      return box;
    }
    game.append(paint("fixed"));canvas.append(game);canvas.dataset.draft=String(drafts.size>0);
    const marks=el("div","nl-canvas-marks");marks.append(action("Select window",()=>choose("window",true)),action("Select horizontal group",()=>choose("row",true)),action("Select viewport",()=>choose("viewport",true)),action("Select grid",()=>choose("grid",true)));canvas.append(marks);
    path.replaceChildren();let n:Item|undefined=current();const ancestors:Item[]=[];while(n){ancestors.unshift(n);n=nodes.find(p=>p.id===n!.parent);}for(const a of ancestors)path.append(action(display(a),()=>choose(a.id)));
    caption.textContent=drafts.size?"Draft schematic · Not applied":"Schematic canvas · Clipping illustrated, no Ren'Py render";
  }
  function renderSource(){sourcePanel.replaceChildren();const h=el("div","nl-section-heading");h.append(el("h2","","Accepted sample source"),action("Close source",()=>{sourceOpen=false;render();}));const pre=el("div","nl-source");pre.ariaLabel="Accepted sample source";
    for(const n of ordered()){const line=action("",()=>choose(n.id));line.dataset.sourceNode=n.id;line.ariaLabel=`Select source ${display(n)}`;line.className="button nl-source-line";line.ariaCurrent=n.id===selected?"true":null;let text=n.kind==="screen"?"screen help():":n.kind==="custom"?n.text:n.kind==="text"||n.kind==="textbutton"?`${n.kind} ${JSON.stringify(n.text)}`:n.kind==="grid"?`grid ${n.props.columns} ${n.props.rows} allow_underfull True:`:`${n.kind}:`;line.textContent=`${"    ".repeat(depth(n))}${text}`;pre.append(line);
      for(const [key,val]of Object.entries(n.props)){if(["rows","columns","order"].includes(key)||!val)continue;pre.append(el("div","nl-source-property",`${"    ".repeat(depth(n)+1)}${key} ${val}`));}
    }
    sourcePanel.append(h,el("p","nl-note","Selection follows the same element. Pending drafts do not change this accepted sample."),pre);
    if(conflict)sourcePanel.append(action("Simulate source refresh",()=>{if(drafts.size){report("Cancel pending drafts before refreshing this sample.",true);return;}conflict=false;render();report("Source refreshed in sample.");}));
  }
  function sync(){undo.disabled=!history.length;redo.disabled=!future.length;rail.querySelectorAll<HTMLButtonElement>("button").forEach(b=>b.ariaPressed=String(b.dataset.step===step));inspector.querySelector(".nl-draft-state")!.textContent=drafts.has(selected)?"Draft":"Accepted";}
  function render(){work.dataset.step=step;work.dataset.source=String(sourceOpen);outline.hidden=variant==="focused"&&step!=="choose";inspector.hidden=variant==="focused"&&step==="choose";sourcePanel.hidden=!sourceOpen;renderOutline();renderInspector();draw();renderSource();sync();requestAnimationFrame(()=>draw());}
  render();const resize=new ResizeObserver(()=>draw());resize.observe(canvas);return()=>{resize.disconnect();window.removeEventListener("keydown",keyboard);};
 };
}
