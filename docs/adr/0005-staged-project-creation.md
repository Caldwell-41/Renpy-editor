# ADR 0005: Version-pinned staged project creation

**Status:** Accepted for Phase 1C  
**Date:** 2026-09-14

## Context

Loomlight must create a conventional, runnable Ren'Py project without inventing a
lookalike template or exposing general filesystem/process authority. Creation also
must not merge with or overwrite an existing destination and must not present a
partially generated project as complete.

Ren'Py 8.5.3 documents the launcher CLI command `generate_gui <basedir> --start`.
`--start` creates a new project while the width and height options select its virtual
resolution. This is the version-owned equivalent of the launcher's normal starter
project generation and retains standard screens, options, GUI source, and GUI assets.

## Decision

The exact-version 8.5.3 adapter invokes the SDK launcher project directly with an
argument array:

```text
<renpy launcher> launcher generate_gui <private stage>
  --width <width> --height <height> --start
```

Loomlight invokes this only for its new private, empty staging project. It then
replaces the generated sample entry script with a small deterministic router and adds
Loomlight definitions, Chapter 1 / Scene 1 source, and versioned metadata. The same
8.5.3 adapter compiles and strictly lints the resulting staged scaffold before
finalisation.

Staging uses a private, uniquely named sibling directory on the destination
filesystem. The lifecycle service retains the approved parent identity, revalidates
it and destination absence immediately before promotion, and uses a platform
no-replace directory rename. It never treats an existing empty directory as an
available destination. Recent Projects is updated only after promotion succeeds.
Cleanup requires a matching ownership marker and may remove only that private stage.

Opening a Loomlight project validates metadata and source paths as data. It never
runs Ren'Py. Executing the freshly generated stage during creation is a separate,
bounded trust decision because both the standard template and overlay are controlled
by the selected exact-version adapter and Loomlight.

## Consequences

- Starter behavior stays tied to the pinned SDK instead of a copied template that can
  drift independently.
- Project creation requires a valid supported SDK before generation.
- Directory promotion is one no-replace namespace operation, but Loomlight does not
  claim portable multi-step atomicity or power-loss durability beyond each platform's
  documented filesystem behavior.
- A post-promotion application-state failure is reported as `created_not_opened`; the
  valid final project is retained and never silently deleted.
- Template or CLI changes require a new version adapter and evidence before support is
  expanded beyond 8.5.3.

## Alternatives rejected

- Hand-maintaining a lookalike starter template: it can silently diverge from the
  supported SDK's standard GUI/runtime contract.
- Driving the interactive launcher UI: it is nondeterministic and unsuitable for a
  narrow production adapter.
- Generating directly in the final path: failures and interruptions expose partial
  projects and make safe retry/finalisation ambiguous.
- Reusing Phase 1B existing-file replacement: its invariants and recovery model are
  intentionally replacement-only and do not describe directory creation.
