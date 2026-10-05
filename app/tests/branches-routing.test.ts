import assert from "node:assert/strict";
import test from "node:test";
import { layoutFlow, type FlowEdge, type FlowNode, type Point } from "../src/branches-ui.js";
import { branchBounds, routeBranches, type BranchRoute } from "../src/branches-routing.js";
const location={path:"game/scenes.rpy",revision:"saved",byteStart:0,byteEnd:10};
const node=(sceneId:string):FlowNode=>({sceneId,name:sceneId,label:sceneId,location,partial:false,stale:false});
const edge=(id:string,from:string,to:string,text=id):FlowEdge=>({id,sceneId:from,beatId:id,optionOrdinal:null,text,kind:"jump",location,editable:true,destination:{kind:"resolved",sceneId:to}});
function entersNode(a:Point,b:Point,n:Point):boolean {
  if(a.x===b.x)return a.x>n.x&&a.x<n.x+200&&Math.max(a.y,b.y)>n.y&&Math.min(a.y,b.y)<n.y+60;
  assert.equal(a.y,b.y,"connector is not orthogonal");
  return a.y>n.y&&a.y<n.y+60&&Math.max(a.x,b.x)>n.x&&Math.min(a.x,b.x)<n.x+200;
}
function clearNodes(routes:readonly BranchRoute[],positions:ReadonlyMap<string,Point>):void {
  for(const route of routes)for(let i=1;i<route.points.length;i++)for(const [id,n] of positions)assert.equal(entersNode(route.points[i-1]!,route.points[i]!,n),false,`${route.edge.id} enters ${id}`);
}

test("reciprocal, shortcut, same-layer and self routes avoid every node and retain direction",()=>{
  const nodes=["scene1","new","three","four"].map(node);
  const edges=[edge("start","scene1","new"),edge("back","new","scene1"),edge("three","new","three"),edge("4","new","four"),edge("jump","scene1","four"),edge("jump-back","four","scene1"),edge("self","new","new"),edge("duplicate","scene1","new")];
  const positions=layoutFlow(nodes,edges,"scene1"),routes=routeBranches(positions,edges);
  assert.equal(routes.length,8);assert.equal(new Set(routes.map(r=>r.path)).size,8);
  assert.equal(positions.get("scene1")!.y,50,"accepted entry must anchor a cycle");
  clearNodes(routes,positions);
  for(const route of routes){assert.match(route.path,/ Q /);assert.ok(route.label);const start=route.points[0]!,end=route.points.at(-1)!,s=positions.get(route.edge.sceneId)!,d=positions.get((route.edge.destination as {sceneId:string}).sceneId)!;
    assert.ok(start.x>=s.x&&start.x<=s.x+200&&start.y>=s.y&&start.y<=s.y+60);
    assert.ok(end.x>=d.x&&end.x<=d.x+200&&end.y>=d.y&&end.y<=d.y+60);
    const previous=route.points.at(-2)!;assert.ok(Math.abs(previous.x-end.x)+Math.abs(previous.y-end.y)>=20,"arrow needs a clear final approach");
  }
  const b=branchBounds(positions,routes);
  for(const route of routes)for(const p of route.points)assert.ok(p.x>=b.x&&p.y>=b.y&&p.x<=b.x+b.width&&p.y<=b.y+b.height);
});

test("long links bypass intervening rows, labels stay off nodes and apart, order is stable",()=>{
  const positions=new Map<string,Point>([["a",{x:200,y:50}],["b",{x:200,y:210}],["c",{x:60,y:370}],["d",{x:340,y:370}]]);
  const edges=[edge("a-b","a","b","Start"),edge("b-a","b","a","Back"),edge("b-c","b","c","Three"),edge("b-d","b","d","4"),edge("a-d","a","d","Jump"),edge("d-a","d","a","Jump back")];
  const routes=routeBranches(positions,edges);clearNodes(routes,positions);
  assert.deepEqual(routeBranches(positions,[...edges].reverse()),routes);
  const labels=routes.map(r=>r.label!);assert.equal(labels.length,6);
  for(const l of labels)for(const n of positions.values())assert.ok(l.x+l.width/2<=n.x||l.x-l.width/2>=n.x+200||l.y+l.height/2<=n.y||l.y-l.height/2>=n.y+60,"label covers a node");
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i]!,b=labels[j]!;assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2||Math.abs(a.y-b.y)>=(a.height+b.height)/2,"labels overlap");}
});

test("ragged layers and many parallel routes keep node-safe geometry without mutating saved flow",()=>{
  const nodes=Array.from({length:20},(_,i)=>node(`n${i}`));
  const edges=nodes.slice(1).flatMap((n,i)=>[edge(`forward${i}`,"n0",n.sceneId),edge(`back${i}`,n.sceneId,"n0")]);
  edges.push(edge("self","n0","n0"));const before=structuredClone(edges);
  const positions=layoutFlow(nodes,edges,"n0"),routes=routeBranches(positions,edges);
  clearNodes(routes,positions);assert.equal(routes.length,edges.length);assert.equal(new Set(routes.map(r=>r.path)).size,edges.length);assert.deepEqual(edges,before);
  assert.ok(routes.every(r=>r.label),"label must not be lost when a direct gap is congested");
});

test("unknown/terminal destinations never acquire invented arrows and limits remain bounded",()=>{
  const positions=new Map([["a",{x:40,y:50}]]);
  const unresolved:FlowEdge[]=[{...edge("unknown","a","a"),destination:{kind:"unknown",label:null,location:null}},{...edge("return","a","a"),destination:{kind:"terminal"}},edge("missing-node","a","absent")];
  assert.deepEqual(routeBranches(positions,unresolved),[]);
  assert.deepEqual(routeBranches(positions,Array.from({length:2001},(_,i)=>edge(String(i),"a","a"))),[]);
});

test("Unicode captions truncate on character boundaries and fit inside graph bounds",()=>{
  const positions=new Map([["a",{x:40,y:50}],["b",{x:40,y:210}]]);
  const routes=routeBranches(positions,[edge("unicode","a","b","🌙".repeat(40))]);
  const l=routes[0]!.label!;assert.equal(l.text,"🌙".repeat(31)+"…");
  const b=branchBounds(positions,routes);assert.ok(l.x-l.width/2>=b.x&&l.x+l.width/2<=b.x+b.width);
});

test("measured captions size pills, separate channels and contribute to Fit bounds",()=>{
  const positions=new Map<string,Point>([["a",{x:200,y:50}],["b",{x:200,y:210}]]);
  const edges=[edge("forward","a","b","THE QUICK BROWN FOX CHOOSES THE WIDER ROUTE"),edge("back","b","a","Jump"),edge("self","a","a","Again")];
  const measure=(text:string):number=>text==="Jump"?42.359375:380.25;
  const routes=routeBranches(positions,edges,measure);clearNodes(routes,positions);
  assert.deepEqual(routeBranches(positions,[...edges].reverse(),measure),routes);
  const labels=routes.map(r=>r.label!);assert.equal(labels.length,3);
  assert.equal(labels.find(l=>l.text==="Jump")!.width,63);
  assert.equal(labels.find(l=>l.text.startsWith("THE QUICK"))!.text,"THE QUICK BROWN FOX CHOOSES THE…");
  const bounds=branchBounds(positions,routes);
  for(const l of labels){assert.ok(l.width>=measure(l.text)+20);assert.ok(l.x-l.width/2>=bounds.x&&l.x+l.width/2<=bounds.x+bounds.width);}
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i]!,b=labels[j]!;assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2||Math.abs(a.y-b.y)>=(a.height+b.height)/2,"measured pills overlap");}
});
