import type { LabMount } from "../../contracts.ts";
import { mountComposition } from "./sample.ts";
export const mount: LabMount = (host, context) => mountComposition(host, context, "context");
