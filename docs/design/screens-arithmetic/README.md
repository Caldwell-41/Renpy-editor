# Screens arithmetic and decimal controls

Which control arrangement fits an ordered Screens action list, and how should
Decimal values appear in the affected creation, default, condition and sample fields?

This experiment owns mockup [#91](https://github.com/Caldwell-41/Renpy-editor/issues/91)
and the additional decimal-control design decision required by
[#97](https://github.com/Caldwell-41/Renpy-editor/issues/97), under parent
[#87](https://github.com/Caldwell-41/Renpy-editor/issues/87).
It starts exactly at integration checkpoint `bb550929` on
`codex/spec-87-variable-mock`. All three variants are drafts. Kris has not approved
one. [approval.json](approval.json) is the approval owner and keeps
`currentApproved: null` until an explicit decision identifies a reproducible version.

## Compare

| Variant | Screens actions | Decimal fields |
| --- | --- | --- |
| `equation-v1` (A) | Open one action. Variable, operation symbol and formula share an equation row. | Definition list beside the typed default; direct numeric comparison fields. |
| `sequence-v1` (B) | Keep the compact sequence above a separate selected-action editor. | Narrow definition list, type heading and a separate default editor. |
| `expanded-v1` (C) | Keep every action's fields open, with vertically stacked inputs. | Definitions across the top, full-width default editor and illustrative declaration. |

The registered route is `/?screen=screens-arithmetic&variant=equation-v1&state=button&theme=dark&viewport=wide`.
Use `sequence-v1` or `expanded-v1` to compare. The Lab's state and size selectors
open fresh samples. The standalone comparison has arrow buttons and a state
selector. Left/Right switches variants outside editable fields. Switching variants
or scenarios starts fresh memory; switching buttons retains independent drafts.

From `app/`:

```sh
npm run design:dev
node design-lab/screens/screens-arithmetic/export.mjs
```

The export writes a self-contained `.toolchains/screens-arithmetic/review.html`.
Open the file directly. No review server is required. T3 inline delivery uses
`html_preview` then `html_render`. Its export maps colours to the host's required
theme tokens. At chat width it isolates the selected inspector so fields remain
readable. The registered Lab retains the actual Screens shell, canvas, task rail,
production colours, fonts and icons. Use the retained Lab captures for app-context
comparison. The export is generated from the same controls, not a second mock.

## Preserved references and scope

Screens `flow-v1` and action controls `inspector-v2` remain the existing approvals.
The arithmetic experiment extends their ordered inspector model and Apply/Cancel
workflow. The new alternatives are a comparison, not replacements for those
approvals. Both existing Variables layouts are unapproved; this experiment covers
only the additional decimal fields and does not select a Variables redesign.
Story Combined v1 / `combined-v1` and #88's equation row remain untouched.

The host mounts the actual `ScreensWorkspace` with explicit fictional callbacks.
The experimental inspector replaces its selected-property presentation, using the
same boundary as the existing bars/imagebuttons study. Hidden original controls
remain mounted for the host's asynchronous font refresh. They do not own arithmetic
edits. Appearance/layout editing and unrelated app navigation are outside this
comparison. Unsupported services fail visibly.

## Controls and contract expectations

- Textbutton and imagebutton samples use the same ordered action editor. The list
  offers Set to, Add, Subtract, Multiply, Divide, Floor divide and Remainder.
  It retains a maximum of eight actions, explicit Show/Hide target eligibility,
  blocking-dialog Finish eligibility and Finish-last ordering. Adding inserts
  before Finish. Reordering retains action identity, input and focus.
- Formula suggestions insert declared numeric names into the selection or replace
  a partial identifier. Group selection inserts parentheses and returns focus.
  Named examples cover grouping, precedence, decimal and whole-number results,
  negative floor/remainder inputs, missing variables, Boolean operands, syntax,
  zero divisors, unsupported functions/powers, range and non-finite errors.
- Result feedback distinguishes inferred result type and declared target type.
  Whole-number results can target Decimal. Ordinary division produces Decimal.
  No implicit rounding or declared-type conversion is proposed.
- A current value can remain unknown while the formula is authored. The mock
  computes no current/result values and does not infer them from defaults.
  The order explanation says each action reads values when it runs, including
  changes made by earlier actions. Apply and canvas selection run no actions.
- The protected state displays the differently timed
  `SetVariable("money", money - price)` form and explains why it stays in Source.
  Component-owned actions remain source-only. Unsupported formulas stay drafts.
  Actual recognition, capabilities, reasons and source preservation belong to core.
- Invalid Apply reveals and focuses the formula. Stale source/dependency refusal
  keeps the draft. Switching Continue/Reward retains independent drafts.
  Up/Down on action summaries selects adjacent actions. Escape asks before
  discarding; Keep editing and dialog Escape return focus without changing input.
  Ctrl/Cmd+Enter applies the selected draft. Cancel discards only that button.
- Variable creation offers Boolean, Whole number, Decimal and Text. Existing name
  and type stay fixed. Decimal defaults accept finite signed decimal text and
  whole-number input. Whole-number defaults retain exact signed 64-bit text.
  Invalid defaults and drafts survive definition selection. Bars remain whole-only.
- Numeric condition operands accept decimal thresholds for either numeric type;
  incomplete input stays a draft. This is an isolated affected-control sample,
  not a Story workspace redesign. It does not infer a branch from defaults.
- Screen text insertion uses `[money!q]`, preserves the selection and leaves the
  caret after the token. Editor samples display decimal overrides separately from
  declaration defaults. Reset restores the fictional sample. Canvas clicks select
  elements and never execute configured actions.

## Simulation boundary

All definitions, action drafts, Apply/Save results, refusals and imagebutton art
are fictional browser-memory state. The imagebutton shape is a browser drawing,
not asset-resolution or runtime evidence. Decimal text samples are illustrative
and do not establish engine float formatting.

`controls.ts` uses a small table of named response fixtures. It is not an arithmetic
parser, checker or evaluator. Unlisted formulas report that no response fixture is
available and retain the draft. Numeric default/sample checks demonstrate field
feedback only. Production must consume core-owned types, capabilities, diagnostics,
unknown reasons and revision-bound admission from #95. No IPC shape or runtime
helper is selected here. Backend contracts can require small fixture updates before
production integration; a material design change needs review.

Browser evidence establishes only this design's rendering and interactions. It
proves no source write, durable save, Undo/Redo, reopen, click-time behavior,
Ren'Py qualification or native behavior. #97 owns production wiring after approval
and backend qualification. No production files, Story prototypes, status records or
shared-arithmetic execution ledger were changed. No SDK, native package or CI run,
push or PR was selected.

## Verification and review state

The approved test boundary for this chat is the mounted mock's public controls.
The TDD cycles established retained invalid drafts, keyboard selection/cancel and
partial-name suggestion replacement. Each failed first for the missing behavior,
then passed after implementation. The broader coverage check verifies the remaining
changed interaction states. Both checks are selected through the existing runner:

```sh
npm run design:typecheck
npm run design:check -- screens-arithmetic equation-v1 --interaction ./screens/screens-arithmetic/review-check.mjs --capture
npm run design:check -- screens-arithmetic equation-v1 --interaction ./screens/screens-arithmetic/coverage-check.mjs --capture
npm run design:check -- screens-arithmetic sequence-v1 --interaction ./screens/screens-arithmetic/coverage-check.mjs --capture
npm run design:check -- screens-arithmetic expanded-v1 --interaction ./screens/screens-arithmetic/coverage-check.mjs --capture
```

Final focused coverage passes A with twelve selected samples, B with five and C
with five, all dark, at relevant wide/compact sizes. Readiness, overflow, assets,
native refusal and selected interactions pass. The TDD check passes three selected
samples. Local typechecking passes. This is one screen's changed behavior, not a
full-gallery matrix. The host-managed preview tool reported unavailable; scoped
headless browser checks ran outside the Mac sandbox and closed their own browsers
and temporary servers.

Preserved draft captures and hashes are in [draft-captures.json](draft-captures.json).
The action-wide captures include the grouping/reorder interaction; variable-wide
captures include creation of fictional `fare`. The check module reproduces these
states. No capture is approval evidence yet.

The export initially clipped its parent grid and then exposed an asynchronous
host refresh error after inspector replacement. The export grid now fits its
content; retaining the hidden original host controls fixes refresh without changing
production. Two coverage checks initially used the wrong UI state/locator for
canvas selection and a closed context disclosure. Corrected checks pass. These
were prototype/export or check defects, not backend failures.

On explicit approval, follow [INTEGRATION](../../../app/design-lab/INTEGRATION.md):
record the exact revision, decision, reproducible source and chosen captures; keep
prior records intact, validate promotion, and return the exact approval to the
coordinator. Until then, #91 and the #97 decimal-control decision remain pending.

The review source is `6b3aee30e78fa99d1b4e856c38169dbd6133523e`;
[the source record](draft-source.json) contains its fingerprint. This identifies
the candidate and does not grant approval.

## A2 refinement

Kris selected A for an Experience First refinement toward Story Combined v1.
`equation-v2` is the new review candidate. [The refinement record](REFINEMENT.md)
explains the changed controls, palette, checks and retained captures. This is a
selected direction; design approval remains pending. The original variants and
sources remain available.
