# Current outcome handover

## Windows Studio request lifecycle: capability blocked, cleaned up

**Outcome/location:** one serial Local Windows x64 owner reviewed and corrected the
selected bounded Studio synthetic JSON request, continuing published `0a91e20` on
Caldwell-41/Renpy-editor, `codex/provider-qualification`, existing
`worktrees/provider-qualification`. Clean local `9d7a6d6` fast-forwarded after ref/
ancestry inspection. Unrelated worktrees are untouched. Shared fixes are locally
committed as **`0cec43ff7785713d9d9ba0a8f53391cd92ccdfe1`**; subsequent controller and
blocker records are local too. **Do not push**: explicit approval is required only
after the selected work is complete and reviewable. No subagents, other host or CI.

[Owning scope/acceptance](../tasks/active/phase-2-initial-llm-assistance.md#windows-request-acceptance-and-capability-blocker--2026-10-09)
and [public partial metadata](../tasks/evidence/2026-10-09-windows-studio-request-partial.json)
contain exact proof and failures. Two rejecting regressions demonstrated partial input/
reasoning usage exceeding saved limits and valid completion discarded while Save owned
the project service. Corrected publication waits off-thread within the captured deadline,
retaining cancel/configuration/project/shutdown guards. Tests run on Windows via an
injected public fixture reader, with no OS credential operations or backend change.
Focused passes: core request 8; desktop 6; fixture 1; frontend/protocol 11; Windows
controller 6; shared controller 4; TypeScript, scoped format and repository validation.

**Package:** build 1 passed the established pinned offline Tauri NSIS route in 70.224 s.
No installation or system/security change. The ignored executable is
`app/.toolchains/windows-studio-request/package-1/loomlight.exe`, SHA256
`b293c4340dd52af528ff5c5b5467f51273698984b4339e7a745dff49b1848266`.
Installer SHA256 is `a73e4ec2c440be3f83bef8cf3d0819d26abf336d7d5db4d3c5dfa8fe047c42fb`.
Privacy scan passed. The final audit verifies packaged runtime inputs still match;
post-build changes are external controller/tests/docs only. Reuse this package if
those hashes remain equal; no rebuild for the capture blocker.

**Native attempts:** launch 1 refused the controller's CRLF-translated marker during
setup, code 101, 0.886 s, no window/request/credential. The controller now writes exact
LF bytes; a regression passes. Original marker hex/failure receipts remain. Launch 2
opened the synthetic welcome screen with readable native accessibility. Tab/F6 stayed
on the WebView container; accessibility clicks on the actual current app refused with
`coordinate input geometry is unavailable`. The user said not to worry about screenshots.
Automatic approval review rejected task-app capture on that basis; a clarification
asking permission for captures needed for native input remains unanswered. Do not
retry unchanged or claim the tool's input failure is a product acceptance result.

Native Alt-F4 closed launch 2 normally, code 0, 509.029 s. Its stdout receipt reports
`activeWorkers: 0` and `cleanupComplete: true`. Both launches made zero HTTP requests
and created zero credentials. Both exact app PIDs are absent, both server lifetimes
stopped and Windows listener metadata confirms no listener on fixture port 46082.
Both precise marker/untouched-seed roots were removed. No credential enumeration,
secret-value diagnosis, uncertain ownership recovery or unrelated data cleanup occurred.
Preflight task window/file cleanup is complete. No owned app/server/request is pending;
window bindings are invalid. Do not reacquire or launch an exited app as observation.

**Budget:** this selection used **1/2 package builds and 2/3 app launches**. Historical
Windows 7 builds/12 launches become **8 builds/14 launches**. Completed Mac request
consumption remains **1 build/2 launches**. One build and one launch remain; this is a
ceiling, not a target. No previous budget or failure was reset. First capture/approval
wrapper failure lacks saved duration and is not a passed observation; recorded native
observations and whole launch are distinct from application response/cleanup deadlines.

**Next action after the capability decision:** allow task-app captures needed for input,
then establish actual native click and focused typing on a precisely owned preflight
window before the final launch. Keep screenshots outside Git. The existing environment
is in ignored `app/.toolchains/windows-studio-step3/environment-build6.ps1`. Record
`app/.toolchains/windows-studio-request/launch-3-correction.json` with the specific
capture/focus correction, verify executable/runtime hashes, then run the existing
controller `python scripts/windows-studio-request.py --launch 3 --package 1` from
`app/` with host capability. Do not consume it without the resolved input prerequisite.
The planned sequence is reported completion, stall/edit/Save/cancel, auth error,
unknown usage completion, then stalled active-request normal exit. Public fixture key
is defined in the controller; native app entry/storage remains authoritative. After
active exit, its supported exact-target ownership-metadata cleanup removes only the
new app-created synthetic entry, proves absence and removes the owned fixture. Do not
repeat passed credential scenarios or use real endpoints/content.

All originals stay under ignored `app/.toolchains/windows-studio-request/`: build
attempt/preflight/runtime/terminal, both launch folders and accessibility observations,
pre/post-fix logs, marker correction, cleanup, listener and blocked-final-audit receipts.
The failed external connect audit did not retain its return value and proves no refusal;
the later successful listener query supplies absence. Preserve sandbox loopback/Tauri/
TEMP failures and all scaffolding errors rather than backfilling them as passes.

**Acceptance boundary:** required packaged request/UI/Save/cancel/active-exit proof is
missing. This selection is not ready for push approval or closure. Mac's prior native
four-request and credential proof covers unchanged scenarios; the shared corrections
need only the focused Mac core `ai_request` and desktop `ai_requests` test recheck for
partial usage and completion overlapping Save, including invalidation. Do not execute
another host from this task or silently claim those rechecks passed. Full 2A.2/live
Studio/Phase 2 remain incomplete. No installation, identity/security changes,
provider/auth expansion, SSE, proposals, CI, merge/release or next feature is selected.
