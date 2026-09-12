import { contextBridge, ipcRenderer } from "electron";

const bridge = Object.freeze({
  invoke: async (request: unknown) => {
    const response = await ipcRenderer.invoke("loomlight:invoke", request) as
      | { ok: true; value: unknown }
      | { ok: false; error: string };
    if (!response.ok) throw new Error(response.error);
    return response.value;
  },
  subscribe: (listener: (event: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, message: unknown) => listener(message);
    ipcRenderer.on("loomlight:event", handler);
    return () => ipcRenderer.removeListener("loomlight:event", handler);
  },
});

contextBridge.exposeInMainWorld("loomlight", bridge);
