# Milestones

## v1.0 MVP (Shipped: 2026-04-08)

**Phases completed:** 4 phases, 14 plans, 26 tasks

**Key accomplishments:**

- Next.js 15 project with Neo Brutalism amber theme, 13 shadcn UI components, Supabase 5-table schema with RLS policies, and auth middleware for session management
- Login page with Supabase signInWithPassword, PKCE auth callbacks, and sidebar app shell with role-based nav filtering and responsive mobile drawer
- Config-driven PDF parser with cross-year date inference, integer-cents amount parsing, SHA-256 transaction hashing, and bank_configs table seeded with Citibank SG format
- Import history page with timeline bar visualization, responsive table/card layout, and enabled Import sidebar navigation
- Read-only bank config viewer page at /settings/bank-configs with JSONB key-value display, plus live Supabase schema push with bank_configs table and Citibank SG seed data
- First-match-wins rule evaluation engine with substring/regex support, 11 seeded categories, system PAYMENT rule, and full CRUD server actions for rules and categories
- Inline rule creation popover with pattern pre-fill from uncategorized rows, real-time rule evaluation driving categorized/uncategorized split, 100% categorization gate with progress bar on import, and category_id storage on import
- Rules management page with table/reorder/inline-edit/delete-undo and categories page with inline CRUD, plus sidebar nav enablement for admin users
- Live Supabase database updated with categorization schema; all 35 tests pass with vitest; TypeScript compiles cleanly.
- Analytics server actions with date-range-filtered aggregation, useDateRange URL state hook via nuqs, and StatCard/DateRangeSelector UI primitives for dashboard composition
- Full dashboard page with category donut chart (click-to-filter), monthly bar chart, recent transactions preview, stat cards, and date range selector -- all with Neo Brutalism styling and accessibility

---
