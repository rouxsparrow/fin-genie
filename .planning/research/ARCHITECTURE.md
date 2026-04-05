# Architecture Patterns

**Domain:** Personal finance analyzer (PDF import, rule-based categorization, spending analytics)
**Researched:** 2026-04-06

## Recommended Architecture

### System Overview

Fin Genie is a three-tier serverless application: Next.js App Router frontend on Vercel, Supabase Postgres database with RLS-enforced authorization, and Supabase Storage for PDF file persistence. All server-side logic runs in Vercel serverless functions (route handlers and server actions). There is no separate backend service.

```
Browser (Client Components)
    |
    |-- Direct upload --> Supabase Storage (PDFs)
    |-- UI interactions --> Next.js App Router (Vercel)
                              |
                              |-- Server Components (dashboard reads)
                              |-- Server Actions (mutations: import, rules CRUD)
                              |-- Route Handlers (PDF parse endpoint)
                              |
                              +-- Supabase Postgres (data + RLS)
                                    |-- transactions
                                    |-- categories
                                    |-- categorization_rules
                                    |-- profiles (role)
                                    |-- bank_formats (JSON config)
                                    |-- statement_imports (audit)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Upload Client** | File selection, direct upload to Supabase Storage, triggers parse | Supabase Storage, Parse Route Handler |
| **Parse Route Handler** | Downloads PDF from Storage, extracts text via unpdf, applies bank format config, returns structured transactions | Supabase Storage (read), bank_formats table (read) |
| **Review UI** | Displays parsed transactions split by categorized/uncategorized, inline rule creation | Rule Engine (via server action), Parse Route Handler (re-parse) |
| **Rule Engine** | Evaluates ordered rules against transaction descriptions, returns category matches | categorization_rules table, categories table |
| **Import Action** | Validates 100% categorization, persists transactions to database | transactions table, statement_imports table |
| **Rules Admin** | CRUD for categorization rules with drag-to-reorder | categorization_rules table |
| **Categories Admin** | CRUD for user-defined categories | categories table |
| **Dashboard** | Aggregated spending views with date range filtering | transactions table (via Postgres aggregation queries) |
| **Auth Middleware** | Token refresh, route protection, role gating | Supabase Auth, profiles table |

---

## Data Flow

### Flow 1: PDF Upload and Parse

This is the most architecturally significant flow because it must work within Vercel's serverless constraints.

```
1. Admin selects PDF file in browser
2. Client uploads PDF directly to Supabase Storage (bypasses Vercel 4.5MB body limit)
3. Client calls POST /api/parse with storage file path + bank format ID
4. Route Handler:
   a. Downloads PDF from Supabase Storage (server-side, no size limit)
   b. Loads bank format config from database (JSON defining extraction rules)
   c. Extracts text using unpdf (extractText with mergePages: false for per-page processing)
   d. Applies bank format config: line matching, field extraction, date inference
   e. Returns array of ParsedTransaction objects (not yet persisted)
5. Client receives transactions, displays in Review UI
```

**Why this flow:** Vercel serverless functions have a 4.5MB request body limit. Credit card PDFs can be 1-5MB. Uploading directly to Supabase Storage (up to 50MB default) then having the server fetch from storage cleanly sidesteps this constraint. The parse endpoint receives only a lightweight JSON payload (file path + format ID).

**Why unpdf:** pdf-parse (the popular alternative) depends on native canvas bindings that fail in Vercel's serverless environment. unpdf is a pure JavaScript PDF library from the UnJS ecosystem with zero native dependencies, specifically designed for serverless runtimes. It bundles a serverless-optimized PDF.js build. For a 14-page Citibank statement, expect 5-7 seconds parse time and ~300MB memory usage -- well within Vercel Hobby limits (2GB memory, 300s timeout).

### Flow 2: Rule Evaluation (Categorization)

```
1. Client has array of ParsedTransaction objects in memory (from parse flow)
2. Client calls server action: categorizeTransactions(transactions)
3. Server Action:
   a. Loads all categorization_rules ordered by `position` ASC
   b. For each transaction description:
      - Iterate rules in order
      - If rule.match_type = 'substring': case-insensitive includes check
      - If rule.match_type = 'regex': RegExp test
      - First match wins: assign rule.category_id, stop evaluating
      - No match: mark as uncategorized
   c. Returns transactions with category assignments
