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

### CI2 dispatch and wait checkpoint

[CI2 41184079359, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41184079359/attempts/1)
is confirmed at b1b6303ded16a9edc02054f4f2f5945687996631 on
codex/l07-shared-looks, event workflow_dispatch. Inputs are shared_style=true,
ordinal=2 and that exact candidate; all other specialists are false. The selection
job and exact-candidate/ordinal guard pass. Last observed Windows setup is
in_progress at 2026-10-31 08:19 UTC, with no new SDK start established by that
observation. This consumes dispatch 2/2. Windows confirmed SDK use remains 6/16,
with eight reserved for this run; helper/package/native consumption is unchanged.
Do not dispatch or rerun another costly campaign. Resolve actual starts at audit.

[Automatic Repository quality 41184038969, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41184038969/attempts/1)
is audited successful at the same head. Both required jobs and every executed
step pass: 277 frontend tests, pinned Rust formatting, validation of 1,294 checkout
files, 13 section-link tests, 10 retention tests, Q1 gate fixtures and selector
source audit. Nine unselected specialist jobs are skipped. This result is separate
from the manual qualification. Logs and the audit are retained under the ignored
L07 evidence root; `ci2-wait-record.json` owns exact pending identity and audit list.

PR #72 and #43 are updated remotely with the correction, review, budget and exact
pending run. The PR remains draft and the issue remains open with unchecked
criteria. No run-specific watcher is registered. Use manual same-thread resume
when CI2 completes, then perform the recorded terminal audit. These dispatch/wait
updates to repository evidence and CURRENT/HANDOVER are local pending that audit;
they are not another published or qualified candidate. The fix and reviewed guard
are published at b1b6303. The unrelated audit remains untouched.

## CI2 terminal audit and controller acknowledgement correction, 2026-10-31

Kris resumed this thread to review CI, fix the issue with
`principle-fix-root-causes` and a subagent, update PR #72 and run CI again.
The coordinating agent retains sole writer ownership; the diagnostic subagent
had read-only ownership and made no repository edits or costly starts.

### CI2 result and actual consumption

[CI2 41184079359, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41184079359/attempts/1)
failed at exact b1b6303ded16a9edc02054f4f2f5945687996631. Selection, checkout,
exact candidate/ordinal guard and portable preflight pass, including the three
image tests, 277 frontend tests, two driver tests, nine Style core cases with one
helper case ignored, frontend build and desktop check. The controller journey
fails at the immediate assignment-preview assertion. Its following exact packaged
probe rehearsal never starts. Reuse binding, SDK fetch/verification/input export,
normal images and full helper comparison are skipped. Privacy scan and artifact
upload pass; checkout cleanup passes. Cache/Node post steps skipped after failure
are not additional qualified evidence.

No SDK, helper, package or native start occurs. Windows consumption remains SDK
6/16, helpers 1/4, packages 1/2 and native 1/2. CI2's eight reserved SDK starts are
released, not counted as executed. Dispatch consumption is 2/2 under the original
selection. The latest user request explicitly selects one further dispatch, so the
revised dispatch ceiling is three total, with two consumed before CI3. SDK and all
other ceilings remain unchanged. Planned normal-only CI3 adds eight SDK starts,
reaching 14/16 and dispatches 3/3. No further Mac costly operation is selected.
This is an additional selected dispatch, not a reset of either prior attempt.

Artifact shared-style-Windows-41184079359-1, ID 13036301486, is retained remotely
until 2026-11-07 08:26:17 UTC and downloaded locally under windows-ci-02.
The ZIP digest is verified as
9ad5f5c5ee68034bcec3de86f1478da854c2b46be5a5b8ec279cb9002e2208cd.
Its original eight files and receipts are immutable; local privacy recheck passes.
`ci-focused-02-terminal.json`, its complete log, artifact metadata and
`ci-focused-02-audit.json` retain the audited identities and executed-step results.
The preceding wait observations are superseded by this failed terminal result.
The normal semantic correction has still not executed on fresh Windows output.

### First wrong assumption and fix

The failure screenshot shows the intended Panel style, background #654321 and
inherited border fields, while canvas status is still Starting. There are no
page errors. The diagnostic subagent traced the controller's immediate historical
`canvasRequests.some` assertion through `ScreenCanvasFrames.render`'s queued
zero-delay timer, review disposal and rescheduling of the main canvas. Awaiting
Keep editing does not acknowledge either the timer or exposed-binding/core reply.
The test closes the review that owns the pending preview before proving receipt.
This is a harness synchronization defect; it is a different cause from CI1's
premultiplied-alpha assertion. No independent product-data defect was found.

