# Loomlight Design Lab

Use this workspace for Loomlight browser mockups and previews of individual UI
components. The lab reuses the app's Vite, TypeScript and Playwright dependencies.
It has a separate entry and is excluded from the production app's build graph.
The [scoped rules](AGENTS.md) govern changes here.
Before promoting a design or implementing it in the app, read
[INTEGRATION](INTEGRATION.md).

## Run and inspect

From `app/`, with the repo's pinned Node/npm tools and installed dependencies:

```sh
npm run design:dev
```

Open `http://127.0.0.1:5174/`. The controls select a screen, layout, sample state,
theme and viewport. Each selection has a URL that another agent can reopen.
Reset sample discards browser edits. The preview opens in a fresh iframe, so its
media queries use the selected dimensions and previous component state is cleared.
The direct preview link also supports manual window resizing.

The [page gallery](http://127.0.0.1:5174/catalog.html) lists the app comparisons with
links to every registered layout. Its theme and size selectors set the conditions
for the previews you open. [Full-app notes](../../docs/design/design-lab-app/README.md)
record the user's experience principles and simulation boundary.

The Character notes starter demonstrates editing, character switching, retained
drafts, simulated Save/Discard, long/empty text and a simulated save failure.
The [Characters comparison](../../docs/design/design-lab-characters-writing/README.md)
adds two unapproved layouts with identical fictional cards and interactions. Choose
Continuous dossier or Writing board in the layout picker. Both include writing,
relationships, starting knowledge, history/restore and proposal review in memory.
Game setup includes linked dialogue/appearance drafts and planning create/link source
review. Those actions also stay in browser memory. The starter remains available.

## Add a screen

1. Read the selected task and that screen's existing design decisions. List the
   controls and behaviours the proposal must preserve. Complete this before choosing
   which interactions to simulate.
2. Copy the small `screens/character-notes/` example into a new screen directory, or
   export a `mount` function that calls an existing renderer with sample callbacks.
   Use the [mount contract](contracts.ts). Keep fixture creation inside the mount
   or return a fresh copy from a factory.
3. Add the screen to [the registry](registry.ts). Give it a unique ID, description,
   at least one layout and named sample states. Load each layout lazily. Experimental
   layouts can use disposable code; label production component previews separately.
   Copy the starter's [approval record](../../docs/design/design-lab-character-notes/approval.json)
   into the new screen's `docs/design/` directory. Set its screen/revision/variant IDs.
   Start with `currentApproved: null` and `approval: null` for each draft. The server
   discovers these records; each registered variant needs one revision entry.
4. Use [focused verification](#focused-verification) for the selected prototype and
   layout. Exercise the changed interaction before review.
5. Present the working prototype URLs, observed checks and known simulated parts.
   Obtain the user's approval before production implementation. Follow INTEGRATION
   when the user approves a particular version. The screen is ready for review when
   it renders without browser errors and its stated interactions work at the selected
   sizes.

The layout picker labels Draft, Approved and Superseded versions. Approval history
shows the current record and replacement reasons. Promotion happens through an explicit
instruction to an agent. A changed approved source is flagged and its preview refuses
to pose as the recorded reference. Conditions outside retained comparison states are
labelled separately. These are design statuses; app progress remains in the owning task.

## Focused verification

Before review, verify only the prototype and layout being reviewed. Choose states,
sizes and themes from the changed behavior. An isolated prototype edit requires no
checks of other gallery entries. The full-gallery matrix and historical simulated
Save/Undo/reopen suites are retired. Source versions and approved captures remain
available as design references.

From `app/`, run a selected sample with:

```sh
npm run design:check -- project-font refined --state text
npm run design:check -- project-font refined --state text --viewport compact --capture
```

The runner owns an ephemeral loopback server and browser. Each invocation renders
one sample, checks readiness, browser/assets, theme, overflow and native-operation
refusal, then prints its temporary report path. The defaults are the selected
layout's first sample state, dark theme and wide viewport. `--theme light` selects
light mode when relevant. No arguments prints help and exits unsuccessfully;
`--help` exits successfully. There is no gallery-wide mode.

Exercise the changed interaction manually in the lab, or add a small module inside
the selected screen directory when repeatable proof is useful:

```sh
npm run design:check -- project-font refined --interaction ./screens/project-font/review-check.mjs
```

The module exports `default async function ({ page, open, ready, capture })`.
`open({ state, viewport, theme })` stays on the selected screen/layout and checks
each requested sample. `capture("name")` writes only with `--capture`. Use that
helper for review images; the runner captures failures automatically. Keep each
module limited to the current design decision, and retire it when that review ends.
The example path above names a module the reviewing agent creates if needed.

Focused samples use private draft approval metadata and freeze browser HMR while
the check runs. They can exercise current source without presenting it as a pinned
approved reference. Repository approvals and the normal lab's refusal remain intact.

Select additional checks only for their owning change:

| Change | Check |
| --- | --- |
| Lab TypeScript or imports | `npm run design:typecheck` |
| Shared lab navigation, reset, selection, approval presentation, HMR or isolation | `npm run design:check -- --shared` uses representative fixtures |
| Approval parser, fingerprints or capture validation | `npm run design:approvals` |
| Promotion | `npm run design:check -- --approval <screen>` validates actual records/source/capture identity and checks the selected approved pointer's rendering or changed-source refusal; inspect the selected reference under INTEGRATION |
| Production build/import configuration | `npm run design:check -- --build` inspects build exclusion in memory without replacing `app/dist` |

Capture screenshots for requested review states, retained approval evidence and
failures. Preserve chosen approval captures under `docs/design/` before temporary
output is cleaned up. Current-source draft rendering does not establish historical
visual fidelity. Real saves, source preservation, history and reopen use the product
gates under [TESTING](../../docs/TESTING.md).
