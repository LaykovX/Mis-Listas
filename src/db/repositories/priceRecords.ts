import { and, asc, eq, inArray, type SQL } from 'drizzle-orm';

import { systemClock, toLocalDate, toTimestamp, type Clock } from '../clock';
import { priceBasisOf, type Unit } from '../constants';
import { DbValidationError } from '../errors';
import { catalogItems, priceRecordSites, priceRecords } from '../schema';
import type { Db, PriceRecord } from '../types';
import { getList } from './lists';
import { validateDate, validatePrice, validateUnit } from './validation';

export type PriceRecordWithSites = PriceRecord & { siteTagIds: number[] };

export interface NewPriceRecord {
  listId: number;
  catalogItemId: number;
  /** Precio pagado en pesos: por kilo si la unidad es kg, 1/2 kg o 1/4 kg; por unidad si es unit. */
  price: number;
  unit: Unit;
  /** Por defecto, la fecha de hoy en el teléfono. */
  recordedDate?: string;
}

/**
 * Registra el precio pagado por un ítem (REQ-06.4). Guarda una copia de la etiqueta madre y de
 * las etiquetas de sitio que tenía la lista en ese momento, para que el historial no cambie
 * si la lista cambia de etiquetas después.
 */
export function recordPrice(db: Db, input: NewPriceRecord, clock: Clock = systemClock): PriceRecordWithSites {
  const price = validatePrice(input.price);
  const unit = validateUnit(input.unit);
  const now = clock();
  const recordedDate = input.recordedDate === undefined ? toLocalDate(now) : validateDate(input.recordedDate);

  const list = getList(db, input.listId);
  if (!db.select({ id: catalogItems.id }).from(catalogItems).where(eq(catalogItems.id, input.catalogItemId)).get()) {
    throw new DbValidationError('NOT_FOUND');
  }

  return db.transaction((tx) => {
    const record = tx
      .insert(priceRecords)
      .values({
        catalogItemId: input.catalogItemId,
        listId: list.id,
        parentTagId: list.parentTagId,
        price,
        priceBasis: priceBasisOf(unit),
        recordedDate,
        recordedAt: toTimestamp(now),
      })
      .returning()
      .get();
    if (list.siteTagIds.length > 0) {
      tx.insert(priceRecordSites)
        .values(list.siteTagIds.map((tagId) => ({ priceRecordId: record.id, tagId })))
        .run();
    }
    return { ...record, siteTagIds: [...list.siteTagIds] };
  });
}

/**
 * Historial de precios de un ítem, del más antiguo al más reciente. Se puede limitar a una
 * etiqueta madre y/o a una etiqueta de sitio.
 */
export function getPriceHistory(
  db: Db,
  catalogItemId: number,
  filter: { parentTagId?: number; siteTagId?: number } = {},
): PriceRecordWithSites[] {
  const conditions: SQL[] = [eq(priceRecords.catalogItemId, catalogItemId)];
  if (filter.parentTagId !== undefined) conditions.push(eq(priceRecords.parentTagId, filter.parentTagId));
  if (filter.siteTagId !== undefined) {
    conditions.push(
      inArray(
        priceRecords.id,
        db
          .select({ id: priceRecordSites.priceRecordId })
          .from(priceRecordSites)
          .where(eq(priceRecordSites.tagId, filter.siteTagId)),
      ),
    );
  }

  const records = db
    .select()
    .from(priceRecords)
    .where(and(...conditions))
    .orderBy(asc(priceRecords.recordedDate), asc(priceRecords.recordedAt), asc(priceRecords.id))
    .all();
  if (records.length === 0) return [];

  const sites = db
    .select()
    .from(priceRecordSites)
    .where(inArray(priceRecordSites.priceRecordId, records.map((r) => r.id)))
    .orderBy(asc(priceRecordSites.tagId))
    .all();

  return records.map((record) => ({
    ...record,
    siteTagIds: sites.filter((s) => s.priceRecordId === record.id).map((s) => s.tagId),
  }));
}
