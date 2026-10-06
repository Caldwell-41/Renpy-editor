# Project Loomlight

Loomlight is a local-first visual Ren'Py authoring tool for Windows x86-64 and macOS
Apple Silicon. Phase 1 is accepted and integrated: create projects with a pinned SDK,
author Characters/Assets/Variables and branching Scenes, edit Source, inspect Branches,
validate/run and close/reopen through shared transactions and recovery.
The production application lives in [`app/`](app/README.md).

Project Loomlight is the temporary codename for this standalone, single-user authoring
environment. Tauri 2 is the accepted desktop runtime. Phase 2/3 remain planning only.
Start with [the documentation index](docs/INDEX.md) and
[the current status](docs/status/CURRENT.md). The proposed 0.1.0 preview is being prepared;
its public-distribution decision is recorded in the [release task](docs/tasks/active/release-0.1.0.md).

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
