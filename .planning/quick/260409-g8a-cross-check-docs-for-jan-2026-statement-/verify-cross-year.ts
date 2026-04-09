import assert from 'node:assert/strict';
import { parseStatementText } from '../../../src/lib/parser/parse-statement';
import type { BankFormatConfig, ParseResult } from '../../../src/lib/parser/types';

const configWithFallback: BankFormatConfig = {
  statement_period: {
    pattern: 'Statement\\s+Period[:\\s]+(.+?)\\s+to\\s+(.+)',
    date_format: 'dd/MM/yyyy',
  },
  period_fallback: {
    year_hint_pattern: 'Payment Due Date:\\s+(.+?)\\s*$',
    year_hint_format: 'MMMM d, yyyy',
    strategy: 'infer_from_transactions',
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
    '^XXXX-XXXX-XXXX-\\d{4}$',
    'TRANSACTIONS FOR',
    'ALL TRANSACTIONS BILLED',
    'DATE\\s+DESCRIPTION\\s+AMOUNT',
    '^Page \\d+ of \\d+',
    'EPSTCSX',
    'Co Reg No',
    'Citibank Singapore',
    'Robinson Road',
    'CITI CASH BACK',
    'Retail Interest Rate',
    'monthly interest charges',
    'KINDLY ENSURE',
    'KINDLY CALL',
    '^\\d{10,}$',
    '^1000$',
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
assert.ok('transactions' in result, 'expected ParseResult');

const parsed = result as ParseResult;
assert.strictEqual(parsed.statementPeriodStart, '2025-12-28');
assert.strictEqual(parsed.statementPeriodEnd, '2026-01-12');

const ntucTx = parsed.transactions.find((tx) =>
  tx.description.includes('NTUC FAIRPRICE'),
);
const uniqloTx = parsed.transactions.find((tx) =>
  tx.description.includes('UNIQLO'),
);

assert.ok(ntucTx);
assert.ok(uniqloTx);
assert.strictEqual(ntucTx.date, '2025-12-28');
assert.strictEqual(uniqloTx.date, '2026-01-12');

console.log('cross-year fallback verification passed');
