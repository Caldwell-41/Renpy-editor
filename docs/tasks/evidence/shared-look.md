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

### A5 scope beside appearance controls

Kris required scope to be unmistakable at the font, size and colour controls,
confirmed the interpretation, and selected an experience-first refinement. They
requested screenshots of both states. A5 extends the same editor owner; its
`appearance-scope` variant/revision `inspector-v5` replaces A4's active route and
checks. A4's unapproved source remains in Git at `874e302`.

The existing appearance group now has a persistent Editing shared style or Editing
this element only heading, explicit scope choices and a boundary spanning its font,
size, colour and emphasis fields. Scope switches retain input and create no history
until Apply. Text content and Layout remain outside that group with local labels.
The existing property controls and shared-style service sample remain the owners;
no production file or second renderer was added.

Focused live and offline journeys pass, including keyboard scope switching without
accidental Apply, unchanged-operation silence, input retention across both modes,
scope visibility with Size while scrolling, review retention, shared fourteen-use
Apply, local copy, history and refusal. Eight additional cases cover both scope
modes at wide/compact sizes in both themes. Typechecking, approval and repository
validation and whitespace checks pass. The earlier 180-case mounting matrix keeps
its tested A4 scope; it is not reported as a fresh A5 pass.

The final screenshots capture the same pending Size 32 edit in each scope. Both
show the separate local Text content and Layout labels. Delivery files are
`a5-shared-controls.png` and `a5-local-controls.png`; full initial captures and
`a5-focused-final.json`, `a5-layout-check.json` and their logs remain local under
`.toolchains/l07-shared-look/`. No actual core/source, SDK/helper, native or package
acceptance is claimed. Designs remain unapproved and production implementation is
pending.

### A4 shared-style scope and many-screen review, 2026-10-31

Kris selected replacing the awkward Look wording and demonstrating more than two
screens, then requested the link. A4 extends the existing `editor.ts` and
`editor-sample.ts` owners. The active `shared-style` variant/revision `inspector-v4`
replaces A3's `editor` route and migrates its checks and offline caller. A3's
unapproved source remains recoverable at `9a2d218`; no parallel existing-editor
implementation remains. Earlier A2/A/B/C stay available for their distinct layouts.

The current inspector identifies the shared style, screen/element counts, View uses
and Edit only this element. Apply and the existing status describe shared scope.
View uses and Apply reuse one dialog owner with a scrollable, reference-derived
screen list, element counts and one selected-screen preview. The `many` sample has
eight screens and fourteen uses, including two body-text uses on six screens.
The final link's `entry=design` opens body text for review without removing the
normal Choose entry. A shared edit updates all fourteen uses; a selected-element
copy leaves the other seven screens unchanged. Source and runtime remain simulated.

Both live and offline focused journeys pass, including the existing two-screen
checks, readonly use browsing with retained input, all eight list entries and
per-screen counts, selecting later-screen previews, all fourteen appearance
updates, selected-element copy and Undo restoring the fourteen-use reference set.
The expanded offline mounting matrix passes 180 cases. The final A4 focused run
also verifies the corrected shared-scope status. The correction changed only status
wording, so the earlier mounting matrix remains applicable. Final wide/compact Design and review captures pass
in both themes, including the direct Design entry and retained input after closing
review. Typechecking, approval validation, repository validation and whitespace
checks pass. Raw local receipts are `a4-live-final.json`, `a4-offline-final.json`,
`a4-layout-check.json` and their logs under `.toolchains/l07-shared-look/`.

During visual review the imported renderer's generic "Changes apply to this text
only" status contradicted the shared scope. The lab extension now updates that
status alongside Apply's scope; the production component is unchanged. The
original screenshot and final corrected captures remain local. Historical startup
failures remain failed. No actual source/core, SDK/helper, native, package or costly
CI qualification ran, and no design or product acceptance is claimed.

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

## A5 approval and implementation entry, 2026-10-31

Kris approved A5 and selected continuing #43 through implementation, verification,
review, fixes and a local commit. The approved source is 8218bbfab6b6931b1f8610bf85ac6e64f33d747e;
`npm run design:source` reproduces fingerprint
`d8850872861cc9eaae4d51313205ea0b4b18fc0068bdf8bec1d42edfff6e9b0c`.
The approval record preserves both reviewed 326 by 542 inspector crops from a
1440 by 1080 CSS viewport at display scale 1. Their crop origins are unavailable.
The written Style naming and explicit scope amendment takes precedence over the
earlier screenshot wording. Earlier unapproved statements describe historical checks.

