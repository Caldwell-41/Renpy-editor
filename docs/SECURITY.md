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
| Watcher/external writer → transaction | TOCTOU or external edit lost during save | Base revisions plus a reviewed platform transaction/recovery protocol; revalidate approved root/path/file identity at the latest safe point; preserve competing data/recovery state; explicit conflict UI; never claim portable CAS from check-then-replace alone |
| Network → SDK/update | Tampered binary or downgrade | Official HTTPS origin allowlist, published checksum, version pin, staged verification, explicit upgrade |
| LLM provider | Private/adult content exfiltration or malicious structured output | User-initiated send, locality disclosure/warning, minimal context, TLS, schema/path/identifier validation, reviewed diff |
| Git/GitHub | Credential leak, destructive restore/push | OS credential flow, no token logs, safe defaults, recoverable restore, no force push, private repo default |
| Logs/diagnostics | Paths, prompts, tokens, private content in support bundle | Structured redaction, bounded excerpts, preview bundle contents, explicit export consent |
| Dependencies/build | Compromised package/action or licence conflict | Lock/pin, Dependabot review, provenance/SBOM plan, licence inventory, minimal dependencies, secret scan |

## Desktop-shell baseline

ADR 0003 selects Tauri 2. Explicitly enable only named capabilities; scope application
commands by window and validate every payload in the Rust core. Do not grant general
filesystem, shell/process, or HTTP plugin access to the webview. Capability files that
are auto-discovered must not accidentally widen authority. See Tauri's official
[capability model](https://v2.tauri.app/security/capabilities/).

The privileged core, not a renderer request, owns the approved-project registry. A
trusted project-picker/backend action canonicalizes the selected root, records its
identity, and returns an opaque project ID. Later requests contain only that ID and a
normalized relative path. Unknown IDs, renderer-supplied roots, traversal, changed
root identity, and symlink escapes are denied. Approval/registration is not exposed as
an unrestricted application command.

Application commands must be declared in Tauri's build `AppManifest`, included by a
named application permission, and granted only to the local `main` window capability.
`core:default` alone is not authorization for a custom command. Packaged probes must
show a valid privileged command succeeds from `main` and is denied from an otherwise
local unauthorised webview; direct Rust helper tests are not a substitute.

Project media and generated HTML/text are untrusted data, never UI code. Remote
content does not share a privileged webview. WebView2 and WKWebView denial tests remain
separate target gates. If Electron is reconsidered through a superseding ADR, its
`nodeIntegration`-off, context-isolated, sandboxed preload and sender/navigation/CSP
baseline remains documented in the Phase 0 evidence.

### Phase 1A implemented surface

The production scaffold exposes one AppManifest command, `core_request`, through one
local capability scoped to the `main` window. The Rust core checks an exact versioned
envelope, per-operation payload keys and types, request ID syntax, and a closed harmless
operation list. Errors use stable codes and fixed public messages; synthetic sensitive
input is never reflected. The application creates its main webview with explicit
local-only navigation and new-window denial handlers in addition to a restrictive CSP.

There are no production filesystem, shell/process, HTTP, opener, credential, SDK, Git,
or project plugins/adapters in Phase 1A. The similarly named future ports are empty
interfaces with no methods, handles, paths, roots, URLs, or implementations. The
packaged target probe exercises main-window success, unauthorised-window rejection,
unknown command rejection, malformed payload rejection, ambient plugin denial, Node
global absence, direct network denial, popup denial, external navigation denial, and
renderer-secret absence.

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

## Corrective security gates before Phase 1

- **Complete for the bounded spike:** Corrective desktop run
  [34743055306](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055306)
  proves core-owned project approval, explicit Tauri application-command permission,
  authorised/unauthorised webviews, CSP/path scopes, and safe child-process arguments
  on Windows x64 and macOS ARM64.
- **Complete:** The SDK installer rejects traversal, symlink, collision, checksum,
  partial-download, limits, and unsafe overwrite/promotion cases.
- **Bounded spike evidence, production writer blocked:** Internal transactions are
  serialized; expected hash, file/path identity, and approval are rechecked after the
  durable temporary write; known conflicts retain recovery data. Atomic replacement
  prevents a truncated hybrid. A non-cooperating writer can still change the target
  in the final check-to-replace window, and Windows directory-entry durability is not
  proven. Phase 1 may scaffold the port, but production writing cannot pass Gate E
  until the platform transaction/recovery design closes these limits.
- **Complete:** Native credential prototypes do not create a renderer or leak into
  logs, source, projects, packages, or retained evidence inputs.
- **Complete:** This threat model reflects the selected Tauri capability boundary and
  locked dependency evidence. Release signing and physical OS reputation UX remain
  later gates.