A controlled real-controller reproduction delays only the expected preview's
scheduled timer by one second. The original assertion fails with three correct
queued payloads and zero matching delivered requests. Each queued payload names
the caption frame, the current revision, background #654321 and border null.
The corrected journey passes under exactly that scheduling. This diagnostic delay
exists only in ignored replay files, never in production or the checked-in test.
The subagent also reproduced the legitimate zero-immediate/one-next-turn state
with the existing compiled frame owner. No SDK is involved in either experiment.

The existing controller test now registers a target bound to path, screen, node
and revision, awaits the actual `screens.canvasPlan` response while review remains
open, then checks the request and core node's appearance before Keep editing.
It preserves the existing eight-second bound, without retry or sleep. Wrong
payload/plan values still fail directly; unchanged-source and Cancel assertions
remain. Successful proof and failure artifacts now retain the correlated payload,
core response and target, so a future failure distinguishes absent delivery from
wrong data at first inspection. This follows the existing numeric-controller
acknowledgement pattern rather than adding another production scheduling owner.

The CI1 reuse gate allows this one controller-harness file to change; production,
SDK/helper inputs, producer, native consumer and dependency bytes remain required
unchanged. The harness construction/source fixture is unchanged. CI3 still binds
the original helper/native receipts and requires all fresh normal and strict
retained-helper comparisons. The workflow requires ordinal 3 and refuses consumed
1 and 2; helper/package/native startup steps remain removed. No image threshold,
semantic rule, source protection or required proof is weakened.

### Focused verification and review

The full corrected controller/core journey passes at `ci2-controller-fixed`, with
the correlated payload and accepted core node recorded. The exact packaged-probe
rehearsal and its native-consumer rejection cases pass at `ci2-probe-fixed`; this
is Chrome/controller evidence, not a new native session. The controlled delayed
red/green journey is retained under `ci2-controlled-red` and
`ci2-controlled-green`, alongside diagnostic injection/source and logs. The final
regular journey additionally matches screen identity and returned plan revision.
Privacy scans of all three passing output directories pass.

The three image gate tests pass. Actionlint, selector source audit, repository
validation, all 13 section-link tests and whitespace checking pass. The selector
accepts only ordinal 3 and refuses 1/2, with no helper/package/native startup
commands present. Coordinating review confirms the matched promise completes
only after the actual core reply, wrong data still fails, the eight-second bound
is cleared on success/failure, and unchanged-source/Cancel/history checks remain.
The read-only subagent's diagnosis and the controlled reproduction agree. No
second full-branch review or new native/SDK proof is implied.

Only the controller harness, exact-ordinal guard/description, one reuse whitelist
entry and evidence/status/incident records change. Existing production and all
qualified helper/native producer inputs are unchanged. CI3 will still execute
the complete corrected controller and exact probe rehearsal before costly work.

### CI3 dispatch and wait checkpoint

The acknowledgement correction is published at
e57d3fa0073a45510ca48f9560152fd6fadaea03. The final CI1 reuse gate passes against
that committed tree. PR #72 and #43 are updated remotely, remain draft/open and
retain unchecked criteria.

[CI3 41185489731, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41185489731/attempts/1)
is confirmed at that exact head on codex/l07-shared-looks, event workflow_dispatch,
shared_style=true, ordinal=3 and other specialist selectors false. Selection
passes and the Windows job is checking out at the recorded observation in
`ci3-wait-record.json`. No new SDK start is established by that observation.
Dispatch use is 3/3 under the user's additional selection. Windows SDK use is
confirmed 6/16 with eight reserved; helpers/packages/native stay unchanged.
Do not dispatch another costly campaign; resolve actual starts from this receipt.

[Automatic Repository quality 41185435872](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41185435872)
is pending at the same head. The selected PR watch covers automatic PR checks
only. It cannot establish manual qualification completion. No run-specific watcher
is registered; manual same-thread resume is still required for the exact manual
run. On resume, audit both exact run identities, all executed steps/logs, matching
controller proof and probe rehearsal, actual starts, CI1 reuse provenance, all 16
normal semantic/literal rows and 32 helper comparisons/rejections, cleanup,
privacy and artifact availability. Any failed or missing proof stays unresolved.
These dispatch/wait updates are local pending the terminal audit; the published
fix and remote PR/ticket updates already identify the exact run.

### Automatic CI3 quality audit; manual qualification still pending

