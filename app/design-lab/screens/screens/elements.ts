import { icon } from "../../../src/icons.ts";

// Use the production icon's size and stroke for element-specific symbols.
const elementPaths: Record<string, string> = {
  fixed: "M3 3h18v18H3zM7 7h4v4H7zM13 13h4v4h-4z",
  frame: "M3 4h18v16H3zM6 7h12v10H6z",
  window: "M3 4h18v16H3zM3 8h18M6 6h.01M9 6h.01",
  vbox: "M5 3h14v4H5zM5 10h14v4H5zM5 17h14v4H5z",
  hbox: "M3 5h4v14H3zM10 5h4v14h-4zM17 5h4v14h-4z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  text: "M4 5h16M12 5v14M8 19h8M4 5v3M20 5v3",
  textbutton: "M3 6h18v12H3zM7 12h10",
  imagebutton: "M3 4h18v16H3zM6 16l4-5 3 3 2-2 3 4M16 8h.01",
  bar: "M3 8h18v8H3zM3 8h11v8H3",
  viewport: "M3 3h18v18H3zM17 7v10M16 8l1-1 1 1M16 16l1 1 1-1M7 8h6M7 12h6M7 16h6",
  component: "m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10",
};
export function elementIcon(kind: string) {
  const svg = icon("assets");
  if (elementPaths[kind]) svg.querySelector("path")!.setAttribute("d", elementPaths[kind]!);
  return svg;
}

// Plain-language help shared by the three disposable Screens layouts.
export const elementHelp: Record<string, string> = {
  fixed: "A group with freely positioned items. Move and resize each item separately.",
  frame: "A background panel that holds other elements. Use it for a card, menu or dialog.",
  window: "A styled window that holds content, such as a dialogue box.",
  vbox: "A group that places its items from top to bottom. Change their order and spacing to arrange them.",
  hbox: "A group that places its items side by side. Change their order and spacing to arrange them.",
  grid: "A group that arranges its items in rows and columns.",
  text: "Words shown to the player. Insert a game variable in square brackets to display its current value.",
  image: "A picture from your project. It does not run an action when clicked.",
  textbutton: "A button with a text label. Its actions run when the player clicks it in the game.",
  imagebutton: "A button made from pictures. It can use different pictures for its normal, hovered and disabled states.",
  bar: "A bar that shows a number from your game, such as courage between 0 and 100.",
  viewport: "An area the player can scroll when its contents are larger than the available space.",
  component: "A group you can reuse on other screens. Update its shared look to keep matching elements consistent.",
};
