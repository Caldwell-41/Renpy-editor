# Phase 1F — native P3 manual acceptance

## Closeout outcome record — 2026-09-22

Entry HANDOVER at `22479027008342bda0d4601f195a006116373a4e` explicitly records the
user's confirmation of all three contexts on both targets. These are user-reported
outcomes, not independently observed native tests. Earlier untested instructions below
are the historical procedure; this result record supersedes their status.

| Target | P3-A dirty Source | P3-B clean Source Flush | P3-C non-Source isolation |
| --- | --- | --- | --- |
| Windows x64, Ctrl+S | User-reported PASS | User-reported PASS | User-reported PASS |
| macOS ARM64, Cmd+S | User-reported PASS | User-reported PASS | User-reported PASS |

Beat editing/insertion was also reported working. Mac testing followed the user's
`xattr -cr /Applications/Loomlight.app` workaround. During 1F-CLOSEOUT-CORRECTION the
user confirmed both installations used build #87 replacement installers and specified
macOS 26.6.2; Windows was described as “the latest windows version”, without a numeric
version/build. This is user-reported package provenance, not independent binary
inspection. Do not invent screenshots, per-step observations or installer hashes, or
repeat unchanged native Save tests. Exact Windows version/build remains unspecified.
Phase 1F acceptance is blocked by [independent review finding F4](phase-1f-save-correction.md#725-independent-correction-review--f4-blocks-closeout).
Signing/notarisation remains the later DIST-MAC-01 limitation, not a native Save failure.


**Prepared:** 2026-09-22.
**State:** six user-reported native passes recorded above; build #87 and macOS 26.6.2 confirmed by the user; numeric Windows build unspecified. Corrected-candidate #88 validation passed; independent review found F4 (P2), with all six Save passes preserved.
Do not use #85. See [the verified evidence](phase-1f-save-correction.md#719-build-87-replacement-package-verification).
**Scope:** the three required native Save contexts on Windows x64 and macOS ARM64.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft PR #14.
**Validated application candidate:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`.
**Replacement package build ref:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`.
This corrects the Scene/Beat JSON contract defect in the previous #85 packages.
Run #86 failed formatting and produced no replacement packages. Formatted replacement
run #87 passed all target gates and actual package uploads. ZIP hashes and integrity
were independently verified; native outcomes are now recorded above, with local build #87 identity subsequently confirmed by the user.
Version `0.1.0` alone does
not identify this candidate: retain the run and commit below.

The user explicitly requested Windows/macOS builds, publication on the repository,
and this detailed checklist after independent review. That authorises the package
build and documentation, superseding the previous no-redispatch boundary for this
purpose only. The subsequent Beat-commit defect report authorises its bounded correction. No merge,
Phase 1G or new automation is selected.

## Corrected build #88 follow-up — 2026-09-22

The historical #87 procedure/results below remain intact. Corrected build #88
(`35732725675`, attempt 1, `f452d0a8c1599b05650ae2e835d14d9f86f14653`) passed both
automated targets. Package/evidence ZIP hashes and contents were verified; downloads
and installer hashes are in [ledger section 7.24](phase-1f-save-correction.md#724-build-88-corrected-candidate-verification).
No native #88 installation or manual F1–F3 pass is claimed. Preserve all six #87 native
Save passes. Independent review found F4: selection retention leaves Apply Both disabled.
No extra native F2/F3 gate is required for the targeted review. After an authorised F4
correction, focus native follow-up on selection-only re-enabling and stale draft/external
refusal using verified corrected packages. No new native pass is claimed here.

## 1. Download and identify the packages

Package-producing run: [35719829561 (#87), attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561).
The existing production workflow was dispatched once with `upload_packages=true`.
It builds both supported targets and uploads each package only after that target's
production checks pass. The upload step is allowed to fail without failing the job,
so a green job alone is insufficient: verify that the package artifact exists.

On the run page, scroll to **Artifacts** and download the applicable package archive:

| Computer | Expected artifact | Installer inside |
| --- | --- | --- |
| Windows x64 | [Download package 10690749279](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561/artifacts/10690749279) | `nsis/Loomlight_0.1.0_x64-setup.exe` or `msi/Loomlight_0.1.0_x64_en-US.msi`; use one |
| Apple Silicon Mac (ARM64) | [Download package 10691460673](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561/artifacts/10691460673) | `dmg/Loomlight_0.1.0_aarch64.dmg`, containing Loomlight.app |

Do not use the similarly named `phase-1-production-evidence-*` archives as installers.
Artifacts require repository access and have seven-day retention; download and keep
the original archive locally. Both expire on **29 September 2026**. Exact archive/installer hashes are in
[the verification ledger](phase-1f-save-correction.md#719-build-87-replacement-package-verification).
These are pre-acceptance development packages, not a stable release or an Intel Mac
build. Signing/notarisation is not configured in the current packaging configuration.

- [ ] The replacement run recorded in HANDOVER is terminal and both target jobs passed.
- [ ] Both package artifacts exist, and the downloaded archive is from this run.
- [ ] Record the run URL, complete build SHA, artifact name/ID, installer filename,
  OS version, architecture and test date in section 7.
- [ ] Optionally record a SHA-256 checksum of the downloaded installer. This identifies
  the exact file tested; a locally calculated checksum is not a publisher signature.

Extract the ZIP before installing. Close any older Loomlight process first: the
single-instance guard can otherwise focus an older application. On Windows, use the
chosen installer and launch Loomlight. The installer may need network access for
WebView2 if it is absent. On macOS, open the DMG, copy Loomlight to Applications and
launch that copy. If installation or launch is blocked, capture the exact message
and report **BLOCKED**; do not disable system-wide protections to complete this test.

## 2. Create an isolated test project

Allow about 15–25 minutes per target after installation; initial SDK download can
take longer. Use a fresh project on each computer, not a real game or synced project.
Use the physical keyboard or normal OS-delivered remote keyboard input. Do not use
browser JavaScript, `dispatchEvent`, developer tools or the packaged smoke mode.

1. Launch the installed application normally. Record whether the Welcome screen opens.
2. Select **New Project**. Use a title such as `P3 Windows Test` or `P3 Mac Test` and
   an empty local destination. Record only the project-relative file path in evidence.
3. Select a compatible Ren'Py **8.5.3** SDK. Use **Install verified 8.5.3** or
   **Browse existing SDK** if necessary. Node, npm, Rust and Codex are not required
   to run the packaged application. Git initialisation is optional for this test.
4. Finish **Review & Create**, then open **Story** and its initial Scene.
5. First edit and commit the starting narration to confirm Scene commits work.
   Then use **Add Beat**, choose **Narration**, enter `P3 baseline`, and commit the
   new Beat. If either operation reports **The Scene operation is invalid**, stop
   and record setup as blocked; do not continue or mark native Save as failed.
   Close and reopen the project; confirm both narration changes remain before P3-A.
6. Use **View in Source** for that Beat, or open **Source** and select its Scene
   `.rpy` file. Locate the quoted narration text. Keep its quotes and indentation intact.
7. Confirm Source is clean and the project reports **Saved**, with no modal,
   conflict, recovery warning or other draft. If setup fails, record that separately;
   the native Save checks have not yet run.

Keep a read-only external view of this `.rpy` file available to verify disk contents.
Reload that view when checking it; do not edit the same file externally during testing.
If practical, record the app window and status area while pressing the shortcuts.

## 3. P3-A — dirty Source accepts through the native shortcut

Repeat on Windows with **Ctrl+S**, and on macOS with **Cmd+S**.

1. Click inside the Source text editor. Change only the text `P3 baseline` to
   `P3 native saved Windows` or `P3 native saved Mac`; preserve quotes/indentation.
2. Confirm the draft is dirty / **Pending validation**. Check the disk file still
   contains `P3 baseline` before Save. A retained draft is not yet accepted source.
3. With focus still in the editor, press the native shortcut once and release it.
   Do not click **Save Source**: that would test a different input path.
4. Observe completion. The draft becomes clean, editing remains usable, and the
   project becomes **Saved** because this fixture has no other pending work.
5. Reload the disk view: the new marker must be present. Move the caret/select text,
   then switch to Story and back to Source: selection/navigation must not re-dirty it.
6. Story must show the accepted narration. Close the project and reopen it: the
   saved marker must still be present, with no save/discard prompt for that clean file.

**Pass:** real keyboard Save accepts the intended edit, clears the draft and persists
it across reopen. **Fail:** no response, wrong text saved, draft immediately becomes
dirty again, fallback reports success without accepting the text, or an error/lost edit.
Record exact observations; a screenshot of a previously Saved project is not enough.

## 4. P3-B — clean Source performs ordinary Flush

Start with the successfully reopened, clean Source file from P3-A.

1. Record its current text and project status. Click inside its Source editor but
   do not alter the text. There must be no modal or other pending operation.
2. Press **Ctrl+S** / **Cmd+S** once. Observe the status area during the command.
   The current implementation can briefly show **Retaining latest Source input…**
   and **Saving…**, then returns to **Saved**. These transitions may be very fast.
3. Confirm the text and disk bytes remain unchanged, Source stays clean, and no
   acceptance/error dialog appears. Repeat once if needed while recording the screen;
   do not hold the keys down.
4. If the transient response was too fast to see, inspect the recording. If there is
   no observable response, record **UNCLEAR**, not a pass based only on unchanged text.

**Pass:** a native command response is observed, ending clean/Saved with unchanged
source. Existing automated routing evidence establishes that this clean branch calls
ordinary Flush without a Source acceptance/history action. This manual check supplies
native delivery evidence; it does not independently count internal IPC calls.

**Fail:** Source becomes dirty, content changes, the shortcut starts another action,
or a persistence error occurs. **Unclear:** delivery/handling cannot be observed.
Do not enable smoke mode or modify the build to make this row look passed.

## 5. P3-C — outside Source does not accept its pending draft

Use a new pending edit to make accidental acceptance observable.

1. In Source, change the saved narration marker to `P3 must remain draft`.
   Wait until the draft is retained / **Pending validation**. Do not save it.
2. Confirm the disk file still contains the marker saved in P3-A.
3. Switch to **Characters**, with no modal open. Click the workspace heading or a
   normal existing field so Source no longer has editing focus. Do not submit a form.
4. Press **Ctrl+S** / **Cmd+S** once. Observe the ordinary Flush response. Because
   the Source draft still exists, the final project state must remain **Pending
   validation**, rather than falsely claiming that all work is Saved.
5. Reload the disk view: `P3 must remain draft` must NOT be present.
6. Return to Source. The pending marker must still be there as a dirty draft, ready
   to continue editing. Returning to Source must not silently accept or discard it.
7. Capture the result before cleanup. Either click **Discard Draft** and explicitly
   confirm, or close the test project and choose **Discard All**. Cancel should leave
   the project open if you are not ready to discard.

**Pass:** native Save responds outside Source while its draft remains pending and disk
contents stay at the last accepted marker. **Fail:** Source is accepted/discarded,
pending text is lost, or status falsely says all changes are Saved.
If no command response is observable, record **UNCLEAR** even if the draft survived.

## 6. Optional adjacent checks

These are useful extra feedback, not additional P3 acceptance rows or a replacement
for any of the six required results.

- **Toolbar:** a fresh valid Source edit is accepted once by **Save Source**.
- **Invalid draft:** remove a closing quote from the test narration and press native
  Save. Expect refusal, retained editable text and unchanged accepted disk bytes.
  Restore the quote before proceeding. Do not use real project content.
- **Immediate Save:** type a final character and immediately press native Save.
  The newest character should be included; an older retained draft must not win.
- **Modal protection:** with a dirty draft, open **Discard Draft** confirmation,
  press native Save, then **Cancel**. Background Save must not accept the draft.
- **Leave/Cancel:** close with a dirty draft, choose **Cancel**, and confirm the draft
  remains available. Use explicit discard only for cleanup after recording results.

## 7. Result record — complete separately for each target

Do not prefill passing results. **PASS** means the stated outcome was observed;
**FAIL** means a contrary outcome; **BLOCKED** means the check could not run;
**UNCLEAR** means the evidence does not establish the outcome.

```text
Target: Windows x64 / macOS ARM64
OS version and architecture:
Test date:
Package run: https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561
Package build SHA: 0b9ea0f0c23f843b3324cd63a524a642a2399f2e
Artifact name and ID:
Installer filename:
Installer SHA-256 (optional):
Loomlight displayed version: 0.1.0
Keyboard path: local physical keyboard / OS remote input (describe)
Ren'Py SDK: 8.5.3
Setup / launch: PASS / FAIL / BLOCKED
Scene project-relative path:

P3-A dirty Source: PASS / FAIL / BLOCKED / UNCLEAR
  Actual keys and focus:
  Status before / response / final status:
  Disk marker before / after:
  Selection/navigation stayed clean? Reopen retained saved text?
  Screenshot or recording reference:

P3-B clean Source: PASS / FAIL / BLOCKED / UNCLEAR
  Actual keys and focus:
  Observed command response / final status:
  Source and disk unchanged?
  Screenshot or recording reference:

P3-C outside Source: PASS / FAIL / BLOCKED / UNCLEAR
  Actual keys and focused workspace:
  Observed command response / final status:
  Pending Source draft retained? Accepted disk bytes unchanged?
  Screenshot or recording reference:

Optional checks / other issues:
Exact error text and reproduction steps:
```

If a check fails, stop that sequence and preserve the test project and observations.
Do not repeatedly save, overwrite, or discard the failing draft before recording it.
Exclude private paths and real project content from shared evidence. Both targets
must have three observed passes before native P3 can be closed. Return the two
records for review; successful manual testing does not itself authorise merging PR #14.
