# Screens prototype comparison

The question is where hierarchy, canvas and property editing should sit while an
author builds and connects Help screens. The installed prototype skill's UI workflow
produces three throwaway layouts on the existing Design Lab route. All are unapproved.
The comparison is blocked on incomplete verification and is not review-ready.
The same fictional game, screens, nodes and controls appear in every layout.
The [owning task](../../tasks/active/phase-3-initial-wysiwyg-release.md#screens-prototype-candidate-and-verification-boundary)
records published source identity, cumulative allowance and remaining verification.

- Layout workbench keeps the hierarchy, canvas and inspector beside one another. It
  favors frequent selection and property changes. Each pane scrolls independently.
- Canvas desk gives the player view the upper workspace and puts hierarchy and a
  wider property editor in a lower dock. Sample controls sit beside the player view.
- Screen notebook puts Compose, Arrange and Connect sections in a notebook beside
  the player view. It offers a more directed first Help journey. Compact views put
  the player view above the notebook.

All retain the app's fonts, colors, icons and shell. The separate floating comparison
bar changes the shareable `variant` parameter. Switching resets the fictional sample;
edited samples require an explicit reset decision. The global arrows leave tree,
canvas and editable controls to their own keyboard behavior.

## Review journeys

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

No layout is selected and no prototype code is promoted. Draft identities are
`workbench-v1`, `canvas-v1` and `guided-v1`; every approval remains null. The source/runtime
gate was separately audited at `0ef174877cbe5ae3fd883afb92940de68916b04a` in CI run
`39555526201`. That proof preceded this prototype and does not qualify its controls.

The selected local allowance is exhausted at 8/8. No overall combined check passed.
The remaining work needs a user-selected verification allowance before another check.

- Batch 7 TypeScript module checking passed. The targeted Screens runner could not reach
  the stopped server on port 5174 and ran zero cases. Its report is preserved at
  `.toolchains/design-lab/pages/screens/batch7-server-unavailable-report.json`.
- The planned batch 7 combined check created its own server and rendered all 508 lab
  cases, including the 60 Screens cases. It then failed to import the Screens interaction
  module because the registered path was relative to the wrong directory. Parent review
  of all 12 Screens captures also found a lower-dock overlap and cropped previews/text.
  The path and layout corrections preceded batch 8. The batch 7 record and captures
  remain under `.toolchains/phase3b/prototype-batch-07/`.
- Batch 8 again rendered all 508 cases and passed the 13 earlier interaction groups.
  The Screens module progressed through the first Workbench journey, including its
  geometry checks, but timed out at its first Next prototype layout lookup. Canvas desk
  and Screen notebook interaction journeys remain unproved. The final report is
  `.toolchains/design-lab/report.json`; the 12 Screens captures use
  `screens-<variant>-<theme>-<viewport>.png` in that directory.

Static review suggests the CSS arrow contributed to the switcher button's accessible
name. The buttons now have explicit Previous prototype layout and Next prototype layout
ARIA labels. This is an unverified correction and a cause hypothesis, not a passing
result. No browser check or interaction ran after the correction. The current code therefore
differs from the candidate used for the batch 8 evidence.

The next selected verification must establish the corrected switcher names, finish all
three Screens interaction journeys, complete the existing combined lab checks and review
the final captures. Browser rendering alone does not complete that evidence or approve a
layout.

Open the lab from `app/` with `npm run design:dev` and choose Screens, or use a direct link:

- [Layout workbench](http://127.0.0.1:5174/?screen=screens&variant=workbench)
- [Canvas desk](http://127.0.0.1:5174/?screen=screens&variant=canvas)
- [Screen notebook](http://127.0.0.1:5174/?screen=screens&variant=guided)

The existing targeted screen check and combined `design:check` own browser verification.
Their rendering/interaction evidence remains separate from durable saves, native behavior
and user approval. No new test framework is introduced.
