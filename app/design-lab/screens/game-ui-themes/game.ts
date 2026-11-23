// PROTOTYPE for #215. Draws six stock screens of the sample game with one theme, as HTML.
// It stands in for the hidden Ren'Py process. The layout is the stock layout of Ren'Py 8.5.3
// at 1280 x 720 (gui/game/screens.rpy and gui.rpy), because a theme never sets a position or an outer size.
// Every length is in cqw of the stage: 1280 px = 100cqw.
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import dawn from '../story-revamp/art/bg-station-dawn.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import { color, font, hoverColor, menuColor, shade, tint, type Box, type Fill, type Paint, type Theme } from './themes.ts';

export type Sample = { state: 'idle' | 'hover' | 'selected' | 'disabled'; line: 'short' | 'long'; titleBg: 'menu' | 'picture'; gameTitle: string };
export const screenIds = ['title', 'say', 'choice', 'save', 'prefs', 'confirm'] as const;
export type ScreenId = typeof screenIds[number];
export const screenNames: Record<ScreenId, string> = { title: 'Title screen', say: 'Dialogue box', choice: 'Choices', save: 'Save and load', prefs: 'Options', confirm: 'Confirm prompt' };

const u = (px: number) => `${(px / 12.8).toFixed(3)}cqw`;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
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
/** CSS for one drawn box. `outer` keeps the stock padding, for boxes whose padding the stock layout owns. */
function boxCss(t: Theme, b: Box, over?: Partial<Box>, opts: { pad?: boolean } = {}): string {
  const x = { ...b, ...over };
  const parts = [`background:${fill(t, x.fill)}`, `border-radius:${x.corners >= 99 ? '999px' : u(x.corners)}`];
  parts.push(x.border ? `box-shadow:inset 0 0 0 ${u(x.border.w)} ${paint(t, x.border.c)}${x.shadow ? `, ${u(x.shadow.x)} ${u(x.shadow.y)} ${u(x.shadow.blur)} ${paint(t, x.shadow.c)}` : ''}` : x.shadow ? `box-shadow:${u(x.shadow.x)} ${u(x.shadow.y)} ${u(x.shadow.blur)} ${paint(t, x.shadow.c)}` : 'box-shadow:none');
  // Padding is Left, Top, Right, Bottom in source order; CSS wants Top, Right, Bottom, Left.
  if (opts.pad !== false) { const [l, top, r, b] = x.pad; parts.push(`padding:${u(top)} ${u(r)} ${u(b)} ${u(l)}`); }
  return parts.join(';');
}
const textCss = (t: Theme, f: string, size: number, c: string) => `font-family:${font(t, f).css};font-size:${u(size)};color:${color(t, c)}`;

