import { eq } from 'drizzle-orm';

import { systemClock, toTimestamp, type Clock } from '../clock';
import type { Unit } from '../constants';
import { DbValidationError } from '../errors';
import { normalizeName } from '../normalize';
import { catalogItems } from '../schema';
import type { CatalogItem, Db } from '../types';
import { validateName, validatePrice, validateUnit } from './validation';

export interface NewCatalogItem {
  name: string;
  defaultUnit: Unit;
  /** Precio de referencia en pesos (obligatorio, REQ-04.5). */
  referencePrice: number;
  /** Verdadero por defecto: lo agrega el usuario. Falso para los datos iniciales. */
  isUserAdded?: boolean;
}

export function getCatalogItem(db: Db, id: number): CatalogItem {
  const item = db.select().from(catalogItems).where(eq(catalogItems.id, id)).get();
  if (!item) throw new DbValidationError('NOT_FOUND');
  return item;
}

/** Busca un ítem por su nombre normalizado (sin tildes ni mayúsculas). */
export function findCatalogItemByName(db: Db, name: string): CatalogItem | null {
  const item = db
    .select()
    .from(catalogItems)
    .where(eq(catalogItems.normalizedName, normalizeName(name)))
    .get();
  return item ?? null;
}

/** Agrega un ítem a la base de ítems (REQ-04.4). Rechaza nombres que ya existen. */
export function createCatalogItem(db: Db, input: NewCatalogItem, clock: Clock = systemClock): CatalogItem {
  const name = validateName(input.name);
  const defaultUnit = validateUnit(input.defaultUnit);
  const referencePrice = validatePrice(input.referencePrice);
  const normalizedName = normalizeName(name);
  // Un nombre hecho solo de signos combinados queda vacío al normalizarlo y colisionaría con otros.
  if (normalizedName.length === 0) throw new DbValidationError('INVALID_NAME');

  if (findCatalogItemByName(db, name)) throw new DbValidationError('DUPLICATE_ITEM');

  const timestamp = toTimestamp(clock());
  return db
    .insert(catalogItems)
    .values({
      name,
      normalizedName,
      defaultUnit,
      referencePrice,
      isUserAdded: input.isUserAdded ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()
    .get();
}

/**
 * Cambia el precio de referencia de un ítem (REQ-05.2). No modifica el historial de precios
 * ya registrado (REQ-05.3): ese historial vive en otra tabla y este código no la toca.
 */
export function updateReferencePrice(db: Db, id: number, price: number, clock: Clock = systemClock): CatalogItem {
  const referencePrice = validatePrice(price);
  getCatalogItem(db, id);
  return db
    .update(catalogItems)
    .set({ referencePrice, updatedAt: toTimestamp(clock()) })
    .where(eq(catalogItems.id, id))
    .returning()
    .get();
}
