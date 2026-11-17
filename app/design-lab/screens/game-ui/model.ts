// Game UI layout study (#197): the sample game look, its settings and its screens.
// Throwaway and memory-only. Setting names and values are invented for the mock.
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import dawn from '../story-revamp/art/bg-station-dawn.webp';
import tram from '../story-revamp/art/bg-tram-interior.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import eli from '../story-revamp/art/eli-neutral.webp';

export type Value = string | number | boolean | null;
export type Values = Record<string, Value>;
export const art: Record<string, string> = { platform, dawn, tram, mara, eli };

export const fonts: Record<string, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  round: '"Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif',
  type: '"Courier New", Courier, monospace',
};

type Options = readonly (readonly [value: string, label: string])[];
export type Field = {
  key: string; label: string; kind: 'color' | 'segment' | 'select' | 'range' | 'toggle' | 'image' | 'checks';
  options?: Options; min?: number; max?: number; unit?: string;
  /** With no value of its own, the field shows this game-wide setting. */
  follows?: string; help?: string;
  /** The element this one setting belongs to, when its group belongs to none. */
  part?: string;
};
export type Group = { title: string; part?: string; fields: Field[] };
export type Template = { id: string; name: string; values: Values };
export type Part = readonly [id: string, name: string, kind: string];
export type Sample = { key: string; label: string; options: Options };
export type Page = {
  id: string; title: string; group: 'whole' | 'story' | 'menus' | 'yours';
  groups?: Group[]; templates?: Template[]; parts: Part[]; samples?: Sample[];
};

export const groupTitles: Record<Page['group'], string> = { whole: 'Whole game', story: 'During the story', menus: 'Menus', yours: 'Your screens' };

