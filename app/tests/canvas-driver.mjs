import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

// Compile before creating a fixture, so an old local executable cannot supply evidence.
export function buildCanvasDriver() {
  const result=spawnSync('cargo',['build','-p','loomlight-core','--release','--example','canvas-controller-driver','--locked'],{stdio:'inherit',timeout:180000});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error('Canvas controller driver build failed. No fixture was started.');
  return resolve(`target/release/examples/canvas-controller-driver${process.platform==='win32'?'.exe':''}`);
}
