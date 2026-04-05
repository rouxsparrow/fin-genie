# Feature Research

**Domain:** Private household finance analyzer (PDF statement import, categorization, spending analytics)
**Researched:** 2026-04-06
**Confidence:** HIGH (well-established domain with mature reference implementations)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

#### Import & Parsing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| PDF upload with transaction extraction | Core value prop -- without this the app has no data | HIGH | Config-driven parser for Citibank SG format. Must handle multi-page PDFs (14+ pages), date inference (no year in rows), noise row filtering, and credit/debit detection via parentheses. Use pdf.js-extract or pdf-parse for text extraction with coordinate awareness |
| Transaction review before import | Users must verify parsed data before committing | MEDIUM | Two-section layout: categorized (top) and uncategorized (bottom). Already specified in PROJECT.md |
| Duplicate detection on import | Re-uploading a statement must not create duplicates | MEDIUM | Hash on (date + description + amount) to detect duplicates. Critical for overlapping statement periods. Firefly III, Koody, and most tools treat this as essential |
| Import history / audit trail | Users need to know what was already imported and when | LOW | Track which PDFs were imported, date of import, transaction count. Prevents confusion over "did I already upload December?" |

#### Categorization

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Rule-based auto-categorization | Manual categorization is unsustainable beyond 50 transactions | MEDIUM | Substring match (default) + regex (power user). First-match-wins ordered evaluation. This is the approach Firefly III uses and it works well for personal finance |
| Inline rule creation from uncategorized transactions | Users discover patterns while reviewing, not in advance | LOW | Click on uncategorized transaction, create rule from its description. Dramatically speeds up the categorization workflow |
| Re-parse after rule changes | Rules are iterative -- users create rules and want to see immediate effect | LOW | Re-run rules on current batch without re-uploading PDF |
| 100% categorization gate | Prevents dirty data from polluting analytics | LOW | Block import until all transactions are categorized. Forces rule completeness over time |
| User-defined categories | Every household has different spending patterns | LOW | CRUD for categories. No predefined taxonomy -- let users define their own |
| Card payment auto-exclusion | Credit card payments are not spending -- they are balance transfers | LOW | Built-in "Card Payment" category, auto-detected and excluded from spending analytics |

#### Analytics & Dashboard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Total spending for date range | The most basic question: "how much did we spend?" | LOW | Sum of all non-excluded transactions in range |
| Category breakdown (pie/donut chart) | "Where is the money going?" -- the core analytics question | MEDIUM | Donut chart with amounts and percentages. Keep to top-level categories (no subcategories in v1). Recharts supports this well |
| Spending trend over time (bar/line chart) | "Are we spending more or less?" -- the trajectory question | MEDIUM | Monthly bar chart, optionally stacked by category. Line chart overlay for total trend |
| Searchable/filterable transaction list | Users need to find specific transactions, verify data | MEDIUM | Search by description, filter by category, date range, amount range. Sortable columns |
| Custom date range selection | Different questions need different timeframes | LOW | Date picker with presets (this month, last 3 months, last year, custom) |

#### User Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password authentication | Basic access control for shared household data | LOW | Supabase Auth handles this. Simple and sufficient for 2-3 users |
| Admin vs viewer roles | Not everyone should be able to modify rules or import data | LOW | Admin: full CRUD. Viewer: read-only dashboard and transaction list. Role flag on user record |
| Admin user management | Admin needs to invite/remove household members | LOW | Simple admin settings page. No self-registration -- admin creates accounts |

### Differentiators (Competitive Advantage)

Features that are not required but create real value for this specific use case.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Config-driven parser (bank format as JSON) | Add new bank formats without code changes. Most tools hard-code per bank. This makes the tool extensible to DBS, OCBC, UOB statements later | HIGH | JSON config defines: page layout zones, date format, description columns, amount parsing rules, noise row patterns. Generic parser reads config. This is a genuine differentiator over tools like Banksheet or statement-parser that require code plugins per bank |
| Rule evolution visibility | Show how rules improve over time -- early imports need lots of manual work, later imports auto-categorize 95%+ | LOW | Display categorization coverage percentage per import. Motivates rule refinement |
| Inline rule creation with preview | Create a rule and instantly see which other transactions it would match | MEDIUM | Before saving a rule, show "This rule would also match 12 other transactions". Prevents overly broad or narrow rules. Firefly III does not have this UX |
| Merchant normalization | "GRAB* GRABFOOD SG" and "GRAB*GRABFOOD" are the same merchant | MEDIUM | Rules inherently handle this via substring matching, but a dedicated "merchant" field derived from rules adds analytics value (spending per merchant) |
| Year-over-year comparison | "Did we spend more on dining this December vs last December?" | MEDIUM | Side-by-side period comparison. Valuable once 12+ months of data exists. Defer to v1.x |
| Statement period tracking | Know exactly which months are imported vs missing | LOW | Track statement periods from PDF metadata. Show gaps in coverage. Helps ensure complete data |

