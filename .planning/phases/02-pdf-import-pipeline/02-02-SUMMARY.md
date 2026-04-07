---
phase: 02-pdf-import-pipeline
plan: 02
subsystem: import-ui
tags: [unpdf, server-actions, state-machine, react-dropzone, review-screen, neo-brutalism]

# Dependency graph
requires:
  - phase: 02-pdf-import-pipeline
    plan: 01
    provides: parseStatementText, ParsedTransaction/ParseResult/ParseError types, computeTransactionHash, BankFormatConfig
  - phase: 01-foundation-auth
    provides: createClient server util, verifyAdmin pattern, useProfile hook, Database types, RLS policies
provides:
  - parseStatement server action (PDF upload => parsed transactions with duplicate detection)
  - importTransactions server action (persist transactions to database with import record)
  - PdfDropZone component (drag-and-drop with validation)
  - CollapsedDropZone component (post-parse summary bar)
  - ParseProgress component (loading skeleton)
  - ReviewScreen component (categorized/uncategorized split with all sub-components)
  - TransactionTable component (desktop table + mobile cards)
  - TransactionCard component (mobile transaction card)
  - ImportBar component (sticky bottom import bar)
  - DuplicateWarning component (amber warning banner)
  - StatementSummary component (statement period and totals card)
  - Import page at /import with 5-state UI state machine
affects: [02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-actions, 5-state-machine, split-review-sections, duplicate-hash-detection, mobile-card-fallback]

key-files:
  created:
    - src/app/actions/import-actions.ts
    - src/app/(authenticated)/import/page.tsx
    - src/components/import/drop-zone.tsx
    - src/components/import/collapsed-drop-zone.tsx
    - src/components/import/parse-progress.tsx
    - src/components/import/review-screen.tsx
    - src/components/import/statement-summary.tsx
    - src/components/import/transaction-table.tsx
    - src/components/import/transaction-card.tsx
    - src/components/import/import-bar.tsx
    - src/components/import/duplicate-warning.tsx
  modified: []

key-decisions:
  - Server actions use verifyAdmin pattern copied from user-management.ts rather than extracting to shared util (keeps actions self-contained)
  - 4MB file size limit instead of D-05's 10MB due to Vercel 4.5MB hard limit (documented in RESEARCH.md)
  - Import bar uses fixed positioning with left offset for sidebar clearance
  - Phase 2 categorized section is always empty with "No categorization rules configured yet" message
  - Import button enabled in Phase 2 (100% categorization gate deferred to Phase 3)
  - Duplicate transactions shown inline with strikethrough rather than in separate section for context

metrics:
  duration: 32m
  completed: 2026-04-07
  tasks_completed: 3
  tasks_total: 3
  files_created: 11
  files_modified: 0
---

# Phase 02 Plan 02: Upload Flow and Transaction Review Summary

Server actions for PDF parsing and transaction import with a complete upload-parse-review-import workflow on the /import page, featuring a 5-state UI state machine, drag-and-drop PDF upload, split categorized/uncategorized review, and duplicate detection via SHA-256 hashes.

## What Was Built

### Server Actions (Task 1)

Two server actions in `src/app/actions/import-actions.ts`:

1. **`parseStatement(formData: FormData)`**: Validates admin role, extracts PDF text via unpdf (`getDocumentProxy` + `extractText` with `mergePages: false`), loads default bank config from database, parses transactions using the config-driven parser from Plan 01, and checks for duplicate hashes against existing transactions.

2. **`importTransactions(...)`**: Validates admin role, creates an import record in the `imports` table, batch inserts transactions into the `transactions` table, cleans up the import record on failure, and revalidates `/import/history`.

Both actions follow the `verifyAdmin()` pattern established in `user-management.ts` and wrap all operations in try/catch with user-friendly error messages.

### Drop Zone Components (Task 2)

- **PdfDropZone**: Uses `react-dropzone` with PDF-only accept filter, 4MB max size, drag/hover/error flash states, disabled state for non-admin users, and `aria-label` accessibility.
- **CollapsedDropZone**: Summary bar showing filename and transaction count after successful parsing, with "Upload another" link.
- **ParseProgress**: Loading indicator with `Loader2` spinner and `Skeleton` grid mimicking the review layout.

### Import Page (Task 2)

`src/app/(authenticated)/import/page.tsx` implements a 5-state state machine:
- **idle**: Drop zone visible
- **parsing**: Progress skeleton with filename
- **review**: Full review screen with categorized/uncategorized split
- **importing**: Review screen with disabled import button and spinner
- **error**: Error card with red accent, context-specific message, and "Upload Again" CTA

Non-admin users see a disabled drop zone with "Only admins can import statements" message.

### Review Screen Components (Task 3)

- **StatementSummary**: 2x2 grid card showing statement period (formatted with date-fns), total transactions, total debits, and total credits (formatted with `Intl.NumberFormat`).
- **TransactionTable**: Desktop table with alternating row backgrounds, duplicate rows at 50% opacity with `line-through` and `AlertTriangle` icon, `tabular-nums` for amount alignment. Mobile view falls back to `TransactionCard` stacked cards.
- **TransactionCard**: Mobile card with description, date, amount, and category.
- **ImportBar**: Fixed bottom bar with transaction ready count and import button. Shows "Importing..." with spinner during import.
- **DuplicateWarning**: Amber accent banner with `AlertTriangle` icon and skip count message.
- **ReviewScreen**: Container composing all sub-components: collapsed drop zone, statement summary, duplicate warning, categorized section (green accent, empty in Phase 2), uncategorized section (amber accent), and import bar.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-02-04 | verifyAdmin() check at start of both parseStatement and importTransactions | Applied |
| T-02-05 | Server-side file.type === 'application/pdf' validation, 4MB client-side limit | Applied |
| T-02-06 | Server actions use Supabase auth session from cookies via createClient | Applied |
| T-02-07 | Transaction descriptions rendered as React text nodes (auto-escaped) | Applied |
| T-02-08 | Client-side 4MB limit, single file only (maxFiles: 1), disabled during parsing | Applied |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ee2631f | Server actions for PDF parsing and transaction import |
| 2 | 328a0a7 | Drop zone components and import page state machine |
| 3 | f204394 | Review screen and all review sub-components |

## Self-Check: PASSED

All 11 created files verified to exist. All 3 commit hashes verified in git log.
