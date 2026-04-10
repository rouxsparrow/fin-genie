# Phase 07: Rules & Categories Management UX - Research

**Researched:** 2026-04-10 [VERIFIED: system date]
**Domain:** Next.js App Router admin UX, Supabase-backed rules/categories server actions, JSON import/export [VERIFIED: codebase grep]
**Confidence:** HIGH for codebase shape, MEDIUM for exact import/replace implementation until planner chooses atomicity approach [VERIFIED: codebase grep]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Split the rules page into clear `System Rules` and `User Rules` sections instead of presenting all rules as one undifferentiated list.
- **D-02:** Keep the top-to-bottom, first-match-wins rule order obvious for user rules.
- **D-03:** System rules must remain visibly locked/protected and visually distinct from user rules.
- **D-04:** User rule rows/cards should keep category visibility and match-type visibility easy to scan.
- **D-05:** Replace the current one-click `Re-categorize All` flow with a preview-first flow.
- **D-06:** The preview can be a simple summary showing how many transactions would change, plus a small sample of 5 rows.
- **D-07:** Each sample row should show transaction description, old category, and new category.
- **D-08:** The user confirms after seeing the preview before the recategorization updates are applied.
- **D-09:** The post-run result should still communicate updated and unchanged counts.
- **D-10:** Category rows must show dashboard inclusion status as always-visible text, for example `Included in stats` or `Excluded from stats`.
- **D-11:** Do not rely only on the current eye / eye-off icon and tooltip to communicate dashboard inclusion.
- **D-12:** System categories should continue to be visually protected, and the UI should make their protected status clear.
- **D-13:** Category create/edit validation should continue preventing empty and duplicate names, with clearer visible feedback where needed.
- **D-14:** Keep rule and category actions visible on mobile cards rather than hiding them behind an overflow menu.
- **D-15:** Mobile layouts should preserve common maintenance actions such as edit, delete, reorder, and dashboard inclusion toggles without requiring hover.
- **D-16:** Mobile should remain clear even if action density increases; prefer stronger card structure and visible labels over hiding important controls.
- **D-17:** Add JSON export/import for rules as part of this phase.
- **D-18:** Export and import user rules only; system rules are excluded and cannot be overwritten through JSON.
- **D-19:** JSON import/export should support a replace mode that replaces all existing user rules after a strong confirmation.
- **D-20:** Imported rules should match categories by category name rather than category ID so exported files remain portable.
- **D-21:** If the imported JSON references a category name that does not exist, the import flow should auto-create that category.
- **D-22:** Replace mode must be clearly presented as destructive for existing user rules before the user confirms.

### Claude's Discretion

- Exact visual styling for the split `System Rules` / `User Rules` sections.
- Exact wording for recategorization preview copy and confirmation text, as long as impact is clear.
- Exact JSON file shape, as long as it is documented enough for export/import round-tripping and uses category names rather than IDs.
- Exact mobile card layout and action button sizing, as long as key actions stay visible.

### Deferred Ideas (OUT OF SCOPE)

- Direct transaction recategorization from the transactions page remains deferred as TXNS-05.
- Saved transaction filter presets remain deferred as TXNS-06.
- Bulk enable/disable/archive rules remains deferred as RULE-05.
- Category merging remains deferred as CATM-05.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RULE-01 | Admin can scan rules more easily with clearer hierarchy, system-rule treatment, and category visibility. | Split `RulesTable` rendering into system/user sections while preserving `RuleRow` category and match-type columns/cards. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| RULE-02 | Admin can create or edit rules with less friction and better validation feedback before saving. | Extend `RuleEditForm` visible error patterns and server-side Zod checks; reuse `RuleCreationPopover` label/error ideas where helpful. [VERIFIED: codebase grep] |
| RULE-03 | Admin can understand rule ordering and recategorization impact before broad changes. | Split `recategorizeAll` into preview/apply actions that reuse `evaluateRules`, return five sample changes, then apply grouped updates after confirmation. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| RULE-04 | Admin can complete common rule-management actions on desktop and mobile without losing context. | Keep visible mobile card actions and avoid overflow-only controls; current rules mobile cards already expose reorder/edit/delete buttons. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| CATM-01 | Admin can scan categories more easily with clearer status for system categories and dashboard inclusion. | Add always-visible status text to `CategoryItem` and preserve system lock treatment. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| CATM-02 | Admin can create, rename, and maintain categories with immediate validation and helpful empty/error states. | Keep existing empty/duplicate validation in `CategoriesList` and `CategoryItem`, but surface clearer inline feedback for server failures where needed. [VERIFIED: codebase grep] |
| CATM-03 | Admin can understand which categories are excluded from dashboard stats and change that setting confidently. | Show `Included in stats` / `Excluded from stats` text next to the existing toggle; analytics already excludes `is_system` or `exclude_from_stats` categories. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| CATM-04 | Admin can manage categories on smaller screens without losing essential controls or explanations. | Remove hover-only dependency from category actions and make action/status text layout stable on mobile. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
</phase_requirements>

