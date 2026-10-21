# Lorebook layout comparison

These are two unapproved browser drafts for the same project-wide world and tone
document. They preserve the agreed [Lorebook direction](../lorebook-workspace-2026-10-15/README.md)
and the existing production renderer's two-field boundary. Neither replaces the
earlier image or written decisions. Both use the production Paper/Teal and
Charcoal/Copper styles, system font and navigation icons.

- [Project manuscript](http://127.0.0.1:5174/?screen=lorebook&variant=manuscript&state=populated&theme=light&viewport=wide)
  puts world and tone in one continuous, bounded writing column. It gives long prose
  a comfortable line length and few boxes. Authors scroll to compare the two fields.
- [World & tone desk](http://127.0.0.1:5174/?screen=lorebook&variant=parallel&state=populated&theme=light&viewport=wide)
  puts the fields beside each other on a wide screen. It helps authors compare what
  is true with how it should be told. It trades prose width for simultaneous context,
  then stacks the fields on smaller screens.

Both contain the same fictional setting, saved versions, retained references and
actions. Neither adds a permanent entry list, category system or second sidebar.

## Controls and behaviour

The two writing areas are the core task. They grow with the text; only the page body
scrolls. Persistent help explains the starting-situation boundary and keeps overall
tone distinct from character voice. The note below the writing keeps world facts
separate from a character's starting knowledge. Quiet word counts help judge prose
length without a new mode or panel.

Save and Discard stay reachable below the scrolling body. Save shows progress and
creates a browser-memory version. Discard requires confirmation and returns both
fields to the last saved notes. A refusal keeps the draft and permits retry. Fields
retain the production 10,000 UTF-8 byte limit, with an inline error and focus on the
invalid field. Blank notes remain valid.

Version history is a quiet header action. It previews saved world and tone notes
without replacing a draft. History remains read-only, matching current Lorebook
behaviour. More contains Undo, Redo, Reload and the saved-reference review, so these
secondary tasks do not compete with writing. Undo/Redo act on saved changes and are
unavailable while a draft is dirty. Reload retains a dirty draft. Modal review and
navigation collapse retain text. Cross-page navigation warns before resetting a draft.

The saved-reference review preserves separate fictional entry IDs, revision context,
approved/proposed states and stale-source refusal. It explains approval safeguards
without offering a migration or changing an entry. Existing production approval and
rejection operations remain outside this read-only review simulation.

Preview request context shows the last saved notes, identifies unsaved drafts,
provides per-request omission and resets inclusion for a fresh preview. Its rough
token estimate explains that the complete budget belongs in the actual request.
It makes no model request and has no Send action. Saving notes sends nothing and
does not approve a separate reference entry. This preview illustrates the agreed
request boundary; it does not implement request assembly or model tokenisation.

## Scope and verification

All content is fictional and starts fresh on mount. Saves, versions and Undo/Redo
last only until the preview resets or reloads. There are no project operations,
files, source edits, provider calls, SDK execution or native app interactions.
Both revisions and `currentApproved` remain null in [approval.json](approval.json).

Selected verification host is the local Mac with the pinned repository toolchain.
Allowance is one initial page verification cycle and up to two focused repair cycles.
The focused check is `node design-lab/check-screen.mjs lorebook` from `app/`, after
`source ../.toolchains/enter-macos.sh`, using the existing server at port 5174.
The runner covers 32 rendering cases across two layouts, four states, two themes and
two viewport sizes. Its interaction check covers editing, retained drafts, collapse,
history, source safeguards, omission, reload, navigation cancellation, save, Undo/Redo,
confirmed discard, UTF-8 validation, refusal/retry, empty notes and long compact prose.
Raw reports and captures stay ignored under `.toolchains/design-lab/pages/lorebook/`.

The initial focused run passed all 32 rendering cases and the shared interaction
journey for both variants. Its sandbox-only invocation could not start Chromium's
Mac Mach-port server; the authorised local run outside that restriction passed.
Visual review covered both layouts in light and dark at 1100 × 720 and 560 × 640,
plus compact long writing, history return and a retained save refusal. A narrow
paint diagnostic confirmed the dark theme's computed tokens and fresh screenshots.
Review then disabled secondary actions during Save and clarified the disabled
primary action. Both focused repair runs passed the 32 rendering cases, then the new
focus-return assertion failed after saved-reference review. Waiting for the native
dialog's asynchronous close event did not correct it. Reassessment found the actual
cause: closing More moved focus to the body before the modal captured its invoker.
The review now focuses More's summary before opening the modal, so it can restore
that visible control. Both failure reports remain in the ignored output directory.
The page's initial cycle and two focused repair cycles are used. The failed focus
assertion stopped before the new busy-state assertions. Root's combined check on
2026-10-21 passes all 32 Lorebook cases and both complete journeys, including the
final focus fix, busy controls, retained save refusal and retry. Its full-app report
is `.toolchains/design-lab/report.json`; the owning task records a live-reload
interruption in the first integration run. No extra page-owned cycle was run.
Browser evidence establishes sample behaviour and layout. It cannot establish durable
persistence, real reference mutation or model assembly.
