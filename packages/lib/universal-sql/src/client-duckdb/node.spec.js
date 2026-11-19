import { beforeAll, describe, expect, it } from 'vitest';
import { initDB, query } from './node.js';

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
});
