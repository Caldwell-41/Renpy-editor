# Current checkpoint handover

**Prepared:** 2026-09-20.
**Repository:** `Caldwell-41/Renpy-editor`.
**Branch / PR:** `maintenance/ci-optimisation`, [PR #12](https://github.com/Caldwell-41/Renpy-editor/pull/12).
**Delivery:** [OPT-1A Windows validation repair](../tasks/active/ci-opt-1a-second-corrective-pass.md).
**State:** `awaiting_ci`; published repair awaits exact-log native acceptance; not
review-ready and not merged.
**Implementation candidate:** `270dc2aa769e4bb69e017288f099d972c6f9961a`.
**Published candidate head:** `d6e311d6d58a83b06a341988062385bbd5f4fc6a`.
**Pending quality:** push run `35492538939` and PR run `35492541232`, attempt 1.
**W1 prerequisite:** W0 automatic support remains unqualified/no-go and is not waived.

## Superseded acceptance

Raw GitHub logs prove the combined Windows quality step hid a failed privacy suite when
the following CI-tooling command succeeded. At `a9631343`, push run `35435261321` /
Windows job `105876723427` and PR run `35435263405` / job `105876728690`, attempt 1,
each discovered 37 privacy tests: 20 passed, 1 failed, 15 errored and 1 skipped; all 47
following CI-tooling tests passed. At documentation head `aad8d0a`, push run
`35436013835` / job `105878666437` and PR run `35436015412` / job `105878671087`
repeated those counts. Provider step/job/run conclusions were success but are not test
acceptance.

The earlier `b6e064d` push run `35431546974` / Windows job `105866946893` and PR run
`35431548846` / job `105866952061` were affected too: 35 privacy tests discovered,
19 passed, 1 failed, 14 errored and 1 skipped, followed by 41 passing CI-tooling tests.
These six Windows jobs are retained as failed evidence behind provider-success badges.
Their repository and macOS jobs retain only their own scope.

## Repair and local evidence

The Windows creator installed the restrictive DACL but did not set the owner. The
fail-closed verifier correctly requires current-account ownership, causing the repeated
`Private directory permissions could not be verified; setup refused.` result whenever
the Windows token creates a directory under another allowed owner. The repair sets only
the owner section to the validated current SID after the DACL operation; it does not
rewrite the DACL or SACL. Type, link/reparse, hardlink, allowed-ACE, external-root and
SQLite-companion checks are preserved. A native regression reports only a generic
initial-owner category and requires owner normalisation plus the full verifier.

Native privacy and CI-tooling commands are now separate required workflow steps. A
Windows PowerShell negative regression proves an exit-23 command followed in the same
script by exit zero is masked, while the failing command in its own invocation remains
23 and an independent later success remains zero. The workflow-structure regression
requires the two separate `run` entries.

Local synthetic Windows evidence at the implementation candidate:

- Privacy/local-state: 40 discovered, 37 passed, 0 failed, 0 errored, 3 explicit
  capability skips.
- CI operation/recovery: 47 discovered and passed, with no failures, errors or skips.
- The positive profile and SQLite protections passed. The unsafe-companion regression
  passed with `sqlite3.connect` uncalled, proving rejection occurred before open.
- Python compilation, exact repository validation for 217 public files and
  `git diff --check` passed.
- Lossless/source: 26 passed. The 620,000-byte / 40,000-node benchmark passed at
  161.92 ms median across seven samples.

No real profile/journal was created or changed. The four preceding hardening fixes are
preserved. No W0 recovery, W1, OPT-2, application feature, merge or branch cleanup was
performed. Production/application inputs are unchanged, so accepted production run
`35431721525`, attempt 1, retains only its original scope and no new production matrix
is justified.

## Pending publication and next action

The coherent repair is published at the candidate head above. Automatic Repository
quality push run `35492538939` and PR run `35492541232`, attempt 1, were in progress
when this handover was written. Do not actively poll or redispatch. On resumption,
collect those same runs and inspect actual Windows x64 and macOS ARM64 suite summaries
plus the Windows generic owner-probe line. Completion requires both native jobs to show
genuine privacy and CI-tooling passes with separate discovered/passed/failed/errored/
skipped counts. Then update the corrective ledger, CURRENT, this handover and PR #12's
description, returning the delivery to review-ready only if the evidence passes. Do not
run the production matrix or merge.
