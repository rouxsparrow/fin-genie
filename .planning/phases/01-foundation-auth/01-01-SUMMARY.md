---
phase: 01-foundation-auth
plan: 01
subsystem: infra, database, auth, ui
tags: [nextjs, supabase, tailwind, shadcn, neobrutalism, rls, typescript, postgres]

# Dependency graph
requires: []
provides:
  - Next.js 15 project scaffold with Neo Brutalism amber theme
  - 13 shadcn/neobrutalism UI components (button, card, input, label, select, table, dialog, badge, tooltip, skeleton, sonner, sheet, separator)
  - DM Sans font configured globally
  - Supabase database schema with 5 tables (profiles, categories, rules, imports, transactions)
  - RLS policies enforcing admin-only writes and household-scoped reads
  - Supabase browser client, server client, and auth middleware
  - TypeScript database types mirroring schema
affects: [01-02-PLAN, 01-03-PLAN, 02-01-PLAN, 03-01-PLAN, 04-01-PLAN]

# Tech tracking
tech-stack:
  added: [next@15.5.14, react@19.1.0, tailwindcss@4, @supabase/supabase-js@2.101.1, @supabase/ssr@0.10.0, zod@3.25.76, date-fns@4.1.0, nuqs@2.8.9, sonner@2.0.7, lucide-react@1.7.0, class-variance-authority, clsx, tailwind-merge, tw-animate-css, prettier, prettier-plugin-tailwindcss]
  patterns: [neobrutalism-css-variables, supabase-browser-client, supabase-server-client, supabase-auth-middleware, rls-household-scoping, integer-cents-money]

key-files:
  created:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/middleware.ts
    - src/lib/types/database.ts
    - supabase/migrations/00001_initial_schema.sql
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/input.tsx
    - src/components/ui/sonner.tsx
    - .env.local.example
  modified:
    - package.json
    - components.json

key-decisions:
  - "Removed next-themes dependency -- light-mode only (D-20), sonner hardcoded to theme=light"
  - "Fixed SelectPrimitive.Icon render prop to asChild -- neobrutalism registry incompatibility with @radix-ui/react-select types"
  - "Zod pinned to v3 per CLAUDE.md despite npm defaulting to v4"

patterns-established:
  - "Neo Brutalism CSS: oklch color tokens with --main, --background, --secondary-background, --border custom properties"
  - "Supabase browser client: createBrowserClient<Database> from @supabase/ssr in src/lib/supabase/client.ts"
  - "Supabase server client: async createClient() using cookies() from next/headers in src/lib/supabase/server.ts"
  - "Auth middleware: updateSession() in src/lib/supabase/middleware.ts, imported by src/middleware.ts"
  - "RLS pattern: household-scoped SELECT for authenticated, admin-only writes via profiles subquery"
  - "Money storage: INTEGER amount_cents column (not DECIMAL/FLOAT)"

requirements-completed: [INFR-01, INFR-02, INFR-03, AUTH-01, AUTH-02, AUTH-04]

# Metrics
duration: 12min
completed: 2026-04-06
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Next.js 15 project with Neo Brutalism amber theme, 13 shadcn UI components, Supabase 5-table schema with RLS policies, and auth middleware for session management**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-05T18:29:54Z
- **Completed:** 2026-04-05T18:42:40Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments
- Scaffolded Next.js 15.5.14 project with TypeScript, Tailwind CSS 4, and full Neo Brutalism amber theme (oklch color tokens, 4px hard shadows, 5px border radius, DM Sans font)
- Installed and configured all 13 UI components (12 neobrutalism + separator) with light-mode-only sonner toast provider
- Created complete database schema with 5 tables (profiles, categories, rules, imports, transactions), all with household_id, RLS enabled, and admin-only write policies
- Built Supabase auth plumbing: browser client, server client, and middleware that redirects unauthenticated users to /login and authenticated users away from /login to /dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with Neo Brutalism amber theme and UI components** - `139fb3b` (feat)
2. **Task 2: Create Supabase database schema with RLS policies and auth utilities** - `eef3a44` (feat)

## Files Created/Modified

