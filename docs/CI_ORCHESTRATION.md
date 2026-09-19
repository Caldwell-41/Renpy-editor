# Candidate-bound CI operations

**Implemented:** OPT-1A with the 2026-09-19 second corrective architecture.
This tooling submits and collects one exact production candidate. It does not watch
continuously, resume Codex, manipulate goals, rerun failures, merge changes, or reuse
acceptance across commits.

## Identity and protected local state

`scripts/ci.py` is fixed to `Caldwell-41/Renpy-editor` and
`.github/workflows/production-scaffold.yml`. A request requires an explicit branch or
tag plus its full lowercase candidate SHA. The helper verifies `origin`, the fetched
remote-tracking ref, and the production-workflow blob from that candidate—not the
mutable local `HEAD` workflow.

Schema 2 operations live in a protected per-user Loomlight application-data root, not
the Git worktree. The versioned SQLite journal records the repository, workflow blob,
ref, candidate, options, deterministic operation key, random request UUID, state,
run/attempt, advisory deadline, completed local checks, job references, structured
result and next action. SQLite and applicable WAL/SHM companions must pass the same
file-type, link-count, POSIX-mode or Windows-ACL checks before use.

The operation key is SHA-256 over public request identity: repository, workflow, ref,
candidate SHA, candidate workflow blob and options. It never includes host, user,
workspace, client or thread identity. The separate UUIDv4 request correlation is also
independent of those values. Both may appear in the GitHub run name, but neither is a
client fingerprint. The private operation selector and complete journal must not be
copied into handovers.

The local transaction reserves an identity before any remote call. A cooperating
process either continues the same record or loses the conditional state transition;
different options cannot bypass an unresolved same-candidate operation. This is
single-store crash safety, not distributed exactly-once dispatch across hosts.

## Commands and exit meaning

Run from the repository root with an available verified Python 3 interpreter:

```text
python scripts/ci.py doctor
python scripts/ci.py preflight
python scripts/ci.py submit --ref maintenance/ci-optimisation --sha <full-sha>
python scripts/ci.py reconcile --operation <private-operation-id>
python scripts/ci.py collect --run <run-id> --attempt <attempt>
python scripts/ci.py collect --run <run-id> --attempt <attempt> --operation <private-operation-id>
```

If a legacy repository-local `.codex-local` entry exists, commands that open the new
journal fail closed. After preserving it without inspection and deciding explicitly to
reinitialise externally, add `--acknowledge-legacy-state`. The flag never reads,
migrates, overwrites or deletes legacy data. Do not use it when an old unresolved
dispatch might exist unless remote reconciliation can establish the requested identity.

`doctor` is non-writing. It reports Git/Python/Node/Rust availability, public collection,
configured-but-unverified dispatch authentication, external-state resolution,
unverified Codex binding and automatic wake disabled. `preflight` runs exact staged and
working publication validation, privacy/local-state tests, CI-operation tests and any
available frontend/Rust-format checks. It reports candidate/index identity and marks
unavailable native work as delegated rather than passed.

`submit` returns exit 0 only for a validated direct or reconciled run receipt. Package
builds remain mandatory; package artifact upload is opt-in with `--upload-packages`.
`--force-full` is only a scope marker and cannot bypass an unresolved/colliding local
operation or grant retry authority.

`reconcile` is read-only and never POSTs. Exit 0 means the selected operation attached
to one proven run. Exit 4 means no safe attachment yet; zero matches or incomplete
pagination stay unresolved, while multiple or contradictory identities become blocked.
The same command supports a saved direct run ID whose metadata was temporarily
unavailable. Ordinary recovery never requires SQLite edits or internal Python calls.

`collect` is read-only. Without `--operation` it creates no state and uses unauthenticated
public metadata. With an operation it validates and checkpoints that record and may use
approved local GitHub credentials solely to capture bounded private failure logs. Exit
0 is exact acceptance, exit 3 is a truthful non-accepted result, and exit 1 is blocked
identity/transport/storage/evidence.

## Dispatch and reconciliation contract

The REST transport uses GitHub API version `2026-03-10`. Dispatch sets
`return_run_details=true`, so the qualified path returns HTTP 200 with
`workflow_run_id`; the legacy HTTP 204 path remains tested. Actions write permission is
required for POST. Credentials come only from `GITHUB_TOKEN` or the configured Git
credential provider and are never printed or persisted.

Before POST, a fresh or prepared operation searches the exact workflow/ref using bounded
pagination. A run is equivalent only when its validated run name carries the same
operation key and options and its event, workflow path, ref and SHA all match. Search
must prove pagination completeness. One match attaches; zero complete matches permits
the first POST; multiple, contradictory, malformed or incomplete evidence blocks.

The production workflow receives `expected_ref`, `expected_sha`, `operation_key`,
random `request_id`, `upload_packages` and reserved `force_full`. Its Ubuntu candidate
job verifies ref/SHA/request syntax, checks out the immutable SHA, recomputes the
operation key from that checkout's workflow blob and runs repository/helper validation.
Both native matrix entries depend on the candidate job and checkout its SHA output.

Intent is committed before POST. A lost response, 204 without a visible run, malformed
receipt or temporarily unavailable direct-run metadata becomes `dispatch_unknown`; it
is never retransmitted. Read-only recovery checks the saved direct ID and then the
complete operation-key search. A failed/cancelled completed run is reported; there is
no retry command in OPT-1A.

## Collection and publication boundary

Collection binds the exact run and attempt and exhausts attempt-specific job pages.
Acceptance requires one `Validate candidate`, one `Windows x64`, and one `macOS ARM64`
job at the candidate SHA, plus affirmative completed conclusions for every declared
candidate, test, security, package, smoke, inventory and evidence step. Only the actual
cache-miss download and non-requested package upload may be skipped. Missing/empty,
duplicate, malformed, unknown, in-progress or unexpectedly skipped evidence cannot
produce `accepted=true`.

Public JSON is an allowlist: run, attempt, candidate, provider status/conclusion,
required-gate summaries, generic reason codes, evidence availability, safe summary and
next action. Provider-controlled job/step names outside the fixed required set and all
log text are excluded. When a protected operation is selected, at most three failed
required-job logs are fetched, each capped at 64 KiB, and stored as untrusted bytes only
in the protected SQLite journal. Signed download URLs, control sequences, credentials,
paths and arbitrary future secret formats therefore cannot enter public output by a
failed regex guess. Logs are never executed or extracted.

## Recovery and limits

- `prepared` may dispatch only after complete no-match reconciliation.
- `dispatching` and `dispatch_unknown` may only reconcile; never POST again.
- `attached` and `running` collect only their recorded run/attempt; never follow reruns.
- Advisory deadlines guide manual recovery. Expiry does not cancel CI or authorise a
  new operation.
- Losing the external journal removes local ownership evidence. Reconstruction is
  read-only and only safe when the deterministic remote identity is unique and complete.
- `.codex-local/` remains ignored as publication convenience, not a live-state boundary.
- W0 automatic wait/wake remains unqualified. Long-running CI uses the published
  manual-resume handover; OPT-1A does not implement W1.

The current dispatch contract is documented by GitHub's
[workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
and the [run-ID response announcement](https://github.blog/changelog/2026-02-19-workflow-dispatch-api-now-returns-run-ids/).
