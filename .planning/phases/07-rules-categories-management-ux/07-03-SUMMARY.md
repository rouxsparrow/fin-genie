---
phase: 07-rules-categories-management-ux
plan: 03
subsystem: server-actions
tags: [rules, json, zod, supabase]
requires: []
provides:
  - Rule import/export JSON schema
  - Recategorization preview/apply server actions
  - User-rule-only export and replace import
affects: [rules, categories, import]
tech-stack:
  added: []
  patterns: [preflight validation before destructive replace, category-name import matching]
key-files:
  created:
    - src/lib/rules/rule-import-export.ts
  modified:
    - src/app/actions/rule-actions.ts
key-decisions:
  - "Rule export/import uses category names instead of ids and never exports database identifiers."
  - "Replace import validates payload and regexes, creates missing categories, and only then deletes user rules."
patterns-established:
  - "Preview recategorization reuses the same evaluation plan as apply without writing transactions."
requirements-completed: [RULE-02, RULE-03, RULE-04]
duration: 2026-04-10 session
completed: 2026-04-10
---

# Plan 07-03 Summary

**Rules server actions now support safe preview/apply recategorization plus user-rule-only JSON export and replace import.**

## Accomplishments

- Added `ruleExportV1Schema`, `REPLACE_RULES_CONFIRMATION`, category-name normalization, and regex validation helpers.
- Split recategorization into `previewRecategorization`, `applyRecategorization`, and backward-compatible `recategorizeAll`.
- Added `exportUserRules` and `importUserRules` with replace-mode confirmation, user-rule-only scope, missing-category creation, and post-import refetch.

## Task Commits

- `3f4ad10` feat(07): improve rules and categories management

## Verification

- `npx tsc --noEmit`
- `npm run lint` exits 0 with pre-existing warnings only.
- Acceptance `rg` checks for schema exports, absence of DB identifier strings in the JSON contract file, and server action exports passed.

## Deviations from Plan

- Normalized Supabase joined category results before returning imported rules to the client so UI state remains `{ categories: { name } }`.

## User Setup Required

None.
