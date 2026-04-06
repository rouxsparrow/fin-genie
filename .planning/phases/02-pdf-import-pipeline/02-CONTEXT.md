# Phase 2: PDF Import Pipeline - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Upload Citibank SG credit card PDFs, config-driven parsing, transaction review screen, duplicate detection, and import tracking. Admin can upload a PDF and see parsed transactions in a review screen, with import history and duplicate protection. No categorization logic (Phase 3) — this phase delivers raw parsed transactions.

</domain>

<decisions>
## Implementation Decisions

### Upload experience
- **D-01:** Full-page drop zone on the /import page — large Neo Brutalism bordered area with dashed border, icon, "Drag PDF here or click to browse" text
- **D-02:** Single file upload only — one PDF at a time. Bank statements are monthly so batching isn't needed.
- **D-03:** Inline progress — show spinner/skeleton on the same page after upload, then reveal parsed results. No page navigation during parsing.
- **D-04:** Drop zone collapses to a compact summary bar after successful parse: "statement.pdf — 15 transactions parsed" with an "Upload another" link. Results take full focus.
- **D-05:** Strict file validation with toast — only .pdf files, max 10MB. Reject with toast error ("Only PDF files are supported" / "File too large"). Drop zone border flashes red briefly.
- **D-06:** react-dropzone for drag-and-drop (already in dependencies from Phase 1 setup)

### Review screen layout
- **D-07:** Split sections — "Categorized" (top, green accent) and "Uncategorized" (bottom, amber/warning accent). Each section has a count badge. Matches IMPT-04.
- **D-08:** Essential columns: Date, Description, Amount (SGD), Category (badge or "—" if uncategorized). Compact and scannable.
- **D-09:** Statement summary card at top of review screen: statement period (e.g., "1 Mar — 31 Mar 2026"), total transactions, total debits, total credits.
- **D-10:** Bottom sticky bar for import action: "15 transactions ready — [Import]" button. Always visible while scrolling. Button disabled until Phase 3's 100% categorization gate.
- **D-11:** Duplicate detection shows parsed transactions with duplicate rows highlighted/strikethrough. User sees what would be skipped but can't import duplicates. Warning message explains overlap.
- **D-12:** Mobile: transactions transform to stacked cards (consistent with Phase 1 pattern D-34).

### Import history & gap tracking
- **D-13:** Import history lives on a separate /import/history page — linked from sidebar "Import" nav item or from the import page.
- **D-14:** Table list layout: File name, Statement period, Transaction count, Imported by, Date imported. Sorted newest first. Reuses Neo Brutalism Table component.
- **D-15:** Visual timeline bar at top of history page for statement period gaps (IMPT-07). Filled segments = imported months, empty/red segments = missing months. Compact horizontal visualization.

### Parser config & error handling
- **D-16:** Region-based JSON config with patterns — config defines: bank name, statement layout markers (header row pattern, transaction row regex, amount format, date format, page boundaries). Generic parser reads config — no bank-specific code.
- **D-17:** Bank format config stored in Supabase database (not in codebase). Citibank SG config seeded via migration. Enables future BANK-03 (add formats without code changes).
- **D-18:** Basic read-only config view on a settings sub-page — admin can see configured bank formats as read-only. Useful for debugging. No editing UI in v1.
- **D-19:** Statement period context for cross-year date inference — parser extracts statement period first (e.g., "1 Dec 2025 to 1 Jan 2026"), then infers year for each transaction date based on whether it falls within that range. Handles Dec-Jan rollover.
- **D-20:** Friendly error card on import page when parsing fails: "Could not parse this PDF" with specific reason (unsupported bank, no transactions found, corrupted file). Offer to try again.
- **D-21:** All-or-nothing parsing — if any page fails to parse, reject the entire statement. No partial/corrupt data. User uploads a clean PDF.

### Claude's Discretion
- Exact layout spacing and padding for drop zone
- Spinner/skeleton animation during parsing
- Exact JSON config field names and schema
- Timeline bar visual design details
- Transaction hash algorithm for duplicate detection
- Amount parsing logic for Citibank SG credit notation (parentheses for credits)
- Multi-page concatenation and noise row filtering heuristics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value, constraints, Citibank SG format details, money handling (cents storage)
- `.planning/REQUIREMENTS.md` — IMPT-01 through IMPT-07 requirements for this phase
- `.planning/ROADMAP.md` §Phase 2 — Success criteria, dependencies

### Phase 1 foundation
- `.planning/phases/01-foundation-auth/01-CONTEXT.md` — D-17/D-18 (Neo Brutalism theme), D-22 (table styling), D-23 (empty states), D-31 (toasts), D-34 (mobile stacked cards)
- `src/components/ui/` — All 13 Neo Brutalism UI components available
- `src/lib/supabase/client.ts` — Browser Supabase client pattern
- `src/lib/supabase/server.ts` — Server Supabase client pattern
- `src/lib/types/database.ts` — Database types (imports, transactions tables already typed)
- `supabase/migrations/00001_initial_schema.sql` — imports and transactions table schema
- `supabase/migrations/00004_fix_profiles_rls_security_definer.sql` — SECURITY DEFINER pattern for RLS

### Technology
- `CLAUDE.md` §PDF Parsing — unpdf library choice, serverless constraints, per-page text extraction
- `CLAUDE.md` §Money Handling Strategy — cents storage, parse/display patterns
- `CLAUDE.md` §File Upload Architecture — react-dropzone usage

### External references
- No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/empty-state.tsx` — EmptyState with icon + heading + body + CTA (for empty import history)
- `src/components/ui/table.tsx` — Neo Brutalism table (for import history, transaction review)
- `src/components/ui/card.tsx` — Card component (for summary card, error card)
- `src/components/ui/badge.tsx` — Badge component (for category badges, count badges)
- `src/components/ui/skeleton.tsx` — Skeleton loader (for parsing progress)
- `src/components/ui/toast / sonner` — Toast notifications (for validation errors, import success)
- `src/components/ui/dialog.tsx` — Dialog (potential for confirmation flows)
- `src/lib/supabase/server.ts` — Server client for server actions (PDF parsing, import saving)
- `supabase/migrations/00004_fix_profiles_rls_security_definer.sql` — `is_admin()` and `get_my_household_id()` functions for RLS

### Established Patterns
- Server actions pattern from Phase 1 (`src/app/actions/user-management.ts`) — reuse for import actions
- `useProfile` hook for role checking — reuse for admin-only import access
- SECURITY DEFINER functions for RLS — use for imports/transactions table policies
- Mobile stacked cards pattern from `src/components/user-table.tsx`

### Integration Points
- Sidebar already has "Import" nav item (currently disabled) — enable it in this phase
- Transactions table in DB already defined with amount_cents, transaction_hash, import_id
- Imports table in DB already defined with file_name, statement_period_start/end, transaction_count

</code_context>

<specifics>
## Specific Ideas

- Bank config in database rather than filesystem — user explicitly chose this for v2 extensibility (BANK-03)
- Read-only config viewer on settings page — debugging aid for admin
- Visual timeline bar for gap tracking — not just text, an actual visual month-by-month bar
- Duplicate handling shows the overlap visually (strikethrough) rather than just blocking silently

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-pdf-import-pipeline*
*Context gathered: 2026-04-07*
