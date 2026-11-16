// Game UI layout study (#197): draws the sample game's screens as HTML.
// It stands in for the hidden Ren'Py process that will draw the real project.
// Every size is in cqw, so one screen draws at any size, thumbnails included.
import { art, fonts, type Value } from './model.ts';

export type GameContext = {
  /** A look value, after "same as the game-wide look" is resolved. */
  g: (key: string) => Value;
  /** Sample content. It never reaches the project. */
  s: (key: string) => string;
  /** Emit selectable parts, the selection and its handles. */
  parts: boolean;
  sel: string | null;
  offsets: Record<string, { x: number; y: number }>;
  added: readonly { id: string; kind: string }[];
  /** A one-shot animation class for the dialogue box, or ''. */
  replay: string;
};

const lines: Record<string, string> = {
  short: "The last tram doesn't stop here.",
  long: "The last tram doesn't stop here. It slows at the signal, and if the driver knows your face he opens the rear door. You step on while it is still moving, and nobody on board looks up.",
  narration: 'Rain runs off the shelter roof. The timetable behind the glass is two years out of date.',
};
const choices = ['Ask about the last tram', 'Leave', 'Wait for the next service', 'Show her the ticket you found on the platform', 'Say nothing'];
const handles = '<i class="g-h g-h1"></i><i class="g-h g-h2"></i><i class="g-h g-h3"></i><i class="g-h g-h4"></i>';
const radius = (shape: Value) => shape === 'pill' ? '99cqw' : shape === 'rounded' ? '.7cqw' : '0';
const px = (value: number) => `${value / 19.2}cqw`;
function onColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150 ? '#14161a' : '#ffffff';
}

