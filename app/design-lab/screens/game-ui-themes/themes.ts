// PROTOTYPE for #215 (Choose the Loomlight themes and their fonts). Throwaway; lives on prototype/game-ui-themes.
// Candidate themes as values of the settings that #210 chose for the Game-wide look and the stock look groups.
// Sizes are pixels of a 1280 x 720 project, before Loomlight scales them. "=accent" and the like mean "follows".

/** A color with an opacity in percent. A string starting with "=" follows another setting. */
export type Paint = { c: string; a: number };
export type Fill = 'stock' | 'none' | Paint | { from: Paint; to: Paint; dir: 'down' | 'right' };
export type Shadow = { c: Paint; blur: number; x: number; y: number };
export type Box = { fill: Fill; corners: number; border: { w: number; c: Paint } | null; /** Left, Top, Right, Bottom, or 'stock' where the theme keeps the stock padding. */
  pad: [l: number, t: number, r: number, b: number] | 'stock'; shadow: Shadow | null };
export type TextType = { font: string; size: number; color: string };
export type States = { idle: string; hover: string; selected: string; disabled: string };
export type Motion = 'None' | 'Dissolve';

export type Theme = {
  id: string; name: string; suits: string;
  accent: string; panel: string; menu: string;
  text: { dialogue: TextType; interface: TextType; name: { font: string; size: number }; heading: TextType; title: TextType; version: string };
  button: { text: States; box: Box | 'none'; hoverBox?: Partial<Box>; hover: 'None' | 'Grow' | 'Brighten' };
  box: Box;
  bar: { track: string; filled: string; thumb: string; corners: number };
  motion: { gameMenu: Motion; betweenMenus: Motion; dialogueBox: Motion; confirm: Motion };
  /** Stock look groups that the theme gives an own value. Every other group follows the game-wide look. */
  groups: {
    say: Box | 'stock'; namebox: Box | 'none';
    choice: { text: { idle: string; hover: string }; box: Box | 'stock' | 'none'; hoverBox?: Partial<Box> };
    quick: { idle: string; hover: string };
    slot: Box | 'stock'; slotText: string; mark: string; accentLine: boolean;
    /** The title screen's 280 px panel and the menu screens' full-screen frame. */
    menuPanel: Box | 'stock'; screenFrame: Box | 'stock';
  };
};

const p = (c: string, a = 100): Paint => ({ c, a });
const pad = (x: number, y: number): [number, number, number, number] => [x, y, x, y];
/** The menu panel and the screen frame keep the stock look: Panel at 80 %, no corners. */
const panel80 = (border: Box['border'] = null, shadow: Shadow | null = null): Box => ({ fill: p('=panel', 80), corners: 0, border, pad: 'stock', shadow });

