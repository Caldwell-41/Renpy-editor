export type AssetKind = 'background' | 'characterAppearance' | 'music' | 'sfx';
export interface SampleAsset { id: string; name: string; token: string; kind: AssetKind; art: number; status: 'available' | 'missing' | 'compatibilityRequired'; size: string; detail: string; character?: string; expression?: string }
export const kinds: [AssetKind, string][] = [['background', 'Backgrounds'], ['characterAppearance', 'Character images'], ['music', 'Music'], ['sfx', 'Sound effects']];
export const kindName = (kind: AssetKind) => ({ background: 'Background', characterAppearance: 'Character image', music: 'Music', sfx: 'Sound effect' })[kind];
export const fileName = (a: SampleAsset) => `${a.token}.${a.kind === 'music' || a.kind === 'sfx' ? 'ogg' : 'png'}`;
export const pathName = (a: SampleAsset) => `game/${a.kind === 'music' || a.kind === 'sfx' ? 'audio' : 'images'}/${fileName(a)}`;
export function assets(state: string): SampleAsset[] {
  if (state === 'empty') return [];
  const list: SampleAsset[] = [
    { id: 'platform', name: 'Platform at dusk', token: 'platform_dusk', kind: 'background', art: 0, status: 'available', size: '1.8 MB', detail: '1920 × 1080 · PNG' },
    { id: 'bookshop', name: 'After-hours bookshop', token: 'bookshop', kind: 'background', art: 1, status: 'available', size: '2.1 MB', detail: '1920 × 1080 · PNG' },
    { id: 'rain', name: 'Rain on the windows', token: 'tram_rain', kind: 'background', art: 2, status: 'missing', size: '1.2 MB', detail: '1920 × 1080 · PNG' },
    { id: 'mira', name: 'Mira · thoughtful', token: 'mira_thoughtful', kind: 'characterAppearance', art: 3, status: 'available', size: '680 KB', detail: '900 × 1400 · PNG', character: 'Mira', expression: 'thoughtful' },
    { id: 'eli', name: 'Eli · neutral', token: 'eli_neutral', kind: 'characterAppearance', art: 4, status: 'available', size: '720 KB', detail: '900 × 1400 · PNG', character: 'Eli', expression: 'neutral' },
    { id: 'theme', name: 'The last departure', token: 'last_departure', kind: 'music', art: 5, status: 'available', size: '3.4 MB', detail: '2:46 · OGG · Stereo' },
    { id: 'bell', name: 'Tram bell', token: 'tram_bell', kind: 'sfx', art: 6, status: 'compatibilityRequired', size: '84 KB', detail: '0:03 · OGG · Stereo' },
  ];
  if (state === 'long') for (let i = 0; i < 36; i++) list.push({ ...list[i % 7]!, id: `extra-${i}`, name: `${list[i % 7]!.name} · ${i + 2}`, token: `sample_${i}`, status: 'available' });
  if (state === 'error') list[0]!.status = 'missing';
  return list;
}
export function sampleChoices(): SampleAsset[] {
  return [
    { id: 'new-bridge', name: 'Footbridge at sunrise', token: 'footbridge', kind: 'background', art: 7, status: 'available', size: '1.5 MB', detail: '1920 × 1080 · PNG' },
    { id: 'new-mira', name: 'Mira · smiling', token: 'mira_smile', kind: 'characterAppearance', character: 'Mira', expression: 'smile', art: 3, status: 'available', size: '540 KB', detail: '900 × 1400 · PNG' },
    { id: 'new-music', name: 'First light', token: 'first_light', kind: 'music', art: 5, status: 'available', size: '2.8 MB', detail: '2:10 · OGG · Stereo' },
    { id: 'new-sfx', name: 'Paper ticket', token: 'paper_ticket', kind: 'sfx', art: 6, status: 'available', size: '32 KB', detail: '0:01 · OGG · Stereo' },
  ];
}

// All pictures are inline fictional SVGs. No file, network or media reads occur.
export function artwork(a: SampleAsset): string {
  const palettes = [['#303645', '#b48d9a', '#252e3b'], ['#3a423e', '#bbaa79', '#252f2f'], ['#344655', '#8ea5aa', '#253747'], ['#3e4054', '#c4aaa0', '#5e6687'], ['#384951', '#adbbb0', '#65867d'], ['#3c4057', '#a8a3cb', '#34384c'], ['#42463d', '#c4be97', '#323d36'], ['#435462', '#e2c6aa', '#68818b']];
  const p = palettes[a.art % palettes.length]!;
  let scene = `<path d="M0 250 130 105 240 250 370 135 600 285V360H0" fill="${p[2]}"/><path d="M0 300 600 260V360H0" fill="${p[0]}"/><path d="M0 320 600 290M0 334 600 300" stroke="${p[1]}" opacity=".35"/>`;
  if (a.kind === 'characterAppearance') scene = `<path d="M190 360 218 218Q300 180 382 218L414 360" fill="${p[2]}"/><ellipse cx="300" cy="149" rx="65" ry="80" fill="${p[1]}"/><path d="M233 153Q210 35 300 46Q385 38 371 158L350 106 270 100Z" fill="${p[0]}"/><path d="M276 151h8m32 0h8m-29 31q12 6 23 0" fill="none" stroke="${p[0]}" stroke-width="4"/><path d="m277 220 23 32 26-32" fill="none" stroke="${p[1]}" stroke-width="3"/>`;
  else if (a.kind === 'music' || a.kind === 'sfx') scene = Array.from({ length: 47 }, (_, i) => { const h = 14 + Math.abs(Math.sin(i * 1.71 + a.art)) * 100 * Math.sin((i + 1) / 48 * Math.PI); return `<rect x="${62 + i * 10}" y="${180 - h / 2}" width="4" height="${h}" rx="2" fill="${p[1]}" opacity="${.35 + (i % 4) * .16}"/>`; }).join('');
  else if (a.art % 3 === 1) scene = `<path d="M100 75h400v285H100z" fill="${p[2]}"/><path d="M142 110h126v110H142zm190 0h126v110H332z" fill="${p[1]}" opacity=".6"/><path d="M128 244h344M128 282h344M284 360V103" stroke="${p[0]}" stroke-width="12"/><path d="M143 233v-60m20 60v-42m23 42v-50m159 50v-67m22 67v-45m23 45v-64m25 64v-42" stroke="${p[1]}" stroke-width="14"/><path d="M80 360h440" stroke="${p[1]}" stroke-width="5"/>`;
  else scene += `<path d="M60 262V105h250v157M58 113h257M90 120v139M285 120v139" stroke="${p[1]}" fill="none" stroke-width="5" opacity=".65"/><path d="M79 235h214M90 235v29m193-29v28" stroke="${p[1]}" stroke-width="8"/>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="600" height="360" fill="url(#sky)"/><circle cx="463" cy="83" r="29" fill="${p[1]}" opacity=".8"/>${scene}</svg>`)}`;
}
