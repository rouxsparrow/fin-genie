# Phase 05: Dashboard Analysis Enhancements - Research

**Researched:** 2026-04-09
**Domain:** Dashboard analytics, URL-backed filter synchronization, and in-page transaction exploration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Time Range Navigation
- **D-01:** Replace the current `This Month` preset button with a month navigator formatted as `< April >` for the active month.
- **D-02:** Month labels should omit the year for months in the current year, and use `MMM'YY` format for prior years, for example `Dec'25`.
- **D-03:** The left arrow moves to the previous month and the right arrow moves to the next month.
- **D-04:** Month navigation must stop at the current month; users cannot move into future empty months.

### Single-Month Summary Cards
- **D-05:** In single-month view, the first card remains `Total Spending`, but it must show the total plus comparison against last month and against that calendar month's yearly monthly average.
- **D-06:** `Top Category`, `Largest Transaction`, and `Recurring Spend` remain as the other three top cards in single-month view with no metric change.
- **D-07:** Clicking `Top Category` opens a large in-page modal overlay showing all transactions for that category in the selected month, sorted by amount descending.
- **D-08:** Clicking `Largest Transaction` opens a large in-page modal overlay showing the 5 largest transactions for the selected month, sorted by amount descending.
- **D-09:** Clicking `Recurring Spend` opens a large in-page modal overlay showing all transactions in the `Subscriptions` category for the selected month, sorted by amount descending.

### Single-Month Charts And Transactions
- **D-10:** In single-month view, replace the current monthly spending chart with `Category Trends`, focused on category-level change versus the previous month.
- **D-11:** `Category Trends` should surface deltas like `Travel ↑ +80%` and `Food ↓ -15%`, emphasizing category movement rather than monthly totals.
- **D-12:** Clicking a category in the donut chart should move the filter tag into the transactions section instead of showing it near the top of the page.
- **D-13:** The section currently titled `Recent Transactions` becomes `Transactions` and should show the full month’s transactions, not a preview subset.
- **D-14:** The in-dashboard `Transactions` section must include search, sortable `Date` and `Amount` columns with visible up/down sort indicators, and pagination at 10 results per page.
- **D-15:** Remove the `View All` button; transactions should live directly in the dashboard page for this phase.

### Multi-Month Preset Views
- **D-16:** For `Last 3 Months`, `Last 6 Months`, and `This Year`, the top summary cards should switch to period-summary metrics rather than reusing the single-month card logic.
- **D-17:** Those preset views should show `Average Monthly Amount`, `Highest Month Amount`, `Lowest Month Amount`, and `Top 3 Categories` with amount and percentage, plus clickable `Largest Transaction` and recurring-spend summary for subscriptions across the whole period.
- **D-18:** In those preset views, keep the monthly spending chart unchanged.
- **D-19:** In those preset views, replace the donut chart with a bar chart that lets users switch between categories to compare category performance across the selected period.
- **D-20:** In those preset views, the dashboard `Transactions` section should show the full period’s transactions with search, sort, and 10-per-page pagination directly in-page.

### Custom Range Behavior
- **D-21:** In custom range view, the top cards should be `Total Spending Amount` with `Avg / Day`, `Top Categories` with amount and percentage, `Largest Transaction`, and `Total Days`.
- **D-22:** In custom range view, keep the category breakdown visualization rather than replacing it with the multi-month comparison bar chart.
- **D-23:** In custom range view, the time-series chart must adapt its aggregation granularity to range length: daily for 1-45 days, weekly for 46-120 days, and monthly for 121+ days.
- **D-24:** In custom range view, the dashboard `Transactions` section should show the full selected period’s transactions with search, sortable `Date` and `Amount`, and 10-per-page pagination directly in-page.

### Interaction Style
- **D-25:** Card drill-downs should use animated in-page modal overlays rather than routing users away to `/transactions`.

