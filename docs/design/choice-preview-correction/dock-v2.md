# A v2

Kris asked to apply unslop and Experience First to A, then show the result.
This selects a new draft for review. It does not approve the draft or authorize
production implementation. Story Combined v1 and the three v1 candidates remain
unchanged.

The current Story page keeps its layout and preview allocation. The small Game
stage stays on the left. The prompt and numbered option summary share one scroll
on the right. Short samples show all three options at 1100 × 720 and 720 × 850.
Long text wraps and scrolls. A Choice without a prompt has no empty prompt row.

The revision removes repeated `No condition` labels. Only a conditional option
has a condition label. `Condition unknown` and `Picked state unknown` remain
separate. The configured picked policy stays beside its unknown-state notice.
`Show normally` adds no picked-state line because that policy does not change
the options based on prior picks. No options are hidden, marked or disabled by
this preview.

The existing `Other character state may be unknown` notice stays visible at
11 px. `Background unknown` replaces the long background message; its original
reason remains in the hover text. The conditional option's `If false: Show disabled`
policy moves to hover and accessible text. Its editable control remains in the
existing Beat editor. These are copy/presentation changes, not removed editing
capabilities. Duplicate captions keep separate numbers and order.

The prototype has one focusable summary scroll area. The scrollbar uses a visible
thumb. There are no new product buttons, preview assumptions or animations.
The review page's sample and viewport selectors only inspect the draft.

Source is under `app/design-lab/screens/choice-preview-correction/dock-v2/`.
Open `/screens/choice-preview-correction/dock-v2/index.html?state=duplicate`
on the existing draft server. `character`, `long` and `none` select the other
public samples. The exported `review-v2.html` shows the current Story page and
an interactive preview detail. The source commit and retained captures belong
to `verification-v2.json` and `captures-v2.json`.

The fixture has no media. This does not verify image fitting, character placement,
real saves or game execution. The draft has no source-write or native transport.
Choice #98's coordinator owns any later production change and qualification.
