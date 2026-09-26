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
| Project → filesystem | `../`, absolute paths, parent/target/recovery substitution, symlink/reparse swaps, case collisions | Canonicalize and retain approved-root/component/recovery handle chains; use no-follow descriptor-relative I/O and anchored recovery enumeration on macOS; pin Windows directory handles without delete sharing; keep artifacts in anchored recovery; fail closed on identity/path change |
| Archive → SDK root | Zip-slip, symlink/hardlink escape, overwrite, decompression bomb | Validate every entry/type/size/path before extraction; stage privately; atomic promote; no overwrite |
| Core → child process | Script/filename becomes shell syntax or environment leak | Direct executable plus argument array, minimal environment, bounded output/time, no shell strings |
| Project → Ren'Py runtime | Embedded Python executes with user privileges | Inspection never runs; explicit trust/run boundary; redacted preview; future sandbox research not implied protection |
| Watcher/external writer → transaction | TOCTOU or external edit lost during save | Debounced anchored reads and content revisions, plus the reviewed platform transaction/recovery protocol; preserve base/draft/external bytes; expose Apply Both only for exact non-overlap; revalidate root/path/file/recovery identity at the latest safe point; never claim portable CAS from check-then-replace alone |
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

### Production renderer and Phase 1C lifecycle surface

The production scaffold exposes one AppManifest command, `core_request`, through one
local capability scoped to the `main` window. The Rust core checks an exact versioned
envelope, per-operation payload keys and types, request ID syntax, and a closed harmless
operation list. Errors use stable codes and fixed public messages; synthetic sensitive
input is never reflected. The application creates its main webview with explicit
local-only navigation and new-window denial handlers in addition to a restrictive CSP.

Phase 1C adds only typed lifecycle operations behind the same command and main-window
guard. Native pickers mediate parent, SDK, and project selection; renderer follow-ups
use opaque IDs. The core retains approved parent directory identity, rejects unsafe
names/symlinks/reparse changes and existing destinations, stages privately, and uses a
platform no-replace promotion. SDK networking is limited to the explicit supported
8.5.3 install operation and pinned official URL/checksum. Subprocesses are exact
allowlisted argument arrays with bounded output/time, process-tree cancellation, and an
explicit minimal environment. Git additionally clears ambient `GIT_*` redirects and
configuration and uses a private empty template. Approved SDK records are revalidated
against filesystem identity and launcher/template fingerprints; app-managed reuse also
requires checksum-derived provenance. The private project stage retains filesystem
identity through finalisation. Stage creation is anchored to the approved parent;
Unix/macOS child processes enter the retained stage descriptor and Windows pins the
stage namespace through process creation. A final-promotion pathname substitution is
not claimed impossible on every supported filesystem: post-promotion identity/marker
verification rejects and quarantines a replacement, so it never becomes the final
project and neither the approved stage nor replacement is silently deleted. Git authority
is only direct `git init` in the owned stage. No general Tauri filesystem,
shell, HTTP, opener, or process plugin is granted. The
packaged target probe exercises main-window success, unauthorised-window rejection,
unknown command rejection, malformed payload rejection, ambient plugin denial, Node
global absence, direct network denial, popup denial, external navigation denial, and
renderer-secret absence.

The desktop host registers Tauri's maintained single-instance plugin before `setup`
and before `LifecycleService` construction. A secondary process is rejected at that
boundary and cannot become another Recent Projects or project-lifecycle writer. The
plugin has no JavaScript API and grants no WebView permission; its callback only makes
best-effort native restore/show/focus requests for the existing `main` window.

Phase 1D adds one native picker for a reviewed raster/audio allowlist. Core retains
the selected regular-file handle, identity, size, and SHA-256 and revalidates them
before import. A pathname swap cannot redirect the copy because streaming reads that
handle; a same-inode content change fails count/hash verification. Renderer state gets
an opaque UUID and safe display metadata, never the absolute path or bytes. Trusted
core generates the destination and uses expected-absence journal commit. No Tauri
filesystem, shell/process, HTTP, opener, or media-execution capability is added.