const shapes: Options = [['square', 'Square'], ['rounded', 'Rounded'], ['pill', 'Pill']];
const sizes: Options = [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']];
const backdrops: Options = [['platform', 'Platform'], ['dawn', 'Dawn'], ['tram', 'Tram']];
const backdrop: Sample = { key: 'backdrop', label: 'Backdrop', options: backdrops };
const pointer: Sample = { key: 'state', label: 'Button', options: [['idle', 'Idle'], ['hover', 'Hover'], ['selected', 'Selected'], ['disabled', 'Disabled']] };
const menuSide: Field = { key: 'pause.side', label: 'Menu side', kind: 'segment', options: [['left', 'Left'], ['right', 'Right']], help: 'Also moves the menu in Save and load, Options and History.' };

export const themes: readonly { id: string; name: string; note: string; values: Values }[] = [
  { id: 'lantern', name: 'Lantern', note: 'Warm serif, brass edges', values: { 'gui.accent': '#e8a54b', 'gui.text': '#f6efe2', 'gui.panel': '#1d1410', 'gui.font': 'serif', 'gui.size': 'm', 'gui.shape': 'rounded', 'gui.fill': 'outline', 'gui.corners': 10, 'gui.border': 'thin', 'gui.shadow': true } },
  { id: 'harbor', name: 'Harbor', note: 'Cool, round and soft', values: { 'gui.accent': '#7fd0e6', 'gui.text': '#eef6fa', 'gui.panel': '#0e2230', 'gui.font': 'round', 'gui.size': 'm', 'gui.shape': 'pill', 'gui.fill': 'solid', 'gui.corners': 24, 'gui.border': 'none', 'gui.shadow': true } },
  { id: 'paper', name: 'Paper', note: 'Light page, ink borders', values: { 'gui.accent': '#a3412d', 'gui.text': '#2b2622', 'gui.panel': '#f4ecdc', 'gui.font': 'serif', 'gui.size': 'm', 'gui.shape': 'square', 'gui.fill': 'outline', 'gui.corners': 2, 'gui.border': 'thick', 'gui.shadow': false } },
  { id: 'plain', name: "Ren'Py default", note: 'What a new project has', values: { 'gui.accent': '#0099cc', 'gui.text': '#ffffff', 'gui.panel': '#000000', 'gui.font': 'sans', 'gui.size': 'm', 'gui.shape': 'square', 'gui.fill': 'plain', 'gui.corners': 0, 'gui.border': 'none', 'gui.shadow': false } },
];

export const defaults: Values = {
  ...themes[0]!.values,
  'say.layout': 'panel', 'say.fill': null, 'say.opacity': 82, 'say.height': 'm', 'say.place': 'bottom', 'say.nameColor': null, 'say.namePlace': 'left',
  'say.align': 'left', 'say.arrow': true, 'say.side': false, 'say.show': 'none',
  'choice.shape': null, 'choice.width': 46, 'choice.gap': 14, 'choice.place': 'center',
  'title.layout': 'left', 'title.bg': 'dawn', 'title.dim': 20, 'title.showName': true, 'title.nameSize': 'm', 'title.shape': null, 'title.panel': true,
  'quick.place': 'bottom', 'quick.size': 's', 'quick.items': 'Back,History,Skip,Auto,Save,Prefs',
  'pause.side': 'left', 'pause.dim': 70, 'save.cols': '3', 'save.rows': '2', 'save.time': true,
  'prefs.items': 'Display,Skip,Text speed,Auto-forward,Music,Sound', 'history.names': true, 'history.gap': 10, 'confirm.dim': 60, 'confirm.order': 'yes',
};

export const sampleDefaults: Record<string, string> = { backdrop: 'platform', line: 'short', who: 'mara', count: '3', slots: 'some', state: 'idle' };

const sayParts: Part[] = [['box', 'Box', 'Box'], ['name', 'Speaker name', 'Text'], ['text', 'Dialogue text', 'Text'], ['arrow', 'Continue arrow', 'Image'], ['side', 'Side picture', 'Image'], ['quick', 'Quick menu', 'Group']];
const menuParts: Part[] = [['nav', 'Menu buttons', 'Group'], ['body', 'Page content', 'Group']];

export const pages: readonly Page[] = [
  { id: 'look', title: 'Game-wide look', group: 'whole', parts: [], groups: [
    { title: 'Colors', fields: [
      { key: 'gui.accent', label: 'Accent', kind: 'color', help: 'Speaker names, titles and the button under the pointer.' },
      { key: 'gui.text', label: 'Text', kind: 'color' },
      { key: 'gui.panel', label: 'Boxes', kind: 'color' }] },
    { title: 'Text', fields: [
      { key: 'gui.font', label: 'Font', kind: 'select', options: [['sans', 'Clean'], ['serif', 'Bookish'], ['round', 'Rounded'], ['type', 'Typewriter']] },
      { key: 'gui.size', label: 'Size', kind: 'segment', options: sizes }] },
    { title: 'Buttons', fields: [
      { key: 'gui.shape', label: 'Shape', kind: 'segment', options: shapes },
      { key: 'gui.fill', label: 'Fill', kind: 'segment', options: [['plain', 'Text only'], ['outline', 'Outline'], ['solid', 'Solid']] }] },
    { title: 'Boxes', fields: [
      { key: 'gui.corners', label: 'Corners', kind: 'range', min: 0, max: 28, unit: 'px' },
      { key: 'gui.border', label: 'Border', kind: 'segment', options: [['none', 'None'], ['thin', 'Thin'], ['thick', 'Thick']] },
      { key: 'gui.shadow', label: 'Shadow', kind: 'toggle' }] },
  ] },
  { id: 'say', title: 'Dialogue box', group: 'story', parts: sayParts,
    samples: [{ key: 'line', label: 'Line', options: [['short', 'Short'], ['long', 'Long'], ['narration', 'Narration']] }, { key: 'who', label: 'Character', options: [['mara', 'Mara'], ['eli', 'Eli'], ['long', 'Long name'], ['none', 'Nobody']] }, backdrop],
    templates: [
      { id: 'panel', name: 'Floating panel', values: { 'say.layout': 'panel', 'say.opacity': 82, 'say.align': 'left' } },
      { id: 'bar', name: 'Wide bar', values: { 'say.layout': 'bar', 'say.opacity': 75, 'say.align': 'left' } },
      { id: 'tab', name: 'Name tab', values: { 'say.layout': 'tab', 'say.opacity': 92, 'say.align': 'left' } },
      { id: 'bare', name: 'Bare text', values: { 'say.layout': 'bare', 'say.opacity': 0, 'say.align': 'center' } }],
    groups: [
      { title: 'Box', part: 'box', fields: [
        { key: 'say.fill', label: 'Color', kind: 'color', follows: 'gui.panel' },
        { key: 'say.opacity', label: 'Opacity', kind: 'range', min: 0, max: 100, unit: '%' },
        { key: 'say.height', label: 'Height', kind: 'segment', options: [['s', 'Short'], ['m', 'Medium'], ['l', 'Tall']] },
        { key: 'say.place', label: 'Position', kind: 'segment', options: [['bottom', 'Bottom'], ['top', 'Top']] },
        { key: 'say.show', label: 'Appears with', kind: 'select', options: [['none', 'No animation'], ['fade', 'Fade in'], ['rise', 'Slide up']] }] },
      { title: 'Speaker name', part: 'name', fields: [
        { key: 'say.nameColor', label: 'Color', kind: 'color', follows: 'gui.accent', help: "A character's own color replaces this." },
        { key: 'say.namePlace', label: 'Position', kind: 'segment', options: [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] }] },
      { title: 'Dialogue text', part: 'text', fields: [
        { key: 'say.align', label: 'Align', kind: 'segment', options: [['left', 'Left'], ['center', 'Center']] }] },
      { title: 'Extras', fields: [
        { key: 'say.arrow', label: 'Continue arrow', kind: 'toggle', part: 'arrow' },
        { key: 'say.side', label: "Speaker's picture beside the text", kind: 'toggle', part: 'side' }] },
    ] },
  { id: 'choice', title: 'Choices', group: 'story', parts: [['list', 'Choice list', 'Group'], ['button', 'Choice button', 'Button'], ...sayParts],
    samples: [{ key: 'count', label: 'Options', options: [['2', 'Two'], ['3', 'Three'], ['5', 'Five']] }, pointer, backdrop],
    templates: [
      { id: 'stack', name: 'Centered stack', values: { 'choice.place': 'center', 'choice.width': 46 } },
      { id: 'wide', name: 'Wide rows', values: { 'choice.place': 'lower', 'choice.width': 86 } },
      { id: 'side', name: 'Right column', values: { 'choice.place': 'right', 'choice.width': 30 } }],
    groups: [
      { title: 'Buttons', part: 'button', fields: [
        { key: 'choice.shape', label: 'Shape', kind: 'segment', options: shapes, follows: 'gui.shape' },
        { key: 'choice.width', label: 'Width', kind: 'range', min: 24, max: 90, unit: '%' },
        { key: 'choice.gap', label: 'Gap', kind: 'range', min: 0, max: 40, unit: 'px' }] },
      { title: 'Placement', part: 'list', fields: [
        { key: 'choice.place', label: 'Position', kind: 'segment', options: [['center', 'Center'], ['lower', 'Lower'], ['right', 'Right']] }] },
    ] },
  { id: 'quick', title: 'Quick menu', group: 'story', parts: sayParts, samples: [backdrop], groups: [
    { title: 'Quick menu', part: 'quick', fields: [
      { key: 'quick.place', label: 'Position', kind: 'segment', options: [['bottom', 'Bottom'], ['top', 'Top right'], ['hidden', 'Hidden']] },
      { key: 'quick.size', label: 'Size', kind: 'segment', options: [['s', 'Small'], ['m', 'Medium']] },
      { key: 'quick.items', label: 'Buttons', kind: 'checks', options: ['Back', 'History', 'Skip', 'Auto', 'Save', 'Q.Save', 'Q.Load', 'Prefs'].map(item => [item, item] as const) }] },
  ] },
  { id: 'notify', title: 'Notices', group: 'story', parts: [['frame', 'Notice box', 'Box']], samples: [backdrop] },
  { id: 'skip', title: 'Skip indicator', group: 'story', parts: [['frame', 'Indicator box', 'Box']], samples: [backdrop] },
  { id: 'input', title: 'Text input', group: 'story', parts: sayParts, samples: [backdrop] },
  { id: 'nvl', title: 'NVL mode', group: 'story', parts: [['frame', 'Page box', 'Box']], samples: [backdrop] },
  { id: 'title', title: 'Title screen', group: 'menus', parts: [['bg', 'Background', 'Image'], ['panel', 'Menu panel', 'Box'], ['menu', 'Menu buttons', 'Group'], ['title', 'Game title', 'Text']],
    samples: [pointer],
    templates: [
      { id: 'left', name: 'Left column', values: { 'title.layout': 'left', 'title.panel': true } },
      { id: 'center', name: 'Centered', values: { 'title.layout': 'center', 'title.panel': false } },
      { id: 'bottom', name: 'Bottom row', values: { 'title.layout': 'bottom', 'title.panel': true } },
      { id: 'corner', name: 'Quiet corner', values: { 'title.layout': 'corner', 'title.panel': false } }],
    groups: [
      { title: 'Background', part: 'bg', fields: [
        { key: 'title.bg', label: 'Picture', kind: 'image', options: [...backdrops, ['none', 'None']] },
        { key: 'title.dim', label: 'Darken', kind: 'range', min: 0, max: 80, unit: '%' }] },
      { title: 'Game title', part: 'title', fields: [
        { key: 'title.showName', label: 'Show the title and version', kind: 'toggle' },
        { key: 'title.nameSize', label: 'Size', kind: 'segment', options: sizes }] },
      { title: 'Menu', part: 'menu', fields: [
        { key: 'title.shape', label: 'Button shape', kind: 'segment', options: shapes, follows: 'gui.shape' },
        { key: 'title.panel', label: 'Panel behind the menu', kind: 'toggle', part: 'panel' }] },
    ] },
  { id: 'pause', title: 'Pause menu', group: 'menus', parts: menuParts, samples: [pointer, backdrop], groups: [
    { title: 'Menu', part: 'nav', fields: [menuSide, { key: 'pause.dim', label: 'Darken the game', kind: 'range', min: 0, max: 95, unit: '%' }] }] },
  { id: 'save', title: 'Save and load', group: 'menus', parts: menuParts, samples: [{ key: 'slots', label: 'Slots', options: [['empty', 'All empty'], ['some', 'Two used'], ['full', 'All used']] }, backdrop], groups: [
    { title: 'Slots', part: 'body', fields: [
      { key: 'save.cols', label: 'Columns', kind: 'segment', options: [['2', '2'], ['3', '3'], ['4', '4']] },
      { key: 'save.rows', label: 'Rows', kind: 'segment', options: [['2', '2'], ['3', '3']] },
      { key: 'save.time', label: 'Show the save time', kind: 'toggle' }] }] },
  { id: 'prefs', title: 'Options', group: 'menus', parts: menuParts, samples: [backdrop], groups: [
    { title: 'Options shown to the player', part: 'body', fields: [
      { key: 'prefs.items', label: 'Rows', kind: 'checks', options: ['Display', 'Skip', 'Text speed', 'Auto-forward', 'Music', 'Sound', 'Voice'].map(item => [item, item] as const) }] }] },
  { id: 'history', title: 'History', group: 'menus', parts: menuParts, samples: [backdrop], groups: [
    { title: 'Lines', part: 'body', fields: [
      { key: 'history.names', label: 'Show speaker names', kind: 'toggle' },
      { key: 'history.gap', label: 'Gap', kind: 'range', min: 0, max: 30, unit: 'px' }] }] },
  { id: 'confirm', title: 'Confirm prompt', group: 'menus', parts: [['frame', 'Prompt box', 'Box']], samples: [backdrop], groups: [
    { title: 'Prompt', part: 'frame', fields: [
      { key: 'confirm.dim', label: 'Darken the game', kind: 'range', min: 0, max: 95, unit: '%' },
      { key: 'confirm.order', label: 'First button', kind: 'segment', options: [['yes', 'Yes'], ['no', 'No']] }] }] },
  { id: 'about', title: 'About', group: 'menus', parts: menuParts, samples: [backdrop] },
  { id: 'help', title: 'Help', group: 'menus', parts: menuParts, samples: [backdrop] },
  { id: 'ticket', title: 'Ticket stub', group: 'yours', parts: [['frame', 'Stub box', 'Box'], ['heading', 'Heading', 'Text'], ['detail', 'Detail line', 'Text'], ['board', 'Board button', 'Button']], samples: [backdrop] },
];

export const pageById = (id: string) => pages.find(item => item.id === id)!;
export const fieldByKey: Record<string, Field> = {};
export const follows: Record<string, string> = {};
/** The page whose settings own a key, for naming an edit. */
export const ownerOf: Record<string, Page> = {};
for (const item of pages) for (const group of item.groups ?? []) for (const field of group.fields) {
  fieldByKey[field.key] = field;
  ownerOf[field.key] ??= item;
  if (field.follows) follows[field.key] = field.follows;
}
