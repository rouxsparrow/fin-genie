# Roadmap: Fin Genie

## Overview

Fin Genie delivers household spending analytics through four phases that follow the data pipeline: establish the foundation and auth, build the PDF import pipeline, layer on the categorization engine, and surface everything through an analytics dashboard. Each phase delivers a complete, testable capability that the next phase depends on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Auth** - Project scaffold, database schema with RLS, Supabase Auth with admin/viewer roles, and app shell with navigation
- [ ] **Phase 2: PDF Import Pipeline** - Upload Citibank SG PDFs, config-driven parsing, transaction review screen, duplicate detection, and import tracking
- [ ] **Phase 3: Categorization Engine** - Rule engine with substring/regex matching, inline rule creation from review screen, re-categorize flow, 100% gate, and rules/category management
- [ ] **Phase 4: Dashboard & Analytics** - Spending summary, category breakdown chart, trend chart, searchable transaction list, date range filtering, and viewer read-only access

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can log in with appropriate roles and navigate a styled app shell backed by a secure, correctly-structured database
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, INFR-01, INFR-02, INFR-03, INFR-04
**Success Criteria** (what must be TRUE):
  1. Admin can log in with email/password and access the full application
  2. Viewer can log in with email/password and sees a read-only experience (no admin controls visible)
  3. Admin can create and remove household member accounts from a settings page
  4. User session persists across browser refresh without re-login
  5. App displays a sidebar navigation layout with Neo Brutalism styling that works on both desktop and mobile
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, Neo Brutalism theme, Supabase schema with RLS, auth utilities
- [x] 01-02-PLAN.md — Login page with Supabase Auth, app shell with sidebar navigation and responsive drawer
- [x] 01-03-PLAN.md — Dashboard empty state, settings page with user management, error pages
**UI hint**: yes

### Phase 2: PDF Import Pipeline
**Goal**: Admin can upload a Citibank SG credit card PDF and see parsed transactions in a review screen, with import history and duplicate protection
**Depends on**: Phase 1
**Requirements**: IMPT-01, IMPT-02, IMPT-03, IMPT-04, IMPT-05, IMPT-06, IMPT-07
**Success Criteria** (what must be TRUE):
  1. Admin can upload a Citibank SG credit card PDF and see extracted transactions (date, description, amount, debit/credit) within seconds
  2. Parser correctly handles multi-page statements, cross-year date inference, noise row filtering, and credit notation (parentheses)
  3. Review screen displays parsed transactions split into categorized (top) and uncategorized (bottom) sections
  4. Re-uploading an already-imported statement is detected and blocked via transaction hash matching
  5. Import history page shows which statements were imported, when, and how many transactions each contained, with statement period gap highlighting
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Schema + parser core: bank_configs migration, config-driven parser with TDD, hash utility, install dependencies
- [x] 02-02-PLAN.md — Upload flow + review screen: server actions, import page with 5-state UI, all review components
- [x] 02-03-PLAN.md — Import history + timeline: history page with table, timeline bar visualization, enable sidebar nav
- [x] 02-04-PLAN.md — Bank config viewer + schema push: read-only config page, push migration to live Supabase
**UI hint**: yes

### Phase 3: Categorization Engine
**Goal**: Admin can categorize all transactions through rules (built inline during review) and import only when 100% categorized, with full rules and category management
**Depends on**: Phase 2
**Requirements**: CATG-01, CATG-02, CATG-03, CATG-04, CATG-05, CATG-06, CATG-07, CATG-08
**Success Criteria** (what must be TRUE):
  1. Admin can create a categorization rule inline from an uncategorized transaction on the review screen, and the rule immediately categorizes matching transactions
  2. Rules evaluate top-to-bottom with first-match-wins, supporting both substring (default) and regex matching
  3. Admin can re-categorize transactions after editing rules without re-uploading the PDF
  4. Import button is disabled until all transactions are categorized (100% gate), and card payment transactions are auto-categorized and excluded from analytics
  5. Admin can manage rules (create, edit, reorder, delete) from a dedicated rules page and manage categories (create, edit, delete) with common categories pre-seeded
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD
**UI hint**: yes

### Phase 4: Dashboard & Analytics
**Goal**: All users can view spending analytics with charts and filterable transaction data across custom date ranges
**Depends on**: Phase 3
**Requirements**: ANLC-01, ANLC-02, ANLC-03, ANLC-04, ANLC-05, ANLC-06
**Success Criteria** (what must be TRUE):
  1. Dashboard shows total spending for the selected date range as a prominent summary figure
  2. Category breakdown chart (pie/donut) displays spending by category with amounts and percentages
  3. Monthly spending trend chart (bar/line) shows spending over time within the selected range
  4. Searchable, filterable transaction list with sortable columns displays all imported transactions
  5. Date range selector offers presets (this month, last 3 months, last year, custom) and updates all dashboard components
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/3 | Planned | - |
| 2. PDF Import Pipeline | 0/4 | Planned | - |
| 3. Categorization Engine | 0/3 | Not started | - |
| 4. Dashboard & Analytics | 0/2 | Not started | - |