Phase 1F adds only current-session Source operations using normalized project-relative
existing `.rpy` paths discovered under the anchored `game/` root. Renderer input cannot
name a host root, create/move/delete raw source, or edit `.rpyc`. Invalid UTF-8 stays
byte-exact and read-only; editable files are capped at 16 MiB, with at most 64 dirty
buffers and 64 MiB of drafts. Observation compares verified revisions and never runs
Ren'Py or project Python. Stale sessions, unsafe mappings, external divergence, and
transaction recovery fail closed without widening the Tauri capability or CSP.

Application-local Recent Projects and the managed SDK root also retain directory
authority and use no-follow file operations. Recent writes stage, platform-flush,
atomically replace, directory-flush where supported, and verify. Managed SDK promotion
exposes provenance and payload together only after recursive staged-tree durability;
legacy/incomplete states are rejected or moved aside without recursive recovery-time
deletion. Managed discovery checks the non-executing identity and launcher/template
fingerprints against checksum-derived provenance before the first version-probe spawn,
then rechecks identity after the probe. A selected browsed SDK remains an explicit user-approved executable trust
boundary and is fingerprint-revalidated around each bounded operation.

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
- **Complete — Phase 1B corrective implementation:** Transactions retain
  approved root/component handles and validate parent/target identity, exact bytes,
  and SHA-256. Transaction evidence exists only under anchored recovery. macOS uses
  no-follow descriptor-relative creation/inspection/rename/exchange and recovery
  discovery validates the live pathname identity before descriptor enumeration;
  replacement of the recovery pathname therefore fails closed instead of hiding
  unresolved journals. Windows pins directory components against rename/delete while
  `ReplaceFileW` and recovery enumeration use the pinned namespace. Prepared safe-
  abandon requires proved absence; terminal rejected journals do not block flush.
  Windows directory-entry power-loss durability is still not claimed. Production run
  34804861387 passed the latest hostile-boundary suite on actual Windows x64 and macOS
  ARM64, re-closing Gate E after the recovery-enumeration follow-up. See
  [TRANSACTIONS.md](TRANSACTIONS.md).
- **Complete in the corrective implementation; final target gate pending:** Native
  import selection opens a retained no-follow/reparse-safe file handle before
  inspecting content. All size, identity, hash, and copied bytes derive from that
  handle; retained parent/path identity and the final streamed count/hash are checked
  again before acceptance. Path, ancestor, symlink/reparse, and same-file content races
  fail closed without renderer path or byte authority.
- **Complete:** Native credential prototypes do not create a renderer or leak into
  logs, source, projects, packages, or retained evidence inputs.
- **Complete:** This threat model reflects the selected Tauri capability boundary and
  locked dependency evidence. Release signing and physical OS reputation UX remain
  later gates.


### Runtime diagnostics and packaged verification

Diagnostic output never grants path authority. The core resolves only a retained
operation's diagnostic ordinal, checks the original file identity/content against a
contained transaction snapshot, and limits navigation to the existing approved game
`.rpy` Source surface. Runtime text is inert and bounded; absolute paths, traversal,
unproven locations and other file types have no navigation action.

The native packaged Runtime UI probe is opt-in through an explicit launch environment,
uses a fresh synthetic temporary project and verified official SDK archive, and grants
no fixture-writing renderer operation. Its test report handler is available only in
that mode and the main window; production requests retain their deny-by-default
capabilities. Synthetic DOM input proves the packaged UI/IPC path, not OS key delivery.

Native main-window close and application quit route into the same Runtime Stop/Cancel
and existing Source draft leave flow as Close Project. The narrow desktop-only
`complete_application_close` command accepts no payload, rejects other windows and
requires the core service to have no open project plus confirmed process cleanup before
exiting. It grants no filesystem/process-launch privilege. Explicit scaffold-smoke exits
retain their existing independent harness behavior. OS termination still uses shutdown.
