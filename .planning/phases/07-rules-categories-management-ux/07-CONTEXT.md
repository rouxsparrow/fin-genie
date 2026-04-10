# Phase 7: Rules & Categories Management UX - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve the existing admin-only rules and categories management pages so routine categorization maintenance is clearer, safer, and easier on desktop and mobile. This phase covers scanning rules/categories, safer recategorization, clearer dashboard-inclusion status, mobile action ergonomics, and narrowly scoped user-rule JSON import/export. It does not add transaction editing, category merging, rule archiving, or broader bulk rule lifecycle management beyond the import/export capability explicitly captured here.

</domain>

<decisions>
## Implementation Decisions

### Rules Scanning

- **D-01:** Split the rules page into clear `System Rules` and `User Rules` sections instead of presenting all rules as one undifferentiated list.
- **D-02:** Keep the top-to-bottom, first-match-wins rule order obvious for user rules.
- **D-03:** System rules must remain visibly locked/protected and visually distinct from user rules.
- **D-04:** User rule rows/cards should keep category visibility and match-type visibility easy to scan.

### Recategorization Safety

- **D-05:** Replace the current one-click `Re-categorize All` flow with a preview-first flow.
- **D-06:** The preview can be a simple summary showing how many transactions would change, plus a small sample of 5 rows.
- **D-07:** Each sample row should show transaction description, old category, and new category.
- **D-08:** The user confirms after seeing the preview before the recategorization updates are applied.
- **D-09:** The post-run result should still communicate updated and unchanged counts.

### Category Management

- **D-10:** Category rows must show dashboard inclusion status as always-visible text, for example `Included in stats` or `Excluded from stats`.
- **D-11:** Do not rely only on the current eye / eye-off icon and tooltip to communicate dashboard inclusion.
- **D-12:** System categories should continue to be visually protected, and the UI should make their protected status clear.
- **D-13:** Category create/edit validation should continue preventing empty and duplicate names, with clearer visible feedback where needed.

### Mobile Admin UX

- **D-14:** Keep rule and category actions visible on mobile cards rather than hiding them behind an overflow menu.
- **D-15:** Mobile layouts should preserve common maintenance actions such as edit, delete, reorder, and dashboard inclusion toggles without requiring hover.
- **D-16:** Mobile should remain clear even if action density increases; prefer stronger card structure and visible labels over hiding important controls.

### Rule Import/Export JSON

- **D-17:** Add JSON export/import for rules as part of this phase.
- **D-18:** Export and import user rules only; system rules are excluded and cannot be overwritten through JSON.
- **D-19:** JSON import/export should support a replace mode that replaces all existing user rules after a strong confirmation.
- **D-20:** Imported rules should match categories by category name rather than category ID so exported files remain portable.
- **D-21:** If the imported JSON references a category name that does not exist, the import flow should auto-create that category.
- **D-22:** Replace mode must be clearly presented as destructive for existing user rules before the user confirms.

### the agent's Discretion

- Exact visual styling for the split `System Rules` / `User Rules` sections.
- Exact wording for recategorization preview copy and confirmation text, as long as impact is clear.
- Exact JSON file shape, as long as it is documented enough for export/import round-tripping and uses category names rather than IDs.
- Exact mobile card layout and action button sizing, as long as key actions stay visible.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Sources

- `.planning/PROJECT.md` — milestone intent, admin-management UX focus, project constraints, and relevant decisions.
- `.planning/REQUIREMENTS.md` — Phase 7 requirements RULE-01 through RULE-04 and CATM-01 through CATM-04.
- `.planning/ROADMAP.md` — Phase 7 goal and success criteria.
- `.planning/phases/05-dashboard-analysis-enhancements/05-CONTEXT.md` — dashboard inclusion and analytics context affected by category `exclude_from_stats`.

### Existing Rules Implementation

