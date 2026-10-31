import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreenText, type StyleDefinition } from "../src/screen-text.ts";
import { ScreenLayoutEditor } from "../src/screen-layout.ts";
import type { CompositionCommand, CompositionView } from "../src/screen-composition.ts";
import type { ScreenDocument, ScreenNode } from "../src/screen-ui.ts";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function fixture(styled = false, fonts = false) {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement, HTMLTextAreaElement: browser.HTMLTextAreaElement,
    HTMLDetailsElement: browser.HTMLDetailsElement, ResizeObserver: browser.ResizeObserver, IntersectionObserver: browser.IntersectionObserver });
  const definitions: StyleDefinition[] = [
    { name:"a",kind:"textbutton",values:{size:20,color:"#111",align:0,bold:false,italic:false,background:"#123",border:{color:"#234",width:1},hover_color:"#345"},path:"game/ui/styles.rpy",uses:[],error:null },
    { name:"b",kind:"textbutton",values:{size:30,color:"#222",align:0.5,bold:true,italic:true,background:"#456",border:{color:"#567",width:2},hover_color:"#678"},path:"game/ui/styles.rpy",uses:[],error:null },
    { name:"c",kind:"textbutton",values:{size:40,color:"#333",align:1,bold:false,italic:false,background:"#789",border:{color:"#89a",width:3},hover_color:"#9ab"},path:"game/ui/styles.rpy",uses:[],error:null },
    { name:"empty",kind:"textbutton",values:{},path:"game/ui/styles.rpy",uses:[],error:null },
  ];
  for(const [index,definition] of definitions.slice(0,3).entries()) {
    if(fonts)definition.values.font=`fonts/${definition.name}.ttf`;
    for(const state of ["hover_","selected_","insensitive_"]) {
      definition.values[state+"color"]=["#345","#678","#9ab"][index];
      definition.values[state+"background"]=["#123","#456","#789"][index];
      definition.values[state+"border"]={color:["#234","#567","#89a"][index],width:index+1};
    }
  }
  const node: ScreenNode = {id:"text",kind:"textbutton",literal:"Caption",span:{start:10,end:50},parentStart:null,layout:{},properties:[],protected:[],
    textProperties:{values:styled?structuredClone(definitions[0]!.values):{},blocked:{}},numericLayout:{values:{},blocked:{}},
    ...(styled?{style:{name:"a",error:null}}:{})};
  const source: ScreenDocument = {path:"game/ui/caption.rpy",revision:"source",partial:false,screens:[{name:"caption",nodes:[node]}]};
  const view: CompositionView = {document:source,screenId:"screen",screenName:"caption",nodes:[node],selected:node,step:"design",busy:false};
  const commands: CompositionCommand[] = [];
  const sources: boolean[] = [];
  const canvasRequests: Record<string,unknown>[] = [];
  let inspect = async(path:string) => {assert.equal(path,source.path);return source;};
  const layout = new ScreenLayoutEditor({view:()=>({document:source,screen:"caption",node,nodes:[node],busy:false,otherDraft:false}),commit:async()=>{},preview:()=>{},note:()=>{},select:()=>{}});
  const text = new ScreenText({view:()=>view,styles:()=>({revision:"catalog",definitions}),documents:()=>[source],inspect:path=>inspect(path),current:()=>true,
    request:async <T>(operation:string,payload?:Record<string,unknown>):Promise<T> => {
      if(operation==="screens.canvasRender")canvasRequests.push(payload!);
      return {...(operation==="authoring.list"?{assets:[]}:{phase:"unavailable"})} as T;
    },
    coordinate:task=>task(),commit:async command=>{commands.push(command);},redraw:()=>render(),preview:()=>{},source:()=>{sources.push(true);},saved:()=>{},layoutTools:()=>{},order:()=>{},note:()=>{}},layout);
  const host=document.createElement("div");host.className="screens-editor";document.body.append(host);
  function render() {text.unmount();host.replaceChildren();const card=document.createElement("div");host.append(card);text.render(card,view);}
  const click=(name:string)=>{const button=[...document.querySelectorAll("button")].find(b=>b.textContent===name);assert.ok(button,name);button.focus();button.click();};
  const field=(name:string)=>{const control=[...document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>("input,textarea,select")].find(c=>c.ariaLabel===name);assert.ok(control,name);return control;};
  const fill=(name:string,value:string)=>{const control=field(name);control.value=value;control.dispatchEvent(new window.Event(control.tagName==="SELECT"?"change":"input"));return control;};
  const choose=(name:string)=>{click("Change style…");const option=[...document.querySelectorAll<HTMLButtonElement>(".screen-style-option")].find(b=>b.textContent?.startsWith(name+" ·"));assert.ok(option,name);option.click();};
  const apply=()=>{const button=document.querySelector<HTMLButtonElement>("[data-text-apply]");assert.ok(button);button.click();};
  render();
  return {text,layout,commands,sources,canvasRequests,setInspector:(read:(path:string)=>Promise<ScreenDocument>)=>{inspect=read;},field,fill,click,choose,apply,render,definitions,view,dispose:()=>{text.dispose();browser.happyDOM.abort();}};
}
function associatedError(control:HTMLElement) {
  const id=control.getAttribute("aria-describedby")?.split(" ").find(id=>id.startsWith("authoring-field-error-"));assert.ok(id,"Associated field error");
  const error=document.getElementById(id);assert.ok(error);assert.equal(error.hidden,false);assert.equal(control.getAttribute("aria-invalid"),"true");return error;
}

