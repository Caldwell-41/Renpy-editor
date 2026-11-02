# Components and Help panel

Draft alternatives for [#41, Reuse an owned component](https://github.com/Caldwell-41/Renpy-editor/issues/41)
and [#44, Create and show the Help panel](https://github.com/Caldwell-41/Renpy-editor/issues/44).
Kris has not approved a revision. `approval.json` keeps every candidate a draft.
This assignment changes no production files. [A2](REFINEMENT.md) applies Kris's
requested unslop and Experience First pass. It remains unapproved.

| Alternative | Component editing | Review |
| --- | --- | --- |
| A2, focused workflow | The inspector states which screens will change and offers a copy for the current screen. Valid pending edits follow only after the copy is verified. | Shared review compares changed fields; local edits use one Apply. |
| A, inspector | Scope and component actions sit above ordinary content fields beside the canvas. Compact view puts the editor first. | A dialog lists every affected screen. |
| B, library | A persistent component column adds discovery, use counts and insertion beside the same editor. | The same affected-screen dialog. |
| C, worksheet | The canvas and element tree sit above full-width editing fields. | Affected-screen review expands below the fields. |

All alternatives use one sample model and the same operations. Choose / Design /
Connect, screen selection, inert canvas selection, Source, Undo/Redo and the existing
editor routes remain. There are no component parameters, transclusion, imports,
Call/Finish controls, general action builder or 3D work.

The approved [Screens flow-v1](../design-lab-screens/approval.json),
[image A2](../design-lab-ui-image/approval.json) and
[Style A5](../design-lab-shared-look/approval.json) remain intact. These alternatives
study new ownership and panel controls. They do not replace the existing layout,
font, Style, image, add/remove, reordering or canvas implementations. The small
ordinary-node dialog exercises image sizing and title formatting in the sample;
the production editor retains the complete approved controls.

## Try the alternatives

From `app/`, using the existing pinned tools and dependencies:

```sh
node design-lab/screens/components-and-help-panel/export.mjs
node design-lab/screens/components-and-help-panel/review.mjs
```

Open `.toolchains/components-and-help-panel/comparison.html` at the repository root.
It is a self-contained export of the registered Design Lab mounts. It requires no
server. The comparison controls switch alternatives, fresh scenarios and themes.
`empty-images.html` in the same output directory opens the blocked starter directly.
The existing lab registry also exposes screen `components-and-help-panel`, variants
`refined`, `inspector`, `library` and `worksheet`, with the eight registered scenarios.

Start with **Start with a supported group**. Make component, name it, then use
**Use component** to insert it in About's panel frame. Change the title and review
shared Apply. Both screens appear in review. Switch to either screen and make an
independent copy with its own name, then edit that copy. Source shows the definition,
use and selected source line. The sample refuses name collisions.

New screen offers a name and **Help panel** or **Blank**. Both have explicit panel
kind. The Help starter uses defaults for title, explanation and 320 by 180 pixel
size. Its existing-project UI-image picker defaults to the first available typed
asset. Those become ordinary editable nodes. Close remains local to
the owning panel. Select Close in the tree or inert canvas to edit its label.

The **Help starter · no typed UI images** scenario keeps Help selected and disables
Create screen. It explains that an existing typed UI image is required and tells
the author to cancel, import an image in Assets with the UI image role, then reopen
New screen. This is an honest blocked starter; the mock performs no import. It
creates no asset or screen and preserves the entered name. Selecting Blank enables
creation only as an explicit separate choice. Switching back to Help restores the
block. The coordinator confirmed this necessary core constraint; no user design
approval is implied.

Connect opens the Story example. Add a Show or Hide Beat through the owned-panel
picker, then inspect that Beat's exact sample Source. Playback simulation shows the
panel while dialogue advances. Close, Hide and game Escape dismiss it; outside
click keeps it open. The native browser dialog gives the simulation bounded focus;
the mock moves focus to Close on Show and to dialogue controls after dismissal.
Editor Escape cancels the pending editor draft.

Lab controls simulate external edits, component/panel rename/deletion and unknown
child effects. Invalid and conflicting drafts remain editable. Matching the saved
content clears the draft. Reopen keeps accepted identities, history and retained
drafts in the same browser session. Reset and scenario changes start fresh data.

## Proposed implementation mapping

The coordinator owns final production mapping. The live issue contracts remain
authoritative. Request fields below record the coordinator's supplied contract;
their presence is not design approval.

| Control | Intended real operation and observable result |
| --- | --- |
| Make component | Extract a supported group into an explicitly owned parameterless definition. Require its source name. Replace only that group with a stable use. One transaction/history entry. |
| Use component | Pick an owned component and insertion parent. Insert a new use without replacing neighboring content. Normal screens/panels are ineligible in this picker. |
| View uses | Read current source-backed references, grouped by screen. |
| Shared Apply | Review the explicit affected-screen list, then accept the pending content through the shared transaction owner. |
| Make independent copy | Require a fresh component name. Copy only the selected use; retain every other reference. A2 carries valid pending edits only after a separate verified refresh of the new target. Original alternatives require applying or cancelling the draft first. |
| Source | Resolve the selected definition/use/Beat to its exact current source span. Missing or renamed targets refuse silent rebinding. |
| New screen | Create Blank or ordinary editable Help starter with explicit panel kind. Prefill title/explanation/size and select an existing typed UI image. With no eligible image, block Help creation without a silent Blank fallback or bundled asset. |
| Ordinary node editing | Existing qualified text, image, layout, Style, structure and Close operations remain with their current owners. |
| Add screen Beat | `ShowScreen` / `HideScreen` use target `{screenId, sourceName}`. Core captures transient source/sourceMap/inventory/effects revisions for admission. Persist target identity only; refresh revisions/effects when reading. No user-entered revision fields. |
| Cancel / editor Escape | Cancel the editor operation without a source write. Keep invalid/conflicting/stale drafts until explicit cancellation. |
| Undo / Redo / reopen | Existing source-backed shared history and reconciliation. The mock models these in memory only. |
| Close / Hide / game Escape | Runtime panel dismissal and focus restoration in actual Ren'Py. Outside click keeps it open; dialogue continues. |
| References and effects | Owned screen identity plus explicit component role. Include component/use, screen, action and binding revisions as relevant. Combine known child effects conservatively; custom/unsupported effects stay unknown. |

## Evidence and limits

Focused TypeScript checking uses the screen-local `tsconfig.json`. The offline runner
checks all four layouts, eight scenarios, both lab themes and both sizes, 1100 by 720
and 560 by 640. Its focused interaction check covers names/collisions, parent choice,
shared review, copying, exact sample Source, draft conflict/Escape, starter/image/Close
editing, Show/Hide, missing-target refusal and simulated playback focus/dismissal.
Detailed run results and any corrections are recorded in [review-notes.md](review-notes.md).

Everything that writes, plays, reconciles or reopens is a browser-memory simulation.
Generated Source illustrates accepted fictional data, not a parser, minimal-patch
engine or lossless transaction proof. Browser canvas geometry, SVG image decoding
and focus do not qualify Ren'Py output. Source snapshots do not establish durable
history/reopen, migration or recovery. Product acceptance needs the coordinator's
actual UI-to-core, source-backed and deliberate pinned-SDK evidence.

The prototype branch is `codex/components-help-panel-prototypes`, prepared at
`b67e1f64a0552410c12a038f4a651a800a87e061`. Integration destination is
`codex/components-and-help-panel`. This chat owns only the new screen directory,
its registry entries and this design record. The coordinator owns production,
status, integration and final review. Approval and handback remain pending.
