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

Future changes to an accepted decision require a superseding ADR.
