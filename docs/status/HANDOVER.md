# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-WIN-TOOLS, `review_ready`; local debugger/SDK setup verified.
R2-P1 qualification remains `blocked`.
**Authority:** the latest user request selects local debugger/SDK preparation only.
It supersedes the earlier installation stop for these prerequisites. The prior
R2-P1-WIN-D1 investigation retains its 90-minute active-work, one-baseline-build,
one-diagnostic-build and four-launch caps; diagnosis was not resumed in this setup.
No production fix, CI dispatch or merge is authorized.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. Integration is outside scope.
**Tested candidate:** `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`.
**Exact run:** [36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
**attempt 1**, terminal **FAIL**; last target job completed 2026-09-27 04:32:03 UTC.
Later commits contain documentation only; resolve published head from Git.

## Verified outcome

Read [ledger 23](../tasks/active/phase-1g-branches-runtime-git.md#23-r2-p1-packaged-proof-correction-and-qualification--2026-09-27)
for exact measurements, gate dispositions, hashes and failure evidence.
Preflight **108548761361** passed (60 frontend tests, Source browser, repo/format).
Windows **108548848419** passed core, three G1-U2 samples, rendered budgets, explicit
SDK/R1/diagnostics, desktop test and MSI/NSIS build. All five packaged cases then
exited with code 3221225725 and `thread 'main' has overflowed its stack`, in
0.015–0.047 seconds, no timeout and no reports. Scenario stages/cleanup are unproven.
The overflow location and normal-launch impact remain unknown.

macOS ARM64 **108548848384** passed core and three G1-U2 samples, then failed the
Branches browser frame gate: p95 **109.9 ms** against <100 ms, maximum **860.3 ms**.
Synchronous dispatch maximum was 0.3 ms; it does not excuse the frame failure.
Cause is unproven. Downstream SDK/desktop/package/scenario gates were skipped.
Windows p95 was 15.6 ms. Both retained ordinary core protections and browser resize/
navigation checks. Neither target qualifies the new graph-reopen/duration assertions.
Legacy packaged boundary, secret scan and dependency inventory were skipped on both.
Final G1/R1/R2 and human acceptance remain incomplete; earlier evidence is preserved.

## Artifact integrity and limits

Both GitHub archive digests/lengths, ZIP CRCs and all 29 extracted files verified
(7 macOS, 22 Windows). All 101 Windows app/workflow input hashes matched the tested
Git tree, with exact candidate/run/attempt identity. Windows executable digest is
recorded in the ledger but cannot be independently rehashed: package uploads were
skipped and no binary is available. macOS never generated that manifest or package.
Four Runtime browser screenshots were inspected; these use an injected requester
and synthetic input, not successful packaged/native interaction.
Raw logs/API records, original ZIPs, extracted files, verification manifest and computed
assessment are preserved outside Git at workspace `reports/r2-p1-ci-36293797731`.
G1-OBS's previous qualification and 126 ms/1,058.6 ms frame outliers remain in ledger 22.

## Prepared local tools and next bounded decision

Read [ledger 24](../tasks/active/phase-1g-branches-runtime-git.md#24-r2-p1-win-d1-local-startup-diagnosis--2026-09-27)
for the interrupted diagnosis and
[ledger 25](../tasks/active/phase-1g-branches-runtime-git.md#25-r2-p1-win-tools-local-debugger-and-sdk-prerequisites--2026-09-27)
for setup provenance, checks and exact workspace-relative paths.
Entry head was `5773eb920e1dad3c9a3b1bca6b904240e897f040`; its app/workflow inputs
remain identical to the tested candidate. The prior uncommitted diagnosis record is
preserved in ledger 24 and included in this documentation publication.

Microsoft x64 CDB/WinDbg 10.0.26100.9169 is extracted beneath workspace `.tools`;
installer, selected MSI and debugger/engine signatures verify as Microsoft.
CDB passed a disposable command-process launch, breakpoint and stack-output smoke
check. Ren'Py 8.5.3 archive matches the repository pin and published SHA-256; its
extracted Windows interpreter reports `Ren'Py 8.5.3.26051504`.
From a fresh PowerShell at the workspace root (parent of `repo`), dot-source
`. ./enter-debug.ps1`. It prepares existing Rust/MSVC, debugger PATH, SDK archive
environment variables, a separate diagnosis build directory and local symbol cache.
The script verifies the archive again and changes only this shell's environment.
Downloaded/extracted tools, script and raw verification evidence remain outside Git;
local report: `reports/r2-p1-win-tools/verification.json`.

Self-review corrected a missing symbol-cache directory and repeated that smoke check
successfully. No Loomlight build/launch or game execution occurred. CDB's smoke used
exported symbols; matching application PDBs and the failure stack remain diagnosis
work. No task-created debugger, SDK, application or download process remains running.
Counters remain 0/1 baseline builds, 0/1 diagnostic builds, 0/4 application launches.
The original CI binary remains unavailable; a local rebuild is diagnostic evidence.

Next user-selected action: resume R2-P1-WIN-D1 within its existing caps, compare
ordinary/probe startup with disposable app data, capture the exception/stack and
propose the smallest supported correction. Account for prior active investigation
time; do not reset its caps. Overflow location and ordinary-launch impact remain
unknown; tool availability does not qualify R2-P1. Keep the macOS budget failure
open separately. Do not redispatch, relax budgets, change production code, add native
automation, request human acceptance, resolve merge conflicts or merge.