### Claude's Discretion
- Exact motion treatment for the month navigator and modal transitions, as long as they feel continuous and in-page.
- Exact wording and visual styling for delta badges, sort indicators, and pagination controls.
- Exact layout details for how the live transactions section adapts across desktop and mobile.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Direct transaction editing or recategorization from the dashboard — belongs with later transaction-management scope, not this phase.
- Merchant-management surfaces beyond summary insight usage — future analytics expansion, not Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLC-07 | User can compare the selected date range against the previous equivalent period from the dashboard summary. | Use a single range-classification helper plus equivalent-period date math and comparison-ready analytics payloads. [VERIFIED: codebase grep] |
| ANLC-08 | User can drill from dashboard insight cards or charts into a filtered transaction view without re-entering filters. | Keep dashboard filters in `nuqs`, reuse the transactions query contract, and open card drill-downs as modal overlays backed by the same filter state. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching] |
| ANLC-09 | User can see clearer dashboard breakdowns for top categories, merchants, or spending concentration within the selected period. | Expand server-side derived analytics for category deltas, top-N leaders, subscription totals, and description-based merchant summaries. [VERIFIED: codebase grep] |
| ANLC-10 | User can keep dashboard filters in sync across charts, recent transactions, and linked navigation states. | Group dashboard query params with `useQueryStates`, reset paging on filter changes, and route all widgets through one shared dashboard filter model. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching] |
</phase_requirements>

## Summary

[VERIFIED: codebase grep] The current dashboard is composed in one client page and loads four separate analytics actions in parallel: summary cards, category breakdown, monthly trend, and a 10-row recent-transactions preview. [VERIFIED: codebase grep] That structure works for Phase 4, but it does not yet support Phase 5’s richer range-aware layouts, card drill-down modals, or a first-class in-page transactions explorer.

[VERIFIED: codebase grep] The project already has the right primitives for this phase: URL-backed date state via `nuqs`, Recharts for dashboard visualizations, TanStack Table for sortable transaction tables, Radix Dialog for modal overlays, and a server action that already supports paginated/sorted transaction fetching. [VERIFIED: codebase grep] The planning opportunity is to unify those pieces instead of creating dashboard-specific variants that drift from the transactions page.

