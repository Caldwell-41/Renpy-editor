# Screens action controls

Which action editor best supports selecting a button, changing its sequence and
applying the result without leaving the existing Screens workflow?

Kris rejected the v1 mocks on 2026-11-05 because they did not follow the Screens
design language. The v1 source and notes are preserved locally under ignored
`.toolchains/screen-interactions/rejected-v1/`. No v1 variant was approved.

The replacement follows principle-experience-first. It mounts the actual
`ScreensWorkspace` through the existing Design Lab frame and imports production
`styles.css`, `ui-refresh.css` and `screen-ui.css`. The existing project navigation,
Screen picker, Choose/Design/Use in Story rail, canvas, element chooser, typography,
layout and inspector remain their existing renderers. Experimental CSS styles
only the new controls and their Lab container. There is no replacement app shell
or approximate palette.

## Compare the options

| Variant | Editing model | Reason to consider it |
| --- | --- | --- |
| `inspector-v2` | Expandable action rows | Scan the sequence and open only the action being changed. |
| `worksheet-v2` | Sequence and one editor | Keep the order visible while editing one action's fields. |
| `workspace-v2` | Directly editable rows | Change several values without expanding or selecting rows. |

All three put actions in the selected button's existing inspector. Text-variable
insertion is beside the real Text editor. Editor-only samples open beneath the
existing canvas. The existing Apply/Cancel row handles the simulated selected
changes. Action drafts survive element selection; invalid, missing, stale and
conflicted cases retain input. Finish stays last, the limit is eight, and editor
selection and samples execute no actions.

The hosted comparison includes an `Existing Screens` option. It mounts the same
renderer and fictional fixture without the proposed controls. This makes the
scope of the changes visible. Other project navigation is inert in the standalone
mock. Existing capabilities outside the selected experiment keep their real app
owners; the mock refuses unsupported service calls instead of reporting success.

## Run and host

From `app/`, run `npm run design:dev` for the registered Lab previews, or
`node design-lab/screens/screen-interactions/export.mjs` for the self-contained
comparison. The export bundles the actual imported CSS and renderer; it does not
substitute a host palette. It writes ignored `comparison.html` and `hosted.html`
under `.toolchains/screen-interactions/`.

Standalone query parameters select `variant=inspector`, `worksheet`, `workspace`
or `reference`, and `state=button`, `text`, `choose`, `panel`, `invalid`, `missing`,
`stale`, `conflict`, `custom`, `component` or `limit`. The visible selectors update
the URL and remount fresh fictional data.

Delivery is the private Tailscale link requested by Kris. The current route and
local serving details live only in ignored `.toolchains/screen-interactions/hosting.json`.
Kris explicitly excluded prototype-review for this replacement. There is no new
recording, managed-media review or phone playback flow. Earlier temporary review
media is historical and retains its existing scheduled expiry.

## Scope and approval

The original tickets are [#47, Display variables and order button actions](https://github.com/Caldwell-41/Renpy-editor/issues/47)
and [#50, Render nested layouts and components faithfully](https://github.com/Caldwell-41/Renpy-editor/issues/50).
All services, edits, history, samples and canvas images here are fictional and
memory-only. The canvas callback draws the existing browser sample; it does not
launch Ren'Py or establish nested-layout fidelity. No project content, SDK,
helper, package, native application or CI is involved.

Real Show/Hide eligibility must use `screens.resolveTarget.canShowHide`, supplied
by `qualified_panel_targets` in parent preparation commit `23fc113`. Panel kind,
`blocking: false` and `effects.unknown` do not establish eligibility. Finish uses
blocking context. Fixtures encode these capabilities explicitly.

Screens `flow-v1`, Components/Help `refined-v1` and Help `inspector-v4` approvals
remain untouched. Kris approved A (`inspector-v2`) on 2026-11-05 with the exact
decision "A is approved". B and C remain drafts. The source commit is
`7090a036032ce3f225a857b30259a9c91716ac60`; the fingerprint and retained capture
conditions are in [approval.json](approval.json). Ticket acceptance remains separate.

## Initial v2 verification

The initial replacement source was uncommitted on `t3/screen-actions-design-prototype`, based on
`6d027be4b473a1f9f60e755e7f1e3ce6d21a8aba`. Its full frontend/Lab fingerprint is
`921e83cf9a1e05d3c0fad0f77a1aa8214b71aa1afbeb496a1f5acc21c1f5bd22`. The standalone artifact SHA-256 is
`fec9468a5194106e1ce1182696a2ecd457dbd05edab031c1165ef7a18d0b8417`.

Pinned Node 24.19.0 TypeScript, approval-record and whitespace checks pass. The
initial v2 Lab matrix passed all 132 cases and its interaction module. Hosted
action editing, Apply/Cancel, insertion and samples passed for all three variants
at 1280x720, 1024x768 and 390x844 with no additional network requests during edits.
Subsequent focused checks covered moving samples below the canvas, a fully visible
commit footer and qualified action choices. After the final toolbar and label
corrections, 12 hosted pages passed with no horizontal overflow or page errors.
The initial canvas geometry matches Existing Screens exactly at both desktop
sizes, and Apply is visible at every checked size.

Two Terra browser passes used the established Playwright fallback after shared
preview snapshots timed out. Sol corrected the small findings and ran the final
narrow check under the two-attempt takeover rule. These are browser checks only.
No prototype-review workflow or new managed media was used. Internal results live
under ignored `.toolchains/screen-interactions/v2-check/`; the final result is
`final-takeover.json`. This does not record approval or product acceptance.

## A/B refinement completed

The baseline and three requested refinement rounds are complete. Neither option
reached 9/10 in every domain; work stopped at the round-three limit. The final
independent Sol 6.1 review narrowly preferred A. [The score record](REFINEMENT.md)
owns every round's scores, changes, remaining findings and exact final source.
A is approved; B and C remain drafts. Current hosted delivery uses the final
round-three source. [The integration handoff](HANDOFF.md) maps the controls to
existing owners and retains the unresolved review findings. No product acceptance
is recorded.

## Approval verification status

The explicit A decision and reproducible reference are recorded. Full promotion
verification remains blocked by an interaction-check locator failure;
[VERIFICATION.md](VERIFICATION.md) distinguishes the passes and incomplete checks.
