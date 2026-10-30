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

## Experience-first A2 refinement

Kris found A unclear and selected refining that mock with
`principle-experience-first`. The new `refined` variant, revision `inspector-v2`,
is an unapproved draft. The original three renderers remain unchanged.

A2 shows Help and About together, uses a human-readable look name, and gives
explicit Help and About versus Only Help scope choices. Color presets expose the
shared editing behavior without entering hex values. Both previews display pending
shared changes; independent scope changes only its selected use. Review states
which screens update and shows changed values. Accepting independent scope copies
the style and all appearance states for that element. Technical identifiers stay
in Source; original behavior is still simulated in browser memory.

Application and lab typechecking, approval validation, the focused original/A2
interaction checks and the expanded 120-case offline matrix pass. This matrix
covers four variants, five states, three widths and both themes without page errors
or network requests. A2 checks include both-preview feedback, independent scope,
shared and copy Apply, review Cancel/focus/selection, history/reopen, invalid and
missing/stale retention, frame appearance and isolated button states.

The direct live A2 route reaches `data-ready=true` with zero page errors and both
previews at 1100x720. The focused A2 interaction check also passes against that live
route, including actual browser draft previews, review and copy behavior. The
catalog-based `check-screen.mjs shared-look` still fails
at its initial `/` navigation with the retained eight-second startup timeout before
running its matrix. The new log is `refined-lab-check.log` in the local evidence
directory. This remains failed; neither it nor the earlier combined gate is claimed
as passing. The user receives the direct `/preview.html` link.

No production file, SDK/helper, transaction, package or native operation changed.
Design approval and all actual-product acceptance remain pending.

## Acceptance remains pending

### A3 inside the existing editor

Kris said A2 did not show its fit in the existing editor and selected rebuilding
the prototype there with `principle-experience-first`. Variant `editor`, revision
`inspector-v3`, mounts the production `ScreensWorkspace` renderer with explicit
fictional in-memory service callbacks. No production file is edited. The lab adds
the missing Screens sidebar entry and a Look row inside the renderer's existing
Typography section. The existing Text/font/size/color/alignment/emphasis/Layout forms,
Choose/Design/Connect steps, single canvas, Source and Apply/Cancel remain rendered
by their existing owners. Other screens appear only in the proposed Apply review.

The lab-only Look extension augments the rendered DOM and intercepts shared Apply
for a design study. It is not a proposed production integration mechanism. The
sample adapter simulates shared values, reference assignment, independent copies,
one-entry history, no-op and stale/missing refusal. Browser canvas drawing supplies
sample PNGs to the renderer without invoking the SDK/helper. Source is illustrative.
Native file import, structural changes and unsupported sample operations refuse
visibly. A3 demonstrates text and button-text appearance; broader frame decoration
and appearance-state support still need design/implementation and real qualification.

The complete A3 journey passes in the live Design Lab and the self-contained
preview. It checks sidebar selection, Choose entry by double-click, original Design
fields and Connect, shared Apply, independent copy with and without a value change,
review Cancel/focus/text selection/section/scroll retention, local-only text content,
Cancel, Undo/Redo, assigning an existing look to About, and missing/stale retention.
The expanded offline matrix passes 150 cases across five variants, five states,
three widths and both themes. A3 Design also has six width/theme captures and
overflow checks. Browser checks use a locally fulfilled HTTPS document for a secure
context, with no server or external requests. Earlier variants' checks still pass.

The live evidence is `editor-live-check.json` and `editor-live-final.log` under
`.toolchains/l07-shared-look/`. The offline results are in `check.json` and
`editor-design-verified.log`; versioned screenshots remain local. Initial checks
retained these setup failures: a broad Layout summary selector also matched Size
limits; changing screens preserved Design while the check expected a Choose tree;
the old offline wrapper hid the sidebar; and the old about:blank host lacked secure
context APIs used by the renderer. The selector and navigation check were corrected,
A3's wrapper now retains the sidebar, and the offline document is fulfilled in
memory at an HTTPS origin. The sample no longer needs a random project identifier.
No product behavior was changed to satisfy those checks. The interrupted pre-restart
browser check supplied no result; the live check was restarted after restoring Vite.

The earlier catalog-based startup failures remain failed. Passing the direct A3
route and offline checks does not establish a full Design Lab gate or actual core,
source, SDK, helper, native or product acceptance. No costly operation has started.
All designs remain unapproved, and the original implementation is still pending.

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
