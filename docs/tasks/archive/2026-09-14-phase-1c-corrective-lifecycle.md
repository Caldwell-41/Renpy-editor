# Task: Phase 1C corrective lifecycle and SDK remediation

**Status:** Complete 2026-09-14
**Scope:** Corrective Phase 1C only; Phase 1D remains unapproved

## Findings being corrected

1. Bind the private project stage to a retained filesystem identity and fail closed on
   same-name substitution before privileged Ren'Py execution or final promotion.
2. Dispatch the blocking lifecycle command off Tauri's UI thread.
3. Sanitize Ren'Py/Git child environments; Git must ignore hostile `GIT_*` redirects,
   global/system config injection, and external template directories.
4. Bind approved SDK capability records to filesystem identity plus launcher/template
   fingerprints, and trust an app-managed SDK only with checksum-derived provenance.
5. Deduplicate repeated SDK discovery/registration so the renderer receives a stable
   opaque ID for the same approved SDK object.
6. Extend packaged smoke evidence to the real Welcome/New Project DOM surface while
   retaining the complete production lifecycle target gate.
7. Refuse SDK HTTP redirects rather than following an unapproved origin.

## Required closure evidence

- Local/frontend/core formatting, type, unit, clippy, repository validation, and diff
  checks pass.
- Hostile stage replacement fails closed and never promotes the replacement.
- Actual target lifecycle test proves managed checksum provenance, stable SDK IDs,
  hostile Git environment isolation, create/validate/run/close/reopen, metadata-free
  game operation, and arbitrary-project rejection.
- Packaged Windows x64 and macOS ARM64 smoke proves security denial plus actual
  Welcome/New Project rendering.
- Record the exact production run/job/artifact IDs before re-closing Phase 1C.

No Phase 1D Characters/Assets/Variables work is permitted in this task.


## Outcome and closure evidence

The remediation is complete. Private project stages retain and revalidate filesystem
identity across privileged Ren'Py/Git operations and no-replace promotion. SDK
capabilities retain filesystem identity plus launcher/template fingerprints; managed SDK
reuse additionally requires checksum-derived provenance. Ren'Py and Git subprocesses use
allowlisted environments, Git ambient redirects/configuration are neutralized, SDK
redirects are refused, repeated SDK registration is stable, long lifecycle dispatch runs
off the Tauri UI thread, and packaged smoke exercises the real Welcome/New Project DOM.

Corrective production run `34832555392` at
`08daf385246c345f53f46f9dedc43762a1c060e9` passed Windows x64 job
`103939004703` and macOS ARM64 job `103939004630`. Both passed the full core suite,
exact official Ren'Py 8.5.3 lifecycle gate, desktop tests, packaging, packaged
WebView/lifecycle UI smoke, secret scan, and dependency/licence inventory. Lightweight
artifacts are `10343096571` (Windows, SHA-256
`74b3a0b31b6a6012059cef99a3517a30432af5e0b226f09279f6472ffde66c17`) and
`10342841434` (macOS, SHA-256
`d01081e879877744a098410e51b1b1db871c6c9994f765143150afa54bb69184`). Repository
quality run `34832555407` passed at the same commit.

## Failed and diagnostic evidence retained

- Production run `34829660277` at `60406825` failed: macOS exposed a regression-test
  `/var` canonical-alias setup defect; Windows exposed verbatim canonical SDK process
  paths rejected by Ren'Py. Evidence artifacts are `10341193070` (Windows) and
  `10340778911` (macOS). Neither failure is classified as a pass.
- Dedicated target run `34830668266` was used to verify the supported-target correction.
  The final macOS and Windows attempts passed the complete core + official lifecycle
  gates; preceding Windows attempts remain failed evidence.
- Diagnostic runs `34831041290` and `34831227053` proved the sanitized environment,
  SDK rename/restore sequence, and stage marker were not the Windows cause. Run
  `34831382649` isolated the failure to Rust process-facing verbatim Windows paths.
  The fix normalizes only paths handed to the child process; internal filesystem
  identity remains canonical and the minimal child environment remains in force.

Phase 1D Characters/Assets/Variables was not started and remains separately
approval-gated.
