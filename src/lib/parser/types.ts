export interface BankFormatConfig {
  statement_period: {
    pattern: string;       // Regex to find statement period text
    date_format: string;   // e.g., "dd/MM/yyyy" or "dd MMM yyyy"
  };
  period_fallback?: {
    year_hint_pattern: string;   // Regex to extract a year reference (e.g., from "Payment Due Date: March 16, 2026")
    year_hint_format: string;    // date-fns format for the captured date (e.g., "MMMM d, yyyy")
    strategy: 'infer_from_transactions'; // Derive period from min/max transaction dates
  };
  transaction: {
    line_pattern: string;          // Regex with capture groups for date, desc, amount
    date_format: string;           // e.g., "dd MMM" (no year in Citibank SG)
    credit_indicator: 'parentheses' | 'negative' | 'column';
    description_continuation: boolean;
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
  statementPeriodStart: string;  // ISO date (YYYY-MM-DD)
  statementPeriodEnd: string;    // ISO date (YYYY-MM-DD)
  totalPages: number;
}

export interface ParseError {
  code: 'unsupported_format' | 'no_transactions' | 'parse_failed';
  message: string;
}
