/**
 * Adjusts a path to include the configured base path
 * Ignores undefined, and absolute URLs
 * @template T
 * @param {T} path
 * @param {import("../../configuration/schemas/config.schema.js").EvidenceConfig} config
 * @example addBasePath('http://localhost:3000/test') // 'http://localhost:3000/test'
 * @example addBasePath('/test') // '/base/test'
 * @example addBasePath(undefined) // undefined
 *
 * @returns {T | string}
 */
export const addBasePath = (path, config) => {
	/** @type {string} */
	let _path;

	if (path instanceof String) {
		_path = path.toString();
	} else if (typeof path !== 'string') {
		return path;
	} else {
		_path = path;
	}

	if (_path.startsWith('http')) return _path;
	if (_path.startsWith('#')) return _path; // ignore hash links
	if (/^[^/]*:/.test(_path)) return _path; // ignore other protocols

	let basePath = config.deployment.basePath;
	if (basePath) {
		if (!basePath?.startsWith('/')) {
			basePath = `/${basePath}`;
		}
		if (basePath.endsWith('/')) {
			basePath = basePath.slice(0, -1);
		}
		if (_path.startsWith(basePath)) return _path;
		if (!_path.startsWith('/')) {
			_path = `/${_path}`;
		}
		return `${basePath}${_path}`;
	} else {
		return _path;
	}
};

/**
 * The data scope of a page: the value of the route parameter named by
 * deployment.dataScope, or null when it isn't configured or the page lacks it
 * @param {Record<string, string> | undefined} params
 * @param {import("../../configuration/schemas/config.schema.js").EvidenceConfig} config
 * @returns {string | null}
 */
export const getDataScope = (params, config) => {
	const param = config.deployment.dataScope;
	if (!param || !params?.[param]) return null;
	return params[param];
};

/**
 * Like addBasePath, under /<scope> for pages with a data scope
 * @param {string} path
 * @param {string | null} scope
 * @param {import("../../configuration/schemas/config.schema.js").EvidenceConfig} config
 * @example addScopedBasePath('/data/manifest.json', 'org1', config) // '/base/org1/data/manifest.json'
 * @returns {string}
 */
export const addScopedBasePath = (path, scope, config) => {
	if (!scope) return addBasePath(path, config);
	return addBasePath(
		`/${encodeURIComponent(scope)}${path.startsWith('/') ? '' : '/'}${path}`,
		config
	);
};
