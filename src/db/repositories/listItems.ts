import { asc, eq, sql } from 'drizzle-orm';

import type { Unit } from '../constants';
import { DbValidationError } from '../errors';
import { catalogItems, listItems, lists } from '../schema';
import type { Db, ListItem } from '../types';
import { validatePrice, validateQuantity, validateUnit } from './validation';

export interface NewListItem {
  listId: number;
  catalogItemId: number;
  quantity: number;
  unit: Unit;
  /** Precio por kilo (unidades kg, 1/2 kg, 1/4 kg) o por unidad. */
  unitPrice: number;
}

export interface ListItemPatch {
  quantity?: number;
  unit?: Unit;
  unitPrice?: number;
  /** Precio de la estimación manual; null lo quita. */
  manualPrice?: number | null;
}

function getListItem(db: Db, id: number): ListItem {
  const item = db.select().from(listItems).where(eq(listItems.id, id)).get();
  if (!item) throw new DbValidationError('NOT_FOUND');
  return item;
}

/** Ítems de una lista en el orden en que se agregaron. */
export function listListItems(db: Db, listId: number): ListItem[] {
  return db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(asc(listItems.sortOrder), asc(listItems.id))
    .all();
}

/** Agrega un ítem de la base a una lista (REQ-03.1). */
export function addListItem(db: Db, input: NewListItem): ListItem {
  const quantity = validateQuantity(input.quantity);
  const unit = validateUnit(input.unit);
  const unitPrice = validatePrice(input.unitPrice);

  if (!db.select({ id: lists.id }).from(lists).where(eq(lists.id, input.listId)).get()) {
    throw new DbValidationError('NOT_FOUND');
  }
  if (!db.select({ id: catalogItems.id }).from(catalogItems).where(eq(catalogItems.id, input.catalogItemId)).get()) {
    throw new DbValidationError('NOT_FOUND');
  }

  const last = db
    .select({ max: sql<number>`coalesce(max(${listItems.sortOrder}), -1)` })
    .from(listItems)
    .where(eq(listItems.listId, input.listId))
    .get();

  return db
    .insert(listItems)
    .values({
      listId: input.listId,
      catalogItemId: input.catalogItemId,
      quantity,
      unit,
      unitPrice,
      sortOrder: (last?.max ?? -1) + 1,
    })
    .returning()
    .get();
}

/** Edita cantidad, unidad, precio o precio manual de un ítem de lista (REQ-03.5). */
export function updateListItem(db: Db, id: number, patch: ListItemPatch): ListItem {
  const current = getListItem(db, id);

  const changes: Partial<Pick<ListItem, 'quantity' | 'unit' | 'unitPrice' | 'manualPrice'>> = {};
  if (patch.quantity !== undefined) changes.quantity = validateQuantity(patch.quantity);
  if (patch.unit !== undefined) changes.unit = validateUnit(patch.unit);
  if (patch.unitPrice !== undefined) changes.unitPrice = validatePrice(patch.unitPrice);
  if (patch.manualPrice !== undefined) {
    changes.manualPrice = patch.manualPrice === null ? null : validatePrice(patch.manualPrice);
  }
  if (Object.keys(changes).length === 0) return current;

  return db.update(listItems).set(changes).where(eq(listItems.id, id)).returning().get();
}

export function removeListItem(db: Db, id: number): void {
  getListItem(db, id);
  db.delete(listItems).where(eq(listItems.id, id)).run();
}
