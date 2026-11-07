// Fictional sample art for the combined Story mock. See art/README.md.
import rainyPlatform from './art/bg-rainy-platform.webp';
import stationDawn from './art/bg-station-dawn.webp';
import tramInterior from './art/bg-tram-interior.webp';
import maraNeutral from './art/mara-neutral.webp';
import maraConcerned from './art/mara-concerned.webp';
import maraSmile from './art/mara-smile.webp';
import maraSurprised from './art/mara-surprised.webp';
import eliNeutral from './art/eli-neutral.webp';
import eliConcerned from './art/eli-concerned.webp';
import eliSmile from './art/eli-smile.webp';
import eliSurprised from './art/eli-surprised.webp';

export const backgrounds: Record<string, string> = { 'Rainy platform': rainyPlatform, 'Station at dawn': stationDawn, 'Tram interior': tramInterior };
/** Sample key art for scenes that open without their own background. The app would show the background in effect when the scene starts. */
export const sceneArt: Record<string, string> = { stranger: 'Tram interior', departure: 'Station at dawn' };
export const expressions = ['Neutral', 'Concerned', 'Smile', 'Surprised'] as const;
export const characters = ['Mara', 'Eli'] as const;
export const sprites: Record<string, Record<string, string>> = {
  Mara: { Neutral: maraNeutral, Concerned: maraConcerned, Smile: maraSmile, Surprised: maraSurprised },
  Eli: { Neutral: eliNeutral, Concerned: eliConcerned, Smile: eliSmile, Surprised: eliSurprised },
};
export const music = ['Night service', 'Last departure'] as const;
export const sounds = ['Tram bell', 'Footsteps'] as const;

export function sprite(name: string, expression = 'Neutral') { return sprites[name]?.[expression] ?? sprites[name]?.Neutral ?? maraNeutral; }
/** Character colours come from each project's Character(color=...) definition. */
export function characterColour(name: string) { return name === 'Eli' ? 'var(--sc-char-eli)' : name === 'Mara' ? 'var(--sc-char-mara)' : 'var(--text-secondary)'; }
