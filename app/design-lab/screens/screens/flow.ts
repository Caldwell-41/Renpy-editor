import type { LabMount } from "../../contracts.ts";
import { mountScreenDemo } from "./notebook.ts";
export const mount: LabMount = (host, context) => mountScreenDemo(host, context, "flow");
