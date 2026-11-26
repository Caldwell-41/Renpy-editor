// PROTOTYPE for #222. Draws one stock screen of the sample game with one theme and one set of layout values, as HTML.
// It stands in for the hidden Ren'Py process. The theme data and the look rules come from the #215 mock
// (screens/game-ui-themes); this file adds the layout settings of #210. Every length is in cqw: 1280 px = 100cqw.
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import dawn from '../story-revamp/art/bg-station-dawn.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import { color, font, menuColor, type Box, type Fill, type Paint, type Theme } from '../game-ui-themes/themes.ts';
import type { PageId, Values } from './templates.ts';

export type Sample = { line: 'short' | 'long'; titleBg: 'menu' | 'picture'; choices: '3' | '5' };

const u = (px: number) => `${(px / 12.8).toFixed(3)}cqw`;
function rgba(hex: string, a: number) {
  const h = hex.length === 9 ? hex.slice(0, 7) : hex, extra = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  const n = parseInt(h.slice(1), 16);
  return `rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255} / ${Math.round(a * extra) / 100})`;
}
const paint = (t: Theme, p: Paint) => rgba(color(t, p.c), p.a);
function fill(t: Theme, f: Fill): string {
  if (f === 'none' || f === 'stock') return 'transparent';
  if ('from' in f) return `linear-gradient(${f.dir === 'down' ? 'to bottom' : 'to right'}, ${paint(t, f.from)}, ${paint(t, f.to)})`;
  return paint(t, f);
}
function boxCss(t: Theme, b: Box, over?: Partial<Box>, opts: { pad?: boolean } = {}): string {
  const x = { ...b, ...over };
  const parts = [`background:${fill(t, x.fill)}`, `border-radius:${x.corners >= 99 ? '999px' : u(x.corners)}`];
  parts.push(x.border ? `box-shadow:inset 0 0 0 ${u(x.border.w)} ${paint(t, x.border.c)}${x.shadow ? `, ${u(x.shadow.x)} ${u(x.shadow.y)} ${u(x.shadow.blur)} ${paint(t, x.shadow.c)}` : ''}` : x.shadow ? `box-shadow:${u(x.shadow.x)} ${u(x.shadow.y)} ${u(x.shadow.blur)} ${paint(t, x.shadow.c)}` : 'box-shadow:none');
  if (opts.pad !== false && x.pad !== 'stock') { const [l, top, r, b] = x.pad; parts.push(`padding:${u(top)} ${u(r)} ${u(b)} ${u(l)}`); }
  return parts.join(';');
}
const textCss = (t: Theme, f: string, size: number, c: string) => `font-family:${font(t, f).css};font-size:${u(size)};color:${color(t, c)}`;
const pct = { Left: 0, Center: 50, Right: 100, Top: 0, Bottom: 100 } as Record<string, number>;
const cssAlign = (v: unknown) => String(v).toLowerCase();
// gui.text_properties gives a text the anchor of its alignment, so the dialogue text sits at X by that anchor, as the name box does.
/** Ren'Py's xalign and yalign with an offset: the same point of the element and of the screen, then moved. */
const place = (align: unknown, vertical: unknown, x: unknown, y: unknown) => { const a = pct[String(align)]!, v = pct[String(vertical)]!; return `position:absolute;left:calc(${a}% + ${u(Number(x))});top:calc(${v}% + ${u(Number(y))});translate:-${a}% -${v}%`; };