test("appearance completion and submission retain drafts, validate dependencies and restore state errors", async()=>{
  const h=fixture();
  try {
    await tick();
    const background=h.fill("Background color","#");assert.equal(background.getAttribute("aria-invalid"),null);
    background.dispatchEvent(new window.Event("compositionstart"));background.dispatchEvent(new window.Event("blur"));assert.equal(background.getAttribute("aria-invalid"),null);
    background.dispatchEvent(new window.Event("compositionend"));background.dispatchEvent(new window.Event("blur"));associatedError(background);
    h.fill("Background color","#z");associatedError(background);
    background.dispatchEvent(new window.Event("compositionstart"));h.fill("Background color","#123");associatedError(background);
    background.dispatchEvent(new window.Event("compositionend"));h.fill("Background color","#123");assert.equal(background.getAttribute("aria-invalid"),null);
    const border=h.fill("Border color","#abc");border.dispatchEvent(new window.Event("blur"));associatedError(h.field("Border width · px"));
    h.fill("Border width · px","33");associatedError(h.field("Border width · px"));h.fill("Border width · px","2");assert.equal(h.field("Border width · px").getAttribute("aria-invalid"),null);
    h.fill("Appearance state","hover_");const hover=h.fill("State text color","bad");hover.dispatchEvent(new window.Event("blur"));associatedError(hover);
    h.fill("Appearance state","");h.fill("Text","Local draft");h.fill("Width","240");
    h.apply();await tick();assert.equal(h.commands.length,0);assert.equal(h.field("Appearance state").value,"hover_");associatedError(h.field("State text color"));assert.equal(document.activeElement,h.field("State text color"));
    assert.equal(h.field("Text").value,"Local draft");assert.equal(h.field("Width").value,"240");
    h.fill("Appearance state","");h.fill("Appearance state","hover_");associatedError(h.field("State text color"));
    h.fill("State text color","#def");assert.equal(h.field("State text color").getAttribute("aria-invalid"),null);
    h.fill("Appearance state","");assert.equal(h.field("Background color").value,"#123");assert.equal(h.field("Border color").value,"#abc");assert.equal(h.field("Border width · px").value,"2");
    h.apply();await tick();assert.equal(h.commands.length,1);
    assert.deepEqual(h.commands[0],{type:"formatText",nodeId:"text",values:{text:"Local draft",appearance:{background:"#123",border:{color:"#abc",width:2},hover_color:"#def"}},layout:{xsize:{unit:"pixels",value:240}}});
  } finally {h.dispose();}
});

test("style names use technical-name validation without rewriting invalid input or underscores",async()=>{
  const h=fixture();
  try {
    await tick();h.fill("Text","Retained caption");h.click("Change style…");
    const name=h.field("Style name");assert.equal(name.getAttribute("data-technical-name"),"true");
    assert.match(document.body.textContent??"",/saved in lowercase/);
    name.value="body.text";name.dispatchEvent(new window.Event("input"));assert.equal(name.getAttribute("aria-invalid"),null);
    name.dispatchEvent(new window.Event("compositionstart"));name.dispatchEvent(new window.Event("blur"));assert.equal(name.getAttribute("aria-invalid"),null);
    name.dispatchEvent(new window.Event("compositionend"));name.dispatchEvent(new window.Event("blur"));associatedError(name);
    h.click("Create style");assert.equal(name.value,"body.text");assert.equal(document.activeElement,name);assert.equal(document.querySelectorAll("dialog").length,1);
    name.value="a".repeat(65);name.dispatchEvent(new window.Event("input"));associatedError(name);h.click("Create style");assert.equal(name.value.length,65);
    name.value="a";name.dispatchEvent(new window.Event("input"));assert.match(associatedError(name).textContent??"",/already exists/);
    name.value="  Body__Text  ";name.dispatchEvent(new window.Event("input"));assert.equal(name.getAttribute("aria-invalid"),null);h.click("Create style");
    h.apply();await tick();h.click("Apply to this element");await tick();
    assert.equal(h.commands.length,1);const command=h.commands[0];assert.ok(command?.type==="formatText");assert.equal(command.style?.name,"body__text");assert.equal(command.values.text,"Retained caption");
  } finally {h.dispose();}
});

