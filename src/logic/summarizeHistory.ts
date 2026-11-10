import type { PriceBasis } from '@/db/constants';

import { comparePricePoints } from './latestPrice';
import { assertBasis, assertPricePoint } from './pricingGuards';
import type { PricePoint } from './pricingTypes';
import { calcVariation, type PriceVariation } from './priceVariation';

/** Último precio de un ítem y la fecha en que se registró (REQ-08.2). */
export interface LatestPrice {
  price: number;
  recordedDate: string;
}

export type HistorySummary =
  | {
      /** Hay menos de 2 registros de esa base: no se puede calcular una variación (REQ-08.5). */
      status: 'insufficient-data';
      pointCount: number;
      latest: LatestPrice | null;
    }
  | {
      status: 'ok';
      /** Registros de la base pedida, del más antiguo al más reciente (para la gráfica). */
      points: PricePoint[];
      /** Variación entre registros consecutivos: n - 1 elementos. */
      steps: PriceVariation[];
      /** Variación entre el primero y el último registro. */
      overall: PriceVariation;
      latest: LatestPrice;
    };

/**
 * Resume el historial de un ítem para una base de precio (por kilo o por unidad). Un historial
 * con las dos bases se resume por separado: nunca se comparan precios por kilo con precios por
 * unidad. No modifica el arreglo recibido.
 */
export function summarizeHistory(points: readonly PricePoint[], basis: PriceBasis): HistorySummary {
  assertBasis(basis);
  points.forEach((point, index) => assertPricePoint(point, `history[${index}]`));

  const ordered = points.filter((point) => point.priceBasis === basis).sort(comparePricePoints);
  const last = ordered[ordered.length - 1];
  const latest: LatestPrice | null = last ? { price: last.price, recordedDate: last.recordedDate } : null;

  if (ordered.length < 2 || latest === null) {
    return { status: 'insufficient-data', pointCount: ordered.length, latest };
  }

  const steps = ordered.slice(1).map((point, index) => calcVariation(ordered[index].price, point.price));
  return {
    status: 'ok',
    points: ordered,
    steps,
    overall: calcVariation(ordered[0].price, last.price),
    latest,
  };
}