export const themes: readonly Theme[] = [
  {
    id: 'renpy', name: "Ren'Py default", suits: 'The look of every new Ren\'Py project and of the Ren\'Py tutorials.',
    accent: '#00b8c3', panel: '#000000', menu: '=accent',
    text: {
      dialogue: { font: 'dejavu', size: 22, color: '#ffffff' },
      interface: { font: 'dejavu', size: 22, color: '#ffffff' },
      name: { font: 'dejavu', size: 30 },
      heading: { font: '=interface', size: 24, color: '=accent' },
      title: { font: '=interface', size: 50, color: '=accent' },
      version: '=accent',
    },
    button: { text: { idle: '#888888', hover: '=accent', selected: '#ffffff', disabled: '#88888880' }, box: 'none', hover: 'None' },
    box: { fill: 'stock', corners: 0, border: null, pad: pad(4, 4), shadow: null },
    bar: { track: '=accent', filled: '=accent', thumb: '=accent', corners: 0 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'Dissolve', dialogueBox: 'Dissolve', confirm: 'None' },
    groups: {
      say: 'stock', namebox: 'none',
      choice: { text: { idle: '#888888', hover: '#ffffff' }, box: 'stock' },
      quick: { idle: '#aaaaaa', hover: '=accent' },
      slot: 'stock', slotText: '#aaaaaa', mark: '=accent', accentLine: true, menuPanel: 'stock', screenFrame: 'stock',
    },
  },
  {
    id: 'lantern', name: 'Lantern', suits: 'Warm serif type and amber lines. Period drama, romance, fantasy.',
    accent: '#e3a857', panel: '#1b120c', menu: '#1f150e',
    text: {
      dialogue: { font: 'lora', size: 23, color: '#f4ebdc' },
      interface: { font: 'lora', size: 21, color: '#e6d8c2' },
      name: { font: 'ebgaramond', size: 32 },
      heading: { font: 'ebgaramond', size: 30, color: '=accent' },
      title: { font: 'ebgaramond', size: 68, color: '#f6dfb0' },
      version: '=accent',
    },
    button: { text: { idle: '#a89478', hover: '=accent', selected: '#fff4de', disabled: '#5e5244' }, box: 'none', hover: 'Brighten' },
    box: { fill: p('=panel', 92), corners: 10, border: { w: 1, c: p('=accent', 50) }, pad: pad(28, 18), shadow: { c: p('#000000', 55), blur: 20, x: 0, y: 6 } },
    bar: { track: '#3b2a1b', filled: '=accent', thumb: '#f6dfb0', corners: 3 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'Dissolve', dialogueBox: 'Dissolve', confirm: 'Dissolve' },
    groups: {
      say: { fill: { from: p('=panel', 78), to: p('=panel', 96), dir: 'down' }, corners: 0, border: { w: 1, c: p('=accent', 45) }, pad: 'stock', shadow: null },
      namebox: 'none',
      choice: { text: { idle: '#e6d8c2', hover: '#fff4de' }, box: { fill: p('=panel', 88), corners: 10, border: { w: 1, c: p('=accent', 40) }, pad: pad(24, 8), shadow: { c: p('#000000', 45), blur: 14, x: 0, y: 4 } }, hoverBox: { fill: p('#5a3c1c', 92), border: { w: 1, c: p('=accent', 95) } } },
      quick: { idle: '#a89478', hover: '=accent' },
      slot: { fill: p('=panel', 70), corners: 6, border: { w: 1, c: p('=accent', 30) }, pad: pad(10, 10), shadow: null }, mark: '=accent', accentLine: true, slotText: '#a89478', menuPanel: panel80({ w: 1, c: p('=accent', 50) }, { c: p('#000000', 55), blur: 20, x: 0, y: 6 }), screenFrame: panel80(),
    },
  },
  {
    id: 'harbor', name: 'Harbor', suits: 'Soft rounded type in calm blues. Slice of life, modern stories.',
    accent: '#6cc6de', panel: '#0e2836', menu: '#0a1d28',
    text: {
      dialogue: { font: 'nunito', size: 23, color: '#eef7fa' },
      interface: { font: 'nunito', size: 21, color: '#cfe3ea' },
      name: { font: 'nunito', size: 30 },
      heading: { font: '=interface', size: 26, color: '=accent' },
      title: { font: '=interface', size: 64, color: '#ffffff' },
      version: '=accent',
    },
    button: { text: { idle: '#93afbd', hover: '#ffffff', selected: '#ffffff', disabled: '#4b6573' }, box: { fill: p('#ffffff', 6), corners: 99, border: null, pad: pad(18, 6), shadow: null }, hoverBox: { fill: p('=accent', 34) }, hover: 'Grow' },
    box: { fill: p('=panel', 90), corners: 18, border: null, pad: pad(30, 20), shadow: { c: p('#000000', 35), blur: 28, x: 0, y: 10 } },
    bar: { track: '#24485a', filled: '=accent', thumb: '#ffffff', corners: 99 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'Dissolve', dialogueBox: 'Dissolve', confirm: 'Dissolve' },
    groups: {
      say: { fill: { from: p('=panel', 0), to: p('=panel', 94), dir: 'down' }, corners: 0, border: null, pad: 'stock', shadow: null },
      namebox: 'none',
      choice: { text: { idle: '#eef7fa', hover: '#ffffff' }, box: { fill: p('=panel', 80), corners: 99, border: null, pad: pad(24, 8), shadow: { c: p('#000000', 30), blur: 18, x: 0, y: 6 } }, hoverBox: { fill: p('#2f7f96', 95) } },
      quick: { idle: '#93afbd', hover: '#ffffff' },
      slot: { fill: p('#ffffff', 5), corners: 12, border: null, pad: pad(10, 10), shadow: null }, mark: '=accent', accentLine: false, slotText: '#93afbd', menuPanel: panel80(null, { c: p('#000000', 35), blur: 28, x: 0, y: 10 }), screenFrame: panel80(),
    },
  },
  {
    id: 'paper', name: 'Paper', suits: 'A light page with ink lines. Mystery, literary fiction, school stories.',
    accent: '#a8432f', panel: '#f3ebdb', menu: '#e8dec9',
    text: {
      dialogue: { font: 'crimsonpro', size: 25, color: '#2a2420' },
      interface: { font: 'crimsonpro', size: 22, color: '#3b332c' },
      name: { font: 'ebgaramond', size: 31 },
      heading: { font: 'ebgaramond', size: 30, color: '=accent' },
      title: { font: 'ebgaramond', size: 66, color: '#2a2420' },
      version: '#9a3c2a',
    },
    button: { text: { idle: '#6a5e52', hover: '#a8432f', selected: '#2a2420', disabled: '#b9ad9d' }, box: 'none', hover: 'None' },
    box: { fill: p('=panel', 98), corners: 2, border: { w: 2, c: p('#2a2420') }, pad: pad(30, 18), shadow: { c: p('#2a2420', 22), blur: 0, x: 5, y: 5 } },
    bar: { track: '#d6c9b2', filled: '#2a2420', thumb: '=accent', corners: 0 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'None', dialogueBox: 'Dissolve', confirm: 'None' },
    groups: {
      say: { fill: p('=panel', 97), corners: 0, border: { w: 2, c: p('#2a2420') }, pad: 'stock', shadow: null },
      namebox: { fill: p('#2a2420', 100), corners: 2, border: null, pad: pad(12, 2), shadow: null },
      choice: { text: { idle: '#2a2420', hover: '#f3ebdb' }, box: { fill: p('=panel', 98), corners: 2, border: { w: 2, c: p('#2a2420') }, pad: pad(24, 8), shadow: { c: p('#2a2420', 22), blur: 0, x: 4, y: 4 } }, hoverBox: { fill: p('=accent', 100), border: { w: 2, c: p('#2a2420') } } },
      quick: { idle: '#6a5e52', hover: '#a8432f' },
      slot: { fill: p('#ffffff', 55), corners: 2, border: { w: 1, c: p('#2a2420', 40) }, pad: pad(10, 10), shadow: null }, mark: '=accent', accentLine: true, slotText: '#6a5e52', menuPanel: panel80({ w: 2, c: p('#2a2420') }, { c: p('#2a2420', 22), blur: 0, x: 5, y: 5 }), screenFrame: panel80(),
    },
  },
  {
    id: 'signal', name: 'Signal', suits: 'Neon lines on night glass. Science fiction, cyberpunk, tech thrillers.',
    accent: '#ff4f9a', panel: '#090c18', menu: '#070912',
    text: {
      dialogue: { font: 'spacegrotesk', size: 22, color: '#e7ecff' },
      interface: { font: 'oxanium', size: 21, color: '#b8c1e8' },
      name: { font: 'oxanium', size: 28 },
      heading: { font: '=interface', size: 26, color: '=accent' },
      title: { font: '=interface', size: 72, color: '#ffffff' },
      version: '=accent',
    },
    button: { text: { idle: '#8790b6', hover: '#ffffff', selected: '#ffffff', disabled: '#3b4163' }, box: { fill: p('=panel', 0), corners: 0, border: { w: 1, c: p('#8790b6', 30) }, pad: pad(16, 6), shadow: null }, hoverBox: { border: { w: 1, c: p('=accent') }, shadow: { c: p('=accent', 70), blur: 14, x: 0, y: 0 } }, hover: 'Brighten' },
    box: { fill: p('=panel', 88), corners: 0, border: { w: 1, c: p('=accent', 55) }, pad: pad(28, 16), shadow: { c: p('=accent', 30), blur: 24, x: 0, y: 0 } },
    bar: { track: '#1b2040', filled: '=accent', thumb: '#ffffff', corners: 0 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'None', dialogueBox: 'Dissolve', confirm: 'None' },
    groups: {
      say: { fill: { from: p('=panel', 80), to: p('#1a0d2a', 94), dir: 'down' }, corners: 0, border: { w: 1, c: p('=accent', 60) }, pad: 'stock', shadow: { c: p('=accent', 35), blur: 24, x: 0, y: 0 } },
      namebox: 'none',
      choice: { text: { idle: '#b8c1e8', hover: '#ffffff' }, box: { fill: p('=panel', 85), corners: 0, border: { w: 1, c: p('=accent', 40) }, pad: pad(24, 8), shadow: null }, hoverBox: { fill: p('#3a1030', 92), border: { w: 1, c: p('=accent') }, shadow: { c: p('=accent', 70), blur: 16, x: 0, y: 0 } } },
      quick: { idle: '#8790b6', hover: '#ff4f9a' },
      slot: { fill: p('=panel', 70), corners: 0, border: { w: 1, c: p('=accent', 30) }, pad: pad(10, 10), shadow: null }, mark: '=accent', accentLine: true, slotText: '#8790b6', menuPanel: panel80({ w: 1, c: p('=accent', 55) }, { c: p('=accent', 30), blur: 24, x: 0, y: 0 }), screenFrame: panel80(),
    },
  },
  {
    id: 'hollow', name: 'Hollow', suits: 'Typewriter text that fades out of the dark. Horror, thrillers, found-document stories.',
    accent: '#b8281f', panel: '#050404', menu: '#0b0606',
    text: {
      dialogue: { font: 'courierprime', size: 22, color: '#dcd4c7' },
      interface: { font: 'imfell', size: 23, color: '#b3a897' },
      name: { font: 'imfell', size: 32 },
      heading: { font: '=interface', size: 30, color: '=accent' },
      title: { font: '=interface', size: 80, color: '#e6ddd0' },
      version: '#e0483c',
    },
    button: { text: { idle: '#7b7166', hover: '#e0483c', selected: '#e6ddd0', disabled: '#3a342e' }, box: 'none', hover: 'None' },
    box: { fill: p('=panel', 94), corners: 0, border: { w: 1, c: p('#3a2a26') }, pad: pad(28, 18), shadow: null },
    bar: { track: '#2a1a17', filled: '=accent', thumb: '#dcd4c7', corners: 0 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'Dissolve', dialogueBox: 'Dissolve', confirm: 'Dissolve' },
    groups: {
      say: { fill: { from: p('=panel', 0), to: p('=panel', 96), dir: 'down' }, corners: 0, border: null, pad: 'stock', shadow: null },
      namebox: 'none',
      choice: { text: { idle: '#b3a897', hover: '#e0483c' }, box: { fill: p('=panel', 72), corners: 0, border: null, pad: pad(24, 6), shadow: null }, hoverBox: { fill: p('=panel', 92) } },
      quick: { idle: '#857b6f', hover: '#e0483c' },
      slot: { fill: p('=panel', 60), corners: 0, border: { w: 1, c: p('#3a2a26') }, pad: pad(10, 10), shadow: null }, mark: '=accent', accentLine: false, slotText: '#857b6f', menuPanel: panel80({ w: 1, c: p('#3a2a26') }), screenFrame: panel80(),
    },
  },
  {
    id: 'sweet', name: 'Sweet', suits: 'Round bubbly type and sticker shadows. Comedy, romance, dating stories.',
    accent: '#c2255c', panel: '#ffffff', menu: '#ffe6ef',
    text: {
      dialogue: { font: 'nunito', size: 23, color: '#4b3450' },
      interface: { font: 'fredoka', size: 22, color: '#5d4263' },
      name: { font: 'fredoka', size: 30 },
      heading: { font: '=interface', size: 28, color: '=accent' },
      title: { font: '=interface', size: 76, color: '=accent' },
      version: '=accent',
    },
    button: { text: { idle: '#7d6383', hover: '#ffffff', selected: '#4b3450', disabled: '#cdbcd0' }, box: { fill: p('#ffffff', 92), corners: 99, border: { w: 2, c: p('#ffd1e1') }, pad: pad(20, 6), shadow: { c: p('=accent', 35), blur: 0, x: 0, y: 4 } }, hoverBox: { fill: p('=accent') }, hover: 'Grow' },
    box: { fill: p('=panel', 96), corners: 26, border: { w: 3, c: p('#ffd1e1') }, pad: pad(32, 18), shadow: { c: p('=accent', 30), blur: 0, x: 0, y: 6 } },
    bar: { track: '#ffd1e1', filled: '=accent', thumb: '#241528', corners: 99 },
    motion: { gameMenu: 'Dissolve', betweenMenus: 'Dissolve', dialogueBox: 'Dissolve', confirm: 'Dissolve' },
    groups: {
      say: { fill: p('=panel', 95), corners: 0, border: null, pad: 'stock', shadow: { c: p('=accent', 45), blur: 0, x: 0, y: -5 } },
      namebox: { fill: p('#4b3450', 100), corners: 99, border: null, pad: pad(16, 2), shadow: null },
      choice: { text: { idle: '#5d4263', hover: '#ffffff' }, box: { fill: p('#ffffff', 94), corners: 99, border: { w: 2, c: p('#ffd1e1') }, pad: pad(24, 8), shadow: { c: p('=accent', 35), blur: 0, x: 0, y: 5 } }, hoverBox: { fill: p('=accent') } },
      quick: { idle: '#7d6383', hover: '#c2255c' },
      slot: { fill: p('#ffffff', 80), corners: 16, border: { w: 2, c: p('#ffd1e1') }, pad: pad(10, 10), shadow: null }, mark: '=accent', accentLine: false, slotText: '#7d6383', menuPanel: panel80({ w: 3, c: p('#ffd1e1') }, { c: p('=accent', 30), blur: 0, x: 0, y: 6 }), screenFrame: panel80(),
    },
  },
];

