# Screens prototype comparison

The user prefers Screen notebook. Its revised draft adds plain directions, help
tooltips, front/back controls and a larger preview that can be resized. The original
three layouts remain available for comparison. All four drafts are unapproved and
use the same fictional game. The comparison is ready for review after focused and
combined browser verification under the prototype skill's UI workflow.
The [owning task](../../tasks/active/phase-3-initial-wysiwyg-release.md#screens-prototype-candidate-and-verification-boundary)
records published source identity, cumulative allowance and retained failure history.

- Screen notebook · revised puts Elements, Position & look and Buttons & story beside
  a larger game preview. Focus preview hides the editing controls. Its border handles
  change the space available for the preview.
- Layout workbench keeps the hierarchy, canvas and inspector beside one another. It
  favors frequent selection and property changes. Each pane scrolls independently.
- Canvas desk gives the player view the upper workspace and puts hierarchy and a
  wider property editor in a lower dock. Sample controls sit beside the player view.
- Screen notebook · original puts Compose, Arrange and Connect sections beside
  the player view. It offers a more directed first Help journey. Compact views put
  the player view above the notebook.

All retain the app's fonts, colors, icons and shell. The separate floating comparison
bar changes the shareable `variant` parameter. Switching resets the fictional sample;
edited samples require an explicit reset decision. The global arrows leave tree,
canvas and editable controls to their own keyboard behavior.

## Revised notebook controls

Select an element in the preview or Elements list. Apply changes keeps its draft;
Cancel changes restores its previous values. Shared headings ask which screens
should change. The `?` controls explain screen behavior, positioning and anchors,
shared looks, button actions, value bars and preview sizing. Hover, click or focus a
help control to read it; Escape closes it.

Front & back has Bring forward and Send backward. These move the selected element
one place within its group. Later siblings cover earlier ones where they overlap.
Moving a group keeps its children together. Selecting an element adds an outline
without changing its draw order. Vertical, horizontal and grid groups use those
buttons to change item order; their automatic reflow remains an approximation here.
Ren'Py's screen-level `zorder` controls whole screens and is separate from element
order. See the [screen statement](https://www.renpy.org/doc/html/screens.html#screen-statement).

Drag the preview's left border for width, bottom border for height, or bottom-right
corner for both. Focus a border and use arrow keys for smaller changes; Shift uses
larger changes. Escape cancels a drag. These controls keep unfinished edits and add
no source Undo entry. Game size is a separate menu. Fit shows the full game rectangle;
75% and 100% use game pixels and allow scrolling. Focus preview gives the game the
notebook's space; Escape or Back to editing restores the controls. Compact layouts
put the preview above the notebook and keep both reachable by scrolling.

In Buttons & story, select Close in the canvas to edit its actions. Show overlay and
Next line demonstrate a screen that stays open during dialogue. Help dialog pauses
the story until Close or Escape. Clicking outside leaves either screen open. These
are separate story examples; clicking a button in the preview selects it for editing.

## Original layout journeys

Start with Help panel. Select its title in either hierarchy or canvas, edit its text,
then Cancel. Change it again and Apply. The shared-style prompt lists affected screens
and offers an independent copy. Invalid properties and the Source conflict sample
retain drafts. Apply or cancel drafts before changing screen behavior. Undo reverses
one accepted sample change. Arrow keys select tree nodes or draft canvas positions;
free-positioned containers support snapped drag and Shift-drag resize. Escape cancels
the gesture. Children in vbox/hbox/grid use sibling reorder and parent spacing.

Open Try the Help story connection. Show keeps the panel visible through dialogue;
Hide dismisses it. Choose Help dialog, Call it, attempt dialogue, click outside, then
Finish. The sample continues once. Game Escape uses the matching dismissal. Changing
the selected screen or its behavior resets this separate connection simulation without
continuing the story. Canvas Close controls only select the element.

Select Dialogue (say). Sample speaker and dialogue text illustrate protected runtime
bindings. Layout and appearance fields remain available; required text, structural
parent ownership, node removal and action bindings stay protected. The same fixture
inventory includes choice, main menu, navigation, preferences and save/load.

New screen offers blank, Help panel and Help dialog starters. Add element exposes the
full agreed inventory. Other review controls cover font/UI-image picking, variable text,
integer-bar limits, normal/hover/selected/disabled samples, shared styles/components,
typed variable assignments and ordered actions. Finish stays last. Source controls
show partial coverage and a protected Python neighbor. The supported text reconciliation
dialog changes only sample memory.

## Simulation and implementation limits

Every save, source edit, import, sharing operation, Story connection and preview request
uses browser memory. Reset or remount supplies fresh fictional data. Preview reports its
sample revision and becomes stale after an accepted edit. It launches no Ren'Py process.
The displayed Source is explicitly illustrative, not serializer output.

The canvas approximates geometry, images and fonts. Its map is a CSS placeholder. Text
size changes the sample through CSS scaling; font choice retains a value while the canvas
keeps its CSS font. Font selection, image aspect preservation, size constraints,
padding/spacing, per-state style edits and container reparenting expose review
controls; they do not claim complete native
rendering or reflow. Real asset import/discovery, per-state storage, style/component source
ownership, template adapters, Story Beats, scratch preview, native focus and dismissal
remain later product integration with the task's required evidence. Components have no
parameters. Unknown/custom source remains outside visual editing.

The source/runtime proof qualifies its named earlier slice only. It does not qualify
these browser samples as product functionality. Production implementation follows an
explicit layout selection and the existing [integration procedure](../../../app/design-lab/INTEGRATION.md).
Keep prototype fixtures and the comparison switcher outside production inputs. Preserve
the other lab layouts and approval records.

## Review status

All four layouts are ready for comparison. Screen notebook is the user's preference;
the revised draft still needs their selection. No prototype code is promoted.
Draft identities are `workbench-v1`, `canvas-v1`, `guided-v1` and `guided-v2`; every
approval remains null. The source/runtime gate was separately audited at
`0ef174877cbe5ae3fd883afb92940de68916b04a` in CI run `39555526201`. That proof
qualifies its narrow source slice, not these simulated browser controls.

The user approved focused root-cause work followed by combined verification under
[Fix Root Causes](https://github.com/cursor/plugins/blob/101b274dd991f694e1f7024be2157e5f3adf07de/pstack/skills/principle-fix-root-causes/SKILL.md).
Reproduction confirmed that CSS arrows changed the original switcher names. Explicit
accessible labels correct those names at the controls. The notebook's open property
group contained the expected action data but skipped rendering while offscreen under
`content-visibility: auto`. Its test read rendered text too early. The corrected test
scrolls into view and requires effective visibility before reading the action rows
and the protected-action notice. Assignment/order assertions and product behavior
remain intact. Per-layout progress and failure visibility facts now identify the
failed state directly.

The original comparison's local10 passes all 60 Screens cases and three journeys.
Its local11 passes TypeScript, approval/source validation, all 508 lab rendering cases
and 20 check groups on Chromium 155.0.8059.86, with no browser errors. Shared
navigation, gallery, draft guards, approval/HMR, native/network refusal, sample reset,
invalid-selection handling and production-build exclusion pass. Every registered
Screens state renders at 1100×720 and 560×640 in both themes.

Reports and captures remain ignored under `.toolchains/phase3b/prototype-batch-10/`
and `prototype-batch-11/`. All 12 final Screens captures match the previously reviewed
images byte for byte; parent review also rechecked representative final captures.
The owning task preserves every earlier failed attempt and its evidence. Final use
is local11/11. The later notebook refinement has its own finite local4/4 allowance.

Refinement local3 passes 80 Screens rendering cases and all four complete journeys.
Local4 passes TypeScript, approval/source checks, 528 lab rendering cases and 20 check
groups on Chromium 155.0.8059.86, with no browser errors. It covers both themes at
1100×720 and 560×640, help, resizing and cancellation, retained drafts, overlap pointer
targeting, group movement, Undo, protected screens and the story example. The two
earlier focused failures and their causes remain in the owning task. Final reports
and four revised captures remain ignored under
`.toolchains/phase3b/notebook-focused-03/` and `notebook-combined-04/`. Visual review
checked both themes and sizes. Browser proof and source identity do not approve a
layout or qualify durable saves/native behavior. No repair or check is pending.

Open the lab from `app/` with `npm run design:dev` and choose Screens, or use a direct link:

- [Screen notebook · revised](http://127.0.0.1:5174/?screen=screens&variant=guided-v2)
- [Layout workbench](http://127.0.0.1:5174/?screen=screens&variant=workbench)
- [Canvas desk](http://127.0.0.1:5174/?screen=screens&variant=canvas)
- [Screen notebook · original](http://127.0.0.1:5174/?screen=screens&variant=guided)

The existing targeted screen check and combined `design:check` own browser verification.
Their rendering/interaction evidence remains separate from durable saves, native behavior
and user approval. No new test framework is introduced.
