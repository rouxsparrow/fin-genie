# Phase 5: Dashboard Analysis Enhancements - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve the dashboard so it provides deeper analysis, range-aware summaries, richer drill-down behavior, and a full in-page transactions explorer for the selected dashboard period. This phase refines dashboard analytics and dashboard-linked exploration only; it does not add new product areas like budgeting, merchant management, or direct transaction editing.

</domain>

<decisions>
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

### the agent's Discretion
- Exact motion treatment for the month navigator and modal transitions, as long as they feel continuous and in-page.
- Exact wording and visual styling for delta badges, sort indicators, and pagination controls.
- Exact layout details for how the live transactions section adapts across desktop and mobile.

</decisions>

<specifics>
## Specific Ideas

- The user wants month navigation to feel like direct month stepping, using arrow buttons around the active month label.
- Single-month analysis should feel much richer than broader range views; the dashboard should adapt rather than present one fixed layout for every range.
- The transactions section should no longer feel like a teaser; it becomes a first-class part of the dashboard analysis surface.
- Card drill-downs should feel like continuity transitions into a large modal overlay, not like hard page navigation.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Sources
- `.planning/PROJECT.md` — milestone intent, dashboard-analysis focus, and project-level constraints
- `.planning/REQUIREMENTS.md` — Phase 5 requirements ANLC-07 through ANLC-10
- `.planning/ROADMAP.md` — current milestone roadmap and Phase 5 goal/success criteria

### Existing Dashboard Implementation
- `src/app/(authenticated)/dashboard/page.tsx` — current dashboard composition, loading states, category filter behavior, and recent-transactions integration
- `src/app/actions/analytics-actions.ts` — current analytics data model, aggregations, and transaction-fetching behavior
- `src/components/dashboard/date-range-selector.tsx` — current preset/date-range UI that Phase 5 will reshape
- `src/lib/hooks/use-date-range.ts` — current URL-backed date range state and preset model
- `src/components/dashboard/stat-card-grid.tsx` — current top-card structure and comparison patterns
- `src/components/dashboard/recent-transactions.tsx` — current preview-list behavior that will become the in-page transactions explorer

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/dashboard/stat-card-grid.tsx`: Existing summary-card composition can be expanded into range-specific card logic instead of rebuilding cards from scratch.
- `src/components/dashboard/category-donut-chart.tsx`: Existing category click behavior and selected-category state can be reused for in-dashboard filtering changes.
- `src/components/dashboard/recent-transactions.tsx`: Existing transaction rendering patterns can be evolved into the live dashboard transactions section.
- `src/components/dashboard/date-range-selector.tsx`: Existing preset controls provide the base place to introduce month-navigation behavior.
- `src/components/transactions/transaction-data-table.tsx`, `src/components/transactions/columns.tsx`, and `src/components/transactions/transaction-pagination.tsx`: Existing sort and pagination patterns from the transactions page are reusable for the dashboard’s full transactions section.

### Established Patterns
- Dashboard state is client-driven and URL-backed with `nuqs`, so new filtering and range behavior should preserve that pattern instead of introducing disconnected local-only state.
- Analytics data is currently assembled through server actions in `src/app/actions/analytics-actions.ts`, with JS-side aggregation on fetched transactions.
- The existing UI already distinguishes initial loading vs subsequent transitions, which supports richer range-switching behavior in this phase.
- Category exclusion rules already exist in analytics queries, so all new dashboard insights must continue respecting excluded/system categories.

### Integration Points
- `src/app/(authenticated)/dashboard/page.tsx` is the central integration point for range switching, chart swapping, card click behavior, and the embedded transactions section.
- `src/app/actions/analytics-actions.ts` will need to supply both current-period and comparative-period data for new card logic and category-trend views.
- Dashboard drill-down behavior should stay aligned with the broader transaction-filter model established in `src/app/(authenticated)/transactions/page.tsx`, even when the UI remains in-page for this phase.

</code_context>

<deferred>
## Deferred Ideas

- Direct transaction editing or recategorization from the dashboard — belongs with later transaction-management scope, not this phase.
- Merchant-management surfaces beyond summary insight usage — future analytics expansion, not Phase 5.

</deferred>

---

*Phase: 05-dashboard-analysis-enhancements*
*Context gathered: 2026-04-09*
