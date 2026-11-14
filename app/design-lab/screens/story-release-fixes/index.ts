// Story Combined release fixes (#120): copy and placement fixes found while qualifying Story Combined.
// Each lab state is one item; A and B are the two answers where there is a real choice.
// Throwaway, memory-only. The shell and dialogs come from the story-combined-status and -editor studies.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import maraConcerned from '../story-revamp/art/mara-concerned.webp';
import eliConcerned from '../story-revamp/art/eli-concerned.webp';
import { definition } from './definition.ts';
import '../story-revamp/combined-revision.css';
import '../story-draft-conflict/style.css';
import '../story-combined-status/style.css';
import '../story-combined-editor/style.css';
import './style.css';

export type Variant = 'a' | 'b';
type State = 'diagnostics' | 'set-variable' | 'protected' | 'move-protected' | 'delete-scene' | 'transition' | 'transition-add' | 'moved-draft' | 'screen-beat' | 'screen-beat-changed' | 'tracks-summary';
type Arm = 1 | 2 | 3 | 4;
type Cells = [string, string, string, string, string];
type Col = { type: 'beat'; id: string; kind: string; cells: Cells; arm?: Arm; rail?: string; locked?: boolean; mark?: string; warn?: number; title?: string; plus?: boolean; nameOf?: string };
type End = { type: 'end'; label: string; arm?: Arm };
type Slot = { type: 'slot'; label: string; after: string };
type Item = Col | End | Slot;
type VarType = 'bool' | 'int' | 'decimal' | 'string';
type Variable = { name: string; type: VarType };

/** What each state shows, and the names of its A and B answers. One name means one design. */
const items: Record<State, { code: string; a: string; b?: string }> = {
  diagnostics: { code: 'D2/B5', a: 'Reason and next step in words', b: 'Errors on the builder fields' },
  'set-variable': { code: 'B9', a: '+ New variable… in Set variable' },
  protected: { code: 'B8', a: 'Column + before the region', b: 'Labelled slot before the region' },
  'move-protected': { code: 'B8', a: 'Positions only, nothing preselected', b: 'Region and current place listed' },
  'delete-scene': { code: 'B4', a: 'Refusal stays in the scene list', b: 'Refusal in the status bar' },
  transition: { code: 'B14', a: 'The rule in the help text', b: 'Help names the changes it animates' },
  'transition-add': { code: 'B14', a: 'New Add a beat description' },
  'moved-draft': { code: 'D1', a: 'Override source writes to the moved beat', b: 'Add to If keeps the draft in its branch' },
  'screen-beat': { code: 'B13', a: 'Goes at, In, After and Move to…' },
  'screen-beat-changed': { code: 'B13', a: 'Place changed since Screens' },
  'tracks-summary': { code: 'B18', a: 'Expression and position in Characters' },
};

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const glyph = { undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4', close: 'M6 6l12 12M18 6 6 18', lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z' };
const button = (label: string, action: string, extra = '') => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const typeTag: Record<VarType, string> = { bool: 'Y/N', int: '#', decimal: '#.#', string: 'Aa' };
const typeName: Record<VarType, string> = { bool: 'yes/no', int: 'whole number', decimal: 'decimal', string: 'text' };
const ops: Record<VarType, string[]> = { bool: [], int: ['=', '≠', '<', '≤', '>', '≥'], decimal: ['=', '≠', '<', '≤', '>', '≥'], string: ['=', '≠'] };
const py: Record<string, string> = { '=': '==', '≠': '!=', '<': '<', '≤': '<=', '>': '>', '≥': '>=' };

function col(id: string, kind: string, lane: number, text: string, extra: Partial<Col> = {}): Col {
  const cells: Cells = ['', '', '', '', '']; cells[lane] = text;
  return { type: 'beat', id, kind, cells, plus: true, ...extra };
}
const end = (label: string, arm?: Arm): End => ({ type: 'end', label, arm });
/** "05 Mara's line", "07 Show character": how Goes at, After and Move to name a beat. */
const nameOf = (c: Col) => c.nameOf ?? `${c.id} ${c.kind}`;

// Add a beat rows, as production lists them. Only Transition's description changes (B14).
const kinds: [string, string, string][] = [
  ['Dialogue', 'Write', 'A spoken line with a speaker.'], ['Narration', 'Write', 'Story text with no speaker.'],
  ['Background', 'Stage', 'Sets the scene and clears characters.'], ['Show character', 'Stage', 'Puts a character on the stage.'],
  ['Hide character', 'Stage', 'Takes a character off the stage.'], ['Change appearance', 'Stage', "Changes a shown character's expression."],
  ['Move character', 'Stage', 'Moves a shown character.'], ['Transition', 'Stage', 'Animates the stage changes above it, since the last line or choice.'],
  ['Play music', 'Audio', 'Starts a music track.'], ['Stop music', 'Audio', 'Stops the current music.'], ['Sound effect', 'Audio', 'Plays a sound once.'],
  ['Choice', 'Flow', 'Options the player picks from.'], ['Condition', 'Flow', 'Branches on a test, then the story continues.'],
  ['Call scene', 'Flow', 'Visits a scene, then comes back.'], ['Jump', 'Flow', 'Goes to a scene and does not return.'], ['Return', 'Flow', 'Returns to the caller, or the main menu.'],
  ['Set variable', 'State', 'Stores a value for later conditions.'],
  ['Show screen', 'Screens', 'Shows a screen while the story continues.'], ['Hide screen', 'Screens', 'Hides a screen while the story continues.'], ['Call screen', 'Screens', 'Opens a screen and waits for it to close.'],
];

// Condition 06 for D2/B5. Two Else if tests have problems the builder must explain.
type Branch = { key: 'if' | 'missing' | 'type' | 'else'; word: string; arm: Arm; test: string; code: string; reason?: string };
const branches: Branch[] = [
  { key: 'if', word: 'If', arm: 1, test: 'has_ticket is true', code: 'if has_ticket:' },
  { key: 'missing', word: 'Else if', arm: 3, test: 'ticket_count = 2', code: 'elif ticket_count == 2:', reason: 'ticket_count is not a project variable.' },
  { key: 'type', word: 'Else if', arm: 4, test: 'destination ≥ 3', code: 'elif destination >= 3:', reason: 'destination is text. ≥ only compares numbers.' },
  { key: 'else', word: 'Otherwise', arm: 2, test: '', code: 'else:' },
];
const branchName = (b: Branch) => b.test ? `${b.word} ${b.test}` : b.word;

const scenes = [
  { id: 'service', name: 'The last service', refs: [] as string[] },
  { id: 'depot', name: 'Morning at the depot', refs: [] as string[] },
  { id: 'platform', name: 'Platform 4', refs: ['The last service · 07 Jump', 'Morning at the depot · 05 Call scene'] },
  { id: 'yard', name: 'Depot yard', refs: [] as string[], unknown: 'The last service · 09 Custom Code' },
];

