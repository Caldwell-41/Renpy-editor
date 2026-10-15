# Current status

## Unsloth Studio model-load settings — automated qualification complete

Updated 2026-10-16. The [model-load amendment](../tasks/active/walkthrough-redesign-implementation.md#user-selected-model-load-configuration-amendment--2026-10-15)
is implemented, independently reviewed and **review_ready** after terminal audit of
[run 38736854507](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38736854507).
Both Windows x64 and macOS ARM64 passed on candidate
`7551a9c91cb5e4bba7617f8c10843584be3ef2a1`, branch `codex/phase3a-story-logic`.
Run attempt 1, cumulative ordinal 3, completed successfully at 2026-10-15T12:50:18Z.
Later documentation commits record that candidate without replacing it.

| Capability | Implementation and automated proof | Acceptance limit |
| --- | --- | --- |
| AI Settings model loading | Configurable parallel slots, GPU memory mode and fitting; suggested defaults 1/manual/off with the existing 32768 context field. Explicit Read/Apply/read-back preserves unrelated options. | Mocked service/UI proof; no actual endpoint settings write or reload. |
| Loaded-model readiness | Different effective settings warn when the request fits verified capacity. Authentication, unsafe writes and actual capacity failures still refuse. | Fitting policy can remain unverified. No exact application-version gate. |
| Characters, Game setup and Lorebook | Unified cards, project context, retained-version restore and draft-preservation checks passed. | Native physical-input and whole-phase human acceptance remain pending. |

Each final host passed 69 UI/protocol cases, 68 Rust cases, 28 browser states and
27 checker fixtures, plus typecheck, test compilation and renderer build. Audit
verified all 300 tracked input hashes, true source identity with no missing/mismatched
files, complete artifact manifests, retained executable hashes/architectures, privacy
and closed browser/server cleanup. The earlier CRLF evidence defect is corrected;
its original false receipts remain in the task history.

No CI operation or amendment work remains pending. The reset 10 LLM allowance is
unused. Historical live 5/12, reserved tokens 10240/32768, inventory 3/4, loads 2/2,
paired CI 3/3 and prior extra reruns 10/10 remain charged. Six older live actions remain
unrun and are outside this amendment's mocked acceptance. No owner calls are scheduled.

[HANDOVER](HANDOVER.md) owns recovery. Preserve the original app's unsaved Mara draft;
no local production/package builds or new native editor launches occurred. Phase2/3A
remain incomplete with human acceptance pending. No merge or release is authorised.
