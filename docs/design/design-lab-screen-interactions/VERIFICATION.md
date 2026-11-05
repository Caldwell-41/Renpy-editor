# Approval verification

The user decision is recorded and reproducible. Full promotion verification is
blocked; the required `npm run design:check` has not passed.

| Check | Result |
| --- | --- |
| Pinned Node 24.19.0 TypeScript | Passed. |
| Approval parser, history, capture identity and real Git/shared-source checks | Passed. |
| `design:source` before and after inspection | Exact commit `7090a036032ce3f225a857b30259a9c91716ac60` and fingerprint `a976830817d848d1263bbbc7f8a101c92c322ce2e369eb4c79c9ce7805bbb85e`. |
| Ten retained capture hashes | All matched. PNG dimensions also match recorded CSS dimensions multiplied by scale. |
| Focused screen matrix | All 132 combinations rendered across three variants, 11 states, two themes and two registered viewport sizes. No horizontal overflow, page/asset errors or blocked native operations. |
| Live approval inspection | A Approved; B/C Draft; history contains the exact decision and pinned source. At 1100x720, the outside-recorded-comparison-states warning is correct. |
| Current interaction assertions | Failed at `app/design-lab/screens/screen-interactions/check.mjs:22`; later assertions did not run. |
| Required full `design:check` | Incomplete. Initial run failed writing Vite config cache through the shared dependency link. A native-config-loader copy required listener escalation and was stopped over imported checks writing shared ignored screenshots. It produced no final report. |

The focused interaction failure is a strict locator violation. The selector
`.siv-error[role="alert"]` matches a visible field-associated error and a hidden
general error. The visible message correctly asks for a whole number. The same
selector also appears in a later assertion. A focused harness correction should
assert the appropriate visible error without changing the approved UI source.
The approved source was not edited to make the check pass.

Terra used Chromium 156.0.8078.80 through the established Playwright fallback.
Earlier shared-preview snapshots had timed out twice. Internal commands, logs,
partial reports and the list of shared ignored outputs written before stopping
remain under `.toolchains/screen-interactions/approval-verification/`. Failed and
stopped runs remain failures. Historical refinement checks are recorded separately
in REFINEMENT.md and do not override this result.

Terra closed its browsers. Both existing servers and the dependency symlink
remain intact. No managed-media review or prototype-review workflow ran. No
production or native/runtime acceptance is claimed.

Verifier task:
<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/thread:delegated-task:command%3Amcp%3Ae42b9b3c-2051-42a2-a013-e11e8f531380%3Adelegate-task%3A63f0a3fb-3d3f-4721-94c4-27025868159e>
