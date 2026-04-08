# Quick Task 260408-mvw: Exclude categories from dashboard stats - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Task Boundary

Add option to set a category to be excluded from dashboard stats. Use case is for transactions like "rebate" or "refund" that shouldn't inflate or deflate spending totals.

</domain>

<decisions>
## Implementation Decisions

### Scope of exclusion
- **Full exclusion**: Excluded from ALL analytics — stat card totals, donut chart, bar chart, AND recent transactions preview. Fully invisible in analytics. Transactions still visible on the /transactions page.

### Where to configure it
- **Category-level toggle**: A boolean on the category entity (`exclude_from_stats` or similar). Admin toggles it from the /categories page. This follows the existing pattern where Card Payment uses `is_system` to be excluded. No rule-level granularity needed.

### Existing data handling
- **Retroactive**: Changing the toggle immediately affects all analytics queries. Data stays in the DB, just filtered out at query time — same pattern as how Card Payment (is_system=true) is already excluded. No migration of existing transaction data needed.

</decisions>

<specifics>
## Specific Ideas

- Follow the existing Card Payment exclusion pattern: analytics-actions.ts already filters out `is_system: true` categories. Extend this to also filter out `exclude_from_stats: true` categories.
- The /categories page needs a toggle for user categories. System categories (Card Payment) should not show this toggle (they're always excluded).
- The /transactions page should still show excluded category transactions — exclusion only affects dashboard analytics.

</specifics>
