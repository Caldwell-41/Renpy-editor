# ADR 0025: Project history orders draft steps

- Status: Accepted
- Date: 2026-11-12
- Scope: project Undo and Redo across workspaces (#143, #113). Extends ADR 0006's
  revision-bound history and ADR 0024. It does not move draft content into core.

Undo reverses the author's latest edit, saved or not. Draft steps live in the
renderer (ADR 0024) and committed edits live in core's history, so one owner must
hold their order. Core's history holds it. For each draft step, the renderer adds
a draft-step entry that records only a step id, the draft it belongs to, a name and
the item to reveal. The entry carries no field values or bytes. Undo or Redo of it
writes nothing, and the renderer restores the draft's controls. ADR 0024 still
applies: core holds no Story drafts, only their place in the order.

We rejected a second, renderer-owned timeline merged with core's history. It needs
two cursors that must agree, two places that drop Redo after a new edit, and every
workspace response would have to report core's newest entry.

Commit or Save of a draft removes its draft-step entries and adds one byte entry at
the top of the history, so one Undo reverses the whole beat or file. A Story Save
adds one entry for each saved beat, with the most recently edited beat on top. The
entry cannot stay where the typing happened. History entries restore exact file
bytes and need the file's current revision to match, so a later edit to the same
file would turn its Undo into a history boundary.

Consequences: one draft-step entry crosses IPC for each grouped step, not for each
keystroke. Core clears draft-step entries when a project session starts, so a
renderer reload leaves none behind. Unsaved Source text gets draft steps under the
same rule. That is target behaviour, and a separate issue delivers it. Until then
the Source editor keeps its own text Undo. Revisit this decision if history must
survive a restart, or if Undo must reverse a saved edit without restoring bytes.

Update, 2026-11-13 (#155): Source draft steps are built. Core already holds Source
drafts, so the Source draft registry, not the renderer, keeps what a Source step's
Undo restores. The history entry still carries no text. The Source editor no longer
has its own text Undo; Cmd/Ctrl+Z in it runs project Undo.
