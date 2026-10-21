import type { LabMount } from "../../contracts.ts";
import { mountScreens } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountScreens(host, context, "canvas");
