/**
 * Measurement standards — ISO 4217 (currency) and UN/CEFACT (unit of measure).
 *
 * These are the arithmetic that silently corrupts an ERP when it is wrong.
 * Neither is a formatting concern: both decide the *number* that ends up in the
 * ledger, and both are the kind of bug that survives a decade, because the
 * result still looks plausible.
 *
 * THE CENTRAL RULE
 * Every amount crosses the boundary as a decimal *string*, and every operation
 * is integer arithmetic on minor units. `number` is IEEE-754 and cannot hold
 * 0.1 + 0.2 exactly — which is the entire reason decimal money exists. A single
 * `toFixed(2)` at the end is not a substitute: the error is already baked into
 * the intermediate values by then.
 */

/** ISO 4217 exponents for the currencies an ERP actually meets. */
export const CURRENCY_MINOR_UNITS: Readonly<Record<string, number>> = Object.freeze({
  // 0 decimals
  JPY: 0, KRW: 0, VND: 0, CLP: 0, ISK: 0, XOF: 0, XAF: 0, XPF: 0, UGX: 0,
  // 3 decimals
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  // 4 decimals
  CLF: 4, UYW: 4,
  // default 2: USD, SAR, AED, EGP, YER, EUR, GBP …
});

/** Decimal places for a currency. ISO 4217 default is 2. */
export function minorUnits(currency: string): number {
  return CURRENCY_MINOR_UNITS[currency.toUpperCase()] ?? 2;
}

/**
 * Decimal string → integer units at an arbitrary precision.
 *
 * This is the general form; `toMinorUnits` is the currency-typed wrapper. It is
 * separate because rounding needs a precision *wider* than the currency's own
 * (see `roundToCurrency`), and typing that intermediate as money would be a lie.
 */
export function toDecimalUnits(value: string | number, decimals: number): bigint {
  const negative = String(value).trim().startsWith('-');
  const [intPart = '0', fracPart = ''] = String(value).trim().replace(/^-/, '').split('.');
  const intAbs = BigInt((intPart || '0').replace(/[^\d]/g, '') || '0');
  const fracAbs = BigInt((fracPart + '0'.repeat(decimals)).slice(0, decimals) || '0');
  const total = intAbs * 10n ** BigInt(decimals) + fracAbs;
  return negative ? -total : total;
}

/** Decimal string → integer minor units, exactly. */
export function toMinorUnits(amount: string | number, currency: string): bigint {
  return toDecimalUnits(amount, minorUnits(currency));
}

/**
 * Integer minor units → decimal string.
 *
 * `major()` exists because ISO 4217 minor units can be negative, so a naive
 * `/ base` in BigInt truncates toward zero and silently loses one minor unit
 * for JPY (where the exponent is 0 and `1 / 10**0` is a division that must not
 * happen at all).
 */
function major(units: bigint, digits: number): { whole: bigint; frac: bigint } {
  const base = 10n ** BigInt(digits);
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / base;
  const frac = abs % base;
  return { whole: negative ? -whole : whole, frac };
}

