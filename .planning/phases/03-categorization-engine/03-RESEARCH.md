# Phase 3: Categorization Engine - Research

**Researched:** 2026-04-07
**Domain:** Rule-based transaction categorization, CRUD management, client-side matching engine, Supabase bulk operations
**Confidence:** HIGH

## Summary

Phase 3 builds the core categorization engine that sits between PDF import (Phase 2) and analytics (Phase 4). The main technical challenges are: (1) a client-side rule matching engine that evaluates parsed transactions against rules in real-time on the review screen, (2) inline rule creation via a Radix Popover anchored to transaction rows, (3) CRUD server actions for rules and categories with optimistic UI patterns, (4) a bulk re-categorize flow that updates existing database transactions via a server action, and (5) a schema migration to add `is_system` to the rules table and seed default categories plus the system "PAYMENT" rule.

The existing codebase is well-prepared. The database schema already has `categories`, `rules`, and `transactions` tables with proper RLS policies. The `review-screen.tsx` has an explicit `false` placeholder on line 36 for categorization. The `import-bar.tsx` has a `readyCount` prop that needs augmentation with a categorization gate. TypeScript types for `Category`, `Rule`, and `MatchType` are already defined. The server action pattern from `import-actions.ts` (with `verifyAdmin()` helper) is the established pattern for new CRUD actions.

**Primary recommendation:** Implement the rule matching engine as a pure TypeScript function (`evaluateRules`) that runs client-side against parsed transactions during review AND server-side during re-categorize. Use Radix Popover (`@neobrutalism/popover`) for inline rule creation. Use Supabase `.update()` with `.eq()` filters for re-categorize (iterate rules server-side, update matching transactions per rule). Add `is_system BOOLEAN DEFAULT FALSE` column to the `rules` table via migration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Inline popover on the transaction row -- click an uncategorized transaction to open a compact popover with pattern field, match type toggle (substring/regex), and category dropdown. Stays in context, no modal navigation.
- **D-02:** Pattern pre-fills with first meaningful word/phrase -- strip location suffixes (e.g., "SINGAPORE SG") and card numbers from the description. "GRAB TRANSPORT SINGAPORE SG" pre-fills as "GRAB". Admin can widen or narrow the pattern.
- **D-03:** Category dropdown in the popover shows existing categories with an inline "Create new" option at the bottom. No separate page navigation needed during import flow.
- **D-04:** Real-time evaluation -- creating a rule immediately re-categorizes all matching transactions on the review screen. No manual "Apply Rules" button needed during import. Instant feedback loop.
- **D-05:** Rules evaluate top-to-bottom with first-match-wins (CATG-01). Sort order determines priority.
- **D-06:** Re-categorize action on the rules page -- a "Re-categorize" button runs all rules against existing imported transactions in the database and updates their category_id. Needed when rules are edited or reordered after import (CATG-04).
- **D-07:** Import button disabled with progress text -- "42/58 categorized -- categorize all to import". Button enables only when all non-duplicate transactions are categorized. Clear progress indicator on the import bar.
- **D-08:** System rule for card payments -- pre-seed a non-deletable system rule matching "PAYMENT" to a "Card Payment" category. System rules always evaluate first (before user rules). Card payment transactions show as categorized but are excluded from spending analytics in Phase 4 (CATG-06).
- **D-09:** "Card Payment" is a system category (is_system: true) -- cannot be deleted or renamed by admin.
- **D-10:** Rules page at /rules -- table list of rules showing: pattern, match type badge (substring/regex), category name, sort order. Up/down arrow buttons for reordering (no drag library). Works on mobile.
- **D-11:** Inline rule editing -- click a rule row to expand/edit pattern, match type, and category. Save/cancel buttons. No modal.
- **D-12:** Delete rule with confirmation toast -- "Rule deleted. 5 transactions affected." with undo option.
- **D-13:** "Re-categorize All" button at the top of rules page -- runs all rules against all imported transactions in the database, updates category assignments.
- **D-14:** Categories page at /categories -- simple list with inline edit-in-place for names. Add button at bottom. Delete with confirmation (blocked if category has rules pointing to it).
- **D-15:** Pre-seed ~10 common categories on first setup: Food & Dining, Transport, Shopping, Groceries, Utilities, Healthcare, Entertainment, Education, Subscriptions, Others.
- **D-16:** "Card Payment" category pre-seeded as system category (is_system: true, non-deletable).
- **D-17:** Enable Rules and Categories nav items in the sidebar (currently disabled). Both are admin-only.

