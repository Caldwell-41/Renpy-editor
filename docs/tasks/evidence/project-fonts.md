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

Next: confirm the test boundaries, record the selected qualification limits in
#39 when tracker approval is available, then implement font admission and typed
minimal text edits while the design chat obtains approval.