The T3 eleven-check notification belongs to
[Repository quality 41185435872, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41185435872/attempts/1)
at exact e57d3fa0073a45510ca48f9560152fd6fadaea03. The terminal metadata and
complete logs establish both required jobs and every executed step passed:
277 frontend tests with no failures/skips, pinned Rust formatting, validation of
1,294 checkout files, 13 section-link tests, 10 retention tests, Q1 rejection
fixtures and selector source audit. Nine unselected specialist jobs are skipped.
This is an automatic-quality pass, not eleven executed qualifications.

The separate manual CI3 run 41185489731, attempt 1, is still in_progress in
portable preflight at the resumed observation in `ci3-wait-record.json`.
Its exact-candidate/ordinal guard passes. No new SDK start is established by that
observation; eight remain reserved against confirmed Windows SDK 6/16.
Dispatches remain 3/3 and all other consumption is unchanged. No correction,
new dispatch or costly operation runs during this audit.

PR #72 and #43 are updated remotely with the verified automatic result and
remaining manual audit. The manual run still requires same-thread user resume
after completion. No run-specific watcher is available; the completed PR rollup
cannot establish the manual result. Detailed original logs and quality audit are
retained under ignored `ci-quality-03-*`. These wait/evidence updates remain local
until the manual terminal audit; the published implementation head is unchanged.

## CI3 terminal audit and fresh full CI4 correction, 2026-10-31

Kris requested the complete root-cause fix with a subagent, PR update and another
CI run, and explicitly approved all needed allowance increases. The coordinating
agent owns all file changes. The root-cause subagent was read-only and confirmed
that the existing helper producer can consume one exported snapshot without
regenerating source IDs. A fresh read-only review examines the final correction.

### Audited CI3 result

[CI3 41185489731, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41185489731/attempts/1)
failed at exact e57d3fa0073a45510ca48f9560152fd6fadaea03. Portable checks,
controller/core, exact packaged-probe rehearsal, retained-evidence provenance,
official SDK verification, source export and all 16 normal SDK semantic/literal
comparison rows pass. The full helper consumer then rejects different accepted
source bytes before its image/rejection audit. Privacy scan and artifact upload
pass; skipped cache/setup post steps do not establish additional evidence.

The original helper manifest and fresh normal manifest differ in screen/element
UUID comments, independent copied-style definitions/references and asset ID.
All four source SHA values differ. These IDs legitimately change when a project
is created again. The reuse workflow's wrong assumption was that unchanged
producer code creates identical source bytes in separate projects. Its early
provenance check compared retained helper input only with retained CI1 input;
the fresh export was never bound to it before the eight normal SDK starts.
The strict consumer correctly refused that cross-run pairing.

The complete source-identity failure reproduces offline. All 16 normal rows replay
with matching source/checker/image hashes and semantic samples. Diagnostic-only
comparison finds all 32 retained helper/literal images equal with matching actual
physical size and drawing scale; this does not clear source provenance or execute
the skipped full consumer/rejection audit. Controller correlation, probe result,
helper frame state/dimensions/revisions and retained native/binary identities are
also audited. CI3's ZIP digest is
36f70b9cf5ec8c22e9a9e9b8d49a6b7e4f7ef3af9a2f9d50e4b827c8cc57e581;
artifact ID 13035898732 expires 2026-11-07 08:45:38 UTC. The original 157 files are
downloaded under windows-ci-03 and pass privacy recheck. Original receipts remain
immutable. Complete logs, terminal metadata, diagnostics and read-only audit are
retained in the ignored L07 evidence root. Prior pending CI3 statements are
superseded by this failed terminal result.

Actual CI3 use is eight SDK starts, no helper/package/native startup and one
dispatch. Cumulative Windows use is SDK 14, helpers 1, packages 1, native sessions
1 and dispatches 3. SDK cleanup is complete. No failed proof is relabelled passing.

### Root-owner correction

The qualification workflow now exports one snapshot for this candidate. Its
single STYLE_INPUTS directory is passed to the actual public-core exporter and
fresh helper producer; normal SDK rendering reads that same accepted.json.
The helper reads its supplied source and applies the supplied independent stage
through existing source transactions. It does not invoke the exporter again.
The source-identity guard, per-frame revision/state/dimension/physical-scale
checks and exact four-channel pixel equality remain required.

