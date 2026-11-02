import type { LabMount } from "../../contracts.ts";
import { mountStudy } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountStudy(host, context, "inspector");
