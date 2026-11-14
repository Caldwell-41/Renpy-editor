// The assembled Story release journey, then the Story controls it leaves out, on the
// public example project (tests/fixtures/story-example): actual Story, Source and header controls ->
// story-controller-driver --seed example -> ApplicationHost. No SDK, package or native claim.
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {qualifyStoryController} from './story-controller.dispatch.mjs';
import {RELEASE_JOURNEY,STORY_CONTROLS} from './story-controller-cases.mjs';

const driver=resolve(process.env.CARGO_TARGET_DIR??'target','debug/examples/story-controller-driver'+(process.platform==='win32'?'.exe':''));
await qualifyStoryController(driver,{output:process.env.STORY_RELEASE_OUTPUT??join(tmpdir(),`story-release-${randomUUID()}`),
 caseModule:fileURLToPath(new URL('./story-controller-cases.mjs',import.meta.url)),seed:'example',cases:[RELEASE_JOURNEY,STORY_CONTROLS]});