- `src/app/(authenticated)/rules/page.tsx` — rules page data loading and admin-only routing.
- `src/components/rules/rules-table.tsx` — current rules table, mobile cards, add/edit/delete/reorder behavior, and recategorize action placement.
- `src/components/rules/rule-row.tsx` — current desktop rule row, system-rule lock treatment, and inline edit integration.
- `src/components/rules/rule-edit-form.tsx` — current rule create/edit validation and form controls.
- `src/components/rules/recategorize-button.tsx` — current one-click recategorization entry point.
- `src/app/actions/rule-actions.ts` — rule CRUD, reorder, restore, and recategorization server actions.

### Existing Categories Implementation

- `src/app/(authenticated)/categories/page.tsx` — categories page data loading and admin-only routing.
- `src/components/categories/categories-list.tsx` — current category list, add/rename/delete, undo, and dashboard inclusion toggle state management.
- `src/components/categories/category-item.tsx` — current row actions, system lock treatment, and eye/eye-off inclusion toggle UI.
- `src/app/actions/category-actions.ts` — category CRUD, restore, and `exclude_from_stats` server action behavior.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/rules/rules-table.tsx`: Already owns local rule state, add/edit/delete/reorder flows, and desktop/mobile rendering. This is the main integration point for sectioning system and user rules.
- `src/components/rules/rule-row.tsx`: Already displays locked system rules and user-rule action buttons; can be adapted for clearer hierarchy and category/match-type scanability.
- `src/components/rules/rule-edit-form.tsx`: Existing validation and form controls can be reused for create/edit polish.
- `src/components/rules/recategorize-button.tsx`: Current button can evolve into a preview-confirm flow or be replaced by a richer recategorization component.
- `src/app/actions/rule-actions.ts`: Existing `recategorizeAll` logic already computes changed vs unchanged transactions and can inform preview/apply separation.
- `src/components/categories/categories-list.tsx` and `src/components/categories/category-item.tsx`: Existing category state, optimistic updates, and inclusion toggle behavior can be expanded to show always-visible inclusion status.
- `src/app/actions/category-actions.ts`: Existing category creation and uniqueness checks can support auto-creating categories during rule JSON import.

### Established Patterns

- Admin-only access is enforced at the page level for `/rules` and `/categories` and again in server actions through `verifyAdmin`.
- System rules and system categories are protected in server actions and visually locked in the UI.
- Current UI uses inline edit flows, optimistic updates, toast feedback, and undo affordances for delete/restore.
- The app uses Neo Brutalism shadcn-style primitives, visible borders, and action buttons rather than hidden hover-only interactions on mobile.

### Integration Points

- Rule import/export likely belongs on the rules page action bar near `Add Rule` and `Re-categorize All`.
- Recategorization preview needs a server-side way to compute proposed category changes without applying them, then a separate apply step after confirmation.
- JSON import must coordinate rule creation/replacement with category lookup and auto-creation by category name.
- Category dashboard inclusion status must stay aligned with analytics behavior that excludes `exclude_from_stats` categories from dashboard stats.

</code_context>

<specifics>
## Specific Ideas

- Rule hierarchy should explicitly separate `System Rules` and `User Rules`.
- Recategorization preview can stay simple: `N transactions will change` plus 5 examples showing description, old category, and new category.
- Category inclusion should be readable at a glance, not hidden behind an icon-only affordance.
- Mobile admin actions should stay visible because hover is unavailable and these pages are maintenance tools.
- Rule import/export should be portable across environments by using category names instead of category IDs.
- Import replace mode is allowed, but it needs strong confirmation because it replaces all existing user rules.

</specifics>

<deferred>
## Deferred Ideas

- Direct transaction recategorization from the transactions page remains deferred as TXNS-05.
- Saved transaction filter presets remain deferred as TXNS-06.
- Bulk enable/disable/archive rules remains deferred as RULE-05.
- Category merging remains deferred as CATM-05.

</deferred>

---

_Phase: 07-rules-categories-management-ux_
_Context gathered: 2026-04-10_
