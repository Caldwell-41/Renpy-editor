# Security and privacy baseline

## Security posture

Project Loomlight is local-first, single-user software with no telemetry by default.
It handles private/adult creative work, credentials, arbitrary project files, network
downloads, Git repositories, and child processes. Adult-content support does not
change any security boundary.

Parsing is not sandboxing. A Ren'Py project may contain Python; opening for inspection
must not execute it, while compile/lint/run may execute or import project-controlled
code depending on Ren'Py behavior. Those operations require an explicit trust action
and clear UI state. Ren'Py's own
[security guidance](https://www.renpy.org/doc/html/security.html) warns that safe mode
does not stop Python from changing files, so it is not an application sandbox.

## Protected assets

- Game scripts, images, audio, lore, drafts, summaries, and route/state history.
- Provider/API and GitHub credentials; OS signing identities and update keys.
- User filesystem outside selected project and configured SDK/storage roots.
- Integrity of authoritative `.rpy` source, Git history, SDKs, updates, and builds.
- User intent: whether content leaves the device or arbitrary project code executes.

## Trust boundaries and threats

| Boundary/threat | Example | Required mitigation |
| --- | --- | --- |
| UI → privileged core | Injected/untrusted content invokes filesystem or shell | Typed allowlisted commands, schema validation, deny-by-default capabilities, sender/origin checks, CSP |
| Project → filesystem | `../`, absolute paths, symlink swaps, case collisions | Canonicalize, enforce allowed roots, refuse unsafe symlinks/reparse points, open safely, recheck before commit |
| Archive → SDK root | Zip-slip, symlink/hardlink escape, overwrite, decompression bomb | Validate every entry/type/size/path before extraction; stage privately; atomic promote; no overwrite |
| Core → child process | Script/filename becomes shell syntax or environment leak | Direct executable plus argument array, minimal environment, bounded output/time, no shell strings |
| Project → Ren'Py runtime | Embedded Python executes with user privileges | Inspection never runs; explicit trust/run boundary; redacted preview; future sandbox research not implied protection |
| Watcher → transaction | TOCTOU or external edit lost during save | Base hashes, same-directory temp write, flush/replace, recheck, conflict UI, recovery journal |
| Network → SDK/update | Tampered binary or downgrade | Official HTTPS origin allowlist, published checksum, version pin, staged verification, explicit upgrade |
| LLM provider | Private/adult content exfiltration or malicious structured output | User-initiated send, locality disclosure/warning, minimal context, TLS, schema/path/identifier validation, reviewed diff |
| Git/GitHub | Credential leak, destructive restore/push | OS credential flow, no token logs, safe defaults, recoverable restore, no force push, private repo default |
| Logs/diagnostics | Paths, prompts, tokens, private content in support bundle | Structured redaction, bounded excerpts, preview bundle contents, explicit export consent |
| Dependencies/build | Compromised package/action or licence conflict | Lock/pin, Dependabot review, provenance/SBOM plan, licence inventory, minimal dependencies, secret scan |

## Desktop-shell baseline

If Electron is selected: keep `nodeIntegration` disabled, context isolation and
sandboxing enabled, expose a narrow preload API, validate IPC senders, deny unexpected
navigation/windows, avoid `file://` for privileged content, and set a restrictive CSP.
These align with Electron's official
[security checklist](https://www.electronjs.org/docs/latest/tutorial/security).

If Tauri is selected: explicitly enable only named capabilities; scope commands,
filesystem, shell/process, and HTTP access by window and path. Capability files that
are auto-discovered must not accidentally widen authority. See Tauri's official
[capability model](https://v2.tauri.app/security/capabilities/).

In either stack, project media and generated HTML/text are untrusted data, never UI
code. Remote content does not share a privileged renderer/webview.

## Credential and network rules

- Store secrets in Keychain on macOS and Credential Manager/DPAPI-backed storage on
  Windows through a reviewed adapter; project metadata stores only opaque references.
- Do not put secrets in `.env`, command arguments, URLs, logs, crash reports, Git
  remotes, or renderer state. `.env.example` contains placeholders only.
- No request sends project content until the user initiates it. Before remote LLM
  transmission, show destination class, selected context, and sensitive-content risk.
- Model discovery may contact only the configured provider endpoint. SDK downloads
  use official Ren'Py links and published checksums; redirects must remain approved.
- No telemetry. A future opt-in design requires a separate threat/privacy review.

## Repository controls

- `.gitignore` excludes local configuration, secrets, logs, SDKs, generated Ren'Py
  caches, signing material, dependencies, and build artifacts.
- `.gitattributes` normalizes text and marks common media/archive formats binary.
- CI uses read-only repository permission and a full pinned checkout-action SHA.
- `scripts/validate.py` rejects common secret formats, personal email domains, and
  absolute user-home paths. This is defense in depth, not a substitute for GitHub
  secret scanning or review.
- Pre-commit can run the same local validator. Dependency licences and redistribution
  terms must be reviewed before choosing or shipping a stack/SDK.

## Release and incident baseline

Private GitHub Releases may publish unsigned early Windows/macOS packages after CI
verification. Signing/notarisation and a secured update channel are required before
broader distribution. Never embed signing keys in CI variables available to untrusted
pull requests.

If a secret enters history: stop, revoke/rotate first, assess exposure, then coordinate
history remediation rather than silently rewriting. If source loss/corruption is
suspected: stop writes, preserve recovery data and Git state, and produce a redacted
diagnostic record.

## Security gates before Phase 1

- Stack spike demonstrates narrow IPC/capabilities, CSP, path scopes, and safe child
  process arguments on both target operating systems.
- SDK spike rejects traversal, symlink, collision, checksum, partial-download, and
  overwrite cases.
- Source transactions pass external-conflict, atomicity, recovery, and path tests.
- Credential-store prototype confirms secrets do not enter renderer state/logs.
- Threat model is revised against selected framework and dependencies.
