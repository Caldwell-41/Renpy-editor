import { action, element } from "./page.ts";

/** Lab-only comparison controls. Navigation remounts a fresh fictional sample. */
export function prototypeSwitcher(host: HTMLElement, variants: readonly { id: string; title: string }[], current: string, dirty: () => boolean) {
  const bar = element("nav", "sc-prototype-switcher"); bar.ariaLabel = "Prototype layout comparison";
  function change(direction: number) {
    const apply = () => {
      const query = new URLSearchParams(location.search);
      query.set("variant", variants[(variants.findIndex(v => v.id === current) + direction + variants.length) % variants.length]!.id);
      if (window.top !== window) window.top!.location.href = `/?${query}`;
      else location.search = query.toString();
    };
    if (!dirty()) { apply(); return; }
    const dialog = element("dialog", "lp-dialog"); dialog.ariaLabel = "Switch prototype layout?";
    dialog.append(element("h2", "", "Switch prototype layout?"), element("p", "", "The next layout opens a fresh sample. Your edits in this preview will reset."), action("Keep editing", () => dialog.close()), action("Switch and reset sample", apply));
    dialog.onclose = () => dialog.remove(); host.append(dialog); dialog.showModal();
  }
  const previous = action("Previous prototype layout", () => change(-1)); previous.ariaLabel = "Previous prototype layout";
  const next = action("Next prototype layout", () => change(1)); next.ariaLabel = "Next prototype layout";
  bar.append(previous, element("span", "", `${variants.findIndex(v => v.id === current) + 1} / ${variants.length} · ${variants.find(v => v.id === current)!.title}`), next);
  const key = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || (event.target as Element).closest("input,textarea,select,[contenteditable],dialog")) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); change(event.key === "ArrowLeft" ? -1 : 1); }
  };
  document.addEventListener("keydown", key); host.append(bar);
  return () => document.removeEventListener("keydown", key);
}
