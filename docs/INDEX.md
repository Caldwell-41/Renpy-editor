# Documentation index

Start with [current status](status/CURRENT.md), the
[continuation handover](status/HANDOVER.md), and the relevant brief in
[`tasks/active`](tasks/active/).

The historical Phase 1A–1D implementations and their integrated correction are merged
through PR #7. A bounded [Phase 1D UI operation/Flush follow-up](tasks/archive/2026-09-15-phase-1d-ui-operation-follow-up.md)
passed its local and supported-target gates after a post-merge review found one
truthful-persistence race, then merged through PR #8 with post-merge gates passed.
Phase 1E/later remains separately approval-gated.

Read the [Phase 1 vertical-slice plan](tasks/active/phase-1-vertical-slice.md) for
explicit prerequisite ownership and internal gates, and [ROADMAP.md](ROADMAP.md) for
Phases 2–5 and release boundaries. Neither document is an open-ended coding task.
Historical status snapshots retain prior evidence, not current instructions.

| Concern | Canonical document |
| --- | --- |
| Product scope and workflows | [PRODUCT.md](PRODUCT.md) |
| Boundaries, project convention, persistence and preview | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Source, project, character appearance, assets, variables and transactions | [DATA_MODEL.md](DATA_MODEL.md) |
| Workspaces and interaction | [UI.md](UI.md) |
| Threat model and privacy | [SECURITY.md](SECURITY.md) |
| Public vulnerability reporting | [../SECURITY.md](../SECURITY.md) |
| Public licence and attribution | [../LICENSE](../LICENSE) and [../NOTICE](../NOTICE) |
| Contribution and inbound licensing terms | [../CONTRIBUTING.md](../CONTRIBUTING.md) |
| Test strategy and quality gates | [TESTING.md](TESTING.md) |
| Transaction, durability, and recovery contract | [TRANSACTIONS.md](TRANSACTIONS.md) |
| Phases and exit criteria | [ROADMAP.md](ROADMAP.md) |
| Phase 1 milestone sequence and 1E prerequisites | [tasks/active/phase-1-vertical-slice.md](tasks/active/phase-1-vertical-slice.md) |
| Completed Phase 1D UI operation/Flush follow-up | [tasks/archive/2026-09-15-phase-1d-ui-operation-follow-up.md](tasks/archive/2026-09-15-phase-1d-ui-operation-follow-up.md) |
| Completed correction execution record, R1–R7 | [tasks/archive/2026-09-15-phase-1a-1d-correction-follow-up.md](tasks/archive/2026-09-15-phase-1a-1d-correction-follow-up.md) |
| Integrated correction and evidence ledger | [tasks/archive/2026-09-15-phase-1a-1d-integrated-corrective.md](tasks/archive/2026-09-15-phase-1a-1d-integrated-corrective.md) |
| Historical Phase 1D supporting authoring task | [tasks/archive/2026-09-15-phase-1d-supporting-authoring.md](tasks/archive/2026-09-15-phase-1d-supporting-authoring.md) |
| Historical Phase 1C single-instance correction | [tasks/archive/2026-09-14-phase-1c-single-instance.md](tasks/archive/2026-09-14-phase-1c-single-instance.md) |
| Historical Phase 1C durability/race remediation | [tasks/archive/2026-09-14-phase-1c-durability-race-remediation.md](tasks/archive/2026-09-14-phase-1c-durability-race-remediation.md) |
| Historical Phase 1C corrective remediation | [tasks/archive/2026-09-14-phase-1c-corrective-lifecycle.md](tasks/archive/2026-09-14-phase-1c-corrective-lifecycle.md) |
| Historical Phase 1C lifecycle gate | [tasks/archive/2026-09-14-phase-1c-project-lifecycle.md](tasks/archive/2026-09-14-phase-1c-project-lifecycle.md) |
| Historical Phase 1B corrective remediation | [tasks/archive/2026-09-14-phase-1b-corrective-transaction-recovery.md](tasks/archive/2026-09-14-phase-1b-corrective-transaction-recovery.md) |
| Historical Phase 1A implementation gate | [tasks/archive/2026-09-14-phase-1-production-scaffold.md](tasks/archive/2026-09-14-phase-1-production-scaffold.md) |
| Historical Phase 1B gate | [tasks/archive/2026-09-14-phase-1-transaction-recovery.md](tasks/archive/2026-09-14-phase-1-transaction-recovery.md) |
| Continuation handover | [status/HANDOVER.md](status/HANDOVER.md) |
| Stack evidence and spike plan | [research/STACK_AND_SPIKES.md](research/STACK_AND_SPIKES.md) |
| Desktop spike evidence | [research/DESKTOP_SPIKE_RESULTS.md](research/DESKTOP_SPIKE_RESULTS.md) |
| Shared UI/WebView evidence | [research/UI_WEBVIEW_SPIKE_RESULTS.md](research/UI_WEBVIEW_SPIKE_RESULTS.md) |
| Native credential-store evidence | [research/CREDENTIAL_STORE_SPIKE_RESULTS.md](research/CREDENTIAL_STORE_SPIKE_RESULTS.md) |
| Branch-graph scale evidence | [research/GRAPH_SCALE_SPIKE_RESULTS.md](research/GRAPH_SCALE_SPIKE_RESULTS.md) |
| Preview/source-mapping evidence | [research/PREVIEW_SOURCE_MAPPING_SPIKE_RESULTS.md](research/PREVIEW_SOURCE_MAPPING_SPIKE_RESULTS.md) |
| Parser spike and acceptance tests | [research/PARSER_ROUND_TRIP.md](research/PARSER_ROUND_TRIP.md) |
| Parser spike evidence | [research/PARSER_SPIKE_RESULTS.md](research/PARSER_SPIKE_RESULTS.md) |
| SDK adapter evidence | [research/RENPY_SDK_SPIKE_RESULTS.md](research/RENPY_SDK_SPIKE_RESULTS.md) |
| Representative fixture proposal | [fixtures/REPRESENTATIVE_GAME.md](fixtures/REPRESENTATIVE_GAME.md) |
| Repository/privacy audit | [audits/2026-09-10-repository-and-privacy.md](audits/2026-09-10-repository-and-privacy.md) |
| Public-release readiness audit | [audits/2026-09-14-public-release-readiness.md](audits/2026-09-14-public-release-readiness.md) |
| Phase 1A dependency/licence review | [dependencies/phase-1a.md](dependencies/phase-1a.md) |
| Decision records | [`adr/`](adr/) |

The completed [Phase 0 corrective review](tasks/archive/2026-09-13-phase-0-corrective-review.md)
and [Phase 0 evidence task](tasks/archive/2026-09-13-phase-0-evidence-spikes.md) remain
historical evidence. Completed task briefs move to [`tasks/archive`](tasks/archive/);
they are not canonical product documentation. Corrective briefs stay active until
their actual regressions and supported-target gates close.
