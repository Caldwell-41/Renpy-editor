# Proposed Phase 3 Story design reference

Generated 2026-10-02 with the built-in image-generation tool from a saved screenshot
of the actual light-theme Story workspace using the synthetic The Last Tram fixture.
Live capture was unavailable because the host was locked; this is not a screenshot
of current uncommitted Phase 1 work. No private game content was used.

![Proposed nested Story Beats](nested-beats-light-v1.png)

The [Phase 3 UX specification](../../tasks/active/phase-3-initial-wysiwyg-release.md#story-interaction-design)
owns behavior and acceptance. This image is a reviewable proposal, not an accepted
design, implemented feature, or runtime test. It illustrates 3A, not the whole phase.
The [existing UI references](../ui-refresh/README.md) still own the accepted shell,
palette, accessibility and shared controls. Use current theme tokens in both themes;
generated gradients, typography, spacing and icon geometry are not specifications.

Visual inspection confirms the familiar shell, paper/teal colors, preview above Beats,
labelled branch bodies, explicit rejoin, subsequent Call and dialogue, and removal of
the obsolete preview-size slider. The reference includes the agreed chapter disclosure.
Two details are schematic: outline numbers are not execution order, and the generated
Call row's “Returns here” label must become the more precise “Returns to next Beat”
with a labelled continuation target in implementation. A continuation marker describes
fallthrough structure; it must not claim a terminal Jump/Return rejoins.

The selected If branch is an illustrative manual preview, not a condition result or
proof of a playable route. The Saved footer depicts an idle saved example only.
Editing, narrow layouts, deeper nesting and errors are specified in the plan, not
demonstrated by this single image.

The exact [generation prompt](prompt-v1.txt) and [provenance manifest](manifest.json)
are retained here. The source screenshot remains local ignored evidence; the generated
project asset is stored in this directory and has no external runtime dependency.
