# Phase 4: Dashboard & Analytics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 04-dashboard-analytics
**Areas discussed:** Dashboard layout & charts, Transaction list page, Date range & filtering, Viewer experience

---

## Dashboard Layout & Charts

| Option | Description | Selected |
|--------|-------------|----------|
| Big number hero card | Large total spending at top, smaller secondary stats below | |
| Multi-stat row | 3-4 equal cards in a row with key metrics | ✓ (modified) |
| You decide | Claude picks | |

**User's choice:** 4 stat cards: (1) Total Spending with comparison indicators vs last month and vs monthly average, (2) Top Spending Category, (3) Largest Transaction, (4) Recurring Spend (Subscriptions category)
**Notes:** User initially selected multi-stat row, then customized to specific 4-card layout with comparison indicators on the total spending card.

| Option | Description | Selected |
|--------|-------------|----------|
| Donut chart with legend | Donut with category names + amounts + percentages | ✓ |
| Horizontal bar chart | Bars sorted by amount descending | |
| You decide | | |

**User's choice:** Donut chart with legend

| Option | Description | Selected |
|--------|-------------|----------|
| Bar chart — monthly | Vertical bars per month | ✓ |
| Line chart — monthly | Connected line for trajectory | |
| You decide | | |

**User's choice:** Bar chart — monthly

| Option | Description | Selected |
|--------|-------------|----------|
| Stack vertically on mobile | Summary -> donut -> bar chart full-width | ✓ |
| Tabs per section | Tab bar to switch between sections | |
| You decide | | |

**User's choice:** Stack vertically on mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Click donut segment to filter | Interactive — filters dashboard/transactions | ✓ |
| Display only | Purely visual | |
| You decide | | |

**User's choice:** Click segment to filter

| Option | Description | Selected |
|--------|-------------|----------|
| Recent transactions preview | Last 5-10 transactions with "View all" link | ✓ |
| Nothing — charts only | Dashboard is just stats + charts | |
| You decide | | |

**User's choice:** Recent transactions preview

---

## Transaction List Page

| Option | Description | Selected |
|--------|-------------|----------|
| @tanstack/react-table | Headless table with sort/filter/pagination | ✓ |
| Custom sort/filter | Build manually on existing shadcn Table | |
| You decide | | |

**User's choice:** Install @tanstack/react-table

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side pagination | Fetch page-by-page from Supabase | ✓ |
| Client-side with all data | Fetch all upfront, filter client-side | |
| You decide | | |

**User's choice:** Server-side pagination

| Option | Description | Selected |
|--------|-------------|----------|
| Date, Description, Category, Amount | Core 4 columns | ✓ |
| + Import source | 5 columns with statement source | |
| You decide | | |

**User's choice:** 4 columns

| Option | Description | Selected |
|--------|-------------|----------|
| Text search on description | Simple text input, ILIKE query | |
| Text search + category filter dropdown | Two filter controls | ✓ |
| You decide | | |

**User's choice:** Text search + category filter dropdown

| Option | Description | Selected |
|--------|-------------|----------|
| Card layout on mobile | Reuse import review card pattern | ✓ |
| Compact table with horizontal scroll | Keep table, allow scroll | |
| You decide | | |

**User's choice:** Card layout on mobile

---

## Date Range & Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Top of dashboard, shared with /transactions | Synced via nuqs URL params | ✓ |
| Separate per page | Each page has own range | |
| You decide | | |

**User's choice:** Shared at top of dashboard, synced via nuqs

| Option | Description | Selected |
|--------|-------------|----------|
| This month, Last 3, Last 6, This year, Custom | 5 presets | ✓ |
| + Last month, All time | 6 presets | |
| You decide | | |

**User's choice:** 5 presets

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn date-picker with react-day-picker | Calendar widget, Neo Brutalism styled | ✓ |
| Simple text inputs | YYYY-MM-DD inputs | |
| You decide | | |

**User's choice:** shadcn date-picker

| Option | Description | Selected |
|--------|-------------|----------|
| This month | Current month's spending | ✓ |
| Last 3 months | Wider default view | |
| You decide | | |

**User's choice:** This month

| Option | Description | Selected |
|--------|-------------|----------|
| nuqs URL state | Back button works, bookmarkable | ✓ |
| Component state only | Resets on refresh | |
| You decide | | |

**User's choice:** nuqs URL state

---

## Viewer Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Same dashboard + transactions, no admin pages | Identical analytics, sidebar hides admin items | ✓ |
| Simplified dashboard | Stripped-down for viewers | |
| You decide | | |

**User's choice:** Same dashboard and transactions as admin

| Option | Description | Selected |
|--------|-------------|----------|
| Full date range control | Read-only means no import/manage, can explore | ✓ |
| Fixed to current month | Simpler but limits usefulness | |
| You decide | | |

**User's choice:** Full date range control

---

## Claude's Discretion

- Chart color palette
- Recharts configuration (tooltips, legends, animations)
- Pagination page size
- Loading skeleton and empty state designs
- Server action structure for analytics queries

## Deferred Ideas

None — discussion stayed within phase scope
