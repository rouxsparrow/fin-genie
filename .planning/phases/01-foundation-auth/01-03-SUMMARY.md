---
phase: 01-foundation-auth
plan: 03
subsystem: dashboard, settings, user-management, error-handling
tags: [react, supabase, server-actions, rls, responsive, neo-brutalism]

# Dependency graph
requires: [01-01, 01-02]
provides:
  - Dashboard page with role-aware empty state (admin CTA vs viewer text)
  - Reusable EmptyState component with icon, heading, body, optional CTA
  - Settings page with Household Members table
  - User management: add member, remove member, role change
  - Last-admin protection on removal
  - Server actions for user management (createUser, removeUser, changeRole)
  - Custom error page (error.tsx) and 404 page (not-found.tsx)
  - Mobile responsive stacked card layout for user table
affects: [02-01-PLAN, 03-01-PLAN]

# Tech tracking
tech-stack:
  added: [supabase-admin-api]
  patterns: [server-actions, security-definer-functions]
---

# Plan 03 Summary: Dashboard, Settings & User Management

## One-liner
Dashboard empty state with role-aware messaging, full user management on settings page, custom error pages, and mobile responsive table layout.

## What was built

### Task 1: Dashboard empty state, EmptyState component, error/404 pages
- `src/components/empty-state.tsx` — Reusable component with icon, heading, body, optional disabled CTA with tooltip
- `src/app/(authenticated)/dashboard/page.tsx` — Admin sees "Upload your first bank statement" + disabled "Import Statement" button; viewer sees "Ask your admin" text only
- `src/app/error.tsx` — Error boundary with retry and "Go to Dashboard" buttons
- `src/app/not-found.tsx` — 404 page with "Go to Dashboard" link

### Task 2: Settings page with user management
- `src/app/(authenticated)/settings/page.tsx` — Settings page with "Household Members" heading, user table, "Add Member" button
- `src/components/user-table.tsx` — Table with role badges, action buttons (change role, remove), mobile stacked card layout
- `src/components/add-user-form.tsx` — Dialog form with email, full name, role select
- `src/app/actions/user-management.ts` — Server actions using Supabase Admin API (service role key) for createUser, removeUser, changeRole
- `src/app/(authenticated)/settings/loading.tsx` — Skeleton loading state
- Last-admin protection: warns and prevents removing the only admin

### Task 3: Visual verification checkpoint
- Human-verified all 7 checkpoint areas
- Fixed RLS infinite recursion (SECURITY DEFINER functions)
- Fixed mobile hamburger/title overlap
- Fixed uuid_generate_v4 → gen_random_uuid for Supabase compatibility

## Deviations

### D1: Database type restructured for @supabase/supabase-js v2 [Rule 1 — Bug]
- **Issue:** Named interfaces and mapped types resolved to `never` in the Supabase generic chain
- **Fix:** Restructured Database type to use inline object types; derived convenience types as aliases
- **Impact:** None — same runtime behavior, better generic resolution

### D2: RLS policies rewritten with SECURITY DEFINER functions [Rule 1 — Bug]
- **Issue:** Self-referencing subqueries in profiles RLS policies caused `42P17 infinite recursion`
- **Fix:** Created `get_my_household_id()` and `is_admin()` SECURITY DEFINER functions; rewrote all table policies to use them
- **Impact:** All 5 tables now use clean function-based policies instead of inline subqueries
- **Migrations:** 00002, 00003, 00004 (incremental fixes during debugging)

### D3: gen_random_uuid() replaces uuid_generate_v4() [Rule 1 — Bug]
- **Issue:** `uuid-ossp` extension installed in different schema on Supabase, function not accessible
- **Fix:** Use built-in `gen_random_uuid()` (Postgres 13+)

## Self-Check: PASSED

## Key files

### key-files.created
- src/components/empty-state.tsx
- src/app/(authenticated)/dashboard/page.tsx
- src/app/(authenticated)/settings/page.tsx
- src/app/(authenticated)/settings/loading.tsx
- src/components/user-table.tsx
- src/components/add-user-form.tsx
- src/app/actions/user-management.ts
- src/app/error.tsx
- src/app/not-found.tsx
- supabase/migrations/00004_fix_profiles_rls_security_definer.sql

### key-files.modified
- src/lib/types/database.ts
- src/app/(authenticated)/layout.tsx
- next.config.ts
- supabase/migrations/00001_initial_schema.sql
