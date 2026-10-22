# Architecture decision records

ADRs record durable architecture, product and workflow decisions with their context,
rationale, consequences, alternatives and evidence. Use sequential filenames, state
the date and decision status, and link supporting records. Accepted decisions and
recorded results are immutable; supersede them with a later ADR. Reference-only link
repairs may follow relocated material without changing a decision or result.

The status column describes the decision, not implementation or native/human
acceptance. "Recorded decision" means the ADR gives delivery status without a separate
acceptance label; it does not infer approval. Reviewed and proposed scope retains
those limits. For current delivery, qualification and unresolved work, read
[CURRENT](../status/CURRENT.md), [HANDOVER](../status/HANDOVER.md) and the owning task.
Dated evidence inside an ADR remains evidence for its recorded scope and candidate.

| ADR | Decision status | Decision |
| --- | --- | --- |
| [0001](0001-lossless-source-model.md) | Accepted | Original source bytes, conservative partial CST and verified minimal range patches. |
| [0002](0002-versioned-renpy-sdk-adapter.md) | Accepted | Exact-version Ren'Py adapter and checksum-verified staged SDK installation. |
| [0003](0003-tauri-desktop-runtime.md) | Accepted | Tauri 2 with an unprivileged web UI and narrow Rust commands. |
| [0004](0004-journalled-platform-file-transactions.md) | Accepted | Journalled platform replacement and retention of competing revisions. |
| [0005](0005-staged-project-creation.md) | Accepted for Phase 1C | Version-pinned starter generation, sibling staging and no-replace promotion. |
| [0006](0006-scene-authoring-source-and-media-boundary.md) | Accepted for Phase 1E | Exact-range Scene operations, revision-bound history and asset-ID-only media presentation. |
| [0007](0007-shell-save-command-ownership.md) | Accepted design | Shell-owned Save arbitration, document-bound Source acceptance and shared lifecycle coordination. |
| [0008](0008-controlled-runtime.md) | Recorded decision | Explicit session execution, controlled play and separate request/control ownership. |
| [0009](0009-flow-observation-candidates.md) | Superseded by [0010](0010-local-project-safety-and-observed-flow.md) | Historical cached flow candidates with fresh content verification. |
| [0010](0010-local-project-safety-and-observed-flow.md) | Accepted | Local hobby-project safety, ordinary external-edit handling and last-observed Branches. |
| [0011](0011-ai-settings-secrets-and-reference-storage.md) | Accepted design with temporary Mac exception | Device-local profiles and credentials, project prompts/references and explicit private-network HTTP. |
| [0012](0012-bounded-nested-dialogue-ownership.md) | Accepted bounded checkpoint | Source-map v3, explicit group/branch ownership and minimal existing-child dialogue edits. |
| [0013](0013-provider-request-and-transport-contract.md) | Accepted Studio-scoped design; remaining proposed contracts | Bounded Studio request, credential-origin and transport contracts; generic support deferred. |
| [0014](0014-typed-conditions-and-recursive-source-ownership.md) | Independently reviewed | Source-map v4, typed conditions and recursive exact-source ownership. |
| [0015](0015-guarded-choices-and-stable-call-continuations.md) | Independently reviewed | Source-map v5, guarded choices and stable Call continuations. |
| [0016](0016-explicit-body-story-authoring.md) | Independently reviewed | Explicit body/node/position ownership for Story structural commands through shared transactions. |
| [0017](0017-design-approval-and-app-integration.md) | Accepted workflow | Versioned design approval, retained references and separate visual/functional integration proof. |
| [0018](0018-early-screen-source-proof.md) | Recorded decision | Revision-bound screen spans and minimal existing pixel-property edits through shared transactions. |
| [0019](0019-task-briefs-and-evidence-ownership.md) | Accepted documentation workflow | Current task briefs, conditional requirement references and separate historical evidence. |
