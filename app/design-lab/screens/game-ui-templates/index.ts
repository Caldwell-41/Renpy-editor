// PROTOTYPE for #222 (Choose the Loomlight templates), switchable via ?variant=. Throwaway and memory-only.
// "board" shows each candidate template with each of the seven themes and lists the values it sets.
// "sheet" shows the template row and its sheet as the approved layout places them (game-ui / blend-v2),
// with the order, the names, "Custom" and the question before a template replaces a layout of the author's own.
import type { LabContext } from '../../contracts.ts';
import { themes, type Theme } from '../game-ui-themes/themes.ts';
import '../game-ui-themes/fonts.css';
import { draw, type Sample } from './game.ts';
import { inUse, pageById, pages, show, stockOf, valuesOf, without, type Page, type PageId, type Template, type Values } from './templates.ts';
import './game.css';
import './style.css';

export type Variant = 'board' | 'sheet';
const themeById = (id: string) => themes.find(t => t.id === id)!;

export function mountTemplates(host: HTMLElement, context: LabContext, variant: Variant) {
  document.documentElement.dataset.theme = context.theme;
  const sample: Sample = { line: 'short', titleBg: 'menu', choices: '3' };
  let page: Page = pageById(pages.some(p => p.id === context.state) ? context.state : 'title');
  let large: { theme: string; template: string } | null = context.state === 'large' ? { theme: 'lantern', template: 'row' } : null;
  // Sheet variant: the layout values of each page, the theme of the project, and the open layers.
  const doc = Object.fromEntries(pages.map(p => [p.id, stockOf(p)])) as Record<PageId, Values>;
  let theme = 'lantern', open = variant === 'sheet', ask: Template | null = null, last = '';
  /** One hand edit, so the page's layout is equal to no template. */
  const nudge: Record<PageId, [key: string, value: number]> = { title: ['nav.gap', 9], say: ['box.height', 200], choice: ['list.gap', 16], history: ['entry.gap', 6] };
  const byHand = () => { const [key, value] = nudge[page.id]; doc[page.id] = { ...doc[page.id], [key]: value }; last = `${page.settings.find(x => x.key === key)!.label} set to ${value} by hand`; };
  if (context.state === 'custom' || context.state === 'confirm') byHand();
  if (context.state === 'confirm') ask = page.templates[1]!;

  const stage = (t: Theme, v: Values, attrs = '') => `<div class="gp-stage" ${attrs}>${draw(t, page.id, v, sample)}</div>`;
  const seg = (key: keyof Sample, label: string, options: [string, string][]) => `<span class="tp-seg" role="group" aria-label="${label}"><b>${label}</b>${options.map(([value, text]) => `<button type="button" data-sample="${key}" data-value="${value}" aria-pressed="${sample[key] === value}">${text}</button>`).join('')}</span>`;
  const samples = () => page.id === 'title' ? seg('titleBg', 'Background', [['menu', 'Menu background'], ['picture', "Author's picture"]])
    : page.id === 'say' ? seg('line', 'Line', [['short', 'Short'], ['long', 'Long']])
    : page.id === 'choice' ? seg('choices', 'Choices', [['3', '3'], ['5', '5']]) : '';
  const tabs = () => `<span class="tp-seg" role="group" aria-label="Settings page"><b>Page</b>${pages.map(p => `<button type="button" data-page="${p.id}" aria-pressed="${p.id === page.id}">${p.title}</button>`).join('')}</span>`;
  const proto = (extra: string) => `<div class="tp-proto"><strong>Prototype · #222</strong><span>Sample game at 1280 × 720. A browser drawing stands in for Ren'Py. Nothing is saved.</span>${tabs()}${samples()}${extra}</div>`;

  // ---- layout: board ----
  function board() {
    const cols = page.templates.length;
    const head = `<div class="tp-grid tp-head" style="--cols:${cols}"><span></span>${page.templates.map((t, i) => `<div><h3>${i + 1}. ${t.name}</h3><p>${t.what}</p>${t.doubt ? `<p class="tp-doubt">Note. ${t.doubt}</p>` : ''}</div>`).join('')}</div>`;
    const row = (t: Theme) => `<div class="tp-grid tp-row" style="--cols:${cols}"><h3>${t.name}</h3>${page.templates.map(x => `<button type="button" class="tp-thumb" data-large="${t.id}:${x.id}" aria-label="${x.name} with ${t.name}, show large">${stage(t, valuesOf(page, x))}</button>`).join('')}</div>`;
    const big = large ? (() => {
      const t = themeById(large.theme), x = page.templates.find(item => item.id === large!.template) ?? page.templates[0]!;
      return `<section class="tp-large" aria-label="Large view"><div class="tp-large-bar"><button type="button" data-step="-1" aria-label="Previous template">‹</button><h3>${x.name}</h3><button type="button" data-step="1" aria-label="Next template">›</button>
        <span class="tp-seg">${themes.map(item => `<button type="button" data-large="${item.id}:${x.id}" aria-pressed="${item.id === t.id}">${item.name}</button>`).join('')}</span>
        <span class="tp-quiet">← → change the template</span><button type="button" data-close>Close</button></div>${stage(t, valuesOf(page, x), 'data-big')}</section>`;
    })() : '';
    const groups = [...new Set(page.settings.map(x => x.group))];
    const values = `<table class="tp-values"><thead><tr><th>Setting</th><th>Writes</th>${page.templates.map(t => `<th>${t.name}</th>`).join('')}</tr></thead><tbody>
      ${groups.map(group => `<tr class="tp-group"><th colspan="${cols + 2}">${group}</th></tr>${page.settings.filter(x => x.group === group).map(x => `<tr><th>${x.label}${x.isNew ? ' <em>new setting</em>' : ''}</th><td><code>${x.writes}</code></td>${x.free ? `<td class="tp-quiet" colspan="${cols}">No template sets it. A template leaves the author's value.</td>` : page.templates.map(t => x.key in t.values && t.values[x.key] !== x.stock ? `<td class="tp-set">${show(t.values[x.key]!)}</td>` : `<td class="tp-quiet">${show(x.stock)}</td>`).join('')}</tr>`).join('')}`).join('')}</tbody></table>`;
    const fresh = pages.flatMap(p => p.settings.filter(x => x.isNew).map(x => `<tr><th>${p.title}</th><td>${x.group} · ${x.label}</td><td><code>${x.writes}</code></td><td>${show(x.stock)}</td><td>${p.templates.filter(t => x.key in t.values).map(t => t.name).join(', ')}</td></tr>`)).join('');
    return `${proto('')}<div class="tp-scroll">${big}
      <section><div class="tp-h"><h2>${page.title} · ${cols} templates</h2><span class="tp-quiet">One row for each theme. Select a picture to show it large.${page.note ? ` ${page.note}` : ''}</span></div>${head}${themes.map(row).join('')}</section>
      <section id="tp-values"><div class="tp-h"><h2>Values</h2><span class="tp-quiet">Each layout setting of the ${page.title} page. A bright value differs from the stock value.</span></div>${values}</section>
      <section><div class="tp-h"><h2>Settings that the templates need and the pages do not have</h2></div><table class="tp-values"><thead><tr><th>Page</th><th>Setting</th><th>Writes</th><th>Stock value</th><th>Templates that set it</th></tr></thead><tbody>${fresh}</tbody></table></section>
      <section><div class="tp-h"><h2>Pages with no template</h2></div><table class="tp-values"><tbody>${without.map(([name, why]) => `<tr><th>${name}</th><td>${why}</td></tr>`).join('')}</tbody></table></section></div>`;
  }

  // ---- layout: the template row and its sheet ----
  function sheet() {
    const t = themeById(theme), v = doc[page.id], now = inUse(page, v);
    const tiles = page.templates.map(x => `<button type="button" class="tp-tile" data-template="${x.id}" aria-pressed="${x === now}">${stage(t, valuesOf(page, x, v))}<span>${x.name}</span></button>`).join('');
    const pop = open ? `<div class="tp-pop" role="dialog" aria-label="Template"><h3>Template</h3><p class="tp-quiet">A template replaces this screen's layout settings.${now ? '' : ' The layout of this screen is your own.'}</p><div class="tp-tiles">${tiles}</div></div>` : '';
    const question = ask ? `<div class="tp-veil" data-ask="no"></div><div class="tp-ask" role="alertdialog" aria-label="Apply the template"><p>This screen's layout is not one of the templates. This template replaces it. Apply it?</p><div><button type="button" data-ask="no">Cancel</button><button type="button" class="tp-primary" data-ask="yes">Apply "${ask.name}"</button></div></div>` : '';
    const groups = [...new Set(page.settings.map(x => x.group))];
    const list = groups.map(group => `<section class="tp-set-group"><h3>${group}</h3>${page.settings.filter(x => x.group === group).map(x => `<div class="tp-field"><span>${x.label}</span><span>${show(v[x.key]!)}</span></div>`).join('')}</section>`).join('');
    const extra = `<label class="tp-seg"><b>Theme</b><select data-theme-pick>${themes.map(x => `<option value="${x.id}" ${x.id === theme ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <button type="button" data-hand>Change one setting by hand</button>`;
    return `${proto(extra)}<div class="tp-work"><main class="tp-canvas">${stage(t, v)}<p class="tp-quiet">${last || 'No change yet.'}</p></main>
      <aside class="tp-panel" aria-label="Settings"><div class="tp-panel-head"><h2>${page.title}</h2></div>
        <div class="tp-template"><button type="button" class="tp-template-button" data-open aria-expanded="${open}"><span class="tp-template-thumb">${stage(t, v)}</span><span class="tp-template-text"><span class="tp-quiet">Template</span><span>${now ? now.name : 'Custom'}</span></span><span aria-hidden="true">▾</span></button>${pop}</div>
        <div class="tp-settings">${list}</div></aside>${question}</div>`;
  }

  function render() {
    const keep = host.querySelector<HTMLElement>('.tp-scroll')?.scrollTop ?? 0;
    host.innerHTML = `<div class="tp-shell" data-variant="${variant}">${variant === 'board' ? board() : sheet()}</div>`;
    const scroll = host.querySelector<HTMLElement>('.tp-scroll');
    if (scroll) scroll.scrollTop = keep;
    host.querySelector<HTMLElement>('.tp-ask .tp-primary')?.focus();
  }
  function apply(x: Template) { doc[page.id] = valuesOf(page, x, doc[page.id]); last = `${page.title} template "${x.name}" · one change, one Undo step`; open = false; ask = null; }
  function stepLarge(by: number) {
    if (!large) return;
    const i = page.templates.findIndex(x => x.id === large!.template);
    large = { ...large, template: page.templates[(i + by + page.templates.length) % page.templates.length]!.id };
  }
  function onClick(event: Event) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button, .tp-veil');
    if (!target) return;
    const d = target.dataset;
    if (d.sample) (sample as Record<string, string>)[d.sample] = d.value!;
    else if (d.page) { page = pageById(d.page); if (large) large = { ...large, template: page.templates[1]!.id }; ask = null; last = ''; }
    else if (d.large) { const [themeId, template] = d.large.split(':') as [string, string]; const first = !large; large = { theme: themeId, template }; render(); if (first) host.querySelector('.tp-scroll')?.scrollTo({ top: 0 }); return; }
    else if ('close' in d) large = null;
    else if (d.step) stepLarge(Number(d.step));
    else if ('open' in d) open = !open;
    else if ('hand' in d) byHand();
    // A layout equal to a template changes with no question. A layout of the author's own asks first (#204, point 13).
    else if (d.template) { const x = page.templates.find(item => item.id === d.template)!; if (inUse(page, doc[page.id])) apply(x); else ask = x; }
    else if (d.ask) { if (d.ask === 'yes' && ask) apply(ask); else ask = null; }
    else return;
    render();
  }
  function onChange(event: Event) {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLSelectElement && 'themePick' in target.dataset) { theme = target.value; render(); }
  }
  function onKey(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'Escape' && (ask || open || large)) { if (ask) ask = null; else if (large) large = null; else open = false; render(); return; }
    if (large && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { stepLarge(event.key === 'ArrowRight' ? 1 : -1); event.preventDefault(); render(); }
  }
  render();
  host.addEventListener('click', onClick);
  host.addEventListener('change', onChange);
  window.addEventListener('keydown', onKey);
  return () => { host.removeEventListener('click', onClick); host.removeEventListener('change', onChange); window.removeEventListener('keydown', onKey); };
}
