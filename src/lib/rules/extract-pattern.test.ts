import { describe, it, expect } from 'vitest';
import { extractPattern } from './extract-pattern';

describe('extractPattern', () => {
  it('strips location suffix and returns first word: "GRAB TRANSPORT SINGAPORE SG"', () => {
    expect(extractPattern('GRAB TRANSPORT SINGAPORE SG')).toBe('GRAB');
  });

  it('strips SINGAPORE suffix and returns first word: "NTUC FAIRPRICE SINGAPORE"', () => {
    expect(extractPattern('NTUC FAIRPRICE SINGAPORE')).toBe('NTUC');
  });

  it('strips card number suffix and returns first word: "SPOTIFY XXXX1234"', () => {
    expect(extractPattern('SPOTIFY XXXX1234')).toBe('SPOTIFY');
  });

  it('returns first word for simple description: "PAYMENT RECEIVED"', () => {
    expect(extractPattern('PAYMENT RECEIVED')).toBe('PAYMENT');
  });

  it('returns the single word when description is one word: "A"', () => {
    expect(extractPattern('A')).toBe('A');
  });

  it('trims whitespace: "  GRAB  "', () => {
    expect(extractPattern('  GRAB  ')).toBe('GRAB');
  });
});