/** The fonts Loomlight would ship. Facts read on 2026-11-23 from each family's OFL.txt and METADATA.pb in github.com/google/fonts (main). */
export type FontFact = { id: string; name: string; css: string; kind: string; files: string[]; kb: number; scripts: string; copyright: string; rfn?: string; italic: boolean };
export const fontFacts: readonly FontFact[] = [
  { id: 'lora', name: 'Lora', css: "'ll-lora'", kind: 'Serif for reading', files: ['Lora[wght].ttf', 'Lora-Italic[wght].ttf'], kb: 424, scripts: 'Latin, Cyrillic, Vietnamese', copyright: 'Copyright 2011 The Lora Project Authors', rfn: 'Lora', italic: true },
  { id: 'ebgaramond', name: 'EB Garamond', css: "'ll-ebgaramond'", kind: 'Classic book serif', files: ['EBGaramond[wght].ttf', 'EBGaramond-Italic[wght].ttf'], kb: 1568, scripts: 'Latin, Cyrillic, Greek, Vietnamese', copyright: 'Copyright 2017 The EB Garamond Project Authors', italic: true },
  { id: 'crimsonpro', name: 'Crimson Pro', css: "'ll-crimsonpro'", kind: 'Book serif', files: ['CrimsonPro[wght].ttf', 'CrimsonPro-Italic[wght].ttf'], kb: 488, scripts: 'Latin, Vietnamese', copyright: 'Copyright 2018 The Crimson Pro Project Authors', italic: true },
  { id: 'imfell', name: 'IM Fell English', css: "'ll-imfell'", kind: 'Old print serif', files: ['IMFeENrm28P.ttf', 'IMFeENit28P.ttf'], kb: 388, scripts: 'Latin', copyright: 'Copyright (c) 2010, Igino Marini', italic: true },
  { id: 'courierprime', name: 'Courier Prime', css: "'ll-courierprime'", kind: 'Typewriter', files: ['CourierPrime-Regular.ttf', 'CourierPrime-Bold.ttf', 'CourierPrime-Italic.ttf', 'CourierPrime-BoldItalic.ttf'], kb: 298, scripts: 'Latin', copyright: 'Copyright 2015 The Courier Prime Project Authors', italic: true },
  { id: 'nunito', name: 'Nunito', css: "'ll-nunito'", kind: 'Rounded sans', files: ['Nunito[wght].ttf', 'Nunito-Italic[wght].ttf'], kb: 546, scripts: 'Latin, Cyrillic, Vietnamese', copyright: 'Copyright 2014 The Nunito Project Authors', italic: true },
  { id: 'fredoka', name: 'Fredoka', css: "'ll-fredoka'", kind: 'Bubbly rounded', files: ['Fredoka[wdth,wght].ttf'], kb: 155, scripts: 'Latin, Hebrew', copyright: 'Copyright 2016 The Fredoka Project Authors', italic: false },
  { id: 'spacegrotesk', name: 'Space Grotesk', css: "'ll-spacegrotesk'", kind: 'Technical sans', files: ['SpaceGrotesk[wght].ttf'], kb: 133, scripts: 'Latin, Vietnamese', copyright: 'Copyright 2020 The Space Grotesk Project Authors', italic: false },
  { id: 'oxanium', name: 'Oxanium', css: "'ll-oxanium'", kind: 'Square display', files: ['Oxanium[wght].ttf'], kb: 43, scripts: 'Latin', copyright: 'Copyright 2019 The Oxanium Project Authors', italic: false },
  { id: 'atkinson', name: 'Atkinson Hyperlegible Next', css: "'ll-atkinson'", kind: 'Sans for low vision', files: ['AtkinsonHyperlegibleNext[wght].ttf', 'AtkinsonHyperlegibleNext-Italic[wght].ttf'], kb: 233, scripts: 'Latin', copyright: 'Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors', italic: true },
  { id: 'caveat', name: 'Caveat', css: "'ll-caveat'", kind: 'Handwriting', files: ['Caveat[wght].ttf'], kb: 394, scripts: 'Latin, Cyrillic', copyright: 'Copyright 2014 The Caveat Project Authors', italic: false },
];
/** Ren'Py's own font. It is in every project already, so Loomlight copies nothing. The mock loads the SDK's copy (renpy/common). */
export const dejavu: FontFact = { id: 'dejavu', name: 'DejaVu Sans', css: "'ll-dejavu'", kind: "Ren'Py's own font", files: [], kb: 0, scripts: 'Latin, Cyrillic, Greek and more', copyright: "Ships with Ren'Py", italic: false };
export const fontById: Record<string, FontFact> = Object.fromEntries([dejavu, ...fontFacts].map(f => [f.id, f]));

