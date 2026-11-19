#!/usr/bin/env node
// Checks the pending changesets before `changeset version` consumes them:
// - each file parses, with changesets' own parser
// - each released package exists in the workspace and is published
// - a major release includes every published package depending on it: dependencies are
//   npm aliases (workspace:@yolean/x@^), which changesets doesn't bump, and a dependent
//   left out stays published against the previous major
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import readChangesets from '@changesets/read';

const read = readChangesets.default ?? readChangesets;
const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];

const packages = execFileSync('git', ['ls-files', '*package.json'], { encoding: 'utf8' })
	.split('\n')
	.filter((f) => f && !f.includes('node_modules'))
	.map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(f, 'utf8')) }))
	.filter((p) => p.name);
const byName = new Map(packages.map((p) => [p.name, p]));

/** The workspace package a dependency spec points at, if any */
function workspaceTarget(key, spec) {
	if (typeof spec !== 'string' || !spec.startsWith('workspace:')) return null;
	const m = /^workspace:((?:@[^/@]+\/)?[^@]+)@/.exec(spec);
	return m ? m[1] : key;
}

const parseFailed = (e) => {
	console.error(`changeset check failed, a .changeset file doesn't parse:\n  ${e.message}`);
	process.exit(1);
};
// @changesets/read leaves a parse error as an unhandled rejection
process.on('unhandledRejection', parseFailed);
const changesets = await read(process.cwd()).catch(parseFailed);
const problems = [];
/** @type {Map<string, string>} */
const releases = new Map();
for (const cs of changesets) {
	for (const r of cs.releases) {
		const pkg = byName.get(r.name);
		if (!pkg) problems.push(`.changeset/${cs.id}.md: ${r.name} is not a workspace package`);
		else if (pkg.private) problems.push(`.changeset/${cs.id}.md: ${r.name} is private`);
		const rank = ['patch', 'minor', 'major'];
		if (rank.indexOf(r.type) > rank.indexOf(releases.get(r.name) ?? 'none'))
			releases.set(r.name, r.type);
	}
}

for (const [name, type] of releases) {
	if (type !== 'major') continue;
	for (const p of packages) {
		if (p.private || releases.has(p.name)) continue;
		const deps = DEP_FIELDS.flatMap((f) => Object.entries(p[f] ?? {}));
		if (deps.some(([k, v]) => workspaceTarget(k, v) === name)) {
			problems.push(`${name} has a major release, add ${p.name} (${p.file}) to the changeset too`);
		}
	}
}

if (problems.length) {
	console.error(`changeset check failed:\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(
	`changeset check: ${changesets.length} changesets, ${releases.size} packages${releases.size ? `: ${[...releases].map(([n, t]) => `${n} ${t}`).join(', ')}` : ''}`
);
