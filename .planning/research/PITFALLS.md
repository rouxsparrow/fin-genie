# Pitfalls Research

**Domain:** Personal finance analyzer (PDF bank statement import, categorization, analytics)
**Researched:** 2026-04-06
**Confidence:** HIGH (verified across official docs, community reports, and domain-specific tools)

## Critical Pitfalls

### Pitfall 1: Vercel 4.5 MB Request Body Limit Blocks PDF Uploads

**What goes wrong:**
Uploading a PDF via a Next.js Server Action or API Route sends the file through Vercel's serverless function. Vercel enforces a hard 4.5 MB limit on request body size. Citibank SG credit card statements can be 14+ pages and multi-MB. A base64-encoded PDF inflates ~33% over its binary size, easily breaching 4.5 MB. The upload silently fails with a `413 FUNCTION_PAYLOAD_TOO_LARGE` error.

**Why it happens:**
Developers default to the obvious pattern: `<input type="file">` -> Server Action -> process in function. This works locally but fails on Vercel because local dev has no body size restriction. Next.js Server Actions also have a separate 1 MB default `bodySizeLimit` that must be configured independently in `next.config.ts`.

**How to avoid:**
Upload PDFs directly from the browser to Supabase Storage (bypasses Vercel entirely). Then call a Server Action with only the storage path (a few bytes). The Server Action downloads the PDF from Supabase Storage server-side, parses it, and returns results. This pattern:
1. Browser uploads to Supabase Storage via `supabase.storage.from('statements').upload(path, file)`
2. Server Action receives the storage path string, downloads the file via `supabase.storage.from('statements').download(path)`
3. Server Action parses the PDF in the serverless function

Configure `next.config.ts` with `serverActions: { bodySizeLimit: '10mb' }` as a safety net even with the Supabase Storage pattern, in case the architecture changes later.

**Warning signs:**
- Upload works locally but fails in production
- `413` errors in Vercel function logs
- "FUNCTION_PAYLOAD_TOO_LARGE" in deployment dashboard

**Phase to address:**
Phase 1 (Foundation/Upload) -- this is the very first user-facing feature and must be correct from day one. Getting this wrong means rebuilding the entire upload flow.

---

### Pitfall 2: PDF Text Extraction Returns Garbled or Mis-ordered Text

**What goes wrong:**
PDF is not a structured document format -- it is a rendering instruction set. Text is positioned by x,y coordinates, not by logical reading order. A bank statement that visually shows `15 Mar | GRAB FOOD | 25.40` may extract as `15 Mar25.40GRAB FOOD` or split across multiple text items with overlapping coordinates. Column alignment breaks, amounts merge with descriptions, and multi-line merchant names get interleaved with other fields.

**Why it happens:**
Libraries like `pdf-parse` extract raw text strings in the order they appear in the PDF stream, which is often not the visual order. Citibank SG statements have specific layout challenges:
- Transaction date (DD MMM) is a separate text element from the description
- Amount is right-aligned in a different column
- Multi-line descriptions (merchant name + location on line 2, masked card number on line 3)
- Page headers repeat on every page
- Summary sections (BALANCE PREVIOUS STATEMENT, SUB-TOTAL) look like transactions

**How to avoid:**
Use a coordinate-aware library (`pdf2json`, `pdf.js-extract`, or `unpdf` with detailed mode) that preserves x,y positions for every text element. Build the parser in two stages:
1. **Extract**: Get all text items with their page, x, y coordinates
2. **Reconstruct**: Use the config-driven bank format JSON to define column boundaries (x-ranges for date column, description column, amount column) and row detection (y-position grouping with tolerance)

Test with at least 3-4 real Citibank SG statements from different months. The layout may change subtly between statement cycles (different description lengths, different page breaks).

**Warning signs:**
- Amounts appearing as part of descriptions
- Missing transactions (they exist in the PDF but parsing skipped them)
- Duplicate text items (same text at slightly different coordinates)
- Parser works on one statement but breaks on another

**Phase to address:**
Phase 1 (PDF Parser) -- this is the core technical challenge. Build with coordinate-based extraction from the start. Do not start with `pdf-parse` text-only extraction hoping to regex your way through -- it will fail on edge cases.

---

