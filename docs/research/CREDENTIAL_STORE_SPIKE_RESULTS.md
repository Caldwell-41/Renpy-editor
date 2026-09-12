# Native credential-store spike results

**Status:** In progress<br>
**Targets:** Windows x86-64 Credential Manager/DPAPI and macOS ARM64 Keychain

## Question

Can packaged Electron and Tauri research candidates round-trip and remove a synthetic
credential through reviewed OS-native protection without exposing plaintext to a
renderer, logs, project files, packaged artifacts, retained evidence, or tracked
source?

## Success criteria

- The Electron packaged main process uses its asynchronous `safeStorage` API only
  after application readiness. On macOS its encryption key is Keychain-backed; on
  Windows it is DPAPI-backed. Only encrypted bytes may touch a disposable temporary
  directory, and that directory must be removed before exit.
- The packaged Tauri core uses a pinned, feature-minimal native adapter: macOS
  Keychain and Windows Credential Manager. It must set, read, compare, and delete a
  unique synthetic entry, then confirm the entry is absent.
- The same runner-generated plaintext sentinel drives both probes but is never
  committed. A reusable scanner rejects it in captured process output, the synthetic
  project, Electron packages, Tauri bundle/executable outputs, retained evidence
  inputs, and tracked source.
- Neither candidate creates a renderer/WebView during this probe or registers a
  credential IPC/capability. Process output contains only typed booleans and a generic
  provider class; no secret, ciphertext, account identifier, user path, or native
  error detail is logged.
- Every failure exits non-zero. Cleanup is attempted on success and failure, and no
  synthetic credential or encrypted temporary file is intentionally retained.
- Windows x64 and macOS ARM64 results are recorded separately. An unavailable,
  locked, prompting, or unsigned-build-sensitive store is retained as evidence rather
  than inferred from the other target.

## Implementation boundary

This is disposable Phase 0 code under `spikes/desktop-shells/`, not a production
credential schema or provider settings UI. The prototype deliberately offers no
general key/value operation to the shared renderer contract. The Tauri side pins
`keyring` 3.6.3 with only `apple-native` and `windows-native` features; its upstream
documentation maps those features to Keychain and Windows Credential Store. Electron
44.3.0 documents asynchronous `safeStorage` as OS-provided cryptography, with Keychain
keys on macOS and DPAPI-protected keys on Windows.

Electron also documents an important limitation: unsigned or inconsistently signed
macOS builds may be treated as different applications and re-prompt for Keychain
access after updates. The unsigned hosted spike can establish the current runner
behavior, not production signing/persistence behavior.

## Results

Target evidence is pending.

## Known limitations

- Hosted runs cannot prove behavior after a real signed-app upgrade, a locked login
  keychain, enterprise credential policy, a different Windows logon session, or a
  human response to a native prompt.
- Electron `safeStorage` protects an application-managed ciphertext rather than
  storing the credential itself as a visible Credential Manager/Keychain item. Tauri's
  adapter stores the credential entry directly; this difference must remain explicit
  in the final comparison.
- Plaintext scanning is defense in depth. It does not prove a secret was never copied
  in process memory, swap, crash capture, or OS internals.
