# Manual reference library v1

**State:** concrete pre-editor contract for the selected manual-library outcome;
not implemented or accepted. Phase 2 section 9 and ADR 0011 own the product rules.
UI selection and both-target production evidence remain required.

**Manual UX correction, 2026-10-09:** the user's latest direction replaces the
manual approval workflow. Select an entry, edit directly, then Save changes or
Discard changes. No Edit unlock, Save as proposed, Approve, Reject or Supersede
controls in this manual outcome. Save records the author's text as current in one
transaction; revision/status storage supports later generated-content review.

## Ownership and persistence

One core reference service owns `.renpy-editor/references.json`, containing
`schemaVersion: 1`, `projectId`, `cards`, and `loreEntries`. Collections preserve
author order. Core allocates lowercase UUID v4 record/revision IDs; IDs are unique
across both collections and revisions. Project ID must match project metadata.
Missing data produces an empty library without creating a file on read.

No legacy reference format exists: v1 needs no migration. Version 0, malformed,
wrong-project, invalid or newer data is diagnosed and left byte-for-byte intact.
Loading other project surfaces must remain possible. Writes are blocked until the
library can be read safely; it must never be reinitialized over invalid data.

All writes use the active project authority, anchored transaction snapshot, expected
file revision and shared `AuthoringService::commit_history` path. One manual save
or reordering is one history entry. References use the existing
project history, ordinary external-edit boundary, recovery and flush policy. No second
reference-specific Undo stack. Undo/redo restores exact persisted bytes/status/IDs;
history is session-local, while useful saved revisions survive reopen.

## Record and revision shape

Each card/lore record requires `id`, `revisionCounter`, `currentRevisionId`,
`approvedRevisionId` (UUID or null), and `revisions` (one to three items).
`revisionCounter` is a positive safe JSON integer, at most 9,007,199,254,740,991.
Revision numbers are positive, distinct within the record and no greater than that
counter. The counter advances only on content replacement, never on review alone.

Each revision requires `id`, `number`, `status`, `createdAt`, `reviewedAt` (UTC RFC3339
or null), `reviewNote`, `supersedes` and `supersededBy` (revision link or null),
and `content`. A revision link is `{recordId, revisionId}`. `status` is exactly
`proposed`, `approved`, `rejected` or `superseded`. Current and approved pointers
must resolve locally. At most one revision is approved, matching the approved pointer.
Review changes status/metadata of that exact revision; it never changes its prose.

Retain current, approved (when distinct), and the most recent other revision by
revision number. On the next content save, older non-current/non-approved revisions
are removed from this bounded inspection set; ordinary transaction history owns Undo.
Revision IDs are never reused. Missing targets of cross-record revision links remain
unresolved, including links to revisions outside another record's retained set.

Shared `content` requires `title`, `tags`, `scope`, `knowledgeNotes`, `provenance`,
`citations` and `links`. Empty optional prose/arrays are valid; title must contain a
non-whitespace character. Prose, Unicode, whitespace and line endings are not normalized.

| Shape | Fields |
| --- | --- |
| Card content | Shared fields plus `linkedCharacterId` (UUID or null), `aliases` (strings), `description`, `appearanceNotes`, `personality`, `motivations`, `background`, `relationships`, `speakingStyle`, `exampleDialogue`, `linkedLoreIds` (UUIDs). Card title is its name. |
| Lore content | Shared fields plus `text`, `category`, `subject`, `knowledge` (Character annotations). Text must contain a non-whitespace character. Category/subject may be empty. |
| Entity link | `{type, id}` where type is `scene`, `character`, `card` or `lore`; ID is a UUID. Missing entities are permitted and shown as unresolved. |
| Relationship | `{target, text}`; target is an entity link or null, allowing prose-only relationships. |
| Knowledge annotation | `{characterId, notes}`; missing Character stays visible. Written notes express author intent, never computed game state. |
| Provenance | `{kind, notes}` where kind is `userAuthored`, `sourceDerived` or `inferred`. Manual saves can record any of these labels; no automated inference/generation occurs. |
| Scope | `{type: "project"}`, or `{type: "scenes", sceneIds: [...]}`, or `{type: "route", sceneIds: [...]}`. Scene scope is nonempty and unique; finite routes are nonempty and retain repeated visits. |
| Entity citation | `{target, revision, notes}`; target is an entity link. Scene/Character revision is the existing SHA256 source revision; card/lore revision is a UUID. |

