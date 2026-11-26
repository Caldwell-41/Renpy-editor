// PROTOTYPE for #222 (Choose the Loomlight templates). Throwaway; lives on prototype/game-ui-templates.
// A template is a set of values for the layout settings of one settings page (#204, #210).
// Numbers are pixels of a 1280 x 720 project, before Loomlight scales them.

export type PageId = 'title' | 'say' | 'choice' | 'history';
export type Value = string | number | boolean;
export type Values = Record<string, Value>;
/** `isNew` marks a setting that #210 does not have. A template needs it, so the settings page must get it. */
/** `free` marks an on/off setting that no template sets. A template leaves it, and the "Custom" test does not read it. */
export type Setting = { key: string; group: string; label: string; writes: string; stock: Value; isNew?: boolean; free?: boolean };
export type Template = { id: string; name: string; what: string; values: Values; doubt?: string };
export type Page = { id: PageId; title: string; note?: string; settings: Setting[]; templates: Template[] };

const s = (key: string, group: string, label: string, writes: string, stock: Value, isNew = false): Setting => ({ key, group, label, writes, stock, isNew });
/** The stock layout is the first template of each page, with the same name as the stock theme. */
const stock = (what: string): Template => ({ id: 'stock', name: "Ren'Py default", what, values: {} });

