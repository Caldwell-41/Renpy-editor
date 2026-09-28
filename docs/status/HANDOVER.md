# Current checkpoint handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** Q1 terminal evidence audit, automated **PASS**, `review_ready`.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Qualified candidate:** `8546dcddd5ac95bfe849575fe618f6e990cdd5d4`.
**Candidate tree:** `70ba924580bde3a66678e0ca91e1ae54fc241325`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.
**Publication:** this audit is committed/pushed as a documentation-only successor of
`142ecb0`, with `[skip ci]`; resolve exact publication SHA from Git. This is not a new
qualification candidate. **No operation remains pending.**

## Completed qualification

The user resumed evidence audit only. [Run 36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820),
attempt **1**, completed success at **2026-09-28T06:06:35Z**, exact candidate above.
Preflight job `108804103380`, Windows x64 `108804257548` and macOS ARM64 `108804257567`
all passed. It ran on `windows-2025` / `macos-26` with `upload_packages=true`.

- Preflight: 64 frontend tests and eight retention fixtures passed, plus source/gate
  audits, Source Save browser regression and Rust formatting.
- Broad core: Windows 169 passed / 36 ignored / 3 filtered; Mac 174 / 39 / 3, zero
  failures. Specialist/worker exclusions remain intentional. The separately required
  G1-U2 and four exact SDK gates all passed; no required SDK test was skipped.
- Both desktop tests, ten packaged Runtime cases with complete cleanup and two
  primary/secondary boundary smokes passed. Route Running windows were 9500–9504.1 ms;
  destination/source/revision reopen, live Save/stale revision, draft refusal and Stop
  assertions passed. All six fixed core budget samples passed.
- Browser functional/evidence outcomes, full Branches fixture, dependency inventories
  and privacy scans passed. Chrome timing diagnostics were also within their limits;
  they do not establish native responsiveness or user acceptance.
- All four non-expired artifacts were downloaded. Raw ZIP digests, both retained
  executable hashes (including Mac tar contents), source manifests and all 107 source
  inputs per target were independently verified against the exact candidate. Mac
  retained executable also matches the success-only application package. Installers
  are available and hashed, not installed or launched by this audit.

[Full terminal evidence audit](../tasks/active/testing-policy-alignment.md#q1-terminal-evidence-audit--2026-09-28)
contains job times, exact binary/archive/installer hashes, all measurements and scope
limits. [Phase 1G ledger 41](../tasks/active/phase-1g-branches-runtime-git.md#41-q1-terminal-evidence-audit--automated-pass--2026-09-28)
summarizes the result. Complete raw job logs were retrieved after combined CLI logs
truncated the Mac job. Raw downloads/logs stay outside Git. Documentation validation
and whitespace checks pass.

## Packages, budgets and remaining acceptance

| Artifact | ID |
| --- | --- |
| Windows Q1 evidence | `10953757230` |
| Windows production package | `10953334429` |
| macOS Q1 evidence | `10954175758` |
| macOS production package | `10954061304` |

Remote artifacts expire **2026-10-05, 06:00:54–06:06:11 UTC**. Local copies were retained
on the audit host; use the verified run artifacts for cross-host retrieval before expiry.
Prefer the retained Mac tar when bundle permissions matter. Package identity belongs
in any future native/human evidence; availability is not installation/distribution proof.

Q1 totals: two requests (the prior HTTP 422 rejection plus one accepted run), attempt 1,
**zero retries, two Tauri builds, fourteen top-level Loomlight starts** (five cases plus
primary/secondary per target). This audit added zero executions. Prior R2-P1/H1 failures,
F1/N1 consumed budgets and candidate limits remain unchanged. No conflict resolution,
merge or 1H occurred; no automatic acceptance transfer to another SHA.

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Q1 core/browser and packaged destination/source reopen pass on both targets | MAC-N1 supporting limits retained; Windows native and final acceptance open |
| Runtime foundation / R1 | Yes, prior fixes retained | Q1 final-source SDK service/diagnostics gates pass on both targets | Final native/human acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Coherent standard Q1 packages and all ten cases pass | Focused final user session on both platforms open |

## Next bounded selection

Prepare the remaining Windows packaged native responsiveness/input evidence and one
focused final user session per supported OS under TESTING's ownership/cadence. Verify
available native host/driver access, identify exact packages/fixtures and define the
bounded checks and stop rules before selecting new execution. Preparation may use any
repository-capable Codex host; actual Windows native evidence needs Windows x64, and
final user sessions need each supported platform. No native access is assumed here.
Reuse qualified packages where applicable; no duplicate matrix for documentation.
Final review, conflicts/integration and affected gates remain separate; 1H stays excluded.

```text
/goal Phase 1G remaining acceptance preparation only
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Codex machine: Any with repository/artifact access; no specific OS required.
Test execution: Preparation only; no builds, app launches or CI. Future evidence needs Windows x64 native interaction and focused user sessions on Windows x64/macOS ARM64.
Reason: Q1 automated qualification passed; native and final human acceptance remain.
Read AGENTS.md and docs/status/HANDOVER.md. Prepare bounded remaining checks using the exact Q1 packages; verify native host/driver capabilities and preserve prior evidence limits. Publish the plan/handover and stop before execution. No repeat matrix, merge or 1H.
```
