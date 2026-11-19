---
'@yolean/evidence-universal-sql': minor
'@yolean/evidence-duckdb': major
'@yolean/evidence-csv': patch
'@yolean/evidence-motherduck': patch
---

DuckDB 2.0: sources run on @duckdb/node-api 2.0.0-r.1 and pages on @duckdb/duckdb-wasm 1.33.1-dev118.0, both DuckDB v2.0.0. Division by zero returns NULL and an untyped NULL is an INTEGER, as before. Other DuckDB 2.0 changes apply to source and page SQL, see https://duckdb.org/docs/2.0/operations_manual/migration: the `x -> x + 1` lambda syntax is an error, use `lambda x: x + 1`, and `~` matches part of a string. Browsers need WebAssembly exception handling, as duckdb-wasm no longer has a bundle without it.
