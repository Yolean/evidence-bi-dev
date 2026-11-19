#!/usr/bin/env node
// pnpm run release:version: checks the pending changesets, bumps versions and CHANGELOGs,
// formats the CHANGELOGs and commits the result as "Version packages". Commits itself so
// the consumed .changeset files are removed in the same commit as the bumps.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
const fail = (msg) => {
	console.error(`release:version: ${msg}`);
	process.exit(1);
};

if (out('git', ['branch', '--show-current']) !== 'main') fail('run it on main');
if (out('git', ['status', '--porcelain', '--untracked-files=no'])) {
	fail('the working tree has uncommitted changes, commit or stash them first');
}
run('git', ['fetch', '--quiet', 'origin', 'main']);
if (out('git', ['rev-parse', 'HEAD']) !== out('git', ['rev-parse', 'origin/main'])) {
	fail('main is not in sync with origin/main, pull or push first');
}

run('node', ['scripts/changeset-check.mjs']);
run('node_modules/.bin/changeset', ['version']);
run('node_modules/.bin/prettier', ['--write', '--log-level', 'warn', 'packages/**/CHANGELOG.md']);

const files = execFileSync('git', ['ls-files', 'packages/**/package.json'], { encoding: 'utf8' })
	.split('\n')
	.filter((f) => f && !f.includes('node_modules'));
const changed = new Set(out('git', ['diff', '--name-only']).split('\n'));
const bumped = files
	.filter((f) => changed.has(f))
	.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')))
	.map((p) => `${p.name}@${p.version}`);
if (!bumped.length) fail('changeset version bumped no package, nothing to commit');

run('git', ['add', '--all', '.changeset', 'packages']);
run('git', ['commit', '--quiet', '-m', `Version packages\n\n${bumped.join('\n')}\n`]);
console.log(`\nCommitted "Version packages":\n  ${bumped.join('\n  ')}`);
console.log('\nReview with `git show --stat`, then: git push && pnpm run release');
