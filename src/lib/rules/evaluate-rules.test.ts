import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRules } from './evaluate-rules';
import type { TransactionLike, RuleLike } from './evaluate-rules';

describe('evaluateRules', () => {
  const transportCatId = 'cat-transport';
  const cardPaymentCatId = 'cat-card-payment';
  const groceriesCatId = 'cat-groceries';

  it('returns correct Map for mixed transactions and rules', () => {
    const transactions: TransactionLike[] = [
      { hash: 'tx1', description: 'GRAB TRANSPORT SG' },
      { hash: 'tx2', description: 'NTUC FAIRPRICE' },
      { hash: 'tx3', description: 'PAYMENT RECEIVED' },
    ];
    const rules: RuleLike[] = [
      { category_id: transportCatId, pattern: 'GRAB', match_type: 'substring' },
      { category_id: cardPaymentCatId, pattern: 'PAYMENT', match_type: 'substring' },
    ];

    const result = evaluateRules(transactions, rules);

    assert.equal(result.get('tx1'), transportCatId);
    assert.equal(result.get('tx3'), cardPaymentCatId);
    assert.equal(result.has('tx2'), false);
  });

  it('first-match-wins: earlier rule takes priority', () => {
    const transactions: TransactionLike[] = [
      { hash: 'tx1', description: 'GRAB TRANSPORT' },
    ];
    const rules: RuleLike[] = [
      { category_id: transportCatId, pattern: 'GRAB', match_type: 'substring' },
      { category_id: groceriesCatId, pattern: 'GRAB TRANSPORT', match_type: 'substring' },
    ];

    const result = evaluateRules(transactions, rules);

    assert.equal(result.get('tx1'), transportCatId);
  });

  it('substring match is case-insensitive', () => {
    const transactions: TransactionLike[] = [
      { hash: 'tx1', description: 'GRAB TRANSPORT' },
    ];
    const rules: RuleLike[] = [
      { category_id: transportCatId, pattern: 'grab', match_type: 'substring' },
    ];

    const result = evaluateRules(transactions, rules);

    assert.equal(result.get('tx1'), transportCatId);
  });

  it('regex match works correctly', () => {
    const transactions: TransactionLike[] = [
      { hash: 'tx1', description: 'GRAB TRANSPORT' },
      { hash: 'tx2', description: 'UBER GRAB' },
    ];
    const rules: RuleLike[] = [
      { category_id: transportCatId, pattern: '^GRAB', match_type: 'regex' },
    ];

    const result = evaluateRules(transactions, rules);

    assert.equal(result.get('tx1'), transportCatId);
    assert.equal(result.has('tx2'), false);
  });

  it('invalid regex pattern never matches, does not throw', () => {
    const transactions: TransactionLike[] = [
      { hash: 'tx1', description: 'SOME DESCRIPTION' },
    ];
    const rules: RuleLike[] = [
      { category_id: transportCatId, pattern: '[invalid', match_type: 'regex' },
    ];

    const result = evaluateRules(transactions, rules);

    assert.equal(result.size, 0);
  });

  it('empty transactions array returns empty Map', () => {
    const rules: RuleLike[] = [
      { category_id: transportCatId, pattern: 'GRAB', match_type: 'substring' },
    ];

    const result = evaluateRules([], rules);

    assert.equal(result.size, 0);
  });

  it('empty rules array returns empty Map', () => {
    const transactions: TransactionLike[] = [
      { hash: 'tx1', description: 'GRAB TRANSPORT' },
    ];

    const result = evaluateRules(transactions, []);

    assert.equal(result.size, 0);
  });
});
