// Throwaway Story UX study. All content and changes stay in memory.
export const kinds = [
  ['dialogue', 'Dialogue', 'Write'], ['narration', 'Narration', 'Write'],
  ['background', 'Background', 'Stage'], ['showCharacter', 'Show character', 'Stage'],
  ['hideCharacter', 'Hide character', 'Stage'], ['changeAppearance', 'Change appearance', 'Stage'],
  ['placement', 'Move character', 'Stage'], ['transition', 'Transition', 'Stage'],
  ['playMusic', 'Play music', 'Audio'], ['stopMusic', 'Stop music', 'Audio'], ['playSfx', 'Sound effect', 'Audio'],
  ['choice', 'Choice', 'Flow'], ['condition', 'Condition', 'Flow'], ['call', 'Call scene', 'Flow'],
  ['jump', 'Jump', 'Flow'], ['return', 'Return / end', 'Flow'], ['setVariable', 'Set variable', 'State'],
  ['showScreen', 'Show screen', 'Screens'], ['hideScreen', 'Hide screen', 'Screens'], ['callScreen', 'Call screen', 'Screens'],
] as const;
export type Kind = typeof kinds[number][0] | 'customCode';
export interface Option { text: string; target: string; guard: string }
export interface Branch { id: string; name: string; condition: string; beats: Beat[] }
export interface Beat {
  id: string; kind: Kind; text: string; speaker: string; asset: string; placement: string;
  target: string; value: string; transition: string; options: Option[]; branches: Branch[];
}
export interface Scene { id: string; name: string; chapter: string; beats: Beat[] }
export interface Target { scene: Scene; body: Beat[]; trail: string[]; index: number }
export function makeSample(state: string) {
  let sequence = 0;
  const beat = (kind: Kind, text = ''): Beat => ({
    id: `beat-${++sequence}`, kind, text, speaker: 'Mara', asset: kind === 'background' ? 'Rainy platform' : kind === 'playSfx' ? 'Tram bell' : 'Neutral',
    placement: 'Centre', target: 'stranger', value: 'true', transition: 'Dissolve',
    options: [{ text: 'Ask about the last tram', target: 'stranger', guard: '' }, { text: 'Wait for the next service', target: 'departure', guard: 'trust is at least 3' }], branches: [],
  });
  const conditional = beat('condition');
  const inner = beat('condition');
  inner.branches = [{ id: 'inner-if', name: 'If', condition: 'trust is at least 5', beats: [beat('dialogue', 'There is something I should tell you.')] }, { id: 'inner-else', name: 'Otherwise', condition: '', beats: [beat('narration', 'She folds the ticket and says nothing.')] }];
  conditional.branches = [{ id: 'ticket-if', name: 'If', condition: 'has_ticket is true', beats: [beat('dialogue', 'Keep your ticket. Some doors only open once.'), inner] }, { id: 'ticket-else', name: 'Otherwise', condition: '', beats: [beat('narration', 'An empty pocket. A familiar excuse.')] }];
  conditional.branches[0]!.beats[0]!.speaker = 'Eli';
  const scenes: Scene[] = [
    { id: 'arrival', name: 'The last service', chapter: 'After hours', beats: [beat('background'), beat('playMusic', 'Night service'), beat('showCharacter'), beat('narration', 'The timetable has not changed in thirty years. Tonight, someone has added a new stop.'), beat('dialogue', 'You heard the bell too? I thought I was the only one waiting.'), conditional, beat('call', 'A familiar stranger'), beat('choice')] },
    { id: 'stranger', name: 'A familiar stranger', chapter: 'After hours', beats: [beat('dialogue', 'The last service always comes back. The question is who comes back with it.'), beat('return')] },
    { id: 'departure', name: 'Departure', chapter: 'The return', beats: [beat('narration', 'The platform lights go out, one by one.'), beat('return')] },
  ];
  if (state === 'empty') scenes[0]!.beats = [beat('return')];
  return { scenes, beat, newId: () => `sample-${++sequence}` };
}
export function label(kind: Kind) { return kind === 'customCode' ? 'Protected source' : kinds.find(k => k[0] === kind)![1]; }
export function brief(b: Beat, scenes: Scene[] = []): string {
  if (b.kind === 'dialogue') return `${b.speaker}: ${b.text || 'Write dialogue…'}`;
  if (b.kind === 'narration') return b.text || 'Write narration…';
  if (b.kind === 'condition') return `If ${b.branches[0]?.condition ?? 'has_ticket is true'}`;
  if (b.kind === 'choice') return `${b.options.length} choices`;
  if (b.kind === 'call') return `${scenes.find(s => s.id === b.target)?.name ?? b.target} · returns to the next beat`;
  if (b.kind === 'jump') return `${scenes.find(s => s.id === b.target)?.name ?? b.target} · does not return`;
  if (b.kind === 'return') return 'Return to caller / end story';
  if (b.kind === 'customCode') return 'Custom Python · preview state unknown';
  if (b.kind === 'setVariable') return `${b.text || 'has_ticket'} = ${b.value}`;
  if (b.kind.endsWith('Screen')) return `${label(b.kind)} · ${b.asset === 'Neutral' ? 'Help' : b.asset}`;
  if (b.kind === 'playMusic') return b.text || 'Night service';
  if (b.kind === 'stopMusic') return 'Stop current music';
  if (b.kind === 'playSfx') return b.asset;
  if (b.kind === 'background') return `${b.asset} · ${b.transition}`;
  if (b.kind === 'transition') return b.transition;
  if (b.kind === 'hideCharacter') return b.speaker;
  if (b.kind === 'placement') return `${b.speaker} · ${b.placement}`;
  if (b.kind === 'changeAppearance') return `${b.speaker} · ${b.asset}`;
  return `${b.speaker} · ${b.asset} · ${b.placement}`;
}
export function locate(scene: Scene, id: string, body = scene.beats, trail = [scene.name]): Target | undefined {
  for (let index = 0; index < body.length; index++) {
    const b = body[index]!;
    if (b.id === id) return { scene, body, trail, index };
    for (const branch of b.branches) {
      const found = locate(scene, id, branch.beats, [...trail, `${branch.name}${branch.condition ? ' ' + branch.condition : ''}`]);
      if (found) return found;
    }
  }
  return undefined;
}


