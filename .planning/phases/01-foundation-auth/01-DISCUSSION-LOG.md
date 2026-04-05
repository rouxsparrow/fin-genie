# Phase 1: Foundation & Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 01-Foundation & Auth
**Areas discussed:** App shell & navigation, Login experience, User management, Visual identity, Database schema design, Error & loading states, Responsive breakpoints

---

## App shell & navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Full set | All v1 pages visible from day one, greyed out until their phase ships | ✓ |
| Progressive reveal | Only show pages that are functional | |
| Minimal with grouped nav | Group related items under headings | |

**User's choice:** Full set
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible drawer | Hamburger menu triggers slide-out drawer overlay | ✓ |
| Bottom navigation bar | Fixed bottom bar with icon-only nav items | |
| Sidebar always visible | Persistent sidebar that shrinks to icon-only | |

**User's choice:** Collapsible drawer
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard | Users land on spending analytics, empty state until data | ✓ |
| Import page | Action-oriented, gets them uploading immediately | |
| You decide | Claude picks | |

**User's choice:** Dashboard
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Same nav, hide admin actions | Both roles see all pages, admin-only actions hidden for viewers | ✓ |
| Different nav per role | Viewer sees only Dashboard and Transactions | |
| Same nav, badge admin items | All pages visible, admin-only show lock icon | |

**User's choice:** Same nav, hide admin actions
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Clickable with coming soon | Shows tooltip/message when clicked | ✓ |
| Fully non-interactive | Don't respond to clicks | |
| You decide | Claude picks | |

**User's choice:** Clickable with coming soon
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom of sidebar | Avatar/initials, name, role badge, logout button | ✓ |
| Top of sidebar | User info at top, nav below | |
| Separate header bar | User info in top header | |

**User's choice:** Bottom of sidebar
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + app name | Text logo with genie motif | |
| App name only | Just "Fin Genie" in bold Neo Brutalism style | ✓ |
| Icon only | Small icon that works when sidebar collapses | |

**User's choice:** App name only
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| No top bar | Sidebar handles all nav, content gets full height | ✓ |
| Minimal top bar | Thin bar with page title and breadcrumbs | |
| You decide | Claude picks | |

**User's choice:** No top bar
**Notes:** None

---

## Login experience

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card | Single centered login card on clean background | ✓ |
| Split layout | Left branding, right form | |
| Full-page minimal | Just fields and button, no card | |

**User's choice:** Centered card
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, email reset | Supabase Auth handles natively, link on login page | ✓ |
| No, admin resets manually | Admin manages passwords | |
| You decide | Claude picks | |

**User's choice:** Yes, email reset
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Generic error message | "Invalid email or password", doesn't reveal email existence | ✓ |
| Specific error messages | "Email not found" vs "Wrong password" | |
| You decide | Claude picks | |

**User's choice:** Generic error message
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Admin-only creation | No public sign-up page, admin creates from settings | ✓ |
| Sign-up with approval | Public form, admin approves | |
| Open sign-up | Anyone can create account | |

**User's choice:** Admin-only creation
**Notes:** None

---

## User management

| Option | Description | Selected |
|--------|-------------|----------|
| Simple form | Admin enters email, name, selects role. System emails temp password. | ✓ |
| Email invitation | Admin sends invite link, recipient sets own password | |
| You decide | Claude picks simplest approach | |

**User's choice:** Simple form
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Simple user list | Table with name, email, role, status. Add/remove buttons. | ✓ |
| Card-based layout | Each user as a card | |
| You decide | Claude picks | |

**User's choice:** Simple user list
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, from settings | Admin can promote/demote roles | ✓ |
| No, role is fixed | Set once at creation | |
| You decide | Claude decides | |

**User's choice:** Yes, from settings
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Prevent last admin removal | Block removing last admin, self-removal only with another admin | ✓ |
| No restrictions | Allow any removal | |
| You decide | Claude implements safety checks | |

**User's choice:** Prevent last admin removal
**Notes:** None

---

## Visual identity

| Option | Description | Selected |
|--------|-------------|----------|
| Bold primary colors | Bright yellows, blues, pinks with black thick borders | |
| Muted/pastel tones | Softer pastels with thick borders | |
| Monochrome + one accent | Black/white/gray with one bold accent | |
| You decide | Claude picks | |

**User's choice:** Use amber color from Neo Brutalism registry styling (custom input)
**Notes:** User specifically chose amber from the neobrutalism.dev registry rather than a generic palette option

| Option | Description | Selected |
|--------|-------------|----------|
| Full Neo Brutalism | Thick 2-3px borders, hard drop shadows, bold typography | ✓ |
| Subtle Neo Brutalism | Thinner borders, softer shadows, more conventional | |
| You decide | Claude calibrates | |

