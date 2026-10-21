import { fileURLToPath } from "node:url";
import { captureSource } from "./approval-files.mjs";

console.log(JSON.stringify(captureSource(fileURLToPath(new URL("../../", import.meta.url))), null, 2));