4. Client displays: categorized transactions on top, uncategorized below
```

**Rule engine is intentionally simple.** No Rete algorithm, no rule engine library. It is a linear scan of an ordered list. With a household's transaction volume (hundreds per month, dozens of rules), a linear scan completes in microseconds. The first-match-wins semantics make evaluation predictable and debuggable. Rules are loaded once per categorization pass and can be cached in the server action scope.

### Flow 3: Review, Rule Creation, Re-parse Cycle

```
1. Admin sees uncategorized transactions in Review UI
2. Admin creates a new rule inline:
   - Selects an uncategorized transaction
   - Enters pattern (substring or regex)
   - Selects/creates category
   - Rule appended to end of rule list (or inserted at specific position)
3. Server Action persists rule to categorization_rules table
4. Admin clicks "Re-categorize" (NOT re-parse -- no need to re-extract PDF)
5. Server Action re-runs rule evaluation on the same parsed transactions
6. UI updates: newly matched transactions move to categorized section
7. Repeat until 100% categorized
8. Admin clicks "Import" -- persists transactions to database
```

**Key insight:** Re-parse means re-running rule evaluation, not re-extracting the PDF. The parsed transaction text stays in client state (or a temporary server-side store) throughout the review session. Only the final categorized transactions get written to the database.

### Flow 4: Import (Persist Transactions)

```
1. Admin confirms all transactions are categorized (UI enforces 100% gate)
2. Client calls server action: importTransactions(transactions, statementMetadata)
3. Server Action:
   a. Creates statement_imports record (file_path, bank_format, date_range, status)
   b. Batch inserts transactions with category_id, linked to import record
   c. Marks "Card Payment" category transactions with excluded_from_analytics flag
   d. Returns success with import summary
4. UI navigates to dashboard or import history
```

### Flow 5: Dashboard Data

```
1. Dashboard page (Server Component) receives date range from URL search params
2. Server Component creates Supabase client, calls multiple queries in parallel:
   a. Total spending: SUM(amount) WHERE date IN range AND NOT excluded
   b. Category breakdown: SUM(amount) GROUP BY category WHERE date IN range AND NOT excluded
   c. Monthly trend: SUM(amount) GROUP BY date_trunc('month', date) WHERE date IN range AND NOT excluded
   d. Transaction list: paginated, filterable by category/search term
3. Server Component passes data to Client Components (charts, filters)
4. Date range changes trigger navigation (URL search params), which re-renders Server Component
```

**Why Server Components for dashboard:** Aggregation queries run server-side, close to the database. No client-side data fetching waterfall. The Supabase client in Server Components automatically respects RLS, so viewers only see what RLS permits. Date range in URL search params enables shareable/bookmarkable views and avoids client state management for filters.

**No materialized views needed for v1.** A household generates maybe 100-300 transactions per month. Even with years of data, you are looking at thousands of rows -- Postgres handles aggregation on this volume in milliseconds with proper indexes. Materialized views add refresh complexity without meaningful performance gain at this scale.

---

## Database Schema

### Core Tables

```sql
-- User profiles with role (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spending categories (user-defined)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_system BOOLEAN NOT NULL DEFAULT false, -- for "Card Payment" built-in
  excluded_from_analytics BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categorization rules (ordered, first-match-wins)
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'substring' CHECK (match_type IN ('substring', 'regex')),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- ordering for first-match-wins evaluation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(position) -- enforced at application level with gaps strategy
);

-- Bank format definitions (config-driven parser)
CREATE TABLE bank_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., "citibank_sg_credit"
  config JSONB NOT NULL, -- extraction rules, line patterns, field positions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Import audit trail
CREATE TABLE statement_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL, -- Supabase Storage path
  bank_format_id UUID NOT NULL REFERENCES bank_formats(id),
  statement_start_date DATE NOT NULL,
  statement_end_date DATE NOT NULL,
  transaction_count INTEGER NOT NULL,
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions (the core fact table)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL, -- always positive
  is_credit BOOLEAN NOT NULL DEFAULT false, -- true for refunds/credits
  category_id UUID NOT NULL REFERENCES categories(id),
  import_id UUID NOT NULL REFERENCES statement_imports(id) ON DELETE CASCADE,
  excluded_from_analytics BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes for Dashboard Performance

