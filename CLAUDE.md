<!-- GSD:project-start source:PROJECT.md -->
## Project

**Fin Genie**

A private household finance analyzer that imports bank statement PDFs, parses transactions, categorizes them via editable text rules, and provides spending analytics across custom date ranges. Built for a Singapore household using SGD, with admin and viewer roles over shared data. v1 targets Citibank SG credit card statements with a config-driven parser designed for future bank format expansion.

**Core Value:** Household members can see where their money goes — upload a bank statement, have transactions auto-categorized, and view spending breakdowns by category and time period.

### Constraints

- **Hosting:** Vercel — serverless functions for PDF parsing, edge runtime for UI
- **Database:** Supabase Postgres with built-in Auth and Row Level Security
- **UI framework:** Next.js (App Router) with shadcn/ui (Neo Brutalism theme from registry)
- **Charts:** Recharts for analytics visualizations
- **Parser architecture:** Config-driven — generic parser reads JSON bank format definitions, not hard-coded per bank
- **Auth:** Supabase Auth with email/password provider
- **Currency:** SGD only in v1
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.x (latest stable) | Full-stack React framework | Already decided. Use 15.x, not 16. Next.js 16 has breaking changes (sync request API removal, new caching model) that add migration risk for no benefit on a greenfield project that can adopt those patterns later. 15.x is battle-tested on Vercel with full App Router support, Turbopack dev, and React 19. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15. Server Components, Server Actions, `useActionState` for forms. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for a data-heavy app. Next.js 15 has first-class TS support including typed routes (15.5+). | HIGH |
| Tailwind CSS | 4.x | Utility-first CSS | Ships with shadcn/ui. v4 uses CSS-first configuration and is the default for new shadcn projects. | HIGH |
### UI Components
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | latest (registry) | Component primitives | Already decided. Copy-paste components you own. Neo Brutalism theme overrides the default styling. Not a dependency -- components live in your codebase. | HIGH |
| Neobrutalism Components | latest (registry) | Neo Brutalism themed shadcn variants | Install via shadcn CLI: `npx shadcn add @neobrutalism/<component>`. Provides thick borders, stark shadows, bold colors. Replace globals.css with their styling system. Only supports CSS variables mode (not utility class mode). | MEDIUM |
| Recharts | 3.8.x | Chart visualizations | Already decided. v3 is current stable (3.8.1 as of April 2026). Composable React components for bar, line, pie charts. Good enough for spending breakdowns and trend charts. | HIGH |
| react-dropzone | 15.x | PDF file upload drag-and-drop | Simple hook-based API (`useDropzone`). Handles drag states, file type restrictions, file size validation. Lightweight and well-maintained. | HIGH |
### Database and Auth
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase (hosted) | latest | Postgres + Auth + Storage | Already decided. Managed Postgres with built-in auth, RLS, and file storage. Perfect for a small household app -- free tier covers the use case entirely. | HIGH |
| @supabase/supabase-js | 2.x (2.101+) | Supabase client SDK | Isomorphic JS client. Handles auth, database queries, storage uploads, and realtime subscriptions. | HIGH |
| @supabase/ssr | 0.10.x | SSR auth for Next.js | Replaces deprecated `@supabase/auth-helpers-nextjs`. Handles PKCE auth flow, cookie-based sessions, and middleware token refresh. Creates separate browser/server clients. | HIGH |
| Supabase CLI | latest | Local dev + migrations | `supabase init`, `supabase start` for local Postgres. `supabase db diff` to generate migrations from dashboard changes. `supabase db push` to deploy. | HIGH |
### PDF Parsing
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| unpdf | latest (bundles PDF.js 5.4.x) | PDF text extraction in serverless | **This is the key choice.** unpdf wraps Mozilla's PDF.js with a serverless-optimized build (~1.4MB). Works in Vercel serverless functions without native dependencies. `extractText()` returns per-page text arrays -- essential for a config-driven parser that needs to process pages individually. Alternatives considered below. | HIGH |
| Library | Why Not |
|---------|---------|
| `pdf-parse` | Wraps an older PDF.js version. The v1 API is callback-based. v2 is newer but unpdf provides better serverless optimization and a cleaner API with per-page text extraction. |
| `pdfjs-dist` | Raw PDF.js -- 2MB+ bundle, requires manual worker setup, no serverless optimization. unpdf wraps this with all the hard work done. |
| `pdfjs-serverless` | Good but unpdf is from the UnJS ecosystem (same team as Nitro, H3, Nuxt) and more actively maintained with a richer API (images, links, metadata). |
| `pdf-lib` | For creating/editing PDFs, not parsing text. Wrong tool. |
| `pdf2json` | Older, heavier, uses native dependencies that break in serverless. |
### Data Handling and Validation
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 3.x | Schema validation | TypeScript-first validation. Use for: server action input validation, PDF parser config schema validation, categorization rule schemas. Define once, validate on both client and server. The standard choice with Next.js server actions. | HIGH |
| date-fns | 4.x | Date manipulation | Functional API that works with native Date objects. Tree-shakeable -- only import what you use. Needed for: statement period date parsing ("DD MMM" to Date), date range filtering, monthly aggregation for charts. Preferred over Day.js for TypeScript-first projects. | HIGH |
### URL State and Tables
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| nuqs | latest | URL search param state | Type-safe `useQueryState` hook. Dashboard date ranges, filters, and pagination state belong in the URL (shareable, back-button friendly). Used by Vercel, Supabase, Sentry. The standard for Next.js App Router URL state. | MEDIUM |
| @tanstack/react-table | 8.x | Headless table logic | Powers the shadcn/ui Data Table recipe. Sorting, filtering, pagination logic without UI opinions. Wrap with shadcn Table components. Must be a client component (`'use client'`). | HIGH |
### Infrastructure
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | -- | Hosting and deployment | Already decided. Serverless functions for PDF parsing, edge middleware for auth, CDN for static assets. Free tier is sufficient. | HIGH |
| Supabase Storage | -- | PDF file storage | Upload PDFs directly from browser to Supabase Storage (bypasses Vercel's 4.5MB body limit). Standard upload is fine for PDFs under 6MB; bank statements are typically 100KB-2MB. Create a `statements` bucket with RLS policies. | HIGH |
### Developer Tooling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 9.x | Linting | Ships with `create-next-app`. Flat config format in v9. | HIGH |
| Prettier | 3.x | Code formatting | Consistent formatting. Use `prettier-plugin-tailwindcss` for class sorting. | HIGH |
| Supabase CLI | latest | Local database + migrations | Run Postgres locally, generate migrations, seed data. `supabase start` spins up a full local Supabase stack (Postgres, Auth, Storage, Studio). | HIGH |
## File Upload Architecture
## Supabase Patterns
### Auth Setup
- createBrowserClient() -- for client components
- createServerClient() -- for server components, server actions, route handlers
- Middleware -- refreshes expired tokens, writes updated session cookies
### RLS Strategy
### Migration Workflow
# Local development
# Write SQL in supabase/migrations/YYYYMMDDHHMMSS_<name>.sql
# Deploy
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| PDF parsing | unpdf | pdf-parse | Less serverless optimization, older PDF.js bundle, no per-page extraction |
| PDF parsing | unpdf | pdfjs-dist (raw) | Too low-level, requires manual worker config, 2MB+ bundle |
| Date library | date-fns | Day.js | Day.js is smaller but date-fns has better TS types, functional API, tree-shaking |
| Date library | date-fns | Temporal API | Not yet available in all runtimes (expected 2026-2027). Premature to depend on. |
| Money handling | Plain integers (cents) | Dinero.js | Overkill for single-currency SGD app. Store amounts as integers in cents, format with `Intl.NumberFormat`. Dinero.js v2 is still in alpha. |
| State management | React state + nuqs | Zustand / Jotai | App is server-first with minimal client state. URL state (nuqs) for filters, React state for forms. No global client store needed. |
| Table library | @tanstack/react-table | AG Grid | AG Grid is enterprise-grade overkill. TanStack Table is headless and integrates with shadcn's Table component. |
| Charts | Recharts | Tremor / Nivo | Recharts is already decided. Tremor adds its own design system (conflicts with Neo Brutalism). Nivo is heavier. |
| Hosting | Vercel | Self-hosted | Already decided. Vercel's free tier + Supabase free tier = $0/month for a household app. |
| Next.js version | 15.x | 16.x | 16 has breaking changes (removed sync request APIs, new caching defaults). Not worth the risk for a new project. Upgrade later when ecosystem stabilizes. |
| Auth | Supabase Auth | NextAuth / Clerk | Already have Supabase -- adding another auth provider is unnecessary complexity. Supabase Auth handles email/password natively. |
| File storage | Supabase Storage | Vercel Blob / S3 | Already have Supabase -- no reason to add another service. Storage integrates with RLS for access control. |
## Money Handling Strategy
- **Store:** Amounts as integers in cents (e.g., $12.50 = 1250) in Postgres `INTEGER` column
- **Parse:** Convert PDF amounts to cents immediately during parsing (`Math.round(parseFloat(amount) * 100)`)
- **Display:** Format with `Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })`
- **Aggregate:** Sum/group using plain integer arithmetic -- no floating point issues
## Installation
# Initialize Next.js with TypeScript, Tailwind, App Router
# Core Supabase
# PDF parsing
# UI components (shadcn is added via CLI, not npm)
# Then add components as needed:
# npx shadcn@latest add button card table dialog input select ...
# Charts
# Data handling
# File upload
# URL state management
# Table logic
# Dev dependencies
# Supabase CLI (for local dev)
## Neo Brutalism Theme Setup
## Version Pinning Notes
| Package | Pin Strategy | Reason |
|---------|-------------|--------|
| next | `~15.x` (minor range) | Avoid accidental jump to 16.x |
| @supabase/supabase-js | `^2.x` | v2 API is stable, minor updates are safe |
| @supabase/ssr | `^0.10.x` | Pre-1.0 but API is stable; pin minor |
| unpdf | `^latest` | Small API surface, safe to update |
| recharts | `^3.x` | v3 is current major, safe within major |
| zod | `^3.x` | Stable API, safe within major |
| date-fns | `^4.x` | v4 dropped CommonJS; ensure your setup handles ESM |
## Sources
- [unpdf GitHub - UnJS](https://github.com/unjs/unpdf) - PDF extraction library details and API
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse) - Alternative PDF library comparison
- [unpdf vs pdf-parse vs pdf.js comparison (2026)](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026)
- [Next.js App Router docs](https://nextjs.org/docs/app) - Official App Router documentation
- [Next.js 15 vs 16 comparison](https://www.descope.com/blog/post/nextjs15-vs-nextjs16)
- [Supabase RLS performance best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase SSR auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) - v0.10.0
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) - v2.101.1
- [Supabase local development with migrations](https://supabase.com/docs/guides/local-development/overview)
- [Vercel serverless function limits](https://vercel.com/docs/functions/limitations) - 4.5MB body limit, 250MB bundle limit
- [Vercel body size limit workarounds](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)
- [Neobrutalism components installation](https://www.neobrutalism.dev/docs/installation)
- [shadcn/ui Data Table guide](https://ui.shadcn.com/docs/components/radix/data-table)
- [nuqs - URL state for React](https://nuqs.dev/) - Used by Vercel, Supabase, Sentry
- [recharts npm](https://www.npmjs.com/package/recharts) - v3.8.1
- [react-dropzone npm](https://www.npmjs.com/package/react-dropzone) - v15.0.0
- [date-fns vs Day.js comparison (2026)](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026)
- [Supabase Storage resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
