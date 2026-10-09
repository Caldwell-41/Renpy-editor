import { Channel, invoke } from "@tauri-apps/api/core";
import { createRequest, isCoreResponse, type CoreOperation, type CoreResponse } from "./protocol.ts";

export async function requestCore<T>(
  operation: CoreOperation,
  payload: Readonly<Record<string, unknown>> = {},
): Promise<CoreResponse<T>> {
  const request = createRequest(operation, payload);
  let active=true;
  let onProgress: Channel<OperationProgress> | undefined;
  if(operation === "sdk.install" || operation === "project.create") {
    onProgress = new Channel<OperationProgress>(); let sequence=0;
    onProgress.onmessage = update => { if(active && update.sequence > sequence){ sequence=update.sequence; listeners.forEach(listener=>listener(operation,update)); } };
  }
  let response: unknown;
  // Qualification observes this actual client boundary; Tauri's invoke property
  // is immutable in packaged WebViews. No request payload or native key is exposed.
  const observeWindows = Reflect.get(window, "__loomlightWindowsEvidence") === true || Reflect.get(window, "__loomlightWindowsReloadProof") === true;
  const started = observeWindows ? performance.timeOrigin + performance.now() : 0;
  try { response = await invoke("core_request", { request, onProgress }); } finally {
    active=false;
    if (observeWindows) window.dispatchEvent(new window.CustomEvent("loomlight-windows-probe-response", {
      detail: { operation, response: operation === "ai.enterCredential" ? response : undefined,
        started, ended: performance.timeOrigin + performance.now() },
    }));
  }
  if (!isCoreResponse(response, request.requestId)) {
    throw new Error("The desktop core returned an invalid response.");
  }
  return response as CoreResponse<T>;
}

/** Desktop verifies the project is already closed before allowing application exit. */
export async function completeApplicationClose(): Promise<void> { await invoke("complete_application_close"); }

export interface OperationProgress { sequence: number; stage: string; bytes?: number; total?: number }
const listeners=new Set<(operation: string, progress: OperationProgress)=>void>();
export function observeProgress(listener: (operation: string, progress: OperationProgress)=>void):()=>void { listeners.add(listener);return ()=>listeners.delete(listener); }
