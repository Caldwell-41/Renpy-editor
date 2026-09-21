# Architecture decision records

ADRs capture material decisions after evidence is available. Use sequential names
such as `0001-desktop-stack.md`, state the status and date, and include context,
decision, consequences, alternatives, and evidence. Accepted ADRs are immutable;
supersede them with a later ADR rather than editing history.

| ADR | Status | Decision |
| --- | --- | --- |
| [0001](0001-lossless-source-model.md) | Accepted | Exact source bytes, conservative partial CST, verified range patches |
| [0002](0002-versioned-renpy-sdk-adapter.md) | Accepted | Exact-version SDK adapter and verified staged installation |
| [0003](0003-tauri-desktop-runtime.md) | Accepted | Tauri 2 desktop runtime with a narrow Rust privileged core |
| [0004](0004-journalled-platform-file-transactions.md) | Accepted | Journalled platform replacement with retained competing revisions |
| [0005](0005-staged-project-creation.md) | Accepted | Version-pinned starter generation with sibling staging and no-replace promotion |
| [0006](0006-scene-authoring-source-and-media-boundary.md) | Accepted | Exact-range Scene operations, schema v2, revision-bound history, and asset-ID-only media presentation |
| [0007](0007-shell-save-command-ownership.md) | Accepted design | Shell-owned Save arbitration, document-bound Source acceptance and shared operation/lifecycle coordination; delivery tracked in 1F-SAVE |

Future changes to an accepted decision require a superseding ADR. An accepted design
is not a claim that its implementation or supported-target acceptance is complete;
CURRENT, HANDOVER and the linked active task own that delivery state.
