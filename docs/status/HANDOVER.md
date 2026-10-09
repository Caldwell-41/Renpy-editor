# Current outcome handover

## Manual reference library: prepared, awaiting A/B UI selection

Continue this same outcome on Caldwell-41/Renpy-editor,
`codex/provider-qualification`, using one serial Local Mac ARM64 owner and zero
implementation subagents. One explicitly user-requested research-only subagent
completed comparable-app/UI research without writing files or further delegation.
Entry inspection found the checkout clean at published
**`54f562d5d3721595b2f8d7c5ed0454e9cd297a5f`**; refreshed remote refs matched. The unrelated
planning worktree is untouched. No reset or new worktree was needed.

The user selected manual card/lore creation, editing, saving and organization with
coherent Undo/Redo and lossless save/reopen. Read the
[owning selection/acceptance](../tasks/active/phase-2-initial-llm-assistance.md#manual-reference-library-selection--2026-10-09),
[concrete v1 contract](../REFERENCE_LIBRARY.md), Phase 2 sections 9/10/11/19/20,
ADR 0011 and applicable UI/WORKFLOW/TESTING guidance. Public fixtures are in
`app/tests/fixtures/reference-library/`: valid empty and approved-card/proposed-replacement
with lore/extensions/missing links, unsupported newer version, deliberately malformed data.
No reference service, dispatch or editor is implemented yet.

**User decision:** UI implementation still awaits the requested A/B layout selection.
The first images were rejected as messy and unnecessarily bureaucratic. The user
explicitly replaces manual approval/rejection/supersession with ordinary Save updates,
and asks for clear action effects and better creation placement. Fields are now directly
editable; no Edit unlock. Save changes makes authored text current internally through
one transaction; Discard changes restores saved form text. Internal status/revision
storage remains for future generated review without a manual toolbar. Stale/missing
citations stay intact and no longer refuse a manual prose Save.

[Revised design review](../design/manual-reference-library/README.md) contains v2
light/dark images: A is Browse and write (list beside form), B is Focused writing
(list opens a wider form). New character card / New lore entry is at workspace top.
Both themes, lore, direct editing/Save/Discard and 390 px browse-to-form return were
checked in the preview without script errors/overflow. No production/native acceptance
is claimed. Initial v1 sandbox-render failure remains historical; v2 isolated rendering
used the known approved route and closed the browser.

**Next work:** after layout selection, implement shared core schema/validation/records,
typed dispatch and existing transaction/history integration. Existing
`AuthoringService::commit_history` and the shared project history own metadata changes;
do not introduce a separate card/lore Undo stack. Establish real UI-dispatch-metadata
save/readback early, then expand focused rejecting/lifecycle/external-edit
coverage and native keyboard/focus/narrow/both-theme checks. Preserve saved text/history and internal revision/status data and unknown nested fields; malformed/newer bytes must
stay intact. Metadata prose stays out of diagnostics and game distributions.

**Budget:** selected Mac **0/2 package builds, 0/3 app launches**; Windows
**0/2 builds, 0/3 launches**, cumulative across chats/handoffs. Reserves need diagnosed
failure and recorded correction; resolve ambiguous dispatch before retry and reassess
after two unsuccessful corrections of one hypothesis. Browser mockups are not app
launches. Prior request evidence/budgets remain unchanged, with historical Mac
1 build/2 launches and Windows 8 builds/15 launches. No credentials/endpoints changed.

Finish available Mac implementation, focused verification, review and in-scope fixes.
Commit scoped work locally and ask before pushing the concrete reviewed result. Only
then provide a Windows pull-and-continue prompt for this same outcome and branch.
No direct other-host execution or second writer. Both-target evidence remains required;
do not return a distinct next-feature prompt or claim full 2B.1/Phase 2 completion.
Preparation is local-only. No owned app/server/fixture process is pending. Disposable
preview rendering did not open a game or touch provider/credential state.

Prior Windows request acceptance and focused Mac recheck are published at the entry
continuation. Their owning records retain detailed failures, native proof and cleanup;
reuse unchanged evidence without rerunning request/credential scenarios. Generation,
provider/network, prompt/context/payload, proposal application, runnable source,
import/export, injection/retrieval, runtime inference, installation/security, CI,
merge/release and next-feature work remain excluded.
