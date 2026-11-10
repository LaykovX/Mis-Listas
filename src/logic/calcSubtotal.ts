import { KG_PER_PORTION, type Unit } from '@/db/constants';

import { assertPrice, assertQuantity, assertUnit } from './pricingGuards';

export interface SubtotalInput {
  /** Precio por kilo (unidades kg, half_kg, quarter_kg) o por unidad (unit), en pesos enteros. */
  unitPrice: number;
  quantity: number;
  unit: Unit;
}

/** La cantidad se considera con hasta 6 decimales (millonésimas). */
const QUANTITY_SCALE = 1_000_000;

/** 1, 1/2 y 1/4 son múltiplos de 1/4: el factor de cada unidad es `numerador / 4`. */
const FACTOR_DENOMINATOR = 4;

function factorNumerator(unit: Unit): number {
  if (unit === 'unit') return FACTOR_DENOMINATOR;
  const numerator = KG_PER_PORTION[unit] * FACTOR_DENOMINATOR;
  if (!Number.isInteger(numerator)) {
    throw new RangeError(`El factor de ${unit} no es un múltiplo de 1/${FACTOR_DENOMINATOR}`);
  }
  return numerator;
}

/**
 * Subtotal de un ítem en pesos enteros (REQ-03.3, REQ-03.4):
 * - unidades por kilo: precio × cantidad × (1, 0,5 o 0,25 según la unidad);
 * - unidad suelta: precio × cantidad.
 *
 * Se redondea al peso más cercano, con el .5 hacia arriba. La cuenta se hace con aritmética
 * entera exacta (la cantidad se toma con hasta 6 decimales), no con coma flotante: en coma
 * flotante 500 × 2,01 × 0,5 da 502,49999999999994 en vez de 502,5 y el redondeo sería un
 * peso menor. Un ítem de precio y cantidad mínimos puede valer 0 pesos por redondeo.
 */
export function calcSubtotal({ unitPrice, quantity, unit }: SubtotalInput): number {
  assertPrice(unitPrice, 'unitPrice');
  assertQuantity(quantity);
  assertUnit(unit);

  const scaledQuantity = Math.round(quantity * QUANTITY_SCALE);
  if (!Number.isSafeInteger(scaledQuantity)) {
    throw new RangeError(`La cantidad es demasiado grande (${quantity})`);
  }

  const numerator = BigInt(unitPrice) * BigInt(scaledQuantity) * BigInt(factorNumerator(unit));
  const denominator = BigInt(QUANTITY_SCALE) * BigInt(FACTOR_DENOMINATOR);
  const rounded = (BigInt(2) * numerator + denominator) / (BigInt(2) * denominator); // mitad hacia arriba

  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`El subtotal no cabe en un entero seguro (${unitPrice} × ${quantity})`);
  }
  return Number(rounded);
}
