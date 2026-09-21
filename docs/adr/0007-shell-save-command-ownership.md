# ADR 0007 — Shell-owned Save command and document-bound Source acceptance

**Date:** 2026-09-21.
**Status:** Accepted design for the bounded Phase 1F correction; implementation and
supported-target acceptance are tracked separately in the
[1F-SAVE brief](../tasks/active/phase-1f-save-correction.md).
**Extends:** ADRs 0003, 0004 and 0006 without replacing their runtime, transaction,
source-authority or media boundaries.

## Context

Phase 1F placed Source Save on a textarea listener alongside a shell-wide Flush
listener. Candidate `4dfedd24` moved Source to window capture, leaving two owners and
leaving Source operations outside the shell's existing operation-completion policy.
It also consumes clean-Source Save without normal Flush. A captured keyboard event
alone says nothing about the asynchronous command's success.

Independent review identified a separate packaged-smoke defect: selection-only updates
are incorrectly treated as dirty edits by the fake Source requester. A reduced browser
experiment reproduces acceptance followed by false re-dirtying with either target or
capture handling. This does not establish the exact ordering in the failed native
runs. Their composite wait and missing operation traces cannot prove that global Flush
stole the command. The task brief preserves the evidence and confidence limits.

The shell already owns the project/session, authoring/Flush exclusion and completion
generations. Explicit arbitration belongs there. Source owns editor semantics, local
input retention and document identity; the shell must not depend on textarea details.

## Decision

### One command owner, distinct outcomes

Use one application-lifetime Save keyboard adapter feeding a small shell-owned command
coordinator. No Source component installs a global/window Save listener. This is not a
general command registry, plugin system or new persistence service.

The Source controller resolves editing ownership and returns one of: not applicable;
blocked with a reason; or a captured Source target. Its target binds the originating
session, controller and document-open generation plus the relevant input identity.
It must not mean whichever document is current after an await. Exact TypeScript names
are implementation details; a `saveCurrent()` callback and stale dirty getter alone
are not a sufficient contract.

Keyboard routing considers pending local input as well as acknowledged drafts. Source
acceptance refusal, invalid/conflict state, failed retention and busy state are handled
Source outcomes, not reasons to fall through to Flush. Clean Source after successful
settlement, and non-Source editing contexts, retain normal project Flush. Toolbar Save
Source captures its own document and invokes the same acceptance executor without
requiring textarea focus after the click. Modifier, composition and modal policy is
specified and tested in 1F-SAVE.

The editor adapter owns semantic focus and editor-specific state. The shell does not
query textarea classes, selection offsets, or rich-editor internals. Controller
registration is scoped to session/view lifetime; disposal revokes its ownership and
cannot unregister a newer controller.

### Retain, accept, reconcile

Reserve the existing per-session mutation/exclusion ownership before awaiting draft
settlement. Use a short non-destructive input/navigation barrier during acceptance.
Pending updates drain without recursively acquiring the same ownership. Settlement
retains the captured latest input in the existing session-only registry; it is not
source acceptance, a disk write or autosave. Failed settlement must prevent acceptance
of an older retained draft and preserve the latest local text.

Source Save, Apply Both, confirmed Discard/Reload, Save All/Discard All and leaving
cooperate with this ownership. Duplicate requests are coalesced or reported busy,
not queued indefinitely. Successful and failing completions are checked against the
captured session/controller/document identity before rendering, status, or focus
changes. Leases are released in finally with matching-token checks even when stale.
Observations and inventory reconciliation cannot overwrite newer local input.

Same-project navigation settles retention without acceptance. Close/switch/normal exit
settle input before deciding whether there are drafts, exclude racing input while the
leave decision is active, and preserve Save All / Discard All / Cancel. Modal ownership
suppresses background commands but permits its explicit coordinated actions. These
rules do not change the core's all-before-write Save All preflight or recovery scope.

### Existing durability and authoritative status

Preserve the real Source acceptance path through shared transaction/history services.
`TransactionService::commit` establishes the required platform durability and persists
`JournalState::Durable` before returning `CommitOutcome::Committed`. A successful
`source.save` already crosses that boundary; do not add a second renderer Flush merely
to match the phrase 'accept then flush'. Normal clean/non-Source Save still explicitly
calls project Flush. Neither path introduces filesystem-wide atomicity claims.

The shell derives project persistence truth from current core status plus newer local
unretained input and operation state. One clean Source document cannot establish
project Saved. Conflict/recovery precedence and completion generations remain intact.
An uncertain post-acceptance status read is not permission to retry acceptance blindly.
Core session validation, the desktop lifecycle mutex, exact revision checks and recovery
remain authoritative even when renderer completions are stale.

## Alternatives and consequences

Keeping a properly implemented target listener with propagation suppression is a valid
DOM technique, but here it keeps command ownership and operation orchestration split.
Keeping Source's window capture listener strengthens that split and does not repair
the identified smoke model. The coordinator is selected for explicit ownership,
clean fallback and common lifecycle guarantees, not as an unproven WebView workaround.

A generic command bus, new document store, new draft journal or replacement transaction
stack adds scope without addressing the demonstrated failures. A short acceptance
barrier is simpler for this milestone than accepting unrestricted concurrent typing
and rebasing its snapshots. Its temporary input restriction must remain visible,
non-destructive, keyboard-accessible and released on every terminal path.

Testing must distinguish fake UI behaviour, synthetic modifier routing, real native
keyboard delivery and real-service disk durability. The 1F-SAVE brief owns the exact
matrix and gates. Green mocked UI results cannot certify durable Source writes.

## Evidence and references

The [1F-SAVE diagnosis](../tasks/active/phase-1f-save-correction.md#1-evidence-and-corrected-diagnosis)
records the failed candidates, reduced experiment, uncertainty and reproduction recipe.
Relevant implementation paths are [shell](../../app/src/main.ts),
[Source UI](../../app/src/source-ui.ts), [packaged smoke](../../app/src-tauri/src/smoke_probe.js),
[Source service](../../app/src-core/src/source.rs), and
[transaction service](../../app/src-core/src/transaction/mod.rs).
Existing product and durability contracts remain in [UI](../UI.md),
[ARCHITECTURE](../ARCHITECTURE.md), and [TRANSACTIONS](../TRANSACTIONS.md).
