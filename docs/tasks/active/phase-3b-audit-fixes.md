# Selected Phase 3B audit fixes

Kris selected these corrections on 2026-11-01, with parallel GPT-6.1 Sol High
workers using `principle-fix-root-causes` and `mattpocock-skills:tdd`. The
coordinator reviews the integrated changes against the original triggers, opens a
draft PR and runs selected CI. Merge and wider Phase 3B acceptance are separate.

The fetched Screens base is `c5f4ab18bc0fd9c1e73a5a97b5ce10d9534cd57c`, including
PRs #72-#74. Integration uses `codex/phase3b-audit-fixes`. This is maintenance of
accepted behavior, not a new Phase 3B feature or a replacement for its GitHub map.
The separate maintenance-issue publication was rejected by automatic approval
review; this local record owns execution without publishing that issue.

## Selected scope

Numbers identify the consolidated audit findings, not GitHub issue numbers.

| Group | Findings and expected correction |
| --- | --- |
| Core Screens | #4 distinguishes Python statements during ownership scanning; #5 separates successful creation from fallible catalog refresh; #6 refuses omitted canvas content; #9 protects ambiguous interleaved comments; #12 permits safe literal alias edits; #18 recognizes equivalent grid-policy whitespace. |
| Workspace and numeric controls | #2 uses parent bounds for provisional resize; #11 retains invalid numeric spelling; #17 keeps unrelated grid edits available when cell count is unknown. |
| Helper lifecycle | #8 replaces a failed helper only after successful cleanup, preserving drafts and current-request ownership. |
| Text validation | #14 gives field-specific feedback for the existing UTF-8 byte limit in existing and added text. |
| Image previews | #16 preserves or restores visible selected thumbnails within the existing cache budget, including pending picker loads. |

Findings #1, #3, #7, #10, #13 and #15 are explicitly excluded. Preserve current
source authority, shared transactions/history, conflict protection, inert helper,
approved UI and signing/credential identities. No new design is selected.

## Acceptance

- Each selected trigger has a focused failing test before its correction and a
  passing result afterward. Keep one vertical TDD slice at a time.
- Accepted source patches preserve opaque neighbors, comments, revisions and
  shared history. Invalid, stale and conflicted drafts remain available.
- The coordinator reviews every selected finding after integration and runs the
  affected real controller/core paths and combined checks.
- The draft PR targets `codex/phase3b-screen-designer`. Its validation plan selects
  all required CI before publication; terminal results and evidence are audited.

## Confirmed test boundaries

Kris confirmed these boundaries in the selecting conversation:

1. Screens workspace DOM controls catch drafts, guides, focus and thumbnails;
   they do not establish native painting.
2. Public core/IPC operations and existing controller-to-core journeys catch
   parsing, source preservation, accepted bytes and shared history; they do not
   establish OS rendering.
3. Public canvas render/status lifecycle with a controlled helper-process boundary
   catches failure, cleanup and retry. Focused platform qualification follows where
   the changed behavior requires it.

## Delivery and host ownership

Mac ARM64 coordinates development. Workers use separate T3-managed worktrees and
disjoint files under the [assignment record](../evidence/phase-3b-audit-fixes.md).
The coordinator owns shared contracts, status, CI selection, integration and review.
The linked Windows host SUNDOWN has a bounded test-only assignment for the exact
published candidate. Mac real-SDK recovery passes; Windows evidence is pending.
The evidence record owns both-host limits and actual consumption.

Routine checks need no numerical allowance. Workers run focused local checks;
the coordinator selects costly qualification and records its limits before it
starts. Historical closed allowances remain closed. Protected recovery and the
unrelated untracked audit remain untouched.

Current state: all five groups are reviewed and integrated in draft PR #75.
Combined local verification and Mac SDK recovery pass. CI1 exposed a browser-fixture
ordering defect; its correction passes locally. Corrected CI and Windows proof remain. Detailed
red/green results, integration findings, host operations and CI receipts belong in
the linked evidence.
