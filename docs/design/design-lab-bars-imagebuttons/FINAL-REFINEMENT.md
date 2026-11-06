# Final A2 refinement

Kris requested one final council round, aiming for 9/10, followed by an annotated
screenshot of the changes from original A. Both read-only reviews are complete.
They inspected source `0263728d` and its seven retained captures. Their actual
scores are reported in the design chat, without an invented post-fix rescore.
No fourth round was started.

The remaining source finding concerned error placement outside plain fields.
The local correction limits prototype inline messages and invalid attributes to
named fields, gives image-row messages their own grid row, and preserves the
existing action editor's message and accessibility attributes. Source-change
errors use the footer and focus the title. Action scrolling includes the existing
payload and message; compact scroll offsets also protect the focused title.
The final source is `37d29ca180dc81cb350ff8ff99bfaee90e65cea9`.
Its full source fingerprint is in [the final receipt](a2-final-source-receipt.json).
These local corrections were not independently rescored.

TypeScript module checking and the standalone Vite export pass. Sixteen focused
synthetic DOM groups pass at 1280 and 560px dark, with inner height 800px.
The extra checks cover image-error placement, action-message ownership and cleanup,
full action-message visibility, and the stale title remaining above the footer.
The exact test input and console outputs remain ignored under
`.toolchains/bars-imagebuttons/`. These callbacks do not prove trusted keyboard,
Escape, native pointer/file-picker, real source/core/runtime, or full `design:check`.
Earlier failed and inconclusive attempts remain recorded in [REVIEW](REVIEW.md).

Thirteen actual renders from the final source cover the original seven states,
plus missing asset, stale draft and action error at both widths. Every render
reports no console messages. The captures remain separate from the synthetic test
screenshots. The compact stale capture shows the focused title and refusal
message; its commit buttons are partly clipped at that captured scroll position.
The page remains scrollable. This is a prototype limitation for integration review.

[The annotated screenshot](annotated-a2-final.png) combines the unchanged pixels of
the final normal-state capture, an original A inset, a final invalid-size detail,
and six numbered explanations. It is an explanatory artifact, not an approval
capture or a substitute for the runnable candidate. Original source `0a6e571e`,
its study/styles/resolver, and existing pinned approvals remain untouched.

Rebuild from `app` after loading the pinned toolchain:

```sh
node design-lab/screens/bars-imagebuttons/export-refined.mjs
```

Open `.toolchains/bars-imagebuttons/refined-a2.html`, or select the registered
`bars-imagebuttons/inspector-v2` variant in the existing lab. All samples and
transactions remain fictional and in memory. The existing
[control-to-operation map](README.md#behavior-and-real-operation-map) still applies.

Kris subsequently replied "Approved" to the exact variant and source above.
[The approved handoff](APPROVED-HANDOFF.md) records the decision, operation map,
known deviations and pending verification. No production/shared-contract edits,
push, PR or merge occurred in this design thread.
