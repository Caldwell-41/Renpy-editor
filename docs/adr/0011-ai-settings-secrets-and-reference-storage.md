# ADR 0011: AI settings, secrets and reference storage

**Status:** Accepted design with selected temporary Mac development file-store exception; implemented locally with bounded synthetic packaged Mac qualification passed. Windows/both-target qualification incomplete.
**Date:** 2026-10-07.
**Authority:** on 2026-10-08 the user supplied the development credential implementation prompt, selecting source/docs and focused synthetic tests only. A subsequent explicit allowance selected the bounded native fixture, now passed; publication remains separate. The earlier user selected project-local prompts, native references with basic
scope/notes, localhost/LAN/HTTPS and adaptive helpers; accepted the omission/credential
review and requested the agreed plan be recorded. The original documentation selection granted no provider operation; the temporary
implementation selection grants no real endpoint, package/signing or app launch.

## Context

Loomlight needs repeatable reviewed AI assistance for local hobby projects. Provider
access belongs to the device; private writing references belong to the game project.
The existing credential spike proves native store round-trip/delete on both targets,
but had no renderer or native entry dialog. It is not production credential UX evidence.

## Decision

- Keep versioned provider/model settings and project-to-profile bindings in device-local
  `ai-profiles.json` under the existing application-data root. Store no key values.
- Baseline design uses macOS Keychain / Windows Credential Manager for **Remember on this computer**; the selected temporary Mac development exception below replaces Mac API-key calls while preserving native ownership.
  Add explicit **Use for this app session** with backend-memory-only keys cleared on
  app exit/removal. Generic compatible servers can select **No authentication**;
  Studio requires its key. Authenticated v1 profiles use Bearer authentication.
- Native entry/replace/delete returns status only to the WebView. Request code injects
  keys; no read-secret IPC, plaintext fallback, key export or subprocess inheritance.
- Keep stable application/credential identities. Stage a replacement key under a new
  ID before safely switching the profile reference, then remove obsolete entries.
  Failed switching preserves the old reference; cleanup failures remain explicit.
  Removal disables sends before deleting the owned entry and retains failed cleanup
  state. Session-key/mode replacement also preserves the prior state on a failed
  settings save. Do not claim cross-store atomicity or delete other profiles' entries.
- Bundle prompts in one versioned resource location. Store full per-action overrides,
  baseline version/digest and separate style notes in project `.renpy-editor/ai.json`.
  Updates preserve custom text; compare with the installed baseline and restore it
  explicitly with undo. No shared personal template library or executable macros in v1.
- Store native cards/lore in `.renpy-editor/references.json`, one versioned lifecycle
  with separate collections, stable IDs, reviewed revisions, citations and extensions.
  Keep approved text while reviewing its replacement unless its own evidence is stale.
  Scope is project-wide, selected Scenes or an explicit finite route; use written
  knowledge/spoiler notes. No inferred knowledge or automatic keyword injection.
- Project metadata edits reuse transaction/history/recovery. Device profiles use safe
  replacement. Retain malformed/newer existing data; migrations do not rewrite scripts.
  Concrete schema/limit fixtures precede the reference editor implementation.
- Allow loopback HTTP and verified HTTPS. Private-network/VPN HTTP requires distinct
  per-profile opt-in, unencrypted-transport disclosure and ordinary address checks.
  Reject public plaintext destinations, credential-bearing URLs and unreviewed redirects;
  bind keys to the explicitly reviewed origin. Keep narrow core-owned networking.
- Exclude keys, project AI/reference prose and raw replies from routine diagnostics and
  game distributions. Future explicit diagnostic exports preview/redact contents.

## Consequences and alternatives

OS storage is convenient at-rest protection, not a sandbox against same-user malicious
software or compromised application code. Session-only avoids deliberate persistence,
but requires re-entry after app exit and cannot guarantee absence from OS memory/swap.
Routine remembered-key use must not require per-discovery/per-generation approval
or re-entry with the same trusted application and an unlocked available store.
Locked-store access and changed application trust/identity can require OS interaction;
repeat access, app reopen and update identity must be qualified separately. This is
a usability requirement, not permission to bypass OS trust or relax global Keychain
settings. Generation remains outside the current slice.

The earlier blanket rebuild/update guarantee and mandatory Touch ID/Windows Hello PIN
integration were withdrawn on 2026-10-08 pending research. The user subsequently selected
a bounded Mac outcome: routine remembered use across reopen and two different packages
signed with the established certificate identity. This narrower signing outcome is now
approved for implementation/focused checks. Packaged save/reopen passed, but changed-build
reuse failed despite the same certificate and designated requirement. Biometric
integration and Windows changes were excluded from that identity selection. The active ledger owns allowances and
per-step approvals, not this ADR.

