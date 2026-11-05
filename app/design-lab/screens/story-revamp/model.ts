// Throwaway Story UX study. All content and changes stay in memory.
export const kinds = [
  ['dialogue', 'Dialogue', 'Write'], ['narration', 'Narration', 'Write'],
  ['background', 'Background', 'Stage'], ['showCharacter', 'Show character', 'Stage'],
  ['hideCharacter', 'Hide character', 'Stage'], ['changeAppearance', 'Change appearance', 'Stage'],
  ['placement', 'Placement', 'Stage'], ['transition', 'Transition', 'Stage'],
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
export function brief(b: Beat): string {
  if (b.kind === 'dialogue') return `${b.speaker}: ${b.text || 'Write dialogue…'}`;
  if (b.kind === 'narration') return b.text || 'Write narration…';
  if (b.kind === 'condition') return `If ${b.branches[0]?.condition ?? 'has_ticket is true'}`;
  if (b.kind === 'choice') return `${b.options.length} choices`;
  if (b.kind === 'call') return 'A familiar stranger · returns to next beat';
  if (b.kind === 'jump') return 'Go to scene · does not return';
  if (b.kind === 'return') return 'Return to caller / end story';
  if (b.kind === 'customCode') return 'Custom Python · preview state unknown';
  if (b.kind === 'setVariable') return `${b.text || 'has_ticket'} = ${b.value}`;
  if (b.kind.endsWith('Screen')) return `${label(b.kind)} · ${b.asset === 'Neutral' ? 'Help' : b.asset}`;
  if (b.kind === 'playMusic') return b.text || 'Night service';
  if (b.kind === 'stopMusic') return 'Stop current music';
  if (b.kind === 'playSfx') return b.asset;
  if (b.kind === 'background') return `${b.asset} · ${b.transition}`;
  if (b.kind === 'transition') return b.transition;
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
