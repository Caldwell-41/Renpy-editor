# Product specification

## Product

Project Loomlight is a single-user desktop authoring environment for 64-bit Windows
on x86-64 and macOS on Apple Silicon. Intel macOS is out of scope. It should feel like
a narrative-design tool first and an IDE second while producing ordinary, modular
Ren'Py projects that remain usable in other editors.

The initial application interface and support scope are English. Localised UI and
non-English physical-input acceptance are outside this selected Phase 1 scope.
The source-authority and lossless preservation rules still apply to existing files.

For Loomlight-created projects the authoring hierarchy is:

`project → chapter → scene → narrative beat → Ren'Py statement`

Branching connects scenes through explicit choice/jump/call edges; chapters are
organisational containers rather than Ren'Py runtime semantics. The scene is the
primary authoring unit. `.rpy` files remain authoritative for runnable content;
`.renpy-editor/` holds documented, editor-only metadata such as stable IDs, mappings,
graph layout, approved lore, and state snapshots. A game must run and remain editable
when that metadata or this editor is absent.

## Primary user and jobs

The initial user is one visual-novel creator managing multiple games. They need to:

- create a conventional project against a discovered or securely installed SDK;
- save/persist it safely, close it, and load/reopen it without losing accepted work;
- author dialogue, staging, choices, state, media, screens, and custom code without
  routine manual scripting;
- move between visual, graph, timeline, and source views without losing intent;
- validate and run through the selected official SDK;
- reconcile external edits and preserve unsupported syntax visibly;
- optionally add local Git and private GitHub workflows in a separately selected future milestone;
- request local or remote LLM assistance as inspectable, reviewable proposals.

## Reliability and responsive observed views

The initial release prioritizes a hobby creator's work: reliable save/reopen,
undo/recovery, external-edit conflicts, preserved custom source and useful responsive
tools. Opening a project never executes its Python. Basic path/input/privacy and SDK
protections remain; resisting deliberate same-user filesystem attack races is outside
initial acceptance.

Branches shows the last observed saved project state, updated after accepted app
edits. It may lag external changes until open, focus or explicit Refresh. Show when
disk is being checked, when it was last checked and any conflict/refresh failure;
preserve the last usable view and drafts. Navigation and writes check their own
current target/preconditions. Do not require a full hostile filesystem proof for
every display update. The selected contract and measurable gates are in
[ADR 0010](adr/0010-local-project-safety-and-observed-flow.md); implementation is pending.

## Core workflows

### Initial authoring release

1. Select or install a checksum-verified SDK and pin it to a new project.
2. Set project resolution (default `1920×1080`) and generate modular conventional
   source that remains runnable without `.renpy-editor/`.
3. Save/persist, close, list, and reopen projects while protecting accepted edits from
   crashes and external file changes.
4. Define characters and variables; import project-owned assets with duplicate/missing
   checks.
5. Build scenes from ordered beats, choices, conditions, calls, jumps, and endings.
6. Inspect branching, UI screens, and animation/audio timing at appropriate scale.
7. Edit synchronized source; represent unsupported constructs as custom-code blocks.
8. Validate and preview/run from an inspectable state.

### Phase 1 subset and optional Git

Phase 1 ends with the authoring/source/Branches/validation/play/reopen workflow.
New local Git status/diff/checkpoint work is deferred to an
[optional milestone](tasks/active/optional-local-git.md), selected separately at a later
date. The user reaffirmed on 2026-10-02 that local Git/GitHub remain deferred: they
are not required for Phase 1, Phase 2, Phase 3 or initial-release acceptance. Existing
optional Git initialization during project creation remains. No Git panel, checkpoint
or remote workflow is restored through release preparation.

### LLM-assisted authoring

The user explicitly invokes an action: generate/continue a scene, rewrite selected
dialogue, or draft a character or lore fact. Before transmission, the editor shows
provider locality and selected context. Output is untrusted structured data shown as
semantic and file diffs with accept, reject, and partial-accept controls. Lore stays
proposed until approved.

