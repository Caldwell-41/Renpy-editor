// Run every tests/*.browser.mjs and tests/*.dispatch.mjs fixture once, from app/.
// A new fixture runs by default. To opt out, put `// fixture: skip <reason>` in
// its first five lines; the reason is printed on every run.
// Expects `npm run build:tests` and `cargo build -p loomlight-core --examples`.
import {readdir, readFile, mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';

const tests = resolve('tests');
const output = resolve(process.env.FIXTURE_OUTPUT ?? join(tmpdir(), `loomlight-fixtures-${randomUUID()}`));
const names = (await readdir(tests)).filter(name => /\.(browser|dispatch)\.mjs$/.test(name)).sort();
const results = [];

function run(name, env) {
  return new Promise(done => {
    const child = spawn(process.execPath, [join('tests', name)], {env, stdio: ['ignore', 'pipe', 'pipe']});
    let log = '';
    child.stdout.on('data', chunk => { log += chunk; });
    child.stderr.on('data', chunk => { log += chunk; });
    const timer = setTimeout(() => child.kill('SIGKILL'), 300_000);
    child.on('close', (code, signal) => { clearTimeout(timer); done({code, signal, log}); });
  });
}

for (const name of names) {
  const source = await readFile(join(tests, name), 'utf8');
  const skip = source.split('\n').slice(0, 5).join('\n').match(/\/\/ fixture: skip (.+)/);
  if (skip) {
    console.log(`SKIP ${name}: ${skip[1].trim()}`);
    continue;
  }
  // Fixtures choose their own output variable; send each one to a fresh folder.
  const folder = join(output, name.replace(/\.mjs$/, ''));
  await mkdir(folder, {recursive: true});
  const env = {...process.env, CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? resolve('target')};
  for (const [, variable] of source.matchAll(/process\.env\.([A-Z_]+_(?:OUTPUT|EVIDENCE|DIR))\b/g)) {
    if (variable !== 'CARGO_TARGET_DIR') env[variable] = join(folder, variable.toLowerCase());
  }
  const started = Date.now();
  const {code, signal, log} = await run(name, env);
  const passed = code === 0;
  results.push({name, passed});
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name} ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (!passed) console.log(log.trimEnd().split('\n').slice(-40).join('\n') + `\n(exit ${code ?? signal})`);
}

const failed = results.filter(result => !result.passed);
console.log(`${results.length - failed.length}/${results.length} fixtures passed; output in ${output}`);
if (!results.length || failed.length) process.exit(1);
