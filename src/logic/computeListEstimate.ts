import type { Unit } from '@/db/constants';

import { calcSubtotal } from './calcSubtotal';
import { estimatePrice } from './estimatePrice';
import { assertPrice } from './pricingGuards';
import type { EstimateContext, PriceEstimate, PricePoint, ReferencePrice } from './pricingTypes';

/** Un ítem de la lista con lo necesario para estimar su precio. */
export interface EstimateLineInput {
  itemId: number;
  quantity: number;
  unit: Unit;
  /** Precio que el usuario escribió a mano en esta lista; null si no lo editó (REQ-07.4). */
  manualPrice: number | null;
  /** Historial de precios del ítem de la base. */
  history: readonly PricePoint[];
  reference: ReferencePrice;
}

export interface EstimateLine {
  itemId: number;
  /** Precio por defecto elegido y de dónde salió. */
  estimate: PriceEstimate;
  defaultSubtotal: number;
  manualPrice: number | null;
  /** Subtotal con el precio manual si existe; si no, el mismo que el de por defecto. */
  manualSubtotal: number;
}

export interface ListEstimate {
  lines: EstimateLine[];
  /** Suma de los subtotales con el precio por defecto de cada ítem (REQ-07.1). */
  defaultTotal: number;
  /** Suma de los subtotales manuales; null si ningún ítem tiene precio manual (REQ-07.4). */
  manualTotal: number | null;
  hasManualEstimate: boolean;
}

function sumSafely(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total)) throw new RangeError('El total de la lista no cabe en un entero seguro');
  return total;
}

/**
 * Calcula las líneas, el total por defecto y el total manual de una lista (REQ-07). Ambos
 * totales se entregan juntos para que la pantalla alterne entre ellos sin recalcular
 * (REQ-07.5). Cada total es exactamente la suma de sus subtotales ya redondeados.
 */
export function computeListEstimate({
  context,
  items,
}: {
  context: EstimateContext;
  items: readonly EstimateLineInput[];
}): ListEstimate {
  const lines = items.map((item): EstimateLine => {
    if (item.manualPrice !== null) assertPrice(item.manualPrice, `item ${item.itemId} manualPrice`);

    const estimate = estimatePrice({
      unit: item.unit,
      context,
      history: item.history,
      reference: item.reference,
    });
    const defaultSubtotal = calcSubtotal({ unitPrice: estimate.price, quantity: item.quantity, unit: item.unit });
    const manualSubtotal =
      item.manualPrice === null
        ? defaultSubtotal
        : calcSubtotal({ unitPrice: item.manualPrice, quantity: item.quantity, unit: item.unit });

    return { itemId: item.itemId, estimate, defaultSubtotal, manualPrice: item.manualPrice, manualSubtotal };
  });

  const hasManualEstimate = lines.some((line) => line.manualPrice !== null);
  return {
    lines,
    defaultTotal: sumSafely(lines.map((line) => line.defaultSubtotal)),
    manualTotal: hasManualEstimate ? sumSafely(lines.map((line) => line.manualSubtotal)) : null,
    hasManualEstimate,
  };
}
