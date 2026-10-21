import type { LabMount } from "../../contracts.ts";
import { sampleFrame } from "../../frame.ts";
import { sampleCharacters } from "./fixture.ts";
import "./styles.css";

export const mount: LabMount = (host, context) => {
  const surface = sampleFrame(host);
  surface.classList.add("notes-example");
  const characters = sampleCharacters(context.state);
  const drafts = new Map(characters.map(character => [character.id, character.notes]));
  let selected = characters[0]!;
  const heading = document.createElement("h1");
  heading.textContent = "Characters";
  const description = document.createElement("p");
  description.className = "muted";
  description.textContent = "Character notes example";
  const picker = document.createElement("div");
  picker.className = "notes-example-picker";
  picker.role = "group";
  picker.ariaLabel = "Characters";
  const editor = document.createElement("section");
  editor.className = "notes-example-editor";
  const title = document.createElement("h2");
  const label = document.createElement("label");
  label.className = "field";
  label.append("Writing notes");
  const input = document.createElement("textarea");
  input.name = "notes";
  input.rows = 10;
  label.append(input);
  const footer = document.createElement("div");
  footer.className = "notes-example-actions";
  const status = document.createElement("span");
  status.role = "status";
  const discard = document.createElement("button");
  discard.type = "button";
  discard.className = "button";
  discard.textContent = "Discard changes";
  const save = document.createElement("button");
  save.type = "button";
  save.className = "button primary";
  save.textContent = "Save changes";

  const dirty = () => drafts.get(selected.id) !== selected.notes;
  const update = (message?: string) => {
    status.textContent = message ?? (dirty() ? "Unsaved changes" : "Saved in sample");
    save.disabled = discard.disabled = !dirty();
    for (const button of picker.querySelectorAll<HTMLButtonElement>("button")) {
      button.ariaPressed = String(button.dataset.character === selected.id);
    }
  };
  for (const character of characters) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button";
    button.dataset.character = character.id;
    button.textContent = character.name;
    button.addEventListener("click", () => {
      selected = character;
      title.textContent = character.name;
      input.value = drafts.get(character.id)!;
      update();
    });
    picker.append(button);
  }
  input.addEventListener("input", () => { drafts.set(selected.id, input.value); update(); });
  discard.addEventListener("click", () => { drafts.set(selected.id, selected.notes); input.value = selected.notes; update(); });
  save.addEventListener("click", () => {
    if (context.state === "save-error") { update("Simulated save failure. Your draft is retained."); return; }
    selected.notes = drafts.get(selected.id)!;
    update("Saved in sample");
  });
  title.textContent = selected.name;
  input.value = selected.notes;
  footer.append(status, discard, save);
  editor.append(title, label, footer);
  surface.append(heading, description, picker, editor);
  update();
};
