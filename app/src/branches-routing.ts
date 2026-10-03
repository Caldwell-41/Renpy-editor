import type { FlowEdge, Point } from "./branches-ui.ts";

export const branchNodeSize = { width: 200, height: 60 } as const;
export interface RouteLabel extends Point { readonly text: string; readonly width: number; readonly height: number }
export interface BranchRoute { readonly edge: FlowEdge; readonly points: readonly Point[]; readonly path: string; readonly label?: RouteLabel }
export interface GraphBounds { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
type Side = "top" | "bottom" | "left" | "right";
interface PendingRoute { edge: FlowEdge; from: Point; to: Point; target: string; side: "left" | "right"; direct: boolean; startSide: Side; endSide: Side }
const { width: W, height: H } = branchNodeSize;
const distance = (a: Point, b: Point): number => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

/** Rounded corners stay within the clear corridor of an orthogonal polyline. */
export function roundedRoute(points: readonly Point[]): string {
  const clean = points.filter((p,i)=>!i || distance(p,points[i-1]!)>0);
  if (!clean.length) return "";
  let d=`M ${clean[0]!.x} ${clean[0]!.y}`;
  for(let i=1;i<clean.length-1;i++){
    const a=clean[i-1]!, b=clean[i]!, c=clean[i+1]!;
    if((a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y)){d+=` L ${b.x} ${b.y}`;continue;}
    const r=Math.min(10,distance(a,b)/2,distance(b,c)/2);
    const before={x:b.x+(a.x-b.x)*r/distance(a,b),y:b.y+(a.y-b.y)*r/distance(a,b)};
    const after={x:b.x+(c.x-b.x)*r/distance(b,c),y:b.y+(c.y-b.y)*r/distance(b,c)};
    d+=` L ${before.x} ${before.y} Q ${b.x} ${b.y} ${after.x} ${after.y}`;
  }
  const last=clean.at(-1)!;return d+` L ${last.x} ${last.y}`;
}

function labelWidth(text: string): number {
  return 20+[...text].reduce((n,c)=>n+(/[^\x00-\x7f]/u.test(c)?16:/[MW@]/u.test(c)?14:8),0);
}
const caption=(text:string):string=>{const chars=[...text];return chars.length>34?chars.slice(0,31).join("")+"…":text;};
function overlaps(a: RouteLabel,b: RouteLabel): boolean {
  return Math.abs(a.x-b.x)<(a.width+b.width)/2+8 && Math.abs(a.y-b.y)<(a.height+b.height)/2+8;
}
function intersectsNode(label: RouteLabel,node: Point): boolean {
  return label.x+label.width/2>node.x-8 && label.x-label.width/2<node.x+W+8 && label.y+label.height/2>node.y-8 && label.y-label.height/2<node.y+H+8;
}

/** Route known saved links only. Ports and channels are stable in edge-ID order.
 * Adjacent forward layers use their empty row gap. Other links leave the node via
 * a clear side stub and use outside channels, never a line through intermediate nodes.
 */
export function routeBranches(positions: ReadonlyMap<string,Point>,edges: readonly FlowEdge[]): readonly BranchRoute[] {
  if(positions.size>500 || edges.length>2000)return [];
  const pending: PendingRoute[]=[];
  for(const edge of [...edges].sort((a,b)=>a.id.localeCompare(b.id))){
    if(edge.destination.kind!=="resolved")continue;
    const from=positions.get(edge.sceneId),to=positions.get(edge.destination.sceneId);
    if(!from||!to)continue;
    const direct=to.y-from.y===160;
    const side=to.y>from.y?(to.x>=from.x?"right":"left"):(from.x>to.x?"right":"left");
    pending.push({edge,from,to,target:edge.destination.sceneId,direct,side,startSide:direct?"bottom":side,endSide:direct?"top":side});
  }
  const ports=new Map<string,string[]>();
  const key=(id:string,side:Side)=>`${id}:${side}`;
  for(const r of pending)for(const [id,side,token] of [[r.edge.sceneId,r.startSide,`${r.edge.id}:out`],[r.target,r.endSide,`${r.edge.id}:in`]] as const){const k=key(id,side);ports.set(k,[...(ports.get(k)??[]),token]);}
  const port=(r:PendingRoute,start:boolean):Point=>{
    const id=start?r.edge.sceneId:r.target,side=start?r.startSide:r.endSide,p=start?r.from:r.to;
    const tokens=ports.get(key(id,side))!,share=(tokens.indexOf(`${r.edge.id}:${start?"out":"in"}`)+1)/(tokens.length+1);
    return side==="top"||side==="bottom"?{x:p.x+W*share,y:p.y+(side==="bottom"?H:0)}:{x:p.x+(side==="right"?W:0),y:p.y+H*share};
  };
  const groups=new Map<number,PendingRoute[]>();
  for(const r of pending.filter(r=>r.direct))groups.set(r.from.y,[...(groups.get(r.from.y)??[]),r]);
  const channelGap=Math.max(76,...pending.map(r=>edges.length<=100?labelWidth(caption(r.edge.text))+16:76));
  const left=Math.min(0,...[...positions.values()].map(p=>p.x))-channelGap/2-24,right=Math.max(240,...[...positions.values()].map(p=>p.x+W))+channelGap/2+24;
  const lanes:{left:{min:number;max:number}[][];right:{min:number;max:number}[][]}={left:[],right:[]};
  const labels:RouteLabel[]=[],result:BranchRoute[]=[];
  const outside=(r:PendingRoute,start:Point,end:Point,exclusive=false):Point[]=>{
    const startY=r.from.y-24,endY=r.from.y===r.to.y?r.to.y+H+24:r.to.y-24;
    const interval={min:Math.min(startY,endY)-20,max:Math.max(startY,endY)+20};
    const list=lanes[r.side];let index=exclusive?-1:list.findIndex(lane=>lane.every(other=>interval.min>other.max||interval.max<other.min));
    if(index<0){index=list.length;list.push([]);}list[index]!.push(interval);
    // Label-sized channels keep pills on parallel return lanes apart as well.
    const x=r.side==="left"?left-index*channelGap:right+index*channelGap;
    const sx=r.from.x+(r.side==="left"?-24:W+24),ex=r.to.x+(r.side==="left"?-24:W+24);
    if(r.direct){
      return [start,{x:start.x,y:r.from.y+H+24},{x,y:r.from.y+H+24},{x,y:r.to.y-24},{x:end.x,y:r.to.y-24},end];
    }
    return [start,{x:sx,y:start.y},{x:sx,y:startY},{x,y:startY},{x,y:endY},{x:ex,y:endY},{x:ex,y:end.y},end];
  };
  for(const r of pending){
    const start=port(r,true),end=port(r,false);
    const text=edges.length<=100?caption(r.edge.text):"";
    const width=labelWidth(text);
    let points:Point[];
    if(r.direct){const group=groups.get(r.from.y)!;const y=r.from.y+H+20+60*(group.indexOf(r)+.5)/group.length;points=[start,{x:start.x,y},{x:end.x,y},end];}
    else points=outside(r,start,end);
    const placeLabel=(path:readonly Point[]):RouteLabel|undefined=>{
      if(!text)return undefined;
      const segments=path.slice(1).map((b,i)=>({a:path[i]!,b})).sort((a,b)=>distance(b.a,b.b)-distance(a.a,a.b));
      for(const {a,b} of segments)for(const t of [.5,.3,.7]){
        const candidate={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,text,width,height:28};
        if(![...positions.values()].some(n=>intersectsNode(candidate,n))&&!labels.some(l=>overlaps(candidate,l)))return candidate;
      }
      return undefined;
    };
    let label=placeLabel(points);
    if(text&&!label&&r.direct){points=outside(r,start,end);label=placeLabel(points);}
    // A congested channel may need its own outer lane rather than losing the label.
    if(text&&!label){points=outside(r,start,end,true);label=placeLabel(points);}
    if(label)labels.push(label);
    result.push({edge:r.edge,points,path:roundedRoute(points),label});
  }
  return result;
}

export function branchBounds(positions:ReadonlyMap<string,Point>,routes:readonly BranchRoute[]):GraphBounds {
  const xs=[0],ys=[0];
  for(const p of positions.values()){xs.push(p.x,p.x+W);ys.push(p.y,p.y+H);}
  for(const r of routes){for(const p of r.points){xs.push(p.x);ys.push(p.y);}if(r.label){xs.push(r.label.x-r.label.width/2,r.label.x+r.label.width/2);ys.push(r.label.y-r.label.height/2,r.label.y+r.label.height/2);}}
  const x=Math.min(...xs)-24,y=Math.min(...ys)-24;
  return {x,y,width:Math.max(280,Math.max(...xs)-x+24),height:Math.max(200,Math.max(...ys)-y+24)};
}
