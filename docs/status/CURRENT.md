# Current status

**Updated:** 2026-09-14<br>
**Phase:** Phase 0 complete; Phase 1 product/UX plan defined; implementation not yet approved<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- The Phase 0 corrective checkpoint is complete. No production application has been
  created and no Phase 1 implementation has begun.
- Phase 1 product scope and core UX are now defined in
  [ROADMAP.md](../ROADMAP.md), [UI.md](../UI.md), [DATA_MODEL.md](../DATA_MODEL.md),
  [ARCHITECTURE.md](../ARCHITECTURE.md), and the
  [Phase 1 vertical-slice plan](../tasks/active/phase-1-vertical-slice.md).
- The first Phase 1 implementation gate remains the bounded
  [production scaffold](../tasks/active/phase-1-scaffold.md). Planning documents are
  not implementation approval.
- ADR 0001 accepts exact `.rpy` source bytes, a conservative partial CST, and verified
  minimal range patches. Authoritative source, formatting, comments, custom syntax,
  embedded Python, and unsupported regions remain losslessly preserved.
- ADR 0002 accepts the exact-version Ren'Py adapter and checksum-first staged install.
  Ren'Py 8.5.3 is evidenced on Windows x64, macOS ARM64, and the Linux regression
  baseline; physical SmartScreen/quarantine/signing UX remains later release work.
- ADR 0003 accepts Tauri 2 as the desktop runtime: an unprivileged shared web UI over
  named schema-validated commands in a Rust privileged core. Electron is the explicit
  fallback under ADR-defined reconsideration conditions.
- Confirmed targets are Windows x86-64 and macOS Apple Silicon ARM64 only. Intel macOS
  is out of scope.

## Agreed Phase 1 shape

- Create new Loomlight projects only; general arbitrary Ren'Py import remains deferred.
- Project lifecycle includes create, transactional persistence, explicit save/flush,
  close, Recent Projects, load/reopen, and continuation.
- Generated hierarchy is Project → Chapter → Scene → Beat; each Loomlight Scene normally
  owns one `.rpy` file and one globally unique technical label.
- Functional major workspaces are Scene, Source, and Branches. Characters, Assets,
  Variables, Diagnostics/Runtime, Git, and project setup are supporting surfaces.
- Scene uses an approximately 52/48 resizable Editor Preview/Beats split, inline beat
  editing, scene-local supported preview reconstruction, protected Custom Code regions,
  and explicit staging mutations.
- Characters use extensible appearance attributes. Phase 1 exposes expression with
  implicit default outfit/pose; future outfit/pose/layered-image support extends rather
  than replaces this model.
- Phase 1 assets are copied into the project; variables are `bool`, `int`, and `string`
  with simple assignment; basic placement/transitions/music/SFX use extensible models.
- Normal Run Game is Phase 1; correct Run From Here remains deferred with state
  simulation.
- Production authoring writes remain blocked until Phase 1 closes parser/file Gate E
  with a platform transaction/recovery design that prevents silent loss of accepted or
  competing external edits.

## Next action

Do not begin Phase 1 implementation without explicit approval. When approved, start
only with [phase-1-scaffold.md](../tasks/active/phase-1-scaffold.md). After its gate
passes, create and execute one bounded task at a time following the milestone sequence
in [phase-1-vertical-slice.md](../tasks/active/phase-1-vertical-slice.md).

Phase 0 evidence and corrective closure remain authoritative historical records; the
Phase 0 spike must not be promoted wholesale into the production application.
