# Approved Choice preview correction

Kris approved A v2 with **"Sure approved"** on 2026-11-11 after requesting
unslop and Experience First revisions. The owning `approval.json` now selects
`dock-v2`, variant `dock-refined`. This is approval of the compact Choice preview
in the current Story page. It does not supersede Story Combined v1.

Reviewed source is commit `7ba6eea4da1f12434f8260bdc6400a00bf04a964`, fingerprint
`9d62ff5224e47e8a505fe9467366b40fca66cf7a9c57a9b1bdfad59f18e99c54`.
The local branch is `codex/choice-preview-design`, based on
`f395f158cbb6df11eb733316cf6ccc4c498c1d10`. Nothing was pushed.
The source, captures and draft approval record were committed before approval.
Later commits contain review evidence and approval metadata only.

## Implement this correction

Keep the current Story layout and preview allocation. Move Choice text out of
the fitted 16:9 Game stage into a summary beside it. Keep prompt, picked-state
notice and numbered option rows in one scroll area. Remove repeated `No condition`
labels. Label conditional options `Condition unknown`. Keep picked state separate
from the configured policy. `Show normally` adds no picked-state line.

Short samples fit in the existing 110 px height at 1100 × 720 and 720 × 850.
Long content wraps and scrolls. A missing prompt creates no empty row. Duplicate
captions retain their order and separate numbers. The existing other-character
state notice stays visible. The shorter background notice retains its reason in
hover text. The false-condition policy remains in hover/accessibility text and
the existing Beat editor control.

Prototype presentation lives in
`app/design-lab/screens/choice-preview-correction/dock-v2/`. Extend the existing
production preview owner during integration; do not add a second production
preview or import the prototype fixture. Retain live Game stage media rendering.
The public fixture has no media, so this design does not verify image fitting or
Character placement. It does not authorize removing those capabilities.

## Evidence and limits

- `approved-v2.html` shows the approved review wrapper. It differs from retained
  `review-v2.html` only in its review status label. The reviewed source is unchanged.
- `captures-v2.json` owns six retained PNGs and hashes. Five top-position captures
  cover duplicate captions at both sizes, a Character prompt, no prompt, and long
  text. A sixth capture retains the long-text scroll endpoint. All use dark mode
  and display scale 2. The typed approval lists the five distinct top states.
- `verification-v2.json` retains eight focused browser samples and the TypeScript
  result. All samples have no overlapping option text, no horizontal overflow,
  reachable final options, zero source mutations and native-operation refusal.
  Short samples show all three options without scrolling.
- The study uses a standalone lab entry because its owner could only edit new
  prototype files. It is not registered in the shared gallery. Promotion checks
  validate this record with the existing typed parser, source fingerprints and
  capture hashes/dimensions. Focused browser evidence comes from that same entry.

The Game stage and options remain inert. There is no condition evaluation, picked
state simulation, Preview options assumptions feature, or project execution.
Browser evidence does not prove saves or runtime correctness. The coordinator
owns the live comparison, implementation checks and remaining qualification.

No production component, CURRENT, HANDOVER, Choice task evidence, validation plan,
runtime fixture, SDK adapter, approved Story source or approved Story history was
changed. This design work used zero SDK starts, native editor/package launches
or CI runs. Reported SDK counters remain Mac 16/20 and Windows 7/20, with zero
reservations. This approval grants no additional SDK starts.