Development remains on Mac ARM64, on the existing codex/l07-shared-looks branch.
The only unrelated work at entry is the untracked Phase 1 audit; it is preserved.
No production implementation or costly operation had started at entry.
The full Design Lab startup timeout remains failed. No actual SDK, durable-source,
history or native acceptance is inferred from mock checks.

### Production ownership and operation map

| Approved control or existing capability | Existing owner and implementation requirement |
| --- | --- |
| Text content | `ScreenText` owns its draft; `screens.compose` / `formatText` accepts its local literal edit. Keep content outside shared scope. |
| Font, size, color, alignment, bold and italic | Extend `ScreenText` and `screens/text.rs`; preserve typed font handles, exact token patches and blocked expressions. Route shared appearance values to the referenced ordinary style definition. |
| Scope choices | Keep reference intent in the existing element draft. Switching scope retains entered fields and writes nothing. Independent Apply copies appearance and references together. |
| Style name and affected-count status | Resolve from authoritative source definitions and actual references. Do not use fictional sample counts or screen names. |
| Change style | Select a compatible source definition, stage the reference with the appearance draft, then review and apply through the existing composition transaction. |
| View uses and Apply review | One dialog owner lists every affected screen and use count. Capture the reviewed definition/use revisions and submitted values; reject changes before confirmation. Preserve focus, selection, scroll and disclosure state. |
| Layout | Keep `ScreenLayoutEditor` as owner. A combined Apply retains local numeric layout and text content in the same accepted transaction. |
| Canvas preview | Extend `screens/canvas.rs` resolution and the existing helper plan. Resolve only the supported static subset without executing project code; keep unsupported inheritance or initialization visible. |
| Undo/Redo, Source and reopen | Keep the existing composition acceptance, shared transaction/history and owned-screen reconciliation paths. Restore definition/reference bytes together and preserve opaque neighbors. Refresh every affected document after shared acceptance. |
| Frame/background/border and button states | #43 requires SDK-qualified mappings. A5 captures text and button-text controls; the older mock-only decoration values do not establish a production mapping or qualification. Preserve this gap until implemented and verified. |

The new source responsibility is the shared definition/reference index. It should
extend the bounded screen inventory and existing lexical/property parsing, rather
than introduce another project reader, text draft owner or transaction path. General
dynamic styles and ambiguous definitions stay in Source. Existing `text` and
`formatText` commands have distinct compatibility roles; a new shared path must
not leave the active renderer writing through a superseded implementation.

The TDD skill requires confirmation before tests at a new boundary. Confirmation
is pending for the existing Screens controller-to-core journey and the source
transaction/history service. The code-review skill's requested fixed point is also
pending; proposed base is the recorded L07 start, e9e8661. No new tests or production
edits have been made while those questions are pending.

### Approval verification

The source identity and approval/capture validator pass. The full promotion
`npm run design:check` passes lab typechecking and approval checks, then fails at
initial catalog navigation with the retained eight-second page.goto timeout. The
log is `approval-promotion-design-check.log` in the ignored evidence directory.
This run used host Node v26.8.1; the pinned project Node v24.19.0 remains the
implementation check target. The timeout supplies no full browser-promotion pass.
No SDK/helper, package, native or CI operation started.

Pinned Node v24.19.0 application typechecking and approval/capture validation pass.
The Python 3.12 repository validator passes for 1,288 tracked files, and
`git diff --check` passes. The retained PNG files are newly added local files and
are checked by the approval validator. No commit, push or PR has been created in
this continuation while the skill-required confirmations remain pending.

Kris confirmed both proposed test boundaries and review base e9e8661. The source
transaction/history boundary is the first TDD slice.

## Implementation and first SDK diagnosis

