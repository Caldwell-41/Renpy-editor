# Project font fixtures

Unmodified Source Sans 3 Regular fonts from Adobe's
[source-sans repository](https://github.com/adobe-fonts/source-sans/tree/87b37a2daaed80fcb8e8ccb0085c4d72ddade12e),
revision `87b37a2daaed80fcb8e8ccb0085c4d72ddade12e`.
The [SIL Open Font License](LICENSE.md) covers both files. These are disposable
test assets, excluded from the application build.

| File | Upstream path | SHA-256 |
| --- | --- | --- |
| SourceSans3-Regular.ttf | `TTF/SourceSans3-Regular.ttf` | `4644c81b86ec9caaa76b634889968ed3c4f4f52f054855933acc7c2b21e53b0f` |
| SourceSans3-Regular.otf | `OTF/SourceSans3-Regular.otf` | `08df266400933d3178d081a45f94a08814c3e55b4b7dd2e0ff69cb1329f13ab6` |

Use these files to exercise the approved import boundary and actual Ren'Py font
rendering. A renamed extension alone does not establish OTF support; the OTF
fixture contains CFF outlines and the TTF fixture contains TrueType outlines.
