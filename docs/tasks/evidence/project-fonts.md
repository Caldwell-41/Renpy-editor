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

## Core implementation and qualification preparation

Kris approved all three test boundaries and tracker updates, then directed
continuation through testing, review and commit. The
[owning issue comment](https://github.com/Caldwell-41/Renpy-editor/issues/39#issuecomment-6497848293)
records the selection and qualification ceilings. The earlier tracker rejection
is resolved by that explicit approval. Code publication remains unselected.

Public-request tests pass typed TTF/OTF import, invalid-byte refusal, shared
history and reopen, exact minimal text/font edits, no-op history, expression
preservation, property reset with a valid remaining block, typed font specimens,
asset/source refusals and inert typography drafts. Font parsing uses pinned
`ttf-parser` 0.25.1 with its standard-library feature. The 16 MiB import limit
matches bounded font presentation and shared history. No project code executes
during these reads or edits.

The first broader Screens run passed 65 cases, failed the existing grid-expression
refusal case and ignored three explicit SDK/helper cases. Recognizing text
expressions changed that grid's child count and returned `INVALID_PAYLOAD` instead
of its previous `OPAQUE_BOUNDARY`. The correction retains conservative grid
count/add and structural-edit refusal around text expressions. The original
focused grid test then passes. The first run remains failed in ignored local
`project-fonts/core-01.log`.

Preparation also caught three check/configuration mistakes: the wrong-role fixture
helper returned the catalog's first asset, the passive-media assertion used a
nonexistent error code, and the initial exact fixture selector matched zero tests.
The corrected cases select the image by role, assert the existing `INVALID_PAYLOAD`
response and run the full exact test name with one passing result. The first
font-parser compilation also required enabling `std`. No product gate was relaxed.

The accepted SDK input is generated through public asset/screen/Source requests.
It covers TTF/OTF, line wrapping, alignment, bold/italic, four hex color lengths
and proposed whole-pixel size bounds 1 and 512. Its checker compares actual
placement and pixels with an independent literal Ren'Py reference and checks
that both project fonts differ from the bundled fallback. The offline gate rejects
missing fonts, fallback fonts, unwrapped text and wrong placement. No SDK result
has yet been established.

Next: qualify the generated source in the pinned SDK, connect A2 to the real
controller and services, then finish affected desktop checks and both review axes.
