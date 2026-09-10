# Ren'Py 8.5.3 SDK adapter spike results

**Status:** Linux integration run pending; boundary tests pass locally
**Evidence date:** 2026-09-10

This file records the bounded Phase 0 SDK and secure-installation spike. The
official release page identifies Ren'Py 8.5.3 (released 2026-05-15), and its
official checksum list publishes SHA-256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45` for
`renpy-8.5.3-sdk.tar.bz2`.

The local security suite passes 14 synthetic tests covering checksum mismatch,
parent/absolute/backslash traversal, escaping symlinks and hardlinks, duplicate
entries, case collisions, Windows reserved names, size/depth limits, existing
destinations, bounded subprocess output, timeout cancellation, command
allowlisting, explicit project trust, version rejection, and diagnostic parsing.

The real Linux SDK run is isolated in a manually dispatched CI workflow because
the development shell cannot download the binary archive. Its report will be
recorded here after the first run. Windows and macOS remain untested; this spike
cannot close the cross-platform acceptance criterion.
