import { element as el } from "../../page.ts";
import { children, containers, unitFor, validate, type Item } from "./refined-model.ts";
export function drawCanvas(canvas:HTMLElement,nodes:Item[],drafts:Map<string,Item>,selected:string,resolution:number,pick:(id:string)=>void,addition?:{parent:string;name:string}) {
  canvas.replaceChildren(); const gameHeight=resolution===1280?720:768;canvas.style.aspectRatio=`${resolution}/${gameHeight}`;
  const scale=Math.min(canvas.clientWidth/resolution,canvas.clientHeight/gameHeight),game=el("div","nl-game");
  game.style.width=`${resolution}px`;game.style.height=`${gameHeight}px`;game.style.left=`${(canvas.clientWidth-resolution*scale)/2}px`;game.style.transform=`scale(${scale})`;
  function paint(id:string):HTMLElement {
    const accepted=nodes.find(n=>n.id===id)!,candidate=drafts.get(id),parent=nodes.find(n=>n.id===accepted.parent);
    const n=candidate&&!validate(candidate,accepted,parent,children(nodes,id).length)?candidate:accepted;
    const box=el(n.kind==="text"||n.kind==="textbutton"?"button":"div",`nl-render nl-render-${n.kind}`);box.dataset.pick=id;box.dataset.selected=String(id===selected);box.ariaLabel=`Select canvas ${n.text||n.kind}`;
    box.onclick=e=>{e.stopPropagation();pick(id);};
    if(n.kind==="custom"){box.hidden=true;return box;}
    if(n.kind==="text"||n.kind==="textbutton")box.textContent=n.text;
    if(n.kind==="grid"&&["columns","rows"].some(k=>!/^\d+$/.test(n.props[k]??"")||+n.props[k]!<1||+n.props[k]!>64)||n.kind==="viewport"&&["xsize","ysize"].some(k=>n.props[k]&&!/^\d+$/.test(n.props[k]!))) {
      box.classList.add("nl-unrendered");box.textContent="This region needs Source. Its layout cannot be shown here.";return box;
    }
    const px=(key:string,fallback:number)=>n.props[key]&&Number.isFinite(+n.props[key]!)?+n.props[key]!:fallback;
    for(const [key,style]of[["xsize","width"],["ysize","height"],["xminimum","minWidth"],["xmaximum","maxWidth"],["yminimum","minHeight"],["ymaximum","maxHeight"]] as const)if(n.props[key]&&Number.isFinite(+n.props[key]!))box.style[style]=`${px(key,0)}px`;
    if(n.kind==="window"||n.kind==="frame")box.style.padding=`${px("top_padding",24)}px ${px("right_padding",24)}px ${px("bottom_padding",24)}px ${px("left_padding",24)}px`;
    if(["vbox","hbox","grid"].includes(n.kind))box.style.gap=`${px("spacing",0)}px`;
    if(n.kind==="grid")box.style.gridTemplateColumns=`repeat(${px("columns",2)},minmax(0,1fr))`;
    if(parent?.kind==="fixed"||parent?.kind==="screen") {
      box.style.position="absolute";
      for(const axis of["x","y"]){const key=`${axis}pos`,anchor=`${axis}anchor`,pos=n.props[key]??"0",unit=n.props[unitFor[key]!]??"px";box.style[axis==="x"?"left":"top"]=unit==="relative"?`${+pos*100}%`:`${pos}px`;if(n.props[unitFor[anchor]!]!=="relative")box.style[axis==="x"?"marginLeft":"marginTop"]=`${-px(anchor,0)}px`;}
      box.style.transform=`translate(${n.props.xaunit==="relative"?-px("xanchor",0)*100:0}%,${n.props.yaunit==="relative"?-px("yanchor",0)*100:0}%)`;
    }
    for(const c of children(nodes,id))box.append(paint(c.id));
    if(containers.has(n.kind)&&!children(nodes,id).length)box.append(el("span","nr-empty","Empty container"));
    if(addition?.parent===id)box.append(el("span","nr-add-ghost",addition.name));
    if(n.kind==="viewport")box.append(el("span","nl-clip-edge","Clipped edge"));
    return box;
  }
  game.append(paint("fixed"));canvas.append(game);canvas.dataset.draft=String(drafts.size>0||!!addition);
}
