# Shared looks, ticket #43

Kris selected implementing [L07 #43](https://github.com/Caldwell-41/Renpy-editor/issues/43)
on a new branch on 2026-10-30. Branch `codex/l07-shared-looks` starts at
`e9e8661`, the current Screens base including #71's text-draft ownership fix.
The repository's design-before-production rule applies. Refined A2 and the three
original designs remain drafts. No option has approval and production code has
not changed.

The question is where shared appearance editing and affected-use review belong
within the existing Screens workspace. All options retain the canvas, element
selection, inspector sections, Source access and shared-history controls.

| Option | Editing and review |
| --- | --- |
| A2, refined inspector | Help and About previews show draft changes together. Plain scope choices distinguish shared updates from a copy for only one element. |
| A, inspector | Appearance stays in the inspector. A dialog lists all screens before Apply or independent copy. |
| B, library | A style list sits beside Help and About previews. The inspector edits the selected style; a dialog reviews affected screens. |
| C, inline | Appearance fields form a worksheet below the canvas. Affected screens and confirmation expand beneath the fields. |

A2 is the current proposal. Kris found the original A difficult to understand and
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

The current route is `/preview.html?screen=shared-look&variant=refined&state=shared&theme=dark&viewport=wide`.
The original variant values are `inspector`, `library` and `inline`. The existing
lab command remains `npm run design:dev` from `app/`.

For an offline comparison, from `app/` run:

```sh
node design-lab/screens/shared-look/export.mjs
```

Open `.toolchains/l07-shared-look/shared-look.html` in the repository root. This
bundles the same renderers and imported production styles into one file. Its
comparison controls reset to a fresh sample on every variant or scenario change.
The offline wrapper omits project navigation and fixes the sample height for
embedding; the registered lab uses the normal shell and viewport controls.

Try text color, frame background/border and the button appearance samples. Review
lists Help and About and states which changes. Back to editing retains the draft;
Cancel draft restores accepted values. Independent copy accepts the draft with a
new style reference only for the selected use. The local-use scenario offers
Share with About. Source displays accepted sample definitions and references.
Undo/Redo restores definitions and references together; simulated reopen clears
history while retaining accepted data. Missing/changed-use scenarios refuse Apply.
Dynamic style expressions keep appearance controls read-only.

All document data, Source serialization, revision checks, history and reopen are
fictional browser memory. The canvas uses schematic CSS. This does not qualify
Ren'Py mappings, actual project transactions, source preservation, real conflict
handling or SDK/helper/native behavior. Ordinary layout controls are represented by
an explanatory collapsed section; new layout editing is outside this study.

The mock adds no game execution, external requests, project file access or new
production capability. Existing project fonts, numeric layout and image workflows
keep their approved scope. Approval of one draft is required before production UI
implementation under AGENTS.md and ADR 0017.

Verification and remaining acceptance are recorded in
[the L07 evidence](../../tasks/evidence/shared-look.md).
