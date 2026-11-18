#!/usr/bin/env node
// Publishes one not-yet-published package with npm, so npm's browser 2FA prompt (and its
// "don't ask again" box) covers the changeset publish that follows. pnpm pack rewrites
// workspace: dependencies, which a plain npm publish in the package directory wouldn't.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');

const files = execFileSync('git', ['ls-files', 'packages/**/package.json'], { encoding: 'utf8' })
	.split('\n')
	.filter((f) => f && !f.includes('node_modules'));

for (const file of files) {
	const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
	if (pkg.private || !pkg.name?.startsWith('@yolean/')) continue;
	const view = spawnSync('npm', ['view', `${pkg.name}@${pkg.version}`, 'version'], {
		encoding: 'utf8'
	});
	if (view.status === 0 && view.stdout.trim() === pkg.version) continue;
	const dir = path.dirname(file);
	const out = fs.mkdtempSync(path.join(os.tmpdir(), 'release-otp-'));
	execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, stdio: 'inherit' });
	const tgz = path.join(
		out,
		fs.readdirSync(out).find((f) => f.endsWith('.tgz'))
	);
	console.log(`Publishing ${pkg.name}@${pkg.version} with npm to cache 2FA`);
	execFileSync('npm', ['publish', tgz, '--access', 'public', ...(dryRun ? ['--dry-run'] : [])], {
		stdio: 'inherit'
	});
	process.exit(0);
}
console.log('Every package version is already published');