### Anti-Features (Deliberately NOT Building)

Features that seem good but are wrong for a private household tool.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time bank sync (Plaid/Finverse) | "Why upload PDFs when you can sync automatically?" | Massive complexity: third-party API costs, Singapore bank support is limited, OAuth flows, credential storage liability, sync error handling. Overkill for 1-2 statements/month. These APIs also frequently break | PDF upload is deliberate. Monthly cadence is sufficient. Zero third-party dependency |
| Budgeting / spending goals | "Tell me if I'm over budget" | Different product entirely. Budgeting requires goal-setting UX, alerts, forecasting, envelope allocation. Doubles the app scope. YNAB and Actual Budget already do this well | Analytics-only: show what happened, not what should happen. Users can draw their own conclusions from the data |
| AI/LLM-powered categorization | "Use GPT to auto-categorize" | Requires API costs, latency, non-deterministic results (same transaction categorized differently on re-run), prompt engineering maintenance, and data privacy concerns (sending financial data to OpenAI). Rule-based is deterministic, explainable, and free | Rule-based categorization with substring + regex covers 95% of cases. Rules are transparent and predictable |
| Mobile native app | "I want to check spending on my phone" | Doubles the codebase. React Native or Flutter adds build complexity, app store review process, separate release cycles | Responsive web design. Next.js with proper mobile breakpoints handles phone access. No app store needed |
| Multi-currency support | "What about USD transactions?" | Adds exchange rate lookup, currency conversion in analytics, display complexity. Singapore household primarily uses SGD | SGD-only in v1. Foreign currency transactions on SG credit cards are already converted to SGD on the statement |
| OCR for scanned PDFs | "What about old paper statements?" | Tesseract.js adds significant bundle size, processing time, and accuracy issues. Scanned PDFs are fundamentally different from digital PDFs | Support digital PDFs only (text-selectable). Citibank SG provides digital statements. If scanned PDF uploaded, show clear error message |
| Investment / net worth tracking | "Track my portfolio too" | Completely different data model, API integrations, asset pricing. Different product | Out of scope. Credit card statements are spending data, not wealth data |
| Subscription / recurring payment detection | "Flag my recurring bills automatically" | Requires temporal pattern detection across multiple months, fuzzy matching on amounts, false positive handling. Moderate complexity for limited value in a household context | Users who want this can filter transactions by description to find recurring merchants manually |
| Split transactions (one purchase, multiple categories) | "My Costco trip was half groceries, half household" | Adds significant data model complexity -- one transaction becomes a parent with children. Complicates every query, chart, and export | Categorize by dominant purpose. The accuracy loss is minimal for household-level analytics |
| Export to CSV/OFX | "Let me use the data elsewhere" | Useful but not v1 essential. Adds UI, format decisions, edge cases | Defer to v1.x. Data is in Postgres -- power users can query directly |
| Dark mode | "Every app should have dark mode" | Not a priority for a utility app used 1-2 times per month | Defer. Neo Brutalism theme first, dark variant later if desired |
| Multi-household / SaaS model | "Let me share this with friends" | Turns a private tool into a product. Auth, billing, data isolation, onboarding, support | This is explicitly a private household tool. Single-tenant by design |

## Feature Dependencies

