# Phase 1G review delivery

**Updated:** 2026-09-28. **Outcome:** REVIEW-DELIVERY-1, `not_started`.
**Repository/branch:** Caldwell-41/Renpy-editor / feature/phase-1g-branches-runtime.
**PR:** #17, draft/open/conflicting. [HANDOVER](../../status/HANDOVER.md) is the live record.

## Authority and finish line

The user approved the workflow changes and requested a next goal that also provides a
Loomlight build for review. Starting REVIEW-DELIVERY-1 selects this delivery outcome,
replacing the old preparation-only prompt. Deliver the usable packages early, complete
available bounded Windows native checks and prepare one focused final user session
per supported OS. Pause for user feedback in the same thread; record supplied results
without assuming acceptance or starting integration. Package availability is not proof
that an installer works on the user's machine.

The [Phase 1G brief](phase-1g-branches-runtime-git.md) retains product requirements and
historical evidence. Its superseded current-checkpoint/next-goal text and older Q1
preparation/dispatch/audit prompts are not live authority for this new selection.
Read relevant sections only. [WORKFLOW](../../WORKFLOW.md) governs execution;
[TESTING](../../TESTING.md#phase-1g-testing-ownership-and-cadence) governs evidence.

## Review packages

Use run `36383551820`, attempt 1, tested candidate
`8546dcddd5ac95bfe849575fe618f6e990cdd5d4`. Its
[terminal audit](testing-policy-alignment.md#q1-terminal-evidence-audit--2026-09-28)
records the qualification and independently computed file hashes. Later documentation
commits do not become that candidate. Do not rebuild merely to include updated docs.

| Target | Production artifact | Evidence artifact |
| --- | --- | --- |
| Windows x64 | `10953334429` / `phase-1-production-package-windows-2025` | `10953757230` |
| macOS ARM64 | `10954061304` / `phase-1-production-package-macos-26` | `10954175758` |

Both production artifacts were available/unexpired on 2026-09-28. Windows expires
2026-10-05T06:06:11Z; Mac expires 2026-10-05T06:00:55Z. Recheck before retrieval.
Obtain them from the [verified run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820)
with existing authorised access. The terminal audit records:

| Installer | Recorded SHA-256 |
| --- | --- |
| `Loomlight_0.1.0_x64-setup.exe` | `38cd0731923d8d919c187900edab46de37ac62f762500dd0aa2ded05118274be` |
| `Loomlight_0.1.0_x64_en-US.msi` | `f809ea49a0ca64aa4b5279bc779aae3a00154cb6c4341274c57818d2e24435f8` |
| `Loomlight_0.1.0_aarch64.dmg` | `407bd8743618986970c0d93d96e8886ccf916f31cc38bc78c5da9b234d10e200` |

Verify retrieved archive and executable/installer identity against that record. Provide
actual filenames, accessible artifact links or verified local files, hashes, source
candidate, launch instructions and limitations. Never invent downloads, local paths or
new validation. Present both packages; Windows is the default immediate review target,
not a change to supported platforms. Use disposable projects and isolated profiles.

## Host and build scope

Any repository/artifact-capable Codex host can deliver packages. Local Windows x64 is
recommended for the remaining native work; native access plus a proven input driver
is required for that evidence, not retrieval. Verify actual access and permissions.
Do not assume another host, substitute Chrome for native input or withhold a build
because routine agent-owned evidence is blocked. No extra Mac debugging is selected;
its final user session remains required before final acceptance.

Only if the Windows package is unavailable/unusable, this selected goal permits ONE
local Windows release package build from reviewed current source using the pinned/
locked toolchain and focused relevant checks. Label it a new review build, not Q1
acceptance; record exact source/binary identity and unperformed gates. Prefer project-
local portable tooling under existing setup instructions. Unapproved system installs,
missing host access or source changes beyond delivery scope require a decision.
No hosted repeat matrix, speculative rebuild or product/test-harness implementation.

## Bounded native verification and user review

Prepare existing disposable fixtures and record the procedure, samples, endpoints,
limits and cleanup before launching. Reuse TESTING's `branches-performance` and
`branches-interactive` paths: at most ONE agent-owned Windows launch of each, no
retry or new instrumentation framework. Retain all fixed samples, targeting failures
and cleanup. Keep the full fixture and unchanged thresholds; distinguish native-
WebView timing proxies, verified OS input and perceived responsiveness. Synthetic
input alone does not close G1-V2. These inspection-only checks do not launch SDK/game
code. Prior problem totals remain cumulative; these new selected allowances do not
renew exhausted historical diagnostic allowances.

Prepare one final human checklist per OS under TESTING: Scene/Source/Branches and
retained input; authored Run/Save/stale revision/Stop/re-run; a navigable SDK diagnostic;
resize/scaling/shortcuts and reopen. Provide required SDK/fixture setup and expected
results. Do not assign exhaustive regressions, old 1F manual suites, crash/hostile
experiments or Git cases to the user.

Preparation, delivery, available checks, self-review and documentation are internal
checkpoints of this outcome. Correct bounded documentation/fixture-setup mistakes;
classify production defects or exhausted allowances and pause rather than retuning
or repeatedly rebuilding. Publish evidence and HANDOVER, separating review readiness
from platform acceptance. Collect feedback in the SAME goal/thread on user command.
No new hosted dispatch is allowed. Preserve any independently authorised operation
and follow manual same-thread waiting without duplicate execution. Conflict resolution,
merge, 1H, Phase 2, optional Git and W0/OPT-1A remain outside this outcome.

## Workflow update record — 2026-09-28

Latest decisions applied: one outcome per goal; small internal checkpoints; no
mandatory fresh chat at checkpoints or CI waits; meaningful documentation and selective
context; user-commanded same-thread resume; unchanged approvals and cumulative budgets;
post-edit review, current handover and a review-build next goal.

Changed files: AGENTS.md, docs/WORKFLOW.md, docs/INDEX.md, docs/status/CURRENT.md,
docs/status/HANDOVER.md and this brief. No product, test, workflow YAML, dependency,
client setting or historical evidence was changed. The seven delivery rules,
application invariants, host routing and final user ownership are retained.

Incoming feature head: `a2098c361049b360c889129e8dfc0cca90b042a7`; main inspected:
`4d7ba0333c48d60242a9a42d3e079fea499a5531`. The Q1-to-feature comparison contains
only documentation. Another host's unpublished work is unavailable here. Publish a
non-forced descendant with `[skip ci]`; verify parent, changed files and remote head.

Review corrections before publication: distinguish repository waiting state from a
real Goal pause; do not replace the active goal on resume; retain old heading anchors;
replace the stale preparation-only live handover; include existing installer identities;
remove draft claims of checks not actually performed. Historical ledgers remain intact
and explicitly subordinate to the live continuation for next-step instructions.

Validation is limited to connector-based diff/content review, official OpenAI lifecycle
reference verification, existing artifact metadata/recorded hash inspection, and local
structural, whitespace, prompt-field and prompt-length checks on the two final delivery
records. Container GitHub access failed DNS resolution; there is no complete local
checkout. No full repository validator, application test, build, native launch, binary
rehash or client pause/resume test ran for this policy update. Publication must match
the reviewed snapshot; report remaining runtime/native and PR-conflict gaps honestly.
