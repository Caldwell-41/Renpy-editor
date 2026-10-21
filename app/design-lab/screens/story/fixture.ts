export const types = [
  ['dialogue','Dialogue'],['narration','Narration'],['background','Background'],['showCharacter','Show character'],['hideCharacter','Hide character'],['changeAppearance','Change appearance'],['placement','Placement'],['playMusic','Play music'],['stopMusic','Stop music'],['playSfx','Play SFX'],['transition','Transition'],['setVariable','Set variable'],['choice','Choice'],['condition','Condition'],['jump','Jump'],['call','Call scene'],['return','Return / end'],['customCode','Protected source'],
] as const;
export type Kind = typeof types[number][0];
export interface Branch { name: string; condition: string; beats: Beat[] }
export interface Beat { id: string; kind: Kind; text: string; speaker: string; asset: string; placement: string; transition: string; target: string; value: string; options: {text:string;target:string;condition:string}[]; branches: Branch[] }
export interface Scene { id: string; name: string; chapter: string; beats: Beat[] }
let sequence = 50;
export function makeBeat(kind: Kind): Beat {
  return { id: `beat-${++sequence}`, kind, text: kind === 'dialogue' ? '' : kind === 'customCode' ? '$ tram_clock.advance()' : '', speaker: 'Mara', asset: kind === 'background' ? 'Rainy platform' : kind === 'playSfx' ? 'Tram bell' : 'Night service', placement: 'Centre', transition: 'Dissolve', target: 'shared', value: 'true', options: [{ text: 'Ask about the last tram', target: 'shared', condition: '' },{ text: 'Wait on the platform', target: 'departure', condition: 'trust >= 3' }], branches: [{ name:'If', condition:'has_ticket = true', beats:[] }, { name:'Otherwise', condition:'', beats:[] }] };
}
export function fixture(state:string): Scene[] {
  const background = makeBeat('background'), show = makeBeat('showCharacter'), narration = makeBeat('narration'), dialogue = makeBeat('dialogue'), condition = makeBeat('condition'), call = makeBeat('call'), choice = makeBeat('choice');
  narration.text = 'The timetable has not changed in thirty years. Tonight, someone has added a new stop.';
  dialogue.text = 'You heard the bell too? I thought I was the only one waiting.';
  const branch = makeBeat('dialogue'); branch.text = 'Keep your ticket. Some doors only open once.'; branch.speaker = 'Eli'; condition.branches[0]!.beats.push(branch);
  const other = makeBeat('narration'); other.text = 'An empty pocket. A familiar excuse.'; condition.branches[1]!.beats.push(other,makeBeat('customCode'));
  const shared = makeBeat('dialogue'); shared.speaker = 'Eli'; shared.text = 'The last service always comes back. The question is who comes back with it.';
  const end = makeBeat('return');
  const beats = [background,show,narration,dialogue,condition,call,choice];
  if(state==='long') { dialogue.text = Array(14).fill('The lights of the tram bend around the corner, but no one at the station moves. Mara folds the ticket along its old crease.').join('\n\n'); for(let n=0;n<16;n++) {const b=makeBeat(n%2?'dialogue':'narration');b.text=`${n+1}. The station keeps its own time. We wait for a service that the timetable no longer names.`;beats.splice(beats.length-1,0,b);} }
  return [{ id:'arrival', name:'The last service', chapter:'Chapter 1 · After hours', beats:state==='empty'?[]:beats },{ id:'shared', name:'A familiar stranger', chapter:'Chapter 1 · After hours', beats:[shared,end] },{ id:'departure', name:'Departure', chapter:'Chapter 2 · The return', beats:[makeBeat('narration'),makeBeat('return')] }];
}
export function kindName(kind:Kind) { return types.find(t=>t[0]===kind)![1]; }
export function summary(b:Beat):string { switch(b.kind) {case 'dialogue':return `${b.speaker}: ${b.text||'Empty dialogue'}`;case 'narration':return b.text||'Empty narration';case 'condition':return `${b.branches[0]?.condition} · ${b.branches.length} branches`;case 'choice':return `${b.options.length} choices · select a destination`;case 'call':return 'A familiar stranger · returns to the next beat';case 'jump':return b.target;case 'return':return 'Scene ends here';case 'customCode':return 'Custom Python · preview state unknown';case 'setVariable':return `has_ticket = ${b.value}`;case 'showCharacter':return `${b.speaker} · ${b.placement} · ${b.transition}`;case 'hideCharacter':case 'changeAppearance':case 'placement':return `${b.speaker} · ${b.placement}`;case 'stopMusic':return 'Stop current music';default:return b.asset||b.transition;} }
