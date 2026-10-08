# macOS development credential storage and recovery

**Date:** 2026-10-08. **Status:** independently reviewed/corrected locally; original bounded synthetic native sequence passed on its recorded inputs. Corrected reload-status branch has source/DOM proof; publication unapproved.
**Authority:** in the separate options chat, the user deferred Apple Keychain,
rejected routine API-key re-entry, accepted encrypted local storage with a locally
saved unlock key and its same-login protection limit, requested recovery by API-key
re-entry after storage errors, then requested this Markdown plan and an agent prompt.
The user supplied the implementation prompt in this chat, authorizing source/docs and
focused synthetic checks. The user subsequently approved section 13's exact native
sequence, one host retry after a sandbox preflight failure, and one additional controlled
reopen after an unintended observer relaunch. All four controlled native phases passed;
failures/artifacts and exact consumed counts remain in the owning ledger. Publication
remains unapproved. The original planning request authorized no application/OS operation.

**Owning outcome:** temporary Mac remembered credentials for the existing Studio
slice. The [Phase 2 ledger](phase-2-initial-llm-assistance.md#mac-development-file-storage-plan--2026-10-08)
owns execution evidence. [CURRENT](../../status/CURRENT.md) and
[HANDOVER](../../status/HANDOVER.md) own live project/continuation state.
[Agent prompt](2026-10-08-macos-development-credential-storage-agent-prompt.md)
selects implementation only when the user gives it to an implementation agent.

## 1. Outcome and boundaries

Enter a new API key once through native entry, remember it across normal Mac app
exit/reopen and app replacement/update, and recover from unreadable storage through
explicit native re-entry without losing provider settings or blocking game editing.
This is a development compromise, not acceptance of production Mac secret storage
or a new release. Keychain and free Apple Development signing remain deferred.

Selected exception: encrypted file storage with an unencrypted, random local unlock
key is permitted for this Mac development backend. It supersedes the earlier
no-new-vault restriction only for this outcome. Plaintext API-key storage, hardcoded
encryption passwords, routine re-entry after updates, and global OS security changes
remain excluded. Other software running under the same login can potentially read
both files and decrypt the keys. This limitation is accepted and must be disclosed.

Keep native entry and Rust-only secret processing. Preserve provider-origin binding,
transport restrictions, explicit user-initiated requests, typed narrow IPC, and the
transactional profile/credential lifecycle. No secret-returning renderer command.
No Electron, helper service, account setup, new signing route, automatic Keychain
import/read/delete, AI text generation, paid/real provider calls, or generic-provider expansion.
Keep Windows behavior unchanged; shared schema changes need compatibility coverage.

Permanent product names, bundle ID and credential service ownership remain unchanged.
Keep every historical Keychain reference, cleanup record, signing identity, package
and failed-test receipt. This plan does not authorize retrieving existing keys from
Keychain. Keys held only there cannot automatically populate the new backend; show
them as deferred and allow explicit native entry if the user selects replacement.
No API-key re-entry is required for a healthy file store after ordinary updates.

## 2. Entry, ownership and work preservation

Planning observed `codex/provider-qualification` at published base `4c0ebbf`, with
substantial uncommitted/unpublished signing, credential and UI changes. The separate
`codex/phase-2-3-planning` worktree and its unpublished work are unrelated. These are
entry observations, not instructions to reset refs or reproduce historical inputs.

At implementation entry, inspect current branch/refs, relevant diff, PR/worktree
ownership and changed live instructions. Reuse the actual unfinished branch unless
the current handover selects another. Preserve local work; no reset, checkout that
discards changes, history rewrite, blanket staging or second writer. Read AGENTS,
WORKFLOW, CURRENT/HANDOVER, this plan, ADR 0011 and relevant credential contracts.
Do not repeat broad historical research. No subagents are selected.

## 3. Storage layout and persistence contract

Use the existing Tauri-resolved app data root for `app.loomlight.desktop`, ordinarily
the user's Application Support directory on macOS. Do not derive it from version,
executable hash, certificate, app installation location, repository or temporary root.
Production storage and disposable test storage must remain distinct.

Proposed relative layout under that root:

```text
credentials-dev/
  generations/<opaque-generation-id>/
    master.key
    records/<opaque-credential-id>.sealed
```

Use opaque validated IDs and a versioned master-key envelope and encrypted record
format. Each file credential reference identifies its generation; existing service
values remain Keychain namespaces, never file paths or backend selectors. Maintain
one durable writer-selected healthy generation in the profile store's validated
metadata, published through the same profile transaction rather than a second
independently committed active-generation pointer. Other still
referenced generations remain addressable; selecting a fresh generation does not
rewrite all profiles or make healthy records in previous generations inaccessible.

Directories are owner-only (`0700`); key, record and temporary files are owner-only
(`0600`) from creation. Reuse the repository's approved-root/relative-path and safe
file-write primitives; refuse unsupported links and non-regular entries. Validate
ownership/permissions with proportionate ordinary tests, not specialist filesystem
attack races. Keep generated key bytes and private file contents out of Git, logs,
diagnostic dumps, provider requests and exported projects.

| User action | Persistence promise |
| --- | --- |
| App exit/reopen or Mac restart | Reuse the saved key and records without entry/prompt. |
| Replace/update `Loomlight.app` | Reuse the same compatible user-data store. |
| Remove/reinstall only the application | Reuse retained user data; do not promise survival of app-cleaner deletion. |
| Delete app data, lose disk, or clean-install macOS | Restore profiles, generation metadata, master keys and encrypted records from a coherent backup; unavailable bytes cannot be recreated. |
| Another computer/account | No automatic sync or transfer. A separately selected coherent restore requires all those files and correct destination permissions. |

Do not add a backup/export/sync UI in this slice or assume FileVault is enabled.
Explain that a backup with both master keys and ciphertext permits decryption.
Do not tie encryption to hardware IDs, usernames or certificate fingerprints.

## 4. Cryptography and Rust boundary

Use an established authenticated-encryption implementation, proposed RustCrypto
XChaCha20-Poly1305, with a cryptographically random 256-bit key per generation and a
fresh 192-bit random nonce per record encryption. Select and pin a compatible
dependency after checking the repository toolchain and library guidance; no bespoke
cipher, KDF over machine identifiers, fixed nonce, embedded password or fallback.

Authenticate unambiguously encoded format version, generation ID, profile ID,
credential ID, credential revision and canonical provider origin as associated data.
Store a bounded header, nonce, ciphertext and authentication tag. Define supported
versions, lengths and limits before parsing; retain and refuse unknown newer formats
without downgrading or overwriting. Authentication failure never returns partial data.
Reuse the current API-key validation contract (1–4096 printable non-space ASCII bytes).

Only create a generation/master key during an explicit save/recovery action, never
routine Settings inspection. Write and flush its key before publishing any record
that depends on it. Never regenerate a missing key for an existing generation.
Validate record decryptability before publishing its profile reference. Use bounded
buffers, secret-safe errors and best-effort memory clearing; avoid secret Debug,
serialization, subprocess arguments/environment and renderer exposure.

Construct a Rust store with the approved application-data root and inject it through
the existing `Secrets` seam. Keep profile records secret-free. Explicitly route by
backend for reads, additions and cleanup; entry labels must describe the actual store.

## 5. Profile schema and deferred Keychain routing

Extend owned references and their cleanup equivalents with a validated storage
discriminator and file-generation identity. Missing discriminator in existing data
means the legacy native backend, preserving the exact current service defaulting.
Choose an explicit compatible schema migration: current profile parsing uses
`deny_unknown_fields`, a strict schema-version check and byte/count limits. Older
apps must refuse newer incompatible data without replacing it with defaults. Do not
claim downgrade support. Preserve malformed/newer profile files unchanged.

File-backend selection is explicit, not a fallback after a Keychain denial. In this
Mac development mode, all legacy/native references show a deferred-storage status.
Settings rendering, discovery, replacement, removal and automatic cleanup must issue
zero Keychain calls. Replacing a legacy profile may publish a file credential while
retaining the original native cleanup reference as deferred. Removing a profile must
retain owned deferred cleanup even after that profile is absent. Never treat deferred
cleanup as completed or let it prevent using a successfully saved replacement.

Distinguish unavailable credential, profile-disabled state and cleanup-pending status.
Retired file records that can be safely removed follow the existing ownership rules;
unreadable-generation recovery records remain explicitly retained. No automatic
orphan-directory sweeping or secure-erasure claims. Later Keychain migration,
retained-file disposal and cleanup of native entries are separately selected work.

## 6. Save, replacement and interrupted-write behavior

Retain the current ordering: durably record ownership of a fresh opaque credential,
write encrypted data, read/decrypt/compare it, then publish the new profile reference.
Only retire a prior record after the new reference is confirmed published. Serialize
writers with existing ownership and revision tokens; stale completions cannot switch
a changed/removed profile or provider origin.

Use safe temporary writes, flushes and publication; temporary files never contain
plaintext keys. On uncertain post-publication errors, reread the actual profile state
before deciding whether a credential is active or can be cleaned up. Existing core
`replace()` currently ends with cleanup and can return a cleanup error after a
successful switch: refine the outcome so **saved, cleanup pending** is distinct from
**save failed**. Do not encourage another save that accidentally replaces the key again.

Test ordinary write errors/interrupted state using controlled fault injection/state
fixtures. Do not deliberately crash an application or revive excluded specialist tests.
Account for staged generation ownership: failures before a usable record is published
cannot leave an undiscoverable generation or overwrite the previous one.
Give a staged generation durable ownership before creation, and publish its healthy
active selection with the verified credential/profile switch. An abandoned staged
generation can be retired only after rereading confirms it has no active or retained
recovery references. Generation metadata and references must remain self-consistent
after every injected failure; no claimed multi-file atomicity.

## 7. Error and recovery workflow

Errors block only AI use requiring the affected credential. Game editing and healthy
profiles remain usable. Persistent per-profile status survives reload/reopen; display
the affected profiles without leaking key bytes or unnecessary machine details.

| Condition | User action and backend behavior |
| --- | --- |
| One missing/damaged record; generation key valid | Explain that this saved key is unavailable; native re-entry creates and verifies a fresh record for that profile. |
| Missing/invalid master key or generation metadata | Offer native re-entry; on explicit save create one fresh healthy generation, then recover profiles individually. Preserve old files/references. |
| Authentication failure with valid-looking key and record | Treat cause as uncertain; do not assert which file is damaged. Re-entry may use a fresh generation rather than reuse an untrusted key. |
| Transient read/access problem | Offer Retry and re-entry; Retry is read-only and never creates/replaces a master key. A fresh generation cannot solve an unwritable root. |
| Unsupported newer store/profile format | Explain newer-version incompatibility; preserve it. Do not downgrade it through recovery or promise re-entry can overwrite it safely. |
| Save failure such as full disk/access denial | Keep native input available for retry/cancel; no successful-save message and no profile switch. |
| Deferred Keychain-only reference | Explain deferred storage; allow explicit native entry for this backend, preserve native ownership, make zero native-store calls. |

The save-failure rule assumes rereading confirms that publication did not occur. If
publication succeeded but cleanup failed, report saved/cleanup pending instead. If
publication cannot be resolved because profile rereading also fails, report uncertain
save state, retain input, and require a successful read-only reload before retrying
the write. Never silently replay an ambiguous save.

UI default: **“Your saved API key couldn't be read. Re-enter it to restore AI access.”**
Use condition-specific detail where useful. Provide **Re-enter API key**, **Retry**
where appropriate, and existing profile-management actions. Show **“API key saved”**
only after local encryption, decryption verification and profile publication succeed;
show cleanup pending separately. This does not claim provider authentication validity.
Do not send a provider request merely to save/inspect/recover; requests and retry remain
explicit. Do not automatically resume a failed discovery or future generation.

The current AppKit entry dialog returns and clears its field before persistence.
Refactor the real native entry/save flow so a save failure keeps the input in native
memory and permits retry without entering it again. Do not hold the project-service
lock across a modal dialog. Recheck profile token/origin after entry and before commit;
on stale state explain the conflict, retain native input until cancel/explicit retry,
and never save to a different profile implicitly. Cancel/close clears temporary input
and leaves the current credential and settings unchanged.

**Optional session escape hatch:** “Use for this session” was discussed, but the
production seam is not established. It is not a completion blocker or permission to
add the full planned session/no-auth system. Implement only if an existing qualified
session path can be reused without widening scope; otherwise retain Retry/Cancel and
record the session feature as deferred. Session-only does not replace remembered storage.

## 8. Implementation checkpoints

1. Inspect dirty ownership and current seams; confirm dependency compatibility. Define
   formats, typed statuses, routing and schema migration with synthetic fixtures.
2. Prove the highest-risk narrow Rust path first: explicit save, independent store
   reopen, read, format-version compatibility fixtures, key-loss recovery, retained original
   files, verified new reference. Write meaningful rejecting assertions alongside it.
3. Connect production settings/native entry/discovery/cleanup to the typed backend.
   Implement error/recovery UI and retained-input retry through the actual controller
   and dispatch boundary. Keep deferred Keychain and Windows behavior isolated.
4. Update ADR 0011 for the selected temporary exception and canonical architecture,
   data model, UI, app README and TESTING only for changed behavior. Record exact
   checks and limits in the owning Phase 2 ledger and live continuation.
5. Self-review the complete diff and run focused cheap checks. Prepare a concrete
   packaged synthetic proof and request its bounded allowance if not yet granted.
6. After separate native allowance, qualify real packaged entry/save/reopen/update,
   replacement/removal and recovery on this Mac. Report remaining evidence honestly;
   do not call source/unit proof packaged acceptance or close the whole Phase 2 slice.

## 9. Acceptance and focused verification

| ID | Required evidence |
| --- | --- |
| DEV-CRED-01 | Native save, repeated authenticated reads and full app quit/reopen without re-entry; native entry/secret handling remains Rust-only. |
| DEV-CRED-02 | Two different packaged builds use the same retained file store with no re-entry; path/schema/crypto format compatible. |
| DEV-CRED-03 | Missing/damaged record, master-key loss and uncertain authentication failure expose recovery; new save restores only selected profiles and preserves originals/settings. |
| DEV-CRED-04 | Read-only inspection/Retry never generates keys, mutates data, requests a provider, or calls Keychain; all legacy read/cleanup routes are deferred. |
| DEV-CRED-05 | Save/flush/profile-publication/cleanup failures and stale origin/token are correctly classified; previous active reference retained or confirmed new reference shown with cleanup pending. |
| DEV-CRED-06 | Native persistence failure retains entered input for retry; cancel clears it without mutation. No service lock blocks ordinary editing while entry is open. |
| DEV-CRED-07 | Replacement/removal/deferred cleanup ownership survive reopen; older/malformed/newer schemas handled without silent reset; Windows routing remains unchanged. |
| DEV-CRED-08 | Private file modes, no unsupported links, authenticated metadata, fresh nonces, size limits and secret-free IPC/logs/project exports demonstrated. |
| DEV-CRED-09 | Install/update retention and data-loss/restore limits documented; no promise of keys surviving explicit user-data deletion or app cleaners. |

Cheap implementation checks: `git diff --check`, `python3 scripts/validate.py`,
formatter, existing `npm run check`, and exact focused Rust credential/profile/store
and desktop-dispatch tests. Name the selected tests and assert positive counts; avoid
unfiltered core or SDK/package matrices. Use current TESTING selectors if broader
shared changes actually warrant them. No dependency installation, desktop launch,
signing operation or native secret access is implied by a command reference.

Meaningful synthetic fixtures must reject tampered/wrong-bound ciphertext, missing
master key, unknown format, zero intended tests, false saved status and unexpected
Keychain/provider calls. Exercise normal same-root new store instances, recovery across
generations, rollback uncertainty, safe removal and frontend-to-service behavior.
Never put real credentials into fixtures, command arguments, logs or artifacts.

## 10. Native allowance and approval boundaries

Existing identity outcome remains at **2/2 builds, 4/4 launches, 4/8 loopback GETs
consumed**. The four remaining GETs authorize no new launch and are not automatically
reassigned to this outcome. No operation is pending; no runtime authorization is added
by creating this plan or by its implementation prompt.

Before packaging, present the final fixture and smallest complete allowance covering
different-build reuse plus recovery. Specify build/signing operations, launches, native
dialog/save actions, loopback request count and per-action deadlines. Do not invent
approved numbers. Routine synthetic file tests after implementation selection may run
in temporary directories without Keychain or real credentials. Native behavior needs
the actual Mac packaged app; browser mocks do not substitute. Do not transfer routine
test execution to the user or silently skip unapproved evidence.

Keep current signing/package checks intact. Signing can access a Keychain-held signing
private key even though API-key storage uses files. This plan selects zero signing-key
access: any future package/signing step needs its own explicit scope using the existing
approved identity, without certificate/trust changes or silent ad-hoc fallback. If
signing operations are also deferred, report packaged proof as pending; do not weaken
identity policy to make it possible.

No Actions, push, merge, release, installation into Applications, OS settings changes,
subagents, real endpoints, AI text generation or purchases are authorized. Implementation
selection permits the source/doc changes and focused synthetic checks in this plan;
native allowance and publication remain separate. Preserve failed/superseded evidence,
bound retries under WORKFLOW and keep the same cumulative problem record.

## 11. Sources and design assumptions

- [Tauri 2.11.5 PathResolver](https://docs.rs/tauri/2.11.5/tauri/path/struct.PathResolver.html):
  existing app-data resolution, not an installer retention guarantee.
- [Apple app support locations](https://developer.apple.com/library/archive/documentation/General/Conceptual/MOSXAppProgrammingGuide/AppRuntime/AppRuntime.html):
  support data belongs outside the application bundle.
- [RustCrypto AEAD documentation](https://docs.rs/chacha20poly1305/latest/chacha20poly1305/):
  proposed implementation, nonce and authentication semantics; pin a compatible version.
- [ADR 0011](../../adr/0011-ai-settings-secrets-and-reference-storage.md): existing
  lifecycle/privacy contracts; the explicitly selected temporary exception is above.

Ordinary same-account installation replaces only the app; app-data deletion and
future incompatible schemas are exceptions. No encryption scheme restores lost
random key material. This local-key design provides accidental-exposure protection,
not isolation from other processes under the same login. Existing native cleanup and
session behavior are not assumed to be fully qualified.

## 12. Plan omission/assumption review

Self-review completed against the actual credential/profile/native-entry seams and
the live deferred outcome. Corrections incorporated before delivery:

- **Persistent generation ownership:** specified staged ownership and a profile-store
  transaction for active-generation selection, preventing a separate pointer commit
  from losing consistency or making old healthy profiles unavailable.
- **Save versus cleanup failure:** existing replacement can return a cleanup error
  after success. Required saved/cleanup-pending and unresolved-publication states;
  forbid replay until an ambiguous publication is resolved.
- **Retained native entry:** the current dialog clears before save. Required the real
  native retry flow, retained input, stale-token checks and no lock across the dialog.
- **Legacy cleanup:** all old-store read/delete/cleanup paths remain deferred, with
  owned references retained even after replacement or profile removal.
- **Compatibility:** strict current schema/newer-data refusal needs explicit migration
  and downgrade limits; older builds are not assumed compatible after schema changes.
- **Session escape:** not assumed implemented or required for this bounded outcome.
- **Reinstall/restore limits:** retained app data, all required restore files, backup
  confidentiality and missing random-key irrecoverability made explicit.
- **Signing versus API-key storage:** file storage does not eliminate package signing
  key access. Existing identity gates and separate native/signing approval remain.
- **Evidence and budgets:** units/browser tests do not prove native entry or updated
  packaged builds. No exhausted allowance is renewed; prompt grants source/synthetic
  work only when the user supplies it.

Structural/privacy/link/whitespace checks are recorded in the owning ledger. This
review provides no implementation, OS-access or runtime qualification evidence.

## 13. Prepared native fixture and proposed allowance

**Prepared; native sequence subsequently approved below, execution recorded in the ledger.**
Repository fixture:
[`app/tests/fixtures/macos-development-credentials.json`](../../../app/tests/fixtures/macos-development-credentials.json).
It contains schema-v1 profiles A/B without keys, C with a synthetic legacy native
reference, and an absent-profile cleanup reference in `app.loomlight`. No corresponding
Keychain item is created, accessed or assumed present. The fixture provides ten public
synthetic input labels; nine are successfully saved in the schedule below and one is
cancelled. Core validation checks the actual schema, IDs, both deferred routes and
no inspection-created files. Native inputs are typed into AppKit, never supplied through
renderer IPC, command arguments or environment variables.

After separate approval, create a fresh isolated `loomlight-studio-dev-credentials-<UUID>`
root under the OS temporary directory, using the existing Studio packaged fixture path
selection. Seed only the fixture's profile store (0700 root, 0600 metadata); create no
master key or ciphertext outside the app. Reserve loopback port 46081, refusing contention
without retry. The synthetic server accepts only `/v1/models`, exact Bearer inputs for
the current phase and model `loomlight-public-synthetic`, rejecting wrong auth/routes,
unexpected requests and excess counts. Keep separate attempt markers/receipts; never
reuse/reset historical identity fixtures. Archive only disposable synthetic artifacts
under an ignored development-proof report directory. No real user data, key retrieval,
provider endpoint or AI generation enters this fixture.

Proposed smallest complete schedule: **two new signed app/DMG builds and two isolated
test-copy publications (initial copy and replacement), four app launches, ten native
dialog openings, ten save attempts (nine successful, one deliberately refused), one
native Cancel, eight authenticated loopback GETs**. Two certificate-backed signing
operations use only the already established identity/pin; no certificate creation/import,
trust/ACL/policy change or Applications installation. Different version/executable
hashes must be verified along with the same permanent product/bundle/signing identity.
No existing allowance is transferred; no retries/extra launches or builds.

| Launch | Concrete app-owned actions | GETs | Deadline |
| --- | --- | ---: | --- |
| 1, build A | Native-save A=`alpha`, B=`gamma`; inspect both configured, C/native cleanup deferred; A discovery twice; full quit. | 2 | 5 minutes |
| 2, build A | Reopen the same root; A discovery twice without entry; verify unchanged references/settings; full quit. | 2 | 2 minutes |
| 3, build B | Reuse A without entry (GET); replace A=`beta` (GET); missing-record recovery A=`delta`; shared-master-key loss recovery A=`epsilon` while B retains its original reference/settings; authentication-tamper recovery A=`zeta`; force one persistence failure A=`eta`, restore only the fixture obstruction and Retry with the same native field (no re-entry); open another native field and Cancel `cancelled`; replace deferred C=`theta` then remove C/profile preserving native ownership; recover B=`iota` into the active healthy generation then remove its credential preserving settings; A discovery (GET); full quit. | 3 | 15 minutes |
| 4, build B | Reopen; A discovery without entry; B remains disabled/key-removed with settings; C absent with deferred native cleanup retained; old damaged generations/metadata intact; full quit. | 1 | 3 minutes |

Native failure fixtures operate only on recorded synthetic owned paths: retain the
missing record in a separate report copy before removing its original; move the old
master key to a retained report copy without regenerating it; flip one ciphertext/tag
byte in the selected A record and preserve both versions; temporarily rename the active
records directory and put a regular blocking file at its path, then restore the directory
while the refused save's native field stays open. Each restoration changes only that
fixture obstruction. Retain old generations, schema and recovery references; inspect
file modes/regular entries and unchanged settings at each step. Verify no pending
Keychain dialog, import/read/delete or automatic provider request. Confirm ordinary
service requests remain available while entry waits. A saved/pending result after
replacing C must not ask the user to save the key again.

Build/signing deadline: **20 minutes per build**, including existing bundle/DMG checks.
Native dialog action deadline: **2 minutes**; each local save attempt **15 seconds**;
GET **15 seconds plus 2 seconds cleanup**; full quit **15 seconds**. The launch deadline
bounds the whole phase. Halt on any unexpected failure/ambiguity and preserve reports,
owned references and packages; no automatic retry or next phase. A native run never
turns browser/unit evidence into packaged proof. The user approved this exact sequence on 2026-10-08 ("I approved your proposed sequence").
This separate allowance overrides the initial no-native boundary only for these actions.
Build A/B use metadata versions 0.1.2/0.1.3 in fresh output directories; permanent identity
and existing signing gates remain unchanged. Manual Settings/AppKit control uses an
explicit isolated-root mode, without renderer secret entry or historical identity scripts.

## 14. Local delivery and native result

The selected implementation and explicitly approved public synthetic native sequence
are complete locally. [The owning result](phase-2-initial-llm-assistance.md#development-file-native-qualification-result--2026-10-08)
records source checks, four passed native phases, exact consumed counts, initial preflight
and unintended observer failures, one approved host retry and one approved extra reopen.
All receipts/recovery artifacts/packages remain preserved. No native operation pending
or remaining allowance; no commit/push/Actions/merge/release or full Phase 2 closure.
The plan stays active as the local review/integration checklist until separately selected
closure. Future runs require a new explicit bounded allowance. Never use UI reacquisition
to check an exited app: verify its external receipt and process termination instead.

## 15. Independent review correction and proposed narrow native follow-up

[The independent review ledger](phase-2-initial-llm-assistance.md#mac-development-independent-local-review--2026-10-08)
owns findings, exact checks and preservation audit. Existing native evidence remains
evidence of its original source; it does not validate the corrected reload-required
cleanup-pending message. No source/storage architecture or native allowance is renewed.

Concrete public follow-up fixture:
`app/tests/fixtures/macos-development-credential-reload-failure.json` reuses the immutable
section 13 profile fixture, C's UUID and public `theta` input. The passing desktop
regression creates a verified C file credential with native cleanup pending, refuses
the subsequent snapshot read, checks the exact saved/pending/reload-required response,
then restores the snapshot and checks configured state/retained cleanup. The subsequent
fixture-only outcome adds a deterministic process-owned refusal through actual entry
dispatch without changing snapshot bytes. Settings DOM/controller coverage checks the
exact message, disabled controls, refused Retry and restored selected configured C. No real key,
endpoint, provider request or native operation is part of this preparation.

The separately proposed schedule, selected by the user and completed on 2026-10-09, is **one fresh signed
app/DMG package pair, one isolated copy, one launch, one native entry session, one save,
zero GETs**. Use the existing certificate/pin and permanent names; no Applications
installation or replacement of historical fixture copies. Seed only the original public
profiles under a new private temporary fixture root, open Settings, replace deferred C
with `theta`, refuse exactly one Settings snapshot read **after confirmed publication**,
and assert **API key saved; cleanup pending; saved profiles could not be reloaded. Retry
reading before further changes.** Mutations/discovery must be disabled; read-only Retry
must recover C's configured state without another save, while native ownership remains.
Quit once and inspect only external receipt/PID. Retain the original/corrected profile
and file hashes plus response/UI evidence; no secret bytes in receipts.

**Prepared dependency (source only):**
`LOOMLIGHT_STUDIO_DEV_RELOAD_FAILURE=post-save-snapshot-once` selects the reviewed
one-shot seam, with `LOOMLIGHT_RUNTIME_UI_PROBE=studio-settings`,
`LOOMLIGHT_STUDIO_DEV_CREDENTIAL_PHASE=1` and the existing explicit temporary development
root. The exact original public fixture and absent credential directory are required;
identity/Windows modes, other roots/phases and mismatched fixture state refuse. C entry
must still match the original target/token. Reads, failed saves and Cancel leave it armed;
only complete confirmed file publication with both deferred native cleanup references
consumes it. A mismatched confirmation cannot masquerade as the selected fault. Read-only
Retry preserves the complete saved store and file bytes. Normal Mac and Windows operation
use the existing path without selector state. No timer, external writer, native access or
persistent fault marker is introduced. The pure controller environment helper prepares
no files/launch/server and the historical runner rejects inherited selectors.

[The fixture preparation ledger](phase-2-initial-llm-assistance.md#mac-one-shot-reload-fixture-preparation--2026-10-08)
owns exact source/DOM/controller checks, corrections and owner review. The user approved
source publication after recheck on 2026-10-09; the checkpoint carrying CURRENT/HANDOVER
records that source transfer, with published source SHA
`37e3ab3bbdbab943600a2cbc3df93b9078814c26`. The separate native selection now passes
the corrected branch: exact status and 13 disabled fields/actions, Retry restoring
selected configured C, unchanged complete store/files, and normal full exit.
[The native ledger](phase-2-initial-llm-assistance.md#mac-section-15-corrected-packaged-proof--2026-10-09)
records the external receipt/UI schedule prepared before execution, exact hashes and
bounded results. The original four-phase runner was not executed.

Proposed deadlines: **20 minutes** for the single signed package pair; **3 minutes** for
the whole launch, **2 minutes** for native entry, **15 seconds** for its one save and
**15 seconds** for full quit. No retries, reopens or server. Stop/preserve on failure or
ambiguity. This separate allowance is now exhausted; the original native budget remains
exhausted and untransferred. The user approved publication of the six reviewed docs/evidence paths; the checkpoint
carrying this record is verified by exact remote SHA in the publication response. This proof does not start Windows or close Studio 2A.1/Phase 2.