Both confirmed test boundaries are active, with review fixed at e9e8661.
Shared definitions and references use the existing bounded screen inventory and
property parser, composition command and transaction/history path. The approved
inspector scope and affected-use review are connected to actual core operations.
The first controller journey passes shared Apply and selected-use copy. The
ordinary focused selection passes 76 Screens core cases (four existing SDK/helper
cases ignored) and 59 renderer cases. Later corrections retain their own candidate
basis and focused checks; these are not final whole-feature results.

SDK normal attempt 1 consumes three Mac CLI/game startups. Compile/lint and
source/literal equality pass for the first independent stage/aspect, but the
distinct-state check fails. The fixture changed a live button's style prefix and
rendered again without processing Ren'Py's queued redraws. SDK source confirms
set_style_prefix schedules redraw, and the event loop calls process_redraws before
rendering. The correction processes that queue before each capture. No state
distinctness or zero-pixel-difference check is removed.

Visual inspection also finds a product mapping defect shared by both fixtures.
Solid's size properties set minima, so a Solid inside a Composite fills the
available region and the proposed foreground covers the interior. Wrapping each
Solid in a Transform with fixed dimensions corrects the constructor in the existing
property serializer and trusted helper. A semantic border/interior pixel check
now rejects this wrong mapping independently of source/literal equality. The
existing full-image comparison still permits zero differing pixels. The semantic
check allows one channel unit for opaque GPU byte conversion and requires alpha
at least 254. It does not add a source/reference image tolerance.

The original attempt, images and failure remain in sdk-normal-01 and its driver
log under the ignored L07 evidence directory. This is a mixed harness/product
diagnosis, not a passing runtime result. Mac SDK use is 3/16; helper, package,
native and CI use remain zero. No Windows proof has run.

The second normal attempt consumes three more Mac startups and correctly rejects
the still-filled border interior. One dedicated diagnostic startup then compares
the displayable and bitmap constructions. It confirms a 5 by 5 input, and SDK
Frame.render identifies the remaining error: Frame reserves at least two source
pixels for its centre, so a 2w+1 construction shrinks the requested borders and
stretches colored edge pixels across the interior. The corrected construction uses
2w+2 dimensions, a two-pixel transparent centre, and fixed-size transformed Solids.
The bitmap alternative is rejected because its diagnostic output has interpolated
alpha. The diagnostic's exception wrapper catches the normal QuitException and
reports exit 61 after writing its captures; that harness failure remains preserved.
No diagnostic run is counted as qualification. SDK use is now 7/16 before the next
normal campaign. No other costly category has started.


## Implemented candidate and Mac qualification, 2026-10-31

The production inspector extends `ScreenText`'s existing draft and dialog owners.
The existing property parser, bounded inventory, composition transaction, Source
and history services own the actual edits. Ordinary source definitions and explicit
references support shared changes, assignment, creation and independent copies.
Unsupported or incomplete reference graphs refuse sharing. Text and Layout remain
local, including a text-only edit on a shared element. Shared changes refuse affected
local overrides. Built-in styles and unsupported inheritance stay in Source.

The expanded actual controller/core journey passes (`controller-09/result.json`).
It covers 14 uses across eight screens, both scopes, review cancellation and retained
focus/selection/scroll/disclosure, assignment, creation, no-write chooser cancellation,
frame background/border, hover button appearance, stale refusal, exact-byte history,
Source reconciliation and reopen. The packaged-probe producer also passes through
the real controller/core (`probe-controller-03`), including the actual report consumer
and deliberately invalid stage, source, state and result reports.

The direct approved-source comparison uses a detached local checkout at 8218bbf.
Its source fingerprint matches the approved record. Both reference and production
captures use a 1440 by 1080 CSS viewport, scale 1, dark mode, a 326 by 830 inspector,
pending Size 32, Left/Off/Off, closed Layout and body scroll zero. The original
reviewed crops remain unchanged. `reference-01` and `controller-09` retain both
states. Visual inspection confirms the source-derived scope group, local Text and
Layout labels, fields and scope boundary. The approved longer scope label wraps
and adds about 12 pixels before the fields. Apply now names the affected scope.
This is the written naming/scope amendment, with no additional design choice.

Normal SDK campaign 3 passes compile/lint and all 16 stage/aspect/state comparisons
against separate literal reference screens, with zero differing RGBA pixels for
both affected screens. Four button states produce distinct output. Independent
semantic pixel checks establish the border and transparent interior. The accepted
source inputs come from public core/transaction operations (`sdk-inputs-03`).
`sdk-normal-03/result.json` retains source and checker hashes. The earlier failed
campaigns and diagnostic remain failed and retained above.

