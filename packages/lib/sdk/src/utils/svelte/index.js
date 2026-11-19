export * from './inputs.js';
import {
	addBasePath as _addBasePath,
	addScopedBasePath as _addScopedBasePath,
	getDataScope as _getDataScope,
	getDefaultTimeZone as _getDefaultTimeZone,
	getTimeZoneQuery as _getTimeZoneQuery
} from './addBasePath.js';
import { config } from '$evidence/config';
/** @type {(path: string) => string} */
export const addBasePath = (path) => _addBasePath(path, config);
/** @type {(params: Record<string, string> | undefined) => string | null} */
export const getDataScope = (params) => _getDataScope(params, config);
/** @type {(path: string, scope: string | null) => string} */
export const addScopedBasePath = (path, scope) => _addScopedBasePath(path, scope, config);
/** @type {(scope: string | null) => string | null} */
export const getTimeZoneQuery = (scope) => _getTimeZoneQuery(scope, config);
/** @type {() => string | null} */
export const getDefaultTimeZone = () => _getDefaultTimeZone(config);
