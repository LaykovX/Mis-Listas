/** Fuente de la fecha y hora actuales. Se inyecta en las pruebas para que sean deterministas. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

/** Fecha de calendario local del teléfono, formato YYYY-MM-DD (no la fecha UTC). */
export function toLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Instante exacto en formato ISO 8601 (UTC). */
export function toTimestamp(date: Date): string {
  return date.toISOString();
}
