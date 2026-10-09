# Manual reference library layout review

## Revised manual Save flow — 2026-10-09

**Revised layouts approved by the user. Implementation uses A, Browse and write.
The first layouts below were rejected.** The user
requested ordinary Save updates for home game authoring, clearer actions, less clutter,
better creation placement and removal of the unexplained Edit step. One explicitly
requested research subagent compared official app/help and UX sources; it wrote no
files and spawned no agents. The owner remains the only implementation writer.

| Option | Light | Dark | Layout |
| --- | --- | --- | --- |
| A: Browse and write | [Light image](browse-and-write-light-v2.png) | [Dark image](browse-and-write-dark-v2.png) | Searchable list beside directly editable fields. |
| B: Focused writing | [Light image](focused-writing-light-v2.png) | [Dark image](focused-writing-dark-v2.png) | List opens a wider writing form; All character cards returns to the list. |

[Lorebook in A](lore-browse-and-write-light-v2.png) uses the same Save/Discard controls,
with title/category/tags/text and optional story/source notes.

Both put New character card / New lore entry at the top of the workspace. Select an
entry and type immediately. Save changes writes the current authored revision in one
undoable operation; Discard changes returns to saved text. New forms use Create card /
Create lore entry and Cancel. No Edit unlock or manual approval/status toolbar. Optional
appearance/background, voice/relationships and story links expand on demand. No-change
Save is disabled. Compact layouts use an explicit return to the list.

Both layouts rendered in light/dark and at 390 px without horizontal overflow or
script errors. Preview interactions checked direct editing, Save/Discard, navigation
and compact list-to-form return. These remain mockups; no production/native evidence
is claimed. No app package or launch allowance consumed. The isolated browser closed.

### Research informing the revision

- [Obsidian File explorer](https://obsidian.md/help/plugins/file-explorer) locates
  creation alongside the note inventory; [Properties](https://obsidian.md/help/properties)
  supports direct field editing. Placement of Loomlight's creation command above the
  workspace and omission of Edit unlocking are design recommendations, not copied UI.
- [Scrivener Inspector](https://www.literatureandlatte.com/blog/get-to-know-the-scrivener-inspector)
  and [window organization](https://www.literatureandlatte.com/blog/tame-the-scrivener-window)
  support keeping writing central and secondary information optional.
- [Apple Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
  recommends clear action labels. Save changes / Discard changes describe effects;
  Create card / Create lore entry describe creation without implying source changes.

The recommendation is A for movement among entries, with B for a quieter writing view.
Design approval covers the revised layouts. Shared existing app tokens/controls, native focus,
keyboard, draft guards, history, persistence and distribution privacy remain required.

## Rejected first layouts (historical preparation)

**2026-10-09: rejected and superseded by the revision above.** Public synthetic The Last Tram content.
Rendered from an interactive HTML design preview; these are mockups, not screenshots
of implemented Loomlight behavior or native acceptance evidence. No image-generation
service, provider request, app build or app launch was used.

The user explicitly requested A/B UI approval before editor implementation, then
requested image delivery because the inline preview was not visible.

| Option | Light | Dark | Layout |
| --- | --- | --- | --- |
| A: List beside editor | [Light image](list-beside-editor-light.png) | [Dark image](list-beside-editor-dark.png) | Persistent searchable list beside the selected reference. |
| B: Full-width editor | [Light image](full-width-editor-light.png) | [Dark image](full-width-editor-dark.png) | Searchable list opens a wider editor; return through All Character cards / All lore entries. |

Both preserve Characters' Game character tab, add Character cards, and use Lorebook
as a distinct destination. Approved r1 stays visible while proposed r2 is reviewed.
Profile, voice/relationships and scope/sources are grouped; Edit enables manual input,
with distinct Save as proposed / Save and approve actions. Reuse the app's shared
tokens, controls, draft guard, global persistence status and transactional history.

Light images use existing paper/teal values; dark images use charcoal/copper. The
preview also rendered at 390 px without horizontal overflow or JavaScript errors.
This does not prove production/native layout, keyboard, focus or dispatch behavior.
Browser rendering initially failed under the filesystem/process sandbox (Chrome
SIGABRT); rerunning the isolated headless renderer with approved sandbox escalation
passed and closed its browser. This is an environment/tool failure, with zero
Loomlight package/native attempts consumed.

Images omit icons because the standalone preview has no host-provided Lucide runtime.
Production must reuse the existing app icon system. Some secondary fields are abbreviated
in the previews; all fields in [the schema contract](../../REFERENCE_LIBRARY.md) remain
required. Search/filter/review controls are illustrative local interactions only.
Supersede needs an explicit revision/replacement review, not a destructive delete.

Recommendation: A for frequent movement among related records; collapse its secondary
list to a deliberate browse view at compact widths. B gives long prose more width.
Neither option is approved by this record.
