# Shared looks, ticket #43

Kris selected implementing [L07 #43](https://github.com/Caldwell-41/Renpy-editor/issues/43)
on a new branch on 2026-10-30. Branch `codex/l07-shared-looks` starts at
`e9e8661`, the current Screens base including #71's text-draft ownership fix.
The repository's design-before-production rule applies. A4, A2 and the three
original designs remain drafts. No option has approval and production code has
not changed.

The question is where shared appearance editing and affected-use review belong
within the existing Screens workspace. All options retain the canvas, element
selection, inspector sections, Source access and shared-history controls.

| Option | Editing and review |
| --- | --- |
| A4, existing editor | Shared-style scope, use counts and a review listing all affected screens sit inside the existing screen editor. The sample has eight screens and fourteen uses. |
| A2, refined inspector | Help and About previews show draft changes together. Plain scope choices distinguish shared updates from a copy for only one element. |
| A, inspector | Appearance stays in the inspector. A dialog lists all screens before Apply or independent copy. |
| B, library | A style list sits beside Help and About previews. The inspector edits the selected style; a dialog reviews affected screens. |
| C, inline | Appearance fields form a worksheet below the canvas. Affected screens and confirmation expand beneath the fields. |

A4 is the current proposal. It extends the existing `editor.ts` and
`editor-sample.ts` owners and mounts the actual `ScreensWorkspace` renderer with
fictional memory-only services. Typography now says "Shared style: Body text",
"Used on 8 screens · 14 elements", "View uses" and "Edit only this element".
During editing, Apply and its status show the affected scope. The single canvas,
existing fields and Choose/Design/Connect remain in place.

The many-screen sample contains Help, About, Journal, Map, Inventory, Settings,
Credits and Pause. Six screens have two body-text uses each. View uses opens a
scrollable screen list with per-screen element counts and one saved preview at a
time. Apply uses the same dialog owner for affected screens and their proposed
appearance. Review derives its rows from actual sample references, with no fixed
screen-name list. A copy for the selected Help element leaves seven screens unchanged.

A4 replaces A3's active `editor` route and migrates its callers and checks. A3's
unapproved source remains recoverable at `9a2d218`; no parallel existing-editor
implementation remains. A2/A/B/C stay registered for their distinct comparison
layouts. None is an approved production design.

Start at Screens in the sidebar. Choose Help, double-click its body text under
Choose, and use Design as usual. Shared style identifies the appearance definition
and its use count. Change Color or Size and press Apply. Review lists every affected
screen before confirmation. Edit only this element marks a copy for this element;
Apply reviews that copy together with its pending appearance changes. Cancel
restores the previous values and reference intent. In the local-use sample, choose
About and use Change style to assign the existing Body text style.

A4 focuses on text and button-text appearance within the existing editor. Broader
frame decoration, image controls, font import, structural editing and SDK runtime
behavior are not newly implemented by this study. Existing controls are rendered
by their production owners; unsupported sample service operations refuse visibly.
The sample canvas uses browser drawing, and its Source is illustrative. This is
not real-core or actual-source qualification.

A2 is retained as an earlier proposal. Kris found the original A difficult to understand and
requested an experience-first refinement. A2 keeps editing in the inspector, names
the shared look in plain language, and makes both uses visible from the start.
Color presets make the first change easy to try. Choosing Help and About previews
the change on both screens; choosing Only Help previews an independent copy on that
one use. Review confirms the screens and exact changed values. Source identifiers
and diagnostics stay behind their explicit controls.

A2 replaces the separate independent-copy button and source-name field with the
plain scope choice. It removes the noninteractive layout placeholder and repeated
used-on rows. The affected screens remain visible in the previews, scope choice
and final review. These are changes to the mock only; existing production layout
and asset/font controls retain their earlier scope.

The original A, B and C remain available unchanged for comparison. B makes
cross-screen use easier to inspect but takes more space. C keeps review beside the
fields but lengthens the editing page.

## Review

The current route is `/preview.html?screen=shared-look&variant=shared-style&state=many&theme=dark&viewport=wide&entry=design`.
The optional `entry=design` opens the selected text in Design for review; without
it the existing Choose entry remains. The eight-screen scenario belongs to A4.
Earlier variant values are `refined`, `inspector`, `library` and `inline`. The existing
lab command remains `npm run design:dev` from `app/`.

For an offline comparison, from `app/` run:

```sh
node design-lab/screens/shared-look/export.mjs
```

Open `.toolchains/l07-shared-look/shared-look.html` in the repository root. This
bundles the same renderers and imported production styles into one file. Its
comparison controls reset to a fresh sample on every variant or scenario change.
The offline wrapper retains project navigation for A4 and fixes the sample height
for embedding; the registered lab uses the normal shell and viewport controls.

In A4, try View uses, change Size or Color, then Apply. Select any affected screen
in review to inspect its proposed appearance. Keep editing retains the draft.
Cancel restores accepted values and pending reference intent. Edit only this element
accepts a separate style for that selected use. Undo/Redo restores definitions and
references together. Earlier variants retain their separately described interactions.
Missing/changed-use scenarios refuse Apply; dynamic expressions remain read-only.

All document data, Source serialization, revision checks, history and reopen are
fictional browser memory. The canvas uses schematic CSS. This does not qualify
Ren'Py mappings, actual project transactions, source preservation, real conflict
handling or SDK/helper/native behavior. A4 mounts the existing layout controls;
earlier sketches use explanatory placeholders. New production layout editing is
outside this study.

The mock adds no game execution, external requests, project file access or new
production capability. Existing project fonts, numeric layout and image workflows
keep their approved scope. Approval of one draft is required before production UI
implementation under AGENTS.md and ADR 0017.

Verification and remaining acceptance are recorded in
[the L07 evidence](../../tasks/evidence/shared-look.md).
