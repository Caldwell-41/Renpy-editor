# L07 shared-look evidence

[L07 #43](https://github.com/Caldwell-41/Renpy-editor/issues/43) owns execution and
bounded acceptance. This file records detailed evidence, not a second task brief.

## Design preparation, 2026-10-30

Kris selected implementing ticket #43 on a new branch. The branch is
`codex/l07-shared-looks`, based on Screens commit `e9e8661` including the accepted
L05 prerequisite and #71's text-draft ownership fix. Development is on Mac ARM64.
The unrelated untracked Phase 1 audit and protected native recovery are preserved.

Three distinct [Design Lab drafts](../../design/design-lab-shared-look/README.md)
compare inspector/dialog, library/two-preview and inline-review workflows. The
registered screen is `shared-look`; each variant has a null approval record.
Production files, SDK/helper code, IPC and transaction behavior are unchanged.

The same renderers also bundle to an ignored offline HTML file for inline review.
The offline wrapper has a fixed height and omits navigation. Screenshots and the
90-case result are under `.toolchains/l07-shared-look/`; they are local evidence.
The matrix covers all three layouts and five states in both themes at widths
1100, 728 and 560. It checks horizontal overflow and mounts. Focused sample
interactions cover shared Apply, independent copy, adding the second use, one-entry
history, no-op, draft Cancel, invalid/stale/missing refusal, inspector section and
scroll retention, focused field/selection return, state isolation and sample reopen.
No network request or page error occurs in the offline check.

The initial interaction check incorrectly expected two button-style uses after
sharing only the text style in the local-use scenario. The sample correctly had
one shared button use. The check now opens the two-use sample before testing
button appearances. This was a check fixture error; no product correction was made.
An initial inline export also retained production viewport-height CSS and was
refused by the inline renderer. The export converts those units to fixed sample
pixels. No SDK, native or costly CI operation has started; no numerical allowance
is needed for this routine design work.

The Design Lab module check, approval checks, application typecheck, repository
validation and whitespace check pass. The full `design:check` fails before its
screen matrix at initial `/` navigation with an eight-second `page.goto` timeout.
This matches the previously retained startup failure in
[L05 evidence](project-fonts.md); no full Design Lab pass or production-promotion
pass is claimed. The offline comparison exercises this screen's actual bundled
renderers without that startup route.

The first full frontend run passes 276 of 277 tests. Its unchanged Windows Studio
validator consumer fails because system Python 3.9 has no `tomllib`, the same
environment mismatch recorded in [#71 evidence](screen-text-ownership.md).
The existing isolated Python 3.12 runtime is selected for the corrected run.
Original failure logs remain in the ignored evidence directory.

## Acceptance remains pending

None of #43's four criteria is accepted by these mocks. They establish sample
interaction and design choices only. Actual SDK appearance output, ordinary source
definitions, minimal transactional edits, shared/use revision protection, Source
reconciliation and real history/reopen remain to implement and qualify after design
approval. Both-target/native evidence selection follows the changed production
behavior and the repository's host-routing rules. Broader editor/canvas/3B acceptance
and historical closed allowances remain unchanged.

The proposed product test boundaries are the existing Screens controller-to-core
path for review/Apply/copy/draft retention and the source transaction/history service
for definitions, references, revisions and exact-byte preservation. They are not
yet confirmed for the TDD skill; no product tests have been written in this step.
