import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import { mountStudy, variants, type Variant } from './study.ts';
import { action, element as el } from '../../page.ts';
const query = new URLSearchParams(location.search);
let variant: Variant = variants.find(v => v.id === query.get('variant'))?.id ?? document.body.dataset.variant as Variant ?? 'cue-sheet';
let state = query.get('state') ?? 'populated';
document.documentElement.dataset.theme = query.get('theme') === 'light' ? 'light' : 'dark';
const host = document.querySelector<HTMLElement>('#preview')!;
const toolbar = document.querySelector<HTMLElement>('#comparison')!;
toolbar.innerHTML = `<label>Layout <select aria-label="Prototype layout">${variants.map(v => `<option value="${v.id}">${v.title}</option>`).join('')}</select></label><label>Sample <select aria-label="Prototype sample"><option value="populated">The last service</option><option value="empty">Start a scene</option><option value="branching">Nested alternatives</option><option value="protected">Custom source</option></select></label><span>Prototype · edits stay here · switching layouts resets the sample</span>`;
const picker = toolbar.querySelector<HTMLSelectElement>('[aria-label="Prototype layout"]')!;
const samples = toolbar.querySelector<HTMLSelectElement>('[aria-label="Prototype sample"]')!;
let dispose: (() => void) | undefined;
function mount(next: Variant) {
  dispose?.(); variant = next; picker.value = variant; samples.value = state;
  host.dataset.ready = 'false'; host.dataset.variant = variant;
  dispose = mountStudy(host, { state, theme: document.documentElement.dataset.theme as 'dark' | 'light' }, variant, mount);
  host.dataset.ready = 'true';
  if (['http:', 'https:', 'file:'].includes(location.protocol)) {
    const url = new URL(location.href); url.searchParams.set('variant', variant); url.searchParams.set('state', state);
    history.replaceState(null, '', url);
  }
}
function request(next: Variant, nextState = state) {
  if (!Number(host.querySelector<HTMLElement>('.sr-content')?.dataset.edits)) { state = nextState; mount(next); return; }
  const target = next !== variant ? variants.find(v => v.id === next)!.title : samples.selectedOptions[0]!.textContent!;
  const dialog = el('dialog', 'lp-dialog sr-dialog'); dialog.ariaLabel = `Open ${target} and reset edits?`;
  const head = el('header', 'sr-dialog-head'); head.append(el('h2', '', dialog.ariaLabel));
  const footer = el('footer', 'sr-dialog-actions'); const cancel = action('Keep editing', () => dialog.close());
  footer.append(cancel, action(`Open ${target} and reset edits`, () => { dialog.close(); state = nextState; mount(next); }));
  dialog.append(head, el('p', '', 'Your edits in this sample will be discarded. The next preview starts with fresh fictional data.'), footer);
  dialog.onclose = () => { dialog.remove(); picker.value = variant; samples.value = state; (next !== variant ? picker : samples).focus(); };
  host.append(dialog); dialog.showModal(); cancel.focus();
}
picker.onchange = () => request(picker.value as Variant);
samples.onchange = () => request(variant, samples.value);
mount(variant);
