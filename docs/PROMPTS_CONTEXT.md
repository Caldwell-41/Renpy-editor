# Project prompts and context preparation

## Shared project world and tone — 2026-10-15

The [redesign implementation](tasks/active/walkthrough-redesign-implementation.md)
adds shared project context to the existing writing actions. This amendment describes
local code; required qualification and human phase acceptance remain pending.
`context.options` exposes the optional reference document's `projectContext` record.
`context.preview` accepts `includeProjectContext` (default true). After the user starts
a writing operation, the current saved notes enter the user-role object as
`projectContext:{recordId,revisionId,world,tone}`. Only those known fields are sent;
unknown record/revision/content extensions remain on disk. A per-request unchecked
control omits the entire outbound member. The exact preview discloses inclusion or
omission and includes the complete body/digest before explicit Send. Saving/opening
Lorebook sends nothing; synthetic connection tests include no project context.

World notes describe shared setting/rules/starting circumstances; they do not establish
every character's knowledge. Tone guides overall style, while explicitly selected card
voice guides that person. Existing `ai.json.styleNotes` remains byte-preserved/readable
as legacy data but is excluded from requests, so it cannot silently compete with the
Lorebook tone. Existing action prompt overrides remain visible and editable separately.
Legacy approved lore/card selection and support/approval refusals are unchanged.

World/tone bytes participate in the same complete serialized-body estimate, response
reserve and safety margin. Exceeding Context length refuses; no content truncation or
automatic omission. Both legacy budget/capacity fields derive from the one visible
Context length on explicit request preparation. The reference snapshot remains in the
read set, so changing shared notes invalidates a prepared send. Generation separately
checks actual loaded-model context through the Studio readiness adapter; that capacity
is reported read-only. Prior sections' separate editable capacity/style descriptions
below are superseded where this amendment says so.

