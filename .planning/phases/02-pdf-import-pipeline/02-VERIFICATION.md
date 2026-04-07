---
phase: 02-pdf-import-pipeline
verified: 2026-04-07T12:00:00Z
status: human_needed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "Upload a real Citibank SG credit card PDF on /import and verify parsed transactions appear in the review screen within seconds"
    expected: "Transactions should show date, description, amount in SGD, and debit/credit flag. Multi-page statements should parse all pages."
    why_human: "Cannot test actual PDF upload flow without a running server and real PDF file"
  - test: "Re-upload the same PDF after importing and verify the duplicate warning banner appears with correct count"
    expected: "All previously imported transactions should show with strikethrough at 50% opacity and AlertTriangle icon. Import bar should show 0 transactions ready or show all-duplicates error."
    why_human: "Requires end-to-end flow with database state from a previous import"
  - test: "Navigate to /import/history after importing a statement and verify the table and timeline bar render correctly"
    expected: "History table shows the imported statement with file name, period, transaction count, importer name, and date. Timeline bar shows the covered month in green."
    why_human: "Requires running app with populated database"
  - test: "View /settings/bank-configs as admin and verify Citibank SG config displays with monospace regex patterns"
    expected: "Card shows bank name, country, statement type, and parser config with regex patterns in monospace font"
    why_human: "Requires running app with seeded bank_configs table"
  - test: "Test mobile responsive view of review screen and import history"
    expected: "Transaction tables transform to stacked cards on mobile viewport. Import history transforms to cards."
    why_human: "Visual/responsive behavior cannot be verified programmatically"
  - test: "Run npm install and then npx tsc --noEmit to verify no TypeScript errors"
    expected: "Zero TypeScript errors after installing dependencies"
    why_human: "Dependencies unpdf and react-dropzone are declared in package.json and lockfile but not installed in node_modules -- requires npm install before tsc can pass"
---

# Phase 2: PDF Import Pipeline Verification Report

