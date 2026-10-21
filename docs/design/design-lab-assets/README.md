# Assets layout comparison

Two browser drafts, 2026-10-20. Neither layout is approved. Both use the same
fictional assets, import samples and actions. They import the app's styles and
icons through Design Lab and the shared sample frame.

- [Library shelves](http://127.0.0.1:5174/?screen=assets&variant=shelves&state=populated&theme=light&viewport=wide)
  gives the library most of the width, with a smaller inspector at right. It suits
  scanning thumbnails. On compact screens, opening an asset replaces the library
  with its details; Back to library restores the selected card and focus.
- [Preview desk](http://127.0.0.1:5174/?screen=assets&variant=desk&state=populated&theme=light&viewport=wide)
  gives the selected preview the left half and places a compact library at right.
  It suits inspecting individual images. Compact screens put image and metadata
  together above the scrollable library. Closing the preview gives the library
  the full available width.

Both support light/dark themes, populated/empty/large/unavailable-preview states
and the shared project navigation. The grid/list switch remains available in each
layout. Their initial views differ to make each layout useful without setup.

## Capabilities and controls

| Control | Purpose and retained behaviour |
| --- | --- |
| Search and asset types | Find backgrounds, character images, music and sound effects. Counts, unmatched searches and a clear action explain the result. |
| Grid/list switch | Choose image comparison or compact name scanning without changing the search or selection. |
| Asset selection and preview | Inspect the name, format/dimensions, file size, Ren'Py name and character/expression when relevant. Close/reopen retains the selection. |
| File & compatibility details | Reveal project paths and asset status without placing technical metadata ahead of the preview. |
| Retry preview | Recover a deliberately unavailable sample preview. The library entry survives the failure. |
| Asset maintenance | Review the compatibility problem and simulate Ren'Py declaration repair. This secondary action preserves the existing repair capability. |
| Import assets | Choose fictional samples, then review and edit their display name, Ren'Py name and use. Character images also expose character/expression. |
| Review batch | Retain edits when the dialog closes, when navigation collapses or when a user cancels page navigation. Escape keeps the batch. |
| Add/remove/cancel/discard | Adjust the staged batch, cancel a chooser or explicitly discard the batch. Successful library entries stay intact. |
| Import/retry | Validate the entire staged batch before import. An interrupted import keeps successful rows and retains the remaining row's edits for retry. |
| Secondary problem examples | Try an unsupported sample selection or one interrupted import without cluttering ordinary import review. |

The core loop is find, inspect, import and return to the library. Import review keeps
its heading and actions visible while the staged rows scroll. Correcting a field
clears its old row feedback. Name validation rejects empty display names, invalid or
duplicate Ren'Py names, missing characters and invalid expression tokens.

The existing app currently defers audio playback. These drafts preserve that boundary
with an explanation and a fictional waveform instead of a nonfunctional play button.
They add no destructive asset management or source editing.

## Simulations and boundaries

All content starts fresh on mount and stays in browser memory. The SVG thumbnails are
generated from fixture code. The chooser never opens a native picker; it has no file
input. Actual drops are refused without inspecting their files. Import, compatibility
repair and preview retry operate on fictional records. No project file, private media,
provider, SDK, native app or model operation runs. Cross-page navigation resets the
sample after a dirty-batch guard. Source edits, file replacement and durable saves
remain product implementation work.

## Verification

Chosen host: this local Mac, using the pinned repository toolchain from `app/`.
Allowance used: one initial cycle and two focused repair cycles. No CI or package
build ran. The root agent owns combined lab and typing checks.

1. The first launch hit the macOS Chromium Mach-port sandbox refusal before any
   browser case. `report-launch-blocked.json` retains that environment failure.
   An authorized elevated rerun passed all 32 cases and both layout journeys.
   `report-initial-pass.json` retains the initial result.
2. Visual inspection found that the desk image pushed its title below the wide
   viewport, and long imports needed persistent review actions. Focused repair 1
   reduced the wide image, arranged compact details beside it, fixed the dialog's
   scroll regions and cleared corrected field feedback. All 32 cases passed, but
   the interaction check expected the old Retry label after corrections had cleared
   all errors. `report-repair-1-failed.json` retains that check mismatch.
3. Focused repair 2 corrected the check's expected Import label. The final run passed
   32 cases and both complete journeys with Chromium 155.0.8059.85 and no browser
   errors. `report.json` and captures are under ignored
   `.toolchains/design-lab/pages/assets/`.

The journeys cover type/search/view selection, unavailable-preview retry, deferred
audio playback, compatibility repair, refused selection, validation, retained drafts,
dirty navigation cancellation, partial success/retry, cancellation/discard, empty and
error states, compact batch scrolling and focus return. The matrix covers both
layouts, four sample states, both themes and 1100×720 / 560×640 viewports. The eight
populated captures and the wide/compact import captures were visually inspected;
the revised desk and fixed import controls were inspected again after repair.

This establishes browser sample behaviour. It does not establish native imports,
media decoding, source changes or durable project persistence. Approval and app
implementation follow [the integration procedure](../../../app/design-lab/INTEGRATION.md).
