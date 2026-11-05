# A/B refinement scores

Three requested refinement rounds are complete. Neither option reached 9/10 in
all four domains. Work stopped at the round-three limit. The final independent
review narrowly preferred A. Kris subsequently approved A on 2026-11-05 with
"A is approved". B remains a draft.

Kris requested independent Sol 6.1 scoring with principle-experience-first. The
baseline is separate from the three refinement rounds. Every scoring pass received
the same domain definitions, fixed source, current PNGs and neutral Terra browser
observations. Each pass used a new independent Sol 6.1 task without earlier grades.
Scores are reviewer judgments, not user approval or product acceptance.

| Round | Option | Design | Ease of use | UX | UI |
| --- | --- | ---: | ---: | ---: | ---: |
| Baseline | A | 8 | 7.5 | 7 | 7.5 |
| Baseline | B | 7 | 6.5 | 6.5 | 7 |
| 1 | A | 8 | 7.5 | 8 | 7.5 |
| 1 | B | 8.5 | 8 | 8 | 7.5 |
| 2 | A | 8 | 8 | 8 | 8 |
| 2 | B | 8.5 | 8 | 8 | 8 |
| 3 | A | 8.5 | 8.5 | 8 | 8.5 |
| 3 | B | 8.5 | 8.5 | 8 | 8 |

## Changes by round

1. Compact horizontal tools, stable action identity and focus, live summaries,
   inline B editing, and field-associated errors that reveal the invalid input.
2. Add action above the sequence, one open A editor, wider errors, larger tools
   with more space before Remove, and clear last-valid-value feedback for samples.
3. Keyboard focus in new actions, visible summaries after repeated moves, compact
   A disclosures, B overview/collapse with retained drafts, and native text-range
   replacement for variable insertion.

## Remaining findings

Both options lack local recovery for a removed action within a pending draft;
Cancel restores the whole saved draft. The final reviewer also identified uneven
integer-input/select heights. A needs a clearer indication that more actions are
below the visible desktop sequence. B's phone summary wraps earlier because its
tools occupy more of the row. These findings remain open; no fourth refinement
was performed.

## Source and evidence

The reviewed source is pinned locally on `t3/screen-actions-design-prototype` at
`7090a036032ce3f225a857b30259a9c91716ac60`. The final frontend/Lab fingerprint is
`a976830817d848d1263bbbc7f8a101c92c322ce2e369eb4c79c9ce7805bbb85e`.
The final hosted artifact SHA-256 is
`962252fbd2d14e5937cc6f02206f46afe40b9a58f4eef582c32577f4bf21e18d`.

Pinned Node 24.19.0 TypeScript, approval-record and whitespace checks pass.
Each round has fixed source and hosted HTML snapshots, captured pixels and neutral
browser results under ignored `.toolchains/screen-interactions/refinement/`.
Round three retained 40 captures and focused observations of focus, repeated moves,
overview state, text replacement, invalid samples and errors. The first sandboxed
Chrome launch failed; the unchanged script passed with the authorized escalation.
The failure receipt remains in that round's directory. These checks start no SDK,
helper, package, native application or CI, and establish no real source/runtime
acceptance. No prototype-review workflow or new managed media was used.

The approved A references are retained in `captures/inspector-v2/` with hashes,
conditions and provenance notes in its manifest. The approval record contains no
user-stated deviations; the remaining findings above are not acceptance waivers.

The private Tailscale route remains the delivery location. Exact serving metadata
stays in ignored `.toolchains/screen-interactions/hosting.json`. The existing root
Tailscale service is preserved.

Baseline source fingerprint: `921e83cf9a1e05d3c0fad0f77a1aa8214b71aa1afbeb496a1f5acc21c1f5bd22`.

<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/thread:delegated-task:command%3Amcp%3Ae42b9b3c-2051-42a2-a013-e11e8f531380%3Adelegate-task%3Ac2258bcf-377e-4563-a319-83440dbe090b>

Round 1 source fingerprint: `a6c05b6b9236d4979dcad2a5b2bdbcc8ae8d0c074e2798e200486008df6b3a61`.

<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/thread:delegated-task:command%3Amcp%3Ae42b9b3c-2051-42a2-a013-e11e8f531380%3Adelegate-task%3A5a7ed6c8-ab32-40f6-b151-7d378813dd64>

Round 2 source fingerprint: `f48d22fef6cee6df00961cc63575af861f38041b5de55d24e401614b38b621ca`.

<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/thread:delegated-task:command%3Amcp%3Ae42b9b3c-2051-42a2-a013-e11e8f531380%3Adelegate-task%3A3aaeb627-e538-4906-8fa2-dab770067587>

Round 3 source fingerprint: `a976830817d848d1263bbbc7f8a101c92c322ce2e369eb4c79c9ce7805bbb85e`.

<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/thread:delegated-task:command%3Amcp%3Ae42b9b3c-2051-42a2-a013-e11e8f531380%3Adelegate-task%3A64487943-d63a-4c1e-8b75-c7505f994e50>