export function draw(t: Theme, page: PageId, v: Values, s: Sample): string {
  const T = t.text, I = T.interface;
  const n = (key: string) => Number(v[key]);
  const iface = (size = I.size) => `font-family:${font(t, I.font).css};font-size:${u(size)}`;
  const button = (label: string, state: 'idle' | 'selected' = 'idle', extra = '') => {
    // A button with no drawn box keeps the stock padding, gui.button_borders = 4 4 4 4.
    const box = t.button.box === 'none' ? `padding:${u(4)}` : boxCss(t, t.button.box);
    return `<span class="gp-btn" style="${iface()};color:${color(t, state === 'selected' ? t.button.text.selected : t.button.text.idle)};${box};${extra}">${label}</span>`;
  };
  const scene = `<div class="gp-bg" style="background-image:url(${platform})"></div><img class="gp-sprite" src="${mara}" alt="">`;
  const lines = { short: "The last tram doesn't stop here.", long: "The last tram doesn't stop here. It slows at the signal, and if the driver knows your face he opens the rear door. You step on while it is still moving, and nobody on board looks up." };

  /** The dialogue box. `w` holds the Dialogue box page's values; the Choices page draws it with the stock values. */
  function say(text: string, speaker: string | null, w: Values) {
    const g = t.groups.say, full = w['box.width'] === 'Full', height = Number(w['box.height']);
    const stockSize = full && height === 185;
    // A stock picture that no longer fits changes to a drawn box near the stock look: Panel at 80 % (#210, rule 7).
    const look = g !== 'stock' ? boxCss(t, g, undefined, { pad: false })
      : stockSize ? `background:linear-gradient(to right, transparent, ${rgba(t.panel, 80)} ${u(268)}, ${rgba(t.panel, 80)} calc(100% - ${u(268)}), transparent);-webkit-mask:linear-gradient(transparent, #000 ${u(5)})`
      : `background:${rgba(t.panel, 80)}`;
    const pos = w['box.position'] === 'Top' ? 'top:0;translate:-50% 0' : w['box.position'] === 'Center' ? 'top:50%;translate:-50% -50%' : 'bottom:0;translate:-50% 0';
    const nb = t.groups.namebox;
    const size = `${w['name.width'] === 'Fit' ? '' : `width:${u(Number(w['name.width']))};`}${w['name.height'] === 'Fit' ? '' : `height:${u(Number(w['name.height']))};`}`;
    const name = speaker ? `<div class="gp-name" style="left:${u(Number(w['name.x']))};top:${u(Number(w['name.y']))};translate:-${pct[String(w['name.align'])]}% 0;${size}font-family:${font(t, T.name.font).css};font-size:${u(T.name.size)};color:#f0b35b;${nb === 'none' ? `padding:${u(5)}` : boxCss(t, nb)}">${speaker}</div>` : '';
    const quick = ['Back', 'History', 'Skip', 'Auto', 'Save', 'Q.Save', 'Q.Load', 'Prefs'].map(label => `<span style="padding:${u(4)} ${u(10)} 0;color:${color(t, t.groups.quick.idle)}">${label}</span>`).join('');
    return `<div class="gp-window" style="width:${full ? '100%' : u(Number(w['box.width']))};height:${u(height)};${pos}"><div class="gp-fill" style="${look}"></div>${name}
      <div class="gp-dialogue" style="left:${u(Number(w['text.x']))};translate:-${pct[String(w['text.align'])]}% 0;top:${u(Number(w['text.y']))};width:${u(Number(w['text.width']))};text-align:${cssAlign(w['text.align'])};${textCss(t, T.dialogue.font, T.dialogue.size, T.dialogue.color)}">${text}</div></div>
      <div class="gp-quick" style="${iface(14)}">${quick}</div>`;
  }
  const stockSay: Values = { 'box.width': 'Full', 'box.height': 185, 'box.position': 'Bottom', 'text.x': 268, 'text.y': 50, 'text.width': 744, 'text.align': 'Left', 'name.x': 240, 'name.y': 0, 'name.align': 'Left', 'name.width': 'Fit', 'name.height': 'Fit' };

  /** The stock game menu, which a template of Save and load or History does not change. */
  function gameMenu(title: string, current: string, body: string) {
    const nav = ['History', 'Save', 'Load', 'Preferences', 'Main Menu', 'About', 'Help', 'Quit'];
    const line = t.groups.accentLine ? `<i class="gp-accent-line" style="background:${t.accent};left:${u(277)};top:${u(120)};height:${u(570)}"></i>` : '';
    const frame = t.groups.screenFrame === 'stock' ? `background:${rgba(t.panel, 80)}` : boxCss(t, t.groups.screenFrame, undefined, { pad: false });
    return `<div class="gp-bg" style="background:${menuColor(t)}"></div><div class="gp-bg" style="${frame}"></div>${line}
      <div class="gp-navcol"><div class="gp-nav">${nav.map(label => button(label, label === current ? 'selected' : 'idle')).join('')}</div><div class="gp-return">${button('Return')}</div></div>
      <div class="gp-menu-title" style="${textCss(t, T.heading.font, 50, T.heading.color)}">${title}</div>
      <div class="gp-menu-body">${body}</div>`;
  }

  const screens: Record<PageId, () => string> = {
    title: () => {
      const bg = s.titleBg === 'picture' ? `background-image:url(${dawn})` : `background:${menuColor(t)}`;
      const size = n('panel.size'), side = String(v['panel.side']);
      const box = t.groups.menuPanel === 'stock' ? `background:${rgba(t.panel, 80)}` : boxCss(t, t.groups.menuPanel, undefined, { pad: false });
      // The panel fills one side of the screen. The accent line is on its inner edge.
      const at = side === 'Bottom' ? `left:0;right:0;bottom:0;height:${u(size)}` : `${side === 'Right' ? 'right' : 'left'}:0;top:0;bottom:0;width:${u(size)}`;
      const line = side === 'Bottom' ? `left:0;width:100%;bottom:${u(size - 3)};height:${u(3)}` : `${side === 'Right' ? 'right' : 'left'}:${u(size - 3)};top:0;height:100%`;
      const panel = v['panel.show'] ? `<div class="gp-panel" style="${at};${box}"></div>${t.groups.accentLine ? `<i class="gp-accent-line" style="background:${t.accent};${line}"></i>` : ''}` : '';
      const row = v['nav.arrange'] === 'Row';
      // size_group "navigation": each button is as wide as the widest one, in a column and in a row.
      const nav = ['Start', 'Load', 'Preferences', 'About', 'Help', 'Quit'].map(label => button(label, 'idle', `text-align:${cssAlign(v['nav.text'])}`)).join('');
      const title = v['title.show'] ? `<div class="gp-title" style="${place(v['title.align'], v['title.vertical'], v['title.x'], v['title.y'])};align-items:${{ Left: 'flex-start', Center: 'center', Right: 'flex-end' }[String(v['title.align'])]};text-align:${cssAlign(v['title.align'])}"><b style="${textCss(t, T.title.font, T.title.size, T.title.color)}">The Last Tram</b><small style="${iface()};color:${color(t, T.version)}">1.0</small></div>` : '';
      return `<div class="gp-bg" style="${bg}"></div>${panel}
        <div class="gp-grid" style="${place(v['nav.align'], v['nav.vertical'], v['nav.x'], v['nav.y'])};gap:${u(n('nav.gap'))};${row ? 'grid-template-columns:repeat(6, 1fr)' : ''}">${nav}</div>${title}`;
    },
    say: () => `${scene}${say(lines[s.line], 'Mara', v)}`,
    choice: () => {
      const g = t.groups.choice;
      const items = ['Ask about the last tram', 'Wait for the next service', 'Leave', 'Ask the woman on the bench who she is waiting for', 'Say nothing'].slice(0, Number(s.choices));
      const one = (text: string) => {
        // Stock choice_idle_background: Panel at 80 % with a fade over 100 px at each side; the stock padding is 100 5 100 5.
        const box = g.box === 'stock'
          ? `background:linear-gradient(to right, transparent, ${rgba(t.panel, 80)} ${u(100)}, ${rgba(t.panel, 80)} calc(100% - ${u(100)}), transparent);-webkit-mask:linear-gradient(transparent, #000 ${u(3)}, #000 calc(100% - ${u(3)}), transparent);padding:${u(5)} ${u(100)}`
          : g.box === 'none' ? `padding:${u(5)} ${u(100)}` : boxCss(t, g.box);
        return `<div style="width:${u(n('button.width'))};text-align:${cssAlign(v['button.text'])};${textCss(t, T.dialogue.font, T.dialogue.size, g.text.idle)};${box}">${text}</div>`;
      };
      const a = pct[String(v['list.align'])]!;
      return `${scene}<div class="gp-choices" style="left:calc(${a}% + ${u(n('list.x'))});top:${u(n('list.y'))};translate:-${a}% -50%;gap:${u(n('list.gap'))}">${items.map(one).join('')}</div>${say('What should I do?', null, stockSay)}`;
    },
    history: () => {
      const entries: [who: string | null, tint: string, what: string][] = [
        ['Mara', '#f0b35b', "The last tram doesn't stop here."],
        ['Conductor', '#8fc7ff', 'It slows at the signal, and if the driver knows your face he opens the rear door. You step on while it is still moving, and nobody on board looks up.'],
        [null, '', 'Rain runs down the shelter glass. The board above the platform shows no times.'],
        ['Mara', '#f0b35b', 'Then I will wait at the signal.'],
        ['Conductor', '#8fc7ff', 'Suit yourself.'],
        ['Mara', '#f0b35b', 'How long until it comes?'],
        ['Conductor', '#8fc7ff', 'Nobody has asked me that in years.'],
      ];
      const fit = v['entry.height'] === 'Fit', a = pct[String(v['name.align'])]!;
      // screen history: a fixed with yfit. The name and the line each have a position in it (screens.rpy, style history_*).
      const one = ([who, tint, what]: typeof entries[number]) => `<div class="gp-entry" style="${fit ? `min-height:${u(who ? n('name.y') + T.heading.size * 1.2 : 0)};` : `height:${u(n('entry.height'))};`}">
        ${who ? `<span class="gp-who" style="left:${u(n('name.x'))};top:${u(n('name.y'))};translate:-${a}% 0;width:${u(n('name.width'))};text-align:${cssAlign(v['name.align'])};font-family:${font(t, T.heading.font).css};font-size:${u(T.heading.size)};color:${tint}">${who}</span>` : ''}
        <p style="margin-left:${u(n('line.x'))};padding-top:${u(n('line.y'))};width:${u(n('line.width'))};text-align:${cssAlign(v['line.align'])};${iface()};color:${color(t, I.color)}">${what}</p></div>`;
      return gameMenu('History', 'History', `<div class="gp-history" style="gap:${u(n('entry.gap'))}">${entries.map(one).join('')}</div>`);
    },
  };
  return `<div class="gp">${screens[page]()}</div>`;
}
