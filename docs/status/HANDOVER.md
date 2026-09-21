# Current checkpoint handover

**Prepared:** 2026-09-21.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE — bounded Save correction](../tasks/active/phase-1f-save-correction.md).
**State:** implementation and local verification complete; blocked on target evidence.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Final application candidate:** `a720ea3fb150f2a49422e8385256179185129968`.
**Application tree:** `8edc9136aa362e180faa52421584f519aa0c0935`.

## Resume here

Preserve the existing branch and newer documentation-only publication head. Do not
reset to an older SHA or repeat the 1F-SAVE implementation. Read the complete
requirement/evidence matrix in the correction ledger and review application candidate
`a720ea3f` independently before changing code.

The candidate has one shell Save owner and a document-bound Source controller with
retention barriers, coordinated operation/leave handling, generation/session guards,
authoritative status, and exact dirty Source versus clean/non-Source routing. The
packaged smoke now asserts per-phase Save/Flush deltas and retains bounded checkpoints.
The executable browser regression demonstrates:

- red: `legacy-clean-assertion=false saves=1 flushes=0 updates=11 dirty=true`;
- green: `faithful-clean-assertion=true saves=1 flushes=0 updates=11 dirty=false`.

This evidence came from the actual Source UI and selectable fake model. It does not
claim native keyboard delivery.

## Verification retained

- `python3 scripts/validate.py`: passed, 215 files; `git diff --check`: passed.
- `npm ci --ignore-scripts`, `npm run check`, `npm run build`: passed; 25/25 frontend tests.
- Rust format and core clippy passed; core tests passed 147 with four intentional worker fixtures ignored.
- Lossless-source passed 26/26; SDK adapter/archive passed 24/24.
- Lossless benchmark: 620,000 bytes, 40,000 nodes, 156.88 ms median.
- Local browser execution was unavailable after Chromium downloads timed out/returned 502/truncated archives; the command passed in Preflight and both supported-target jobs.
- Local desktop compilation was unavailable for missing `pkg-config`/GLib metadata; desktop tests passed on both supported targets.
- Repository-quality run `35624010863`, attempt 1, passed at exact SHA `a720ea3f`.

The correction ledger records S1-S5 and every L1-L16 row. L3's combined dirty-other/
supporting-form case, L8's full delayed adjacent-action set, L9's explicit external-
refresh resumption and L16's non-textarea adapter fixture remain partial.

## Production evidence

Final production run `35624108754` (#75), attempt 1, ran exactly `a720ea3f`.
Preflight job `106414096680` passed. Windows x64 job `106414336722` and macOS ARM64
job `106414336670` passed the browser regression, core suite, official-SDK lifecycle,
real-service `phase-1f-source-save-target-gate`, desktop-boundary test and packaging.
Both then failed packaged smoke and skipped the later scan/inventory steps.

- P1/P2 Windows: the retained log reaches button Save, selection-clean, shortcut Save,
  clean Source Flush, non-Source Flush and `source-complete`; the Source phase passes.
- P1/P2 macOS: outstanding; the packaged flow timed out before `open-source-workspace`.
- P3 both targets: outstanding; synthetic DOM/WebView events are not native Ctrl+S or Cmd+S evidence.
- P4 both targets: pass through the real-service lifecycle gate for disk, projection,
  history, refusal/no-op and reopen persistence.
- P5 both targets: fail; the full production gate did not finish and scan/inventory skipped.

Predecessor runs `35613460026`, `35615201780`, `35616730283`, `35618387359`,
`35620508570`, and `35622463437` were each a single attempt on a distinct coherent
candidate used to isolate demonstrated smoke defects. The final SHA was dispatched
exactly once.

## One continuation action

After independent review, repair or split only the demonstrated pre-Source/post-Source
legacy packaged-smoke tail so a new coherent candidate completes both supported-target
jobs and scan/inventory; then dispatch the existing production gate once for that new
candidate and collect actual native Windows Ctrl+S/macOS Cmd+S evidence. Keep PR #14
draft. Do not merge or begin Phase 1G.
