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
  collision inventory. The initial eight focused Screens tests pass, including the existing Help
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
| Actual Choose/core/Source/history/reopen | Browser production path and packaged-controller rehearsal pass. Current signed Mac native run requires one additional package authorization and an unlocked desktop; Windows native proof awaits selected CI. |
| Deliberate preview of created screen | Exact browser-accepted source passes actual pinned SDK proof on Mac. Windows SDK proof remains pending. |
| Retain revision-bound Help behavior | Existing focused core and 11-group real renderer/core regression pass. Earlier unchanged native/SDK Help evidence remains scoped to its accepted candidate. |
| Whole editor/canvas visual acceptance | Pending under later owners; L01 does not waive those gates. |

The prepared existing Screens workflow selects `owned_blank=true` with exact
candidate/ordinal. It runs affected frontend/core/controller checks on Windows x64
and Mac ARM64, plus the missing Windows SDK and packaged WebView proof. Mac uses its
local signed package and SDK evidence, avoiding another SDK launch. Publication and
dispatch have not occurred. No workflow or worker is pending.


## Independent review and corrections

The initial review compares `867528d...da2f8d3`. Two independent read-only reviewers
checked Standards and Spec. Follow-ups compare `da2f8d3...d43edfe`, then the final
namespace correction at `6be4f24`.

### Standards

The initial reviewer found one P2 breach of the dirty-buffer/external-edit contract.
An unowned Source file could retain a dirty draft after external deletion; checking
only present inventory paths let creation write at that missing destination.
The destination now participates explicitly in the clean-buffer check. Its regression
proves refusal, retained input, absent destination and unchanged metadata.
The independent follow-up reports zero remaining documented-standard breaches and
zero baseline smell findings.

### Spec

The initial reviewer found three P2 defects against the ticket's collision, preview
and never-retarget requirements. Static collision inspection missed continued,
init-prefixed and explicit-version screen declarations. Private double-underscore
creation names used a different runtime name in the scratch helper. Separate catalog
and inspection reads could display a different declaration under the original owned
UUID. The corrections recognize those headers, refuse private/portable reserved names
and require the catalog's exact source revision and name before showing an owned tree.
Unavailable inspection also retains an explicit unresolved reference.

The first follow-up closed those three defects but found one remaining P2 collision
through Ren'Py's filename-mangled `_m1_` namespace. The final correction reserves that
namespace and bounds nested init-prefix recognition. Its exact IPC regression failed
before the guard and passes after it. The last independent follow-up at `6be4f24`
reports zero remaining actionable Spec code defects. Native/Windows qualification
remains a pending-proof group; no scope additions were found.

Final focused proof is 10/10 Screens tests and 10/10 Screens UI tests, including
three catalog/inspection race cases. The final complete frontend suite passes
223/223. Production browser/controller runs pass after the revision-binding fixes.
The first non-sandboxed broad core run passed 398 cases and failed one historical
migration assertion that still expected schema 5. That assertion now expects the
current schema, and its exact test passes. The final coherent-candidate broad-core
run is recorded below.

## Package ceiling and current continuation

Mac package attempt 3 uses the single original contingency and passes signing and
installer checks at `d43edfe`. Executable SHA256 is
`0bea54c59628ac8d443ae67c4df3157248968598500ee1f997d0119f03d72823`;
DMG SHA256 is `d0336f536409f150a6e03c7cd56a31534064366397d5183d297e82bc24b9c659`.
It predates the final namespace guard and does not qualify `6be4f24`.
No fourth package is attempted or authorized. A current signed build/native run
requires explicit approval beyond the consumed package ceiling, plus an unlocked
desktop. The earlier unlock request did not receive an answer during implementation.
No unrelated draft/window was opened, closed, discarded or reloaded.

The implementation is committed locally in `da2f8d3`, `d43edfe` and `6be4f24`.
No push, remote CI, PR, merge or release occurred. Publication of these concrete
commits and the prepared focused CI route needs authorization. Keep L01 open.
The current package and Windows evidence gaps prevent acceptance/closure even
though both independent code-review axes have no remaining code findings.


## Final local result and retained candidate

Code candidate `6be4f24` passes 401 routine core tests, with zero failures, 45
intentionally ignored SDK/specialist cases and three documented broad-run exclusions.
The final exact executable is retained privately with SHA256 `bdcb7e3388d225bd32461f51dc332b9dfbb5627ca1100108697907b4d90236a6`.
The SDK case above was explicitly selected and passed separately; ignored cases are
not claimed as passes. The earlier pre-namespace broad run also passed 401/0, and all
original failed/sandboxed runs remain retained. No code changed during the final run.

The frontend passes 223/223, typechecking passes, final real renderer/core creation
passes eight groups, the exact packaged controller rehearsal passes, and the retained
Help renderer/core regression passes 11 groups against the final driver. Six focused
Python evidence-gate tests, workflow actionlint, repository validation and whitespace
checks pass. The actual Mac SDK source SHA256 is
`ff94e44deb297d5e75a86070dbf790fff0432c70fb5b7c098d920c94833cabf9`;
validation exits 0 and explicit Stop ends the run in cancelled phase with exit 0,
complete cleanup and no error diagnostics. That unchanged generated public-name
source/runtime path remains qualified; the final changes add creation refusals and
revision binding, with no scratch-preview implementation changes.

Visual finding: the unresolved-state captures remain readable at wide/compact light
and dark sizes without page overflow. The blank SDK capture is blank as expected.
The new creation dialog follows the modal pattern, but this task does not claim a
full flow-v1 layout match or canvas agreement. Functional finding: the named portable
creation/ownership/Source/history/reopen operations pass. Current-package native and
Windows proof remain missing, so the task is not accepted or closed.

Final cumulative use is 18/18 local batches, CI 0/2; Mac package attempts 3/3 at the
absolute ceiling, native launches 0/2 and SDK operations 4/4; Windows counts are zero.
Only the single Mac package contingency was used. Local/CI/native/SDK original limits
and their original contingency calculations remain unchanged. No allowance resets.
Both parent/group issue bodies read back exactly after their bounded L01 status
updates, preserving coverage maps and dependencies.

CURRENT (658 words) and HANDOVER (1,370 words) exceed their soft review targets because the pre-existing local
policy/status edits and unique protected recovery were retained. This task adds one
compact current L01 continuation and leaves the unrelated documentation work intact.
The final blocker is a decision for one additional current signed Mac package,
publication of the reviewed branch commits and the focused CI dispatch. No operation
is left running or pending remotely.
