# Phase 2: PDF Import Pipeline - Research

**Researched:** 2026-04-07
**Domain:** PDF parsing, file upload, config-driven text extraction, duplicate detection, import tracking
**Confidence:** HIGH

## Summary

Phase 2 builds the PDF import pipeline: admin uploads a Citibank SG credit card PDF, the system extracts transactions using a config-driven parser powered by `unpdf`, displays them in a review screen split by categorized/uncategorized, detects duplicates via transaction hashing, and tracks import history with statement period gap visualization.

The technical core is a generic parser function that reads a JSON bank format config from the database and applies it to per-page text extracted by `unpdf`. The upload flow sends the PDF as FormData to a Next.js server action (which can be configured for up to 4.5MB on Vercel -- sufficient for typical bank statements at 100KB-2MB). The parser runs entirely in a serverless function with zero native dependencies. Parsed transactions live in client state during review; only confirmed imports are persisted to the database.

**Primary recommendation:** Build the parser as a pure function `(pageTexts: string[], config: BankFormatConfig) => ParsedTransaction[]` that is fully testable without PDF extraction. The upload flow uses a server action with FormData (no Supabase Storage needed since PDFs are parsed and discarded per user decision). Bank format config is stored in a `bank_configs` database table and seeded via migration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full-page drop zone on the /import page -- large Neo Brutalism bordered area with dashed border, icon, "Drag PDF here or click to browse" text
- **D-02:** Single file upload only -- one PDF at a time. Bank statements are monthly so batching is not needed.
- **D-03:** Inline progress -- show spinner/skeleton on the same page after upload, then reveal parsed results. No page navigation during parsing.
- **D-04:** Drop zone collapses to a compact summary bar after successful parse: "statement.pdf -- 15 transactions parsed" with an "Upload another" link. Results take full focus.
- **D-05:** Strict file validation with toast -- only .pdf files, max 10MB. Reject with toast error ("Only PDF files are supported" / "File too large"). Drop zone border flashes red briefly.
- **D-06:** react-dropzone for drag-and-drop (already in dependencies from Phase 1 setup)
- **D-07:** Split sections -- "Categorized" (top, green accent) and "Uncategorized" (bottom, amber/warning accent). Each section has a count badge. Matches IMPT-04.
- **D-08:** Essential columns: Date, Description, Amount (SGD), Category (badge or "--" if uncategorized). Compact and scannable.
- **D-09:** Statement summary card at top of review screen: statement period (e.g., "1 Mar -- 31 Mar 2026"), total transactions, total debits, total credits.
- **D-10:** Bottom sticky bar for import action: "15 transactions ready -- [Import]" button. Always visible while scrolling. Button disabled until Phase 3's 100% categorization gate.
- **D-11:** Duplicate detection shows parsed transactions with duplicate rows highlighted/strikethrough. User sees what would be skipped but cannot import duplicates. Warning message explains overlap.
- **D-12:** Mobile: transactions transform to stacked cards (consistent with Phase 1 pattern D-34).
- **D-13:** Import history lives on a separate /import/history page -- linked from sidebar "Import" nav item or from the import page.
- **D-14:** Table list layout: File name, Statement period, Transaction count, Imported by, Date imported. Sorted newest first. Reuses Neo Brutalism Table component.
- **D-15:** Visual timeline bar at top of history page for statement period gaps (IMPT-07). Filled segments = imported months, empty/red segments = missing months. Compact horizontal visualization.
- **D-16:** Region-based JSON config with patterns -- config defines: bank name, statement layout markers (header row pattern, transaction row regex, amount format, date format, page boundaries). Generic parser reads config -- no bank-specific code.
- **D-17:** Bank format config stored in Supabase database (not in codebase). Citibank SG config seeded via migration. Enables future BANK-03 (add formats without code changes).
- **D-18:** Basic read-only config view on a settings sub-page -- admin can see configured bank formats as read-only. Useful for debugging. No editing UI in v1.
- **D-19:** Statement period context for cross-year date inference -- parser extracts statement period first (e.g., "1 Dec 2025 to 1 Jan 2026"), then infers year for each transaction date based on whether it falls within that range. Handles Dec-Jan rollover.
- **D-20:** Friendly error card on import page when parsing fails: "Could not parse this PDF" with specific reason (unsupported bank, no transactions found, corrupted file). Offer to try again.
- **D-21:** All-or-nothing parsing -- if any page fails to parse, reject the entire statement. No partial/corrupt data. User uploads a clean PDF.