test("repeated pending style assignment follows each chosen default and emits no shared edits",async()=>{
  const h=fixture(true);
  try {
    await tick();h.choose("B");assert.equal(h.field("Size · px").value,"30");h.choose("C");assert.equal(h.field("Size · px").value,"40");
    assert.equal(h.field("Color").value,"#333");assert.equal(h.field("Text alignment").value,"1");assert.equal(h.field("Bold").value,"False");assert.equal(h.field("Italic").value,"False");
    assert.equal(h.field("Background color").value,"#789");assert.equal(h.field("Border color").value,"#89a");assert.equal(h.field("Border width · px").value,"3");for(const state of ["hover_","selected_","insensitive_"]) {
      h.fill("Appearance state",state);assert.equal(h.field("State text color").value,"#9ab");assert.equal(h.field("Background color").value,"#789");assert.equal(h.field("Border color").value,"#89a");assert.equal(h.field("Border width · px").value,"3");
    }
    h.choose("Empty");assert.equal(h.field("Size · px").value,"");assert.equal(h.field("Background color").value,"");assert.equal(h.field("State text color").value,"");
    h.choose("A");assert.equal(h.field("Size · px").value,"20");assert.equal(h.text.hasDraft(),false);
    h.choose("B");h.choose("C");h.apply();await tick();h.click("Apply to this element");await tick();
    assert.deepEqual(h.commands,[{type:"formatText",nodeId:"text",values:{},style:{scope:"shared",name:"c",expectedRevision:"catalog"}}]);
  } finally {h.dispose();}
});

test("style switches preserve user edits and local text/layout while other defaults follow the style",async()=>{
  const h=fixture(true);
  try {
    await tick();h.fill("Text","Local caption");h.fill("Width","300");h.choose("B");h.fill("Size · px","40");h.fill("Background color","#789");h.fill("Color","#333");h.fill("Text alignment","1");h.fill("Bold","False");h.fill("Italic","False");
    h.fill("Border color","#89a");h.fill("Border width · px","3");h.fill("Appearance state","hover_");h.fill("State text color","#9ab");h.choose("C");
    assert.equal(h.field("Size · px").value,"40");assert.equal(h.field("Background color").value,"#789");assert.equal(h.field("Color").value,"#333");
    h.choose("A");assert.equal(h.field("Size · px").value,"40");assert.equal(h.field("State text color").value,"#9ab");assert.equal(h.field("Color").value,"#333");
    assert.equal(h.field("Text alignment").value,"1");assert.equal(h.field("Bold").value,"False");assert.equal(h.field("Italic").value,"False");h.fill("Appearance state","");assert.equal(h.field("Border width · px").value,"3");
    assert.equal(h.field("Text").value,"Local caption");assert.equal(h.field("Width").value,"300");
    h.choose("Empty");h.apply();await tick();h.click("Apply to all elements");await tick();
    const command=h.commands[0];assert.ok(command?.type==="formatText");assert.deepEqual(command.values,{text:"Local caption",size:40,color:"#333",align:1,bold:false,italic:false,appearance:{background:"#789",border:{color:"#89a",width:3},hover_color:"#9ab"}});assert.deepEqual(command.layout,{xsize:{unit:"pixels",value:300}});
  } finally {h.dispose();}
});


