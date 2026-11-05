# Bars and image buttons

Draft design comparison for [#51](https://github.com/Caldwell-41/Renpy-editor/issues/51)
and [#52](https://github.com/Caldwell-41/Renpy-editor/issues/52). Kris approved refined A2,
`inspector-v2`, at source `37d29ca1` on 2026-11-06. The original three variants remain drafts.
The comparison extends the production `ScreensWorkspace`, current styles/icons,
flow-v1, paired numeric layout, A2 UI images and the approved expandable action rows.
Existing approved prototype files remain unchanged.

The latest candidate is refined A2, `inspector-v2`, source `37d29ca1`.
See [the final refinement record](FINAL-REFINEMENT.md),
[its source receipt](a2-final-source-receipt.json), and
[the annotated PNG](annotated-a2-final.png). Earlier receipts and captures remain
historical evidence. [The approved handoff](APPROVED-HANDOFF.md) and
[approval receipt](approval-receipt.json) retain the exact decision and pending
global verification boundary. Full promotion verification is not claimed complete.

Experience First sets the design target. Select a control, edit its properties,
inspect the draft, then Apply once. Compare three ways to arrange that work:

- A, `inspector-v1`, keeps the properties in one scrolling inspector.
- B, `focus-v1`, shows Appearance, Layout or Actions in the inspector. Bars also have Binding.
- C, `table-v1`, places a wider property desk below the canvas.

All use the existing Choose / Design / Use in Story flow. The bottom comparison
bar belongs to the prototype. It switches layout and selects the fictional bar or
image button. Alt + Left/Right switches layouts outside editable fields.

## Run

From `app`, with the repository's pinned toolchain loaded:

```sh
node design-lab/screens/bars-imagebuttons/export.mjs
```

Open `.toolchains/bars-imagebuttons/comparison.html`. It is self-contained and
requires no server. The registered lab routes are also available through the normal
Design Lab command, for example
`preview.html?screen=bars-imagebuttons&variant=inspector-v1&state=button&theme=dark&viewport=wide`.
The first review is rendered inline in the design chat through `html_preview`
and `html_render`, with a selectable content viewport.

## Behavior and real-operation map

| Visible control | Prototype behavior | Production owner and expected operation |
| --- | --- | --- |
| Choose / Design / Use in Story, element list, canvas selection | Production workspace with fictional services; new control fields replace the selected inspector | `ScreensWorkspace` and existing composer/navigation |
| Add control | Pending fictional control using the selected qualified parent; editing has no parent field | `screens.compose` `addBar` / `addImageButton`, captured `parentId`; edits capture `nodeId` and keep parent |
| Integer variable picker | Existing int choices only, modal search, Escape/Cancel return focus | Existing authoring variable catalog, stable variable ID and captured authoring revision |
| Minimum / Maximum | Raw decimal text retained; whole-number and positive-span validation | `IntegerBarBinding` canonical decimal strings; core enforces exact engine endpoints and span |
| Filled / Empty / Thumb | Literal color or blank, Default clears to null | `BarAppearance.leftBar/rightBar/thumb`; null restores the default |
| Six appearance pickers | Fictional actual image references with ID/hash, thumbnail and role-filtered catalog | `ImageButtonAppearances`, existing UI-image catalog/import/reference validation |
| Empty optional appearance | Each row names its native fallback chain; the sample resolves the same chain | Normal required; Hover/Disabled/Selected use Normal; Selected + hover uses Hover then Normal; Selected + disabled uses Disabled then Normal. Selected + hover never uses Selected |
| Width / Height / Preserve aspect ratio | One pair of displayed-size fields scales every image state; normal-image ratio links dimensions | Combined imageButton command applies bounded native `Transform(path, xysize=(width,height))` to every explicit state. Generic root bounds alone do not scale the image. No duplicate xsize/ysize fields |
| Position & size | Pixel inputs for comparison | Existing numeric layout, units/anchors/limits/order; retain previously approved controls |
| Ordered actions | Existing `renderActions`, `actionDraft` and `prepareInteraction`; Set, qualified Show/Hide, Finish last, eight-action maximum | Existing `InteractionEdit` and context/revision validation; custom expressions remain Source-only |
| Apply | One in-memory accepted control record and history entry; unchanged drafts add none | One combined `screens.compose` bar/imageButton transaction for appearance, binding/actions, dimensions and layout |
| Cancel | Discard this control's pending changes | Existing draft owner; no write |
| Source | Dialog with accepted fictional configuration; pending edits remain | Existing Source editor and minimal source patch/reconciliation, opaque neighbors preserved |
| Undo / Redo / Reopen | In-memory accepted snapshots; pending edits block history/reopen | Existing transactional history and inspection/reopen, one entry for a changed Apply |
| Editor samples | Coins text and all six button states affect only the schematic canvas | Existing revision-bound variable/control samples; never execute project code/actions or persist runtime defaults |
| Missing/type-changed variable, missing image, stale source | Refuse Apply, retain raw input and captured revisions, focus relevant control | Core revalidation and existing draft owner; no silent refresh/rebind |
| Navigation / remount | Retain session drafts and captured revisions | Existing session draft ownership outside transient DOM |

## Simulation boundary and coverage limits

The sample is fictional. Source, transactions, history, catalog changes, missing
references and reopening stay in browser memory. The PNG UI art is drawn by code
for the sample; its UUID/hash references model owned UI assets. It does not decode
real project images or import files. Source review shows accepted configuration,
not a lossless Ren'Py source patch. Canvas output is schematic and cannot establish
engine dimensions, state fallback or runtime binding/action behavior.

The unchanged production frame still owns broader composition, nested editing,
numeric units/anchors/limits, order, shared looks, Source, Story and deliberate Test.
Those capabilities keep their existing product scope. This prototype does not
reimplement them or qualify them. Preserve them when integrating the approved design.
No parent selector/reparent operation is proposed. Unsupported expressions stay in
Source. Numeric bounds require the actual core's exact endpoint/span checks.

No SDK, rendering helper, package or native app is started. Every game control is
inert. Browser similarity and design approval waive no leaf acceptance criterion.
The implementation agent owns actual UI/core, source/history/reopen and both-target
deliberate Ren'Py qualification.

## Review state

The local TypeScript check and in-memory standalone Vite compilation pass.
The first inline desktop render reports no console messages. Attempt 1 was blocked
before opening the page: T3 rejected `file:` as unsupported, the CUA in-app browser
was unavailable, and Firefox approval timed out. Attempt 2 rendered a temporary
synthetic test copy at 1280 and 560px, but returned no completion receipt. Its
interaction results remain inconclusive. A later coordinator-operated temporary
copy completed all nine original synthetic DOM groups at both dark widths,
560 and 1280px. [Review evidence](REVIEW.md) preserves the separate attempts,
completed receipts, corrected payload hashes and limits. Trusted/native input,
real core/runtime and the full lab gate remain unproved.
The draft source/fingerprint is pinned in [the source receipt](source-receipt.json).
Approval, approved captures and the required full lab check remain pending. No
push, PR or merge is selected.
