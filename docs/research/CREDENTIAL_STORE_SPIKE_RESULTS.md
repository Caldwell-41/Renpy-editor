# Native credential-store spike results

**Status:** Complete automated packaged checkpoint; signed-upgrade and locked-store behavior remain physical-device limitations<br>
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

Initial run
[34722141300](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722141300)
passed Electron packaging and the preceding Electron probes on both targets, then
stopped at `cargo test --release --locked`: the hand-prepared lock omitted indirect
Apple target entries. No Tauri package or credential result was claimed. Diagnostic
run
[34722270752](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722270752)
resolved and printed the exact lock delta, then exposed a Rust closure error requiring
an explicit `Result<(), String>` annotation on both targets. Again, the workflow
stopped before credential operations.

The exact resolved dependency graph and type correction are committed, and the
temporary resolver step is removed. Final run
[34722411465](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722411465)
passed `cargo test --release --locked`, both packages, all preceding probes, both
credential candidates, and the plaintext scan on Windows x64 and macOS ARM64.
Repository quality run 34722411459 also passed.

| Target / candidate | Native mechanism | Availability / round trip | Cleanup | Renderer created |
| --- | --- | --- | --- | --- |
| Windows / Electron 44.3.0 | DPAPI-protected `safeStorage` key | Available; opaque ciphertext; pass | Temporary ciphertext removed | No |
| Windows / Tauri | Credential Manager entry via `keyring` 3.6.3 | Pass | Deleted; subsequent read returned no entry | No |
| macOS / Electron 44.3.0 | Keychain-backed `safeStorage` key | Available; opaque ciphertext; pass | Temporary ciphertext removed | No |
| macOS / Tauri | Keychain entry via `keyring` 3.6.3 | Pass | Deleted; subsequent read returned no entry | No |

Both Electron results reported `shouldReEncrypt: false`. The final runners used Rust
1.98.1/Cargo 1.98.1; Windows used Node 22.23.2/npm 10.9.8 and macOS used Node
24.20.0/npm 11.19.0. Those runner Node versions do not change the packaged Electron
44.3.0 runtime under test.

The runner generated the sentinel and account identifiers at runtime. The probe
wrapper enforced a 30-second timeout and 65,536-byte output cap, rejected the secret,
account, working directory, home directory, or runner-temp path in captured output,
then emitted only the validated JSON above. The follow-on streaming scan covered
tracked source, the synthetic project, both Electron packages, the Tauri executable
and bundles, and therefore the files supplied to retained artifacts. It found zero
matches across 177 files on Windows and 370 on macOS. Different counts reflect the
platform package layouts, not different scan scopes.

No credential command was added to the renderer contract, Electron preload, or Tauri
invoke handler. The Tauri dependency enables only its Apple-native and Windows-native
features and is pinned in `Cargo.lock`. The Electron ciphertext and Tauri credential
entry are removed before successful exit; the workflow retains neither the runtime
sentinel nor account identifier.

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
