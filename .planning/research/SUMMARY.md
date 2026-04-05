# Project Research Summary

**Project:** Fin Genie — Personal Finance Analyzer
**Domain:** Private household PDF statement import, rule-based categorization, spending analytics
**Researched:** 2026-04-06
**Confidence:** HIGH

## Executive Summary

Fin Genie is a single-household spending analytics tool centered on one core workflow: upload a bank statement PDF, categorize every transaction via a rule engine, and view spending breakdowns. The domain is well-understood — tools like Firefly III, Lunch Money, and Actual Budget validate the feature set — but building a reliable PDF parser for Singaporean bank statements (Citibank SG specifically) is the hardest technical challenge and the highest-risk phase. The stack is already largely decided: Next.js 15 on Vercel, Supabase for auth/database/storage, Recharts for charts, and shadcn/ui with Neo Brutalism theming. The key library decision that matters most is `unpdf` for PDF extraction, which is purpose-built for Vercel's serverless environment and eliminates native dependency issues that plague alternatives.

The recommended architecture is a straightforward three-tier serverless app: browser uploads PDFs directly to Supabase Storage (bypassing Vercel's 4.5MB request body limit), a Next.js Route Handler downloads and parses the PDF server-side using a config-driven JSON bank format definition, and the resulting structured transactions are held in client memory until the user completes the categorization review and commits them to Postgres. Dashboard reads use Server Components with Postgres aggregation functions (RPCs). All authorization is enforced via Supabase RLS — admins can write, viewers can read. This architecture is deliberately simple for a 2-3 user household and scales cleanly to multi-household later by adding a `household_id` column.

The three risks that must be addressed before writing any other code are: (1) the Vercel 4.5MB upload limit — solved by the direct-to-Supabase-Storage upload pattern; (2) financial floating-point precision — solved by storing all amounts as integer cents from the very first parser output; and (3) RLS misconfiguration — solved by enabling RLS on every table in the first migration and verifying with User Impersonation before building any features. The PDF parser itself has multiple sub-risks (date year inference across statement boundaries, noise row filtering, credit parentheses notation) that require testing against multiple real Citibank SG statements, not synthetic fixtures.

## Key Findings

### Recommended Stack

The stack is coherent and well-integrated. Next.js 15 (not 16 — breaking changes not worth it for a new project), React 19, TypeScript 5, and Tailwind 4 form the core. Supabase consolidates database, auth, and file storage into one service, eliminating the need for separate providers. `unpdf` is the correct PDF library: pure JavaScript, serverless-optimized, ~1.4MB bundle, wraps PDF.js 5.4.x, and provides per-page text extraction essential for the config-driven parser. Amounts are stored as integer cents using plain `INTEGER` in Postgres — no money library needed for a single-currency SGD app.

**Core technologies:**
- **Next.js 15 + React 19**: Full-stack framework — App Router, Server Components, Server Actions eliminate separate API layer
- **Supabase (hosted)**: Postgres + Auth + Storage — one service for all persistence, RLS for authorization
- **`@supabase/ssr` 0.10.x**: SSR auth — replaces deprecated auth-helpers, handles PKCE flow and cookie sessions
- **`unpdf`**: PDF extraction — only viable option for Vercel serverless (zero native deps, serverless-optimized PDF.js)
- **Zod 3.x**: Schema validation — validates server action inputs, parser config schemas, rule definitions
- **Recharts 3.x**: Charts — composable React components for category breakdown and monthly trend
- **`date-fns` 4.x**: Date handling — tree-shakeable, TypeScript-first, handles DD MMM to ISO date conversion
- **`@tanstack/react-table` 8.x**: Headless table logic — powers the shadcn Data Table for the transaction list
- **`nuqs`**: URL state — type-safe search params for date range filters (shareable, back-button friendly)
- **shadcn/ui + Neo Brutalism theme**: Component primitives owned in codebase, thick borders and stark shadow aesthetic

### Expected Features

The feature set is well-defined. The dependency chain is strict: auth must exist before anything, the parser must work before the review UI can be built, imported data must exist before the dashboard is meaningful.

**Must have (table stakes — v1):**
- PDF upload with config-driven parser for Citibank SG — the primary data entry mechanism
- Transaction review screen: categorized/uncategorized split view — user must verify before committing
- Rule engine (substring + regex, first-match-wins, position-ordered) — automate categorization across imports
- Inline rule creation from review screen — users discover patterns while reviewing, not in advance
- Re-categorize without re-parsing — rules are iterative, immediate feedback is essential
- 100% categorization gate before import — prevents dirty data from polluting analytics
- Category CRUD (user-defined) — no imposed taxonomy
- Card payment auto-exclusion — balance transfers are not spending
- Duplicate detection on import — hash-based to handle re-upload and overlapping statement periods
- Dashboard: total spending, category breakdown chart, monthly trend chart
- Searchable/filterable transaction list with date range selection
- Email/password auth with admin/viewer roles
- Admin user management (invite/remove household members)

**Should have (v1.x — after core is proven with real data):**
- Statement period tracking with gap detection
- Rule match preview ("this rule would also match N other transactions")
- Year-over-year period comparison (needs 12+ months of data to be useful)
- Export to CSV
- Rule evolution metrics (categorization coverage % per import)

**Defer (v2+):**
- Additional bank format configs (DBS, OCBC, UOB Singapore) — extend parser coverage
- Bank account statement support for income tracking
- Dark mode

**Deliberate anti-features:** No bank sync (Plaid/Finverse), no AI/LLM categorization, no budgeting, no multi-currency, no OCR for scanned PDFs, no split transactions. Each of these is a common request that adds significant complexity for limited value in this specific use case.

### Architecture Approach

The architecture is a three-tier serverless app with no separate backend service. Browser uploads PDFs directly to Supabase Storage (critical — bypasses Vercel's 4.5MB serverless body limit). A Next.js Route Handler at `/api/parse` downloads the PDF server-side, runs `unpdf` extraction with per-page mode, applies the config-driven bank format JSON to reconstruct structured transactions, and returns them to the client. Parsed transactions live in client state during the review/categorization cycle and are only written to Postgres after 100% categorization is confirmed. Dashboard reads use Server Components calling Postgres RPCs for aggregation — no client-side data fetching, no materialized views needed at household data volumes.

**Major components:**
1. **Upload Client** — browser-to-Supabase-Storage direct upload, triggers parse endpoint
2. **Parse Route Handler** — downloads from Storage, extracts text via `unpdf`, applies bank format config, returns `ParsedTransaction[]`
3. **Rule Engine** — linear scan of position-ordered rules (substring or regex), first-match-wins, pure function
4. **Review UI** — split categorized/uncategorized display, inline rule creation, re-categorize on demand
5. **Import Server Action** — validates 100% categorization gate, batch inserts to Postgres, creates audit record
6. **Dashboard (Server Components)** — calls Postgres RPCs (`get_category_breakdown`, `get_monthly_trend`), passes results to Recharts client components
7. **Auth Middleware** — `@supabase/ssr` refreshes tokens, protects routes, enforces role-based access

**Database:** 6 tables — `profiles`, `categories`, `categorization_rules`, `bank_formats` (JSONB config), `statement_imports` (audit), `transactions`. Amounts stored as `DECIMAL(12,2)` in Postgres (exact arithmetic) with application-level integer cents in TypeScript. RLS enabled on all tables with a `SECURITY DEFINER is_admin()` helper function. Rule ordering uses gaps strategy (100, 200, 300) to avoid full-table rewrites on reorder.

### Critical Pitfalls

These 5 pitfalls are the most likely to cause expensive rework and must be addressed before Phase 1 ships:

1. **Vercel 4.5MB request body limit** — Upload directly from browser to Supabase Storage; pass only the storage path to the server action. Never route the PDF through a Vercel serverless function. Configure `serverActions: { bodySizeLimit: '10mb' }` in `next.config.ts` as a safety net.

2. **JavaScript floating-point corruption of financial totals** — Parse all amounts to integer cents immediately in the parser (`Math.round(parseFloat(str) * 100)`). Store in an `INTEGER` cents column. All aggregation happens in integer arithmetic. Format for display only at the UI layer with `Intl.NumberFormat`. Never do arithmetic on dollar floats.

3. **RLS disabled or misconfigured on Supabase tables** — Every `CREATE TABLE` in every migration must be immediately followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and a complete set of policies. Test from the browser client (not the SQL editor, which bypasses RLS). Use Supabase User Impersonation to verify each role. Never put `service_role` key in any `NEXT_PUBLIC_` variable.

4. **Date-without-year misclassification across statement boundaries** — Citibank SG statements show dates as `DD MMM` only. A December-January statement spans two years. Implement explicit year inference: extract the statement period range first, then assign each transaction date the year that puts it within (or close to) that range. Test with a cross-year statement as the primary acceptance test.

5. **PDF text extraction mis-ordering / noise rows parsed as transactions** — PDF is a rendering format, not a structured document. Text elements are not in reading order. Use `unpdf` with `mergePages: false` for per-page arrays. The bank format JSON config must define skip patterns (`BALANCE PREVIOUS STATEMENT`, `SUB-TOTAL`, `TOTAL NEW BALANCE`) and section boundaries. Build a test suite with real statements (not synthetic text) and validate parsed transaction count against manual count.

## Implications for Roadmap

Based on research, the feature dependency chain and pitfall-to-phase mapping from PITFALLS.md converge on a clear 5-phase structure. Every phase has a hard dependency on the previous one.

### Phase 1: Foundation and Infrastructure

**Rationale:** Everything else depends on auth working, the schema being correct, and RLS being properly configured from the start. Retrofitting RLS or changing the data model (especially amounts-as-cents) is expensive — establish these once and correctly.

**Delivers:** Working auth flow, complete database schema with RLS on all tables, Supabase Storage bucket with policies, Next.js project scaffold with Supabase client utilities and auth middleware, local dev environment with `supabase start`.

**Addresses features:** Email/password auth, admin/viewer roles, route protection.

**Avoids pitfalls:** RLS misconfiguration (every table gets RLS in the first migration), amounts-as-floats (schema uses `INTEGER` cents from day one), Supabase client confusion (browser vs. server clients established in project structure).

**Research flag:** Standard patterns — well-documented by Supabase and Next.js official docs. No deep research needed.

### Phase 2: PDF Parser Pipeline

**Rationale:** The parser is the hardest technical challenge and the most likely source of expensive rework. It must be solid before the review UI is built on top of it. Parser bugs discovered after the review UI exists require fixing in two places. Testing with real Citibank SG statements during this phase — not after — is the key to avoiding re-work.

**Delivers:** Citibank SG bank format config (JSON seeded in `bank_formats` table), browser-to-Storage upload component using `react-dropzone`, `/api/parse` Route Handler using `unpdf` with per-page extraction, config-driven parser function as a pure TypeScript function, unit test suite with real statement samples validating transaction count and date accuracy.

**Addresses features:** PDF upload for Citibank SG credit card statements, config-driven parser.

**Avoids pitfalls:** Vercel 4.5MB body limit (direct-to-Storage upload pattern), PDF text mis-ordering (coordinate-aware extraction with `unpdf`), date year inference (explicit year assignment from statement period range), noise rows (skip patterns in bank format config), credit/debit misclassification (parentheses notation parsed before amount string cleaning), serverless timeout (benchmark a 14-page statement and tune `maxDuration`).

**Research flag:** Needs phase research — Citibank SG statement layout is specific and underdocumented. Coordinate-based extraction with `unpdf` may require deeper investigation of the API. The skip patterns and section boundaries for the Citibank format need to be derived from real statement analysis.

### Phase 3: Categorization Workflow

**Rationale:** The rule engine and review UI are tightly coupled and must be built together. The review screen depends on parsed transactions (Phase 2) and produces categorized transactions for import. Inline rule creation (the UX differentiator) belongs here, not in a later "polish" phase — it is central to the core workflow.

**Delivers:** Rule engine (pure function: `ParsedTransaction[] + Rule[]` → `CategorizedTransaction[]`), transaction review screen (categorized/uncategorized split, counts), inline rule creation from uncategorized transactions, re-categorize without re-upload, 100% categorization gate enforcement, import server action (batch insert with audit record, duplicate detection, card payment auto-categorization), rules admin page (CRUD, drag-to-reorder with gaps strategy).

**Addresses features:** Rule engine, inline rule creation, re-parse after rule changes, 100% categorization gate, category management, duplicate detection, card payment auto-exclusion, import history.

**Avoids pitfalls:** Regex catastrophic backtracking (validate user regex at save time — test against pathological input, reject nested quantifiers), storing parsed transactions before review (keep in client state only, never write uncategorized data to Postgres), duplicate import (hash-based detection on import, reject duplicate PDF files and duplicate transactions).

**Research flag:** Standard patterns for rule engine (linear scan, well-documented). Drag-to-reorder with `@dnd-kit` (shadcn recommended) may need brief API review but pattern is established.

### Phase 4: Dashboard and Analytics

**Rationale:** Dashboard requires real imported transactions to be meaningful. Building it after the import workflow means testing with actual data, producing better UX decisions. Postgres aggregation RPCs are the right pattern and are well-understood.

**Delivers:** Postgres RPC functions (`get_total_spending`, `get_category_breakdown`, `get_monthly_trend`), dashboard layout with summary cards and date range picker (URL-driven via `nuqs`), Recharts category breakdown chart (donut/bar) and monthly trend chart (bar/line), searchable/filterable paginated transaction list using `@tanstack/react-table`.

**Addresses features:** Total spending display, category breakdown chart, monthly trend chart, searchable/filterable transaction list, custom date range selection.

**Avoids pitfalls:** N+1 category queries (single `GROUP BY` aggregation via RPC), client-side date filtering (SQL `WHERE` with indexed date columns), passing all transactions to Recharts (aggregate in SQL, pass summary data only).

**Research flag:** Standard patterns — Server Components + Supabase RPCs + Recharts are well-documented. `nuqs` for URL state is straightforward.

### Phase 5: Polish and Admin

**Rationale:** These features round out the product but have no hard blockers on other phases completing first. User management requires auth (Phase 1), category admin requires categories to exist (Phase 3), error handling and mobile design are improvements on a working core.

**Delivers:** Categories admin page (CRUD), admin user management page (invite/remove household members), comprehensive error handling (malformed PDF, parse failure, partial import, session expiry), mobile-responsive layouts for viewer role, the "looks done but isn't" checklist from PITFALLS.md verified in production.

**Addresses features:** Category management UI, admin user management, responsive design for phone access.

**Avoids pitfalls:** Parser errors exposed to client (catch server-side, return user-friendly messages), missing validation on viewer role (verify every mutating action is blocked for viewer in production, not just in UI).

**Research flag:** Standard patterns throughout. No deep research needed.

### Phase Ordering Rationale

- **Foundation before everything:** Auth and schema decisions (RLS, amounts-as-cents) are the most expensive to retrofit. Getting them right in Phase 1 eliminates an entire class of rework.
- **Parser before review UI:** The review screen is a consumer of parser output. Parser bugs are cheapest to fix when there is no UI built on top of them yet.
- **Categorization before dashboard:** The dashboard needs real imported data. Building it last means testing with actual transactions, producing better UI decisions and validating chart scales.
- **Polish last:** Edge cases, error states, and mobile design are all improvements on a working core. Deferring them prevents gold-plating features that may change during the build.
- **Inline rule creation in Phase 3, not Phase 5:** This is a core workflow feature, not polish. Demoting it to a later phase would require revisiting the review screen.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (PDF Parser):** Citibank SG statement layout analysis. The bank format JSON config (skip patterns, line regex, coordinate column boundaries, credit indicator) must be derived from real statement inspection. `unpdf` detailed mode API for coordinate-aware extraction may need hands-on investigation. This is the highest-uncertainty area in the entire project.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** `@supabase/ssr` + Next.js middleware is documented step-by-step by Supabase official docs. RLS patterns are standard.
- **Phase 3 (Categorization):** Linear rule engine pattern is trivial to implement. `@dnd-kit` for drag-to-reorder is documented by shadcn. Duplicate detection with SHA-256 hashing is standard.
- **Phase 4 (Dashboard):** Postgres `date_trunc` aggregations, Recharts composable charts, `@tanstack/react-table` with shadcn — all heavily documented with working examples.
- **Phase 5 (Polish):** No novel patterns. Error handling, CRUD pages, responsive design.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major decisions are already made or verified against official docs and current npm versions. `unpdf` choice is well-justified by multiple sources comparing serverless PDF options. `date-fns` 4.x is ESM-only — verify build config handles this. |
| Features | HIGH | Feature set is validated against Firefly III, Lunch Money, and Actual Budget. Dependency chain is explicit and clear. Anti-features are well-argued. |
| Architecture | HIGH | Three-tier serverless with direct-to-Storage upload is the established pattern for this Vercel + Supabase stack. RLS patterns, Server Components, Server Actions all have official documentation. Schema design rationale is sound. |
| Pitfalls | HIGH | Pitfalls are verified against official docs (Vercel limits, Supabase RLS), community incident reports (170+ exposed apps), and domain-specific sources (Citibank statement parsing prior art). |

**Overall confidence: HIGH**

### Gaps to Address

- **Citibank SG statement layout specifics:** The bank format JSON config (exact regex patterns, column x-coordinate ranges, skip pattern strings) must be derived from analyzing real statement files. This cannot be fully specified from public documentation alone. Highest-priority gap — blocks Phase 2.

- **`unpdf` coordinate-aware extraction API:** The research confirms `unpdf` supports per-page text arrays via `extractText({ mergePages: false })`. Whether it exposes x,y coordinate data for column-based extraction (needed for robust row reconstruction) requires hands-on API investigation at the start of Phase 2. If coordinate data is unavailable, fall back to `pdf2json` (confirmed coordinate-aware but has different serverless characteristics).

- **`date-fns` v4 ESM-only in Next.js 15:** `date-fns` 4.x dropped CommonJS. Verify the Next.js 15 + Turbopack build pipeline handles this without configuration. Likely fine, but confirm early in Phase 1 setup.

- **Rule position ordering at import time:** The gaps strategy (100, 200, 300) handles inserts cleanly, but the application-level enforcement of the `UNIQUE(position)` constraint during concurrent reorder operations needs explicit implementation design. Low risk for a 2-3 user app but should be designed in Phase 3.

## Sources

### Primary (HIGH confidence — official docs)
- [Next.js App Router docs](https://nextjs.org/docs/app) — Server Components, Server Actions, middleware
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` setup
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy syntax
- [Supabase RLS performance best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — indexing
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) — 4.5MB body limit, memory, duration
- [unpdf GitHub (UnJS)](https://github.com/unjs/unpdf) — API documentation, serverless compatibility
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.101.1
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) — v0.10.0
- [recharts npm](https://www.npmjs.com/package/recharts) — v3.8.1
- [react-dropzone npm](https://www.npmjs.com/package/react-dropzone) — v15.0.0

### Secondary (MEDIUM confidence — community consensus)
- [unpdf vs pdf-parse vs pdfjs-dist comparison (2026)](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026)
- [date-fns vs Day.js comparison (2026)](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026)
- [Next.js 15 vs 16 comparison](https://www.descope.com/blog/post/nextjs15-vs-nextjs16)
- [Firefly III Rules documentation](https://docs.firefly-iii.org/how-to/firefly-iii/features/rules/) — rule engine reference for this domain
- [Neobrutalism components installation](https://www.neobrutalism.dev/docs/installation)
- [nuqs URL state for React](https://nuqs.dev/)
- [Supabase local development with migrations](https://supabase.com/docs/guides/local-development/overview)
- [Supabase RLS Complete Guide 2026 — 170+ exposed apps incident](https://vibeappscanner.com/supabase-row-level-security)
- [OWASP ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)

### Tertiary (LOW confidence — needs validation during implementation)
- [Citibank Statement to CSV (GitHub)](https://github.com/matthewrwilton/citibank-statement-to-csv) — prior art for Citi SG statement structure; format may have changed
- [Bankstatemently — Citi Singapore](https://bankstatemently.com/banks/sg/citibank/credit-card-statement) — statement format reference; verify against real statements

---
*Research completed: 2026-04-06*
*Ready for roadmap: yes*