The superseded retained-artifact download, source-whitelist/reuse script and
callers are removed. Extra Actions-read permission and full-history checkout are
removed with that path. There is no parallel reuse mode. Fresh helper production,
all 32 helper/literal comparisons, pending-to-accepted proof and fresh Windows
package/native qualification are restored. Producer and consumer are separate
steps so their outcomes are visible. The native step keeps its original independent
preflight/controller prerequisites and can collect evidence after rendering failure.
Only ordinal 4 is selectable; consumed ordinals refuse.

The helper consumer now reports both accepted-manifest SHA values on mismatch.
A new rejection case changes a manifest's project identity while leaving rendered
pixels unchanged. The two focused campaign regressions build complete consumer
inputs: one source snapshot passes all 32 image comparisons and all five rejecting
cases; a separately created project's UUID/copied-style snapshot fails despite
identical image files. The existing semantic/strict-pixel tests remain intact.
No source IDs, receipts or expected images are normalized to admit old proof.

Five focused tests, actionlint, selector source audit and whitespace checks pass.
The current consumer also passes all 32 actual same-source Mac comparisons and
five rejection cases using copies of retained evidence, without new SDK/helper/
package/native execution. Actual CI3's mismatched manifests still fail with the
new hash diagnostic. That replay is not a fresh Mac qualification. The initial
local workflow lint rejected runner.temp in job env; STYLE_INPUTS is instead
written to GITHUB_ENV by the candidate guard, and final lint passes.

### Selected full campaign and revised limits

Select one fresh full Windows x64 campaign at ordinal 4: eight normal SDK starts,
three helper SDK validation/discovery starts, one helper session, one package build
and one native session. Both rendering paths use the same exported source. All
16 normal rows, 32 exact helper comparisons, five rejection cases, actual helper
counter/shutdown, x64 package identity and all native stages must be audited.
The native probe does not execute an SDK. No older helper/native slice substitutes
for those fresh selected Windows results.

Under Kris's explicit allowance increase, the Windows SDK ceiling is 25 and the
costly dispatch ceiling is four. Before CI4, use is SDK 14/25, helpers 1/4,
packages 1/2, native sessions 1/2 and dispatches 3/4. Planned totals are SDK 25/25,
helpers 2/4, packages 2/2, native sessions 2/2 and dispatches 4/4. Count actual
starts, including implicit validations and failures. This records one full campaign,
not a reset of prior consumption. Further necessary increases are authorized by
the user but must be stated and accounted before the applicable operation starts.
Mac's historical SDK 21/16 and other consumption remain unchanged; no Mac
SDK/package/native restart is needed for this Windows workflow correction.

PR #72 stays draft and #43 stays open with unchecked criteria. Publication and
exact CI4 dispatch identity follow after focused verification/review. The existing
manual same-thread resume route remains required for workflow_dispatch's terminal
audit; the PR check watch cannot establish that run's result. No new watcher,
scheduler or model-polling loop is introduced.

### Final review and publication preparation

A fresh read-only review reports zero actionable findings in the final workflow,
helper consumer, focused tests and reuse-owner deletion. It confirms that preflight
cannot export the snapshot through a leaked environment variable, both producers
receive the same directory, failure propagation remains strict, and the full
campaign counts are eleven SDK starts, one helper/package/native start each.
The review starts no costly operation and is not Windows execution evidence.

Repository validation, 13 section-link tests, exact-ordinal selection audit and
whitespace checks pass. Ordinal 4 alone is accepted; 1/2/3 refuse. Configuration
review confirms one normal accepted path, two scoped consumers of the common
input directory and no retained-artifact download, reuse caller or reuse script.
Original CI3 receipts are untouched. No product source or dependency changes.

### CI4 publication, dispatch and automatic-quality audit

The complete correction is published at
d5b19e527f3b420af603991d9fdc68a9140adb1e. PR #72 and #43 are updated remotely
with the removed reuse path, fresh full proof requirements, revised cumulative
limits, source diagnostics and focused/independent review results.

[Fresh full CI4 41187324356, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41187324356/attempts/1)
is confirmed at that exact head on codex/l07-shared-looks, event workflow_dispatch.
Inputs are shared_style=true, ordinal=4 and exact candidate; all other specialist
selectors are false. Selection and exact-candidate/ordinal guards pass. Portable
preflight is in progress at the observation in ignored `ci4-wait-record.json`.
No new costly target start is established by that observation. Dispatches are
4/4; eleven SDK starts and one helper/package/native start each are reserved
against confirmed Windows SDK/helper/package/native use 14/1/1/1. Record actual
starts from the full result, including implicit validation and failed starts.

