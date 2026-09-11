export const operations = [
  "readText",
  "writeTextAtomic",
  "watchText",
  "unwatchText",
  "startMockSdk",
  "cancelMockSdk",
] as const;

export type Operation = (typeof operations)[number];

export interface FileVersion {
  relativePath: string;
  contents: string;
  sha256: string;
}

export interface ReadTextRequest {
  operation: "readText";
  root: string;
  relativePath: string;
}

export interface WriteTextRequest {
  operation: "writeTextAtomic";
  root: string;
  relativePath: string;
  expectedSha256: string;
  contents: string;
}

export interface WatchTextRequest {
  operation: "watchText" | "unwatchText";
  root: string;
  relativePath: string;
}

export interface MockSdkRequest {
  operation: "startMockSdk";
  command: MockSdkCommand;
  args: string[];
  timeoutMs: number;
}

export type MockSdkCommand = "version" | "diagnostics" | "stderr" | "delay" | "flood";
export type MockSdkTerminalReason = "exit" | "cancelled" | "timeout" | "truncated" | "startError";

export type MockSdkEvent =
  | { runId: string; type: "stdout" | "stderr"; text: string }
  | { runId: string; type: "terminal"; reason: MockSdkTerminalReason; code: number | null; signal: string | null };

export interface CancelMockSdkRequest {
  operation: "cancelMockSdk";
  runId: string;
}

export type DesktopRequest =
  | ReadTextRequest
  | WriteTextRequest
  | WatchTextRequest
  | MockSdkRequest
  | CancelMockSdkRequest;

const SHA256 = /^[a-f0-9]{64}$/u;
const RUN_ID = /^[a-f0-9-]{1,80}$/u;
const MOCK_COMMANDS: readonly MockSdkCommand[] = ["version", "diagnostics", "stderr", "delay", "flood"];
export const MIN_MOCK_TIMEOUT_MS = 10;
export const MAX_MOCK_TIMEOUT_MS = 30_000;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("request must be an object");
  }
  return value as Record<string, unknown>;
}

function textField(input: Record<string, unknown>, name: string, limit: number): string {
  const value = input[name];
  if (typeof value !== "string" || value.length === 0 || value.length > limit) {
    throw new TypeError(`${name} is invalid`);
  }
  return value;
}

function projectPath(input: Record<string, unknown>) {
  return {
    root: textField(input, "root", 4096),
    relativePath: validateRelativePath(textField(input, "relativePath", 4096)),
  };
}

export function validateRelativePath(value: string): string {
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    value.split("/").some((part) => part === "" || part === "." || part === "..") ||
    /^[a-zA-Z]:/u.test(value)
  ) {
    throw new TypeError("relativePath must be a normalized project-relative path");
  }
  return value;
}

export function validateRequest(value: unknown): DesktopRequest {
  const input = record(value);
  const operation = input.operation;
  if (typeof operation !== "string" || !operations.includes(operation as Operation)) {
    throw new TypeError("operation is not allowlisted");
  }

  if (operation === "readText" || operation === "watchText" || operation === "unwatchText") {
    return { operation, ...projectPath(input) };
  }
  if (operation === "writeTextAtomic") {
    const contents = input.contents;
    const expectedSha256 = input.expectedSha256;
    if (typeof contents !== "string" || Buffer.byteLength(contents) > 2_000_000) {
      throw new TypeError("contents exceeds the spike limit");
    }
    if (typeof expectedSha256 !== "string" || !SHA256.test(expectedSha256)) {
      throw new TypeError("expectedSha256 is invalid");
    }
    return { operation, ...projectPath(input), contents, expectedSha256 };
  }
  if (operation === "startMockSdk") {
    if (typeof input.command !== "string" || !MOCK_COMMANDS.includes(input.command as MockSdkCommand)) {
      throw new TypeError("mock SDK command is not allowlisted");
    }
    if (
      !Array.isArray(input.args) ||
      input.args.length > 16 ||
      input.args.some((arg) => typeof arg !== "string" || arg.length > 512)
    ) {
      throw new TypeError("mock SDK arguments are invalid");
    }
    if (!Number.isInteger(input.timeoutMs) || (input.timeoutMs as number) < MIN_MOCK_TIMEOUT_MS || (input.timeoutMs as number) > MAX_MOCK_TIMEOUT_MS) {
      throw new TypeError("timeoutMs is invalid");
    }
    return { operation, command: input.command as MockSdkCommand, args: input.args as string[], timeoutMs: input.timeoutMs as number };
  }

  const runId = textField(input, "runId", 80);
  if (!RUN_ID.test(runId)) throw new TypeError("runId is invalid");
  return { operation: "cancelMockSdk", runId };
}
