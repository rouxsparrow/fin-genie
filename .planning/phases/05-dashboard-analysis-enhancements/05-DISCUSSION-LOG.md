# Phase 5: Dashboard Analysis Enhancements - Discussion Log

**Date:** 2026-04-09
**Status:** Completed

## Summary

The user provided a concrete dashboard redesign brief rather than choosing from menu-style options. Discussion focused on locking the dashboard’s range-specific behavior, card drill-down behavior, and whether transactions remain inline on the dashboard or route away.

## Discussion Record

### Time Range Behavior
- User requested replacing the `This Month` button with a month navigator using left and right arrow buttons around the current month label.
- User specified formatting:
  - current year: month only
  - prior years: `Month'YY`, example `Dec'25`
- Follow-up question asked:
  - Should the right arrow stop at the current month or allow future empty months?
- User answer:
  - Stop at current month.

### Single-Month Analysis
- User specified single-month top cards:
  - `Total Spending Amount` with comparisons vs last month and vs that month’s yearly monthly average
  - keep `Top Category`
  - keep `Largest Transaction`
  - keep `Recurring Spend`
- User specified click behavior:
  - `Top Category` opens a large modal showing all transactions in that category for that month, sorted largest to smallest
  - `Largest Transaction` opens a large modal showing the 5 largest transactions of the month
  - `Recurring Spend` opens a large modal showing all transactions in `Subscriptions`
- User specified chart/list changes:
  - replace monthly spending chart with `Category Trends`
  - keep donut chart, but move the category filter tag into the transactions section
  - rename `Recent Transactions` to `Transactions`
  - show all transactions for the month
  - add search
  - sortable `Date` and `Amount`
  - pagination at 10 results per page

### Multi-Month Presets
- User specified `Last 3 Months`, `Last 6 Months`, and `This Year` should use different summary cards from single-month view.
- User specified:
  - `Average Monthly Amount`
  - `Highest Month Amount`
  - `Lowest Month Amount`
  - `Top 3 Categories` with amount and percentage
  - clickable `Largest Transaction` showing top 5 largest in modal
  - `Recurring Spend` for subscriptions with total and average per month
- User requested:
  - keep the monthly spending chart
  - replace category donut with a category-comparison bar chart
  - show all transactions inline on the dashboard for the selected period

### Custom Range
- User specified custom-range top cards:
  - `Total Spending Amount` with `Avg / Day`
  - `Top Categories` with amount and percentage
  - `Largest Transaction`
  - `Total Days`
- User specified adaptive chart granularity:
  - 1-45 days: daily
  - 46-120 days: weekly
  - 121+ days: monthly
- User specified:
  - keep the category chart
  - show full transactions inline on the dashboard with search, sort, and 10/page pagination

### Modal / Navigation Behavior
- Follow-up question asked:
  - Does “continuaty transition into big modal” mean an animated in-page modal overlay rather than navigation?
- User answer:
  - Yes, in-page overlay.

### Transactions Placement
- Follow-up question asked:
  - In multi-month and custom views, should the transactions section live directly on the dashboard page or remain a preview with `View All`?
- User answer:
  - Live in page, and remove the `View All` button.

## Final Locked Decisions

- Month navigator replaces `This Month`.
- Month stepping stops at current month.
- Card drill-downs use animated in-page modal overlays.
- Transactions remain live on the dashboard page across single-month, multi-month, and custom-range views.
- `View All` is removed.

---

*Phase: 05-dashboard-analysis-enhancements*
*Discussion logged: 2026-04-09*
