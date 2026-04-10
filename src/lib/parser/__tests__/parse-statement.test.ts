import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { parseAmount, inferTransactionDate, parseStatementText } from '../parse-statement';
import { computeTransactionHash } from '../hash';
import type { BankFormatConfig, ParseResult, ParseError } from '../types';

// Helper: Citibank SG config for tests
const citibankConfig: BankFormatConfig = {
  statement_period: {
    pattern: 'Statement\\s+Period[:\\s]+(.+?)\\s+to\\s+(.+)',
    date_format: 'dd/MM/yyyy',
  },
  transaction: {
    line_pattern: '^(\\d{2}\\s+[A-Z]{3})\\s+(.+?)\\s+(\\(?[\\d,]+\\.\\d{2}\\)?)$',
    date_format: 'dd MMM',
    credit_indicator: 'parentheses',
    description_continuation: true,
  },
  skip_patterns: [
    'BALANCE PREVIOUS STATEMENT',
    'SUB-TOTAL',
    'TOTAL',
    'Card No\\.',
    'REWARDS SUMMARY',
    'PAYMENT DUE DATE',
    'MINIMUM PAYMENT',
    'CREDIT LIMIT',
    'NEW TRANSACTIONS',
  ],
  section_markers: {
    start: 'NEW TRANSACTIONS',
    end: 'SUB-TOTAL',
  },
};

// =============================================================================
// parseAmount tests
// =============================================================================

describe('parseAmount', () => {
  it('parses a plain debit amount', () => {
    const result = parseAmount('1,234.56');
    assert.deepStrictEqual(result, { amountCents: 123456, isDebit: true });
  });

  it('parses a credit amount in parentheses', () => {
    const result = parseAmount('(89.00)');
    assert.deepStrictEqual(result, { amountCents: 8900, isDebit: false });
  });

  it('parses a credit amount with commas in parentheses', () => {
    const result = parseAmount('(1,234.56)');
    assert.deepStrictEqual(result, { amountCents: 123456, isDebit: false });
  });

  it('parses a small debit amount', () => {
    const result = parseAmount('0.50');
    assert.deepStrictEqual(result, { amountCents: 50, isDebit: true });
  });

  it('throws on invalid amount string', () => {
    assert.throws(() => parseAmount('abc'), /Invalid amount/);
  });
});

// =============================================================================
// computeTransactionHash tests
// =============================================================================

