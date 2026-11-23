// PROTOTYPE for #215. Draws six stock screens of the sample game with one theme, as HTML.
// It stands in for the hidden Ren'Py process. The layout is the stock layout of Ren'Py 8.5.3
// at 1280 x 720 (gui/game/screens.rpy and gui.rpy), because a theme never sets a position or an outer size.
// Every length is in cqw of the stage: 1280 px = 100cqw.
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import dawn from '../story-revamp/art/bg-station-dawn.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import { color, font, hoverColor, menuColor, shade, type Box, type Fill, type Paint, type Theme } from './themes.ts';

export type Sample = { state: 'idle' | 'hover' | 'selected' | 'disabled'; line: 'short' | 'long'; titleBg: 'menu' | 'picture'; scene: 'night' | 'dawn'; gameTitle: string };
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
  if (opts.pad !== false && x.pad !== 'stock') { const [l, top, r, b] = x.pad; parts.push(`padding:${u(top)} ${u(r)} ${u(b)} ${u(l)}`); }
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
  const sceneBg = `<div class="gt-bg" style="background-image:url(${s.scene === 'dawn' ? dawn : platform})"></div><img class="gt-sprite" src="${mara}" alt="">`;
  const lines = { short: "The last tram doesn't stop here.", long: "The last tram doesn't stop here. It slows at the signal, and if the driver knows your face he opens the rear door. You step on while it is still moving, and nobody on board looks up." };

  function say(text: string, speaker: string | null) {
    const g = t.groups.say;
    const boxStyle = g === 'stock'
      // textbox.png: black at 80 %, fading to nothing over 268 px at each side and 5 px at the top (gui7/images.py L175-196).
      ? `background:linear-gradient(to right, transparent, ${rgba(t.panel, 80)} ${u(268)}, ${rgba(t.panel, 80)} calc(100% - ${u(268)}), transparent);-webkit-mask:linear-gradient(transparent, #000 ${u(5)})`
      : boxCss(t, g, undefined, { pad: false });
    const nb = t.groups.namebox;
    const name = speaker ? `<div class="gt-name" style="font-family:${font(t, T.name.font).css};font-size:${u(T.name.size)};color:#f0b35b;${nb === 'none' ? `padding:${u(5)}` : boxCss(t, nb)}">${speaker}</div>` : '';
    // Quick buttons: idle gui.idle_small_color; hover follows the Button hover (gui.rpy L194-195).
    const quick = ['Back', 'History', 'Skip', 'Auto', 'Save', 'Q.Save', 'Q.Load', 'Prefs'].map((label, i) => `<span style="color:${i === 1 && s.state === 'hover' ? hoverColor(t, t.groups.quick.hover) : color(t, t.groups.quick.idle)}">${label}</span>`).join('');
    return `<div class="gt-say" style="${boxStyle}"></div>${name}<div class="gt-dialogue" style="${textCss(t, T.dialogue.font, T.dialogue.size, T.dialogue.color)}">${text}</div><div class="gt-quick" style="${iface(14)}">${quick}</div>`;
  }
  /** The stock game menu: the Menu background, the screen frame, the navigation, the title and Return. */
  function gameMenu(title: string, current: string, body: string) {
    const nav = ['History', 'Save', 'Load', 'Preferences', 'Main Menu', 'About', 'Help', 'Quit'];
    const line = t.groups.accentLine ? `<i class="gt-accent-line" style="background:${t.accent};top:${u(120)};height:${u(570)}"></i>` : '';
    // The Screen frame: game_menu_outer_frame, the full-screen overlay picture at Panel 80 % (gui7/images.py L301-304).
    const frame = t.groups.screenFrame === 'stock' ? `background:${rgba(t.panel, 80)}` : boxCss(t, t.groups.screenFrame, undefined, { pad: false });
    return `<div class="gt-bg" style="background:${menuColor(t)}"></div><div class="gt-frame" style="${frame}"></div>${line}
      <div class="gt-navcol"><div class="gt-nav">${nav.map((label, i) => button(label, label === current ? 'selected' : i === 0 ? s.state : 'idle')).join('')}</div><div class="gt-return">${button('Return')}</div></div>
      <div class="gt-menu-title" style="${textCss(t, T.heading.font, 50, T.heading.color)}">${title}</div>
      <div class="gt-menu-body">${body}</div>`;
  }
  const screens: Record<ScreenId, () => string> = {
    title: () => {
      const bg = s.titleBg === 'picture' ? `background-image:url(${dawn})` : `background:${menuColor(t)}`;
      // The Menu panel: main_menu_frame, 280 px wide, panel color at 80 % with a 3 px accent line (gui7/images.py L282-293).
      const box = t.groups.menuPanel === 'stock' ? `background:${rgba(t.panel, 80)}` : boxCss(t, t.groups.menuPanel, undefined, { pad: false });
      const line = t.groups.accentLine ? `<i class="gt-accent-line" style="background:${t.accent};top:0;height:100%"></i>` : '';
      const nav = ['Start', 'Load', 'Preferences', 'About', 'Help', 'Quit'];
      return `<div class="gt-bg" style="${bg}"></div><div class="gt-mmframe" style="${box}"></div>${line}
        <div class="gt-navcol"><div class="gt-nav">${nav.map((label, i) => button(label, i === 0 ? s.state : 'idle')).join('')}</div></div>
        <div class="gt-mmtitle"><b style="${textCss(t, T.title.font, T.title.size, T.title.color)}">${esc(s.gameTitle)}</b><small style="${iface()};color:${color(t, T.version)}">1.0</small></div>`;
    },
    say: () => `${sceneBg}${say(lines[s.line], 'Mara')}`,
    choice: () => {
      const g = t.groups.choice;
      const items = ['Ask about the last tram', 'Wait for the next service', 'Leave'];
      const one = (text: string, i: number) => {
        const hover = i === 0 && s.state === 'hover';
        const c = hover ? hoverColor(t, g.text.hover) : color(t, g.text.idle);
        // Stock choice_idle_background: black at 80 %; hover: accent at 95 %; both fade over 100 px at each side (L215-237).
        const box = g.box === 'stock'
          ? `background:linear-gradient(to right, transparent, ${hover ? rgba(t.accent, 95) : rgba(t.panel, 80)} ${u(100)}, ${hover ? rgba(t.accent, 95) : rgba(t.panel, 80)} calc(100% - ${u(100)}), transparent);padding:${u(5)} ${u(100)}`
          : g.box === 'none' ? `padding:${u(5)} ${u(100)}` : boxCss(t, g.box, hover ? g.hoverBox : undefined);
        return `<div class="gt-choice" style="${textCss(t, T.dialogue.font, T.dialogue.size, T.dialogue.color)};color:${c};${box};${motion(hover ? 'hover' : 'idle')}">${text}</div>`;
      };
      return `${sceneBg}<div class="gt-choices" style="gap:${u(22)}">${items.map(one).join('')}</div>${say('What should I do?', null)}`;
    },
    save: () => {
      // Stock file_slots (screens.rpy L602-690): the page name at the top, a 3 x 2 grid of 276 x 206 slots centered in the whole
      // content area with 10 px spacing, and pages < A Q 1-9 > at the bottom. Page buttons keep their stock padding, 10 4 10 4.
      const g = t.groups.slot;
      const slot = (i: number) => {
        const used = i < 2;
        // Stock slot_idle_background: the muted accent behind the thumbnail (00gui.rpy L631-637). A drawn slot box replaces that picture.
        const thumb = used ? `background-image:url(${i ? dawn : platform})` : g === 'stock' ? `background:${shade(t.accent, 0.4)}` : '';
        return `<div class="gt-slot" style="${g === 'stock' ? `padding:${u(10)}` : boxCss(t, g)}"><div class="gt-thumb" style="${thumb}"></div><span style="${iface(14)};color:${color(t, t.groups.slotText)}">${used ? `Saturday, November 14 2026, 23:4${i}` : 'empty slot'}</span></div>`;
      };
      const pages = ['&lt;', 'A', 'Q', ...Array.from({ length: 9 }, (_, i) => String(i + 1)), '&gt;'].map(label => button(label, label === '1' ? 'selected' : 'idle', `;padding:${u(4)} ${u(10)}`)).join('');
      return gameMenu('Save', 'Save', `<div class="gt-save"><div class="gt-page-name" style="${textCss(t, T.heading.font, T.heading.size, T.heading.color)}">Page 1</div><div class="gt-slots">${Array.from({ length: 6 }, (_, i) => slot(i)).join('')}</div><div class="gt-pages">${pages}</div></div>`);
    },
    prefs: () => {
      // Stock preferences (screens.rpy L725-800): Display and Skip, then the sliders, Voice Volume and Mute All.
      const label = (text: string) => `<div class="gt-pref-label" style="${textCss(t, T.heading.font, T.heading.size, T.heading.color)}">${text}</div>`;
      // The mark: radio_selected_foreground, a 5 px bar; an unselected option's foreground is empty (00gui.rpy L575-592).
      // Option buttons keep their stock padding, gui.radio_button_borders and check_button_borders = 18 4 4 4; the mark sits inside it.
      const opt = (text: string, on: boolean) => button(`${on ? `<i class="gt-mark" style="background:${color(t, t.groups.mark)}"></i>` : ''}${text}`, on ? 'selected' : 'idle', `;position:relative;padding:${u(4)} ${u(4)} ${u(4)} ${u(18)}`);
      const r = t.bar.corners >= 99 ? '999px' : u(t.bar.corners);
      const stock = t.id === 'renpy';
      const bar = (text: string, v: number) => `${label(text)}<div class="gt-bar" style="background:${stock ? shade(t.accent, 0.4) : color(t, t.bar.track)};border-radius:${r}">${stock ? '' : `<i class="gt-bar-fill" style="width:${v}%;background:${color(t, t.bar.filled)};border-radius:${r}"></i>`}<i class="gt-thumb-mark" style="left:calc(${v}% - ${u(5)});background:${stock ? t.accent : color(t, t.bar.thumb)};border-radius:${r}"></i></div>`;
      return gameMenu('Preferences', 'Preferences', `<div class="gt-prefs">
        <div>${label('Display')}${opt('Window', true)}${opt('Fullscreen', false)}</div>
        <div>${label('Skip')}${opt('Unseen Text', false)}${opt('After Choices', true)}${opt('Transitions', false)}</div>
      </div><div class="gt-bars"><div>${bar('Text Speed', 62)}${bar('Auto-Forward Time', 35)}</div><div>${bar('Music Volume', 80)}${bar('Sound Volume', 70)}${bar('Voice Volume', 70)}<div class="gt-mute">${opt('Mute All', false)}</div></div></div>`);
    },
    confirm: () => {
      // The dim is the picture gui/overlay/confirm.png (screens.rpy L1158), black at 60 %, drawn once by the generator.
      // It is not a box, so no theme changes it.
      // Stock frame.png: a 3 px accent border around an opaque panel fill (gui7/images.py L317-326).
      // The Confirm prompt group keeps its stock padding, gui.confirm_frame_borders = 40 (gui.rpy L291).
      const frame = t.box.fill === 'stock' ? `background:${t.panel};box-shadow:inset 0 0 0 ${u(3)} ${t.accent};padding:${u(40)}` : boxCss(t, { ...t.box, pad: [40, 40, 40, 40] });
      return `${sceneBg}${say(lines.short, 'Mara')}<div class="gt-dim" style="background:${rgba('#000000', 60)}"></div>
        <div class="gt-confirm" style="${frame}"><p style="${iface()};color:${color(t, I.color)}">Are you sure you want to quit?</p><div>${button('Yes', s.state)}${button('No')}</div></div>`;
    },
  };
  return `<div class="gt">${screens[id]()}</div>`;
}
