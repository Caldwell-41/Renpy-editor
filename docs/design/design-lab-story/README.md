# Story layout comparison

Both versions are unapproved browser drafts with the same fictional scenes and controls.
They keep Loomlight's production theme, fonts and icons.

- Manuscript desk puts scenes in a collapsible rail, a short preview above a continuous beat document, and editing inside the selected beat. It gives prose and branch bodies the full writing width.
- Stage & sequence puts the preview and selected editor beside a condensed beat sequence. It makes changes visible beside their position in the scene. Compact screens stack the editor above the sequence, each with its own scroll area.

## Capability map and control choices

The primary loop is select a beat, edit, save, inspect the preview, and continue.
Undo, Redo, Add beat and Assist stay visible. Save drafts provides one clear way to finish
retained edits. Scene organization, move/delete, Source and context details are secondary.
The story tree and preview can collapse; Writing focus hides both without losing drafts.

The fixture and editor cover dialogue, narration, backgrounds, character visibility,
appearance and placement, music, sound effects, transitions, variable assignments,
choices, conditional groups, jumps, calls and return/end. Protected custom source is
read-only and redirects to Source. Add beat offers the supported structured types;
it does not create custom Python.

Choices retain option text, destination and availability, option removal, adding options
and creating a destination scene. Conditional groups retain owned branch bodies, If,
Else If and Otherwise, nested conditions, branch deletion, unwrapping one branch and
moving beats between bodies. Continuing branches have an explicit rejoin. Calls label
return to the next beat and provide destination/continuation navigation. Source boundaries
and manually selected preview branches never claim condition evaluation.

Organize contains scene creation, rename, ordering, chapter movement, new chapter/scene
and guarded deletion. It refuses deletion of entry and referenced scenes. Its compact
chapter model stores chapters on scenes; empty standalone chapters and chapter renaming
are not simulated. Audio audition and drag reordering are represented by context and
keyboard move actions, respectively. They do not play sound or perform pointer dragging.
These are sample limits, not removals from the production contract.

Assist contains Rewrite dialogue, Edit scene, Continue scene and Draft scene. Preparation
lets the author select a fictional model, task, shared context, approved references and
limits. The author inspects the sample payload before generating, can cancel the wait,
then accepts or rejects a proposal. Acceptance makes one undoable sample change.
Batch Edit scene uses one sample narration insertion; it does not simulate arbitrary
operation selection. Prompt management and character/lore generation remain on their
respective pages. No model or provider call occurs.

## Draft and error behavior

Beat and scene selection retain unsaved drafts in memory. Switching scenes explicitly
confirms retained drafts. Closing an editor or collapsing a panel preserves them.
This is a deliberate prototype alternative to the production guard that settles a draft
before changing targets. Cross-page navigation warns that leaving resets the sample.
Save beat shows a short busy state; the error state refuses saves and retains edits.
Discard asks for confirmation. Empty prose fails validation. Save, structure and proposal
acceptance share sample Undo/Redo. Changing a lab scenario or reloading starts fresh.

## Verification

The focused Story check passed 32 rendering cases (two layouts, four states, two
sizes and both themes) and both complete interaction journeys on Chromium
155.0.8059.85 with Node 24.19.0. It verifies retained drafts, panel changes, save,
Undo/Redo, guarded discard, choice editing, conditional branches, preparation,
generation cancellation, proposal acceptance/undo, save refusal, empty scenes and
compact long-content saving. Captures and the report are ignored local files under
`.toolchains/design-lab/pages/story/`.

The initial browser attempt could not launch Chromium inside the sandbox. The
authorized external run rendered all cases, then failed on ambiguous option labels.
Specific accessible labels corrected that failure. Focused repair cycle 1 passed.
Visual review then shortened the preview, exposed the selected editor on mount,
preserved caret/scroll across redraws and added protected-source sample content.
Focused repair cycle 2 passed. Its visual review made two final CSS ordering fixes
for compact preview controls and wide Stage controls. Root's combined check on
2026-10-21 confirms that final CSS, with all 32 Story cases and both journeys passing.
Both themes and sizes of each layout were inspected.
No Story type errors remain; the combined compiler's then-current remaining error
was an unrelated unused Branches local. The root owns the final combined check.

The preview uses a compact, illustrative station strip rather than a resolution-faithful
game canvas. Scene details supply illustrative state rather than deriving every
preceding beat. Manual branch selection changes the explanation at unknown-flow
boundaries; it does not execute or simulate a route. These are explicit design-sample
limits. Browser proof does not qualify source edits, durable saves, audio, real game
rendering, native focus, model requests or packages.