```sql
-- Primary dashboard query: spending by date range
CREATE INDEX idx_transactions_date ON transactions(date);

-- Category breakdown queries
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date);

-- Composite for filtered analytics (exclude card payments)
CREATE INDEX idx_transactions_analytics ON transactions(date, excluded_from_analytics)
  WHERE excluded_from_analytics = false;

-- Rule evaluation ordering
CREATE INDEX idx_rules_position ON categorization_rules(position);
```

### Schema Design Rationale

**amount is always positive with is_credit flag:** Citibank statements use parentheses for credits. Storing amount as always-positive with a boolean flag avoids sign confusion and makes SUM queries straightforward: `SUM(CASE WHEN is_credit THEN -amount ELSE amount END)`.

**excluded_from_analytics on transactions (denormalized from category):** When a transaction is imported, the exclusion flag is copied from its category. This avoids a JOIN on every analytics query and makes the flag immutable per-transaction even if the category's exclusion setting changes later.

**position with gaps strategy for rule ordering:** Use positions like 100, 200, 300 rather than 1, 2, 3. Inserting between two rules (e.g., between 200 and 300) uses 250. Periodically renumber if gaps run out. This avoids updating every row on reorder. The UNIQUE constraint on position is enforced at application level (temporarily drop/recreate during reorder operations, or use deferred constraints).

**bank_formats.config as JSONB:** The format definition is a JSON document describing how to parse a specific bank's PDF. Example structure:

```json
{
  "name": "Citibank SG Credit Card",
  "pages": {
    "skip_patterns": ["BALANCE PREVIOUS STATEMENT", "SUB-TOTAL", "TOTAL"],
    "header_patterns": ["Card No."]
  },
  "transaction": {
    "line_pattern": "^(\\d{2}\\s+[A-Z]{3})\\s+(.+?)\\s+([\\d,]+\\.\\d{2})$",
    "date_format": "DD MMM",
    "credit_indicator": "parentheses",
    "description_continuation": true
  },
  "statement_period": {
    "pattern": "Statement Period:\\s+(\\d{2}/\\d{2}/\\d{4})\\s+to\\s+(\\d{2}/\\d{2}/\\d{4})",
    "date_format": "DD/MM/YYYY"
  }
}
```

---

## RLS (Row Level Security) Architecture

### Approach: profiles table with role column + helper function

Use a `profiles` table with a `role` column rather than Supabase custom claims (app_metadata). Rationale: the custom claims approach requires SQL function installation and has a more complex bootstrapping process. For 2-3 users, a profiles table checked by a SECURITY DEFINER function is simpler, equally performant, and easier to debug.

```sql
-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'viewer', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### RLS Policies by Table

```sql
-- PROFILES: everyone reads all profiles, only admins update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view profiles"
  ON profiles FOR SELECT TO authenticated
  USING (true); -- shared household, all users visible

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin());

-- CATEGORIES: everyone reads, admins write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL TO authenticated
  USING (is_admin());

-- CATEGORIZATION_RULES: everyone reads, admins write
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rules"
  ON categorization_rules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rules"
  ON categorization_rules FOR ALL TO authenticated
  USING (is_admin());

-- TRANSACTIONS: everyone reads, admins insert (via import)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- STATEMENT_IMPORTS: everyone reads, admins insert
ALTER TABLE statement_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view imports"
  ON statement_imports FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can create imports"
  ON statement_imports FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- BANK_FORMATS: everyone reads, admins manage
ALTER TABLE bank_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bank formats"
  ON bank_formats FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage bank formats"
  ON bank_formats FOR ALL TO authenticated
  USING (is_admin());