## Summary

Phase 07 should be planned as a focused enhancement of existing admin-only pages, not a new data model or new package phase. [VERIFIED: CONTEXT.md] The existing implementation already has admin page gating, server-action authorization, Zod validation, optimistic client state, shadcn-style UI primitives, mobile card layouts, toasts, and system row protections. [VERIFIED: codebase grep]

The highest-risk work is JSON replace-mode import because it is destructive and category-name-based. [VERIFIED: CONTEXT.md] The planner should require a strict server-side Zod schema, preflight validation, category lookup/create by household, user-rule-only deletion, and clear confirmation before replacement. [VERIFIED: codebase grep] [VERIFIED: npm registry]

**Primary recommendation:** Keep the phase in the existing stack: add small focused client components under `src/components/rules/`, extend `src/app/actions/rule-actions.ts` for preview/import/export operations, and only touch category UI/actions where status text or validation feedback requires it. [VERIFIED: codebase grep]

## Project Constraints (from CLAUDE.md)

- Hosting is Vercel, with serverless functions for PDF parsing and edge runtime for UI. [VERIFIED: CLAUDE.md]
- Database is Supabase Postgres with built-in Auth and RLS. [VERIFIED: CLAUDE.md]
- UI framework is Next.js App Router with shadcn/ui and a Neo Brutalism theme. [VERIFIED: CLAUDE.md]
- Auth is Supabase Auth with email/password provider. [VERIFIED: CLAUDE.md]
- Currency is SGD only in v1, though this phase does not change money formatting. [VERIFIED: CLAUDE.md]
- Follow existing patterns found in the codebase because project conventions are not separately established. [VERIFIED: CLAUDE.md]
- Do not make direct repo edits outside a GSD workflow; this research file is part of the active GSD research workflow. [VERIFIED: CLAUDE.md]
- No project-local skills were found under `.claude/skills/` or `.agents/skills/`. [VERIFIED: codebase grep]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 installed; npm latest is 16.2.3 | App Router pages and server actions | Use the installed project version and existing server-action pattern; do not upgrade in this phase. [VERIFIED: npm list] [VERIFIED: npm registry] |
| React | 19.1.0 installed; npm latest is 19.2.5 | Client state and interactive admin components | Existing components use client state and server actions; no new state library is needed. [VERIFIED: npm list] [VERIFIED: codebase grep] |
| Zod | 3.25.76 installed; npm latest is 4.3.6 | Server-action input schemas and JSON import validation | Existing actions use Zod v3; stay on v3 unless a separate dependency upgrade is planned. [VERIFIED: npm list] [VERIFIED: npm registry] [VERIFIED: codebase grep] |
| @radix-ui/react-dialog via local `Dialog` wrapper | 1.1.15 installed and npm latest | Recategorization preview and import replace confirmation dialogs | Existing `Dialog` wrapper is present and used for destructive confirmation elsewhere. [VERIFIED: npm list] [VERIFIED: npm registry] [VERIFIED: codebase grep] |
| sonner | 2.0.7 installed and npm latest | Success/error toasts | Existing rules/categories flows already use Sonner. [VERIFIED: npm list] [VERIFIED: npm registry] [VERIFIED: codebase grep] |

### Supporting

| Library/API | Version | Purpose | When to Use |
|-------------|---------|---------|-------------|
| Browser `Blob`, `URL.createObjectURL`, file input/FileReader APIs | Browser built-ins | User-rule JSON export/download and import file reading | Use inside a client component; no package is needed for small JSON files. [ASSUMED] |
| Supabase JS client/server helpers | `@supabase/supabase-js` 2.101.1 and `@supabase/ssr` 0.10.0 in package.json | Database access, auth, household scoping | Use existing `createClient` helper in server actions. [VERIFIED: package.json] [VERIFIED: codebase grep] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local `Dialog` wrapper | Browser `confirm()` | Browser confirm is harder to style, less consistent with existing destructive flows, and cannot show the required preview table well. [VERIFIED: codebase grep] |
| Zod schema | Manual JSON property checks | Manual checks increase import edge-case risk; server actions already standardize on Zod. [VERIFIED: codebase grep] |
| Existing React local state | Zustand/global store | The affected pages already keep local optimistic state and do not need app-wide state. [VERIFIED: codebase grep] |

