# Candidate-bound CI operations

**Implemented:** 2026-09-19 as OPT-1A. This tooling submits and collects an exact
production candidate. It does not watch continuously, resume Codex, manipulate goals,
rerun failures, merge changes, or reuse evidence across commits.

## Contract and local state

`scripts/ci.py` is fixed to `Caldwell-41/Renpy-editor` and
`.github/workflows/production-scaffold.yml`. It requires an explicit branch or tag and
full lowercase candidate SHA. Before dispatch it verifies the configured `origin`, the
remote-tracking ref, exact candidate, and workflow blob revision.

Operations use schema 1 in the ignored, ACL/mode-protected local SQLite store below
`.codex-local/ci/`. A random operation/request UUID is independent of host, user,
workspace, client and thread identity. Only the request UUID is sent to GitHub. The
store persists intent before POST and has an atomic unique reservation for candidate,
workflow revision and options. A concurrent or restarted equivalent request attaches
or refuses; `dispatch_unknown` is never retransmitted automatically.

The implementation uses GitHub REST API version `2026-03-10`. Dispatch requires an
existing locally supplied `GITHUB_TOKEN` or the configured Git credential provider,
with Actions write permission for this repository. The tool never prints or persists
that token. Public read-only collection
does not require dispatch authority. Missing credentials are a local setup action;
never paste them into chat, commits, issues, Actions logs or artifacts.

## Commands and exit meaning

Run from the repository root with an available Python 3 interpreter:

```text
python scripts/ci.py doctor
python scripts/ci.py preflight
python scripts/ci.py submit --ref maintenance/ci-optimisation --sha <full-sha>
python scripts/ci.py collect --run <run-id> --attempt <attempt>
python scripts/ci.py collect --run <run-id> --attempt <attempt> --operation <operation-id>
```

`doctor` is non-writing. It reports local tools, public collection availability,
locally configured-but-unverified dispatch authentication, unverified Codex binding,
and automatic wake disabled. `preflight` runs staged/working privacy validation,
privacy and CI helper tests, frontend checking and Rust formatting. It records the
candidate and index identity. Native acceptance remains delegated, not passed locally.

`submit` exits 0 only with a validated direct or reconciled run receipt. Package builds
remain mandatory, but package upload is opt-in through `--upload-packages`. `--force-full`
is only a no-reuse marker; it does not grant retry authority or cancel another run.
The current API normally returns HTTP 200 with the run ID. Legacy 204 and lost-response
paths search a bounded set of workflow runs for the exact request UUID, ref and SHA.
Zero, multiple or contradictory matches leave a blocked/unknown operation and prohibit
another POST.

`collect` is read-only. Without `--operation` it creates no journal and needs only the
run/attempt. With `--operation` it verifies and updates that local operation. Exit 0
means the exact attempt completed successfully and all three required jobs—candidate
validation, Windows x64 and macOS ARM64—completed successfully at the candidate SHA.
Exit 3 means a truthful non-accepted result; exit 1 means identity, transport, storage
or evidence was blocked. Missing, skipped, neutral, stale, cancelled, timed-out,
action-required and unknown results never become acceptance.

## Workflow behavior and evidence

Manual dispatch inputs are `expected_sha`, opaque `request_id`, `upload_packages`, and
the reserved `force_full`. The cheap Ubuntu candidate job validates strict identities,
compares `expected_sha` with GitHub's immutable resolved event SHA, checks out that SHA,
and runs repository/privacy/helper validation. Both native matrix jobs depend on it and
checkout its SHA output; a wrong SHA fails before native allocation.

Collection uses the exact run and attempt endpoints plus every attempt-job page. It
does not follow reruns. Result JSON separates provider state/conclusion, required-gate
completeness, acceptance and monitoring errors. For failed required jobs, the live
transport fetches at most three bounded 64 KiB job logs, strips control sequences,
redacts common credentials/user paths/signed URLs, caps lines/bytes and labels
truncation. Logs remain untrusted data and are never executed or extracted. Unavailable
logs stay unavailable rather than changing the result.

## Recovery and limits

- After `prepared`, dispatch can begin. After `dispatching` or `dispatch_unknown`, do
  not submit again. Reconcile the stored request UUID and exact metadata.
- After `attached` or `running`, collect the recorded run and attempt. Never substitute
  a newer attempt or latest branch run.
- A failed/cancelled run is reported. A new run needs explicit retry authority and a
  deliberate recovery design; this command has no automatic rerun option.
- The local uniqueness lease covers cooperating processes sharing one store. It is not
  distributed exactly-once dispatch across hosts.
- The workflow must be discoverable from GitHub's default branch and its requested ref
  must accept the declared inputs. If GitHub rejects a branch-only schema, record the
  platform block; do not merge merely to make the test possible.
- W0 automatic wait/wake remains unqualified. Use a published manual-resume handover
  for long-running CI. OPT-1A success is not permission to implement W1.
