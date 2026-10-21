# Full-app layout comparison

The 2026-10-20 outcome extends the Characters comparison across the app. Each page
has its own subagent, two layout alternatives and shared fictional content within
that pair. A final Characters subagent applies the same review standard to Writing
and Game setup. The [gallery](http://127.0.0.1:5174/catalog.html) lists registered
drafts and links to the interactive previews.

The [owning task](../../tasks/active/browser-ui-design-lab.md#full-app-comparison-and-characters-refinement-2026-10-20)
records scope, cumulative verification and failures. Individual page notes account
for existing capabilities, explain control placement and identify simulated actions.
All records remain unapproved. Earlier approved references retain their authority.

## Page comparisons

| Page | Layouts | Design and behavior notes |
| --- | --- | --- |
| Home | Return desk, Project shelf | [Home](../design-lab-welcome/README.md) |
| New project | Paced wizard, Setup sheet | [New project](../design-lab-new-project/README.md) |
| Story | Manuscript desk, Stage & sequence | [Story](../design-lab-story/README.md) |
| Source | Docked workbench, Focus editor | [Source](../design-lab-source/README.md) |
| Branches | Story atlas, Route desk | [Branches](../design-lab-branches/README.md) |
| Characters | Continuous dossier, Writing board | [Characters](../design-lab-characters-writing/README.md) |
| Lorebook | Project manuscript, World & tone desk | [Lorebook](../design-lab-lorebook/README.md) |
| Assets | Library shelves, Preview desk | [Assets](../design-lab-assets/README.md) |
| Variables | Definition ledger, Definition notebook | [Variables](../design-lab-variables/README.md) |
| Settings | Settings book, Control desk | [Settings](../design-lab-settings/README.md) |
| Runtime & diagnostics | Run desk, Diagnostic console | [Runtime](../design-lab-runtime/README.md) |
| Studio request | Request console, Request desk | [Studio request](../design-lab-studio-request/README.md) |

## Experience principles supplied by the user

Every page agent receives this text in its assignment:

> When implementation convenience conflicts with user delight, choose delight.
>
> - Every feature, control, and option must be justified
> - Ship less, ship better (polished experience with three features beats rough one with ten)
> - Prototype before committing (design decisions are cheaper in throwaway HTML than production code)
> - Get the details right (transitions, alignment, spacing, feedback, error states)
> - Tighten the core loop (every feature should serve the central workflow or get out of the way)
>
> The user is whoever consumes the work. For a UI that is the end user. For a library or an internal API it is the colleague who imports it. The engineer who maintains the code next is a user too. Weigh their experience the same way, and explain impact from their perspective.
>
> Foundations should serve the experience. Foundational thinking governs the *sequence* of work. This principle governs the *target*.

For these prototypes, that means making the page's main task direct, putting less-used
options behind labelled controls, and preserving the existing capability rather than
silently deleting it. Page notes explain the writer's benefit and the next maintainer's
cost. The alternatives remain candidates for user comparison, with no automatic choice.

## Simulation boundary

The lab uses production presentation assets and fresh fictional state. Saves, source
changes, imports, credentials, model requests, SDK installation and execution controls
are browser simulations. No local project or provider operation occurs. Changing a
preview or reloading resets its sample; individual pages retain drafts within their
own simulated workflow. The common navigation warns before leaving a dirty sample.

Approval and later implementation follow
[ADR 0017](../../adr/0017-design-approval-and-app-integration.md) and
[INTEGRATION](../../../app/design-lab/INTEGRATION.md). Browser checks establish sample
rendering and interaction. Production behavior needs its own implementation and proof.

## Verified for review, 2026-10-21

The final combined check passes TypeScript, approval/source validation, 448 rendering
cases and 19 check groups on the local Mac. All 12 app pages have two layouts; the
starter remains available. Every registered state was rendered in light/dark at
1100×720 and 560×640. Each page's interaction journey and the shared gallery/navigation,
approval history, native/network refusal and production-build exclusion checks pass.

The final report and captures are ignored under `.toolchains/design-lab/`. Page notes
separate earlier page reports from final corrections proved by this combined run.
The owning task retains the initial live-reload interruption and passing rerun.
These layouts were published before the Phase 3B branch and remain unapproved.
The separate [Screens comparison](../design-lab-screens/README.md) adds three
candidates and owns its incomplete newer verification. The protected native app
was not touched. Use the Design Lab README to restart the gallery for comparison.
