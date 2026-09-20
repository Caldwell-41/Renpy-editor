# Ren'Py 8.5.3 SDK adapter spike results

**Status:** Automated Windows x64, macOS ARM64, and Linux evidence complete<br>
**Evidence date:** 2026-09-13<br>
**Latest successful run:** [GitHub Actions 34731460283](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34731460283)<br>
**Original successful baseline:** [GitHub Actions 34503653755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34503653755)

## Target-platform question and success criteria

Can the accepted checksum-first installer and exact-version adapter operate against
the same official Ren'Py 8.5.3 archive on Windows x64 and macOS ARM64 without weakening
the Linux boundary?

Success requires each target to fetch official checksum metadata on every run, verify
the complete pinned SHA-256 before extraction, promote only a validated staged install,
detect exactly 8.5.3, and run compile, strict lint, both automated testcases, normal
launch, development warp, diagnostics, and bounded distribution through direct
argument arrays. GUI launches must be cancellable with process-tree cleanup and bounded
output. Results must record platform paths, archive/link behavior, package contents and
launch observations, Windows security signals, and macOS signature/quarantine signals.
Unsigned hosted-runner observations must remain distinct from physical signed install
checks. A failed target is retained as discovery evidence; Linux success is not a
substitute, and no SDK/package/signing material is committed.

## Result

Final run 34731460283 passed the full matrix on Windows x64, macOS ARM64, and
the Linux x64 regression baseline. Every job fetched the official checksum metadata,
verified the complete pinned digest before extraction, then independently resolved
the same digest from that metadata. Each staged install reported exact SDK version
`8.5.3` (`Ren'Py 8.5.3.26051504`), and every project-loading command retained the
explicit trust gate. The fixture path contained spaces and Unicode on all three
systems; no machine path was retained in the JSON artifacts.

| Operation | Windows x64 | macOS ARM64 |
| --- | ---: | ---: |
| Version | Exit 0; 0.188 s | Exit 0; 0.087 s |
| Help | Exit 0; 2.391 s | Exit 0; 0.898 s |
| Compile | Exit 0; 2.110 s | Exit 0; 0.837 s |
| Strict lint | Exit 0, no diagnostics; 0.703 s | Exit 0, no diagnostics; 0.255 s |
| Automated tests | Exit 0, 2 cases/6 assertions; 1.937 s | Exit 0, 2 cases/6 assertions; 2.162 s |
| Normal run | Alive until bounded tree cancellation; 8.125 s | Alive until bounded group cancellation; 8.103 s |
| Warp `script.rpy:4` | Alive until bounded tree cancellation; 8.125 s | Alive until bounded group cancellation; 8.107 s |
| Distribution help | Exit 0; 1.219 s | Exit 0; 0.630 s |
| Target distribution | Exit 0; 15.750 s | Exit 0; 4.127 s |
| Installed package launch | Alive until bounded tree cancellation; 8.109 s | Alive until bounded group cancellation; 8.137 s |

Windows used runner Python 3.12.10 on `Windows-2025Server-10.0.26100-SP0`.
macOS used runner Python 3.14.7 on `macOS-26.6.2-arm64-arm-64bit-Mach-O`.
The SDK's own runtime was Python 3.12.7 on Windows and 3.12.8 on macOS. The
Windows launcher correctly resolved to `lib/py3-windows-x86_64/python.exe` plus
`renpy.py`; macOS used `renpy.sh`.

The target distributions were installed from locally built ZIPs only after complete
member containment, collision, limit, and symlink checks, into a staged Unicode path.
The Windows PC ZIP was 45,756,995 bytes with 1,603 installed files; its top-level
`.exe` launched successfully and Authenticode reported `NotSigned`. The macOS ZIP was
39,922,539 bytes with 1,590 installed files; the launcher named by
`CFBundleExecutable` launched successfully. `codesign --verify --deep --strict`
reported that the app was not signed, Gatekeeper assessment rejected it, and no
`com.apple.quarantine` xattr was present after CI download/build/extraction. These are
the expected observations for disposable unsigned hosted-runner output, not approval
to distribute it.

The hosted checks do not exercise Windows SmartScreen UI, a browser-origin quarantine
attribute, Finder installation, first-launch prompts, Developer ID signing,
notarisation, or signed upgrades. Those physical/release checks remain requirements
for a future approved release pipeline; they do not block selecting a Phase 0 desktop
stack because the unsigned behavior and limitation are now explicit.

### Original Linux evidence

The Linux probe passed against the official `renpy-8.5.3-sdk.tar.bz2` archive.
The official SHA-256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`
matched before extraction. The SDK reported `Ren'Py 8.5.3.26051504`.

The archive and SDK stayed outside the repository. The probe copied the synthetic
fixture to a disposable project path containing spaces and Unicode, and project
loading required the explicit `--allow-project-execution` flag.

