# Current status

**Updated:** 2026-09-14<br>
**Phase:** Phase 0 complete; Phase 1A target gate blocked on GitHub-hosted runner capacity<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- The Phase 0 corrective checkpoint is complete. The user explicitly approved the
  bounded Phase 1A production scaffold on 2026-09-14; no later milestone is approved.
- Production code now lives separately under `app/`: a Cargo core/desktop workspace,
  vanilla TypeScript/Vite UI, one versioned `core_request` command, an explicit local
  main-WebView capability plus matching handler guard, empty future ports, locked
  dependencies, and semantic Quiet Studio Dark/light-ready tokens.
- Local TypeScript build/tests and framework-independent Rust core tests pass.
  Production run
  [34782008915](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34782008915)
  at `ae447584` packaged on both targets. macOS ARM64 passed its complete packaged
  boundary/privacy/licence gate; Windows x64 passed package and every boundary boolean
  except a false-positive renderer-secret heuristic. Commit `c4f2bd18` narrows that
  heuristic to Loomlight secret surfaces, storage, Node bridges, sentinel text, and the
  separate exact-sentinel artifact scan.
- The replacement production and quality runs at `c4f2bd18` (34782646465 and
  34782646499) failed during runner setup with zero steps. Repository artifact storage
  was already reporting quota exhaustion. No Windows result exists for the corrected
  secret probe, so Phase 1A remains open rather than treating infrastructure failure as
  a target pass.
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

Restore GitHub-hosted Actions capacity, then run the production scaffold at or after
`c4f2bd188bf33290204446b3aaf9d33c8fd15acb` and require both target jobs to pass.
Complete and evidence only
[phase-1-scaffold.md](../tasks/active/phase-1-scaffold.md). Do not begin Phase 1B,
archive the scaffold task, or claim the target gate while this remains blocked.

Phase 0 evidence and corrective closure remain authoritative historical records; the
Phase 0 spike must not be promoted wholesale into the production application.
