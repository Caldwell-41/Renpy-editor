export const PROTOCOL_VERSION = 1 as const;

export const CORE_OPERATIONS = [
  "system.health",
  "system.version",
  "probe.denied",
  "probe.redactedError",
  "probe.smokeReport",
  "system.folderName",
  "project.chooseParent",
  "project.validateDestination",
  "project.create",
  "project.listRecent",
  "project.openPicker",
  "project.openRecent",
  "project.removeRecent",
  "project.close",
  "project.current",
  "project.status",
  "project.flush",
  "sdk.discover",
  "sdk.browse",
  "sdk.install",
  "authoring.list",
  "character.create",
  "character.update",
  "appearance.setDefault",
  "asset.chooseImport",
  "asset.import",
  "asset.repairCompatibility",
  "variable.create",
  "variable.update",
  "scene.list",
  "scene.apply",
  "scene.recovery",
  "scene.resolveRecovery",
  "media.present",
] as const;

export type CoreOperation = (typeof CORE_OPERATIONS)[number];

export interface CoreRequest {
  readonly protocolVersion: typeof PROTOCOL_VERSION;
  readonly requestId: string;
  readonly operation: CoreOperation;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface CoreError {
  readonly code: string;
  readonly message: string;
}

export type CoreResponse<T = unknown> =
  | {
      readonly protocolVersion: typeof PROTOCOL_VERSION;
      readonly requestId: string;
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly protocolVersion: typeof PROTOCOL_VERSION;
      readonly requestId: string;
      readonly ok: false;
      readonly error: CoreError;
    };

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

export function isCoreResponse(value: unknown, expectedRequestId?: string): value is CoreResponse {
  if (!isRecord(value) || value.protocolVersion !== PROTOCOL_VERSION || typeof value.requestId !== "string") {
    return false;
  }
  if (!REQUEST_ID_PATTERN.test(value.requestId) || (expectedRequestId !== undefined && value.requestId !== expectedRequestId)) {
    return false;
  }
  if (value.ok === true) {
    return hasExactKeys(value, ["protocolVersion", "requestId", "ok", "value"]);
  }
  if (value.ok !== false || !hasExactKeys(value, ["protocolVersion", "requestId", "ok", "error"]) || !isRecord(value.error)) {
    return false;
  }
  return hasExactKeys(value.error, ["code", "message"])
    && typeof value.error.code === "string"
    && typeof value.error.message === "string";
}

export function createRequest(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): CoreRequest {
  return {
    protocolVersion: PROTOCOL_VERSION,
    requestId: crypto.randomUUID().replaceAll("-", ""),
    operation,
    payload,
  };
}
