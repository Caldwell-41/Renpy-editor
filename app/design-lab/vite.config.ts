import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { defineConfig } from "vite";
import { isDesignSourceInput, loadApprovalRecords, sourcePaths } from "./approval-files.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));
const app = fileURLToPath(new URL("../", import.meta.url));
const nativeStub = fileURLToPath(new URL("./native.ts", import.meta.url));
const repository = fileURLToPath(new URL("../../", import.meta.url));
const approvalModule = "\0virtual:design-lab-approvals";

export default defineConfig({
  root,
  clearScreen: false,
  publicDir: false,
  define: { "import.meta.env.LOOMLIGHT_DESIGN_LAB": "true" },
  plugins: [{
    name: "design-lab-boundaries",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:design-lab-approvals") return approvalModule;
      if (id === "@tauri-apps/api/core") return nativeStub;
      if (id.startsWith("@tauri-apps/")) throw new Error("Design Lab blocks native APIs. Supply sample callbacks to the renderer.");
    },
    load(id) {
      if (id === approvalModule) return `export const approvalRecords = ${JSON.stringify(loadApprovalRecords(repository))};`;
      if (/\/src\/(?:bootstrap|main)\.ts(?:\?|$)/.test(id.replaceAll("\\", "/"))) {
        throw new Error("Design Lab mounts individual renderers; the production application entry is unavailable.");
      }
    },
    configureServer(server) {
      server.watcher.add([...sourcePaths(repository), fileURLToPath(new URL("../../docs/design/", import.meta.url))]);
      server.watcher.on("all", (_event, file) => {
        const module = server.environments.client?.moduleGraph.getModuleById(approvalModule);
        if (module) {
          server.environments.client!.moduleGraph.invalidateModule(module);
          const normalized = relative(repository, file).replaceAll("\\", "/");
          if (isDesignSourceInput(normalized) || normalized.startsWith("docs/design/")) {
            server.ws.send({ type: "full-reload" });
          }
        }
      });
      server.middlewares.use((request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.statusCode = 405;
          response.end("Design Lab serves read-only browser assets.");
          return;
        }
        next();
      });
    },
  }],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    fs: { strict: true, allow: [app] },
    headers: {
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:*; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
      "Referrer-Policy": "no-referrer",
    },
  },
  // The lab is a dev-only entry. Its check inspects the production build in memory.
  build: { write: false },
});