**User's choice:** Full Neo Brutalism
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Playful and approachable | Bold colors, friendly empty states, personality | ✓ |
| Clean and professional | Serious tone, data-focused, minimal decoration | |
| You decide | Claude balances | |

**User's choice:** Playful and approachable
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Light mode only in v1 | Dark mode deferred to v2 | ✓ |
| Both from the start | CSS variables for light/dark from day one | |
| You decide | Claude decides | |

**User's choice:** Light mode only in v1
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Full Neo Brutalism | Login card with thick borders, consistent with app | ✓ |
| Neutral/minimal login | Clean login, Neo Brutalism starts inside the app | |
| You decide | Claude picks | |

**User's choice:** Full Neo Brutalism
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Bold sans-serif | Heavy weight headings, regular body | ✓ |
| Monospace accents | Monospace for numbers, sans-serif for text | |
| You decide | Claude uses registry defaults | |

**User's choice:** Bold sans-serif
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Thick-bordered rows | Visible borders, alternating color, bold headers | ✓ |
| Minimal clean tables | Light borders, white background, subtle hover | |
| You decide | Claude styles to match theme | |

**User's choice:** Thick-bordered rows
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Text with icon | Simple icon + message + action button | ✓ |
| Custom illustrations | Playful illustrations per page | |
| You decide | Claude picks | |

**User's choice:** Text with icon
**Notes:** None

---

## Database schema design

| Option | Description | Selected |
|--------|-------------|----------|
| Profiles table | Separate table with role column, FK to auth.users | ✓ |
| Auth metadata | Store role in app_metadata JSON | |
| You decide | Claude picks | |

**User's choice:** Profiles table
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add now with default | household_id on all tables, default to single household | ✓ |
| No, add when needed | Keep simple for v1, migrate later | |
| You decide | Claude decides | |

**User's choice:** Yes, add now with default
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Plural snake_case | profiles, transactions, categories, rules | ✓ |
| Singular snake_case | profile, transaction, category, rule | |
| You decide | Claude follows conventions | |

**User's choice:** Plural snake_case
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| SQL seed migration | First admin via migration script | |
| Manual via Supabase dashboard | Admin creates first user through dashboard | ✓ |
| First-user-is-admin flow | First person creates admin account | |

**User's choice:** Manual via Supabase dashboard
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full_name column | Display name for UI, email for auth | ✓ |
| Email only | Use email for everything | |
| You decide | Claude decides | |

**User's choice:** Yes, full_name column
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, on all tables | created_at and updated_at with default NOW() | ✓ |
| Only where needed | Timestamps only on tables that need them | |
| You decide | Claude follows best practices | |

**User's choice:** Yes, on all tables
**Notes:** None

---

## Error & loading states

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton loaders | Placeholder shapes matching content layout with Neo Brutalism styling | ✓ |
| Spinner/loading indicator | Simple centered spinner | |
| You decide | Claude picks per component | |

**User's choice:** Skeleton loaders
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notifications | Brief popup at bottom-right, auto-dismiss | ✓ |
| Inline messages | Message in form/action area | |
| You decide | Claude picks per action | |

**User's choice:** Toast notifications
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly error page | Custom Neo Brutalism styled error page with retry | ✓ |
| Default Next.js error | Built-in error.tsx with minimal customization | |
| You decide | Claude implements | |

**User's choice:** Friendly error page
**Notes:** None

---

## Responsive breakpoints

| Option | Description | Selected |
|--------|-------------|----------|
| 768px / md | Standard tablet breakpoint for sidebar collapse | ✓ |
| 1024px / lg | Sidebar only on large screens | |
| You decide | Claude picks from Tailwind defaults | |

**User's choice:** 768px / md
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll | Tables scroll horizontally on mobile | |
| Card stack | Transform rows into stacked cards on mobile | ✓ |
| You decide | Claude picks per component | |

**User's choice:** Card stack
**Notes:** User chose card stack over the recommended horizontal scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive web is enough | Desktop primary, mobile nice-to-have | ✓ |
| Mobile-first priority | Prioritize mobile UX | |
| You decide | Claude builds responsive | |

**User's choice:** Responsive web is enough
**Notes:** None

---

## Claude's Discretion

- Loading skeleton specific designs and animations
- Exact spacing, padding, and margin values
- Toast notification timing and positioning details
- Exact hamburger icon and drawer animation
- Tab order and keyboard navigation details
- Supabase RLS policy implementation details
- Database migration file organization

## Deferred Ideas

None — discussion stayed within phase scope
