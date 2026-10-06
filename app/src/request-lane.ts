import type { CoreOperation } from "./protocol.js";
/** Order shared-service observations with Source retention and persistence reads; runtime control stays independent. */
export class RequestLane {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(operation: CoreOperation, task: () => Promise<T>): Promise<T> {
    const control=["runtime.requestStatus", "runtime.cancelRequest", "runtime.stop", "runtime.status", "runtime.diagnostics", "runtime.revokeTrust"].includes(operation);
    if (control || (!operation.startsWith("source.") && !operation.startsWith("runtime.") && !["project.status", "project.flush", "project.close", "sdk.discover", "scene.list", "authoring.list", "flow.list", "media.present"].includes(operation))) return task();
    const next=this.tail.then(task);
    this.tail=next.catch(()=>undefined);
    return next;
  }
}