The selected outcome implements one action, **Dialogue rewrite**, for a saved dialogue
or narration Beat. Settings → Current project has System prompts and Context preparation
tabs. Settings context preview remains read-only. Story → Assist now adds the
separately selected first safe rewrite workflow described below.
This is a bounded part of 2B.1; routes, other action prompts, generated references,
automatic retrieval, destination expansion and full Phase 2 remain separate.
The [owning selection and ledger](tasks/evidence/phase-2-execution.md#prompts-and-context-preparation-selection--2026-10-10)
own acceptance and target evidence.

The 2026-10-12 closeout amendment defers selected-route context, repeated visits and
bounded route cycles beyond Phase 2. Existing Scene/Beat/Chapter context and explicit
approved references remain selected. Stored reference route applicability remains
supported and does not assemble route context.

## First safe dialogue rewrite

Story offers Assist → Rewrite dialogue for one saved ordinary root dialogue/narration
Beat. Nested, conditional, protected and unsupported targets refuse. This nonmodal
session-owned panel retains the task across navigation and failures. References are
explicit unchecked exact approved revisions; Reload saved choices is explicit.
A dirty Scene/supporting form refuses continuation. Author-input generation binds
the review, and pending Source input is retained behind the existing transition
barrier before prepare/send/accept. Relevant retained Source drafts and changed
draft generations refuse in core. Nothing silently commits a form.

Review complete send prepares a memory-only token and displays the complete exact
UTF-8 request body/digest, provider, endpoint, exact model, literal loopback location,
unknown inference locality, provider-retention/cancellation notice, included/excluded
context and protected syntax. This slice uses the existing Unsloth Studio literal
loopback HTTP adapter and native credential reader. No public/paid destination is
qualified. Input-byte estimate plus response reserve and max(256, ceil(bytes/10))
margin must fit both requested budget and unverified capacity; no truncation or
profile-default mutation. The body uses system/user roles, strict `json_schema`,
no streaming, tools or thinking, and the existing bounded timeout/cancellation.
Only Generate proposal sends the captured body once; renderer supplies token/digest
and cannot replace the body, credential, reply or filesystem mutations.

The complete response is one closed JSON object with schemaVersion 1,
action `rewriteDialogue`, exact sceneId/beatId target and 1–256 ordered segments.
Each segment contains only `literal` or only `token`. Core refuses duplicate keys,
extra prose/fences/fields/operations/paths, wrong target/model/finish reason, malformed
or bounded-resource-invalid output. No fallback or repair request occurs. Existing
interpolation and recognized balanced text tags become revision-bound core opaque
tokens; every token must appear exactly once in original order. Unsupported escapes
and ambiguous boundaries refuse. New literals escape Ren'Py string syntax and
double opening square/curly delimiters so expressions/calls/action tags display
literally. Existing token source spellings are restored exactly, with no execution.

Response review displays passive saved/proposed semantic text, preserved source
tokens and complete exact Before/After source and source-map patches. It is a static
proposal; receipt writes nothing and does not validate runtime behavior. Accept 1
change rechecks original file bytes and identities before any projection refresh,
source/structure/prompt/reference/profile/session and relevant draft generations.
The exact stored proposal is consumed once through the shared transaction/history,
with one Undo/Redo. Only original quote contents are replaced; speaker, formatting,
comments, BOM/newlines, unsupported neighbors and unrelated files are preserved.
Cancel, malformed, unsafe and stale results cannot write. Failure retains the
author task/comparison; a changed input requires fresh preparation. Discard drops
the proposal and retains task; Close/replacement/project close confirms unfinished
work and performs cancellation/discard cleanup. Proposals do not survive sessions.

The [selected rewrite ledger](tasks/evidence/phase-2-execution.md#first-safe-dialogue-rewrite-selection--2026-10-10)
owns qualification and cumulative host allowances. Full 2B.1/2A.2/Phase 2 acceptance
is not implied. The following sections retain the Settings preview contract.

## Prompt ownership and edits

`app/src-core/prompts/v1/rewrite-dialogue.txt` is the single packaged baseline resource
for `rewriteDialogue`, baseline version `1`, with a SHA256 digest computed by core.
Installed text is used when no project override exists. Project-local overrides live
in `.renpy-editor/ai.json`: `schemaVersion: 1`, matching `projectId`, `prompts` object,
and optional `styleNotes` string (separate from prompt prose). Each selected override
stores literal `text`, `baselineVersion` and `baselineDigest`. No executable templates,
macros or reference-supplied system overrides exist. Style notes are displayed separately;
this slice does not add a style-note editor.

Save prompt is explicit, including Cmd/Ctrl+S in Settings. Unsaved prose is retained
across the two assistance tabs; leaving Settings/project scope requires Save or Discard.
Restore baseline shows the exact current saved and installed texts; Cancel writes
nothing. Confirm removes only this action's override and saves one undoable metadata
transaction. Shared project Undo/Redo restores exact bytes. History is session-local;
saved overrides and override removal survive normal and separate-process reopen.
Restoring does not reset another prompt, references, style notes, credentials or limits.
Existing unknown properties and other prompts are retained on supported Save; ordinary
external replacements refuse stale writes and preserve typed drafts.

Prompt and context operations share the renderer's persistence/service request queue.
Only prompt/choice reads use the existing bounded busy-refusal retry; mutations and
Build context preview are never automatically replayed. An unsuccessful initial load
keeps its diagnostic visible and offers **Reload project prompts**, without substituting
defaults or writing metadata. Save success/refusal restores focus after controls are
enabled; explicit initial-load recovery returns to the prompt editor. The retained-draft
guard also keeps the visible prompt tab and its keyboard selection in agreement.

Installed baseline version/digest and the override's saved baseline version/digest remain
visible. App updates do not overwrite custom prose. Saving an intentional edit records
its installed baseline; explicit restore adopts the installed baseline. A displayed
textarea baseline is captured after browser newline normalization: unchanged CRLF saved
text stays clean and is never rewritten merely by opening/closing the editor.

Prompt/task/style text is bounded to 32 KiB each; nonempty prompt prose is required.
The AI metadata file is bounded to 256 KiB. Missing metadata uses baseline without
creating a file. Malformed, duplicate-key, wrong-project or unsupported metadata is
retained and refused, never defaulted or repaired. Save/restore use the existing
transaction/history/recovery owner and active project/session authority.

## Exact selection and manifest

Core `context.options` returns saved eligible dialogue/narration targets, source and
structure revisions, prompt state, and exact approved Character-card/lore revision
choices with IDs and saved version numbers. Stale/missing supporting citations make a
choice unavailable. Every reference inclusion is explicit; no matching-tag lore or
linked entry is silently injected. An excluded link does not grant mutation authority.

Core `context.preview` binds the selected Beat/source/structure, prompt revision and
exact `{kind, recordId, revisionId}` selections. It rechecks active session, file snapshots,
approval and citation validity; relevant Source drafts/conflicts/unavailable projections
refuse preparation. Unrelated drafts are excluded and named. Choices are reloaded only
by explicit Reload saved choices; refused input stays in the form. There is no silent
rebuild after stale selection and no prepared-send consent/token claim in this slice.

A deterministic manifest shows project/session, action and target, prompt/baseline
digests, source/metadata read revisions, sorted/deduplicated selected revisions, excluded
references and explicit links/dependencies. Included definitions are the speaking
Character and simple `[variable]` defaults used by the selected text. Variable defaults
are not observed runtime values. Reference links, relationships, knowledge annotations,
citations and linked lore/Characters are accounted as resolved/included or excluded;
links never automatically expand content. Non-simple interpolation, conditions and
runtime state remain explicitly unknown. Finite-route traversal and a general dependency
expression interpreter are outside this one-Beat outcome.

The would-be payload contains system authoring prose and a user-role serialized object
with separate task/style, exact saved source range and typed Beat ownership, selected
known reference fields, definitions and a core-owned response/authority contract.
The contract is preview-only and cannot be disabled by prompt editing. It does not claim
an implemented response schema, provider-role adapter or proposal permission. Full exact
serialized payload and digest are inspectable as inert text. Read/preview executes no
project Python or custom code and performs no network request.

Other Beats/Scenes, custom source (marker only), asset binaries, unknown metadata
extensions, unapproved/hidden/external files, credentials and Git history are excluded.
Recognized reference prose is included whole, including knowledge/provenance notes;
unknown top-level and nested extension data stays on disk and is excluded explicitly.

## Size accounting and invalidation

The preview uses explicit total-budget, maximum-response and configured-capacity values,
labelled per-preview overrides and unverified capacity. Existing provider/model defaults
remain under Application → AI providers; this surface does not save/change profiles or
pretend to discover server capacity. Valid input budgets/capacity are 256–2,000,000,
response reserve 1–2,000,000; outbound serialized body ceiling is 2 MiB.

The complete serialized UTF-8 body, including JSON escaping/framing and the contract,
is counted as a conservative byte-as-token **estimate**, never provider-measured usage.
Show component content bytes for instructions, task, style, story, definitions, cards,
lore and contract; their sum is descriptive rather than a second serialized-body count.
Total = serialized-byte input estimate + selected output reserve + margin, where margin
is max(256, ceil(input/10)). Refuse totals above either budget or capacity, or bodies
above the byte ceiling. Report the failing total/budget/capacity; never shorten prose,
drop a dependency/reference, clamp output or substitute another model.

Any prompt Save/restore/Undo/Redo, target/task/reference or limit edit clears the displayed
preview and requires explicit Build context preview. Reopening Settings also rebuilds
only on author request. The complete payload is not written to project files or routine
logs. Native receipts contain bounded structural check names and hashes, no prose.

## Focused verification

From the repository root with the pinned toolchain activated:

```sh
cargo test --manifest-path app/Cargo.toml -p loomlight-core --locked prompts::tests -- --nocapture
cargo build --manifest-path app/Cargo.toml -p loomlight-core --locked --example prompt-controller-driver
npm --prefix app run build:tests
node --test app/dist-tests/tests/prompt-ui.dom.test.js app/dist-tests/tests/protocol.test.js
node app/tests/prompt-controller.dispatch.mjs app/target/debug/examples/prompt-controller-driver
node app/tests/prompt-line-endings.browser.mjs --expect-failure
node app/tests/prompt-line-endings.browser.mjs
node --test app/dist-tests/tests/request-lane.test.js
node app/tests/prompt-focus.browser.mjs
python3 -m unittest discover -s app/scripts -p test_prompt_probe_gate.py -v
```

On Windows supply the driver's `.exe` path. The driver owns one disposable root and
uses actual `ApplicationHost` dispatch/transaction persistence. Chrome newline checks
support native proof. `scripts/prompt-context-probe.py` owns exclusive packaged phases
1/2 against a fresh temp `loomlight-prompt-*` root and verifies both metadata files
byte-for-byte across process reopen. Its gate rejects zero/missing/partial cases and
unclean/failed reports. Physical Save/focus and theme/compact observations require
actual native UI before releasing bounded stage markers; do not observe an exited app.
The gate explicitly requires enabled prompt focus after physical Save and light/dark/
compact observation markers, as well as persistence/context checks. Failed native
reports remain failures even when individual preceding checks passed.
Use only the selected ledger's remaining cumulative build/launch allowance.


## Continue Scene

The bounded action is qualified on Windows x64 and macOS ARM64; the
[owning task](tasks/evidence/phase-2-execution.md#continue-scene-both-target-qualification-and-closure--2026-10-10)
records exact CI/native evidence and remaining phase-wide limits.
Story offers **Assist · Continue Scene** at an eligible saved root Beat. The anchor is
explicitly **before that Beat**, bound to its ID, byte offset, source/structure revisions
and project session. A supported existing terminal is required and disclosed. The
selected and preceding Beat must be supported root boundaries; nested, custom,
ambiguous or conflicting boundaries refuse. Terminal/edge replacement is unavailable.

Settings → System prompts selects Dialogue rewrite or Continue Scene. Each has one
versioned bundled baseline and a project-local editable override, using existing
metadata/history. Save/restore/Undo/Redo/reopen retain that action's exact prose and
other settings. Shared Undo/Redo refreshes both action models from saved state; if that
refresh fails, prompt controls stay unavailable until an explicit reload succeeds.
Overrides never change core response permissions. Assist uses the
saved action-specific prompt; it reviews the complete strict-schema body before Generate.

Continue context includes the saved Scene's supported root Beat payloads and terminal,
custom/nested exclusion markers, existing runnable Character definitions, relevant
variable defaults (runtime unknown) and explicitly selected approved references. Other
Scenes, excluded source, assets and unknown metadata stay excluded. Every source file
read and source draft generation is bound. No silent truncation, automatic send or
provider expansion. The accepted loopback Studio/non-streaming destination remains.

The closed v1 response has `schemaVersion:1`, `action:"continueScene"`, exact
`target:{sceneId,beatId}` (the Beat before which to insert), and `beats`. The inseparable
ordered group contains **1–8** entries: `{"type":"narration","text":…}` or
`{"type":"dialogue","characterId":…,"text":…}`. Character IDs must be from reviewed
existing definitions; total text is at most **10,000 UTF-8 bytes**. Unknown fields,
model IDs/paths/patches, definitions, terminals, tools, empty/control text, duplicate keys,
wrong targets, incomplete/malformed responses or unsafe values refuse without writes.
New prose uses the existing literal source/display encoder; expressions/tags stay inert.

Core prepares the whole group in memory with fresh UUIDs and a single source insertion
plus source-map mutation. Review shows the ordered semantic text, assigned IDs, saved
anchor/terminal and exact source/metadata before/after. Its digest binds all those bytes
and semantics. **Accept Beat group** consumes that stored proposal once through the
shared journal/history: one transaction and one Undo entry. Existing Beat IDs/payloads,
terminal and prefix/suffix source bytes survive. Undo/Redo/reopen retain exact source
and identity. Cancellation, session/profile/prompt/reference/source changes, competing
Source drafts or changed draft generations, replaced proposals and ordinary external
writes invalidate send/completion/acceptance. There is no automatic rebase/retry.


## Bounded Draft Scene

`draftScene` uses the same memory-only prepared-send/proposal lifetime as Rewrite and
Continue. The Chapter action explicitly selects a saved Chapter; author enters/reviews
a title. Its bundled versioned prompt is project-customizable with ordinary shared
Undo/Redo. Full destination, instructions, selected reference revisions, reviewed
Character definitions, closed schema and exact outbound body are visible before Send.
Existing source is guarded by revisions/draft generations without being sent as story
context. Any retained Source draft, unavailable mapped source or conflicted Scene
refuses preparation/acceptance. No silent rebuild or rebase after review.

The closed response echoes Chapter/title, contains 1–8 dialogue/narration Beats (10,000
total UTF-8 prose bytes), only reviewed existing Characters, and an explicit Return.
Core owns Scene/Beat UUIDs, technical label, destination path and literal encoding.
Model source/paths/IDs/definitions/connections/extra terminal fields refuse. The inert
review displays the whole Scene using its reviewed title, Chapter, literal prose and
existing Character display names, with a plain **Ends here** Return description.
Local display names come from the guarded authoring snapshot; they are bound into the
semantic digest and do not change the outbound request. Expandable request and exact
source/project/source-map details retain complete disclosures, core IDs/path and
metadata mutations. One digest binds semantic review and all exact mutation bytes. Accept creates
the Scene once in one transaction and one Undo entry; all existing source stays byte
exact. Empty Chapter directories materialize only on explicit acceptance. Undo removes
the new file and restores metadata; Redo restores the same IDs/bytes; reopen preserves
the result. No incoming connection is created. Cancels, malformed/unsafe/stale/draft/
external-edit refusal writes nothing; competing prepared reviews consume old identity.

This bounded action is qualified on Windows x64 and macOS ARM64; the
[task closure](tasks/evidence/phase-2-execution.md#draft-scene-qualified-closure--2026-10-11)
records exact candidate, native/source/history/refusal and pinned-SDK evidence.
Generated Character cards/lore, incoming/terminal replacement and custom source remain
separately selected deliverables. SDK validation is a separate explicit execution
action; ordinary preview never invokes Ren'Py.

### Generated Character card

`generateCard` drafts or updates one editor-only record from one saved ordinary
narration/dialogue Beat and explicitly selected approved references. Choose new/existing
card and a reviewed name; effective action prompt, target's known current content,
selected references/revisions, required speaking Character/variable defaults and full
exact strict-schema request are disclosed before Generate. Target content is data;
unknown metadata extensions, custom code and binaries stay excluded. One baseline
resource `app/src-core/prompts/v1/generate-card.txt` supports ordinary saved overrides,
restore/history and stale-send invalidation.

The complete closed response requires `schemaVersion:1`, `action:"generateCard"`,
`target:{recordId:<reviewed ID or explicit null>,title:<reviewed name>}` and `fields`:
aliases, description, appearanceNotes, personality, motivations, background,
speakingStyle, exampleDialogue. All fields required; no status/provenance/path/source/
links/approval/tool/asset/lore operation is accepted. Field JSON is bounded to 10,000
UTF-8 bytes (including escaping/framing); normal native reference field/document limits
also apply. Core preserves existing links/scope and extensions, assigns IDs/revision,
inferred provenance with prompt/request digests, selected-source support and explicit
reference citations. Self-reference citations are excluded to avoid a replacement
citing its own superseded approval. Prose stays ordinary metadata, without runnable
text escaping.

Review passive field changes and exact references.json before/after. Accept saves one
proposed revision, one transaction and one Undo entry; model output cannot approve it.
Current approved text stays available while proposed/rejected alternatives exist.
Separate explicit approval supersedes the prior approved revision; rejection keeps it.
Both use shared Undo/Redo. Persistent `supportingReadSet` binds actually sent source
identities/revisions and gates approval and approved inclusion; full existing source
read/draft guards remain transient acceptance protection. Generated proposals remain
memory-only until accepted. Reopen retains saved statuses/provenance/revisions.
No runnable Character, Appearance, asset, lore or source change is in this action.

This bounded action is qualified on Windows x64 and macOS ARM64. The
[task closure](tasks/evidence/phase-2-execution.md#generated-character-cards-qualified-closure--2026-10-11)
records exact dispatch, passive review, approval separation, zero-write refusals,
byte-exact source and shared history/reopen evidence.

### Generated lorebook entry

`generateLore` drafts/updates one editor-only entry from one saved ordinary dialogue/
narration Beat and explicitly selected approved references. Select a new/existing
entry and title. **Applies to** chooses this Scene or the whole project; an existing
entry can retain its exact current Scene/finite-route applicability, including repeated
visits and unresolved IDs. The author-selected scope is reviewed before Send and in
the resulting metadata review; model output cannot choose it. Required speaking
Character and variable defaults remain explicit supporting data; runtime knowledge
is unknown. Full-source revision/draft guards do not widen outbound content.

`app/src-core/prompts/v1/generate-lore.txt` owns baseline prose with ordinary saved
overrides/restore/history. The complete strict response requires schemaVersion 1,
action generateLore, target with explicit nullable recordId and exact reviewed title,
and required fields text/category/subject/tags/knowledgeNotes. Unknown fields, model
approval, scope/citation/provenance/ID/source/tool operations refuse. Generated field
JSON is at most 10,000 UTF-8 bytes; native field/document bounds also apply. Core
assigns IDs/revisions, inferred provenance, exact reviewed prompt/request digests,
sent-source support and explicitly selected reference citations. Self citations are
excluded; existing unresolved/unselected citations and matching extension values
remain. Known current target content is disclosed as data.

Passive semantic review and exact references.json before/after precede **Save proposed
lore entry**. It consumes one review and commits one proposed revision/Undo entry.
Separate **Approve this lore revision** supersedes prior approval; **Reject proposed
lore entry** retains it. Stale sent-source support and stale cited references block
approval/inclusion, including supporting staleness behind an unchanged approved ID.
Shared Undo/Redo and reopen retain exact metadata. Runnable source is byte-exact.
No keyword/recursive injection, embeddings, runtime inference or automatic inclusion.
Qualification state and allowances belong to the [selected task](tasks/evidence/phase-2-execution.md#generated-lorebook-entries-selection--2026-10-11).


## Selectable Scene edits

**Assist · Edit Scene** uses `editScene` for one existing saved Scene. Before Send,
select root dialogue/narration replacement targets, optionally enable one supported
insertion anchor, select permitted existing speakers, and separately permit either a
new runnable Character or one exact existing Character update. The author supplies
the new technical name; it is checked against saved source declarations and metadata.
Core preflights supported owned definitions and every saved Scene mapping so a new
speaker cannot reinterpret custom source. IDs, definition paths and inserted Beat IDs
belong to core. The action baseline is `app/src-core/prompts/v1/edit-scene.txt`, version1,
with existing override/restore/history behavior. Settings context preview directs the
author to Story to bind these permissions.

The closed response is `schemaVersion:1`, `action:"editScene"`, exact `sceneId`, and
1–8 `operations`: selected `replace` operations contain exact Beat IDs and token/literal
segments; one optional `insert` operation contains the exact anchor and 1–8 inseparable
dialogue/narration Beats; one optional `character` operation supplies displayName and
dialogueColor only. Each operation has a distinct response-local ID. Existing inserted
speakers must be permitted; `proposedCharacter` binds only to the explicitly enabled
new Character. No technical renames, paths, source, assets, card/lore changes or terminal
edits are accepted. Duplicate/wrong/unselected targets, unknown fields, missing new
Character, unsupported source and aggregate generated prose above10000 UTF-8 bytes
refuse the entire response. Character names and generated Beat prose use literal
Ren’Py encoding; existing replacement tokens retain their source spelling and order.

Review selects operations, never individual patch lines. New-Character dialogue depends
on the Character operation. Missing dependencies or an empty selection disable Save
without silently adding another operation. `rewrite.select` rebuilds a fresh core
semantic/file preview and digest, retaining allocated IDs. `rewrite.accept` binds
proposalId, selectedIds and previewDigest, checks every captured source/metadata/
prompt/reference/profile/session/draft revision, and consumes one proposal into one
journalled transaction/history entry. Same-file replacements and insertion are composed
in memory; Character source/authoring metadata and Scene source/map share the commit.
One Undo/Redo covers the selected result. Unselected suggestions become read-only;
further changes require a freshly prepared proposal. No preview executes project code.
Qualification and remaining acceptance belong to the
[selected task](tasks/evidence/phase-2-execution.md#selectable-proposal-editing-implementation-and-focused-proof--2026-10-11).
