import type { LabMount } from "../../contracts.ts";
import { mountSettings } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountSettings(host, context, "book");
