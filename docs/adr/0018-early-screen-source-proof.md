# ADR 0018: Early screen-source editing proof

- Status: Implementation proposal; local runtime proof and independent review pending
- Date: 2026-10-21
- Scope: Early Phase 3B source/runtime risk proof

## Context

The user selected an early 3B outcome while Phase 2/3A human acceptance remains
pending. Before choosing the general Screens workspace, prove one nested custom
screen's minimal source edit and its actual Ren'Py rendering. The full screen
inventory, persistent ownership, creation, Story connections and preview job remain
later implementation work.

## Decision

Add a bounded source recognizer using the existing shared lexical ranges. Inspect
parameterless top-level screen declarations in a selected `game/ui/<name>.rpy` file.
Recognize fixed/frame/vbox, literal text/image/textbutton nodes and existing integer
`xsize`/`ysize` properties. Preserve other statements and complete unsupported child
blocks as protected spans. Reads never execute screen language or Python.

The early handles contain the file path, source hash, screen name and node byte
offset. They expire when source changes. They are not persistent screen IDs, an
ownership migration or a promise of arbitrary existing-project import. No project
or source-map schema changes are required for this limited edit. Persistent screen
ownership and metadata migration need their own qualified implementation before
the full designer creates or connects screens.

The setter accepts only existing, unambiguous literal properties in the range
1–16384. Prepare the candidate by replacing that numeric token alone, parse it
again, then commit through the shared transaction/history service. Retain Source
draft protection, revision checks, recovery and runtime write exclusion. Duplicate
or opaque ownership refuses. A same-value request adds no history entry.

Use disposable fictional source to qualify actual rendering in the pinned official
Ren'Py 8.5.3 SDK. Verify its archive against the published checksum, freeze the
accepted source bytes, isolate its game/save files and execute deliberately. Retain
the source hashes, per-command result, actual frame dimensions, screenshot and
continuation count. Do not expose arbitrary SDK arguments through application IPC.
This qualification driver is not the future product scratch-preview job.

## Alternatives and consequences

Extending Scene mappings to hold provisional screen IDs would introduce a migration
before the screen ownership contract is implemented. Keeping handles revision-bound
lets this proof remain small and refuse stale selections.

Rewriting an entire screen from a new document model would risk unrelated source.
The recognizer therefore edits only a verified existing token and reports partial
coverage. It does not claim complete screen semantics or visual fidelity.

The later designer still needs persistent ownership, new-screen collision handling,
the agreed property/action inventory, assets/fonts, Story integration, template
adapters, conservative effect summaries and a typed isolated preview service.

## Evidence

The [owning task](../tasks/active/phase-3-initial-wysiwyg-release.md#early-execution-ledger)
records passing source cases, retained harness failures, cumulative use and pending
runtime/review/target evidence. No full 3B or earlier milestone acceptance is claimed.
