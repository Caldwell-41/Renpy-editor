# Shared looks, ticket #43

Kris selected implementing [L07 #43](https://github.com/Caldwell-41/Renpy-editor/issues/43)
on a new branch on 2026-10-30. Branch `codex/l07-shared-looks` starts at
`e9e8661`, the current Screens base including #71's text-draft ownership fix.
The repository's design-before-production rule applies. These three designs are
drafts; no option has approval and production code has not changed.

The question is where shared appearance editing and affected-use review belong
within the existing Screens workspace. All options retain the canvas, element
selection, inspector sections, Source access and shared-history controls.

| Option | Editing and review |
| --- | --- |
| A, inspector | Appearance stays in the inspector. A dialog lists all screens before Apply or independent copy. |
| B, library | A style list sits beside Help and About previews. The inspector edits the selected style; a dialog reviews affected screens. |
| C, inline | Appearance fields form a worksheet below the canvas. Affected screens and confirmation expand beneath the fields. |

A is the suggested starting point. It keeps existing inspector placement and adds
one review step for shared changes. B makes cross-screen use easier to inspect but
takes more space. C keeps review beside the fields but lengthens the editing page.

## Review

The registered Design Lab routes are `/preview.html?screen=shared-look&variant=inspector&state=shared&theme=dark&viewport=wide`,
with `library` or `inline` as the other variant values. The existing lab command
remains `npm run design:dev` from `app/`.

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
