---
quick_id: 260408-mvw
subsystem: categories, analytics
tags: [exclude-from-stats, categories, analytics, dashboard]
---

# Quick Task 260408-mvw Summary: Exclude categories from dashboard stats

## What Was Built

Added `exclude_from_stats` boolean column to the categories table, allowing admins to toggle any user category out of all dashboard analytics (stat cards, donut chart, bar chart, recent transactions). System categories (Card Payment) remain always excluded via `is_system`. The /categories page shows an Eye/EyeOff toggle for each non-system category with optimistic UI updates.

## Self-Check: PASSED

## Key Files

### Created
| File | Purpose |
|------|---------|
| `supabase/migrations/00009_add_exclude_from_stats.sql` | Migration adding `exclude_from_stats` boolean column (default false) |

### Modified
| File | Change |
|------|--------|
| `src/lib/types/database.ts` | Added `exclude_from_stats: boolean` to Category type |
| `src/app/actions/category-actions.ts` | Added `toggleCategoryExclude` server action |
| `src/app/actions/analytics-actions.ts` | Replaced `getCardPaymentCategoryId` with `getExcludedCategoryIds` (is_system OR exclude_from_stats) |
| `src/components/categories/category-item.tsx` | Added Eye/EyeOff toggle icon for non-system categories |
| `src/components/categories/categories-list.tsx` | Added `handleToggleExclude` with optimistic update |

## Deviations

None.
