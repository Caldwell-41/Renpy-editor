import "../../../../src/styles.css";
import "../../../../src/ui-refresh.css";
import "./styles.css";
import "./shell.css";
import { renderStoryView, type SceneWorkspace } from "../../../../src/scene-ui";
import sample from "../sample";
import { summary, states, type State } from "./summary";

const params = new URLSearchParams(location.search);
const state = (params.get("state") && params.get("state")! in states ? params.get("state") : "duplicate") as State;
const data = structuredClone(sample);
const selected = data.scenes.find(scene => scene.beats.some(beat => beat.payload.type === "choice"))!.beats.find(beat => beat.payload.type === "choice")!;
const content = states[state];
Object.assign(selected.payload, {
  pickedPolicy: content.picked === "Hide picked" ? "hidePicked" : content.picked === "Mark picked" ? "markPicked" : "showNormally",
  prompt: content.prompt ? (content.speaker === "Bec" ? {type:"dialogue",characterId:data.authoring.characters[0]!.id,text:content.prompt} : {type:"narration",text:content.prompt}) : undefined,
});
if ("options" in selected.payload) selected.payload.options?.forEach((option, index) => {option.text = content.options[index]!;});
const model = data as unknown as SceneWorkspace;
let mutations = 0;
renderStoryView(document.querySelector("main")!, document.querySelector("aside")!, model, {
  apply: async () => { mutations++; throw new Error("Draft preview refuses source writes"); },
  status: () => {}, resolution: { width: 1280, height: 720 },
  present: async () => { throw new Error("Draft has no media"); },
}).dispose;
(document.querySelector(`[data-beat-id="${selected.id}"] .beat-select`) as HTMLButtonElement).click();
document.querySelector(".preview-surround")!.replaceChildren(summary(state));
document.querySelector(".expanded-beat")?.scrollIntoView({block:"nearest"});
document.documentElement.dataset.ready = "true";
Object.assign(window, { choicePreviewReview: { revision:"dock-v2",state,get mutations(){return mutations;} } });
