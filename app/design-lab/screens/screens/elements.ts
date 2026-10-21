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