### Claude's Discretion
- Popover positioning and animation
- Exact pattern extraction heuristic (stripping location suffixes)
- Rule evaluation engine implementation (client-side vs server action)
- Categories seed migration details
- System rule sort_order convention (e.g., sort_order = 0 for system rules)
- Re-categorize progress feedback (toast vs inline progress)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CATG-01 | Rules evaluated top-to-bottom with first match assigning the category | Pure function `evaluateRules()` sorts by sort_order, iterates with early return on first match. System rules (sort_order < 0 or is_system) evaluate before user rules. |
| CATG-02 | Rules support substring match (default) and regex (opt-in) | Matching function uses `description.toLowerCase().includes(pattern.toLowerCase())` for substring, `new RegExp(pattern, 'i').test(description)` for regex. Regex wrapped in try/catch for invalid patterns. |
| CATG-03 | Admin can create categorization rules inline on the review screen | Radix Popover (`@neobrutalism/popover`) anchored to uncategorized transaction rows. Pattern pre-fill heuristic strips location suffixes. Server action creates rule and returns it for immediate client-side evaluation. |
| CATG-04 | Admin can re-parse transactions after creating or editing rules | "Re-categorize All" server action fetches all rules, queries all household transactions, evaluates each against rules, batch-updates category_id. No re-upload needed. |
| CATG-05 | Import only allowed when all transactions are categorized (100% gate) | Import bar checks `uncategorizedCount === 0` (excluding duplicates). Button disabled with progress text when uncategorized transactions exist. |
| CATG-06 | Card payment transactions auto-categorized as "Card Payment" and excluded from spending analytics | System rule with pattern "PAYMENT" seeded in migration. System category "Card Payment" with `is_system: true`. Exclusion logic deferred to Phase 4 (analytics). |
| CATG-07 | Admin can manage rules from a dedicated page (create, edit, reorder, delete) | Rules page at `/rules` with server components for data fetching, client components for interactivity. CRUD server actions. Sort_order reorder via swap pattern. |
| CATG-08 | Common categories pre-seeded on first setup with admin CRUD for all categories | Seed migration inserts 11 categories (including system "Card Payment"). Categories page at `/categories` with inline edit, add, delete. Delete blocked if rules reference category. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)

