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
	const published = spawnSync(
		'npm',
		['publish', tgz, '--access', 'public', ...(dryRun ? ['--dry-run'] : [])],
		{ stdio: 'inherit' }
	);
	if (published.status !== 0) {
		// npm reports a missing login or missing publish rights on the scope as E404
		console.error(
			`npm publish of ${pkg.name}@${pkg.version} failed. An E404 means npm doesn't accept this user for @yolean: check \`npm whoami\` and the user's access to the scope.`
		);
		process.exit(1);
	}
	// the registry's CDN can answer 404 for minutes after a publish, and changeset publish
	// would then try this version again and fail
	if (!dryRun) {
		const until = Date.now() + 10 * 60 * 1000;
		while (Date.now() < until) {
			const seen = spawnSync(
				'npm',
				['view', `${pkg.name}@${pkg.version}`, 'version', '--prefer-online'],
				{
					encoding: 'utf8'
				}
			);
			if (seen.status === 0 && seen.stdout.trim() === pkg.version) process.exit(0);
			console.log(`Waiting for the registry to show ${pkg.name}@${pkg.version}`);
			execFileSync('sleep', ['15']);
		}
		throw new Error(`${pkg.name}@${pkg.version} still not on the registry after 10 minutes`);
	}
	process.exit(0);
}
console.log('Every package version is already published');
