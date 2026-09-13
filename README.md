# Project Loomlight

Loomlight is a local-first visual Ren'Py authoring tool for Windows x86-64 and macOS
Apple Silicon. Phase 0 is complete and the bounded Phase 1A production scaffold lives
in [`app/`](app/README.md). No authoring workflow is implemented yet.

Project Loomlight is the temporary codename for a standalone, single-user,
WYSIWYG Ren'Py authoring environment for Windows and macOS.

Phase 0 is complete and Tauri 2 is the accepted desktop runtime. Phase 1A is the only
approved implementation milestone. Start with [the documentation index](docs/INDEX.md)
and [the current status](docs/status/CURRENT.md).

The repository validator is:

```bash
python3 scripts/validate.py
```

Ren'Py is a separate project. This repository does not currently bundle or
redistribute the Ren'Py SDK.
