# Product specification

## Product

Project Loomlight is a single-user desktop authoring environment for Windows and
macOS. It should feel like a narrative-design tool first and an IDE second while
producing ordinary, modular Ren'Py projects that remain usable in other editors.

The content hierarchy is:

`project → route/chapter → scene → narrative beat → Ren'Py statement`

The scene is the primary authoring unit. `.rpy` files remain authoritative for
runnable content; `.renpy-editor/` holds documented, editor-only metadata such as
stable IDs, graph layout, approved lore, and state snapshots. A game must run and
remain editable when that metadata or this editor is absent.

## Primary user and jobs

The initial user is one visual-novel creator managing multiple games. They need to:

- create a conventional project against a discovered or securely installed SDK;
- author dialogue, staging, choices, state, media, screens, and custom code without
  routine manual scripting;
- move between visual, graph, timeline, and source views without losing intent;
- validate and run through the selected official SDK;
- reconcile external edits and preserve unsupported syntax visibly;
- use Git locally and with private GitHub repositories;
- request local or remote LLM assistance as inspectable, reviewable proposals.

## Core workflows

### Initial authoring release

1. Select or install a checksum-verified SDK and pin it to a new project.
2. Set project resolution (default `1920×1080`) and generate modular source.
3. Define characters and variables; import assets with duplicate/missing checks.
4. Build scenes from ordered beats, choices, conditions, calls, jumps, and endings.
5. Inspect branching, UI screens, and animation/audio timing at appropriate scale.
6. Edit synchronized source; represent unsupported constructs as custom-code blocks.
7. Validate, preview, run from an inspectable state, and create a Git checkpoint.

### LLM-assisted authoring

The user explicitly invokes an action: generate/continue a scene, rewrite selected
dialogue, or draft a character or lore fact. Before transmission, the editor shows
provider locality and selected context. Output is untrusted structured data shown as
semantic and file diffs with accept, reject, and partial-accept controls. Lore stays
proposed until approved.

## Required authoring capabilities

- Scene sequencing and live scene preview/staging.
- Scene/label/choice-level branching graph with scalable detail and diagnostics.
- Hybrid canvas/hierarchy screen designer that emits maintainable screen language.
- VN-focused animation/audio timeline that emits valid Ren'Py constructs.
- Source editor with bidirectional navigation and lossless unsupported regions.
- Branch-aware characters, variables, lore, state simulation, and run-from-here.
- Ollama and configurable OpenAI-compatible adapters without hardcoded model names.
- Local Git workflows and secure supported GitHub authentication.

## Constraints and principles

- Routine authoring should not require code, but code remains visible and editable.
- External edits must never be silently overwritten or discarded.
- The official selected Ren'Py SDK is the compile/lint/runtime authority.
- Running a project is a deliberate trust action because embedded Python executes.
- Adult content is supported without an application-level moral filter; content
  support never relaxes process, credential, filesystem, or network security.
- No telemetry by default. Any future telemetry requires explicit consent.

## Deferred, not forgotten

After the initial editor release, the high-priority optional open-world capability
adds maps, points of interest, travel, day/time, schedules, reachable-state previews,
and location-aware LLM context on top of the general graph/state model.

## Non-goals for the initial release

- General import and full visualisation of arbitrary existing Ren'Py projects.
- Real-time collaboration or multi-user project locking.
- A full non-linear video editor or unrestricted pixel-position drawing canvas.
- Silent LLM application, automatic canonical lore, or full-script context by
  default.
- Bundling an SDK before licence and redistribution review.
- Code signing/notarisation as a prerequisite for early private builds.

## Initial-release acceptance summary

The release is complete only when the user can create multiple projects, visually
author all five major workspaces, preserve and inspect source/custom code, validate
and run via a pinned SDK, use reviewable LLM proposals, checkpoint with Git, and
recover from crashes/external conflicts without silent data loss. Measurable phase
criteria are in [ROADMAP.md](ROADMAP.md).
