import { calcSubtotal } from './calcSubtotal';
import { computeListEstimate, type EstimateLineInput } from './computeListEstimate';
import { estimatePrice } from './estimatePrice';
import type { EstimateContext, ReferencePrice } from './pricingTypes';
import { makePricePoint } from './testing/pricePointBuilder';

const FERIA = 1;
const CONDES = 10;
const context: EstimateContext = { parentTagId: FERIA, siteTagIds: [CONDES] };

const tomateRef: ReferencePrice = { price: 800, defaultUnit: 'kg' };
const huevoRef: ReferencePrice = { price: 300, defaultUnit: 'unit' };

/** Tomate: 2 kg con historial en el mismo sitio a 900 el kilo. */
const tomate = (over: Partial<EstimateLineInput> = {}): EstimateLineInput => ({
  itemId: 1,
  quantity: 2,
  unit: 'kg',
  manualPrice: null,
  history: [makePricePoint({ id: 1, price: 900, siteTagIds: [CONDES] })],
  reference: tomateRef,
  ...over,
});

/** Huevos: 5 unidades sin historial, usan la referencia de 300 por unidad. */
const huevos = (over: Partial<EstimateLineInput> = {}): EstimateLineInput => ({
  itemId: 2,
  quantity: 5,
  unit: 'unit',
  manualPrice: null,
  history: [],
  reference: huevoRef,
  ...over,
});

describe('total por defecto (REQ-07.1)', () => {
  it('una lista vacía da total 0 y no hay estimación manual', () => {
    expect(computeListEstimate({ context, items: [] })).toEqual({
      lines: [],
      defaultTotal: 0,
      manualTotal: null,
      hasManualEstimate: false,
    });
  });

  it('suma los subtotales de todos los ítems', () => {
    const result = computeListEstimate({ context, items: [tomate(), huevos()] });
    expect(result.lines.map((l) => l.defaultSubtotal)).toEqual([1800, 1500]);
    expect(result.defaultTotal).toBe(3300);
  });

  it('cada línea usa estimatePrice y calcSubtotal sin duplicar sus reglas', () => {
    const item = tomate({ quantity: 3, unit: 'quarter_kg' });
    const { lines } = computeListEstimate({ context, items: [item] });
    const expectedEstimate = estimatePrice({ unit: item.unit, context, history: item.history, reference: item.reference });
    expect(lines[0].estimate).toEqual(expectedEstimate);
    expect(lines[0].defaultSubtotal).toBe(
      calcSubtotal({ unitPrice: expectedEstimate.price, quantity: 3, unit: 'quarter_kg' }),
    );
  });

  it('el total es la suma exacta de subtotales ya redondeados', () => {
    // 850 × 3 × 0,25 = 637,5 → 638 en cada línea; dos líneas = 1276 (no 1275).
    const history = [makePricePoint({ id: 1, price: 850, siteTagIds: [CONDES] })];
    const items = [
      tomate({ itemId: 1, quantity: 3, unit: 'quarter_kg', history }),
      tomate({ itemId: 2, quantity: 3, unit: 'quarter_kg', history }),
    ];
    const result = computeListEstimate({ context, items });
    expect(result.defaultTotal).toBe(1276);
    expect(result.defaultTotal).toBe(result.lines.reduce((sum, l) => sum + l.defaultSubtotal, 0));
  });

  it('mantiene el orden de los ítems recibidos', () => {
    const result = computeListEstimate({ context, items: [huevos({ itemId: 9 }), tomate({ itemId: 4 }), huevos({ itemId: 7 })] });
    expect(result.lines.map((l) => l.itemId)).toEqual([9, 4, 7]);
  });

  it('aplica las etiquetas de la lista a cada ítem con su propio historial', () => {
    const other: EstimateContext = { parentTagId: FERIA, siteTagIds: [] };
    const withSite = computeListEstimate({ context, items: [tomate()] });
    const withoutSite = computeListEstimate({
      context: other,
      items: [tomate({ history: [makePricePoint({ id: 1, price: 900, siteTagIds: [99] })] })],
    });
    expect(withSite.lines[0].estimate.source).toBe('site');
    expect(withoutSite.lines[0].estimate.source).toBe('parent');
  });
});

describe('todas las líneas tienen precio (REQ-07.3)', () => {
  it('cada línea trae un precio estimado entero mayor o igual a 1', () => {
    const { lines } = computeListEstimate({ context, items: [tomate(), huevos(), huevos({ itemId: 3, history: [] })] });
    for (const line of lines) {
      expect(Number.isInteger(line.estimate.price) && line.estimate.price >= 1).toBe(true);
    }
  });
});

