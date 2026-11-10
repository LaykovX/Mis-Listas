import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { PARENT_TAG_SLUGS, PRICE_BASES, TAG_KINDS, UNITS } from './constants';

const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(', '));

/**
 * Etiquetas. Las "madre" (feria, supermercado) llevan slug; las "de sitio" las crea el
 * usuario y llevan nombre y color.
 */
export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    kind: text('kind', { enum: TAG_KINDS }).notNull(),
    slug: text('slug', { enum: PARENT_TAG_SLUGS }).unique(),
    name: text('name'),
    color: text('color'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    check('tags_kind_valid', sql`${table.kind} IN (${sqlList(TAG_KINDS)})`),
    check(
      'tags_kind_fields',
      sql`(${table.kind} = 'parent' AND ${table.slug} IS NOT NULL) OR (${table.kind} = 'site' AND ${table.name} IS NOT NULL AND ${table.color} IS NOT NULL)`,
    ),
  ],
);

/** Listas de compras. Cada una tiene exactamente una etiqueta madre. */
export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdDate: text('created_date').notNull(),
  usedDate: text('used_date'),
  parentTagId: integer('parent_tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'restrict' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Etiquetas de sitio de una lista. Borrar la etiqueta o la lista solo quita esta fila. */
export const listSiteTags = sqliteTable(
  'list_site_tags',
  {
    listId: integer('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.listId, table.tagId] })],
);

/** Base de ítems (frutas, verduras, productos). Nombres genéricos, sin marca. */
export const catalogItems = sqliteTable(
  'catalog_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    defaultUnit: text('default_unit', { enum: UNITS }).notNull(),
    referencePrice: integer('reference_price').notNull(),
    isUserAdded: integer('is_user_added', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('catalog_items_normalized_name_unique').on(table.normalizedName),
    check('catalog_items_reference_price_valid', sql`${table.referencePrice} >= 1`),
    check('catalog_items_default_unit_valid', sql`${table.defaultUnit} IN (${sqlList(UNITS)})`),
  ],
);

/** Ítems dentro de una lista. */
export const listItems = sqliteTable(
  'list_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    listId: integer('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    catalogItemId: integer('catalog_item_id')
      .notNull()
      .references(() => catalogItems.id, { onDelete: 'restrict' }),
    quantity: real('quantity').notNull(),
    unit: text('unit', { enum: UNITS }).notNull(),
    unitPrice: integer('unit_price').notNull(),
    manualPrice: integer('manual_price'),
    purchasedPrice: integer('purchased_price'),
    isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('list_items_list_idx').on(table.listId),
    check('list_items_quantity_valid', sql`${table.quantity} > 0`),
    check('list_items_unit_valid', sql`${table.unit} IN (${sqlList(UNITS)})`),
    check('list_items_unit_price_valid', sql`${table.unitPrice} >= 1`),
    check(
      'list_items_manual_price_valid',
      sql`${table.manualPrice} IS NULL OR ${table.manualPrice} >= 1`,
    ),
    check(
      'list_items_purchased_price_valid',
      sql`${table.purchasedPrice} IS NULL OR ${table.purchasedPrice} >= 1`,
    ),
  ],
);

/** Historial de precios pagados. Sobrevive al borrado de listas y de etiquetas de sitio. */
export const priceRecords = sqliteTable(
  'price_records',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    catalogItemId: integer('catalog_item_id')
      .notNull()
      .references(() => catalogItems.id, { onDelete: 'restrict' }),
    listId: integer('list_id').references(() => lists.id, { onDelete: 'set null' }),
    parentTagId: integer('parent_tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'restrict' }),
    price: integer('price').notNull(),
    priceBasis: text('price_basis', { enum: PRICE_BASES }).notNull(),
    recordedDate: text('recorded_date').notNull(),
    recordedAt: text('recorded_at').notNull(),
  },
  (table) => [
    index('price_records_item_date_idx').on(table.catalogItemId, table.recordedDate),
    index('price_records_parent_tag_idx').on(table.parentTagId),
    check('price_records_price_valid', sql`${table.price} >= 1`),
    check('price_records_price_basis_valid', sql`${table.priceBasis} IN (${sqlList(PRICE_BASES)})`),
  ],
);

/** Etiquetas de sitio que tenía la lista cuando se registró el precio. */
export const priceRecordSites = sqliteTable(
  'price_record_sites',
  {
    priceRecordId: integer('price_record_id')
      .notNull()
      .references(() => priceRecords.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.priceRecordId, table.tagId] })],
);
