# L02 simple Help layout evidence

[#37](https://github.com/Caldwell-41/Renpy-editor/issues/37) owns scope, execution
state and acceptance. This file retains its design and verification evidence.

## Design preparation, 2026-10-25

The user selected implementing #37 on a new branch through the implement skill.
The coordinating agent owns `codex/37-compose-help-layout`, based on fetched
Screens commit `8f7f9e7191f3b9c27343c7f4d4f5fdc65b2135f4`. Its intended integration
destination is `codex/phase3b-screen-designer`. Development is on Mac ARM64.
[#34](https://github.com/Caldwell-41/Renpy-editor/issues/34) is closed. The live
P3B, B02 and L02 requirements were read before preparing the drafts.

Root AGENTS.md requires several mocks and user approval before non-trivial
production UI changes. The existing flow-v1 Choose/Design/Connect workflow remains
the reference. These three drafts compare only composition controls within it.
They have their own `help-composition` lab entry and unapproved revision records.

| Draft | Add interaction | Tradeoff |
| --- | --- | --- |
| `inline-v1` | Opens a form below the hierarchy, with type, parent and text fields. | Keeps the tree visible; the form needs scrolling on smaller screens. |
| `context-v1` | Opens the form at the selected row and inserts a sibling after that row, or a child inside a selected group. | Makes insertion position visible; the form interrupts the tree. |
| `focused-v1` | Replaces the Choose list with a type chooser and the add form. Cancel returns to the list. | Keeps the form together; the hierarchy is hidden during addition. |

Start the lab with `npm run design:dev` in `app/`. Review
`/preview.html?screen=help-composition&variant=focused&state=adding&theme=dark&viewport=wide`,
substituting `inline` or `context` for the other variants. `nested` shows the
hierarchy; `conflict` shows retained input after a simulated Source conflict.
The recommendation is `focused-v1` because its add controls fit together beside
the canvas.

All data is fictional and memory-only. The drafts simulate add, text Apply/Cancel,
same-parent reorder, stable selection, history and refusal around protected source.
The sample-source view displays that memory state; it does not parse or patch a
project. HTML sample rendering establishes no Ren'Py fidelity. Existing button
actions appear unchanged; new sample buttons use `Null()`.

The drafts preserve the canvas, Choose/Design/Connect navigation, single-click
selection, Enter/double-click Design entry, Apply/Cancel, Source access and shared
Undo/Redo as reviewable sample interactions. They add the five L02 element types,
text edits, parent selection, ordering controls, drag/keyboard reorder and type/depth
help. Creation of a whole screen, resizing/movement and runtime preview remain
existing production capabilities outside this focused mock.

### Verification

- Production and lab TypeScript checks pass.
- The existing `check-screen.mjs help-composition` runner passes all 36 combinations
  of three drafts, three states, two sizes and two themes, with no page errors,
  horizontal document overflow or native-operation attempts. Its interaction-module
  flag is false because this draft adds no automated interaction module.
- In-app browser inspection exercised inline addition, earlier ordering, Enter to
  Design, text Apply and Undo/Redo. Contextual addition appeared immediately after
  its selected sibling in the sample hierarchy and sample source.
- Browser inspection also exercised occupied-frame refusal with the addition input
  retained, Cancel, protected-neighbor reorder refusal, canvas selection,
  double-click Design entry and conflict refusal with the exact text draft retained.
- The first full frontend run passed 230/231 tests. The remaining evidence test
  selected the shell's Python 3.9.6 and failed to import `tomllib`. This is an
  environment limitation against the documented Python 3.11+ prerequisite. Selecting
  the existing bundled Python 3.12.14 through `HARNESS_PYTHON` makes all eight tests
  in `windows-studio-probe.dom.test.js` pass. The full `npm run check` rerun with
  that supported interpreter passes typechecking and all 231 tests, with zero
  failures or skips.

The first sandboxed lab-server/browser attempts failed before startup. The normal
loopback server and installed Chrome work with the existing execution permissions.
The root-cause debugging skill guided the interpreter diagnosis; no product or
harness correction was needed. Temporary captures, the rendering report and the
full frontend-check log stay ignored under
`.toolchains/design-lab/pages/help-composition/`.

### Remaining implementation proof

Design selection is pending. Production add/text/reorder code, minimal source
transactions, persistent node identity and reopen proof remain unimplemented for
L02. No native package, app launch, SDK qualification or CI matrix has started for
this ticket. Set applicable costly-operation limits in #37 before those operations.

The user approved these TDD boundaries on 2026-10-26 when requesting the separate
prototyping chat. Test-boundary confirmation is complete; design selection remains
with the user in that chat.

- Public core dispatch and shared history with a disposable nested owned screen.
  Prove exact source edits, protected bytes, one history entry, no-ops, stale/conflict
  refusal, Undo/Redo and reopen. This does not prove UI input or rendering.
- The existing ScreensWorkspace DOM interface. Prove hierarchy/canvas selection,
  keyboard and pointer ordering, text/add drafts, Cancel and refusal retention.
  Stubbed requests do not prove durable source writes.
- The actual packaged UI-to-core route and deliberate pinned-SDK preview of the
  nested example. Prove real source/history/reopen and runtime display, with
  platform evidence selected from the changed behavior. Canvas fidelity remains
  the separate gate named by #37.

## Prototyping handoff, 2026-10-26

The user requested a new chat to display the existing drafts as they are, iterate
with them, and message the implementation chat when done. The draft candidate is
`2c4ff1d0d319c5482e919e96f9035f07b28852e4`; its fingerprint is
`74ee751a16bb56136b40d414b878e4288c329868df560f2c3d06c2ec34074163`.
The prototype chat takes sole writer ownership of this checkout on
`codex/37-compose-help-layout` until it returns the approved design. Its scope is
the `help-composition` lab files, their registry entry, design approval/captures and
the relevant evidence/status sections. The implementation chat waits during this
assignment. Production implementation follows the design return.

At handoff, the loopback Design Lab server is stopped. The receiving agent starts
it through the existing runbook and shows all three committed drafts before edits.
An unrelated untracked `docs/audits/2026-10-25-phase-1-codebase-design.md` is present;
preserve it. Prototype behavior, source/runtime acceptance and costly-operation
limits retain their existing boundaries. The user authorized the receiving chat
to report back to the implementation chat after prototyping is complete.
