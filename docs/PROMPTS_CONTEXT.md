# Project prompts and context preparation

The selected outcome implements one action, **Dialogue rewrite**, for a saved dialogue
or narration Beat. Settings → Current project has System prompts and Context preparation
tabs. Preparation is read-only: it has no provider Send or proposal/application path.
This is a bounded part of 2B.1; routes, other action prompts, generated references,
automatic retrieval, provider mapping/send consent and full Phase 2 remain separate.
The [owning selection and ledger](tasks/active/phase-2-initial-llm-assistance.md#prompts-and-context-preparation-selection--2026-10-10)
own acceptance and target evidence.

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
python3 -m unittest discover -s app/scripts -p test_prompt_probe_gate.py -v
```

On Windows supply the driver's `.exe` path. The driver owns one disposable root and
uses actual `ApplicationHost` dispatch/transaction persistence. Chrome newline checks
support native proof. `scripts/prompt-context-probe.py` owns exclusive packaged phases
1/2 against a fresh temp `loomlight-prompt-*` root and verifies both metadata files
byte-for-byte across process reopen. Its gate rejects zero/missing/partial cases and
unclean/failed reports. Physical Save/focus and theme/compact observations require
actual native UI before releasing bounded stage markers; do not observe an exited app.
Use only the selected ledger's remaining cumulative build/launch allowance.