**Installation:**
```bash
# No new packages recommended for this phase. [VERIFIED: package.json]
```

**Version verification:** `npm list next react zod @radix-ui/react-dialog sonner --depth=0` verified installed versions; `npm view next react zod @radix-ui/react-dialog sonner version` verified registry latest versions on 2026-04-10. [VERIFIED: npm list] [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

```text
src/app/(authenticated)/rules/page.tsx        # Keep admin gating and data loading. [VERIFIED: codebase grep]
src/app/actions/rule-actions.ts              # Add preview/apply import/export server actions. [VERIFIED: codebase grep]
src/components/rules/rules-table.tsx         # Own split sections, local state, import/export entry points. [VERIFIED: codebase grep]
src/components/rules/rule-row.tsx            # Keep desktop row rendering and inline edit integration. [VERIFIED: codebase grep]
src/components/rules/rule-card.tsx           # Optional extraction if mobile split sections make rules-table too large. [ASSUMED]
src/components/rules/recategorize-button.tsx # Convert to preview-first dialog component. [VERIFIED: codebase grep]
src/components/rules/rule-import-export.tsx  # Recommended focused component for JSON file UX. [ASSUMED]
src/app/(authenticated)/categories/page.tsx  # Keep admin gating and data loading. [VERIFIED: codebase grep]
src/components/categories/categories-list.tsx # Keep category state and validation. [VERIFIED: codebase grep]
src/components/categories/category-item.tsx  # Add visible inclusion/system status and mobile action clarity. [VERIFIED: codebase grep]
```

### Pattern 1: Split Rules by Role, Reuse Row/Card Logic

**What:** Render `System Rules` and `User Rules` as separate sections derived from the same `rules` state; only user rules should participate in reorder/add/delete/import/export. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]

**When to use:** Use this inside `RulesTable`, because that component already owns local rule state, add/edit/delete/reorder handlers, first/last user-rule calculation, and desktop/mobile rendering. [VERIFIED: codebase grep]

**Example:**
```tsx
// Source: src/components/rules/rules-table.tsx, adapted pattern. [VERIFIED: codebase grep]
const systemRules = rules.filter((rule) => rule.is_system);
const userRules = rules.filter((rule) => !rule.is_system);
```

### Pattern 2: Preview Then Apply Recategorization

**What:** Add a preview server action that fetches rules and transactions, calls `evaluateRules`, compares old and new categories, and returns `{ changed, unchanged, sample: firstFive }` without writing. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]

**When to use:** Use before the current grouped update logic in `recategorizeAll`; keep apply as a second explicit action after dialog confirmation. [VERIFIED: codebase grep]

**Example:**
```ts
// Source: src/app/actions/rule-actions.ts and src/lib/rules/evaluate-rules.ts, adapted pattern. [VERIFIED: codebase grep]
const categoryMap = evaluateRules(txLikes, rules);
const nextCategoryId = categoryMap.get(tx.id) ?? null;
if (nextCategoryId !== (tx.category_id ?? null)) {
  changes.push({ id: tx.id, description: tx.description, oldCategory, newCategory });
}
```

### Pattern 3: Import JSON as a Server-Validated Command

**What:** Read the selected file in the browser, parse JSON, submit the parsed payload to a server action that validates shape with Zod and applies household/admin protections. [VERIFIED: codebase grep] [ASSUMED]

**When to use:** Use for user-rule-only import because client-side validation is helpful for feedback but cannot enforce admin, household, system-rule, or category creation rules. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]

**Recommended payload:**
```ts
// Source: phase decisions; shape chosen for round-tripping and category-name portability. [VERIFIED: CONTEXT.md]
type RuleExportV1 = {
  version: 1;
  exportedAt: string;
  rules: Array<{
    pattern: string;
    matchType: 'substring' | 'regex';
    categoryName: string;
    sortOrder: number;
  }>;
};
```

### Anti-Patterns to Avoid

