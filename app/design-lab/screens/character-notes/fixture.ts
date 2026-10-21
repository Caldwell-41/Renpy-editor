/** Fictional public samples. Each mount receives a fresh copy. */
export function sampleCharacters(state: string) {
  const note = "Mara repairs the station clocks. She checks every mechanism twice and avoids promising when the next train will arrive.";
  return [
    { id: "mara", name: "Mara", notes: state === "empty" ? "" : state === "long" ? Array(24).fill(note).join("\n\n") : note },
    { id: "eli", name: "Eli", notes: "Eli runs the late shift at the bakery. He saves the last loaf for whoever misses the final train." },
  ];
}