- `package.json` - Project dependencies: Next.js, Supabase, Zod, date-fns, nuqs, sonner, lucide-react
- `src/app/globals.css` - Neo Brutalism amber theme with oklch color tokens and CSS custom properties
- `src/app/layout.tsx` - Root layout with DM Sans font and Sonner toast provider
- `src/app/page.tsx` - Minimal home page placeholder
- `src/lib/utils.ts` - cn() utility for class merging
- `components.json` - shadcn configuration
- `src/components/ui/button.tsx` - Neobrutalism button with shadow hover effect
- `src/components/ui/card.tsx` - Neobrutalism card component
- `src/components/ui/input.tsx` - Neobrutalism input component
- `src/components/ui/label.tsx` - Neobrutalism label component
- `src/components/ui/select.tsx` - Neobrutalism select (fixed Icon render prop)
- `src/components/ui/table.tsx` - Neobrutalism table component
- `src/components/ui/dialog.tsx` - Neobrutalism dialog component
- `src/components/ui/badge.tsx` - Neobrutalism badge component
- `src/components/ui/tooltip.tsx` - Neobrutalism tooltip component
- `src/components/ui/skeleton.tsx` - Neobrutalism skeleton loader
- `src/components/ui/sonner.tsx` - Sonner toast (light-mode only, no next-themes)
- `src/components/ui/sheet.tsx` - Neobrutalism sheet/drawer component
- `src/components/ui/separator.tsx` - shadcn separator component
- `supabase/migrations/00001_initial_schema.sql` - 5-table schema with RLS and triggers
- `supabase/config.toml` - Supabase project configuration
- `src/lib/types/database.ts` - TypeScript types mirroring database schema
- `src/lib/supabase/client.ts` - Browser Supabase client with Database generic
- `src/lib/supabase/server.ts` - Server Supabase client using cookies()
- `src/lib/supabase/middleware.ts` - Auth middleware with session refresh and redirects
- `src/middleware.ts` - Next.js middleware importing updateSession
- `.env.local.example` - Required environment variables template

## Decisions Made

- **Removed next-themes:** The `@neobrutalism/sonner` component imports `useTheme` from `next-themes`. Since this project is light-mode only (D-20), removed the dependency and hardcoded `theme="light"` to avoid unnecessary package.
- **Fixed select component type error:** The neobrutalism registry `@neobrutalism/select` component used `<SelectPrimitive.Icon render={...}>` which is not a valid prop in the installed version of `@radix-ui/react-select`. Changed to `asChild` pattern.
- **Pinned Zod to v3:** npm defaulted to installing Zod v4, but CLAUDE.md specifies `^3.x`. Explicitly installed `zod@3`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SelectPrimitive.Icon render prop type error**
- **Found during:** Task 1 (build verification)
- **Issue:** `@neobrutalism/select` registry component used `render` prop on `SelectPrimitive.Icon` which does not exist in the installed `@radix-ui/react-select` version
- **Fix:** Changed to `asChild` pattern: `<SelectPrimitive.Icon asChild><ChevronDown /></SelectPrimitive.Icon>`
- **Files modified:** src/components/ui/select.tsx
- **Verification:** `npm run build` passes without type errors
- **Committed in:** 139fb3b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix for build to pass. No scope creep.

## Issues Encountered

- **Broken node_modules symlinks:** Copying node_modules from temp scaffold directory broke `.bin` symlinks. Resolved by running `npm install` fresh. This is expected behavior when moving node_modules between directories.
- **create-next-app v16 default:** npm defaulted to `create-next-app@16` which conflicts with the v15 requirement. Explicitly specified `@15` to get Next.js 15.5.14.

## User Setup Required

None - no external service configuration required. Supabase environment variables will be configured when a Supabase project is created (documented in `.env.local.example`).

## Next Phase Readiness

- **Foundation complete:** Next.js project builds and runs with Neo Brutalism amber theme applied
- **All UI components available:** 13 components ready for Plan 02 (app shell, login page) and Plan 03 (user management)
- **Database schema ready:** All 5 tables with RLS policies created, ready for Supabase deployment
- **Auth plumbing wired:** Middleware handles session refresh and redirects, clients ready for use
- **No blockers** for Plans 02 and 03

## Self-Check: PASSED

- All 22 key files verified present on disk
- Commit 139fb3b (Task 1) verified in git log
- Commit eef3a44 (Task 2) verified in git log

---
*Phase: 01-foundation-auth*
*Completed: 2026-04-06*
