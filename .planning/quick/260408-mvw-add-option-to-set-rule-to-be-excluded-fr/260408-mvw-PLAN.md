---
phase: quick-260408-mvw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00009_add_exclude_from_stats.sql
  - src/lib/types/database.ts
  - src/app/actions/category-actions.ts
  - src/app/actions/analytics-actions.ts
  - src/components/categories/category-item.tsx
  - src/components/categories/categories-list.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Admin can toggle a category's exclude_from_stats flag from the /categories page"
    - "Excluded categories are fully invisible in dashboard analytics (stat cards, donut chart, bar chart, recent transactions)"
    - "Excluded category transactions remain visible on /transactions page"
    - "System categories (Card Payment) do not show the exclude toggle — they are always excluded via is_system"
    - "Toggling exclude_from_stats retroactively affects all analytics queries immediately"
  artifacts:
    - path: "supabase/migrations/00009_add_exclude_from_stats.sql"
      provides: "Database column addition"
      contains: "exclude_from_stats"
    - path: "src/lib/types/database.ts"
      provides: "Updated Category type with exclude_from_stats"
      contains: "exclude_from_stats"
    - path: "src/app/actions/analytics-actions.ts"
      provides: "Generalized exclusion logic replacing single Card Payment filter"
      contains: "getExcludedCategoryIds"
    - path: "src/app/actions/category-actions.ts"
      provides: "toggleCategoryExclude server action"
      contains: "toggleCategoryExclude"
    - path: "src/components/categories/category-item.tsx"
      provides: "Exclude toggle UI for non-system categories"
      contains: "exclude_from_stats"
  key_links:
    - from: "src/components/categories/category-item.tsx"
      to: "src/app/actions/category-actions.ts"
      via: "toggleCategoryExclude server action call"
      pattern: "toggleCategoryExclude"
    - from: "src/app/actions/analytics-actions.ts"
      to: "categories table"
      via: "getExcludedCategoryIds query"
      pattern: "exclude_from_stats.*true.*OR.*is_system.*true"
---

<objective>
Add an `exclude_from_stats` boolean toggle to categories, allowing admins to mark categories (like "Rebate" or "Refund") as excluded from all dashboard analytics. This extends the existing Card Payment (is_system) exclusion pattern to be user-configurable per category.

Purpose: Transactions like rebates and refunds inflate/deflate spending totals, giving an inaccurate picture of actual spending. Excluding them at the category level gives household members accurate analytics.

Output: DB migration, updated types, generalized analytics exclusion, toggle UI on /categories page, and toggle server action.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/types/database.ts
@src/app/actions/analytics-actions.ts
@src/app/actions/category-actions.ts
@src/components/categories/category-item.tsx
@src/components/categories/categories-list.tsx
@src/app/(authenticated)/categories/page.tsx
@supabase/migrations/00001_initial_schema.sql

<interfaces>
<!-- Key types and contracts the executor needs. -->

From src/lib/types/database.ts:
```typescript
export type Category = Database['public']['Tables']['categories']['Row'];
// Currently: { id, household_id, name, is_system, created_at, updated_at }
// Needs: exclude_from_stats: boolean added
```

From src/app/actions/analytics-actions.ts:
```typescript
// Current exclusion pattern — fetches single Card Payment ID:
async function getCardPaymentCategoryId(supabase, householdId): Promise<string | null>
// Used by: fetchDashboardStats, fetchCategoryBreakdown, fetchMonthlyTrend
// fetchRecentTransactions does NOT exclude — but per CONTEXT it should now
// All four analytics actions filter with .neq('category_id', cardPaymentId)

export type TransactionWithCategory = Transaction & {
  categories: { name: string; is_system: boolean } | null;
};
```

From src/app/actions/category-actions.ts:
```typescript
export async function createCategory(input: { name: string }): Promise<...>
export async function updateCategory(input: { id: string; name: string }): Promise<...>
export async function deleteCategory(categoryId: string): Promise<...>
export async function restoreCategory(input: { name: string; isSystem: boolean }): Promise<...>
export async function fetchCategories(): Promise<...>
```

