# @evidence-dev/motherduck

## 1.0.9

### Patch Changes

- db9c0e99d: DuckDB 2.0: sources run on @duckdb/node-api 2.0.0-r.1 and pages on @duckdb/duckdb-wasm 1.33.1-dev118.0, both DuckDB v2.0.0. Division by zero returns NULL and an untyped NULL is an INTEGER, as before. Other DuckDB 2.0 changes apply to source and page SQL, see https://duckdb.org/docs/2.0/operations_manual/migration: the `x -> x + 1` lambda syntax is an error, use `lambda x: x + 1`, and `~` matches part of a string. Browsers need WebAssembly exception handling, as duckdb-wasm no longer has a bundle without it.

  Page queries run in a configured time zone instead of the browser's UTC offset: `deployment.timeZone`, UTC if not set, or for pages with a data scope the zone `deployment.timeZoneQuery` gives for it. In that zone current_date is its date, a string compared to a timestamptz, like a date range against to_timestamp(...), means its midnight, and timestamptz results show its wall-clock time. Prerendering and the browser use the same zone.

## 1.0.8

### Patch Changes

- 8b1f45215: Internal dependencies are published as ^ ranges instead of exact versions, so a release of one package no longer leaves its dependents pinned to the previous version.

## 1.0.7

### Patch Changes

- First release under the @yolean npm scope, from the frozen upstream legacy framework at 40.1.8

## 1.0.6

### Patch Changes

- Updated dependencies [937971eaa]
  - @evidence-dev/duckdb@2.0.1
  - @evidence-dev/db-commons@1.1.1

## 1.0.5

### Patch Changes

- Updated dependencies [b28f63f23]
  - @evidence-dev/duckdb@2.0.0
  - @evidence-dev/db-commons@1.1.0

## 1.0.4

### Patch Changes

- Updated dependencies [cb5687cd9]
  - @evidence-dev/db-commons@1.0.6
  - @evidence-dev/duckdb@1.0.13

## 1.0.3

### Patch Changes

- Updated dependencies [43502807b]
  - @evidence-dev/duckdb@1.0.12

## 1.0.2

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [e74affd64]
- Updated dependencies [6cdedceb0]
  - @evidence-dev/duckdb@1.0.11
  - @evidence-dev/db-commons@1.0.5

## 1.0.1

### Patch Changes

- Updated dependencies [06c1e74e5]
- Updated dependencies [cd9e7df35]
  - @evidence-dev/duckdb@1.0.10

## 1.0.0

### Major Changes

- 9263bc3d9: Motherduck connector initial implementation
