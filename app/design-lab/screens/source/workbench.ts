import { mountSource } from "./workspace.ts";
import type { LabMount } from "../../contracts.ts";
export const mount: LabMount = (host, context) => mountSource(host, context, "workbench");
