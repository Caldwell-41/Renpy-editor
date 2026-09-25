# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b Runtime UI and navigable diagnostics, `in_progress`.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Entry:** `78f051e382b048f1e8ee73f5add7a8072608e474`.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.
**Application candidate:** `931684dd59ce319bd98f0028df98a3023ced7740`.
**Candidate tree:** `b6432353974e8a7f8818a8e8f91fadca1b29ccb9`.
**Final production run:** [36194188820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36194188820),
**attempt 1**, manually dispatched once with package upload requested; exact head SHA
matches the candidate. Created `2026-09-25T21:56:19Z`; initial inspection: **in_progress**,
no conclusion. **Awaiting CI / manual resume.** No automatic watcher is claimed.
This publication update changes documentation only after the application candidate.

## Authority and implemented behavior

Complete only 1G.2b and agent-run verification. The user explicitly excludes physical
testing, acceptance, merge, optional Git and Phase 2. R1 history remains preserved.
Read [active plan section 6 and ledger 14](../tasks/active/phase-1g-branches-runtime-git.md#14-1g2b-execution-ledger),
then its final G1/R1/R2 contract and [TESTING](../TESTING.md#phase-1g-testing-ownership-and-cadence).

The toolbar and Diagnostics/Runtime panel now provide explicit Validate (compile then
lint), normal Run, responsive Stop, inspectable/revocable session consent and deliberate
Source revision choice. SDK locations bind to the launch manifest and are rechecked in
the core before Source navigation. Output, diagnostic count and messages are bounded;
static findings and prior validation are distinguished. Script edits can continue during
play; ownership restrictions remain core-enforced. CRLF Source selection translation and
independent diagnostic reads and ordered Source/SDK submissions address failures found
by real packaged verification. Native close/quit enters the same Stop/draft flow; its
no-payload main-window exit command requires no open project and confirmed cleanup.

## Verification and next bounded action

Local results, earlier failures, layer limits and corrections are in ledger 14. R2 and
final capability review remain pending until the coherent candidate's supported-target
matrix, complete logs/artifacts and input hashes are inspected. The five packaged cases
use the actual WebView, visible controls, real IPC/service and pinned SDK; their synthetic
DOM events are not native keyboard or human acceptance evidence. Do not substitute
browser mocks or official-SDK wrapper skip markers for a required gate.

The application candidate was committed and pushed non-forced on the existing branch;
remote head and PR #17's matching SHA/draft/open state were verified before dispatch.
No duplicate matrix or R1-only run was launched. The combined production workflow owns
final full core, explicit SDK/R1/R2, actual package cases and legacy boundary smoke.
The older R1 branch trigger is now manual-only to avoid duplicate expensive runs.

**Next action:** inspect this exact run/attempt, complete job logs and both
`phase-1-production-evidence-*` artifacts, plus requested package artifacts. Verify ZIP
size/digest/CRC and each `runtime-ui-inputs.json` candidate/tree, target, executable hash
and all 93 input hashes against Git blob bytes. Require each of the five
`runtime-ui-{compile,lint,route-a,route-b,runtime-error}` JSON/log pairs to have passed,
no timeout, exit 0 and confirmed cleanup. Check full core counts/ignored wrappers,
explicit SDK markers, Branches budgets, renderer focus/resize and the legacy smoke
independently. A synthetic key event is not OS-native key delivery; that remains the
later human session under TESTING, which is not authorised in this checkpoint.

If a required gate fails, record the exact failed evidence and fix only the bounded
1G.2b finding before a justified replacement run. If still pending, preserve this
manual-resume record and stop; AGENTS/WORKFLOW prohibit repeated model polling.
Do not dispatch again or run packages solely for this documentation publication.
Keep PR #17 draft/open and publish the evidence assessment after review. No local
verification process remains, and no application edit is left unpublished.

The next bounded task is to inspect the recorded final run and its artifacts, resolve
only evidenced 1G.2b findings, and publish the G1/R1/R2 assessment. Stop again before
physical testing, acceptance, merge, optional Git or Phase 2. A failed/skipped/missing
required gate leaves this checkpoint incomplete.
