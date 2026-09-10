# Project Loomlight

Project Loomlight is the temporary codename for a standalone, single-user,
WYSIWYG Ren'Py authoring environment for Windows and macOS.

The repository is in Phase 0: architecture, security, user-experience, and
high-risk integration assumptions are being validated before an application
stack is selected. Start with [the documentation index](docs/INDEX.md) and
[the current status](docs/status/CURRENT.md).

No production application exists yet. The only executable repository command
is the dependency-free Phase 0 validator:

```bash
python3 scripts/validate.py
```

Ren'Py is a separate project. This repository does not currently bundle or
redistribute the Ren'Py SDK.
