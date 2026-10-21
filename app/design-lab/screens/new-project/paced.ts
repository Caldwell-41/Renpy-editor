import type { LabMount } from "../../contracts.ts";
import { mountSetup } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountSetup(host, context, "paced");
