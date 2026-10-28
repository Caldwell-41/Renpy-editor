# L04 nested and clipped layout evidence

[#42](https://github.com/Caldwell-41/Renpy-editor/issues/42) owns scope, acceptance,
operation limits and current consumption. The implementation branch is
`codex/phase3b-l04-nested-layout`, based on `eb83d3b`. CI1 and the signed Mac native case pass. The artifact audit is complete; the
implementation is ready for review with the combined Design Lab gap retained.
Independent Standards and Spec review each report zero findings at `228fe23`,
including the final policy notice and bounded probe retry correction.

## Approved design and integration

Kris approved A2 `focused-refined` / `focused-v2` with "approved".
[Approval](../../design/design-lab-nested-layout/approval.json) pins source
`b2fffee2a3983ff309c27502fdfc215f56b1ccd0` and fingerprint
`98ceba77f44a69e91840ea4afa09e0e19118656fc9caa474a765753d5269e42d`.
The seven scoped prototype commits were integrated sequentially. All 13 source
hashes and 14 captures verified, and the source fingerprint reproduced before
production edits. The prototype worktree remains pinned for comparison.

The existing combined Design Lab check remains failed at initial navigation's
8-second timeout. Its external 45-second diagnostic remains failed at flow-v1's
changed-source refusal after 488 cases. The approved prototype's focused 64 cases
and interactions passed; these failures are not a combined-gate pass or waiver.

Production extends the existing composition and numeric-layout owners. Grid counts
join other element fields in one Apply. Window/frame/viewport use one direct child;
grid uses literal 1-64 axes, row-major order and explicit empty-cell permission.
[Data model](../../DATA_MODEL.md#nested-containers-and-viewport-limits) owns the
bounded mappings and Source-only behavior. The Source modal retains screen drafts
and opens the existing editor through Edit in Source. Existing Source-navigation
probe consumers were migrated to that explicit action.

## Portable and real UI/core checks

The first core slice failed at unsupported composition, then passed new-container
creation, stable identity, Undo/Redo and reopen. Further public requests verify
minimal grid-header/layout changes, one history entry, no-op, capacity refusal,
canvas-draft validation and lossless Source-only viewport refusal. A public-core
fixture prepares both accepted viewport heights used by SDK qualification.

The real browser/controller/core sequence passes grid creation/editing, capacity
errors, focused Apply, Cancel, Source-modal draft retention, parent navigation,
retained child drafts and stale Source reconciliation. The exact packaged L04
probe also passes its real-core browser rehearsal, including nested composition,
viewport/source edits, protected neighbors, grouped removal/history and reopen.
These browser results do not establish native WebView or SDK execution.

The frontend suite passes all 264 cases. The 43 affected existing screen component
cases also pass. The ordinary broad core run passed 402 cases and failed 31 unrelated transport
cases because the sandbox denied localhost sockets. All 38 cases in that affected
module pass with socket access, resolving those 31 failures. Combined ordinary
coverage is 433 cases; 49 explicitly selected-out SDK/specialist cases remain ignored
and three policy exclusions remain filtered. The four initial core cases pass again
with explicit grid count units. The review adds one six-shape grid regression; all
42 ordinary screen-core cases pass after the corrections. No failed required case is treated as a pass.

## Mac SDK geometry and clipping

[Local SDK receipt](nested-layout/local-sdk.json) retains the accepted-source hashes,
four normal-entry aspect/opening records, helper backend and cooperative shutdown.
The public fixture contains window padding, an hbox, a 2x2 grid with an empty cell,
and a viewport containing larger content. Normal game entry qualifies 1280x720 and
1024x768 at openings of 100 and 200 pixels. Exact rectangle checks pass. Alpha-render
samples establish that the right edge clips, increasing height reveals content,
and the surrounding window background remains outside the opening. Pixel checks
compare exact colors within the same source render; no tolerance is introduced.

The inert GL2 helper passes the same four conditions and five empty-container
cases: saved-empty viewport, pending empty window/frame/viewport, and last-child
removal. Empty single-child containers receive the implicit Fixed that Screen
Language supplies. Its visible descendant hit
bounds match the clipped opening, and completely clipped text has no canvas hit
region. Closing the project stops the helper cooperatively with exit 0 and removes
its private directory. Full GPU pixel agreement remains with L19.

These local checks used the implementation working tree before its commit. Later
formatting and UI/probe changes do not change the SDK displayable mappings or accepted
fixture bytes. The grid count-unit refinement changes typed request validation,
not the integer data passed to the SDK. Focused public-core/UI checks cover that
refinement; the final native candidate and Windows qualification remain separate.

## Retained failures and corrections

- Helper attempt 1 stopped during preflight at a numeric JSON lookup. No helper/SDK
  process started. Attempt 2 reached the missing displayable mapping and failed with
  `Unsupported canvas kind`. Attempt 3 passes after the four SDK mappings were added.
- Source campaign 1 stopped on a package-relative input-path error before launching.
  Campaign 2 passed compile/lint and reached correct geometry, then rejected the
  validator's incorrect intrinsic-size expectation for clipped content. Its software
  framebuffer screenshot is striped and is excluded from pixel proof.
- Retained pixels and pinned SDK source distinguish framebuffer byte-format corruption
  from layout errors. [Earlier diagnostics](canvas-rendering.md#decisive-results)
  already exclude software window captures. Campaign 3 used an incorrect export
  namespace and exited 61. Campaign 4 uses `SWDraw.render_to_texture` with alpha and
  passes all four cases. It reuses campaign 2's compile/lint only after verifying
  byte-identical accepted inputs and successful, untruncated command receipts.
- The Source modal's first UI check caught Escape cancelling the underlying layout
  draft. Isolating modal keystrokes fixes the original sequence. The native-probe
  rehearsal caught reads completing before the UI history refresh; it now waits for
  the accepted fields. Returning from Source also explicitly opens Choose before
  inspecting hierarchy rows. No deadline or assertion was weakened.

Raw local receipts remain under ignored `.toolchains/l04/`, including original
failures, screenshots and logs. Package-relative copies were preserved and copied
into that owning directory. Current actual use is Mac SDK 12/16 and helpers 4/4. The helper allowance is
exhausted. Signed package builds use 3/3 and native sessions use 2/3. At that pre-publication checkpoint no costly CI dispatch had started; final
consumption is recorded in the CI1 audit below.


## Independent review corrections

Standards found two P2 grid validation defects; Spec found those and the empty
viewport helper defect. Public IPC reproduced grid shrinking across opaque children
and growth under strict/missing empty-cell permission. The corrected model blocks
only ambiguous grid count changes, preserves safe unrelated spacing, and requires
explicit empty-cell permission for child Add/removal. Literal id/numeric properties
remain harmless to direct-child cardinality. Both reviewers confirm their original
implementation findings are fixed; Spec's remaining policy-notice copy correction
is included. No additional Standards baseline finding or scope-creep finding remains.

A new six-shape public-core test covers conditional/use/expression children, strict
and missing permission, and a literal id. It fails before the guards and passes
afterward. Real UI/core checks also retain the refused count draft, save unrelated
spacing, and refuse strict-grid child removal without a source write. The inspector
reports `allowsEmptyCells` and names Source-only policy/count limits visibly.

The third actual helper session reproduced `NoneType.style` when rendering a saved
empty viewport. The fourth passes all empty and populated cases after the implicit
Fixed correction. Failure and successful receipts remain under
`.toolchains/l04/helper-04-red/` and `helper-05-final/`. This uses Mac SDK 12/16 and
helper sessions 4/4. No additional Mac helper launch is selected. Normal-entry SDK
source bytes and populated mappings remain unchanged; their earlier proof retains
its scope. A fresh post-review public-core export produces identical renderer node
data for the populated fixture apart from source-revision identity.

## Signed Mac native qualification

[Candidate-bound receipt](nested-layout/mac-native.json) records package build 3
at `228fe2303e361bf8522d13ffcc09e9ce445bd3c9`. The approved certificate, strict
signature and installer contents verify. Native session 2 passes all six stages,
exact accepted disk bytes and reopen identities. Host/request/credential cleanup,
fixture deletion and desktop power-assertion release complete. There are no disk
errors, scratch jobs, source bytecode or saves. Input is synthetic DOM input in
the packaged WebView; physical-keyboard and human acceptance remain separate.
This disposable Source profile starts no SDK/helper process.

Package 1 at `b84c863` and package 2 at `9beb09a` passed identity checks but are
unqualified. Session 1 at package 2 failed before screen creation when the probe
converted `RUNTIME_BUSY` to an error without its structured code. Its cleanup
completed; missing owned-source evidence remains a failure. The existing H25/P03
incident guidance led to the exact browser/core rehearsal with an initial
probe-specific busy read. It reproduces the failure, then passes after preserving
the error code and restricting retry to four reads. Mutations and report
publication are single requests. No deadline or acceptance assertion changed.
Both review axes checked that correction and report zero findings.

The initial push refusal is resolved by Kris's explicit approval for push, draft
PR and bounded CI. [Draft PR #67](https://github.com/Caldwell-41/Renpy-editor/pull/67)
targets the Screens parent. No merge or release is selected.

## CI1 dispatch and audit record

[Run 40742930659, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40742930659/attempts/1)
is the first costly dispatch, at exact candidate
`dedf92088c11309801fe03e9449b4a64b5f758a2`, branch
`codex/phase3b-l04-nested-layout`, selector `nested_layout=true`, ordinal 1.
The candidate differs from signed Mac `228fe23` only in four evidence/status files;
application, probe, tests, SDK mappings and accepted fixtures are identical.
Both-host portable/controller checks and Windows SDK/helper/package/native
qualification passed; the terminal artifact audit below establishes their scope.

Dispatch consumption is 1/3. CI1 reserves up to seven Windows SDK launches,
including one helper, one package build and one native session. Actual Windows
starts will be counted from retained steps/artifacts, including failures. Mac
usage remains SDK 12/16, helpers 4/4, package builds 3/3 and native sessions 2/3.
No Mac SDK/helper/package/native execution is selected in this CI route.

The installed ci-watch skill will register a same-chat watch after this checkpoint
is published. Registration is confirmed only by its `watcher_running: true`
acknowledgement. On resume, verify the exact run/attempt/SHA, audit both artifacts
and automatic PR checks, preserve failed proof and operation counts, then finish
the four criterion-to-evidence results. Missing or failed proof prevents closure.

## Terminal CI1 audit and review handoff

[CI1 receipt](nested-layout/ci1.json) records exact run 40742930659, attempt 1,
`dedf920`, both artifact IDs/digests, source hashes, four SDK records, helper
shutdown, Windows x64 identity and native disk/cleanup results. Both artifact
candidate files match. The two selected matrix jobs and selector validation pass;
all other qualification routes were intentionally unselected. Both hosts pass
264 frontend cases and all 42 ordinary screen-core cases. Two explicit SDK cases
are ignored in the ordinary slice; Windows runs the selected nested helper case
separately and passes. Controller, exact-probe rehearsal, eight owned-screen groups,
eleven Help groups and migrated numeric-layout checks pass on both hosts.

The Windows official checksum check passes. Six source SDK starts pass compile,
lint and the four aspect/opening runs. Re-reading the four PNGs verifies their
hashes and exact geometry/clipping assertions. The helper's four populated
records and five empty cases pass on ANGLE; visible descendant bounds and hidden
hit exclusion agree with the opening. Its one process stops cooperatively with
exit 0 and complete private-directory cleanup. Mac and Windows accepted fixtures
differ only in the generated screen-owner UUID; all layout/text/source statements
match. Full GPU pixel equivalence remains with L19.

The Windows package receipt binds the x64 executable hash to `dedf920`. Native
WebView input passes every required stage, exact accepted disk bytes, protected
neighbor and identity reopen, exit 0 and fixture cleanup. No scratch jobs,
bytecode, saves, disk errors or external errors remain. The case starts no SDK.
Signed Mac proof at application-identical `228fe23` retains its approved identity
and desktop admission/power-cleanup receipt. Neither native case claims physical
keyboard, pointer, IME or human acceptance.

Final use is dispatches 1/3. Windows uses SDK 7/16, helpers 1/4, package builds
1/3 and native sessions 1/3. Mac remains SDK 12/16, helpers 4/4, package builds
3/3 and native sessions 2/3. The exhausted Mac helper/package ceilings remain
closed. No further expensive execution is selected. Automatic PR quality run
40743147857 passes both required checks at `2f0386a`; that head differs from CI1
only in status/evidence. Later audit-document commits require their own cheap
quality result, with application equivalence retained.

### Visual fidelity and functional correctness

[Comparison receipt](nested-layout/visual-comparison.json) and three captures
compare the A2 six-child grid (2x3, spacing 16) and 580x260 viewport inspector in
dark mode at 1100x720 and compact 560x640. The paired count/spacing controls, dense
inspector, position/anchor pairs, Apply/Cancel and compact canvas toggle follow
`focused-v2`. Existing production toolbars and screen selector add vertical space;
they retain existing capabilities. The grid notice states the actual empty-cell
policy. Compact layout has one shell/header/footer and no horizontal overflow.
The first immediate-resize capture had stale browser paint; two animation frames
produce the retained capture and measured layout. No production change was needed.
A throwaway source generator initially indented the explicit grid permission at
the wrong depth; the corrected comparison uses the prototype's exact nesting.
Those failures remain in ignored local evidence and are not accepted captures.

Functional correctness passes the real operations mapped below. The comparison
uses no SDK canvas frame and makes no schematic-to-SDK pixel-equivalence claim.
The full combined Design Lab check retains its startup/reference failures. This
is a scoped visual-fidelity finding, not complete promotion validation or a waiver.

| #42 criterion | Functional result and evidence |
| --- | --- |
| Add/edit/reorder containers and declare viewport limits | Pass. Public composition/history tests, both-host real UI/core, native stages, count/padding/spacing mappings and DATA_MODEL. |
| Nested grid, constraints, clipping and lossless Source | Pass. Four source SDK renders per host, helper clipped bounds, opaque/strict grid regression, exact source/disk checks. |
| Pinned SDK at both aspects and honest Source-only behavior | Pass within stationary top-left scope. 1280x720 and 1024x768, openings 100/200; expressions/scroll controls visibly remain Source-only. |
| Selection, partial coverage, history, conflicts and reopen | Pass. Both-host controller sequences and packaged native history/reopen stages, plus public-core lossless requests. |

The implementation is `review_ready` in draft PR #67. Ticket #42 stays open;
its final acceptance/closure retains the combined lab validation gap and any user
review disposition. No merge, release or wider Phase 3B acceptance is claimed.
