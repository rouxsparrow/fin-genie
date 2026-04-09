# Roadmap: Fin Genie

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-04-08)
- 🟡 **v1.1 Insights & Management UX** — Phases 5-7 (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-04-08</summary>

- [x] Phase 1: Foundation & Auth (3/3 plans)
- [x] Phase 2: PDF Import Pipeline (4/4 plans)
- [x] Phase 3: Categorization Engine (4/4 plans)
- [x] Phase 4: Dashboard & Analytics (3/3 plans)

Full details archived: `.planning/milestones/v1.0-ROADMAP.md`

</details>

## Active Milestone

### v1.1 Insights & Management UX (Phases 5-7)

**Goal:** Improve analysis depth on the dashboard and make transaction, rule, and category workflows faster and clearer for regular use.

| Phase | Goal | Requirements | Success Criteria |
|-------|------|--------------|------------------|
| 5. Dashboard Analysis Enhancements | Deepen dashboard insight quality and create smooth drill-down paths into transactions | ANLC-07, ANLC-08, ANLC-09, ANLC-10 | 4 |
| 6. Transactions Exploration UX | Expand transaction filtering and preserve context across browsing flows | TXNS-01, TXNS-02, TXNS-03, TXNS-04 | 4 |
| 7. Rules & Categories Management UX | Improve admin maintenance flows for rules and categories across desktop and mobile | RULE-01, RULE-02, RULE-03, RULE-04, CATM-01, CATM-02, CATM-03, CATM-04 | 5 |

### Phase Details

### Phase 5: Dashboard Analysis Enhancements
**Goal**: Make the dashboard feel more analytical and more connected to the transaction explorer.
**Requirements**: ANLC-07, ANLC-08, ANLC-09, ANLC-10
**Plans**: 3 plans
Plans:
- [x] 05-01-PLAN.md — Establish shared dashboard query state, month navigation, and comparison-ready analytics contracts
- [x] 05-02-PLAN.md — Rebuild cards and charts around adaptive single-month, multi-month, and custom dashboard modes
- [x] 05-03-PLAN.md — Replace the preview list with an embedded explorer and add in-page drill-down modals
**Success Criteria** (what must be TRUE):
1. Users can compare the selected period against the previous equivalent period from the dashboard without manual calculation.
2. Users can click from summary cards or charts into a transaction view with matching filters already applied.
3. Dashboard widgets surface clearer breakdowns for concentration, category leaders, or merchant-level patterns in the selected range.
4. Dashboard-driven filters stay synchronized across charts, recent transactions, and linked navigation states.

### Phase 6: Transactions Exploration UX
**Goal**: Help users find the transactions they want faster without losing filter context.
**Requirements**: TXNS-01, TXNS-02, TXNS-03, TXNS-04
**Success Criteria** (what must be TRUE):
1. Users can combine multiple meaningful filters when exploring transactions.
2. The transactions page exposes clear query state, reset behavior, and URL-backed navigation that survives refreshes and links.
3. Loading, empty, and filtered states explain what happened and what the user can do next.
4. Navigation from dashboard insights into transactions preserves date range and category context end-to-end.

### Phase 7: Rules & Categories Management UX
**Goal**: Reduce friction and uncertainty when admins maintain categorization logic.
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, CATM-01, CATM-02, CATM-03, CATM-04
**Success Criteria** (what must be TRUE):
1. Admins can scan rule order, category assignments, and system-rule boundaries more easily on desktop and mobile.
2. Rule and category forms provide better validation and lower-friction create/edit flows.
3. Recategorization and exclude-from-stats actions communicate impact clearly before or after changes.
4. Category management surfaces system status and dashboard inclusion clearly enough to avoid accidental misuse.
5. Common maintenance tasks remain usable and understandable on smaller screens.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation & Auth | v1.0 | 3/3 | Complete | 2026-04-06 |
| 2. PDF Import Pipeline | v1.0 | 4/4 | Complete | 2026-04-07 |
| 3. Categorization Engine | v1.0 | 4/4 | Complete | 2026-04-07 |
| 4. Dashboard & Analytics | v1.0 | 3/3 | Complete | 2026-04-08 |
| 5. Dashboard Analysis Enhancements | v1.1 | 3/3 | Complete | 2026-04-09 |
| 6. Transactions Exploration UX | v1.1 | 0/0 | Pending | — |
| 7. Rules & Categories Management UX | v1.1 | 0/0 | Pending | — |
