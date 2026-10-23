import type { LabMount } from "../../contracts.ts";
import { mountDrag } from "./sample.ts";
export const mount: LabMount = (host, context) => mountDrag(host, context, "handle");
