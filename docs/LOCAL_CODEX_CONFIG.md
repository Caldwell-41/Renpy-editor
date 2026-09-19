# Local-only Codex client configuration

**Corrected:** 2026-09-19. This is a private bootstrap/storage contract, not an
automatic wait/wake mechanism.

## Architecture and current limits

Private client, CI and future runtime state normally lives outside every Git worktree
in an OS-appropriate per-user Loomlight application-data root:

- Windows: the user's Local AppData under `Loomlight/private-state`.
- macOS: the user's Application Support under `Loomlight/private-state`.
- Other development/CI hosts: the standard XDG state location, with a user-state
  fallback. Production support remains Windows x64 and macOS ARM64.

`LOOMLIGHT_STATE_ROOT` can redirect tests to an absolute synthetic location. The helper
rejects a root inside the repository. Tests never use a real user profile or print the
resolved location.

Client profiles are separated by an explicit local context label under the protected
root. CI operations use a separate versioned SQLite journal there; neither shares
Codex's internal databases. Automatic waiting remains false, runtime binding remains
unverified until independently revalidated, and no task/queue/goal control is added.

The boundary prevents accidental publication and access by other ordinary accounts. It
does not isolate data from a hostile process already running as the same account.

## What belongs where

| Information | Storage |
| --- | --- |
| Host/user identity, private paths/endpoints, installed runtime/build inventory and binary identity | Protected local client profile/evidence only. |
| Task/session/goal/queue/turn/claim IDs, pause ownership, raw telemetry, operation journal and provider logs | Protected per-user task/CI state only. |
| Tokens, passwords and private keys | Existing credential store or protected local environment; never the profile/journal. |
| Generic platform class, public source/schema references, sanitised capability outcomes, commit/PR/run/attempt references | Repository-safe documentation after an allowlist review. |

The committed [client template](../config/codex-client.example.json) remains blank/null.
`.env.example` remains placeholder-only. A random CI request UUID and deterministic key
derived exclusively from public candidate/workflow/options may be sent to GitHub; they
must not encode or hash local client identity.

## Storage protection

Protection is established before collecting identifying bootstrap fields.

- Every owned state directory must be a real directory, never a symlink or Windows
  reparse point. Redirected state must resolve outside the worktree.
- POSIX directories are exactly mode `0700`; files are exactly `0600` and have one
  hard link. Every entry must also be owned by the current effective user.
- Windows removes inheritance on owned state entries, grants full control only to the
  current owner, Local System and Administrators, permits the owner-rights pseudo-SID,
  verifies the current account remains owner, and rejects every other allow ACE.
- Client files, SQLite databases and applicable WAL/SHM/journal companions are regular,
  single-link protected files. Existing companions are validated before SQLite can open
  or consume them and revalidated after opening and writes. Unknown ACL/owner/mode/type/
  link evidence blocks use.
- Exclusive profile creation and atomic SQLite transactions prevent clobbering by
  cooperating initialisers/processes. Ambiguous state refuses rather than guessing.

Parent application-data directories need not be Loomlight-private, but pre-existing
path components may not be links/reparse substitutions. No administrator elevation,
system-wide policy, service installation or unrelated directory ACL change is used.

## Actual-client setup

On each actual client, after reading this status and verifying an available interpreter:

```text
python scripts/codex_local.py init --client-context <explicit-local-label>
```

The command is non-networking. It does not invoke Codex, discover credentials, change
another process, install a service or enable inference. Output contains only created /
existing status, protected-storage classification, unverified runtime binding and
automatic mode false; it never prints the state path or collected identity.

The context label uses letters, digits, dot, underscore and dash. Two labels always map
to separate blank profiles even if their observed host/workspace fields look identical.
An existing profile is re-read only after storage revalidation and is never overwritten.
Malformed, copied, context-mismatched, hard-linked or permission-unsafe profiles block.
Runtime/client/context changes require a new reviewed local context or explicit safe
rebinding; they never inherit qualification.

Complete only fields verified on that actual client. `auth_token_env` is a variable
name, never its value. Unknown fields stay null. Obtain the native task ID afresh through
the actual owner every session; never use `--last`, a global default, or another client.
No profile or executable match proves owning-runtime control.

## Legacy repository-local state

Existing `.codex-local` state is non-authoritative. New code checks only whether that
namespace entry exists; it does not inspect contents, migrate, overwrite, publish or
delete it. Its presence blocks new external profile/journal use until the operator has
preserved it and explicitly chooses external reinitialisation:

```text
python scripts/codex_local.py init --client-context <explicit-local-label> --acknowledge-legacy-state
```

The same acknowledgement option exists on CI commands that open an operation journal.
It changes only the decision to create/use new external state. It does not certify that
an old unresolved dispatch is safe to forget; use the documented remote reconciliation
contract before any new POST. If old and new state remain ambiguous, stop.

`.codex-local/` may remain in `.gitignore` as convenience, but Git ignore is not the
runtime security boundary. The publication validator still rejects tracked or exposed
legacy/runtime database names without opening them and scans staged blobs plus public
working files for credentials, private paths and identifying prose.

## Publication validation

Inspect exact staged Git objects and the working public snapshot. Stage modes/conflicts,
object failures, index changes, populated templates, copied runtime databases and
local-only names fail closed without echoing paths/values or raw Git errors. The
validator never follows private links, invokes text conversion/filters, recursively
scans protected state or mutates the index.

Run before publication:

```text
python scripts/validate.py
python -m unittest discover -s tests/ci_privacy -v
python -m unittest discover -s tests/ci_tooling -v
git diff --check
```

These guards reduce accidents; they cannot detect every arbitrary secret in prose,
screenshot or earlier history. If exposure is found, stop publication, preserve local
evidence, rotate affected credentials where necessary, and obtain authority before any
history rewrite.

## Recovery and evidence boundary

Do not copy profiles between machines/clones as compatibility proof. Keep private backup
and retention policy outside GitHub. Missing state/evidence remains unavailable rather
than reconstructed from prose. Future W0/W1 work may extend the external SQLite schema,
but only after its own approval and runtime qualification.

The W0 report contains sanitised historical observations, not the original private
receipts. This corrective pass does not repeat those probes. Exact runtime versions,
owner identities and endpoints remain local; shared reports contain only methods,
generic outcomes and repository/Actions references.
