/**
 * Normaliza un nombre para compararlo y buscarlo: sin tildes, en minúsculas y sin espacios
 * sobrantes. "  Piña " y "pina" dan el mismo resultado.
 */
export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
