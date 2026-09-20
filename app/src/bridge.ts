import { invoke } from "@tauri-apps/api/core";
import { createRequest, isCoreResponse, type CoreOperation, type CoreResponse } from "./protocol.ts";

export async function requestCore<T>(
  operation: CoreOperation,
  payload: Readonly<Record<string, unknown>> = {},
): Promise<CoreResponse<T>> {
  const request = createRequest(operation, payload);
  const response: unknown = await invoke("core_request", { request });
  if (!isCoreResponse(response, request.requestId)) {
    throw new Error("The desktop core returned an invalid response.");
  }
  return response as CoreResponse<T>;
}
