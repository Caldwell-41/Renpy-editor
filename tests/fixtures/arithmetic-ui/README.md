# Reviewed UI source qualification

The four `.rpy` snapshots are exact accepted outputs from actual-main → Help driver
→ ApplicationHost journeys at reviewed `354b52211b42e85721d80b751b08832db10db38e`.
`manifest.json` pins each snapshot and the original runtime inventory.
`requests.json` retains successful UI writes and public variable/asset setup, with
original IDs and revisions. It is traceability data, not a replay script for a new
session. The original journeys own Undo/Redo, refusals and reopening evidence.

The SDK fixture reproduces the declarations through public variable authoring,
accepts the other snapshots through Source, and checks history/reopen again.
Screens variables and screen retain their original paths. The two captured scene
files both used `game/chapters/chapter_01/scene_001.rpy` in separate projects. This
combined fixture imports them as `game/ui_condition.rpy` and `game/ui_story.rpy`,
keeping both original labels and all bytes. The captured helper/element identities
are unchanged. The image is the exact existing `ui-image/seal.png` fixture copied to
`game/images/ui station_seal.png`, as the Help driver and public import did.

`driver.rpy` replaces only the SDK template entry file. Its extra Boolean/string
defaults come from Story's public setup (`False`, `"literal"`). `flag=True` and
`bonus=7` come from the captured Screens declarations and match Story's Help/public
setup. Story explicitly resets trust to 5 and money to 9.5 before calculation;
neither the SDK oracle nor the editor may infer current Story values from defaults.
The fixture entry calls the captured Story, then resets money/trust/reward for the
condition and screen phases. It records every further operand change explicitly.

## Independent oracle

These literals follow integer arithmetic and ordinary Python float semantics,
without reading app diagnostics or running Loomlight's evaluator:

- `9007199254740993 // 3 = 3002399751580331`, then `% 5 = 1`. Trust becomes 6.
  A double-coerced integer would produce a different remainder. Money's `9.5 % 2`
  is exactly 1.5. The protected `max(0, trust - 1)` then gives 5; nested increment
  gives 6; `(bonus + 2) * 3` with bonus 7 gives 27. Trust is `int`, money `float`.
  A Python-statement observer records these intermediate states without computing
  arithmetic or changing state. Boolean and string statements stay literal.
- Reset money 4.5 satisfies `money >= 2.75`, so the captured condition says
  `Fraction accepted`. The actual rendered screen TTS contains `Balance: 4.5`.
- The new imagebutton divides 4.5 by 2.0 twice, giving 2.25 then 1.125, all `float`.
  It has no Finish, so continuation stays zero.
- After screen evaluation, the fixture changes money to 9.5 and trust to 6.
  `(9.5 + 0.5) / 4 = 2.5`; `9.5 % 2.5 = 2.0`. The textbutton then reads trust 6
  and assigns reward 12 (`int`). A second call uses trust 7, money 2.0, and gives
  reward 14 with money still 2.0. Each Finish advances exactly once.
- The ordered imagebutton starts with trust 7 and changed bonus 3. It adds to 10,
  then reads that new trust to assign reward 20. A second call changes bonus to 2,
  yielding trust 12/reward 24. These are `int`; total continuations are four.
- The negative case demands trust 26 at the captured Story narration. Correct trust
  is 27. It must fail that assertion and never print the wrong-accepted marker.

The raw screen's buttons overlap. The fixture finds each actual rendered Button
by its first Function action's operation, requires one match, and dispatches that
unchanged action via a test-only timer. This proves rendered-action execution and
normal Finish handling. It is not mouse/keyboard/native-editor evidence. #95's
unchanged adapter retains its original physical gesture scope. No display IDs,
layout repairs, replacement evaluator or manufactured action outcomes are added.

Screen prediction, selection and interaction restart must leave values unchanged.
Canvas planning uses an explicit money sample 1e-7 and must show `Balance: 1e-07`
without altering accepted files. H69 uses actual TTS for captions; H72 ID selectors
are unnecessary here. Full SDK GUI limitations remain explicit under H70.

The standalone imported screen has no transplanted ownership metadata. Its inert
plan therefore reports its original key, two image appearances and helper init as
unresolved. The preflight retains these exact limits and still requires the typed
text sample and unchanged bytes. The SDK executes the complete raw screen and
verified image. This arrangement does not claim full canvas rendering eligibility.
Canvas planning precedes installation of the qualification-only entry/observer.

The first Mac invocation compiled/linted these unchanged snapshots and passed the
Story trace/types, then failed to progress beyond its narration. The corrected
entry driver uses destination-bound `advance until` transitions. That correction
passes SDK-free checks only; the full Screens/Finish/negative-case runtime proof
remains pending under the canonical arithmetic review evidence.
