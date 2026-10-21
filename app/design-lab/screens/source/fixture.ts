export interface SourceSample {
  path: string;
  title: string;
  saved: string;
  text: string;
  history: string[];
  future: string[];
  start: number;
  end: number;
  scroll: number;
  kind: "editable" | "read-only" | "unavailable";
  external?: string;
}

export const opening = `# The Last Tram. A fictional Design Lab sample.
# Keep the pause before the reply; it is part of Mara's voice.

label last_service:
    scene bg tram_platform
    with dissolve

    "Rain gathers beneath the station clock."
    mara "You're late. The last tram leaves at eleven."
    ivo "Then we still have time."

    menu:
        "Ask about the sealed letter":
            jump sealed_letter
        "Wait for the tram":
            jump platform_wait

    # This custom code remains in Source.
    python:
        station_log.append("last_service")

    return
`;

export function sampleFiles(state: string): SourceSample[] {
  const values: [string, string, string, SourceSample["kind"]][] = [
    ["game/last_service.rpy", "Last service", state === "empty" ? "" : state === "long" ? opening + Array.from({ length: 80 }, (_, i) => `\n# Platform observation ${i + 1}\nlabel platform_note_${i + 1}:\n    "The station clock is still a minute slow."\n    return\n`).join("") : opening, "editable"],
    ["game/sealed_letter.rpy", "The sealed letter", `label sealed_letter:\n    mara "It was addressed to someone who never arrived."\n    ivo "Perhaps they are on this train."\n    jump platform_wait\n`, "editable"],
    ["game/platform_wait.rpy", "Platform wait", `label platform_wait:\n    "They listen for the rails beyond the fog."\n    return\n`, "editable"],
    ["game/characters.rpy", "Character definitions", `# Fictional character definitions\ndefine mara = Character("Mara", color="#608a82")\ndefine ivo = Character("Ivo", color="#ba895f")\n`, "editable"],
    ["game/screens.rpy", "Custom screens", `# Unsupported custom screen stays in Source.\nscreen station_clock():\n    text "23:00" xalign 0.95 yalign 0.05\n`, "read-only"],
    ["game/old_timetable.rpy", "File unavailable", "", "unavailable"],
  ];
  const files: SourceSample[] = values.map(([path, title, text, kind]) => ({ path, title, text, saved: text, history: [], future: [], start: 0, end: 0, scroll: 0, kind }));
  if (state === "conflict") {
    files[0]!.text = opening.replace("Then we still have time.", "Then we have one minute left.");
    files[0]!.external = opening.replace("Rain gathers beneath the station clock.", "Rain falls against the empty ticket booth.");
  }
  return files;
}
