import type { MatchType } from '@/lib/types/database';

export interface TransactionLike {
  hash: string;
  description: string;
}

export interface RuleLike {
  category_id: string;
  pattern: string;
  match_type: MatchType;
}

/**
 * Evaluate rules against transactions. Rules MUST be pre-sorted by sort_order ascending.
 * System rules (sort_order 0) should be first.
 * First-match-wins: each transaction gets the category of the first matching rule.
 * Returns Map<hash, category_id>.
 */
export function evaluateRules(
  transactions: TransactionLike[],
  rules: RuleLike[],
): Map<string, string> {
  const result = new Map<string, string>();

  for (const tx of transactions) {
    for (const rule of rules) {
      if (matchesRule(rule, tx.description)) {
        result.set(tx.hash, rule.category_id);
        break;
      }
    }
  }

  return result;
}

function matchesRule(rule: RuleLike, description: string): boolean {
  if (rule.match_type === 'regex') {
    try {
      return new RegExp(rule.pattern, 'i').test(description);
    } catch {
      return false;
    }
  }
  return description.toLowerCase().includes(rule.pattern.toLowerCase());
}
