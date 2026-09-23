# Current checkpoint handover

**Prepared:** 2026-09-23 (Australia/Brisbane). **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** corrected F4 packages verified; Windows native A/B/C user-reported PASS; macOS native F4 pending. Phase 1F remains unaccepted.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [#14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Application candidate:** `845c60cde837862cf1f9f4302e959da129ed1d4a`.
**Main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d` at entry.
**Authority:** user-submitted Windows F4 outcomes; record verified build #90 evidence. No merge, deletion or Phase 1G.
**Canonical detail:** [build #90 and Windows result 7.28](../tasks/active/phase-1f-save-correction.md#728-corrected-packages-and-windows-native-f4-evidence); [review 7.27](../tasks/active/phase-1f-save-correction.md#727-independent-f4-evidence-review--browser-passed-native-pending).

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
Build #88 predates F4. [Production #90 / 35787284261](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35787284261),
attempt 1, passed all three jobs on current PR head `88dc6286…`; both package ZIPs
were downloaded and verified against GitHub size/digest and CRC. The user reported
Windows 11 Pro A/B/C PASS using the Windows package artifact. The numeric OS build,
choice of MSI or NSIS, and local installer hash were not reported. macOS native F4
is still outstanding. DIST-MAC-01 remains outside scope.

**Next bounded action:** install the verified build #90 macOS package and perform
focused native F4 selection re-enabling, changed-draft refusal and changed-external
refusal. Record OS version, artifact/installer identity and actual results. Do not
repeat the six unchanged native Save cases or the Windows F4 cases. Keep PR #14 draft
and Phase 1F unaccepted until macOS evidence is reviewed. No merge, branch deletion
or Phase 1G.

**Publication:** build #90 and the Windows user report are recorded in ledger 7.28;
verify this updated handover and ledger on the remote.
