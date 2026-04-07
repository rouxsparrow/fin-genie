import { createHash } from 'crypto';

export function computeTransactionHash(
  date: string,
  description: string,
  amountCents: number,
  isDebit: boolean,
): string {
  const input = `${date}|${description}|${amountCents}|${isDebit}`;
  return createHash('sha256').update(input).digest('hex');
}