The first helper attempt rejects the foreground dictionary. Ren'Py's store `dict`
is a revertable subclass, while JSON decoding produces built-in dictionaries. An
`isinstance(..., dict)` guard therefore skipped conversion. The typed trusted
renderer now converts every foreground record and reports render failures with a
bounded nonzero exit instead of entering Ren'Py's error UI. Helper attempt 2 passes
33 frames in one session across shared/copy stages. Its pending draft frame equals
the later accepted frame while source remains unchanged. All 32 accepted frames
match normal literal SDK output exactly. Wrong source/state, missing and blank
frames fail the comparison gate. Cooperative shutdown exits zero and cleans up.

All 277 frontend tests, production build and Rust formatting pass. Final ordinary
core verification is running. The first full core invocation inherited SDK archive
variables from the local tool entry and was cancelled during archive extraction,
before its candidate SDK directory was promoted or any SDK CLI could run. Its log
remains `final-core.log`. The ordinary rerun explicitly unsets those variables.
The browser expansion retained and corrected navigation and transaction-completion
races in its test driver; product checks were not weakened.

The signed Mac package passes strict signature, pinned certificate/designated
requirement and installer-content checks. Executable SHA-256 is
b43eb7c03d561c28d06b4ea3be74613fd467e0fc7e73bd7b59595f1dd7b96ca9;
installer SHA-256 is 5a7ae06cbc76ae6a3aee5bff6adc110d96d310b024e1a9334a0a46997526383a.
The packaged native shared-style probe passes all seven stages, actual Source,
history, stale retention and reopen, exits zero and reports cleanup complete.
It does not execute an SDK or establish physical input/human acceptance. Local
receipts are `package-01.log`, `native-01-driver.log` and `native-01` under the ignored
evidence directory. Package and native checks use the current production tree;
review and any later corrections retain their own candidate basis.

Mac consumption is SDK 15/16, helpers 2/4, package builds 1/2 and native sessions 1/2.
Windows consumption is zero in all categories; costly CI dispatches are 0/2.
The prepared focused Windows workflow is not published or dispatched because only
a local commit is selected. Windows SDK/helper/package/native proof remains required.
The full Design Lab startup timeout, physical input and wider acceptance remain
separate. No issue acceptance or closure is claimed.


## Two-axis review and corrections

Independent fresh-context read-only Standards and Spec reviews compared
`git diff e9e8661...HEAD` at local candidate 5b5ba9d. Each reported two P2 findings.
Standards found no duplicate production owner. Spec found no scope expansion.

### Standards

- Mixed button `style` and `text_style` references were both marked known while
  only one edge was indexed. Shared edits could omit a real affected use and its
  local overrides. This violated the data-model affected-use/override contract.
  The index now refuses this unsupported mixed graph before any edit.
- Implicit underscore inheritance used the wrong direction and missed undeclared
  derived references. SDK documentation removes through the first underscore,
  so `caption_ll_body` inherits `ll_body`. The index now traces implicit ancestors
  through undeclared names and refuses shared ancestor edits with untracked uses.

### Spec

- A numeric no-op Apply returned an empty companion-document list that replaced
  the inspector's entire document inventory. The workspace now preserves its
  inventory on that no-op result. The actual controller/core check enters 032 for
  accepted Size 32, then selects both screens and verifies their controls and bytes.
- Assignment previews omitted the chosen Style's background, border and state
  values because only changed values were sent. The existing preview owner now
  expands the selected reference's effective appearance, clears displaced values,
  and sends only actual shared deltas to other uses. This restores ADR 0021's
  provisional-property contract and A5's proposed-appearance review.

The speculative colon/pass finding was withdrawn after checking SDK grammar:
`pass` is not a valid style clause. Such input now stays Source-only and a focused
public-core test proves refusal without writes. The mixed-reference/inheritance
reproduction was red before the correction and green afterward. No source or
image acceptance threshold was weakened. Further browser driver corrections wait
for an observable refreshed screen inventory rather than using an old cached list.

