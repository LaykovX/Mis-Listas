/** Etiquetas madre incluidas en la app. Su texto visible sale de src/strings según el slug. */
export const PARENT_TAG_SLUGS = ['feria', 'supermercado'] as const;
export type ParentTagSlug = (typeof PARENT_TAG_SLUGS)[number];

export const TAG_KINDS = ['parent', 'site'] as const;
export type TagKind = (typeof TAG_KINDS)[number];

/** Unidades de venta: unidades sueltas, kilo, medio kilo y cuarto de kilo. */
export const UNITS = ['unit', 'kg', 'half_kg', 'quarter_kg'] as const;
export type Unit = (typeof UNITS)[number];

/** Sobre qué se cobra el precio: por unidad o por kilo. */
export const PRICE_BASES = ['unit', 'kg'] as const;
export type PriceBasis = (typeof PRICE_BASES)[number];

/** Precio base de una unidad de venta (REQ-03.3, REQ-03.4). */
export function priceBasisOf(unit: Unit): PriceBasis {
  return unit === 'unit' ? 'unit' : 'kg';
}

/** Cuántos kilos vale cada porción de una unidad por kilo. */
export const KG_PER_PORTION: Record<Exclude<Unit, 'unit'>, number> = {
  kg: 1,
  half_kg: 0.5,
  quarter_kg: 0.25,
};

/** Color de etiqueta: #RRGGBB. */
export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** Fecha de calendario: YYYY-MM-DD. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
