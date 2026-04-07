import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractPattern } from './extract-pattern';

describe('extractPattern', () => {
  it('strips location suffix and returns first word: "GRAB TRANSPORT SINGAPORE SG"', () => {
    assert.equal(extractPattern('GRAB TRANSPORT SINGAPORE SG'), 'GRAB');
  });

  it('strips SINGAPORE suffix and returns first word: "NTUC FAIRPRICE SINGAPORE"', () => {
    assert.equal(extractPattern('NTUC FAIRPRICE SINGAPORE'), 'NTUC');
  });

  it('strips card number suffix and returns first word: "SPOTIFY XXXX1234"', () => {
    assert.equal(extractPattern('SPOTIFY XXXX1234'), 'SPOTIFY');
  });

  it('returns first word for simple description: "PAYMENT RECEIVED"', () => {
    assert.equal(extractPattern('PAYMENT RECEIVED'), 'PAYMENT');
  });

  it('returns the single word when description is one word: "A"', () => {
    assert.equal(extractPattern('A'), 'A');
  });

  it('trims whitespace: "  GRAB  "', () => {
    assert.equal(extractPattern('  GRAB  '), 'GRAB');
  });
});
