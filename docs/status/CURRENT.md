# Current status

## Walkthrough redesign — awaiting final CI evidence check

Updated 2026-10-15. The active [implementation task](../tasks/active/walkthrough-redesign-implementation.md)
includes the user's newer [Unsloth Studio amendment](../tasks/active/walkthrough-redesign-implementation.md#user-selected-model-load-configuration-amendment--2026-10-15).
The reviewed evidence correction is published on `codex/phase3a-story-logic` as
`7551a9c91cb5e4bba7617f8c10843584be3ef2a1`. It is **awaiting_ci**:
[run38736854507](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38736854507),
run attempt1, cumulative ordinal3, last observed queued at2026-10-15T12:43:48Z.
Both earlier platform jobs passed their tests; terminal audit found a checker defect
comparing normalized Git blobs with declared CRLF checkout bytes. The fix uses Git's
checkout representation and an explicit complete-source gate, with27 passing checker
fixtures and independent review. Required hosts remain Windows x64/macOS ARM64.

| Capability | Implementation and automated proof | Acceptance limit |
| --- | --- | --- |
| AI Settings model loading | Configurable parallel slots, GPU memory mode and fitting; suggested defaults1/manual/off with the existing32768 context field. Explicit Read/Apply/read-back preserves unrelated options. | Mocked service/UI proof; no actual endpoint settings write or reload. |
| Loaded-model readiness | Different effective settings warn when the request fits verified capacity. Authentication, unsafe writes and actual capacity failures still refuse. | Fitting policy may remain unverified. No exact application-version gate. |
| Characters, Game setup and Lorebook | Unified writing/game cards, project context, retained-version restore and draft-preservation checks passed. | Native physical-input and whole-phase human acceptance remain pending. |

Each completed CI host passed69 UI/protocol cases,68 Rust cases,28 browser states,
25 checker fixtures and build checks. Artifact ZIP/manifest/binary hashes, architectures,
privacy and cleanup passed audit. Both old sourceMatchesCandidate flags remain false;
those runs do not satisfy final qualification. Exact evidence and the focused27-case
correction proof belong to the task ledger.

The user's reset10 LLM allowance is unused; the amendment uses mocks. Historical
usage remains live5/12, reserved tokens10240/32768, inventory3/4, loads2/2,
pairedCI3/3 charged and prior additional reruns10/10. The six older live actions remain
unrun and are not prerequisites for this newer mock-based amendment. No owner calls
are scheduled. Preserve the original app's unsaved synthetic Mara draft without
interaction; no local production/package builds or new native editor launches.

[HANDOVER](HANDOVER.md) owns continuation and recovery. Next is manual same-chat
terminal audit of the recorded run. No further paired attempt is authorised. Phase2/3A remain
incomplete, with earlier technical baselines review_ready and human acceptance pending.
No merge, release or credential/signing-policy change is authorised.
