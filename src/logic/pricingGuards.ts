import { DATE_PATTERN, PRICE_BASES, UNITS, type PriceBasis, type Unit } from '@/db/constants';

import type { EstimateContext, PricePoint, ReferencePrice } from './pricingTypes';

/*
 * Guardas internas de la lógica de precios. Esta capa recibe datos que ya validó la base de
 * datos, así que si algo llega mal es un error de programa o datos corruptos: se falla fuerte
 * con RangeError en vez de devolver un valor inventado, ignorar el dato en silencio o fallar
 * con un TypeError difícil de entender. Los mensajes son para depuración; la interfaz no los
 * muestra al usuario.
 */

const ISO_INSTANT_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

function fail(message: string): never {
  throw new RangeError(message);
}

/** Precio en pesos: entero seguro mayor o igual a 1. */
export function assertPrice(value: unknown, name = 'price'): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    fail(`${name} debe ser un entero de pesos mayor o igual a 1 (recibido: ${String(value)})`);
  }
}

/** Cantidad: número finito mayor que 0. */
export function assertQuantity(value: unknown, name = 'quantity'): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    fail(`${name} debe ser un número finito mayor que 0 (recibido: ${String(value)})`);
  }
}

export function assertUnit(value: unknown, name = 'unit'): asserts value is Unit {
  if (typeof value !== 'string' || !(UNITS as readonly string[]).includes(value)) {
    fail(`${name} no es una unidad válida (recibido: ${String(value)})`);
  }
}

export function assertBasis(value: unknown, name = 'basis'): asserts value is PriceBasis {
  if (typeof value !== 'string' || !(PRICE_BASES as readonly string[]).includes(value)) {
    fail(`${name} no es una base de precio válida (recibido: ${String(value)})`);
  }
}

function assertInteger(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    fail(`${name} debe ser un entero (recibido: ${String(value)})`);
  }
}

function assertIntegerList(value: unknown, name: string): asserts value is readonly number[] {
  if (!Array.isArray(value)) fail(`${name} debe ser una lista (recibido: ${String(value)})`);
  value.forEach((entry, index) => assertInteger(entry, `${name}[${index}]`));
}

/**
 * Fecha YYYY-MM-DD que existe en el calendario. Igual que la validación de la capa de datos,
 * rechaza los años 0000 a 0099 (`Date.UTC` los interpreta como 1900 a 1999); la app no puede
 * guardar esas fechas, así que ambas capas coinciden.
 */
function assertCalendarDate(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    fail(`${name} debe tener el formato AAAA-MM-DD (recibido: ${String(value)})`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(`${name} no es una fecha del calendario (recibido: ${value})`);
  }
}

/** Un registro de historial completo: todos sus campos, no solo el precio. */
export function assertPricePoint(point: unknown, name = 'history entry'): asserts point is PricePoint {
  if (typeof point !== 'object' || point === null) fail(`${name} debe ser un objeto (recibido: ${String(point)})`);
  const p = point as Record<string, unknown>;
  assertInteger(p.id, `${name}.id`);
  assertPrice(p.price, `${name}[id=${p.id}].price`);
  assertBasis(p.priceBasis, `${name}[id=${p.id}].priceBasis`);
  assertCalendarDate(p.recordedDate, `${name}[id=${p.id}].recordedDate`);
  if (typeof p.recordedAt !== 'string' || !ISO_INSTANT_PREFIX.test(p.recordedAt)) {
    fail(`${name}[id=${p.id}].recordedAt debe ser un instante ISO 8601 (recibido: ${String(p.recordedAt)})`);
  }
  assertInteger(p.parentTagId, `${name}[id=${p.id}].parentTagId`);
  assertIntegerList(p.siteTagIds, `${name}[id=${p.id}].siteTagIds`);
}

export function assertEstimateContext(context: unknown): asserts context is EstimateContext {
  if (typeof context !== 'object' || context === null) fail(`context debe ser un objeto (recibido: ${String(context)})`);
  const c = context as Record<string, unknown>;
  assertInteger(c.parentTagId, 'context.parentTagId');
  assertIntegerList(c.siteTagIds, 'context.siteTagIds');
}

export function assertReference(reference: unknown): asserts reference is ReferencePrice {
  if (typeof reference !== 'object' || reference === null) {
    fail(`reference debe ser un objeto (recibido: ${String(reference)})`);
  }
  const r = reference as Record<string, unknown>;
  assertPrice(r.price, 'reference.price');
  assertUnit(r.defaultUnit, 'reference.defaultUnit');
}
