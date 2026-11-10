import { count } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import { catalogItems, lists, priceRecords } from '../schema';
import type { Db, Tag } from '../types';
import { listParentTags, listSiteTags } from './tags';

export interface DatabaseStats {
  parentTags: Tag[];
  siteTagCount: number;
  listCount: number;
  catalogItemCount: number;
  priceRecordCount: number;
}

function countRows(db: Db, table: SQLiteTable): number {
  return db.select({ value: count() }).from(table).get()?.value ?? 0;
}

/** Resumen de lo que hay guardado. Sirve para comprobar que la base funciona. */
export function getDatabaseStats(db: Db): DatabaseStats {
  return {
    parentTags: listParentTags(db),
    siteTagCount: listSiteTags(db).length,
    listCount: countRows(db, lists),
    catalogItemCount: countRows(db, catalogItems),
    priceRecordCount: countRows(db, priceRecords),
  };
}
