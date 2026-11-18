---
'@yolean/evidence': patch
'@yolean/evidence-bigquery': patch
'@yolean/evidence-component-utilities': patch
'@yolean/evidence-core-components': patch
'@yolean/evidence-csv': patch
'@yolean/evidence-databricks': patch
'@yolean/evidence-duckdb': patch
'@yolean/evidence-motherduck': patch
'@yolean/evidence-mssql': patch
'@yolean/evidence-mysql': patch
'@yolean/evidence-postgres': patch
'@yolean/evidence-redshift': patch
'@yolean/evidence-sdk': patch
'@yolean/evidence-snowflake': patch
'@yolean/evidence-sqlite': patch
'@yolean/evidence-trino': patch---

Internal dependencies are published as ^ ranges instead of exact versions, so a release of one package no longer leaves its dependents pinned to the previous version.
