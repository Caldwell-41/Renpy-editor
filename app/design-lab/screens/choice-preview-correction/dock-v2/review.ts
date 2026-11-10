import "./styles.css";
import { summary, type State } from "./summary";

const context = document.querySelector<HTMLImageElement>("#story-context")!;
const size = document.querySelector<HTMLSelectElement>("#review-size")!;
const sample = document.querySelector<HTMLSelectElement>("#review-sample")!;
const detail = document.querySelector("#preview-detail")!;
context.src = context.dataset.wide!;
size.addEventListener("change", () => {
  context.src = context.dataset[size.value]!;
  context.alt = `Draft A v2 in the current Story page at ${size.value === "wide" ? "1100 by 720" : "720 by 850"}.`;
});
function draw(): void { detail.replaceChildren(summary(sample.value as State)); }
sample.addEventListener("change", draw);
draw();
