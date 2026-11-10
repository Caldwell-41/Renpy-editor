# A2 refinement

Kris selected A for refinement and asked to apply Experience First and bring it
closer to the approved Story mock. He then said "approved" after A2 was shown
inline and linked on the LAN.
The new variant/revision is `equation-v2`, labelled "A2 · Story equation refinement".
A2 is approved. The original A, B and C remain available as drafts.
[approval.json](approval.json) owns the approval decision and evidence.

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

[Retained captures](equation-v2-captures.json) preserve important states,
dimensions and hashes. The suggestion/menu captures are reached through the
recorded check's interactions. The chosen approval set is recorded in approval.json; menu, suggestion and
creation captures also retain supplementary interaction evidence. The inline export uses
host theme tokens and isolates the inspector at chat width; the LAN Lab shows the
full Screens context and approved Story palette.

From `app/`:

```sh
npm run design:typecheck
npm run design:check -- screens-arithmetic equation-v2 --interaction ./screens/screens-arithmetic/refined-check.mjs --capture
node design-lab/screens/screens-arithmetic/export.mjs
```

The runnable source is `ce6264279188fca4c81218a5cd93b50c393bf9a3`.
[The source record](equation-v2-source.json) contains its fingerprint.
The approval uses this unchanged source under INTEGRATION.md. Production
promotion is outside this design chat.


## Approval recorded, 2026-11-09

Kris's exact decision was "approved". It applies to A2 / `equation-v2` as
presented here, including Screens actions and the additional decimal controls.
The approved source remains `ce6264279188fca4c81218a5cd93b50c393bf9a3` with
fingerprint `e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b`.
Source verification confirmed the current frontend/Lab files still match it.

The INTEGRATION promotion check passes for `screens-arithmetic`: current pointer,
source identity, all chosen capture hashes, Approved label and selected rendering
agree (`sourceMatches: true`). Ten primary dark captures cover the textbutton,
imagebutton, compact view, decimal result, invalid formula, unknown value,
protected timing, variable defaults, numeric condition and text/sample inputs.
Supplementary menu/suggestion/creation captures remain available. The reviewed
source's prototype Draft headings remain unchanged; the approval record owns status.

The selected design and mounted fictional interactions are approved. Functional
correctness through real core services, source/history/reopen and Ren'Py runtime
remain #95/#97 work. No production implementation or SDK/native/CI proof is claimed.
The approval handoff goes to the coordinator; no push or PR is selected here.
