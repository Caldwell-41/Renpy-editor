# Manual reference library layout review

**2026-10-09: awaiting user selection.** Public synthetic The Last Tram content.
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