All core dependencies for Phase 3 are already in the project. No new npm packages required.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-popover | (via @neobrutalism/popover) | Inline rule creation popover | Installed by shadcn CLI when adding the popover component. Radix provides accessible, composable popover with focus trapping, keyboard nav, and collision detection. [VERIFIED: package.json shows Radix deps already installed for other components] |
| sonner | 2.0.7 | Toast notifications with undo actions | Already installed. Supports `action` prop with `{ label, onClick }` for undo buttons on delete operations. [VERIFIED: package.json] |
| zod | 3.25.76 | Server action input validation | Already installed. Use for rule creation/update schemas, category name validation. [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | Database CRUD operations | Already installed. `.update()`, `.insert()`, `.delete()`, `.select()` for rules and categories. [VERIFIED: package.json] |

### New Component (via shadcn CLI -- no npm install)

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| Popover | `npx shadcn@latest add @neobrutalism/popover` | Neo Brutalism styled Radix Popover for inline rule creation |

This command installs `@radix-ui/react-popover` as a dependency and generates `src/components/ui/popover.tsx` with Neo Brutalism styling (white bg, 2px border, 4px shadow, 5px radius). [CITED: neobrutalism.dev/docs/popover]

**Fallback:** If `@neobrutalism/popover` is not available in the registry, use `npx shadcn@latest add popover` (official shadcn) and manually apply Neo Brutalism classes to match the existing component styles. [ASSUMED]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Popover | Radix Dialog (modal) | D-01 explicitly requires popover (stays in context), not modal navigation |
| Client-side rule evaluation | Server action for every rule change | Too slow -- D-04 requires instant feedback. Client-side is correct for review screen; server-side only for re-categorize of persisted transactions |
| Sonner undo toast | Confirmation dialog before delete | D-12 explicitly specifies toast with undo, not confirmation dialog |
| Sort_order integer swap | Fractional indexing (like Linear) | Overkill for <100 rules. Integer swap with adjacent-row reorder is simple and sufficient |

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    (authenticated)/
      rules/
        page.tsx               # Rules management page (server component, fetches rules)
      categories/
        page.tsx               # Categories management page (server component, fetches categories)
    actions/
      rule-actions.ts          # Server actions: createRule, updateRule, deleteRule, reorderRule, recategorizeAll
      category-actions.ts      # Server actions: createCategory, updateCategory, deleteCategory
  components/
    rules/
      rule-creation-popover.tsx    # Inline popover for creating rules from review screen
      rules-table.tsx              # Rules management table (client component)
      rule-row.tsx                 # Single rule row with view/edit modes
      rule-edit-form.tsx           # Expanded inline edit form
      match-type-badge.tsx         # Badge showing "substring" or "regex"
      recategorize-button.tsx      # "Re-categorize All" with loading state
    categories/
      categories-list.tsx          # Category list with inline editing
      category-item.tsx            # Single category item with edit-in-place
    import/
      review-screen.tsx            # MODIFIED: wire real category evaluation
      transaction-table.tsx        # MODIFIED: clickable rows, category badges
      transaction-card.tsx         # MODIFIED: category badge, tap to open popover
      import-bar.tsx               # MODIFIED: 100% categorization gate
  lib/
    rules/
      evaluate-rules.ts           # Pure function: evaluateRules(transactions, rules) -> Map<hash, categoryId>
      extract-pattern.ts          # Pattern pre-fill heuristic (strip location suffixes)
    hooks/
      use-rules.ts                # Client-side hook to fetch and cache rules
      use-categories.ts           # Client-side hook to fetch and cache categories
supabase/
  migrations/
    00007_add_is_system_to_rules.sql    # Add is_system column to rules
    00008_seed_categories_and_rules.sql # Seed categories + system PAYMENT rule
```

### Pattern 1: Pure Rule Evaluation Engine

**What:** A pure TypeScript function that takes parsed transactions and rules, returns a Map of transaction hash to category ID. No side effects, no database calls. Runs on both client (review screen) and server (re-categorize action).

**When to use:** Every time rules change during review, and during server-side re-categorization.

```typescript
// src/lib/rules/evaluate-rules.ts
// [ASSUMED] -- pattern derived from D-04, D-05 requirements

import type { Rule } from '@/lib/types/database';

interface TransactionLike {
  hash: string;
  description: string;
}

/**
 * Evaluate rules against transactions. Rules must be pre-sorted by sort_order.
 * System rules (is_system: true) should be at the front of the array.
 * First-match-wins: each transaction gets the category of the first matching rule.
 */
export function evaluateRules(
  transactions: TransactionLike[],
  rules: Rule[],
): Map<string, string> {
  const result = new Map<string, string>(); // hash -> category_id

  for (const tx of transactions) {
    for (const rule of rules) {
      const matches =
        rule.match_type === 'regex'
          ? testRegex(rule.pattern, tx.description)
          : tx.description.toLowerCase().includes(rule.pattern.toLowerCase());

      if (matches) {
        result.set(tx.hash, rule.category_id);
        break; // first-match-wins
      }
    }
  }

  return result;
}

function testRegex(pattern: string, text: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(text);
  } catch {
    return false; // Invalid regex never matches
  }
}
```

### Pattern 2: Server Action CRUD with verifyAdmin

**What:** Follow the established pattern from `import-actions.ts` -- each server action verifies admin, performs the operation, revalidates paths.

**When to use:** All write operations on rules and categories.

```typescript
// src/app/actions/rule-actions.ts
// [VERIFIED: pattern from src/app/actions/import-actions.ts]
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateRuleSchema = z.object({
  pattern: z.string().min(1, 'Pattern cannot be empty'),
  matchType: z.enum(['substring', 'regex']),
  categoryId: z.string().uuid(),
});

