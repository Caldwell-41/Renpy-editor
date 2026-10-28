// Fictional, memory-only state for the A2 review. No source parser or project writes.
export type Kind = "screen" | "fixed" | "frame" | "window" | "vbox" | "hbox" | "grid" | "viewport" | "text" | "textbutton" | "custom";
export interface Item { id: string; parent: string; kind: Kind; text: string; props: Record<string, string> }
export const names: Record<Kind, string> = { screen:"Help screen", fixed:"Free layout group", frame:"Frame", window:"Window", vbox:"Vertical group", hbox:"Horizontal group", grid:"Grid", viewport:"Viewport", text:"Text", textbutton:"Text button", custom:"Custom footer" };
export const help: Record<Kind, string> = {
  screen:"Contains the screen's elements. Screen order and removal are protected.",
  fixed:"Places children freely. Later siblings draw in front of earlier ones.",
  frame:"Adds a background and padding around one child. Add a group inside it for several elements.",
  window:"A styled window with padding and one direct child. Add a group inside it for several elements.",
  vbox:"Places children from top to bottom. Change their order and spacing to arrange them.",
  hbox:"Places children from left to right. Change their order and spacing to arrange them.",
  grid:"Fills rows from left to right in source order. Empty cells are allowed. Reorder children to change their cells.",
  viewport:"Shows one child through a fixed opening. Content outside that opening is clipped.",
  text:"Shows literal text. Layout edits keep neighboring custom source intact.",
  textbutton:"Shows a button label. Canvas clicks select it; existing game actions stay in Source.",
  custom:"This custom statement stays in Source. Visual edits cannot remove it or move other elements across it.",
};
export const containers = new Set<Kind>(["screen","fixed","frame","window","vbox","hbox","grid","viewport"]);
export const single = new Set<Kind>(["frame","window","viewport"]);
export const coordinates = ["xpos","ypos","xanchor","yanchor"];
export const unitFor: Record<string,string> = { xpos:"xunit", ypos:"yunit", xanchor:"xaunit", yanchor:"yaunit" };
export const labels: Record<string,string> = {
  xpos:"Horizontal position", ypos:"Vertical position", xanchor:"Horizontal anchor", yanchor:"Vertical anchor",
  xsize:"Width", ysize:"Height", xminimum:"Minimum width", xmaximum:"Maximum width", yminimum:"Minimum height", ymaximum:"Maximum height",
  columns:"Columns", rows:"Rows", spacing:"Spacing", left_padding:"Left padding", right_padding:"Right padding", top_padding:"Top padding", bottom_padding:"Bottom padding",
};
const item = (id:string,parent:string,kind:Kind,text="",props:Record<string,string>={}):Item => ({id,parent,kind,text,props});
export const initial = () => [
  item("root","","screen"), item("fixed","root","fixed"),
  item("window","fixed","window","",{xpos:"0.5",ypos:"0.5",xanchor:"0.5",yanchor:"0.5",xunit:"relative",yunit:"relative",xaunit:"relative",yaunit:"relative",xsize:"880",ysize:"560",left_padding:"24",right_padding:"24",top_padding:"24",bottom_padding:"24"}),
  item("stack","window","vbox","",{spacing:"16"}), item("title","stack","text","Help"),
  item("row","stack","hbox","",{spacing:"24"}), item("nav","row","vbox","",{spacing:"12",xsize:"160"}),
  item("basics","nav","textbutton","Basics"), item("keys","nav","textbutton","Keys"),
  item("viewport","row","viewport","",{xsize:"580",ysize:"260"}),
  item("grid","viewport","grid","",{columns:"2",rows:"3",spacing:"16"}),
  ...["Advance","Click or Enter","Backlog","Mouse wheel up","Hide interface","H key"].map((t,i)=>item(`cell${i}`,"grid","text",t)),
  item("close","stack","textbutton","Close"), item("custom","fixed","custom","use custom_help_footer()"),
];
export const children = (nodes:Item[],id:string) => nodes.filter(n=>n.parent===id);
export function ordered(nodes:Item[],id="root"):Item[] { const n=nodes.find(n=>n.id===id)!; return [n,...children(nodes,id).flatMap(c=>ordered(nodes,c.id))]; }
export function depth(nodes:Item[],n:Item):number { return n.parent?1+depth(nodes,nodes.find(p=>p.id===n.parent)!):0; }
export function display(nodes:Item[],n:Item) {
  if(n.kind==="screen") return "Help";
  if(n.kind==="text"||n.kind==="textbutton") return n.text||"(empty text)";
  const peers=children(nodes,n.parent).filter(p=>p.kind===n.kind);
  return names[n.kind]+(peers.length>1?` ${peers.indexOf(n)+1}`:"");
}
export function controlled(parent:Item|undefined,key:string) {
  const axis=key[0];
  return coordinates.includes(key)&&!!parent&&(parent.kind==="grid"||parent.kind==="hbox"&&axis==="x"||parent.kind==="vbox"&&axis==="y");
}
export function validate(n:Item,before:Item,parent:Item|undefined,count:number):{key:string;text:string}|undefined {
  const reject=(key:string,text:string)=>({key,text:`${text} Your draft is retained.`});
  for(const [key,text] of Object.entries(n.props)) {
    if(key.endsWith("unit")||!text)continue;
    if(text===before.props[key]&&!Number.isFinite(Number(text)))continue;
    const number=Number(text),coordinate=coordinates.includes(key),unit=n.props[unitFor[key]!]??"px";
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)||!Number.isFinite(number)) return reject(key,`${labels[key]} needs a finite number.`);
    if(coordinate){if(Math.abs(number)>16384||unit==="px"&&!Number.isInteger(number))return reject(key,`${labels[key]} needs ${unit==="px"?"whole pixels":"a finite fraction"} within -16384 to 16384.`);}
    else {const min=["xsize","ysize","rows","columns"].includes(key)?1:0,max=["rows","columns"].includes(key)?64:16384;if(!Number.isInteger(number)||number<min||number>max)return reject(key,`${labels[key]} needs a whole number from ${min} to ${max}.`);}
    if(controlled(parent,key)&&(text!==before.props[key]||n.props[unitFor[key]!]!==before.props[unitFor[key]!]))return reject(key,`${names[parent!.kind]} controls this placement. Edit the parent or reorder its children.`);
  }
  for(const axis of ["x","y"]) {
    if(n.props[`${axis}size`]&&(n.props[`${axis}minimum`]||n.props[`${axis}maximum`]))return reject(`${axis}minimum`,`Clear ${axis==="x"?"Width":"Height"} before setting its limits. A fixed size sets both bounds.`);
    if(n.props[`${axis}minimum`]&&n.props[`${axis}maximum`]&&+n.props[`${axis}minimum`]!>+n.props[`${axis}maximum`]!)return reject(`${axis}minimum`,`Minimum ${axis==="x"?"width":"height"} exceeds its maximum.`);
  }
  if(n.kind==="grid") {
    if(!n.props.columns||!n.props.rows)return reject(!n.props.columns?"columns":"rows","Grid dimensions need a value.");
    if(+n.props.columns*+n.props.rows<count)return reject("columns",`This grid has ${count} children but only ${+n.props.columns*+n.props.rows} cells. Increase rows or columns.`);
  }
}
export function sourceLines(nodes:Item[]) {
  return ordered(nodes).map(n=>{
    const indent="    ".repeat(depth(nodes,n));
    const statement=n.kind==="screen"?"screen help():":n.kind==="custom"?n.text:n.kind==="grid"?`grid ${n.props.columns} ${n.props.rows} allow_underfull True:`:n.kind==="text"||n.kind==="textbutton"?`${n.kind} ${JSON.stringify(n.text)}${Object.keys(n.props).some(k=>!k.endsWith("unit")&&n.props[k])||n.id==="close"?":":""}`:`${n.kind}:`;
    const properties=Object.entries(n.props).filter(([key,text])=>!key.endsWith("unit")&&!["columns","rows"].includes(key)&&text).map(([key,text])=>{
      const value=coordinates.includes(key)&&n.props[unitFor[key]!] ==="relative"&&Number.isInteger(Number(text))?`${Number(text)}.0`:text;
      return `${indent}    ${key} ${value}`;
    });
    if(n.id==="close")properties.push(`${indent}    action Hide("help")`);
    if(containers.has(n.kind)&&!children(nodes,n.id).length)properties.push(`${indent}    pass`);
    return {id:n.id,statement:indent+statement,properties};
  });
}
