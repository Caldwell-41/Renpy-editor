# Agent Guide

## Mission and current scope

Project Loomlight is a Windows/macOS visual Ren'Py authoring tool. Phase 0 is
complete and ADR 0003 selects Tauri 2. Phase 1 remains blocked until explicit
approval; its active brief is planning authority, not permission to implement.

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

Phase 0 has no application dependencies or build command yet.

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

Use [docs/INDEX.md](docs/INDEX.md) as the router. Material decisions require an
ADR. Keep `AGENTS.md`, the index, and current status concise; link rather than copy.

## Handoff

Each completed task updates its brief and `docs/status/CURRENT.md`, archives the
brief when complete, and reports: outcome, changed areas, ADRs, exact validation
results, limitations/risks, and the next bounded task.