[Automatic Repository quality 41187217183, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41187217183/attempts/1)
is audited successful at d5b19e5. Both required jobs and every executed step pass:
277 frontend tests with no failures/skips, pinned Rust formatting, 1,293 checkout
files validated, 13 section-link tests, 10 retention tests, Q1 rejection fixtures
and selector source audit. Nine unselected specialist jobs are skipped. Full logs,
terminal metadata and the audit remain ignored under `ci-quality-04-*`.

The automatic result does not establish manual qualification. The full CI4 log/
artifact/source/normal/helper/rejection/counter/package/native/cleanup/privacy
and availability audit remains pending. No run-specific T3 watcher is registered;
manual same-thread resume is still necessary. The completed PR rollup supplies
no manual-run completion event. No new watcher or model-polling loop is started.
These wait updates in repository status/evidence remain local pending terminal
audit; the fix is published and remote PR/ticket already retain the exact run.
The unrelated audit is intact, PR remains draft and all issue criteria unchecked.

## CI4 terminal success audit and review handoff, 2026-10-31

Kris resumed for the completed CI audit, PR/associated-ticket updates and a new
chat to review PR #72 with the code-review skill. The selected full qualification
is now terminal and audited. No new SDK/helper/package/native start or costly
dispatch occurs during this audit or documentation publication.

### Exact result and retained proof

[Full Windows CI4 41187324356, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41187324356/attempts/1)
passes at exact d5b19e527f3b420af603991d9fdc68a9140adb1e. Selection and the
shared-style job pass, including every executed setup, check, qualification,
privacy, upload, cache and cleanup step. Other specialist selectors are unselected
skips. The guard confirms branch, candidate, ordinal 4 and first attempt.

The downloaded artifact shared-style-Windows-41187324356-1, ID 13037906620,
contains 157 files. ZIP SHA-256 is
0969009c3d781a6b059e76e27d9aad6d0a0676e4d614948a77e18bd9f7b6bca7;
expiry is 2026-11-07 09:24:16 UTC. Digest verification and local privacy recheck
pass. Original artifact files/receipts remain immutable under ignored
windows-ci-04; replay writes only to a separate helper copy. Complete logs,
metadata and the structured final audit remain under `ci-focused-04-*`.

All three accepted manifests, export/normal/helper, are byte-identical with SHA-256
7585a23c68ef449e35ad4070f55a4978d114e54cce36984cd744163310671fc0.
Every source SHA and font fixture SHA verifies. Candidate, normal checker and core/
renderer source hashes match the tested files. This directly resolves CI3's
cross-run source mismatch without replacing IDs or weakening provenance.

All 16 normal stage/aspect/state rows replay successfully, including semantic
border/interior samples, distinct-state evidence, every PNG hash and exact RGBA
source/literal equality for both screens. All eight normal SDK commands exit zero,
without timeout or output truncation, and SDK scratch cleanup is complete.

The fresh helper records 32 accepted frames and a typed pending frame. Revision,
state, size, physical drawing scale and image data validate. The pending frame
matches its later accepted independent source. All 32 helper/literal comparisons
replay with zero differing pixels. Both the uploaded comparison and a fresh
consumer replay reject all five cases: different source snapshot, missing frame,
wrong source, wrong state and blank frame. The helper reports exactly three SDK
validation/discovery starts, one helper session, cooperative exit zero and complete
cleanup. Its renderer hash matches the current producer.

The actual controller/core journey and exact packaged-probe rehearsal pass.
The correlated assignment payload and core node show the proposed background and
cleared border at the expected source revision. The fresh x64 package is retained;
PE machine is 0x8664 and executable SHA-256 is
542431af94b43e2baac59f5c449e321828f65a7804a52af0dd5207babc1d7cd5,
matching the candidate-bound package receipt. The native report passes the actual
consumer, all seven stages, exit zero, no external errors and complete cleanup.
It reports sdkExecuted=false. This is automated native proof, not physical/human
input acceptance.

[Automatic Repository quality 41187217183, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41187217183/attempts/1)
also passes at that exact candidate, as audited above. Both required jobs and all
executed steps pass, including 277 frontend tests, pinned formatting, repository/
link/retention validation and Q1 fixtures/source audit. Nine specialist jobs are
unselected skips. The manual qualification and automatic rollup are independently
identified and audited; neither result is inferred from the other.

### Criterion and accounting result

