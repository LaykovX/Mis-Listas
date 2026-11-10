import * as fc from 'fast-check';

import { UNITS } from '@/db/constants';

import type { EstimateLineInput } from '../computeListEstimate';
import type { EstimateContext, PricePoint, ReferencePrice } from '../pricingTypes';

/** Generadores de datos aleatorios para las pruebas de propiedades de la lógica de precios. */

export const PARENT_TAG_IDS = [1, 2] as const;
export const SITE_TAG_IDS = [10, 11, 12] as const;

export const priceArb = fc.integer({ min: 1, max: 1_000_000 });

/**
 * Cantidades enteras, decimales (hasta 6 decimales, que es lo que toma el subtotal) y las
 * fracciones típicas de la feria.
 */
export const quantityArb = fc.oneof(
  fc.integer({ min: 1, max: 50 }),
  fc.integer({ min: 1000, max: 50_000_000 }).map((micro) => micro / 1_000_000),
  fc.constantFrom(0.25, 0.5, 1.5, 2.5),
);

export const unitArb = fc.constantFrom(...UNITS);
export const basisArb = fc.constantFrom('unit', 'kg' as const);

const dayArb = fc.integer({ min: 0, max: 200 }).map((offset) => new Date(Date.UTC(2026, 0, 1 + offset)).toISOString().slice(0, 10));
const hourArb = fc.integer({ min: 0, max: 23 }).map((hour) => String(hour).padStart(2, '0'));
const siteTagsArb = fc.subarray([...SITE_TAG_IDS]);

interface PointSpec {
  price: number;
  priceBasis: 'unit' | 'kg';
  recordedDate: string;
  hour: string;
  parentTagId: number;
  siteTagIds: number[];
}

const pointSpecArb: fc.Arbitrary<PointSpec> = fc.record({
  price: priceArb,
  priceBasis: fc.constantFrom<'unit' | 'kg'>('unit', 'kg'),
  recordedDate: dayArb,
  hour: hourArb,
  parentTagId: fc.constantFrom(...PARENT_TAG_IDS),
  siteTagIds: siteTagsArb,
});

/** Historial con ids únicos, en cualquier orden y con fechas que pueden repetirse. */
export const historyArb: fc.Arbitrary<PricePoint[]> = fc
  .array(pointSpecArb, { maxLength: 12 })
  .map((specs) =>
    specs.map(({ hour, ...spec }, index) => ({
      ...spec,
      id: index + 1,
      recordedAt: `${spec.recordedDate}T${hour}:00:00.000Z`,
    })),
  );

export const contextArb: fc.Arbitrary<EstimateContext> = fc.record({
  parentTagId: fc.constantFrom(...PARENT_TAG_IDS),
  siteTagIds: siteTagsArb,
});

export const referenceArb: fc.Arbitrary<ReferencePrice> = fc.record({ price: priceArb, defaultUnit: unitArb });

/** Líneas de una lista; los `itemId` se asignan en orden para que sean únicos. */
export const linesArb: fc.Arbitrary<EstimateLineInput[]> = fc
  .array(
    fc.record({
      quantity: quantityArb,
      unit: unitArb,
      manualPrice: fc.option(priceArb, { nil: null }),
      history: historyArb,
      reference: referenceArb,
    }),
    { maxLength: 8 },
  )
  .map((lines) => lines.map((line, index) => ({ ...line, itemId: index + 1 })));