```
[PDF Upload]
    +-- requires --> [Config-driven Parser]
    +-- requires --> [Transaction Storage]
                        +-- requires --> [Category Management]
                        +-- requires --> [User Auth]

[Transaction Review Screen]
    +-- requires --> [PDF Upload + Parsing]
    +-- requires --> [Rule Engine]
    +-- requires --> [Category Management]

[Inline Rule Creation]
    +-- requires --> [Transaction Review Screen]
    +-- requires --> [Rule Engine]

[Re-parse Transactions]
    +-- requires --> [Rule Engine]
    +-- requires --> [Transaction Review Screen]

[100% Categorization Gate]
    +-- requires --> [Rule Engine]
    +-- requires --> [Transaction Review Screen]

[Import (commit to database)]
    +-- requires --> [100% Categorization Gate]
    +-- requires --> [Duplicate Detection]

[Dashboard / Analytics]
    +-- requires --> [Imported Transactions in DB]
    +-- requires --> [Category Breakdown Query]
    +-- requires --> [Date Range Selection]

[Admin User Management]
    +-- requires --> [User Auth (Supabase)]
    +-- requires --> [Role System]

[Viewer Access]
    +-- requires --> [User Auth]
    +-- requires --> [Dashboard]
```

### Dependency Notes

- **Transaction Review requires both Parser and Rule Engine:** The two-section layout (categorized/uncategorized) depends on rules being evaluated against parsed transactions. These must be built in sequence: parser first, then rules, then the review screen combines them.
- **Dashboard requires imported data:** Analytics only work on committed transactions. The import workflow (upload -> review -> categorize -> import) must be complete before dashboards have anything to show.
- **Duplicate detection is import-time:** Must be in place before the first real import or users will create duplicates when uploading overlapping statement periods.
- **Auth is foundational:** Supabase Auth and RLS must be configured before any data-writing features. This is infrastructure, not a feature per se.

## MVP Definition

### Launch With (v1)

The minimum set to deliver the core value: "upload a statement, see where the money goes."

- [x] Email/password auth with admin/viewer roles -- gate all access
- [x] PDF upload for Citibank SG credit card statements -- the data entry point
- [x] Config-driven parser with Citibank SG format definition -- extract transactions from PDF
- [x] Transaction review screen (categorized/uncategorized split) -- verify parsed data
- [x] Rule engine (substring + regex, first-match-wins, ordered) -- automate categorization
- [x] Inline rule creation from review screen -- fast rule building
- [x] Re-parse after rule changes -- iterative rule refinement
- [x] 100% categorization gate before import -- clean data guarantee
- [x] Card payment auto-categorization and exclusion -- accurate spending totals
- [x] Category management (CRUD) -- user-defined spending categories
- [x] Rule management page (create, edit, reorder, delete) -- dedicated rule admin
- [x] Duplicate detection on import -- prevent double-counting
- [x] Dashboard: total spending, category breakdown chart, monthly trend chart -- core analytics
- [x] Searchable/filterable transaction list -- find and verify transactions
- [x] Custom date range selection -- flexible analysis windows
- [x] Admin user management -- invite/remove household members

### Add After Validation (v1.x)

Features to add once the core workflow is proven and 3+ months of data exist.

- [ ] Year-over-year period comparison -- meaningful only with 12+ months of data
- [ ] Statement period tracking with gap detection -- ensure complete coverage
- [ ] Rule creation with match preview ("this rule would also match N transactions") -- improves rule quality
- [ ] Export to CSV -- let users get data out
- [ ] Merchant normalization and per-merchant analytics -- deeper spending insights
- [ ] Rule evolution metrics (categorization coverage % per import) -- track rule maturity
- [ ] Additional chart types (treemap for category hierarchy, stacked bar for trend) -- richer visualization

### Future Consideration (v2+)

Features that require significant new capability or fundamentally different data sources.

