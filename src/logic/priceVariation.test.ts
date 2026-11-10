import { calcVariation, roundPercent } from './priceVariation';

describe('calcVariation (REQ-08.4)', () => {
  it('un alza: pesos, porcentaje y dirección', () => {
    expect(calcVariation(800, 1000)).toEqual({ amount: 200, percent: 25, direction: 'up' });
  });

  it('una baja: pesos y porcentaje negativos', () => {
    expect(calcVariation(1000, 800)).toEqual({ amount: -200, percent: -20, direction: 'down' });
  });

  it('precios iguales: sin variación', () => {
    expect(calcVariation(900, 900)).toEqual({ amount: 0, percent: 0, direction: 'same' });
  });

  it('el porcentaje es sobre el precio anterior y no se redondea', () => {
    const { percent } = calcVariation(3, 4);
    expect(percent).toBeCloseTo(33.3333333, 6);
    expect(percent).not.toBe(33.3);
  });

  it('los pesos son siempre un entero', () => {
    expect(Number.isInteger(calcVariation(777, 1234).amount)).toBe(true);
  });

  it('el porcentaje es finito y mayor que -100, incluso con una baja extrema', () => {
    const { percent } = calcVariation(1_000_000, 1);
    expect(Number.isFinite(percent)).toBe(true);
    expect(percent).toBeGreaterThan(-100);
    expect(percent).toBeLessThan(-99.99);
  });

  it('un alza grande sigue siendo finita', () => {
    expect(calcVariation(1, 1_000_000)).toMatchObject({ amount: 999_999, direction: 'up' });
    expect(Number.isFinite(calcVariation(1, 1_000_000).percent)).toBe(true);
  });

  it('"same" ocurre solo cuando los precios son iguales', () => {
    expect(calcVariation(900, 901).direction).toBe('up');
    expect(calcVariation(901, 900).direction).toBe('down');
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '900' as unknown as number])(
    'rechaza el precio inválido %s, anterior o actual',
    (bad) => {
      expect(() => calcVariation(bad, 900)).toThrow(RangeError);
      expect(() => calcVariation(900, bad)).toThrow(RangeError);
    },
  );
});

describe('roundPercent', () => {
  it.each([
    [25, 1, 25],
    [33.3333, 1, 33.3],
    [66.666, 1, 66.7],
    [-33.3333, 1, -33.3],
    [12.345, 2, 12.35],
    [2.5, 0, 3],
    [-2.5, 0, -3],
    [0.04, 1, 0],
    [1.005, 2, 1.01], // en coma flotante 1,005 se guarda como 1,00499999999999989...
    [0.285, 2, 0.29],
    [1.255, 2, 1.26],
    [-1.005, 2, -1.01],
  ])('redondea %f a %i decimales: %f', (value, decimals, expected) => {
    expect(roundPercent(value, decimals)).toBe(expected);
  });

  it('usa 1 decimal por defecto', () => {
    expect(roundPercent(33.3333)).toBe(33.3);
  });

  it('es simétrico: el negativo de un valor se redondea al negativo de su redondeo', () => {
    for (const value of [0.05, 1.25, 12.35, 99.95, 2.5, 7.45, 33.35]) {
      expect(roundPercent(-value, 1)).toBe(-roundPercent(value, 1));
    }
  });

  it('nunca devuelve -0', () => {
    expect(Object.is(roundPercent(-0.04, 1), 0)).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rechaza el porcentaje %s', (value) => {
    expect(() => roundPercent(value)).toThrow(RangeError);
  });

  it.each([-1, 1.5, 21])('rechaza los decimales %s', (decimals) => {
    expect(() => roundPercent(10, decimals)).toThrow(RangeError);
  });
});
