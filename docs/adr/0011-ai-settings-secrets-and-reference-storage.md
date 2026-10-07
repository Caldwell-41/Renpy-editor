# ADR 0011: AI settings, secrets and reference storage

**Status:** Accepted design; bounded Studio remembered-profile/Mac native implementation present; Windows and both-target qualification incomplete.
**Date:** 2026-10-07.
**Authority:** the user selected project-local prompts, native references with basic
scope/notes, localhost/LAN/HTTPS and adaptive helpers; accepted the omission/credential
review and requested the agreed plan be recorded. No implementation/provider operation
is authorised by this documentation update.

## Context

Loomlight needs repeatable reviewed AI assistance for local hobby projects. Provider
access belongs to the device; private writing references belong to the game project.
The existing credential spike proves native store round-trip/delete on both targets,
but had no renderer or native entry dialog. It is not production credential UX evidence.

## Decision

- Keep versioned provider/model settings and project-to-profile bindings in device-local
  `ai-profiles.json` under the existing application-data root. Store no key values.
- Use macOS Keychain / Windows Credential Manager for **Remember on this computer**.
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

The subsequently proposed guarantees against password entry across every ordinary
rebuild/update, mandatory Touch ID/Windows Hello PIN integration and a new two-changed-
build acceptance gate were withdrawn by the user on 2026-10-08 pending research.
They are research questions, not selected implementation work or acceptance blockers.
Existing stable identity/storage and secrecy contracts remain; no budget renewal,
credential migration, signing purchase or trust change is authorised by the research.

Local removal does not revoke the provider key. Project movement requires new device
profile/credential setup. Adapter persistence/access attributes must match this intent;
packaged reopen/update identity, especially unsigned macOS prompts, needs actual proof.

Plaintext JSON or `.env` files are not the default. OS-encrypted files remain a valid
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
