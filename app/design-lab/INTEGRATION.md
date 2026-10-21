# Approve a design and build the app

Read this procedure before promoting a draft or implementing an approved layout.
[ADR 0017](../../docs/adr/0017-design-approval-and-app-integration.md) owns the workflow.
The screen's `docs/design/.../approval.json` owns lab approval history. The selected
task owns implementation scope, progress and acceptance.

## Record an approval

1. Identify the exact screen, revision and layout the user selected. Read its existing
   design decisions and the user's explicit approval. Resolve ambiguity before promotion.
   Existing image/written approvals remain valid until explicitly replaced; preserve
   their links and corrections when establishing a runnable successor.
2. Preserve the reviewed candidate source in a local commit, including its draft
   approval record. Keep unrelated work separate. From `app/`, run:

   ```sh
   npm run design:source
   ```

   The command returns a full `commit` and `fingerprint` only when the frontend/lab
   code and assets match that commit. It includes shared production styles/icons and
   dependency/configuration inputs. Documentation edits can remain uncommitted.
   Stop promotion if the reviewed source cannot be reproduced; recover that candidate
   or obtain approval of the revised draft.
3. Retain the reviewed screenshots under the screen's design directory, with versioned
   filenames. Capture the important states, themes and dimensions, including compact
   layouts where supported. Record each image's SHA-256, state ID, theme, CSS width and
   height, and display scale. The runner's ignored screenshots are temporary outputs;
   preserve the chosen captures before another run replaces them.
4. Fill the candidate revision's `approval` in the owning JSON record. Use the
   [typed record](approval.ts) for fields. Record the date, precise user decision,
   stated reason or null, source identity, captures, agreed behaviour and known agreed
   deviations. `supersedes` names the previous current revision, or null for the first
   lab approval. For a legacy predecessor, identify its owning record in the decision.
   Set `currentApproved` to this revision. Keep previous approval entries unchanged.
5. Run `npm run design:check`. Inspect the selected version in the lab. The current
   approved pointer, labels, history, captures and source identity must agree. An
   unapproved starter remains a draft. A new experiment gets its own revision and
   variant ID; approved source is preserved rather than edited to match later work.

Promotion finishes when an explicit user decision identifies a reproducible version
and the record/checks agree. It does not mark the feature implemented. An agent
already authorised to implement can proceed; a design-only task ends at its own bound.

## Implement the approved layout

1. Read the selected task, current approved record, captures and written corrections.
   State the target revision and covered states in the task. A changed source or an
   uncovered state must be identified before claiming a match. If there is no approved
   runnable version, establish it through the approval steps; preserve any earlier
   design authority during that work.
2. Account for every visible control and existing capability in a compact task map.
   For each, identify the real operation, expected observable result, and any missing
   implementation. Inspect existing controllers and core services before creating
   another implementation. A button's presence alone does not define a new feature's
   behaviour. Bring genuinely new capabilities or conflicting requirements to the user.
3. Reuse presentation code where useful and wire production controls to the existing
   app operations. Keep lab fixtures, native substitutes, sample success responses and
   in-memory Save workflows in the lab. Preserve validation, draft retention, undo/redo,
   external-edit handling, recovery and source preservation through their existing owners.
4. Launch the lab at the recorded source version and the working app through the
   selected task's supported route. Use a separate comparison checkout when the app's
   changes affect the source fingerprint. Copy the current approval record and retained
   captures into that checkout if they were recorded after the source commit; keep its
   frontend files pinned. Avoid resetting the active implementation checkout. With
   pinned tools/dependencies available, a second lab can use:

   ```sh
   npm run design:dev -- --port 5175
   ```

   The full source fingerprint intentionally catches even unrelated frontend changes.
   A "source changed" warning calls for the pinned reference, not a new approval flag.
5. Compare identical content/state, theme, content viewport, display scale and scroll
   position using disposable public test data. Match hierarchy, panel placement,
   typography, colours, spacing, sizing, scrolling and responsive behaviour closely.
   Capture both versions, fix material differences, and compare again after relevant
   changes. Record minor adjustments and platform rendering differences in the task.
   Bring material layout/navigation/behaviour changes to the user with the smallest
   proposed correction. Keep the approved reference intact during this iteration.
6. Verify the real operations through [TESTING](../../docs/TESTING.md) and the task's
   selected gates. Exercise changed actions through actual app services and retained
   data, including relevant save/reopen, cancellation, validation and failure cases.
   Check required desktop behaviour and CI during product implementation. Report a
   missing capability or failed required check as missing/failed proof.

Finish with two explicit findings: visual fidelity to the named approved version,
including remaining differences, and functional correctness of all mapped actions.
Required evidence and any user acceptance must meet the owning task's criteria before
calling that implementation complete. Browser similarity cannot establish durable saves.
