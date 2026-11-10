import type { Unit } from '../constants';

/** Tipo de producto de un ítem inicial. Solo documenta la investigación y alimenta las pruebas. */
export const SEED_CATEGORIES = ['fruta', 'verdura', 'otro-feria', 'supermercado'] as const;
export type SeedCategory = (typeof SEED_CATEGORIES)[number];

/** Estaciones de Chile. Un ítem sin estaciones se considera disponible todo el año. */
export const SEASONS = ['verano', 'otono', 'invierno', 'primavera'] as const;
export type Season = (typeof SEASONS)[number];

/** De dónde sale el precio de referencia. `estimado` es una apuesta razonable, sin fuente. */
export const PRICE_SOURCES = ['odepa-feria', 'odepa-supermercado', 'prensa', 'estimado'] as const;
export type PriceSource = (typeof PRICE_SOURCES)[number];

/**
 * Un ítem de la base inicial. En la base solo se guardan `name`, `defaultUnit` y
 * `referencePrice`; el resto vive en el código: documenta la investigación, alimenta las
 * pruebas de cobertura y los `aliases` los usará la búsqueda.
 */
export interface SeedItem {
  /** Nombre genérico, sin marca ni tamaño, con la primera letra en mayúscula. */
  name: string;
  /** Forma normal de comprarlo; define si el precio es por kilo o por unidad. */
  defaultUnit: Unit;
  /** Pesos enteros: por kilo si la unidad es kg, half_kg o quarter_kg; por unidad típica si es unit. */
  referencePrice: number;
  category: SeedCategory;
  /** Estaciones en que está en temporada (solo ítems de feria). Vacía: todo el año. */
  seasons: readonly Season[];
  /** Sinónimos de uso chileno para la búsqueda (por ejemplo "Fresa" para la frutilla). */
  aliases?: readonly string[];
  priceSource: PriceSource;
  /** Mes de la referencia de precio, formato AAAA-MM. Obligatorio si hay fuente. */
  priceMonth?: string;
  /** Aclaración que no entra en el nombre, por ejemplo "paquete de 400 g". */
  note?: string;
}
