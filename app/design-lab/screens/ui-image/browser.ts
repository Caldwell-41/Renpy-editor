import { mountImage } from "./workspace.ts";
import type { LabMount } from "../../contracts.ts";
export const mount: LabMount = (host, context) => mountImage(host, context, "browser");
