import { describe, expect, it } from 'vitest';
/** @type {undefined | string} */
let basePath = undefined;
const config = {
	deployment: {
		get basePath() {
			return basePath;
		}
	}
};

import { addBasePath } from './addBasePath.js';
describe('addBasePath', () => {
	it('should return path if basePath is not set', () => {
		basePath = undefined;
		expect(addBasePath('/test', config)).toBe('/test');
	});
	it('should return path with basePath if basePath is set', () => {
		basePath = '/base';
		expect(addBasePath('/test', config)).toBe('/base/test');
	});
	it('should leave absolute paths as is', () => {
		basePath = '/base';
		expect(addBasePath('https://example.com/test', config)).toBe('https://example.com/test');
	});
	it('should always delimit with only one /', () => {
		basePath = '/base/';
		expect(addBasePath('/test', config)).toBe('/base/test');
	});
	it('should always start with /', () => {
		basePath = 'base';
		expect(addBasePath('/test', config)).toBe('/base/test');
	});
	it('should pass through undefined', () => {
		basePath = '/base';
		expect(addBasePath(undefined)).toBe(undefined);
	});
	it('should not double up the base path', () => {
		basePath = '/base';
		expect(addBasePath('/base/test', config)).toBe('/base/test');
	});
	it('should not modify hash links', () => {
		basePath = '/base';
		expect(addBasePath('#test', config)).toBe('#test');
	});
	it.each([
		'http://example.com',
		'https://example.com',
		'ftp://example.com/file.txt',
		'mailto:someone@example.com',
		'tel:+1234567890',
		'file:///C:/path/to/file',
		'data:text/plain;base64,aGVsbG8gd29ybGQ=',
		'javascript:alert("Hello")',
		'blob:hajsfklayhslfjkahslfkahjslkf',
		'sms:+1234567890',
		'vscode:extension/Evidence.evidence-vscode',
		'someprotocol:',
		'someotherprotocol://'
	])('should not modify urls with a protocol (%s)', (href) => {
		basePath = '/base';
		expect(addBasePath(href, config)).toBe(href);
	});
	it('should add base path to relative path with colon in it', () => {
		basePath = '/base';
		expect(addBasePath('/test:123', config)).toBe('/base/test:123');
	});
	it('should properly handle String wrapper or non-string values', () => {
		basePath = '/base';
		expect(addBasePath(new String('/test'), config)).toBe('/base/test');
		expect(addBasePath(123, config)).toBe(123);
		expect(addBasePath(123n, config)).toBe(123n);
		expect(addBasePath(true, config)).toBe(true);
		expect(addBasePath(Symbol.for('test'), config)).toBe(Symbol.for('test'));
		const fn = () => {};
		expect(addBasePath(fn, config)).toBe(fn);
		expect(addBasePath(null, config)).toBe(null);
		expect(addBasePath(undefined, config)).toBe(undefined);
		const obj = {};
		expect(addBasePath(obj, config)).toBe(obj);
	});
	it('should add slash', () => {
		basePath = '/base';
		expect(addBasePath('test', config)).toBe('/base/test');
	});
});

import { addScopedBasePath, getDataScope } from './addBasePath.js';
describe('data scope', () => {
	const scoped = { deployment: { basePath: '/base', dataScope: 'orgslug' } };
	it('is the value of the configured route parameter', () => {
		expect(getDataScope({ orgslug: 'org1' }, scoped)).toBe('org1');
	});
	it('is null for pages without the parameter, or without dataScope', () => {
		expect(getDataScope({ site: 's' }, scoped)).toBe(null);
		expect(getDataScope(undefined, scoped)).toBe(null);
		expect(getDataScope({ orgslug: 'org1' }, { deployment: { basePath: '/base' } })).toBe(null);
	});
	it('puts scoped paths under /<scope> after the base path', () => {
		expect(addScopedBasePath('/data/manifest.json', 'org1', scoped)).toBe(
			'/base/org1/data/manifest.json'
		);
		expect(addScopedBasePath('api/x.json', 'org1', scoped)).toBe('/base/org1/api/x.json');
	});
	it('leaves unscoped paths to addBasePath', () => {
		expect(addScopedBasePath('/data/manifest.json', null, scoped)).toBe('/base/data/manifest.json');
	});
});

import { getDefaultTimeZone, getTimeZoneQuery } from './addBasePath.js';
describe('time zone', () => {
	const zoned = {
		deployment: {
			dataScope: 'orgslug',
			timeZone: 'Europe/Stockholm',
			timeZoneQuery: 'select tz from orgs where slug = ${scope}'
		}
	};
	it('queries the zone of a scope, with the scope as a string literal', () => {
		expect(getTimeZoneQuery('org1', zoned)).toBe("select tz from orgs where slug = 'org1'");
		expect(getTimeZoneQuery("o'1", zoned)).toBe("select tz from orgs where slug = 'o''1'");
	});
	it('has no query for pages without a scope, or without timeZoneQuery', () => {
		expect(getTimeZoneQuery(null, zoned)).toBe(null);
		expect(getTimeZoneQuery('org1', { deployment: {} })).toBe(null);
	});
	it('defaults to timeZone, or null for UTC', () => {
		expect(getDefaultTimeZone(zoned)).toBe('Europe/Stockholm');
		expect(getDefaultTimeZone({ deployment: {} })).toBe(null);
	});
});
