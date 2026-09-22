# Current checkpoint handover

**Prepared:** 2026-09-23 (Australia/Brisbane). **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** independent F4 evidence review, browser passed; corrected packages/native F4 pending. Phase 1F remains unaccepted.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [#14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `845c60cde837862cf1f9f4302e959da129ed1d4a`.
**Main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d` at entry.
**Authority:** user's F4 checkpoint only; no production dispatch, merge, deletion or Phase 1G.
**Canonical detail:** [review/evidence ledger 7.27](../tasks/active/phase-1f-save-correction.md#727-independent-f4-evidence-review--browser-passed-native-pending); [correction 7.26](../tasks/active/phase-1f-save-correction.md#726-f4-settled-selection-correction--review-ready).

After a retention completes, the controller removes its pending entry and refreshes
controls only for the live matching document and latest input. It keeps the review
identity, retention failure, newer input and transition barriers intact. The retained
DOM probe is part of the ordinary Source tests; the real Chrome probe is part of
`npm run test:source-browser`. No Source Save or core transaction code changed.

The independent F4 diff review found no new bounded code issue. Local `npm run
check` passed typecheck plus 42/42 frontend tests and repository validation passed.
This scratch host lacks Chrome and its Playwright download was truncated. A focused
job added to PR quality CI ran the corrected F4 script in hosted Chrome: [#378 /
35782023645](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35782023645),
attempt 1, both jobs successful on `74ce3487bcd7834c21d519f795e30017977d7c2c`.
The browser job `106929608406` logged `pending=false`, `disabled=false`, hidden
stale notice, two observations and one Apply Both action. This is a service-double
browser regression, not native acceptance evidence. Rust/SDK and native WebView
checks were not run locally.

All six user-reported native Save cases from build #87 remain PASS without repetition.
Build #88 predates F4 and does not validate it. No native F4, corrected package, or
new production result is claimed. DIST-MAC-01 remains outside scope.

**Next bounded action:** obtain verified corrected Windows/macOS packages through
one exact-SHA production run, then check native Apply Both selection re-enabling and
stale draft/external refusal on both targets. Follow the precise plan in ledger
7.27. Keep PR #14 draft and Phase 1F unaccepted until those gates are resolved.
Do not repeat the six unchanged native Save cases, merge, delete branches, or begin
Phase 1G. Production dispatch requires an explicit checkpoint decision and
ownership check.

**Publication:** application commit above, passing focused CI probe `74ce3487…`,
and removal of its temporary quality job `aa39e2fa…` are published. The F4 browser
script remains in production gates. Verify this review ledger/handover on the remote.
