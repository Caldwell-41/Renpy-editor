# Arithmetic integration review

The code-review skill reviewed accepted Screens base
`251fb47754a0ec1a43ece8763a0b4603b8e54dd8` through integration
`09404bd16018c7f046bf6392143df6e235d481ba`. The three-dot diff contains 137
changed paths. Later coordinator documentation is outside the reviewed product.
Independent fresh agents reviewed Standards and Spec without reading each other's
reports. All findings below are P2. They are unresolved at this checkpoint.

## Standards

- **S1. IME confirmation replaces formula text.**
  `app/src/screen-arithmetic-editor.ts:86` accepts suggestion Enter during
  composition. The isolated production-control check changed `bo` to `bonus`
  with `isComposing=true`. Guard composition and its confirmation events before
  suggestion handling. [UI validation](../../UI.md#input-validation-timing-and-recovery)
  forbids rewriting text during composition.
- **S2. New formula errors appear before completion.**
  `story-arithmetic-editor.ts:125` and `screen-arithmetic-editor.ts:57` validate
  each input, including composition; Story also marks a newly empty field invalid.
  The same UI rules require a neutral untouched field and new text/number errors
  on blur or explicit commit. Preserve live valid guidance and correction of an
  already displayed error without announcing new format errors per character.
- **S3. Apply identifies the wrong invalid action.**
  `screen-interactions.ts:150` chooses the expanded row. With invalid action 1
  collapsed and valid action 2 expanded, refusal marks/focuses action 2. Carry the
  failing action identity from admission. UI submission rules require marking and
  focusing the first invalid field. This affects both button kinds.
- **S4. Unavailable validation marks valid input invalid.**
  `screen-arithmetic-editor.ts:70` sets `aria-invalid` for every exception.
  A transport-unavailable response marks valid `1` invalid. UI asynchronous-check
  rules require checking/unavailable to remain distinct from formula errors.
- **S5. Error explanations lack accessible associations.**
  `story-arithmetic-editor.ts:71` and `main.ts:967` create feedback without a
  field-associated ID. UI error rules require an accessible association, not only
  a live announcement. Connect unique feedback identities to the affected fields.

Five documented-standard findings; worst within this axis is S1. No separate
smell-only finding was reported. Tool-enforced matters were excluded.

## Spec

- **P1. Creating another variable discards a default draft.**
  `main.ts:995` redraws Variables after creation, detaching the existing draft.
  Actual main/core reproduced money's raw `1e` reverting to accepted `2.5`, with
  its dirty marker lost and no discard decision. [#87](https://github.com/Caldwell-41/Renpy-editor/issues/87)
  requires "Preserve drafts and ordinary external-edit recovery"; A2 requires
  retained invalid/default drafts. Retain the draft through unrelated creation.
- **P2. Arithmetic refusal focuses the wrong action.**
  `screen-interactions.ts:150` marks the expanded valid action while the invalid
  earlier action stays collapsed. [#97](https://github.com/Caldwell-41/Renpy-editor/issues/97)
  requires field diagnostics; A2 requires "Reveal/focus the invalid field".
  This overlaps S3 and needs one correction, without changing either axis's count.
- **P3. Completion corrupts an identifier edited at its middle.**
  `story-arithmetic-editor.ts:85` and `screen-arithmetic-editor.ts:45` replace
  only the prefix before the caret. Accepting `bonus` at `bon|us` yields
  `bonusus`. #87's variable suggestions and A2's "replacing a partial identifier
  or selection" require replacing the identifier or selected range correctly.
- **P4. Full #96 acceptance depends on unselected #110.**
  `scene-ui.ts:526` still requires settling a draft before navigation; Tracks/Reel
  and retained branch/view drafts do not exist in this increment.
  [#96](https://github.com/Caldwell-41/Renpy-editor/issues/96) requires
  "Tracks, Reel and Writing focus retain selection, branch context, keyboard
  operation and drafts." [#110](https://github.com/Caldwell-41/Renpy-editor/issues/110)
  owns the missing workspace. Keep that dependency or obtain Kris's explicit scope
  decision. This is incomplete behavior, not merely missing evidence.

Four Spec findings; worst within this axis is P1. No substantiated scope-creep
finding was reported. P4 requires a scope decision rather than an arithmetic fix.

## Evidence and correction assignment

Ignored `.toolchains/arithmetic-review-09404bd1/standards-details.md` and
`spec-details.md` retain isolated production-module reproductions, actual-main/core
draft-loss proof, pinned locations and rule/requirement citations. Both reviewers
left tracked files and refs unchanged and ran no browser or SDK. Earlier target
qualification retains its original scope; these reports establish no acceptance.

The coordinator selects one fresh implementer for S1-S5 and P1-P3, seven distinct
code defects. Its scope includes the existing UI/draft owners, narrow typed action
diagnostic context if needed, affected tests and canonical contracts. Use confirmed
TDD boundaries and preserve existing arithmetic/runtime/history owners. Retain raw
drafts, selection and focus; correct the actual invalid row without renderer
arithmetic or message-text parsing. SDK use stays Mac 9/20 and Windows 3/20,
zero reservations. The fix assignment allocates no SDK/native/package/manual-CI run.

The existing #97 visual mismatch also remains selected: bring numeric comparison
controls into A2's approved grouped arrangement and compare all affected controls
after the final palette changes at wide/compact sizes. Preserve the reference and
the separately owned full Story workspace. This known integration obligation is
not added to either independent review's finding count.

Kris has been asked whether workspace acceptance should move explicitly to #110
or continue to block full #87/#96 acceptance. The question remains pending; neither
elapsed time nor ongoing code fixes answer it. The coordinator owns that decision,
tickets, status, integration and PR. The implementer handles the independent fixes
without changing acceptance scope or implementing #110.

## CI caller correction before review fixes

One-time exact-head observation found automatic quality runs `42647963956` and
`42647882928` failed at reviewed `09404bd1`. The newest
[run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42647963956) passes
repository validation but reports 382 frontend passes and four failed results.
Those are the parent and three scenarios of `smoke-report.dom.test`: the shipped
probe waits for the removed `Edit default` button, preventing later Scene/Source
checks. This is a superseded caller of #97's new inspector, not a deadline failure.

The coordinator reproduced the same red with pinned Node against the merged app,
then changed only `app/src-tauri/src/smoke_probe.js` to select `score` and wait for
the actual `Save Default` inspector. The existing success, rejected-authoring and
incomplete-trace scenarios all pass unchanged, four reported results including
their parent. No assertion, timeout, security guard or report contract changed.
Ignored `ci/` under the review directory retains the exact job/log receipt and
local `smoke-red.log` / `smoke-green.log`. H73 indexes the cause and correction.

This source change affects the embedded probe; its DOM replay is not a matching
native-package result. No package/native/SDK was started. Later publication heads
still require their own selected automatic checks; no passing CI is inherited.
The fresh review-fix implementer must preserve this migrated caller while changing
the default editor. The independent review counts remain five Standards and four
Spec findings.
