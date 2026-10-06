# Current outcome handover

## 0.1.0 publication preparation — 2026-10-07

**State: blocked on the user's public unsigned-preview decision.** The user requested
publication of accepted Phase 1 as 0.1.0. Preparation is complete; no GitHub Release/tag
or new build/CI dispatch/native launch has been created. Codex machine macOS ARM64;
existing qualification hosts Windows x64/macOS ARM64.

**Continuation:** main documentation preparation follows accepted baseline
**`a3d89c233971dc16c280e53fb328c3f8f3dd84f6`**. Proposed tag **`v0.1.0`** targets
the resulting documentation-only preparation checkpoint, pinned in the ignored release
provenance after commit; it includes the corrected public README.
[Owning release task](../tasks/active/release-0.1.0.md) records hashes, artifact identities,
verification and the exact policy decision. Read that small task on resume.
Prepared notes: ignored `.toolchains/releases/0.1.0/release-notes.md`; eleven staged
assets in its `staged/` sibling, including three installers, checksums, provenance,
build inputs and licence/inventory files. They are original production **37529174148/1**
packages at exact **`ba01a84cd7f860be6e8717e98216bdf747875073`**, not a new build of main.
Artifact privacy scan, all ten checksum entries and Mac DMG integrity Pass. Installer
execution/uninstallation and installed-app launch are unqualified for these packages.

**Pending decision:** GitHub repository is public, packages unsigned/not-notarized.
ROADMAP/SECURITY require signing/notarisation and install/launch evidence before wider
binary distribution. The user has been asked to approve a one-off early public-preview
exception with all limitations disclosed, or choose signing/installer qualification first.
Do not publish without their answer or silently substitute a different release scope.
No CI/process/recovery/profile operation is pending. No new matrix or signing setup
allowance has been requested/consumed.

**Next action:** on explicit exception approval, inspect current tags/releases/refs,
finalise prepared notes, publish the pinned `v0.1.0` with original staged packages,
verify actual release/tag/asset hashes, record publication and archive the task.
Use same-thread continuation. On a different answer, proceed only within that chosen
scope and preserve all prepared material. Do not reset the accepted tag target to an
old prompt SHA or rebuild unchanged inputs to validate documentation.

**Preserved baseline/work:** Phase 1 remains accepted/closed through PR #18 merge
`82d4518`, required main quality **37536967028/1**, closure `a3d89c2`, final quality
**37537337718/1**. [Archived closure/evidence](../tasks/archive/2026-10-07-phase-1h-vertical-slice-acceptance.md#independent-review-integration-and-phase-1-closure--2026-10-07)
retains all failures, counts and limits. Planning worktree **`2c5a164597779331af9ff81bf0eb3bdabb41ddb7`**,
unpublished **`6330291`**/**`2c5a164`**, remote planning **`267ec2a`**, other PRs/refs and
archive tags remain untouched. Phase 2/3, optional Git and signing implementation are
unselected. This continuation selects release preparation, not a new autonomous Goal.
