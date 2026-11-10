// Presentation only. No condition evaluation, pick assumptions or story actions.
export type Variant = "dock" | "transcript" | "split";
export const states = {
  duplicate: { speaker: "Narration", prompt: "Choose independently", picked: "Hide picked", options: ["Same", "Same", "Locked"] },
  character: { speaker: "Bec", prompt: "The last service leaves in a minute. Are you coming with me?", picked: "Mark picked", options: ["Get on", "Stay on the platform", "Show the gold ticket"] },
  long: { speaker: "Bec", prompt: "Before the last service leaves, tell me whether you want to follow the lamplighter or wait here until someone explains the new stop on the timetable.", picked: "Hide picked", options: ["Go", "Stay on the platform until the station master returns with the timetable and explains why the last stop has changed tonight.", "Ask Bec to wait while you cross the platform, find the lamplighter, and ask whether the gold ticket is valid for the service after midnight."] },
  none: { speaker: "", prompt: "", picked: "Show normally", options: ["Get on", "Wait", "Leave"] },
} as const;
export type State = keyof typeof states;

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag); node.className = className;
  if (text) node.textContent = text;
  return node;
}
export function summary(variant: Variant, state: State): HTMLElement {
  const sample = states[state];
  const root = el("section", `cpc-summary cpc-${variant}`);
  root.setAttribute("aria-label", "Illustrative Choice summary");
  root.dataset.variant = variant; root.dataset.state = state;
  const context = el("div", "cpc-context");
  context.tabIndex = 0; context.setAttribute("aria-label", "Prompt and preview state");
  const prompt = el("div", "cpc-prompt");
  prompt.append(el("strong", "cpc-speaker", sample.prompt ? sample.speaker : "Choice"));
  if (sample.prompt) prompt.append(el("span", "cpc-prompt-text", sample.prompt));
  else prompt.append(el("span", "cpc-no-prompt", "No prompt"));
  context.append(prompt);
  const picked = el("div", "cpc-picked");
  if (sample.picked !== "Show normally") {
    picked.append(el("strong", "cpc-unknown", "Picked state unknown"), document.createTextNode(` · ${sample.picked}`));
  } else picked.textContent = "Picked options · Show normally";
  context.append(picked);
  const notices = el("div", "cpc-notices");
  notices.append(el("span", "cpc-character-unknown", "Other character state may be unknown"));
  notices.append(el("span", "cpc-background-unknown", "Background unknown after code or unevaluated flow"));
  const options = el("ol", "cpc-options");
  options.tabIndex = 0; options.setAttribute("aria-label", "Option summary, not selectable");
  sample.options.forEach((text, index) => {
    const item = el("li", "cpc-option"); item.dataset.optionIndex = String(index + 1);
    item.append(el("span", "cpc-number", String(index + 1)), el("span", "cpc-caption", text));
    // This public sample has a condition only on option 3. Unknown is never disabled.
    const status = el("span", index === 2 ? "cpc-condition cpc-unknown" : "cpc-condition", index === 2 ? "Condition unknown · if false: Show disabled" : "No condition");
    item.append(status); options.append(item);
  });
  if (variant === "dock") {
    const stage = el("div", "cpc-stage"); stage.append(notices);
    const text = el("div", "cpc-scroll"); text.tabIndex = 0; text.setAttribute("aria-label", "Choice prompt and options");
    text.append(context, options); root.append(stage, text);
  } else if (variant === "transcript") {
    const text = el("div", "cpc-scroll"); text.tabIndex = 0; text.setAttribute("aria-label", "Choice prompt, options and preview state");
    text.append(context, options, notices); root.append(text);
  } else {
    context.append(notices); root.append(context, options);
  }
  return root;
}
