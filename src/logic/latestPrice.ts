import type { PricePoint } from './pricingTypes';

/**
 * Orden ascendente de registros de precio: por fecha, luego por instante de registro, luego
 * por id. El último de una lista ordenada así es "el más reciente".
 */
export function comparePricePoints(a: PricePoint, b: PricePoint): number {
  if (a.recordedDate !== b.recordedDate) return a.recordedDate < b.recordedDate ? -1 : 1;
  if (a.recordedAt !== b.recordedAt) return a.recordedAt < b.recordedAt ? -1 : 1;
  return a.id - b.id;
}

/** El registro más reciente, o null si no hay ninguno. No modifica el arreglo recibido. */
export function latestOf(points: readonly PricePoint[]): PricePoint | null {
  let latest: PricePoint | null = null;
  for (const point of points) {
    if (latest === null || comparePricePoints(point, latest) > 0) latest = point;
  }
  return latest;
}
