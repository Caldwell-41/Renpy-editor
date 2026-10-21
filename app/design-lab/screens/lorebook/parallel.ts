import { mountLorebook } from "./workspace.ts";
import type { LabMount } from "../../contracts.ts";
export const mount: LabMount = (host, context) => mountLorebook(host, context, "parallel");
