# Current status

## Walkthrough redesign — reviewed model-load settings amendment

Updated 2026-10-15. The active [implementation task](../tasks/active/walkthrough-redesign-implementation.md)
includes the user's newer [Unsloth Studio amendment](../tasks/active/walkthrough-redesign-implementation.md#user-selected-model-load-configuration-amendment--2026-10-15).
Implementation and independent source/API review are complete locally on
`codex/phase3a-story-logic`. The next action is publication of the reviewed candidate
and one paired Windows x64/macOS ARM64 CI dispatch; no run is pending yet.

| Capability | Implementation and automated proof | Acceptance limit |
| --- | --- | --- |
| AI Settings model loading | Configurable parallel slots, GPU memory mode and fitting; suggested defaults1/manual/off with the existing32768 context field. Explicit Read/Apply/read-back preserves unrelated options. | Mocked service/UI proof; no actual endpoint settings write or reload. |
| Loaded-model readiness | Different effective settings warn when the request fits verified capacity. Authentication, unsafe writes and actual capacity failures still refuse. | Fitting policy may remain unverified. No exact application-version gate. |
| Characters, Game setup and Lorebook | Unified writing/game cards, project context, retained-version restore and draft-preservation checks passed. | Native physical-input and whole-phase human acceptance remain pending. |

Current amendment evidence includes27 distinct core cases,12 native request-host cases,
41 renderer/protocol cases, the focused Apply-copy regression,28 browser states and25
CI-checker fixtures; actionlint passed. Exact results and corrections belong to the
task ledger. Required exact-candidate CI evidence is still pending.

The user's reset10 LLM allowance is unused; the amendment uses mocks. Historical
usage remains live5/12, reserved tokens10240/32768, inventory3/4, loads2/2,
pairedCI1/3 reserved and prior additional reruns10/10. The six older live actions remain
unrun and are not prerequisites for this newer mock-based amendment. No owner calls
are scheduled. Preserve the original app's unsaved synthetic Mara draft without
interaction; no local production/package builds or new native editor launches.

[HANDOVER](HANDOVER.md) owns continuation and recovery. Phase2/3A remain incomplete,
with earlier technical baselines review_ready and human acceptance pending. No merge,
release or credential/signing-policy change is authorised.