```

### RLS Design Rationale

**Shared household data model:** All authenticated users see all data. This is a single-household app. There is no user-level data isolation -- the isolation is at the authentication boundary (you must be logged in) and the role boundary (only admins can mutate).

**SECURITY DEFINER on is_admin():** The function runs with the privileges of its creator, bypassing RLS for the internal query to the profiles table. This prevents circular RLS dependencies (profile table policy cannot call a function that queries the profile table under RLS).

**No DELETE policies on transactions:** Transactions are immutable once imported. Deleting an import cascades to its transactions via the foreign key. If admin needs to remove bad data, they delete the import record.

---

## Patterns to Follow

### Pattern 1: Server Actions for Mutations

**What:** All data mutations (create rule, import transactions, update category) go through Next.js Server Actions, not client-side Supabase calls.

**When:** Any write operation.

**Why:** Server Actions run server-side where you create an authenticated Supabase client using `@supabase/ssr`. RLS is enforced at the database level regardless, but server actions provide a natural place for business logic validation (e.g., 100% categorization gate) before the database call.

```typescript
// app/actions/rules.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRule(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const pattern = formData.get('pattern') as string
  const matchType = formData.get('matchType') as string
  const categoryId = formData.get('categoryId') as string

  // Get next position (append to end)
  const { data: lastRule } = await supabase
    .from('categorization_rules')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (lastRule?.position ?? 0) + 100

  const { error } = await supabase
    .from('categorization_rules')
    .insert({
      pattern,
      match_type: matchType,
      category_id: categoryId,
      position: nextPosition,
    })

  if (error) throw error
  revalidatePath('/rules')
}
```

### Pattern 2: Server Components for Dashboard Reads

**What:** Dashboard pages are Server Components that fetch data directly from Supabase, passing aggregated results to Client Components for rendering charts.

**When:** Any read-only data display.

**Why:** No client-side fetch waterfall. Data is fetched server-side, close to the database. RLS is automatically enforced via the authenticated server client.

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { SpendingChart } from '@/components/spending-chart' // Client Component

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const supabase = await createClient()

  // Parallel data fetching
  const [totalResult, categoryResult, trendResult] = await Promise.all([
    supabase.rpc('get_total_spending', { date_from: from, date_to: to }),
    supabase.rpc('get_category_breakdown', { date_from: from, date_to: to }),
    supabase.rpc('get_monthly_trend', { date_from: from, date_to: to }),
  ])

  return (
    <div>
      <SpendingChart
        total={totalResult.data}
        categories={categoryResult.data}
        trend={trendResult.data}
      />
    </div>
  )
}
```

### Pattern 3: Postgres Functions for Dashboard Aggregations

**What:** Define Postgres functions (RPCs) for complex aggregation queries rather than building queries client-side or in Server Components.

**When:** Dashboard analytics queries that involve GROUP BY, date_trunc, conditional sums.

**Why:** Encapsulates query logic in the database layer. RLS is enforced on the underlying tables. Functions are callable via `supabase.rpc()`. Easier to optimize with EXPLAIN ANALYZE.

```sql
CREATE OR REPLACE FUNCTION get_category_breakdown(
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  category_name TEXT,
  total_amount DECIMAL(12, 2),
  transaction_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER -- respects RLS of calling user
AS $$
  SELECT
    c.name AS category_name,
    SUM(CASE WHEN t.is_credit THEN -t.amount ELSE t.amount END) AS total_amount,
    COUNT(*) AS transaction_count
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.excluded_from_analytics = false
    AND (date_from IS NULL OR t.date >= date_from)
    AND (date_to IS NULL OR t.date <= date_to)
  GROUP BY c.name
  ORDER BY total_amount DESC;
$$;

CREATE OR REPLACE FUNCTION get_monthly_trend(
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  month DATE,
  total_amount DECIMAL(12, 2)
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    date_trunc('month', t.date)::DATE AS month,
    SUM(CASE WHEN t.is_credit THEN -t.amount ELSE t.amount END) AS total_amount
  FROM transactions t
  WHERE t.excluded_from_analytics = false
    AND (date_from IS NULL OR t.date >= date_from)
    AND (date_to IS NULL OR t.date <= date_to)
  GROUP BY date_trunc('month', t.date)
  ORDER BY month;
$$;
```

### Pattern 4: Config-Driven PDF Parser

**What:** A generic parser function that reads a JSON bank format definition and uses it to extract transactions from PDF text. No bank-specific code paths.

**When:** PDF parsing step.

**Why:** Adding a new bank format means adding a JSON row to the bank_formats table, not writing new code. The parser is a pure function: (pdfText: string[], config: BankFormatConfig) => ParsedTransaction[].

