import { priceBasisOf, type Unit } from '@/db/constants';

import { latestOf } from './latestPrice';
import { assertEstimateContext, assertPricePoint, assertReference, assertUnit } from './pricingGuards';
import type { EstimateContext, PriceEstimate, PricePoint, ReferencePrice } from './pricingTypes';

export interface EstimatePriceInput {
  /** Unidad en que se compra el ítem en la lista; define si el precio es por kilo o por unidad. */
  unit: Unit;
  context: EstimateContext;
  /** Historial de precios del ítem (cualquier etiqueta y base; aquí se filtra). */
  history: readonly PricePoint[];
  reference: ReferencePrice;
}

/**
 * Precio estimado por defecto de un ítem (REQ-07.2, REQ-07.3), en este orden:
 *  1. el último precio registrado en el mismo sitio (misma etiqueta madre y al menos una
 *     etiqueta de sitio en común con la lista);
 *  2. el último precio registrado con la misma etiqueta madre, de cualquier sitio;
 *  3. el precio de referencia de la base de ítems.
 * Solo se usan registros con la misma base de precio (por kilo o por unidad) que la unidad
 * del ítem. Siempre devuelve un precio entero >= 1.
 */
export function estimatePrice({ unit, context, history, reference }: EstimatePriceInput): PriceEstimate {
  assertUnit(unit);
  assertEstimateContext(context);
  assertReference(reference);
  history.forEach((point, index) => assertPricePoint(point, `history[${index}]`));

  const basis = priceBasisOf(unit);
  const sameParent = history.filter(
    (point) => point.priceBasis === basis && point.parentTagId === context.parentTagId,
  );

  const listSites = new Set(context.siteTagIds);
  const sameSite =
    listSites.size === 0 ? [] : sameParent.filter((point) => point.siteTagIds.some((tagId) => listSites.has(tagId)));

  const siteHit = latestOf(sameSite);
  if (siteHit) return fromRecord(siteHit, 'site');

  const parentHit = latestOf(sameParent);
  if (parentHit) return fromRecord(parentHit, 'parent');

  return {
    price: reference.price,
    source: 'reference',
    basisMismatch: priceBasisOf(reference.defaultUnit) !== basis,
    recordedDate: null,
  };
}

function fromRecord(point: PricePoint, source: 'site' | 'parent'): PriceEstimate {
  return { price: point.price, source, basisMismatch: false, recordedDate: point.recordedDate };
}
