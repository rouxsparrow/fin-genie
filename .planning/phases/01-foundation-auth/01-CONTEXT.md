# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold, database schema with RLS, Supabase Auth with admin/viewer roles, and app shell with sidebar navigation. Users can log in with appropriate roles and navigate a styled app shell backed by a secure, correctly-structured database. No business logic (parsing, categorization, analytics) — this phase delivers the foundation everything else builds on.

</domain>

<decisions>
## Implementation Decisions

### App shell & navigation
- **D-01:** Full sidebar with all v1 pages visible from day one (Dashboard, Transactions, Import, Rules, Categories, Settings) — pages for unshipped phases are greyed out
- **D-02:** Greyed-out sidebar items are clickable and show a "coming soon" tooltip/message (e.g., "Available after importing statements")
- **D-03:** Mobile navigation uses a collapsible drawer triggered by a hamburger menu icon (slide-out overlay)
- **D-04:** Landing page after login is the Dashboard — empty state with onboarding prompt until data exists
- **D-05:** Both admin and viewer see the same navigation items — admin-only pages (Import, Rules, Settings) are hidden or disabled for viewers
- **D-06:** Sidebar footer shows user info: avatar/initials, display name, role badge (Admin/Viewer), and logout button
- **D-07:** Sidebar header displays "Fin Genie" text only in bold Neo Brutalism style — no logo/icon
- **D-08:** No top header bar — sidebar handles all navigation, content area gets full viewport height

### Login experience
- **D-09:** Centered login card on a clean background — app name at top, email/password fields, login button. Full Neo Brutalism styling (thick borders, drop shadow, bold button).
- **D-10:** Forgot password flow enabled — Supabase Auth native email reset. Link visible on login page.
- **D-11:** Login failure shows generic error message: "Invalid email or password" — does not reveal whether email exists
- **D-12:** No public sign-up page — user creation is admin-only from the settings page

### User management
- **D-13:** Admin creates users via a simple form on the settings page: email, full name, role selection (admin/viewer). System creates account and sends email with temporary password.
- **D-14:** Settings page shows a simple user list (table) with columns: name, email, role, status. Add user button opens form. Remove button with confirmation dialog.
- **D-15:** Admin can change a user's role after creation (promote viewer to admin, demote admin to viewer) from the user list
- **D-16:** System prevents removing the last admin account. Admin can only remove themselves if another admin exists.

### Visual identity
- **D-17:** Neo Brutalism color palette uses amber color from the neobrutalism.dev registry styling as the primary accent
- **D-18:** Full Neo Brutalism intensity: thick 2-3px black borders, hard drop shadows, bold typography, stark color blocks
- **D-19:** Playful and approachable mood — finance doesn't have to be boring. Bold colors, friendly empty states, personality in the UI.
- **D-20:** Light mode only in v1 — dark mode deferred to v2 (ENHN-01)
- **D-21:** Bold sans-serif typography with heavy weight headings and regular body text
- **D-22:** Data tables styled with thick-bordered rows, alternating subtle color fill, bold headers — matching Neo Brutalism card aesthetic
- **D-23:** Empty states use text with icon pattern: simple icon + helpful message + action button

### Database schema
- **D-24:** User roles stored in a `profiles` table with a role column, linked to `auth.users` via foreign key
- **D-25:** All tables include `household_id` column with a default value for future multi-household support — trivial migration later
- **D-26:** Plural snake_case table naming: profiles, transactions, categories, rules (Postgres/Supabase convention)
- **D-27:** Initial admin account created manually via Supabase dashboard (no seed migration)
- **D-28:** Profiles table includes `full_name` column for display in sidebar and user management UI
- **D-29:** All tables include `created_at` and `updated_at` columns with default `NOW()`

### Error & loading states
- **D-30:** Skeleton loaders for content loading — placeholder shapes matching content layout with Neo Brutalism thick-border styling
- **D-31:** Toast notifications for action feedback (user created, settings saved, errors) — brief popup at bottom-right, auto-dismiss
- **D-32:** Custom friendly error page with Neo Brutalism styling for unexpected errors (500, network failure) — message, retry button, link to dashboard

### Responsive design
- **D-33:** Sidebar collapses to hamburger drawer at 768px (Tailwind `md` breakpoint)
- **D-34:** Data tables transform to stacked cards on mobile — each card shows one item's full data
- **D-35:** Responsive web is sufficient — desktop is primary, mobile is nice-to-have with standard responsive treatment

### Claude's Discretion
- Loading skeleton specific designs and animations
- Exact spacing, padding, and margin values
- Toast notification timing and positioning details
- Exact hamburger icon and drawer animation
- Tab order and keyboard navigation details
- Supabase RLS policy implementation details
- Database migration file organization

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions, context (Citibank SG format details, user roles)
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04, INFR-01 through INFR-04 requirements for this phase
- `.planning/ROADMAP.md` §Phase 1 — Success criteria, dependencies, plan structure

### External references
- No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project. Only CLAUDE.md exists in root.

### Established Patterns
- No established patterns yet. This phase SETS the patterns that all subsequent phases follow:
  - Supabase client creation (browser vs server)
  - Auth middleware pattern
  - RLS policy pattern
  - Component structure (shadcn/ui + Neo Brutalism)
  - Layout system (sidebar + content area)

### Integration Points
- Supabase project (needs to be created/configured)
- Vercel deployment (needs to be connected)
- Neo Brutalism theme from neobrutalism.dev registry

</code_context>

<specifics>
## Specific Ideas

- Use amber color from Neo Brutalism registry as primary accent (user specified this explicitly rather than letting us choose)
- Finance app should feel playful and approachable, not boring/corporate
- User management is deliberately simple (2-3 household users) — no invite flow, just direct creation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-04-06*