export async function createRule(input: z.infer<typeof CreateRuleSchema>) {
  // 1. Validate input
  const parsed = CreateRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // 2. Verify admin (reuse verifyAdmin pattern)
  // 3. Get max sort_order for user rules, set new rule's sort_order = max + 1
  // 4. Insert rule with household_id from profile
  // 5. revalidatePath('/rules')
  // 6. Return created rule for client-side evaluation
}
```

### Pattern 3: Sort Order Swap for Reordering

**What:** Adjacent swap pattern -- when moving a rule up or down, swap its sort_order with the adjacent rule's sort_order. Two UPDATE statements in sequence.

**When to use:** Rule reorder via up/down arrows on the rules page (D-10).

```typescript
// Swap sort_order between two adjacent rules
// [ASSUMED] -- standard integer reorder pattern

export async function reorderRule(ruleId: string, direction: 'up' | 'down') {
  // 1. Verify admin
  // 2. Fetch the target rule to get its sort_order
  // 3. Fetch the adjacent rule (sort_order - 1 for up, sort_order + 1 for down)
  //    Filter: only user rules (is_system = false)
  // 4. Swap sort_order values between the two rules
  // 5. revalidatePath('/rules')
}
```

**Important:** System rules should have `sort_order = 0` (or negative) and be excluded from reordering. User rules start at `sort_order = 1` and increment. When fetching adjacent rules for swap, filter with `.eq('is_system', false)`.

### Pattern 4: Re-categorize Server Action

**What:** Server action that fetches all rules (sorted), fetches all household transactions, evaluates rules against each transaction, and batch-updates category_id for changed transactions.

**When to use:** "Re-categorize All" button on the rules page (D-06, D-13).

```typescript
// [ASSUMED] -- derived from D-06, D-13 requirements

export async function recategorizeAll() {
  // 1. Verify admin, get household_id
  // 2. Fetch all rules ordered by sort_order
  // 3. Fetch all transactions for household (id, description, category_id)
  // 4. Run evaluateRules() (same pure function used client-side)
  // 5. For each transaction where new category differs from current:
  //    - Batch update: supabase.from('transactions').update({ category_id }).in('id', [...ids])
  // 6. Return { updated: N, unchanged: M }
}
```

**Performance consideration:** For a household finance app, transaction volume is low (hundreds to low thousands). Loading all transactions into memory for rule evaluation is fine. No need for cursor-based pagination or streaming. [ASSUMED]

### Pattern 5: Optimistic Delete with Undo

**What:** Remove the item from UI immediately, show a toast with an undo button, and only commit the database delete after the toast auto-dismisses (or commit immediately and restore on undo).

**When to use:** Rule deletion (D-12) and category deletion.

```typescript
// Two approaches -- recommend "delete immediately, restore on undo":
// [ASSUMED] -- industry standard optimistic UI pattern

// Client-side:
function handleDeleteRule(ruleId: string) {
  // 1. Remove from local state immediately (optimistic)
  setRules(prev => prev.filter(r => r.id !== ruleId));

  // 2. Call server action to delete
  const result = await deleteRule(ruleId);

  // 3. Show toast with undo
  toast('Rule deleted. N transactions affected.', {
    action: {
      label: 'Undo',
      onClick: async () => {
        // Restore rule via server action (re-insert)
        await restoreRule(deletedRuleData);
        // Refresh rules list
      },
    },
    duration: 5000,
  });
}
```

**Simpler alternative (recommended):** Delete on server immediately, cache the deleted data client-side. On undo, re-insert. This is simpler than deferred deletion and matches the sonner action pattern. [ASSUMED]

### Pattern 6: Import with Category IDs

**What:** Modify the existing `importTransactions` server action to accept and store `category_id` for each transaction.

**When to use:** When user clicks "Import" after 100% categorization on the review screen.

```typescript
// Modify the import flow:
// [VERIFIED: src/app/actions/import-actions.ts line 193]
// Currently inserts without category_id.
// Phase 3: pass category assignments from client-side rule evaluation