Citations do not expose arbitrary file paths or fetch URLs. This manual foundation
supports the Scene/Character and reference entities already available through project
snapshots. Missing citations remain unresolved. Different known supporting revisions
make the citation stale. These states are derived on read, separately from persisted
approval; reads never rewrite metadata. Scope/link absence does not widen applicability.
An approved revision with stale or unresolved citations is ineligible for future default
context selection. Linking alone does not claim source-derived evidence or stale prose.

## Lifecycle

Selecting an entry opens editable fields immediately. Save changes creates a new
revision of the author's text with internal `approved` status and updates both
current/approved pointers atomically. Prior approved text becomes `superseded` with
reciprocal revision links and remains in the bounded set/history. This is an ordinary
save, not a separate approval ritual. New entries use Create card / Create lore entry.
No-change Save is disabled; invalid submissions preserve fields without writes.

Discard changes restores the saved form; it never undoes a committed Save. Navigation
with unsaved changes uses the existing draft-loss guard. A stale or missing supporting
citation is retained and shown under source notes, without preventing a manual prose
save. Future default context eligibility remains false while evidence is unresolved
or stale. Saving must not silently update a citation's captured source revision.

`proposed`, `rejected` and `superseded` remain valid stored states for later generated
review and fixture compatibility; no manual status-management toolbar is selected.
Future generated changes still cannot approve themselves. Their saved proposals must
retain approved text during review; generation/review UI is outside this outcome.
Records are retained; deletion is outside this selected outcome. Reorder is explicit
within the same collection; name/prose/category/tag filtering never changes order.

## Bounds and extension retention

Bounds apply before accepting writes and identically on reload, measured as UTF-8
bytes for text and serialized UTF-8 bytes for the file, including unknown fields.

| Boundary | Maximum |
| --- | --- |
| Complete references document | 1 MiB (same reload envelope as authoring metadata; below the 16 MiB transaction mutation cap) |
| Combined card/lore records | 512 |
| Revisions per record | 3 |
| Title, category, subject, alias, tag | 160 bytes (existing supporting-authoring label bound) |
| Each prose field, review/provenance/citation/knowledge/relationship note | 10,000 bytes (existing authored string/Scene text bound) |
| Tags or aliases | 32 each |
| Links, linked lore, relationships, citations or knowledge annotations | 64 each |
| Scene scope or finite route visits | 256 |
| JSON nesting | 32 levels, including extensions |

Array item bounds do not override the file bound; escaping may enlarge serialized
data. Reject overflow without truncating prose or partially writing. Exhausted revision
counter refuses replacement. Duplicate IDs, duplicate JSON keys, invalid known types,
invalid pointers and invalid status relationships refuse the document.

Unknown object members are retained at document, record, revision, content and nested
object levels, subject to the same file/depth bounds. Supported edits merge only known
edited fields into the prior object; unknown fields are never round-tripped through a
renderer-owned whole-document replacement. New content revisions inherit their prior
extension data. Accepted saves may change JSON formatting/key order; prose and unknown
JSON values survive exactly in meaning. Refused writes preserve original file bytes.

These are storage safety limits, not selected-context allowances. Context assembly
and its independent byte/token budgets are excluded from this outcome.

## Fixtures and required proof

Public synthetic fixtures live in `app/tests/fixtures/reference-library/`.
`empty.json` is a valid empty v1 document; `replacement.json` demonstrates an approved
card plus proposed replacement, linked lore, repeated route visits, missing entities,
an unresolved citation and nested unknown data. `manual-save.json` shows the same
card after an ordinary manual Save: current r2 approved internally, r1 superseded,
exact prior text and reciprocal links retained. `newer.json` and `malformed.json`
are deliberately refused and must remain byte-for-byte intact.

Before packaging, core/service fixtures must prove create/edit/save/reorder,
exact undo/redo/reopen, unknown-field inheritance, missing/stale citations/links,
boundary and boundary-plus-one input (including escaped Unicode), malformed/newer
retention, external file edits, recovery refusal and session/project switching.
UI/controller-to-production-dispatch evidence must begin with one real card save
and file readback, before expanding form coverage. Missing or wrong expected
results must fail the evidence gate; browser mocks cannot establish native acceptance.

Native representative forms on Mac ARM64 and Windows x64 must demonstrate manual
creation/update/Save, Discard changes, refused submission, Undo/Redo, close/reopen with
exact IDs/statuses and keyboard/focus, compact layout and both themes. Reuse unchanged
request/credential evidence. Builds/launches and failures belong to the owning ledger.

Reference prose stays out of routine diagnostics, logs and game distributions.
No `.rpy` mutation, HTTP, generation, import/export, injection/retrieval or runtime
inference is introduced. Existing distribution exclusion requires focused verification.
