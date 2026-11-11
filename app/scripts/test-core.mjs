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
const args = [
  'test', '-p', 'loomlight-core', '--locked', ...process.argv.slice(2),
  '--', ...skipped.flatMap(name => ['--skip', name]), '--exact', '--nocapture',
];
const {status, error} = spawnSync('cargo', args, {stdio: 'inherit'});
if (error) throw error;
process.exit(status ?? 1);
