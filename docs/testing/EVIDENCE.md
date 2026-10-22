# Results, retention and diagnosis

When recording results, follow [brief and evidence ownership](../WORKFLOW.md#task-briefs-and-supporting-files).
For retries or exhausted allowance, follow the [budget policy](../WORKFLOW.md#5-budget-the-problem-not-the-checkpoint-name);
CI and external waits follow [ci-watch selection and manual fallback](../WORKFLOW.md#waiting-without-model-polling).
An available workflow selector does not grant a new attempt.

## Diagnose before correcting

Before correcting a failure or changing its harness, follow
[WORKFLOW diagnosis](../WORKFLOW.md#4-classify-failures-before-fixing) for classification,
failed-layer investigation, [incident lookup](INCIDENTS.md) and index maintenance.
A timeout alone does not establish a slow application, and a passing mock does not
establish native behavior. Keep failed, cancelled, skipped, unrun and passed states
distinct, including cascading prerequisite failures.

## Retain useful evidence on failure

Print failed assertions in the CI job and retain raw logs, partial output, individual
case results, timed-out/unrun states, identity and cleanup. Independent checks can
continue only after their actual prerequisites; their original failure still blocks.
List primary failed stages and dependent unrun checks in the job summary. Report
missing evidence without inventing a cause.

Keep run/workflow/attempt, exact source checkout identity, target architecture,
toolchains, package/test binary hashes and case names. Compare source with Git's
checkout representation (`git cat-file --filters`), including `.gitattributes` CRLF
and preserved mixed-newline fixtures. A docs-only successor is not a new tested app.
For positive qualification, reject missing/duplicate/wrong required cases, zero
discovery, incomplete durations, false cleanup and wrong inner scenario/stage.

Retain produced test binaries independently of test success, including the first
available binary when a later compiler stream fails. Record missing/not-compiled,
compiled, unavailable and retention-failed states. A valid hash manifest alone does
not establish successful tests. Audit the required retained results after terminal CI.

Scan artifacts for privacy/secrets before upload. Use the existing bounded archives,
path/link/entry checks and provenance; no raw keys, owner profiles, private game
content or machine paths belong in Git. Do not bypass the privacy gate merely to
retain a failed run. Preserve explicit reasons when evidence is withheld.

The manual production matrix retains a scanned exact executable on failure where
available, separately from success-only installers, for seven days. Mac bundles use
`Loomlight.app.tar` to preserve executable permissions, symlinks and hidden entries.
Verify archive and contained executable hashes and extract before reuse. Package
manifests distinguish not built, built-but-missing, available and output produced
during a failed package step. Missing/expired artifacts are unavailable evidence,
never permission to backfill old bytes from the current checkout.

The harness-only quality selection retains its host/Python/group results and raw
logs with exact candidate/tree identity for seven days. It qualifies harness logic
only; it produces no application, SDK, native or human evidence.

Current Settings renderer evidence retains four views per theme/size—connection
address, native-entry/Connect controls, response defaults/Thinking and model readback—
for sixteen images. Require visible hit-tested controls, names/dimensions/digests,
stable source and browser/server cleanup. These passive public fixtures do not prove
native key entry or real Studio generation.

## Historical evidence

Detailed attempts stay in linked task evidence; older unsplit archived tasks remain
valid historical lookup destinations. The one-time
[former testing reference](../tasks/archive/2026-10-16-testing-reference.md) preserves
unique mixed historical material from the documentation migration. Its old counts,
commands, selected outcomes and next-step wording are not current instructions.
The incident index retains a concise cause/correction/regression trail even after
external artifacts expire, and links to exact runs and source/task evidence. Do not
claim expired raw artifacts were freshly checked or that a later pass fixes an old
failure retrospectively. Current scope comes from live status and the selected task.
