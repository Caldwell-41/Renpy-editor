import type { LabMount } from "../../contracts.ts";
import { mountLook } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountLook(host, context, "library");
