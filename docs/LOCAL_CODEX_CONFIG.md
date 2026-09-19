# Local-only Codex client configuration

**Established:** 2026-09-19, at the user's request.
This is a privacy/bootstrap contract, not an implemented automatic wait/wake mechanism.

## Implementation status and known gaps

The reviewed bootstrap/validator at `33d0e202` does not yet fully enforce this contract.
The validator checks tracked names but reads template/text from the working copy;
the initializer checks an ignored sentinel rather than its actual destination. Existing
16 passing tests do not cover those bypasses. Native Windows ACL protection and
explicit distinction between identical-looking clients also need correction/qualification.

The user has approved these fixes as Gate P of the
[combined privacy plus OPT-1A brief](tasks/active/ci-opt-1a-privacy-and-operation-foundation.md).
Run its synthetic regressions and corrections before trusting sensitive bootstrap
writes. Publishing this document does not implement them. The implementation chat must
update this status with actual results, not leave this warning indefinitely or claim
future protections already exist.

## What belongs where

| Information | Storage |
| --- | --- |
| Hostname, username, paths, Codex home, socket/pipe/endpoint, private IP/DNS, process/device/client identities, binary hashes and installed-build inventory | Protected local client profile/evidence only. |
| Thread/session/goal/queue/turn/claim IDs, pause ownership, raw telemetry and operation journal | Private per-task state, never shared handover. |
| Tokens/passwords/private keys | Existing credential store or protected local environment. |
| Generic platform categories, public upstream source/schema references, capability/test outcomes, repo commit/PR/Actions references | Share only after excluding host-identifying data. |

This covers commits, PR bodies/comments, issues, Actions output, summaries, screenshots,
artifacts and handovers. Hashing a private ID/endpoint is not permission to publish a
stable fingerprint. No local profiles in archives, temporary commits or artifacts.
Export an allowlist of result fields, not a redacted environment dump.

The committed template is [config/codex-client.example.json](../config/codex-client.example.json).
It stays blank/null. `.env.example` also contains placeholders only. Other `.env` files
and `.codex-local/` stay local. A random per-CI-request correlation ID may be sent to
GitHub only when independent of all private client/thread/host identity; it is not a
client fingerprint or permission to export a local journal.

## Agent setup on each actual client

First read AGENTS and the status above. Once Gate P protection is implemented and
verified, the agent runs the documented local initializer on the actual execution host:

```text
python scripts/codex_local.py init
```

Use an available verified Python interpreter; do not auto-install one. No actual host
access means `client setup unavailable`, not surrogate setup in another sandbox.
Authorised host-independent CI development/testing can still proceed.

The existing helper is non-networking and does not invoke Codex, read credentials,
change another process's environment, install a service or enable inference. It creates
routing-profile scaffolding, not a verified runtime connection. Any new selection/
verification options specified in the brief remain hypothetical until implemented.

Keep reusable local client configuration separate from private per-task bindings.
The old routing key combines hostname, home directory, workspace, Codex home and PATH
observations; it does not uniquely identify an owning runtime. Gate P must provide
explicit local client selection/rebinding so identical observations do not silently
reuse another client's settings. Preserve existing profiles; do not copy or overwrite
them. Unknown/changed/ambiguous clients stay unverified.

Every session obtains its native task ID afresh and cross-checks it through the actual
owner with the expected workspace and permission profile. Never use `--last`, a global
current-thread default, or another client's IDs. Runtime upgrades, endpoint changes,
client changes and lost observation invalidate affected qualifications. An existing
profile or executable match is insufficient. No cross-host takeover or inherited pause
ownership is implied by repo access.

The agent completes only locally verified fields. `auth_token_env` holds a variable
NAME, not its secret value. Unknown values remain null. Never ask for secrets/private
paths in shared chat, scan ports, read unrelated credential stores or execute generated
`.env` text as shell code. Capture any identity-bearing setup outputs locally without
copying them into GitHub. Automatic waiting remains false until W0/W2/W3 gates qualify
that path. CI-only tools must report Codex unavailable separately from CI capability.

## Storage protection and recovery

Validate the exact destination's untracked/ignored status, including used temporary/
lock/evidence paths, before creation. Effective ignore negations matter; a protected
sentinel does not prove a profile is protected. Detect existing exposed untracked
private files without opening or printing them. Recheck before writing and publishing.
These are Gate P requirements, not claims about the reviewed implementation.

Verify protected storage BEFORE collecting/persisting identifying bootstrap fields.
POSIX 0700/0600 checks are not Windows ACL proof. On Windows require a current-account
ACL check or safe refusal before sensitive writes; a documented preprotected per-user
root may be used. No administrator requirement or system-wide policy changes merely to
configure this repo. Native positive/negative behavior needs actual evidence; mocks
and skips cannot be labelled native qualification.

Refuse symlink/reparse/hardlink or malformed unsafe paths/files; preserve existing
profiles and unresolved data. Exclusive creation must not clobber another initializer.
Describe the non-hostile-same-user boundary honestly rather than claiming a complete
filesystem security barrier. Store journals separately from Codex's internal databases;
no shared native/WSL live database. A bootstrap profile is not the future event journal.

Do not copy profiles between clients/clones as proof of compatibility. Preserve pending
private events when changing clients; the repo transfers task intent, not runtime rights.
Choose a private backup policy; GitHub is not that backup. Missing local evidence stays
unavailable until re-probed under appropriate authority, never reconstructed from prose.

## Publication validation contract

After implementation, inspect BOTH the exact staged Git blobs and the public working
copy. Stage modes/conflicts/object failures must fail safely; no textconv, filters or
symlink traversal to inspect raw blobs. A clean working copy or unstaged deletion must
not hide private staged data. No automatic restaging or index mutation by the validator.
Revalidate the actual candidate if the index changes. Keep local-only pathname checks
independent of contents and check the staged template remains blank.

Read tracked and non-ignored public files, not a recursive scan of private state.
Diagnostics never echo private values, offending private paths or unsanitised Git
stderr. CI uses synthetic contexts only and must not initialise a real user profile.
Run the actual implemented validator/tests and inspect the staged diff before publishing:

```text
python scripts/validate.py
python -m unittest discover -s tests/ci_privacy -v
```

Ignore rules/index guards reduce accidents, not arbitrary identifying prose/screenshots
or every possible secret. Current-tip checks also do not detect every earlier-commit
exposure. No temporary commits of private data. If exposure is found, stop publication,
untrack safely, assess/rotate credentials as needed, and obtain authority before history
rewriting. Removing current text is not retroactive erasure.

## Historical evidence boundary

The reviewed W0 changes contained no raw endpoint/user path/full thread ID/credential;
installed desktop-build inventory was removed from current text but remains in old
commits. Public source tags remain code references, not new-client settings. Original
private probes were not replayed by the remote review. Future exact version/schema/
owner receipts stay local; shared reports contain only methods, results and limits.
