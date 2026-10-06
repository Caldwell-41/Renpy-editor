# Loomlight 0.1.0 publication

**Selected:** 2026-10-07, user: “Can we publish this as a 0.1.0 release?”
**State:** `blocked` on the public unsigned-preview policy decision; preparation complete.
**Codex machine:** macOS ARM64. **Qualification hosts:** Windows x64/macOS ARM64.
**Reason:** publish the accepted Phase 1 baseline as version 0.1.0 without rebuilding
unchanged qualified inputs or overstating installer/signing evidence.

## Concrete proposed release

- GitHub Release tag `v0.1.0`, title “Loomlight 0.1.0 — Phase 1 authoring preview”.
- Proposed tag target: main’s release-preparation checkpoint following accepted baseline
  `a3d89c233971dc16c280e53fb328c3f8f3dd84f6`. It includes the corrected public README
  and preparation record, with no application/test/workflow/dependency input changes.
  The exact prepared target is pinned in the ignored release provenance after commit;
  recheck it against fresh refs before publication.
- Original packages from production **37529174148/1**, build commit
  `ba01a84cd7f860be6e8717e98216bdf747875073`, not rebuilt or relabelled as new execution.
  Installer artifact IDs **11444776647** Windows and **11444341856** Mac; both available
  and downloaded before their October 13 expiry.
- Windows NSIS installer SHA-256
  `18e9e943429aeae8ea03a5a9f3cd88d1718d5d09e65ca9a09e91bfd44ad60378`.
- Windows MSI SHA-256
  `04a2c4818492d403dec8440fb96b2aeaa053084a6441ddfd96e258da72accd4c`.
- Mac ARM64 DMG SHA-256
  `c8dec696d79a928c3d70f156d654bdc021415afac3684b666217b5f88d25db3f`.
- Attach original installers, `LICENSE`/`NOTICE`, per-host dependency/licence inventories,
  original build-input receipts, release provenance and `SHA256SUMS.txt`.
  Notes describe implemented Phase 1 features, supported SDK/hosts and retained limits.
  Formal SBOM/reproducibility certification is not claimed.

Prepared notes are ignored at `.toolchains/releases/0.1.0/release-notes.md`; eleven
staged assets live in its `staged/` sibling. All ten listed checksums were independently
re-read and verified. Existing artifact privacy scan passed for all eleven staged
files; `hdiutil verify` confirms DMG integrity. These checks do not execute installers
or prove installation/uninstallation. No new CI dispatch, package build, native launch,
tag or Release has been created. Fresh GitHub inspection found no existing releases
or 0.1.0 tags. README's obsolete “no authoring workflow” text is corrected in preparation.

## Required decision

The repository is **public**. [ROADMAP release discipline](../../ROADMAP.md#release-discipline)
allows unsigned builds only for genuinely private distribution and requires signing/
notarisation before wider release. [SECURITY release baseline](../../SECURITY.md#release-and-incident-baseline)
likewise says “Signing/notarisation and a secured update channel are required before
broader distribution.” The policy also records install/launch evidence for releases.
The exact retained packages are unsigned/not-notarized; installed-app execution has
not been separately qualified. A public prerelease is still public distribution.

The user has been asked to explicitly choose a one-off unsigned public-preview exception
with unqualified installer paths disclosed, or signing/installer qualification first.
No exception is inferred solely from the release request. No publication until that
answer arrives. No signing-credential setup or extra target matrix is authorised by
this preparation; any selected qualification work needs its concrete scope/allowance.

## Continuation

On approval, recheck release/tag/ref state, preserve the pinned tag target, finalise
notes to record the explicit exception, create the tag/release with the staged assets,
verify public metadata and uploaded asset checksums, then record exact publication
identities and archive this task. Required ordinary documentation quality applies to
repository publication; do not rebuild unchanged packages. On a different selection,
retain prepared assets/evidence and follow only its authorised scope.

The [Phase 1 closure](../archive/2026-10-07-phase-1h-vertical-slice-acceptance.md#independent-review-integration-and-phase-1-closure--2026-10-07)
remains accepted. Planning worktree `2c5a164`, unpublished `6330291`/`2c5a164`, remote
planning `267ec2a` and all failed/native evidence remain untouched.
