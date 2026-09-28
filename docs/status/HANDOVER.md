# Current checkpoint handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-Q1-PREP review and corrections, `review_ready` for Q1-EXEC selection.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Reviewed publication:** `e8dc1fac3c2f2c6844026a70ba34133a70427bb4`, verified on origin.
**Correction identity:** the successor commit containing this review record; resolve
its exact SHA from Git. This is not an instruction to republish the original prep.

**Authority:** the user requested review of Luna's Q1-PREP work and correction of
issues, including the potential macOS blocker. This checkpoint makes those corrections
and recommends the next execution goal; no qualification dispatch or merge was selected.

## Review outcome

The [detailed review](../tasks/active/testing-policy-alignment.md#q1-prep-review-and-corrections--2026-09-28)
and [Phase 1G ledger 37](../tasks/active/phase-1g-branches-runtime-git.md#37-q1-prep-review-and-corrections--2026-09-28)
record the findings and proof limits:

- Shared workflow helpers select `python` on Windows and `python3` on macOS.
- Three Rust formatting differences that failed preflight are corrected.
- Scanned macOS failure evidence uses a tar to preserve bundle permissions, links
  and hidden entries; both archive and contained executable hashes are recorded.
- Package manifests reject mismatched case identity; synthetic tests exercise the
  real retention CLI. Publication status and stale policy-migration claims are fixed.
- Ordinary recovery/SDK assertions, exact selectors and prior fixes are preserved.
  No production behavior, dependency, lockfile, budget or historical result changed.

Fresh remote review: origin matched the reviewed prep; main remains
`4d7ba0333c48d60242a9a42d3e079fea499a5531`. PR #17 has no comments/reviews and is
conflicting. Repository access includes push/admin; the production workflow is active;
no rules were returned for the feature branch. Recheck mutable state before dispatch.

## Validation and capability

Gate rejection fixtures and source audit pass. Synthetic retention tests: seven pass,
one POSIX symlink case skipped on local Windows (selected in Ubuntu preflight).
Workspace `cargo fmt --check --all` and all 20 explicit Bash step syntax checks pass.
Repository validation and whitespace checks pass. No standalone YAML/schema parser
was available. Rust tests were not compiled/run; hosted behavior remains unverified.
No app/browser/SDK launch, package build, CI dispatch or specialist exercise ran.

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Prior candidate qualification retained; coherent final gates pending | MAC-N1 supporting assessment retained; Windows native and final acceptance open |
| Runtime foundation / R1 | Yes, prior fixes retained | Prior closure retained; final-source SDK regression pending | Final packaged/native acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Standard two-target package qualification incomplete | Focused final user session on both platforms open |

WIN-F1 ledger 27 and MAC-N1 ledger 32 retain their candidate/fixture limits. TEST-P2
ledger 33 keeps Chrome timing diagnostic and functional/evidence failures blocking.
R2-P1 `36293797731` and H1 `36310107481`, attempt 1, remain FAIL on their original
candidates. Their allowances are not renewed. No operation is pending.

## Next goal and distance to Phase 1G closure

**Next: R2-P1-Q1-EXEC**, the bounded standard automated qualification, not another
planning-only review. Starting the prompt below selects execution. Follow the
[Q1 execution scope](../tasks/active/testing-policy-alignment.md#amended-r2-p1-q1-proposal--not-selected):
one existing production dispatch with `upload_packages=true`, one Tauri build per
target, five existing cases plus boundary smoke per target, no retry. Verify exact
run/attempt/SHA, source/executable/archive hashes and artifact availability. If still
running, publish its identity and manual-resume handover; do not actively poll.

Implementation is present; three closure stages remain: (1) successful coherent
Windows/macOS automated qualification, (2) Windows native responsiveness/input and
focused final human acceptance on both platforms, (3) final review, PR conflict
resolution/integration and affected gates under their own selection. A new finding
can require a bounded correction. Integrated 1H is a separate subsequent milestone;
optional Git and Phase 2 remain excluded. No reliable percentage or elapsed-time
estimate follows from the current missing evidence.

```text
/goal R2-P1-Q1-EXEC only
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Codex machine: Any with repository and Actions access; no specific OS required.
Test execution: One production workflow dispatch on windows-2025 x64 and macos-26 ARM64, upload_packages=true; no physical machine needed.
Reason: Qualify the corrected standard packages on both supported targets.
Read AGENTS.md and docs/status/HANDOVER.md, then execute the linked Q1 scope. Recheck candidate/access, dispatch once, audit evidence and publish the ledger/handover. No retries, conflict resolution, merge or 1H. If pending, record exact operation identity and stop for manual resume.
```
