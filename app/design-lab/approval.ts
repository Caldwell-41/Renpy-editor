export interface ReferenceCapture {
  readonly path: string;
  readonly sha256: string;
  readonly state: string;
  readonly theme: "light" | "dark";
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}

export interface DesignRevision {
  readonly id: string;
  readonly variantId: string;
  readonly approval: null | {
    readonly date: string;
    readonly decision: string;
    readonly reason: string | null;
    readonly supersedes: string | null;
    readonly source: { readonly commit: string; readonly fingerprint: string };
    readonly captures: readonly ReferenceCapture[];
    readonly behaviour: readonly string[];
    readonly deviations: readonly string[];
  };
}

export interface ApprovalRecord {
  readonly schemaVersion: 1;
  readonly screenId: string;
  readonly currentApproved: string | null;
  readonly revisions: readonly DesignRevision[];
}

export interface RecordedApproval {
  readonly path: string;
  readonly record: ApprovalRecord;
  readonly sourceMatches: Readonly<Record<string, boolean>>;
}

const idPattern = /^[a-z][a-z0-9-]*$/;
function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid design approval record: ${message}`);
}
function object(value: unknown): Record<string, unknown> {
  requireCondition(value && typeof value === "object" && !Array.isArray(value), "expected an object");
  return value as Record<string, unknown>;
}
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function id(value: unknown): value is string { return typeof value === "string" && idPattern.test(value); }
function texts(value: unknown): value is string[] { return Array.isArray(value) && value.every(text); }
export function referencePath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("docs/design/") &&
    !value.includes("\\") && !value.split("/").some(part => !part || part === "." || part === "..");
}

/** One ordered history owns both approval and supersession. Status is derived. */
export function parseApprovalRecord(value: unknown): ApprovalRecord {
  const record = object(value);
  requireCondition(record.schemaVersion === 1 && id(record.screenId), "schemaVersion or screenId");
  requireCondition(record.currentApproved === null || id(record.currentApproved), "currentApproved");
  requireCondition(Array.isArray(record.revisions) && record.revisions.length > 0, "revisions are required");
  const ids = new Set<string>();
  const variants = new Set<string>();
  let previousApproved: string | null = null;
  for (const item of record.revisions) {
    const revision = object(item);
    requireCondition(id(revision.id) && id(revision.variantId), "revision and variant IDs");
    requireCondition(!ids.has(revision.id) && !variants.has(revision.variantId), "duplicate revision or variant");
    ids.add(revision.id); variants.add(revision.variantId);
    if (revision.approval === null) continue;
    const approval = object(revision.approval);
    requireCondition(typeof approval.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(approval.date) && !Number.isNaN(new Date(approval.date).valueOf()) &&
      new Date(approval.date).toISOString().slice(0, 10) === approval.date, "approval date");
    requireCondition(text(approval.decision), "explicit user decision is required");
    requireCondition(approval.reason === null || text(approval.reason), "reason must be stated or null");
    requireCondition(approval.supersedes === previousApproved, "supersedes must name the previous approved revision");
    const source = object(approval.source);
    requireCondition(typeof source.commit === "string" && /^[a-f0-9]{40}$/.test(source.commit), "full source commit");
    requireCondition(typeof source.fingerprint === "string" && /^[a-f0-9]{64}$/.test(source.fingerprint), "source fingerprint");
    requireCondition(texts(approval.behaviour) && approval.behaviour.length > 0, "agreed behaviour is required");
    requireCondition(texts(approval.deviations), "deviations must be an explicit list");
    requireCondition(Array.isArray(approval.captures) && approval.captures.length > 0, "reference captures are required");
    const captures = new Set<string>();
    for (const item of approval.captures) {
      const capture = object(item);
      requireCondition(referencePath(capture.path) && /\.(png|jpe?g|webp)$/.test(capture.path), "capture path");
      requireCondition(typeof capture.sha256 === "string" && /^[a-f0-9]{64}$/.test(capture.sha256), "capture hash");
      requireCondition(id(capture.state) && ["light", "dark"].includes(String(capture.theme)), "capture state/theme");
      requireCondition(Number.isInteger(capture.width) && Number(capture.width) > 0 &&
        Number.isInteger(capture.height) && Number(capture.height) > 0 &&
        typeof capture.scale === "number" && Number.isFinite(capture.scale) && capture.scale > 0, "capture dimensions/scale");
      const key = JSON.stringify([capture.state, capture.theme, capture.width, capture.height]);
      requireCondition(!captures.has(key), "duplicate capture conditions");
      captures.add(key);
    }
    previousApproved = revision.id;
  }
  requireCondition(record.currentApproved === previousApproved, "currentApproved must name the latest explicit approval, or null before the first");
  return value as ApprovalRecord;
}

export function revisionFor(approval: RecordedApproval, variantId: string): DesignRevision {
  const revision = approval.record.revisions.find(item => item.variantId === variantId);
  if (!revision) throw new Error(`Register a design revision for layout: ${variantId}`);
  return revision;
}

export function revisionStatus(record: ApprovalRecord, revision: DesignRevision): "Draft" | "Approved" | "Superseded" {
  return !revision.approval ? "Draft" : record.currentApproved === revision.id ? "Approved" : "Superseded";
}

export function referenceStatus(approval: RecordedApproval, revision: DesignRevision,
  conditions: { state: string; theme: string; width: number; height: number }): string {
  const status = revisionStatus(approval.record, revision);
  if (!revision.approval) return status;
  if (!approval.sourceMatches[revision.id]) return `${status} · source changed`;
  const covered = revision.approval.captures.some(capture => capture.state === conditions.state &&
    capture.theme === conditions.theme && capture.width === conditions.width && capture.height === conditions.height);
  return covered ? status : `${status} · outside recorded comparison states`;
}
