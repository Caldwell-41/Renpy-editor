// PROTOTYPE for #215 (Choose the Loomlight themes and their fonts), switchable via ?variant=.
// Throwaway and memory-only. "board" compares the candidate themes and lists their values and fonts.
// The three "create-*" layouts place the theme choice in project creation in three different ways.
import type { LabContext } from '../../contracts.ts';
import { draw, screenIds, screenNames, type Sample, type ScreenId } from './game.ts';
import { color, dejavu, font, fontById, fontFacts, hoverColor, menuColor, themes, type Box, type Fill, type Paint, type Theme } from './themes.ts';
import './fonts.css';
import './game.css';
import './style.css';

export type Variant = 'board' | 'create-step' | 'create-config' | 'create-review';
const variantNames: Record<Variant, string> = { board: 'Theme board', 'create-step': 'Creation A · Own step', 'create-config': 'Creation B · With the window size', 'create-review': 'Creation C · On the review step' };

const byId = (id: string) => themes.find(t => t.id === id)!;

export function mountThemes(host: HTMLElement, context: LabContext, variant: Variant) {
  document.documentElement.dataset.theme = context.theme;
  const sample: Sample = { state: context.state === 'hover' ? 'hover' : 'idle', line: 'short', titleBg: 'menu', scene: 'night', gameTitle: 'The Last Tram' };
  let large: { theme: string; screen: ScreenId } | null = null;
  let chosen = 'renpy', sheet = false, step = variant === 'create-config' ? 3 : 4, resolution = '1920x1080', custom = false;

  // ---- shared pieces ----
  const stage = (t: Theme, id: ScreenId, attrs = '') => `<div class="gt-stage" ${attrs}>${draw(t, id, sample)}</div>`;
  const seg = (key: keyof Sample, label: string, options: [string, string][]) => `<span class="tm-seg" role="group" aria-label="${label}"><b>${label}</b>${options.map(([v, l]) => `<button type="button" data-sample="${key}" data-value="${v}" aria-pressed="${sample[key] === v}">${l}</button>`).join('')}</span>`;
  const controls = () => `<div class="tm-proto"><strong>Prototype · #215</strong><span>Sample game, stock layout at 1280 × 720. A browser drawing stands in for Ren'Py. Nothing is saved.</span>
    ${seg('state', 'First button', [['idle', 'Idle'], ['hover', 'Hover'], ['selected', 'Selected'], ['disabled', 'Disabled']])}
    ${seg('line', 'Line', [['short', 'Short'], ['long', 'Long']])}
    ${seg('scene', 'Scene', [['night', 'Night'], ['dawn', 'Dawn']])}
    ${seg('titleBg', 'Title background', [['menu', 'Menu background'], ['picture', "Author's picture"]])}</div>`;
  const fontsOf = (t: Theme) => [...new Set([t.text.dialogue.font, t.text.interface.font, t.text.name.font, font(t, t.text.heading.font).id, font(t, t.text.title.font).id])].map(id => fontById[id]!);
  const fontNames = (t: Theme) => fontsOf(t).map(f => `<span style="font-family:${f.css}">${f.name}</span>`).join(' · ');
  const copied = (t: Theme) => fontsOf(t).filter(f => f.files.length);
  const swatch = (c: string) => `<i class="tm-sw" style="background:${c}"></i>`;

  // ---- value formatting for the table ----
  const followName: Record<string, string> = { '=accent': 'Accent', '=panel': 'Panel', '=interface': 'Interface', '=menu': 'Menu background' };
  const muted = (s: string) => `<span class="tm-follows">${s}</span>`;
  function colorCell(t: Theme, v: string, hover = false) {
    if (v.startsWith('=')) return `${swatch(hover ? hoverColor(t, v) : color(t, v))}${muted(hover && v === '=accent' ? 'Accent, tint .6' : followName[v]!)}`;
    return `${swatch(v)}<code>${v}</code>`;
  }
  const paintText = (p: Paint) => `${p.c.startsWith('=') ? followName[p.c] : `<code>${p.c}</code>`} ${p.a} %`;
  const paintCell = (t: Theme, p: Paint) => `${swatch(color(t, p.c))}${paintText(p)}`;
  function fillCell(t: Theme, f: Fill) {
    if (f === 'stock') return muted('Stock picture');
    if (f === 'none') return muted('None');
    if ('from' in f) return `${paintCell(t, f.from)} → ${paintCell(t, f.to)}, ${f.dir === 'down' ? 'top to bottom' : 'left to right'}`;
    return paintCell(t, f);
  }
  const corners = (n: number) => n >= 99 ? 'Pill' : String(n);
  const border = (t: Theme, b: Box['border']) => b ? `${b.w} · ${paintCell(t, b.c)}` : muted('None');
  const shadow = (t: Theme, s: Box['shadow']) => !s ? muted('None') : `${s.x || s.y ? '' : 'Glow · '}${paintCell(t, s.c)} · blur ${s.blur}${s.x || s.y ? ` · ${s.x}, ${s.y}` : ''}`;
  const padCell = (pad: Box['pad']) => pad === 'stock' ? muted('Stock') : pad.join(' ');
  const boxSummary = (t: Theme, b: Box | 'stock' | 'none') => {
    if (b === 'stock') return muted('Stock picture');
    if (b === 'none') return muted('No box');
    return `Fill ${fillCell(t, b.fill)}<br>Corners ${corners(b.corners)} · Border ${border(t, b.border)}<br>Padding ${padCell(b.pad)} · Shadow ${shadow(t, b.shadow)}`;
  };
  const hoverSummary = (t: Theme, b: Box | 'stock' | 'none', over?: Partial<Box>) => !over || b === 'stock' || b === 'none' ? muted(b === 'stock' ? 'Stock picture' : 'Follows Idle') : Object.entries(over).map(([k, v]) => k === 'fill' ? `Fill ${fillCell(t, v as Fill)}` : k === 'border' ? `Border ${border(t, v as Box['border'])}` : k === 'shadow' ? `Shadow ${shadow(t, v as Box['shadow'])}` : `${k} ${String(v)}`).join('<br>');
  function fontCell(t: Theme, v: string) {
    if (v.startsWith('=')) return `${muted('Interface')} <span style="font-family:${font(t, v).css}">${font(t, v).name}</span>`;
    const f = fontById[v]!;
    return `<span style="font-family:${f.css}">${f.name}</span>`;
  }
  const textType = (t: Theme, tt: { font: string; size: number; color?: string }) => `${fontCell(t, tt.font)} · ${tt.size}${tt.color ? ` · ${colorCell(t, tt.color)}` : ''}`;
  type Row = [label: string, cell: (t: Theme) => string];
  const table: [group: string, rows: Row[]][] = [
    ['Colors', [['Accent', t => colorCell(t, t.accent)], ['Panel', t => colorCell(t, t.panel)], ['Menu background', t => t.menu === '=accent' ? `${swatch(menuColor(t))}${muted('Accent, saturation 25 %, value 25 %')}` : colorCell(t, t.menu)]]],
    ['Text types', [['Dialogue', t => textType(t, t.text.dialogue)], ['Interface', t => textType(t, t.text.interface)], ['Speaker name', t => `${textType(t, t.text.name)} ${muted('· color per character')}`], ['Heading', t => textType(t, t.text.heading)], ['Game title', t => textType(t, t.text.title)], ['Version', t => colorCell(t, t.text.version)]]],
    ['Button look', [['Text · Idle', t => colorCell(t, t.button.text.idle)], ['Text · Hover', t => colorCell(t, t.button.text.hover, true)], ['Text · Selected', t => colorCell(t, t.button.text.selected)], ['Text · Disabled', t => colorCell(t, t.button.text.disabled)], ['Box · Idle', t => boxSummary(t, t.button.box)], ['Box · Hover', t => hoverSummary(t, t.button.box, t.button.hoverBox)], ['Padding', t => t.button.box === 'none' ? `4 4 4 4 ${muted('stock, gui.button_borders')}` : padCell(t.button.box.pad)], ['Hover animation', t => t.button.hover === 'None' ? muted('None') : t.button.hover]]],
    ['Box look', [['Fill', t => fillCell(t, t.box.fill)], ['Corners', t => t.box.fill === 'stock' ? muted('Stock picture') : corners(t.box.corners)], ['Border', t => t.box.fill === 'stock' ? muted('Stock picture') : border(t, t.box.border)], ['Padding', t => padCell(t.box.pad)], ['Shadow', t => t.box.fill === 'stock' ? muted('Stock picture') : shadow(t, t.box.shadow)]]],
    ['Bar look', [['Track', t => t.id === 'renpy' ? muted('Stock picture') : colorCell(t, t.bar.track)], ['Filled part', t => t.id === 'renpy' ? muted('None. The stock bar has no filled part.') : colorCell(t, t.bar.filled)], ['Thumb', t => t.id === 'renpy' ? muted('Stock picture') : colorCell(t, t.bar.thumb)], ['Corners', t => t.id === 'renpy' ? muted('Stock picture') : corners(t.bar.corners)]]],
    ['Motion', [['Game menu', t => t.motion.gameMenu], ['Between menu screens', t => t.motion.betweenMenus], ['Dialogue box', t => t.motion.dialogueBox], ['Confirm prompt', t => t.motion.confirm]]],
    ['Stock look groups with own values', [
      ['Dialogue box', t => boxSummary(t, t.groups.say)], ['Name box', t => boxSummary(t, t.groups.namebox)],
      ['Choice buttons · Text', t => `${colorCell(t, t.groups.choice.text.idle)} / ${colorCell(t, t.groups.choice.text.hover)}`],
      ['Choice buttons · Box', t => boxSummary(t, t.groups.choice.box)], ['Choice buttons · Box · Hover', t => hoverSummary(t, t.groups.choice.box, t.groups.choice.hoverBox)],
      ['Quick buttons · Text', t => `${colorCell(t, t.groups.quick.idle)} / ${colorCell(t, t.groups.quick.hover, true)}`],
      ['Save slots · Box', t => boxSummary(t, t.groups.slot)], ['Save slots · Text', t => colorCell(t, t.groups.slotText)], ['Option buttons · Mark', t => colorCell(t, t.groups.mark)], ['Option buttons · Padding', () => `18 4 4 4 ${muted('stock')}`], ['Page buttons · Padding', () => `10 4 10 4 ${muted('stock')}`],
      ['Menu panel', t => boxSummary(t, t.groups.menuPanel)], ['Menu panel · Show the accent line', t => t.groups.accentLine ? 'On' : 'Off'],
      ['Screen frame', t => boxSummary(t, t.groups.screenFrame)], ['Confirm prompt · Padding', t => t.box.fill === 'stock' ? muted('Stock picture, 40 40 40 40') : `40 40 40 40 ${muted('stock')}`],
      ['Notices, Skip indicator', t => t.box.fill === 'stock' ? muted('Stock picture') : muted('Follow the Box look')]]],
    ['Fonts copied into game/fonts/', [['Files', t => copied(t).length ? copied(t).map(f => `${f.name} (${f.files.length})`).join('<br>') : muted("None. DejaVu Sans is part of Ren'Py.")], ['Size', t => { const kb = copied(t).reduce((n, f) => n + f.kb, 0); return kb ? `${(kb / 1024).toFixed(1)} MB` : '0'; }]]],
  ];

  // ---- layout: theme board ----
  function board() {
    const head = `<div class="tm-board-head"><span></span>${screenIds.map(id => `<span>${screenNames[id]}</span>`).join('')}</div>`;
    const row = (t: Theme) => `<div class="tm-row">
      <div class="tm-who"><h3>${t.name}</h3><p>${t.suits}</p><p class="tm-fonts">${fontNames(t)}</p>
        <p class="tm-swatches">${swatch(t.accent)}Accent ${swatch(t.panel)}Panel ${swatch(menuColor(t))}Menu</p>
        <p class="tm-quiet">Hover ${t.button.hover} · ${(['gameMenu', 'betweenMenus', 'dialogueBox', 'confirm'] as const).filter(k => t.motion[k] === 'Dissolve').length} of 4 transitions Dissolve</p></div>
      ${screenIds.map(id => `<button type="button" class="tm-thumb" data-large="${t.id}:${id}" aria-label="${t.name}, ${screenNames[id]}, show large">${stage(t, id)}</button>`).join('')}</div>`;
    const values = `<table class="tm-values"><thead><tr><th>Setting</th>${themes.map(t => `<th>${t.name}</th>`).join('')}</tr></thead><tbody>${table.map(([group, rows]) => `<tr class="tm-group"><th colspan="${themes.length + 1}">${group}</th></tr>${rows.map(([label, cell]) => `<tr><th>${label}</th>${themes.map(t => `<td>${cell(t)}</td>`).join('')}</tr>`).join('')}`).join('')}</tbody></table>`;
    const total = fontFacts.reduce((n, f) => n + f.kb, 0);
    const fonts = `<table class="tm-fontlist"><thead><tr><th>Family</th><th>Kind</th><th>Sample</th><th>Files Loomlight ships</th><th>Size</th><th>Scripts</th><th>Copyright notice</th><th>Reserved name</th><th>Themes</th></tr></thead><tbody>
      ${[dejavu, ...fontFacts].map(f => `<tr><th style="font-family:${f.css}">${f.name}</th><td>${f.kind}</td><td style="font-family:${f.css};font-size:16px">The last tram doesn't stop here. ${f.italic ? '<i>Not tonight.</i>' : muted('No italic file')}</td><td>${f.files.length ? f.files.map(n => `<code>${n}</code>`).join('<br>') + '<br><code>OFL.txt</code>' : muted('None, part of Ren\'Py')}</td><td>${f.kb ? `${f.kb} KB` : '–'}</td><td>${f.scripts}</td><td>${f.copyright}</td><td>${f.rfn ?? muted('None')}</td><td>${themes.filter(t => fontsOf(t).includes(f)).map(t => t.name).join(', ') || muted('Font menu only')}</td></tr>`).join('')}
      <tr class="tm-total"><th colspan="4">11 families · each file unchanged · SIL Open Font License 1.1</th><td>${(total / 1024).toFixed(1)} MB</td><td colspan="4"></td></tr></tbody></table>`;
    const big = large ? (() => {
      const t = byId(large.theme), i = themes.indexOf(t);
      return `<section class="tm-large" aria-label="Large view">
        <div class="tm-large-bar"><button type="button" data-step-theme="-1" aria-label="Previous theme">‹</button><h3>${t.name}</h3><button type="button" data-step-theme="1" aria-label="Next theme">›</button>
          <span class="tm-tabs">${screenIds.map(id => `<button type="button" data-large="${t.id}:${id}" aria-pressed="${id === large!.screen}">${screenNames[id]}</button>`).join('')}</span>
          <span class="tm-quiet">${i + 1} of ${themes.length} · ← → change the theme</span><button type="button" data-close aria-label="Close the large view">Close</button></div>
        ${stage(t, large.screen, 'data-big')}</section>`;
    })() : '';
    return `${controls()}<div class="tm-scroll">${big}<section><div class="tm-h"><h2>Themes</h2><span class="tm-quiet">${themes.length} candidates. Select a picture to show it large.</span></div>${head}${themes.map(row).join('')}</section>
      <section id="tm-values"><div class="tm-h"><h2>Values</h2><span class="tm-quiet">Every setting of the Game-wide look, and the stock look groups that a theme gives an own value. Grey text follows another setting.</span></div>${values}</section>
      <section id="tm-fonts"><div class="tm-h"><h2>Fonts</h2><span class="tm-quiet">The Font menu offers each of these. License files read on 2026-11-23 from github.com/google/fonts.</span></div>${fonts}</section></div>`;
  }

  // ---- layouts: project creation ----
  const wizardHead = (n: number, of: number, title: string, copy: string) => `<p class="tm-eyebrow">New Project · ${n} of ${of}</p><h1>${title}</h1><p class="tm-copy">${copy}</p>`;
  const actions = (next: string) => `<div class="tm-actions"><button type="button">Back</button><button type="button" class="tm-primary">${next}</button></div>`;
  const fontLine = (t: Theme) => copied(t).length ? `Copies ${copied(t).map(f => f.name).join(' and ')} into <code>game/fonts/</code>, with ${copied(t).length === 1 ? 'its license file' : 'their license files'}.` : "Uses DejaVu Sans, which is part of Ren'Py.";
  function createStep() {
    const t = byId(chosen);
    const list = themes.map(x => `<label class="tm-pick"><input type="radio" name="theme" value="${x.id}" ${x.id === chosen ? 'checked' : ''}><span><b>${x.name}</b>${x.id === 'renpy' ? ' <span class="tm-quiet">· Default</span>' : ''}<small>${x.suits}</small></span></label>`).join('');
    return `${controls()}<div class="tm-wizard tm-wizard-wide">${wizardHead(4, 5, 'Look', 'Choose the look of the menus and the dialogue box. You can change it later on the Game-wide look page.')}
      <div class="tm-step-body"><div class="tm-pick-list" role="radiogroup" aria-label="Theme">${list}</div>
        <div class="tm-step-preview">${stage(t, 'title')}${stage(t, 'say')}<p class="tm-quiet">${fontLine(t)}</p></div></div>${actions('Continue')}</div>`;
  }
  /** Creation B, drawn with the production wizard's markup and classes (src/main.ts L372-470), so production CSS styles it. */
  function createConfig() {
    const t = byId(chosen);
    const [w, h] = resolution.split('x').map(Number) as [number, number];
    let a = w, b = h; while (b) { const r = a % b; a = b; b = r; }
    const scale = Math.min(100 / w, 64 / h);
    const rail = ['Project details', "Ren'Py SDK", 'Game configuration', 'Review & Create'].map((label, i) => `<span${i === 2 ? ' aria-current="step"' : ''}>${i + 1}. ${label}</span>`).join('');
    const presets = [['1920x1080', 'Full HD — 1920 × 1080'], ['1280x720', 'HD — 1280 × 720'], ['2560x1440', 'QHD — 2560 × 1440'], ['0x0', 'Custom']];
    const tiles = themes.map(x => `<label class="tm-tile${x.id === chosen ? ' is-on' : ''}"><input type="radio" name="theme" value="${x.id}" ${x.id === chosen ? 'checked' : ''}>${stage(x, 'title')}<span>${x.name}</span></label>`).join('');
    return `${controls()}<div class="tm-prod"><section class="wizard-layout"><nav class="step-rail" aria-label="New Project steps">${rail}</nav><div class="wizard-panel">
      <p class="eyebrow">New Project · 3 of 4</p><h1>Game configuration</h1><p class="panel-copy">Choose the size of your game window and the look of its menus. You can use a preset or enter custom dimensions.</p>
      <label class="field"><span>Resolution preset</span><select class="resolution-picker" data-resolution>${presets.map(([v, l]) => `<option value="${v}" ${(custom ? v === '0x0' : v === resolution) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${custom ? `<div class="dimension-row"><label class="field"><span>Width</span><input type="number" value="${w}"></label><label class="field"><span>Height</span><input type="number" value="${h}"></label></div>` : ''}
      <div class="resolution-preview"><div class="resolution-screen" aria-hidden="true" style="width:${w * scale}px;height:${h * scale}px"></div><div><div aria-live="polite">${w} × ${h} · ${w / a}:${h / a}</div><div>Game resolution, not editor size.</div></div></div>
      <div class="field"><span>Look</span><div class="tm-tiles" role="radiogroup" aria-label="Look">${tiles}</div></div>
      <div class="tm-config-preview">${stage(t, 'say')}<div><b>${t.name}</b><p>${t.suits}</p><p>${fontLine(t)}</p><p>You can change the look later on the Game-wide look page.</p></div></div>
      <div class="wizard-actions"><button type="button" class="button">Back</button><button type="button" class="button primary">Continue</button></div>
    </div></section></div>`;
  }
  function createReview() {
    const t = byId(chosen);
    const rows: [string, string][] = [['Title', 'The Last Tram'], ['Final path', '~/Games/the-last-tram'], ['SDK', "Ren'Py 8.5.3"], ['Resolution', '1920 × 1080']];
    const sheetHtml = sheet ? `<div class="tm-sheet" role="dialog" aria-label="Choose a look"><div class="tm-sheet-head"><h2>Look</h2><span class="tm-quiet">A choice closes this sheet.</span><button type="button" data-sheet="close">Close</button></div>
      <div class="tm-sheet-grid">${themes.map(x => `<button type="button" class="tm-sheet-pick${x.id === chosen ? ' is-on' : ''}" data-choose="${x.id}">${stage(x, 'title')}${stage(x, 'say')}<b>${x.name}</b><small>${x.suits}</small></button>`).join('')}</div></div>` : '';
    return `${controls()}<div class="tm-wizard">${wizardHead(4, 4, 'Review & Create', 'Check your project details. Loomlight will create and validate the game, then open it.')}
      <div class="tm-review"><dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}<div><dt>Look</dt><dd>${t.name} <button type="button" data-sheet="open">Change…</button><small class="tm-quiet">${fontLine(t)}</small></dd></div><div><dt>Local Git</dt><dd>Not enabled</dd></div></dl>
        <div class="tm-review-preview">${stage(t, 'title')}</div></div>${actions('Create Project')}${sheetHtml}</div>`;
  }

  function render() {
    const body = variant === 'board' ? board() : variant === 'create-step' ? createStep() : variant === 'create-config' ? createConfig() : createReview();
    // Keep the scroll position of the wizard panel and the board, so a new selection does not move the view.
    const keep = [...host.querySelectorAll<HTMLElement>('.wizard-panel, .tm-scroll')].map(el => el.scrollTop);
    host.innerHTML = `<div class="tm-shell" data-variant="${variant}" data-step="${step}">${body}</div>`;
    host.querySelectorAll<HTMLElement>('.wizard-panel, .tm-scroll').forEach((el, i) => { el.scrollTop = keep[i] ?? 0; });
  }
  function onClick(event: Event) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button, input');
    if (!target) return;
    const d = target.dataset;
    if (d.sample) { (sample as Record<string, string>)[d.sample] = d.value!; render(); return; }
    if (d.large) { const [theme, screen] = d.large.split(':') as [string, ScreenId]; large = { theme, screen }; render(); host.querySelector('.tm-scroll')?.scrollTo({ top: 0 }); return; }
    if ('close' in d) { large = null; render(); return; }
    if (d.stepTheme && large) { const i = themes.findIndex(t => t.id === large!.theme); large = { ...large, theme: themes[(i + Number(d.stepTheme) + themes.length) % themes.length]!.id }; render(); return; }
    if (d.sheet) { sheet = d.sheet === 'open'; render(); return; }
    if (d.choose) { chosen = d.choose; sheet = false; render(); return; }
    if (target instanceof HTMLInputElement && target.name === 'theme') { chosen = target.value; render(); host.querySelector<HTMLInputElement>(`input[value="${chosen}"]`)?.focus({ preventScroll: true }); }
  }
  function onChange(event: Event) {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLSelectElement && 'resolution' in target.dataset) { custom = target.value === '0x0'; if (!custom) resolution = target.value; render(); }
  }
  function onKey(event: KeyboardEvent) {
    if (variant !== 'board' || !large || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    const i = themes.findIndex(t => t.id === large!.theme);
    large = { ...large, theme: themes[(i + (event.key === 'ArrowRight' ? 1 : -1) + themes.length) % themes.length]!.id };
    event.preventDefault(); render();
  }
  if (context.state === 'large' && variant === 'board') large = { theme: 'lantern', screen: 'title' };
  if (context.state === 'sheet' && variant === 'create-review') sheet = true;
  render();
  if (variant === 'board' && (context.state === 'values' || context.state === 'fonts')) requestAnimationFrame(() => host.querySelector(`#tm-${context.state}`)?.scrollIntoView());
  host.addEventListener('click', onClick);
  host.addEventListener('change', onChange);
  window.addEventListener('keydown', onKey);
  return () => { host.removeEventListener('click', onClick); host.removeEventListener('change', onChange); window.removeEventListener('keydown', onKey); };
}
export { variantNames };
