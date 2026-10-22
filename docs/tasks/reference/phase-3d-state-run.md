# Phase 3D state and Run From Here requirements

Read for state inspection or reconstructed-start implementation/acceptance. This is
planned scope. It consumes the qualified Story, Screens and Timeline contracts and
must refuse unsupported state. Select a bounded outcome before implementation;
this reference grants no launch or test allowance. The
[phase brief](../active/phase-3-initial-wysiwyg-release.md) owns entry conditions.

<a id="6-3d--supported-state-and-run-from-here"></a>

## 6. 3D — Supported state and Run From Here

Represent defaults, selected route decisions, supported assignments, call context,
presentation/audio state and source revisions with provenance. Distinguish computed
supported state, a recorded/saved route and explicitly synthetic manual input. A saved
snapshot is usable only under a proven compatibility rule; otherwise it is stale.

Select one bounded route and target, account for repeated visits and branch decisions,
and show unresolved prerequisites. Unknown Python, dynamic control flow, unsupported
effects, ambiguous call stacks and incompatible revisions block the affected launch
claim. Manual values remain visibly synthetic and cannot erase unknown runtime side
effects. The first launch subset may be Scene boundaries with no active call stack;
that restriction must be explicit before implementation, not discovered at acceptance.

**Screen interactions (selected 2026-10-07):** a selected Scene route does not establish
which screen buttons were clicked during dialogue. Consume 3B's effect summaries as
well as 3A/3C semantics. When an available screen action could change relevant variables,
presentation or control flow and the chosen trace cannot establish its effects, mark
the affected state unknown and refuse the reconstructed launch with a specific reason.
Manual value overrides cannot remove this uncertainty. Full screen-interaction capture
and replay are deferred; they are not needed to complete this conservative subset.

Do not block every route merely because a screen exists. Qualified conventional
say/choice adapters can use their established interaction semantics and selected choices;
proven passive screens introduce no extra state uncertainty. Include relevant screen,
component/action and binding revisions in the launch read set so changes invalidate
prepared starts. Where possible effects or active-screen identity cannot be bounded,
refuse rather than silently assume the default templates or no interaction.

The focused gate includes a screen button that sets a branch variable during dialogue:
the initial reducer must report uncertainty and reject that reconstructed start without
launching. Also prove a passive/qualified conventional screen remains eligible, and a
screen/action edit invalidates a prepared launch. Existing normal-play equivalence
checks still apply to eligible starts; no full interaction recorder is required.

**Completion checks:** compare a normal play-through and a supported start at the
same target for relevant variables, route, return behavior and presentation. Change
a prerequisite revision and verify invalidation. Custom effects refuse or expose
an explicitly limited mode without claiming reconstruction. Stop/cancel/session-switch
behavior reuses runtime ownership, and saves/profile data stay isolated from ordinary
play. Development harness files must be absent from distributable game output.

**Early risk proof:** establish one normal-run versus reconstructed-start equivalence
case with the real SDK. Reassess the proposed subset if this cannot be demonstrated;
do not substitute a label warp for that evidence.

<a id="implementation-plan-3"></a>

### Implementation plan

**Recommended first launch contract:** Scene entry with an empty call stack and
settled supported presentation. Compute state along a finite author-selected route;
do not infer a route from the Branches layout. After this works, extend only to proven
stable Beat boundaries with the same stack/timing constraints. The UI states which
points are available. A label/Beat that requires unknown Python or an active unsupported
effect remains unavailable for a reconstructed launch; normal Run remains available.

| Step | Concrete implementation | Proof before proceeding |
| --- | --- | --- |
| 3D.1 — Shared trace/state reducer | Add proposed core `state` service over the 3A source-derived structure, 3B screen effect summaries and 3C effect descriptors. Track typed values, selected choices, bounded call frames, presentation/audio descriptors and exact read revisions. Every value is known-with-provenance or unknown-with-reason. | A deterministic selected trace matches expected guarded branches and returns; repeats consume a finite step/depth budget. Unresolved screen interactions and unsupported custom effects invalidate potentially affected state conservatively; screen-dependent starts refuse while qualified passive/conventional cases remain eligible. No project code runs during inspection. |
| 3D.2 — State inspector | Show target, route decisions, current values, source citations and blocking unknowns, including unresolved screen actions. Offer a separate synthetic preset for explicit manual values; it is labelled synthetic rather than proven reachable. Saved presets persist only typed data/references and invalidate on relevant edits. | Change a supporting variable, card-independent source revision, screen/action/binding, asset or route and reject the stale prepared launch. Manual values do not clear unknown screen effects. Context references/lore never silently become runtime values. |
| 3D.3 — Isolated launcher | Extend the shared explicit preview/runtime job to copy an accepted manifest into a scratch project, exclude saves/cache/editor-private files, and generate a collision-checked bootstrap label. Apply typed state via safely emitted Ren'Py statements, restore the declared settled visuals/audio, and jump to the target. Bind trust and preparation to snapshot/target/state digest. | Compare with normal play at the same target; source project and ordinary saves/persistent data are untouched; cancellation, launch failure, stale completion and Stop clean up the owned process and retain useful diagnostics. |
| 3D.4 — Bounded entry extension | After Scene-entry proof, add a temporary target label at a proven statement boundary in the scratch copy only. Support resolved prior calls that have already returned; launching with an active call stack stays excluded until a separate reconstruction design is proven. | Normal-run versus reconstructed-run values, available choices, return behavior and settled presentation agree for each supported target; unsupported targets refuse rather than partially pretending success. |

Proposed bootstrap mechanism is the documented `config.label_overrides` mapping for
`start` in the scratch project only; qualify it against the pinned SDK and existing
runtime policy. Refuse incompatible existing label overrides/init behavior rather
than overwrite it. The fixture must prove a separate save directory/persistent scope,
translation/font/assets inclusion and no startup-script side effects on the real project.
Ordinary same-user executable trust still applies; scratch execution is not a security
sandbox for arbitrary project Python. No Python object/pickle snapshot loading.

For a looped background track, distinguish restoring the selected clip from preserving
its exact playback position. Synthetic restart-at-beginning is explicit; when matching
timed continuity matters and cannot be reconstructed, the target is unsupported. Known
asset identity alone does not establish elapsed animation/audio time.

Do not implement this with raw `--warp`: Ren'Py documents path/state limitations and
skipped Python execution. Keep warp only as a separately labelled diagnostic candidate,
not this feature's correctness mechanism. Normal Run/Validate policy remains unchanged.

Ren'Py basis: [warp limitations](https://www.renpy.org/doc/html/developer_tools.html#warping-to-a-line)
and [label overrides](https://www.renpy.org/doc/html/config.html#var-config.label_overrides).
