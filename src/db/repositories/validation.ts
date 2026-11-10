import { DATE_PATTERN, HEX_COLOR_PATTERN, UNITS, type Unit } from '../constants';
import { DbValidationError } from '../errors';

export const MAX_NAME_LENGTH = 60;

/** Precio máximo aceptado, en pesos. Evita números que SQLite guardaría con pérdida de precisión. */
export const MAX_PRICE = 100_000_000;
/** Rango de cantidades aceptadas (admite decimales, por ejemplo 0,5 kg). */
export const MIN_QUANTITY = 0.001;
export const MAX_QUANTITY = 100_000;

/** Nombre sin espacios en los bordes, de 1 a 60 caracteres. */
export function validateName(value: unknown): string {
  if (typeof value !== 'string') throw new DbValidationError('INVALID_NAME');
  const name = value.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) throw new DbValidationError('INVALID_NAME');
  return name;
}

/** Color #RRGGBB, guardado en mayúsculas. */
export function validateColor(value: unknown): string {
  if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) throw new DbValidationError('INVALID_COLOR');
  return value.toUpperCase();
}

/** Precio en pesos: entero entre 1 y MAX_PRICE. */
export function validatePrice(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > MAX_PRICE) {
    throw new DbValidationError('INVALID_PRICE');
  }
  return value;
}

/** Cantidad: número entre MIN_QUANTITY y MAX_QUANTITY (admite decimales). */
export function validateQuantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < MIN_QUANTITY || value > MAX_QUANTITY) {
    throw new DbValidationError('INVALID_QUANTITY');
  }
  return value;
}

export function validateUnit(value: unknown): Unit {
  if (typeof value !== 'string' || !(UNITS as readonly string[]).includes(value)) {
    throw new DbValidationError('INVALID_UNIT');
  }
  return value as Unit;
}

/** Fecha YYYY-MM-DD que existe en el calendario (rechaza 2026-02-30). */
export function validateDate(value: unknown): string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) throw new DbValidationError('INVALID_DATE');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const exists =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!exists) throw new DbValidationError('INVALID_DATE');
  return value;
}
