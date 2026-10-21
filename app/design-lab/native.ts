/** Vite substitutes this module only inside Design Lab. It has no native transport. */
const blocked: string[] = [];

function refuse(operation: string): never {
  blocked.push(operation);
  throw new Error(`Design Lab refuses native operation: ${operation}. Supply an explicit sample callback.`);
}

export function blockedOperations(): readonly string[] { return [...blocked]; }

export class Channel<T = unknown> {
  onmessage?: (message: T) => void;
  constructor() { refuse("Channel"); }
}

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const request = args?.request as { operation?: string; requestId?: string } | undefined;
  if (command === "core_request" && request?.operation === "preferences.read") {
    return {
      ok: true,
      protocolVersion: 1,
      requestId: request.requestId,
      value: {
        schemaVersion: 1,
        theme: new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light",
        density: "default", sourceFontSize: 14, rememberLayout: false, layouts: {},
      },
    } as T;
  }
  return refuse(request?.operation ?? command);
}