```typescript
// lib/parser/parse-statement.ts
interface BankFormatConfig {
  pages: {
    skip_patterns: string[]
    header_patterns: string[]
  }
  transaction: {
    line_pattern: string
    date_format: string
    credit_indicator: 'parentheses' | 'negative' | 'column'
    description_continuation: boolean
  }
  statement_period: {
    pattern: string
    date_format: string
  }
}

interface ParsedTransaction {
  date: string       // ISO date
  description: string
  amount: number     // always positive
  isCredit: boolean
}

function parseStatement(
  pageTexts: string[],
  config: BankFormatConfig
): ParsedTransaction[] {
  // 1. Extract statement period (for year inference)
  // 2. For each page, for each line:
  //    a. Skip if matches skip_patterns
  //    b. Try matching transaction.line_pattern
  //    c. If match: extract date, description, amount, credit flag
  //    d. If description_continuation: check next line for continuation
  // 3. Infer year from statement period for DD MMM dates
  // 4. Return parsed transactions
}
```

### Pattern 5: URL-Driven Date Range Filtering

**What:** Dashboard date range is stored in URL search params (`?from=2026-01-01&to=2026-03-31`), not in React state.

**When:** Any filterable/shareable view.

**Why:** Enables bookmarkable dashboard views. Server Components can read search params directly. No client-side state hydration needed. Browser back/forward works naturally with filter changes.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side PDF Upload to Serverless Function

**What:** Sending the PDF file directly in the request body to a Next.js API route or server action.

**Why bad:** Vercel serverless functions have a 4.5MB request body limit. Credit card PDFs routinely exceed 1-2MB and can reach 5MB+ for multi-page statements. The upload will fail with a 413 error for larger files. Server Actions have an even lower default limit of 1MB for request body.

**Instead:** Upload PDF directly to Supabase Storage from the client, then pass only the storage path to the server for processing.

### Anti-Pattern 2: Storing Parsed Transactions Before Review

**What:** Persisting parsed (uncategorized) transactions to the database immediately after parsing, then updating them during review.

**Why bad:** Creates partial/dirty data in the database. If the user abandons the review, you have uncategorized transactions polluting analytics. Requires a "draft" status field and cleanup logic.

**Instead:** Keep parsed transactions in client-side state (or a server-side temporary store if needed) during the review cycle. Only persist to the database after 100% categorization is confirmed.

### Anti-Pattern 3: Checking Role in Client Components

**What:** Fetching the user's role on the client and conditionally rendering admin UI.

**Why bad:** Client-side role checks are for UX only, not security. A knowledgeable user can bypass them. The real security boundary must be RLS (database level) and server-side auth checks.

**Instead:** Use RLS for all data access control. Use middleware for route protection. Client-side role checks are acceptable ONLY for conditional UI rendering (show/hide admin buttons), never as the sole security mechanism.

### Anti-Pattern 4: Complex Rule Engine

**What:** Implementing a full-featured rule engine with AND/OR combinators, weighted scoring, conflict resolution, or a Drools-like DSL.

**Why bad:** Massive over-engineering for this use case. A household has maybe 50-100 rules. Users need to understand why a transaction was categorized a certain way. Complex rule systems are hard to debug and harder to explain.

**Instead:** Linear scan, first-match-wins. If a user needs a more specific rule, they move it higher in the list. The mental model is simple: "rules are checked top to bottom, first one that matches wins."

### Anti-Pattern 5: Materialized Views for Small Data

**What:** Creating materialized views for dashboard aggregations when the dataset is small.

**Why bad:** Adds refresh scheduling complexity, stale data risk, and operational overhead. For a household finance app with thousands of rows (not millions), standard queries with indexes are fast enough (sub-50ms).

**Instead:** Use regular Postgres functions with proper indexes. Monitor query performance. Only consider materialized views if query times exceed acceptable thresholds (unlikely at this scale).

---

## Scalability Considerations

| Concern | Current Scale (1 household) | If Multi-Household Later |
|---------|---------------------------|-------------------------|
| Transaction volume | ~3,000/year -- trivial for Postgres | Add household_id, partition by household |
| Rule evaluation | ~50 rules, linear scan in microseconds | Per-household rules, still linear scan |
| Dashboard queries | Sub-50ms with indexes on thousands of rows | Add household_id to WHERE clauses, still fast |
| PDF parsing | One-at-a-time, 5-7s per statement | Queue-based parsing if concurrent uploads needed |
| Storage | ~50MB/year of PDFs | Supabase Storage handles this natively |
| Auth/RLS | 2-3 users, negligible overhead | Add household_id to RLS policies |

