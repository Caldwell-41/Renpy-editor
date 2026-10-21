export interface Notes { world: string; tone: string }
export interface Version { number: number; date: string; notes: Notes }

const world = "The last tram still runs through Bellwether after the town clocks stop at 11:43. Its route follows the harbour, the shuttered winter market and a station that does not appear on any map.\n\nAnyone can board with a ticket. Each journey costs one memory, chosen by the passenger before the final stop. The conductor cannot choose for them.\n\nTonight, Mara has found a ticket in her late father's coat. Ivo knows the route but refuses to name its terminus. Rain has closed the coast road; the tram is the only way out.";
const tone = "Quiet mystery with warmth beneath it. Let unease arrive through ordinary details: a damp ticket, a familiar tune, a clock that misses a beat.\n\nKeep narration concrete and lightly textured. Leave room between discoveries. Dialogue should sound like people avoiding a difficult subject, rather than explaining the world.\n\nHumour is dry and rare. Do not make loss feel inevitable. Characters can still choose kindness.";
const longWorld = "Beyond the harbour, the tram passes glasshouses where the panes reflect different seasons. The market vendors remember every passenger, but never discuss what was traded. A brass bell marks each district boundary; its sound is always heard a moment before it is struck.\n\nThe town treats the service as an ordinary inconvenience. Residents leave exact change by the door and avoid making promises after sunset. None of these customs proves that a character knows the tram's true cost.";

/** Fresh fictional data for each preview mount. */
export function fixture(state: string): { notes: Notes; versions: Version[] } {
  const notes = state === "empty" ? { world: "", tone: "" } : {
    world: state === "long" ? `${world}\n\n${Array.from({ length: 7 }, () => longWorld).join("\n\n")}` : world,
    tone: state === "long" ? `${tone}\n\n${Array.from({ length: 5 }, () => "Keep each scene rooted in a small task before it asks a larger question. Give the reader time to notice what has changed. A recurring image should gain meaning through an action, not an explanation.").join("\n\n")}` : tone,
  };
  return { notes, versions: state === "empty" ? [] : [
    { number: 1, date: "18 October · 10:12", notes: { world: "A coastal town has one tram service after midnight. Mara boards with a ticket from her father's coat.", tone: "A quiet mystery. Concrete details, restrained dialogue and moments of warmth." } },
    { number: 2, date: "19 October · 16:40", notes: structuredClone(notes) },
  ] };
}

export const retainedEntries = [
  { title: "The winter market", id: "lore-market", revision: "Revision 3", status: "Approved", text: "The winter market closes before the first evening bell. Vendors leave one stall empty for a traveller who never arrives.", detail: "Approved revision 3 is current. Its source reference still matches.", eligible: true },
  { title: "The conductor's ledger", id: "lore-ledger", revision: "Revision 2", status: "Proposed · source changed", text: "A proposed note claims that the ledger lists the memories owed by every passenger.", detail: "Approval is blocked because the supporting scene has changed. Review fresh supporting material before approving. Revision 1 remains the approved reference.", eligible: false },
];
