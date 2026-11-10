import { asc, desc, eq } from 'drizzle-orm';

import { systemClock, toLocalDate, toTimestamp, type Clock } from '../clock';
import { DbValidationError } from '../errors';
import { listItems, listSiteTags, lists, tags } from '../schema';
import type { Db, List } from '../types';
import { validateDate, validateName } from './validation';

export type ListWithTags = List & { siteTagIds: number[] };

export interface NewList {
  name: string;
  /** Etiqueta madre (Feria o Supermercado): obligatoria. */
  parentTagId: number;
  siteTagIds?: number[];
  /** Por defecto, la fecha de hoy en el teléfono. */
  createdDate?: string;
}

function loadSiteTagIds(db: Db, listId: number): number[] {
  return db
    .select({ tagId: listSiteTags.tagId })
    .from(listSiteTags)
    .where(eq(listSiteTags.listId, listId))
    .orderBy(asc(listSiteTags.tagId))
    .all()
    .map((row) => row.tagId);
}

function assertParentTag(db: Db, id: number | null | undefined): number {
  if (id === undefined || id === null) throw new DbValidationError('PARENT_TAG_REQUIRED');
  const tag = db.select().from(tags).where(eq(tags.id, id)).get();
  if (!tag) throw new DbValidationError('NOT_FOUND');
  if (tag.kind !== 'parent') throw new DbValidationError('NOT_A_PARENT_TAG');
  return tag.id;
}

/** Comprueba que todas las etiquetas existan y sean de sitio; devuelve los ids sin repetir. */
function assertSiteTags(db: Db, ids: number[]): number[] {
  const unique = [...new Set(ids)];
  for (const id of unique) {
    const tag = db.select().from(tags).where(eq(tags.id, id)).get();
    if (!tag) throw new DbValidationError('NOT_FOUND');
    if (tag.kind !== 'site') throw new DbValidationError('NOT_A_SITE_TAG');
  }
  return unique;
}

function insertSiteTags(db: Db, listId: number, tagIds: number[]): void {
  if (tagIds.length === 0) return;
  db.insert(listSiteTags).values(tagIds.map((tagId) => ({ listId, tagId }))).run();
}

export function getList(db: Db, id: number): ListWithTags {
  const list = db.select().from(lists).where(eq(lists.id, id)).get();
  if (!list) throw new DbValidationError('NOT_FOUND');
  return { ...list, siteTagIds: loadSiteTagIds(db, id) };
}

/** Todas las listas, las más recientes primero según su fecha de creación. */
export function listLists(db: Db): ListWithTags[] {
  return db
    .select()
    .from(lists)
    .orderBy(desc(lists.createdDate), desc(lists.createdAt), desc(lists.id))
    .all()
    .map((list) => ({ ...list, siteTagIds: loadSiteTagIds(db, list.id) }));
}

/** Crea una lista con su etiqueta madre y, si se quiere, etiquetas de sitio (REQ-01.1, REQ-02.2, REQ-02.4). */
export function createList(db: Db, input: NewList, clock: Clock = systemClock): ListWithTags {
  const name = validateName(input.name);
  const parentTagId = assertParentTag(db, input.parentTagId);
  const siteTagIds = assertSiteTags(db, input.siteTagIds ?? []);
  const now = clock();
  const createdDate = input.createdDate === undefined ? toLocalDate(now) : validateDate(input.createdDate);

  return db.transaction((tx) => {
    const list = tx
      .insert(lists)
      .values({ name, createdDate, parentTagId, createdAt: toTimestamp(now), updatedAt: toTimestamp(now) })
      .returning()
      .get();
    insertSiteTags(tx, list.id, siteTagIds);
    return getList(tx, list.id);
  });
}

export function renameList(db: Db, id: number, name: string, clock: Clock = systemClock): ListWithTags {
  const validName = validateName(name);
  getList(db, id);
  db.update(lists).set({ name: validName, updatedAt: toTimestamp(clock()) }).where(eq(lists.id, id)).run();
  return getList(db, id);
}

/** Borra la lista y sus ítems. El historial de precios se conserva (REQ-01.3). */
export function deleteList(db: Db, id: number): void {
  getList(db, id);
  db.delete(lists).where(eq(lists.id, id)).run();
}

/**
 * Duplica una lista para reutilizarla (REQ-01.4): copia ítems y etiquetas, con fecha de
 * creación nueva, sin fecha de uso y con los ítems sin comprar ni precio manual.
 */
export function duplicateList(
  db: Db,
  id: number,
  options: { name?: string } = {},
  clock: Clock = systemClock,
): ListWithTags {
  const original = getList(db, id);
  const name = options.name === undefined ? original.name : validateName(options.name);
  const now = clock();

  return db.transaction((tx) => {
    const copy = tx
      .insert(lists)
      .values({
        name,
        createdDate: toLocalDate(now),
        usedDate: null,
        parentTagId: original.parentTagId,
        createdAt: toTimestamp(now),
        updatedAt: toTimestamp(now),
      })
      .returning()
      .get();
    insertSiteTags(tx, copy.id, original.siteTagIds);

    const items = tx
      .select()
      .from(listItems)
      .where(eq(listItems.listId, id))
      .orderBy(asc(listItems.sortOrder), asc(listItems.id))
      .all();
    if (items.length > 0) {
      tx.insert(listItems)
        .values(
          items.map((item) => ({
            listId: copy.id,
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            manualPrice: null,
            purchasedPrice: null,
            isPurchased: false,
            sortOrder: item.sortOrder,
          })),
        )
        .run();
    }
    return getList(tx, copy.id);
  });
}

/** Marca la lista como usada, con la fecha indicada o la de hoy (REQ-01.5). */
export function markListUsed(
  db: Db,
  id: number,
  usedDate?: string,
  clock: Clock = systemClock,
): ListWithTags {
  const now = clock();
  const date = usedDate === undefined ? toLocalDate(now) : validateDate(usedDate);
  getList(db, id);
  db.update(lists).set({ usedDate: date, updatedAt: toTimestamp(now) }).where(eq(lists.id, id)).run();
  return getList(db, id);
}

/** Reemplaza las etiquetas de sitio de una lista (REQ-02.4). */
export function setListSiteTags(
  db: Db,
  id: number,
  siteTagIds: number[],
  clock: Clock = systemClock,
): ListWithTags {
  getList(db, id);
  const ids = assertSiteTags(db, siteTagIds);
  return db.transaction((tx) => {
    tx.delete(listSiteTags).where(eq(listSiteTags.listId, id)).run();
    insertSiteTags(tx, id, ids);
    tx.update(lists).set({ updatedAt: toTimestamp(clock()) }).where(eq(lists.id, id)).run();
    return getList(tx, id);
  });
}
