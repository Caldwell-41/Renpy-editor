# Help composition workflow research

Research for Loomlight #37, checked 2026-10-26. This note compares current official product documentation. The facts below describe those products; the recommendations apply them to Loomlight's narrower, source-preserving workflow.

## Official product findings

### Add elements and choose a parent

Webflow offers click-to-add, canvas drag, and Navigator drag. Click-to-add uses the selection: a selected container receives the new element at its end, while a selected text, media, or button element gets a nearby sibling. Dragging shows separate cues for the destination parent and the position within it. [Webflow Add panel](https://help.webflow.com/hc/en-us/articles/33961270096659-The-Add-panel)

Ren'Py's Screen Language sets the actual parent rules: `fixed` accepts any number of children; `frame` takes one child, and wraps zero or multiple children in an implicit `fixed`; `text` and `textbutton` are leaves. [Ren'Py Screens and Screen Language](https://www.renpy.org/doc/html/screens.html)

### Select nested elements in canvas and tree

Figma gives every canvas object a corresponding layer. Selecting either representation selects that object, hovering a layer highlights its canvas bounds, and the layer panel exposes nesting. Canvas users can enter one level with double-click or Enter, deep-select with a modifier, and move between child, parent, and sibling layers by keyboard. [Figma Select layers and objects](https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects)

Webflow's Navigator also maps hover between the tree and canvas, selects nodes from the tree, scrolls the canvas to offscreen selections, and applies tree hierarchy changes to the canvas at once. [Webflow Navigator](https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator). Penpot documents double-click to enter a group and a layer menu to choose an overlapping node. [Penpot Layers](https://help.penpot.app/user-guide/designing/layers/)

### Edit text with a draft and explicit commit

Figma and Webflow Designer enter text editing by double-click or Enter on a selected text layer. Both describe direct text editing in the canvas. [Figma text guide](https://help.figma.com/hc/en-us/articles/360039956434-Guide-to-text-in-Figma-Design), [Webflow Text block](https://help.webflow.com/hc/en-us/articles/33961346059027-Text-block). Their documented gestures are useful entry points, but their inline editing model does not supply Loomlight's required separate Apply/Cancel transaction.

### Reorder siblings and protect elements

Unity 6's Hierarchy distinguishes dropping onto a parent from placing a sibling between rows with a horizontal insertion line. Its docs define siblings as children with the same parent. [Unity Hierarchy management](https://docs.unity3d.com/Manual/Hierarchy.html). Webflow's Navigator supports drag ordering and nesting; the tree makes the destination hierarchy visible. [Webflow Navigator](https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator). Penpot documents sibling navigation with Tab/Shift+Tab and keyboard layer-order changes with Ctrl/Cmd+Up/Down. [Penpot shortcuts](https://help.penpot.app/user-guide/first-steps/shortcuts/)

Figma and Godot locks protect against canvas selection or movement, while keeping locked elements selectable in their hierarchy panels. Figma also locks descendants when a parent is locked. [Figma lock layers](https://help.figma.com/hc/en-us/articles/360041596573-Lock-and-unlock-layers), [Godot 2D editor](https://docs.godotengine.org/en/4.5/tutorials/2d/introduction_to_2d.html). These are editor interaction locks, not a model for protected `.rpy` source or unsupported syntax.

## Loomlight recommendations

1. **Keep insertion explicit.** Default to the selected eligible container, or the nearest eligible ancestor when a leaf is selected. Append at the end of that parent's children. Show the full parent path and a short `Add as last child` statement before commit. Do not infer a different parent from a canvas hit or silently add beside a leaf. Validate parent and depth rules before Add. Describe container and leaf types in the chooser. Preserve the accepted five element types and the existing Choose/Design/Connect flow.
2. **Use one selection identity across views.** Clicking a tree row or canvas object should select the same node ID, scroll or reveal the counterpart when needed, and show a clear highlight in both. Keep single-click for selection and the existing Enter/double-click Design entry. Add a visible, named text-edit action for text and textbutton nodes so text editing does not steal the established Design gesture.
3. **Treat text editing as a retained draft.** Keep the original text until Apply. Cancel restores it. Associate the draft with the node ID so selecting another node or switching among Choose/Design/Connect does not lose it. Show that a draft remains pending when the user returns. On invalid input or source conflict, keep the exact typed value and put the reason beside Apply, with a path to inspect the relevant source. Successful Apply should create one operation in the existing shared history.
4. **Make reorder targets and refusal legible.** Support drag only between siblings under the same parent, with an insertion line and a parent label. Provide keyboard Move up/Move down commands for the selected row. Escape or a drop outside a valid gap should restore the original order without a history entry. If a protected or unsupported source neighbor blocks an operation, leave source, order, selection, and text draft intact and explain the specific restriction beside the attempted operation.
5. **Show why a node cannot change.** Use a distinct protected-source marker and a direct explanation such as `This element overlaps source Loomlight cannot safely edit.` Provide a View in Source action when a location is known. Do not describe this as a canvas lock: protected-source refusal is about preserving authored bytes and unsupported syntax, even if the element remains selectable in the tree.

## What not to import

Do not add Webflow-style arbitrary insertion around whichever canvas element happens to be selected, because this task needs a known eligible parent and append point. Do not add free canvas movement, resizing, reparenting, multi-selection, or broader node creation from Unity/Godot/Figma. Those tools edit spatial scenes or unrestricted layer trees; #37 reorders siblings only. Do not autosave text as Figma and Webflow Designer do. Keep Loomlight's Apply/Cancel and one shared-history operation. Do not treat a lock icon as sufficient explanation for protected-source refusal.
