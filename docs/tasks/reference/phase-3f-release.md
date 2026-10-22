# Phase 3F integrated acceptance and release requirements

Read for initial-release coverage, packaging or distribution planning. This is
planned scope. Audience/channel, signing access and schedule remain open. Select the
release outcome and finite allowance before execution or publication. The
[phase brief](../active/phase-3-initial-wysiwyg-release.md) owns capability state.

<a id="7-3f--release-and-evidence"></a>

## 7. 3F — Release and evidence

Before final qualification, map every initial-release PRODUCT workflow and all five
major workspaces to implemented capability and actual evidence. A first usable slice
is not completion of the broader requirement. Missing agreed capabilities require
completion or an explicit product/roadmap revision; never silently lower the exit gate.

Use synthetic content for create → author conditional/called routes → screen edit →
Timeline edit → Source reconciliation → reviewed LLM proposal → supported Run From Here
→ recovery → close/reopen. Exercise both
normal routes and run a copy without editor metadata. Record each capability's limits.

Agent-owned focused tests run at the changed boundary; native input, credential,
rendering, audio/runtime and packaging evidence runs on affected Windows x64/macOS
ARM64 targets. Test the first risky production path early. Final integrated evidence
covers both targets. Human review is focused on actual visual/input/interaction needs;
routine automated testing is not delegated to the user. Reuse follows implemented
TESTING policy and exact changed inputs, not a blanket cross-SHA waiver.

Keep ordinary conflict/interrupted-save regressions. Use non-crashing fault/state
fixtures for recovery; no renewed hostile same-user filesystem or deliberate process-
termination programme. Required-case omissions must make gates fail. Keep cumulative
problem costs and reassess after two unsuccessful corrections of one hypothesis.

Select audience/channel before release preparation. Follow ROADMAP's existing private
versus broader-distribution policy, including signing/notarisation where required.
Install/upgrade behavior, package privacy, dependency/licence inventory, known limits
and exact tagged source/package evidence must be recorded. No publishing is selected
by this planning task and no date is promised.

<a id="implementationqualification-plan"></a>

### Implementation/qualification plan

| Step | Concrete work | Completion evidence |
| --- | --- | --- |
| 3F.1 — Coverage and fixture | Extend existing synthetic fixtures with A/B/C/D scenarios and Phase 2's selected-reference generation. Map the revised PRODUCT requirements to supported operations, limits, candidate and test IDs. No Git gate. | Every promised operation has a rejecting assertion; missing/zero/skipped required cases fail. Independently review the source changes and supported subset. |
| 3F.2 — Integrated correctness | Extend existing core/browser/SDK/native selectors rather than create a new test orchestrator. Cover nested/source edits, screen interactions, timeline effects, state comparison, undo, ordinary external conflict and reopen in one representative game. | Both target outcomes and source/runtime observations, metadata-free run, migration from accepted Phase 1/2 projects, and no scratch harness in real game source or distributions. |
| 3F.3 — Desktop delivery | Use the existing Tauri packaging path and selected coherent-candidate qualification. Check install/upgrade/launch, project reopening, keyboard/IME, scaling, audio, credentials and privacy on applicable targets. | Exact candidate/package identities, retained failures and known limits. Human input checks stay focused; routine testing is agent-owned. |
| 3F.4 — Distribution decision | Select audience/channel and signing/notarisation requirements under the existing policy. Prepare release notes/support limits and obtain any required release selection before publication. | Tagged reviewed source, verified packages and clean distribution contents; no invented private-release claim for a public channel. |

3F packages **Loomlight**. It does not add a game-export/publish service, automatic
itch.io upload or GitHub integration. The authored game remains usable with the
official Ren'Py launcher; use its distribution rules when checking that test/bootstrap
files and editor-private data are absent from an ordinary built game. Any new Export
Game button needs separate product selection.

Reuse the current [testing policy](../../TESTING.md) and
[production workflow](../../../.github/workflows/production-scaffold.yml). No package
matrix is selected by this plan. At each implementation outcome, record a finite
allowance before native builds: proposed default is one narrow affected-target proof
per target for the new risky boundary, then one final coherent-candidate qualification
shared where valid. This is a proposed ceiling, not automatic dispatch permission;
existing failure budgets persist and changed/failing inputs require explicit accounting.
Do not run a full matrix for every table row or waive a failed result to fit the budget.

Ren'Py basis: [automated testing](https://www.renpy.org/doc/html/testcases.html) and
[game distribution contents](https://www.renpy.org/doc/html/build.html).