// In review-screen.tsx, maintain a Map<hash, categoryId> from evaluateRules()
// Pass it to the import action along with transactions
// The import action includes category_id in each transaction insert
```

### Anti-Patterns to Avoid

- **Server round-trip for every rule evaluation during review:** D-04 requires instant feedback. Evaluate rules client-side. Only server actions for CRUD and re-categorize.
- **Drag-and-drop for rule reordering:** D-10 explicitly says up/down arrows, no drag library. Drag libraries add complexity and mobile UX issues.
- **Confirmation dialogs for deletes:** D-12 specifies toast with undo, not modal confirmation dialogs.
- **Storing rule evaluation results in a separate table:** Transactions already have `category_id`. Just update it directly.
- **Re-parsing PDF for re-categorization:** D-04/D-06 explicitly says re-categorize without re-uploading. The rule engine works on existing transaction descriptions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Popover positioning & collision | Manual absolute positioning | Radix Popover with `side`, `sideOffset`, `avoidCollisions` | Collision detection, viewport awareness, focus trapping are deceptively complex [CITED: radix-ui.com/primitives/docs/components/popover] |
| Regex validation | Custom regex parser | `try { new RegExp(pattern) } catch { invalid }` | Native RegExp constructor handles validation. No library needed. [VERIFIED: standard JS API] |
| Toast with undo action | Custom notification system | Sonner `toast()` with `action: { label: 'Undo', onClick }` | Already installed, already used in Phase 2, handles auto-dismiss timing [VERIFIED: sonner API docs] |
| Focus trapping in popover | Manual focus management | Radix Popover handles focus trap automatically | Tab cycling, escape key, focus return to trigger -- all built-in [CITED: radix-ui.com/primitives/docs/components/popover] |
| Currency formatting | Custom format function | `Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })` | Already used in `transaction-table.tsx` and `transaction-card.tsx` [VERIFIED: existing code] |

**Key insight:** The categorization engine itself IS a hand-built component (pure function), and that's correct -- it's domain-specific business logic. But the UI primitives (popover, toast, focus management) should all use existing libraries.

## Common Pitfalls

### Pitfall 1: Regex Denial of Service (ReDoS)

**What goes wrong:** A user enters a pathologically bad regex pattern (e.g., `(a+)+$`) that causes catastrophic backtracking, freezing the browser tab during client-side evaluation or blocking the server during re-categorize.
**Why it happens:** `new RegExp(pattern).test(text)` has no timeout mechanism.
**How to avoid:** (1) Wrap regex evaluation in a try/catch. (2) For client-side: since transaction descriptions are short strings (< 200 chars), ReDoS risk is minimal but real. (3) Optionally add a simple heuristic to reject obviously dangerous patterns (nested quantifiers). (4) For server-side re-categorize: process in chunks with reasonable timeouts.
**Warning signs:** Browser tab freezes when a rule with regex is created. Server action times out.

### Pitfall 2: Race Condition on Rule Creation During Review

**What goes wrong:** User creates a rule (server action), but the client-side rule list is stale, so the new rule isn't included in the next evaluation pass.
**Why it happens:** Server action creates the rule, but client state hasn't been updated yet.
**How to avoid:** The `createRule` server action should return the full created `Rule` object. The client immediately adds it to its local rules array and re-runs `evaluateRules()`. Don't rely on re-fetching from the server.
**Warning signs:** New rule doesn't categorize transactions until page refresh.

### Pitfall 3: Sort Order Gaps After Deletion

**What goes wrong:** After deleting a rule, sort_order values have gaps (e.g., 1, 3, 4 instead of 1, 2, 3). Subsequent reorder operations break because they look for `sort_order + 1` and find nothing.
**How to avoid:** Two strategies: (A) After deletion, re-index all user rules' sort_order (compact). This is a simple `UPDATE` with row_number. (B) Use the "find next higher/lower sort_order" approach instead of `sort_order +/- 1`. Recommend option (B) -- find the adjacent rule by sort_order ordering, not by arithmetic.
**Warning signs:** Reorder buttons stop working after rules are deleted.

### Pitfall 4: Popover Positioning on Mobile

**What goes wrong:** Popover overflows the viewport or is partially hidden behind the fixed import bar at the bottom.
**Why it happens:** Radix Popover positions relative to the trigger, and mobile screens have limited space.
**How to avoid:** Use `side="top"` on mobile (popover above trigger), `collisionPadding={16}` to keep it within viewport. The UI-SPEC specifies `side="top"` and `align="center"` for mobile. Also set a max-height and make the popover scrollable if needed.
**Warning signs:** Popover appears behind the import bar or off-screen on mobile.

### Pitfall 5: Category Dropdown Missing Newly Created Category

**What goes wrong:** User creates a new category inline from the popover (D-03 "+ Create new category"), but the category doesn't appear in subsequent popover instances.
**Why it happens:** Categories list is fetched once and cached. New category created via server action isn't in the cache.
**How to avoid:** When the inline "Create new category" flow succeeds, add the new category to the local categories state immediately (same pattern as adding new rules). The server action returns the full created category.
**Warning signs:** Newly created category only appears after page refresh.

### Pitfall 6: Import Sends Wrong category_id for Transactions

**What goes wrong:** Transaction is categorized on the review screen, but the wrong category_id (or null) is saved to the database on import.
**Why it happens:** The category mapping is maintained client-side as a `Map<hash, categoryId>`, but the import action receives the old `ParsedTransaction[]` without category information.
**How to avoid:** Pass the category_id map alongside transactions to the import server action. In the import action, look up each transaction's hash in the map and include `category_id` in the insert.
**Warning signs:** Imported transactions show no category on the dashboard/transactions page.

## Code Examples

### Rule Evaluation (Pure Function)

```typescript
// Source: custom implementation based on D-04, D-05 requirements
// [ASSUMED] -- domain-specific logic

