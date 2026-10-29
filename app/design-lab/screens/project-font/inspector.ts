import type { LabMount } from "../../contracts.ts";
import { mountFont } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountFont(host, context, "inspector");
