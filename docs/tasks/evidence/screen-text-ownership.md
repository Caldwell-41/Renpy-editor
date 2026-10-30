# Screen text draft ownership

## Selected maintenance outcome

On 2026-10-30 Kris selected architecture candidate 1, confirmed an internal cleanup
with existing behavior and the core `text` command preserved, and requested a new
branch. This local maintenance uses `codex/single-text-draft-owner`, based on
`d99029840c43886b0de8e6ff1ed37038bafe894c`. Its integration destination is
`codex/phase3b-screen-designer`. Kris subsequently authorized pushing this branch,
opening a PR and running CI. Merge remains unselected.

State is `review_ready`. `ScreenText` now owns existing-text drafts. The composer
retains structural additions, ordering and removal; its duplicate text editor,
draft map, Apply, reconciliation and canvas samples are removed. Core commands,
source mappings, transaction ownership and approved visuals are unchanged.
Existing DOM scenarios now use typed text properties and the production
`formatText` editing path.

## Hierarchy Enter correction

The first affected DOM run passed 57 of 59 cases. Both text kinds failed the
existing requirement that hierarchy Enter resume a draft without submitting it.
This was a product defect exposed by correcting the fixtures. The row opened the
new editor without consuming Enter, allowing its newly mounted Apply listener to
handle the same event. The actual controller/core journey independently failed
because Source changed to the retained draft. The row now stops propagation when
opening Design. Both DOM cases and the real journey pass after that correction.

## Verification

Mac ARM64 verification uses Node 24.19.0, npm 11.9.0 and Rust 1.90.0.

- Final `npm run check` passes typechecking and all 277 frontend tests, with zero
  failures, cancellations or skips. The focused Screens run also passed all 59 cases.
- The production build passes with its existing chunk-size advisory.
- The unchanged core controller driver builds with locked offline dependencies.
- The final `project-font.browser.mjs` journey passes through the production
  controller and real core, including retained hierarchy entry, focus, Cancel,
  combined typography/layout Apply, conflicts, exact-source Undo/Redo and reopen.
- Final self-review confirms that the Rust/core command implementation, shared
  transaction path, image/font preparation and layout reservation remain unchanged.
- Repository validation, all 13 section-link validator tests and whitespace checks
  pass. The final documentation/style cleanup removes only the two CSS rules whose
  selectors disappeared with the old editor; it changes no rendered production path.

The first full frontend run passed 276 of 277 tests; an existing validator consumer
failed under system Python 3.9 because `tomllib` was unavailable. The final full run
uses isolated Python 3.12.16, downloaded from the Astral standalone release and
verified against its published SHA-256 digest. No test condition was weakened.

Ignored evidence is under `.toolchains/single-text-owner/`: the original controller
failure, corrected and final controller results, frontend/build logs and runtime
checksum receipt. The isolated runtime changes no system installation.
This is portable controller/core evidence; earlier native, SDK and broader 3B
acceptance retain their existing scope. No costly operation was selected.

The unrelated untracked Phase 1 audit and protected native recovery remain intact.

## Independent review and publication

Independent Standards and Spec reviews of `d990298...15477b5` each report zero
actionable findings. Both reviews were read-only. Implementation and test candidate
`15477b55e28910f4a8d6b2ecabc46c84d8412cb3` retains the verification above.
The publication successor changes only these status/evidence records.

The selected CI is the automatic `Repository quality` PR workflow, with frontend
tests/Rust formatting and repository validation. Its manual specialist selectors
remain off. Retain the exact PR head, run, attempt and audit under ignored
`.toolchains/single-text-owner/`; use the T3 PR watch for continuation.
The next action is confirming that run and auditing its required jobs and logs.
