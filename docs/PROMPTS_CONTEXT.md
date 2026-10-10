# Project prompts and context preparation

The selected outcome implements one action, **Dialogue rewrite**, for a saved dialogue
or narration Beat. Settings → Current project has System prompts and Context preparation
tabs. Settings context preview remains read-only. Story → Assist now adds the
separately selected first safe rewrite workflow described below.
This is a bounded part of 2B.1; routes, other action prompts, generated references,
automatic retrieval, destination expansion and full Phase 2 remain separate.
The [owning selection and ledger](tasks/active/phase-2-initial-llm-assistance.md#prompts-and-context-preparation-selection--2026-10-10)
own acceptance and target evidence.

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

The [selected rewrite ledger](tasks/active/phase-2-initial-llm-assistance.md#first-safe-dialogue-rewrite-selection--2026-10-10)
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
[owning task](tasks/active/phase-2-initial-llm-assistance.md#continue-scene-both-target-qualification-and-closure--2026-10-10)
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
