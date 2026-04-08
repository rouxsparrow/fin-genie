import { createHash } from 'crypto';

export function computeTransactionHash(
  date: string,
  description: string,
  amountCents: number,
  isDebit: boolean,
  sequenceIndex?: number,
): string {
  const base = `${date}|${description}|${amountCents}|${isDebit}`;
  const input = sequenceIndex !== undefined ? `${base}|${sequenceIndex}` : base;
  return createHash('sha256').update(input).digest('hex');
}
