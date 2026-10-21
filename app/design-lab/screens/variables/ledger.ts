import type { LabMount } from "../../contracts.ts";
import { mountVariables } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountVariables(host, context, "ledger");