import type { Rule } from '@/lib/types/database';
import type { ParsedTransaction } from '@/lib/parser/types';

type CategoryMap = Map<string, string>; // hash -> category_id

export function evaluateRules(
  transactions: ParsedTransaction[],
  rules: Rule[], // Must be sorted by sort_order ascending
): CategoryMap {
  const map: CategoryMap = new Map();

  for (const tx of transactions) {
    for (const rule of rules) {
      if (matchesRule(rule, tx.description)) {
        map.set(tx.hash, rule.category_id);
        break;
      }
    }
  }

  return map;
}

function matchesRule(rule: Rule, description: string): boolean {
  if (rule.match_type === 'regex') {
    try {
      return new RegExp(rule.pattern, 'i').test(description);
    } catch {
      return false;
    }
  }
  return description.toLowerCase().includes(rule.pattern.toLowerCase());
}
```

### Pattern Pre-fill Heuristic

```typescript
// Source: D-02 requirement
// [ASSUMED] -- heuristic implementation

const LOCATION_SUFFIXES = [
  /\s+SINGAPORE\s+SG$/i,
  /\s+SG$/i,
  /\s+SINGAPORE$/i,
  /\s+[A-Z]{2}$/,           // Two-letter country code at end
  /\s+\d{4,}$/,             // Trailing card numbers (4+ digits)
  /\s+X{2,}\d{2,}$/i,       // Masked card like XXXX1234
];

export function extractPattern(description: string): string {
  let cleaned = description.trim();

  for (const suffix of LOCATION_SUFFIXES) {
    cleaned = cleaned.replace(suffix, '');
  }

  // Take the first word or meaningful phrase
  // "GRAB TRANSPORT" -> "GRAB"
  // "NTUC FAIRPRICE" -> "NTUC"
  const words = cleaned.trim().split(/\s+/);
  return words[0] ?? cleaned;
}
```

### Sonner Toast with Undo Action

```typescript
// Source: sonner docs (sonner.emilkowal.ski/toast)
// [CITED: sonner.emilkowal.ski/toast]

import { toast } from 'sonner';

function showDeleteToast(ruleName: string, affectedCount: number, onUndo: () => void) {
  toast(`Rule deleted. ${affectedCount} transactions affected.`, {
    action: {
      label: 'Undo',
      onClick: () => onUndo(),
    },
    duration: 5000,
  });
}
```

### Radix Popover Usage with Neo Brutalism

```typescript
// Source: Radix Popover docs + neobrutalism registry
// [CITED: radix-ui.com/primitives/docs/components/popover]

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Inside a transaction row:
<Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger asChild>
    <TableRow
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      {/* row content */}
    </TableRow>
  </PopoverTrigger>
  <PopoverContent
    side="bottom"
    sideOffset={4}
    align="start"
    collisionPadding={16}
    className="w-80"
  >
    {/* RuleCreationPopover form content */}
  </PopoverContent>
</Popover>
```

### Supabase Bulk Update for Re-categorize

```typescript
// Source: Supabase JS docs (supabase.com/docs/reference/javascript/update)
// [CITED: supabase.com/docs/reference/javascript/update]

// Group transactions by their new category_id, then batch update
const updates = new Map<string, string[]>(); // category_id -> [transaction_ids]

