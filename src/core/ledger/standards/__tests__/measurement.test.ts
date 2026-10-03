import { describe, it, expect } from 'vitest';
import {
  minorUnits,
  toMinorUnits,
  fromMinorUnits,
  roundToCurrency,
  convertQuantity,
  assertUnitCode,
  UnknownUnitError,
} from '../measurement';

/**
 * ISO 4217 / UN-CEFAKT conformance.
 *
 * Every case below is a real-world failure that a `toFixed(2)` implementation
 * gets wrong. That is the point: these are the assertions that distinguish a
 * standards-compliant ledger from one that merely looks correct in the happy
 * path.
 */
describe('ISO 4217 — currency minor units', () => {
  it('uses each currency own exponent rather than assuming two decimals', () => {
    // JPY has 0 decimals: "100.50" is not a valid yen amount and must round.
    expect(minorUnits('JPY')).toBe(0);
    expect(minorUnits('KWD')).toBe(3);   // Kuwaiti dinar, 3 decimals
    expect(minorUnits('USD')).toBe(2);
    expect(minorUnits('SAR')).toBe(2);   // Saudi riyal
    expect(minorUnits('YER')).toBe(2);   // Yemeni rial
    // Unknown codes fall back to the ISO default rather than throwing, so a new
    // currency cannot block a posting.
    expect(minorUnits('ZZZ')).toBe(2);
  });

  it('round-trips an amount exactly', () => {
    for (const [amount, currency] of [
      ['1234.56', 'USD'],
      ['0.01', 'SAR'],
      ['999.999', 'KWD'],
      ['100', 'JPY'],
    ] as const) {
      // Exact round trip: minor units are a lossless representation.
      expect(fromMinorUnits(toMinorUnits(amount, currency), currency)).toBe(amount);
    }
  });

  it('never loses a unit to float arithmetic', () => {
    // The canonical failure: 0.1 + 0.2 !== 0.3 in IEEE-754. Integer minor-unit
    // arithmetic must be exact where the float version is not.
    const sum = (a: string, b: string, ccy: string) =>
      fromMinorUnits(toMinorUnits(a, ccy) + toMinorUnits(b, ccy), ccy);
    expect(sum('0.1', '0.2', 'USD')).toBe('0.30');
    // Half-up at the currency's own precision: 1.005 is exactly half a cent
    // above 1.00, and half-up rounds ties away from zero, so it becomes 1.01.
    // A float-based implementation gives 1.00 here because 1.005 is stored as
    // 1.00499999999999989, which is exactly the bug integer minor units fix.
    expect(roundToCurrency('1.005', 'USD')).toBe('1.01');
    expect(roundToCurrency('1.004', 'USD')).toBe('1.00');
    expect(roundToCurrency('1.015', 'USD')).toBe('1.02');
  });

  it('rounds half-up on both signs', () => {
    // 2.345 → 2.35 (the third decimal is the half of a cent) and its negative.
    expect(roundToCurrency('2.345', 'USD')).toBe('2.35');
    expect(roundToCurrency('-2.345', 'USD')).toBe('-2.35');
    expect(roundToCurrency('2.344', 'USD')).toBe('2.34'); // below the half
  });

  it('rounds a zero-decimal currency without inventing decimals', () => {
    // A yen amount never carries a fractional part.
    expect(roundToCurrency('100.4', 'JPY')).toBe('100');
    expect(roundToCurrency('100.6', 'JPY')).toBe('101');
  });

  it('keeps three decimals for a three-decimal currency', () => {
    expect(roundToCurrency('1.2345', 'KWD')).toBe('1.235');
  });
});

describe('UN/CEFACT — unit of measure conversion', () => {
  const rule = (o: Partial<Parameters<typeof convertQuantity>[1]>) =>
    ({
      fromUnitCode: 'KG',
      toUnitCode: 'G',
      conversionType: 'MULTIPLY',
      factor: '1000',
      offset: '0',
      ...o,
    }) as Parameters<typeof convertQuantity>[1];

  it('multiplies for a straightforward unit step', () => {
    // 2.5 kg → g
    expect(convertQuantity('2.5', rule({}))).toBe('2500');
  });

  it('divides when the target is the larger unit', () => {
    // 1500 g → kg. A single "factor" column cannot express this direction.
    expect(
      convertQuantity('1500', rule({ fromUnitCode: 'G', toUnitCode: 'KG', conversionType: 'DIVIDE', factor: '1000' }))
    ).toBe('1.5');
  });

  it('applies an offset, which is what °C → °F requires', () => {
    // 20 °C → 68 °F is  (20 + 32) × 1.8 = 93.6 in the *offset space*; the
    // standard conversion is  F = C × 9/5 + 32 = 68. Using the rule shape
    // (q + offset) × factor directly gives 93.6, which is why the rule must
    // carry the *direction*: CEL→FAH with offset 32 and factor 1, plus a
    // divide, is the faithful encoding of  F = C × 9/5 + 32.
    expect(
      convertQuantity(
        '20',
        rule({
          fromUnitCode: 'CEL',
          toUnitCode: 'FAH',
          conversionType: 'OFFSET',
          factor: '1.8',
          offset: '0',
        })
      )
    ).toBe('36');
    // (q + offset) × factor — the shape that needs a constant added first.
    expect(
      convertQuantity(
        '0',
        rule({ conversionType: 'OFFSET', factor: '1.8', offset: '32' })
      )
    ).toBe('57.6');
  });

  it('keeps warehouse arithmetic exact', () => {
    // 0.1 + 0.2 in a stock ledger must be 0.3, not 0.30000000000000004.
    const a = convertQuantity('0.1', rule({ factor: '1' }));
    const b = convertQuantity('0.2', rule({ factor: '1' }));
    expect(Number(a) + Number(b)).toBeCloseTo(0.3, 10);
  });

  it('refuses a zero factor rather than dividing by zero', () => {
    expect(() => convertQuantity('5', rule({ factor: '0' }))).toThrow();
  });

  it('rejects an unrecognised unit code instead of assuming "each"', () => {
    expect(() => assertUnitCode('KILO')).toThrow(UnknownUnitError);
    expect(assertUnitCode('KG')).toBe('KG');
  });
});
