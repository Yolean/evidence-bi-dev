#!/usr/bin/env node
// After `changeset publish`: waits until every published package's current version has a
// downloadable tarball, since the registry's CDN lags a publish by up to ~10 minutes, then
// pushes the release tags changeset publish created locally.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const TIMEOUT_MS = 20 * 60 * 1000;

const packages = execFileSync('git', ['ls-files', 'packages/**/package.json'], { encoding: 'utf8' })
	.split('\n')
	.filter((f) => f && !f.includes('node_modules'))
	.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')))
	.filter((p) => !p.private && p.name?.startsWith('@yolean/'));

async function available(pkg) {
	const view = spawnSync(
		'npm',
		['view', `${pkg.name}@${pkg.version}`, 'dist.tarball', '--prefer-online'],
		{
			encoding: 'utf8'
		}
	);
	const tarball = view.status === 0 ? view.stdout.trim() : '';
	if (!tarball) return false;
	const res = await fetch(tarball, { method: 'HEAD' });
	return res.ok;
}

let pending = packages;
const until = Date.now() + TIMEOUT_MS;
while (pending.length) {
	const next = [];
	for (const pkg of pending) if (!(await available(pkg))) next.push(pkg);
	pending = next;
	if (!pending.length) break;
	if (Date.now() > until) {
		console.error(
			`Not downloadable after ${TIMEOUT_MS / 60000} minutes: ${pending.map((p) => `${p.name}@${p.version}`).join(' ')}`
		);
		process.exit(1);
	}
	console.log(`Waiting for tarballs: ${pending.map((p) => `${p.name}@${p.version}`).join(' ')}`);
	await new Promise((r) => setTimeout(r, 30_000));
}
console.log(`All ${packages.length} packages are downloadable at their current versions`);

const tags = execFileSync('git', ['tag', '--points-at', 'HEAD'], { encoding: 'utf8' })
	.split('\n')
	.filter(Boolean);
if (!tags.length) {
	console.log('No tags at HEAD to push');
	process.exit(0);
}
const onOrigin = execFileSync('git', ['branch', '-r', '--contains', 'HEAD'], {
	encoding: 'utf8'
}).trim();
if (!onOrigin) {
	console.log(
		`HEAD isn't on origin yet; after pushing it, run:\n  git push origin ${tags.join(' ')}`
	);
	process.exit(0);
}
execFileSync('git', ['push', 'origin', ...tags], { stdio: 'inherit' });
