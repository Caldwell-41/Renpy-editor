# Phase 3B architecture refactors

## Selected outcome

On 2026-10-27 Kris selected both architecture-report recommendations, each in a
separate subagent worktree, with an unchanged IPC contract. The coordinator owns
integration, a third subagent's two-axis code review, P1/P2 corrections, PR/CI,
merge after passing checks, safe cleanup and the requested completion notification.
[Maintenance issue #64](https://github.com/Caldwell-41/Renpy-editor/issues/64)
owns live scope and acceptance. The user approved the builds, tests, CI and SDK
runs needed for this outcome without a numerical cap. Historical closed selections
retain their original results and limits.

Base is `0d469a6e2c52132d9365f9d2b3a56120c5c51a9c`. The integration branch is
`codex/phase3b-architecture`, targeting `codex/phase3b-screen-designer`.
The issue records both implementation branches, worktrees and file ownership.
Mac ARM64 is the development host. The unrelated untracked Phase 1 audit and
protected native recovery remain outside this change.

## Implementation and verification

The Rust assignment is `6a31a9e456720d609dab4cde65ec0b2a8518c79e`.
The existing composition module owns shared Add structural eligibility; the canvas
planner reuses it. Saved-text validity, unfinished draft text, planner limits,
revision/source protection and existing refusal codes retain their distinct rules.
Two dispatcher/lifecycle tests exercise paired saved/draft cases and unfinished
text. The ordinary Screens scope passes 28 named cases with Rust 1.90.0; the
existing ignored SDK integration case was excluded from that local scope. Rust
formatting and whitespace checks pass. No native or SDK result is inferred.

The separate `architecture_refactor` Screens qualification selector reuses the
existing composition checks. It binds this branch and exact candidate, rejects
conflicting selectors before the expensive job, and preserves the old L02 branch,
ordinal and attempt restrictions. Local shell checks pass five selector cases and
ten candidate/task cases. Actionlint passes. The guard checks execute the actual workflow shell blocks.

The TypeScript assignment is `20d33e2f07c96bd82aa498f28c16b5a696d7cfa0`.
`ScreenCanvasFrames` owns request identity/freshness, render and health polling,
PNG installation, stale/error status and geometry readiness. The workspace retains
source/drafts, gestures and selection guides. Five module-interface cases cover
held replies, image readiness/error, helper health, hidden polling and disposal;
existing workspace cases retain mid-gesture, focus and accepted-addition checks.
All 264 frontend tests and the production build pass with Node 24.19.0, npm 11.9.0
and Python 3.12.14. The first full frontend run used Python 3.9 and failed one
existing validator because `tomllib` was unavailable; selecting the documented
Python version resolved it without code or fixture changes. The existing build
chunk-size advisory remains unchanged.

At integrated candidate `e3c75ef3e80be7031c06cff1178bab9103506f49`, the
production renderer/core sequence passes all seven required groups, exact source,
identities/history/reopen and cleanup. Additional pointer reorder, stationary
confirmation, stale-removal retention and selection-preference contention checks
pass at wide and compact widths. The wrapper identifies this as controller-only
Chrome proof; raw probe flags do not establish native WebView execution.

## Independent review

The third subagent applied the code-review skill to
`0d469a6e2c52132d9365f9d2b3a56120c5c51a9c...e3c75ef3e80be7031c06cff1178bab9103506f49`.
Its Standards and Spec reviewers ran separately and read #64 plus applicable
repository contracts. Standards has zero findings and no worst issue. Spec has
zero findings and no worst issue. No P1/P2 correction is required by that review.
The coordinator also inspected both assignment diffs and their integration.
The source review does not supply runtime or CI results; those are recorded below. Detailed raw checks are retained under ignored `.toolchains/architecture-64/`.


## Mac runtime qualification

Product inputs remain those reviewed at `e3c75ef`; candidate `694e2ff240f77f9534bb9bac331b5232285345c9`
adds only evidence/status text. The official Ren'Py 8.5.3 archive and retained
published checksum metadata match pinned SHA-256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The real-helper renderer/core sequence passes all seven groups, source-backed
selection and an unapplied draft addition with unchanged source. This proves the
changed frame-delivery path with actual PNGs; it adds no broader fidelity claim.

Signed Mac package 1 passes strict signature, approved identity, installer-content
and ARM64 checks. Executable SHA-256 is
`3ffd0bacff389dd5738452f0af26e09385120510a16b4269266185c6fd0db24e`;
installer SHA-256 is
`7a50cc0b517e14adac62fea37c9f6c3740efe95bd187ed576c8022da18788b8f`.
The existing composition probe passes seven required groups in native session 1,
exit 0, no timeout, in 9.256 seconds. Accepted bytes match, no scratch job/source
bytecode/save remains, each credential/host/request cleanup owner passes and the
fixture is removed. Desktop admission and final checks pass; both sleep assertions
are released and the receipt has no error. Input is synthetic DOM input in the
actual packaged WKWebView. This is not fresh physical-input or human acceptance.
Raw receipts are under ignored `local-01/native-mac`; package/identity records are
under ignored `.toolchains/releases/architecture-64-01/`.

## PR and CI dispatches

[PR #65](https://github.com/Caldwell-41/Renpy-editor/pull/65) targets
`codex/phase3b-screen-designer` from `codex/phase3b-architecture`.
[Qualification dispatch 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40514608438)
used an incorrect full candidate input. Both task/candidate guards failed before
dependency installation, compilation, SDK or native work. The coordinator cancelled
the run; its terminal state is cancelled and its failed guard steps remain failures.
Raw metadata/logs are retained under ignored `ci-01-wrong-candidate`.

[Qualification dispatch 2](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40514677531),
attempt 1, is the replacement, bound to exact candidate
`694e2ff240f77f9534bb9bac331b5232285345c9`, with `architecture_refactor=true`
and ordinal 2. The selected Windows x64/macOS ARM64 jobs include frontend/source/
metadata/desktop and real renderer/core checks; Windows additionally exercises the
verified SDK, real helper and packaged composition path. Other historical selectors
remain unselected. Its completed result and artifact audit follow below.

The PR's automatic Repository quality run is
[40514595303](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40514595303)
at that same head; a subsequent documentation-only push will have its own run.
The terminal audit below resolves the CI requirement. Private local continuation
metadata retains notification routing without adding it to the specification.


## CI terminal audit

Qualification run `40514677531`, attempt 1 / ordinal 2, completes successfully on
exact candidate `694e2ff240f77f9534bb9bac331b5232285345c9`. The selector gate and
both selected composition jobs pass. Both hosts pass 264 frontend tests, 28 ordinary
Screens cases, three metadata cases, 16 Source cases and the named Story refinement
case, plus desktop compilation and real renderer/core rehearsals. The existing
four-launch canvas lifecycle SDK case stays ignored in the ordinary Screens scope;
it is not claimed as a pass. The separate named composition SDK case executes once
on Windows with no failed or ignored case.

Both-host controller receipts complete all seven composition groups and eight
owned-screen renderer/core groups, including exact source/history/reopen and
protected/stale/refused edits. Additional pointer reorder, stationary confirmation,
stale removal and selection-preference checks pass. Windows real-helper selection
and inert draft addition pass. Its SDK receipt matches the renderer-accepted source,
compile/lint exits 0, deliberate preview retains its PNG, and owned Stop records
cancelled phase with Windows exit `-1073741510`, untruncated output, error-free
diagnostics and complete cleanup. Re-running the existing SDK admission validator
against the downloaded receipts passes.

The Windows x64 packaged native composition probe passes seven groups in 14.828
seconds, exit 0, no timeout, exact accepted bytes and all cleanup owners. The fixture
is removed; no scratch job, source bytecode or save remains. The retained PE header
is x64, and its SHA-256 matches the package identity and retained executable record:
`830454b3070c8ec44440f5365fc453b9858f9249505de74efcc29c7869768553`.
This is synthetic DOM input in the real WebView. The separately qualified signed
Mac package above supplies current Mac native proof.

Downloaded archives pass CRC checks and match both GitHub metadata and upload-log
digests. Their candidate files match the selected SHA. All three retained executable
hashes recompute correctly.

| Artifact | GitHub ID | Archive SHA-256 |
| --- | --- | --- |
| Windows | `12740117343` | `ccd6f4f8745b5432341c9fc2af2645c2537bdf1b91154f3e7a0a161f6df7526a` |
| macOS | `12738897613` | `4b4d4d72e7ed82496b93ad1cf05a6e0a7de091d2c356111a478ee80f2220608f` |

The first Windows job response retained stale in-progress metadata. Its exact-attempt
job record and check-run `122225483094` both confirm completed/success at
`2026-10-27T14:03:14Z`, on the selected SHA, with every required step successful.
This reconciles the metadata without a rerun. Raw logs, archives, extracted receipts,
executable identities and the local audit are retained under ignored `ci-02/`.

[Automatic run 40515307055](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40515307055),
attempt 1, passes both required jobs at PR head
`15c252f3a17034c9938dd0a4d085a0a599c7792b`. The only changes since qualification
are CURRENT, HANDOVER and this evidence file; `app/` and `.github/` are identical.
These are explicit material-input equivalence checks, not fresh native results at
a documentation successor.

## Merge and cleanup

[PR #65](https://github.com/Caldwell-41/Renpy-editor/pull/65) merged at
`99118a147a29937d293b3190b9cda545135e5876` into `codex/phase3b-screen-designer`.
Its tree exactly matches the checked PR head. The local integration branch was
fast-forwarded and the unrelated untracked Phase 1 audit retained its exact hash.
Both review axes have zero findings; there is no remaining P1/P2 issue.

The two implementation worktrees and six older Phase 3A/design-reference worktrees
are retired. Before retirement, six complete local archives preserved old source,
local changes and ignored evidence, excluding Git checkout pointers and reproducible
node dependencies. Their manifest records original commits, status and archive
hashes under ignored `.toolchains/retired-worktrees/pr65/`. The one distinct local
renderer CSS edit also has a verified Git recovery snapshot at local-only tag
`archive/pr65-phase3a-renderer-local-edit`. Other old worker commits are integrated
or patch-equivalent, and the reference-checkout differences match integrated files.
Approved captures and their pinned source commits remain available in the repository.

Five completed local branches and three obsolete remote branches were deleted only
after ancestry/equivalence and open-PR checks. Only the primary worktree remains;
`main` and the active Screens branch remain. The local recovery tag, protected native
state and existing stashes were preserved. No CI watch or product process is pending.
The user-requested completion notification is the final closeout action.

CURRENT is 1,741 words and HANDOVER is 3,465 words, above their review targets.
They retain earlier candidate-specific acceptance limits and protected native recovery;
this closeout replaces its live section without deleting that inherited evidence.
