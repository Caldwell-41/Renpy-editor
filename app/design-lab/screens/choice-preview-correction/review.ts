import "./draft.css";
import { summary, type State, type Variant } from "./summary";
const host = document.querySelector("#comparison")!;
const controls = document.createElement("div");controls.className="cpc-review-controls";
const label=document.createElement("label");label.textContent="Sample ";
const select=document.createElement("select");select.setAttribute("aria-label","Review sample");
for(const [id,text] of Object.entries({duplicate:"Duplicate captions + narration",character:"Character prompt",long:"Long prompt + long/short options",none:"No prompt"})){
  const option=document.createElement("option");option.value=id;option.textContent=text;select.append(option);
}
label.append(select);controls.append(label);host.append(controls);
const samples=document.createElement("div");host.append(samples);
function draw(){samples.replaceChildren();
  for(const [variant,title,note] of [
    ["dock","A · Summary beside canvas","Retains the 16:9 stage. The prompt and options share one scrolling column."],
    ["transcript","B · Full-width summary","Uses the Choice preview area for text. Scene notices follow the options in the same scroll."],
    ["split","C · Prompt / options split","Keeps the prompt and notices on the left. Options scroll independently on the right."],
  ] as const){
    const section=document.createElement("section");section.className="cpc-review-example";
    const h=document.createElement("h3");h.textContent=title;
    const p=document.createElement("p");p.textContent=note;
    const frame=document.createElement("div");frame.className="cpc-review-frame";frame.append(summary(variant as Variant,select.value as State));
    section.append(h,p,frame);samples.append(section);
  }
}
select.onchange=draw;draw();
