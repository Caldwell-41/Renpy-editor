# ADR 0022: Save retained Story drafts through the shell

- Date: 2026-11-08
- Status: Accepted design in the Story Combined v1 interview; not implemented.
- Scope: Save in Story with pending beat drafts. Extends ADR 0007 and supersedes
  its non-Source Flush-only rule for this case. Other Save routes and Source
  acceptance rules remain unchanged.

## Context and decision

Story will retain unfinished beat drafts while the author navigates between beats
and branches. The existing main Save command only flushes accepted work outside
Source. Keeping that behaviour would leave those drafts uncommitted after the
author presses Save.

Kris selected Save in Story, by button or Cmd/Ctrl+S, to accept all pending beat
drafts in the open project. Validate all drafts before writing any of them. An
incomplete or invalid draft refuses the request, retains all input and reveals the
failing draft. The author can still Commit one beat separately. The
[UI contract](../UI.md#saving-story-drafts) owns the interaction rules.

Extend the existing shell-owned command coordinator and transaction service.
Capture the project and draft inputs for the request; preserve revision checks,
operation exclusion, stale-completion handling and recovery. A refused Story Save
must not fall through to Flush or report Saved. Unfinished Source text continues
to use its own acceptance route.

Checking all drafts before writes is a validation guarantee. It does not introduce
a filesystem-wide atomicity guarantee or replace the existing transaction recovery
contract. Accepted writes still use the shared source/history owner. The
[Story Undo contract](../UI.md#story-undo) governs user-visible edit ordering; Save
does not create an extra Undo step or clear earlier steps.

## Alternatives and consequences

Keeping Flush-only Save or accepting only the selected beat would leave other
pending Story edits unsaved after the main Save action. Checking and accepting the
whole set adds coordination work, but gives Save an explicit project-wide meaning
within Story. Detailed implementation and qualification remain unselected under
the [interview's release scope](../design/story-revamp/README.md#production-release-scope).
