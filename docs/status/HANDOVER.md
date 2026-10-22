# Current outcome handover

## L01 owned blank screen, CI1 order correction verified

The user selected [L01 #34](https://github.com/Caldwell-41/Renpy-editor/issues/34)
on 2026-10-22. Mac ARM64 remains the sole writer on `codex/phase3b-screen-designer`.
The four reviewed commits are published through
`79496c28aba9c91db2a93a97c7b3736396b503e1`, with product code at `6be4f24`.
Both independent review axes have no remaining code findings. The
[source contract](../DATA_MODEL.md#project-lifecycle-metadata) and
[evidence](../tasks/evidence/owned-blank-screen.md) own behavior and detailed results.
Frontend 223/223, routine core 401/0, production renderer/core, retained Help regression,
Mac SDK and current signed Mac package proof pass. Failed attempts remain retained.

[CI1 run 39749388462](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39749388462),
attempt 1 at the exact full SHA above, failed on both targets. Each passed frontend
223/223, six Python gates and selected core Screens/metadata/Source/migration cases,
then failed because the desktop check preceded the frontend build. The exact
missing-frontend error reproduces in a clean export; build then desktop check passes.
The workflow-only order fix preserves all checks and selectors. Exported frontend
hashes match the signed package inputs. Both failed core executables, candidate files,
identity manifests and logs are downloaded and verified under ignored `ci-01`.
Browser and Windows SDK/package/native steps were skipped, with reservations retained.

Next publish the verified workflow correction and dispatch focused CI2 for its exact
commit, `owned_blank=true`, ordinal 2. The original allowance covers this correction.
Register that confirmed run to this thread with ci-watch, as explicitly selected by
the user; require a running-worker acknowledgement and end the turn immediately.
On its event, match thread/run/attempt/SHA, acknowledge receipt, then audit required
jobs/cases, exact artifact executables and cleanup before acceptance. CI1's watcher
receipt is recorded; its failure is audited, not a pending operation.

Cumulative use/reservation is local 22/18 (original ceiling 27), CI 2/2 (ceiling 3),
Mac packages 4 including the approved one-package supplement, native 0/2 and SDK
operations 4/4. Windows package/native 2 and SDK operations 4 are reserved through
CI2. CI1's skipped expensive steps stay charged. No fifth Mac package is authorized;
application/package inputs are unchanged by this workflow-only correction.
Mac native proof needs an actually unlocked desktop; lock checks remain true and
no launch is attempted. Preserve unrelated policy/instruction edits, domain/triage
guides and protected recovery below. No PR, merge or release is selected.
L01 stays open; later editor/canvas/phase acceptance remains separate. The retained
policy/Help record below predates this selection.

## Phase 3B migration and retained Help audit, 2026-10-22

Branch codex/phase3b-screen-designer. The bounded Help workflow has functional
qualification on Windows x64 and signed Mac ARM64. Read the
[owning brief](../tasks/active/help-screen-production.md) and
[CI3 terminal audit](../tasks/evidence/help-screen-production.md#ci3-terminal-audit-2026-10-22)
for scope, package hashes, artifact identity, receipt limits and cumulative usage.
The orchestrator approves the bounded functional implementation after independent
CI3 artifact/source review and the accepted Mac evidence. The original findings and
subsequent functional blockers are closed. Material flow-v1 differences still prevent
full sign-off; full Screens and Phase 2/3A human acceptance are separate.

CI3 run 39712450128, attempt 1/ordinal 3, exact candidate
c2d9f457777dc78975779cb0583f6d1cc494755a, completed successfully at
2026-10-22 02:59:48 UTC (12:59:48 AEST). Windows job 119606706974 ran every required
step. The retained ZIP digest matches GitHub metadata and the upload log. Both service
aspects (1280x720 and 1024x768) compile/lint, measure the renderer-accepted 760x360 frame
in game context, observe staleness and clean up. The packaged native case passes all
seven stages through source/history/Cancel, validation, geometry, stale Stop and reopen.
Raw validation exits 0; all three owned Windows Stops retain -1073741510 with cancelled
phase, untruncated error-free output and complete cleanup. The native receipt records
explicit Stop intent and Windows target. Disk bytes match; no source bytecode/saves or
scratch jobs remain. App exits 0. Input is synthetic DOM input in the real WebView.

Source 83e4b36 corrected three qualification gates without changing product Stop
behavior. CI2 remains failed with its original receipts. Accepted signed Mac package 3
and native launch 2 evidence is reused; no Mac repeat occurred. The Windows package
hashes are fresh-build runner receipts, not locally rehashed uploaded binaries. Artifact
12398496866 expires 2026-10-29; an ignored copy, raw job log, metadata and audit summary
are retained under .toolchains/help-screen/ci3-audit. No private artifact is committed.

Final cumulative use is local batches 15/15 and CI dispatches 3/3; Mac packages 3/3,
native launches 2/3 and previews 7/8; Windows packages 2/2, native launches 2/3 and
previews 4/4. CI1/CI2 failures stay charged. No CI4, rerun, new local batch or unrelated
native repeat is authorized. No operation, polling loop or worker audit remains pending.

The user requested overall 3B progress before starting further implementation and
added [canvas agreement with Ren'Py](../tasks/reference/phase-3b-screens.md#canvas-agreement-with-renpy)
as a requirement. It remains unimplemented and separate from the pending flow-v1
editor-layout decision. Neither gate has visual acceptance; no execution allowance
is renewed by the progress report or requirement record.

The user authorized the reviewed baseline, 39 GitHub issues and scoped ownership
cutover on 2026-10-22. Baseline `6d78010` is published; all 39 bodies,
38 native parent edges and 41 native start edges are verified.

Remaining 3B delivery is mapped in [the GitHub parent](https://github.com/Caldwell-41/Renpy-editor/issues/22). Existing docs remain
owners until the verified ownership commit is published and the parent records its
cutover receipt. No child is selected for execution. After that receipt, the next
action is selection of a bounded work ticket with its entry gate and finite allowance.
Approved product requirements and detailed evidence retain their repository owners.

The user selected separate local commits for the completed documentation maintenance
and these Phase 3B records. Scoped terminal records may
publish by ordinary fast-forward to origin/Caldwell-41/Renpy-editor/
refs/heads/codex/phase3b-screen-designer. This docs-only successor records c2d9f45 as
the tested candidate and needs no package matrix. Preserve protected apps/drafts,
pinned flow-v1 and ignored receipts. The earlier docs-only selection authorized no push, PR, merge or release.
The migration selection above now authorizes only its reviewed branch publication.

## Retained product state and next work

Screen builder is approved as `flow-v1` / variant `flow`, dated 2026-10-22. The
[approval JSON](../design/design-lab-screens/approval.json) pins source
`3c7ea31d8210538cc987a2d2f4ceb8b7aa8f5437`, fingerprint and 13 reviewed captures.
[The Screens contract](../tasks/reference/phase-3b-screens.md) owns agreed product
scope and points to the completed approval/browser audit. Screen notebook and Canvas
focus remain drafts. Use [INTEGRATION](../../app/design-lab/INTEGRATION.md) for
production work; approved source/captures stay pinned. A new experiment needs a new
revision. The selected Help outcome above has its own exhausted local/preview allowance;
full Screens and phase acceptance remain pending.
The lab's last recorded port is 5174; verify availability before reuse.

The [early 3B CI audit](../tasks/evidence/phase-3-history.md#ci1-terminal-audit-and-prototype-continuation)
qualifies source `0ef174877cbe5ae3fd883afb92940de68916b04a`, tree
`521a550ef7d82ecf970a0527a1bab368062bad63`, run39555526201, on Windows x64/macOS
ARM64. Later lab/docs changes do not replace that SDK candidate. Earlier 3B allowances
are closed. No verification or CI is pending for the completed design/proof outcomes.

The [earlier full-app comparison](../tasks/active/browser-ui-design-lab.md)
remains review_ready with 24 app layouts and the starter unapproved. Its original
scope, evidence and fictional controls remain in that task and its design notes.

[CI reliability](../tasks/active/ci-harness-reliability.md) is accepted at
`e00160b962ac09d70cb95000a6c10e4c205895c7`. Its final audit owns both-target
portable/rendered and selected Windows native proof, retained failures and closed
allowances. Mac native input, signed-Mac/real Studio and phase human acceptance are
separate. No maintenance operation remains pending.

Thinking/default-response and draft connection behavior remain qualified at
`36feff12ff9acfc1cd6eb0832da3abba243b9463` by the
[Phase 2 CI3 audit](../tasks/evidence/phase-2-execution.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16).
Paired CI3/3 is closed. The source-map-js development advisory remains open; no
lockfile update or zero-advisory qualification is selected. Signed-Mac/real Studio
and Phase 2/3A human acceptance remain pending. The walkthrough is paused at Step3.
Its model-load amendment has separate automated proof under the
[walkthrough task](../tasks/active/walkthrough-redesign-implementation.md).

The earlier automatic push review rejected publication without explicit
payload/destination permission. The user now explicitly authorizes the reviewed
migration baseline, 39 issues and 3B ownership cutover to
`origin/codex/phase3b-screen-designer`. No product implementation, PR, merge or
release is selected. Preserve unrelated work and the protected native state below.

## Native recovery and remaining acceptance

Package1/2 passed signature/ARM64/installer checks but is stale after earlier app changes.
Retain package-01/Loomlight.app and receipt. Executable SHA256
77e818cce4a0cbbdfcd0e3547714a46ab95b5d223a757a1b1bfff152b3867d19;
installer6701c193eb1f53587b7f73b276a41bec6fba673f6a468f975b05f92ac9d212ee.
A fresh matching signed package needs its second reservation and the approved identity.

native-root.json identifies the disposable Beck/Henry fixture, isolated owned profile/key,
thinking on/context32768/response16384. Original profiles were unchanged. Keep private
endpoint/key/local paths ignored; do not prepare another fixture or read its key just
to resume. Preserve initial noncanonical-path refusal/recovery. A read-only 2026-10-22 check found no running `loomlight` process. Protected draft
contents were not inspected; preserve existing recovery files and recheck before
native continuation. Do not Save/Discard/Reload a protected draft or bypass single instance.

For the remaining authorised native sequence, reserve launch 1 and use the existing
isolated phase2-studio environment with the matching signed package. Exercise native
entry cancellation and saved-profile draft Connect → model → Save, explicit response-
format test and Beck bar-scene generation. Reserve output before sends. Review → Save
→ Approve → reopen must preserve writing/settings without reasoning. Reserve launch2
for reopen, keep uncertain attempts charged and avoid automatic resends/model operations.
Current other counts: packages 1/2, launches0/2, live0/4, output0/65536, cached loads0/1.
Older comparison/model-load/live/CI allowances stay separate/closed. Walkthrough remains
paused Step3 with builds2/2, launches2/3 and protected recovery/session files. Full
native/Studio and Phase2/3A human acceptance remain pending.