/** Integer minor units → decimal string, with the sign preserved. */
export function fromMinorUnits(units: bigint, currency: string): string {
  const digits = minorUnits(currency);
  const base = 10n ** BigInt(digits);
  // BigInt division truncates toward zero, so the sign is carried explicitly
  // rather than being baked into `whole` — otherwise a negative amount renders
  // as e.g. 1.00.-23, which is not a number anything downstream can parse.
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / base;
  const frac = abs % base;
  const sign = negative ? '-' : '';
  if (digits === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${frac.toString().padStart(digits, '0')}`;
}

/**
 * Round a decimal amount to the currency's minor units, half-up.
 *
 * Half-up rather than half-even because that is what ZATCA and most tax
 * authorities expect. `Math.round` is not usable here: it coerces through a
 * float, so it is lossy for exactly the values that matter.
 */
export function roundToCurrency(amount: string | number, currency: string): string {
  const digits = minorUnits(currency);
  const negative = String(amount).trim().startsWith('-');
  const magnitude = String(amount).trim().replace(/^-/, '');

  // Split the magnitude into the part representable at the currency's own
  // precision and the part beyond it. That remainder is exactly what decides
  // half-up, and truncating it away first is the classic ledger bug: '1.005'
  // becomes 1.00 before the comparison ever happens.
  const [wholePart = '0', fracPart = ''] = magnitude.split('.');
  const keptFrac = fracPart.slice(0, digits).padEnd(digits, '0');
  const droppedFrac = fracPart.slice(digits);

  const base = digits > 0 ? BigInt(10n ** BigInt(digits)) : 1n;
  let minor = BigInt(wholePart || '0') * base + (digits > 0 ? BigInt(keptFrac || '0') : 0n);

  // Round up when the dropped digits reach half a minor unit.
  //
  // For a 2-decimal currency the dropped part is compared against half of the
  // *last* kept place, so 2.345 → 235 and 2.344 → 234. A zero-decimal currency
  // has no kept fraction, so the decision falls to the first dropped digit:
  // 100.6 → 101, 100.4 → 100. The `digits > 0` guard must NOT skip that case,
  // which is why this branch is entered whenever anything was dropped at all.
  if (droppedFrac) {
    const half = 5n * 10n ** BigInt(Math.max(0, droppedFrac.length - 1));
    if (BigInt(droppedFrac) >= half) minor += 1n;
  }

  return fromMinorUnits(negative ? -minor : minor, currency);
}

// ─── UN/CEFACT unit of measure ─────────────────────────────────────────────────

export type ConversionType = 'MULTIPLY' | 'DIVIDE' | 'OFFSET';

export interface ConversionRule {
  fromUnitCode: string;
  toUnitCode: string;
  conversionType: ConversionType;
  factor: string;
  offset: string;
  /** Target unit's smallest increment, e.g. '0.001' for kg. */
  roundingIncrement?: string;
}

export class UnknownUnitError extends Error {
  constructor(code: string) {
    super(`unknown unit of measure: ${code}`);
    this.name = 'UnknownUnitError';
  }
}

/** Decimal string → integer units at `decimals` places. */
export function toQuantityUnits(value: string | number, decimals: number): bigint {
  const negative = String(value).trim().startsWith('-');
  const [intPart = '0', fracPart = ''] = String(value).trim().replace(/^-/, '').split('.');
  const intAbs = BigInt((intPart || '0').replace(/[^\d]/g, '') || '0');
  const fracAbs = BigInt((fracPart + '0'.repeat(decimals)).slice(0, decimals) || '0');
  const total = intAbs * 10n ** BigInt(decimals) + fracAbs;
  return negative ? -total : total;
}

/** Integer units at `decimals` places → decimal string, trailing zeros trimmed. */
export function fromQuantityUnits(units: bigint, decimals: number): string {
  if (decimals <= 0) return units.toString();
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = (abs % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  const body = frac ? `${whole}.${frac}` : `${whole}`;
  return negative ? `-${body}` : body;
}

/**
 * Convert a quantity between units of measure (UN/CEFACT Rec 20).
 *
 * A single `conversionFactor` cannot express 100 kg → lb (a division) let alone
 * °C → °F (an offset), which is exactly why UN/CEFACT models the *method*
 * separately from the factor. The three shapes are:
 *
 *   MULTIPLY  q' = q × factor                       kg → g
 *   DIVIDE    q' = q ÷ factor                       kg → t
 *   OFFSET    q' = (q + offset) × factor            °C → °F
 *
 * The arithmetic is integer, for the same reason money is: a warehouse quantity
 * of 0.1 + 0.2 must be 0.3, not 0.30000000000000004.
 */
export function convertQuantity(
  quantity: string | number,
  rule: ConversionRule,
  decimals = 4
): string {
  const factorUnits = toQuantityUnits(rule.factor, decimals);

  if (rule.conversionType !== 'OFFSET' && factorUnits === 0n) {
    throw new Error('conversion factor may not be zero');
  }

  const q = toQuantityUnits(quantity, decimals);
  const scale = 10n ** BigInt(decimals);
  let numerator: bigint;
  let denominator: bigint;

  switch (rule.conversionType) {
    case 'MULTIPLY':
      numerator = q * factorUnits;
      denominator = scale;
      break;
    case 'DIVIDE':
      numerator = q * scale;
      denominator = factorUnits;
      break;
    case 'OFFSET':
      numerator = (q + toQuantityUnits(rule.offset, decimals)) * factorUnits;
      denominator = scale;
      break;
    default: {
      // Exhaustive: an unknown method must fail loudly rather than assume a
      // factor, because a wrong stock quantity is worse than a rejected one.
      const exhaustive: never = rule.conversionType;
      throw new Error(`unsupported conversion type: ${String(exhaustive)}`);
    }
  }

  // Half-up integer division: (2n + d) / 2d rounds .5 upwards without floats.
  const result = (2n * numerator + denominator) / (2n * denominator);
  return fromQuantityUnits(result, decimals);
}

/** Throws on an unrecognised unit code instead of defaulting to "each". */
export function assertUnitCode(code: string): string {
  // UN/EDIFACT Rec 20 and GS1 codes are 2–3 uppercase alphanumerics (KG, G, M2,
  // PCS). A longer token is a typo such as 'KILO' that would otherwise pass
  // silently and yield a wrong quantity, so it is rejected here.
  if (!/^[A-Z0-9]{2,3}$/.test(code)) {
    throw new UnknownUnitError(code);
  }
  return code;
}
