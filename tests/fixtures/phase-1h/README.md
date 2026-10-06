# Phase 1H integrated acceptance inputs

The test-only builder in `app/src-core/src/lifecycle/acceptance.rs` creates
**Crossroads at Sundown** through staged project creation, real authoring/import
handlers, Scene commands and transactional Source saving. `expected.json` fixes
route dialogue, integer/Boolean/string state, image identities and exact Scene
source templates. Generated technical labels alone are normalized to logical names.
The builder checks copied media, history and reopen state before SDK execution.

The native SDK testcases use the generated standard main menu and normal Start,
then select each real Choice. They assert dialogue, state, media discovery,
placement and stopped music. No driver replaces `start` or jumps directly to a route.
Instrumentation exists only in disposable games and test binaries; it is absent
from the shipped desktop and from ordinary generated projects.

All content and assets are original synthetic test material under the repository's
MIT licence. No external art, music, fonts, voices or personal game content is used.
The five 64×64 RGB PNGs have one solid colour each: booth `(40,60,80)`, rooftop
`(130,70,40)`, riverside `(30,100,90)`, Alex `(220,140,90)`, Morgan `(140,100,220)`.
They use standard PNG IHDR, zlib-compressed unfiltered scanlines, CRC32 chunks and
IEND. The two PCM WAVs are 2 seconds, mono, 16-bit little endian, 8,000 Hz. Samples
alternate between +1,000 and −1,000; periods are 64 samples for theme and 32 for bell.
The fixed manifest records every asset byte count and SHA-256.

SDK save/token isolation uses Ren'Py 8.5.3's supported `Ren'Py Data` directory
above the disposable SDK. Editor state, game files, imports and caches are temporary.
No user-profile changes or inherited SDK environment overrides are needed.