The final ordinary core run passes 474 tests, with 52 specialist cases ignored;
it does not qualify those SDK/native gates. Desktop tests pass 38, driver tests pass
2, and approval validation passes. After review corrections, 79 focused Screens
cases pass with five explicit SDK/helper cases ignored, and 59 renderer cases pass.
Typechecking passes. The expanded real-controller journey and exact packaged-probe
rehearsal pass; final stable-tree receipts are recorded at closeout.

### Corrected operation accounting

A final call-path audit found six uncounted SDK CLI starts in the two helper
attempts. Each fresh helper fixture installs the managed SDK with staged validation
and post-promotion discovery, then validates again on initial canvas discovery.
Each validation executes `--version`. These are SDK CLI starts in addition to the
helper process, under the recorded policy. Mac SDK consumption is therefore 21/16,
not the earlier reported 15/16. This exceeded the selected ceiling. No further SDK
start is selected or needed for the unchanged qualified mappings. The old receipts
did not count these internal starts; the helper receipt now records the actual
adapter process counter and checks the expected three validation starts. That new
counter has not been executed on Mac. Windows's planned eight normal starts plus
three helper validations would consume 11/16, and its helper consumes 1/4.

Packages/native remain separate categories. Mac use before the corrected package
is SDK 21/16, helpers 2/4, packages 1/2 and native sessions 1/2. Windows use and
costly CI dispatches remain zero. The cancelled unrelated full-core SDK gate never
left its extraction-stage payload, so it contributes no SDK start. Its owned
partial extraction is identified for cleanup. Original failures and the accounting
correction remain retained; no allowance is retroactively enlarged.


## Local delivery checkpoint, 2026-10-31

Implementation commit 5b5ba9d and review-correction commit
f3a6fbc1c037fd99c303cce8b866fcdb0733dbd0 are local on codex/l07-shared-looks.
The full-branch review base remains e9e8661. All four reported P2 findings are fixed
and pass affected verification; no independent review of a later candidate is implied.

The stable corrected production tree passes the expanded controller/core journey
in `controller-14` and exact packaged-probe rehearsal in `probe-controller-05`.
The controller checks numeric no-op screen retention, local-only text on a shared
element, assignment preview background/border removal, and cancellation bytes in
addition to the earlier journeys. Both final inspector states remain available as
`controller-14/pending-shared-inspector.png` and `pending-local-inspector.png`.
All 79 focused Screens cases pass (five deliberate SDK/helper cases ignored), as do
59 renderer cases and nine focused style cases (one helper case ignored).

The second signed Mac package uses exact production commit f3a6fbc. Its strict
signature, approved certificate-backed requirement and installer inspection pass.
Executable SHA-256 is 034ae5038f80270cf1cc7399d9b5a9ca19462b7eefd2ad5a74ba418c080b5718;
installer SHA-256 is cecaaf42e51dcadeab5fde3d00f3da67c082ab661ea07bcd0c427c2c23c5de8c.
The two packages have different executable hashes and the same approved requirement.
`native-02-driver.log` records all seven native WebView stages passing, exit zero,
no SDK execution, no external errors and complete cleanup. There is no physical
input or human acceptance claim. The package's production build passes.

SDK output is reused from the recorded normal/helper campaigns, with their captured
HEAD 8218bbf, uncommitted source-file hashes and emitted accepted-source bytes.
The normal checker and constructor/reference mapping are unchanged. The final
helper renderer exactly matches the successful helper receipt. Later changes add
reference-graph refusals, existing-font validation, UI no-op retention and assignment
preview expansion; they do not change the qualified border/text/state serializer or
trusted rendering. The actual source/property and UI tests cover those corrections.
No new SDK rendering claim or new counter execution is inferred from portable tests.

Final consumption is Mac SDK 21/16 (accounting overrun explained above), helpers
2/4, packages 2/2 and native sessions 2/2. Windows remains zero; costly CI dispatches
remain 0/2. No further Mac SDK, package or native attempt is selected. The cancelled
core run's owned partial extraction is removed, with an ignored cleanup receipt;
its original failed log remains. Owned browser/driver/native processes have stopped.
The detached approved-source comparison checkout and original local evidence remain.
The unrelated untracked Phase 1 audit and protected recovery are unchanged.