| L07 criterion | Audited bounded evidence | Remaining acceptance |
| --- | --- | --- |
| Supported appearance and ordinary shared source | Same-source Windows normal/helper comparisons, semantics and states; recorded unchanged Mac SDK/helper proof retains its source/hash scope. | Final full-PR review and acceptance decision. |
| Affected-use review, shared/copy/Cancel | Actual controller/core journey and fresh seven-stage Windows native report; recorded signed Mac native proof. | Final full-PR review; wider physical/human acceptance stays separate. |
| Inspector state and stale refusal | Review retention, independent/shared draft and stale refusal stages pass through actual controls/core/native consumer. | Final full-PR review and acceptance decision. |
| Source/revisions/history/reopen and Source-only dynamic cases | Existing public-core tests, fresh controller/native Source/history/reopen and retained unsupported-use refusal evidence. | Final full-PR review and acceptance decision. |

CI4 actual use is eight normal SDK starts plus three helper validation starts,
one helper, one package and one native session. Final cumulative Windows use is
SDK 25/25, helpers 2/4, packages 2/2, native 2/2 and dispatches 4/4. Reservations
are resolved to actual starts. Mac remains SDK 21/16 historical, helpers 2/4,
packages 2/2 and native 2/2; its earlier overrun and failed attempts remain visible.
Kris's needed-allowance authorization is unchanged, but no further costly operation
is selected or needed for this audit/review. No qualification is rerun for docs.

### Publication and next owner

The audit/status closeout is documentation only; d5b19e5 remains the tested full
Windows candidate and no later documentation SHA is relabelled as that candidate.
Repository evidence, CURRENT and HANDOVER are reconciled for publication. Status
records retain their earlier size exception for unique protected recovery/history;
the selected L07 continuation is replaced instead of adding another live wait.

Update #43, its B03 parent #25, P3B #22, B08 #30 and dependent L18 #46 with the
bounded automated pass and pending final full-PR review. Keep native dependency
edges, acceptance boxes and issue states unchanged; L18 does not start from this
audit. Keep PR #72 draft; merge/release and issue closure are not selected.

Kris requested a separate read-only review chat. Its fixed full-branch base is the
already confirmed e9e86613a9206212ef0f5c020fb9f13ec00c44df. It must review the
final published PR head with fresh Standards and Spec subagents using the named
code-review skill, live #43/P3B/B03, A5 approval and current repository contracts.
The reviewer owns no repository files and starts no costly qualification. This
chat finishes its writer work before that review starts. The unrelated untracked
audit and protected recovery remain intact. There is no manual qualification run
or run-specific watcher pending after this terminal audit.

## Full-PR review corrections and fresh qualification, 2026-10-31

The separate fresh-context review of `3cb39a6` against confirmed base `e9e8661`
found two Standards issues and two Spec issues. Appearance inputs omitted completion
validation and accessible field errors; Style creation silently rewrote technical
names. Repeated pending Style assignment could modify the next Style's definition,
and copying a text-only button Style moved local decoration into the text definition.
These findings do not revoke the candidate-specific CI4 results above.

Kris selected fixing all four findings through parallel subagents, each applying
`principle-fix-root-causes`, reproducing the fault and reviewing its own changes.
The inspector worker owns `screen-text.ts` and focused frontend tests. The core
worker owns `styles.rs` and focused public-core tests. Each has a separate worktree;
the coordinating agent owns integration, final validation, evidence and publication.
Kris then explicitly approved additional testing runs where needed. The earlier
review-only restriction no longer applies to this selected correction outcome.

Core worker `138ca82`, integrated as `f73ad9a`, partitions properties through the
existing applicability and patch owners. Text-only button Styles own text properties;
normal/state decoration stays on the element. Assignment preserves decoration and
removes a superseded container reference. Opaque local properties and comments stay
in place. Reproductions failed before correction. All 14 selected ordinary Style
tests pass in the worker, along with formatting, whitespace and repository validation.
Its self-review also corrected mixed-edit routing, opaque text-edit refusal and
full-button-to-text-style assignment. The worker ran no SDK/helper/package/native
process or CI dispatch. No helper renderer mapping changed.

The coordinator extended the existing public-core runtime export to assign a
text-only Style to the decorated button, then copy that Style independently. The
literal reference uses the matching ordinary text parent. Fresh qualification will
therefore exercise the corrected source ownership in both stages, all four states
and both aspects, using one accepted export for normal SDK and helper producers.
Previous fixture/reference bytes and CI1-4 artifacts remain immutable historical
evidence. They are not substituted for this new scenario.