### Claude's Discretion
- Exact layout spacing and padding for drop zone
- Spinner/skeleton animation during parsing
- Exact JSON config field names and schema
- Timeline bar visual design details
- Transaction hash algorithm for duplicate detection
- Amount parsing logic for Citibank SG credit notation (parentheses for credits)
- Multi-page concatenation and noise row filtering heuristics

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMPT-01 | Admin can upload Citibank SG credit card PDF statements | Upload flow via react-dropzone + server action FormData; unpdf for text extraction; admin-only access via verifyAdmin pattern |
| IMPT-02 | System parses transaction rows from PDF extracting date, description, amount, and debit/credit flag | Config-driven parser with regex patterns; per-page text extraction; credit detection via parentheses; amount stored as integer cents |
| IMPT-03 | Parser reads bank format definition from JSON config (config-driven, not hard-coded) | New `bank_configs` table with JSONB config column; Citibank SG config seeded via migration; generic parser reads config at runtime |
| IMPT-04 | Parsed transactions shown in review screen with categorized on top and uncategorized below | Split-section UI pattern; transactions held in client state; existing rules applied server-side during parse; categorized/uncategorized separation |
| IMPT-05 | Duplicate detection prevents re-importing same transactions via hash on date + description + amount | SHA-256 hash of `{date}|{description}|{amount_cents}|{is_debit}` computed during parsing; checked against existing transaction_hash UNIQUE index |
| IMPT-06 | Import history tracks which statements were imported, when, and transaction count | Existing `imports` table schema; /import/history page with Neo Brutalism table |
| IMPT-07 | Statement period tracking shows which months have data and highlights gaps | Visual timeline bar component; query imports table for statement_period_start/end; compute covered vs missing months |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

These directives from CLAUDE.md constrain implementation choices:

