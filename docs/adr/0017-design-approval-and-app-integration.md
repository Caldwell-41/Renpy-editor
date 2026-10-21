# ADR 0017: Versioned design approval and app integration

- Date: 2026-10-19
- Status: Accepted workflow. Implementation evidence belongs to the
  [Design Lab task](../tasks/active/browser-ui-design-lab.md).
- Scope: Browser design references and their integration into the live app.

## Context

A mutable preview URL cannot identify the exact design the user approved. Shared
styles can change both a mockup and the app during implementation, hiding a visual
regression. A mockup's successful Save action can also be an in-memory simulation.
Agents need a stable design reference and separate proof of working app behaviour.

## Decision

Each runnable screen has one approval record under `docs/design/`. Its ordered
revisions identify drafts, explicit user decisions, source versions, retained image
captures, agreed behaviour and stated reasons for replacement. The current pointer
names the latest approved revision. Earlier approved entries remain intact; their
supersession follows from the next approval. The lab derives its labels from this
record. Before the first approval, the pointer is null.

Only an explicit user decision promotes a particular version. Promotion updates the
design reference. App implementation proceeds within the selected task's existing
authorisation; design-only work gains no implementation scope from promotion.
Implementation progress stays in the owning task, separate from design approval.

Pin a local Git source commit and a SHA-256 fingerprint of the frontend/lab inputs,
including shared styles, icons and dependency/configuration inputs. Retain reviewed
captures with their hashes, sample state, theme, dimensions and display scale.
The lab flags source changes and refuses to render a changed approved version as
the approved reference. Use a separate checkout of the pinned source for comparison
while changing the app. Approval metadata and captures can be added after that source
commit without changing its source fingerprint.

The implementing agent maps every control to its real operation and expected result,
reuses existing functionality, and builds missing features only within agreed
behaviour and task scope. Production controls use the application controllers and
transaction layer. Fictional fixtures and simulated callbacks remain in the lab.

Compare lab and app under matching conditions, repair visual differences, and
separately verify real user journeys. Minor implementation spacing/sizing adjustments
remain within existing authorisation. Changes to navigation, behaviour or material
layout require the user's decision. Preserve correctness while resolving conflicts.

## Consequences and alternatives

One workflow ADR and per-screen approval histories keep policy separate from design
choices. A new ADR is appropriate when this workflow changes; a design promotion is
recorded in its screen history. Earlier image/written approvals retain their existing
authority until explicitly replaced. Recreating one as a runnable draft does not
itself approve that recreation.

Source fingerprints are conservative: unrelated frontend edits can require a separate
comparison checkout. This costs setup but keeps the reference independent of app work.
The lab remains read-only; an agent records conversational approval in the repo.
Automatic promotion, a browser file-writing service and screenshot similarity scores
would add mechanisms without establishing human approval or functional correctness.

## References

Follow the [integration procedure](../../app/design-lab/INTEGRATION.md) for promotion
and implementation. [TESTING](../TESTING.md) owns product proof. Existing visual
precedence and comparison guidance remain in the [UI references](../design/ui-refresh/README.md).