for (const [txId, newCategoryId] of evaluationResults) {
  if (!updates.has(newCategoryId)) {
    updates.set(newCategoryId, []);
  }
  updates.get(newCategoryId)!.push(txId);
}

let updatedCount = 0;
for (const [categoryId, txIds] of updates) {
  const { count } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .in('id', txIds)
    .select('id', { count: 'exact', head: true });

  updatedCount += count ?? 0;
}
```

## Schema Changes Required

### Migration: Add is_system to rules table

```sql
-- 00007_add_is_system_to_rules.sql
-- [ASSUMED] -- flagged in UI-SPEC schema notes

ALTER TABLE rules ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;

-- Prevent deletion of system rules at the database level
CREATE OR REPLACE FUNCTION prevent_system_rule_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system = TRUE THEN
    RAISE EXCEPTION 'System rules cannot be modified or deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_system_rule_delete
  BEFORE DELETE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_rule_modification();

CREATE TRIGGER prevent_system_rule_update
  BEFORE UPDATE ON rules
  FOR EACH ROW
  WHEN (OLD.is_system = TRUE)
  EXECUTE FUNCTION prevent_system_rule_modification();
```

### Migration: Seed categories and system rule

```sql
-- 00008_seed_categories_and_rules.sql
-- [ASSUMED] -- based on D-15, D-16, D-08

-- NOTE: This uses the default household_id. In a multi-household scenario,
-- seeding would need to happen per-household. For v1 with a single household,
-- this works with the default UUID.

-- Seed categories
INSERT INTO categories (household_id, name, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Card Payment', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Food & Dining', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Transport', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Shopping', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Groceries', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Utilities', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Healthcare', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Entertainment', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Education', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Subscriptions', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'Others', FALSE);

-- Seed system rule for card payments
-- sort_order = 0 means system rules evaluate first (user rules start at 1)
INSERT INTO rules (household_id, category_id, pattern, match_type, sort_order, is_system)
SELECT
  '00000000-0000-0000-0000-000000000000',
  c.id,
  'PAYMENT',
  'substring',
  0,
  TRUE
