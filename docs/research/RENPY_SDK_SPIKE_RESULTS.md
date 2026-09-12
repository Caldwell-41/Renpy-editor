# Ren'Py 8.5.3 SDK adapter spike results

**Status:** Linux evidence complete; Windows and macOS pending<br>
**Evidence date:** 2026-09-10<br>
**Successful run:** [GitHub Actions 34503653755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34503653755)

## Result

The Linux probe passed against the official `renpy-8.5.3-sdk.tar.bz2` archive.
The official SHA-256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`
matched before extraction. The SDK reported `Ren'Py 8.5.3.26051504`.

The archive and SDK stayed outside the repository. The probe copied the synthetic
fixture to a disposable project path containing spaces and Unicode, and project
loading required the explicit `--allow-project-execution` flag.

| Operation | Result | Duration |
| --- | --- | ---: |
| Version capability probe | Exit 0 | 0.111 s |
| CLI help capability probe | Exit 0 | 1.458 s |
| Compile | Exit 0 | 1.426 s |
| Lint `--error-code` | Exit 0, no diagnostics | 0.474 s |
| Automated testcase | Exit 0, one assertion passed | 5.111 s |
| Normal run | Alive until intentional process-group timeout; no diagnostics | 8.013 s |
| Development warp `script.rpy:4` | Alive until intentional process-group timeout; no diagnostics | 8.013 s |
| Distribution help | Exit 0 | 0.969 s |
| PC distribution | Exit 0, all packages built | 6.813 s |

Environment: GitHub-hosted x86_64 Linux, kernel 6.17.0-1022-azure, glibc 2.39,
probe Python 3.12.3, SDK Python 3.12.8, and Xvfb. ALSA emitted expected no-device
warnings in the headless runner; they were not Ren'Py diagnostics.

## Security and adapter evidence

Nineteen dependency-free synthetic tests cover checksum mismatch and partial data,
parent/absolute/backslash traversal, escaping symlinks and hardlinks, duplicate and
case-colliding entries, Windows reserved names, file/total/depth limits, existing
destinations, interrupted staging cleanup, bounded output, process-tree timeout,
command allowlisting, explicit project trust, long/spaced paths, missing SDKs,
incompatible versions, and diagnostic parsing.

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

## Limits and next evidence

This is Linux evidence only. It does not establish Windows launcher layout, case and
reserved-name behavior on NTFS, macOS quarantine/signing behavior, native credential
storage, or Windows/macOS package install and launch. Those remain Phase 0 gates. SDK
redistribution and automatic upgrades are not accepted.