- **Import by `category_id`:** IDs are environment-specific; locked decision requires matching by category name. [VERIFIED: CONTEXT.md]
- **Delete existing user rules before full import validation:** Replace mode is destructive, and partial validation failure after deletion would lose user rules. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]
- **Rely on tooltips or hover for category inclusion status:** Locked decision requires always-visible text and mobile controls cannot depend on hover. [VERIFIED: CONTEXT.md]
- **Let import touch system rules:** System rules are protected in UI, server actions, and a database trigger; import/export scope must be user rules only. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rule matching | A second matching engine for preview | Existing `evaluateRules` | Keeps preview/apply/import review consistent with imports and first-match-wins behavior. [VERIFIED: codebase grep] |
| JSON validation | Ad hoc property checks | Zod v3 schemas in server actions | Existing action pattern already uses Zod for rule/category inputs. [VERIFIED: codebase grep] |
| Modal focus/escape/overlay behavior | Custom modal divs | Existing `Dialog` wrapper | Existing Radix Dialog wrapper is available and used for confirmation UI. [VERIFIED: codebase grep] |
| Toast plumbing | New notification mechanism | Existing Sonner toasts | Existing rules/categories flows already use Sonner. [VERIFIED: codebase grep] |
| Global state | Zustand/Jotai | Local React state | Current pages keep scoped state inside table/list components. [VERIFIED: codebase grep] |

**Key insight:** The hard part is not rendering more buttons; it is keeping preview/apply/import behavior aligned with first-match-wins rules, system protections, household scoping, and destructive replace semantics. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]

## Common Pitfalls

### Pitfall 1: Preview and Apply Drift

**What goes wrong:** Preview reports one set of changes, but apply recalculates against changed rules/transactions and returns a different outcome. [ASSUMED]
**Why it happens:** Preview and apply are separate requests, and the current code fetches live rules/transactions in the action. [VERIFIED: codebase grep]
**How to avoid:** Recompute on apply and display final updated/unchanged counts; optionally include copy that preview is based on current rules at preview time. [VERIFIED: CONTEXT.md] [ASSUMED]
**Warning signs:** Preview sample and final counts disagree without explanation. [ASSUMED]

### Pitfall 2: Category Name Matching Is Case-Sensitive Today

**What goes wrong:** Import auto-creates `food` even though `Food` exists. [ASSUMED]
**Why it happens:** Current category duplicate checks compare exact names on the server, while some client checks use lowercase comparison. [VERIFIED: codebase grep]
**How to avoid:** In the import server action, normalize category names for matching within the imported payload and fetched categories before deciding to create missing categories. [VERIFIED: CONTEXT.md] [ASSUMED]
**Warning signs:** Imported files produce near-duplicate categories differing only by case or whitespace. [ASSUMED]

### Pitfall 3: Replace Mode Partial Failure

**What goes wrong:** Existing user rules are deleted, then category creation or insert fails. [ASSUMED]
**Why it happens:** The existing server actions use sequential Supabase calls rather than a Postgres transaction wrapper. [VERIFIED: codebase grep]
**How to avoid:** Plan a preflight phase before deletion; for strongest safety, use a database RPC/migration for atomic replace or design the action to create/validate categories first, then delete user rules, then insert rules. [ASSUMED] [VERIFIED: codebase grep]
**Warning signs:** Replace mode action mixes deletion and validation in one loop. [ASSUMED]

### Pitfall 4: Category Status Text Causes Mobile Overflow

**What goes wrong:** Always-visible labels plus buttons crowd the 12px/phone layout. [ASSUMED]
**Why it happens:** Current `CategoryItem` is a single `h-12` row with actions appearing on hover for desktop and visible on mobile. [VERIFIED: codebase grep]
**How to avoid:** Let category rows become multi-line cards/rows on small screens and preserve visible labels/actions rather than forcing one fixed-height row. [VERIFIED: CONTEXT.md] [ASSUMED]
**Warning signs:** Text truncates or action buttons wrap unpredictably. [ASSUMED]

## Code Examples

### Existing Server Action Guard Pattern

```ts
// Source: src/app/actions/rule-actions.ts and src/app/actions/category-actions.ts. [VERIFIED: codebase grep]
const auth = await verifyAdmin();
if (!auth.authorized) {
  return { success: false as const, error: auth.error };
}
```

### Existing Rule Evaluation Contract

