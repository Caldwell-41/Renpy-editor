# Project font proposals

Three design-only proposals for [L05 #39](https://github.com/Caldwell-41/Renpy-editor/issues/39) explore font choice and text formatting inside Screens. The implementation chat retains ticket ownership. None is approved.

- A keeps a compact text inspector beside the canvas. A selected-font row opens a searchable project font chooser with import.
- B puts the searchable font browser directly inside the inspector. It trades vertical space for fewer picker openings.
- C puts content beside a smaller canvas and typography in a full-width strip below them. Layout expands below the strip.

Start from `app/` with `npm run design:dev -- --port 5177`. Open `/preview.html?screen=project-font&variant=inspector&state=text&theme=dark&viewport=wide`. The bottom arrows compare `inspector`, `library` and `strip`. The lab also supplies missing, invalid, expression, conflict and long samples. Compact windows put editing before the preview.

## Existing capabilities and proposed controls

Keep flow-v1 Choose/Design/Connect, canvas selection, source access, deliberate Test, shared history and the accepted numeric/nested/image workflows. This comparison adds content, project font, size, color, text alignment and explicit inherited/on/off bold and italic. Empty size/color, Default font and Default alignment inherit. Apply accepts one text change; Cancel restores accepted values. No-op Apply adds no history. Drafts survive selection and Source navigation. History/reopen require pending drafts to be resolved. Invalid/missing fonts and source conflict retain input.

Layout remains separate from text alignment. The visible layout disclosure uses the existing paired numeric fields, unit controls, parent constraints and size validation. Existing parent editing, all nine placement presets, ordering, confirmed removal and other element types retain their earlier approvals; this mock does not reimplement their workflows. Production integration must preserve them.

Expression samples show content, font and size as read-only expressions. Supported sibling fields remain editable, and Source retains the expression strings. No expression evaluation or conversion is offered.

The font chooser accepts only fixture IDs. Import offers fictional TTF/OTF files, cancellation and a damaged-font refusal. A successful import adds a sample asset and selects it in the text draft. Cancelling the text edit leaves that imported asset in the catalog. Closing the chooser returns focus to its trigger. No arbitrary path or CSS URL entry exists.

## Simulation and proposed bounds

Every action uses fresh fictional browser-memory data. Font specimens use system sans-serif/serif/monospace stand-ins. No font file, OS picker, core transaction, project source, SDK or game action runs. Source is generated sample text, not a source patch. Layout and wrapping are schematic; actual fonts and Ren'Py geometry need #39 qualification.

The mock proposes whole-pixel text sizes 1 through 512 and #RGB/#RGBA/#RRGGBB/#RRGGBBAA color input, with empty values inherited. These are review bounds, not established product or engine limits. The implementation owner must qualify and document supported formats and bounds.

The design worktree is based on `8f0d208`, on local branch `codex/l05-font-prototype`. Owned files are this screen directory, this design record/capture directory and its registry entry. No production files or shared status are owned here. Approval and a handoff to the implementation chat follow only after Kris selects a revision.

## Draft verification, 2026-10-29

Pinned Node 24.19.0/npm 11.9.0 and the existing locked dependencies were reused. TypeScript and approval-record validation pass. The final screen-local review passes 72 combinations across three variants, six states, both lab themes and both registered sizes. Its interaction check passes text and typography edits, selection/Source draft retention, no-op state, Apply/Cancel, Undo/Redo, invalid values, missing/invalid fonts, source conflict, unsupported expressions, search, picker focus return, import cancellation/refusal/OTF selection and simulated reopen. The final report and logs remain in ignored `.toolchains/design-lab/l05/`, including `l05-review-09.log` and `report.json`.

The production Vite build was inspected in memory and excludes all Design Lab modules. It wrote no production output. The required combined `npm run design:check` failed at its initial eight-second navigation. `l05-combined-01.log` retains the failure. The focused runner uses a 45-second navigation limit for the known approval-loading delay; no shared runner or threshold changed. This is no combined-gate pass.

Earlier focused attempts retain a closed-details text read, ambiguous Source locator, CSS separator in accessible path names, a search input queried as a textbox and an unopened Prototype tools disclosure. Those were check setup defects. Visual review found and corrected C's collapsed editor and compact spacing. The final matrix and interactions include those fixes. Browser samples prove no actual font decoding, source patch, persistence, physical input or Ren'Py output.

`captures/draft-v1/` retains dark wide/compact overviews for each option. All approvals remain null. Only this screen, its registry entry and this design directory are included in the local candidate commit. The local dependency symlink is not committed.
