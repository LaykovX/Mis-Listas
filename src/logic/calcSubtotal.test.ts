import { UNITS, type Unit } from '@/db/constants';

import { calcSubtotal } from './calcSubtotal';

describe('calcSubtotal con unidades por kilo (REQ-03.3)', () => {
  it.each([
    // [precio por kg, cantidad, unidad, subtotal esperado]
    [1000, 2, 'half_kg', 1000],
    [1000, 1, 'kg', 1000],
    [1000, 3, 'kg', 3000],
    [900, 1, 'quarter_kg', 225],
    [2000, 4, 'quarter_kg', 2000],
    [850, 3, 'quarter_kg', 638],
  ] as const)('%i por kg × %f de %s = %i', (unitPrice, quantity, unit, expected) => {
    expect(calcSubtotal({ unitPrice, quantity, unit })).toBe(expected);
  });

  it('admite cantidades decimales', () => {
    expect(calcSubtotal({ unitPrice: 2000, quantity: 1.5, unit: 'kg' })).toBe(3000);
    expect(calcSubtotal({ unitPrice: 1000, quantity: 0.5, unit: 'kg' })).toBe(500);
  });
});

describe('calcSubtotal con unidades sueltas (REQ-03.4)', () => {
  it('multiplica el precio por unidad por la cantidad', () => {
    expect(calcSubtotal({ unitPrice: 300, quantity: 12, unit: 'unit' })).toBe(3600);
    expect(calcSubtotal({ unitPrice: 1500, quantity: 1, unit: 'unit' })).toBe(1500);
  });

  it('no aplica ningún factor de kilo a las unidades', () => {
    expect(calcSubtotal({ unitPrice: 400, quantity: 5, unit: 'unit' })).toBe(2000);
  });
});

describe('redondeo a pesos enteros', () => {
  it('redondea el .5 hacia arriba', () => {
    // 850 × 3 × 0,25 = 637,5
    expect(calcSubtotal({ unitPrice: 850, quantity: 3, unit: 'quarter_kg' })).toBe(638);
    // 3 × 0,5 × 1 = 1,5
    expect(calcSubtotal({ unitPrice: 3, quantity: 1, unit: 'half_kg' })).toBe(2);
  });

  it('redondea hacia abajo por debajo de .5', () => {
    // 1 × 1 × 0,25 = 0,25
    expect(calcSubtotal({ unitPrice: 1, quantity: 1, unit: 'quarter_kg' })).toBe(0);
    // 901 × 0,25 = 225,25
    expect(calcSubtotal({ unitPrice: 901, quantity: 1, unit: 'quarter_kg' })).toBe(225);
  });

  it('siempre devuelve un número entero', () => {
    for (const unit of UNITS) {
      expect(Number.isInteger(calcSubtotal({ unitPrice: 777, quantity: 1.37, unit }))).toBe(true);
    }
  });
});

describe('empates con cantidades decimales (error de coma flotante)', () => {
  // Cada caso vale exactamente x,5 con las cuentas en papel; en coma flotante el producto sale
  // un poco por debajo (502,49999999999994) y un redondeo ingenuo daría un peso menos.
  it.each([
    [500, 2.01, 'half_kg', 503], // 500 × 2,01 × 0,5 = 502,5
    [500, 2.03, 'half_kg', 508], // 507,5
    [500, 4.02, 'quarter_kg', 503], // 502,5
    [25, 0.58, 'unit', 15], // 14,5
  ] as const)('%i × %f de %s redondea el .5 hacia arriba: %i', (unitPrice, quantity, unit, expected) => {
    expect(calcSubtotal({ unitPrice, quantity, unit })).toBe(expected);
  });

  it('no sube un valor que está claramente por debajo del .5', () => {
    expect(calcSubtotal({ unitPrice: 1000, quantity: 0.1234, unit: 'unit' })).toBe(123); // 123,4
    expect(calcSubtotal({ unitPrice: 999, quantity: 1, unit: 'quarter_kg' })).toBe(250); // 249,75
  });
});

describe('la cantidad se toma con hasta 6 decimales', () => {
  it('una cantidad con más decimales se redondea a la millonésima antes de calcular', () => {
    expect(calcSubtotal({ unitPrice: 900, quantity: 1 / 3, unit: 'unit' })).toBe(300); // 899,9997 → 300
    expect(calcSubtotal({ unitPrice: 3, quantity: 0.0000004, unit: 'unit' })).toBe(0);
  });

  it('rechaza una cantidad tan grande que ya no se puede representar con exactitud', () => {
    expect(() => calcSubtotal({ unitPrice: 1000, quantity: 1e12, unit: 'unit' })).toThrow(RangeError);
  });
});

describe('subtotal cero por redondeo (decisión documentada)', () => {
  it('un ítem de precio y cantidad mínimos puede valer 0 pesos: se redondea al peso, no se oculta', () => {
    expect(calcSubtotal({ unitPrice: 1, quantity: 1, unit: 'quarter_kg' })).toBe(0);
    expect(calcSubtotal({ unitPrice: 1, quantity: 0.001, unit: 'unit' })).toBe(0);
  });
});

describe('unidades de venta (REQ-03.2)', () => {
  it('cada unidad de UNITS tiene un cálculo definido', () => {
    for (const unit of UNITS) {
      expect(() => calcSubtotal({ unitPrice: 1000, quantity: 1, unit })).not.toThrow();
    }
  });

  it('cada unidad por kilo usa su factor, escrito aquí a mano y no leído del código', () => {
    const factors = { kg: 1, half_kg: 0.5, quarter_kg: 0.25 } as const;
    for (const unit of UNITS.filter((u): u is Exclude<Unit, 'unit'> => u !== 'unit')) {
      expect(calcSubtotal({ unitPrice: 4000, quantity: 1, unit })).toBe(4000 * factors[unit]);
    }
  });
});

describe('entradas inválidas (fallar fuerte ante datos corruptos)', () => {
  const ok = { unitPrice: 1000, quantity: 1, unit: 'kg' as const };

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 60, '900' as unknown as number])(
    'rechaza el precio %s con RangeError',
    (unitPrice) => {
      expect(() => calcSubtotal({ ...ok, unitPrice })).toThrow(RangeError);
    },
  );

  it.each([0, -2, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '2' as unknown as number])(
    'rechaza la cantidad %s con RangeError',
    (quantity) => {
      expect(() => calcSubtotal({ ...ok, quantity })).toThrow(RangeError);
    },
  );

  it.each(['litro', '', 'KG', undefined, null])('rechaza la unidad %s con RangeError', (unit) => {
    expect(() => calcSubtotal({ ...ok, unit: unit as never })).toThrow(RangeError);
  });

  it('rechaza un resultado que no cabe en un entero seguro', () => {
    expect(() => calcSubtotal({ unitPrice: 2 ** 52, quantity: 1000, unit: 'unit' })).toThrow(RangeError);
  });
});

describe('pureza', () => {
  it('no modifica sus argumentos', () => {
    const input = Object.freeze({ unitPrice: 900, quantity: 2, unit: 'kg' as const });
    expect(() => calcSubtotal(input)).not.toThrow();
    expect(input).toEqual({ unitPrice: 900, quantity: 2, unit: 'kg' });
  });

  it('da el mismo resultado cada vez', () => {
    const input = { unitPrice: 850, quantity: 3, unit: 'quarter_kg' as const };
    expect(calcSubtotal(input)).toBe(calcSubtotal(input));
  });
});
