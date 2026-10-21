import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseApprovalRecord, referenceStatus, revisionStatus } from "./approval.ts";
import { captureSource, loadApprovalRecords } from "./approval-files.mjs";
import { approvalFixture } from "./approval-fixture.mjs";

const record = approvalFixture();
assert.equal(parseApprovalRecord(record), record);
assert.equal(revisionStatus(record, record.revisions[0]), "Superseded");
assert.equal(revisionStatus(record, record.revisions[1]), "Approved");
const view = { path: "docs/design/example/approval.json", record, sourceMatches: { "starter-v1": true } };
assert.equal(referenceStatus(view, record.revisions[1], { state: "populated", theme: "light", width: 1100, height: 720 }), "Approved");
assert.match(referenceStatus(view, record.revisions[1], { state: "empty", theme: "light", width: 1100, height: 720 }), /outside recorded/);
assert.match(referenceStatus({ ...view, sourceMatches: {} }, record.revisions[1], { state: "populated", theme: "light", width: 1100, height: 720 }), /source changed/);
for (const [change, error] of [
  [candidate => { candidate.currentApproved = null; }, /latest explicit approval/],
  [candidate => { candidate.revisions[1].approval.supersedes = null; }, /previous approved/],
  [candidate => { candidate.revisions[1].approval.decision = ""; }, /user decision/],
  [candidate => { candidate.revisions[1].approval.source.commit = "HEAD"; }, /full source commit/],
  [candidate => { candidate.revisions[1].approval.captures = []; }, /captures are required/],
  [candidate => { candidate.revisions[1].approval.behaviour = []; }, /agreed behaviour/],
  [candidate => { candidate.revisions[1].approval.captures[0].path = "docs/design/../../private.png"; }, /capture path/],
  [candidate => { candidate.revisions[1].approval.date = "2000-02-31"; }, /approval date/],
  [candidate => { candidate.revisions[1].id = "older-v1"; }, /duplicate revision/],
]) {
  const candidate = structuredClone(record);
  change(candidate);
  assert.throws(() => parseApprovalRecord(candidate), error);
}
const draft = { schemaVersion: 1, screenId: "example", currentApproved: null, revisions: [{ id: "draft-v1", variantId: "draft", approval: null }] };
parseApprovalRecord(draft);
assert.equal(revisionStatus(draft, draft.revisions[0]), "Draft");

const root = mkdtempSync(path.join(tmpdir(), "loomlight-design-approval-"));
try {
  function put(relative, content) {
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    writeFileSync(path.join(root, relative), content);
  }
  put("app/src/styles.css", "body { color: teal; }\n");
  put("app/src/icons.ts", "export const icon = 'sample';\n");
  put("app/design-lab/preview.ts", "export const sample = true;\n");
  put("docs/design/example/approval.json", JSON.stringify(draft));
  const capture = Buffer.from("synthetic capture bytes for identity checks");
  put("docs/design/example/reference.png", capture);
  const git = args => execFileSync("git", args, { cwd: root, stdio: "pipe" });
  git(["init", "--quiet"]);
  git(["add", "app", "docs"]);
  git(["-c", "user.name=Loomlight fixture", "-c", "user.email=fixture@users.noreply.github.com", "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Synthetic design source"]);
  const source = captureSource(root);
  const approved = approvalFixture(source, createHash("sha256").update(capture).digest("hex"));
  put("docs/design/example/approval.json", JSON.stringify(approved));
  assert.equal(loadApprovalRecords(root)[0].sourceMatches["starter-v1"], true);
  assert.deepEqual(captureSource(root), source, "Approval metadata does not change the visual source fingerprint");
  put("docs/design/new-screen/approval.json", JSON.stringify({ ...draft, screenId: "new-screen" }));
  assert.throws(() => captureSource(root), /Include the draft approval record/);
  rmSync(path.join(root, "docs/design/new-screen"), { recursive: true });
  put("app/src/styles.css", "body { color: copper; }\n");
  assert.equal(loadApprovalRecords(root)[0].sourceMatches["starter-v1"], false, "Shared-style edits invalidate the current reproduction");
  assert.throws(() => captureSource(root), /Commit the candidate/);
  put("app/src/styles.css", "body { color: teal; }\n");
  put("app/src/icons.ts", "export const icon = 'changed';\n");
  assert.equal(loadApprovalRecords(root)[0].sourceMatches["starter-v1"], false, "Shared-icon edits invalidate the current reproduction");
  put("app/src/icons.ts", "export const icon = 'sample';\n");
  put("docs/design/example/reference.png", "changed capture");
  assert.throws(() => loadApprovalRecords(root), /capture has changed/);
  rmSync(path.join(root, "docs/design/example/reference.png"));
  assert.throws(() => loadApprovalRecords(root), /Missing retained reference capture/);
} finally { rmSync(root, { recursive: true, force: true }); }
const starter = JSON.parse(readFileSync(new URL("../../docs/design/design-lab-character-notes/approval.json", import.meta.url), "utf8"));
assert.equal(parseApprovalRecord(starter).currentApproved, null, "Starter remains unapproved");
console.log("Design approvals passed: history, invalid promotion, capture identity and real Git/shared-source checks.");
