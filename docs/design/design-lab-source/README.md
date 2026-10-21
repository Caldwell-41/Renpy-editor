# Source layout comparison

Both versions are unapproved browser drafts. They use the same fictional files,
editor model and sample scenarios. Existing approved Source references remain valid.

- [Docked workbench](http://127.0.0.1:5174/?screen=source&variant=workbench&state=populated&theme=light&viewport=wide) keeps the searchable file list beside the editor. It suits frequent movement between files and makes retained drafts visible. On compact screens, the file list opens over the editor.
- [Focus editor](http://127.0.0.1:5174/?screen=source&variant=focus&state=populated&theme=light&viewport=wide) starts with a wider editor and a horizontal file strip. Files and mapped context open as drawers. This gives prose and custom source more space, with an extra action to browse other files.

Both keep Save, Undo, Redo and Discard beside the active file. Find/replace and Scene
context remain available above it. Copy, refresh and session draft recovery are
secondary because they interrupt the editing loop less often. Closing a file tab
retains its draft. File switches restore the selection and scroll position. Closing
a panel returns focus to its opening control. Navigation between app pages uses the
shared unsaved-sample guard.

The source editor is a real textarea with line numbers, keyboard Save/Find/Undo,
literal find/replace and indentation. It has no syntax colouring or parser. Mapped ranges select source; custom Python stays
Source-only. The context dialog represents the existing jump to a Story beat without
discarding this source sample. Read-only and unavailable files explain their state.
Conflict review retains both versions, previews a non-overlapping combination and
requires a choice. Applying both creates an unsaved draft for review before Save.
Discard and loading the external version require confirmation.

Every operation is in browser memory. Save waits briefly, reports acceptance, and
writes no project file. The error state refuses one Save and retains the draft for
retry. Session drafts do not survive a page reload, crash or restart. Sample scenario
controls under More exercise external changes, a failed Save and a syntax problem.
They are review aids, not proposed production controls. The syntax problem is a
fixed simulation, not a Ren'Py parser. No source executes and no clipboard, native
operation, model, project or SDK is accessed.

## Verification

Local macOS browser proof passes on Chromium 155.0.8059.85 with the repo's pinned
Node 24.19.0 toolchain. `node design-lab/check-screen.mjs source` passes all 40 cases
(two layouts, five states, two themes and two sizes) and the focused interactions for
both layouts. The journeys cover retained draft/selection/scroll, closing and reopening
tabs, undo/redo, save, discard cancellation/confirmation, find/replace, mapped/custom
source context, read-only/unavailable files, file filtering, error retry, conflict
combination/external reload, empty editing and keyboard Save. An extra 1440px check
covers context placement after hiding files. No native operation is requested.

All eight populated theme/size captures were visually inspected, plus compact conflict
review/file browsing and wide error/find states. Captures and the final zero-error
report are ignored under `.toolchains/design-lab/pages/source/`.

The initial verification cycle and two focused repair cycles used four full browser
runs. The first failed on undo because repeated identical input events created duplicate
history entries. Recording only changed text fixed that; the first repair passed.
Visual review then found the extra-wide context grid needed columns when Files was
hidden. The second repair fixed it and clarified disabled Save feedback. Its first
check used an exact-top assertion unsuitable for the intentionally inset Focus drawer;
the corrected assertion and final run pass. Initial sandbox browser launch failed
before rendering because Chromium could not register a Mach port; the authorized
local checks ran outside that restriction. Early Source typing errors were corrected.
Combined type/approval/build-isolation proof belongs to the parent task's integration
check. CI and native acceptance are outside this browser design step.