The selected next campaign is full Windows CI5 at cumulative ordinal 5, after
combined local validation. It reserves eight normal SDK starts and three helper
validation/discovery starts, one helper, one package and one native session. Under
Kris's additional-run approval, one further diagnosed correction campaign may run
if CI5 exposes a fault. Cumulative ceilings are Windows SDK 47, helpers 4, packages 4,
native sessions 4 and dispatches 6. These ceilings include existing use and two full
campaigns; they do not select an automatic retry. Actual use remains SDK 25, helpers 2,
packages 2, native sessions 2 and dispatches 4 before either campaign starts. Mac use
remains SDK 21/16 historical, helpers 2/4, packages 2/2 and native sessions 2/2.
Any additional Mac operation will have its affected scope and cumulative selection
recorded before it starts. Earlier overruns and failed results remain disclosed.

Final integration, inspector correction results and CI candidate/run identities
remain pending in this checkpoint. The first coordinating broad ordinary-core run
reported a descendant-presence assertion in the unchanged runtime-service cleanup
test; diagnosis and its terminal result remain pending. It is not a passing suite.
PR #72 stays draft and #43 acceptance stays unchecked. Physical/human input, full
Design Lab startup and wider editor/canvas/3B acceptance remain separate.

### Mac rendering selection for the corrected source path

The corrected fixture now uses a text-only button Style instead of the former full
button Style. Both target renderers must qualify that source path. Before CI5, select
one fresh Mac normal/helper campaign from one accepted export: eight normal SDK
starts, three helper validation/discovery starts and one helper session. The
cumulative Mac ceilings for this selection are SDK 32 and helpers 3; package/native
use stays 2/2 each. Actual Mac use before the campaign remains SDK 21 and helpers 2.
The earlier SDK 21/16 overrun remains historical and disclosed. Any diagnosed repeat
will require a revised cumulative selection before it starts under Kris's
additional-run approval. The normal/helper comparison remains exact and retains
all semantic, state, source-identity, rejection and cleanup checks.

### Coordinator core and Mac rendering results

The core/source qualification candidate is `ed9391a7d1416536fd625b14dbe79590de3e86ce`.
The first broad debug ordinary-core run at the integrated core code reports
476 passed, one failed, 52 specialist cases ignored and three documented exclusions.
The failure is `runtime_service_switch_cancel_stop_shutdown_drop_and_closed_pipe_descendants`:
its descendant-presence assertion observed a process ID after cleanup. Its test and
runtime cleanup implementation are unchanged by this correction. An exact isolated
replay passes in 5.81 seconds; the documented full release-core run then passes
477 tests with zero failures, 52 specialist cases ignored and the same three
exclusions in 445.58 seconds. No runtime assertion, deadline or production cleanup
code was changed to obtain that pass. The original failure remains a non-reproduced
cleanup discrepancy; its cause is not established by the passing reruns.

The updated 14-case ordinary Style slice, all 38 desktop tests, both driver-process
tests and all five image/source-identity gate tests pass. Pinned formatting,
workflow lint, whitespace and repository validation pass. The real controller driver
is rebuilt from the integrated core. Combined inspector/controller validation is
still pending the frontend worker's completed change.

Fresh Mac normal output passes eight SDK commands, all 16 stage/aspect/state rows,
semantic checks, exact RGBA source/literal equality and scratch cleanup. The fresh
helper passes all 32 exact literal comparisons, all five bad-evidence rejection
cases and the typed-pending/accepted match. It records three SDK validation/discovery
starts, one session, cooperative exit zero and complete cleanup. The coordinator
audits every frame's source revision, state and dimensions, all current core/source
hashes, renderer hash, command exits and byte-identical export/normal/helper manifests.

The accepted manifest SHA-256 is
`0dd30dd5e40eefda16b5257ea0009d8c5ccdbe1792aab0e965294173b43b24a3`.
Renderer SHA-256 remains
`0f5a9f9b99610fd93a00a92229cd15182344e48f9a41d114e8815653251df749`.
Original receipts, images and the compact audit remain ignored under
`final-review-mac-01`; the release-core and desktop logs are under
`final-review-validation`. The new Mac proof covers the corrected text-only button
source and unchanged renderer, not a new native package or the pending inspector code.

Actual additional Mac use is SDK 11 and helper 1. Cumulative Mac use is now SDK
32/32, helpers 3/3, packages 2/2 and native sessions 2/2. The earlier 21/16 overrun
and original CI1-4 evidence remain disclosed above. Windows use remains SDK 25,
helpers 2, packages 2, native sessions 2 and dispatches 4 before CI5. No new Mac
package/native session or costly dispatch ran for this local qualification.

### Inspector integration and final local validation

