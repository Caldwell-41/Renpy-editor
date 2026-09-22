# Current status

**Updated:** 2026-09-22.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active milestone:** [Phase 1F Source synchronisation](../tasks/active/phase-1f-source-synchronisation.md); automated correction verified, native P3 outstanding.
**Selected checkpoint:** [Build #87 verification](../tasks/active/phase-1f-save-correction.md#719-build-87-replacement-package-verification), complete; replacement installers ready for user testing.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Validated application candidate:** `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`.
**Continuation:** [HANDOVER](HANDOVER.md).

## Verified result and remaining boundary

[Production #87](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35719829561), attempt 1, passed Preflight and both supported targets.
All three new Scene JSON regressions passed, covering the reported starting-narration
edit/new-Beat failure through real IPC. Packages and evidence were downloaded and their
SHA-256 and ZIP integrity verified. Exact jobs, artifacts, filenames, hashes and expiry
are in the correction ledger section 7.19. Prior #85 packages contain the defect and
must not be used for acceptance; #86's formatting failure remains historical evidence.

Use the [manual checklist](../tasks/active/phase-1f-native-p3-checklist.md) with #87.
Native P3 still requires dirty Source acceptance, clean Source ordinary Flush, and
non-Source isolation using real Windows Ctrl+S/macOS Cmd+S. First confirm Scene setup
works. Native installation and user acceptance remain untested, despite passing CI.
Keep PR #14 draft. No redispatch, merge or Phase 1G; no CI remains to poll.

## Latest user testing

Beat fix works and physical Save passes on Windows, per the user. Individual P3 rows,
OS version and local package identity remain to be recorded. macOS launch is blocked
by an app-is-damaged warning; Mac P3 has not run. Signing/notarisation is not configured;
Gatekeeper/signature cause remains unconfirmed. See HANDOVER for bounded diagnostics.
No redispatch or merge.