### Pitfall 3: Date-Without-Year Causes Transactions to Land in Wrong Year

**What goes wrong:**
Citibank SG statements show transaction dates as `DD MMM` (e.g., "15 Mar") without a year. A statement covering December 2025 - January 2026 has transactions in both years. Naively assigning the statement year to all dates puts January transactions in the wrong year, or December transactions in the wrong year depending on which year you pick.

**Why it happens:**
The year-inference logic seems trivial ("just use the statement year") until you encounter cross-year statements. Additionally:
- The statement period itself must be extracted from the PDF header
- The statement period format may differ from transaction date format
- A transaction on "31 Dec" in a January 2026 statement belongs to 2025

**How to avoid:**
Implement explicit year inference in the config-driven parser:
1. Extract the statement period start and end dates (these include the year) from the PDF header
2. For each transaction date (DD MMM), determine which year makes it fall within (or close to) the statement period
3. Rule: if the transaction month is greater than the statement end month and the statement starts in the prior year, assign the prior year. Otherwise assign the statement year.
4. Validate: every inferred date must fall within the statement period (with a small tolerance for posting delays)
5. Store dates as full ISO dates (`YYYY-MM-DD`) in the database -- never store partial dates

Edge case: A December statement that arrives in January might have a "Statement Date" in January but transactions in December. Parse the statement period range, not just the statement date.

**Warning signs:**
- Transactions showing up in analytics for the wrong month/year
- Duplicate detection failing because the same transaction has different inferred years across re-imports
- Statement period extraction returning unexpected values

**Phase to address:**
Phase 1 (PDF Parser) -- year inference must be part of the initial parser config schema. The bank format JSON should define where to find the statement period and how to map transaction dates to full dates.

---

### Pitfall 4: JavaScript Floating-Point Arithmetic Corrupts Financial Totals

**What goes wrong:**
JavaScript uses IEEE 754 double-precision floating-point for all numbers. `0.1 + 0.2 === 0.30000000000000004`. Over hundreds of transactions, rounding errors accumulate. Category totals don't match the sum of their transactions. The dashboard shows $1,234.56 in "Food" but adding up the transactions gives $1,234.55 or $1,234.57. Users lose trust in the tool immediately.

**Why it happens:**
Developers parse `"25.40"` from the PDF as `parseFloat("25.40")` which gives `25.4` (a float). All subsequent arithmetic (summing categories, computing totals, calculating percentages) compounds the error. SGD has 2 decimal places, but intermediate calculations can produce infinite decimal representations in binary.

**How to avoid:**
Store and compute all monetary values as integers in cents. Parse `"25.40"` as `2540` (integer cents). All aggregation happens in integer arithmetic. Convert to display format (`(cents / 100).toFixed(2)`) only at the UI rendering layer. In Postgres, use `INTEGER` for cents or `NUMERIC(10,2)` for dollar amounts -- Postgres NUMERIC is exact, unlike JS floats.

Recommended approach:
- PDF parser outputs amounts as integer cents
- Database stores `amount_cents INTEGER`
- All SQL aggregations (`SUM`, `AVG`) operate on the integer column
- Frontend formats with `(amountCents / 100).toFixed(2)` or `Intl.NumberFormat`
- Never do arithmetic in JavaScript on dollar amounts

**Warning signs:**
- Category totals that are off by 1 cent from the sum of transactions
- Tests passing with round numbers but failing with real-world amounts
- `toFixed()` calls scattered throughout business logic (sign of float arithmetic)

**Phase to address:**
Phase 1 (Data Model/Parser) -- the cents-based representation must be established in the database schema and parser output from the beginning. Retrofitting this requires migrating every stored amount.

---

### Pitfall 5: Duplicate Transactions on Re-import of Same Statement

**What goes wrong:**
The user uploads the same PDF twice (or uploads a corrected version). Without deduplication, every transaction is inserted again, doubling spending totals. Alternatively, the user uploads overlapping statements (December statement and January statement that both include late-December transactions). The system creates duplicates that are nearly impossible for the user to manually identify and clean up.

**Why it happens:**
Bank statement transactions have no unique identifier. Two transactions on the same date at the same merchant for the same amount are genuinely different transactions (bought lunch twice). But the same transaction appearing in two overlapping statements is a duplicate. There is no reliable way to distinguish these cases from the data alone.

