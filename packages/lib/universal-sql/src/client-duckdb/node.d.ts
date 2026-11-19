export { tableFromIPC } from 'apache-arrow';

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export function initDB(): Promise<void>;

/**
 * Updates the duckdb search path to include only the list of included schemas
 * @param {string[]} schemas
 * @returns {Promise<void>}
 */
export function updateSearchPath(schemas): Promise<void>;

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @param {{ route_hash: string, query_name: string, prerendering: boolean }} [cache_options]
 * @returns {Record<string, unknown[]>}
 */
export function query(
	sql: string,
	cache_options?: {
		route_hash: string;
		query_name: string;
		prerendering: boolean;
		scope?: string | null;
		time_zone: string | null;
	}
): Record<string, unknown>[];

/**
 * Adds a new view to the database, pointing to the provided parquet URLs.
 *
 * @param {Record<string, string[]>} urls
 * @param {boolean} [append]
 * @returns {void}
 */
export function setParquetURLs(urls: Record<string, string[]>, append?: boolean): void;

/**
 * Sets the time zone of the queries that follow: current_date, timestamptz values and the strings
 * compared to them are in this zone, and timestamptz results are its wall-clock time
 * @param zone an IANA zone, or null for UTC
 */
export function setTimeZone(zone: string | null): void;

/**
 * Converts an Apache Arrow table to a Javascript array.
 * @param {import("apache-arrow").Table} table
 * @returns {any[]}
 */
export function arrowTableToJSON(table: import('apache-arrow').Table): any[];