export function draw(t: Theme, id: ScreenId, s: Sample): string {
  const T = t.text, I = T.interface;
  const iface = (size = I.size) => `font-family:${font(t, I.font).css};font-size:${u(size)}`;
  const btnColor = (state: Sample['state']) => state === 'hover' ? hoverColor(t, t.button.text.hover) : state === 'selected' ? color(t, t.button.text.selected) : state === 'disabled' ? color(t, t.button.text.disabled) : color(t, t.button.text.idle);
  const motion = (state: Sample['state']) => state !== 'hover' ? '' : t.button.hover === 'Grow' ? 'scale:1.06;' : t.button.hover === 'Brighten' ? 'filter:brightness(1.25);' : '';
  /** A text button with the game-wide Button look. */
  const button = (label: string, state: Sample['state'] = 'idle', extra = '') => {
    const box = t.button.box === 'none' ? '' : boxCss(t, t.button.box, state === 'hover' ? t.button.hoverBox : undefined);
    return `<span class="gt-btn" style="${iface()};color:${btnColor(state)};${box};${motion(state)}${extra}">${label}</span>`;
  };
  const sceneBg = `<div class="gt-bg" style="background-image:url(${platform})"></div><img class="gt-sprite" src="${mara}" alt="">`;
  const lines = { short: "The last tram doesn't stop here.", long: "The last tram doesn't stop here. It slows at the signal, and if the driver knows your face he opens the rear door. You step on while it is still moving, and nobody on board looks up." };

  function say(text: string, speaker: string | null) {
    const g = t.groups.say;
    const boxStyle = g === 'stock'
      // textbox.png: black at 80 %, fading to nothing over 268 px at each side and 5 px at the top (gui7/images.py L175-196).
      ? `background:linear-gradient(to right, transparent, ${rgba(t.panel, 80)} ${u(268)}, ${rgba(t.panel, 80)} calc(100% - ${u(268)}), transparent);-webkit-mask:linear-gradient(transparent, #000 ${u(5)})`
      : boxCss(t, g, undefined, { pad: false });
    const nb = t.groups.namebox;
    const name = speaker ? `<div class="gt-name" style="font-family:${font(t, T.name.font).css};font-size:${u(T.name.size)};color:#f0b35b;${nb === 'none' ? '' : boxCss(t, nb)}">${speaker}</div>` : '';
    const quick = ['Back', 'History', 'Skip', 'Auto', 'Save', 'Q.Save', 'Q.Load', 'Prefs'].map((label, i) => `<span style="color:${i === 1 && s.state === 'hover' ? color(t, t.groups.quick.hover === '=accent' ? tint(t.accent) : t.groups.quick.hover) : color(t, t.groups.quick.idle)}">${label}</span>`).join('');
    return `<div class="gt-say" style="${boxStyle}"></div>${name}<div class="gt-dialogue" style="${textCss(t, T.dialogue.font, T.dialogue.size, T.dialogue.color)}">${text}</div><div class="gt-quick" style="${iface(14)}">${quick}</div>`;
  }
  /** The stock game menu: the Menu background, the screen frame, the navigation, the title and Return. */
  function gameMenu(title: string, current: string, body: string) {
    const nav = ['History', 'Save', 'Load', 'Preferences', 'Main Menu', 'About', 'Help', 'Quit'];
    const line = t.groups.accentLine ? `<i class="gt-accent-line" style="background:${t.accent};top:${u(120)};height:${u(570)}"></i>` : '';
    return `<div class="gt-bg" style="background:${menuColor(t)}"></div><div class="gt-frame" style="background:${rgba(t.panel, 80)}"></div>${line}
      <div class="gt-nav gt-nav-game">${nav.map((label, i) => button(label, label === current ? 'selected' : i === 0 ? s.state : 'idle')).join('')}</div>
      <div class="gt-menu-title" style="${textCss(t, T.heading.font, 50, T.heading.color)}">${title}</div>
      <div class="gt-return">${button('Return')}</div>
      <div class="gt-menu-body">${body}</div>`;
  }
  const screens: Record<ScreenId, () => string> = {
    title: () => {
      const bg = s.titleBg === 'picture' ? `background-image:url(${dawn})` : `background:${menuColor(t)}`;
      // The Menu panel: main_menu_frame, 280 px wide, panel color at 80 % with a 3 px accent line (gui7/images.py L282-293).
      const box = t.box.fill === 'stock' ? `background:${rgba(t.panel, 80)}` : boxCss(t, { ...t.box, fill: { c: t.panel, a: 80 }, corners: 0 }, undefined, { pad: false });
      const line = t.groups.accentLine ? `<i class="gt-accent-line" style="background:${t.accent};top:0;height:100%"></i>` : '';
      const nav = ['Start', 'Load', 'Preferences', 'About', 'Help', 'Quit'];
      return `<div class="gt-bg" style="${bg}"></div><div class="gt-mmframe" style="${box}"></div>${line}
        <div class="gt-nav gt-nav-main">${nav.map((label, i) => button(label, i === 0 ? s.state : 'idle')).join('')}</div>
        <div class="gt-mmtitle"><b style="${textCss(t, T.title.font, T.title.size, T.title.color)}">${esc(s.gameTitle)}</b><small style="${iface()};color:${t.accent}">Version 1.0</small></div>`;
    },
    say: () => `${sceneBg}${say(lines[s.line], 'Mara')}`,
    choice: () => {
      const g = t.groups.choice;
      const items = ['Ask about the last tram', 'Wait for the next service', 'Leave'];
      const one = (text: string, i: number) => {
        const hover = i === 0 && s.state === 'hover';
        const c = color(t, hover ? (g.text.hover === '=accent' ? tint(t.accent) : g.text.hover) : g.text.idle);
        // Stock choice_idle_background: black at 80 %; hover: accent at 95 %; both fade over 100 px at each side (L215-237).
        const box = g.box === 'stock'
          ? `background:linear-gradient(to right, transparent, ${hover ? rgba(t.accent, 95) : rgba(t.panel, 80)} ${u(100)}, ${hover ? rgba(t.accent, 95) : rgba(t.panel, 80)} calc(100% - ${u(100)}), transparent);padding:${u(5)} ${u(100)}`
          : g.box === 'none' ? `padding:${u(5)} ${u(100)}` : boxCss(t, g.box, hover ? g.hoverBox : undefined);
        return `<div class="gt-choice" style="${textCss(t, T.dialogue.font, T.dialogue.size, T.dialogue.color)};color:${c};${box};${motion(hover ? 'hover' : 'idle')}">${text}</div>`;
      };
      return `${sceneBg}<div class="gt-choices" style="gap:${u(22)}">${items.map(one).join('')}</div>${say('What should I do?', null)}`;
    },
    save: () => {
      const slot = (i: number) => {
        const used = i < 2;
        const g = t.groups.slot;
        const box = g === 'none' ? '' : boxCss(t, g);
        return `<div class="gt-slot" style="${box}"><div class="gt-thumb"${used ? ` style="background-image:url(${i ? dawn : platform})"` : ''}></div><span style="${iface(14)};color:${color(t, t.button.text.idle)}">${used ? `14 Nov, 23:4${i}` : 'empty slot'}</span></div>`;
      };
      const pages = ['&lt;', 'A', 'Q', '1', '2', '3', '4', '5', '6', '&gt;'].map(label => button(label, label === '1' ? 'selected' : 'idle', `;padding-inline:${u(8)}`)).join('');
      return gameMenu('Save', 'Save', `<div class="gt-slots">${Array.from({ length: 6 }, (_, i) => slot(i)).join('')}</div><div class="gt-pages">${pages}</div>`);
    },
    prefs: () => {
      const label = (text: string) => `<div class="gt-pref-label" style="${textCss(t, T.heading.font, T.heading.size, T.heading.color)}">${text}</div>`;
      const mark = (on: boolean) => `<i class="gt-mark" style="background:${on ? color(t, t.groups.mark) : shade(t.accent, 0.4)}"></i>`;
      const opt = (text: string, on: boolean) => `<span class="gt-opt">${mark(on)}${button(text, on ? 'selected' : 'idle')}</span>`;
      const r = t.bar.corners >= 99 ? '999px' : u(t.bar.corners);
      const stock = t.id === 'renpy';
      const bar = (text: string, v: number) => `<div class="gt-bar-row">${label(text)}<div class="gt-bar" style="background:${stock ? shade(t.accent, 0.4) : color(t, t.bar.track)};border-radius:${r}">${stock ? '' : `<i class="gt-bar-fill" style="width:${v}%;background:${color(t, t.bar.filled)};border-radius:${r}"></i>`}<i class="gt-thumb-mark" style="left:calc(${v}% - ${u(5)});background:${stock ? t.accent : color(t, t.bar.thumb)};border-radius:${r}"></i></div></div>`;
      return gameMenu('Preferences', 'Preferences', `<div class="gt-prefs">
        <div>${label('Display')}${opt('Window', true)}${opt('Fullscreen', false)}</div>
        <div>${label('Rollback Side')}${opt('Disable', false)}${opt('Left', true)}${opt('Right', false)}</div>
        <div>${label('Skip')}${opt('Unseen Text', false)}${opt('After Choices', true)}${opt('Transitions', false)}</div>
      </div><div class="gt-bars">${bar('Text Speed', 62)}${bar('Music Volume', 80)}${bar('Auto-Forward Time', 35)}${bar('Sound Volume', 70)}</div>`);
    },
    confirm: () => {
      // The dim is the picture gui/overlay/confirm.png (screens.rpy L1158), black at 60 %, drawn once by the generator.
      // It is not a box, so no theme changes it.
      // Stock frame.png: a 3 px accent border around an opaque panel fill (gui7/images.py L317-326).
      const frame = t.box.fill === 'stock' ? `background:${t.panel};box-shadow:inset 0 0 0 ${u(3)} ${t.accent};padding:${u(40)}` : boxCss(t, t.box);
      return `${sceneBg}${say(lines.short, 'Mara')}<div class="gt-dim" style="background:${rgba('#000000', 60)}"></div>
        <div class="gt-confirm" style="${frame}"><p style="${iface()};color:${color(t, I.color)}">Are you sure you want to quit?</p><div>${button('Yes', s.state)}${button('No')}</div></div>`;
    },
  };
  return `<div class="gt">${screens[id]()}</div>`;
}
