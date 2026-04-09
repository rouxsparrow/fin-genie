---
phase: 05
slug: dashboard-analysis-enhancements
status: approved
shadcn_initialized: true
preset: neo-brutalism-amber
created: 2026-04-09
---

# Phase 05 — UI Design Contract

> Visual and interaction contract for frontend phases. Generated for Phase 05 dashboard redesign and intended to guide planning/execution without ad-hoc styling drift.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | neo-brutalism-amber |
| Component library | radix |
| Icon library | lucide-react |
| Font | DM Sans |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline sort arrows, delta indicators |
| sm | 8px | Compact button padding, row-level spacing, tag spacing |
| md | 16px | Default card padding, filter control spacing |
| lg | 24px | Section padding, modal header/body spacing |
| xl | 32px | Dashboard block spacing between cards/charts/transactions |
| 2xl | 48px | Major section breaks inside expanded dashboard states |
| 3xl | 64px | Reserved for page-level breathing room on large desktop layouts |

Exceptions: modal overlays may use 20px internal padding on mobile if needed to preserve readable density without horizontal clipping.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 500 | 1.5 |
| Label | 12px | 700 | 1.35 |
| Heading | 24px | 700 | 1.2 |
| Display | 32px | 700 | 1.1 |

Additional contract:
- Monetary values use tabular numerals where supported by existing components.
- Delta labels and helper text stay visually secondary through size/opacity, not through low-contrast color.
- Table headers remain bold and compact to match the app’s existing admin/data surfaces.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `oklch(96.22% 0.0569 95.61)` | App background and dashboard canvas |
| Secondary (30%) | `oklch(100% 0 0)` | Cards, tables, modal surfaces, input backgrounds |
| Accent (10%) | `oklch(84.08% 0.1725 84.2)` | Primary buttons, active range control, active chart emphasis, selected filter badge, modal focus actions |
| Destructive | `#ef4444` | Destructive actions and irreversible warnings only |

Accent reserved for:
- active date/range controls
- selected chart/category emphasis
- primary CTA buttons
- key comparison highlights

Do not use accent color for every interactive element. Secondary actions remain white with black border/shadow styling.

Chart palette contract:
- Preserve existing chart palette order where possible:
  - `#FFBF00`
  - `#0099FF`
  - `#FF7A05`
  - `#00D696`
  - `#7A83FF`
- Positive/negative category deltas may layer directional signals through arrows and text treatment, but must not replace the base chart palette as the primary category-identity mechanism.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Import Statement` |
| Empty state heading | `No spending data yet` |
| Empty state body | `Upload your first bank statement to start tracking where your money goes.` |
| Error state | `Could not load spending data. Please try refreshing.` |
| Destructive confirmation | `Remove filter`: `Clear this filter and show all transactions for the current range.` |

Additional copy contract for Phase 05:
- Section title becomes `Transactions`, never `Recent Transactions`.
- Single-month comparison copy should use plain-language context like `vs last month` and `vs Apr average`, not analyst jargon.
- Delta summaries should prefer short, scannable labels such as `Travel ↑ +80%`.
- Modal titles should name the slice directly, e.g. `Top Category Transactions`, `Largest Transactions`, `Subscriptions Transactions`.

---

## Layout And Interaction Contract

### Dashboard Shell
- Keep the existing page heading and top-level dashboard structure.
- Preserve the current high-level order:
  1. range controls
  2. top summary cards
  3. two-chart analytical row
  4. transactions section
- The dashboard remains the analysis home for this phase; no `View All` button or route-handoff dependency should be introduced.

### Time Range Controls
- Replace the current `This Month` preset button with a month navigator composed of left arrow, current month label, and right arrow.
- The month label must feel like a primary active control, not plain static text.
- The right arrow must be visibly disabled at the current month.
- Other presets (`Last 3 Months`, `Last 6 Months`, `This Year`, `Custom`) remain button-based and visually consistent with existing button variants.

### Top Cards
- Preserve a four-card desktop grid and a stacked mobile layout.
- Single-month mode:
  - first card is the large-value display card
  - remaining three cards are drill-down cards
- Multi-month/custom modes:
  - cards may change content, but should keep the same footprint and consistent card chrome
- Clickable cards must feel interactive through cursor, hover, and motion treatment, but should not look like generic buttons.

### Modal Overlays
- Card drill-downs use large in-page modal overlays, not route changes.
- Modal surface uses the existing white card language: white background, black 2px border, Neo Brutalism shadow.
- Overlay backdrop should use the existing dark overlay token and keep the dashboard visibly “behind” the modal.
- Motion should suggest continuity from card to modal:
  - fast scale/fade or position-linked expansion
  - no heavy cinematic animation
  - reduced-motion users should receive a near-instant transition

### Charts
- Single-month secondary chart becomes `Category Trends`, optimized for fast category delta scanning.
- Multi-month preset view swaps the donut for a category-comparison bar chart.
- Custom range keeps the category breakdown chart but uses adaptive granularity for the time-series chart.
- Charts must prioritize legibility over decoration:
  - concise axis labels
  - compact tooltip layout
  - visible active/selected state
  - no low-contrast annotations

### Transactions Section
- `Transactions` becomes a full embedded analysis block, not a preview card.
- Include:
  - search input
  - sortable `Date` and `Amount`
  - clear current-filter context
  - pagination at 10 items per page
- The donut-selected category filter chip moves into this section and lives near the controls, not at the page top.
- On desktop, transactions should use table layout.
- On mobile, transactions may collapse to stacked cards, but search, sorting, and pagination remain available.

### Motion
- Keep motion purposeful and limited:
  - card hover translation remains small and in line with current Neo Brutalism button/card behavior
  - modal transitions emphasize continuity
  - chart/data refreshes may use opacity transitions already present in the dashboard
- Avoid decorative motion unrelated to analysis tasks.

### Accessibility
- Disabled month navigation must be visibly and semantically disabled.
- Sortable headers must expose active sort direction clearly in both visuals and accessible labeling.
- Modal overlays must trap focus and restore focus to the invoking card when closed.
- Delta arrows must not be the sole indicator; text and/or numeric sign must also carry the meaning.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `button`, `card`, `dialog`, `input`, `table`, `badge`, `popover`, `calendar`, `select`, `sheet`, `tooltip` | not required |
| none | none | not applicable |

Contract:
- Phase 05 should extend existing local shadcn components before introducing any new third-party visual registry blocks.
- If a new registry block is proposed later, it must be reviewed against the existing Neo Brutalism tokens and copied into repo-owned components before use.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-09
