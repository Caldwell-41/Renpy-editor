import type { LabContext } from '../../contracts.ts';
import { element as el, action, labelled, labPage } from '../../page.ts';
import { icon } from '../../../src/icons.ts';
import { artwork, assets, kinds, kindName, fileName, pathName, sampleChoices, type SampleAsset, type AssetKind } from './fixture.ts';
import './styles.css';

interface Staged extends SampleAsset { error?: string }
const tokenValid = (value: string) => /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(value);
const small = (text: string) => el('span', 'aa-small muted', text);
const image = (asset: SampleAsset, className = '') => { const img = el('img', className); img.src = artwork(asset); img.alt = `Fictional preview of ${asset.name}`; return img; };
function select(options: [string, string][], value: string) {
  const input = el('select'); for (const [id, title] of options) { const option = el('option', '', title); option.value = id; input.append(option); } input.value = value; return input;
}

export function mountAssets(host: HTMLElement, context: LabContext, variant: 'shelves' | 'desk') {
  let library = assets(context.state), selected = library[0]?.id, inspectorOpen = variant === 'desk' || innerWidth >= 760;
  let query = '', filter = 'all', listView = variant === 'desk', sequence = 0;
  let staged: Staged[] = [], importedCount = 0, failNextImport = context.state === 'error', importing = false;
  let dialog: HTMLDialogElement | undefined, chooser = false;
  const page = labPage(host, context, { screen: 'assets', title: 'Assets', subtitle: variant === 'shelves' ? 'Library shelves' : 'Preview desk', dirty: () => staged.length > 0 });
  page.shell.classList.add('aa-shell');
  const root = el('div', `aa-workspace aa-${variant}`);
  const importButton = action('Import assets', () => openImport(), true); importButton.prepend(icon('plus'));
  const reopen = action('Show preview', () => { inspectorOpen = true; renderInspector(); }); reopen.hidden = true;
  const maintenance = action('Asset maintenance', () => showMaintenance());
  maintenance.classList.add('aa-secondary'); page.tools.append(reopen, maintenance, importButton);

  const toolbar = el('div', 'aa-toolbar');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Find an asset…'; search.ariaLabel = 'Search assets';
  search.oninput = () => { query = search.value; renderItems(); };
  const view = action(listView ? 'Grid view' : 'List view', () => { listView = !listView; view.textContent = listView ? 'Grid view' : 'List view'; view.ariaPressed = String(listView); renderItems(); }); view.ariaPressed = String(listView);
  const count = el('span', 'aa-result-count muted'); count.role = 'status';
  toolbar.append(search, view, count);
  const filters = el('div', 'aa-filters'); filters.ariaLabel = 'Asset types';
  for (const [id, title] of [['all', 'All assets'], ...kinds]) {
    const button = action(title!, () => { filter = id!; syncFilters(); renderItems(); }); button.dataset.filter = id; filters.append(button);
  }
  const body = el('div', 'aa-body');
  const browser = el('section', 'aa-browser'); browser.ariaLabel = 'Asset library';
  const items = el('div', 'aa-items'); const summary = el('div', 'aa-library-summary');
  const drop = action('Add a sample batch', () => openImport()); drop.classList.add('aa-add-sample'); drop.prepend(icon('plus'));
  summary.append(small('Images & sound for The Last Tram'), drop); browser.append(summary, items);
  const inspector = el('aside', 'aa-inspector'); inspector.ariaLabel = 'Asset preview';
  body.append(browser, inspector); root.append(toolbar, filters, body); page.content.append(root);

  function syncFilters() {
    for (const b of filters.querySelectorAll<HTMLButtonElement>('button')) {
      b.ariaPressed = String(b.dataset.filter === filter);
      const id = b.dataset.filter!; const n = id === 'all' ? library.length : library.filter(a => a.kind === id).length;
      b.textContent = `${id === 'all' ? 'All assets' : kinds.find(k => k[0] === id)?.[1]} ${n}`;
    }
  }
  function renderItems() {
    const scroll = browser.scrollTop;
    items.replaceChildren(); items.classList.toggle('aa-list', listView);
    const matches = library.filter(a => (filter === 'all' || a.kind === filter) && `${a.name} ${a.token} ${a.character ?? ''}`.toLowerCase().includes(query.toLowerCase()));
    count.textContent = `${matches.length} ${matches.length === 1 ? 'asset' : 'assets'}`;
    if (!matches.length) {
      const empty = el('div', 'aa-empty'); empty.prepend(icon('assets'));
      empty.append(el('h2', '', library.length ? 'No matching assets' : 'Give this story a setting'), el('p', 'muted', library.length ? 'Try another name or asset type.' : 'Add a background, a character image or sound. Review each sample before it joins the library.'));
      empty.append(action(library.length ? 'Clear search & filters' : 'Choose sample assets', () => { if (library.length) { search.value = query = ''; filter = 'all'; syncFilters(); renderItems(); } else openImport(); }, true)); items.append(empty);
    }
    for (const asset of matches) {
      const card = action('', () => {
        selected = asset.id; inspectorOpen = true;
        for (const b of items.querySelectorAll<HTMLButtonElement>('[data-asset-id]')) b.ariaPressed = String(b.dataset.assetId === selected);
        renderInspector();
        if (variant === 'shelves' && innerWidth < 760) inspector.querySelector<HTMLButtonElement>('button')?.focus();
      });
      card.className = 'aa-card'; card.dataset.assetId = asset.id; card.ariaLabel = `Inspect ${asset.name}`; card.ariaPressed = String(selected === asset.id);
      card.append(image(asset, 'aa-thumbnail'));
      const info = el('div', 'aa-card-copy'); info.append(el('strong', '', asset.name), small(kindName(asset.kind)));
      if (asset.status !== 'available') info.append(el('span', `aa-badge aa-${asset.status}`, asset.status === 'missing' ? 'Preview unavailable' : 'Needs Ren\'Py names'));
      card.append(info); items.append(card);
    }
    browser.scrollTop = scroll;
  }
  function renderInspector() {
    inspector.replaceChildren(); inspector.hidden = !inspectorOpen || !library.length;
    root.dataset.inspecting = String(!inspector.hidden); reopen.hidden = !inspector.hidden || !library.length;
    if (inspector.hidden) return;
    const asset = library.find(a => a.id === selected) ?? library[0]!; selected = asset.id;
    const head = el('div', 'aa-inspector-head');
    const close = action(variant === 'shelves' && innerWidth < 760 ? 'Back to library' : 'Close preview', () => { inspectorOpen = false; renderInspector(); items.querySelector<HTMLButtonElement>(`[data-asset-id="${selected}"]`)?.focus(); }); close.classList.add('aa-secondary');
    head.append(small(kindName(asset.kind)), close); inspector.append(head);
    const preview = el('div', 'aa-preview');
    if (asset.status === 'missing') {
      preview.classList.add('aa-unavailable'); preview.append(icon('assets'), el('h3', '', 'Preview unavailable'), el('p', 'muted', 'The sample media is temporarily unavailable. The library entry is kept.'));
      preview.append(action('Retry preview', () => { asset.status = 'available'; page.status.textContent = 'Sample preview restored. No project file was read.'; renderItems(); renderInspector(); }));
    } else preview.append(image(asset, 'aa-large-preview'));
    inspector.append(preview);
    const copy = el('div', 'aa-inspector-copy'); copy.append(el('h2', 'aa-selected-title', asset.name), el('p', 'aa-small muted', asset.detail));
    if (asset.kind === 'music' || asset.kind === 'sfx') copy.append(el('p', 'aa-audio-note', 'Audio playback is planned for a later app milestone. This preview shows a fictional waveform.'));
    const facts = el('dl', 'aa-facts');
    for (const [label, value] of [['Ren\'Py name', asset.token], ['File size', asset.size], ...(asset.character ? [['Character', asset.character], ['Expression', asset.expression ?? 'neutral']] : [])]) { facts.append(el('dt', '', label!), el('dd', '', value!)); }
    copy.append(facts);
    if (asset.status === 'compatibilityRequired') copy.append(el('p', 'aa-warning', 'This asset needs a Ren\'Py declaration. Open Asset maintenance to review the repair.'));
    const details = el('details', 'aa-technical'); details.append(el('summary', '', 'File & compatibility details'), el('p', 'aa-path', pathName(asset)), el('p', 'aa-small muted', `Status: ${asset.status}. Original files stay unchanged during import.`)); copy.append(details);
    inspector.append(copy);
  }
  function openImport() {
    if (dialog?.open) return;
    chooser = staged.length === 0; dialog = el('dialog', 'lp-dialog aa-import-dialog'); dialog.ariaLabel = 'Import sample assets';
    const returnFocus = document.activeElement as HTMLElement;
    dialog.oncancel = e => { if (importing) e.preventDefault(); };
    dialog.onclose = () => { dialog?.remove(); dialog = undefined; if (returnFocus?.isConnected) returnFocus.focus(); else importButton.focus(); };
    page.shell.append(dialog); renderImport(); dialog.showModal();
  }
  function syncBatchButton() { importButton.replaceChildren(icon('plus'), document.createTextNode(staged.length ? `Review ${staged.length} staged` : 'Import assets')); }
  function renderImport(notice = '', error = false) {
    if (!dialog) return;
    dialog.replaceChildren(); dialog.dataset.importing = String(importing);
    const heading = el('div', 'aa-import-heading');
    heading.append(el('span', 'aa-step', chooser ? '1 / 2 · Choose' : '2 / 2 · Review'), el('h2', '', chooser ? 'Choose a fictional sample batch' : 'Review before importing'), el('p', 'muted', 'Browser sample only. These images and sounds do not come from your computer.'));
    dialog.append(heading);
    if (notice) { const feedback = el('p', error ? 'aa-error aa-batch-feedback' : 'aa-success aa-batch-feedback', notice); feedback.role = error ? 'alert' : 'status'; dialog.append(feedback); }
    if (chooser) renderChooser(); else renderStaged();
    syncBatchButton();
  }
  function renderChooser() {
    const choices = sampleChoices(); const chosen = new Set(choices.slice(0, 3).map(a => a.id));
    const list = el('div', 'aa-choices');
    for (const asset of choices) {
      const label = el('label', 'aa-choice'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = chosen.has(asset.id); checkbox.ariaLabel = `Choose ${asset.name}`;
      checkbox.onchange = () => { if (checkbox.checked) chosen.add(asset.id); else chosen.delete(asset.id); };
      const name = el('div'); name.append(el('strong', '', asset.name), small(`${kindName(asset.kind)} · ${asset.size}`)); label.append(checkbox, image(asset), name); list.append(label);
    }
    const actions = el('div', 'aa-dialog-actions');
    actions.append(action('Cancel selection', () => { if (staged.length) { chooser = false; renderImport('Selection cancelled. Your staged edits are kept.'); } else dialog?.close(); }), action('Use selected samples', () => {
      if (!chosen.size) { renderImport('Choose at least one sample.', true); return; }
      for (const asset of choices.filter(a => chosen.has(a.id))) staged.push({ ...asset, id: `${asset.id}-${++sequence}` });
      chooser = false; renderImport(); dialog?.querySelector<HTMLInputElement>('[data-stage-row] input')?.focus();
    }, true));
    const refusal = el('details', 'aa-technical'); refusal.append(el('summary', '', 'Try a selection problem'));
    refusal.append(el('p', 'aa-small muted', 'Unsupported files are refused before staging. Try the fictional example below.'), action('Try refused file', () => renderImport('archive.zip was refused. Choose a supported image or audio sample.', true)));
    dialog!.append(list, refusal, actions);
  }
  function renderStaged() {
    const stagedToolbar = el('div', 'aa-staged-toolbar'); stagedToolbar.append(small(`${staged.length} staged · ${importedCount} imported in this sample`), action('Add samples', () => { chooser = true; renderImport(); })); dialog!.append(stagedToolbar);
    const rows = el('div', 'aa-staged-list');
    for (const asset of staged) {
      const row = el('section', 'aa-stage-row'); row.dataset.stageRow = asset.id; row.ariaLabel = `Staged ${asset.name}`;
      const clearFeedback = () => { delete asset.error; row.querySelector('.aa-row-error')?.remove(); };
      const visual = el('div', 'aa-stage-visual'); visual.append(image(asset), small(fileName(asset)));
      const fields = el('div', 'aa-stage-fields');
      const name = el('input'); name.value = asset.name; name.oninput = () => { asset.name = name.value; clearFeedback(); };
      const token = el('input'); token.value = asset.token; token.spellcheck = false; token.oninput = () => { asset.token = token.value; clearFeedback(); };
      const audio = asset.kind === 'music' || asset.kind === 'sfx';
      const kind = select(kinds.filter(([k]) => audio ? k === 'music' || k === 'sfx' : k === 'background' || k === 'characterAppearance').map(([k]) => [k, kindName(k)]), asset.kind);
      const character = select([['', 'Choose character'], ['Mira', 'Mira'], ['Eli', 'Eli']], asset.character ?? '');
      character.onchange = () => { asset.character = character.value; clearFeedback(); };
      const expression = el('input'); expression.value = asset.expression ?? 'neutral'; expression.oninput = () => { asset.expression = expression.value; clearFeedback(); };
      const charField = labelled('Character', character), expField = labelled('Expression', expression);
      const sync = () => { charField.hidden = expField.hidden = kind.value !== 'characterAppearance'; }; sync();
      kind.onchange = () => { asset.kind = kind.value as AssetKind; if (asset.kind === 'characterAppearance' && !asset.expression) asset.expression = expression.value; sync(); clearFeedback(); };
      fields.append(labelled('Display name', name), labelled('Use as', kind), labelled('Ren\'Py name', token, 'Start with a letter. Use letters, numbers or underscores, up to 64 characters.'), charField, expField);
      const remove = action(`Remove ${asset.name} from batch`, () => { staged = staged.filter(a => a.id !== asset.id); chooser = staged.length === 0; renderImport(); dialog?.querySelector<HTMLButtonElement>('.aa-dialog-actions button')?.focus(); }); remove.classList.add('aa-remove');
      if (asset.error) { const feedback = el('p', 'aa-error aa-row-error', asset.error); feedback.role = 'alert'; fields.append(feedback); }
      row.append(visual, fields, remove); rows.append(row);
    }
    const simulation = el('details', 'aa-technical'); simulation.append(el('summary', '', 'Try an import problem'));
    const failure = el('input'); failure.type = 'checkbox'; failure.checked = failNextImport; failure.onchange = () => { failNextImport = failure.checked; };
    const failLabel = el('label', 'aa-failure-label'); failLabel.append(failure, document.createTextNode('Interrupt the next import once')); simulation.append(failLabel, el('p', 'aa-small muted', 'Successful rows stay imported. The interrupted row keeps your edits for retry.'));
    const actions = el('div', 'aa-dialog-actions');
    const discard = action('Discard batch', () => { staged = []; syncBatchButton(); dialog?.close(); page.status.textContent = 'Staged sample batch discarded.'; });
    const close = action('Keep batch & close', () => dialog?.close());
    const submit = action(staged.some(a => a.error) ? 'Retry import' : `Import ${staged.length} samples`, () => void importStaged(), true);
    actions.append(discard, close, submit); dialog!.append(rows, simulation, actions);
  }
  async function importStaged() {
    if (importing) return;
    const names = new Set(library.map(a => `${a.kind}:${a.token}`)); let invalid = false;
    for (const asset of staged) {
      delete asset.error;
      if (!asset.name.trim()) asset.error = 'Enter a display name.';
      else if (!tokenValid(asset.token)) asset.error = 'Enter a valid Ren\'Py name. Start with a letter and use letters, numbers or underscores.';
      else if (names.has(`${asset.kind}:${asset.token}`)) asset.error = 'This Ren\'Py name is already used for this asset type. Choose another name.';
      else if (asset.kind === 'characterAppearance' && !asset.character) asset.error = 'Choose a character for this image.';
      else if (asset.kind === 'characterAppearance' && !tokenValid(asset.expression ?? '')) asset.error = 'Enter a valid expression token.';
      names.add(`${asset.kind}:${asset.token}`); invalid ||= Boolean(asset.error);
    }
    if (invalid) { renderImport('Check the marked entries. Nothing was imported.', true); dialog?.querySelector<HTMLElement>('.aa-row-error')?.scrollIntoView({ block: 'center' }); return; }
    importing = true; dialog!.ariaBusy = 'true'; dialog!.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button,input,select').forEach(c => c.disabled = true);
    await new Promise(resolve => setTimeout(resolve, 180));
    const failed = failNextImport ? staged.at(-1) : undefined; failNextImport = false;
    const accepted = staged.filter(a => a !== failed);
    library.push(...accepted.map(a => ({ ...a, name: a.name.trim(), status: 'available' as const }))); importedCount += accepted.length;
    staged = failed ? [failed] : []; if (failed) failed.error = 'The sample import was interrupted. Your edits are kept. Retry when ready.';
    importing = false; dialog!.ariaBusy = 'false';
    if (accepted.length) { selected = accepted[0]!.id; inspectorOpen = true; }
    syncFilters(); renderItems(); renderInspector(); syncBatchButton();
    if (failed) renderImport(`${accepted.length} imported. One sample needs a retry.`, true);
    else { renderImportSuccess(accepted.length); page.status.textContent = `${accepted.length} sample assets imported into browser memory.`; }
  }
  function renderImportSuccess(count: number) {
    dialog!.replaceChildren(); const success = el('div', 'aa-import-success'); success.prepend(icon('assets'));
    success.append(el('h2', '', `${count} ${count === 1 ? 'asset' : 'assets'} added`), el('p', 'muted', 'Your samples are ready to browse. No real files were imported.'), action('Back to library', () => { dialog?.close(); importButton.focus(); }, true)); dialog!.append(success);
  }
  function showMaintenance() {
    const d = el('dialog', 'lp-dialog'); d.ariaLabel = 'Asset maintenance';
    const n = library.filter(a => a.status === 'compatibilityRequired').length;
    const source = document.activeElement as HTMLElement;
    d.append(el('h2', '', 'Ren\'Py compatibility'), el('p', '', n ? `${n} sample asset needs a declaration so Ren'Py can discover it. Original media stays unchanged.` : 'Every sample asset has a Ren\'Py name. No repair is needed.'));
    d.append(action('Close maintenance', () => d.close()));
    if (n) d.append(action('Repair Ren\'Py names', () => { for (const a of library) if (a.status === 'compatibilityRequired') a.status = 'available'; renderItems(); renderInspector(); d.close(); page.status.textContent = 'Sample compatibility declarations repaired in memory.'; }, true));
    d.onclose = () => { d.remove(); source?.focus(); }; page.shell.append(d); d.showModal();
  }
  const refuseDrop = (e: DragEvent) => { e.preventDefault(); page.status.textContent = 'This preview accepts fictional sample batches only. Use Import assets.'; };
  host.addEventListener('dragover', refuseDrop); host.addEventListener('drop', refuseDrop);
  syncFilters(); renderItems(); renderInspector();
  return () => { host.removeEventListener('dragover', refuseDrop); host.removeEventListener('drop', refuseDrop); dialog?.remove(); };
}
