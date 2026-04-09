# Requirements: Fin Genie

**Defined:** 2026-04-09
**Core Value:** Household members can see where their money goes — upload a bank statement, have transactions auto-categorized, and view spending breakdowns by category and time period.

## v1.1 Requirements

### Dashboard Analysis

- [x] **ANLC-07**: User can compare the selected date range against the previous equivalent period from the dashboard summary.
- [x] **ANLC-08**: User can drill from dashboard insight cards or charts into a filtered transaction view without re-entering filters.
- [x] **ANLC-09**: User can see clearer dashboard breakdowns for top categories, merchants, or spending concentration within the selected period.
- [x] **ANLC-10**: User can keep dashboard filters in sync across charts, recent transactions, and linked navigation states.

### Transactions Experience

- [ ] **TXNS-01**: User can filter transactions by multiple relevant criteria beyond free-text search and a single category filter.
- [ ] **TXNS-02**: User can quickly clear, inspect, and share the current transaction query state through URL-backed filters.
- [ ] **TXNS-03**: User can sort and review transactions with clearer feedback for empty, loading, and filtered states.
- [ ] **TXNS-04**: User can move between dashboard insights and transaction results without losing date range or category context.

### Rules Experience

- [ ] **RULE-01**: Admin can scan rules more easily with clearer hierarchy, system-rule treatment, and category visibility.
- [ ] **RULE-02**: Admin can create or edit rules with less friction and better validation feedback before saving.
- [ ] **RULE-03**: Admin can understand the impact of rule ordering and recategorization before committing a broad rules change.
- [ ] **RULE-04**: Admin can complete common rule-management actions on desktop and mobile without losing context.

### Category Management

- [ ] **CATM-01**: Admin can scan categories more easily with clearer status for system categories and dashboard inclusion.
- [ ] **CATM-02**: Admin can create, rename, and maintain categories with immediate validation and helpful empty/error states.
- [ ] **CATM-03**: Admin can understand which categories are excluded from dashboard stats and change that setting confidently.
- [ ] **CATM-04**: Admin can manage categories on smaller screens without losing essential controls or explanations.

## Future Requirements

### Analytics Expansion

- **ANLC-11**: User can analyze spending by merchant over time with dedicated merchant views.
- **ANLC-12**: User can compare custom time windows side-by-side across multiple dashboard widgets.

### Transaction Maintenance

- **TXNS-05**: Admin can recategorize transactions directly from the transactions page.
- **TXNS-06**: User can save reusable transaction filter presets.

### Categorization Operations

- **RULE-05**: Admin can bulk-enable, bulk-disable, or archive rules.
- **CATM-05**: Admin can merge categories while preserving historical transaction assignments.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bank sync, budgets, or income tracking | This milestone is focused on improving existing spending-analysis and categorization workflows, not expanding the product domain |
| Multi-bank import support | Still deferred until the Citibank SG workflow and existing surfaces feel strong end-to-end |
| New household/permission models | Current admin/viewer model remains sufficient for this milestone |
| Native mobile app work | Responsive web UX is the priority; this milestone should improve current pages across breakpoints |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANLC-07 | Phase 5 | Complete |
| ANLC-08 | Phase 5 | Complete |
| ANLC-09 | Phase 5 | Complete |
| ANLC-10 | Phase 5 | Complete |
| TXNS-01 | Phase 6 | Pending |
| TXNS-02 | Phase 6 | Pending |
| TXNS-03 | Phase 6 | Pending |
| TXNS-04 | Phase 6 | Pending |
| RULE-01 | Phase 7 | Pending |
| RULE-02 | Phase 7 | Pending |
| RULE-03 | Phase 7 | Pending |
| RULE-04 | Phase 7 | Pending |
| CATM-01 | Phase 7 | Pending |
| CATM-02 | Phase 7 | Pending |
| CATM-03 | Phase 7 | Pending |
| CATM-04 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after Phase 5 execution*
