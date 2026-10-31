# Complete PR validation

`Loomlight validation` is the combined PR status for the current candidate. It
covers Repository quality and the qualifications explicitly selected in
[the validation plan](../../.github/validation-plan.json). A passing status means
those automated jobs passed. The result still needs the task's normal evidence
audit; it does not grant human acceptance, merge or another costly attempt.

## Select the work before starting CI

On each new PR branch, update `.github/validation-plan.json` before publication.
Set `branch` to that branch's name. Keep `version: 1`. List each required manual
workflow and its exact GitHub job names in `qualifications`. An explicit empty
list selects Repository quality only when that satisfies the task. An inherited
plan for a different branch, a missing plan or invalid selection reports an error.
The selected task owns the reason for requiring qualification and its operation
limits; the JSON file owns the executable selection.

For example, Windows Style qualification selects:

```json
{
  "version": 1,
  "branch": "codex/example-style-change",
  "qualifications": [
    {
      "name": "Windows Style qualification",
      "workflow": "screens-source.yml",
      "event": "workflow_dispatch",
      "jobs": ["shared-style / Shared Style (Windows x64)"]
    }
  ]
}
```

Use job names returned by GitHub, including reusable-workflow and matrix names.
List all required target jobs. Keep existing exact-candidate, selector and attempt
controls in their workflows. The coordinator does not infer requirements from a
green PR or start qualification itself.

## Reporting and diagnosis

[The coordinator](../../scripts/ci_validation.py) reads the current PR head and its
plan through GitHub. It selects the newest run of each required workflow/event at
that exact head, then retrieves jobs from that run's exact attempt. Automatic
Repository quality always requires `Frontend tests and Rust formatting` and
`Validate repository` from a `pull_request` run. A manual run of the same workflow
cannot replace them.

A required run that has not started, or a required job that is queued/running,
keeps the status pending. Failed/cancelled runs, missing/duplicate required jobs
and required skips prevent success. Unselected specialist skips are allowed.
Any failed executed job in a selected run also prevents success. Newer runs replace
older results; the coordinator does not search backwards for a passing attempt.
A new commit needs its own results. A PR that moves during evaluation receives no
status from that outdated snapshot.

Each update's job summary lists the required workflows, their states and links to
exact attempts. The PR status links to that summary. Diagnose the original test
job and its retained logs/artifacts; the coordinator preserves their ownership.
API errors and unavailable plans/evidence report an error where publication is
possible. A missing report or unavailable reporter cannot establish completion.

## Workflow entry points

[The shared reporter](../../.github/workflows/validation-status.yml) runs at the
start and finish of the registered quality, Screens, production-scaffold, runtime
foundation/feasibility, SDK-spike and desktop-spike entry points. The finish job
uses `always()` and depends on all existing jobs. Only reporting jobs receive
commit-status write permission. The existing test jobs keep their permissions.
Reporters serialize updates by branch and recalculate current GitHub state.
They do not poll, dispatch another workflow or execute downloaded project data.

Selected manual workflows must have reporting hooks. Use a reporting entry point
when a reusable qualification also has a historical standalone dispatch. When
adding an entry point, call the shared reporter at its start and finish, make the
finish call depend on every test job, and preserve the reporting job name prefix
`Validation status (`. The coordinator excludes only those reporting jobs from
its in-progress-work check, because its own finish job is still running.

A hard cancellation or GitHub outage can prevent a final report. The required
status then stays unresolved until an agent inspects the exact run and invokes
the existing reporter through a safe entry point. It must not be set to success
by hand.

Before starting an additional authorized run after a candidate already passed,
set its `Loomlight validation` commit status to `pending`, then dispatch and record
the new run/attempt. This closes the gap while the run is queued before its start
reporter executes. A rejected or ambiguous dispatch needs inspection, not a pass
or duplicate launch. Preserve cumulative limits and the existing audit owner.

## Cheap coordinator checks

Run `python3 -m unittest discover -s scripts -p test_ci_validation.py -v` and
`.toolchains/actionlint/actionlint`. These exercise coordinator behavior without
starting Ren'Py, a helper, a package or a native application.

The registered Repository quality workflow also accepts `validation_dummy=true`
and `validation_dummy_result=pass|fail`. This selects only a short Windows dummy
job and the reporting hooks; all ordinary and specialist jobs are excluded from
that manual run. Its job is named `Dummy qualification / Windows x64`. Select it
in the branch's validation plan only for testing CI reporting. It is not SDK or
product qualification. Automatic PR quality remains a separate required run.

## Required status and client verification

Require `Loomlight validation` in the integration branch's GitHub rules. Retain
existing repository protections. Install that requirement only for integration
branches where the reporting workflows are available; do not block an unrelated
baseline which has not received them.

Before relying on a client watcher, verify that ordinary checks can finish while
the combined status remains pending, an intentional dummy failure is visible,
and a later passing dummy makes the required status pass. Confirm actual same-
thread delivery separately. A status update visible on GitHub does not prove that
T3 resumed the agent. T3 uses its built-in PR watcher; Codex desktop can use its
compatible installed `ci-watch` skill. Follow [the wait procedure](../WORKFLOW.md#waiting-without-model-polling).
