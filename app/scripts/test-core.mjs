// The broad loomlight-core suite that PR CI, the Phase 1 production gates and
// local checks all run. From app/: `npm run test:core [-- <cargo test options>]`.
// Options such as --release go to cargo before the test-binary arguments.
// The exact skips below are the observed-flow timing gate and the two official SDK
// gates; their own workflow steps run them.
import {spawnSync} from 'node:child_process';

const skipped = [
  'scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges',
  'lifecycle::tests::official_sdk_phase_1c_target_gate',
  'renpy::reconciliation_tests::official_sdk_download_handoff_target_gate',
];
// Linux is a development host only (PR CI); these assert Windows/macOS behavior.
const linuxSkipped = {
  // Cooperative canvas finish is unsupported on Linux (renpy/runtime/platform.rs).
  'lifecycle::canvas_tests::canvas_render_joins_a_timed_out_helper_before_replacement': 'no cooperative canvas finish',
  // ext4 often reuses a deleted file's inode, so case 4's delete-and-rewrite with
  // identical bytes can keep the same (dev, inode, sha256) revision.
  'rewrite::tests::generated_card_cancel_stale_competing_draft_external_source_metadata_approval_zero_writes': 'inode reuse',
  'rewrite::tests::generated_lore_cancel_stale_competing_draft_external_source_metadata_approval_zero_writes': 'inode reuse',
};
if (process.platform === 'linux') {
  for (const [name, reason] of Object.entries(linuxSkipped)) {
    console.log(`SKIP on linux ${name}: ${reason}`);
    skipped.push(name);
  }
}
const args = [
  'test', '-p', 'loomlight-core', '--locked', ...process.argv.slice(2),
  '--', ...skipped.flatMap(name => ['--skip', name]), '--exact', '--nocapture',
];
const {status, error} = spawnSync('cargo', args, {stdio: 'inherit'});
if (error) throw error;
process.exit(status ?? 1);
