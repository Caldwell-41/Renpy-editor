export interface LabContext {
  readonly state: string;
  readonly theme: "light" | "dark";
}

export type LabMount = (host: HTMLElement, context: LabContext) => void | (() => void) | Promise<void | (() => void)>;

export interface LabScreen {
  readonly id: string;
  readonly title: string;
  readonly kind: "prototype" | "component-preview";
  readonly description: string;
  readonly approval: RecordedApproval;
  readonly states: readonly { readonly id: string; readonly title: string }[];
  readonly variants: readonly {
    readonly id: string;
    readonly title: string;
    readonly load: () => Promise<{ mount: LabMount }>;
  }[];
  /** Optional screen-specific interaction check, relative to design-lab/. */
  readonly check?: string;
}
import type { RecordedApproval } from "./approval.ts";
