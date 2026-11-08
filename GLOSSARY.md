# Loomlight

Loomlight authors Ren'Py projects while preserving their source. These terms
distinguish Story and screen editing from deliberate game execution.

## Language

**Beat draft**:
An unfinished edit attached to a Story beat that has not been committed to the
project's source. It can contain incomplete input and remains available when the
author leaves the beat and returns.

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