The subsequently selected Windows continuation implements native secure entry and
generic Credential Manager records through the transactional lifecycle, without
biometrics or Mac identity work. Exact owned targets and reference-bound markers use
local-machine persistence; no enumeration or occupied-target overwrite. The OS blob
limit is 2560 bytes: larger shared-valid input remains native with explicit failure,
never truncation/plaintext fallback. Shared v1/v2 records stay compatible; Mac file
references/cleanup remain owned without Windows migration/deletion. The
[Windows ledger](../tasks/archive/2026-10-09-phase-2-execution-history.md#windows-remembered-credential-continuation--2026-10-08)
owns selected operations, actual evidence and the independent-review boundary.

The permanent new credential service is user-selected `app.loomlight`; bundle identifier
remains `app.loomlight.desktop`. An optional fixed-enum service on each owned reference
defaults to legacy `app.loomlight.desktop.ai.v1`, with legacy serialization unchanged.
New Mac entries/replacements use the new service. Existing active and cleanup references
continue addressing the old service; no automatic copy, rewrite or deletion occurs.
Normal transactional replacement publishes the new reference before retiring the old;
failed legacy cleanup remains owned and explicit. Old ad-hoc/helper trust does not
automatically transfer: native re-entry or separately approved OS access may be required.
The helper qualification service is never included in production migration.

Mac release builds must use the approved persistent certificate/private key and verify
the actual bundle's designated requirement binding the identifier and exact signing
certificate (`certificate leaf = H"…"`), resource signature and
names. No ad-hoc fallback, identifier-only ACL, global Keychain weakening, plaintext
fallback. The separately selected temporary encrypted-file backend is an explicit
development exception, not a signing workaround. A local self-signed certificate provides no-purchase signing continuity, but the
observed build-bound Keychain partition prevents claiming update reuse. It is not
Developer ID/notarized distribution. Its generic label/public cryptographic
metadata are disclosed, but personal certificate fields are forbidden. Certificate
creation/import, trust changes and installation need separate approval; private material
stays outside Git. [Build instructions](../../app/README.md#macos-local-package-identity)
own signing verification and protected reuse/recovery.
Country and other location fields are unnecessary. Inspect the actual certificate;
wizard defaults are not privacy evidence. The creating app's CDHash was recorded in a
separate Keychain partition even with a certificate-backed designated requirement.
[Apple securityd](https://github.com/apple-oss-distributions/Security/blob/main/securityd/src/clientid.cpp)
uses a team partition for recognized Apple development/distribution chains and falls
back to a CDHash for other signed code. Local root trust does not supply that Apple
chain. No trust/ACL workaround is selected; a changed signing route requires approval
and real app-owned update proof.

Historical Mac credential calls used scoped, serialized process-local Keychain UI
suppression. The temporary Mac mode supersedes that runtime path: all native reads,
additions, deletes, qualification imports and cleanup return deferred status with zero
Keychain API-key calls. Existing service ownership is retained after replacement/removal.
No automatic import/deletion or OS interaction is selected. Signing-key operations are
separate and continue requiring the established identity/gates and explicit allowance.

### Selected temporary Mac development exception — 2026-10-08

[The selected plan](../tasks/active/2026-10-08-macos-development-credential-storage.md)
permits encrypted local API-key files with a persisted, unencrypted random unlock key.
This is accepted accidental-exposure protection, with no isolation from software under
the same login. It is temporary development policy, not production release acceptance.
RustCrypto XChaCha20-Poly1305 0.10.1 (Apache-2.0/MIT, compatible with Rust 1.90) uses
256-bit random generation keys, fresh 192-bit nonces and authenticated format/generation/
profile/credential/revision/origin metadata. `zeroize` 1.9.0 (Rust 1.85 minimum) provides
best-effort clearing; no Debug/serialization on the Rust secret wrapper, renderer key
entry/read command, hardware-derived password or plaintext API-key fallback.

Generation keys/records use existing anchored safe-write primitives under the stable
Tauri application-data root, outside the app bundle. Owner-only creation, bounded versioned
formats and regular-file/link refusal apply. Durable profile metadata owns each staged
generation before creation; a verified new reference and active-generation selection
share the profile transaction. Old healthy generations remain readable. Missing/damaged
keys or uncertain authentication require explicit per-profile native re-entry into a
fresh generation, preserving original files/references. Missing records with healthy keys
can reuse that generation. Read-only Settings/Retry never creates keys or sends requests.
Newer/malformed profiles and newer credential formats remain refused and unchanged.
Schema 1 native serialization/default services stay compatible; file staging explicitly
uses schema 2 with no downgrade support. This Mac file-storage selection preserves
Windows routing; the later Windows adapter follows the continuation decision above.

Native entry retains its secure field on save failure for Retry/Cancel. The service is
released during the dialog; target/settings tokens are checked again before writes.
Uncertain publication requires a successful read-only reconciliation before another write;
confirmed saves with failed cleanup report saved/cleanup-pending, including when subsequent
Settings reload fails. Deferred native cleanup and unreadable recovery records remain
owned even after profile removal. Abandoned generations are retained; no orphan sweep.
Session escape, Keychain API-key work and Apple Development signing remain deferred.

Healthy compatible data is intended to survive quit/reopen, restart and application
replacement/removal/reinstall retaining app data. No guarantee survives app cleaners,
explicit user-data deletion, disk loss or clean OS installation. Coherent restore requires
profiles, generation metadata, master keys and ciphertext with correct permissions;
that backup can decrypt the keys. No automatic sync/transfer or restore UI is added.
Actual packaged native entry, retained-input Retry/Cancel, file recovery and two-build
reuse passed in the separately approved public synthetic fixture. The
[owning ledger](../tasks/archive/2026-10-09-phase-2-execution-history.md#development-file-native-qualification-result--2026-10-08)
retains exact counts, failures and limits. Source tests and this bounded native proof
do not imply Windows or production-release acceptance.
Subsequent independent review corrected the visible cleanup-pending qualifier when a
confirmed save cannot reload Settings. That changed response has shared source/DOM
proof and corrected Mac section-15
packaged proof on source `37e3ab3`; Windows target proof remains missing. The original
packaged inputs and their historical evidence remain distinct. The
[acceptance-gap disposition](../tasks/archive/2026-10-09-phase-2-execution-history.md#studio-2a1-acceptance-gap-review-and-windows-proposal--2026-10-09) retains Windows complete-manifest/full-flow
blockers and proposes a combined replacement/reload proof. Its
[prepared qualification fixture](../tasks/archive/2026-10-09-phase-2-execution-history.md#windows-acceptance-schedule-preparation--2026-10-09)
uses only the existing post-confirmation snapshot seam on an isolated Windows beta
replacement; it changes no persistent bytes, production credential behavior or Mac
policy. Source/DOM/controller PASS prepares the schedule; Windows native proof still
requires separate allowance and an actual packaged x64 executable. Windows cross-build
continuity remains outside the selected same-package slice; no update guarantee is
accepted. Generic/session-only/no-auth and full 2A.1 remain deferred/incomplete.

Local removal does not revoke the provider key. Project movement requires new device
profile/credential setup. Adapter persistence/access attributes must match this intent;
packaged reopen/update identity, especially unsigned macOS prompts, needs actual proof.

Plaintext API-key JSON or `.env` files remain excluded. Outside the selected temporary
Mac exception, OS-encrypted files remain a valid
alternative but add file management without a demonstrated benefit over direct native
storage. Password-protected portable vaults, external password-manager integrations,
OAuth, key export/sync and external card JSON/PNG interoperability are deferred.
No service/signing purchase or enterprise-policy qualification is required by this ADR.

## Evidence and implementation gates

- [ADR 0013](0013-provider-request-and-transport-contract.md) proposes the concrete
  request/credential-origin/transport contract accepted for the bounded Studio 2A.1
  remembered-profile slice. Full compatibility/native qualification remains incomplete;
  this does not change storage policy or authorize generic/generation integration.
- [Credential spike](../research/CREDENTIAL_STORE_SPIKE_RESULTS.md): packaged native
  storage evidence and its no-entry-UI/locked-store/signing limits.
- [Phase 2 contracts and gates](../tasks/active/phase-2-initial-llm-assistance.md):
  production native entry/store/request/replace/delete, session/no-auth, failure ordering,
  exact reviewed context and reference/schema proof before completion claims.
- [Electron OS-backed storage](https://www.electronjs.org/docs/latest/api/safe-storage),
  [SillyTavern key storage](https://docs.sillytavern.app/usage/faq/) and
  [Continue CLI secrets](https://docs.continue.dev/cli/configuration) show differing
  conventions; none is evidence that Loomlight already implements its chosen design.
- [Character Card V2](https://github.com/malfoyslastname/character-card-spec-v2),
  [V3](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md) and
  [World Info](https://docs.sillytavern.app/usage/core-concepts/worldinfo/) inform fields,
  without adopting their roleplay instruction/automatic-inclusion semantics.

Existing WORKFLOW/TESTING requirement IDs, target routing and cumulative budgets remain.
Use controlled failure fixtures plus early actual production paths; no full matrix for
each feature, new hostile/crash programme or unsupported cross-SHA reuse policy.
