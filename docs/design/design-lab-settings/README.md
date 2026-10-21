# Settings layout comparison

Two unapproved browser drafts share the same fictional preferences, profiles, prompts
and behavior. They import production fonts, presentation styles and icons. Neither
replaces the earlier approved Settings references.

- [Settings book](http://127.0.0.1:5174/?screen=settings&variant=book&state=populated&theme=light&viewport=wide)
  uses a category rail and one reading pane. It keeps the familiar category hierarchy
  visible and gives forms more vertical room. Compact widths turn the rail into a
  horizontally scrollable category row.
- [Control desk](http://127.0.0.1:5174/?screen=settings&variant=desk&state=populated&theme=dark&viewport=wide)
  uses a horizontal category shelf and paired workspace cards. Its editor sample sits
  beside Appearance at wide widths. Compact widths use a small category grid and
  stack the controls. The sample illustration disappears to preserve editing room.

The book suits repeated visits to a known category. The desk makes the available
categories easier to scan but spends more height on navigation. Both use the same
application/project scope switch, real form controls, direct writing defaults and
sticky provider Save/Discard actions. Shared behavior keeps the maintainer from
having to repair two independent implementations of draft handling or validation.

## Capability and control decisions

| Existing capability | Prototype placement and purpose |
| --- | --- |
| Workspace appearance, interface size, remembered layout and reset | Workspace keeps everyday adjustments direct. Theme swatches show the exact production palettes; changes affect this preview only. |
| Source text size and separate session drafts | Workspace links to Source editor. Both show the same editable size choice and code sample. |
| Keyboard shortcuts | Search filters the existing command list. Mac labels use Command; the Windows app uses Ctrl. |
| About and basic diagnostics | About opens an inspectable fictional diagnostic summary before simulated copy. It includes no project text or paths. |
| Local provider profiles | The profile selector keeps each draft while browsing profiles, categories and scopes. Reload requires confirmation when drafts exist; removal identifies the selected profile. |
| Name, endpoint, private HTTP, native API Key, Connect, model, Save | The form presents the agreed order. The fictional native-entry dialog has no input and explicitly refuses real credentials. Connection shows progress, Cancel, failure and retry without losing the draft. Endpoint changes require a new fictional key and connection. |
| Context, response and reasoning defaults | Writing defaults stay beside Connection at wide sizes and directly below it when compact. New profiles use 32,768 context, 16,384 response and Thinking on. Existing profile values persist. |
| Validation | Name length is 80 UTF-8 bytes without control characters; context is a whole 256–2,000,000; response is positive and leaves more than 128 context tokens. Sampling and slot limits match the existing controls. Errors retain the draft. |
| Model loading and sampling | One labelled Advanced disclosure holds slots (1), Manual memory mode, fitting Off, temperature (1), Top-p (0.95), saved-model read/apply and the synthetic response test. Separate saved/effective language avoids suggesting that Save reloads a model. |
| Credential removal and test cancellation | Advanced tests operate only on a clean saved profile. Key removal is confirmed and keeps writing settings. Both connection and response tests can be cancelled. |
| Current project SDK and resolution | Project overview shows pinned 8.5.3 and 1920 × 1080 as read-only context and links to the Runtime draft. |
| Action system prompts and project history | Six action choices keep separate drafts. Explicit Save, guarded Discard, Undo/Redo and a saved-versus-baseline restore dialog preserve the existing project prompt workflow. Legacy style notes remain inspectable and excluded. Shared world/tone stays in Lorebook. |
| Context preparation | Saved targets, per-preview task/limits, shared world/tone and exact approved revision checkboxes lead to an inspectable fictional payload. Stale references stay disabled. Editing a field clears the result; dirty prompts block preparation. Edit Scene directs the writer to Story's batch preparation. |

The drafts add no provider or project capability. Browsing Settings retains drafts in
memory instead of forcing a discard at each category change. That prototype behavior
needs agreement before production integration. Cross-page navigation warns before
leaving any dirty sample. Every mount starts fresh.

## Simulation boundary

No native window, project file, provider, credential service, SDK or model is used.
Connect, test, read, apply, reload, save, removal and copy are browser simulations.
There is no credential input, clipboard write or network/model request. Endpoint
admission and context sizing illustrate the existing workflow; they do not qualify
the real backend's transport policy or token estimates. System theme uses the sample's
initial theme so it remains deterministic. Source content is fictional and never runs.

## Verification history

Chosen host is the task's local Mac with the pinned repo toolchain. Settings used one
initial cycle and two focused repair cycles. No page-owned cycle remains.

1. Lab TypeScript passed. The first browser launch failed before rendering because
   the sandbox refused Chromium's macOS Mach port. The authorized local retry kept
   the same initial cycle. Its 32 rendering cases passed; the interaction check
   expected one result for `dialog`, but the correct search also matched two dialogue
   commands. The check now searches `Dismiss`.
2. Repair cycle 1 passed the matrix and found an accessible-name defect. The row
   helper replaced a button's visible name with the row title. It now labels only
   input/select controls, preserving action names.
3. Repair cycle 2 passed Lab TypeScript, all 32 rendering cases and both interaction
   journeys on Chromium 155.0.8059.85. The journeys cover appearance, shortcut search,
   diagnostic simulation, key-entry cancel, connection cancel/retry, validation,
   retained drafts, Save, test cancel, model-load simulation, reload/removal guards,
   prompt history/restore preview, context invalidation, exact references and private
   HTTP opt-in. Fresh mounts reset the fictional data.

The eight initial layout/theme/size images were visually inspected, plus wide response
validation, compact dark connection failure and a project payload. Final visual review
added inline field errors, visible connection-failure feedback, disabled primary-button
contrast, exact palette swatches, density scaling and a zero-bottom sticky save bar
to avoid compact button clipping. Root's combined check on 2026-10-21 confirms these
corrections, with all 32 Settings cases and both journeys passing. It also verifies
the corrected fictional SDK pin, 8.5.3. Parent visual review confirms readable inline
response validation and compact connection-failure feedback with reachable Save.
The page report predates these corrections; the full-app report records their proof.

Ignored evidence is under `.toolchains/design-lab/pages/settings/`. `report.json` is the
passing page result. `report-initial-environment.json`,
`report-initial-shortcut-check.json` and `report-repair1-diagnostics-label.json` retain
the failed attempts. Initial captures use `<book|desk>-<light|dark>-<wide|compact>.png`.
Additional captures use `<book|desk>-response-validation.png`,
`<book|desk>-connection-error-dark-compact.png`, `<book|desk>-private-http-compact.png`
and `<book|desk>-project-context.png`. No native/product acceptance is claimed.

Approval remains null for both layouts in [approval.json](approval.json). Promotion
and later integration follow [ADR 0017](../../adr/0017-design-approval-and-app-integration.md)
and [INTEGRATION](../../../app/design-lab/INTEGRATION.md).
