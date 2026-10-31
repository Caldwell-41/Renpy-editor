# Connected native build and test routing

## Outcome and authorization

Kris selected routine T3 access to connected native machines for platform-specific
builds, tests and diagnosis, coordinated from the preferred development machine.
This documentation task uses `codex/connected-native-testing`, based on freshly
fetched `6be2dd0` from `codex/phase3b-screen-designer`, including merged PRs #72
and #73. Kris subsequently selected draft PR publication and the code-review
skill's independent Standards and Spec reviews. New machine setup, product execution
and merge remain unselected.

## Acceptance and current results

- [Host routing](../../WORKFLOW.md#test-host-routing-and-ownership) is the single
  policy owner for connected-target execution, remote assignment ownership and CI
  selection. Existing native acceptance and operation-limit owners remain linked.
- Agent entry, native testing and delivery guidance point to that policy. The
  obsolete CI redirect uses the same reference. Repository search found no remaining
  live CI-first/local-only routing requirement; historical evidence and frozen issue
  drafts retain their original scope.
- [The branch validation plan](../../../.github/validation-plan.json) selects ordinary
  Repository quality only under [complete PR validation](../../testing/CI-VALIDATION.md#select-the-work-before-starting-ci).
  The inherited Windows dummy belongs to the previous CI-reporting experiment.
- `python3 scripts/validate.py` passes for 1,312 repository files, including links
  and privacy checks. The existing `ci_validation.load_plan` accepts this branch's
  quality-only plan; `git diff --check` passes. Self-review checked access boundaries,
  checkout/writer ownership and retained CI/native requirements. No platform
  execution or new tests were needed.

The documentation audit covered both AGENTS files, contributor/agent guidance,
testing runbooks, the task template and current delivery references. TESTING and
the remaining agent guides already defer to the canonical policy. Historical
CI-first evidence in INDEX remains labelled historical.

## State and next action

The documentation is ready for independent review. The draft PR owns publication,
review findings and current-head automatic CI receipts. Preserve the unrelated
untracked audit and existing native recovery; merge remains a separate user decision.