test("pending font defaults follow each style and an explicit inherited font survives later switches",async()=>{
  const h=fixture(true,true);
  const font=()=>document.querySelector('[data-text-field="font"] strong')?.textContent;
  try {
    await tick();h.choose("B");assert.equal(font(),"fonts/b.ttf");h.choose("C");assert.equal(font(),"fonts/c.ttf");h.choose("Empty");assert.equal(font(),"Default font");
    h.choose("B");document.querySelector<HTMLButtonElement>('[data-text-field="font"]')!.click();await tick();h.click("Default font · Inherit from the screen style");h.choose("C");assert.equal(font(),"Default font");
    h.apply();await tick();h.click("Apply to all elements");await tick();const command=h.commands[0];assert.ok(command?.type==="formatText");assert.deepEqual(command.values,{font:null});
  } finally {h.dispose();}
});

test("Apply validates all untouched appearance errors and clearing either border field updates its dependent error",async()=>{
  const h=fixture();
  try {
    await tick();h.fill("Text"," ");h.fill("Background color","wrong");h.fill("Border color","#");h.fill("Border width · px","0");h.apply();await tick();
    assert.equal(h.commands.length,0);assert.equal(document.activeElement,h.field("Text"));
    for(const name of ["Text","Background color","Border color","Border width · px"])associatedError(h.field(name));
    h.fill("Border color","");associatedError(h.field("Border color"));h.fill("Border width · px","");assert.equal(h.field("Border color").getAttribute("aria-invalid"),null);assert.equal(h.field("Border width · px").getAttribute("aria-invalid"),null);
    h.fill("Border width · px","2");h.field("Border width · px").dispatchEvent(new window.Event("blur"));associatedError(h.field("Border color"));h.fill("Border color","#abc");assert.equal(h.field("Border color").getAttribute("aria-invalid"),null);
  } finally {h.dispose();}
});

test("Create style preserves valid repeated underscores in the submitted identifier",async()=>{
  const h=fixture();
  try {
    await tick();h.click("Change style…");h.fill("Style name","  Body__Text  ");h.click("Create style");h.apply();await tick();h.click("Apply to this element");await tick();
    const command=h.commands[0];assert.ok(command?.type==="formatText");assert.equal(command.style?.name,"body__text");
  } finally {h.dispose();}
});

test("assigning a text-only style keeps button decoration local in fields and every pending preview",async()=>{
  const h=fixture(true);
  try {
    await tick();h.definitions.push({name:"label",kind:"text",values:{size:50,color:"#fed",hover_color:"#abc"},path:"game/ui/styles.rpy",uses:[],error:null});
    h.view.nodes.push({...structuredClone(h.view.selected),id:"other",span:{start:60,end:100},style:{name:"label",error:null},textProperties:{values:{...h.definitions.at(-1)!.values,background:"#fff"},blocked:{}}});
    h.definitions.at(-1)!.uses.push({path:h.view.document.path,screenName:"caption",nodeId:"other",nodeStart:60});
    h.choose("B");h.choose("Label");
    assert.equal(h.text.canvasDraft().samples.length,1,"Local decoration does not preview on existing text-style uses");
    const sample=h.text.canvasDraft().samples[0];assert.ok(sample);
    assert.equal(sample.values.appearance?.background,"#456");assert.deepEqual(sample.values.appearance?.border,{color:"#567",width:2});
    for(const state of ["hover_","selected_","insensitive_"]){assert.equal(sample.values.appearance?.[state+"background"],"#456");assert.deepEqual(sample.values.appearance?.[state+"border"],{color:"#567",width:2});}
    h.fill("Size · px","60");const shared=h.text.canvasDraft().samples.find(sample=>sample.nodeStart===60);assert.ok(shared);assert.deepEqual(shared.values,{size:60});h.fill("Size · px","50");
    h.apply();await tick();h.click("Apply to this element");await tick();const command=h.commands[0];assert.ok(command?.type==="formatText");assert.equal(command.style?.name,"label");assert.equal(command.values.appearance?.background,"#456");
  } finally {h.dispose();}
});


test("text-only button styles expose local decoration in both scopes and keep one transaction",async()=>{
  for(const scope of ["shared","local"]) {
    const h=fixture(true);
    try {
      await tick();h.definitions[0]!.kind="text";
      h.definitions[0]!.values={size:20,color:"#111"};h.render();
      assert.equal(h.field("Background color").value,"#123");
      assert.match(h.field("Background color").closest(".screen-appearance-fields")!.textContent??"",/This element only/);
      if(scope==="local")h.click("This element only");
      assert.equal(h.field("Border width · px").value,"1");
      h.fill("Background color","#abc");h.fill("Text","Local caption");h.fill("Width","240");
      h.apply();await tick();if(scope==="local"){h.click("Apply to this element");await tick();}
      assert.equal(h.commands.length,1);const command=h.commands[0];assert.ok(command?.type==="formatText");
      assert.equal(command.style?.scope,scope==="local"?"local":undefined);
      assert.deepEqual(command.values,{text:"Local caption",appearance:{background:"#abc"}});
      assert.deepEqual(command.layout,{xsize:{unit:"pixels",value:240}});
    } finally {h.dispose();}
  }
});

