import type { PriceBasis, Unit } from '@/db/constants';

/**
 * Un precio pagado en el pasado. Las filas de `price_records` con sus etiquetas de sitio
 * (`PriceRecordWithSites`, Fase 2) cumplen esta forma; así la lógica no depende de la base.
 */
export interface PricePoint {
  id: number;
  /** Pesos enteros, por kilo o por unidad según `priceBasis`. */
  price: number;
  priceBasis: PriceBasis;
  /** Fecha de calendario YYYY-MM-DD. */
  recordedDate: string;
  /** Instante ISO 8601 del registro; desempata registros del mismo día. */
  recordedAt: string;
  /** Etiqueta madre de la lista cuando se registró el precio. */
  parentTagId: number;
  /** Etiquetas de sitio de la lista cuando se registró el precio. */
  siteTagIds: readonly number[];
}

/** Etiquetas de la lista para la que se estima. */
export interface EstimateContext {
  parentTagId: number;
  siteTagIds: readonly number[];
}

/** Precio de referencia del ítem de la base y la unidad en que está expresado. */
export interface ReferencePrice {
  price: number;
  defaultUnit: Unit;
}

export type EstimateSource = 'site' | 'parent' | 'reference';

export interface PriceEstimate {
  price: number;
  /** De dónde salió el precio: mismo sitio, misma etiqueta madre o referencia. */
  source: EstimateSource;
  /**
   * Verdadero si el precio es la referencia y esta está expresada en otra base (por kilo
   * contra por unidad) que la unidad elegida: se usa igual, pero conviene revisarlo.
   */
  basisMismatch: boolean;
  /** Fecha del registro usado; nulo si el precio es la referencia. */
  recordedDate: string | null;
}
