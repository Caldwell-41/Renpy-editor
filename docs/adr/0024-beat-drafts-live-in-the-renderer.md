# ADR 0024: Beat drafts live in the renderer

- Status: Accepted
- Date: 2026-11-12
- Scope: retained beat drafts for Story Combined v1 (#110, #112). Extends ADR 0007
  and ADR 0022 without changing Source draft ownership.

Beat drafts must survive navigation between beats, branches, scenes, views and
workspaces. Source already keeps unsaved text in a session-only registry in core,
so the obvious step is to keep beat drafts there too. We did not.

A shell-owned store in the renderer holds each beat draft for the open project
session. It keeps the live editor, so the draft retains caret, IME state, incomplete
input and the browser's text history. An existing beat's draft is keyed by its beat
id. A new beat's draft has its own id and records its insertion place, with at most
one pending new beat per place. The shell asks the store whether drafts exist, which
beats to mark, how to reveal one and which commands Save should send. It never
queries the DOM. Core holds no Story drafts. It checks each command at Commit or
Save, and every command already carries its scene source revision and expected
body.

Keeping drafts in core was rejected. A beat draft is control state, not text. Core
cannot read incomplete numbers or formulas, so it would store payloads it cannot
check. Every keystroke would cross IPC, and each of the beat editors would need code
to rebuild itself from stored values.

Consequences: drafts end with the project session and are lost if the renderer
crashes, as they are today. All-draft Save (#114) collects commands from the store.
Draft Undo (#113) has to combine draft steps held in the renderer with committed
entries held in core. Revisit this decision if drafts must survive a restart, or if
core must check drafts that the renderer cannot express as commands.
