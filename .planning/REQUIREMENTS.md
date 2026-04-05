# Requirements: Fin Genie

**Defined:** 2026-04-06
**Core Value:** Household members can see where their money goes — upload a bank statement, have transactions auto-categorized, and view spending breakdowns by category and time period.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Admin can log in with email and password
- [ ] **AUTH-02**: Viewer can log in with email and password (read-only access)
- [ ] **AUTH-03**: Admin can create and remove household member accounts
- [ ] **AUTH-04**: User session persists across browser refresh

### Import & Parsing

- [ ] **IMPT-01**: Admin can upload Citibank SG credit card PDF statements
- [ ] **IMPT-02**: System parses transaction rows from PDF extracting date, description, amount, and debit/credit flag
- [ ] **IMPT-03**: Parser reads bank format definition from JSON config (config-driven, not hard-coded)
- [ ] **IMPT-04**: Parsed transactions shown in review screen with categorized on top and uncategorized below
- [ ] **IMPT-05**: Duplicate detection prevents re-importing same transactions via hash on date + description + amount
- [ ] **IMPT-06**: Import history tracks which statements were imported, when, and transaction count
- [ ] **IMPT-07**: Statement period tracking shows which months have data and highlights gaps

### Categorization

- [ ] **CATG-01**: Rules evaluated top-to-bottom with first match assigning the category
- [ ] **CATG-02**: Rules support substring match (default) and regex (opt-in)
- [ ] **CATG-03**: Admin can create categorization rules inline on the review screen
- [ ] **CATG-04**: Admin can re-parse transactions after creating or editing rules
- [ ] **CATG-05**: Import only allowed when all transactions are categorized (100% gate)
- [ ] **CATG-06**: Card payment transactions auto-categorized as "Card Payment" and excluded from spending analytics
- [ ] **CATG-07**: Admin can manage rules from a dedicated page (create, edit, reorder, delete)
- [ ] **CATG-08**: Common categories pre-seeded on first setup with admin CRUD for all categories

### Analytics

- [ ] **ANLC-01**: Dashboard shows spending summary total for selected date range
- [ ] **ANLC-02**: Dashboard shows category breakdown chart (pie/donut with amounts and percentages)
- [ ] **ANLC-03**: Dashboard shows spending trend over time as monthly bar or line chart
- [ ] **ANLC-04**: Dashboard shows searchable and filterable transaction list with sortable columns
- [ ] **ANLC-05**: Date range selection with presets (this month, last 3 months, last year, custom range)
- [ ] **ANLC-06**: Viewer can access dashboard and transaction list in read-only mode

### Infrastructure

- [ ] **INFR-01**: All monetary amounts stored as integer cents to avoid float arithmetic errors
- [ ] **INFR-02**: Row Level Security policies on all tables enforcing admin/viewer permissions
- [ ] **INFR-03**: Neo Brutalism design theme via shadcn/ui registry
- [ ] **INFR-04**: Sidebar navigation layout with responsive design

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Household

- **MHLD-01**: Users belong to a household entity with data scoped per household
- **MHLD-02**: Admin can invite users to household via email

### Additional Bank Formats

- **BANK-01**: Support for DBS Singapore statement format
- **BANK-02**: Support for OCBC Singapore statement format
- **BANK-03**: Admin can add new bank format configs without code changes

### Income & Accounts

- **INCM-01**: Support bank account statement import (not just credit cards)
- **INCM-02**: Income analytics alongside spending analytics
- **INCM-03**: Net savings calculation (income minus spending)

### Enhancements

- **ENHN-01**: Dark mode theme variant
- **ENHN-02**: Export transactions to CSV
- **ENHN-03**: Year-over-year comparison analytics
- **ENHN-04**: Rule creation preview showing other transactions that would match

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time bank sync (Plaid/Finverse) | Massive complexity, limited SG bank support, overkill for 1-2 statements/month |
| Budgeting / spending goals | Different product entirely, doubles scope. YNAB/Actual Budget exist for this |
| AI/LLM categorization | Non-deterministic, API costs, privacy concerns. Rule-based covers 95% of cases |
| Mobile native app | Responsive web handles mobile. No app store overhead |
| Multi-currency | SG credit card statements already convert foreign transactions to SGD |
| OCR for scanned PDFs | Digital PDFs only. Citibank SG provides digital statements |
| Investment / net worth tracking | Different data model entirely, not spending data |
| Subscription / recurring detection | Temporal pattern detection complexity, limited value for household |
| Split transactions | Significant data model complexity for minimal accuracy gain |
| PDF file storage | Parse and discard. No Supabase Storage for originals |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| IMPT-01 | — | Pending |
| IMPT-02 | — | Pending |
| IMPT-03 | — | Pending |
| IMPT-04 | — | Pending |
| IMPT-05 | — | Pending |
| IMPT-06 | — | Pending |
| IMPT-07 | — | Pending |
| CATG-01 | — | Pending |
| CATG-02 | — | Pending |
| CATG-03 | — | Pending |
| CATG-04 | — | Pending |
| CATG-05 | — | Pending |
| CATG-06 | — | Pending |
| CATG-07 | — | Pending |
| CATG-08 | — | Pending |
| ANLC-01 | — | Pending |
| ANLC-02 | — | Pending |
| ANLC-03 | — | Pending |
| ANLC-04 | — | Pending |
| ANLC-05 | — | Pending |
| ANLC-06 | — | Pending |
| INFR-01 | — | Pending |
| INFR-02 | — | Pending |
| INFR-03 | — | Pending |
| INFR-04 | — | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29 ⚠️

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial definition*
