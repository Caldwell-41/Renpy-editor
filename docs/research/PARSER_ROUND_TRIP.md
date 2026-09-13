# Lossless parser and round-trip spike

## Decision to prove

Choose a source representation that supports visual navigation and minimal edits
without losing user-authored Ren'Py text. The official selected SDK remains the
syntax/compile/lint authority. Private Ren'Py parser internals may be studied behind an
adapter but cannot be the only persistence strategy.

## Candidate approaches

1. **Existing concrete-syntax/token grammar:** evaluate maintained Ren'Py grammars,
   including tree-sitter candidates, for coverage, error recovery, trivia retention,
   source ranges, incremental parsing, licence, and extension points.
2. **Purpose-built lossless lexer plus partial CST:** tokenize every byte, structurally
   recognise supported statements/blocks, and preserve all other ranges as opaque
   nodes. This is more work but permits controlled partial visualisation.
3. **Hybrid:** use a grammar for broad structure and a lossless token/source layer for
   exact preservation, with SDK validation after staged edits.

Regex rewriting and whole-file regeneration are excluded. Ren'Py AST/private APIs
alone are excluded because stability and exact trivia/source preservation are not
assumed.

## Fixture matrix

Create small, independently diagnosable files plus an integrated synthetic game:

| Area | Required examples |
| --- | --- |
| Lexical | LF/CRLF input, BOM/no BOM, Unicode, escapes, interpolation, text tags, comments, blank lines |
| Narrative | labels, dialogue/narration, say attributes, menus, captions, conditions, call/jump/return/end |
| State/Python | default/define, one-line Python, multiline `python`/`init python`, unusual indentation, expressions |
| Display | scene/show/hide, `at`, `with`, transforms, ATL blocks, transitions, layered images |
| Media | play/queue/stop audio channels, voice, movie displayables |
| Screens | nested screen language, actions, style properties, loops/conditions, custom displayables |
| Project breadth | translations, styles, testcases, custom statements, init priorities, multiple files |
| Recovery | incomplete line while typing, malformed indentation/string/block, unknown future syntax |
| Unsupported | preserved custom code around and inside otherwise supported scenes/screens |

All names/content are synthetic and privacy-scanned. Golden expected files are stored
byte-for-byte; generated `.rpyc`, saves, screenshots, and SDK content are excluded.

## Acceptance tests

### Gate A — no-op fidelity

- Parse and serialize every valid fixture to identical bytes and line endings.
- Comments, blank lines, whitespace, quoting, identifier spelling, and ordering remain
  exact. If the chosen library cannot emit losslessly, original slices remain source.
- Unknown and embedded code round-trip byte-identically even when not understood.

### Gate B — minimal supported edits

For dialogue text, speaker/expression, background, sprite staging, variable value,
choice text/target, audio, and a simple screen property:

- only the expected source range changes;
- untouched bytes before/after remain identical;
- reparsing maps the same stable visual object or records a deterministic ID remap;
- the official 8.5.3 SDK compiles and lints the staged game successfully.

### Gate C — partial visual fallback

- Unsupported nodes appear as editable custom-code blocks at the original location.
- The owning scene/screen is marked partially visual with a precise reason/range.
- A nearby supported edit does not move, normalize, truncate, or rewrite the block.
- A visual operation that would cross an unsafe boundary is refused with remediation.

### Gate D — live editing and source mapping

- Incomplete syntax produces recoverable nodes/diagnostics without discarding text.
- Incremental edits invalidate and remap only affected ranges where practical.
- Visual selection maps to exact source; source selection maps to the narrowest known
  beat; ambiguous mappings are displayed rather than guessed.
- CRLF input is preserved unless the user explicitly normalizes it.

### Gate E — external edits and transactions

- Base hash detects edits even when timestamps are unchanged.
- Non-overlapping external and staged patches can be previewed and safely combined.
- Overlapping ranges produce a three-way conflict and no write.
- Simulated interruption preserves either the old or complete new file plus recovery
  data; never a truncated hybrid.

## Measurements and record

For each candidate, record grammar/library commit and licence, parse and incremental
latency, memory, supported-node coverage, recovery quality, exact failures by fixture,
patch complexity, and maintenance burden. Run on Windows and macOS filesystems with
spaces, Unicode, case differences, and long paths.

## Selection rule

No production source service can be accepted unless Gates A, C, and E pass fully.
Phase 0 may select a source-authority direction from bounded evidence, but that does
not mark the unimplemented portions of those gates complete. Gate B may begin with the
Phase 1 supported subset only if unsupported constructs satisfy Gate C and the roadmap
names their expansion. Prefer the simplest maintainable approach that passes, not the
parser with the largest claimed grammar.

The result becomes an accepted ADR and a versioned source-service interface before
production authoring code is built.

## Result

The first corpus and isolated source-slice implementation have been executed. See
[PARSER_SPIKE_RESULTS.md](PARSER_SPIKE_RESULTS.md) and
[ADR 0001](../adr/0001-lossless-source-model.md). The architectural direction is
accepted; the disposable tokenizer is not production code. Gate A is corpus-bounded,
Gate C still needs partial-visual UI behavior, and Gate E still blocks a production
writer pending platform transaction/recovery work.
