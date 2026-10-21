export interface Relationship { target: string; text: string }
export interface Card {
  title: string; aliases: string; tags: string; description: string;
  appearanceNotes: string; background: string; personality: string; motivations: string;
  speakingStyle: string; exampleDialogue: string; knowledgeNotes: string;
  relationships: Relationship[];
  retained: { scope: string; links: string[]; provenance: string };
}
export interface Appearance { id: string; expression: string; art: string }
export interface GameIdentity { id: string; technicalName: string; displayName: string; colour: string; appearances: Appearance[]; defaultId: string; revision: number }
export interface Character {
  id: string; inGame: boolean; hasCard: boolean; proposed: boolean;
  saved: Card; versions: Card[]; game?: GameIdentity;
}
export const clone = <T>(value: T): T => structuredClone(value);
export function emptyCard(title = ""): Card {
  return { title, aliases: "", tags: "", description: "", appearanceNotes: "", background: "",
    personality: "", motivations: "", speakingStyle: "", exampleDialogue: "", knowledgeNotes: "",
    relationships: [], retained: { scope: "all", links: [], provenance: "Fictional lab sample" } };
}
export function sampleCharacters(state: string): Character[] {
  const mara: Card = {
    ...emptyCard("Mara Vale"), aliases: "Maz, the night conductor", tags: "tram crew, viewpoint",
    description: "The last tram's conductor. She remembers every passenger's usual stop, even the ones who stopped coming years ago.",
    appearanceNotes: "A rain-dark coat, silver ticket punch and an old wool scarf. Ink stains on her left thumb.",
    background: "Mara grew up beside the old station. The night shift taught her to remember faces, listen before answering and leave a lamp burning for late arrivals.",
    personality: "Reserved, observant and quietly stubborn. She notices a broken promise before she notices a compliment.",
    motivations: "Get every passenger home safely, even when the timetable has stopped making sense. Find out who is leaving tickets for a closed station.",
    speakingStyle: "Short sentences, gentle humour and practical questions. Let pauses carry what she does not say.",
    exampleDialogue: '"Last tram?"\nShe checks the empty platform.\n"Then we had better wait another minute."',
    knowledgeNotes: "She knows the timetable and the maintenance tunnels. She has not learned why the last service keeps arriving late. She keeps one unposted letter hidden in her notebook.",
    relationships: [
      { target: "ivo", text: "Trusts his practical judgement, but notices how he avoids the old waiting room. She gives him space until a passenger's safety is at stake." },
      { target: "lore:station", text: "She treats the closed station as a promise she has not yet kept. This older non-character note stays with the card." },
    ],
    retained: { scope: "all", links: ["fictional-platform-scene"], provenance: "Fictional lab sample" },
  };
  const ivo: Card = { ...emptyCard("Ivo Reed"), tags: "tram crew", description: "A mechanic who can hear a loose bolt before anyone else notices the rattle.", personality: "Patient with machines, evasive with people.", motivations: "Keep the tram running until dawn.", speakingStyle: "Precise, dry and sparing with promises.", knowledgeNotes: "Knows why the waiting room was sealed. Has not told Mara.", relationships: [{ target: "mara", text: "Respects her judgement. Wants to tell her the truth, but keeps choosing another night." }] };
  const elsie = { ...emptyCard("Elsie Wren of the North Platform"), description: "A passenger with a suitcase full of maps and no ticket home.", background: "She has crossed the city looking for a street that no map agrees on." };
  if (state === "empty") {
    for (const card of [mara, ivo, elsie]) Object.assign(card, emptyCard(card.title));
  }
  if (state === "long") {
    mara.background = Array.from({ length: 14 }, (_, i) => `Night ${i + 1}. ${mara.background} She writes each passenger's name in the margin of her timetable, beside a sketch of the platform where they first met. Café 雪.`).join("\n\n");
    mara.exampleDialogue += '\n\n"There is a place for you here," she says. "You only need to tell me where to stop."';
  }
  const previous = clone(mara);
  previous.description = "A conductor on the city's final night service. She is still learning which passengers want conversation.";
  const make = (id: string, saved: Card, inGame: boolean, hasCard = true): Character => ({ id, saved, inGame, hasCard, proposed: id === "mara" && state === "proposed", versions: hasCard ? [id === "mara" ? previous : clone(saved), clone(saved)] : [] });
  const cast = [make("mara", mara, true), make("ivo", ivo, false), make("elsie", elsie, false), make("theo", emptyCard("Theo Bell"), true, false)];
  cast[0]!.game = { id: "game-mara", technicalName: "mara", displayName: "Mara", colour: "#91bcb4", appearances: [{ id: "mara-neutral", expression: "neutral", art: "coat" }, { id: "mara-thoughtful", expression: "thoughtful", art: "scarf" }], defaultId: "mara-neutral", revision: 1 };
  cast[3]!.game = { id: "game-theo", technicalName: "theo", displayName: "Theo Bell", colour: "#c5c8d0", appearances: [], defaultId: "", revision: 1 };
  return cast;
}
