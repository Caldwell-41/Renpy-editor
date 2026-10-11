# Pinned Ren’Py published checksums

`8.5.3-checksums.txt` is the unchanged public checksum manifest previously acquired
from https://www.renpy.org/dl/8.5.3/checksums.txt and used for the accepted SDK8.5.3
qualification. Its SHA256 is
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.
The SDK archive pin remains
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.

Selectable CI reuses the previously qualified official archive from the existing
platform SHA-keyed cache, verifies both manifest and archive hashes, and runs fresh
compile/lint/runtime qualification. A cache miss permits one bounded official HTTPS
download with the same pin. A corrupt cache is refused. No SDK binaries are stored
here. The retained PGP signature is source evidence; this workflow makes no separate
claim of PGP signature verification.
