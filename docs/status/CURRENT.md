# Current status

## CI harness reliability — implementation in progress

Updated2026-10-16. The [selected maintenance](../tasks/active/ci-harness-reliability.md)
implements the approved documentation/incident index, symmetric development-host/CI
routing and focused harness safeguards on `codex/phase3a-story-logic`. Local checks/review pass;
focused both-host harness proof is pending. This selects no app package, native
launch, provider request, dependency update, merge or release. Prior Thinking/native
allowances and the protected walkthrough remain separate; recovery is in HANDOVER.

## Thinking and connection setup — CI verified; dependency finding open

Updated2026-10-16. The [selected outcome](../tasks/active/phase-2-initial-llm-assistance.md#thinking-settings-and-full-workflow--selected-2026-10-16)
implements Thinking on by default, response16384 and Name → Endpoint/private HTTP →
native key → Connect → model → Save. Existing response limits persist; keys remain
native-owned and reasoning stays separate. Full native/real Studio proof is pending.
Branch is `codex/phase3a-story-logic`; qualified implementation candidate
`36feff12ff9acfc1cd6eb0832da3abba243b9463`, with documentation-only successors.

[CI3 run38853421609](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38853421609)
passed both hosts, attempt1, completed2026-10-16T05:06:23Z. The [terminal audit](../tasks/active/phase-2-initial-llm-assistance.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16)
verified both archive digests, all52 manifest entries/53 files per host,351 material
source inputs per host, all four retained test binaries and16 Settings captures per
host. No selected step was skipped/cancelled. Seven unselected jobs were excluded.

Windows passed208 renderer,75 Rust and186 Python cases (four Mac-only exclusions).
Mac passed208 renderer,73 Rust and184 Python cases (two Windows-only exclusions).
Both repaired Windows Settings fixtures executed and passed. Retention fixtures
passed9 plus one POSIX-only exclusion on Windows and10 on Mac. Q1, build, source,
privacy and independent outcome gates passed. The two earlier failures stay retained
and charged; cumulative paired CI is3/3, with no further run selected.

One separate dependency finding remains open: npm reports high-severity
[source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) for1.2.1
through the Vite/PostCSS development dependency chain;1.2.2 is the published fix.
The selected CI is not a zero-advisory gate. No dependency update or runtime-exploit
claim was made during this audit. Other warnings are bundle-size/deprecation/test-code
advisories. Application/test inputs remain unchanged from the qualified candidate.

Native allowances remain packages1/2 (first stale), launches0/2, live0/4,
output0/65536 and cached loads0/1. A fresh matching signed package and observed user
unlock/close precede native verification. Leave their protected window to them.

## Paused walkthrough and retained baseline

The [walkthrough](../tasks/active/phase-3-initial-wysiwyg-release.md#restarted-combined-phase-2--3a-guided-walkthrough--2026-10-16)
remains paused at Step3 with separate budgets/recovery files. Phase2/3A human acceptance
is pending. Prior model-load and synthetic-comparison allowances stay closed.
[HANDOVER](HANDOVER.md) owns continuation and recovery. No merge/release.
