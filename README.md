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

## Licence

Project Loomlight / Renpy-editor is **source-available**, not OSI-approved open-source
software. It is licensed under the Apache License, Version 2.0, subject to the
**"Commons Clause" License Condition v1.0** in [`LICENSE`](LICENSE).

In practical terms, the licence permits use, modification, forking, and redistribution
subject to its terms and attribution requirements, but it does **not** grant the right
to Sell the Software as "Sell" is defined by the Commons Clause. That restriction
covers products or services offered for consideration whose value derives entirely or
substantially from the Software's functionality. The licence text, rather than this
summary, controls.

Redistributions and derivative works must preserve the applicable copyright and
attribution notices. [`NOTICE`](NOTICE) identifies Caldwell-41 as the original project
author/copyright holder for the current repository and must be retained in the forms
required by the licence.

Commercial licences may be granted separately by Caldwell-41. The copyright holder
remains free to distribute and sell official or separately licensed versions of the
project.

Contributions are subject to the additional inbound licence grant described in
[`CONTRIBUTING.md`](CONTRIBUTING.md), which preserves the project's ability to offer
separately licensed commercial versions while contributors retain ownership of their
own contributions.
