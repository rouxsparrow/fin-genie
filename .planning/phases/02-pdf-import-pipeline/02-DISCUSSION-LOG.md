# Phase 2: PDF Import Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the Q&A for reference.

**Date:** 2026-04-07
**Phase:** 02-pdf-import-pipeline
**Mode:** discuss (interactive)
**Areas discussed:** Upload experience, Review screen layout, Import history & gap tracking, Parser config & error handling

## Upload Experience

| Question | Options | Selected |
|----------|---------|----------|
| How should the PDF upload zone look and behave? | Full-page drop zone / Compact upload card / You decide | Full-page drop zone |
| What should happen during PDF parsing after upload? | Inline progress / Navigate to review / You decide | Inline progress |
| Should the upload accept multiple PDFs at once? | Single file only / Multiple files | Single file only |
| What file validation feedback should the drop zone provide? | Strict with toast / Gentle inline / You decide | Strict with toast |
| After successful parse, should the drop zone stay visible or collapse? | Collapse to summary bar / Hide completely / You decide | Collapse to summary bar |

## Review Screen Layout

| Question | Options | Selected |
|----------|---------|----------|
| How should parsed transactions be displayed? | Split sections / Single table with filter / You decide | Split sections |
| What columns should each transaction row show? | Essential / Detailed / You decide | Essential |
| How should the "Confirm Import" action work? | Bottom sticky bar / Top action bar / You decide | Bottom sticky bar |
| When a duplicate statement is detected, how to communicate? | Block with explanation / Warn but allow review / You decide | Warn but allow review |
| Summary header before the transaction table? | Yes — summary card / No — straight to table / You decide | Yes — summary card |
| On mobile, how should the review table transform? | Stacked cards / Horizontal scroll table | Stacked cards |

## Import History & Gap Tracking

| Question | Options | Selected |
|----------|---------|----------|
| How should import history be displayed? | Table list / Card grid / You decide | Table list |
| How should statement period gaps be highlighted? | Visual timeline bar / Warning banner / You decide | Visual timeline bar |
| Where should import history live in the app? | On the Import page / Separate history page | Separate history page |

## Parser Config & Error Handling

| Question | Options | Selected |
|----------|---------|----------|
| How should the JSON bank format config be structured? | Region-based with patterns / Template-based / You decide | Region-based with patterns |
| What should happen when PDF parsing fails? | Friendly error with details / Toast error only / You decide | Friendly error with details |
| Should the parser handle partial successes? | All or nothing / Partial with warning / You decide | All or nothing |
| Where should the bank format JSON config file live? | In codebase / In database / You decide | In database |
| Admin UI for bank format configs in v1? | No UI — seed only / Basic read-only view / You decide | Basic read-only view |
| How should cross-year date inference work? | Statement period context / Sequential assumption / You decide | Statement period context |
