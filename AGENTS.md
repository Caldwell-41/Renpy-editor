# Agent Guide

## Mission and current scope

Project Loomlight is a Windows/macOS visual Ren'Py authoring tool. Phase 0 is complete,
ADR 0003 selects Tauri 2, and the bounded Phase 1A production scaffold is in progress.
Do not begin Phase 1B or authoring work until the Phase 1A gate is closed and the user
provides a new explicit instruction.

## Invariants

- `.rpy` source is authoritative for runnable game content.
- Preserve comments, formatting, custom syntax, embedded Python, and unsupported
  regions; patch the smallest safe source range. Never rewrite scripts with regex.
- All editing surfaces and LLM proposals use one transactional change layer.
- Treat projects and LLM output as untrusted. Parsing does not make a project safe
  to run; running Ren'Py code can execute Python.
- Use official Ren'Py SDK downloads, verify published checksums, pin per project,
  and isolate version-specific CLI behavior behind an adapter.
- Do not send project content to an LLM until the user initiates an operation.
- Do not add application-level content filtering.
- Do not commit secrets, personal data, real private game content, absolute user
  paths, logs, downloaded SDKs, build output, or credentials.

## Before editing

1. Read `docs/status/CURRENT.md`, the relevant active task, and linked ADRs.
2. Read the closest nested `AGENTS.md` if one exists.
3. Inspect status and history; preserve unrelated and uncommitted work.
4. Search before reading broadly. Update canonical docs with behavioral changes.

## Commands

Production scaffold commands run from `app/`:

```bash
npm ci --ignore-scripts
npm run check
npm run build
cargo fmt --check --all
cargo test -p loomlight-core --locked
cargo test -p loomlight-desktop --locked  # supported desktop build environment
npm exec tauri build -- --locked
```

Retain the Phase 0 regression commands:

```bash
python3 scripts/validate.py  # structure, links, privacy, secret patterns
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check            # whitespace and conflict-marker sanity
```

Stack-spike commands must remain isolated and are defined in their task brief.
Do not present a spike as the production application.

## Security and Git

- Use argument arrays for subprocesses; never interpolate project content into a
  shell command.
- Apply canonical path, containment, symlink, and archive-entry checks before I/O.
- Keep renderer/webview privileges deny-by-default and expose typed, narrow IPC.
- Configure identity only in this repository using the account's noreply address.
- Never rewrite history, force-push, change repository visibility, or discard work.

## Canonical documentation

Use [docs/INDEX.md](docs/INDEX.md) as the router. Material decisions require an ADR.
Phase 1 scope/UX lives in the canonical product/architecture/data/UI/roadmap docs; the
ordered implementation milestones live in
`docs/tasks/active/phase-1-vertical-slice.md`. Keep `AGENTS.md`, the index, and current
status concise; link rather than copy where practical.

## Handoff

Each completed task updates its brief and `docs/status/CURRENT.md`, archives the brief
when complete, and reports: outcome, changed areas, ADRs, exact validation results,
limitations/risks, and the next bounded task.
