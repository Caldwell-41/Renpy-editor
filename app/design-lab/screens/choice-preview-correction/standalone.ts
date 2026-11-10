import "../../../src/styles.css";
import "../../../src/ui-refresh.css";
import "./draft.css";
import { renderSceneAuthoring, type SceneWorkspace } from "../../../src/scene-ui";
import sample from "./sample";
import { summary, states, type State, type Variant } from "./summary";

const params = new URLSearchParams(location.search);
const variant = (["dock", "transcript", "split"].includes(params.get("variant") ?? "") ? params.get("variant") : "dock") as Variant;
const state = (params.get("state") && params.get("state")! in states ? params.get("state") : "duplicate") as State;
const data = structuredClone(sample);
const selected = data.scenes.find(scene => scene.beats.some(beat => beat.payload.type === "choice"))!.beats.find(beat => beat.payload.type === "choice")!;
const content = states[state];
// Mutate this disposable browser copy only. The captured public model stays intact.
Object.assign(selected.payload, { pickedPolicy: content.picked === "Hide picked" ? "hidePicked" : content.picked === "Mark picked" ? "markPicked" : "showNormally",
  prompt: content.prompt ? (content.speaker === "Bec" ? {type:"dialogue",characterId:data.authoring.characters[0]!.id,text:content.prompt} : {type:"narration",text:content.prompt}) : undefined });
if ("options" in selected.payload) selected.payload.options?.forEach((option, index) => {option.text = content.options[index]!;});
const model = data as unknown as SceneWorkspace;
const scene = model.scenes.find(scene => scene.beats.some(beat => beat.payload.type === "choice"))!;
const choice = scene.beats.find(beat => beat.payload.type === "choice")!;
// Read-only sample renderer. No project service or native entry is mounted.
let mutations = 0;
renderSceneAuthoring(document.querySelector("main")!, document.querySelector("aside")!, model, {
  apply: async () => { mutations++; throw new Error("Draft preview refuses source writes"); },
  status: () => {}, resolution: { width: 1280, height: 720 },
  present: async () => { throw new Error("Draft has no media"); },
});
(document.querySelector(`[data-beat-id="${choice.id}"] .beat-select`) as HTMLButtonElement).click();
const surround = document.querySelector(".preview-surround")!;
surround.replaceChildren(summary(variant, state));
document.querySelector(".expanded-beat")?.scrollIntoView({block:"nearest"});
document.documentElement.dataset.ready = "true";
Object.assign(window, { choicePreviewReview: { variant, state, get mutations() { return mutations; } } });
