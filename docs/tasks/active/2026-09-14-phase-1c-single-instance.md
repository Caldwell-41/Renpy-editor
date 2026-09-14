# Task: Phase 1C single-instance lifecycle micro-remediation

**Status:** In progress 2026-09-14<br>
**Scope:** Single-instance lifecycle boundary only; Phase 1D remains unapproved

## Finding and invariant

Phase 1C assumed one desktop process owns application lifecycle state but did not
enforce that assumption. Two independently running processes could therefore construct
separate `LifecycleService` values and both mutate application-local state such as
Recent Projects.

Loomlight is a single-instance desktop application. The primary process is the sole
owner/coordinator of mutable application lifecycle state. Independent concurrent
Loomlight instances and multi-process editing are unsupported.

## Bounded design

- Pin and register the maintained Tauri 2 single-instance plugin as the first plugin,
  before desktop `setup` and `LifecycleService::new`.
- On a second launch, restore, show, and request focus for the existing `main` window.
  Ignore arguments and the secondary working directory; no new project-open routing is
  introduced.
- Add no renderer API or capability permission. Do not add project locks, Recent
  Projects multi-writer coordination, or general multi-process support.

## Required evidence

- Existing local frontend, core, repository, source-spike, and SDK-spike regressions.
- Desktop compilation/tests and production packaging on Windows x64 and macOS ARM64.
- On each supported target, a packaged primary publishes a deterministic readiness
  marker only after lifecycle construction and main-window creation. Launching the same
  executable again must notify that primary and exit; the secondary's isolated output
  must not contain the readiness marker. The primary must subsequently complete the
  existing lifecycle/UI and WebView security smoke.
- Dependency/licence inventory and artifact secret scanning remain green.

## Closure

Record exact supported-target run, job, and artifact evidence here before archiving.
Do not begin Phase 1D.