export const pages: readonly Page[] = [
  {
    id: 'title', title: 'Title screen',
    settings: [
      s('panel.show', 'Menu panel', 'Show the menu panel', 'if gui.show_main_menu_panel:', true),
      s('panel.width', 'Menu panel', 'Width', 'xsize in style main_menu_frame', 280),
      s('nav.arrange', 'Menu buttons', 'Arrange', 'gui.title_navigation_*', 'Column'),
      s('nav.align', 'Menu buttons', 'Align', 'gui.title_navigation_*', 'Left'),
      s('nav.vertical', 'Menu buttons', 'Vertical', 'gui.title_navigation_*', 'Center'),
      s('nav.x', 'Menu buttons', 'Offset X', 'gui.title_navigation_*', 40),
      s('nav.y', 'Menu buttons', 'Offset Y', 'gui.title_navigation_*', 0),
      s('nav.gap', 'Menu buttons', 'Gap', 'gui.title_navigation_*', 4),
      s('nav.text', 'Menu buttons', 'Text align', 'a text style for the title buttons only (hypothesis)', 'Left', true),
      { ...s('title.show', 'Game title', 'Show the title and version', 'gui.show_name', true), free: true },
      s('title.align', 'Game title', 'Align', 'xalign in style main_menu_vbox, gui.main_menu_text_xalign', 'Right'),
      s('title.vertical', 'Game title', 'Vertical', 'yalign in style main_menu_vbox', 'Bottom'),
      s('title.x', 'Game title', 'Offset X', 'xoffset in style main_menu_vbox', -20),
      s('title.y', 'Game title', 'Offset Y', 'yoffset in style main_menu_vbox', -20),
    ],
    templates: [
      stock('A panel at the left with the buttons in a column. The title is at the bottom right.'),
      { id: 'center', name: 'Centered', what: 'No panel. The title is at the top and the buttons are a centered column under it.',
        values: { 'panel.show': false, 'nav.align': 'Center', 'nav.x': 0, 'nav.y': 80, 'nav.gap': 6, 'nav.text': 'Center', 'title.align': 'Center', 'title.vertical': 'Top', 'title.x': 0, 'title.y': 120 } },
      { id: 'row', name: 'Bottom row', what: 'No panel. The buttons are one row at the bottom and the title is above the middle.',
        values: { 'panel.show': false, 'nav.arrange': 'Row', 'nav.align': 'Center', 'nav.vertical': 'Bottom', 'nav.x': 0, 'nav.y': -44, 'nav.gap': 12, 'nav.text': 'Center', 'title.align': 'Center', 'title.vertical': 'Center', 'title.x': 0, 'title.y': -70 } },
      { id: 'right', name: 'Right column', what: 'No panel. The buttons are a column at the right and the title is at the bottom left.',
        values: { 'panel.show': false, 'nav.align': 'Right', 'nav.x': -90, 'nav.gap': 6, 'nav.text': 'Right', 'title.align': 'Left', 'title.x': 60, 'title.y': -50 } },
    ],
  },
  {
    id: 'say', title: 'Dialogue box', note: 'Each template also changes Text input, as the settings of this page do.',
    settings: [
      { ...s('box.show', 'Dialogue box', 'Show the box', 'gui.show_textbox', true), free: true },
      s('box.width', 'Dialogue box', 'Width', 'xfill and xsize in style window', 'Full', true),
      s('box.height', 'Dialogue box', 'Height', 'gui.textbox_height', 185),
      s('box.position', 'Dialogue box', 'Position', 'gui.textbox_yalign', 'Bottom'),
      s('box.below', 'Dialogue box', 'Space below', 'yoffset in style window, as a negative number', 0, true),
      s('text.x', 'Dialogue text', 'X', 'gui.dialogue_xpos', 268),
      s('text.y', 'Dialogue text', 'Y', 'gui.dialogue_ypos', 50),
      s('text.width', 'Dialogue text', 'Width', 'gui.dialogue_width', 744),
      s('text.align', 'Dialogue text', 'Align', 'gui.dialogue_text_xalign', 'Left'),
      s('name.x', 'Name box', 'X', 'gui.name_xpos', 240),
      s('name.y', 'Name box', 'Y', 'gui.name_ypos', 0),
      s('name.align', 'Name box', 'Align', 'gui.name_xalign', 'Left'),
      s('name.width', 'Name box', 'Width', 'gui.namebox_width', 'Fit'),
      s('name.height', 'Name box', 'Height', 'gui.namebox_height', 'Fit'),
    ],
    templates: [
      stock('A bar across the bottom. The text is a column in the middle and the name is above its left end.'),
      { id: 'centered', name: 'Centered', what: 'The same bar. The name and each line of text are centered. Ren\'Py places a centered text by its middle, so X is 640.',
        values: { 'text.x': 640, 'text.align': 'Center', 'name.x': 640, 'name.align': 'Center' } },
      { id: 'floating', name: 'Floating', what: 'A box with space on each side and below. The quick menu is under the box.',
        values: { 'box.width': 1040, 'box.height': 168, 'box.below': 40, 'text.x': 44, 'text.y': 62, 'text.width': 952, 'name.x': 44, 'name.y': 14 },
        doubt: 'With a stock box picture, Loomlight draws the box again, and the Game-wide look then shows "Custom". A theme draws the dialogue box as a bar, so the box is square until the author sets Corners. The quick menu is on the scene, so Paper and Sweet give the quick buttons a box of their own.' },
    ],
  },
  {
    id: 'choice', title: 'Choices',
    settings: [
      s('list.y', 'Choice list', 'Y, middle of the list', 'ypos in style choice_vbox', 270),
      s('list.align', 'Choice list', 'Align', 'xalign in style choice_vbox', 'Center'),
      s('list.x', 'Choice list', 'Offset X', 'xoffset in style choice_vbox', 0, true),
      s('list.gap', 'Choice list', 'Gap', 'gui.choice_spacing', 22),
      s('button.width', 'Choice buttons', 'Width', 'gui.choice_button_width', 790),
      s('button.text', 'Choice buttons', 'Text align', 'gui.choice_button_text_xalign', 'Center'),
    ],
    templates: [
      stock('Wide buttons in the middle of the screen, above the dialogue box.'),
      { id: 'compact', name: 'Compact', what: 'Narrow buttons with small gaps, in the middle of the screen.',
        values: { 'list.y': 285, 'list.gap': 10, 'button.width': 600 } },
      { id: 'side', name: 'Left side', what: 'A narrow list at the left with left-aligned text. The character in the middle stays in view.',
        values: { 'list.y': 285, 'list.align': 'Left', 'list.x': 50, 'list.gap': 10, 'button.width': 520, 'button.text': 'Left' },
        doubt: "The stock button picture has 100 px of padding at each side, so with the Ren'Py default theme the text starts 100 px from the edge of the button." },
    ],
  },
  {
    id: 'history', title: 'History',
    settings: [
      s('entry.height', 'Entries', 'Height', 'gui.history_height', 140),
      s('entry.gap', 'Entries', 'Gap', 'gui.history_spacing', 0),
      s('name.x', 'Speaker names', 'X', 'gui.history_name_xpos', 155),
      s('name.y', 'Speaker names', 'Y', 'gui.history_name_ypos', 0),
      s('name.width', 'Speaker names', 'Width', 'gui.history_name_width', 155),
      s('name.align', 'Speaker names', 'Align', 'gui.history_name_xalign', 'Right'),
      s('line.x', 'Lines', 'X', 'gui.history_text_xpos', 170),
      s('line.y', 'Lines', 'Y', 'gui.history_text_ypos', 2),
      s('line.width', 'Lines', 'Width', 'gui.history_text_width', 740),
      s('line.align', 'Lines', 'Align', 'gui.history_text_xalign', 'Left'),
    ],
    templates: [
      stock('Each entry is 140 px high. The name is in a column at the left of the line.'),
      { id: 'compact', name: 'Compact', what: 'Each entry is as high as its text, so the screen shows more lines. The name stays at the left.',
        values: { 'entry.height': 'Fit', 'entry.gap': 14 } },
      { id: 'above', name: 'Names above', what: 'The name is above the line, and the line uses the full width.',
        values: { 'entry.height': 'Fit', 'entry.gap': 16, 'name.x': 0, 'name.width': 600, 'name.align': 'Left', 'line.x': 0, 'line.y': 40, 'line.width': 900 },
        doubt: 'The line has a fixed Y, so a line with no speaker has an empty 40 px above it.' },
    ],
  },
];

