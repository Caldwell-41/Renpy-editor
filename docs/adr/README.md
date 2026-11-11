# Architecture decision records

ADRs record decisions that are hard to reverse, surprising without context and the
result of a real trade-off. Use sequential filenames, state the date and status, and
keep the record short. Status is `Accepted` or `Superseded by <ADR>`; it describes the
decision, not implementation or acceptance, which live in GitHub Issues. Replace a
decision with a later ADR rather than rewriting it. Link repairs and evidence
removal may follow without changing a decision.

Superseded ADRs 0009, 0019 and 0020 are at the `archive/docs-ledgers-2026-11` tag.

| ADR | Status | Decision |
| --- | --- | --- |
| [0001](0001-lossless-source-model.md) | Accepted | Original source bytes, conservative partial CST and verified minimal range patches. |
| [0002](0002-versioned-renpy-sdk-adapter.md) | Accepted | Exact-version Ren'Py adapter and checksum-verified staged SDK installation. |
| [0003](0003-tauri-desktop-runtime.md) | Accepted | Tauri 2 with an unprivileged web UI and narrow Rust commands. |
| [0004](0004-journalled-platform-file-transactions.md) | Accepted | Journalled platform replacement and retention of competing revisions. |
| [0005](0005-staged-project-creation.md) | Accepted | Version-pinned starter generation, sibling staging and no-replace promotion. |
| [0006](0006-scene-authoring-source-and-media-boundary.md) | Accepted | Exact-range Scene operations, revision-bound history and asset-ID-only media presentation. |
| [0007](0007-shell-save-command-ownership.md) | Accepted | Shell-owned Save arbitration, document-bound Source acceptance and shared lifecycle coordination. |
| [0008](0008-controlled-runtime.md) | Accepted | Explicit session execution, controlled play and separate request/control ownership. |
| 0009 | Superseded by [0010](0010-local-project-safety-and-observed-flow.md) | Historical cached flow candidates with fresh content verification. |
| [0010](0010-local-project-safety-and-observed-flow.md) | Accepted | Local hobby-project safety, ordinary external-edit handling and last-observed Branches. |
| [0011](0011-ai-settings-secrets-and-reference-storage.md) | Accepted | Device-local profiles and credentials, project prompts/references, explicit private-network HTTP and a temporary Mac file-store exception. |
| [0012](0012-bounded-nested-dialogue-ownership.md) | Accepted | Source-map v3, explicit group/branch ownership and minimal existing-child dialogue edits. |
| [0013](0013-provider-request-and-transport-contract.md) | Accepted | Studio-scoped request, credential-origin and transport contracts; generic support deferred. |
| [0014](0014-typed-conditions-and-recursive-source-ownership.md) | Accepted | Source-map v4, typed conditions and recursive exact-source ownership. |
| [0015](0015-guarded-choices-and-stable-call-continuations.md) | Accepted | Source-map v5, guarded choices and stable Call continuations. |
| [0016](0016-explicit-body-story-authoring.md) | Accepted | Explicit body/node/position ownership for Story structural commands through shared transactions. |
| [0017](0017-design-approval-and-app-integration.md) | Accepted | Versioned design approval, retained references and separate visual/functional integration proof. |
| [0018](0018-early-screen-source-proof.md) | Accepted | Revision-bound screen spans and minimal existing pixel-property edits through shared transactions. |
| 0019 | Superseded by [0023](0023-github-issues-own-delivery.md) | Task briefs, conditional requirement references and separate historical evidence. |
| 0020 | Superseded by [0023](0023-github-issues-own-delivery.md) | GitHub Issues own remaining Phase 3B delivery. |
| [0021](0021-separate-renpy-canvas-helper.md) | Accepted | Separate inert Ren'Py canvas helper; live drafts, logical pixel coordinates and an initial 100 ms feedback target. |
| [0022](0022-saving-retained-story-drafts.md) | Accepted | Story Save accepts all pending beat drafts after validating the whole set, through ADR 0007's shell and transaction owners. |
| [0023](0023-github-issues-own-delivery.md) | Accepted | GitHub Issues own scope, acceptance, decisions and results; PRs own work in progress and its evidence; the repository keeps lasting behavior and decisions. |
