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

The current spike proves byte preservation and minimal patching. Official Ren'Py
8.5.3 compile/lint validation is deliberately pending the separate SDK-adapter spike.
