import { mountWelcome } from "./workspace.ts";
import type { LabMount } from "../../contracts.ts";
export const mount: LabMount = (host, context) => mountWelcome(host, context, "desk");