describe('computeTransactionHash', () => {
  it('returns a 64-character hex string', () => {
    const hash = computeTransactionHash('2026-03-15', 'GRAB', 1500, true);
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it('is deterministic (same inputs => same hash)', () => {
    const hash1 = computeTransactionHash('2026-03-15', 'GRAB', 1500, true);
    const hash2 = computeTransactionHash('2026-03-15', 'GRAB', 1500, true);
    assert.strictEqual(hash1, hash2);
  });

  it('returns different hashes for different inputs', () => {
    const hash1 = computeTransactionHash('2026-03-15', 'GRAB', 1500, true);
    const hash2 = computeTransactionHash('2026-03-16', 'GRAB', 1500, true);
    assert.notStrictEqual(hash1, hash2);
  });
});

// =============================================================================
// inferTransactionDate tests
// =============================================================================

describe('inferTransactionDate', () => {
  it('infers date within same month/year as period', () => {
    const result = inferTransactionDate(
      '15 MAR',
      new Date(2026, 2, 1),  // Mar 1 2026
      new Date(2026, 2, 31), // Mar 31 2026
    );
    assert.strictEqual(result.getFullYear(), 2026);
    assert.strictEqual(result.getMonth(), 2); // March = 2
    assert.strictEqual(result.getDate(), 15);
  });

  it('infers Dec date gets start year in cross-year period', () => {
    const result = inferTransactionDate(
      '28 DEC',
      new Date(2025, 11, 1),  // Dec 1 2025
      new Date(2026, 0, 1),   // Jan 1 2026
    );
    assert.strictEqual(result.getFullYear(), 2025);
    assert.strictEqual(result.getMonth(), 11); // December = 11
    assert.strictEqual(result.getDate(), 28);
  });

  it('infers Jan date gets end year in cross-year period', () => {
    const result = inferTransactionDate(
      '01 JAN',
      new Date(2025, 11, 1),  // Dec 1 2025
      new Date(2026, 0, 1),   // Jan 1 2026
    );
    assert.strictEqual(result.getFullYear(), 2026);
    assert.strictEqual(result.getMonth(), 0); // January = 0
    assert.strictEqual(result.getDate(), 1);
  });
});

// =============================================================================
// parseStatementText tests
// =============================================================================

describe('parseStatementText', () => {
  const samplePage = [
    'Statement Period: 01/03/2026 to 31/03/2026\n' +
    '\n' +
    'NEW TRANSACTIONS\n' +
    '15 MAR GRAB TRANSPORT 15.00\n' +
    '16 MAR FAIRPRICE FINEST (89.00)\n' +
    '18 MAR STARBUCKS RAFFLES 7.50\n' +
    'SUB-TOTAL 1,234.56',
  ];

  it('parses 3 transaction lines from sample text', () => {
    const result = parseStatementText(samplePage, citibankConfig);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    assert.strictEqual(parsed.transactions.length, 3);
  });

  it('skips lines matching skip_patterns', () => {
    const pageWithNoise = [
      'Statement Period: 01/03/2026 to 31/03/2026\n' +
      '\n' +
      'NEW TRANSACTIONS\n' +
      'BALANCE PREVIOUS STATEMENT 500.00\n' +
      '15 MAR GRAB TRANSPORT 15.00\n' +
      'SUB-TOTAL 15.00',
    ];
    const result = parseStatementText(pageWithNoise, citibankConfig);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    assert.strictEqual(parsed.transactions.length, 1);
    assert.strictEqual(parsed.transactions[0].description, 'GRAB TRANSPORT');
  });

  it('extracts statement period dates', () => {
    const result = parseStatementText(samplePage, citibankConfig);
    assert.strictEqual('statementPeriodStart' in result, true);
    const parsed = result as ParseResult;
    assert.strictEqual(parsed.statementPeriodStart, '2026-03-01');
    assert.strictEqual(parsed.statementPeriodEnd, '2026-03-31');
  });

  it('returns ParseError when no transaction lines match', () => {
    const noTxPage = [
      'Statement Period: 01/03/2026 to 31/03/2026\n' +
      '\n' +
      'NEW TRANSACTIONS\n' +
      'Some random text\n' +
      'More random text\n' +
      'SUB-TOTAL 0.00',
    ];
    const result = parseStatementText(noTxPage, citibankConfig);
    assert.strictEqual('code' in result, true);
    const error = result as ParseError;
    assert.strictEqual(error.code, 'no_transactions');
  });

  it('handles multi-page text arrays', () => {
    const page1 =
      'Statement Period: 01/03/2026 to 31/03/2026\n' +
      '\n' +
      'NEW TRANSACTIONS\n' +
      '15 MAR GRAB TRANSPORT 15.00\n';
    const page2 =
      '16 MAR FAIRPRICE FINEST (89.00)\n' +
      'SUB-TOTAL 104.00';
    const result = parseStatementText([page1, page2], citibankConfig);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    assert.strictEqual(parsed.transactions.length, 2);
    assert.strictEqual(parsed.totalPages, 2);
  });

  it('each transaction has a non-empty hash', () => {
    const result = parseStatementText(samplePage, citibankConfig);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    for (const tx of parsed.transactions) {
      assert.ok(tx.hash.length > 0);
      assert.match(tx.hash, /^[0-9a-f]+$/);
    }
  });

  it('handles description continuation lines', () => {
    const pageWithCont = [
      'Statement Period: 01/03/2026 to 31/03/2026\n' +
      '\n' +
      'NEW TRANSACTIONS\n' +
      '15 MAR GRAB TRANSPORT 15.00\n' +
      'SINGAPORE SG\n' +
      '16 MAR FAIRPRICE FINEST 89.00\n' +
      'SUB-TOTAL 104.00',
    ];
    const result = parseStatementText(pageWithCont, citibankConfig);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    assert.strictEqual(parsed.transactions.length, 2);
    assert.ok(parsed.transactions[0].description.includes('SINGAPORE SG'));
  });

  it('returns ParseError for unsupported format (no statement period found)', () => {
    const badPage = ['Some random content without a statement period header'];
    const result = parseStatementText(badPage, citibankConfig);
    assert.strictEqual('code' in result, true);
    const error = result as ParseError;
    assert.strictEqual(error.code, 'unsupported_format');
  });

  it('correctly identifies debit vs credit transactions', () => {
    const result = parseStatementText(samplePage, citibankConfig);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    // GRAB TRANSPORT 15.00 is a debit
    assert.strictEqual(parsed.transactions[0].isDebit, true);
    assert.strictEqual(parsed.transactions[0].amountCents, 1500);
    // FAIRPRICE FINEST (89.00) is a credit
    assert.strictEqual(parsed.transactions[1].isDebit, false);
    assert.strictEqual(parsed.transactions[1].amountCents, 8900);
    // STARBUCKS RAFFLES 7.50 is a debit
    assert.strictEqual(parsed.transactions[2].isDebit, true);
    assert.strictEqual(parsed.transactions[2].amountCents, 750);
  });

  it('infers period from transactions when statement period not in text (fallback)', () => {
    // Simulates real Citibank SG PDF where pages 1-6 are image-only
    const configWithFallback: BankFormatConfig = {
      ...citibankConfig,
      period_fallback: {
        year_hint_pattern: 'Payment Due Date:\\s+(.+?)\\s*$',
        year_hint_format: 'MMMM d, yyyy',
        strategy: 'infer_from_transactions',
      },
      section_markers: undefined, // removed — not in extractable text
      skip_patterns: [
        ...citibankConfig.skip_patterns,
        '^XXXX-XXXX-XXXX-\\d{4}$',
        'CITI CASH BACK',
        'TRANSACTIONS FOR',
        'ALL TRANSACTIONS BILLED',
        'DATE\\s+DESCRIPTION\\s+AMOUNT',
      ],
    };

    const realPage = [
      'CITI CASH BACK PLUS MASTERCARD 5425 5045 0451 4636 Payment Due Date: March 16, 2026\n' +
      'DATE DESCRIPTION AMOUNT (SGD)\n' +
      'TRANSACTIONS FOR CITI CASH BACK PLUS MASTERCARD\n' +
      'ALL TRANSACTIONS BILLED IN SINGAPORE DOLLARS\n' +
      'BALANCE PREVIOUS STATEMENT 1,386.00\n' +
      '05 FEB FAST INCOMING PAYMENT (1,386.00)\n' +
      'SUB-TOTAL: 0.00\n' +
      'CITI CASH BACK PLUS MASTERCARD 5425 5045 0451 4636 - LE VIET PHUONG\n' +
      '12 JAN BUS/MRT 780237529 SINGAPORE SG 19.84\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '17 JAN BUS/MRT 783987301 SINGAPORE SG 10.03\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '18 JAN Kopitiam Investment Pt SINGAPORE SG 21.42\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '05 FEB SAI GON QUAN SINGAPORE SG 20.80\n' +
      'XXXX-XXXX-XXXX-0016',
    ];

    const result = parseStatementText(realPage, configWithFallback);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;

    // Should find 5 transactions (payment + 3 purchases + 1 feb purchase)
    // Payment is: 05 FEB FAST INCOMING PAYMENT (1,386.00)
    assert.ok(parsed.transactions.length >= 4, `Expected >= 4 transactions, got ${parsed.transactions.length}`);

    // Period inferred from transaction dates: Jan 12 to Feb 5, 2026
    assert.strictEqual(parsed.statementPeriodStart, '2026-01-12');
    assert.strictEqual(parsed.statementPeriodEnd, '2026-02-05');

    // Card numbers should NOT appear in descriptions
    for (const tx of parsed.transactions) {
      assert.ok(!tx.description.includes('XXXX-XXXX'), `Description should not contain card number: ${tx.description}`);
    }

    // First real purchase should be BUS/MRT
    const busTx = parsed.transactions.find(t => t.description.includes('BUS/MRT 780237529'));
    assert.ok(busTx, 'Should find BUS/MRT transaction');
    assert.strictEqual(busTx!.amountCents, 1984);
    assert.strictEqual(busTx!.isDebit, true);
  });

  it('infers cross-year fallback period for Dec-Jan statements', () => {
    const configWithFallback: BankFormatConfig = {
      ...citibankConfig,
      period_fallback: {
        year_hint_pattern: 'Payment Due Date:\\s+(.+?)\\s*$',
        year_hint_format: 'MMMM d, yyyy',
        strategy: 'infer_from_transactions',
      },
      section_markers: undefined,
      skip_patterns: [
        ...citibankConfig.skip_patterns,
        '^XXXX-XXXX-XXXX-\\d{4}$',
        'CITI CASH BACK',
        'TRANSACTIONS FOR',
        'ALL TRANSACTIONS BILLED',
        'DATE\\s+DESCRIPTION\\s+AMOUNT',
      ],
    };

    const crossYearPage = [
      'CITI CASH BACK PLUS MASTERCARD 5425 5045 0451 4636 Payment Due Date: February 16, 2026\n' +
      'DATE DESCRIPTION AMOUNT (SGD)\n' +
      'TRANSACTIONS FOR CITI CASH BACK PLUS MASTERCARD\n' +
      'ALL TRANSACTIONS BILLED IN SINGAPORE DOLLARS\n' +
      '28 DEC NTUC FAIRPRICE SINGAPORE SG 45.20\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '31 DEC GRAB SINGAPORE SG 12.50\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '02 JAN HAWKER CENTRE SINGAPORE SG 8.30\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '12 JAN UNIQLO SINGAPORE SG 59.90\n' +
      'XXXX-XXXX-XXXX-0016',
    ];

    const result = parseStatementText(crossYearPage, configWithFallback);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;

    assert.strictEqual(parsed.statementPeriodStart, '2025-12-28');
    assert.strictEqual(parsed.statementPeriodEnd, '2026-01-12');

    const ntucTx = parsed.transactions.find((t) =>
      t.description.includes('NTUC FAIRPRICE'),
    );
    const uniqloTx = parsed.transactions.find((t) =>
      t.description.includes('UNIQLO'),
    );

    assert.ok(ntucTx, 'Should find December transaction');
    assert.ok(uniqloTx, 'Should find January transaction');
    assert.strictEqual(ntucTx!.date, '2025-12-28');
    assert.strictEqual(uniqloTx!.date, '2026-01-12');
  });

  it('skips card number continuation lines with XXXX pattern', () => {
    const configWithSkip: BankFormatConfig = {
      ...citibankConfig,
      skip_patterns: [...citibankConfig.skip_patterns, '^XXXX-XXXX-XXXX-\\d{4}$'],
    };
    const page = [
      'Statement Period: 01/01/2026 to 31/01/2026\n' +
      '\n' +
      'NEW TRANSACTIONS\n' +
      '15 JAN GRAB TRANSPORT 15.00\n' +
      'XXXX-XXXX-XXXX-0016\n' +
      '16 JAN FAIRPRICE FINEST 89.00\n' +
      'XXXX-XXXX-XXXX-8521\n' +
      'SUB-TOTAL 104.00',
    ];
    const result = parseStatementText(page, configWithSkip);
    assert.strictEqual('transactions' in result, true);
    const parsed = result as ParseResult;
    assert.strictEqual(parsed.transactions.length, 2);
    // Card number should NOT be in description
    assert.ok(!parsed.transactions[0].description.includes('XXXX'));
    assert.ok(!parsed.transactions[1].description.includes('XXXX'));
  });
});