export function game(id: string, c: GameContext): string {
  const g = (key: string) => String(c.g(key));
  const part = (pid: string, cls: string, inner: string, style = '') => {
    const off = c.offsets[`${id}.${pid}`];
    const on = c.parts && c.sel === pid;
    return `<div class="${cls}${on ? ' is-sel' : ''}"${c.parts ? ` data-part="${pid}"` : ''} style="${off ? `translate:${px(off.x)} ${px(off.y)};` : ''}${style}">${inner}${on ? handles : ''}</div>`;
  };
  const btn = (label: string, o: { goto?: string; cls?: string; state?: string } = {}) =>
    `<span class="g-btn${o.cls ? ` ${o.cls}` : ''}${o.state && o.state !== 'idle' ? ` is-${o.state}` : ''}"${o.goto ? ` data-goto="${o.goto}"` : ''}>${label}</span>`;
  const bg = () => `<div class="g-bg" style="background-image:url(${art[c.s('backdrop')]})"></div>`;
  const sprite = () => c.s('who') === 'none' ? '' : `<img class="g-sprite" src="${art[c.s('who')]}" alt="">`;
  const dim = (key: string, dark = false) => `<div class="g-dim${dark ? ' g-dim-dark' : ''}" style="opacity:${Number(c.g(key)) / 100}"></div>`;

  function quick() {
    if (g('quick.place') === 'hidden') return '';
    const to: Record<string, string> = { History: 'history', Save: 'save', Prefs: 'prefs' };
    return part('quick', `g-quick g-quick-${g('quick.place')} g-quick-${g('quick.size')}`, g('quick.items').split(',').filter(Boolean).map(item => `<span${to[item] ? ` data-goto="${to[item]}"` : ''}>${item}</span>`).join(''));
  }
  function say(text = lines[c.s('line')]!, speaker = c.s('line') === 'narration' || c.s('who') === 'none' ? '' : c.s('who') === 'mara' ? 'Mara' : 'Eli') {
    const layout = g('say.layout');
    const name = speaker ? part('name', `g-name g-name-${g('say.namePlace')}${layout === 'tab' ? ' g-panel' : ''}`, speaker, `color:${g('say.nameColor')};`) : '';
    const side = c.g('say.side') && speaker ? part('side', 'g-side', `<img src="${art[speaker.toLowerCase()]}" alt="">`) : '';
    const arrow = c.g('say.arrow') ? part('arrow', 'g-arrow', '▼') : '';
    const box = part('box', `g-box${layout === 'bare' ? '' : ' g-panel'}${c.replay ? ` ${c.replay}` : ''}`, `${side}<div class="g-box-in">${name}${part('text', 'g-text', text, `text-align:${g('say.align')};`)}</div>${arrow}`, `--gp:${g('say.fill')};--go:${g('say.opacity')};`);
    return `<div class="g-say g-say-${layout} g-say-${g('say.place')} g-say-${g('say.height')}">${box}</div>${quick()}`;
  }
  function menu(title: string, current: string, body: string) {
    const nav: [string, string][] = [['History', 'history'], ['Save', 'save'], ['Load', 'save'], ['Preferences', 'prefs'], ['Main Menu', 'title'], ['About', 'about'], ['Help', 'help'], ['Quit', 'confirm']];
    const state = (label: string, i: number) => label === current ? 'selected' : i === 0 ? c.s('state') : 'idle';
    return `${bg()}${sprite()}${dim('pause.dim')}<div class="g-menu g-menu-${g('pause.side')}">
      ${part('nav', 'g-menu-nav', `${nav.map(([label, goto], i) => btn(label, { goto, state: state(label, i) })).join('')}${btn('Return', { goto: 'say', cls: 'g-return' })}`)}
      <div class="g-menu-main"><div class="g-menu-title">${title}</div>${part('body', 'g-menu-body', body)}</div></div>`;
  }
  const screens: Record<string, () => string> = {
    say: () => `${bg()}${sprite()}${say()}`,
    quick: () => `${bg()}${sprite()}${say()}`,
    choice: () => `${bg()}${sprite()}${part('list', `g-choices g-ch-${g('choice.place')}`, choices.slice(0, Number(c.s('count'))).map((text, i) => part('button', `g-btn g-choice${i === 0 && c.s('state') !== 'idle' ? ` is-${c.s('state')}` : ''}`, text)).join(''), `--cw:${g('choice.width')}%;gap:${px(Number(c.g('choice.gap')))};--br:${radius(c.g('choice.shape'))};`)}${say('What should I do?', '')}`,
    title: () => {
      const picture = g('title.bg');
      const nav: [string, string][] = [['Start', 'say'], ['Load', 'save'], ['Preferences', 'prefs'], ['About', 'about'], ['Help', 'help'], ['Quit', 'confirm']];
      return `${part('bg', 'g-bg', '', picture === 'none' ? 'background:var(--gp);' : `background-image:url(${art[picture]});`)}${dim('title.dim', true)}
        <div class="g-title g-title-${g('title.layout')}" style="--br:${radius(c.g('title.shape'))}">
          ${c.g('title.panel') ? part('panel', 'g-tpanel', '') : ''}
          ${part('menu', 'g-nav', nav.map(([label, goto], i) => btn(label, { goto, state: i === 0 ? c.s('state') : 'idle' })).join(''))}
          ${c.g('title.showName') ? part('title', `g-gamename g-gamename-${g('title.nameSize')}`, '<b>The Last Tram</b><small>Version 1.0</small>') : ''}
        </div>`;
    },
    pause: () => menu('Paused', '', '<p class="g-quiet">The game waits here. Pick a page on the menu.</p>'),
    save: () => {
      const count = Number(c.g('save.cols')) * Number(c.g('save.rows'));
      const used = { empty: 0, some: 2, full: count }[c.s('slots')] ?? 0;
      const slot = (i: number) => `<div class="g-slot"><div class="g-thumb"${i < used ? ` style="background-image:url(${art[['platform', 'tram', 'dawn'][i % 3]!]})"` : ''}></div><span>${i < used ? (c.g('save.time') ? `14 Nov, 23:${40 + i}` : `Chapter ${i + 1}`) : 'Empty slot'}</span></div>`;
      return menu('Save', 'Save', `<div class="g-slots" style="grid-template-columns:repeat(${g('save.cols')},1fr);max-width:${Number(c.g('save.cols')) * (g('save.rows') === '3' ? 16.5 : 23)}cqw">${Array.from({ length: count }, (_, i) => slot(i)).join('')}</div><div class="g-pages">‹ &nbsp; A &nbsp; Q &nbsp; <b>1</b> &nbsp; 2 &nbsp; 3 &nbsp; ›</div>`);
    },
    prefs: () => {
      const radios: Record<string, string[]> = { Display: ['Window', 'Fullscreen'], Skip: ['Unseen text', 'After choices'] };
      const row = (item: string, i: number) => `<div class="g-pref"><b>${item}</b>${radios[item] ? radios[item]!.map((label, j) => btn(label, { state: j === 0 ? 'selected' : 'idle' })).join('') : `<i class="g-slider"><i style="width:${40 + (i * 17) % 50}%"></i></i>`}</div>`;
      return menu('Preferences', 'Preferences', `<div class="g-prefs">${g('prefs.items').split(',').filter(Boolean).map(row).join('')}</div>`);
    },
    history: () => {
      const said: [string, string][] = [['Mara', lines.short!], ['', lines.narration!], ['Eli', 'Then how do you get on?'], ['Mara', 'You wait at the signal, and you hope he knows your face.'], ['', 'What should I do?']];
      return menu('History', 'History', `<div class="g-history" style="gap:${px(Number(c.g('history.gap')))}">${said.map(([who, text]) => `<p>${who && c.g('history.names') ? `<b>${who}</b>` : '<b></b>'}<span>${text}</span></p>`).join('')}</div>`);
    },
    about: () => menu('About', 'About', "<p><b>The Last Tram</b><br>Version 1.0</p><p>A short story about a night service that is not on the timetable.</p><p class=\"g-quiet\">Made with Ren'Py 8.5.3.</p>"),
    help: () => menu('Help', 'Help', `<div class="g-history">${[['Enter', 'Advances dialogue and activates the interface.'], ['Space', 'Advances dialogue without selecting choices.'], ['Escape', 'Opens the game menu.'], ['Ctrl', 'Skips dialogue while held down.']].map(([key, text]) => `<p><b>${key}</b><span>${text}</span></p>`).join('')}</div>`),
    confirm: () => {
      const yes = btn('Yes', { state: c.s('state') }), no = btn('No');
      return `${bg()}${sprite()}${say()}${dim('confirm.dim')}${part('frame', 'g-confirm g-panel', `<p>Are you sure you want to quit?</p><div>${g('confirm.order') === 'yes' ? yes + no : no + yes}</div>`)}`;
    },
    notify: () => `${bg()}${sprite()}${say()}${part('frame', 'g-notify g-panel', 'Quick save complete.')}`,
    skip: () => `${bg()}${sprite()}${say()}${part('frame', 'g-notify g-panel', 'Skipping ›››')}`,
    input: () => `${bg()}${say('What is this station called?<br><span class="g-input">Harrow Quay</span>', '')}`,
    nvl: () => `${bg()}${part('frame', 'g-nvl g-panel', [lines.narration, `<b>Mara</b> ${lines.short}`, '<b>Eli</b> Then how do you get on?', 'She looks down the track instead of answering.'].map(text => `<p>${text}</p>`).join(''))}`,
    ticket: () => `${bg()}${sprite()}${part('frame', 'g-ticket g-panel', `${part('heading', 'g-ticket-h', 'Night service')}${part('detail', 'g-quiet', 'Platform 4 · 23:52 · one way')}${part('board', 'g-btn', 'Board the tram')}`)}`,
  };
  const extra: Record<string, string> = { Text: 'New text', Button: 'New button', Image: 'Picture', Bar: '<i class="g-slider"><i style="width:55%"></i></i>', Box: '' };
  const added = c.added.map(item => part(item.id, `g-added g-added-${item.kind}${item.kind === 'Button' ? ' g-btn' : item.kind === 'Box' ? ' g-panel' : ''}`, extra[item.kind] ?? '')).join('');
  const accent = g('gui.accent');
  const style = `--ga:${accent};--gon:${onColor(accent)};--gt:${g('gui.text')};--gp:${g('gui.panel')};--gf:${fonts[g('gui.font')]};--gz:${{ s: 0.86, m: 1, l: 1.16 }[g('gui.size')] ?? 1};--gr:${px(Number(c.g('gui.corners')))};--br:${radius(c.g('gui.shape'))};--gbw:${{ none: '0cqw', thin: '.1cqw', thick: '.28cqw' }[g('gui.border')]};--gsh:${c.g('gui.shadow') ? '0 .5cqw 1.8cqw rgb(0 0 0 / 45%)' : 'none'}`;
  return `<div class="g" data-fill="${g('gui.fill')}" style='${style}'>${(screens[id] ?? screens.say!)()}${added}</div>`;
}
