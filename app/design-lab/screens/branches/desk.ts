import { mountBranches } from "./shared.ts";
import type { LabMount } from "../../contracts.ts";
export const mount: LabMount = (host, context) => mountBranches(host, context, "desk");