/** The settings pages with no template in this proposal, and the reason. */
export const without: readonly [page: string, why: string][] = [
  ['Game-wide look', 'It has themes. A theme sets no layout.'],
  ['Quick menu', 'Its layout is four settings: shown, Bottom or Top, an alignment and a gap. A template would repeat them.'],
  ['Pause menu', '"Menu side" waits for a later version, so the possible layouts differ only in widths. Each of its settings also changes Save and load, Options, History, About and Help.'],
  ['Save and load', 'The page area fixes the size of the grid, and the picture cannot sit beside the text without a change to screen code. Columns and Rows are two number settings.'],
  ['Options', 'Its layout settings are widths and gaps. The arrangement of the rows is screen code.'],
  ['Confirm prompt', 'It has one layout setting, the text alignment of the buttons.'],
];

export const pageById = (id: string) => pages.find(p => p.id === id)!;
export const stockOf = (p: Page): Values => Object.fromEntries(p.settings.map(x => [x.key, x.stock]));
/** The page's values after the template: each layout setting takes the template's value, and a free setting keeps `now`. */
export const valuesOf = (p: Page, t: Template, now: Values = stockOf(p)): Values => ({ ...stockOf(p), ...t.values, ...Object.fromEntries(p.settings.filter(x => x.free).map(x => [x.key, now[x.key]!])) });
/** The template whose values are equal to the page's values, or undefined when the layout is "Custom" (#204, point 20). */
export const inUse = (p: Page, v: Values) => p.templates.find(t => { const tv = valuesOf(p, t); return p.settings.every(x => x.free || tv[x.key] === v[x.key]); });
export const show = (v: Value) => v === true ? 'On' : v === false ? 'Off' : String(v).replace('-', '−');
