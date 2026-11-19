#!/usr/bin/env node
// First step of pnpm run release, before the builds: npm answers a publish without a login
// with a misleading 404, so check the login here and say what to do.
import { execFileSync, spawnSync } from 'node:child_process';

const fail = (msg) => {
	console.error(`release: ${msg}`);
	process.exit(1);
};

const whoami = spawnSync('npm', ['whoami'], { encoding: 'utf8' });
if (whoami.status !== 0)
	fail('npm is not logged in, run `npm login` and then `pnpm run release` again');
console.log(`release: npm user ${whoami.stdout.trim()}`);

const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
if (out('git', ['status', '--porcelain', '--untracked-files=no'])) {
	fail('the working tree has uncommitted changes; run pnpm run release:version and push first');
}
if (!out('git', ['branch', '-r', '--contains', 'HEAD'])) {
	console.warn(
		'release: HEAD is not on origin yet; push it so the release tags can be pushed after publish'
	);
}