**How to avoid:**
Use a composite deduplication key and statement-level tracking:
1. **Statement-level dedup**: Hash the PDF content (SHA-256 of the file bytes). Reject re-upload of an identical file with a clear message ("This statement has already been imported").
2. **Transaction-level dedup**: Create a composite key from `(date, description_normalized, amount_cents, sequence_within_statement)`. The sequence number disambiguates two identical transactions on the same day.
3. **Overlap detection**: When importing, check if any transactions in the new statement match existing transactions within the same date range. Flag these for user review rather than silently skipping or duplicating.
4. **Import as atomic operation**: All transactions from one statement are imported in a single database transaction. If anything fails, nothing is committed.

**Warning signs:**
- Total spending suddenly doubles after re-uploading a statement
- Transaction counts don't match the number of lines in the PDF
- User reports "I only bought this once but it shows twice"

**Phase to address:**
Phase 2 (Import/Review workflow) -- the 100% categorization gate already forces a deliberate import step. Add deduplication checks at this point before committing to the database.

---

### Pitfall 6: RLS Disabled or Misconfigured on Supabase Tables

**What goes wrong:**
RLS is disabled by default on new Supabase tables. If you create tables via SQL migrations and forget `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, the data is exposed to anyone with the anon key (which is in your frontend JavaScript). In January 2025, 170+ apps built with AI tools were found to have exposed databases for exactly this reason. For a finance app, this means transaction data, amounts, and spending patterns are publicly readable.

**Why it happens:**
- Creating tables in SQL migrations doesn't auto-enable RLS
- The app works perfectly in development without RLS (Supabase client uses service_role in server context)
- No error or warning when RLS is missing -- queries just work, returning all data
- If RLS is enabled but no policies exist, queries return empty results (silent failure in the other direction)

**How to avoid:**
Mandatory checklist for every migration file:
1. Every `CREATE TABLE` must be followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. Every table must have at least one policy for `SELECT`, `INSERT`, `UPDATE`, `DELETE` as needed
3. Use `auth.uid()` in policies to scope data to the authenticated user
4. For this app's role model: admin gets full CRUD, viewer gets SELECT only. Implement via a `user_role` column or a separate `user_roles` table referenced in policies.
5. Test RLS from the client (not the SQL editor, which bypasses RLS)
6. Use Supabase dashboard's "User Impersonation" feature to verify policies

Critical: The `service_role` key must NEVER appear in client-side code, environment variables prefixed with `NEXT_PUBLIC_`, or any code that ships to the browser.

**Warning signs:**
- Queries returning data without the user being logged in
- Queries returning ALL rows instead of scoped rows
- Supabase dashboard showing RLS as "Disabled" on any table
- `service_role` key in any `NEXT_PUBLIC_` env var

**Phase to address:**
Phase 1 (Database Schema) -- RLS must be enabled on every table from the first migration. Create a migration template/checklist that includes RLS as a mandatory step. Verify in CI or as a manual review step.

---

### Pitfall 7: Serverless Function Timeout on Large PDF Parsing

**What goes wrong:**
A 14-page Citibank statement with dense transactions takes longer to parse than expected. The coordinate-based text extraction, row reconstruction, and rule matching are CPU-intensive. On Vercel Hobby plan, the function times out at 60 seconds (or 300 seconds with Fluid Compute). The user sees a generic timeout error with no indication of what went wrong or how to retry.

**Why it happens:**
- `pdfjs-dist` (full build) is ~2 MB gzipped, causing slow cold starts
- Coordinate-based reconstruction involves sorting and grouping hundreds of text items per page
- Applying regex categorization rules to every transaction multiplies processing time
- Serverless cold start + parsing time can exceed the timeout window

**How to avoid:**
1. **Use a lightweight PDF library**: `unpdf` (wraps `pdfjs-serverless`, ~1.4 MB minified, zero native dependencies) or `pdf-parse` v2 (built for serverless). Avoid `pdfjs-dist` full build.
2. **Separate parsing from categorization**: Parse PDF -> store raw transactions -> apply rules as a separate step. This keeps each function invocation short.
3. **Stream progress to the client**: Use a polling pattern or Supabase Realtime to show parsing progress instead of blocking on a single request.
4. **Set explicit `maxDuration`**: In the route configuration, set `maxDuration` appropriately (e.g., 60 seconds) and handle timeout gracefully with a user-facing message.
5. **Exclude heavy dependencies from bundle**: Use `outputFileTracingIncludes` in `next.config.ts` if needed, and install PDF libraries with `--no-optional` to skip native dependencies like `canvas` (~180 MB).

**Warning signs:**
- Parsing works for short statements (2-3 pages) but fails on longer ones
- Inconsistent failures (cold start + long parse = timeout, warm start succeeds)
- Vercel logs showing `504 FUNCTION_INVOCATION_TIMEOUT`
- Bundle size warnings during deployment

**Phase to address:**
Phase 1 (PDF Parser) -- library choice and architecture (parse vs. categorize as separate steps) must be decided upfront. Benchmark with the longest real statement available.

---

### Pitfall 8: Categorization Rules with Catastrophic Regex Backtracking

**What goes wrong:**
Admin creates a regex rule with nested quantifiers (e.g., `(.*food.*)+` or `(a|a)*b`) either intentionally or by accident. When this regex runs against a long transaction description that doesn't match, the regex engine enters catastrophic backtracking -- exponential time complexity. A single rule evaluation can hang the serverless function for minutes, triggering a timeout. Since rules are user-defined, this is effectively a self-inflicted denial of service.

**Why it happens:**
- Regex is opt-in, but even moderately experienced users write dangerous patterns
- The problem only manifests on non-matching inputs (matching inputs short-circuit)
- No built-in protection in JavaScript's regex engine against backtracking

**How to avoid:**
1. **Default to substring match**: Substring is the primary matching mode. Most categorization needs are satisfied by "description contains 'GRAB'" -- no regex needed.
2. **Validate regex on save**: When a user saves a regex rule, test it against a pathological input (e.g., 500-character string of 'a's) with a timeout. If it takes >100ms, reject it with an explanation.
3. **Runtime timeout per rule**: Wrap regex execution in a timeout. In Node.js, use `vm.runInNewContext` with a timeout option, or use the `re2` library which guarantees linear-time matching (no backtracking).
4. **Limit regex complexity**: Reject patterns with nested quantifiers (`(.*)+`, `(a+)+`) at save time using a simple pattern analysis.
5. **Cap description length**: Truncate transaction descriptions to a reasonable length (e.g., 200 chars) before rule evaluation -- backtracking severity is exponential in input length.

**Warning signs:**
- Rule evaluation suddenly becomes slow for specific transactions
- Server Action timeouts that only happen during the "apply rules" step
- A single newly-created regex rule causes all re-parse operations to hang

**Phase to address:**
Phase 2 (Rule Engine) -- implement substring-first with regex validation from day one. Do not allow unvalidated user regex to execute against arbitrary input.

---

### Pitfall 9: Noise Rows Parsed as Transactions

**What goes wrong:**
Citibank SG statements contain many non-transaction rows that structurally resemble transactions: "BALANCE PREVIOUS STATEMENT", "SUB-TOTAL", "TOTAL NEW BALANCE", card header rows, page footers, and summary sections. These rows often have amounts and date-like text. The parser includes them as real transactions, inflating spending totals. "SUB-TOTAL 1,234.56" gets categorized as a $1,234.56 purchase.

**Why it happens:**
- A regex or positional parser that matches "text with amount on the right side" catches summary rows too
- Different statement months may have different summary sections (e.g., annual fee appearing on some months)
- Page breaks split transaction sections with repeated headers

**How to avoid:**
The config-driven bank format JSON must define:
1. **Skip patterns**: List of text patterns that identify noise rows (e.g., `"BALANCE PREVIOUS STATEMENT"`, `"SUB-TOTAL"`, `"TOTAL NEW BALANCE"`, `"MINIMUM PAYMENT DUE"`)
2. **Section boundaries**: Define where the transaction section starts and ends on each page (e.g., transactions start after the header row containing "Date Description Amount" and end before "SUB-TOTAL")
3. **Validation**: Transaction amounts should be reasonable (e.g., between $0.01 and $50,000). Flag outliers for review.
4. **Transaction count validation**: Compare parsed count against the statement's own transaction count if available.

Build a test suite with known-good statement outputs (expected transaction count and total) to catch regressions.

**Warning signs:**
- Transaction count higher than expected
- Very large "transactions" that are actually subtotals
- Transactions with descriptions like "PREVIOUS STATEMENT" or "PAYMENT DUE"

**Phase to address:**
Phase 1 (Parser Config) -- the skip-patterns and section-boundary definitions are core to the bank format JSON config. Include a comprehensive set from analyzing real statements.

---

### Pitfall 10: Credit vs. Debit Misclassification

**What goes wrong:**
Citibank SG statements denote credits (payments, refunds) with parentheses around the amount: `(150.00)` is a credit, `150.00` is a debit. The parser fails to detect the parentheses notation, treating all amounts as debits. Refunds and card payments inflate spending totals. Alternatively, the parser strips parentheses during text cleaning and loses the credit indicator.

**Why it happens:**
- Text-cleaning regexes that strip all non-numeric characters remove the parentheses
- The parenthetical notation is specific to Citibank and some other banks -- not a universal format
- Testing with statements that have few refunds misses the bug

**How to avoid:**
1. Parse the credit/debit indicator before cleaning the amount string
2. In the bank format JSON config, define the credit notation (e.g., `"credit_format": "parentheses"` or `"credit_format": "negative_sign"`)
3. Store amounts as positive integers with a separate `is_credit` boolean flag, or store credits as negative cents
4. Card payment transactions (credits) must be auto-categorized as "Card Payment" and excluded from spending analytics (per project requirements)
5. Test with statements that contain refunds, card payments, and fee reversals

**Warning signs:**
- Spending totals much higher than expected (refunds counted as spending)
- Card payments showing up in spending analytics
- No credits in the parsed output despite the statement clearly having them

**Phase to address:**
Phase 1 (Parser Config) -- credit/debit detection is part of the fundamental amount parsing logic. The bank format JSON must include the credit indicator format.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `pdf-parse` text-only extraction (no coordinates) | Simpler code, faster initial development | Cannot reliably extract columns from bank statements; will need complete rewrite when layout varies | Never for bank statement parsing -- coordinate data is essential |
| Storing amounts as floats in JS and Postgres `REAL` | No conversion code needed | Cumulative rounding errors, totals off by cents, user distrust | Never for financial data |
| Hardcoding Citibank format in parser logic | Faster to ship v1 | Cannot add new bank formats without code changes; defeats the config-driven architecture | Only if config-driven parser is explicitly deferred (but it's a stated requirement) |
| Skipping RLS and using service_role for all queries | Simpler development, no policy debugging | Complete security exposure; any browser user can read all data; painful to retrofit RLS | Never -- RLS from day one |
| Storing PDF files in the database (bytea column) | No Supabase Storage setup needed | Database bloat, slower backups, cannot use CDN, harder to manage | Never -- use Supabase Storage |
| Inline regex without validation | Faster rule creation flow | One bad regex can DoS the entire parsing pipeline | Only if regex feature is deferred entirely (substring-only in v1) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + Next.js | Using a single Supabase client for both server and client | Use `createBrowserClient` for client components and `createServerClient` for Server Components/Actions/Route Handlers. Each has different cookie handling. Follow the official `@supabase/ssr` package patterns. |
| Supabase Storage + RLS | Creating a storage bucket but forgetting RLS policies on it | Storage buckets are private by default. Add explicit policies: authenticated users can upload to their folder, all authenticated users can read (shared household data). Test from the browser client. |
| Supabase Auth + Vercel | Hardcoding Supabase URL/keys in client code | Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client. Use `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) for server-only operations. Verify in Vercel env vars settings. |
| Next.js App Router + File Upload | Using Server Actions directly for file upload | Server Actions have a 1 MB default body limit (configurable). For PDFs, upload to Supabase Storage from the client, then pass the path to a Server Action. |
| Recharts + Large Datasets | Passing all transactions to chart components | Aggregate data in SQL (`GROUP BY category`, `GROUP BY month`) and pass only summary data to Recharts. Rendering thousands of data points kills performance. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all transactions into memory for categorization | Slow re-parse, high memory usage on serverless | Process in batches or use SQL-level categorization with `CASE WHEN` statements | >500 transactions in a single statement |
| N+1 queries on dashboard (one query per category) | Slow dashboard load, many database round-trips | Single aggregation query with `GROUP BY category` | >10 categories |
| Re-evaluating all rules against all transactions on every rule change | Noticeable delay when editing rules, compounds as rules grow | Only re-evaluate the changed rule, or mark affected transactions for lazy re-evaluation | >50 rules, >1000 stored transactions |
| Storing and querying raw PDF text in Postgres | Slow full-text search, database bloat | Store only parsed structured data (date, description, amount, category). Keep raw PDF in Supabase Storage for reference only. | >10 statements |
| Client-side date filtering of all transactions | UI freezes on large transaction lists | Use SQL `WHERE` clauses with indexed date columns. Let the database filter. | >2000 transactions total |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `service_role` key in `NEXT_PUBLIC_` env var | Complete database bypass -- any user can read/write all data, bypassing all RLS | Only use `service_role` in server-side code. Audit all env vars with `NEXT_PUBLIC_` prefix. |
| RLS policies that use `auth.uid()` but no role check | Viewer role can modify data (insert/update/delete) because they're authenticated | Add role-based checks in policies: `auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'` for write operations, or use a `user_roles` table. |
| No RLS on storage bucket | Anyone with the anon key can list/download all uploaded PDFs | Add storage policies: only authenticated users in the household can access the bucket. |
| Exposing raw PDF parsing errors to the client | Stack traces may reveal file paths, library versions, or internal structure | Catch parsing errors server-side, log details, return generic user-friendly error messages. |
| No rate limiting on upload endpoint | Attacker can flood storage with PDFs, exhausting Supabase Storage quota | Limit uploads per user per time period. Validate file type (must be PDF) and file size (reasonable max, e.g., 10 MB) before accepting. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback during PDF parsing (just a spinner) | User doesn't know if it's working, may re-upload or navigate away | Show parsing stages: "Uploading...", "Extracting text...", "Found X transactions...", "Applying rules..." |
| Showing all transactions in a flat list on review screen | Overwhelming when a statement has 100+ transactions; hard to find uncategorized ones | Split into categorized (collapsed by category) and uncategorized (prominently displayed). Show counts. |
| Rule creation requires navigating to a separate page | Breaks the review workflow; user loses context of which transaction they were categorizing | Allow inline rule creation from the review screen: click uncategorized transaction -> create rule -> see it categorize immediately |
| No undo for rule deletion | User accidentally deletes a rule, loses categorization for dozens of transactions | Soft-delete rules or add confirmation dialog. Re-parse shows impact before committing. |
| Percentage-only category breakdown | "Food 35%" is meaningless without dollar amounts | Always show both absolute amounts and percentages in category breakdowns |
| Date range picker defaults to "all time" | First-time user sees all historical data, which may be slow and overwhelming | Default to current month or last 30 days. Provide quick presets (This Month, Last Month, Last 3 Months, Custom). |

## "Looks Done But Isn't" Checklist

- [ ] **PDF Upload**: Works locally but verify on Vercel -- test with a real 10+ page statement in production (body size limit, timeout)
- [ ] **Date Parsing**: Works for mid-year statements but test with December/January cross-year statement (year inference edge case)
- [ ] **Amount Parsing**: Works for normal debits but test with credits in parentheses, amounts over $1,000 with comma separators, and amounts with no cents (e.g., `100` vs `100.00`)
- [ ] **Rule Engine**: Works with simple substrings but test with regex containing special characters (`$`, `.`, `(`, `)`) that appear in financial descriptions
- [ ] **RLS Policies**: Works in SQL editor but test from browser client -- SQL editor bypasses RLS
- [ ] **Role Enforcement**: Viewer can see dashboard but verify viewer CANNOT upload, create rules, or modify categories (test every mutating API)
- [ ] **Analytics Totals**: Category breakdown sums to total spending -- verify with real data, not test fixtures (floating-point issues hide in fixtures with round numbers)
- [ ] **Multi-page PDF**: Parser extracts transactions from ALL pages, not just the first page -- verify transaction count matches manual count
- [ ] **Noise Row Filtering**: "BALANCE PREVIOUS STATEMENT" and "SUB-TOTAL" rows are NOT in parsed transactions -- verify with a statement that has these rows

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate transactions imported | MEDIUM | Identify duplicates by composite key, delete extras, re-aggregate analytics. Add dedup check to prevent recurrence. |
| Amounts stored as floats | HIGH | Create new integer column, migrate all data with `ROUND(amount * 100)`, update all queries and application code. Requires full regression test. |
| Missing RLS on tables | LOW (if no breach) / HIGH (if breached) | Enable RLS immediately, add policies. If data was exposed, assess what was accessed via Supabase logs, notify affected users. |
| Wrong year on transactions | MEDIUM | Re-parse affected statements with corrected year-inference logic. Delete and re-import if needed. |
| Noise rows imported as transactions | LOW | Delete rows matching known noise patterns. Add noise patterns to config. Re-import affected statements. |
| Regex DoS from bad rule | LOW | Kill the function (it will timeout). Delete or fix the offending rule. Add regex validation. |
| PDF library too large for serverless | MEDIUM | Swap library (e.g., `pdfjs-dist` to `unpdf`). May require adjusting how text extraction works. Test all statements. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Vercel 4.5 MB body limit | Phase 1: Upload Architecture | Upload a 5+ MB PDF in production and confirm it succeeds |
| PDF text extraction order | Phase 1: PDF Parser | Parse 3+ real Citibank SG statements and manually verify transaction accuracy |
| Date-without-year inference | Phase 1: PDF Parser | Parse a December/January cross-year statement and verify all dates are correct |
| Floating-point currency | Phase 1: Data Model | Run `SELECT SUM(amount_cents) FROM transactions WHERE category = X` and verify it matches dashboard display |
| Duplicate transactions | Phase 2: Import Workflow | Upload the same PDF twice and verify it is rejected or flagged |
| RLS misconfiguration | Phase 1: Database Schema | Use Supabase User Impersonation to verify each role sees only what it should |
| Serverless timeout on large PDF | Phase 1: PDF Parser | Parse a 14-page statement in production and verify it completes within timeout |
| Regex catastrophic backtracking | Phase 2: Rule Engine | Save a rule with `(.*)+` pattern and verify it is rejected |
| Noise rows as transactions | Phase 1: Parser Config | Compare parsed transaction count with manual count on a real statement |
| Credit/debit misclassification | Phase 1: Parser Config | Verify refunds and card payments are parsed as credits, not debits |

## Sources

- [Vercel Functions Limitations (official docs)](https://vercel.com/docs/functions/limitations) -- body size, timeout, memory limits
- [Vercel body size limit workaround (official)](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)
- [Next.js serverActions bodySizeLimit config (official)](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [Supabase Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Complete Guide 2026](https://vibeappscanner.com/supabase-row-level-security) -- 170+ exposed apps incident
- [Supabase API Keys docs](https://supabase.com/docs/guides/api/api-keys) -- anon vs service_role
- [OWASP ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [unpdf (GitHub)](https://github.com/unjs/unpdf) -- serverless-optimized PDF extraction
- [pdfjs-serverless (GitHub)](https://github.com/johannschopplich/pdfjs-serverless) -- lightweight PDF.js for edge
- [pdf2json (GitHub)](https://github.com/modesty/pdf2json) -- coordinate-aware PDF parsing
- [JavaScript Rounding Errors in Financial Applications](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Citibank Statement to CSV (GitHub)](https://github.com/matthewrwilton/citibank-statement-to-csv) -- prior art for Citi SG parsing
- [Process PDFs on Vercel: Reliable Serverless Guide (2026)](https://www.buildwithmatija.com/blog/process-pdfs-on-vercel-serverless-guide)
- [Bank Statement Formatting Pitfalls](https://www.supaclerk.com/blog/18-common-formatting-pitfalls-when-moving-bank-statement-data-to-excel-and-how-to-avoid-them)
- [Duplicate Transaction Detection Methods](https://count.co/metric/duplicate-transaction-detection-rate)

---
*Pitfalls research for: Personal finance analyzer (Fin Genie)*
*Researched: 2026-04-06*
