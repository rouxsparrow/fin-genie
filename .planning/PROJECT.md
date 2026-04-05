# Fin Genie

## What This Is

A private household finance analyzer that imports bank statement PDFs, parses transactions, categorizes them via editable text rules, and provides spending analytics across custom date ranges. Built for a Singapore household using SGD, with admin and viewer roles over shared data. v1 targets Citibank SG credit card statements with a config-driven parser designed for future bank format expansion.

## Core Value

Household members can see where their money goes — upload a bank statement, have transactions auto-categorized, and view spending breakdowns by category and time period.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Admin can log in with email/password
- [ ] Viewer can log in with email/password (read-only access)
- [ ] Admin can upload Citibank SG credit card PDF statements
- [ ] System parses transactions from PDF (date, description, amount, debit/credit flag)
- [ ] Config-driven parser reads bank format definition (JSON) to extract transactions
- [ ] Parsed transactions shown in review screen: categorized on top, uncategorized below
- [ ] Admin can create categorization rules inline on the review screen
- [ ] Rules support substring match (default) and regex (opt-in)
- [ ] Rules evaluated top-to-bottom, first match wins
- [ ] Admin can re-parse transactions after creating rules
- [ ] Import only allowed when all transactions are categorized (100% coverage)
- [ ] Card payment transactions auto-categorized as "Card Payment" and excluded from spending analytics
- [ ] Admin can manage rules (create, edit, reorder, delete) from a dedicated rules page
- [ ] Admin can manage user-defined categories
- [ ] Dashboard shows spending summary (total spending for selected date range)
- [ ] Dashboard shows category breakdown chart (spending by category)
- [ ] Dashboard shows spending trend over time (monthly bar/line chart)
- [ ] Dashboard shows searchable/filterable transaction list
- [ ] Analytics support custom date range selection
- [ ] Viewer can access dashboard and transaction list (read-only)
- [ ] Admin can manage users (admin-only settings page)

### Out of Scope

- Household/group model — simple role flag sufficient for one household in v1
- Income analytics — credit card statements don't show income; defer to v2 with bank account support
- Additional bank formats — v1 targets Citibank SG only; config-driven parser ready for expansion
- OAuth/magic link auth — email/password sufficient for 2-3 household users
- Mobile app — web-first, responsive design handles mobile access
- Real-time bank sync — manual PDF import is the v1 approach
- Budgeting/goals — analytics only, no budget setting or tracking
- Export functionality — defer to v2

## Context

- **Location:** Singapore household, all transactions in SGD
- **Bank format:** Citibank Singapore credit card statements (digital PDF, not scanned)
  - Transaction rows: DD MMM | description + location | amount
  - Credits in parentheses, debits plain
  - Multi-page PDFs (up to 14+ pages)
  - Noise rows to skip: BALANCE PREVIOUS STATEMENT, SUB-TOTAL, card headers, summary sections
  - Date has no year — infer from statement period
  - Masked card numbers on description second line (ignorable)
- **Users:** Small household (2-3 users max), admin + viewer roles
- **Import workflow:** Upload → Parse → Review (categorized/uncategorized) → Create rules inline → Re-parse → Repeat until 100% categorized → Import
- **Rule evolution:** Rules build up organically over time; early imports require more manual categorization, later imports auto-categorize most transactions

## Constraints

- **Hosting:** Vercel — serverless functions for PDF parsing, edge runtime for UI
- **Database:** Supabase Postgres with built-in Auth and Row Level Security
- **UI framework:** Next.js (App Router) with shadcn/ui (Neo Brutalism theme from registry)
- **Charts:** Recharts for analytics visualizations
- **Parser architecture:** Config-driven — generic parser reads JSON bank format definitions, not hard-coded per bank
- **Auth:** Supabase Auth with email/password provider
- **Currency:** SGD only in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Config-driven PDF parser | Reusable across future bank formats without code changes | -- Pending |
| Simple role model (no household entity) | Only one household in v1; migration to household model is clean (add household_id later) | -- Pending |
| Substring + regex rules (first-match-wins) | Substring covers 90% of cases, regex for power users; ordered matching is predictable | -- Pending |
| Neo Brutalism design (shadcn registry) | Distinctive visual style, user preference | -- Pending |
| Spending-only analytics in v1 | Credit card statements don't contain income data; income deferred to bank account support | -- Pending |
| Card payments as built-in category | Payments aren't spending — auto-categorize and exclude from analytics | -- Pending |
| 100% categorization gate before import | Forces clean data; rules build up organically over time | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-06 after initialization*
