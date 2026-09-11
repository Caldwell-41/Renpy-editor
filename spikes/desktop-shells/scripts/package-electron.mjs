import { packager } from "@electron/packager";

const outputs = await packager({
  dir: ".",
  name: "LoomlightSpike",
  out: "artifacts/electron",
  overwrite: true,
  prune: true,
  ignore: [
    /^\/artifacts(?:\/|$)/u,
    /^\/fixtures(?:\/|$)/u,
    /^\/scripts(?:\/|$)/u,
    /^\/src(?:\/|$)/u,
    /^\/src-tauri(?:\/|$)/u,
    /^\/tests(?:\/|$)/u,
  ],
});

for (const output of outputs) process.stdout.write(`Packaged ${output}\n`);