export interface Finding {
  id: string; severity: "error" | "warning"; origin: "compile" | "lint" | "runtime";
  message: string; detail: string; path: string | null; line: number | null;
}
export type Phase = "idle" | "preparing" | "starting" | "running" | "validating" | "stopping" | "stopped" | "finished" | "failed" | "timedOut" | "cleanupFailed";
export type Outcome = "success" | "runtimeError" | "timeout" | "cleanupFailure" | "saveFailure" | "checksumFailure" | "selectionFailure";
export const warnings = (): Finding[] => [
  { id: "unused", severity: "warning", origin: "lint", message: "Image station_sign is not used.", detail: "The image is defined but no saved scene references it. Check whether it belongs to a later scene before changing it.", path: "game/images.rpy", line: 18 },
  { id: "unreachable", severity: "warning", origin: "lint", message: "Label old_timetable is not reached.", detail: "No saved jump or call reaches this label. Dynamic jumps may still reach it, so review the source before making a change.", path: "game/last_service.rpy", line: 42 },
];
export const errors = (): Finding[] => [
  { id: "runtime", severity: "error", origin: "runtime", message: "NameError: timetable is not defined.", detail: "While evaluating a dialogue interpolation, the fictional game referenced timetable before giving it a value. The process exited with code 0, but this reported runtime error still means the run failed.", path: "game/last_service.rpy", line: 27 },
  { id: "unknown", severity: "error", origin: "runtime", message: "The SDK reported an additional startup error.", detail: "This diagnostic has no proven project source location. The retained process output has the SDK's fictional report.", path: null, line: null },
];
export function fixture(state: string) {
  const findings = state === "empty" ? [] : state === "error" ? errors() : warnings();
  if (state === "long") for (let n = 1; n <= 26; n++) findings.push({
    id: `long-${n}`, severity: n % 5 === 0 ? "error" : "warning", origin: n % 5 === 0 ? "compile" : "lint",
    message: n % 5 === 0 ? `Expected a statement after the condition in platform_${n}.` : `Image platform_${n}_evening has no saved use.`,
    detail: `Fictional SDK finding ${n}. This long diagnostic explains the saved-source location and keeps the full text readable at a compact width. Source locations are checked when opened.`,
    path: `game/platform_${n}_evening_with_a_deliberately_long_filename.rpy`, line: 10 + n,
  });
  return {
    findings, sdk: state !== "empty", sdkName: "Managed SDK", trusted: state === "error", helper: state !== "empty",
    phase: (state === "error" ? "cleanupFailed" : "idle") as Phase,
    sourceDrafts: 0, pendingScene: false, stale: state === "long", earlier: false,
    outcome: "success" as Outcome, selected: findings[0]?.id ?? "", filter: "all", kind: "validate" as "run" | "validate",
    savedRevision: "sample-r14", launchRevision: state === "empty" ? "" : "sample-r14",
    tested: state !== "empty", previous: "", notice: "", stage: "", output: state === "empty" ? "" : state === "error"
      ? "[Fictional SDK output]\nNameError: timetable is not defined.\nProcess exit 0. Runtime diagnostic retained.\nCleanup could not confirm that all owned processes ended."
      : `[Fictional SDK output]\nRen'Py 8.5.3\nCompile completed.\nLint completed with ${findings.length} finding(s).${state === "long" ? "\n" + Array.from({ length: 70 }, (_, n) => `Sample lint record ${n + 1}: retained output for review.`).join("\n") + "\n[Output truncated at the retention limit]" : ""}`,
  };
}
