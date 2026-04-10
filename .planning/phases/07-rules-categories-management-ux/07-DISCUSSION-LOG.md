# Phase 7: Rules & Categories Management UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10T09:16:06Z
**Phase:** 07-rules-categories-management-ux
**Areas discussed:** Rules Scanning, Recategorization Safety, Category Management, Mobile Admin UX, Rule Import/Export JSON

---

## Gray Areas Presented

The user selected areas `1,3,4,5` from the initial Phase 7 gray-area list and added a new request to discuss rule import/export using JSON files.

| Area                    | Description                                                                                                                                                        | Selected |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Rules Scanning          | How rules should be easier to read: grouping system vs user rules, clearer order hierarchy, category visibility, match-type labels, dense vs card-like layout.     | yes      |
| Rule Editing Flow       | How create/edit should feel: inline row editing vs modal/drawer, validation detail, regex guidance, category creation shortcuts, save/cancel behavior.             | no       |
| Recategorization Safety | What users should understand before/after `Re-categorize All`: confirmation, preview counts, changed/unchanged summary, warning copy, undo expectations.           | yes      |
| Category Management     | How categories should communicate system status and dashboard inclusion: visible included/excluded labels, safer delete messaging, edit/create flow, empty states. | yes      |
| Mobile Admin UX         | How rules/categories should work on small screens: actions always visible vs tucked behind menu, reordering ergonomics, compact cards, sticky action bars.         | yes      |
| Rule Import/Export JSON | User-added area: add rule JSON import/export.                                                                                                                      | yes      |

---

## Rules Scanning

| Option          | Description                                                                                                          | Selected |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Clear hierarchy | Separate `System Rules` and `User Rules`, keep top-to-bottom order obvious, and make protected rules visibly locked. | yes      |
| Fast scanning   | Keep one list/table, but improve density, category badges, match-type contrast, and visual order markers.            |          |
| Rule cards      | Move toward card-style rows with pattern, category, match type, and actions more visually separated.                 |          |

**User's choice:** Rules 1.
**Notes:** User wants clear hierarchy as the primary rules scanning improvement.

---

## Recategorization Safety

| Option           | Description                                                                                                                | Selected |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Confirm then run | Add a confirmation dialog explaining that all transactions will be re-evaluated, then show updated/unchanged counts after. |          |
| Preview first    | Before applying, show how many transactions would change and maybe a small sample, then user confirms.                     | yes      |
| Keep fast        | Keep one-click recategorize but improve the button copy, loading state, and success/error message.                         |          |

**User's choice:** Recategorize 2.
**Follow-up:** Is a simple summary enough, like `23 transactions will change`, plus 5 sample rows showing `description`, `old category`, `new category`?
**User's answer:** ok.

---

## Category Management

| Option                       | Description                                                                                 | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Always-visible status        | Each category row shows `Included in stats` or `Excluded from stats`, not just an eye icon. | yes      |
| Grouped sections             | Split categories into `Included`, `Excluded`, and `System`.                                 |          |
| Simple list plus explanation | Keep the current list but add better page-level helper text and tooltips.                   |          |

**User's choice:** Category 1.
**Notes:** Category dashboard inclusion should be visible without relying only on icon/tooltips.

---

## Mobile Admin UX

| Option                 | Description                                                               | Selected |
| ---------------------- | ------------------------------------------------------------------------- | -------- |
| Actions visible        | Keep edit/delete/toggle/reorder buttons visible on cards, no hidden menu. | yes      |
| Cleaner cards          | Put secondary actions behind a menu to reduce clutter.                    |          |
| Sticky primary actions | Keep add/recategorize controls easy to reach while scrolling.             |          |

**User's choice:** Mobile 1.
**Notes:** Mobile actions should remain visible.

---

## Rule Import/Export JSON

| Option                            | Description                                                                                              | Selected |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| Export only                       | Download current user rules as JSON for backup/reference.                                                |          |
| Import + export                   | Export user rules and import JSON to create/update rules.                                                |          |
| Import + export with replace mode | Allow importing either by adding/updating rules or replacing all existing user rules after confirmation. | yes      |

**User's choice:** Import 3.
**Follow-up:** Should export/import include user rules only and exclude system rules?
**User's answer:** user rules only.
**Follow-up:** Should import match categories by category name rather than category ID so the file is portable?
**User's answer:** ok.
**Follow-up:** If the import JSON references a category that does not exist yet, should import auto-create that category or block with a clear error?
**User's answer:** auto create category.

---

## the agent's Discretion

- Exact visual styling for split rules sections.
- Exact recategorization preview and confirmation copy.
- Exact JSON file schema, provided it uses category names, exports/imports user rules only, and supports replace mode.
- Exact mobile card/action layout, provided actions remain visible.

## Deferred Ideas

- Direct transaction recategorization from the transactions page remains deferred as TXNS-05.
- Saved transaction filter presets remain deferred as TXNS-06.
- Bulk enable/disable/archive rules remains deferred as RULE-05.
- Category merging remains deferred as CATM-05.
