# A2 image editor refinement

Kris selected A as the direction and requested refinement with the Experience First
skill on 2026-10-29. This selects a design direction, not final approval. The exact
candidate is `ui-image` / `inspector-v2`, variant `refined`. Its approval remains null.

[Open A2](http://127.0.0.1:5176/preview.html?screen=ui-image&variant=refined&state=placed&theme=dark&viewport=wide).
The original A, B and C remain available through the lab and comparison arrows.

## Choose, size, apply

The selected asset is one clickable row with its thumbnail, name and short project
path. It replaces the repeated Image heading and separate Change button. Picking
an image returns focus to Width. Search, empty results, import staging and import
cancellation stay in one dialog. The typed UI image role is stated as a fact rather
than presented as a dropdown with one option.

Displayed size, aspect preservation and the original dimensions stay together.
The paired fields retain the accepted 32-pixel numeric convention. Enter applies;
Escape cancels; both preserve numeric focus. Apply and Cancel are disabled when
nothing changed. Invalid input remains visible, focuses the relevant field and
explains the problem beside it. Source conflicts offer Inspect Source beside the
error. Missing, changed and unreadable image references explain the next action
beside the selected asset. Drafts remain available through selection and Source.

The Layout disclosure keeps position/anchor units, alignment shortcuts, size limits,
parent constraints, image order and removal available without filling the main
image workflow. It reuses the accepted nested-layout numeric validation in the lab.
Existing wider composition/nested controls retain their accepted scope. This does
not authorize replacing them with this narrower image comparison. Source stays in
the top toolbar. Deliberate Test in Ren'Py stays beside the preview, separate from
Apply. Prototype tools are labelled as lab controls.

Adding an image stays in the current screen and creates another ordinary sample
node. Cancel returns to the previous selection. Each image keeps its own draft;
accepted additions support Source, Undo and Redo. Removing the node preserves the
sample asset. The shared asset catalog/import is separate from screen history,
so cancelling a screen draft does not undo a completed sample import.

Changing an image, including an explicitly reviewed replacement, respects the
current aspect setting. With preservation on, width stays and height follows the
new original ratio, rounded to a whole pixel. Replacement review shows that result
before confirmation. With preservation off, both displayed dimensions stay.

Compact windows put image editing first. Show preview and Edit image move between
the inspector and canvas. The initial asset, size, aspect and Apply controls are
visible without scrolling at 560 × 640. Advanced controls remain under Layout.
No continuously repainting animation was added.

## Verification and limits

A2 rendered in all 24 combinations of six registered states, both lab themes and
both lab sizes. The final focused interactions pass, including disabled no-op
controls, numeric focus, validation retention, aspect linking, Source/selection
retention, search and empty results, file-picker and staged-import cancellation,
simulated import, in-place second-node addition, addition cancellation, history,
per-image drafts, missing/replaced/invalid references, conflict, replacement review,
simulated reopen, compact Apply visibility and A/A2 comparison navigation.

TypeScript and approval-record checks pass. The production Vite build checked in
memory excludes Design Lab modules and writes no app build output. No product,
SDK or native check was selected. No project file, OS picker, real image decoder,
Ren'Py process or game action is used by this mock. Generated Source and memory
history do not establish lossless transactions, persistence or actual Ren'Py size.
The canvas remains schematic, including parent sizing and inherited styles.

The retained full-lab run still has no pass: `combined-01.log` times out during
initial navigation after eight seconds. No shared runner or threshold was changed.
The screen-local review uses the previously documented 45-second navigation timeout.
It does not replace the combined gate. The full-lab run was not repeated solely to
reproduce that known startup failure during this refinement.

Local evidence remains under `.toolchains/design-lab/l06/`. A2's first scoped run
passes all 24 cases and interactions. The second run catches compact Apply outside
the viewport. The third and fourth pass after layout/spacing corrections. The fifth
renders all 24 cases and passes editing/replacement flows, then fails because the
comparison-arrow test omitted the accessible arrow glyph. Explicit accessible
labels fix that ambiguity; `refined-interactions-06.log` and
`refined/interaction-report.json` pass every focused interaction, including the
A/A2 switch. The 24-case render matrix is retained in `refined/report.json`; its final
error records that earlier switcher locator failure. The matrix captures precede
only the final accessible-label change, which does not alter layout. The initial
nullable-error type failure and all failed runs remain recorded, not converted to
passes. The original A/B/C checks retain their earlier results; only their comparison
arrows gained the A2 destination and explicit accessible labels.

`captures/a2-draft-v1-*` retains the dark/light wide/compact overviews and important
interactive states. These are draft review aids. Approval/source fingerprint and
the implementation handoff remain pending explicit approval of A2. Production files
and the original chat's implementation branch remain outside this assignment.
