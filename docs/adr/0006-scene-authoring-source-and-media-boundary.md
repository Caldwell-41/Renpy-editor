# ADR 0006: Exact-range Scene authoring and bounded media presentation

**Status:** Accepted for Phase 1E  
**Date:** 2026-09-16

## Context

Phase 1E must add useful Scene authoring without turning editor metadata into a second
runnable document, regenerating whole Ren'Py files, or granting the renderer project
filesystem access. It must also evolve the original one-Chapter/one-Scene scaffold
without changing existing stable identities and must make undo/recovery respect the
same exact revisions as ordinary commits.

The Scene preview needs project images and user-initiated audio, but a `file://` URL,
arbitrary relative-path command, or broadly relaxed content policy would let untrusted
renderer state select files outside the approved authoring model. Custom Ren'Py and
Python can also invalidate the editor's knowledge of state without being safe to run.

## Decision

Scene authoring extends the Phase 1D lexical and transaction foundations. A narrow
canonical Scene recognizer maps supported Beats to stable IDs, exact source revisions,
verified byte ranges, and lexical context. It preserves unsupported bytes as protected
Custom Code and refuses insert, replace, remove, or reorder operations when ownership
or a safe boundary cannot be proved. It is not a general Ren'Py parser or a second
Scene exporter.

Project and source-map schema version 2 supports ordered Chapters and Scenes, explicit
Scene ownership, globally unique primary labels, safe project-relative source paths,
entry Scene, and deterministic last-open fallback. Migration from a valid version 1
project preserves the project, Chapter, and Scene UUIDs plus unknown fields and commits
metadata changes through the shared transaction service. Display names remain separate
from labels, paths, and UUIDs.

Scene create, move, delete, Beat changes, metadata companions, and proven obsolete
`.rpyc` removal are semantic transactions. History stores the exact revisions returned
by real commits and constructs inverse transactions only when the current revision
matches the recorded boundary. Phase 1E history is session-local: reopening starts an
empty undo cursor rather than inferring semantic intent from recovery journals.

The renderer requests media using a stable Asset UUID and a purpose of thumbnail,
image preview, or audio audition. Core resolves the current-session asset metadata and
serves a read-only snapshot only after anchored path, identity, byte-count, and hash
verification. It accepts passive PNG/JPEG presentation images up to 8192 pixels per
dimension and passive OGG/WAV/FLAC/MP3 audio, with a 16 MiB presentation limit. Audio
audition requires a user action. The renderer owns only short-lived object URLs and an
in-memory content-keyed cache, cancels stale generations, revokes URLs on invalidation,
and disposes all media on project/session switch.

Preview reconstructs only supported Scene-local state through the selected Beat and
retains the contributing Beat IDs as provenance. Unsupported or runtime-dependent
code marks affected state unknown instead of preserving an earlier value as proven
current. The preview does not execute Ren'Py or project Python and does not infer
branch-global state.

## Consequences

- Source, Scene, future Source UI, and Branches can converge on the same semantic
  operation/history model without metadata becoming runnable truth.
- Valid Phase 1 projects migrate in place, while missing metadata and arbitrary
  existing Ren'Py projects remain outside the importer boundary.
- Incoming supported Choice/Jump references, opaque ownership, entry Scene, and last
  Scene constraints can block destructive lifecycle operations rather than guessing.
- WebView capabilities and CSP remain unchanged; media presentation cannot be used as
  generic renderer-visible filesystem access.
- WebP remains importable authoring content but is not rendered through the Phase 1E
  passive preview boundary.
- Exact runtime fidelity still requires an explicit future runtime action; preview is
  intentionally truthful but incomplete.

## Alternatives rejected

- Regenerating a complete Scene file from metadata: it would discard unknown syntax,
  formatting, comments, and external changes.
- Building an unrelated Scene-specific exporter/history stack: it would diverge from
  Source and Branches and bypass the accepted transaction guarantees.
- Exposing project paths or `file://` URLs to the renderer: it creates an ambient file
  capability and weakens substitution and session protections.
- Evaluating embedded Python for preview: project inspection and typing are not
  executable trust decisions.
- Persisting undo by replaying recovery journals: those journals establish byte-level
  recovery evidence, not the user's original semantic intent and grouping.

## Evidence

The Phase 1E execution ledger records separate 1E.1 source/lifecycle/history, 1E.2
functional authoring/recovery, and 1E.3 preview/media gates plus the final Windows x64
and macOS ARM64 production closure.