[VERIFIED: codebase grep] The main implementation risk is state drift. [VERIFIED: codebase grep] The dashboard currently stores only category as a URL filter, while the transactions page separately stores page, search, category, sort, and direction in the URL. [CITED: https://nuqs.dev/docs/batching] `useQueryStates` is designed for keys that move together, so the safest Phase 5 plan is a single shared dashboard filter contract that drives cards, charts, modal drill-downs, and the embedded transactions section.

**Primary recommendation:** Keep the existing stack, add a shared dashboard query-state model, and introduce a consolidated dashboard analysis payload plus a reused paginated transaction table path. [VERIFIED: codebase grep]

## Project Constraints (from CLAUDE.md)

- [VERIFIED: codebase grep] Hosting is Vercel, with serverless functions for PDF parsing and edge runtime UI expectations.
- [VERIFIED: codebase grep] Database is Supabase Postgres with built-in Auth and Row Level Security.
- [VERIFIED: codebase grep] UI framework is Next.js App Router with shadcn/ui.
- [VERIFIED: codebase grep] Charts standard is Recharts.
- [VERIFIED: codebase grep] Currency is SGD only in v1.
- [VERIFIED: codebase grep] Before file changes, work should proceed through a GSD workflow rather than direct ad-hoc edits.
- [VERIFIED: codebase grep] No project-local conventions or skills are currently defined beyond following existing code patterns.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `nuqs` | `2.8.9` current registry, `^2.8.9` in repo | URL-backed dashboard and transaction filters | `useQueryStates` supports grouped search-param state, which matches this phase’s need for synchronized filters. [VERIFIED: npm registry] [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching] |
| `@tanstack/react-table` | `8.21.3` current registry, `^8.21.3` in repo | Sortable in-dashboard transactions table | The transactions page already uses TanStack Table in `manualSorting` mode, so dashboard tables can reuse the same server-sorted pattern. [VERIFIED: npm registry] [VERIFIED: codebase grep] [CITED: https://tanstack.com/table/latest/docs/guide/sorting] |
| `recharts` | `3.8.1` current registry, `^3.8.1` in repo | Donut, bar, and range-adaptive analytics charts | The dashboard already uses Recharts, and the official API supports `PieChart`, `BarChart`, tooltips, and responsive containers used in this repo. [VERIFIED: npm registry] [VERIFIED: codebase grep] [CITED: https://recharts.github.io/en-US/api/PieChart/] [CITED: https://recharts.github.io/en-US/api/BarChart/] |
| `date-fns` | `4.1.0` current registry, `^4.1.0` in repo | Equivalent-period math, month navigation, and range bucketing | The codebase already uses `startOfMonth`, `endOfMonth`, `subMonths`, `format`, and `parseISO` for range handling, so Phase 5 should extend that library rather than add another date utility. [VERIFIED: npm registry] [VERIFIED: codebase grep] |
| `@radix-ui/react-dialog` | `^1.1.15` in repo | Accessible drill-down overlays | Phase 5 requires animated in-page modal overlays, and Radix Dialog is already installed so the plan can avoid custom focus-trap and portal work. [VERIFIED: codebase grep] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | repo uses `^3.25.76`; registry latest is `4.3.6` | Server action input validation | Keep using the existing project version for Phase 5 validation and avoid bundling a Zod major upgrade into this UI/analytics phase. [VERIFIED: npm registry] [VERIFIED: codebase grep] |
| `@supabase/supabase-js` | repo uses `^2.101.1`; registry latest is `2.103.0` | Analytics and transaction queries | Reuse the existing authenticated query path in server actions; no new data client is needed. [VERIFIED: npm registry] [VERIFIED: codebase grep] |
| `@supabase/ssr` | repo uses `^0.10.0`; registry latest is `0.10.2` | Authenticated App Router data access | Relevant only insofar as Phase 5 should stay inside the current authenticated App Router pattern. [VERIFIED: npm registry] [VERIFIED: codebase grep] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useQueryStates` grouped dashboard filters | Multiple isolated `useQueryState` hooks spread across components | Works, but increases the chance of filter drift between cards, charts, and the transactions section. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching] |
| Reusing `TransactionDataTable` and `TransactionPagination` | A new dashboard-only table implementation | Faster short-term styling freedom, but duplicates sort indicators, paging behavior, and accessibility work already present on the transactions page. [VERIFIED: codebase grep] |
| Radix Dialog overlays | Custom portal/focus-trap modal code | Unnecessary accessibility and focus-management risk for a phase that already has Dialog installed. [VERIFIED: codebase grep] |

**Installation:**
```bash
# No new package is required for the recommended Phase 5 path.
# Reuse packages already present in package.json.
```

**Version verification:** [VERIFIED: npm registry] Current registry checks on 2026-04-09 returned `nuqs@2.8.9`, `recharts@3.8.1`, `@tanstack/react-table@8.21.3`, `date-fns@4.1.0`, `zod@4.3.6`, `@supabase/supabase-js@2.103.0`, and `@supabase/ssr@0.10.2`. [VERIFIED: codebase grep] The repo currently pins `next@15.5.14` and `react@19.1.0`, so Phase 5 should plan against the installed project versions instead of folding in a framework upgrade. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/actions/analytics-actions.ts          # Shared analytics queries + derived dashboard payloads
├── components/dashboard/                     # Range-mode cards, charts, navigator, drill-down modal
├── components/transactions/                  # Reused table, columns, search, pagination primitives
└── lib/hooks/                                # Shared URL-backed filter hooks and range-mode helpers
```

### Pattern 1: Single Dashboard Filter Contract
**What:** Keep all dashboard-view query state in one typed `nuqs` group, including date preset/range, category filter, search term, sort, direction, and page. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching]

**When to use:** Use for every interaction that changes what the dashboard transactions section or drill-down modals show. [VERIFIED: codebase grep]

**Why:** [VERIFIED: codebase grep] The current dashboard only URL-persists `category`, while the transactions page persists `page`, `search`, `category`, `sort`, and `dir`. [VERIFIED: codebase grep] Phase 5 needs those views to stay aligned, so planners should treat the query schema as the contract between dashboard widgets and transaction exploration.

**Example:**
```tsx
// Source: https://nuqs.dev/docs/batching
const [dashboardQuery, setDashboardQuery] = useQueryStates({
  from: parseAsString,
  to: parseAsString,
  preset: parseAsString.withDefault('this-month'),
  category: parseAsString.withDefault(''),
  search: parseAsString.withDefault(''),
  sort: parseAsString.withDefault('transaction_date'),
  dir: parseAsString.withDefault('desc'),
  page: parseAsInteger.withDefault(1),
})

function applyCategory(category: string | null) {
  setDashboardQuery({
    category: category ?? '',
    page: 1
  })
}
```

### Pattern 2: Consolidated Dashboard Analysis Payload
**What:** Add one server action that returns the full analysis payload for the active range mode, including summary-card data, comparison-period stats, chart datasets, and drill-down metadata. [VERIFIED: codebase grep]

**When to use:** Use for top-level dashboard rendering and range transitions. [VERIFIED: codebase grep]

**Why:** [VERIFIED: codebase grep] The dashboard currently calls four analytics actions and each action redoes range validation and, in most cases, exclusion filtering. [VERIFIED: codebase grep] A consolidated payload keeps comparison logic and category exclusion rules consistent across widgets.

**Example:**
```ts
// Source: derived from existing analytics-actions.ts patterns
type DashboardRangeMode = 'single-month' | 'multi-month' | 'custom'

type DashboardAnalysisPayload = {
  mode: DashboardRangeMode
  cards: unknown[]
  chartPrimary: unknown
  chartSecondary: unknown
  comparison: {
    from: string
    to: string
  } | null
  transactionDefaults: {
    categoryId?: string
    sortBy: 'transaction_date' | 'amount_cents'
    sortDir: 'asc' | 'desc'
  }
}
```

### Pattern 3: Reuse Transactions-Page Table Primitives
**What:** Reuse `TransactionSearchBar`, `TransactionDataTable`, `TransactionPagination`, and the server-sorted `fetchTransactionList` pattern inside the dashboard transactions section. [VERIFIED: codebase grep]

**When to use:** Use for the embedded transactions section across single-month, preset multi-month, and custom-range layouts. [VERIFIED: codebase grep]

**Why:** [VERIFIED: codebase grep] The transactions page already resets page on filter changes, debounces search, performs server-side sort, and exposes visible sort indicators. [VERIFIED: codebase grep] That is almost exactly what D-14, D-20, and D-24 require.

**Example:**
```tsx
// Source: https://tanstack.com/table/latest/docs/guide/sorting
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true
})
```

### Pattern 4: Range-Mode Rendering, Not One Universal Dashboard Layout
**What:** Treat `single-month`, `multi-month preset`, and `custom` as separate presentation modes with shared state and shared query helpers. [VERIFIED: codebase grep]

**When to use:** Use for cards, chart selection, and drill-down behavior. [VERIFIED: codebase grep]

**Why:** [VERIFIED: codebase grep] The context explicitly requires different cards and charts by range type, and the current `useDateRange` hook already exposes `preset` alongside `from` and `to`. [VERIFIED: codebase grep]

### Anti-Patterns to Avoid
- **Do not extend `fetchRecentTransactions` into the dashboard explorer.** [VERIFIED: codebase grep] It hard-caps results with `.limit(limit)` and only sorts by newest date, so it cannot satisfy full-table search/sort/pagination requirements.
- **Do not keep a separate local-only dashboard table state.** [VERIFIED: codebase grep] That would break Phase 5’s synchronization requirement and weaken future Phase 6 reuse.
- **Do not couple “previous period” to “previous month” for every range.** [VERIFIED: codebase grep] Current stats logic computes only previous-month totals from the range start month, which is insufficient for custom ranges and multi-month presets.
- **Do not route card drill-downs away from the page.** [VERIFIED: codebase grep] D-25 explicitly requires animated in-page overlays.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared dashboard filter state | A custom global store or ad-hoc `URLSearchParams` wrapper | `nuqs` `useQueryStates` | The repo already uses `nuqs`, and the docs explicitly support grouped query keys that move together. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching] |
| Sortable/paginated dashboard transactions | A new client-only table system | Existing TanStack Table + transaction components | The repo already has server-sorted columns, icons, paging, and empty-state behavior to reuse. [VERIFIED: codebase grep] |
| Drill-down modal infrastructure | Custom focus trap / overlay stack | Radix Dialog | Accessible dialogs are already installed, reducing scope and regression risk. [VERIFIED: codebase grep] |
| Date bucketing and comparison math | String math on `YYYY-MM-DD` values | `date-fns` helpers | The repo already relies on `date-fns`, and Phase 5 needs more of the same kind of date arithmetic. [VERIFIED: codebase grep] |
| New charting abstraction | A second analytics chart library | Existing Recharts components | Recharts already powers the dashboard and supports the needed chart families. [VERIFIED: codebase grep] [CITED: https://recharts.github.io/en-US/api/PieChart/] |

**Key insight:** [VERIFIED: codebase grep] Phase 5 is mostly an orchestration and derivation problem, not a library gap. The fastest safe plan is to centralize analytics derivation and reuse existing query-state, table, and chart primitives.

## Common Pitfalls

### Pitfall 1: Incorrect Equivalent-Period Math
**What goes wrong:** [VERIFIED: codebase grep] Comparison badges look correct for “This Month” but become misleading for custom ranges and multi-month presets.

**Why it happens:** [VERIFIED: codebase grep] The current stats action calculates `prevFrom` and `prevTo` as the previous calendar month anchored to the `from` date instead of the previous equivalent period length.

**How to avoid:** Use one helper that derives both the active range mode and its comparison window before any analytics aggregation runs. [ASSUMED]

**Warning signs:** [VERIFIED: codebase grep] A 90-day preset is compared to a single prior month, or custom-range comparisons ignore exact day count.

### Pitfall 2: Filter Drift Between Charts and Transactions
**What goes wrong:** Cards, chart selections, and the embedded transactions section show different slices of data. [VERIFIED: codebase grep]

**Why it happens:** [VERIFIED: codebase grep] The dashboard currently persists only category in the URL, while the transactions page manages search, sort, dir, and page separately.

**How to avoid:** Promote dashboard query state into one shared URL-backed schema and make every widget read from it. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching]

**Warning signs:** [VERIFIED: codebase grep] Changing a chart filter does not reset page, or drill-down modals open with stale sort/search state.

### Pitfall 3: Reusing Preview-List Logic for the Full Explorer
**What goes wrong:** The dashboard transactions section still behaves like a teaser and cannot satisfy D-14, D-20, or D-24. [VERIFIED: codebase grep]

**Why it happens:** [VERIFIED: codebase grep] `RecentTransactions` is a preview card with a hard-coded title, a `View All` link, and “showing 10 of total” text.

**How to avoid:** Replace preview-specific UI with a reusable explorer shell backed by paginated `fetchTransactionList`-style queries. [VERIFIED: codebase grep]

**Warning signs:** [VERIFIED: codebase grep] The section still says “Recent Transactions” or still links out to `/transactions`.

### Pitfall 4: “Other” Bucket Can’t Cleanly Drill Down
**What goes wrong:** Users click the “Other” donut slice and expect a coherent filtered transaction list. [VERIFIED: codebase grep]

**Why it happens:** [VERIFIED: codebase grep] The current donut component groups categories after the top five into a synthetic `__other__` bucket.

**How to avoid:** Treat `__other__` as a non-drill-down visualization bucket, or define an explicit multi-category filter contract before planning interactive behavior. [ASSUMED]

**Warning signs:** [VERIFIED: codebase grep] The dashboard sets `category=__other__` in the URL and returns no matching transactions.

### Pitfall 5: Merchant Insight Without a Merchant Field
**What goes wrong:** Planner assumes merchant-level analytics can rely on a normalized merchant column. [VERIFIED: codebase grep]

**Why it happens:** [VERIFIED: codebase grep] The typed transaction model exposes `description`, `transaction_date`, `amount_cents`, and `category_id`, but not a distinct merchant field.

**How to avoid:** Plan merchant-pattern widgets as description-derived groupings unless a separate normalization step is added to scope. [VERIFIED: codebase grep] [ASSUMED]

**Warning signs:** [VERIFIED: codebase grep] Tasks refer to merchant joins or merchant IDs that do not exist in the schema.

## Code Examples

Verified patterns from official sources and the current codebase:

### Shared URL Query State
```tsx
// Source: https://nuqs.dev/docs/batching
const [filters, setFilters] = useQueryStates({
  category: parseAsString.withDefault(''),
  search: parseAsString.withDefault(''),
  sort: parseAsString.withDefault('transaction_date'),
  dir: parseAsString.withDefault('desc'),
  page: parseAsInteger.withDefault(1),
})
```

### Manual Server-Side Sorting
```tsx
// Source: https://tanstack.com/table/latest/docs/guide/sorting
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true,
})
```

### Existing Query Shape Worth Reusing
```ts
// Source: current codebase analytics-actions.ts
const result = await fetchTransactionList({
  from,
  to,
  page,
  pageSize: 10,
  search: debouncedSearch || undefined,
  categoryId: category || undefined,
  sortBy: sort || 'transaction_date',
  sortDir: (dir as 'asc' | 'desc') || 'desc',
})
```

### Recharts Responsive Chart Composition
```tsx
// Source: https://recharts.github.io/en-US/api/PieChart/
<ResponsiveContainer width="100%" height={260}>
  <PieChart>
    <Pie data={data} dataKey="amount" nameKey="categoryName" />
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dashboard preview list with “View All” link | Embedded searchable, sortable, paginated explorer | Phase 5 target from locked decisions | Keeps analysis and transaction review in one place. [VERIFIED: codebase grep] |
| Single dashboard category filter in URL | Shared dashboard filter contract covering search, sort, dir, page, and category | Recommended for Phase 5 | Prevents cross-widget drift and makes linked navigation durable. [VERIFIED: codebase grep] [CITED: https://nuqs.dev/docs/batching] |
| One fixed monthly chart pattern | Range-mode chart selection by single-month, multi-month preset, or custom range | Phase 5 target from locked decisions | Lets the dashboard become analytical instead of one-layout-fits-all. [VERIFIED: codebase grep] |

**Deprecated/outdated:**
- `RecentTransactions` as a preview-only component is outdated for this phase because its hard limit, title, and CTA conflict with the locked Phase 5 behavior. [VERIFIED: codebase grep]
- `fetchDashboardStats` returning only `previousMonthSpending` is outdated for this phase because ANLC-07 and D-16 through D-24 require broader equivalent-period comparisons. [VERIFIED: codebase grep]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A single shared comparison-window helper should be used before analytics aggregation. | Common Pitfalls | Low; planner may choose a different but equivalent implementation shape. |
| A2 | The synthetic `__other__` donut bucket should be non-drill-down unless a multi-category contract is introduced. | Common Pitfalls | Medium; if the user expects `Other` drill-down, plan tasks will need explicit support. |
| A3 | Merchant-pattern insight can be delivered from `description`-derived grouping without adding a normalized merchant model in this phase. | Common Pitfalls | Medium; if description quality is poor, merchant widgets may need scope adjustment. |

## Open Questions

1. **Should dashboard drill-down modals share the same search/sort/page params as the embedded transactions section, or hold their own ephemeral modal-only state?**
   - What we know: [VERIFIED: codebase grep] ANLC-10 requires synchronization across charts, transactions, and linked navigation states, and D-25 requires modals to stay in-page.
   - What's unclear: [ASSUMED] Whether modal interactions should write every sort/page change back into the URL or only seed from URL state.
   - Recommendation: Default to URL-seeded modal filters with local-only page/search state unless the planner needs deep-linkable modal URLs.

2. **How should the month navigator coexist with preset buttons for `Last 3 Months`, `Last 6 Months`, and `This Year`?**
   - What we know: [VERIFIED: codebase grep] The current selector is preset-button based, while D-01 through D-04 require month stepping for the active month view.
   - What's unclear: [ASSUMED] Whether the month navigator replaces only the `This Month` button or becomes a separate control that sets the single-month preset.
   - Recommendation: Plan a dedicated single-month navigator control plus preserved preset buttons for broader range modes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js app, build, lint, package scripts | ✓ | `v24.13.0` | — |
| npm | Package verification and script execution | ✓ | `11.6.2` | — |
| `rg` | Fast codebase search during implementation | ✓ | `15.1.0` | `grep` |
| `pnpm` | Optional only | ✓ | `10.30.2` | npm remains standard in this repo |
| Docker | Not required for Phase 5 planning or implementation | ✗ / not checked as required | — | — |

**Missing dependencies with no fallback:**
- None. [VERIFIED: codebase grep]

**Missing dependencies with fallback:**
- None required for this phase. [VERIFIED: codebase grep]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth plus existing authenticated server actions. [VERIFIED: codebase grep] |
| V3 Session Management | yes | Current Next.js App Router + Supabase SSR session pattern already in repo. [VERIFIED: codebase grep] |
| V4 Access Control | yes | Household-scoped queries and Supabase RLS project constraint. [VERIFIED: codebase grep] |
| V5 Input Validation | yes | `zod` schemas for date range and transaction list input. [VERIFIED: codebase grep] |
| V6 Cryptography | no direct Phase 5 feature work | Reuse platform/session primitives; do not add custom crypto. [VERIFIED: codebase grep] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Query-param tampering for category/search/sort/page | Tampering | Validate all server action params with `zod` before querying. [VERIFIED: codebase grep] |
| Cross-household data leakage through drill-downs | Information Disclosure | Keep using authenticated server actions plus household-scoped Supabase queries. [VERIFIED: codebase grep] |
| Inconsistent exclusion of system/excluded categories | Information Disclosure | Apply one shared exclusion helper to all analytics and transaction queries. [VERIFIED: codebase grep] |
| Search-driven expensive queries | Denial of Service | Reuse the existing debounced search pattern and server-side pagination. [VERIFIED: codebase grep] |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: codebase grep] `/Users/rouxsparrow/Code/fin-genie/CLAUDE.md` - project constraints and workflow rules.
- [VERIFIED: codebase grep] `/Users/rouxsparrow/Code/fin-genie/.planning/phases/05-dashboard-analysis-enhancements/05-CONTEXT.md` - locked scope and UX decisions.
- [VERIFIED: codebase grep] `/Users/rouxsparrow/Code/fin-genie/src/app/(authenticated)/dashboard/page.tsx` - current dashboard loading and state model.
- [VERIFIED: codebase grep] `/Users/rouxsparrow/Code/fin-genie/src/app/actions/analytics-actions.ts` - current analytics and transaction query shapes.
- [VERIFIED: codebase grep] `/Users/rouxsparrow/Code/fin-genie/src/app/(authenticated)/transactions/page.tsx` - current URL-backed transaction explorer behavior.
- [VERIFIED: npm registry] `https://www.npmjs.com/package/nuqs`
- [VERIFIED: npm registry] `https://www.npmjs.com/package/recharts`
- [VERIFIED: npm registry] `https://www.npmjs.com/package/@tanstack/react-table`
- [VERIFIED: npm registry] `https://www.npmjs.com/package/date-fns`
- [VERIFIED: npm registry] `https://www.npmjs.com/package/zod`
- [VERIFIED: npm registry] `https://www.npmjs.com/package/@supabase/supabase-js`
- [VERIFIED: npm registry] `https://www.npmjs.com/package/@supabase/ssr`

### Secondary (MEDIUM confidence)
- [CITED: https://nuqs.dev/docs/batching] `useQueryStates` grouped query-key documentation.
- [CITED: https://tanstack.com/table/latest/docs/guide/sorting] TanStack Table sorting guide.
- [CITED: https://recharts.github.io/en-US/api/PieChart/] Recharts `PieChart` API and responsive guidance.
- [CITED: https://recharts.github.io/en-US/api/BarChart/] Recharts `BarChart` API.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - libraries are already installed in the repo and current versions were checked against npm on 2026-04-09.
- Architecture: HIGH - recommendations are anchored in current dashboard/transactions code paths and the locked Phase 5 context.
- Pitfalls: HIGH - most pitfalls come directly from mismatches between current implementation and locked Phase 5 requirements, with only three explicitly logged assumptions.

**Research date:** 2026-04-09
**Valid until:** 2026-05-09
