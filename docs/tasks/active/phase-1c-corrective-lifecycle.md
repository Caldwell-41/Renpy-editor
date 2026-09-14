# Task: Phase 1C corrective lifecycle and SDK remediation

**Status:** In progress 2026-09-14  
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
