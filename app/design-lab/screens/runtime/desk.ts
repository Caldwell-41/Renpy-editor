import type { LabMount } from "../../contracts.ts";
import { mountRuntime } from "./workspace.ts";
export const mount: LabMount = (host, context) => mountRuntime(host, context, "desk");
