---
phase: 02-pdf-import-pipeline
plan: 03
subsystem: ui
tags: [next.js, supabase, date-fns, server-components, responsive, timeline]

# Dependency graph
requires:
  - phase: 02-01
    provides: Database schema with imports table and profiles table
provides:
  - Import history page at /import/history with server-side data fetching
  - ImportHistoryTable component with responsive desktop table and mobile cards
  - TimelineBar component showing statement coverage with filled/gap/future months
  - Enabled Import sidebar nav for admin users
affects: [02-04, 03-categorization]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-component-data-fetching-with-profile-merge, responsive-table-card-pattern, timeline-visualization]

key-files:
  created:
    - src/app/(authenticated)/import/history/page.tsx
    - src/components/history/import-history-table.tsx
    - src/components/history/timeline-bar.tsx
  modified:
    - src/components/app-sidebar.tsx

key-decisions:
  - "Separate queries for imports and profiles instead of Supabase foreign key join due to imports.imported_by referencing auth.users not profiles"

patterns-established:
  - "Server component data fetching with separate queries merged in-memory for cross-table lookups without FK relations"
  - "Timeline visualization using date-fns eachMonthOfInterval with status-based color coding"

requirements-completed: [IMPT-06, IMPT-07]

# Metrics
duration: 4min
completed: 2026-04-07
---

# Phase 02 Plan 03: Import History & Timeline Summary

**Import history page with timeline bar visualization, responsive table/card layout, and enabled Import sidebar navigation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T02:46:12Z
- **Completed:** 2026-04-07T02:49:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Import history page fetches data server-side with RLS-protected Supabase queries and renders empty state with CTA when no imports exist
- Timeline bar shows month-by-month statement coverage with green (filled), red/20% (gap), and muted (future) segments with tooltips
- Responsive import history table converts to stacked cards on mobile with label/value pairs
- Import nav item enabled in sidebar for admin users

## Task Commits

Each task was committed atomically:

1. **Task 1: Import history page with data fetching and import history table component** - `394e1ce` (feat)
2. **Task 2: Timeline bar component and enable Import sidebar nav** - `10469ce` (feat)

## Files Created/Modified
- `src/app/(authenticated)/import/history/page.tsx` - Server component page with imports + profiles data fetching, empty state, timeline bar, and history table
- `src/components/history/import-history-table.tsx` - Client component with desktop Table and mobile Card responsive layouts
- `src/components/history/timeline-bar.tsx` - Client component with month segment visualization using date-fns intervals
- `src/components/app-sidebar.tsx` - Import nav item changed from disabled: true to disabled: false

## Decisions Made
- Used separate Supabase queries for imports and profiles instead of FK join because `imported_by` references `auth.users(id)` and the Database type has no declared relationship to `profiles`. Profile names are merged in-memory via a Map lookup by importer ID.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced Supabase FK join with separate queries and in-memory merge**
- **Found during:** Task 1 (Import history page)
- **Issue:** Plan suggested `profiles!imported_by(full_name)` join syntax, but TypeScript reported `SelectQueryError<"could not find the relation between imports and profiles">` because `imported_by` references `auth.users`, not `profiles`, and no relationship is declared in the Database type
- **Fix:** Fetch imports and profiles separately, merge profile names via Map lookup
- **Files modified:** src/app/(authenticated)/import/history/page.tsx
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** 394e1ce (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary for TypeScript compilation. Same data result, different query strategy. No scope creep.

## Issues Encountered
None beyond the Supabase join issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Import history page ready to display data once imports are created via the upload/parse flow (Plan 02 and 04)
- Timeline bar will populate automatically as statement periods are recorded
- Sidebar navigation to Import is now active for admin users

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 02-pdf-import-pipeline*
*Completed: 2026-04-07*
