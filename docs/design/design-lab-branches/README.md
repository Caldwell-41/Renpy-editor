# Branches layout comparison

Both versions are drafts. The existing Branches image and connector approvals remain
intact. Neither layout implements production changes or a new graph editing workflow.

- [Story atlas](http://127.0.0.1:5174/?screen=branches&variant=atlas&state=populated&theme=light&viewport=wide)
  keeps the whole story on one pannable map with an optional inspector at the right.
  It opens around the selected scene at a readable scale. Fit gives an overview;
  the scene picker and pan controls reach more distant scenes.
- [Route desk](http://127.0.0.1:5174/?screen=branches&variant=desk&state=populated&theme=light&viewport=wide)
  uses a searchable scene index, a local incoming/outgoing map and route details below.
  It trades the full-map overview for easier comparison of a scene's possible exits.
  The compact version uses a scene picker and stacked map/details.

Both use the same fictional story, routes and navigation previews. Existing theme
colours, fonts, icons and basic controls come from production imports. Layout CSS
and the fictional model stay inside this screen directory.

## Preserved behaviour and control choices

| Control or capability | Why it is present |
| --- | --- |
| Select a scene, graph node or route | Establishes context before navigating; selected node and route states agree. |
| Scene picker; searchable index on the desk | Reaches scenes outside the current canvas. Search serves the long sample rather than adding graph filters with unclear semantics. |
| Pan, wheel/keyboard zoom, Fit, Focus | Lets the reader choose a readable location or an overview. Arrow keys pan, plus/minus zoom, Home fits. |
| Optional details with close and Escape | Returns space to the map. Selection survives collapse; close returns focus to the selected node or details control. |
| Refresh and observation notice | Distinguishes the last saved observation from execution. Refresh retains selection, pan and zoom; an error retains the graph. |
| Project start and origin in Source | Keeps source inspection available when the graph cannot explain a route. |
| Story, destination and exact-body navigation | Preserves Scene/Choice/Jump navigation and the location of conditional bodies. |
| Call continuation navigation | Makes the return point explicit instead of drawing a misleading execution path. |
| Guard, missing label, custom flow and return/end explanations | Shows the limits of observed flow. Conditions and custom expressions never execute. |

The canvas maps known scene-to-scene routes. Within-scene bodies, missing destinations
and custom expressions appear in the selected scene's route list with exact inspection
actions. Route text stays available in details when a graph pill truncates it.
The shared mount isolates interaction code from the two layout choices so later
maintenance does not require fixing selection and navigation twice.

## Simulations and boundaries

Source and Story actions open read-only, fictional destination dialogs inside the
preview. Edit Choice / Jump opens a navigation preview of the existing Scene controls.
The graph has no drag-to-edit, create, delete, save or execution action. Refresh retries
a local sample observation; it does not read a project. Scene selection, collapse,
view transforms and search live only for the current mount. Switching sample or
reloading resets them. There is no native app, filesystem, provider or model operation.

Populated, empty, long and refresh-error samples are available in both themes and both
registered viewports. Empty flow offers Source inspection. Error flow retains the last
usable map and recovers through Retry refresh. The long sample adds eighteen fictional
scenes and long route/scene labels; text remains readable in details and the scene picker.

## Verification

Local Mac verification uses the pinned repo Node/npm tools and Chromium through the
Design Lab. The initial scope check passed 32 rendering cases plus both layout journeys.
A first sandboxed browser launch failed before loading a document because macOS denied
Chromium's MachPort bootstrap. The authorized local run with loopback/process access
passed. This is an environment failure, not a product pass or a native app check.

Visual review found unreadably small default Fit views. Focused repair 1 opens the
atlas around the selected scene, removes unused space in the desk's local graph and
preserves the view when details collapse. A duplicate-header capture in the first
atlas image matches the shared screenshot settling issue; the shared runner now waits
two animation frames before captures. A redundant unchanged-input pass occurred after
a preparation path error, before the repair was applied. It adds no new qualification.

Focused repair 2 shortened the desk's graph choices to numbered pills that match
its outgoing list, so labels no longer overlap scene cards. The final scoped run
passed all 32 rendering cases and both interaction journeys with no browser errors.
Direct graph-route selection, keyboard pan, zoom/Fit/Focus, guarded routes, exact-body
and continuation previews, missing/custom destinations, dialog focus return, collapse,
refresh retention, recovery and compact scrolling passed. The eight populated captures,
compact long captures and error captures were inspected across both layouts and themes.
The final scoped TypeScript check passed. Two earlier command forms were rejected by
TypeScript configuration/CSS declaration requirements; adding --ignoreConfig and the
existing vite/client declarations corrected the invocation without a source change.

Allowance use is one initial browser cycle and two focused repairs, all ending in a
pass, plus the recorded sandbox refusal and one redundant unchanged-input pass.
Evidence is ignored under `.toolchains/design-lab/pages/branches/`. Approval pointers
and both revision approvals remain null. No commit, push or production file changed.
Browser proof covers sample rendering and interaction only. Product integration,
real navigation, saved preferences and native acceptance need their own selected task.
