# Current checkpoint handover

**Prepared:** 2026-09-19.
**Repository:** `Caldwell-41/Renpy-editor`.
**Branch / PR:** `maintenance/ci-optimisation`, [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12).
**Checkpoint:** W0 review plus user-requested local-only configuration safeguards.
**Outcome:** Review ready; automatic wait/wake remains unqualified/no-go. No later
checkpoint has been started or approved by this review.

## Entry and baseline

Read [AGENTS](../../AGENTS.md), [CURRENT](CURRENT.md),
[WORKFLOW](../WORKFLOW.md), [local client setup](../LOCAL_CODEX_CONFIG.md),
[active plan](../tasks/active/ci-optimisation.md) and
[qualification report](../research/CODEX_WAIT_WAKE_QUALIFICATION.md).
Reuse this branch/PR. The review started at `7062f63e73025feffe240faffc88418ea3e5c895`,
following W0 evidence candidate `24c0f0b5e02ff73d18cb7c872a15719a4edd0b7c`.
Main's planning baseline was `7d634eeaf53fe0244a2739f26914797ca16ef544`.
Resolve current remote head; these are evidence references, not reset instructions.

## Review changes

Corrected stale not-started/new-branch text; qualified unsupported-host claims to the
actual path examined; retained unperformed live-test gates. Private observations are
not represented as independently repeated proof. Removed installed desktop-build
inventory from current shared text; prior commits remain unchanged.

Added `scripts/codex_local.py`, a placeholder-only client template, `.codex-local/`
ignore rules, local-configuration policy, validator index guards and offline privacy
tests in the cheap quality job. Initialisation never contacts Codex or GitHub, touches
credentials, manipulates a goal, or enables automatic waiting. A distinct detected
client context gets a fresh blank profile; every session still verifies actual ownership.

Raw host/client identity and runtime task/queue/turn bindings stay local, including
local evidence. Never copy them into this handover, commits, PRs, CI output or artifacts.
Before using host-specific tooling on a new client, run the documented local bootstrap
on that actual host and complete verified fields locally. This remote review did not
set up the user's real client or infer its current runtime values.

## Validation and limitations

Local review: **16 offline privacy/bootstrap tests passed**, with no skips, on
synthetic Git fixtures in the Linux review environment. Changed-file privacy and staged
whitespace checks passed. The publishing commit contains these tests and their
quality-workflow step. Run `python -m unittest discover -s tests/ci_privacy -v` and
`python scripts/validate.py` on the actual checkout; inspect the exact publishing
commit's checks for full repository validation. The local review exercised synthetic
Git fixtures and changed-file checks, not a full downloaded checkout.

Original W0 evidence includes successful Repository quality runs `35404027500` and
`35404031132`, attempt 1, for `2917b50a0c469d9308c0cb118a1a36ad554760fd`.
Those checks validate documentation, not live runtime feasibility or this review's
new code. The publishing commit/checks provide the new receipt; do not commit another
handover merely to chase its own SHA or CI result.

No native Windows/macOS bootstrap execution or ACL qualification, live queue/resume,
actual goal suspension/inactivity, watcher persistence or production matrix was run
by this review. The bootstrap is not a durable event journal or a hostile-local-writer
security boundary. No operation was registered, queued or left awaiting recovery.

## Next bounded action

Stop for user review. Independent **OPT-1A** is the recommended next separately
selected checkpoint; it does not require automatic Codex wake-up. Alternatively the
user may select W0 recovery after its missing prerequisites change. Do not automatically
repeat blocked discovery, start W1-W3, install services, migrate clients or weaken gates.
Each next chat must publish its ledger and this single handover before giving a small
next-chat prompt. Integration and branch/documentation cleanup remain CLOSE work.
