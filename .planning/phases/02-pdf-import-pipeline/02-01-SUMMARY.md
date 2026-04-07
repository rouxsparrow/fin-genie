---
phase: 02-pdf-import-pipeline
plan: 01
subsystem: parser
tags: [unpdf, pdf-parsing, config-driven, sha256, date-fns, react-dropzone, tdd]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: Database schema pattern, RLS helpers (is_admin, get_my_household_id), Database type interface
provides:
  - BankFormatConfig type for config-driven parsing
  - ParsedTransaction, ParseResult, ParseError types
  - parseStatementText pure function (page text arrays + config => transactions)
  - parseAmount function (raw string => integer cents + debit/credit flag)
  - inferTransactionDate function (cross-year date resolution)
  - computeTransactionHash function (deterministic SHA-256)
  - bank_configs migration with Citibank SG seed data and RLS
  - BankConfig database type
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: [unpdf, react-dropzone]
  patterns: [config-driven-parser, pure-function-parsing, integer-cents-money, tdd-red-green]

key-files:
  created:
    - src/lib/parser/types.ts
    - src/lib/parser/parse-statement.ts
    - src/lib/parser/hash.ts
    - src/lib/parser/__tests__/parse-statement.test.ts
    - supabase/migrations/00005_bank_configs.sql
  modified:
    - package.json
    - next.config.ts
    - src/lib/types/database.ts

key-decisions:
  - "Used node:test built-in runner with tsx for TDD tests (no vitest/jest needed)"
  - "Parser is a pure function with zero side effects -- fully testable without PDF extraction"
  - "Cross-year date inference uses isWithinInterval from date-fns to pick correct year"

patterns-established:
  - "Config-driven parsing: BankFormatConfig JSON drives all extraction logic, no bank-specific code"
  - "Money as integer cents: parseAmount uses Math.round(parseFloat * 100) for safe conversion"
  - "Transaction hashing: SHA-256 of date|description|amountCents|isDebit for duplicate detection"
  - "TDD with node:test: tests live in __tests__/ alongside source, run via npx tsx --test"

requirements-completed: [IMPT-02, IMPT-03, IMPT-05]

# Metrics
duration: 4min
completed: 2026-04-07
---

# Phase 2 Plan 1: Config-Driven Parser Core Summary

**Config-driven PDF parser with cross-year date inference, integer-cents amount parsing, SHA-256 transaction hashing, and bank_configs table seeded with Citibank SG format**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T02:36:41Z
- **Completed:** 2026-04-07T02:40:41Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Pure-function parser that converts per-page text arrays into structured transactions driven entirely by BankFormatConfig JSON
- Cross-year date inference correctly handles Dec-Jan statement period boundaries
- bank_configs table with RLS policies and Citibank SG seed data ready for use
- 20 passing tests covering all parser behaviors (amount parsing, hashing, date inference, full parsing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, create bank_configs migration, update types** - `3c5500d` (feat)
2. **Task 2 RED: Add failing tests** - `31b25ad` (test)
3. **Task 2 GREEN: Implement parser, hash, amount parsing** - `4c5d139` (feat)

## Files Created/Modified
- `src/lib/parser/types.ts` - BankFormatConfig, ParsedTransaction, ParseResult, ParseError interfaces
- `src/lib/parser/parse-statement.ts` - parseAmount, inferTransactionDate, parseStatementText functions
- `src/lib/parser/hash.ts` - computeTransactionHash (SHA-256 deterministic hashing)
- `src/lib/parser/__tests__/parse-statement.test.ts` - 20 test cases for all parser behaviors
- `supabase/migrations/00005_bank_configs.sql` - bank_configs table, RLS, Citibank SG seed
- `src/lib/types/database.ts` - Added bank_configs table type and BankConfig alias
- `next.config.ts` - Added 4mb server action body size limit
- `package.json` - Added unpdf and react-dropzone dependencies

## Decisions Made
- Used node:test built-in runner with tsx for TDD tests -- no additional test framework dependency needed
- Parser is a pure function with zero side effects, fully testable without actual PDF extraction
- Cross-year date inference uses date-fns isWithinInterval to determine correct year from statement period
- Description continuation appends non-matching lines to previous transaction description

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Parser core ready for Plan 02-02 (server action upload + unpdf text extraction)
- BankFormatConfig type and parseStatementText function are the primary imports for downstream plans
- bank_configs table provides runtime config lookup for the upload server action

## Self-Check: PASSED

All 7 created/modified files verified present on disk. All 3 task commits (3c5500d, 31b25ad, 4c5d139) verified in git log.

---
*Phase: 02-pdf-import-pipeline*
*Completed: 2026-04-07*
