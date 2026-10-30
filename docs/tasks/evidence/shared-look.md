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
The corrected run selects the existing isolated Python 3.12 runtime and passes
typechecking and all 277 tests, with zero failures, cancellations or skips.
Original and corrected logs remain in the ignored evidence directory.

## Independent checkpoint review

The implement skill's two independent, read-only reviewers examined
`e9e8661...cd67362`. They owned no files; the parent retained all edits.

### Standards

No hard documented standards breaches or actionable baseline smells were found.
The reviewer confirmed prototype isolation, null approvals and accurate disclosure
of pending product proof. It identified two behavioral concerns for the Spec axis:
inline review read live values after displaying its diff, and unchanged Enter could
create a history entry.

### Spec

The reviewer found no scope creep or misleading completion claim. It reported
three P2 findings against the intended workflow:

- "Before Apply, list every affected screen." Inline copy review allowed the
  selected element to change after review was built, so confirmation could apply
  to a different element.
- The shared write rules require "no-op" proof. Unchanged Enter and repeated
  Share with About could create redundant history entries.
- "The inspector preserves ... focused field." Bold did not participate in focus
  restoration after review or copy.

Initial findings were zero Standards violations and three Spec findings, all P2.
The parent fixed them directly. Review holds the existing editing controls disabled
until it closes, without remounting inspector fields. Unchanged shared review and
an already-attached About use return without a write or history change. Focus
tracking includes checkboxes and selectors as well as text fields.
The expanded interaction check passes all three layouts, including these cases;
the final module check and 90-case rendering matrix also pass. No independent
second review or product acceptance is claimed.

The final styling correction keeps both library previews visible at wide size,
shortens the inline canvas, and overrides the imported form field minimum height
within this prototype only. The final checkpoint remains local, with no code push
or PR. #43's body records the selected outcome and pending design decision; its
acceptance boxes remain unchecked.

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