The prepared Windows check is Screens qualification with `shared_style=true`,
`candidate` equal to its published exact head and cumulative `ordinal=1`. Publication
is not authorized by this local-commit outcome, so it is not dispatched. Required
Windows SDK/helper/package/native proof, the failed full Design Lab startup gate,
physical/human proof and wider acceptance retain their disclosed status. Issue #43
remains open with four unchecked acceptance criteria. No push, PR or release occurs.


The final corrected frontend run also passes all 277 tests and typechecking
(`final-frontend-reviewed.log`). Repository validation passes 1,298 tracked files;
Rust formatting, workflow lint and whitespace checks pass. The final closeout changes
only documentation after f3a6fbc, so package/native source identity is unchanged.


## Publication and CI selection, 2026-10-31

Kris selected opening a draft PR and running CI. The branch is published as draft
[PR #72](https://github.com/Caldwell-41/Renpy-editor/pull/72), based on
codex/phase3b-screen-designer at e9e8661. The first published head is 9b8dc5a;
production remains the qualified f3a6fbc tree. This publication checkpoint changes
only status/evidence documentation. The unrelated audit remains untracked.

Select automatic Repository quality plus the prepared focused Windows Screens
qualification with shared_style=true, exact published candidate and ordinal=1.
No other specialist selector is selected. This uses the first of two costly
CI dispatches; Windows limits remain SDK 16, helpers 4, packages 2 and native
sessions 2. The expected campaign has eight normal SDK starts, three helper
validation starts, one helper, one package and one native session. Count actual
started steps, including failed/cancelled work, rather than planned totals.
Mac use and the recorded ceiling overrun stay unchanged; no Mac costly retry runs.

The owning [issue CI wait record](https://github.com/Caldwell-41/Renpy-editor/issues/43#publication-and-ci-wait)
records confirmed run/attempt/full head, inputs, observed status/time and remaining
audit. Raw receipts stay ignored. Audit all executed steps and artifacts, candidate,
SDK comparisons, helper count/rejections, package identity, native stages and cleanup
before reporting Windows acceptance. Failed, cancelled or skipped required proof
stays unresolved. PR remains draft; merge, release and issue closure are unselected.

T3's PR watch owns same-thread wakeups for these pending checks. The installed
Codex-desktop ci-watch launcher requires an escalated runner forbidden in this
session and is not registered; no local polling loop or substitute launcher runs.
A watch event is a cue to audit the recorded runs, not evidence of a passing run.


## Windows CI1 audit, 2026-10-31

The user requested an audit after the PR watch did not resume for the manually
selected qualification. The PR check rollup contains only Repository quality;
it excludes the separate workflow_dispatch run. The only registered watch was the
PR watch. No working run-specific watcher was registered. The earlier monitoring
claim therefore overstated coverage, and its pending-run statements are superseded
by this audit. A PR check notification cannot establish dispatch completion.

Both exact attempt-1 runs use d422d76fce1262fd7c625b3d73a510af7611fdab:

- [Repository quality 41175449511](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41175449511/attempts/1)
  passes its two required jobs and all executed steps. The audit confirms 277
  frontend passes, pinned Rust formatting, 1,292 checkout files validated,
  13 section-link tests, 10 retention tests, Q1 fixtures and selector source audit.
  Nine unselected specialist jobs are skipped. The notice's eleven checks do not
  mean eleven executed/passing qualifications.
- [Screens qualification 41175476001](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41175476001/attempts/1)
  fails. Selection and exact-candidate guards, portable preflight, nine Style tests,
  actual controller/core, exact probe rehearsal, pinned archive verification,
  public-core source export, package/native execution, x64 identity and privacy/
  artifact upload pass. Normal SDK semantic validation fails. The helper producer
  passes; its full reference consumer then correctly refuses the failed normal
  receipt. Post-cache steps skipped after failure are not rendering evidence.

### Observed failure and classification

Normal entry executes compile, lint and one game startup successfully for the
independent 1280 by 720 case. It captures all four states and both screens plus
literal references, then rejects the semantic border assertion at virtual (40,40).
Expected color is #abcdef with alpha at least 254; actual RGBA is (66,80,93,100).
The recorded Windows physical window is 922 by 519, renderer angle2, drawing scale
0.7203125. The checker samples the exact frame corner and assumes opaque coverage
there. At this fitted scale the edge is antialiased. Its interior at (43,43) is
(17,51,85,254), within the existing one-channel-unit check of #123456.

Classification is a harness defect in the opaque corner expectation, matching
[H46](../../testing/INCIDENTS.md#h46-physical-capture-size-mistaken-for-virtual-resolution).
The complete original assertion reproduces offline from the downloaded images.
All eight available source/literal pairs and their eight helper/literal pairs have
zero difference in every RGBA channel. These are partial diagnostic comparisons,
not a passing full campaign. No threshold, producer receipt or expected image was
changed. The campaign aborts before the other stage/aspect cases and records zero
accepted rows. Full normal and helper-reference qualification remains failed.

### Retained evidence and accepted slices

The unexpired artifact shared-style-Windows-41175476001-1 is downloaded locally
under the ignored L07 windows-ci-01 directory; expiry is 2026-11-07 06:20:24 UTC.
The complete run logs, run/attempt/head metadata, artifact metadata and separate
offline diagnostic/audit JSON are retained. A local privacy recheck passes 71 files.

The helper receipt passes 32 accepted frames and pendingMatchesAccepted in one
session, with three measured SDK validation commands. Every retained frame's
source revision, state, dimensions, PNG decode and nonblank content is checked.
Accepted-source bytes match the public-core export and normal input exactly.
The helper renderer hash matches the current producer. Cooperative shutdown exits
zero with cleanup complete. Full comparison and its rejection tests are unqualified
because the normal reference campaign is incomplete.

The Windows native report passes the actual report consumer offline, all seven
stages, exit zero, no external errors and complete cleanup. It executes no SDK.
The retained executable has x64 PE machine 0x8664 and SHA-256
fbfbc97fc2f69e969dad161c97bc173730c6b4f4d5dcd33a01173cb764e3d53d,
matching the candidate-bound package receipt. This accepts that bounded native
slice, without physical-input/human or complete rendering acceptance.

Actual cumulative Windows use is SDK 6/16 (three normal plus three helper
validations), helper 1/4, package 1/2 and native session 1/2. Costly dispatches are
1/2. Mac use remains SDK 21/16, helpers 2/4, packages 2/2 and native 2/2. No new
SDK/helper/package/native process or dispatch starts during this audit.

The next correction belongs in the semantic capture check. Preserve strict
source/reference/helper pixel equality and verify border/interior semantics with
valid alpha/scale assumptions. A second full pipeline would need eleven more SDK
starts and exceed the ten remaining. A normal-only campaign can reuse unchanged
helper/native receipts and remain within the ceiling. Select that bounded route
before dispatching. This audit changes no production or qualification code, starts
no retry, leaves PR #72 draft and keeps #43 open and unaccepted.

## Root-cause correction and bounded CI2, 2026-10-31

Kris authorized this successor chat to fix #43, verify, commit/push, update draft
PR #72 and dispatch one bounded retry through result audit. Sole writer ownership
transferred to this chat at published 5749fd4; the unrelated audit is preserved.
The existing ceilings and consumption continue without renewal.

### Reproduction and correction

The actual CI1 normal-image consumer reproduces the original assertion with
(66,80,93,100) at (40,40). Tracing the pinned SDK's `render_to_surface` shows a
renderer screenshot followed by smooth scaling back to virtual dimensions.
Ren'Py uses [premultiplied alpha](https://www.renpy.org/doc/html/model.html).
The first wrong decision is interpreting the partially covered frame corner as
opaque straight RGB. The 1024 by 768 helper corner independently has
(37,45,52,56), while Mac's corner is (170,204,238,254). All represent the same
border color at their captured coverage. This is a harness defect; no production
rendering change is indicated.

The shared semantic owner now compares stored RGB with color multiplied by the
observed alpha. It requires nonzero border coverage and an opaque interior,
retains the existing one-channel-unit quantization limit, and records the raw
sample and expected premultiplied RGB in each row and assertion. Strict complete
RGBA equality between source, literal and helper remains unchanged. The normal
receipt must still pass before the full helper consumer can admit it.

Offline replay passes four available Windows normal rows, all 16 Windows helper
semantic samples and all 16 retained Mac normal rows. Both screens in each normal
row still match the literal reference exactly. Matching missing-border and
filled-interior mutations in source and literal both fail the independent semantic
gate. Three focused image tests pass, including exact rejection of a one-unit RGB
or alpha difference. These are replays of retained captures, not new SDK starts or
a passing Windows campaign. Receipts are `semantic-replay-02.json` and
`reuse-rejections-02.json` under the ignored L07 evidence root. The first local
fault-injection driver missed its Python import path; the corrected driver passes.
No product correction was needed for that driver error.

### Selected bounded run and evidence reuse

Ordinal 2 of the existing shared-style workflow is normal-only: eight normal SDK
starts, no helper startup, no package build and no native session. It downloads the
exact unexpired CI1 artifact from run 41175476001, attempt 1. A reuse gate refuses
any production, fixture, dependency or native-consumer difference from d422d76;
only this correction's scripts/workflows and documentation may differ. It checks
the original candidate, pinned x64 binary hash/PE identity, actual native report
consumer and cleanup, helper renderer hash, accepted-source bytes and producer
receipt. Original candidate and receipt hashes are recorded separately from the
new candidate. Original CI1 artifacts and receipts remain immutable; comparisons
write only into the new run's downloaded copy.

The original helper/native evidence passes that gate offline. Wrong candidate,
binary, native stage, helper renderer, shutdown cleanup and accepted-source
mutations all fail. The fresh normal result will then feed the existing strict
32-frame helper/literal consumer and all four rejection cases, without starting
another helper. A changed fitted size or draw scale still fails; no cross-scale
image tolerance is introduced. Mac's unchanged production/native proof and
retained-image replay are reused, with no further Mac costly operation.

Before dispatch, actual Windows use remains SDK 6/16, helper 1/4, package 1/2 and
native 1/2; dispatches 1/2. Planned CI2 use reaches SDK 14/16 and dispatches 2/2;
other categories stay unchanged. Count actual starts from CI2's receipt, including
failed starts. Mac remains SDK 21/16, helper 2/4, package 2/2 and native 2/2, with
its historical overrun unchanged. No additional allowance is implied.

### Completion and audit route

The installed ci-watch launcher resumes a UUID Codex-desktop thread through
`codex queue`. The current T3 thread has an `mcp:launch:` identity, distinct from
the backing harness UUID; the available CLI belongs to Codex desktop. Its queue
help supplies no verified T3 delivery route. No launcher or watcher is registered,
and no scheduler, ad hoc watcher or model-polling loop substitutes for it.
Use WORKFLOW's manual same-thread resume for the exact confirmed manual run.
A PR watch may cover automatic Repository quality only; it cannot establish
manual qualification completion. The user must resume this thread after the
manual run completes so the remaining audit can execute.

On resume, retrieve the recorded run ID/attempt/head and every executed step's
logs; audit eight-start accounting, all 16 normal rows and semantic samples,
source/checker hashes, all 32 reused-helper comparisons and rejection cases,
reuse provenance/native hash, privacy scan and uploaded artifact availability.
Failed, skipped or absent required proof remains unresolved. Keep PR draft and
#43 open; merge/release and broader human/editor/canvas/3B acceptance are outside
this selection. Dispatch identity and actual result are pending below.

### Review and local verification

Fresh-context read-only Standards and Spec reviews each cover
`git diff e9e8661...HEAD` at ce944ccc2ba0764cbc71f6b8efc091373c49de24. Each reports
one P2: retaining selectable ordinal 1 would permit the consumed full campaign,
including eleven SDK starts against ten remaining. No other actionable finding
is reported on either axis. The coordinating owner corrected this by requiring
ordinal 2 and deleting the superseded helper/package/native startup steps.
A focused selector execution accepts only 2 and refuses 1 and 3. The old full
workflow remains available in CI1's historical commit, not as a current entry.

The corrected workflow passes actionlint and the repository selector source audit.
Repository validation and all 13 section-link tests pass; whitespace checking
passes. The three focused image tests and actual retained-capture/provenance
replays above pass. Source/runtime production, dependencies and input fixtures
are unchanged from the previously qualified candidate, so their recorded ordinary
and native checks are reused rather than repeated. No independent re-review of
the narrow ordinal correction is claimed. Publication and CI2 remain next.
