# Task: Phase 1C project lifecycle and SDK foundation

**Status:** Complete 2026-09-14  
**Scope:** Project lifecycle and Ren'Py SDK foundation only; Phase 1D was not started

## Entry condition

Phase 0, Phase 1A, and the corrected Phase 1B transaction/recovery gate were complete.
The user explicitly approved this bounded Phase 1C goal on 2026-09-14. Gate E and the
replacement-only `SourceTransactionPort` remain unchanged.

## Delivered boundary

- Welcome, Recent Projects, the four-step New Project wizard, Open Loomlight Project,
  close, and a minimal Chapter 1 / Scene 1 project shell.
- A core-owned lifecycle service with opaque picker-issued parent/SDK IDs, retained
  parent handles and identities, strict portable names, no-follow/reparse checks,
  private sibling staging, ownership-bounded cleanup, and no-replace promotion.
- Exact Ren'Py 8.5.3 discovery/browse/install and process adapter. Installation uses
  the official immutable archive and reviewed SHA-256
  `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`, validates
  members before extraction, stages privately, and never promotes an existing target.
- Deterministic starter generation through 8.5.3's documented `generate_gui` command,
  explicitly bound to that SDK's `gui` template. The owned stage pre-creates `game/`
  because the target already contains Loomlight's private ownership marker. Loomlight
  then creates/replaces its small entry script and adds its modular overlay while
  preserving the SDK-generated GUI/runtime files.
- Schema-version 1 project and source-map metadata with stable UUID identities,
  relative forward-slash source paths, pinned SDK/resolution, and last-open selection.
  Machine paths remain in application-local Recent Projects only.
- Optional direct-argument `git init --quiet`; no status, diff, commit, restore,
  remote, credential, or GitHub behavior.
- One schema-validated `core_request` command with an exact Phase 1C allowlist. Native
  pickers, network, filesystem, Git, and Ren'Py processes remain trusted-host/core
  operations; no renderer filesystem, shell, process, opener, or HTTP plugin exists.

## Platform finalisation semantics

The stage is a private unique sibling on the destination filesystem. Immediately before
promotion the service revalidates the held parent identity, stage marker, and target
absence. Linux uses `renameat2(RENAME_NOREPLACE)`, macOS uses descriptor-relative
`renameatx_np(RENAME_EXCL)`, and Windows uses `MoveFileExW` without replacement while
the parent namespace is pinned by a no-delete-share directory handle. An existing
file, empty directory, non-empty directory, symlink, or reparse-point target is never
merged or overwritten. These are single namespace operations, not a claim of portable
multi-step transaction or power-loss atomicity. Failure after promotion is reported as
created-but-not-opened and does not delete the valid final project.

## Validation and final evidence

Implementation evidence commit:
`1b241954e936f943d558f267a86f5e3592ab99cb`.

Local final checks:

- `npm ci --ignore-scripts`, `npm run check` (5 passed), and `npm run build`: passed.
- `cargo fmt --check --all`: passed.
- `cargo test -p loomlight-core --locked`: 49 passed, 0 failed, 1 intentional
  subprocess-worker ignore; doc tests passed.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.
- `python3 scripts/validate.py`: passed for 180 repository files.
- Lossless-source/preview regression: 26 passed; SDK regression: 24 passed.
- Lossless benchmark: 620,000 bytes / 40,000 nodes, 130.97 ms median of seven.
- `git diff --check`: passed.
- Local `loomlight-desktop` test/package attempts stopped before application compilation
  because this Linux host lacks `pkg-config`/GLib. They are not target evidence; the
  supported-target jobs below passed both commands.

[Production run 34814995559](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34814995559)
passed at the implementation commit:

- Windows x64 job `103883726104`: core 47 passed / 1 worker ignored, target lifecycle
  test passed in 62.79 s, desktop tests/package passed, two bundles produced, packaged
  denial smoke and secret/dependency checks passed. Evidence artifact `10335964464`,
  SHA-256 `ad727252d79a24d2fbcc8f4bc010b60e3d2eed8832accbe369892c6a6642073a`.
- macOS Apple Silicon ARM64 job `103883726218`: core 49 passed / 1 worker ignored,
  target lifecycle test passed in 56.79 s, desktop tests/package passed, two bundles
  produced, packaged denial smoke and secret/dependency checks passed. Evidence
  artifact `10335279104`, SHA-256
  `e74399f700c9ed0589211812bc7aa7b02e76b166bac89e55338080b445049df3`.
- Quality run `34814995493` passed at the same commit.

The target lifecycle test installs the checksum-verified archive through production
code, detects/browses exact 8.5.3, creates a custom-title/folder 1920×1080 Git project,
compiles/lints/runs it, checks standard main-menu/save/load/preferences/history source,
closes and reopens it from Recent Projects and Open, verifies stable Chapter 1 / Scene 1
selection, runs a disposable copy without `.renpy-editor/`, and rejects a non-Loomlight
Ren'Py directory.

## Failed and superseded evidence retained

| Run | Commit | Result and diagnosis | Lightweight artifacts |
| --- | --- | --- | --- |
| `34811699513` | `37c5800` | Failed: macOS rejected the system `/var` canonical alias; Windows used unstable metadata identity methods. | `10334603964`, `10334049969` |
| `34812370373` | `36dca08` | Failed: both SDK generators correctly rejected an existing stage without `game/`. | `10335810044`, `10335256666` |
| `34812990192` | `c609d84` | Failed at Rust formatting on both targets; later steps skipped. | none |
| `34813211560` | `ea40cc9` | Failed after generation with an undifferentiated lifecycle I/O result. | `10335316695`, `10335301789` |
| `34813718863` | `a2456cc` | Failed target gate; stage checkpoints separated generation from overlay/finalisation. | `10336151291`, `10335432040` |
| `34814180722` | `30cf87f` | Failed diagnostically: macOS template omitted `script.rpy`; Windows rejected verbatim canonical command paths. | `10336286086`, `10336171960` |
| `34814532778` | `af7182c` | Superseded/cancelled after macOS lifecycle passed; Windows still required command-path normalization. | `10335883710`, `10335454591` |

No failed or skipped step is classified as a pass.

## Remaining limitations

- Only schema version 1 and exact Ren'Py 8.5.3 are supported; no metadata migration or
  arbitrary Ren'Py import exists.
- Opening inspects only and never executes project code. General trusted compile/run UI
  and diagnostics remain later work.
- Physical SmartScreen, quarantine-origin, signing, notarisation, and manual assistive-
  technology checks remain later release/UI gates.
- Routine evidence artifacts expire after seven days; run/job records remain canonical.
- Phase 1D Characters/Assets/Variables and every later authoring milestone remain
  separately approval-gated and were not started.
