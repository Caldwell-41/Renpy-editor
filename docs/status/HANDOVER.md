# Current outcome handover

## Selected manual reference library accepted on both targets

The selected manual reference library is accepted on packaged Mac and Windows x64.
Continue Caldwell-41/Renpy-editor on `codex/provider-qualification` in the
existing Windows `worktrees/provider-qualification` checkout. The clean worktree
fast-forwarded from `de29e49` to published `dc889d65f85beeeb388ce8581f8e7d977b292f18`,
which contains the reviewed Mac implementation `f48c446e629c238d9d190c33b9c727cd73002b7e`.
Unrelated worktrees and primary checkout remain untouched. No product code changed
during Windows verification. The earlier local `f678910` commit recorded the
historical Computer Use timeout; this subsequent acceptance/status continuation
must be committed locally and held for explicit push approval.

[REFERENCE_LIBRARY](../REFERENCE_LIBRARY.md) owns schema and limits. The
[selection](../tasks/active/phase-2-initial-llm-assistance.md#manual-reference-library-selection--2026-10-09),
[Mac acceptance](../tasks/active/phase-2-initial-llm-assistance.md#final-manual-library-mac-acceptance--2026-10-09)
and [Windows acceptance](../tasks/active/phase-2-initial-llm-assistance.md#final-manual-library-windows-acceptance--2026-10-10)
own the scope, exact proof and limits. UI A uses directly editable Character
cards and lore entries, top creation controls, ordinary Save changes and Discard
changes. There is no Edit unlock or manual Approve/Reject/Supersede control;
internal revisions and statuses persist. This acceptance does not complete full
2B.1, Phase 2 or live Studio compatibility.

### Windows verification

Focused Windows gates passed before packaging: TypeScript typecheck, Python
probe compilation, native JavaScript syntax, 15 selected frontend/protocol/
controller tests, eleven reference tests plus incidental preferences, three
history-continuity regressions and the external history boundary. An initial
sandboxed core test failed at temporary profile creation before a reference
operation; identical checks passed outside the filesystem sandbox. Core dispatch
also verifies project isolation, ordering, ordinary recovery and deeper malformed
and bounds cases. Existing portable, credential and request evidence remains
valid only for its unchanged cases.

Package attempt **1/2** stopped at a diagnosed Tauri CLI argument separator
before compilation. Attempt **2/2** built the production x64 executable and
NSIS bundle offline with the corrected command. An ignored build-only shim
ran the exact repository TypeScript/Vite `beforeBuildCommand` because this
host has no `npm`. The executable SHA256 is
`86192e75dfdea3e4435bef1f3e672519b00f5bd2745c5bbd9fe26e8420d546cc`;
installer SHA256 is
`7f9b975ae16dbb1e87df41b0a8b61659ace39990a41b4b19d4b6e100d57f95c1`.
Both passed privacy scanning. The package was not installed.

Native launch **1/3**, PID 14960, reached the manual Save pause after synthetic
form entry. Computer Use listed one Loomlight window but timed out requesting
its state; no physical Save or visual assertion occurred. Its `passed:false`
receipt and zero accepted assertions remain historical failure, classified as
missing observation capability rather than a product defect.

At the user's request, Computer Use was retried without increasing allowance.
Launch **2/3**, PID 21212, accessed the retained packaged WebView. Physical
Ctrl+S showed Saving then Saved; disk readback confirmed an approved card with
counter 1 and a matching current/approved revision. Physical Tab moved focus
from Name to Aliases. The production probe then passed **29** assertions, exit
0 and complete cleanup: cards/lore creation and replacement, ordinary Save/
Discard, bounds refusal preserving data, malformed/newer refusal, external
conflict and explicit reload, unknown fields, stale citation/missing link,
source preservation and exact Undo/Undo/Redo/Redo. Wide light/dark and compact
dark forms were observed with top creation and Save/Discard; compact Search,
Tab/Tab/Return reopened the card and focused Name. Windows compact vertical
scrolling was not independently established. Synthetic form input ran through
the packaged production UI and real IPC; browser mocks were not credited as
native acceptance.

Launch **3/3**, PID 18108, passed **3** separate-process reopen assertions,
exit 0 and complete cleanup. Both collections, exact revision/status data and
the external unknown extension persisted. The whole metadata file had identical
SHA256 before and after process reopen:
`78f45911a83206fd4bb1109185a64fc03ace4679a5eb2778ffd576b4328ffbba`.
The final card ID is `e3067b71-9232-426b-af48-582d3dbcd08b`, counter 3,
current/approved r3 `598d4e41-0e3b-4045-b125-4198f3b6153f`; r2
`bd0471c7-30e0-44dd-a1e8-137d71d1e07e` remains superseded. The ignored
`app/.toolchains/manual-reference-windows/final-audit.json` records report and
log hashes. All three PIDs are absent, and the owned synthetic root was removed.
The retained package and receipts remain ignored local evidence.

**Cumulative manual-library allowance:** Windows **2/2 package builds, 3/3 app
launches**; Mac **7/9 builds, 10/13 starts**. No Windows attempts remain. There
was one serial Windows owner, no subagents and no other-host execution. No custom
author distribution override or game execution was qualified. The accepted Mac
result and this Windows result meet the selected both-target requirement.

### Next distinct deliverable, not started

The next queue item is **Prompts and context preparation**, the remaining
necessary 2B.1 slice on the accepted manual library and shared prompt/limit
settings. Return a separate bounded prompt for selecting it; do not implement it
as part of this outcome. The prompt should cover editable/restorable prompt and
save/reopen, exact reference revision selection, inspectable bounded payload
with no silent truncation, affected-target native verification and a finite
allowance. Keep provider send, proposal application, generated references and
automatic retrieval separate. Ask before pushing this local records checkpoint.