```ts
// Source: src/lib/rules/evaluate-rules.ts. [VERIFIED: codebase grep]
export function evaluateRules(
  transactions: TransactionLike[],
  rules: RuleLike[],
): Map<string, string> {
  // Rules MUST be pre-sorted by sort_order ascending. [VERIFIED: codebase grep]
}
```

### Existing Category Inclusion Toggle Contract

```ts
// Source: src/app/actions/category-actions.ts. [VERIFIED: codebase grep]
await supabase
  .from('categories')
  .update({ exclude_from_stats: parsed.data.excludeFromStats })
  .eq('id', parsed.data.id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tooltip/icon-only inclusion status | Always-visible status text plus toggle | Phase 07 locked decision on 2026-04-10 | Planner must include UI text changes, not just icon swaps. [VERIFIED: CONTEXT.md] |
| One-click recategorize | Preview-first, confirm, then apply | Phase 07 locked decision on 2026-04-10 | Planner must split current `recategorizeAll` flow. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| User/system rules mixed in one list | Separate `System Rules` and `User Rules` sections | Phase 07 locked decision on 2026-04-10 | Planner must revise table/card structure. [VERIFIED: CONTEXT.md] |
| No JSON import/export precedent | User-rule-only portable JSON using category names | Phase 07 locked decision on 2026-04-10 | Planner must add new UI and server action coverage. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |

**Deprecated/outdated:**
- The current one-click `Re-categorize All` button is outdated for this phase because locked decisions require preview and confirmation. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]
- Hover-only category action visibility is outdated for this phase because locked decisions require mobile-visible controls and always-visible inclusion status. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Browser `Blob`, `URL.createObjectURL`, and FileReader/file input APIs are sufficient for small JSON export/import files. | Standard Stack | If wrong, planner may need a small client file utility or package. |
| A2 | `rule-card.tsx` and `rule-import-export.tsx` are useful optional extractions. | Architecture Patterns | If wrong, planner can keep logic inside `rules-table.tsx`; behavior is unaffected. |
| A3 | Preview/apply drift is possible between separate requests. | Common Pitfalls | If wrong, warning is conservative; if right, planner should account for final count messaging. |
| A4 | Import matching should normalize case/whitespace to avoid near-duplicate categories. | Common Pitfalls | If product wants exact case-sensitive category names, planner should keep exact matching. |
| A5 | Strongest replace safety may require a database RPC/migration for atomicity. | Common Pitfalls | If planner avoids migrations, it should at least preflight all inputs before deleting user rules. |

## Open Questions

1. **Should replace-mode import be atomic via Postgres RPC?**
   - What we know: Existing server actions perform sequential Supabase calls, and replace mode is destructive. [VERIFIED: codebase grep] [VERIFIED: CONTEXT.md]
   - What's unclear: Whether the phase should add a migration/RPC solely to make import replace atomic. [ASSUMED]
   - Recommendation: Planner should either schedule an RPC-backed replace action or explicitly schedule full preflight validation before any delete. [ASSUMED]

2. **Should category name matching be exact or normalized?**
   - What we know: Locked decision says match by category name, not ID. [VERIFIED: CONTEXT.md]
   - What's unclear: Whether `Food` and `food` should be treated as the same category for import. [ASSUMED]
   - Recommendation: Normalize trim/lowercase for matching, but preserve the original existing category display name. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Local lint/build/typecheck | Yes | v24.13.0 | Use project-supported Node if Next tooling rejects v24. [VERIFIED: command output] |
| npm | Dependency scripts and registry checks | Yes | 11.6.2 | None needed. [VERIFIED: command output] |
| TypeScript compiler | Type verification | Yes | 5.9.3 via `npx tsc --version` | `npm run lint` still exists if no typecheck script is added. [VERIFIED: command output] [VERIFIED: package.json] |
| Supabase service | Runtime server actions | Not probed | Hosted/project env dependency | Planner should not require local Supabase for pure UI refactors; action integration needs app env. [ASSUMED] |

**Missing dependencies with no fallback:**
- None found for research/planning. [VERIFIED: command output]

**Missing dependencies with fallback:**
- Local Supabase was not probed; UI-only work can be planned without it, but end-to-end import/replace and recategorization validation needs configured app environment. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Keep page-level Supabase user checks and server-action `verifyAdmin` checks. [VERIFIED: codebase grep] |
| V3 Session Management | yes | Use existing Supabase SSR auth flow; this phase should not change sessions. [VERIFIED: CLAUDE.md] [VERIFIED: codebase grep] |
| V4 Access Control | yes | Keep user-rule-only import/export and block system-rule mutation in server actions. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| V5 Input Validation | yes | Validate JSON import payloads and form inputs with Zod/server checks. [VERIFIED: codebase grep] |
| V6 Cryptography | no direct change | Do not add crypto for JSON export/import. [ASSUMED] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized rule/category mutation | Elevation of Privilege | Keep `verifyAdmin` in every new server action and continue household-scoped queries. [VERIFIED: codebase grep] |
| Import overwrites system rules | Tampering | Export/import only `.eq('is_system', false)` records and validate schema excludes system fields. [VERIFIED: CONTEXT.md] [VERIFIED: codebase grep] |
| Malformed or huge JSON import | Denial of Service | Use Zod schema with sane array/string limits before DB writes. [VERIFIED: codebase grep] [ASSUMED] |
| Regex import with invalid pattern | Tampering/Availability | Validate regex patterns before insert, mirroring `RuleEditForm` behavior. [VERIFIED: codebase grep] |
| Category duplication by case/whitespace | Integrity | Normalize import category matching before auto-create. [ASSUMED] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/07-rules-categories-management-ux/07-CONTEXT.md` - locked decisions and deferred scope. [VERIFIED: provided file]
- `.planning/REQUIREMENTS.md` - Phase 07 requirement IDs and descriptions. [VERIFIED: provided file]
- `.planning/ROADMAP.md` - Phase 07 goal and success criteria. [VERIFIED: provided file]
- `.planning/STATE.md` - current milestone/project state and Phase 07 alignment note. [VERIFIED: provided file]
- `CLAUDE.md` - project constraints, stack, and GSD workflow directives. [VERIFIED: codebase grep]
- `src/app/(authenticated)/rules/page.tsx` - current rules page admin gating and data loading. [VERIFIED: codebase grep]
- `src/components/rules/rules-table.tsx` - current rule state, mobile/desktop rendering, reorder/delete/add flows. [VERIFIED: codebase grep]
- `src/components/rules/rule-row.tsx` - current desktop row and system lock treatment. [VERIFIED: codebase grep]
- `src/components/rules/rule-edit-form.tsx` - current client validation and form controls. [VERIFIED: codebase grep]
- `src/components/rules/recategorize-button.tsx` - current one-click recategorization. [VERIFIED: codebase grep]
- `src/app/actions/rule-actions.ts` - server action guards, CRUD/reorder, and recategorization logic. [VERIFIED: codebase grep]
- `src/app/(authenticated)/categories/page.tsx` - current categories page admin gating and data loading. [VERIFIED: codebase grep]
- `src/components/categories/categories-list.tsx` - category state, add/edit/delete/undo/toggle flows. [VERIFIED: codebase grep]
- `src/components/categories/category-item.tsx` - current category row actions, lock, and eye/eye-off tooltip UI. [VERIFIED: codebase grep]
- `src/app/actions/category-actions.ts` - category server actions and `exclude_from_stats` behavior. [VERIFIED: codebase grep]
- `src/lib/rules/evaluate-rules.ts` and `src/lib/rules/evaluate-rules.test.ts` - first-match-wins evaluation behavior and tests. [VERIFIED: codebase grep]
- `src/lib/types/database.ts` and Supabase migrations `00001`, `00007`, `00009` - database contract for rules/categories/transactions and system/exclusion flags. [VERIFIED: codebase grep]
- `package.json`, `npm list`, and `npm view` - installed/current package versions. [VERIFIED: package.json] [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- `.planning/phases/05-dashboard-analysis-enhancements/05-CONTEXT.md` - prior analytics context that excluded/system categories must remain respected. [VERIFIED: codebase grep]

### Tertiary (LOW confidence)

- None. [VERIFIED: researcher review]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommended libraries are already installed or built into the browser; no new package is recommended. [VERIFIED: package.json] [VERIFIED: npm registry]
- Architecture: HIGH - recommendations map directly to current files and handlers. [VERIFIED: codebase grep]
- Pitfalls: MEDIUM - destructive import/atomicity and category normalization require implementation decisions. [VERIFIED: CONTEXT.md] [ASSUMED]

**Research date:** 2026-04-10 [VERIFIED: system date]
**Valid until:** 2026-05-10 for codebase-specific planning, or earlier if Phase 06 changes shared filters/rules/categories surfaces. [ASSUMED]
