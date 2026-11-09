# A2 refinement

Kris selected A for refinement and asked to apply Experience First and bring it
closer to the approved Story mock. This selects a direction, not design approval.
The new variant/revision is `equation-v2`, labelled "A2 · Story equation refinement".
A, B and C remain available. All approval fields remain null.

## Changes

- Follow Story Combined v1's equation arrangement. Pick the variable above the row,
  then edit `trust [+= ▾] [formula]`. Use the same 34 px control height, 13.5 px
  formula text and short "Gives a whole number" / decimal feedback.
- Replace the symbol-only native operation select with seven named choices and
  short explanations. Arrow keys navigate, Enter selects, and Escape returns to
  the trigger. Choosing an operation returns focus to the formula without losing it.
- Replace permanent suggestion buttons with a typed-name list that shows declared
  numeric variables and their types. Enter/Tab inserts the selected name; Escape
  dismisses suggestions and keeps the formula draft. Parenthesis grouping stays
  available while editing.
- Keep one action open at a time, ordered summaries, stable reorder identity, the
  existing action limit and Finish-last rule. Show less repeated text. The default
  desktop view now keeps the three-action sequence and Finish visible.
- Put mock-only element switching, example formulas and context controls under
  Review cases, below Apply/Cancel. These review tools do not describe production
  navigation. Formula errors remain beside the input; refused Apply retains drafts.
- Use the approved Story Brass and slate token values from `docs/UI.md`, scoped
  to A2. Decimal defaults and numeric condition fields use the same control sizes.
  The definition list separates each name, type and default into readable columns.

The selected screen, task rail and inert canvas still use the actual Screens
renderer. The approved Story mock is unchanged. No production renderer, core,
IPC or app-wide palette was edited. A2's visual relationship to Story is deliberate;
Screens retains its own action-list context and Apply/Cancel workflow.

## Verification

The mounted mock remains the approved test boundary. The contextual-suggestion
TDD check first failed because no formula combobox existed, then passed after
implementation. The final focused `refined-check.mjs` passes nine selected samples.
It covers suggestion insertion/dismissal, operation keyboard focus and Escape,
invalid Apply and button draft retention, decimal/default/creation controls,
conditions and text, with wide/compact captures. Typechecking and whitespace pass.
No evaluator or runtime assertion was added. Named response fixtures still own
mock feedback, and unlisted formulas remain drafts.

Visual inspection caught operation-menu clipping in the scrolling inspector.
Menus now use the browser top layer and choose the side with enough space.
The corrected desktop capture displays all seven operations. Suggestions use the
same placement. No continuous animation is present.

[Chosen draft captures](equation-v2-captures.json) preserve important states,
dimensions and hashes. The suggestion/menu captures are reached through the
recorded check's interactions. They are not approvals. The inline export uses
host theme tokens and isolates the inspector at chat width; the LAN Lab shows the
full Screens context and approved Story palette.

From `app/`:

```sh
npm run design:typecheck
npm run design:check -- screens-arithmetic equation-v2 --interaction ./screens/screens-arithmetic/refined-check.mjs --capture
node design-lab/screens/screens-arithmetic/export.mjs
```

The runnable source identity will be recorded after the local candidate commit.
Kris must explicitly approve this revision before promotion under INTEGRATION.md.
