# Current checkpoint handover

**Prepared:** 2026-09-23 (Australia/Brisbane). **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** bounded F4 settled-selection correction, `review_ready`; Phase 1F remains unaccepted.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [#14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `845c60cde837862cf1f9f4302e959da129ed1d4a`.
**Main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d` at entry.
**Authority:** user's F4 checkpoint only; no production dispatch, merge, deletion or Phase 1G.
**Canonical detail:** [correction ledger 7.26](../tasks/active/phase-1f-save-correction.md#726-f4-settled-selection-correction--review-ready); [review finding 7.25](../tasks/active/phase-1f-save-correction.md#725-independent-correction-review--f4-blocks-closeout).

After a retention completes, the controller removes its pending entry and refreshes
controls only for the live matching document and latest input. It keeps the review
identity, retention failure, newer input and transition barriers intact. The retained
DOM probe is part of the ordinary Source tests; the real Chrome probe is part of
`npm run test:source-browser`. No Source Save or core transaction code changed.

The original DOM probe failed at entry (`pending=false`, `disabled=true`,
`applies=0`). The independent review recorded a matching real Chrome failure with
unchanged observation; this host lacks a browser. The pinned Playwright download
returned a truncated zero-byte archive, so corrected browser behavior has not run
green here. Local `npm run check` passed typecheck plus 42/42 frontend tests,
`npm run build` passed, and repository validation/whitespace passed. Rust/SDK and
native WebView gates were unavailable locally. The browser test is a required
outstanding gate; it is not native acceptance evidence.

All six user-reported native Save cases from build #87 remain PASS without repetition.
Build #88 predates F4 and does not validate it. No native F4, corrected package, or
new production result is claimed. DIST-MAC-01 remains outside scope.

**Next bounded action:** independently review F4 diff and evidence, run the actual
browser regression on a browser-equipped host, then build and verify corrected
Windows/macOS packages and check native Apply Both selection re-enabling and stale
draft/external refusal on both targets. Keep PR #14 draft and Phase 1F unaccepted
until those gates are resolved. Do not repeat unchanged Save tests, merge, delete
branches, or begin Phase 1G. A subsequent production dispatch requires an explicit
checkpoint decision and ownership check.

**Publication:** application commit above; documentation and PR description in this
checkpoint. Verify remote head and PR body before treating this handover as published.
