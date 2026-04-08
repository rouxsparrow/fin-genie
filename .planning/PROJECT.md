# Fin Genie

## What This Is

A private household finance analyzer that imports Citibank SG credit card PDFs, parses transactions via a config-driven parser, categorizes them through editable text rules (substring + regex), and provides spending analytics with charts and filterable transaction lists. Built for a Singapore household using SGD, with admin and viewer roles over shared data.

## Core Value

Household members can see where their money goes — upload a bank statement, have transactions auto-categorized, and view spending breakdowns by category and time period.

## Requirements

### Validated

- ✓ AUTH-01: Admin can log in with email/password — v1.0
- ✓ AUTH-02: Viewer can log in with email/password (read-only access) — v1.0
- ✓ AUTH-03: Admin can create and remove household member accounts — v1.0
- ✓ AUTH-04: User session persists across browser refresh — v1.0
- ✓ IMPT-01: Admin can upload Citibank SG credit card PDF statements — v1.0
- ✓ IMPT-02: System parses transactions from PDF (date, description, amount, debit/credit) — v1.0
- ✓ IMPT-03: Config-driven parser reads bank format from JSON config — v1.0
- ✓ IMPT-04: Review screen with categorized/uncategorized sections — v1.0
- ✓ IMPT-05: Duplicate detection via transaction hash — v1.0
- ✓ IMPT-06: Import history tracking — v1.0
- ✓ IMPT-07: Statement period gap highlighting — v1.0
- ✓ CATG-01: Rules evaluated top-to-bottom, first-match-wins — v1.0
- ✓ CATG-02: Substring + regex matching — v1.0
- ✓ CATG-03: Inline rule creation from review screen — v1.0
- ✓ CATG-04: Re-categorize after rule changes — v1.0
- ✓ CATG-05: 100% categorization gate before import — v1.0
- ✓ CATG-06: Card Payment auto-categorized and excluded from analytics — v1.0
- ✓ CATG-07: Rules management page (CRUD + reorder) — v1.0
- ✓ CATG-08: Categories pre-seeded with admin CRUD — v1.0
- ✓ ANLC-01: Dashboard spending summary total — v1.0
- ✓ ANLC-02: Category breakdown donut chart — v1.0
- ✓ ANLC-03: Monthly spending trend bar chart — v1.0
- ✓ ANLC-04: Searchable/filterable/sortable transaction list — v1.0
- ✓ ANLC-05: Date range presets + custom calendar — v1.0
- ✓ ANLC-06: Viewer read-only access to analytics — v1.0
- ✓ INFR-01: Integer cents for monetary amounts — v1.0
- ✓ INFR-02: RLS on all tables — v1.0
- ✓ INFR-03: Neo Brutalism theme — v1.0
- ✓ INFR-04: Responsive sidebar navigation — v1.0

### Active

(None — next milestone requirements defined via `/gsd-new-milestone`)

### Out of Scope

- Household/group model — simple role flag sufficient for one household in v1
- Income analytics — credit card statements don't show income; defer to v2 with bank account support
- Additional bank formats — v1 targets Citibank SG only; config-driven parser ready for expansion
- OAuth/magic link auth — email/password sufficient for 2-3 household users
- Mobile app — web-first, responsive design handles mobile access
- Real-time bank sync — manual PDF import is the v1 approach
- Budgeting/goals — analytics only, no budget setting or tracking
- Export functionality — defer to v2
- Offline mode — real-time is core value

## Context

**Shipped:** v1.0 MVP on 2026-04-08
**Codebase:** ~10,500 LOC TypeScript across 176 files
**Tech stack:** Next.js 15 (App Router), React 19, Supabase (Postgres + Auth + RLS), Recharts, TanStack Table, shadcn/ui (Neo Brutalism), nuqs, date-fns, unpdf, Tailwind CSS 4
**Hosting:** Vercel (serverless) + Supabase (managed Postgres)

- **Location:** Singapore household, all transactions in SGD
- **Bank format:** Citibank Singapore credit card statements (digital PDF)
- **Users:** Small household (2-3 users), admin + viewer roles
- **Import workflow:** Upload → Parse → Review → Create rules inline → Re-parse → 100% categorized → Import
- **Rule evolution:** Rules build up organically; later imports auto-categorize most transactions

## Constraints

- **Hosting:** Vercel — serverless functions for PDF parsing, edge runtime for UI
- **Database:** Supabase Postgres with built-in Auth and Row Level Security
- **UI framework:** Next.js (App Router) with shadcn/ui (Neo Brutalism theme from registry)
- **Charts:** Recharts for analytics visualizations
- **Parser architecture:** Config-driven — generic parser reads JSON bank format definitions
- **Auth:** Supabase Auth with email/password provider
- **Currency:** SGD only in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Config-driven PDF parser | Reusable across future bank formats without code changes | ✓ Good — parser handles Citibank SG correctly, ready for expansion |
| Simple role model (no household entity) | Only one household in v1 | ✓ Good — clean, revisit if multi-household needed |
| Substring + regex rules (first-match-wins) | Substring covers 90% of cases, regex for power users | ✓ Good — predictable, builds up organically |
| Neo Brutalism design (shadcn registry) | Distinctive visual style, user preference | ✓ Good — consistent throughout |
| Spending-only analytics in v1 | Credit cards don't contain income data | ✓ Good — focused scope |
| Card payments as built-in category | Payments aren't spending | ✓ Good — auto-excluded from analytics |
| 100% categorization gate before import | Forces clean data | ✓ Good — rules evolve over time |
| JS-side aggregation for analytics | Supabase JS client doesn't support GROUP BY natively | ⚠️ Revisit — OK for <10k transactions, may need RPC for scale |
| NuqsAdapter for URL state | nuqs v2 requires provider wrapper for App Router | ✓ Good — date ranges persist in URL |
| verifyAuthenticated (not verifyAdmin) for analytics | Viewers have full read access per ANLC-06 | ✓ Good — correct access model |

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
*Last updated: 2026-04-08 after v1.0 milestone*
