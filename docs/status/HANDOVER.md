# Current outcome handover

## Selected continuation

Updated 2026-10-15. **Reviewed local implementation; preparing exact-candidate CI.**
Continue this chat and the [owning task](../tasks/active/walkthrough-redesign-implementation.md),
especially its [model-load settings amendment](../tasks/active/walkthrough-redesign-implementation.md#user-selected-model-load-configuration-amendment--2026-10-15).
The user selected configurable Unsloth Studio defaults and warning-only deviations
when a request fits actual verified capacity. The supplied brief selects mocked
acceptance at this stage. No physical endpoint test is required for this amendment.

The checkout is `codex/phase3a-story-logic`. Live Git owns current state; never reset
to an old checkpoint or remote baseline. The reviewed implementation has not yet
been published or dispatched. Root owns commits, integration, review and common
budgets; all existing workers are finished. The existing API researcher independently
double-checked official source and the final implementation, closing all findings.

## Implemented behavior and evidence

AI Settings exposes parallel slots, GPU memory mode and automatic memory fitting.
Defaults1/manual/off and the existing32768 context are suggestions, materialized by
explicit Save; old profiles remain readable without silently adding preferences.
Save remains local. Separate explicit Read/Apply use the saved selected model and
existing native credential, resolve the actual quantization, preserve known unrelated
server options, write only the selected override and read it back. No global setting
is silently enabled, no per-completion write occurs, and Apply does not reload a model.
Reports distinguish requested, saved and actually loaded values. A completed write
with uncertain read-back says unverified update rather than claiming no write occurred.

Loomlight refuses settings management during its active generation without cancelling
that generation. Profile/project changes and shutdown cancel only owned management
work. Unknown/unsafe fields or a resolved row outside the selected model refuse before
write or load reuse. Different effective values warn if the actual request fits;
unknown capacity, real overflow and authentication/load errors still refuse. Existing
user-configured prompt budgets remain limits. No exact Unsloth Studio version gate
is present. Manual loading may strip fit arguments, so saved fitting off is explicitly
not proof of effective runtime fitting. External edits have no server compare-and-swap;
recheck/read-back does not promise atomicity.

Current local amendment proof:27 distinct core cases (profile1, configuration4,
management7, readiness15),12 native ownership/request-host cases,41 renderer/protocol
cases, one focused Apply-copy regression,28 browser states with the actual evidence
checker,25 CI-checker fixtures and actionlint. Typecheck/test compilation passed.
Core correction1 and renderer correction1 were used; second corrections are unused.
Raw paths and all earlier failures remain in the task. Browser source hashes matched
before/after that run; the later Apply-only copy correction has separate DOM proof
and must not be described as identical browser inputs. Exact-candidate CI repeats
current source. Browser fixtures do not prove native WebView physical input.

Earlier Characters/Game setup/Lorebook/history/context proofs remain valid for
unchanged inputs. Two older live successes cover setup and rewrite/include. Six
original live actions remain unrun: Continue, Draft, Card/world-include, Lore, Edit
and rewrite/world-omit. They are not passes and are not prerequisites for this newer
mock-based amendment. Do not replay the successful rewrite/include or restart the
old wrapper. The old reuse-only driver patch remains unapplied/unrun; its exact hash
and proposal live in the task's [earlier result](../tasks/active/walkthrough-redesign-implementation.md#latest-live-result-and-remaining-decision).

## Recovery, budget and next action

Preserve the original walkthrough app's **unsaved synthetic Mara draft**. Ignored
`.toolchains/approval-walkthrough-2026-10-14/session.json` is recovery metadata only.
No Save/Discard/Reload/navigation/close/reuse of that session. **No local production,
package or installer builds; no new native editor launches.** Test compilation and
test-only drivers are allowed. Preserve all other worktrees and unrelated work.
Ordinary profiles/keys, private endpoint details and recovery receipts stay private;
no credential export, owner API/settings call, download, deliberate unload/reload or
service installation is planned. The model-load allowance is exhausted.

Historical common usage: live5/12, reserved response tokens10240/32768, inventory3/4,
loads2/2, pairedCI1/3 reserved and prior shared additional reruns10/10. Failures/reservations
remain charged. The user's separate reset10 LLM allowance is unused; its optional
scope clarification is pending and does not block mocked work. No allowance was
silently reset by the amendment. Local production builds and new native launches0.

Next: commit and publish the reviewed candidate, then dispatch the reserved paired
current-redesign run, ordinal1 of3. Repository validation passed602 files and whitespace
checks passed. The reservation counts even if dispatch fails or is cancelled.
Use only `walkthrough_redesign=true`, the exact40-character candidate SHA and all
other boolean selectors false. Preflight found no open branch PR or pending dispatch.
Required evidence hosts are Windows2025 x64 and macOS26 ARM64; coordination can stay
on this Mac, with no local handoff or broad package/SDK matrix.

Confirm one run identity and record SHA/tree, inputs, run/attempt, status/time and
remaining allowance here and in the task, then publish a docs-only wait successor.
End the turn under WORKFLOW's manual same-chat resume policy; no polling, watchers
or automation. On user resume, inspect that exact terminal run, actual jobs/cases,
manifests, sourceMatchesCandidate, missing inputs, retained executed binaries, privacy
and cleanup. Artifacts retain7 days. A green badge or partial-evidence seal alone
does not qualify the candidate. The docs-only successor does not become the tested
code candidate. No merge/release is authorised; Phase2/3A human acceptance is pending.
