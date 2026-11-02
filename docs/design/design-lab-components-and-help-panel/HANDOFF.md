# Approved A2 handoff

Kris approved **A2, Focused workflow**, screen `components-and-help-panel`, revision
`refined-v1`, variant `refined`, on 2026-11-02. [approval.json](approval.json) owns the
decision, source identity, 25 unchanged reference captures, behavior and limits.
[The decision evidence](approval-decision.json) identifies the coordinator messages.
Original A/B/C remain drafts. Earlier Screens flow-v1, image A2 and Style A5 keep
their existing authority and scope.

Source commit: `c0ded415aba484633ac68981c48910afb82a959c`.

Source fingerprint: `1d99e9d4ce1a0b450881753f19c10234ca95541043733bc1710989e6aee9fd08`.

Branch: `codex/components-help-panel-prototypes`, prepared at
`b67e1f64a0552410c12a038f4a651a800a87e061`. Integration destination is
`codex/components-and-help-panel`. The approval/evidence commit introducing this
handoff contains documentation only; the return message supplies its full SHA.
Keep this worktree's frontend/lab code pinned as the comparison reference.

## Decision and navigation clarification

After the coordinator explained the player and author workflow, Kris said
"okay, go ahead, i think i like A the best". The coordinator asked whether that meant
original A or A2. Kris selected "A2 — Focused workflow (latest version, shown first)".
Only A2 is approved by this decision.

The accepted explanation also clarifies the implementation route. **Screens edits
appearance. Use in Story hands off to Story for Show/Hide Beats.** The author creates
Help, edits its ordinary nodes in Screens, then chooses where it opens and closes
in Story. Components are optional; Help creation and Story use do not depend on
extracting a component.

The preserved mock calls that handoff Connect and includes a small Story example
inside its sample shell. That label caused confusion. The written clarification
takes precedence for integration. Do not edit the approved reference or captures
to relabel them, or treat this clarification as a replacement visual design.

## Production control and behavior map

The coordinator owns wiring and final verification. Reuse the existing authoring,
transaction, history, ownership, Source and navigation owners. Lab services and
fictional success responses stay in Design Lab.

| Approved control or capability | Production operation and required result |
| --- | --- |
| Choose / screen selector / element tree / inert canvas | Select the owned screen and supported node without running game actions. Preserve per-target drafts, selection and focus. Existing approved layout, font, Style, image, add/remove, reordering and canvas operations remain available. |
| Title / explanation / image / size / appearance | Ordinary source-backed node editing. Keep scope beside the fields. Direct local Apply accepts one minimal change/history entry. Invalid, stale and conflicting fields remain editable until explicit cancellation. |
| Close label | Edit an ordinary button local to its panel. Its action hides that panel. Canvas selection never executes it. |
| Make component | Require a fresh source name; extract only the supported group into an explicitly owned parameterless component and replace that group with a stable use. Keep panel Close local and preserve opaque neighbors. |
| Add component | Pick an explicitly owned component and supported insertion parent. Insert a use without replacing existing screen content. Ordinary screens/panels are not component candidates. |
| Used on N screens | Derive the list from current references. Show every affected screen and exact reference details; keep Source navigation available. |
| Shared fields / Review changes | State the affected screens before editing. Review every affected screen and only changed fields, with Current and After Apply. One shared Apply updates all uses through the existing transaction owner. |
| Make a copy for the current screen | Require a fresh component name. Copy accepted content first and change only this use. Other references retain accepted original content. Copy is one accepted transaction/history entry. |
| Copy with valid pending edits | Keep the original input, target and base intact until a separate read verifies the copied definition, revision and corresponding fresh child IDs. The identity-only Copy response supplies no revision or child map. Move the draft only after verification; Apply remains a second ordinary transaction/history entry. |
| Copy refusal | Stale/unavailable intent refuses without losing or silently rebinding the original draft. |
| Copy accepted, refresh/rebinding failed | Acknowledge that the copy exists. Retain unsaved input, disable Apply and offer Reload copy. Do not imply rollback or automatic Apply. Successful verification is required before moving/applying the draft. |
| Cancel after Copy / editor Escape | Discard only unsaved edits. Keep the accepted copy. Escape remains an editor-operation cancellation outside deliberate game playback. |
| Undo / Redo / reopen | Undo Apply, then Copy, as separate entries; Redo preserves that order. Use the existing shared source-backed history, reconciliation, retained drafts and reopen behavior. Verify no-op and cancellation separately from accepted writes. |
| New screen | Offer Blank and Help with explicit panel kind. Prefill title, explanation and displayed image size; select an existing typed UI image. Every starter node remains editable through qualified authoring operations. |
| No typed UI image | Keep Help selected and retain the name. Block Help creation and direct the author to import an image in Assets with the UI image role, then return. Never invent a bundled asset or silently create Blank. Explicit Blank selection remains valid. |
| Use in Story | Hand off to the existing Story authoring context with the selected owned panel. Screens remains the appearance editor. This written clarification governs the mock's Connect route. |
| Story Show screen / Hide screen picker | Use target `{screenId, sourceName}`. Persist identity only; refresh source/sourceMap/inventory/effects revisions for admission. No revision fields appear in the UI. Components are ineligible. Create a normal source-backed Beat and preserve exact Source navigation. |
| Try panel / playback example | In the product, use the existing deliberate Ren'Py execution route. Show persists through dialogue. Hide, Close and default game Escape dismiss; outside clicks keep the panel open. Qualify focus in actual Ren'Py. Browser playback is a simulation only. |
| Source / Source and effects | Resolve current exact spans and stable screen/component/use references. Refuse missing/renamed/deleted targets without silent retargeting. Include relevant component/use/screen/action/binding revisions. Combine known effects conservatively; custom or unsupported effects remain unknown. |