From src/components/categories/category-item.tsx:
```typescript
interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
  isLast: boolean;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add exclude_from_stats column and update types + server actions</name>
  <files>
    supabase/migrations/00009_add_exclude_from_stats.sql
    src/lib/types/database.ts
    src/app/actions/category-actions.ts
    src/app/actions/analytics-actions.ts
  </files>
  <action>
1. **Create migration** `supabase/migrations/00009_add_exclude_from_stats.sql`:
   - `ALTER TABLE categories ADD COLUMN exclude_from_stats BOOLEAN NOT NULL DEFAULT FALSE;`
   - No data migration needed — existing categories default to false (included in stats), which is correct. System categories are already excluded via `is_system`.

2. **Update `src/lib/types/database.ts`** — Add `exclude_from_stats: boolean` to the `categories` table type:
   - In `Row`: add `exclude_from_stats: boolean`
   - In `Insert`: add `exclude_from_stats?: boolean` (optional, defaults to false)
   - In `Update`: add `exclude_from_stats?: boolean`

3. **Add `toggleCategoryExclude` action to `src/app/actions/category-actions.ts`**:
   - Accept `{ id: string, excludeFromStats: boolean }`
   - Validate with Zod: `id` is UUID, `excludeFromStats` is boolean
   - Call `verifyAdmin()`
   - Verify the category is NOT a system category (system categories are always excluded via `is_system`, not via this toggle)
   - Update `exclude_from_stats` column on the category
   - `revalidatePath('/categories')` and `revalidatePath('/dashboard')`
   - Return `{ success: true, category }` or `{ success: false, error: string }`
   - Also update `restoreCategory` to accept and pass through `excludeFromStats` (default false) so undo preserves the flag.

4. **Generalize exclusion in `src/app/actions/analytics-actions.ts`**:
   - Replace `getCardPaymentCategoryId()` with a new function:
     ```typescript
     async function getExcludedCategoryIds(
       supabase: Awaited<ReturnType<typeof createClient>>,
       householdId: string
     ): Promise<string[]> {
       const { data } = await supabase
         .from('categories')
         .select('id')
         .eq('household_id', householdId)
         .or('is_system.eq.true,exclude_from_stats.eq.true');
       return (data ?? []).map((c) => c.id);
     }
     ```
   - Update `fetchDashboardStats`, `fetchCategoryBreakdown`, `fetchMonthlyTrend`, AND `fetchRecentTransactions` to use the new function.
   - Replace all `.neq('category_id', cardPaymentId)` with Supabase's `.not('category_id', 'in', `(${excludedIds.join(',')})`)` when `excludedIds.length > 0`.
   - IMPORTANT: Use the Supabase PostgREST `not.in` filter syntax. When there's only one ID, still use the `not...in` pattern for consistency. When there are zero excluded IDs, skip the filter entirely.
   - The `TransactionWithCategory` type's `categories` join should also select `exclude_from_stats`: update the select string from `categories(name, is_system)` to `categories(name, is_system, exclude_from_stats)` in the queries that use it (fetchDashboardStats, fetchRecentTransactions, fetchTransactionList). Update the `TransactionWithCategory` type accordingly.
   - `fetchTransactionList` (the /transactions page query) does NOT exclude any categories — it shows all transactions regardless. Leave it as-is for the exclusion logic. But do update its `categories()` select to include `exclude_from_stats` for type consistency.
  </action>
  <verify>
    <automated>cd /Users/rouxsparrow/Code/fin-genie && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Migration file exists with ALTER TABLE adding exclude_from_stats column
    - database.ts Category type includes exclude_from_stats in Row/Insert/Update
    - toggleCategoryExclude server action exists and validates input
    - analytics-actions.ts uses getExcludedCategoryIds() instead of getCardPaymentCategoryId()
    - All four analytics queries (stats, breakdown, trend, recent) exclude categories where is_system=true OR exclude_from_stats=true
    - fetchTransactionList does NOT exclude — /transactions shows everything
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Add exclude toggle UI to categories page</name>
  <files>
    src/components/categories/category-item.tsx
    src/components/categories/categories-list.tsx
  </files>
  <action>
1. **Update `CategoryItemProps` in `category-item.tsx`**:
   - Add `onToggleExclude: (excludeFromStats: boolean) => void` prop
   - For NON-system, NON-editing categories: add a toggle/switch to the right of the category name (before the edit/delete buttons). Use a small text label or icon to indicate status.
   - Implementation: Add a button or checkbox-style toggle. When the category has `exclude_from_stats === true`, show a visual indicator (e.g., a small `EyeOff` icon from lucide-react with a tooltip "Excluded from dashboard stats"). When false, show an `Eye` icon with tooltip "Included in dashboard stats".
   - Clicking the icon toggles the state by calling `onToggleExclude(!category.exclude_from_stats)`.
   - For SYSTEM categories: do NOT show the toggle. System categories already show a Lock icon and are always excluded — the existing Lock + tooltip behavior is sufficient.
   - Keep the icon subtle — same opacity pattern as edit/delete buttons (visible on hover on desktop, always visible on mobile).

2. **Update `CategoriesList` in `categories-list.tsx`**:
   - Add a `handleToggleExclude(categoryId: string, excludeFromStats: boolean)` handler that:
     a. Optimistically updates local state: `setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, exclude_from_stats: excludeFromStats } : c))`
     b. Calls `toggleCategoryExclude({ id: categoryId, excludeFromStats })` (import from category-actions)
     c. On success: show toast "Category '[name]' excluded from stats" or "Category '[name]' included in stats"
     d. On failure: revert optimistic update and show error toast
   - Pass the handler to each `CategoryItem` as `onToggleExclude`
   - Also update the `handleDelete` undo/restore flow to pass `excludeFromStats` to `restoreCategory` so the flag is preserved on undo.
  </action>
  <verify>
    <automated>cd /Users/rouxsparrow/Code/fin-genie && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Non-system categories show an Eye/EyeOff toggle icon on the /categories page
    - Clicking the icon toggles exclude_from_stats via the server action with optimistic UI
    - System categories do NOT show the toggle (Lock icon remains as-is)
    - Toast feedback on toggle success/failure
    - Undo on delete preserves the exclude_from_stats flag
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Visit /categories — non-system categories show Eye/EyeOff toggle; system categories show Lock icon only
3. Toggle a category to excluded — dashboard stats, donut chart, bar chart, and recent transactions all stop including that category's transactions
4. Visit /transactions — excluded category transactions still appear in the full transaction list
5. Toggle back to included — dashboard immediately reflects the change
</verification>

<success_criteria>
- Admin can toggle any non-system category between included/excluded from dashboard stats
- All four analytics queries (stat cards, category breakdown, monthly trend, recent transactions) respect the exclusion
- /transactions page is unaffected — shows all transactions regardless
- System categories remain always-excluded via is_system (no toggle shown)
- Changes are retroactive — toggling immediately affects all analytics with no data migration
</success_criteria>

<output>
After completion, create `.planning/quick/260408-mvw-add-option-to-set-rule-to-be-excluded-fr/260408-mvw-SUMMARY.md`
</output>
