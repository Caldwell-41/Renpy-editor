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
4. Check the browser version and the changed interaction. Run:

   ```sh
   npm run design:check
   ```

   The runner checks every registered layout/state at the registered sizes in both
   themes. It checks native-operation refusal, reset, invalid selections and production
   build exclusion. Register an optional `check.mjs` for screen-specific interactions;
   the example shows the interface. Keep automatic checks focused on user behaviour.
5. Present the working URLs, observed checks and known simulated parts. Follow
   INTEGRATION when the user approves a particular version. The screen is ready for
   review when it renders without browser errors
   and its stated interactions work at the selected sizes.

The layout picker labels Draft, Approved and Superseded versions. Approval history
shows the current record and replacement reasons. Promotion happens through an explicit
instruction to an agent. A changed approved source is flagged and its preview refuses
to pose as the recorded reference. Conditions outside retained comparison states are
labelled separately. These are design statuses; app progress remains in the owning task.

The check writes screenshots and a report to ignored `.toolchains/design-lab/`.
It inspects the production Vite build in memory, without replacing `app/dist`.
Prototype review uses local checks. Product integration uses the selected task's
gates under [TESTING](../../docs/TESTING.md); this lab does not replace them.

During parallel page work, run `node design-lab/check-screen.mjs <screen-id>` from
`app/` after registration, with the server on port 5174. It checks that page's matrix
and interaction module and writes isolated outputs under
`.toolchains/design-lab/pages/<screen-id>/`. It blocks only the disposable browser's
HMR WebSocket so other agents' edits do not reload its current sample. The combined
`design:check` remains the final check for registry, approval, HMR and build isolation.