**Phase Goal:** Admin can upload a Citibank SG credit card PDF and see parsed transactions in a review screen, with import history and duplicate protection
**Verified:** 2026-04-07T12:00:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can upload a Citibank SG credit card PDF and see extracted transactions (date, description, amount, debit/credit) within seconds | VERIFIED | `src/app/(authenticated)/import/page.tsx` implements 5-state machine with file upload -> parseStatement server action -> ReviewScreen rendering. Server action in `src/app/actions/import-actions.ts` uses unpdf for PDF text extraction, loads bank config from DB, calls parseStatementText, and returns ParseResult with duplicate hashes. ReviewScreen renders TransactionTable with date, description, amount (SGD via Intl.NumberFormat), and category columns. |
| 2 | Parser correctly handles multi-page statements, cross-year date inference, noise row filtering, and credit notation (parentheses) | VERIFIED | `src/lib/parser/parse-statement.ts` implements all four: multi-page via concatenating pageTexts arrays (tested in test case "handles multi-page text arrays"), cross-year via `inferTransactionDate` using `isWithinInterval` (tested with Dec/Jan boundary cases), noise filtering via `skip_patterns` array (tested), and parentheses credit detection in `parseAmount` (tested). All 20 tests pass. |
| 3 | Review screen displays parsed transactions split into categorized (top) and uncategorized (bottom) sections | VERIFIED | `src/components/import/review-screen.tsx` computes `categorizedTxns` and `uncategorizedTxns`, renders "Categorized" section with green accent (`border-l-[#16a34a]`) and "Uncategorized" section with amber accent (`border-l-[#d97706]`). In Phase 2, categorized is always empty with "No categorization rules configured yet" message. Both sections use TransactionTable component. |
| 4 | Re-uploading an already-imported statement is detected and blocked via transaction hash matching | VERIFIED | `src/app/actions/import-actions.ts` parseStatement queries existing `transaction_hash` values from `transactions` table and returns `duplicateHashes` array. `src/components/import/review-screen.tsx` filters duplicates, renders them with strikethrough. `src/components/import/duplicate-warning.tsx` shows amber banner. Import page `handleImport` filters out duplicate transactions before calling `importTransactions`. Hash computation in `src/lib/parser/hash.ts` uses SHA-256 of `date|description|amountCents|isDebit`. |
| 5 | Import history page shows which statements were imported, when, and how many transactions each contained, with statement period gap highlighting | VERIFIED | `src/app/(authenticated)/import/history/page.tsx` fetches imports sorted newest first with profile names. `src/components/history/import-history-table.tsx` shows File Name, Statement Period, Transactions, Imported By, and Date Imported columns with responsive mobile cards. `src/components/history/timeline-bar.tsx` shows green segments for covered months, red/20% for gaps, with tooltips. Empty state with CTA to /import when no imports exist. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/parser/types.ts` | BankFormatConfig, ParsedTransaction, ParseResult, ParseError types | VERIFIED | All 4 interfaces exported with correct fields (1425 bytes) |
| `src/lib/parser/parse-statement.ts` | parseStatementText, parseAmount, inferTransactionDate functions | VERIFIED | All 3 functions exported, 263 lines of substantive parsing logic |
| `src/lib/parser/hash.ts` | computeTransactionHash function | VERIFIED | SHA-256 hash using crypto.createHash, 11 lines |
| `src/lib/parser/__tests__/parse-statement.test.ts` | Test cases for all parser behaviors | VERIFIED | 20 test cases across 4 describe blocks, all passing |
| `supabase/migrations/00005_bank_configs.sql` | bank_configs table, RLS, Citibank SG seed | VERIFIED | CREATE TABLE, RLS policies with is_admin/get_my_household_id, INSERT seed with full JSONB config |
| `src/lib/types/database.ts` | bank_configs table type and BankConfig alias | VERIFIED | bank_configs entry in Database interface, `export type BankConfig` alias at line 198 |
| `src/app/actions/import-actions.ts` | parseStatement and importTransactions server actions | VERIFIED | 'use server', verifyAdmin checks, unpdf extraction, parser call, duplicate detection, import record creation, transaction batch insert, revalidatePath |
| `src/app/(authenticated)/import/page.tsx` | Import page with 5-state state machine | VERIFIED | 'use client', 5 states (idle/parsing/review/importing/error), useProfile hook, error card with red accent, Upload Again CTA |
| `src/components/import/drop-zone.tsx` | PDF drop zone with validation | VERIFIED | useDropzone with PDF accept filter, 4MB max, toast errors, drag states, error flash, disabled for non-admin, aria-label |
| `src/components/import/collapsed-drop-zone.tsx` | Post-parse summary bar | VERIFIED | FileText icon, fileName, transaction count, "Upload another" button |
| `src/components/import/parse-progress.tsx` | Loading skeleton | VERIFIED | Loader2 spinner, 6 skeleton rows |
| `src/components/import/review-screen.tsx` | Split review container | VERIFIED | Composes CollapsedDropZone, StatementSummary, DuplicateWarning, TransactionTable (categorized + uncategorized), ImportBar |
| `src/components/import/statement-summary.tsx` | Statement period and totals card | VERIFIED | Card with 2x2 grid, date-fns format, Intl.NumberFormat SGD currency |
| `src/components/import/transaction-table.tsx` | Transaction table with mobile cards | VERIFIED | Desktop Table with alternating rows, line-through for duplicates, tabular-nums, AlertTriangle icon, mobile TransactionCard fallback |
| `src/components/import/transaction-card.tsx` | Mobile transaction card | VERIFIED | Card with description, date, amount, category, duplicate styling |
| `src/components/import/import-bar.tsx` | Bottom sticky import bar | VERIFIED | Fixed bottom, readyCount display, Import button with Loader2 spinner, aria-live |
| `src/components/import/duplicate-warning.tsx` | Duplicate warning banner | VERIFIED | AlertTriangle icon, amber accent, "already imported and will be skipped" text |
| `src/app/(authenticated)/import/history/page.tsx` | Import history page | VERIFIED | Server component, Supabase data fetch, EmptyState with CTA, TimelineBar + ImportHistoryTable |
| `src/components/history/import-history-table.tsx` | History table with mobile cards | VERIFIED | 5 columns, date-fns formatting, responsive desktop/mobile layout |
| `src/components/history/timeline-bar.tsx` | Timeline visualization | VERIFIED | Green filled, red/20% gap, future segments, Tooltip, date-fns intervals, "Statement Coverage" heading |
| `src/app/(authenticated)/settings/bank-configs/page.tsx` | Bank config viewer | VERIFIED | Server component, admin check, flattenConfig + formatConfigKey helpers, font-mono for regex, no edit controls |
| `src/components/app-sidebar.tsx` | Import nav enabled | VERIFIED | Import nav item has `disabled: false` at line 41 |
| `next.config.ts` | 4mb body size limit | VERIFIED | `bodySizeLimit: '4mb'` at line 8 |
| `package.json` | unpdf and react-dropzone dependencies | VERIFIED | `"react-dropzone": "^15.0.0"` and `"unpdf": "^1.4.0"` declared, present in lockfile |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `import/page.tsx` | `import-actions.ts` | server action imports | WIRED | `import { parseStatement, importTransactions } from '@/app/actions/import-actions'` at line 8-9, called in handleFileSelected and handleImport |
| `import-actions.ts` | `parse-statement.ts` | parser function call | WIRED | `import { parseStatementText } from '@/lib/parser/parse-statement'` at line 6, called at line 103 |
| `import-actions.ts` | `unpdf` | PDF text extraction | WIRED | `import { extractText, getDocumentProxy } from 'unpdf'` at line 4, called at lines 76-79 |
| `review-screen.tsx` | `transaction-table.tsx` | renders transaction tables | WIRED | `import { TransactionTable } from '@/components/import/transaction-table'` at line 7, rendered in categorized and uncategorized sections |
| `parse-statement.ts` | `types.ts` | type imports | WIRED | `import type { BankFormatConfig, ParsedTransaction, ParseResult, ParseError } from './types'` at line 3 |
| `parse-statement.ts` | `hash.ts` | hash computation | WIRED | `import { computeTransactionHash } from './hash'` at line 2, called at line 228 |
| `import/history/page.tsx` | `supabase/server.ts` | server data fetching | WIRED | `import { createClient } from '@/lib/supabase/server'` at line 1 |
| `import/history/page.tsx` | `import-history-table.tsx` | renders import data | WIRED | `import { ImportHistoryTable } from '@/components/history/import-history-table'` at line 4 |
| `import/history/page.tsx` | `timeline-bar.tsx` | renders timeline | WIRED | `import { TimelineBar } from '@/components/history/timeline-bar'` at line 5 |
| `app-sidebar.tsx` | `/import` | nav item href | WIRED | Import nav item at line 41 with `href: '/import', disabled: false` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `import/page.tsx` | `state.parseResult` | `parseStatement(formData)` server action | Yes -- extracts PDF text via unpdf, parses via config-driven parser, queries DB for duplicates | FLOWING |
| `import-actions.ts` | `bankConfigRow` | `supabase.from('bank_configs').select('config').eq('is_default', true).single()` | Yes -- queries real DB table with seeded Citibank config | FLOWING |
| `import-actions.ts` | `existingRows` (duplicates) | `supabase.from('transactions').select('transaction_hash').in('transaction_hash', hashes)` | Yes -- queries real DB | FLOWING |
| `review-screen.tsx` | `categorizedTxns/uncategorizedTxns` | Computed from `parseResult.transactions` | Yes -- filtered from real parse results | FLOWING |
| `import/history/page.tsx` | `imports` | `supabase.from('imports').select('*').order('created_at', ...)` | Yes -- queries real DB | FLOWING |
| `timeline-bar.tsx` | `segments` | Computed from `imports` prop | Yes -- derived from real import data | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Parser tests pass | `npx tsx --test src/lib/parser/__tests__/parse-statement.test.ts` | 20/20 tests pass, 0 failures | PASS |
| Dependencies declared | `grep "unpdf\|react-dropzone" package.json` | Both found with correct versions | PASS |
| Dependencies in lockfile | `grep -c "unpdf" package-lock.json` | 3 matches found | PASS |
| Body size limit configured | `grep bodySizeLimit next.config.ts` | `bodySizeLimit: '4mb'` found | PASS |
| Bank configs migration valid | Inspected SQL file | CREATE TABLE, RLS, INSERT seed all present | PASS |
| TypeScript compilation | `npx tsc --noEmit` | 4 errors: unpdf and react-dropzone modules not found (not installed in node_modules -- declared in package.json + lockfile, needs `npm install`) | CONDITIONAL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| IMPT-01 | 02-02 | Admin can upload Citibank SG credit card PDF statements | SATISFIED | PdfDropZone accepts .pdf files, parseStatement server action processes upload, admin role check via verifyAdmin |
| IMPT-02 | 02-01, 02-02 | System parses transaction rows from PDF extracting date, description, amount, and debit/credit flag | SATISFIED | parseStatementText extracts all 4 fields, 20 tests verify correct parsing |
| IMPT-03 | 02-01, 02-04 | Parser reads bank format definition from JSON config (config-driven) | SATISFIED | BankFormatConfig type drives parser behavior, bank_configs table stores config as JSONB, server action loads config from DB |
| IMPT-04 | 02-02 | Parsed transactions shown in review screen with categorized on top and uncategorized below | SATISFIED | ReviewScreen splits transactions into categorized (green accent) and uncategorized (amber accent) sections |
| IMPT-05 | 02-01, 02-02 | Duplicate detection prevents re-importing same transactions via hash | SATISFIED | computeTransactionHash generates SHA-256, parseStatement checks existing hashes, duplicates shown with strikethrough, import filters them out |
| IMPT-06 | 02-03 | Import history tracks which statements were imported, when, and transaction count | SATISFIED | ImportHistoryTable shows File Name, Statement Period, Transactions, Imported By, Date Imported columns |
| IMPT-07 | 02-03 | Statement period tracking shows which months have data and highlights gaps | SATISFIED | TimelineBar shows filled (green), gap (red/20%), and future segments with tooltips |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none found) | - | - | - | - |

No TODO/FIXME/PLACEHOLDER comments, no empty handlers, no stub returns. Guard clauses (`return null` when `transactions.length === 0` in TransactionTable, `return []` when no dates in TimelineBar) are legitimate patterns.

### Human Verification Required

### 1. End-to-End PDF Upload Flow

**Test:** Upload a real Citibank SG credit card PDF on /import as an admin user
**Expected:** Transactions appear in the review screen within seconds, showing date, description, amount (SGD), and debit/credit. Multi-page statements parse all pages.
**Why human:** Cannot test actual PDF upload and rendering without a running server and real PDF file

### 2. Duplicate Detection Flow

**Test:** Re-upload the same PDF after importing its transactions
**Expected:** Duplicate warning banner appears. Previously imported transactions show with strikethrough at 50% opacity and AlertTriangle icon. Import filters out duplicates.
**Why human:** Requires end-to-end flow with database state from a previous import

### 3. Import History and Timeline

**Test:** Navigate to /import/history after importing at least one statement
**Expected:** History table shows the imported statement with correct metadata. Timeline bar shows the covered month in green.
**Why human:** Requires running app with populated database

### 4. Bank Config Viewer

**Test:** View /settings/bank-configs as admin
**Expected:** Card shows Citibank SG config with bank name, country, statement type, and parser config with regex patterns in monospace font
**Why human:** Requires running app with seeded bank_configs table

### 5. Mobile Responsive Views

**Test:** View /import review screen and /import/history on mobile viewport
**Expected:** Transaction tables transform to stacked cards. Import history transforms to cards.
**Why human:** Visual/responsive behavior cannot be verified programmatically

### 6. Dependency Installation

**Test:** Run `npm install` then `npx tsc --noEmit`
**Expected:** Zero TypeScript errors. unpdf and react-dropzone resolve correctly.
**Why human:** Dependencies are declared in package.json and lockfile but not currently installed in node_modules. Needs `npm install` to sync.

### Gaps Summary

No code-level gaps found. All 5 roadmap success criteria are verifiable from the codebase. All 7 requirement IDs (IMPT-01 through IMPT-07) are satisfied with substantive implementations across 24 artifacts that are properly wired together.

The only operational concern is that `npm install` needs to be run to install `unpdf` and `react-dropzone` into node_modules (they are correctly declared in package.json and package-lock.json). This is an environment sync issue, not a code gap.

Human verification is needed for visual/responsive behavior, actual PDF upload flow, and end-to-end import workflow.

---

_Verified: 2026-04-07T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
