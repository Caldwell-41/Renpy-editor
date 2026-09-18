# Local-only Codex client configuration

**Established:** 2026-09-19, during the W0 review at the user's request.
This is a privacy/bootstrap contract, not an implemented wait/wake mechanism.

## What belongs where

| Information | Storage |
| --- | --- |
| Hostname, username, home/workspace paths, executable paths, Codex home, socket/pipe/endpoint, private IP or DNS, process IDs, device/client IDs, binary hashes, installed-version/build inventory | Private client profile or local evidence only. |
| Current thread/session/goal IDs, queue/turn/claim IDs, pause ownership, operation journal and raw telemetry | Private per-task state only, never a shared handover. |
| Tokens, passwords and private keys | Existing credential store or locally protected environment; never a template or publication. |
| Generic OS/architecture categories, public upstream source tags/schema references, capability outcomes, test names, repo commit/PR/Actions IDs | May be published if they do not include host data or identify the local client. |

The rule covers repository files, commits, PR bodies/comments, issues, Actions output,
job summaries, screenshots, uploaded artifacts and handovers. Hashing a device ID or
endpoint is not permission to publish a stable fingerprint. Do not upload local files
as artifacts, include them in archives, or put them in temporary commits. Sanitise an
explicit allowlist of result fields instead of trying to redact an environment dump.

The sole committed client template is
[`config/codex-client.example.json`](../config/codex-client.example.json). Its runtime
fields must remain null. The existing `.env.example` is also placeholders only.
`.env`, `.env.*` (except `.env.example`) and `.codex-local/` are local-only.

## Mandatory agent setup on each client

After reading AGENTS and before running Codex-host probes or configuring CI helpers,
the agent must initialise local state on the machine actually running the task:

```text
python scripts/codex_local.py init
```

Use a verified available Python 3 interpreter; an alias may be absent. Do not install
or download one automatically. If this chat has no local execution access to the actual
client, record `client setup unavailable` without host values and continue only
host-independent authorised work. Setting up a sandbox elsewhere is not client setup.

The helper checks that private paths are untracked and ignored, creates a protected
local profile, and prints only created/existing, unverified and automatic-mode-off
status. It does not invoke Codex, read credentials, connect to a daemon, set environment
variables in another process, start inference or install anything.

Profiles live below `.codex-local/clients/<local-routing-key>/client.json`. The routing
key depends on local host/user/workspace and declared Codex home/launcher observations.
A different detected client context receives a separate blank profile; existing values
are not overwritten or copied into the new profile. This is convenient routing, not
an authoritative device identity or proof that two identical-looking contexts are the
same runtime. Profiles and their routing keys stay local.

To locate the current file for local editing, capture the output of
`python scripts/codex_local.py path` into a local shell variable. Do not paste that
path or its contents into GitHub or a shared prompt. Never source a generated `.env`
as shell code or invent an endpoint from a historical report.

The agent then completes each applicable runtime field using the current client's
native, approved interfaces. `auth_token_env` is the NAME of an existing local
credential environment variable, not its value. Unknown fields stay null. Record a
missing capability explicitly instead of asking for secrets in chat, scanning ports,
reading unrelated credential stores or copying another machine's configuration.

Before EVERY session/operation, revalidate the owning runtime and workspace through
its actual host interface. A persisted profile and a working launcher are not ownership
proof. A new installation, endpoint/version change or interrupted observation invalidates
old capability assumptions. Bind the current native thread ID afresh and cross-check
it through the owning runtime; never keep a global current-thread default, use `--last`,
or copy another thread's IDs. Runtime task bindings belong in private per-task files
below `.codex-local/tasks/` or an approved private per-user directory, not this reusable
client template. No task binding/journal implementation is added by this bootstrap.

Until W0/W2 actually qualify safe continuation, automatic mode remains false even after
all local fields are filled. A new client does not inherit another client's capability
pass, pause authority, queued events or pending work. Shared checkouts/concurrent clients
require separate task ownership; this helper does not implement distributed locking.

## Local permissions and recovery

The helper creates private POSIX directories/files with modes 0700/0600, refuses
existing broad POSIX permissions, static symlink/reparse paths and linked files, and
uses exclusive creation rather than overwriting an existing profile. Malformed/partial
files cause a safe error; inspect and repair them locally without discarding unresolved
task evidence. This bootstrap is not a journal or a defence against a hostile same-user
filesystem writer. Native Windows ACL and lifecycle qualification remain W2 work.

On Windows, the agent must verify that the chosen workspace/profile storage is
accessible only to the intended account before entering credentials or sensitive
runtime bindings. Move to separately protected local storage if necessary; do not assume
POSIX mode arguments establish a Windows ACL. Do not auto-change system-wide policies.

Do not copy profiles into a fresh clone or across machines. Preserve unresolved events
and evidence when changing clients. Git history and the shared handover transfer task
intent; they do not transfer the right or technical ability to resume a private thread.
Local state has no backup guarantee: choose a private backup policy without pushing it
to GitHub. If local proof was not retained, record it unavailable and re-run only under
the appropriate checkpoint authority.

## Validation and publication boundary

Run the repository validator and privacy regressions before publishing:

```text
python scripts/validate.py
python -m unittest discover -s tests/ci_privacy -v
```

The validator uses Git's tracked plus non-ignored untracked file list, not a recursive
walk through private local data. A separate index guard rejects local-only files even
when someone force-adds them. It checks the committed client template remains blank.
Diagnostics must not echo configuration values or offending private filenames. Tests
use synthetic contexts only; Actions must never initialise a real user profile.

These checks reduce accidental exposure but cannot recognise arbitrary identifying
prose, screenshots or every secret. Review the staged diff and artifact allowlists as
well. `.gitignore` does not untrack existing files or remove history. If a local-only
file was tracked, stop publishing, remove it from the index, assess actual exposure,
and rotate exposed credentials when needed. History rewriting needs explicit authority.
Removing current text is not retroactive erasure from prior commits.

## W0 review boundary

The earlier W0 documents did not contain a raw endpoint, user path, full thread ID or
credential in the reviewed changes. They did associate an exact desktop build with
the investigated host; current documents no longer retain that inventory. Prior Git
history remains unchanged. Public source tags remain as code references, not settings
for a new client.

The review cannot reconstruct the original private probes from public summaries.
Future probes retain exact versions, source/schema hashes, owner checks and bounded
raw receipts locally; publish only methods, result categories and unresolved limits.
Do not export deterministic hashes of that private evidence as client fingerprints.