No parameters, transclusion, arbitrary import, Call/Finish, general action builder,
unrelated canvas redesign or 3D work is authorized by this approval.

## Promotion checks and remaining gap

The required `npm run design:check` ran **once**. Full lab TypeScript and approval
validation pass. Its browser gate **fails** at `check-browser.mjs:46` during the first
`page.goto`, waiting for the local Design Lab page's load event. The limit is 8000 ms.
There are zero rendering cases and zero browser check groups. The gate's later
interaction and in-memory production-build exclusion checks were not reached.
It was not retried and no timeout or approved source file changed.

A separate scoped inspection uses the real Design Lab, an explicit worktree-local
Vite cache and a 45000 ms navigation limit. It passes the approved pointer, source
match, approval labels and variant statuses. Four selected dark conditions load:
shared wide/compact, no images wide and copy-refresh failure wide. Reload copy enables
the retained draft; Cancel restores accepted content while leaving the copy. Visual
inspection confirms the approval chrome and blocked starter. This is scoped proof,
not a substitute for the failed full promotion gate.

The reviewed source's earlier 128-case matrix and final 32-case A2 run retain their
exact draft-source scope under [REFINEMENT.md](REFINEMENT.md). All 25 reference
captures pass SHA-256 and byte comparison against the reviewed commit. Source checks
pass before and after recording approval, with the same fingerprint. A/B/C history
entries and all historical captures remain unchanged.

The shared full runner inherited Vite's default dependency cache through the reused
`app/node_modules` link. It wrote only `_metadata.json` and `package.json` under
`.vite/deps`; its optimized/chunks maps are empty. This is a departure from the
requested read-only dependency reuse. No shared optimized output was used. Those
metadata files were left in place rather than risk deleting another checkout's
cache state. The subsequent scoped check isolates all cache/output in this worktree.
No dependency installation, production source edit, SDK/helper/native/package/CI
operation or publication occurred.

[approval-receipt.json](approval-receipt.json) records machine-readable results,
hashes and evidence identities. Full raw outputs remain local under
`.toolchains/components-and-help-panel/promotion/`, with the shared runner report at
`.toolchains/design-lab/report.json`. Sanitized promotion observations are retained
separately from the approved reference captures.

**Visual finding.** The exact A2 source and 25 reviewed captures are preserved.
The written Screens/Use in Story clarification and the recorded simulation limits
are explicit. The real lab inspection includes its control chrome and full production
stylesheet cascade; reviewed standalone captures include their comparison controls.
Those observation images are not replacement references or a pixel-match claim.
Production visual fidelity has not been tested here.

**Functional finding.** The reference's scoped browser behavior passes its recorded
checks. Full promotion validation is unproved because the required browser gate
failed. Source-backed UI-to-core, history/reopen/recovery, migration and deliberate
Ren'Py rendering/dismissal/focus proof remain with the ticket workers and coordinator.
This handoff records design approval; it does not accept either ticket or claim
production implementation is complete.
