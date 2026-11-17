// Game UI layout study (#197): sample Ren'Py lines for "what this writes" and the changes list.
// The names and line numbers are invented where the mock's settings are invented.
import { follows, type Value } from './model.ts';

export type SourceLine = { file: string; line: number; text: string; also?: string };

const owner: Record<string, string> = { say: 'textbox', choice: 'choice_button', title: 'main_menu', quick: 'quick_button', pause: 'navigation', save: 'file_slot', prefs: 'preferences', history: 'history', confirm: 'confirm' };
const known: Record<string, { name: string; line: number; file?: string; also?: string }> = {
  'gui.accent': { name: 'gui.accent_color', line: 28, also: 'Also redraws 34 of the 52 pictures in game/gui.' },
  'gui.text': { name: 'gui.text_color', line: 54 },
  'gui.font': { name: 'gui.text_font', line: 61 },
  'gui.size': { name: 'gui.text_size', line: 70 },
  'gui.panel': { name: 'gui.frame_color', line: 58, also: 'Also redraws the dialogue box and frame pictures in game/gui.' },
  'say.height': { name: 'gui.textbox_height', line: 101 },
  'say.place': { name: 'gui.textbox_yalign', line: 105 },
  'say.nameColor': { name: 'gui.name_text_color', line: 112 },
  'say.namePlace': { name: 'gui.name_xalign', line: 115 },
  'say.align': { name: 'gui.dialogue_text_xalign', line: 142 },
  'choice.width': { name: 'gui.choice_button_width', line: 207 },
  'choice.gap': { name: 'gui.choice_spacing', line: 268 },
  'title.bg': { name: 'gui.main_menu_background', line: 91 },
  'title.showName': { name: 'gui.show_name', line: 23, file: 'options.rpy' },
  'save.cols': { name: 'gui.file_slot_cols', line: 258 },
  'save.rows': { name: 'gui.file_slot_rows', line: 259 },
};
function nameOf(key: string) {
  const [page, setting] = key.split('.') as [string, string];
  return known[key]?.name ?? `gui.${owner[page] ? `${owner[page]}_` : ''}${setting.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)}`;
}
/** The line a setting writes for one value. A setting that follows the game-wide look writes a reference to it. */
export function sourceLine(key: string, value: Value): SourceLine {
  const fact = known[key];
  const literal = value === null ? nameOf(follows[key] ?? key) : typeof value === 'boolean' ? (value ? 'True' : 'False') : typeof value === 'number' ? String(value) : `"${value}"`;
  let hash = 0;
  for (const c of key) hash = (hash * 31 + c.charCodeAt(0)) % 280;
  return { file: fact?.file ?? 'gui.rpy', line: fact?.line ?? 120 + hash, text: `define ${nameOf(key)} = ${literal}`, also: fact?.also };
}
