import assert from "node:assert/strict";
import test from "node:test";
import { validateRequest, validateRelativePath } from "../src/shared/contracts.js";

test("accepts a narrow normalized read request", () => {
  assert.deepEqual(validateRequest({ operation: "readText", projectId: "11111111-1111-4111-8111-111111111111", relativePath: "game/script.rpy" }), {
    operation: "readText", projectId: "11111111-1111-4111-8111-111111111111", relativePath: "game/script.rpy",
  });
});

test("denies renderer-supplied roots and forged project identifiers", () => {
  assert.throws(() => validateRequest({ operation: "readText", root: "/project", relativePath: "game/script.rpy" }), /root|projectId/u);
  assert.throws(() => validateRequest({ operation: "readText", projectId: "../../project", relativePath: "game/script.rpy" }), /projectId/u);
});

test("denies unknown operations and commands", () => {
  assert.throws(() => validateRequest({ operation: "shell", command: "rm" }), /allowlisted/);
  assert.throws(() => validateRequest({ operation: "startMockSdk", command: "arbitrary", args: [], timeoutMs: 1000 }), /allowlisted/);
});

test("denies traversal and machine-native path spellings", () => {
  for (const candidate of ["../secret", "game/../secret", "/etc/passwd", "C:/secret", "game\\script.rpy", "game//script.rpy"]) {
    assert.throws(() => validateRelativePath(candidate));
  }
});

test("bounds write content, hashes, arguments, and run identifiers", () => {
  assert.throws(() => validateRequest({ operation: "writeTextAtomic", projectId: "11111111-1111-4111-8111-111111111111", relativePath: "game/a.rpy", expectedSha256: "bad", contents: "x" }));
  assert.throws(() => validateRequest({ operation: "startMockSdk", command: "version", args: new Array(17).fill("x"), timeoutMs: 1000 }));
  assert.throws(() => validateRequest({ operation: "startMockSdk", command: "version", args: [], timeoutMs: 0 }));
  assert.throws(() => validateRequest({ operation: "startMockSdk", command: "version", args: [], timeoutMs: 30_001 }));
  assert.throws(() => validateRequest({ operation: "cancelMockSdk", runId: "../../pid" }));
});