| Operation | Result | Duration |
| --- | --- | ---: |
| Version capability probe | Exit 0 | 0.075 s |
| CLI help capability probe | Exit 0 | 0.941 s |
| Compile | Exit 0 | 1.149 s |
| Lint `--error-code` | Exit 0, no diagnostics | 0.287 s |
| Automated testcases | Exit 0, 2 cases/6 assertions passed | 6.347 s |
| Normal run | Alive until intentional process-group timeout; no diagnostics | 8.006 s |
| Development warp `script.rpy:4` | Alive until intentional process-group timeout; no diagnostics | 8.007 s |
| Distribution help | Exit 0 | 0.623 s |
| PC distribution | Exit 0, all packages built | 4.387 s |

Environment: GitHub-hosted x86_64 Linux, kernel 6.17.0-1022-azure, glibc 2.39,
probe Python 3.12.3, SDK Python 3.12.8, and Xvfb. ALSA emitted expected no-device
warnings in the headless runner; they were not Ren'Py diagnostics.

The follow-up runtime testcase took 0.147 s and exercised the preview-mapping fixture's
scene/dissolve, named transform, screen presence, literal dialogue, and Python-driven
state transition. It supports the faithful/approximate/runtime-only boundary recorded
in [the preview/source-mapping result](PREVIEW_SOURCE_MAPPING_SPIKE_RESULTS.md). That
specific timing is Linux-only; final run 34731460283 passed the same testcase set on
both supported targets.

## Security and adapter evidence

Twenty-four dependency-free synthetic tests cover checksum mismatch and partial data,
parent/absolute/backslash traversal, escaping symlinks and hardlinks, duplicate and
case-colliding entries, Windows reserved names, file/total/depth limits, existing
destinations, interrupted staging cleanup, bounded output, process-tree timeout,
command allowlisting, explicit project trust, long/spaced paths, missing SDKs,
incompatible versions, diagnostic parsing, package ZIP containment/executable modes,
cross-platform report redaction, target package allowlisting, and macOS bundle-launcher
selection.

Extraction validates the complete member set before writing, uses a private sibling
stage, refuses replacement, and atomically promotes only after success. Subprocesses
use direct argument arrays with no shell, bounded output, timeouts, and process-group
cancellation. Raw bounded output accompanies structured diagnostics.

## Reproduction

```bash
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
gh workflow run sdk-spike.yml
```

The workflow downloads only the exact official release URL, independently checks the
pinned digest, then has the spike parse the official checksum file and verify again
before safe extraction. Its JSON evidence artifact is retained for seven days.

The immutable SDK archive is now cached outside the repository under a key containing
the runner OS, `renpy-8.5.3-sdk.tar.bz2`, and the complete pinned SHA-256. A cache miss
still downloads from `renpy.org`. Every run fetches the official checksum metadata,
then verifies the restored or downloaded archive against the pinned digest before the
adapter independently checks the official metadata and extracts it. Cached bytes are
therefore treated as untrusted input, and changing the version or expected digest
creates a new cache key.

[Cold cache run 34691004407](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34691004407)
and [warm cache run 34691154758](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34691154758)
both passed in about 1:10. The warm run recorded a full cache hit, skipped the SDK
download, fetched official metadata, and reported the pinned archive checksum as OK.
The previous download step took only about two seconds, so this removes redundant
transfer without a demonstrated end-to-end speedup; the integration probe remains the
dominant cost.

## Failures that improved the fixture

The first run proved compile and tests but exposed an orphan translation, runtime
speaker attributes without image tags, and a distribution command that relied on the
SDK working directory. The second run proved run/warp and corrected distribution help,
then strict lint identified missing image declarations. The third run passed all gates
and added a real PC distribution.

The first target matrix, run 34730736507, retained Linux success while exposing GNU-
specific `sha256sum --check` on macOS and Bash syntax parsed by PowerShell on Windows.
Run 34730838387 fixed those workflow boundaries and passed macOS, while Windows
completed every SDK operation and wrote its artifact before CP1252 console encoding
failed on Ren'Py's UTF-8 lint BOM. Run 34731075166 then passed Windows package install/
launch but showed that a PC bundle is not a macOS launch artifact. Runs 34731215438
and 34731342762 successively exposed the single-app-root and multi-binary bundle
selection cases. The final implementation requests the target-specific package and
uses `CFBundleExecutable`, rather than guessing among bundle binaries. Each failure
was investigated and superseded by final green run 34731460283; none is hidden as a
retry-only success.

## Limits and next evidence

Automated SDK/install evidence is complete on both supported targets. The spike does
not accept SDK redistribution or automatic upgrades, and unsigned hosted-runner
launches do not establish a production signing/notarisation pipeline. The next Phase 0
gate is the equivalent Electron/Tauri cold-start, memory, artifact-size, interaction,
flakiness, dependency/licence, maintainability, and developer-complexity comparison.
