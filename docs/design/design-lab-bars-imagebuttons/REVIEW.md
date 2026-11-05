# Draft review evidence

No design approval is recorded. Production remains gated on Kris's exact runnable
candidate approval and direct source/fingerprint/capture handoff to the implementer.

## Module and export checks

The Design Lab TypeScript check and standalone Vite export pass. A focused pure
resolver check passes the coordinator-verified Ren'Py 8.5.3 native fallback chains,
including Selected + hover choosing Hover even when Selected has an explicit asset.
The one width/height pair scales every sample bitmap. These are module/export
checks, not UI/core or runtime qualification.

## Inline visual rendering

The initial and fallback-corrected comparisons each passed `html_preview` with no
console messages, then displayed through `html_render` in the design chat. The
corrected inline render attachment is
`mcp-launch-5f05660eff093dcb7e20eadcdf24c42d8b3e58d50b2a87c2cc1b5ed72037bc61-c616970f-ba59-49a4-add7-69f5ab2f2fe8-html`.
It contains the self-contained export in a selectable 1280/1024/560px iframe,
scaled to the reply width. Rendering is separate from interactive test evidence.

## Terra attempt 1, blocked before opening the prototype

[Attempt thread](<t3-thread://v2/88c3ca41-b202-47bf-8d09-09bd3411e945/thread:delegated-task:command%3Amcp%3A22f3a769-ec3f-4d02-aa0e-15db9ae78d4f%3Adelegate-task%3Abars-imagebuttons-ui-review-01>)
used gpt-6.1-terra with max effort in its own prepared worktree. There was exactly
one delegate task/run, from 2026-11-05 13:19:36 to 13:26:00 UTC. Its acquisition
attempts were:

1. `preview_status` returned `available:false` with no tab.
   `preview_open(fileURL,reuseExistingTab:false)` returned
   `Preview automation open failed: Invalid preview URL (unsupported-protocol: file:; input length 107). Use an http(s) URL or a schemeless host such as localhost:5173. With preview_open, omit url when creating a new tab to open a blank tab.`
2. The permitted fallback `cua.createBrowserTab('iab',fileURL,{visible:true})`
   returned `Browser is not available: iab`.
3. After app inventory, `cua.getApp({windowId:372903050})` returned
   `Computer Use app approval timed out`.

No prototype tab opened, screenshots were saved, or requested interaction,
viewport or console checks completed. No source changed. This is not two failed
Terra task attempts, and no parent takeover occurred. The coordinator's cancel
request returned `task_not_found` because this design thread owns the task.
The design owner then called `task_cancel` on the original task ID. It returned
`status:completed`. A subsequent read still showed `pendingRequestCount:1` in the
completed child thread. The stale Firefox approval is therefore not confirmed
cleared. No native-browser retry or approval bypass is authorized or performed.

## Authorized synthetic DOM attempt 2

At the coordinator's explicit direction, Sol prepares an ignored temporary copy
of the self-contained HTML, with a bounded DOM driver that waits for the real
mount, uses its controls/callbacks and logs `BAR_IMAGEBUTTON_DOM_RECEIPT` once.
Terra operates `html_preview` on that copy at desktop and compact widths.
The ignored input metadata retains export/test/harness SHA-256 values.
Exact invocations and console output belong to this separate synthetic record.
Test-copy screenshots must not be recorded as exact approval captures.

The [second attempt](<t3-thread://v2/88c3ca41-b202-47bf-8d09-09bd3411e945/thread:delegated-task:command%3Amcp%3A22f3a769-ec3f-4d02-aa0e-15db9ae78d4f%3Adelegate-task%3Abars-imagebuttons-dom-review-02>)
completed at 2026-11-05 13:42:57 UTC. Both planned `html_preview` calls succeeded
with `isError:false`, `appearance:dark` and the exact temporary test HTML.
Neither returned `BAR_IMAGEBUTTON_DOM_RECEIPT`. The first unverified boundary is
completion of the injected script. No individual synthetic interaction assertion
is credited as passed. Results are inconclusive at both widths, not a behavioral
failure or an interaction pass. Exact returned tool text follows:

```json
{"width":1280,"contentHeight":820,"capturedHeight":820,"consoleMessages":[],"screenshot":{"mimeType":"image/png","width":1280,"height":820}}
```

```json
{"width":560,"contentHeight":820,"capturedHeight":820,"consoleMessages":[],"screenshot":{"mimeType":"image/png","width":560,"height":820}}
```

Terra independently verified the temporary HTML SHA-256. It read the metadata's
export/harness hashes without independently rehashing those two files. Sol's
subsequent local `Get-FileHash` verified all three before the delegate result.
The second thread reports no pending requests. Attempt 1's stale Firefox approval
limitation remains unchanged. Two Terra attempts have now ended without completed
interaction proof. No additional delegate, native retry or parent takeover started.

Synthetic callbacks would not establish trusted keyboard/Escape, pointer, native
file-picker, real source/core/history, Ren'Py behavior, or the full repository
`design:check` gate. Those remain unproved, and the synthetic assertions themselves
remain inconclusive in this attempt. The later parent check below supplies separate
focused synthetic evidence; it does not relabel either original attempt.
Kris may supply explicit observed human checks in the rendered candidate, recorded
as human evidence only. No missing automatic gate becomes a pass by inference.

## Reproducible unapproved source

Candidate source commit is `0a6e571eb4c65ea60ce1fa446cd27d2a12985884`.
`npm run design:source` returned fingerprint
`ecd02f2dfb490297d89c1b05e5fb2787cb166868e8ea77a7d1dee72093785373`.
The source remains unchanged while the separate review records are updated.
[Source receipt](source-receipt.json) records full export/test/harness hashes and
the two tool invocations. It is not an approval record. `approval.json` still has
`currentApproved:null` and no approved revision. Exact user selection, captures,
full lab verification and direct approved implementation handoff remain pending.

## Parent's completed focused synthetic check

After the two Terra attempts, the coordinator operated the supported `html_preview`
route using a separate temporary copy. The pinned prototype source and original
test HTML stayed unchanged. The parent replaced timer polling with a
MutationObserver mount wait, awaited real dialog close events, and used microtask
flushes for synchronous callbacks. The mount deadline stayed at 1500ms. No assertion
was removed or weakened. This corrected test scheduling so the renderer observed
completion before capturing the page.

Both dark calls returned `isError:false`, with these complete short console receipts:

```text
BAR_IMAGEBUTTON_DOM_COMPLETION {"width":560,"height":800,"passedCount":9,"failed":null,"evidence":"synthetic DOM callbacks only"}
BAR_IMAGEBUTTON_DOM_COMPLETION {"width":1280,"height":800,"passedCount":9,"failed":null,"evidence":"synthetic DOM callbacks only"}
```

The nine original groups cover all six inert states/fallback hints, switching
layouts without resetting samples, integer-picker Cancel/focus, combined
bounds/dimensions Apply and Undo/Redo, no-op/Cancel/invalid focus, retained Source
and navigation drafts, retained revisions through unrelated edits/remount,
image-picker Cancel/selection/aspect sizing, and missing-image/stale-source refusal.
The reported inner viewport height is 800px; content/captured height is 820px.
These are synthetic DOM callback passes at both widths. They do not prove trusted
keyboard/Escape, native pointer/file-picker, real source/core/runtime, or the full
repository `design:check`. No human design approval follows from test success.

The original parent artifacts remain under the primary checkout's ignored
`.toolchains/51-52/prototype-dom-review/` (`prepare.py`, `parent-dom-test.html`,
`input.json`, `result.json`). Exact console outputs remain in `result.json` and
the coordinator thread. The design checkout retains a separate ignored copy.
These test captures are not approval captures.

Provenance correction: the actual argument passed unchanged from
`[IO.File]::ReadAllText` to both final `html_preview` calls contains 404936
characters and 87 CRLF pairs. Its UTF-8/raw-file SHA-256 is
`0f2c60560176c287c9162eb0d5b35800e281b37d7e74ddb095c31d6be50c1ff8`.
The initially supplied `c04a174acbff2592dc6fb9aa4490382030f7b750beadeca3bee7eece2e53b012`
is the LF-normalized preparation-equivalent hash, not the actual tool-input hash.
Sol independently reproduced both hashes. This corrects metadata only; the
completed assertions and unchanged pinned source keep their original scope.
