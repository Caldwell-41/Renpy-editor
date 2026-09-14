# Current status

**Updated:** 2026-09-14<br>
**Phase:** Phase 0, Phase 1A, and Phase 1B complete; Phase 1C not approved<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- The Phase 0 corrective checkpoint, bounded Phase 1A production scaffold, and bounded
  Phase 1B transaction/recovery foundation are complete. No later milestone is
  approved.
- Production code now lives separately under `app/`: a Cargo core/desktop workspace,
  vanilla TypeScript/Vite UI, one versioned `core_request` command, an explicit local
  main-WebView capability plus matching handler guard, empty future ports, locked
  dependencies, and semantic Quiet Studio Dark/light-ready tokens.
- Local TypeScript build/tests, framework-independent Rust core tests, repository
  validation, Phase 0 regressions, privacy scans, and dependency audit pass.
  [Production run 34792368716](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34792368716)
  at `0a6a6c5d` passed the corrected complete gate on Windows x64 and macOS ARM64:
  frontend/Rust tests, packaging, packaged-WebView denial smoke, artifact secret scan,
  and dependency/licence inventory. The smoke reported navigation, popup, and aggregate
  WebView restrictions true on both targets. Quality run 34792368711 passed at the same
  commit.
- The successful run produced the Windows executable/MSI/NSIS installer and macOS
  application/DMG. Under the routine-run retention policy it uploaded lightweight
  evidence artifacts 10328234722 (Windows) and 10328548641 (macOS), not full packages.
  Earlier failed/cancelled runs and the hosted-runner interruption remain documented in
  the archived Phase 1A task; skipped steps are not reclassified as passes.
- Routine CI has been cost-scoped without weakening the Phase 1A gate: the production
  Windows/macOS package matrix runs on relevant `app/**` or workflow changes pushed to
  `main`, plus explicit manual dispatch, rather than running once for a pull request and
  again after merge. Documentation-only changes do not trigger it. Normal runs retain
  only lightweight smoke/licence evidence; full packaged bundles are uploaded only for
  manual production runs. Legacy Phase 0 desktop and SDK evidence matrices are manual-
  only, while routine Ubuntu repository validation remains automatic.
- Phase 1 product scope and core UX are now defined in
  [ROADMAP.md](../ROADMAP.md), [UI.md](../UI.md), [DATA_MODEL.md](../DATA_MODEL.md),
  [ARCHITECTURE.md](../ARCHITECTURE.md), and the
  [Phase 1 vertical-slice plan](../tasks/active/phase-1-vertical-slice.md).
- The first Phase 1 implementation gate is the completed
  [production scaffold](../tasks/archive/2026-09-14-phase-1-production-scaffold.md).
  The bounded [Phase 1B transaction/recovery brief](../tasks/archive/2026-09-14-phase-1-transaction-recovery.md)
  is complete.
- Phase 1B production code implements a core-only multi-mutation transaction set,
  retained accepted/displaced bytes, alternating checksummed journals, deterministic
  recovery inspection, exact revision/path/root checks, revision-guarded history, and
  macOS/Windows platform adapters. [Production run 34797222616](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34797222616)
  passed the complete Windows x64 and macOS ARM64 gate at `85690bd4`; quality run
  34797222651 also passed. See [TRANSACTIONS.md](../TRANSACTIONS.md), ADR 0004, and
  the archived task for exact evidence and limitations.
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
- Production file Gate E is closed by Phase 1B. Authoring remains absent and blocked
  until separately approved milestones implement parser/source and product workflows
  through this transaction boundary.

## Next action

Stop. Phase 1C project lifecycle/SDK work is the next planned milestone but is not
approved. Do not implement New Project, project generation/import, SDK workflow, or
any authoring surface without a new explicit instruction.

Phase 0 evidence and corrective closure remain authoritative historical records; the
Phase 0 spike must not be promoted wholesale into the production application.
