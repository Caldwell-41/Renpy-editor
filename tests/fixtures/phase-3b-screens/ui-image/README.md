# UI-image fixtures

These synthetic 80x40 images contain four colored quadrants. PNG, JPEG, lossless
WebP and lossy WebP use different quadrant arrangements so the rendering check
can distinguish the selected asset. The extended WebP contains alpha and a
changed corner pixel. Pillow generated the retained bytes without external art.

The service test covers both `.jpg` and `.jpeg` using the JPEG bytes. The SDK
fixture adds six owned nodes through public operations, including two uses of
the PNG with proportional and stretched dimensions. Its accepted source and
asset hashes are emitted only when `LOOMLIGHT_UI_IMAGE_INPUTS` is selected.