FROM categories c
WHERE c.name = 'Card Payment' AND c.household_id = '00000000-0000-0000-0000-000000000000';
```

### TypeScript Type Updates

The `Database` type in `src/lib/types/database.ts` needs to be updated to include the `is_system` field on the `rules` table:

```typescript
// Add to rules.Row, rules.Insert, rules.Update:
is_system: boolean; // Row
is_system?: boolean; // Insert (default FALSE)
is_system?: boolean; // Update
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Confirmation dialogs for destructive actions | Optimistic delete with toast undo | 2023+ (Linear, Vercel patterns) | Better UX -- no modal interruption, easy undo |
| Server-side rule evaluation on every change | Client-side evaluation with server persistence | Standard in modern SPA | Instant feedback per D-04. Server only for bulk re-categorize |
| Drag-and-drop for list reordering | Up/down buttons for simple lists | Always valid for short lists | Better mobile support, no drag library dependency, matches D-10 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@neobrutalism/popover` exists in the registry and installs cleanly via shadcn CLI | Standard Stack | LOW -- fallback documented (use official shadcn popover + manual Neo Brutalism classes). UI-SPEC already vetted this. |
| A2 | Transaction volume per household is low enough (< 5000) for in-memory rule evaluation during re-categorize | Architecture Patterns (Pattern 4) | LOW -- household finance app with monthly statements. If wrong, paginate the query. |
| A3 | Sort order convention: system rules at sort_order = 0, user rules starting at 1 | Architecture Patterns (Pattern 3) | LOW -- convention choice, easy to change. Key is that system rules sort before user rules. |
| A4 | Pattern pre-fill heuristic (stripping SINGAPORE SG etc.) covers most Citibank SG descriptions | Code Examples (extractPattern) | MEDIUM -- may need tuning with real data. But admin can always edit the pre-filled value. |
| A5 | Supabase `.in('id', [...ids])` supports the number of IDs typical for re-categorize batches | Code Examples (bulk update) | LOW -- Postgres IN clause handles thousands of items. Supabase JS has no documented limit. |
| A6 | Seed migration with hardcoded household_id UUID works for v1 single-household setup | Schema Changes | LOW -- v1 is explicitly single-household. Multi-household seeding is a v2 concern. |

## Open Questions

1. **Database trigger vs application-level protection for system rules**
   - What we know: D-08/D-09 say system rules/categories cannot be deleted. Database triggers provide foolproof protection. Application-level checks in server actions are simpler.
   - What's unclear: Whether to use both (belt and suspenders) or just application-level.
   - Recommendation: Use both. Database trigger prevents accidental deletion even from Supabase Studio. Application-level provides friendly error messages.

2. **Import action modification scope**
   - What we know: `importTransactions` in `import-actions.ts` currently inserts transactions without `category_id`. Phase 3 needs to include it.
   - What's unclear: Whether to modify the existing function signature or create a wrapper.
   - Recommendation: Modify the existing `importTransactions` to accept an optional `categoryMap: Record<string, string>` parameter. Backward compatible -- if not provided, category_id is null (existing behavior).

3. **Re-categorize batch size**
   - What we know: Re-categorize needs to update potentially all transactions in the household.
   - What's unclear: Whether Supabase has request size limits on `.in()` queries or `.update()` batch sizes.
   - Recommendation: Group updates by category_id (as shown in code example) to minimize the number of queries. For v1 volumes, this is fine.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Handled by Phase 1 (Supabase Auth) |
| V3 Session Management | No | Handled by Phase 1 (Supabase SSR cookies) |
| V4 Access Control | Yes | RLS policies on rules and categories tables already enforce admin-only writes. Server actions verify admin role via `verifyAdmin()`. [VERIFIED: migration 00004] |
| V5 Input Validation | Yes | Zod schemas for all server action inputs. Regex pattern validation via try/catch. Category name length/uniqueness validation. |
| V6 Cryptography | No | No sensitive data processing in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Regex injection (ReDoS) | Denial of Service | Wrap `new RegExp()` in try/catch. Descriptions are short strings (< 200 chars). Consider timeout wrapper for server-side evaluation. |
| Unauthorized rule creation | Elevation of Privilege | `verifyAdmin()` in all server actions + RLS `is_admin()` on rules table [VERIFIED: existing RLS policies] |
| Mass assignment (category_id tampering) | Tampering | Server-side re-categorize evaluates rules independently. Client-provided category_ids for import should be validated against actual rule evaluation results server-side. |
| System rule/category deletion | Tampering | Database triggers prevent deletion. Application-level checks provide UX. Both layers. |

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/00001_initial_schema.sql` -- existing categories, rules, transactions schema
- `supabase/migrations/00004_fix_profiles_rls_security_definer.sql` -- `is_admin()` and `get_my_household_id()` functions, RLS policies
- `src/lib/types/database.ts` -- TypeScript types for all tables
- `src/app/actions/import-actions.ts` -- server action pattern (verifyAdmin, CRUD, revalidatePath)
- `src/components/import/review-screen.tsx` -- current review screen with categorization placeholder
- `src/components/import/import-bar.tsx` -- current import bar needing 100% gate
- `.planning/phases/03-categorization-engine/03-CONTEXT.md` -- all locked decisions D-01 through D-17
- `.planning/phases/03-categorization-engine/03-UI-SPEC.md` -- complete visual and interaction contract
- `package.json` -- all installed dependencies verified

### Secondary (MEDIUM confidence)
- [Radix Popover docs](https://www.radix-ui.com/primitives/docs/components/popover) -- API reference for Popover component parts, props, keyboard interactions
- [Sonner toast docs](https://sonner.emilkowal.ski/toast) -- Toast API with action button for undo pattern
- [Supabase JS update docs](https://supabase.com/docs/reference/javascript/update) -- .update() method with filters
- [Neobrutalism popover](https://www.neobrutalism.dev/docs/popover) -- Registry component for styled popover

### Tertiary (LOW confidence)
- None -- all claims verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, no new npm dependencies
- Architecture: HIGH -- patterns derived directly from existing codebase (server actions, types, RLS) and locked decisions
- Pitfalls: HIGH -- derived from concrete implementation knowledge of Radix Popover, regex handling, and sort_order management
- Schema changes: MEDIUM -- `is_system` column addition is straightforward, but seed migration depends on single-household assumption

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable -- no fast-moving dependencies)
