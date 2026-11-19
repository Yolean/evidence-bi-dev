import { beforeAll, describe, expect, it } from 'vitest';
import { initDB, query, setTimeZone } from './node.js';

const columnTypes = (rows) =>
	Object.fromEntries(rows._evidenceColumnTypes.map((c) => [c.name, c.evidenceType]));

describe('client-duckdb/node', () => {
	beforeAll(async () => {
		await initDB();
	});

	it('runs DuckDB 2.0', () => {
		const [row] = query('select version() as v');
		expect(row.v).toMatch(/^v2\./);
	});

	// before any other query that uses current_date, which would load icu
	it('binds date arithmetic with current_date in the first query that uses it', () => {
		const [row] = query("select current_date - 90 as d, date_trunc('week', current_date) as w");
		expect(row.d).toBeInstanceOf(Date);
		expect(row.w).toBeInstanceOf(Date);
	});

	it('returns HUGEINT, such as SUM of integers, as numbers', () => {
		const rows = query(
			'select sum(x) as s, 170141183460469231731687303715884105727::hugeint as mx, 5::uhugeint as u, null::hugeint as n from (values (1), (2)) t(x)'
		);
		expect({ ...rows[0] }).toEqual({ s: 3, mx: 1.7014118346046923e38, u: 5, n: null });
		expect(columnTypes(rows)).toEqual({ s: 'number', mx: 'number', u: 'number', n: 'number' });
	});

	it('converts dates in rows that also have a HUGEINT', () => {
		const [row] = query("select sum(1) as s, date '2024-01-02' as d");
		expect(row.d).toEqual(new Date('2024-01-02T00:00:00Z'));
	});

	it('returns NULL for division by zero, as before DuckDB 2.0', () => {
		const rows = query('select 1 / 0 as a, 0 / 0 as b, 7 // 0 as c, 7 % 0 as d');
		expect({ ...rows[0] }).toEqual({ a: null, b: null, c: null, d: null });
	});

	it('types an untyped NULL as a number, as before DuckDB 2.0', () => {
		const rows = query('select null as x');
		expect(columnTypes(rows)).toEqual({ x: 'number' });
	});

	describe('time zone', () => {
		// 2026-08-21T00:00Z in summer time, 2026-01-01T00:00Z in winter time, 2026-11-17T23:30Z
		const AUGUST = 1787270400;
		const JANUARY = 1767225600;
		const NOVEMBER_LATE = 1794958200;

		/** @param {string | null} zone */
		const inZone = (zone) => {
			setTimeZone(zone);
			const [row] = query(
				`select current_setting('TimeZone') as tz, to_timestamp(${AUGUST}) as aug, to_timestamp(${JANUARY}) as jan,` +
					` timestamp '2026-08-21 00:00:00' as naive,` +
					` to_timestamp(${NOVEMBER_LATE}) between '2026-11-01' and '2026-11-18' as in_range`
			);
			return {
				tz: row.tz,
				aug: row.aug.toISOString(),
				jan: row.jan.toISOString(),
				naive: row.naive.toISOString(),
				in_range: row.in_range
			};
		};

		it('returns timestamptz as wall-clock time in the zone, which formatting reads as UTC', () => {
			expect(inZone('Europe/Stockholm')).toMatchObject({
				aug: '2026-08-21T02:00:00.000Z',
				jan: '2026-01-01T01:00:00.000Z'
			});
			expect(inZone('America/New_York')).toMatchObject({
				aug: '2026-08-20T20:00:00.000Z',
				jan: '2025-12-31T19:00:00.000Z'
			});
		});

		it('leaves timestamps without a zone as they are', () => {
			for (const zone of ['Europe/Stockholm', 'America/New_York', null]) {
				expect(inZone(zone).naive).toBe('2026-08-21T00:00:00.000Z');
			}
		});

		it('compares a date string to a timestamptz at midnight in the zone', () => {
			// 2026-11-17T23:30Z is 00:30 on the 18th in Stockholm, after the range ends
			expect(inZone('Europe/Stockholm').in_range).toBe(false);
			expect(inZone('America/New_York').in_range).toBe(true);
			expect(inZone(null).in_range).toBe(true);
		});

		it('is UTC for null, and keeps the zone it has for one DuckDB does not know', () => {
			expect(inZone(null)).toMatchObject({ tz: 'UTC', aug: '2026-08-21T00:00:00.000Z' });
			expect(inZone('Europe/Stockholm').tz).toBe('Europe/Stockholm');
			expect(inZone('Mars/Olympus_Mons').tz).toBe('Europe/Stockholm');
			setTimeZone(null);
		});
	});
});