// ---- following ----

function hsvMenu(accent: string): string {
  // The generator's Menu background: the accent's hue with saturation 25 % and value 25 % (gui7/parameters.py L67).
  const n = parseInt(accent.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const v = 0.25, s = 0.25, c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [rr, gg, bb] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [rr, gg, bb].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
/** Ren'Py's Color.tint(.6): 60 % of the color and 40 % white. The stock hover color. */
export function tint(hex: string, f = 0.6) {
  const n = parseInt(hex.slice(1, 7), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f + 255 * (1 - f)).toString(16).padStart(2, '0')).join('');
}
export function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
}
/** Resolves a value that follows another setting. */
export function color(t: Theme, value: string): string {
  if (value === '=accent') return t.accent;
  if (value === '=panel') return t.panel;
  if (value === '=menu') return menuColor(t);
  return value;
}
export const menuColor = (t: Theme) => t.menu === '=accent' ? hsvMenu(t.accent) : t.menu;
/** A button's hover color that follows Accent is the stock formula, Color(gui.accent_color).tint(.6). */
export const hoverColor = (t: Theme, value: string) => value === '=accent' ? tint(t.accent) : color(t, value);
export function font(t: Theme, value: string): FontFact {
  return fontById[value === '=interface' ? t.text.interface.font : value]!;
}
export const textColor = (t: Theme, value: string) => color(t, value);
