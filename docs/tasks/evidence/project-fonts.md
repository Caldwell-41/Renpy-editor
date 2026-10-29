# Project font evidence

[L05 #39](https://github.com/Caldwell-41/Renpy-editor/issues/39) owns the selected
outcome and acceptance. Kris selected implementation on a new branch on
2026-10-29. The implementation branch is `codex/l05-project-fonts`, based on
`8f0d208`. Mac ARM64 is the development host. Windows x64 and Mac ARM64 evidence
must cover the affected paths.

## Preparation, 2026-10-29

The separate "Ticket 39 font and typography mockups" chat owns only L05's Design
Lab screen, registry entries and approval/capture directory in its own worktree.
The implementation owner retains production code and qualification. Production UI
integration waits for Kris's explicit mock approval and the design handoff.

The proposed test boundaries are public asset/screen services, the actual screen
controller connected to core, and pinned Ren'Py output. The TDD skill requires
confirmation before writing tests at these boundaries; that question is pending.
No new test or production code has been written.

Unmodified TTF and CFF OTF fixtures are retained with their upstream revision,
SHA-256 hashes and license in the [font fixture directory](../../../tests/fixtures/phase-3b-screens/fonts/README.md).
They establish reproducible inputs, not font admission or rendering proof.

Baseline frontend typechecking passes. The ordinary screen-core selection passes
58 tests; three explicitly selected SDK/helper cases remain ignored. This run
starts no SDK, helper, package or editor session. Local tools match the repository
pins: Node 24.19.0, npm 11.9.0 and Rust/Cargo 1.90.0.

Automatic approval review rejected the initial GitHub progress comment because
the implementation request did not explicitly authorize publishing its branch,
host and operation-limit details. No tracker mutation occurred. The exact proposed
comment is retained in ignored local output, and a user approval question is
pending. All costly-operation counters are still zero. No code push, PR, merge,
release, native, rendering or ticket acceptance is claimed.

The initial next step was to confirm the test boundaries and obtain mock approval.
The design approval below resolves the latter; boundary confirmation and tracker
approval remain pending.

## Approved A2 handoff, 2026-10-29

Kris approved `project-font` / `inspector-v2` / `refined` in the design chat with
"Approve A2 and send it back to the original implementation chat."
The [handoff](../../design/design-lab-project-font/HANDOFF.md) maps every control
to its required real operation and retains the design's simulation limits.

Reviewed source `79d958d5c45dfd12073c2192de05128d6ed19a91` and approval commit
`54f4ebb8112b6becdc1d24e6228c6a9fb70957c5` are integrated through local
`38d26b7`, `965e6d4` and `804405d`. The implementation checkout's frontend/lab
fingerprint matches the approved
`83a92587e4c13ad2a94fa1c69dbfcd6c87ef927062359939f0d1bd3969472cfc`.
Design Lab TypeScript and approval checks pass, and all 18 retained capture hashes
match. The original worktree remains the pinned comparison reference.

The design agent reports a passing focused 24-case matrix and interaction check.
Its combined Design Lab check remains failed at initial startup navigation; the
handoff identifies the retained output. Integration neither reran that unchanged
failure nor claimed full promotion validation. Actual font specimens, writes,
persistence and native behavior remain unqualified. No production code changed.

Next: confirm the three proposed test boundaries, record the selected limits in
#39 when tracker approval is available, then implement the approved controls and
their real service operations. Both pending questions remain with Kris in the
implementation chat; design approval does not answer them.