describe('estimación manual (REQ-07.4, REQ-07.5)', () => {
  it('sin precios manuales no hay estimación manual', () => {
    const result = computeListEstimate({ context, items: [tomate(), huevos()] });
    expect(result.hasManualEstimate).toBe(false);
    expect(result.manualTotal).toBeNull();
    for (const line of result.lines) {
      expect(line.manualPrice).toBeNull();
      expect(line.manualSubtotal).toBe(line.defaultSubtotal);
    }
  });

  it('con algún precio manual, usa ese precio donde existe y el de por defecto en el resto', () => {
    const result = computeListEstimate({ context, items: [tomate({ manualPrice: 1000 }), huevos()] });
    expect(result.hasManualEstimate).toBe(true);
    expect(result.lines[0].manualSubtotal).toBe(2000); // 1000 × 2 kg
    expect(result.lines[1].manualSubtotal).toBe(1500); // sin precio manual: el de por defecto
    expect(result.manualTotal).toBe(3500);
  });

  it('el total manual es la suma exacta de los subtotales manuales', () => {
    const result = computeListEstimate({
      context,
      items: [tomate({ manualPrice: 1000 }), huevos({ manualPrice: 350 }), huevos({ itemId: 3 })],
    });
    expect(result.manualTotal).toBe(result.lines.reduce((sum, l) => sum + l.manualSubtotal, 0));
  });

  it('el precio manual no cambia el total por defecto: ambos totales están disponibles', () => {
    const base = computeListEstimate({ context, items: [tomate(), huevos()] });
    const withManual = computeListEstimate({ context, items: [tomate({ manualPrice: 5000 }), huevos()] });
    expect(withManual.defaultTotal).toBe(base.defaultTotal);
    expect(withManual.manualTotal).not.toBe(withManual.defaultTotal);
  });

  it('el precio por defecto de una línea no cambia por tener precio manual', () => {
    const plain = computeListEstimate({ context, items: [tomate()] }).lines[0];
    const manual = computeListEstimate({ context, items: [tomate({ manualPrice: 5000 })] }).lines[0];
    expect(manual.estimate).toEqual(plain.estimate);
    expect(manual.defaultSubtotal).toBe(plain.defaultSubtotal);
  });
});

describe('entradas inválidas (fallar fuerte)', () => {
  it.each([0, -1, 1.5, Number.NaN, undefined])('rechaza el precio manual %s', (manualPrice) => {
    expect(() => computeListEstimate({ context, items: [tomate({ manualPrice: manualPrice as never })] })).toThrow(RangeError);
  });

  it('acepta null como "sin precio manual"', () => {
    expect(() => computeListEstimate({ context, items: [tomate({ manualPrice: null })] })).not.toThrow();
  });

  it('propaga el error de una cantidad o una unidad inválidas', () => {
    expect(() => computeListEstimate({ context, items: [tomate({ quantity: 0 })] })).toThrow(RangeError);
    expect(() => computeListEstimate({ context, items: [tomate({ unit: 'litro' as never })] })).toThrow(RangeError);
  });

  it('rechaza un total que no cabe en un entero seguro', () => {
    const huge = (itemId: number) =>
      huevos({ itemId, quantity: 1, history: [makePricePoint({ id: itemId, price: 2 ** 52, priceBasis: 'unit' })] });
    expect(() => computeListEstimate({ context, items: [huge(1), huge(2), huge(3)] })).toThrow(RangeError);
  });
});

describe('pureza', () => {
  it('no modifica los ítems, sus historiales ni el contexto', () => {
    const items = Object.freeze([
      Object.freeze(tomate({ history: Object.freeze([makePricePoint({ id: 1, price: 900, siteTagIds: [CONDES] })]) as never })),
      Object.freeze(huevos()),
    ]);
    const frozenContext = Object.freeze({ parentTagId: FERIA, siteTagIds: Object.freeze([CONDES]) }) as EstimateContext;
    const before = JSON.stringify(items);
    expect(() => computeListEstimate({ context: frozenContext, items })).not.toThrow();
    expect(JSON.stringify(items)).toBe(before);
  });

  it('da el mismo resultado cada vez', () => {
    const items = [tomate({ manualPrice: 1000 }), huevos()];
    expect(computeListEstimate({ context, items })).toEqual(computeListEstimate({ context, items }));
  });
});
