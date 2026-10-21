import type { LabMount } from "../../contracts.ts";
import { mountRequest } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountRequest(host, context, "desk");
