import { mountWriting } from "./workspace.ts";
import type { LabMount } from "../../contracts.ts";
export const mount: LabMount = (host, context) => mountWriting(host, context, "dossier");