- **Hosting:** Vercel serverless -- 4.5MB request body limit, 250MB bundle limit, 2GB memory, 300s timeout (Hobby plan)
- **PDF parsing:** unpdf (not pdf-parse, not pdfjs-dist raw) -- zero native dependencies, serverless-optimized
- **Money handling:** Store as integer cents (`Math.round(parseFloat(amount) * 100)`), display with `Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })`
- **File upload:** react-dropzone for drag-and-drop
- **Validation:** Zod for server action input validation and schema validation
- **Date handling:** date-fns for date parsing and manipulation
- **UI:** shadcn/ui Neo Brutalism theme -- 13 components already available in `src/components/ui/`
- **Auth pattern:** Server-side `verifyAdmin()` for mutations; `useProfile` hook for client-side role display
- **Server actions pattern:** Established in `src/app/actions/user-management.ts` -- Zod validation, verifyAdmin, service role client when needed
- **RLS:** SECURITY DEFINER functions `is_admin()` and `get_my_household_id()` already in place
- **PDF storage:** Explicitly OUT OF SCOPE -- "Parse and discard. No Supabase Storage for originals" (REQUIREMENTS.md)
- **Next.js version:** 15.5.14 (pinned ~15.x, do not upgrade to 16)

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router, Server Actions, Route Handlers | Already installed [VERIFIED: package.json] |
| React | 19.1.0 | UI rendering | Already installed [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.101.1 | Database client | Already installed [VERIFIED: package.json] |
| @supabase/ssr | ^0.10.0 | Server-side auth | Already installed [VERIFIED: package.json] |
| zod | ^3.25.76 | Schema validation | Already installed [VERIFIED: package.json] |
| date-fns | ^4.1.0 | Date parsing/manipulation | Already installed [VERIFIED: package.json] |
| sonner | ^2.0.7 | Toast notifications | Already installed [VERIFIED: package.json] |
| lucide-react | ^1.7.0 | Icons | Already installed [VERIFIED: package.json] |

### New (to install for this phase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| unpdf | 1.4.0 | PDF text extraction in serverless | Zero dependencies, serverless-optimized PDF.js v5.4.394 bundle, per-page text arrays [VERIFIED: libraries.io/npm/unpdf -- v1.4.0 published Oct 31 2025] |
| react-dropzone | 15.x | Drag-and-drop file upload | Hook-based API (useDropzone), handles drag states, file type/size restrictions [CITED: CLAUDE.md recommends react-dropzone 15.x] |

### Not Needed
| Library | Reason |
|---------|--------|
| Supabase Storage SDK | PDFs are parsed and discarded, not stored (Out of Scope) |
| crypto-js / hash.js | Node.js `crypto.createHash` available in server actions natively |
| @tanstack/react-table | Review screen uses a simple table, not the full data table pattern; import history likewise. Phase 4 dashboard will need it for the transaction list. |

**Installation:**
```bash
npm install unpdf react-dropzone
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (authenticated)/
      import/
        page.tsx              # Upload page with drop zone + review screen
        history/
          page.tsx            # Import history with timeline bar
      settings/
        bank-configs/
          page.tsx            # Read-only bank config viewer (D-18)
    actions/
      import-actions.ts       # Server actions: parseStatement, importTransactions
  lib/
    parser/
      parse-statement.ts      # Generic config-driven parser (pure function)
      types.ts                # BankFormatConfig, ParsedTransaction types
      hash.ts                 # Transaction hash generation
    types/
      database.ts             # Updated with bank_configs table types
  components/
    import/
      drop-zone.tsx           # Full-page PDF drop zone (D-01)
      parse-progress.tsx      # Skeleton/spinner during parsing (D-03)
      review-screen.tsx       # Split categorized/uncategorized view (D-07)
      transaction-table.tsx   # Transaction rows for review (D-08)
      statement-summary.tsx   # Summary card with period/totals (D-09)
      import-bar.tsx          # Bottom sticky "Import" bar (D-10)
      duplicate-warning.tsx   # Duplicate detection overlay (D-11)
    history/
      import-history-table.tsx # Import history table (D-14)
      timeline-bar.tsx         # Statement period gap visualization (D-15)
supabase/
  migrations/
    00005_bank_configs.sql     # bank_configs table + Citibank SG seed data
```

### Pattern 1: Server Action with FormData for PDF Upload

**What:** Client sends PDF as FormData to a server action. Server action extracts text, applies bank format config, returns parsed transactions. PDF is never stored.

**When:** Admin uploads a PDF on the /import page.

**Why this approach (not Supabase Storage):** User decision explicitly excludes PDF file storage. Bank statements are typically 100KB-2MB. The Vercel serverless body limit is 4.5MB. For statements under 4.5MB (vast majority), direct FormData upload works. The `serverActions.bodySizeLimit` can be increased in `next.config.ts` to match. For the rare statement that might exceed 4.5MB, client-side validation at 4MB provides a safety margin.

**Important note on D-05 (10MB max):** The user's D-05 decision specifies 10MB max client validation. However, Vercel has a hard 4.5MB request body limit for serverless functions that cannot be overridden. The planner should reconcile this: either (a) lower the client-side max to 4.5MB with an appropriate error message, or (b) use a Route Handler with streaming if truly large PDFs are needed. Since typical Citibank SG statements are 100KB-2MB, option (a) is pragmatic. [ASSUMED]

```typescript
// next.config.ts -- increase server action body size limit
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Safely under Vercel's 4.5MB hard limit
    },
  },
};
```

```typescript
// Client: send PDF via FormData
'use client';
import { useDropzone } from 'react-dropzone';

function onDrop(acceptedFiles: File[]) {
  const file = acceptedFiles[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bankConfigId', selectedConfigId);

  // Call server action
  const result = await parseStatement(formData);
}
```

```typescript
// Server action: parse PDF
'use server';
import { extractText, getDocumentProxy } from 'unpdf';

export async function parseStatement(formData: FormData) {
  // 1. verifyAdmin()
  // 2. Extract File from FormData
  const file = formData.get('file') as File;
  const buffer = new Uint8Array(await file.arrayBuffer());

  // 3. Extract text with unpdf
  const pdf = await getDocumentProxy(buffer);
  const { text: pageTexts } = await extractText(pdf, { mergePages: false });

  // 4. Load bank config from database
  // 5. Run generic parser
  // 6. Return parsed transactions (not persisted yet)
}
```
[CITED: unpdf GitHub README -- extractText API, CITED: Next.js discussions -- FormData server action pattern]

### Pattern 2: Config-Driven PDF Parser (Pure Function)

**What:** A pure function that takes per-page text arrays and a bank format config, returns parsed transactions. No side effects, no database calls, fully testable.

**When:** Called by the parseStatement server action after text extraction.

**Why pure function:** Separation of concerns. The parser logic is independent of how text was extracted or where config comes from. Unit testable with hardcoded text inputs. New bank formats only need a new config row, not new code.

```typescript
// lib/parser/types.ts
export interface BankFormatConfig {
  name: string;                    // "Citibank SG Credit Card"
  statement_period: {
    pattern: string;               // Regex to find statement period text
    date_format: string;           // e.g., "dd/MM/yyyy" or "dd MMM yyyy"
  };
  transaction: {
    line_pattern: string;          // Regex with capture groups for date, desc, amount
    date_format: string;           // e.g., "dd MMM" (no year)
    credit_indicator: 'parentheses' | 'negative' | 'column';
    amount_pattern?: string;       // Optional regex for amount extraction
    description_continuation: boolean; // Multi-line descriptions
  };
  skip_patterns: string[];         // Lines to ignore (headers, subtotals, noise)
  section_markers?: {
    start?: string;                // Pattern marking start of transaction section
    end?: string;                  // Pattern marking end of transaction section
  };
}

export interface ParsedTransaction {
  date: string;            // ISO date string (YYYY-MM-DD)
  description: string;
  amountCents: number;     // Always positive, stored as integer cents
  isDebit: boolean;        // true = purchase, false = credit/refund
  hash: string;            // SHA-256 of date|description|amountCents|isDebit
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  statementPeriodStart: string;  // ISO date
  statementPeriodEnd: string;    // ISO date
  totalPages: number;
}
```

### Pattern 3: Transaction Hash for Duplicate Detection

**What:** Generate a deterministic hash for each transaction based on its core fields. Use the existing UNIQUE index on `transaction_hash` to detect duplicates.

**When:** During parsing (compute hash) and before import (check for existing hashes).

**Algorithm recommendation:** SHA-256 via Node.js `crypto` module (available in all serverless environments). Hash input: `{date}|{description}|{amountCents}|{isDebit}`. The pipe separator prevents field boundary ambiguity.

```typescript
// lib/parser/hash.ts
import { createHash } from 'crypto';

export function computeTransactionHash(
  date: string,           // ISO date
  description: string,
  amountCents: number,
  isDebit: boolean
): string {
  const input = `${date}|${description}|${amountCents}|${isDebit}`;
  return createHash('sha256').update(input).digest('hex');
}
```
[ASSUMED -- SHA-256 is a common choice; the exact algorithm is Claude's discretion per CONTEXT.md]

**Duplicate check flow:**
1. During parsing, compute hash for each transaction
2. Before displaying review screen, query existing hashes from `transactions` table
3. Mark any parsed transaction whose hash already exists as "duplicate"
4. Display duplicates with strikethrough styling (D-11)
5. Exclude duplicates from import action

### Pattern 4: Client-Side State for Parsed Transactions

**What:** After parsing, transactions live in React state on the client. They are NOT written to the database until the import action is confirmed.

**When:** Between parse completion and import confirmation.

**Why:** Avoids dirty/partial data in the database. If user abandons the review, nothing persists. The 100% categorization gate (Phase 3) operates on client-side state. Only confirmed, fully-categorized imports are written.

```typescript
// State shape for the import page
interface ImportPageState {
  status: 'idle' | 'uploading' | 'parsing' | 'review' | 'importing' | 'error';
  file: File | null;
  parseResult: ParseResult | null;
  duplicateHashes: Set<string>;  // Hashes that already exist in DB
  error: string | null;
}
```

### Pattern 5: Citibank SG Credit Card Format Config

**What:** The JSON config that defines how to parse Citibank SG credit card statement PDFs. Stored in the `bank_configs` database table, seeded via migration.

**Citibank SG format characteristics** (from PROJECT.md and user context):
- Transaction date format: `DD MMM` (no year -- e.g., "15 MAR")
- Year inferred from statement period
- Credits in parentheses: `(1,234.56)` means credit; `1,234.56` means debit
- Multi-page PDFs (up to 14+ pages)
- Noise rows: BALANCE PREVIOUS STATEMENT, SUB-TOTAL, card headers, summary sections
- Description may span multiple lines (second line often has masked card number -- ignorable)
- Statement period typically shown as "Statement Period: DD/MM/YYYY to DD/MM/YYYY" or "DD MMM YYYY to DD MMM YYYY"

[ASSUMED -- exact format patterns derived from PROJECT.md context section and general Citibank SG statement knowledge. Exact regex patterns will need validation against real PDF samples at implementation time.]

**Recommended config seed:**
```json
{
  "name": "Citibank SG Credit Card",
  "statement_period": {
    "pattern": "Statement\\s+Period[:\\s]+(.+?)\\s+to\\s+(.+)",
    "date_format": "dd/MM/yyyy"
  },
  "transaction": {
    "line_pattern": "^(\\d{2}\\s+[A-Z]{3})\\s+(.+?)\\s+(\\(?[\\d,]+\\.\\d{2}\\)?)$",
    "date_format": "dd MMM",
    "credit_indicator": "parentheses",
    "description_continuation": true
  },
  "skip_patterns": [
    "BALANCE PREVIOUS STATEMENT",
    "SUB-TOTAL",
    "TOTAL",
    "Card No\\.",
    "REWARDS SUMMARY",
    "PAYMENT DUE DATE",
    "MINIMUM PAYMENT",
    "CREDIT LIMIT",
    "NEW TRANSACTIONS"
  ],
  "section_markers": {
    "start": "NEW TRANSACTIONS",
    "end": "SUB-TOTAL"
  }
}
```

### Anti-Patterns to Avoid

- **Uploading PDF to Supabase Storage:** User explicitly chose "parse and discard." Do not create a storage bucket or store files.
- **Writing parsed transactions to DB before review:** Keep in client state. Only persist after import confirmation. Avoids dirty data.
- **Hard-coding bank-specific parsing logic:** All parsing logic must be driven by the JSON config. The parser function should have zero knowledge of Citibank-specific details.
- **Using client-side PDF parsing:** PDF extraction must happen server-side (server action) where `unpdf` runs reliably in the serverless environment. The client only sends the file and receives structured data.
- **Blocking on exact regex patterns:** The Citibank SG format config will need iterative refinement with real PDF samples. Design the parser to be tolerant of config changes without code changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF.js integration | `unpdf` `extractText()` | Handles worker setup, serverless optimization, per-page arrays automatically. ~1.4MB bundle vs 2MB+ raw pdfjs-dist. [VERIFIED: unpdf GitHub] |
| File drag-and-drop | Custom drag event handlers | `react-dropzone` `useDropzone()` | Handles browser inconsistencies, drag state management, file type/size validation. [VERIFIED: CLAUDE.md recommendation] |
| Date parsing from "DD MMM" format | Custom date parsing | `date-fns` `parse()` function | Handles locale-aware parsing, format strings, timezone edge cases. [VERIFIED: package.json] |
| SHA-256 hashing | Custom hash implementation | Node.js `crypto.createHash('sha256')` | Built into Node.js runtime, available in all Vercel serverless functions. No extra dependency. [VERIFIED: Node.js standard library] |
| Schema validation | Manual if/else validation | `zod` schemas | Type-safe validation with inference, already established project pattern. [VERIFIED: package.json, existing server actions] |
| Toast notifications | Custom notification system | `sonner` `toast()` | Already installed and used in Phase 1 for user management actions. [VERIFIED: package.json, user-table.tsx] |
| Amount formatting | Custom number formatting | `Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })` | Browser-native, handles thousands separators and currency symbol. [CITED: CLAUDE.md Money Handling Strategy] |

## Common Pitfalls

### Pitfall 1: Cross-Year Date Inference

**What goes wrong:** Transaction dates have no year (e.g., "15 MAR"). If the statement period spans Dec-Jan (e.g., "1 Dec 2025 to 1 Jan 2026"), assigning the wrong year to transactions near the boundary corrupts dates.

**Why it happens:** Naive approach assumes all transactions share the statement's end year. But a Dec 15 transaction in a Dec-Jan statement belongs to the previous year.

**How to avoid:** Extract statement period FIRST. For each transaction date, determine which year makes the date fall within the statement period. If the statement spans two years, dates with month >= statement start month get the start year, dates with month <= statement end month get the end year.

**Warning signs:** Transactions appearing in the wrong month/year in the review screen. Transaction dates outside the statement period.

### Pitfall 2: Vercel Request Body Size Limit

**What goes wrong:** Uploading a large PDF (>4.5MB) directly to a server action fails silently or returns a 413 error.

**Why it happens:** Vercel serverless functions have a hard 4.5MB request body limit that cannot be overridden by Next.js config. The Next.js `serverActions.bodySizeLimit` only applies locally; Vercel enforces its own limit.

**How to avoid:** Client-side file size validation at 4MB (D-05 says 10MB, but Vercel limits to 4.5MB). Show a clear error toast. Typical Citibank SG statements are 100KB-2MB, well within limits.

**Warning signs:** Upload works locally but fails on Vercel deployment.

### Pitfall 3: Multi-Line Transaction Descriptions

**What goes wrong:** Parser treats each line independently, missing description continuation lines. A transaction with a two-line description (e.g., merchant name + location) gets split into one valid transaction and one garbage line.

**Why it happens:** Citibank statements sometimes have description text that wraps to a second line, or include masked card numbers on a separate line below the transaction.

**How to avoid:** The parser should: (1) match transaction lines using the regex, (2) if `description_continuation` is true in config, check if the NEXT line does NOT match the transaction pattern -- if so, append it to the current transaction's description, (3) skip known noise patterns (masked card numbers, etc.).

**Warning signs:** Fewer transactions parsed than expected. Orphan description fragments appearing as separate (invalid) transactions.

### Pitfall 4: Amount Parsing with Commas and Parentheses

**What goes wrong:** Amounts like `(1,234.56)` (credits) or `1,234.56` (debits) are not correctly parsed into integer cents.

**Why it happens:** Forgetting to strip commas before parseFloat, or not detecting parentheses as credit indicator.

**How to avoid:** Pipeline: (1) detect parentheses = credit, (2) strip parentheses, (3) strip commas, (4) parseFloat, (5) `Math.round(value * 100)` for cents. Validate the result is a positive integer.

**Warning signs:** NaN amounts, incorrect credit/debit classification, floating point rounding errors in amounts.

### Pitfall 5: Duplicate Hash Collision Concerns

**What goes wrong:** Two genuinely different transactions produce the same hash (unlikely with SHA-256) or, more commonly, two transactions on the same date with the same merchant and same amount (e.g., two coffees at the same cafe) produce the same hash and one gets incorrectly flagged as duplicate.

**Why it happens:** The hash is based on date + description + amount + is_debit. If all four fields are identical for two different transactions, the hashes collide.

**How to avoid:** This is a known trade-off documented in IMPT-05 ("hash on date + description + amount"). Accept that same-day, same-merchant, same-amount transactions will collide. This is intentional duplicate prevention -- if the same statement is re-uploaded, ALL its transactions should be detected. For genuinely different transactions with identical fields, the user would need to import them in a single batch (same statement upload). One approach: include a sequence/index number in the hash for transactions within the same statement.

**Warning signs:** User reports "missing transactions" after import -- check if legitimate different transactions had identical fields.

### Pitfall 6: PDF.js Promise.withResolvers Polyfill

**What goes wrong:** unpdf's bundled PDF.js v5.4.x uses `Promise.withResolvers()`, which requires Node.js 22+.

**Why it happens:** Vercel serverless functions might run on Node.js 20.x.

**How to avoid:** unpdf's serverless build includes a polyfill for this. Ensure you are importing from `unpdf` (which uses the serverless build by default) and NOT from `pdfjs-dist` directly. Do not call `definePDFJSModule()` with a custom build unless necessary.

**Warning signs:** Runtime error `Promise.withResolvers is not a function` on Vercel.

## Code Examples

### Example 1: Drop Zone Component with react-dropzone

```typescript
// Source: react-dropzone official docs + Phase 1 patterns
'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface DropZoneProps {
  onFileParsed: (result: ParseResult) => void;
  isAdmin: boolean;
}

export function PdfDropZone({ onFileParsed, isAdmin }: DropZoneProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing'>('idle');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('parsing');
      const result = await parseStatement(formData);
      if (result.error) {
        toast.error(result.error);
        setStatus('idle');
        return;
      }
      onFileParsed(result.data);
    } catch {
      toast.error('Failed to parse PDF. Please try again.');
      setStatus('idle');
    }
  }, [onFileParsed]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (rejection?.errors[0]?.code === 'file-too-large') {
      toast.error('File too large. Maximum size is 4MB.');
    } else if (rejection?.errors[0]?.code === 'file-invalid-type') {
      toast.error('Only PDF files are supported.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 4 * 1024 * 1024, // 4MB (Vercel limit safety margin)
    maxFiles: 1,
    disabled: !isAdmin || status !== 'idle',
  });

  // ... render drop zone UI
}
```
[CITED: react-dropzone docs -- useDropzone API]

### Example 2: unpdf Text Extraction in Server Action

```typescript
// Source: unpdf GitHub README
'use server';

import { extractText, getDocumentProxy } from 'unpdf';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const parseInputSchema = z.object({
  bankConfigId: z.string().uuid().optional(),
});

export async function parseStatement(formData: FormData) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  // 2. Extract file from FormData
  const file = formData.get('file') as File;
  if (!file || file.type !== 'application/pdf') {
    return { error: 'Invalid file. Please upload a PDF.' };
  }

  // 3. Convert File to Uint8Array
  const buffer = new Uint8Array(await file.arrayBuffer());

  // 4. Extract text per page using unpdf
  const pdf = await getDocumentProxy(buffer);
  const { text: pageTexts, totalPages } = await extractText(pdf, {
    mergePages: false,
  });

  // 5. Load bank format config from database
  const { data: configs } = await supabase
    .from('bank_configs')
    .select('*')
    .limit(10);

  // Auto-detect bank format or use provided ID
  // For v1 with only Citibank SG, use the first/only config

  // 6. Run parser
  const result = parseStatementText(pageTexts, config);

  // 7. Compute hashes and check duplicates
  // ...

  return { data: result };
}
```
[CITED: unpdf README -- getDocumentProxy + extractText API]

### Example 3: Amount Parsing (Citibank SG Credit Notation)

```typescript
// Source: PROJECT.md Citibank SG format context
export function parseAmount(raw: string): { amountCents: number; isDebit: boolean } {
  const trimmed = raw.trim();

  // Detect credit: parentheses indicate credit/refund
  const isCredit = trimmed.startsWith('(') && trimmed.endsWith(')');

  // Strip parentheses, commas
  const cleaned = trimmed.replace(/[(),]/g, '');

  // Parse to float, then convert to cents
  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) {
    throw new Error(`Invalid amount: ${raw}`);
  }

  const amountCents = Math.round(value * 100);
  return { amountCents, isDebit: !isCredit };
}
```
[CITED: CLAUDE.md Money Handling Strategy -- cents storage pattern]

### Example 4: Cross-Year Date Inference

```typescript
// Source: D-19 decision + PROJECT.md context
import { parse, isWithinInterval, setYear } from 'date-fns';

export function inferTransactionDate(
  dateStr: string,        // "15 MAR" (DD MMM)
  periodStart: Date,
  periodEnd: Date
): Date {
  const startYear = periodStart.getFullYear();
  const endYear = periodEnd.getFullYear();

  // Parse as DD MMM (no year) -- try with start year first
  const parsedWithStartYear = parse(
    `${dateStr} ${startYear}`,
    'dd MMM yyyy',
    new Date()
  );

  // Check if it falls within the statement period
  if (isWithinInterval(parsedWithStartYear, { start: periodStart, end: periodEnd })) {
    return parsedWithStartYear;
  }

  // Try with end year (for cross-year statements)
  const parsedWithEndYear = parse(
    `${dateStr} ${endYear}`,
    'dd MMM yyyy',
    new Date()
  );

  if (isWithinInterval(parsedWithEndYear, { start: periodStart, end: periodEnd })) {
    return parsedWithEndYear;
  }

  // Fallback: use end year (most statements are within a single year)
  return parsedWithEndYear;
}
```
[CITED: date-fns docs -- parse, isWithinInterval functions]

## Database Schema Changes

### New Table: `bank_configs`

The existing schema has no `bank_configs` table. Per D-17, bank format configs are stored in the database. A new migration is needed:

```sql
-- Migration: 00005_bank_configs.sql
CREATE TABLE bank_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,          -- "Citibank"
  country_code TEXT NOT NULL,       -- "SG"
  statement_type TEXT NOT NULL,     -- "credit_card"
  config JSONB NOT NULL,            -- The parsing configuration
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_configs_household_id ON bank_configs(household_id);

ALTER TABLE bank_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank configs"
  ON bank_configs FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());

CREATE POLICY "Admins can manage bank configs"
  ON bank_configs FOR ALL
  TO authenticated
  USING (is_admin());

CREATE TRIGGER update_bank_configs_updated_at
  BEFORE UPDATE ON bank_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Citibank SG Credit Card config
INSERT INTO bank_configs (household_id, name, bank_name, country_code, statement_type, config, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Citibank SG Credit Card',
  'Citibank',
  'SG',
  'credit_card',
  '{...}'::jsonb, -- Full config JSON as defined above
  TRUE
);
```
[VERIFIED: existing migrations use same patterns -- household_id, RLS with get_my_household_id()/is_admin(), update_updated_at_column trigger]

### Database Types Update

The `database.ts` types file needs a new `bank_configs` table entry following the exact pattern used for other tables. [VERIFIED: src/lib/types/database.ts -- pattern established for all 5 existing tables]

### Sidebar Navigation Update

The Import nav item is currently disabled (`disabled: true`) in `app-sidebar.tsx`. This phase enables it. [VERIFIED: src/components/app-sidebar.tsx line 41]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse for serverless PDF extraction | unpdf (serverless-optimized PDF.js wrapper) | 2023-2024 | pdf-parse has native dependency issues in Vercel serverless. unpdf is zero-dependency, ESM-native, TypeScript-first. |
| Upload to storage then parse | Direct FormData upload for small files | Next.js 14+ (2024) | Server Actions with FormData are the standard pattern for file handling in Next.js App Router. No intermediate storage needed for small files. |
| Client-side PDF parsing | Server-side extraction | Current best practice | Parsing on the server is more reliable (consistent environment), more secure (don't expose parsing logic), and avoids shipping PDF.js to the browser. |
| SHA-1 for content hashing | SHA-256 | Current standard | SHA-1 has known collision weaknesses. SHA-256 is the standard for content fingerprinting. |

## Upload Flow Decision: FormData vs Supabase Storage

This is the key architectural decision for this phase. The research recommends **direct FormData upload** over the Supabase Storage approach documented in the earlier ARCHITECTURE.md research. Here is the analysis:

| Factor | Direct FormData (Recommended) | Supabase Storage Upload |
|--------|-------------------------------|------------------------|
| User decision | Aligns with "parse and discard" | Contradicts "No Supabase Storage" |
| Complexity | Simpler -- one server action call | More complex -- upload to storage, then parse API call, then delete |
| File size limit | 4.5MB (Vercel hard limit) | 50MB (Supabase Storage) |
| Typical statement size | 100KB-2MB (well within 4.5MB) | Not a concern |
| Storage cost | None | Minimal (even if temporary) |
| Cleanup needed | No | Yes (must delete after parsing) |
| Latency | Single request | Two requests (upload + parse) |

**Recommendation:** Use direct FormData. Lower the client-side max from 10MB (D-05) to 4MB with an appropriate toast error. If in the future larger PDFs are needed, the architecture can be adapted to use temporary Supabase Storage.

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before becoming a locked decision.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Client-side file size validation should be 4MB (not 10MB per D-05) due to Vercel's 4.5MB hard limit | Architecture Patterns, Pattern 1 | If user truly needs 10MB support, must use Supabase Storage as temporary buffer (adds complexity). Most statements are <2MB so low risk. |
| A2 | SHA-256 is the right hash algorithm for transaction dedup | Architecture Patterns, Pattern 3 | Minimal risk -- any cryptographic hash would work. SHA-256 is standard and sufficient. |
| A3 | Citibank SG statement format: "DD MMM" dates, parentheses for credits, specific noise patterns | Architecture Patterns, Pattern 5 | HIGH RISK if patterns don't match real PDFs. Config will need iterative refinement with actual statement samples. Parser is config-driven so changes are data-only, not code changes. |
| A4 | Statement period appears as "Statement Period: DD/MM/YYYY to DD/MM/YYYY" | Architecture Patterns, Pattern 5 | MEDIUM RISK -- exact pattern may differ. Config-driven so easily adjustable. |
| A5 | Transaction line regex: `^(\d{2}\s+[A-Z]{3})\s+(.+?)\s+(\(?\d[\d,]*\.\d{2}\)?)$` | Code Examples | HIGH RISK -- regex patterns will need validation against real PDF text output. The actual text layout from unpdf may differ from expected format. |

## Open Questions (RESOLVED)

1. **Citibank SG exact PDF text layout** -- RESOLVED
   - What we know: Transaction format is DD MMM | description | amount, credits in parentheses
   - Resolution: Parser uses configurable regex patterns stored in bank_configs JSONB. First implementation uses best-guess regex from Citibank SG statement structure. Config is editable in database, so patterns can be refined after testing with a real PDF without code changes. This is an inherent limitation of text-based PDF parsing -- the config-driven approach is the mitigation.

2. **File size limit reconciliation (D-05 says 10MB, Vercel limits 4.5MB)** -- RESOLVED
   - What we know: D-05 explicitly says "max 10MB." Vercel has a hard 4.5MB request body limit for serverless functions.
   - Resolution: Implementing 4MB client-side limit. Vercel's 4.5MB is a hard platform constraint that cannot be bypassed via configuration (bodySizeLimit only controls Next.js, not Vercel's infrastructure limit). Bank statements are typically 100KB-2MB, so 4MB provides ample headroom. D-05 intent (reject oversized files with toast) is fully preserved -- only the numeric threshold changes. If a future statement exceeds 4MB, the mitigation path is uploading to Supabase Storage first, then processing from a storage URL. Plans use 4MB with toast message "File too large. Maximum size is 4MB."

3. **Transaction hash handling for identical transactions** -- RESOLVED
   - What we know: Hash is SHA-256 of date|description|amountCents|isDebit. Same-day same-merchant same-amount transactions will produce identical hashes.
   - Resolution: Plan 01 chose NOT to include a sequence index in the hash. Rationale: (a) identical transactions within the same statement are rare for credit card statements (different merchant terminal IDs typically produce slightly different descriptions), (b) adding a sequence index would make cross-statement duplicate detection less reliable since the same transaction could get different sequence numbers in different uploads, (c) the UNIQUE constraint on transaction_hash in the database will reject true duplicates, which is the desired behavior. If this proves problematic with real data, the hash can be extended later without migration (recompute hashes on next import).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (existing), verifyAdmin() server-side check |
| V3 Session Management | yes | @supabase/ssr middleware token refresh (existing) |
| V4 Access Control | yes | RLS policies on all tables; is_admin() SECURITY DEFINER function; admin-only import actions |
| V5 Input Validation | yes | Zod schema validation on FormData inputs; file type/size validation on client and server |
| V6 Cryptography | no | SHA-256 is for data integrity (dedup), not security. No encryption needed. |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized file upload (viewer uploads PDF) | Elevation of Privilege | verifyAdmin() check in server action; RLS INSERT policy on imports table |
| Malicious PDF (crafted to exploit parser) | Tampering | unpdf uses sandboxed PDF.js; validate file type server-side; limit file size |
| Server action abuse (rapid upload attempts) | Denial of Service | Vercel automatically rate-limits; client-side debounce on upload action |
| SQL injection via bank config patterns | Tampering | Config is read-only in v1 (D-18); regex patterns are used in JavaScript, not SQL |
| XSS via transaction description | Tampering | React auto-escapes JSX output; descriptions rendered as text, not HTML |

## Sources

### Primary (HIGH confidence)
- [unpdf GitHub README](https://github.com/unjs/unpdf) - API functions: extractText, getDocumentProxy, getMeta. Bundled PDF.js v5.4.394. Zero dependencies. Serverless-optimized.
- [unpdf libraries.io](https://libraries.io/npm/unpdf) - Version 1.4.0 published Oct 31, 2025
- [Next.js serverActions config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) - bodySizeLimit configuration
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) - 4.5MB body limit, 250MB bundle limit
- [Vercel body size workaround](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) - Direct storage upload pattern
- [Next.js FormData server action discussion](https://github.com/vercel/next.js/discussions/66791) - FormData required for binary data in server actions
- [MDN SubtleCrypto digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) - SHA-256 hashing API reference

### Secondary (MEDIUM confidence)
- [react-dropzone docs](https://react-dropzone.js.org/) - useDropzone hook API
- [Citibank SG paper statement guide](https://www.citibank.com.sg/global_docs/microsite/paper_statement/cc_paperstat.htm) - Statement structure: overview + individual card sections
- [bankstatemently.com Citibank SG parser](https://bankstatemently.com/banks/sg/citibank/credit-card-statement) - Confirms missing year in dates, inconsistent date formats

### Tertiary (LOW confidence)
- Citibank SG exact transaction row regex patterns -- based on PROJECT.md context and general knowledge, needs validation with real PDF samples

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via package.json or npm registry
- Architecture (upload flow): HIGH - FormData pattern well-documented, Vercel limits verified
- Architecture (parser): MEDIUM - Parser design is solid but regex patterns are unvalidated against real PDFs
- Pitfalls: HIGH - Based on verified platform constraints and known PDF parsing challenges
- Citibank SG format specifics: LOW - Exact patterns need real PDF validation

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain -- libraries won't change significantly in 30 days)
