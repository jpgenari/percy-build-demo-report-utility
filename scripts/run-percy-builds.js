// Runs the Percy flow end to end:
//   1. build with design A  -> wait for it to finish -> approve it (so it becomes the baseline)
//   2. build with design B  -> left unapproved so Percy shows the A vs B visual diffs
//
// Config comes from .env locally or from the environment (GitHub secrets) in CI:
//   PERCY_TOKEN              required  Percy project token (web_...)
//   BROWSERSTACK_USERNAME    required  used by `percy build:approve`
//   BROWSERSTACK_ACCESS_KEY  required  used by `percy build:approve`
require('dotenv').config({ quiet: true });
const { spawnSync } = require('child_process');

const missing = ['PERCY_TOKEN', 'BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY'].filter(
  (k) => !process.env[k]
);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}. Set them in .env or as CI secrets.`);
  process.exit(1);
}

function run(args, extraEnv = {}) {
  const res = spawnSync('npx', args, {
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 1024 * 1024 * 200,
  });
  const out = `${res.stdout || ''}${res.stderr || ''}`;
  process.stdout.write(out);
  return { status: res.status, out };
}

function capture(version) {
  console.log(`\n=== Percy build: design ${version} ===`);
  const { status, out } = run(['percy', 'exec', '--', 'playwright', 'test'], {
    DESIGN_VERSION: version,
  });
  const m = out.match(/Finalized build #(\d+): (https:\/\/percy\.io\/\S+\/builds\/(\d+))/);
  if (status !== 0 || !m) {
    console.error(`Design ${version} build failed or was not finalized.`);
    process.exit(status || 1);
  }
  return { number: m[1], url: m[2], id: m[3] };
}

const a = capture('A');
console.log(`Build A: #${a.number} ${a.url}`);

let r = run(['percy', 'build:wait', '--build', a.id]);
if (r.status !== 0) process.exit(r.status);

r = run(['percy', 'build:approve', a.id, '--pass-if-previously-approved']);
if (r.status !== 0) {
  console.error('Could not approve build A; build B would not have a clean baseline.');
  process.exit(r.status);
}
console.log(`Build A approved: ${a.url}`);

const b = capture('B');
console.log(`\nBuild B: #${b.number} ${b.url}`);
console.log('Review the A vs B visual diffs on Percy (B is intentionally left unapproved).');
