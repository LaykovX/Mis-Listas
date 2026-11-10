import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * Base de datos Drizzle. Compatible con Expo SQLite (en el teléfono) y con sql.js (en las
 * pruebas), porque ambos son síncronos.
 */
export type Db = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export type Tag = typeof schema.tags.$inferSelect;
export type List = typeof schema.lists.$inferSelect;
export type CatalogItem = typeof schema.catalogItems.$inferSelect;
export type ListItem = typeof schema.listItems.$inferSelect;
export type PriceRecord = typeof schema.priceRecords.$inferSelect;