Phase 2 includes persistent Character cards (personality, voice, background and
relationships) and a lorebook (world/reference entries), both manually editable and
LLM-generatable through reviewed proposals. Authors choose the approved references
used for generation. Character cards are separate from runnable Character definitions.
System prompts are viewable/editable with a Restore baseline setting; context budget
and maximum response tokens are explicit controls with an inspectable usage estimate.
The bounded Studio actions, references, prompts and limits are implemented and
qualified within their recorded scopes. Full Phase 2 scope disposition, the final
coherent integrated workflow and explicit human acceptance remain incomplete; the
[closeout map](tasks/active/phase-2-initial-llm-assistance.md#studio-only-closeout-entry-audit-and-requirement-map--2026-10-12)
distinguishes implemented behavior from retained requirements.

Studio Settings now has local Temperature and Top-p controls with editable defaults
1.0/0.95; final packaged/live qualification is pending. The saved credential is reused
across sessions; session-only credential mode is excluded by the user's 2026-10-12
decision. Changes to sampling appear in the exact send review and require renewed
review before transmission.

Settings also has an explicit **Test setup** action. It sends a visible tiny synthetic
JSON request using the saved configuration, checks the response strictly, and records
readiness for that configuration. Project opening sends nothing. Relevant settings,
key or discovered availability changes clear readiness and require another test.
It proves the observed response, not model quality, loaded capacity or internal server
tool behavior. Verified HTTPS/hostnames are locally implemented with certificate and
address checks; native/Windows/live qualification remains pending. Literal IPv6 HTTPS
is refused with a useful message because of the pinned adapter's certificate-name limit.

Selected-route context and AI changes to Scene endings/connections are deferred beyond
Phase 2. Continue preserves its ending; Draft creates an unconnected Scene with Return.

## Required authoring capabilities

- Scene sequencing and live scene preview/staging.
- Scene/label/choice-level branching graph with scalable detail and diagnostics.
- Hybrid canvas/hierarchy screen designer that emits maintainable screen language.
- VN-focused animation/audio timeline that emits valid Ren'Py constructs. Phase 3
  includes character drag/resize with verified runtime placement, playback of qualified
  native pre-rendered animations and nonblocking character idles during dialogue.
  Video/animation imports use pinned-Ren'Py-supported profiles only; conversion is deferred.
- Source editor with bidirectional navigation and lossless unsupported regions.
- Branch-aware characters, variables, lore, state simulation, and run-from-here.
- First-class Unsloth Studio support without hardcoded model names. Studio has dedicated setup, diagnostics and acceptance tests; generic/OpenAI-compatible adapters are deferred outside Phase 2. See the [Phase 2 plan](tasks/active/phase-2-initial-llm-assistance.md).

## Constraints and principles

- Routine authoring should not require code, but code remains visible and editable.
- External edits must never be silently overwritten or discarded.
- Automatic persistence and explicit save/flush use the same transactional source
  boundary; Loomlight must not maintain a long-lived competing runnable document.
- The official selected Ren'Py SDK is the compile/lint/runtime authority.
- Running a project is a deliberate trust action because embedded Python executes.
- Adult content is supported without an application-level moral filter; content
  support never relaxes process, credential, filesystem, or network security.
- No telemetry by default. Any future telemetry requires explicit consent.

## Deferred, not forgotten

Local Git status/diff/checkpoints and GitHub authentication/remotes remain optional
later work, selected separately. Their absence does not block the initial release.

AI proposals to change existing Scene endings or story connections are deferred beyond
Phase 2 by the user's 2026-10-12 decision, while remaining possible future work. Current
Continue retains the ending and Draft creates an unconnected Scene with Return.
Ordinary manual Scene/connection authoring remains available within its existing scope.

After the initial editor release, the high-priority optional open-world capability
adds maps, points of interest, travel, day/time, schedules, reachable-state previews,
and location-aware LLM context on top of the general graph/state model.

## Non-goals for the initial release

- General import and full visualisation of arbitrary existing Ren'Py projects.
- Real-time collaboration or multi-user project locking.
- A full non-linear video editor or unrestricted pixel-position drawing canvas.
- Video/animation conversion, GIF import/conversion, transcoding or mask generation.
  Native media playback and source-backed character staging remain in Phase 3 scope.
- Silent LLM application, automatic canonical lore, or full-script context by
  default.
- Bundling an SDK before licence and redistribution review.
- Code signing/notarisation as a prerequisite for early private builds.

## Initial-release acceptance summary

The release is complete only when the user can create multiple projects, save and
reopen them safely, visually author all five major workspaces, preserve and inspect
source/custom code, validate and run via a pinned SDK, use reviewable LLM proposals,
and recover from crashes/external conflicts without silent data loss. Measurable phase
criteria are in [ROADMAP.md](ROADMAP.md).
