import { assertPrice } from './pricingGuards';

export type VariationDirection = 'up' | 'down' | 'same';

export interface PriceVariation {
  /** Diferencia en pesos enteros: precio actual menos precio anterior. */
  amount: number;
  /** Diferencia como porcentaje del precio anterior, sin redondear. */
  percent: number;
  direction: VariationDirection;
}

/**
 * Variación entre dos precios (REQ-08.4). El precio anterior es siempre >= 1, así que no hay
 * división por cero, y como el actual también es >= 1 el porcentaje nunca llega a -100.
 */
export function calcVariation(previous: number, current: number): PriceVariation {
  assertPrice(previous, 'previous');
  assertPrice(current, 'current');

  const amount = current - previous;
  return {
    amount,
    percent: (amount / previous) * 100,
    direction: amount > 0 ? 'up' : amount < 0 ? 'down' : 'same',
  };
}

/**
 * Redondea un porcentaje para mostrarlo (por defecto a 1 decimal). Es simétrico: el negativo
 * de un valor se redondea igual que el positivo (la mitad se aleja del cero). Antes de
 * redondear se descarta el ruido de la coma flotante: 1,005 se guarda como 1,00499999999999989
 * y un `Math.round` directo daría 1,00 en vez de 1,01.
 */
export function roundPercent(percent: number, decimals = 1): number {
  if (typeof percent !== 'number' || !Number.isFinite(percent)) {
    throw new RangeError(`percent debe ser un número finito (recibido: ${String(percent)})`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new RangeError(`decimals debe ser un entero entre 0 y 6 (recibido: ${String(decimals)})`);
  }
  const factor = 10 ** decimals;
  const scaled = Number((Math.abs(percent) * factor).toPrecision(15));
  const rounded = (Math.sign(percent) * Math.round(scaled)) / factor;
  return rounded === 0 ? 0 : rounded; // evita devolver -0
}
