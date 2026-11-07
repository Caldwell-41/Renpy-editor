# Reduce redundant testing

[Issue #85](https://github.com/Caldwell-41/Renpy-editor/issues/85) tracks this
maintenance outcome. Kris confirmed the scope through grill-with-docs on
2026-11-07: audit tests and agent run policy, remove duplication and obsolete
checks, and select expensive checks by relevance. Preserve distinct source,
save/recovery, ordinary external-edit and platform coverage. No reduction quota.

Parent owns all edits on `codex/85-test-selection`, based on accepted integration
commit `021dd5d21432660e18ceb2543c0adb85c3917abc`. Council delegates are read-only.
Development host is Windows x64. The outcome ends with a draft PR, not a merge.

## Selected reductions

1. Documentation-only PRs still run repository validation and complete their named
   quality job, but do not install frontend dependencies, build, run frontend
   tests or execute Help integration. Use a conservative documentation allowlist;
   unknown paths, unavailable comparison data, and workflow/selector changes
   require code checks. Compare the whole PR, including deleted/renamed files.
   Preserve exact-head combined validation without reusing an old green status.
2. Move the actual Win32 credential-dialog fixture out of `test_*.py` discovery
   into an explicitly selected native check. Preserve its assertions, ordinary
   offline credential refusal tests and an executable native workflow consumer.
   Do not call the existing PowerShell logic fixtures native desktop proof.
3. Remove the redundant frontend build before `test:source-browser`, which builds
   its own inputs. Clarify focused compiled-test commands and avoid telling agents
   to compile tests immediately before `npm test` compiles them again.
4. Make iteration policy actionable: select affected tests, run a coherent final
   candidate once, serialize timing-sensitive journeys against broad builds/tests,
   and put final run receipts in the issue rather than another status-only commit.
   Retain current exact-head CI rules and all product tests without demonstrated
   redundancy. Keep host-specific retention checks until their portability is proved.

Help remains selected for every code-changing PR because it covers shared
controllers and core services. No dependency scanner or cross-commit evidence
cache is introduced. The documentation allowlist includes root Markdown, Markdown
under `docs/`, and `.github/validation-plan.json`; other assets still select code.
The selector uses the tested merge and verifies both parents against the event.
A selector change evaluates its own PR; review and main-push full checks remain
the backstops. This PR exercises the code path; the first future docs-only PR
will supply live CI evidence for the reduced path.

## Council decisions

Plan review: Opus 5.5 scored 7/10; GPT-6.1 Sol scored 8/10. Both support the
reductions with conservative selection, preserved native consumers and exact-head
CI. Adopted the validation-plan exception and guidance about PR body/title edits.
Declined broad `docs/**` exemption because that directory holds machine-consumed
assets. Declined adding physical dialog input back to the default harness;
`--native-dialog` explicitly adds it on Windows. Current native connection uses
that option. Frozen Settings retains its explicit case and matching inventories;
this migration does not reopen its campaign or claim fresh package qualification.

Implementation review: Sol scored 9/10 with no findings. Opus scored 8/10 and
found that the explicit check needed a cheap hosted Windows consumer. Corrected
the existing harness-only dispatch to select the native dialog on Windows; local
defaults remain offline. Parent owns verification of this small correction.

Automatic Repository quality and one both-target harness dispatch are selected
for the publication head. The latter verifies the moved check on hosted Windows
and preserves existing Mac harness coverage without an SDK/package/app campaign.
Limit: two harness dispatches, one planned plus one diagnosed correction if needed.
Count each accepted dispatch, including failures/cancellations. Preparation use is
0/2; #85 owns live consumption and final run/attempt receipts after publication.
No further local physical-dialog attempt is selected.

## Acceptance and validation

- Council challenges proposed cuts and reviews the implementation for coverage
  regressions. Address supported findings and record disagreements.
- Workflow, commands and documentation agree. Selection tests cover normal docs,
  mixed/code changes, rename/delete cases, unavailable diff data and failure paths.
- Moved native coverage remains explicitly runnable and required when its driver
  changes; ordinary offline discovery never opens that credential dialog.
- Run affected Python checks, repository validation, workflow lint and applicable
  frontend checks. Test the native fixture on Windows if changed/moved; retain a
  real failure if the desktop cannot supply required focus. No SDK, helper,
  package or Loomlight application campaign is selected by this maintenance work.
- Draft PR records reductions, retained coverage, validation and council results.

## Current state

Implementation preserves product cases and moves one physical desktop fixture.
Council review and its bounded correction are complete. Publication and CI remain.
Final publication-head run receipts belong on #85 rather than another status-only commit.

## Local validation

- Seven selector tests pass against real Git merge trees, including mixed changes,
  rename/removal, missing parents and diff failure. Eighteen existing coordinator
  tests pass. Workflow lint passes.
- Fifty-five focused harness, Thinking admission, Settings logic and frozen
  evidence tests pass. The full Windows harness's four ordinary groups pass:
  344 Python cases with four named host exclusions, Q1 rejecting fixtures, Q1
  source audit and ten retention cases with one named host exclusion.
- The explicitly selected native dialog group fails at foreground acquisition.
  This matches the [pre-existing L20 failure](../evidence/sample-fidelity.md#review-corrections-and-expanded-scope-2026-11-07).
  An AST comparison proves the moved test's Python operations and embedded
  PowerShell are unchanged apart from indentation. No retry, timeout change or
  mocked focus was used. Physical dialog behavior remains unqualified on this
  host; the selected group and combined result correctly remain failed. Raw
  results are retained in ignored `.toolchains/85-harness/`.
- Full repository validation initially found a fixture email outside its allowed
  placeholder domains; corrected to `example.com`. Two known unrelated ignored
  recovery files still lack final newlines. Preserve those files and distinguish
  published-file validation from the full working-tree result.
  Published-file validation passes for all 1,785 tracked and proposed files.

No frontend or product code changed. Automatic PR quality will run the retained
frontend and Help/core checks on the publication head. No claimed live CI timing
reduction is made before a documentation-only PR exercises the selected path.
