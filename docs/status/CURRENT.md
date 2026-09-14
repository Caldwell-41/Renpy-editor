# Current status

**Updated:** 2026-09-14<br>
**Phase:** Phase 1C re-closed; Phase 1D not approved<br>
**Working codename:** Project Loomlight (temporary)

## Current truth

- The bounded
  [single-instance lifecycle micro-remediation](../tasks/archive/2026-09-14-phase-1c-single-instance.md)
  is complete. The maintained Tauri single-instance boundary is the first registered
  plugin and rejects a secondary process before desktop setup can construct
  `LifecycleService`; the primary best-effort restores, shows, and focuses `main`.
- [Production run 34906232240](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34906232240)
  at `e1e8dac27b5d98ceca58e7a14a4361c93854b7ff` passed Windows x64 job
  `104183422740` and macOS ARM64 job `104183422612`. Both packaged dual-launch probes
  proved the secondary never reached lifecycle setup, the primary received activation
  and retained a usable main window, and the existing lifecycle/UI/WebView restrictions
  remained green. Evidence artifacts are `10372748134` (Windows, SHA-256
  `949213ab719c6d8c895cae933839459d97670f89dbdb37281f62a0b483af38e7`) and
  `10373200561` (macOS, SHA-256
  `75fc9d2b01dcdcce046b4f1a838e5496129989a1fad1031ea28cb2c06515bb03`). Quality run
  `34906232244` passed. Phase 1C is re-closed; Phase 1D remains unapproved and unstarted.

- The Phase 0 corrective checkpoint, bounded Phase 1A production scaffold, and Phase
  1B [corrective transaction/recovery task](../tasks/archive/2026-09-14-phase-1b-corrective-transaction-recovery.md)
  are complete. The correction and subsequent recovery-enumeration follow-up re-closed
  Gate E. Phase 1C was separately approved, completed, and re-closed by the bounded
  [durability/race remediation](../tasks/archive/2026-09-14-phase-1c-durability-race-remediation.md).
  No later milestone is approved.
- The bounded [Phase 1C task](../tasks/archive/2026-09-14-phase-1c-project-lifecycle.md)
  is archived and ADR 0005 is accepted. Production implementation includes versioned
  metadata/Recent Projects, trusted picker-mediated opaque path choices, staged/no-replace project
  creation, the exact Ren'Py 8.5.3 adapter/verified installer, optional `git init`, and
  Welcome/New Project/Open/minimal Chapter 1 → Scene 1 UI.
- [Production run 34814995559](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34814995559)
  at `1b241954e936f943d558f267a86f5e3592ab99cb` passed the complete Phase 1C gate:
  Windows x64 job `103883726104` and macOS ARM64 job `103883726218` both created,
  validated, ran, closed, and reopened the generated game; checked standard Ren'Py
  screens and stable Chapter 1 / Scene 1 identity; ran a metadata-free copy; rejected
  arbitrary Ren'Py opening; and passed desktop/package/security evidence. Artifacts are
  `10335964464` (Windows) and `10335279104` (macOS). Quality run `34814995493` passed.
- A post-closure review reopened Phase 1C and the bounded
  [corrective lifecycle/SDK task](../tasks/archive/2026-09-14-phase-1c-corrective-lifecycle.md)
  is now complete. The correction pins private stage identity through privileged execution
  and promotion, binds SDK capabilities to filesystem identity plus launcher/template
  fingerprints, requires checksum-derived provenance for managed SDK reuse, sanitizes
  Ren'Py/Git child environments, neutralizes hostile Git redirection/configuration,
  deduplicates SDK registration, refuses SDK redirects, dispatches lifecycle work off the
  Tauri UI thread, and exercises the actual Welcome/New Project DOM in packaged smoke.
- [Corrective production run 34832555392](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34832555392)
  at `08daf385246c345f53f46f9dedc43762a1c060e9` passed the complete production gate:
  Windows x64 job `103939004703` and macOS ARM64 job `103939004630` both passed the
  full core suite, official Ren'Py 8.5.3 lifecycle gate, desktop tests, packaging,
  packaged WebView/lifecycle UI smoke, artifact secret scan, and dependency/licence
  inventory. Evidence artifacts are `10343096571` (Windows, SHA-256
  `74b3a0b31b6a6012059cef99a3517a30432af5e0b226f09279f6472ffde66c17`) and
  `10342841434` (macOS, SHA-256
  `d01081e879877744a098410e51b1b1db871c6c9994f765143150afa54bb69184`). Quality run
  `34832555407` passed at the same commit. Failed/superseded corrective runs remain
  recorded in the archived corrective brief and are not reclassified as passes.
- The final Phase 1C durability/race correction makes managed SDK payload/provenance
  one durable promotion unit with bounded quarantine/retry, atomically replaces Recent
  Projects through retained application-state authority, anchors project stage child
  work and project-open inspection, and detects/quarantines final-promotion
  substitution. Managed provenance is now checked before SDK execution.
- [Production run 34849801157](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34849801157)
  at `bdc7ad60a64bfa51fd9c5380b33fd7fda6d92131` passed Windows x64 job
  `103994559964` and macOS ARM64 job `103994559633`: platform core suites, official
  Ren'Py 8.5.3 lifecycle/remediation markers, desktop tests, packaging, packaged smoke,
  scans, and inventories. Evidence artifacts are `10350511403` (Windows, SHA-256
  `30fd5e2a8479513eace75856aa9747a63cafe70be2cbf6124cc1be1e8566d675`) and
  `10351240446` (macOS, SHA-256
  `cf3e7dc9a913ca1b84ca5b8377e1af0422b880ed66d16e93e8d7fe684a17e9d5`). Quality run
  `34849801200` passed. Failed/superseded attempts remain in the archived brief.
- Production code now lives separately under `app/`: a Cargo core/desktop workspace,
  vanilla TypeScript/Vite UI, one versioned `core_request` command, an explicit local
  main-WebView capability plus matching handler guard, capability-specific ports, locked
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
- The corrective implementation keeps transaction artifacts in anchored recovery,
  carries validated directory-handle chains through sensitive operations, uses no-
  follow descriptor-relative macOS/Unix I/O, and pins Windows directory namespaces
  against rename/delete during `ReplaceFileW`. It adds proved-empty `Prepared`
  abandonment, terminal/non-blocking pre-mutation `Rejected` semantics, and anchored
  recovery discovery so replacement of the recovery pathname cannot hide unresolved
  transactions from Save/Flush.
- [Production run 34804861387](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34804861387)
  at `dc2efdf` passed the latest transaction/recovery suite on actual Windows x64 and
  macOS ARM64, plus desktop tests, packaging, packaged denial smoke, secret scan, and
  dependency/licence inventory. macOS exercised the new recovery-path substitution
  regression; Windows retained its pinned-namespace coverage. Evidence artifacts are
  10332572412 (Windows) and 10333101940 (macOS). Quality run 34804861410 passed. The
  archived corrective task records the preceding formatting-only failed attempt and all
  earlier evidence. See [TRANSACTIONS.md](../TRANSACTIONS.md) and amended ADR 0004.
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
- Production file Gate E is re-closed by the latest corrective Windows/macOS runtime
  evidence. Authoring remains absent; Phase 1D remains approval-blocked.

## Next action

Await explicit approval for a new bounded Phase 1D task. Do not begin Phase 1D from
this checkpoint.

Phase 0 evidence and corrective closure remain authoritative historical records; the
Phase 0 spike must not be promoted wholesale into the production application.
