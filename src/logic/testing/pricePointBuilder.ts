import type { PricePoint } from '../pricingTypes';

/** Crea un registro de precio de prueba con valores por defecto sensatos. */
export function makePricePoint(overrides: Partial<PricePoint> & { id: number }): PricePoint {
  return {
    price: 900,
    priceBasis: 'kg',
    recordedDate: '2026-11-10',
    recordedAt: '2026-11-10T15:00:00.000Z',
    parentTagId: 1,
    siteTagIds: [],
    ...overrides,
  };
}
