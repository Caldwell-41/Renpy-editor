# Current outcome handover

## Manual reference library: prepared, awaiting A/B UI selection

Continue this same outcome on Caldwell-41/Renpy-editor,
`codex/provider-qualification`, using one serial Local Mac ARM64 owner and zero
subagents. Entry inspection found the checkout clean at published
**`54f562d5d3721595b2f8d7c5ed0454e9cd297a5f`**; refreshed remote refs matched. The unrelated
planning worktree is untouched. No reset or new worktree was needed.

The user selected manual card/lore creation, editing, approval and organization with
coherent Undo/Redo and lossless save/reopen. Read the
[owning selection/acceptance](../tasks/active/phase-2-initial-llm-assistance.md#manual-reference-library-selection--2026-10-09),
[concrete v1 contract](../REFERENCE_LIBRARY.md), Phase 2 sections 9/10/11/19/20,
ADR 0011 and applicable UI/WORKFLOW/TESTING guidance. Public fixtures are in
`app/tests/fixtures/reference-library/`: valid empty and approved-card/proposed-replacement
with lore/extensions/missing links, unsupported newer version, deliberately malformed data.
No reference service, dispatch or editor is implemented yet.

**User decision:** UI implementation must wait for the user's A/B approval.
[Saved design review](../design/manual-reference-library/README.md) contains light/dark
images: A keeps a list beside the editor; B opens a full-width editor from the list.
Recommendation is A; neither is approved. The user requested images after being unable
to see the inline preview. These are design mockups, not production acceptance.
An isolated headless preview rendered both layouts/themes and 390 px without script
errors/overflow. Initial sandboxed Chrome launch failed (SIGABRT); approved sandbox
escalation resolved the rendering capability and closed the browser.

**Next work:** after layout selection, implement shared core schema/validation/records,
typed dispatch and existing transaction/history integration. Existing
`AuthoringService::commit_history` and the shared project history own metadata changes;
do not introduce a separate card/lore Undo stack. Establish real UI-dispatch-metadata
save/approve/readback early, then expand focused rejecting/lifecycle/external-edit
coverage and native keyboard/focus/narrow/both-theme checks. Preserve approved text
while reviewing a replacement and unknown nested fields; malformed/newer bytes must
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
