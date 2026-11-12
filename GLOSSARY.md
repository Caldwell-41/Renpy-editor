# Loomlight

Loomlight authors Ren'Py projects while preserving their source. These terms
distinguish Story and screen editing from deliberate game execution.

## Language

**Beat draft**:
An unfinished edit attached to a Story beat that has not been committed to the
project's source. A beat added with Add a beat is a beat draft at its insertion
place until it is committed. It can contain incomplete input and remains available
when the author leaves the beat and returns.

**Beat draft conflict**:
A disagreement between a retained beat draft and source that changed after the
draft began, requiring the author to decide which edit to keep.

**Story Save**:
The main Save action in Story. It accepts every pending beat draft in the open
project, or none of them.
_Avoid_: Commit as a synonym

**Project history**:
The one ordered list of the author's edits in the open project, saved or not.
Undo reverses the latest edit in it and Redo restores it, in every workspace.
Navigation and view changes add nothing to it. It ends with the project session.
_Avoid_: Scene history, Story history, page history

**Draft step**:
One edit in a beat draft or in unsaved Source text that a single Undo reverses.
Typing in one field is one step until focus leaves the field or the author pauses.
Each change to another control is one step. Undo of a draft step changes the draft
and writes no source. Commit, Story Save or Source Save joins the draft steps of a
beat or file into one edit. Input that does not survive navigation, such as search
text or an open form, has no draft steps.

**Body**:
An ordered list of beats that play top to bottom without branching. A scene body
holds the beats directly under the scene's label, a branch body holds one If, Else if
or Otherwise branch, and an option body holds one Choice option. A whole condition or
Choice is one node in its parent body and owns the bodies under it.
_Avoid_: Root body, block, lane, track

**Body ending**:
Whether the story can pass the end of a body: the body ends, it continues, or its
ending is unknown because its last beat is Custom Code that may leave it.

**Insertion place**:
A body plus a position in it, before one of its nodes or at its end, where a new
or moved beat can go.
_Avoid_: Slot, destination, insertion target

**Game stage**:
The Story view of supported scene appearance through the selected beat, shown in
the project's width-to-height ratio, including valid beat drafts. It marks unknown
state and does not run the game.
_Avoid_: Screen canvas as a synonym

**Screen canvas**:
The inert editing view of a screen's supported appearance, including marked draft
changes and sample values. Its controls select elements for editing.
_Avoid_: Test in Ren'Py as a synonym

**Ren'Py canvas helper**:
The renderer for the screen canvas that uses supported values and assets without
executing the game's scripts or actions.
_Avoid_: Game preview as a synonym

**Test in Ren'Py**:
The deliberate preview of an accepted screen in the actual Ren'Py project, where
game scripts and actions can execute.
_Avoid_: Screen canvas as a synonym
