# Studio request comparison

Two unapproved drafts use the same fictional saved profiles, fixed synthetic message,
sample completion and request states. Both reuse Loomlight's fonts, colour variables
and icons. This work is browser-only and local. The native request panel remains unchanged.

- [Request console](http://127.0.0.1:5174/?screen=studio-request&variant=console&state=populated&theme=light&viewport=wide)
  combines setup and response in one narrow column. The profile and deadline sit beside
  each other. It suits a short connection check and puts longer results below setup.
- [Request desk](http://127.0.0.1:5174/?screen=studio-request&variant=desk&state=populated&theme=light&viewport=wide)
  gives setup and response separate columns. A stable response area keeps request progress
  beside the selected profile. Compact windows stack the two panels.

Both keep Send and Cancel in a fixed row below the scrollable page content. Starting a
request reveals its progress in the console and in compact windows. The desk and compact
console omit the repeated connection heading so more of the fixed message is visible.

## Controls and retained capabilities

| Control or state | Sample behaviour |
| --- | --- |
| Saved profile | Select Writing studio, disabled Archive studio or unconfigured Draft studio. Show the model and admission status. A labelled profile disclosure holds the endpoint, saved context and response reserve. Disabled and unconfigured profiles cannot send. |
| Response deadline | Accept whole seconds from 30 to 1,800. Show inline feedback and disable Send for invalid values. This is the only editable request input. |
| Fixed message | Display the exact production synthetic prompt as literal text. Project content is excluded. Thinking and tools stay off. |
| Send sample request | Explicitly start one browser-memory request. Lock profile, deadline, reload and sample controls until it ends. |
| Request progress | Show model readiness, model loading, sending, receiving and validation in order. No response text appears before completion. |
| Cancel request | Stop the sample timers and retain cancellation feedback. The copy preserves the real distinction between client cancellation and possible continued server computation. |
| Close panel | Cancel an active sample before closing. Wait during a profile reload. A simulated cleanup failure keeps the panel open with Cancel available. Reopen preserves terminal feedback without another send. |
| Reload profiles | Simulate a read of the same fictional profiles. Retain the last request feedback. Never send. Configuration-change rejection requires reload before another send. |
| Completion | Display literal completion text, finish status, usage availability and context verification. Warn when the loaded context is smaller than requested. |
| Request details | Disclose fictional timing, HTTP status, deadline, input estimate, margin, response reserve, requested/loaded context, finish reason and provider-reported or unknown usage. Retain the sent profile and deadline when selection changes. |
| Refusal, transport error, expired, configuration changed | Retain readable feedback and publish no completion. No automatic retry occurs. |
| Observation or cleanup failure | Retain the active request and Cancel. Cleanup retry succeeds in the sample. |
| Open profile settings | Use browser-only navigation to the Settings draft. No profile is created or changed. |
| Sample controls | Select the next fixture outcome or load fictional profiles into the empty state. These are review controls, not proposed provider actions. |

Named states cover ready, empty, long saved labels with a retained completion and a
retained transport error. Extra sample outcomes cover unknown usage, refusal, expiration,
configuration change, observation failure and failed first cancellation. The sample
preserves the direct choose, inspect, send, read loop. It replaces the floating panel
with two page-level layout experiments for comparison; neither changes product behaviour.

Every request stage, model load, profile reload and output is a timer or fixture in
browser memory. There is no HTTP, native IPC, model operation, credential access, clipboard
write, project/file change, SDK execution, package or CI action. Reset or scenario changes
mount fresh fixtures. Browser proof does not establish native request or provider behaviour.

## Verification and failure history

Chosen evidence host is the local Mac with the pinned repo toolchain and existing
port 5174 server. One initial page cycle and up to two focused repair cycles are available.
The page runner writes its isolated report and captures under the ignored
`.toolchains/design-lab/pages/studio-request/` directory.

Initial preparation typing caught an untyped outcome tuple; a const tuple fixed it.
A separate concurrent Characters typing error belonged to its owner. The next shared
typing check passed. Chromium first refused its sandbox Mach-port registration before
loading a page. The authorised escalation ran the same check successfully. The initial
cycle passed all 32 rendering cases and both layout journeys. Visual review found Send
below the desk's initial fold and console progress below setup. Focused repair 1 pins
the action row, reveals progress and adds visible-action assertions. That rerun passed
all 32 cases and both journeys. Focused repair 2 removes the desk's repeated connection
heading, balances its columns and groups the saved endpoint/token limits in a labelled
profile disclosure. Its rerun passed all 32 cases and both journeys, with no browser errors.

Final source review found that closing during the 350 ms profile reload could leave
Reopen waiting on a cancelled timer. Close now waits for reload, as the production panel
does. Root's combined check on 2026-10-21 confirms its new busy-Close assertion and
the explicit configuration-change Send assertion. All 32 Studio request cases and
both journeys pass. No further page-owned cycle was started.

Visual inspection covered both layouts in light and dark at 1100 × 720 and 560 × 640,
plus loading, receiving, completion with expanded details, compact retained error and
long profile/result states. Final captures include the fixed action row and profile
disclosure. Pinned-toolchain TypeScript passes. Cumulative use is one initial page cycle
and two focused repair cycles, three successful browser runs, one sandbox-blocked launch
and the preparation typing correction. Both approval entries remain null.

The focused journey checks profile admission, deadline bounds, explicit send, all five
stages, raw-detail disclosure, literal completion, usage/context status, retained result
identity, reload, every failure outcome, cancellation, close and cleanup retry, empty-state
recovery and compact completion/error rendering. Root owns the final combined check,
approval/source isolation and production-build exclusion.
