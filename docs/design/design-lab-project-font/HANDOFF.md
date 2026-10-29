# Approved A2 handoff

On 2026-10-29 Kris approved `project-font` / `inspector-v2` / variant `refined` with "Approve A2 and send it back to the original implementation chat."

The destination is the original implementation chat, `01a18744-c414-7bd2-9f53-f2b9843bf63a`, titled "Implement ticket 39". It retains #39 production implementation and qualification ownership on `codex/l05-project-fonts`. This handoff supplies design approval. It does not resolve that chat's separate pending test-boundary or tracker-publication questions.

## Source and preview

The approved source is `79d958d5c45dfd12073c2192de05128d6ed19a91`, with frontend/lab fingerprint `83a92587e4c13ad2a94fa1c69dbfcd6c87ef927062359939f0d1bd3969472cfc`. `approval.json` pins that source and all 18 retained capture hashes. No earlier design approval is superseded. Original A/B/C remain drafts.

[Wide A2](http://127.0.0.1:5177/preview.html?screen=project-font&variant=refined&state=text&theme=dark&viewport=wide) and [compact A2](http://127.0.0.1:5177/preview.html?screen=project-font&variant=refined&state=text&theme=dark&viewport=compact) run on the design worktree's local lab. Use the lab's state picker for missing/invalid fonts, expressions, source conflict and long text. Dynamic chooser/import/error states follow `capture-refined.mjs` and `refined-check.mjs`.

The branch is local `codex/l05-font-prototype`, based on `8f0d208`. Candidate commits are `b241a0e` for A/B/C and `79d958d` for A2; the next documentation-only commit holds approval and this handoff. Nothing was pushed. Integrate those owned commits in order after inspecting the implementation checkout's current state. Keep this worktree for the pinned comparison. If production frontend changes alter the fingerprint, use this reference checkout as required by INTEGRATION rather than editing the approval.

Changed files are limited to `app/design-lab/screens/project-font/`, its import/list entry in `app/design-lab/registry.ts`, and `docs/design/design-lab-project-font/` including captures. No production component, core service, shared status, tracker, SDK or native build was changed here. The untracked local dependency symlink is setup only.

## Controls and behavior for integration

| Control | Real operation and expected result |
| --- | --- |
| Content, size, color, line alignment, bold, italic | Edit typed text properties through the existing transaction path, with minimal source mappings. Empty/Default inherits; explicit On/Off differs from inheritance. Line alignment does not change element placement. |
| Font row and chooser | Discover/pick only typed project-owned font handles. Show current text, selected state, file and format. Select into the text draft, close and return focus. Never admit arbitrary CSS URLs. |
| Import | Use the approved import boundary for actual TTF/OTF files. Preserve staged/text values on failure or cancellation. Return from import cancellation to retained chooser search. Keep an imported catalog asset when cancelling its text use. Qualify actual native-dialog focus. |
| Apply/Cancel | Accept one transaction/history entry for a changed text draft, none for a no-op. Cancel restores accepted values. Preserve field focus, errors, source conflicts and draft retention. |
| Error repair | Keep missing/invalid assets and field input visible. Focus the invalid control. Choose another font repairs the reference; Review Source exposes a conflict without silently discarding input. Invalid size/color drafts keep accepted typography in the schematic preview. |
| Expressions and Source | Keep unsupported content/font/size expressions intact, with Source access. Other supported fields stay editable. Qualify actual reconciliation, opaque neighbors and minimal writes. |
| Selection, history, reopen | Retain per-text drafts/errors, scroll and disclosures. Preserve shared Undo/Redo and durable chosen handles/values through Source and reopen. |
| Layout and existing elements | Preserve accepted numeric units, parent constraints, nine presets, dimensions/limits, composition, ordering/removal, nested layouts, UI images and Source editing. The bounded text mock does not reimplement them. |
| Preview and compact navigation | Preserve resolution/focus and deliberate Ren'Py Test. Editing comes first in compact windows; Show preview and Edit text move between editing and canvas. Qualify actual font use, placement and wrapping at the accepted resolution/aspects. |

## Verification and limits

Focused A2 verification passes 24 state/theme/size combinations and its interaction check. TypeScript, approval-record validation and all 18 capture hashes pass. After promotion, a browser check confirms the Approved preview, current pointer, label/history and matching source identity. The renderer source did not change during approval.

The required combined `npm run design:check` failed again at its initial eight-second navigation. `.toolchains/design-lab/l05-refined/l05-approval-combined-01.log` retains the original output. The focused approval browser check and report are retained beside it. No threshold or shared runner changed, and no combined-gate pass is claimed. Kris's design approval is recorded with this known gap; full promotion validation and product acceptance are not implied.

All font/import/source/history/reopen operations in the mock are fictional browser-memory actions. Font specimens use browser family stand-ins, and the canvas is schematic. No actual font decoding, source patch, native picker, persistence, SDK or game execution is qualified here. Whole text sizes 1 through 512 and the four hex color lengths are proposed review bounds; #39 must qualify and document supported bounds/formats. Production operation evidence remains with the implementation owner.