Inspector worker commits `1a31bbb` and `12f3e2e` are integrated in order as
`e901cc6` and `895cdb8`. The worker reproduces missing associated appearance errors,
lossy technical-name normalization and A20/B30/C40 default retention before fixing
them. Its follow-up reproduces a text-only assignment preview clearing background.
The fix reuses completion/accessible field validation and technical-name validation,
records actual user edits within the existing draft, and keeps local decoration out
of shared text-only previews. Self-review corrects user edits that match an
intermediate Style's defaults instead of treating them as untouched defaults.

The coordinator reviews the combined production changes and the new tests against
the four findings, the approved inspector and existing source/property/draft owners.
No further issue is found in that combined correction review. All 285 frontend
tests pass with zero failures, cancellations or skips, using pinned Node/npm and
Python 3.12.16. Typechecking and the production build pass. The actual UI/core
journey and exact packaged-probe rehearsal pass from the primary checkout, including
the real report consumer. They execute no SDK and do not claim native WebView proof.

The controller asserts exact source preservation and unchanged existing uses after
repeated pending assignment, Undo/Redo and agreement of correlated provisional and
accepted core plans. Full-button-to-text-only assignment retains normal/state
backgrounds and borders locally. Its accepted plan removes the superseded label-style
reset metadata; appearance properties otherwise agree. New DOM cases cover blur,
IME, associated errors, dependent border correction, hidden-state invalid submission,
draft/focus retention, valid underscores, invalid names, untouched defaults, explicit
font inheritance and actual user edits across repeated Style changes.

Original worker reproductions and successful results remain in the workers' ignored
evidence. The coordinating results are retained under `final-review-controller-01`,
`final-review-probe-01` and `final-review-validation`. The Mac-qualified core/source
hashes still match after frontend integration, so its `ed9391a` rendering proof
retains that explicit scope. No renderer mapping or native identity changed.

Publication selects full Windows CI5 at ordinal 5 and the candidate's automatic
Repository quality run. [L07 #43](https://github.com/Caldwell-41/Renpy-editor/issues/43)
owns the confirmed run IDs, attempts, exact heads, observed state and cumulative
actual/reserved use after dispatch. Audit those exact runs before claiming Windows
qualification. CI4 and the fresh Mac proof keep their original candidate identities.
The PR stays draft and acceptance remains unchecked pending that audit and the
user's acceptance. The run-specific T3 watch limitation recorded above still applies;
the automatic PR rollup does not establish completion of the manual workflow.

### CI5 publication and initial audit

The correction candidate `e8750cdc269522c8b26d1fcc72cb2b78e09ff9a7` is published
and verified as the draft PR head. [Full Windows CI5 41194613628, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41194613628/attempts/1)
is confirmed at that exact candidate, with `shared_style=true` and ordinal 5.
At 2026-10-31T10:55:12.327766+00:00 it is `in_progress`. Selection validation,
checkout and the exact candidate/ordinal guard pass; the Windows job is in cache
setup. SDK/helper/package/native steps have not started at that observation.

[Automatic Repository quality 41194536315, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41194536315/attempts/1)
is audited successful at the same candidate. Both required jobs and every executed
step pass, including all 285 frontend tests, pinned Rust formatting, repository
validation, 13 section-link tests and Q1 rejection/source checks. Nine unselected
specialist jobs are skips. Its complete retained log has SHA-256
`d87e77c65f94d33cefdf2335a3479ab1a3477bc72c59fd89fa3954dea39be2b5`.

Actual costly dispatch use is now 5/6. Before CI5, Windows use is SDK25/helper2/
package2/native2. Eleven SDK starts and one helper/package/native start each remain
reserved for this run until its logs and receipts establish actual execution.
Cumulative ceilings stay SDK47/helper4/package4/native4/dispatches6; no retry is
selected. Mac actual use remains SDK32/helper3/package2/native2, with the historical
21/16 overrun retained. Original metadata and quality logs are ignored under
`ci-focused-05-*`; CI1-4 and fresh Mac evidence remain unchanged.

The following documentation-only handoff does not replace `e8750cd` as the full
Windows candidate. Its own automatic quality result must be audited separately.
[L07 #43](https://github.com/Caldwell-41/Renpy-editor/issues/43) owns the latest
published head and automatic run identity after that handoff. Remaining work is
the exact CI5 terminal audit, all executed steps, same-source normal/helper images,
rejections, fresh Windows package/native report, exit/cleanup, artifact digest/privacy
and actual counts. Keep draft/open/unchecked status until that audit and acceptance.
