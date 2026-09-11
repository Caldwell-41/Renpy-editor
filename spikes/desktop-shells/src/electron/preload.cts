import { contextBridge, ipcRenderer } from "electron";

const bridge = Object.freeze({
  invoke: (request: unknown) => ipcRenderer.invoke("loomlight:invoke", request),
  subscribe: (listener: (event: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, message: unknown) => listener(message);
    ipcRenderer.on("loomlight:event", handler);
    return () => ipcRenderer.removeListener("loomlight:event", handler);
  },
});

contextBridge.exposeInMainWorld("loomlight", bridge);