export function flatten(body: Beat[]): Beat[] { return body.flatMap(b => [b, ...b.branches.flatMap(branch => flatten(branch.beats))]); }
export function ancestry(scene: Scene, id: string, body = scene.beats, parents: { beat: Beat; branch: Branch }[] = []): { beat: Beat; branch: Branch }[] | undefined {
  for (const beat of body) {
    if (beat.id === id) return parents;
    for (const branch of beat.branches) { const found = ancestry(scene, id, branch.beats, [...parents, { beat, branch }]); if (found) return found; }
  }
  return undefined;
}
export function beatNumber(scene: Scene, id: string) {
  const parents = ancestry(scene, id) ?? [];
  const values = [...parents.map(p => locate(scene, p.beat.id)!.index + 1), (locate(scene, id)?.index ?? 0) + 1];
  return values.map((n, i) => i === 0 ? String(n).padStart(2, '0') : String(n)).join('.');
}
export function beatName(scene: Scene, id: string) {
  const beat = flatten(scene.beats).find(b => b.id === id);
  const parents = ancestry(scene, id) ?? [];
  return `${beatNumber(scene, id)} ${beat?.kind === 'dialogue' ? beat.speaker : beat ? label(beat.kind) : 'Beat'}${parents.length ? ' in ' + parents.map(p => p.branch.name).join(' / ') : ''}`;
}
export interface Column { beat: Beat; body: Beat[]; trail: string[]; index: number; depth: number }
export function columns(scene: Scene, branches: Map<string, string>, body = scene.beats, trail = [scene.name], depth = 0): Column[] {
  return body.flatMap((beat, index) => {
    const branch = beat.branches.find(b => b.id === branches.get(beat.id));
    return [{ beat, body, trail, index, depth }, ...(branch ? columns(scene, branches, branch.beats, [...trail, `${branch.name} ${branch.condition}`.trim()], depth + 1) : [])];
  });
}
export interface StagedCharacter { name: string; asset: string; placement: string; from: Beat }
export interface Illustration { background?: Beat; characters: Map<string, StagedCharacter>; music?: Beat; line?: Beat; unknown: Beat[] }
/** Fictional presentation cues on a manually selected path; no condition evaluation,
 * Calls, variables, Python, elapsed time or runtime reconstruction. */
export function illustrate(route: Column[], index: number): Illustration {
  const result: Illustration = { characters: new Map(), unknown: [] };
  for (const { beat: b } of route.slice(0, index + 1)) {
    if (b.kind === 'background') { result.background = b; result.characters.clear(); }
    if (b.kind === 'showCharacter') result.characters.set(b.speaker, { name: b.speaker, asset: b.asset, placement: b.placement, from: b });
    const actor = result.characters.get(b.speaker);
    if (b.kind === 'changeAppearance' && actor) result.characters.set(b.speaker, { ...actor, asset: b.asset, from: b });
    if (b.kind === 'placement' && actor) result.characters.set(b.speaker, { ...actor, placement: b.placement, from: b });
    if (b.kind === 'hideCharacter') result.characters.delete(b.speaker);
    if (b.kind === 'playMusic') result.music = b;
    if (b.kind === 'stopMusic') result.music = undefined;
    if (b.kind === 'dialogue' || b.kind === 'narration') result.line = b;
    if (['condition', 'call', 'choice', 'customCode'].includes(b.kind)) result.unknown.push(b);
  }
  return result;
}
