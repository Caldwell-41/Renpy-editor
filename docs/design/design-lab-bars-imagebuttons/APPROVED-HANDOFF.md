# Approved A2 handoff

Kris replied **"Approved"** immediately after the final annotated comparison and
runnable candidate identified A2 `inspector-v2`, source `37d29ca1`.
The approval date is 2026-11-06 in Australia/Brisbane. The exact user message ID is
`961cbbd1-c3ac-4195-908a-8c320598fc66`, at position 978 in
[the design chat](<t3-thread://v2/88c3ca41-b202-47bf-8d09-09bd3411e945/mcp:launch:5f05660eff093dcb7e20eadcdf24c42d8b3e58d50b2a87c2cc1b5ed72037bc61>).
The preceding candidate message is retained in [the approval receipt](approval-receipt.json).
Kris stated no separate reason. This approves only A2; the three original variants
remain drafts. This is design approval, not product acceptance or a waived check.

## Exact reference

- Screen/revision/variant: `bars-imagebuttons` / `inspector-v2` / `inspector-v2`.
- Source commit: `37d29ca180dc81cb350ff8ff99bfaee90e65cea9`.
- Full source fingerprint: `fadc5fa2591ac31edec149b871505fcfa20c54b26e622d44e60a74b0b8ee0c80`.
- Canonical pointer, agreed behavior, deviations and all 13 capture hashes:
  [approval.json](approval.json). Source and capture integrity independently match.
- Retained actual captures: `captures/inspector-v2-corrected/`. Main reference is
  [button-1280.png](captures/inspector-v2-corrected/button-1280.png).
- [Annotated comparison](annotated-a2-final.png), SHA-256
  `2e94b5051dedb302dfbd0227533b340ea9aa51754f272c830b73c0a8494c2d14`.
  It explains the changes and is not the source-fidelity reference.
- Standalone export: `.toolchains/bars-imagebuttons/refined-a2.html`, SHA-256
  `a2eaa31b2a719f478bfefa03d977d5200ccda6daf57ac933eedcae8027486e3e`.
  Rebuild with `node design-lab/screens/bars-imagebuttons/export-refined.mjs` from `app`.
- Capture conditions: dark, widths 1280 and 560, CSS content/PNG height 820,
  scale 1. The `html_preview` inner viewport height was 800. Preserve both facts
  when comparing. Other conditions are outside recorded visual coverage.

Keep this worktree's prototype source pinned. Approval records and captures are
later documentation commits. Do not replace the original A source `0a6e571e`,
other approved lab sources, shared DTOs or production code with this throwaway mock.
Use the coordinator's frozen shared contracts in the implementation checkout.
Route any design-driven interface request through the implementer to the coordinator.

## Control-to-operation map

| Approved UI | Real owner and required observable result |
| --- | --- |
| Existing Screens flow, section jumps, selection and composition | Reuse `ScreensWorkspace`, current styles/icons and approved Choose / Design / Use in Story. Retain all existing composition, Source and numeric layout capabilities. No broad redesign. |
| Add bar/image button | Existing `screens.compose` addBar/addImageButton captures the selected qualified parent. Editing captures node ID and retains parent. No reparent UI/API. |
| Integer picker and bounds | Existing typed integer catalog, stable variable ID and captured authoring revision. Canonical decimal strings in `IntegerBarBinding`; core owns exact engine-integer endpoints and positive span. Missing/type-changed references retain draft and require an explicit valid choice. |
| Filled, Empty, Thumb color | `BarAppearance.leftBar/rightBar/thumb` are nullable literal colors. Clear restores the default. Preserve Source-only expressions. |
| Six UI-image pickers | Existing real UI-image catalog/import/reference owner; actual UUID/hash references. Normal required, other five optional. Picker search, Escape/Cancel and focus return use the existing owner. |
| Fallback rows and samples | `hover -> normal`, `disabled -> normal`, `selected -> normal`, `selectedHover -> hover -> normal`, `selectedDisabled -> disabled -> normal`. Selected-hover never uses Selected. Dimmed fallback thumbnails are display-only and never populate null references. |
| Displayed Width/Height and aspect link | One shared pair across every explicit state. Combined imageButton command applies bounded native `Transform(path, xysize=(width,height))` per explicit state. Aspect linking is opt-in, per draft, using the current Normal image's actual dimensions. Do not use root bounds alone for image scaling or add competing xsize/ysize controls. |
| Layout/order | Preserve the existing numeric layout owner, units, anchors, bounds and ordering. The mock's signed whole-pixel x field illustrates validation; it does not replace broader production controls. |
| Ordered typed actions | Existing `renderActions` / `actionDraft` / `prepareInteraction` and interaction owner. Context-valid Set/Show/Hide and Finish, eight-action limit, Finish last. Production owns row errors, target validity and revision checks. |
| Apply | One combined bar/imageButton transaction includes binding/appearance/actions, size and layout. Exactly one history entry for actual change. Refused Apply retains raw input, owning error, captured revisions and focus; no silent rebind or draft refresh. |
| Cancel/no-op and errors | Cancel discards only this draft; no-op adds no history. Feedback belongs to each draft. Open hidden sections before focus, associate field messages, retain native action messages, restore redraw focus and protect error targets from sticky bars. |
| Navigation/remount/unrelated edits | Existing session draft owner outside transient DOM, keyed to control identity with captured source/authoring revisions. Retain drafts without substituting current revisions. |
| Undo/Redo, Source, reopen | Existing transactional history, source-preserving patch/reconciliation and accepted inspection. Verify real save/reopen, history and unsupported neighbors through actual services. Do not copy memory-only mock callbacks. |
| Six marked sample states and values | Existing revision-bound editor samples only. Never run game code/actions or persist runtime defaults. Sample changes create no authoring draft. |

## Limits and pending gates

The approved, disclosed compact stale-error state needs scrolling to expose the
full footer. Touched actions restored to their original value can still say
"Unsaved: Actions" until no-op Apply; history remains unchanged. Treat these as
prototype deviations to review during integration, not permission for inaccessible
production controls. The canvas, image art and service callbacks are fictional;
the prototype does not qualify actual source patches, persistence or Ren'Py.

TypeScript module checking and the approval-schema fixture check pass. Sixteen
focused synthetic DOM groups previously passed at both dark widths, and all
thirteen actual captures reported no console messages. Exact inputs, hashes and
receipts are in [the final source receipt](a2-final-source-receipt.json).
Earlier failed/inconclusive Terra attempts remain in [REVIEW](REVIEW.md).
These results do not prove trusted keyboard/Escape, native pointer/file picker,
real core/source/runtime or the full repository `design:check`.

The actual global approval loader failed on an unrelated existing Help A4 record:

```text
git ls-tree -rz 8851689b62eda03127c199ca0276a776b0d623ab -- app/src app/design-lab app/public app/package.json app/package-lock.json app/tsconfig.json app/vite.config.ts
fatal: not a tree object
```

Its owner is `docs/design/design-lab-help-dialog-story/approval.json`. That record
was preserved. The A2 record, source fingerprint and 13 hashes were independently
verified. Full `npm run design:check` remains pending; no new server or native
browser was started and no gate was relabeled as passing. Complete the global
source-catalog/browser gate and the actual implementation's visual and functional
checks under the existing integration workflow. The explicit human decision is
recorded now; full promotion verification is not claimed complete.

No production/shared-contract edits, push, PR or merge were made by this design
thread. The approved handoff must go directly to the production frontend implementer,
with the coordinator copied; delivery is separate from implementation completion.
