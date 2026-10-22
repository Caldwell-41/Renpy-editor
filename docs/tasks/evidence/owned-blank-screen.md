# Owned blank-screen evidence

Owning work ticket: [L01 #34](https://github.com/Caldwell-41/Renpy-editor/issues/34).
Observation period starts 2026-10-22. Baseline `867528d`, Mac ARM64 sole writer,
branch `codex/phase3b-screen-designer`. The issue owns selection, finite cumulative
allowance and bounded acceptance. This file records detailed results, not a second brief.
Existing documentation/instruction edits and protected native recovery are preserved.

## Implemented path and limits

Choose opens a named blank-screen dialog. Accepted creation adds one owned file and
screen/root UUIDs through shared transactions/history. The created root opens its
exact Source range. Source body edits and byte-offset shifts retain ownership;
rename, deletion, ambiguous markers/declarations and malformed Source remain explicit
unresolved references. Older maps migrate to v6 without adopting existing screens.
The [data contract](../../DATA_MODEL.md#project-lifecycle-metadata) owns persistence.

The design reference remains flow-v1 at `3c7ea31`. The new dialog follows its modal
pattern. Existing editor-layout differences and the separate canvas-rendering gate
remain unaccepted. No child-node authoring, Help starter, Story connection or canvas
architecture is included.

## Local evidence and original failures

Ignored receipts are under `.toolchains/owned-screen/`. Public fixture data only.
Node 24.19.0, Cargo/Rust 1.90.0, TypeScript 7.0.2; Python 3.9.6 was initially on PATH,
then the existing bundled Python 3.12.14 was selected for checks requiring `tomllib`.

- Core TDD first refused `screens.list` as not allowlisted. The creation/history/reopen
  test passed after adding typed catalog/create dispatch and source-map v6 ownership.
- The reconciliation test then exposed a catalog error on malformed source. The
  correction retains the UUID as unresolved and refuses creation with an incomplete
  collision inventory. Eight focused Screens tests pass, including the existing Help
  transaction/source cases, collision/dirty/stale refusals and migration/reopen.
- `browser-01`, `browser-02` and the final browser run exercise eight real
  renderer/ApplicationHost/core groups. `help-regression-01` passes all 11 existing
  Help groups. These prove production renderer/core behavior, with synthetic browser
  input; they do not establish native WebView or physical keyboard delivery.
- The exact packaged controller passes browser rehearsals in `probe-controller-01`
  through `probe-controller-03`. The Python gate rejects incomplete stages, wrong
  identities, false native claims and missing cleanup.
- SDK attempt 1 (`sdk-01`) compiled/linted and rendered the exact browser-created
  blank source, returning 1280.0 by 720.0 and a PNG. A test assertion compared JSON
  integer and floating-point number representations and failed before the explicit
  Stop/terminal-cleanup assertions. Retain that failure. A process-name check found
  no remaining SDK/app process after test teardown.
- SDK attempt 2 (`sdk-02`) corrects that numeric assertion. The release-mode exact
  test passes compile/lint, actual ordinary-game-context blank render, PNG capture,
  explicit Stop, terminal diagnostics, unchanged accepted source, no source bytecode
  or saves, and removal of scratch jobs after process cleanup. It consumes two SDK
  operations. The verified official archive hash is
  `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`,
  matching the retained published Ren'Py 8.5.3 checksum metadata.
- The first package invocation supplied a wrong public certificate selector and
  failed the repository pin check before building. It stays charged. The corrected
  invocation reads the policy's exact selector and passes ARM64 bundle/signature and
  read-only DMG-content verification in `mac-package-02`. No signing or Keychain
  policy changed. Executable SHA256 is
  `fe76f994c1c7e1859a59c74c587a8090a2043e7857eca983b3107cfd341161c8`;
  DMG SHA256 is `769c3a7992cbbac3587891df33acfd3f14bc4d86720db06b398e066208a63c09`.
- The first full frontend run passed 218/220. Its failures were the expected-operation
  fixture missing the two selected operations and a validator launched with Python
  3.9 lacking `tomllib`. Update the protocol fixture and select existing Python 3.12.
- The first broad core attempt ran inside the filesystem sandbox. Its controlled
  loopback listeners failed with `Operation not permitted`; stop that owned attempt
  and retain its log. The replacement run uses the required local socket permission.
  Neither failed run is a pass.

## Acceptance map and pending proof

| Criterion | Evidence and state |
| --- | --- |
| One collision-checked definition/transaction/history entry; Cancel and refusal do not write | Focused IPC tests, real eight-group renderer/core run and existing 11-group Help regression pass. |
| Metadata-only migration, extras/source preservation, no-op reopen, newer-schema refusal | Focused IPC migration and reopen tests pass. |
| Source edits/offsets reconcile; rename/deletion/ambiguity stays unresolved | Focused IPC tests and real Source Save/browser path pass. |
| Actual Choose/core/Source/history/reopen | Browser production path and packaged-controller rehearsal pass. Signed Mac native run awaits an unlocked desktop; Windows native proof awaits selected CI. |
| Deliberate preview of created screen | Exact browser-accepted source passes actual pinned SDK proof on Mac. Windows SDK proof remains pending. |
| Retain revision-bound Help behavior | Existing focused core and 11-group real renderer/core regression pass. Earlier unchanged native/SDK Help evidence remains scoped to its accepted candidate. |
| Whole editor/canvas visual acceptance | Pending under later owners; L01 does not waive those gates. |

The prepared existing Screens workflow selects `owned_blank=true` with exact
candidate/ordinal. It runs affected frontend/core/controller checks on Windows x64
and Mac ARM64, plus the missing Windows SDK and packaged WebView proof. Mac uses its
local signed package and SDK evidence, avoiding another SDK launch. Publication and
dispatch have not occurred. No workflow or worker is pending.
