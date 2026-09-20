# Crossroads at Sundown fixture

This is synthetic test data for Project Loomlight. It contains no personal data,
downloaded media, or private game material.

- `game/` is the integrated representative project source.
- `micro/valid/` isolates syntax and byte-preservation cases.
- `micro/recovery/` contains intentionally incomplete editor buffers and is never
  supplied to Ren'Py as a runnable project.
- `encoded/` stores base64 representations of BOM/CRLF cases so Git normalization
  cannot alter the golden bytes.
- `manifest.json` records SHA-256, encoding, line endings, purpose, and expected SDK
  disposition for each source fixture.

The source spike proves byte preservation and minimal patching. The integrated `game/`
fixture also passes Ren'Py 8.5.3 compile, strict lint, automated test, normal-run,
development-warp, and PC-distribution gates on Linux. Parser-only and intentionally
invalid microfixtures remain outside the runnable project.
