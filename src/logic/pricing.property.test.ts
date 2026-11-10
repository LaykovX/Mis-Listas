import * as fc from 'fast-check';

import type { Unit } from '@/db/constants';

import { calcSubtotal, calcVariation, computeListEstimate, estimatePrice, summarizeHistory } from './index';
import type { EstimateContext, PricePoint, ReferencePrice } from './pricingTypes';
import {
  basisArb,
  contextArb,
  historyArb,
  linesArb,
  priceArb,
  quantityArb,
  referenceArb,
  unitArb,
} from './testing/pricingArbitraries';

const RUNS = { numRuns: 200 };

/** Factores escritos a mano y por separado del código (no se importa KG_PER_PORTION a propósito). */
const FACTOR: Record<Unit, number> = { unit: 1, kg: 1, half_kg: 0.5, quarter_kg: 0.25 };

/**
 * Oráculo: calcula el precio esperado de otra manera que el código (ordenando una copia y
 * tomando el primero, en vez de recorrer buscando el máximo), para que un error de lógica no
 * se repita en la prueba.
 */
function oracleEstimate(unit: Unit, ctx: EstimateContext, history: readonly PricePoint[], ref: ReferencePrice) {
  const basis = unit === 'unit' ? 'unit' : 'kg';
  const key = (p: PricePoint) => `${p.recordedDate}|${p.recordedAt}|${String(p.id).padStart(10, '0')}`;
  const newestFirst = history
    .filter((p) => p.priceBasis === basis && p.parentTagId === ctx.parentTagId)
    .sort((a, b) => (key(a) < key(b) ? 1 : -1));
  const site = newestFirst.find((p) => p.siteTagIds.some((tag) => ctx.siteTagIds.includes(tag)));
  if (site) return { price: site.price, source: 'site' as const };
  if (newestFirst[0]) return { price: newestFirst[0].price, source: 'parent' as const };
  return { price: ref.price, source: 'reference' as const };
}

describe('propiedad 1: el total es la suma de los subtotales (REQ-07.1)', () => {
  it('defaultTotal y manualTotal son exactamente la suma de las líneas', () => {
    fc.assert(
      fc.property(contextArb, linesArb, (context, items) => {
        const result = computeListEstimate({ context, items });
        const defaultSum = result.lines.reduce((sum, line) => sum + line.defaultSubtotal, 0);
        const manualSum = result.lines.reduce((sum, line) => sum + line.manualSubtotal, 0);
        const anyManual = items.some((item) => item.manualPrice !== null);

        expect(result.defaultTotal).toBe(defaultSum);
        expect(result.hasManualEstimate).toBe(anyManual);
        expect(result.manualTotal).toBe(anyManual ? manualSum : null);
        expect(result.lines).toHaveLength(items.length);
      }),
      RUNS,
    );
  });

  it('cada subtotal de línea es el de calcSubtotal con el precio que corresponde', () => {
    fc.assert(
      fc.property(contextArb, linesArb, (context, items) => {
        const { lines } = computeListEstimate({ context, items });
        lines.forEach((line, index) => {
          const item = items[index];
          expect(line.defaultSubtotal).toBe(calcSubtotal({ unitPrice: line.estimate.price, quantity: item.quantity, unit: item.unit }));
          const manual = item.manualPrice ?? line.estimate.price;
          expect(line.manualSubtotal).toBe(calcSubtotal({ unitPrice: manual, quantity: item.quantity, unit: item.unit }));
        });
      }),
      RUNS,
    );
  });
});