export function mountFixes(host: HTMLElement, context: LabContext, initial: Variant) {
  let variant = initial;
  let state = context.state as State;
  const compact = () => host.clientWidth <= 640;

  // Sample state, rebuilt by reset().
  let message = '', messageError = false, dialog: '' | 'new-variable' | 'add-beat' | 'move' | 'place' = '';
  let variables: Variable[] = [];
  let fixed = new Set<string>(), drafted = new Map<string, string>(), pressed = 0, listOpen = '', newVarFor = '', scrollToEnd = false;
  let newVar = { name: '', type: 'int' as VarType, start: '0', error: '' };
  let setVar = '', addAt = '', highlight = 'Dialogue';
  let movePick = '', moveFocus = '', placeFor: 'move' | 'screen' = 'move';
  let scenesOpen = false, confirming = '', refused = '';
  let transition: 'dissolve' | 'fade' = 'fade';
  let draftText = '', resolved = '';
  let screenPlace = '', screenName = 'timetable';

  function reset() {
    message = ''; messageError = false; dialog = ''; fixed = new Set(); drafted = new Map(); pressed = 0; listOpen = ''; newVarFor = ''; scrollToEnd = state === 'moved-draft';
    variables = state === 'set-variable' ? [] : [{ name: 'has_ticket', type: 'bool' }, { name: 'trust', type: 'int' }, { name: 'fare', type: 'decimal' }, { name: 'destination', type: 'string' }];
    newVar = { name: '', type: 'int', start: '0', error: '' }; setVar = ''; addAt = ''; highlight = 'Dialogue';
    movePick = ''; moveFocus = ''; placeFor = 'move'; scenesOpen = false; confirming = ''; refused = '';
    transition = 'fade'; draftText = 'Keep your ticket. Some doors only open once, and this one is closing.'; resolved = '';
    screenPlace = state === 'screen-beat' ? 'Before 06 Narration' : ''; screenName = 'timetable';
    if (state === 'set-variable') listOpen = 'set';
    if (state === 'move-protected') openMove();
    if (state === 'delete-scene') { scenesOpen = true; confirming = 'platform'; }
    if (state === 'transition-add') { dialog = 'add-beat'; addAt = '03'; highlight = 'Transition'; }
  }

  // ---- Columns for each state.
  function columns(): Item[] {
    const plain = [col('04', 'Narration', 2, 'The timetable has not changed in thirty years.', { nameOf: '04 Narration' }), col('05', 'Dialogue', 2, 'Mara: You heard the bell too?', { nameOf: "05 Mara's line" })];
    switch (state) {
      case 'diagnostics': {
        const open = problems(), b = branches[pressed]!;
        const flow = variant === 'a' && open.length ? `${open.length} ${open.length === 1 ? 'test needs' : 'tests need'} changes` : 'Condition · If has_ticket is true';
        const inside = b.key === 'if' ? [col('06.1', 'Dialogue', 2, 'Eli: Keep your ticket. Some doors only open once.', { arm: 1, rail: 'If has_ticket is true' }), end('End of "If has_ticket is true"', 1)] : [end(`End of "${branchName(b)}"`, b.arm)];
        return [...plain, col('06', 'Condition', 4, flow, { warn: variant === 'a' && open.length ? 4 : undefined, mark: variant === 'b' && open.length ? '!' : undefined, title: open.map(p => `${branchName(p)}: ${p.reason}`).join('\n') }), ...inside, col('07', 'Narration', 2, 'The doors close behind them.'), end('End of scene')];
      }
      case 'set-variable': return [...plain.slice(0, 1), col('New', 'Set variable', 4, setVar ? `${setVar} = …` : 'Set variable', { mark: '*' }), plain[1]!, end('End of scene')];
      case 'protected': case 'move-protected': return protectedCols();
      case 'transition': case 'transition-add': {
        const list: Item[] = [col('01', 'Narration', 2, 'The timetable has not changed in thirty years.', { nameOf: '01 Narration' }), col('02', 'Background', 0, 'Rainy platform', { nameOf: '02 Background' }), col('03', 'Show character', 1, 'Mara · Neutral · Centre', { nameOf: '03 Show character' })];
        if (state === 'transition') list.push(col('04', 'Transition', 0, transition, { nameOf: '04 Transition' }), col('05', 'Dialogue', 2, 'Mara: You heard the bell too?', { nameOf: "05 Mara's line" }));
        else list.push(col('04', 'Dialogue', 2, 'Mara: You heard the bell too?', { nameOf: "04 Mara's line" }));
        return [...list, end('End of scene')];
      }
      case 'moved-draft': return [...plain.slice(1), col('06', 'Condition', 4, 'Condition · If has_ticket is true'), end('End of "If has_ticket is true"', 1), col('07', 'Narration', 2, 'The doors close behind them.'), end('End of scene')];
      case 'screen-beat': case 'screen-beat-changed': {
        const list: Item[] = [...plain, col('06', 'Narration', 2, 'The doors close behind them.', { nameOf: '06 Narration' }), end('End of scene')];
        if (screenPlace) {
          const at = screenPlace === 'End of scene' ? list.length - 1 : list.findIndex(i => i.type === 'beat' && screenPlace === `Before ${nameOf(i)}`);
          list.splice(Math.max(0, at), 0, col('New', 'Show screen', 4, `Show screen · ${screenName}`, { mark: '*' }));
        }
        return list;
      }
      case 'tracks-summary': return [
        col('01', 'Background', 0, 'Rainy platform'), col('02', 'Show character', 1, 'Mara · Smile · Left'), col('03', 'Show character', 1, 'Eli · Neutral · Right'),
        col('04', 'Dialogue', 2, 'Mara: You heard the bell too?'), col('05', 'Change appearance', 1, 'Eli · Concerned'), col('06', 'Move character', 1, 'Mara → Centre'),
        col('07', 'Hide character', 1, 'Hide Eli'), col('08', 'Narration', 2, 'The doors close behind them.'), end('End of scene')];
      default: return [...plain, col('06', 'Condition', 4, 'Condition · If has_ticket is true'), col('07', 'Jump', 4, 'Jump · Platform 4'), end('End of scene')];
    }
  }
  function protectedCols(): Item[] {
    const list: Item[] = [
      col('06', 'Background', 0, 'Rainy platform', { nameOf: '06 Background' }), col('07', 'Show character', 1, 'Mara · Neutral · Centre', { nameOf: '07 Show character' }),
      col('08', 'Dialogue', 2, 'Mara: You heard the bell too?', { nameOf: "08 Mara's line", plus: variant === 'a' }),
      col('09', 'Custom Code', 4, 'Protected Custom Code', { locked: true, nameOf: '09 Custom Code', title: 'python:\n    late = renpy.random.random() < 0.3\n    renpy.notify("Last call")' }),
      col('10', 'Dialogue', 2, 'Eli: Last call. Are you getting on?', { nameOf: "10 Eli's line" }), col('11', 'Narration', 2, 'The doors close behind them.', { nameOf: '11 Narration' }), end('End of scene'),
    ];
    if (variant === 'b') list.splice(3, 0, { type: 'slot', label: 'Before Custom Code', after: '08' });
    return list;
  }
  const beatCols = () => columns().filter((i): i is Col => i.type === 'beat');
  function selectedId() {
    return ({ diagnostics: '06', 'set-variable': 'New', protected: '10', 'move-protected': '10', 'delete-scene': '05', transition: '04', 'transition-add': '03', 'moved-draft': '', 'screen-beat': 'New', 'screen-beat-changed': '', 'tracks-summary': '05' } as Record<State, string>)[state];
  }

  // ---- D2/B5: condition diagnostics.
  const problems = () => branches.filter(b => b.reason && !fixed.has(b.key) && !drafted.has(b.key));
  function ruleRow(b: Branch, variable: Variable | undefined, shownName: string, op: string, value: string, errors: { variable?: string; op?: string } = {}) {
    const id = `srf-${b.key}`;
    const opsFor = variable ? ops[variable.type] : ops.int;
    const opButtons = variable?.type === 'bool' ? `<span class="srf-seg">${['is true', 'is false'].map(o => `<button type="button" data-action="noop" aria-pressed="${o === 'is true'}">${o}</button>`).join('')}</span>`
      : `<span class="srf-seg" role="group" aria-label="${escape(branchName(b))} test" ${errors.op ? `aria-describedby="${id}-op"` : ''}>${[...opsFor, ...(errors.op && !opsFor.includes(op) ? [op] : [])].map(o => `<button type="button" data-action="op" data-branch="${b.key}" data-op="${escape(o)}" aria-pressed="${o === op}" ${errors.op && o === op ? 'aria-invalid="true"' : ''}>${escape(o)}</button>`).join('')}</span>`;
    const list = listOpen === b.key ? variableList(b.key) : '';
    return `<div class="sc-rule srf-rule${variable?.type === 'bool' && !list ? ' srf-rule-inline' : ''}"><div class="srf-rule-top"><button type="button" class="srf-select" data-action="toggle-list" data-list="${b.key}" aria-haspopup="listbox" aria-expanded="${listOpen === b.key}" ${errors.variable ? `aria-invalid="true" aria-describedby="${id}-var"` : ''} aria-label="${escape(branchName(b))} variable: ${escape(shownName)}"><span class="sc-type">${variable ? typeTag[variable.type] : '?'}</span><span class="sc-variable-name">${escape(shownName)}</span><span class="sce-caret">▾</span></button></div>${list}
      ${errors.variable ? `<p class="srf-field-error" id="${id}-var">${escape(errors.variable)}</p>` : ''}
      <div class="srf-rule-how">${opButtons}${variable?.type === 'bool' ? '' : `<input aria-label="${escape(branchName(b))} value" value="${escape(value)}">`}</div>
      ${errors.op ? `<p class="srf-field-error" id="${id}-op">${escape(errors.op)}</p>` : ''}</div>`;
  }
  function variableList(key: string) {
    const rows = variables.length ? variables.map(v => `<button type="button" role="option" data-action="pick-variable" data-list="${key}" data-name="${v.name}" aria-selected="${(key === 'set' ? setVar : '') === v.name}"><span class="sc-type">${typeTag[v.type]}</span><span class="sc-variable-name">${v.name}</span><small>${typeName[v.type]}</small></button>`).join('')
      : '<p class="srf-list-empty">No variables yet.</p>';
    return `<div class="srf-list" role="listbox" aria-label="Variables">${rows}<button type="button" role="option" class="srf-create" data-action="new-variable" data-list="${key}" data-name="${key === 'missing' ? 'ticket_count' : ''}">+ New variable…</button></div>`;
  }
  function testBlock(b: Branch) {
    const code = (text: string) => `<code class="sc-test-code">${escape(text)}</code>`;
    if (b.key === 'else') return '<p class="srf-hint">Runs when no test above is true.</p>';
    if (b.key === 'if') return ruleRow(b, variables[0], 'has_ticket', '', '') + code(b.code);
    const variable = b.key === 'missing' ? variables.find(v => v.name === (drafted.get('missing') ?? 'ticket_count')) : variables.find(v => v.name === 'destination');
    const draftOp = b.key === 'type' ? drafted.get('type') : undefined;
    const draftActions = `<div class="sdc-row srf-draft-actions">${button('Commit test', 'commit-test', `class="sdc-primary" data-branch="${b.key}"`)}${button('Cancel', 'cancel-test', `data-branch="${b.key}"`)}</div>`;
    // Fixed in place (B) or by creating the variable (both): an ordinary rule row.
    if (b.key === 'missing' && (fixed.has('missing') || drafted.has('missing'))) {
      const name = drafted.get('missing') ?? 'ticket_count';
      return ruleRow(b, variable, name, '=', '2') + code(`elif ${name} == 2:`) + (drafted.has('missing') ? draftActions : '');
    }
    if (b.key === 'type' && draftOp) return ruleRow(b, variable, 'destination', draftOp, '3') + code(`elif destination ${py[draftOp]} "3":`) + draftActions;
    if (variant === 'a') {
      const next = b.key === 'missing' ? 'Create it, or change the test in Source.' : 'Compare it with = or ≠, or change the test in Source.';
      const actions = b.key === 'missing' ? `${button('Create ticket_count…', 'new-variable', 'data-list="missing" data-name="ticket_count"')}${button('Edit in Source', 'noop')}` : button('Edit in Source', 'noop');
      return `${code(b.code)}<p class="srf-diag" id="srf-${b.key}-reason"><b>${escape(b.reason!)}</b> ${next} The test stays as written until then.</p><div class="sdc-row">${actions}</div>`;
    }
    if (b.key === 'missing') return ruleRow(b, undefined, 'ticket_count', '=', '2', { variable: 'ticket_count is not a project variable. Choose one, or create it.' }) + code(b.code);
    return ruleRow(b, variable, 'destination', '≥', '3', { op: 'destination is text. Choose = or ≠.' }) + code(b.code);
  }
  function conditionEditor() {
    const open = problems();
    const caption = `<p class="srf-caption">Condition · If has_ticket is true · 4 branches / 1 beat</p>`;
    const summary = !open.length ? '' : variant === 'a'
      ? `<ul class="srf-problems" aria-label="Tests that need changes">${open.map(p => `<li><b aria-hidden="true">!</b> <span>${escape(branchName(p))}: ${escape(p.reason!)}</span></li>`).join('')}</ul>`
      : `<p class="srf-problem-line"><b aria-hidden="true">!</b> ${open.length} ${open.length === 1 ? 'test needs' : 'tests need'} changes: ${open.map(p => `<button type="button" class="srf-link" data-action="jump-branch" data-branch="${p.key}">${escape(branchName(p))}</button>`).join(', ')}</p>`;
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>06 · Condition</strong>${drafted.size ? '<span class="scs-editor-state">* Draft</span>' : ''}</div><p class="scs-trail">The last service</p>${caption}${summary}
      ${branches.map((b, i) => `<section class="sc-branch srf-branch" data-arm="${b.arm}" data-branch="${b.key}" tabindex="-1" aria-label="${escape(branchName(b))}"><div class="sc-branch-head"><strong>${b.word}${b.reason && open.includes(b) ? ' <b class="srf-warn-text" aria-hidden="true">!</b>' : ''}</strong>${button('Open', 'press-branch', `class="button" data-index="${i}" aria-pressed="${pressed === i}"`)}${button('+ Beat', 'noop', `class="button" ${b.reason && open.includes(b) ? 'disabled' : ''}`)}</div>${testBlock(b)}</section>`).join('')}
      ${button('+ Add Else if', 'noop', 'class="srf-small"')}`;
  }
  function conditionPath() {
    const b = branches[pressed]!, open = problems();
    const caption = variant === 'a' && b.key !== 'if' && b.key !== 'else'
      ? open.includes(b) ? `<span class="sc-condition-test srf-warn-text" title="${escape(b.reason!)}">${escape(b.test)} · ${b.key === 'missing' ? 'not a variable' : 'wrong type'}</span>` : `<span class="sc-condition-test">${escape(b.test)}</span>`
      : '<span class="sc-condition-test">has_ticket is true</span>';
    const switches = branches.map((x, i) => { const bad = open.includes(x); return `<button type="button" class="button${bad ? ' srf-path-warn' : ''}" aria-pressed="${i === pressed}" data-action="press-branch" data-index="${i}" ${bad ? `title="${escape(x.reason!)}" aria-label="${escape(branchName(x))}, needs changes: ${escape(x.reason!)}"` : ''}>${x.word}${bad ? ' !' : ''}</button>`; }).join('');
    return `<strong class="sc-conditions-title">Branch path</strong><span class="sc-condition-groups scs-path-groups"><span class="sc-condition-group scs-path-group" data-arm="${b.arm}"><span class="scs-path-ref">06</span>${caption}<span class="sc-branch-switch">${switches}</span></span></span>`;
  }

  // ---- B9: Set variable with + New variable….
  function setVariableEditor() {
    const v = variables.find(x => x.name === setVar);
    const value = !v ? `<input aria-label="Value" disabled placeholder="Choose a variable first">`
      : v.type === 'bool' ? '<select aria-label="Value"><option>False</option><option>True</option></select>'
      : `<div class="srf-equation"><code>${escape(v.name)}</code><span class="srf-op-chip">=</span><input aria-label="${v.type === 'string' ? 'Value' : 'Formula'}" value="${escape(v.type === 'string' ? '' : newVar.start)}"></div>${v.type === 'string' ? '' : `<p class="srf-hint">Gives a ${typeName[v.type]}.</p>`}`;
    return `${newBeatHeading('Set variable')}${where('Before 05 Mara\'s line', 'The last service', '04 Narration')}
      <div class="srf-field"><span>Variable</span><button type="button" class="srf-select" data-action="toggle-list" data-list="set" aria-haspopup="listbox" aria-expanded="${listOpen === 'set'}" aria-label="Variable: ${escape(v ? v.name : 'Choose a variable')}">${v ? `<span class="sc-type">${typeTag[v.type]}</span><span class="sc-variable-name">${escape(v.name)}</span>` : '<span class="srf-placeholder">Choose a variable</span>'}<span class="sce-caret">▾</span></button>${listOpen === 'set' ? variableList('set') : ''}</div>
      <div class="srf-field"><span>${v && v.type !== 'bool' && v.type !== 'string' ? 'Calculation' : 'Value'}</span>${value}</div>
      <div class="sdc-row srf-actions">${button('Cancel', 'noop')}${button('Add Beat', 'add-set', 'class="sdc-primary"')}</div>`;
  }
  const newBeatHeading = (kind: string, menu = true) => `<div class="sdc-editor-heading scs-editor-heading"><strong>New · ${kind}</strong><span class="scs-editor-state">* Draft</span>${menu ? `<span class="scs-spacer"></span>${button('⋯', kind === 'Show screen' ? 'open-place' : 'noop', `class="srf-menu" aria-label="Actions for the new beat: Move to…" title="Move to…"`)}` : ''}</div>`;
  const where = (goes: string, inside: string, after?: string, warn = false) => `<dl class="sce-where srf-where"><dt>Goes at</dt><dd${warn ? ' class="srf-warn-text"' : ''}>${escape(goes)}</dd><dt>In</dt><dd>${escape(inside)}</dd>${after ? `<dt>After</dt><dd>${escape(after)}</dd>` : ''}</dl>`;

  function newVariableDialog() {
    const types: [VarType, string][] = [['bool', 'Yes/no'], ['int', 'Whole number'], ['decimal', 'Decimal'], ['string', 'Text']];
    const start = newVar.type === 'bool' ? `<select aria-label="Starts as"><option>false</option><option>true</option></select>` : `<input aria-label="Starts as" value="${escape(newVar.start)}">`;
    return modal('New variable', `<label class="srf-field"><span>Name</span><input aria-label="Variable name" data-field="var-name" value="${escape(newVar.name)}" placeholder="e.g. found_letter" ${newVar.error ? 'aria-invalid="true" aria-describedby="srf-var-error"' : ''}></label>${newVar.error ? `<p class="srf-field-error" id="srf-var-error">${escape(newVar.error)}</p>` : ''}
      <div class="srf-field"><span>Type</span><span class="srf-seg srf-seg-wide" role="group" aria-label="Variable type">${types.map(([t, l]) => `<button type="button" data-action="var-type" data-type="${t}" aria-pressed="${newVar.type === t}">${l}</button>`).join('')}</span></div>
      <label class="srf-field"><span>Starts as</span>${start}</label><p class="srf-hint">Written as a default statement in the project. Saves and loads with the game.</p>`,
      `${button('Cancel', 'close')}${button('Create variable', 'create-variable', 'class="sdc-primary"')}`, 'srf-narrow');
  }

  // ---- B8: protected Custom Code.
  function dialogueEditor(id: string, speaker: string, text: string, menu = false) {
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>${id} · Dialogue</strong>${menu ? `<span class="scs-spacer"></span>${button('⋯', 'open-move', `class="srf-menu" aria-label="Actions for ${id}: Move to…" title="Move to…"`)}` : ''}</div><p class="scs-trail">The last service</p>
      <label class="sdc-speaker scs-speaker">Speaker<select aria-label="Speaker" data-speaker="${speaker}"><option>${speaker}</option></select></label>
      <label class="sdc-field"><span>Dialogue</span><textarea aria-label="Beat text">${escape(text)}</textarea></label>
      <div class="sdc-effects"><strong>In effect at ${id}</strong><span>Rainy platform</span><span>Mara · Neutral · Centre</span></div>`;
  }
  /** Places a beat can go, in source order. `skip` leaves out the moving beat's own place. */
  function positions(skip?: string): { label: string; kind: 'pos' | 'locked' | 'here'; after?: string }[] {
    const list = columns(), out: { label: string; kind: 'pos' | 'locked' | 'here'; after?: string }[] = [];
    const cols = list.filter((i): i is Col => i.type === 'beat' && i.id !== 'New');
    cols.forEach((c, n) => {
      const prev = cols[n - 1];
      if (c.id === skip) { if (variant === 'b' && placeFor === 'move') out.push({ label: `${nameOf(c)} · here now`, kind: 'here' }); return; }
      if (!(skip && prev?.id === skip)) out.push({ label: `Before ${nameOf(c)}`, kind: 'pos', after: prev ? nameOf(prev) : undefined });
      if (c.locked && variant === 'b' && placeFor === 'move') out.push({ label: `${nameOf(c)} · protected, stays in place`, kind: 'locked' });
    });
    const last = cols.at(-1);
    if (!(skip && last?.id === skip)) out.push({ label: 'End of scene', kind: 'pos', after: last ? nameOf(last) : undefined });
    return out;
  }
  function openMove() { dialog = 'move'; placeFor = 'move'; movePick = ''; moveFocus = 'Before 09 Custom Code'; }
  function placeDialog() {
    const isMove = placeFor === 'move', rows = positions(isMove ? '10' : undefined);
    const item = (r: (typeof rows)[number]) => r.kind === 'pos'
      ? `<li role="treeitem" class="sce-tree2-pos" data-place="${escape(r.label)}" aria-level="2" aria-selected="${r.label === movePick}" tabindex="${r.label === moveFocus ? 0 : -1}" style="--depth:1"><span class="sce-tree2-mark" aria-hidden="true">${r.label === movePick ? '●' : '○'}</span>${escape(r.label)}</li>`
      : `<li role="none" class="srf-tree-note srf-tree-${r.kind}" style="--depth:1"><span class="sce-tree2-mark" aria-hidden="true">${r.kind === 'locked' ? svg(glyph.lock) : '◆'}</span>${escape(r.label)}</li>`;
    const tree = `<ul class="sce-tree2" role="tree" aria-label="${isMove ? 'Move to' : 'Goes at'}"><li role="treeitem" class="sce-tree2-place" aria-level="1" aria-expanded="true" tabindex="-1" style="--depth:0"><span class="sce-tree2-mark" aria-hidden="true">▾</span>The last service</li>${rows.map(item).join('')}</ul>`;
    const summary = movePick ? `${isMove ? 'Move to' : 'Goes at'} The last service · ${escape(movePick)}` : isMove ? '10 Eli\'s line is after 09 Custom Code now. Choose where to move it.' : 'Choose where this beat goes.';
    const title = isMove ? "Move 10 Eli's line" : 'Place the new Show screen';
    const note = isMove ? 'Moves this beat to the chosen scene, branch or option. Protected Custom Code stays where it is.' : 'Puts the new beat at the chosen place.';
    return modal(title, `<p class="sce-dialog-note">${note}</p>${tree}<p class="sce-summary${movePick ? '' : ' srf-summary-idle'}" role="status">${summary}</p><p class="sce-hint">Arrow keys move · Enter selects · Escape cancels</p>`,
      `${button('Cancel', 'close')}${button(isMove ? 'Move' : 'Choose', 'place-done', 'class="sdc-primary"')}`);
  }
  function addBeatDialog() {
    const cols = beatCols(), at = cols.findIndex(c => c.id === addAt), before = at >= 0 ? cols[at] : undefined, next = at >= 0 ? cols[at + 1] : undefined;
    const goes = next ? `Before ${nameOf(next)}` : 'End of scene';
    const pick = kinds.find(k => k[0] === highlight) ?? kinds[0]!;
    const groups = [...new Set(kinds.map(k => k[1]))];
    return modal('Add a beat', `<label class="sce-search">${svg(glyph.search)}<input type="search" placeholder="Search beats" aria-label="Find a beat"></label>
      <div class="sce-picker-body"><div class="sce-results srf-results" role="listbox" aria-label="Beat types">${groups.map(g => `<section><h4>${g}</h4>${kinds.filter(k => k[1] === g).map(k => `<button type="button" role="option" data-action="add-kind" data-kind="${k[0]}" aria-selected="${k[0] === highlight}">${k[0]}</button>`).join('')}</section>`).join('')}</div>
      <div class="sce-picker-details"><h3>${pick[0]}</h3><p>${escape(pick[2])}</p><dl class="sce-where"><dt>Goes at</dt><dd>${escape(goes)}</dd><dt>In</dt><dd>The last service</dd>${before ? `<dt>After</dt><dd>${escape(nameOf(before))}</dd>` : ''}</dl></div></div>
      <p class="sce-hint">Click or Enter adds · Escape cancels</p>`, '', 'srf-wide');
  }

  // ---- B4: scene delete refusal.
  function refusalText(id: string) {
    const s = scenes.find(x => x.id === id)!;
    const link = (r: string) => `<button type="button" class="srf-link" data-action="ref" data-ref="${escape(r)}">${escape(r)}</button>`;
    const lead = `Can't delete "${s.name}".`;
    if (s.unknown) return { lead, intro: 'Custom Code may jump to it, and Loomlight can\'t check where it goes:', refs: [link(s.unknown)], tail: 'Change that code in Source first. Nothing was deleted.' };
    return { lead, intro: `${s.refs.length} beats go to it:`, refs: s.refs.map(link), tail: 'Change or remove them, then delete again. Nothing was deleted.' };
  }
  function sceneList() {
    if (!scenesOpen) return '';
    const row = (s: (typeof scenes)[number]) => {
      const current = s.id === 'service';
      let extra = '';
      if (confirming === s.id) extra = `<div class="srf-confirm" role="group" aria-label="Delete ${escape(s.name)}"><p>Delete scene "${escape(s.name)}"? Undo restores it.</p><div class="sdc-row">${button('Cancel', 'cancel-delete')}${button('Delete scene', 'delete-scene', `class="srf-danger" data-scene="${s.id}"`)}</div></div>`;
      if (refused === s.id && variant === 'a') { const r = refusalText(s.id); extra = `<div class="srf-refusal" role="alert" tabindex="-1"><p><b>${escape(r.lead)}</b> ${escape(r.intro)}</p><ul>${r.refs.map(l => `<li>${l}</li>`).join('')}</ul><p>${escape(r.tail)}</p><div class="sdc-row">${button('Close', 'cancel-delete')}</div></div>`; }
      return `<li><div class="srf-scene-row${current ? ' srf-scene-current' : ''}"><button type="button" class="srf-scene-name" data-action="noop" ${current ? 'aria-current="page"' : ''}>${escape(s.name)}</button>${button('⋯', 'scene-menu', `class="srf-menu" data-scene="${s.id}" aria-label="Delete ${escape(s.name)}" title="Delete scene"`)}</div>${extra}</li>`;
    };
    return `<div class="srf-scenes" role="dialog" aria-label="Scenes"><h3>Chapter 1</h3><ul>${scenes.map(row).join('')}</ul>${button('+ New scene', 'noop', 'class="srf-small"')}</div>`;
  }

  // ---- B14: Transition.
  function transitionEditor() {
    const word = transition === 'fade' ? 'Fades' : 'Dissolves';
    const help = variant === 'a'
      ? '<p class="srf-hint">Ren\'Py plays this transition for every stage change since the last line, choice or transition. Put it after the Background or Show character beats it should animate.</p>'
      : `<p class="srf-hint srf-lead">${word} in the stage changes since 01 Narration:</p><ul class="srf-plain-list"><li>02 Background · Rainy platform</li><li>03 Show character · Mara</li></ul><p class="srf-hint">Ren'Py plays this transition for every stage change since the last line, choice or transition.</p>`;
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>04 · Transition</strong></div><p class="scs-trail">The last service</p>
      <div class="srf-field"><span>Transition</span><span class="srf-seg srf-seg-wide" role="group" aria-label="Transition">${(['dissolve', 'fade'] as const).map(t => `<button type="button" data-action="transition" data-value="${t}" aria-pressed="${t === transition}">${t === 'fade' ? 'Fade' : 'Dissolve'}</button>`).join('')}</span></div>${help}
      <div class="sdc-effects"><strong>In effect at 04</strong><span>Rainy platform</span><span>Mara · Neutral · Centre</span></div>`;
  }

  // ---- D1: a draft whose beat moved to another branch.
  function movedDraftEditor() {
    if (resolved) return `<div class="sdc-editor-heading scs-editor-heading"><strong>06 · Condition</strong></div><p class="scs-trail">The last service</p><p class="srf-hint">${escape(resolved)}</p>`;
    const action = variant === 'a' ? button('Override source', 'resolve', 'class="sdc-primary" data-how="override"') : button('Add to If', 'resolve', 'class="sdc-primary" data-how="add"');
    const note = variant === 'a' ? 'Override source saves your draft to this beat in Otherwise. Other drafts stay unsaved.'
      : 'Add to If adds your draft as a new beat at the end of If has_ticket is true. The moved beat keeps the source text. Other drafts stay unsaved.';
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>Eli's line · Dialogue</strong><span class="scs-editor-state scs-conflict-text">! Conflict</span></div>
      <p class="scs-trail">The last service › If has_ticket is true</p>
      <section class="sdc-conflict" tabindex="-1" aria-label="Conflict with source"><strong>Conflict with source</strong><p>This beat moved to Otherwise in source. Your draft is still for this beat.</p><label>Source, now in Otherwise<output class="sdc-saved-line">Keep your ticket. Some doors only open once.</output></label><p class="srf-conflict-link">${button('Show it in Otherwise', 'show-moved', 'class="srf-link"')}</p></section>
      <label class="sdc-speaker scs-speaker">Speaker<select aria-label="Speaker" data-speaker="Eli"><option>Eli</option></select></label>
      <label class="sdc-field"><span>Your draft</span><textarea aria-label="Beat text" data-field="draft">${escape(draftText)}</textarea></label>
      <div class="sdc-resolution"><div class="sdc-row">${button('Discard draft', 'resolve', 'data-how="discard"')}${action}</div><p>${note}</p></div>`;
  }

  // ---- B13: screen beat placement.
  function screenEditor() {
    const changed = state === 'screen-beat-changed' && !screenPlace;
    const cols = beatCols(), at = cols.findIndex(c => c.id === 'New'), after = at > 0 ? nameOf(cols[at - 1]!) : undefined;
    const placeNote = changed ? `<p class="srf-diag"><b>The scene changed after you picked this place in Screens.</b> Choose where this beat goes.</p><div class="sdc-row">${button('Choose a place…', 'open-place')}</div>` : '';
    return `${newBeatHeading('Show screen', !changed)}${where(changed ? 'Choose a place' : screenPlace, 'The last service', changed ? undefined : after, changed)}${placeNote}
      <label class="srf-field"><span>Panel screen</span><select aria-label="Panel screen" data-field="screen"><option ${screenName === 'timetable' ? 'selected' : ''}>timetable</option><option ${screenName === 'ticket_card' ? 'selected' : ''}>ticket_card</option></select></label>
      <p class="srf-hint">Show keeps the panel open while dialogue continues. Hide, Close and game Escape dismiss it. Outside clicks keep it open.</p>
      <div class="sdc-row srf-actions">${button('Cancel', 'noop')}${button('Add Beat', 'add-screen', 'class="sdc-primary"')}</div>`;
  }

  // ---- B18: Tracks character summaries.
  function appearanceEditor() {
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>05 · Change appearance</strong></div><p class="scs-trail">The last service</p>
      <label class="sdc-speaker scs-speaker">Character<select aria-label="Character" data-speaker="Eli"><option>Eli</option></select></label>
      <div class="srf-field"><span>Expression</span><div class="srf-expression"><img src="${eliConcerned}" alt=""><span><strong>Concerned</strong><small>4 expressions for Eli</small></span>${button('Change', 'noop')}</div></div>
      <div class="srf-field"><span>Transition</span><span class="srf-seg srf-seg-wide" role="group" aria-label="Transition">${['None', 'Dissolve', 'Fade'].map(t => `<button type="button" data-action="noop" aria-pressed="${t === 'None'}">${t}</button>`).join('')}</span></div>
      <p class="srf-hint">Tracks names the character, expression and position. Position stays as it was when only the expression changes.</p>`;
  }

  // ---- Shell.
  function editor() {
    switch (state) {
      case 'diagnostics': return conditionEditor();
      case 'set-variable': return setVariableEditor();
      case 'protected': case 'move-protected': return dialogueEditor('10', 'Eli', 'Last call. Are you getting on?', true);
      case 'transition': return transitionEditor();
      case 'transition-add': return `<div class="sdc-editor-heading scs-editor-heading"><strong>03 · Show character</strong></div><p class="scs-trail">The last service</p><p class="srf-hint">Mara · Neutral · Centre. No transition.</p>`;
      case 'moved-draft': return movedDraftEditor();
      case 'screen-beat': case 'screen-beat-changed': return screenEditor();
      case 'tracks-summary': return appearanceEditor();
      default: return dialogueEditor('05', 'Mara', 'You heard the bell too?');
    }
  }
  function stage() {
    const s = ({ 'tracks-summary': { art: eliConcerned, alt: 'Eli', speaker: 'Mara', text: 'You heard the bell too?' }, 'moved-draft': { art: mara, alt: 'Mara', speaker: 'Mara', text: 'You heard the bell too?' }, protected: { art: mara, alt: 'Mara', speaker: 'Eli', text: 'Last call. Are you getting on?' }, 'move-protected': { art: mara, alt: 'Mara', speaker: 'Eli', text: 'Last call. Are you getting on?' }, diagnostics: { art: maraConcerned, alt: 'Mara', speaker: 'Mara', text: 'You heard the bell too?' } } as Partial<Record<State, { art: string; alt: string; speaker: string; text: string }>>)[state] ?? { art: mara, alt: 'Mara', speaker: state === 'transition' || state === 'transition-add' ? '' : 'Mara', text: state === 'transition' || state === 'transition-add' ? 'The timetable has not changed in thirty years.' : 'You heard the bell too?' };
    return `<section class="sdc-stage-area" aria-label="Game stage"><div class="sdc-stage-heading"><strong>Game window</strong><span>1920 × 1080</span></div><div class="sdc-stage-fit"><div class="sdc-stage"><img class="sdc-background" src="${platform}" alt=""><div class="sdc-character"><img src="${s.art}" alt="${s.alt}"></div><div class="sdc-saybox"><strong class="scs-say-${s.speaker.toLowerCase()}">${s.speaker}</strong><p>${escape(s.text)}</p></div></div></div></section>`;
  }
  function path() {
    if (state === 'diagnostics') return conditionPath();
    if (state === 'moved-draft') return `<strong class="sc-conditions-title">Branch path</strong><span class="sc-condition-groups scs-path-groups"><span class="sc-condition-group scs-path-group" data-arm="1"><span class="scs-path-ref">06</span><span class="sc-condition-test">has_ticket is true</span><span class="sc-branch-switch">${button('If', 'noop', 'class="button" aria-pressed="true"')}${button('Otherwise', 'show-moved', 'class="button" aria-pressed="false"')}</span></span></span>`;
    if (['delete-scene'].includes(state)) return '<strong class="sc-conditions-title">Branch path</strong><span class="sc-condition-groups scs-path-groups"><span class="sc-condition-group scs-path-group" data-arm="1"><span class="scs-path-ref">06</span><span class="sc-condition-test">has_ticket is true</span><span class="sc-branch-switch"><button type="button" class="button" aria-pressed="true" data-action="noop">If</button><button type="button" class="button" aria-pressed="false" data-action="noop">Otherwise</button></span></span></span>';
    return '<strong class="sc-conditions-title">Branch path</strong><span class="sc-conditions-empty">No conditions or choices in this scene.</span>';
  }
  function tracks() {
    const list = columns(), sel = selectedId(), small = compact();
    const rail = (item: Item, prev?: Item) => {
      const arm = item.type === 'slot' ? undefined : item.arm;
      if (!arm) return '<span class="scs-rail"></span>';
      const first = item.type === 'beat' && item.rail && (prev?.type === 'slot' || prev?.arm !== arm);
      return `<span class="scs-rail scs-rail-on" data-arm="${arm}">${first ? `<span class="scs-rail-label">${escape((item as Col).rail!)}</span>` : ''}</span>`;
    };
    return list.map((item, i) => {
      const prev = list[i - 1];
      if (item.type === 'end') return `<div class="scs-end-wrap" ${item.arm ? `data-arm="${item.arm}"` : ''}>${rail(item, prev)}<button type="button" class="scs-end" data-action="add-end" data-label="${escape(item.label)}" aria-label="Add a beat at ${escape(item.label)}"><span class="scs-end-plus">+</span><span class="scs-end-text">${escape(item.label)}</span></button></div>`;
      if (item.type === 'slot') return `<div class="scs-end-wrap srf-slot-wrap"><span class="scs-rail"></span><button type="button" class="scs-end srf-slot" data-action="add-after" data-after="${item.after}" aria-label="Add a beat before 09 Custom Code" title="Add a beat before 09 Custom Code"><span class="scs-end-plus">+</span><span class="scs-end-text">${escape(item.label)}</span></button></div>`;
      const c = item, text = small ? [c.cells.find(Boolean) ?? ''] : c.cells;
      const body = text.map((t, n) => `<span${(small ? c.warn !== undefined : n === c.warn) ? ' class="srf-warn-text"' : ''}>${escape(t)}</span>`).join('');
      const next = list.slice(i + 1).find(x => x.type === 'beat') as Col | undefined;
      const plusLabel = `Add after ${nameOf(c)}${next?.locked ? `, before ${nameOf(next)}` : ''}`;
      const plus = c.plus && c.id !== 'New' && !(next?.locked && variant === 'b' && ['protected', 'move-protected'].includes(state)) && (state === 'protected' || state === 'move-protected' || state === 'transition-add')
        ? `<button type="button" class="srf-plus" data-action="add-after" data-after="${c.id}" aria-label="${escape(plusLabel)}" title="${escape(plusLabel)}">+</button>` : '';
      const mark = c.mark ? `<b class="${c.mark === '!' ? 'srf-warn-mark' : 'scs-draft-mark'}" aria-hidden="true">${c.mark}</b>` : '';
      return `<div class="scs-col-wrap" ${c.arm ? `data-arm="${c.arm}"` : ''}>${rail(c, prev)}<button type="button" class="sdc-column scs-column${c.locked ? ' srf-locked' : ''}" data-action="noop" aria-pressed="${c.id === sel}" aria-label="${escape(`Beat ${c.id} ${c.kind}${c.locked ? ', protected' : ''}${c.mark === '!' ? ', tests need changes' : ''}`)}" ${c.title ? `title="${escape(c.title)}"` : ''}><span class="sdc-beat-number">${c.id}${mark}</span>${body}</button>${plus}</div>`;
    }).join('');
  }
  function footerStatus() {
    if (state === 'delete-scene' && variant === 'b' && refused) { const r = refusalText(refused); return `<span class="srf-error-text"><b>${escape(r.lead)}</b></span><span>${escape(r.intro)}</span>${r.refs.join('<span class="scs-dim">·</span>')}<span>${escape(r.tail)}</span>`; }
    return `<span class="scs-message${messageError ? ' srf-error-text' : ''}">${escape(message || 'Ready')}</span>`;
  }
  function header() {
    const draft = ['set-variable', 'moved-draft', 'screen-beat', 'screen-beat-changed'].includes(state) || drafted.size;
    const cmd = (kind: 'undo' | 'redo', label: string, on: boolean) => `<span class="scs-cmd"><button type="button" class="scs-history" data-action="noop" aria-label="${label}" aria-disabled="${!on}">${svg(glyph[kind])}</button><span class="scs-tip" role="tooltip">${label}</span></span>`;
    return `<header class="scs-header"><strong class="scs-brand" data-icon="story">Loomlight</strong><span class="scs-project">The Last Tram</span>
      <div class="scs-save-state" aria-label="Save status"><span>${draft ? compact() ? '1 unsaved' : '1 unsaved beat draft' : 'Saved'}</span></div>
      <div class="scs-history-group" role="group" aria-label="Project history">${cmd('undo', 'Undo text edit in beat 05', true)}${cmd('redo', 'Nothing to redo', false)}</div>
      ${button('Save', 'noop', 'class="sdc-primary"')}<span class="scs-runtime">${button('Validate', 'noop')}${button('Run', 'noop')}${button('Stop', 'noop', 'disabled')}</span></header>`;
  }
  function modal(title: string, content: string, actions = '', cls = '') {
    return `<div class="sce-backdrop"><div class="sce-dialog ${cls}" tabindex="-1" role="dialog" aria-modal="true" aria-label="${escape(title)}"><div class="sce-dialog-head"><h2>${escape(title)}</h2>${button(svg(glyph.close), 'close', 'aria-label="Close" class="sce-close"')}</div>${content}${actions ? `<div class="sce-dialog-actions">${actions}</div>` : ''}</div></div>`;
  }
  function protoBar() {
    const it = items[state];
    const pick = it.b ? `${it.code} · ${variant === 'a' ? 'A' : 'B'}: ${variant === 'a' ? it.a : it.b}` : `${it.code} · ${it.a} · one design, same in A and B`;
    return `<section class="scs-prototype srf-prototype" aria-label="Prototype controls"><strong>Release fixes · draft</strong>
      <label>Item <select aria-label="Fix item">${definition.states.map(s => `<option value="${s.id}" ${s.id === state ? 'selected' : ''}>${escape(s.title)}</option>`).join('')}</select></label>
      <label>Compare <select aria-label="Fix variant"><option value="a" ${variant === 'a' ? 'selected' : ''}>A</option><option value="b" ${variant === 'b' ? 'selected' : ''}>B</option></select></label>
      <span class="srf-item" data-single="${!it.b}">${escape(pick)}</span>${button('Reset', 'reset')}</section>`;
  }

  function render() {
    const focusKey = (document.activeElement as HTMLElement | null)?.closest('[data-field]')?.getAttribute('data-field');
    const sel = beatCols().find(c => c.id === selectedId());
    const contextLine = state === 'moved-draft' ? 'Tracks · draft for Eli\'s line' : sel ? `Tracks · editing ${sel.id === 'New' ? `new ${sel.kind}` : `${sel.id} ${sel.kind}`}` : 'Tracks · new Show screen, no place yet';
    host.innerHTML = `<div class="sdc-shell sc-combined-shell scs-shell sce-shell srf-shell" data-variant="${variant}" data-state="${state}">${protoBar()}
      <div class="scs-app">${header()}
        <div class="scs-body"><nav class="sdc-nav" aria-label="Workspaces"><span data-icon="panelOpen"></span><span data-icon="story" class="sdc-nav-selected" title="Story"></span><span data-icon="source"></span><span data-icon="branches"></span><span data-icon="characters"></span><span data-icon="assets"></span></nav>
        <main class="scs-main">
          <header class="scs-toolbar srf-toolbar">${button('The last service ▾', 'toggle-scenes', `class="srf-scene-button" aria-expanded="${scenesOpen}"`)}<span class="scs-spacer"></span>${button('Writing focus', 'noop')}${button('+ Add beat', 'noop', 'class="sdc-primary"')}${button('More', 'noop', 'class="scs-plain"')}${sceneList()}</header>
          <div class="scs-workspace">${stage()}<aside class="sdc-editor" aria-label="Selected beat editor">${editor()}</aside></div>
          <nav class="sc-conditions scs-path" aria-label="Branch path">${path()}</nav>
          <section class="scs-bottom" aria-label="Story beats"><div class="sdc-mode">${button('Tracks', 'noop', 'aria-pressed="true"')}${button('Reel', 'noop', 'aria-pressed="false"')}<span class="scs-legend"><span><b class="scs-draft-mark">*</b> Draft</span><span><b class="scs-conflict-mark">!</b> Conflict with source</span>${state === 'diagnostics' && variant === 'b' ? '<span><b class="srf-warn-mark">!</b> Test needs changes</span>' : ''}</span></div>
            <div class="sdc-timeline"><div class="sdc-lane-labels scs-lanes">${(compact() ? ['Beat', 'Beat content'] : ['Beat', 'Background', 'Characters', 'Words', 'Sound', 'Flow / state']).map(l => `<span>${l}</span>`).join('')}</div><div class="sdc-columns scs-columns">${tracks()}</div></div></section>
        </main></div>
        <footer class="scs-footer" aria-label="Status"><div class="scs-footer-status" role="status">${footerStatus()}</div><span class="scs-footer-context">${escape(contextLine)}</span></footer>
        ${dialog === 'new-variable' ? newVariableDialog() : dialog === 'add-beat' ? addBeatDialog() : dialog === 'move' || dialog === 'place' ? placeDialog() : ''}
      </div></div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon!)));
    const row = host.querySelector<HTMLElement>('.scs-columns')!, chosen = row.querySelector<HTMLElement>('[aria-pressed=true]');
    if (chosen) { const c = chosen.parentElement!.getBoundingClientRect(), r = row.getBoundingClientRect(); row.scrollLeft += c.left - r.left - Math.max(0, (r.width - c.width) / 3); }
    if (compact()) { const work = host.querySelector<HTMLElement>('.scs-workspace')!, ed = host.querySelector<HTMLElement>('.sdc-editor')!; ed.style.minHeight = `${work.clientHeight}px`; work.scrollTop = ed.offsetTop; }
    // D1: the resolution row is what A and B change, so keep it in view.
    if (state === 'moved-draft' && scrollToEnd) { scrollToEnd = false; const box = compact() ? host.querySelector<HTMLElement>('.scs-workspace')! : host.querySelector<HTMLElement>('.sdc-editor')!; box.scrollTop = box.scrollHeight; }
    const first = ['.sce-tree2 [tabindex="0"]', '.sce-dialog [aria-selected=true]', '.sce-dialog input', '.sce-dialog', '.srf-refusal', '.srf-confirm .srf-danger', '.srf-list [role=option]'].map(q => host.querySelector<HTMLElement>(q)).find(Boolean);
    if (focusKey) host.querySelector<HTMLElement>(`[data-field="${focusKey}"]`)?.focus();
    else first?.focus({ preventScroll: true });
  }

  // ---- Actions.
  function say(text: string, error = false) { message = text; messageError = error; }
  function createVariable(list: string) {
    const name = newVar.name.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) { newVar.error = 'Use letters, numbers and underscores, and start with a letter.'; return; }
    if (variables.some(v => v.name === name)) { newVar.error = `${name} already exists. Choose another name.`; return; }
    variables.push({ name, type: newVar.type }); dialog = ''; listOpen = '';
    if (list === 'set') setVar = name;
    if (list === 'missing' && name === 'ticket_count') fixed.add('missing');
    if (list === 'missing' && name !== 'ticket_count') drafted.set('missing', name);
    say(`Created ${name}. Undo removes it.`);
  }
  function onClick(event: MouseEvent) {
    const placeRow = (event.target as HTMLElement).closest<HTMLElement>('[data-place]');
    if (placeRow && host.contains(placeRow)) { movePick = moveFocus = placeRow.dataset.place!; render(); return; }
    const t = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!t || !host.contains(t) || t.getAttribute('aria-disabled') === 'true') return;
    const a = t.dataset;
    switch (a.action) {
      case 'reset': reset(); break;
      case 'close': dialog = ''; break;
      case 'noop': say(`${t.getAttribute('aria-label') ?? t.textContent?.trim()} is outside this study.`); break;
      // D2/B5
      case 'press-branch': pressed = Number(a.index); break;
      case 'jump-branch': { const node = host.querySelector<HTMLElement>(`.srf-branch[data-branch="${a.branch}"]`); node?.scrollIntoView({ block: 'nearest' }); node?.focus(); return; }
      case 'toggle-list': listOpen = listOpen === a.list ? '' : a.list!; break;
      case 'pick-variable':
        if (a.list === 'set') setVar = a.name!;
        else if (a.list === 'missing') drafted.set('missing', a.name!);
        listOpen = ''; break;
      case 'new-variable': newVar = { name: a.name ?? '', type: 'int', start: '0', error: '' }; dialog = 'new-variable'; newVarFor = a.list!; listOpen = ''; break;
      case 'var-type': newVar.type = a.type as VarType; newVar.start = newVar.type === 'string' ? '' : newVar.type === 'bool' ? 'false' : '0'; break;
      case 'create-variable': createVariable(newVarFor); break;
      case 'op': if (a.branch === 'type' && (a.op === '=' || a.op === '≠')) drafted.set('type', a.op); else if (a.branch === 'type') say('destination is text. Choose = or ≠.', true); break;
      case 'commit-test': fixed.add(a.branch!); drafted.delete(a.branch!); say(`Saved the ${a.branch === 'type' ? 'destination' : 'ticket_count'} test.`); break;
      case 'cancel-test': drafted.delete(a.branch!); say('Cancelled the test draft. The source is unchanged.'); break;
      // B9
      case 'add-set': if (!setVar) { say('Choose a variable, or create one with + New variable….', true); break; } say(`Added Set variable ${setVar} before 05 Mara's line.`); break;
      // B8, B14, B13
      case 'add-after': addAt = a.after!; highlight = 'Dialogue'; dialog = 'add-beat'; break;
      case 'add-end': say(`Add a beat at ${a.label}. The Add a beat dialog opens from + after 08 in this item.`); break;
      case 'add-kind': { const cols = beatCols(), at = cols.findIndex(c => c.id === addAt), next = cols[at + 1]; dialog = ''; say(`Added ${a.kind} ${next ? `before ${nameOf(next)}` : 'at End of scene'}.`); break; }
      case 'open-move': openMove(); break;
      case 'open-place': dialog = 'place'; placeFor = 'screen'; movePick = screenPlace; moveFocus = screenPlace || 'Before 04 Narration'; break;
      case 'place-done':
        if (!movePick) { say(placeFor === 'move' ? 'Choose where to move 10 Eli\'s line.' : 'Choose where this beat goes.', true); break; }
        if (placeFor === 'move') say(`Moved 10 Eli's line to ${movePick}.`); else { screenPlace = movePick; say(`The new Show screen goes at ${movePick}.`); }
        dialog = ''; break;
      case 'add-screen': if (!screenPlace) { say('Choose a place for this beat first.', true); break; } say(`Added Show screen ${screenName} at ${screenPlace}.`); break;
      // B4
      case 'toggle-scenes': scenesOpen = !scenesOpen; confirming = ''; refused = ''; break;
      case 'scene-menu': confirming = a.scene!; refused = ''; if (scenes.find(s => s.id === a.scene)!.id === 'service') { confirming = ''; say('Switch to another scene before deleting this one.'); } break;
      case 'cancel-delete': confirming = ''; refused = ''; break;
      case 'delete-scene': refused = a.scene!; confirming = ''; if (variant === 'b') scenesOpen = false; break;
      case 'ref': scenesOpen = false; refused = variant === 'b' ? refused : ''; say(`Opening ${a.ref} is outside this study.`); break;
      // B14
      case 'transition': transition = a.value as 'dissolve' | 'fade'; break;
      // D1
      case 'show-moved': say('Showing the moved beat in Otherwise is outside this study. Your draft stays.'); break;
      case 'resolve': resolved = a.how === 'discard' ? 'Discarded your draft. The source is unchanged.' : a.how === 'override' ? 'Saved your draft to the moved beat in Otherwise. Other drafts stay unsaved.' : 'Added your draft as a new beat at the end of If has_ticket is true. Other drafts stay unsaved.'; say(resolved); break;
      default: return;
    }
    render();
  }
  function onKey(event: KeyboardEvent) {
    const tree = (event.target as HTMLElement).closest('.sce-tree2');
    if (tree && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      const rows = [...host.querySelectorAll<HTMLElement>('[data-place]')].map(n => n.dataset.place!), at = rows.indexOf(moveFocus);
      if (event.key === 'ArrowDown') moveFocus = rows[Math.min(rows.length - 1, at + 1)] ?? moveFocus;
      if (event.key === 'ArrowUp') moveFocus = rows[Math.max(0, at - 1)] ?? moveFocus;
      if (event.key === 'Enter') movePick = moveFocus;
      event.preventDefault(); render(); return;
    }
    const results = (event.target as HTMLElement).closest('.srf-results');
    if (results && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      const at = kinds.findIndex(k => k[0] === highlight);
      highlight = kinds[Math.max(0, Math.min(kinds.length - 1, at + (event.key === 'ArrowDown' ? 1 : -1)))]![0];
      event.preventDefault(); render(); host.querySelector<HTMLElement>('.srf-results [aria-selected=true]')?.focus(); return;
    }
    if (event.key !== 'Escape') return;
    if (dialog) { dialog = ''; event.preventDefault(); render(); return; }
    if (listOpen) { listOpen = ''; event.preventDefault(); render(); return; }
    if (scenesOpen) { scenesOpen = false; confirming = ''; if (variant === 'a') refused = ''; event.preventDefault(); render(); }
  }
  function onInput(event: Event) {
    const t = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (t.dataset.field === 'var-name') { newVar.name = t.value; newVar.error = ''; return; }
    if (t.dataset.field === 'draft') { draftText = t.value; return; }
    if (t.dataset.field === 'screen') { screenName = t.value; render(); return; }
    if (t.getAttribute('aria-label') === 'Starts as') newVar.start = t.value;
  }
  function onChange(event: Event) {
    const t = event.target as HTMLSelectElement;
    if (t.getAttribute('aria-label') === 'Fix item') { state = t.value as State; reset(); render(); }
    if (t.getAttribute('aria-label') === 'Fix variant') { variant = t.value as Variant; if (state === 'move-protected' || state === 'protected') { movePick = ''; } render(); }
  }
  let width = 0;
  const resize = new ResizeObserver(() => { if (host.clientWidth !== width) { width = host.clientWidth; render(); } });
  host.addEventListener('click', onClick); host.addEventListener('keydown', onKey); host.addEventListener('input', onInput); host.addEventListener('change', onChange);
  reset(); render(); width = host.clientWidth; resize.observe(host);
  return () => { resize.disconnect(); host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey); host.removeEventListener('input', onInput); host.removeEventListener('change', onChange); host.replaceChildren(); };
}
