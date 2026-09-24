# Report date-filter candidate — 24 September 2026

Status: local candidate, not released. Live backend remains `1673c1479a1dc9c579a94af5b2cd6cdfb61154aa`; web live remains `d39ad2c5607357c87432ada9ed327c58f3fdfc0a`, with local copy candidate `a0603515ea3895596d98fc63faaa10654f71e6bc`. Android source remains `9ed8a704e3904c71b4ce1cbcb8604a7a4c634985` and device testing remains deferred.

## Source finding

The daily heatmap, P&L and category-trends routes used the SQL `Transaction.month` hybrid expression (`to_char(expense_date, 'YYYY-MM')`). The canonical index migration `supabase/migrations/20260418000003_indexes_triggers.sql` defines `(user_id, expense_date DESC)`. Equality on the owner remains usable, but wrapping the date in `to_char` does not provide a normal date-range restriction for the index's second column.

The bounded candidate replaces these three filters with direct inclusive first/last-day date comparisons, preserving complete months, owner predicates, expense/category predicates, aggregation, Decimal arithmetic, zero-filled months and response shape. It does not truncate financial totals, introduce an index migration or change paid access. Daily heatmap input is validated as canonical `YYYY-MM` rather than accepting malformed month strings that previously returned a misleading zero report.

## Remaining performance evidence

This source correction is not a measured production speedup. SQL aggregation for P&L and category trends remains a separate candidate: those routes still materialize matching transaction rows. Representative query plans, memory and response latency have not been accepted.

Next bounded experiment: use only a temporary local PostgreSQL database and synthetic accounts with1k/10k/100k rows over five years, with the canonical date index. Compare old/new result equality for1/6/24months and record `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, result rows, timings and memory. Include leap February, year rollover, current-month future entries, empty periods, decimal amounts, other owners and expense/income types. Recurring-candidate queries are already date-scoped and capped at2001rows; evaluate below/at/above the2000-row abstention boundary separately. Clean the isolated fixture after the experiment.

Local synthetic measurements cannot certify production latency or concurrency. Do not use real-user histories, the private production backup, paid provider calls, devices or production load as a shortcut. Prior PostgreSQL notification/measurement/restore proofs remain valid and were not repeated.

## Verification and exact candidate

Backend candidate `c2b09ec41bd768ad0a8518ba8e73528fa256718c`: 650 tests passed with four existing SQLAlchemy warnings; 25 focused tests passed, including eight new cases. Root reviewed the implementation and tests; compileall and diff checks passed. Query assertions compile actual captured route SELECTs using the PostgreSQL dialect; functional fixtures use the existing local test database. This is not an executed PostgreSQL query-plan or latency measurement. No migrations, pushes, production writes, provider calls or device tests occurred.
