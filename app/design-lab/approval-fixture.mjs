/** Synthetic test data only. It never changes a repository approval record. */
export function approvalFixture(source = { commit: "a".repeat(40), fingerprint: "b".repeat(64) }, captureHash = "c".repeat(64)) {
  const decision = supersedes => ({
    date: "2000-01-01", decision: "Synthetic test approval", reason: null, supersedes,
    source,
    captures: [{ path: "docs/design/example/reference.png", sha256: captureHash, state: "populated", theme: "light", width: 1100, height: 720, scale: 1 }],
    behaviour: ["Synthetic test contract"], deviations: [],
  });
  return {
    schemaVersion: 1, screenId: "character-notes", currentApproved: "starter-v1",
    revisions: [
      { id: "older-v1", variantId: "older", approval: decision(null) },
      { id: "starter-v1", variantId: "starter", approval: { ...decision("older-v1"), reason: "Synthetic replacement reason" } },
    ],
  };
}
