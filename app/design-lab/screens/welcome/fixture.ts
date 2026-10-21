export interface SampleProject {
  id: string;
  title: string;
  path: string;
  opened: string;
  status: "available" | "missing" | "incompatible";
}

export function projects(state: string): SampleProject[] {
  if (state === "empty") return [];
  const result: SampleProject[] = [
    { id: "tram", title: "The Last Tram", path: "Stories / The Last Tram", opened: "Today, 9:41 am", status: "available" },
    { id: "morning", title: "A Quiet Morning", path: "Stories / A Quiet Morning", opened: "Yesterday", status: "available" },
    { id: "summer", title: "Summer Letters", path: "External drive / Summer Letters", opened: "17 October 2026", status: "missing" },
    { id: "tide", title: "After the Tide", path: "Stories / After the Tide", opened: "12 October 2026", status: "incompatible" },
  ];
  if (state === "long") {
    result[1]!.title = "A Quiet Morning at the Observatory, before the Last Winter Train";
    result[1]!.path = "Stories / Drafts / Observatory collection / A Quiet Morning at the Observatory";
    for (let i = 1; i <= 12; i++) result.push({ id: `notes-${i}`, title: `Station stories, chapter ${i}`, path: `Stories / Station collection / Chapter ${i}`, opened: "8 October 2026", status: i % 4 === 0 ? "missing" : "available" });
  }
  return result;
}

export const statusLabel = { available: "Available", missing: "Folder missing", incompatible: "Incompatible version" } as const;
export const statusHelp = {
  available: "Ready to open in this sample.",
  missing: "The recorded folder is unavailable. Open a project to choose its new location.",
  incompatible: "This project uses a newer Loomlight format. Open it with a compatible version.",
} as const;