**The single-household architecture is deliberately simple.** Migration to multi-household requires adding a `household_id` column to most tables and updating RLS policies. The architecture supports this cleanly because RLS is already the authorization layer -- you just make the policies more specific.

---

## Suggested Build Order

Based on component dependencies, the recommended build sequence is:

### Phase 1: Foundation (no dependencies)
1. **Supabase project setup** -- database, auth, storage bucket
2. **Database schema** -- all tables, indexes, RLS policies, helper functions
3. **Next.js project scaffolding** -- App Router, Supabase client utilities, middleware
4. **Auth flow** -- login page, session management, role-aware middleware

**Rationale:** Everything else depends on auth working and the schema existing. Getting RLS right early prevents security holes from accumulating.

### Phase 2: Parser Pipeline (depends on Phase 1 schema + storage)
5. **Bank format config** -- seed Citibank SG format definition
6. **PDF upload to Storage** -- client-side upload component
7. **PDF parse endpoint** -- Route Handler using unpdf + config-driven parser
8. **Parser tests** -- unit tests with sample Citibank statement text

**Rationale:** The parser is the core differentiating functionality and the hardest to get right. It needs to be solid before building the review UI on top of it.

### Phase 3: Categorization (depends on Phase 2 parsed output)
9. **Rule engine** -- evaluation function (pure function, testable independently)
10. **Review UI** -- split view (categorized/uncategorized), inline rule creation
11. **Import action** -- 100% gate check, batch insert, import audit record
12. **Rules admin page** -- CRUD with drag-to-reorder

**Rationale:** The review screen is the most interactive part of the app. It depends on having parsed transactions (Phase 2) and needs the rule engine working. Rules admin is secondary to inline rule creation on the review screen.

### Phase 4: Dashboard (depends on Phase 3 imported data)
13. **Postgres aggregation functions** -- RPCs for category breakdown, monthly trend, total spending
14. **Dashboard layout** -- date range picker, summary cards
15. **Charts** -- Recharts category pie/bar chart, monthly trend line/bar chart
16. **Transaction list** -- searchable, filterable, paginated

**Rationale:** Dashboard needs real imported data to be meaningful. Building it last means you have actual transactions to test with, which produces better UX decisions.

### Phase 5: Polish (depends on everything working)
17. **Categories admin page** -- CRUD for user-defined categories
18. **User management** -- admin-only page to manage household members
19. **Error handling and edge cases** -- duplicate import detection, malformed PDF handling
20. **Responsive design** -- mobile-friendly layouts for viewer role usage

---

## Sources

- [Vercel Functions Limitations (official docs)](https://vercel.com/docs/functions/limitations) -- body size limits, memory, duration
- [unpdf GitHub (UnJS)](https://github.com/unjs/unpdf) -- API documentation, serverless compatibility
- [Why unpdf beats pdf-parse on Vercel](https://dev.to/chudi_nnorukam/serverless-pdf-processing-why-unpdf-beats-pdf-parse-2jji) -- native dependency issues, benchmarks
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy syntax, auth.uid()
- [Supabase RLS admin/user pattern](https://dev.to/shahidkhans/setting-up-row-level-security-in-supabase-user-and-admin-2ac1) -- SECURITY DEFINER pattern
- [Supabase custom claims](https://github.com/supabase-community/supabase-custom-claims) -- alternative approach using app_metadata
- [Supabase Auth with Next.js (official docs)](https://supabase.com/docs/guides/auth/server-side/nextjs) -- middleware, server client creation
- [Bypassing Vercel 4.5MB limit with Supabase Storage](https://medium.com/@jpnreddy25/how-to-bypass-vercels-4-5mb-body-size-limit-for-serverless-functions-using-supabase-09610d8ca387) -- direct upload pattern
- [Supabase materialized views discussion](https://github.com/orgs/supabase/discussions/17790) -- RLS limitations on materialized views
- [PostgreSQL date aggregation patterns](https://www.crunchydata.com/developers/playground/postgres-date-functions) -- date_trunc for monthly grouping
- [Rules Engine Pattern (DevIQ)](https://deviq.com/design-patterns/rules-engine-pattern/) -- general pattern guidance
- [Martin Fowler on Rules Engines](https://martinfowler.com/bliki/RulesEngine.html) -- when to use (and when not to)
