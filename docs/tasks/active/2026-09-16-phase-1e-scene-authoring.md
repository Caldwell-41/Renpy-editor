# Phase 1E Scene authoring execution ledger

**Opened:** 2026-09-16  
**Status:** 1E.1 closed locally; 1E.2 in progress  
**Branch:** `feature/phase-1e-scene-authoring`  
**Base:** `06850418b3f5e4e7a39c7b967483872ab78b68dc`

## Authority and boundary

The user explicitly approved Phase 1E only. Work proceeds through 1E.1, 1E.2, and
1E.3 in order. Phase 1F and later capabilities remain excluded. PRs #7 and #8 are
already merged and will not be replayed.

The accepted source, transaction, project/session, single-instance, SDK, renderer,
and retained-import guarantees remain mandatory. Ren'Py source bytes are runnable
truth; metadata records identity, mappings, ordering, and convenience state only.

## Verified entry state

- Fresh checkout of `origin/main` resolved to the expected
  `06850418b3f5e4e7a39c7b967483872ab78b68dc`.
- The accepted Phase 1D integration commit `3487f7c9049c8f3bbae56edc8e36eff58c364b19`
  is an ancestor. The two later commits are documentation-only.
- Worktree was clean before branch creation.
- Root `AGENTS.md`, CURRENT, HANDOVER, the active Phase 1 plan, architecture, data,
  transaction, UI, testing, security, and ADR 0001–0005 contracts were reviewed.

## Checkpoint 1E.1 — source, hierarchy, file lifecycle, history

**Status:** Closed locally

### Planned production boundary

- Evolve project/source-map metadata for ordered multiple Chapters and Scenes while
  accepting and transactionally migrating the valid Phase 1 schema.
- Preserve UUIDs and unknown JSON fields, validate unique labels/paths/ownership,
  keep at least one Chapter and Scene, and apply deterministic selection fallback.
- Add a narrow Scene source mapper that records exact byte ranges, lexical context,
  supported beats, and protected opaque regions without implementing the 1F Source UI.
- Add semantic Scene operations whose source and metadata mutations form one shared
  transaction and whose committed revisions feed end-to-end undo/redo.
- Add safe create/move/delete semantics, including destination absence and exact
  obsolete `.rpyc` ownership handling.
- Refuse destructive operations when supported or opaque incoming references cannot
  be resolved safely. Entry and last-Scene deletion remain refused.

### Gate evidence

- `cargo test -p loomlight-core --locked`: 125 passed, 0 failed, 4 intentionally
  ignored subprocess workers.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.
- `cargo fmt --check --all`: passed.
- Focused Scene service: 6 passed, including transactional v1→v2 migration and
  reopen/stable Beat IDs, unknown-field retention, CRLF/Unicode minimal insertion,
  opaque-boundary refusal, known/unknown incoming-reference refusal, multi-Chapter/
  Scene lifecycle, `.rpyc` removal, repeated undo/redo, external history boundary and
  failed inverse cursor retention.
- Transaction additions: delete commit and retained backup, create/delete history with
  actual inverse identities, interrupted-delete recovery classification, safe explicit
  keep/accept recovery, and ambiguous-recovery refusal all passed.
- Focused review found no renderer write path (none is wired yet), no Phase 1F parser/
  workspace work, and no SDK execution on inspect or mutation.

History is intentionally session-local in Phase 1E: committed source/metadata is
durable, while the undo cursor starts empty after close/restart. This is surfaced
truthfully rather than reconstructing semantic intent from retained recovery journals.

## Checkpoint 1E.2 — functional Scene authoring and recovery UX

**Status:** In progress

### Planned production boundary

- Approved Beat subset, explicit flow edges, Story-tree authoring, buffered inline
  writing, truthful Flush state, and static non-executing diagnostics.
- Minimum inspection and safe-resolution workflow over retained transaction evidence;
  ambiguous states remain blocked.

### Gate evidence

Pending.

## Checkpoint 1E.3 — preview, media and visual conformance

**Status:** Blocked on 1E.2 gate

### Planned production boundary

- Scene-local reconstruction through the selected Beat with provenance and explicit
  partial/unknown state.
- Core-mediated, read-only, session-scoped raster/audio delivery with bounded formats,
  bytes and image dimensions, stale-session/path/substitution denial, cancellation,
  invalidation and disposal.
- Quiet Studio Dark, responsive 52/48 Preview/Beats layout, keyboard reorder,
  labelled/focusable controls, focus restoration, and reduced-motion evidence.

### Gate evidence

Pending.

## Final supported-target closure

**Status:** Pending all checkpoint gates

The final changed application tree will receive one complete production run on
Windows x86-64 and macOS Apple Silicon ARM64. Failed, cancelled, and skipped evidence
will remain explicit. The brief will be archived only after all gates pass.

## Decisions and retained limitations

- Story-tree order is organisational and never generates implicit runtime flow.
- Display rename does not rename labels, paths, or stable IDs.
- New Scenes end in an explicit `return` beat.
- Scene deletion is refused for the entry Scene, last Scene, known incoming Choice or
  Jump edges, or opaque source that prevents a complete incoming-reference proof.
- Conditional choices, arbitrary expressions, Source workspace, Branches workspace,
  SDK execution, Git, plugins, and broader import remain deferred.

## Validation record

No checkpoint gate has yet been claimed.