test("dynamic appearance properties stay Source-only across states, sync and unrelated edits",async()=>{
  const h=fixture();
  try {
    await tick();const properties=h.view.selected.textProperties!;
    for(const prefix of ["","hover_","selected_","insensitive_"])for(const key of ["background","border",...(prefix?["color"]:[])]) {
      properties.blocked[prefix+key]="This source expression or repeated property stays in Source.";
      (properties.expressions??={})[prefix+key]=key==="background"?"gui.panel":key==="border"?"gui.border":"gui.text_color";
    }
    h.render();
    for(const state of ["","hover_","selected_","insensitive_"]) {
      h.fill("Appearance state",state);h.text.sync();
      for(const [name,expression] of [["Background color","gui.panel"],["Border color","gui.border"],["Border width · px","gui.border"],...(state?[["State text color","gui.text_color"]]:[])]) {
        const control=h.field(name!);assert.equal((control as HTMLInputElement).readOnly,true,name);assert.equal(control.value,expression);
        assert.match(control.parentElement!.textContent??"",/Source-only/);
        assert.match(document.getElementById(control.getAttribute("aria-describedby")!.split(" ")[0]!)!.textContent??"",/stays in Source/);
        const source=[...control.parentElement!.querySelectorAll("button")].find(b=>b.textContent==="Edit in Source");assert.ok(source);
        const enter=new window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true});source.dispatchEvent(enter);
        assert.equal(enter.defaultPrevented,false,"Source buttons retain native keyboard activation");source.click();
        control.value="#abc";control.dispatchEvent(new window.Event("input"));
      }
    }
    assert.equal(h.text.hasDraft(),false);assert.ok(h.sources.length>=12);
    h.fill("Text","Supported sibling");h.apply();await tick();
    assert.deepEqual(h.commands,[{type:"formatText",nodeId:"text",values:{text:"Supported sibling"}}]);
  } finally {h.dispose();}
});


test("style review reads outside-file uses on demand and ignores replaced or dismissed reads",async()=>{
  const h=fixture(true);
  try {
    await tick();const path="game/screens.rpy";
    h.definitions[0]!.uses.push({path,screenName:"external",nodeId:null,nodeStart:30});
    const external:ScreenDocument={path,revision:"external-revision",partial:false,screens:[{name:"external",nodes:[]}]};
    let resolve!:(value:ScreenDocument)=>void;
    h.setInspector(async p=>p===path?await new Promise<ScreenDocument>(accept=>{resolve=accept;}):h.view.document);
    const outside=()=>[...document.querySelectorAll<HTMLButtonElement>(".screen-style-uses button")].find(b=>b.dataset.path===path)!;
    h.click("View uses");await tick();outside().click();
    assert.match(document.querySelector(".screen-style-preview")!.textContent??"",/Loading screen/);
    document.querySelector<HTMLButtonElement>(`.screen-style-uses button[data-path="${h.view.document.path}"]`)!.click();
    await tick();await tick();const count=h.canvasRequests.length;resolve(external);await tick();await tick();
    assert.equal(h.canvasRequests.length,count,"A replaced read must not replace the selected preview");
    h.setInspector(async p=>p===path?external:h.view.document);outside().click();await tick();await tick();
    assert.equal(h.canvasRequests.at(-1)?.path,path);assert.equal(h.canvasRequests.at(-1)?.expectedRevision,"external-revision");
    h.setInspector(async()=>{throw Error("Source is unavailable.");});outside().click();await tick();
    assert.match(document.querySelector(".screen-style-preview")!.textContent??"",/Source is unavailable/);
    assert.doesNotMatch(document.querySelector(".screen-style-preview")!.textContent??"",/Source changed/);
    h.setInspector(async()=>await new Promise<ScreenDocument>(accept=>{resolve=accept;}));outside().click();h.click("Keep editing");
    const beforeClose=h.canvasRequests.length;resolve(external);await tick();await tick();assert.equal(h.canvasRequests.length,beforeClose);
    assert.equal(document.querySelector("dialog"),null);
  } finally {h.dispose();}
});
