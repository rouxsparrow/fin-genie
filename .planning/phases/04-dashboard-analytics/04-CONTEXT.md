# Phase 4: Dashboard & Analytics - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

All users can view spending analytics with charts and filterable transaction data across custom date ranges. Dashboard shows summary stats, category breakdown chart, spending trend chart, and recent transactions preview. Separate transactions page with full search/filter/sort. Viewer role sees identical analytics with full filtering — read-only means no import/categorize/manage, not restricted exploration.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- **D-01:** Multi-stat row with 4 cards: (1) Total Spending with ↑/↓ comparison indicators vs last month and vs monthly average, (2) Top Spending Category by amount, (3) Largest Transaction in range, (4) Recurring Spend (Subscriptions category total)
- **D-02:** Donut chart for category breakdown with side legend showing category name, amount, and percentage. Clicking a donut segment filters the dashboard/transaction list to that category.
- **D-03:** Vertical bar chart for monthly spending trend within the selected date range
- **D-04:** Recent transactions preview (last 5-10 transactions) below charts with "View all" link to /transactions
- **D-05:** Mobile layout stacks vertically: stat cards -> donut chart -> bar chart -> recent transactions (same pattern as other pages)

### Transaction list page
- **D-06:** Install @tanstack/react-table for headless sorting, filtering, and pagination. Pair with existing shadcn Table component.
- **D-07:** Server-side pagination — fetch page-by-page from Supabase. URL state tracks page/sort/filters via nuqs.
- **D-08:** 4 columns: Date, Description, Category (as badge), Amount (SGD formatted)
- **D-09:** Text search input filtering by description (server-side ILIKE) plus category filter dropdown
- **D-10:** Mobile uses card layout (same pattern as import review screen)
- **D-11:** Enable /transactions route in sidebar (currently disabled: true)

### Date range & filtering
- **D-12:** Date range selector at top of dashboard page. Same range applies to /transactions page. Synced via nuqs URL params.
- **D-13:** 5 presets: This month, Last 3 months, Last 6 months, This year, Custom. Custom opens a date picker.
- **D-14:** Install shadcn date-picker with react-day-picker for custom range selection
- **D-15:** Default date range is "This month" when visiting dashboard with no URL params
- **D-16:** All date range state stored in URL (?from=YYYY-MM-DD&to=YYYY-MM-DD) — back button works, bookmarkable

### Viewer experience
- **D-17:** Viewers see identical Dashboard and Transactions pages as admin. Sidebar hides Import, Rules, Categories, Settings (already handled by adminOnly flag in nav config).
- **D-18:** Viewers have full date range control, search, and filtering. Read-only means no import/categorize/manage actions.

### Claude's Discretion
- Chart color palette (should complement Neo Brutalism amber/black theme)
- Recharts configuration details (tooltips, legends, animations)
- Exact pagination page size (20-50 rows)
- Loading skeleton and empty state designs
- Server action structure for analytics aggregation queries

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ANLC-01 through ANLC-06 define analytics requirements

### Prior phase context
- `.planning/phases/01-foundation-auth/01-CONTEXT.md` — Auth patterns, role system, sidebar nav structure
- `.planning/phases/02-pdf-import-pipeline/02-CONTEXT.md` — Import data model, transaction schema
- `.planning/phases/03-categorization-engine/03-CONTEXT.md` — Category system, rule evaluation, Card Payment exclusion

### Technology stack
- `CLAUDE.md` — Technology Stack section defines recharts, @tanstack/react-table, nuqs, date-fns, react-day-picker choices and version pinning

### Existing database schema
- `src/lib/types/database.ts` — Full type definitions for transactions, categories, imports, rules tables

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/table.tsx` — shadcn Table component for transaction list
- `src/components/ui/badge.tsx` — Category badges (reuse for category column)
- `src/components/ui/card.tsx` — Card containers for stat cards and chart wrappers
- `src/components/ui/skeleton.tsx` — Loading skeletons
- `src/components/import/transaction-table.tsx` — Reference for currency formatting (`formatCurrency`), mobile card pattern, category badge rendering
- `src/components/import/transaction-card.tsx` — Mobile card component pattern to follow
- `src/app/actions/category-actions.ts` — `fetchCategories()` for category filter dropdown and donut chart labels
- `src/lib/hooks/use-profile.ts` — `useProfile()` hook for auth context and role checking

### Established Patterns
- Server components for data fetching, client components for interactions (review-screen, rules-table)
- Server actions with `verifyAdmin()` guard and discriminated union returns
- Neo Brutalism theme: 2px borders, stark shadows, amber accent, bold typography
- Mobile: card layout on mobile, table on desktop (hidden md:block / md:hidden pattern)
- URL state via nuqs for shareable filter state

### Integration Points
- Dashboard page at `src/app/(authenticated)/dashboard/page.tsx` — currently placeholder, needs full rewrite
- Transactions page at `src/app/(authenticated)/transactions/` — needs creation
- Sidebar nav in `src/components/app-sidebar.tsx` — Transactions item needs enabling (disabled: true -> false)
- Supabase queries need aggregation (SUM, GROUP BY category, GROUP BY month) for chart data
- Card Payment category (is_system=true) excluded from spending analytics per CATG-06

</code_context>

<specifics>
## Specific Ideas

- Stat card #1 (Total Spending) should show comparison arrows/indicators: "↑12% vs last month" and "↓5% vs monthly average" style
- Stat card #4 (Recurring Spend) specifically tracks the "Subscriptions" category — if it doesn't exist, show $0 or "No subscriptions category"
- Donut chart click -> filter is cross-component: clicking a category segment should update both the dashboard view and carry over to /transactions if navigated
- "View all" link in recent transactions preview navigates to /transactions with the current date range preserved in URL

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-dashboard-analytics*
*Context gathered: 2026-04-08*
