import { states, type State } from "../summary";
export { states, type State };

function element(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Inert text only. Conditions and picked state are never evaluated.
export function summary(state: State): HTMLElement {
  const sample = states[state];
  const root = element("section", "cp2-summary");
  root.setAttribute("aria-label", "Choice summary");
  root.dataset.state = state;

  const stage = element("div", "cp2-stage");
  stage.setAttribute("aria-label", "Game stage, state unknown");
  stage.append(element("p", "cp2-character-unknown", "Other character state may be unknown"));
  const background = element("p", "cp2-background-unknown", "Background unknown");
  background.title = "Background unknown after code or unevaluated flow";
  stage.append(background);

  const scroll = element("div", "cp2-scroll");
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", "Choice prompt and options. Scroll to read more.");
  if (sample.prompt) {
    const prompt = element("div", "cp2-prompt");
    prompt.append(element("strong", "cp2-speaker", sample.speaker));
    prompt.append(element("span", "cp2-prompt-text", sample.prompt));
    scroll.append(prompt);
  }
  if (sample.picked !== "Show normally") {
    const picked = element("div", "cp2-picked");
    picked.append(element("span", "cp2-unknown", "Picked state unknown"));
    picked.append(element("span", "cp2-policy", sample.picked));
    scroll.append(picked);
  }

  const options = element("ol", "cp2-options");
  options.setAttribute("aria-label", "Choice options, read only");
  sample.options.forEach((caption, index) => {
    const option = element("li", "cp2-option");
    option.dataset.optionIndex = String(index + 1);
    option.append(element("span", "cp2-number", String(index + 1)));
    option.append(element("span", "cp2-caption", caption));
    if (index === 2) {
      const condition = element("span", "cp2-condition", "Condition unknown");
      // The editable If false policy remains in the existing Beat editor.
      condition.title = "If false: Show disabled";
      condition.setAttribute("aria-label", "Condition unknown. If false: Show disabled.");
      option.append(condition);
    }
    options.append(option);
  });
  scroll.append(options);
  root.append(stage, scroll);
  return root;
}
