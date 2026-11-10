import { expectCode } from '../testing/seededTestDb';

import { MAX_PRICE, MAX_QUANTITY, MIN_QUANTITY, validatePrice, validateQuantity } from './validation';

describe('validatePrice', () => {
  it('acepta enteros desde 1 hasta el máximo', () => {
    expect(validatePrice(1)).toBe(1);
    expect(validatePrice(MAX_PRICE)).toBe(MAX_PRICE);
  });

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    MAX_PRICE + 1,
    1e21,
    2 ** 53,
    2 ** 60,
    '900' as unknown as number,
    null as unknown as number,
  ])('rechaza %s', (value) => {
    expectCode(() => validatePrice(value), 'INVALID_PRICE');
  });
});

describe('validateQuantity', () => {
  it('acepta desde el mínimo hasta el máximo, con decimales', () => {
    expect(validateQuantity(MIN_QUANTITY)).toBe(MIN_QUANTITY);
    expect(validateQuantity(1.5)).toBe(1.5);
    expect(validateQuantity(MAX_QUANTITY)).toBe(MAX_QUANTITY);
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    5e-324,
    MIN_QUANTITY / 10,
    MAX_QUANTITY + 1,
    1e308,
    '2' as unknown as number,
  ])('rechaza %s', (value) => {
    expectCode(() => validateQuantity(value), 'INVALID_QUANTITY');
  });
});
