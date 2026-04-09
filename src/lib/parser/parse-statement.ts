import { parse, isWithinInterval, format } from 'date-fns';
import { computeTransactionHash } from './hash';
import type {
  BankFormatConfig,
  ParsedTransaction,
  ParseResult,
  ParseError,
} from './types';

/**
 * Parse a raw amount string into cents and debit/credit flag.
 * Credits are indicated by parentheses: "(89.00)" => credit.
 * All amounts are stored as positive integers in cents.
 */
export function parseAmount(raw: string): {
  amountCents: number;
  isDebit: boolean;
} {
  const trimmed = raw.trim();

  // Detect credit indicator: parentheses
  const isCredit = trimmed.startsWith('(') && trimmed.endsWith(')');

  // Strip parentheses and commas
  const cleaned = trimmed.replace(/[(),]/g, '');

  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) {
    throw new Error(`Invalid amount: "${raw}"`);
  }

  const amountCents = Math.round(value * 100);

  return {
    amountCents,
    isDebit: !isCredit,
  };
}

function differenceInCalendarDaysSafe(later: Date, earlier: Date): number {
  return Math.round(
    (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function inferFallbackPeriod(
  dateStrs: string[],
  dateFormat: string,
  hintDate: Date,
): { periodStart: Date; periodEnd: Date } {
  const hintYear = hintDate.getFullYear();
  const candidates: Array<{
    periodStart: Date;
    periodEnd: Date;
    hasFutureDates: boolean;
    exceedsTypicalWindow: boolean;
    spanDays: number;
    gapToHintDays: number;
  }> = [];

  for (let cutoffMonth = 0; cutoffMonth <= 12; cutoffMonth++) {
    const resolvedDates: Date[] = [];
    let invalidCandidate = false;

    for (const dateStr of dateStrs) {
      const sameYearProbe = parse(
        `${dateStr} ${hintYear}`,
        `${dateFormat} yyyy`,
        new Date(),
      );

      if (isNaN(sameYearProbe.getTime())) {
        invalidCandidate = true;
        break;
      }

      const resolvedYear =
        sameYearProbe.getMonth() + 1 > cutoffMonth ? hintYear - 1 : hintYear;
      const resolvedDate = parse(
        `${dateStr} ${resolvedYear}`,
        `${dateFormat} yyyy`,
        new Date(),
      );

      if (isNaN(resolvedDate.getTime())) {
        invalidCandidate = true;
        break;
      }

      resolvedDates.push(resolvedDate);
    }

    if (invalidCandidate || resolvedDates.length === 0) {
      continue;
    }

    resolvedDates.sort((a, b) => a.getTime() - b.getTime());
    const periodStart = resolvedDates[0];
    const periodEnd = resolvedDates[resolvedDates.length - 1];
    const spanDays = differenceInCalendarDaysSafe(periodEnd, periodStart);
    const gapToHintDays = differenceInCalendarDaysSafe(hintDate, periodEnd);

    candidates.push({
      periodStart,
      periodEnd,
      hasFutureDates: gapToHintDays < 0,
      exceedsTypicalWindow: spanDays > 62,
      spanDays,
      gapToHintDays,
    });
  }

  candidates.sort((a, b) => {
    if (a.hasFutureDates !== b.hasFutureDates) {
      return a.hasFutureDates ? 1 : -1;
    }
    if (a.exceedsTypicalWindow !== b.exceedsTypicalWindow) {
      return a.exceedsTypicalWindow ? 1 : -1;
    }
    if (a.spanDays !== b.spanDays) {
      return a.spanDays - b.spanDays;
    }

    const aGap = a.gapToHintDays < 0 ? Number.MAX_SAFE_INTEGER : a.gapToHintDays;
    const bGap = b.gapToHintDays < 0 ? Number.MAX_SAFE_INTEGER : b.gapToHintDays;

    if (aGap !== bGap) {
      return aGap - bGap;
    }

    return b.periodEnd.getTime() - a.periodEnd.getTime();
  });

  if (candidates.length === 0) {
    throw new Error('Could not infer fallback statement period');
  }

  return {
    periodStart: candidates[0].periodStart,
    periodEnd: candidates[0].periodEnd,
  };
}

/**
 * Infer the full date (with year) from a date string like "15 MAR"
 * using the statement period boundaries for cross-year resolution.
 *
 * Strategy: Try parsing with the start year first. If the resulting date
 * falls within the period (with a small buffer), use it. Otherwise, try
 * the end year. Fallback to end year.
 */
export function inferTransactionDate(
  dateStr: string,
  periodStart: Date,
  periodEnd: Date,
): Date {
  const startYear = periodStart.getFullYear();
  const endYear = periodEnd.getFullYear();

  // Try parsing with start year
  const withStartYear = parse(
    `${dateStr} ${startYear}`,
    'dd MMM yyyy',
    new Date(),
  );

  // If start year and end year are the same, just use start year
  if (startYear === endYear) {
    return withStartYear;
  }

  // Cross-year scenario: check if the date with start year falls within period
  try {
    if (
      isWithinInterval(withStartYear, { start: periodStart, end: periodEnd })
    ) {
      return withStartYear;
    }
  } catch {
    // isWithinInterval can throw if date is invalid
  }

  // Try with end year
  const withEndYear = parse(
    `${dateStr} ${endYear}`,
    'dd MMM yyyy',
    new Date(),
  );

  try {
    if (isWithinInterval(withEndYear, { start: periodStart, end: periodEnd })) {
      return withEndYear;
    }
  } catch {
    // fallback below
  }

  // Fallback: use end year
  return withEndYear;
}

/**
 * Parse statement text (per-page arrays) using a bank format config.
 * Pure function: no side effects, no I/O, no database access.
 *
 * Returns ParseResult on success or ParseError on failure.
 */
export function parseStatementText(
  pageTexts: string[],
  config: BankFormatConfig,
): ParseResult | ParseError {
  // 1. Concatenate all page texts into a single lines array
  const allLines: string[] = [];
  for (const pageText of pageTexts) {
    const lines = pageText.split('\n');
    allLines.push(...lines);
  }

  // 2. Extract statement period
  const periodRegex = new RegExp(config.statement_period.pattern);
  let periodStartStr: string | null = null;
  let periodEndStr: string | null = null;

  for (const line of allLines) {
    const periodMatch = line.match(periodRegex);
    if (periodMatch) {
      periodStartStr = periodMatch[1].trim();
      periodEndStr = periodMatch[2].trim();
      break;
    }
  }

  let periodStart: Date;
  let periodEnd: Date;

  if (periodStartStr && periodEndStr) {
    // 3a. Parse period dates from explicit statement period
    periodStart = parse(
      periodStartStr,
      config.statement_period.date_format,
      new Date(),
    );
    periodEnd = parse(
      periodEndStr,
      config.statement_period.date_format,
      new Date(),
    );
  } else if (config.period_fallback?.strategy === 'infer_from_transactions') {
    // 3b. Fallback: infer period from transaction dates
    // Real Citibank PDFs often have image-only summary pages, so we may need to infer
    // the period from transaction rows plus a due-date year hint instead.
    let hintDate: Date | null = null;

    if (config.period_fallback.year_hint_pattern) {
      const hintRegex = new RegExp(config.period_fallback.year_hint_pattern);
      for (const line of allLines) {
        const hintMatch = line.match(hintRegex);
        if (hintMatch) {
          const parsedHintDate = parse(
            hintMatch[1].trim(),
            config.period_fallback.year_hint_format,
            new Date(),
          );
          if (!isNaN(parsedHintDate.getTime())) {
            hintDate = parsedHintDate;
            break;
          }
        }
      }
    }

    if (!hintDate) {
      hintDate = new Date();
    }

    // Collect all transaction dates from the document to determine the range
    const txRegexForDates = new RegExp(config.transaction.line_pattern);
    const txDateStrs: string[] = [];

    for (const line of allLines) {
      const match = line.trim().match(txRegexForDates);
      if (match) {
        txDateStrs.push(match[1].trim());
      }
    }

    if (txDateStrs.length === 0) {
      return {
        code: 'no_transactions',
        message: 'No transaction dates found to infer statement period',
      };
    }

    try {
      const inferredPeriod = inferFallbackPeriod(
        txDateStrs,
        config.transaction.date_format,
        hintDate,
      );
      periodStart = inferredPeriod.periodStart;
      periodEnd = inferredPeriod.periodEnd;
    } catch {
      return {
        code: 'parse_failed',
        message: 'Could not infer statement period from transaction dates',
      };
    }
  } else {
    return {
      code: 'unsupported_format',
      message: 'Could not find statement period in the document',
    };
  }

  // 4. Find section boundaries
  let startIdx = 0;
  let endIdx = allLines.length;

  if (config.section_markers?.start) {
    const startPattern = new RegExp(config.section_markers.start);
    for (let i = 0; i < allLines.length; i++) {
      if (startPattern.test(allLines[i])) {
        startIdx = i + 1; // Start processing AFTER the marker
        break;
      }
    }
  }

  if (config.section_markers?.end) {
    const endPattern = new RegExp(config.section_markers.end);
    for (let i = startIdx; i < allLines.length; i++) {
      if (endPattern.test(allLines[i])) {
        endIdx = i; // Stop processing BEFORE the marker
        break;
      }
    }
  }

  // 5. Build skip pattern regexes
  const skipRegexes = config.skip_patterns.map((p) => new RegExp(p));

  // 6. Parse transactions
  const txRegex = new RegExp(config.transaction.line_pattern);
  const transactions: ParsedTransaction[] = [];
  const sectionLines = allLines.slice(startIdx, endIdx);

  let i = 0;
  while (i < sectionLines.length) {
    const line = sectionLines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Skip noise lines
    if (skipRegexes.some((r) => r.test(line))) {
      i++;
      continue;
    }

    // Try matching transaction pattern
    const txMatch = line.match(txRegex);
    if (txMatch) {
      const dateStr = txMatch[1].trim();
      let description = txMatch[2].trim();
      const amountStr = txMatch[3].trim();

      // Parse amount
      const { amountCents, isDebit } = parseAmount(amountStr);

      // Infer full date
      const txDate = inferTransactionDate(dateStr, periodStart, periodEnd);
      const dateIso = format(txDate, 'yyyy-MM-dd');

      // Handle description continuation
      if (config.transaction.description_continuation) {
        while (i + 1 < sectionLines.length) {
          const nextLine = sectionLines[i + 1].trim();
          if (!nextLine) {
            break;
          }
          // If next line matches transaction pattern or skip pattern, stop
          if (txRegex.test(nextLine) || skipRegexes.some((r) => r.test(nextLine))) {
            break;
          }
          // Append to description
          description += ' ' + nextLine;
          i++;
        }
      }

      // Compute hash (sequence index ensures uniqueness for identical transactions)
      const hash = computeTransactionHash(
        dateIso,
        description,
        amountCents,
        isDebit,
        transactions.length,
      );

      transactions.push({
        date: dateIso,
        description,
        amountCents,
        isDebit,
        hash,
      });
    }

    i++;
  }

  // 7. Check if any transactions were found
  if (transactions.length === 0) {
    return {
      code: 'no_transactions',
      message: 'No transaction lines found in the document',
    };
  }

  // 8. Return ParseResult
  return {
    transactions,
    statementPeriodStart: format(periodStart, 'yyyy-MM-dd'),
    statementPeriodEnd: format(periodEnd, 'yyyy-MM-dd'),
    totalPages: pageTexts.length,
  };
}