describe('propiedad 2: fórmula del subtotal por unidad (REQ-03.3, REQ-03.4)', () => {
  it('el subtotal es precio × cantidad × factor, redondeado al peso (error <= 0,5)', () => {
    fc.assert(
      fc.property(priceArb, quantityArb, unitArb, (unitPrice, quantity, unit) => {
        const exact = unitPrice * quantity * FACTOR[unit];
        const subtotal = calcSubtotal({ unitPrice, quantity, unit });
        expect(Number.isInteger(subtotal)).toBe(true);
        expect(subtotal).toBeGreaterThanOrEqual(0);
        expect(Math.abs(subtotal - exact)).toBeLessThanOrEqual(0.5 + 1e-6);
      }),
      RUNS,
    );
  });

  it('con cantidades de 2 decimales el resultado es exactamente el redondeo del valor real, con el .5 hacia arriba', () => {
    // Oráculo con aritmética entera exacta (BigInt): sin coma flotante, los empates x,5 son exactos.
    const FRACTION: Record<Unit, [number, number]> = { unit: [1, 1], kg: [1, 1], half_kg: [1, 2], quarter_kg: [1, 4] };
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 1, max: 50_000 }),
        unitArb,
        (unitPrice, hundredths, unit) => {
          const [numerator, denominator] = FRACTION[unit];
          const num = BigInt(unitPrice) * BigInt(hundredths) * BigInt(numerator);
          const den = BigInt(100) * BigInt(denominator);
          const expected = Number((BigInt(2) * num + den) / (BigInt(2) * den)); // mitad hacia arriba
          expect(calcSubtotal({ unitPrice, quantity: hundredths / 100, unit })).toBe(expected);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('también es exacto en todo el rango: hasta 6 decimales, precios de 100 millones y cantidades de 100.000', () => {
    // Mismo oráculo entero, pero la cantidad se genera en millonésimas (1 a 100.000 unidades).
    const FRACTION: Record<Unit, [number, number]> = { unit: [1, 1], kg: [1, 1], half_kg: [1, 2], quarter_kg: [1, 4] };
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        fc.integer({ min: 1, max: 100_000_000_000 }),
        unitArb,
        (unitPrice, micros, unit) => {
          const [numerator, denominator] = FRACTION[unit];
          const num = BigInt(unitPrice) * BigInt(micros) * BigInt(numerator);
          const den = BigInt(1_000_000) * BigInt(denominator);
          const expected = Number((BigInt(2) * num + den) / (BigInt(2) * den));
          expect(calcSubtotal({ unitPrice, quantity: micros / 1_000_000, unit })).toBe(expected);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('con unidad suelta y cantidad entera es exactamente precio × cantidad', () => {
    fc.assert(
      fc.property(priceArb, fc.integer({ min: 1, max: 1000 }), (unitPrice, quantity) => {
        expect(calcSubtotal({ unitPrice, quantity, unit: 'unit' })).toBe(unitPrice * quantity);
      }),
      RUNS,
    );
  });

  it('con un kilo entero (unidad kg) es exactamente precio × cantidad entera', () => {
    fc.assert(
      fc.property(priceArb, fc.integer({ min: 1, max: 1000 }), (unitPrice, quantity) => {
        expect(calcSubtotal({ unitPrice, quantity, unit: 'kg' })).toBe(unitPrice * quantity);
      }),
      RUNS,
    );
  });

  it('dos porciones de medio kilo valen un kilo, y cuatro de cuarto también', () => {
    fc.assert(
      fc.property(priceArb, (unitPrice) => {
        const kilo = calcSubtotal({ unitPrice, quantity: 1, unit: 'kg' });
        expect(calcSubtotal({ unitPrice, quantity: 2, unit: 'half_kg' })).toBe(kilo);
        expect(calcSubtotal({ unitPrice, quantity: 4, unit: 'quarter_kg' })).toBe(kilo);
      }),
      RUNS,
    );
  });
});

describe('propiedad 3: todo ítem tiene un precio estimado (REQ-07.3)', () => {
  it('con cualquier historial, incluso vacío, el precio es un entero mayor o igual a 1', () => {
    fc.assert(
      fc.property(unitArb, contextArb, historyArb, referenceArb, (unit, context, history, reference) => {
        const { price, source } = estimatePrice({ unit, context, history, reference });
        expect(Number.isInteger(price) && price >= 1).toBe(true);
        expect(['site', 'parent', 'reference']).toContain(source);
      }),
      RUNS,
    );
  });

  it('con historial vacío siempre usa la referencia', () => {
    fc.assert(
      fc.property(unitArb, contextArb, referenceArb, (unit, context, reference) => {
        expect(estimatePrice({ unit, context, history: [], reference })).toMatchObject({
          price: reference.price,
          source: 'reference',
          recordedDate: null,
        });
      }),
      RUNS,
    );
  });
});

describe('propiedad 4: el orden de la estimación (REQ-07.2)', () => {
  it('sitio, luego etiqueta madre, luego referencia, siempre el más reciente de su nivel', () => {
    fc.assert(
      fc.property(unitArb, contextArb, historyArb, referenceArb, (unit, context, history, reference) => {
        const actual = estimatePrice({ unit, context, history, reference });
        const expected = oracleEstimate(unit, context, history, reference);
        expect({ price: actual.price, source: actual.source }).toEqual(expected);
      }),
      RUNS,
    );
  });

  it('nunca usa un registro de otra etiqueta madre ni de otra base', () => {
    fc.assert(
      fc.property(unitArb, contextArb, historyArb, referenceArb, (unit, context, history, reference) => {
        const basis = unit === 'unit' ? 'unit' : 'kg';
        const usable = history.filter((p) => p.parentTagId === context.parentTagId && p.priceBasis === basis);
        const actual = estimatePrice({ unit, context, history, reference });
        if (actual.source !== 'reference') {
          expect(usable.some((p) => p.price === actual.price && p.recordedDate === actual.recordedDate)).toBe(true);
        }
      }),
      RUNS,
    );
  });

  it('es determinista y no depende del orden en que llegue el historial', () => {
    fc.assert(
      fc.property(
        unitArb,
        contextArb,
        historyArb.chain((history) =>
          fc.tuple(fc.constant(history), fc.shuffledSubarray(history, { minLength: history.length, maxLength: history.length })),
        ),
        referenceArb,
        (unit, context, [history, shuffled], reference) => {
          const first = estimatePrice({ unit, context, history, reference });
          expect(estimatePrice({ unit, context, history, reference })).toEqual(first);
          expect(estimatePrice({ unit, context, history: shuffled, reference })).toEqual(first);
        },
      ),
      RUNS,
    );
  });
});

describe('propiedad 5: la referencia no altera el historial (REQ-05.3, parte de lógica)', () => {
  it('estimar nunca modifica ni reordena el historial', () => {
    fc.assert(
      fc.property(unitArb, contextArb, historyArb, referenceArb, (unit, context, history, reference) => {
        const before = JSON.stringify(history);
        estimatePrice({ unit, context, history, reference });
        summarizeHistory(history, 'kg');
        summarizeHistory(history, 'unit');
        expect(JSON.stringify(history)).toBe(before);
      }),
      RUNS,
    );
  });

  it('si hay un registro aplicable, el precio estimado no depende de la referencia', () => {
    fc.assert(
      fc.property(unitArb, contextArb, historyArb, referenceArb, priceArb, (unit, context, history, reference, otherPrice) => {
        const a = estimatePrice({ unit, context, history, reference });
        const b = estimatePrice({ unit, context, history, reference: { ...reference, price: otherPrice } });
        if (a.source !== 'reference') expect(b).toEqual(a);
        else expect(b.price).toBe(otherPrice);
      }),
      RUNS,
    );
  });
});

describe('variación e historial (REQ-08)', () => {
  it('la variación de a hacia b es la opuesta a la de b hacia a, en pesos y en dirección', () => {
    fc.assert(
      fc.property(priceArb, priceArb, (a, b) => {
        const forward = calcVariation(a, b);
        const backward = calcVariation(b, a);
        expect(forward.amount + backward.amount).toBe(0);
        expect(forward.amount).toBe(b - a);
        expect(Object.is(forward.amount, -0)).toBe(false);
        if (a === b) expect(forward.direction).toBe('same');
        else expect(forward.direction).not.toBe(backward.direction);
        expect(Number.isFinite(forward.percent)).toBe(true);
        expect(forward.percent).toBeGreaterThan(-100);
      }),
      RUNS,
    );
  });

  it('summarizeHistory: la suma de los pasos es la variación total y no depende del orden', () => {
    fc.assert(
      fc.property(
        historyArb.chain((history) =>
          fc.tuple(fc.constant(history), fc.shuffledSubarray(history, { minLength: history.length, maxLength: history.length })),
        ),
        basisArb,
        ([history, shuffled], basis) => {
          const summary = summarizeHistory(history, basis);
          expect(summarizeHistory(shuffled, basis)).toEqual(summary);
          const ofBasis = history.filter((p) => p.priceBasis === basis);
          if (ofBasis.length < 2) {
            expect(summary.status).toBe('insufficient-data');
            return;
          }
          if (summary.status !== 'ok') throw new Error('se esperaba status ok');
          expect(summary.steps).toHaveLength(ofBasis.length - 1);
          expect(summary.steps.reduce((sum, step) => sum + step.amount, 0)).toBe(summary.overall.amount);
          expect(summary.points).toHaveLength(ofBasis.length);
        },
      ),
      RUNS,
    );
  });
});