- [ ] Additional bank format configs (DBS, OCBC, UOB Singapore) -- extend parser coverage
- [ ] Bank account statement support (not just credit cards) -- enables income tracking
- [ ] Income analytics -- requires bank account statements with salary deposits
- [ ] Multi-currency with exchange rates -- if household has foreign currency accounts
- [ ] Dark mode -- low priority cosmetic enhancement

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PDF upload + parsing | HIGH | HIGH | P1 |
| Config-driven parser | HIGH | HIGH | P1 |
| Rule engine (substring + regex) | HIGH | MEDIUM | P1 |
| Transaction review screen | HIGH | MEDIUM | P1 |
| Inline rule creation | HIGH | LOW | P1 |
| Re-parse transactions | HIGH | LOW | P1 |
| 100% categorization gate | MEDIUM | LOW | P1 |
| Category management | HIGH | LOW | P1 |
| Duplicate detection | HIGH | MEDIUM | P1 |
| Auth + roles | HIGH | LOW | P1 |
| Dashboard: spending total | HIGH | LOW | P1 |
| Dashboard: category breakdown chart | HIGH | MEDIUM | P1 |
| Dashboard: monthly trend chart | HIGH | MEDIUM | P1 |
| Transaction list (search/filter) | MEDIUM | MEDIUM | P1 |
| Date range selection | MEDIUM | LOW | P1 |
| Rule management page | MEDIUM | MEDIUM | P1 |
| Admin user management | MEDIUM | LOW | P1 |
| Card payment auto-exclusion | MEDIUM | LOW | P1 |
| Import history | MEDIUM | LOW | P2 |
| Statement period tracking | MEDIUM | LOW | P2 |
| Rule match preview | MEDIUM | MEDIUM | P2 |
| Year-over-year comparison | MEDIUM | MEDIUM | P2 |
| Export to CSV | LOW | LOW | P2 |
| Merchant normalization | LOW | MEDIUM | P3 |
| Additional bank formats | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (v1 MVP)
- P2: Should have, add after core is validated (v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Firefly III | Lunch Money | Actual Budget | Fin Genie (Our Approach) |
|---------|-------------|-------------|---------------|--------------------------|
| Data import | CSV/OFX via Data Importer tool | Bank sync + CSV + API | Bank sync (GoCardless) + YNAB import | PDF upload with config-driven parser. No third-party API dependency |
| Categorization | Rule engine (triggers + actions, priority ordered) | Rules engine + manual | Rules with auto-apply | Rule engine (substring + regex, first-match-wins). Simpler than Firefly but sufficient |
| Rule creation UX | Separate rules management page | Rules page with condition builder | Rules in settings | Inline creation from review screen + dedicated rules page. Best of both worlds |
| Analytics | Weekly/monthly/yearly reports, multi-currency | Query tool, pie/bar/line charts, stats & trends | Budget-focused reports | Category breakdown, monthly trends, searchable transactions. Spending-focused, not budget-focused |
| Budgeting | Yes (categories + limits) | Yes (envelope-style) | Yes (envelope-style, core feature) | No. Analytics only. Deliberately omitted |
| Multi-user | Single user (no built-in sharing) | No multi-user | No multi-user | Admin + viewer roles for household sharing |
| Hosting | Self-hosted (Docker/PHP) | SaaS (hosted) | Self-hosted (Docker/Node) | Vercel + Supabase. Managed infrastructure, no Docker |
| Split transactions | Yes | Yes | Yes | No. Categorize by dominant purpose |
| Duplicate detection | Yes (via Data Importer) | Yes (automatic) | Yes (automatic) | Yes (hash-based on import) |

## Sources

- [ezBookkeeping Feature Comparison (vs Firefly III vs Actual Budget)](https://ezbookkeeping.mayswind.net/comparison/) - Comprehensive feature matrix, January 2026
- [Firefly III Documentation - Rules](https://docs.firefly-iii.org/how-to/firefly-iii/features/rules/) - Rule engine reference
- [Firefly III Introduction](https://docs.firefly-iii.org/explanation/firefly-iii/about/introduction/) - Feature overview
- [Lunch Money Features](https://lunchmoney.app/features) - Transaction, analytics, and rules features
- [Lunch Money Analytics](https://lunchmoney.app/features/analytics/) - Visualization and query tools
- [Bankstatemently - Citi Singapore](https://bankstatemently.com/banks/sg/citibank/credit-card-statement) - SG statement format reference
- [Syncfusion - Financial Charts for Personal Finance](https://www.syncfusion.com/blogs/post/financial-charts-visualization) - Chart type guidance
- [Strapi - PDF Parsing Libraries for Node.js](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) - PDF library comparison
- [Maybe Finance - Duplicate Detection Issue](https://github.com/maybe-finance/maybe/issues/1214) - Deduplication approaches
- [Neontri - Bank Transaction Categorization with ML](https://neontri.com/blog/ai-transaction-categorization/) - Rule-based vs ML categorization
- [Devstree - Personal Finance App Features 2026](https://www.devstree.co.uk/what-features-personal-finance-app/) - Feature expectations
- [NerdWallet - Best Budget Apps 2026](https://www.nerdwallet.com/finance/learn/best-budget-apps) - Market landscape

---
*Feature research for: Fin Genie -- private household finance analyzer*
*Researched: 2026-04-06*
