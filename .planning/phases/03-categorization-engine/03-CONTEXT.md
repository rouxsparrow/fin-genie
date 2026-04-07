# Phase 3: Categorization Engine - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Rule engine with substring/regex matching, inline rule creation from review screen, re-categorize flow, 100% categorization gate, and rules/category management. Admin can categorize all transactions through rules and import only when 100% categorized.

</domain>

<decisions>
## Implementation Decisions

### Inline rule creation flow
- **D-01:** Inline popover on the transaction row — click an uncategorized transaction to open a compact popover with pattern field, match type toggle (substring/regex), and category dropdown. Stays in context, no modal navigation.
- **D-02:** Pattern pre-fills with first meaningful word/phrase — strip location suffixes (e.g., "SINGAPORE SG") and card numbers from the description. "GRAB TRANSPORT SINGAPORE SG" pre-fills as "GRAB". Admin can widen or narrow the pattern.
- **D-03:** Category dropdown in the popover shows existing categories with an inline "Create new" option at the bottom. No separate page navigation needed during import flow.

### Rule evaluation timing
- **D-04:** Real-time evaluation — creating a rule immediately re-categorizes all matching transactions on the review screen. No manual "Apply Rules" button needed during import. Instant feedback loop.
- **D-05:** Rules evaluate top-to-bottom with first-match-wins (CATG-01). Sort order determines priority.
- **D-06:** Re-categorize action on the rules page — a "Re-categorize" button runs all rules against existing imported transactions in the database and updates their category_id. Needed when rules are edited or reordered after import (CATG-04).

### 100% categorization gate
- **D-07:** Import button disabled with progress text — "42/58 categorized — categorize all to import". Button enables only when all non-duplicate transactions are categorized. Clear progress indicator on the import bar.
- **D-08:** System rule for card payments — pre-seed a non-deletable system rule matching "PAYMENT" to a "Card Payment" category. System rules always evaluate first (before user rules). Card payment transactions show as categorized but are excluded from spending analytics in Phase 4 (CATG-06).
- **D-09:** "Card Payment" is a system category (is_system: true) — cannot be deleted or renamed by admin.

### Rules management page
- **D-10:** Rules page at /rules — table list of rules showing: pattern, match type badge (substring/regex), category name, sort order. Up/down arrow buttons for reordering (no drag library). Works on mobile.
- **D-11:** Inline rule editing — click a rule row to expand/edit pattern, match type, and category. Save/cancel buttons. No modal.
- **D-12:** Delete rule with confirmation toast — "Rule deleted. 5 transactions affected." with undo option.
- **D-13:** "Re-categorize All" button at the top of rules page — runs all rules against all imported transactions in the database, updates category assignments.

### Categories management
- **D-14:** Categories page at /categories — simple list with inline edit-in-place for names. Add button at bottom. Delete with confirmation (blocked if category has rules pointing to it).
- **D-15:** Pre-seed ~10 common categories on first setup: Food & Dining, Transport, Shopping, Groceries, Utilities, Healthcare, Entertainment, Education, Subscriptions, Others.
- **D-16:** "Card Payment" category pre-seeded as system category (is_system: true, non-deletable).

### Sidebar navigation
- **D-17:** Enable Rules and Categories nav items in the sidebar (currently disabled). Both are admin-only.

### Claude's Discretion
- Popover positioning and animation
- Exact pattern extraction heuristic (stripping location suffixes)
- Rule evaluation engine implementation (client-side vs server action)
- Categories seed migration details
- System rule sort_order convention (e.g., sort_order = 0 for system rules)
- Re-categorize progress feedback (toast vs inline progress)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value, constraints, money handling (cents storage)
- `.planning/REQUIREMENTS.md` — CATG-01 through CATG-08 requirements for this phase
- `.planning/ROADMAP.md` §Phase 3 — Success criteria, depends on Phase 2

### Phase 2 foundation
- `.planning/phases/02-pdf-import-pipeline/02-CONTEXT.md` — Review screen decisions (D-07 split sections, D-10 import bar, D-11 duplicate handling, D-12 mobile cards)
- `src/components/import/review-screen.tsx` — Current review screen (categorized section placeholder at line 36)
- `src/components/import/transaction-table.tsx` — Transaction table with placeholder category column
- `src/components/import/import-bar.tsx` — Import button (needs 100% gate logic)
- `src/app/actions/import-actions.ts` — Server actions pattern (parseStatement, importTransactions)
- `src/app/(authenticated)/import/page.tsx` — Import page state machine

### Database schema
- `supabase/migrations/00001_initial_schema.sql` — categories, rules, transactions tables already defined
- `src/lib/types/database.ts` — Category, Rule, MatchType types already defined (lines 36-83)

### UI components
- `src/components/ui/` — All Neo Brutalism components (badge, button, card, dialog, input, select, table, tooltip)
- `src/components/app-sidebar.tsx` — Sidebar with Rules/Categories nav items (lines 42-43, currently disabled)

### Phase 1 patterns
- `.planning/phases/01-foundation-auth/01-CONTEXT.md` — Neo Brutalism theme, table styling, empty states, toasts, mobile cards

### External references
- No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/tooltip.tsx` — For popover-style inline rule creation
- `src/components/ui/select.tsx` — For category dropdown in rule creation popover
- `src/components/ui/badge.tsx` — For match type badges (substring/regex) and category badges
- `src/components/ui/input.tsx` — For pattern input field
- `src/components/ui/table.tsx` — For rules management table
- `src/components/ui/dialog.tsx` — For delete confirmation (or use toast with undo)
- `src/components/empty-state.tsx` — For empty rules/categories pages

### Established Patterns
- Server actions from Phase 2 (`import-actions.ts`) — reuse for rule CRUD and re-categorize actions
- `useProfile` hook for admin role checking
- `is_admin()` and `get_my_household_id()` SECURITY DEFINER functions for RLS
- Mobile stacked cards pattern from `user-table.tsx` and `transaction-table.tsx`
- Toast notifications via sonner for success/error feedback

### Integration Points
- `review-screen.tsx` line 36: `false` placeholder for categorized filtering — replace with real rule evaluation
- `import-bar.tsx` line 23: `readyCount` check — add 100% categorization gate
- `transaction-table.tsx`: Category column already has placeholder "—" rendering — wire to actual category
- Sidebar: Rules (`disabled: true` at line 42) and Categories (`disabled: true` at line 43) — flip to enabled
- `transactions.category_id` column exists but is always NULL — will be populated by rule evaluation

</code_context>

<specifics>
## Specific Ideas

- Inline popover (not modal) for rule creation — stay in context like Linear's label creation
- Pattern pre-fill strips "SINGAPORE SG" type suffixes — smart extraction, not raw description dump
- System rules are non-deletable and evaluate before user rules — Card Payment is a system concern
- Re-categorize on rules page runs against DB transactions — not just current parse session
- Up/down arrows for rule reorder — no drag library, works on mobile, fits Neo Brutalism

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-categorization-engine*
*Context gathered: 2026-04-07*
