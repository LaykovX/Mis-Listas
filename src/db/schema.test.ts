import * as schema from './schema';
import { createTestDb, type TestDb } from './testing/createTestDb';
import type { Db } from './types';

const NOW = '2026-11-10T12:00:00.000Z';
const TODAY = '2026-11-10';

let t: TestDb;

beforeEach(async () => {
  t = await createTestDb();
});

afterEach(() => {
  t.close();
});

/** Devuelve la primera columna de todas las filas de una consulta SQL cruda. */
function firstColumn(sqlText: string): string[] {
  const result = t.sqlite.exec(sqlText);
  return result.length === 0 ? [] : result[0].values.map((row) => String(row[0]));
}

function insertParentTag(slug: 'feria' | 'supermercado' = 'feria') {
  return t.db.insert(schema.tags).values({ kind: 'parent', slug, createdAt: NOW }).returning().get();
}

function insertCatalogItem(name = 'tomate', normalizedName = 'tomate') {
  return t.db
    .insert(schema.catalogItems)
    .values({
      name,
      normalizedName,
      defaultUnit: 'kg',
      referencePrice: 800,
      isUserAdded: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
    .returning()
    .get();
}

function insertList(parentTagId: number) {
  return t.db
    .insert(schema.lists)
    .values({ name: 'Viernes', createdDate: TODAY, parentTagId, createdAt: NOW, updatedAt: NOW })
    .returning()
    .get();
}

describe('migración inicial', () => {
  it('crea las 7 tablas del modelo', () => {
    const tables = firstColumn(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(tables).toEqual([
      'catalog_items',
      'list_items',
      'list_site_tags',
      'lists',
      'price_record_sites',
      'price_records',
      'tags',
    ]);
  });

  it('crea los índices previstos', () => {
    const indexes = firstColumn("SELECT name FROM sqlite_master WHERE type = 'index'");
    expect(indexes).toEqual(
      expect.arrayContaining([
        'catalog_items_normalized_name_unique',
        'list_items_list_idx',
        'price_records_item_date_idx',
        'price_records_parent_tag_idx',
      ]),
    );
  });

  it('activa las claves foráneas en la conexión', () => {
    expect(firstColumn('PRAGMA foreign_keys')).toEqual(['1']);
  });

  it('la base de pruebas cumple el tipo Db de la app sin conversiones', () => {
    // Si esto compila, los repositorios (tipados con Db) aceptan la base de pruebas.
    const asDb: Db = t.db;
    expect(asDb).toBe(t.db);
  });
});

describe('claves foráneas', () => {
  it('rechaza una lista con una etiqueta madre que no existe', () => {
    expect(() => insertList(9999)).toThrow();
  });

  it('no permite borrar una etiqueta madre usada por una lista', () => {
    const parent = insertParentTag();
    insertList(parent.id);
    expect(() => t.sqlite.run(`DELETE FROM tags WHERE id = ${parent.id}`)).toThrow();
  });
});

describe('restricciones de etiquetas', () => {
  it('acepta una etiqueta madre con slug', () => {
    expect(insertParentTag('supermercado').slug).toBe('supermercado');
  });

  it('rechaza una etiqueta madre sin slug', () => {
    expect(() =>
      t.db.insert(schema.tags).values({ kind: 'parent', createdAt: NOW }).run(),
    ).toThrow();
  });

  it('acepta una etiqueta de sitio con nombre y color', () => {
    const tag = t.db
      .insert(schema.tags)
      .values({ kind: 'site', name: 'feria las condes', color: '#2E7D32', createdAt: NOW })
      .returning()
      .get();
    expect(tag.slug).toBeNull();
  });

  it('rechaza una etiqueta de sitio sin nombre', () => {
    expect(() =>
      t.db.insert(schema.tags).values({ kind: 'site', color: '#2E7D32', createdAt: NOW }).run(),
    ).toThrow();
  });

  it('rechaza una etiqueta de sitio sin color', () => {
    expect(() =>
      t.db.insert(schema.tags).values({ kind: 'site', name: 'feria', createdAt: NOW }).run(),
    ).toThrow();
  });

  it('rechaza dos etiquetas madre con el mismo slug', () => {
    insertParentTag('feria');
    expect(() => insertParentTag('feria')).toThrow();
  });
});

describe('restricciones de la base de ítems', () => {
  it('rechaza dos ítems con el mismo nombre normalizado', () => {
    insertCatalogItem('Tomate', 'tomate');
    expect(() => insertCatalogItem('tomate', 'tomate')).toThrow();
  });

  it('rechaza un precio de referencia menor que 1', () => {
    expect(() =>
      t.db
        .insert(schema.catalogItems)
        .values({
          name: 'gratis',
          normalizedName: 'gratis',
          defaultUnit: 'unit',
          referencePrice: 0,
          isUserAdded: true,
          createdAt: NOW,
          updatedAt: NOW,
        })
        .run(),
    ).toThrow();
  });

  it('rechaza una unidad que no existe', () => {
    expect(() =>
      t.sqlite.run(
        `INSERT INTO catalog_items (name, normalized_name, default_unit, reference_price, is_user_added, created_at, updated_at)
         VALUES ('x', 'x', 'litro', 100, 0, '${NOW}', '${NOW}')`,
      ),
    ).toThrow();
  });
});

describe('restricciones de los ítems de lista', () => {
  function setup() {
    const parent = insertParentTag();
    const list = insertList(parent.id);
    const item = insertCatalogItem();
    return { list, item };
  }

  it('acepta un ítem con cantidad, unidad y precio válidos', () => {
    const { list, item } = setup();
    const row = t.db
      .insert(schema.listItems)
      .values({ listId: list.id, catalogItemId: item.id, quantity: 2, unit: 'half_kg', unitPrice: 800, sortOrder: 0 })
      .returning()
      .get();
    expect(row.isPurchased).toBe(false);
    expect(row.manualPrice).toBeNull();
    expect(row.purchasedPrice).toBeNull();
  });

  it('rechaza una cantidad menor o igual a 0', () => {
    const { list, item } = setup();
    expect(() =>
      t.db
        .insert(schema.listItems)
        .values({ listId: list.id, catalogItemId: item.id, quantity: 0, unit: 'kg', unitPrice: 800, sortOrder: 0 })
        .run(),
    ).toThrow();
  });

  it('rechaza un precio menor que 1', () => {
    const { list, item } = setup();
    expect(() =>
      t.db
        .insert(schema.listItems)
        .values({ listId: list.id, catalogItemId: item.id, quantity: 1, unit: 'kg', unitPrice: 0, sortOrder: 0 })
        .run(),
    ).toThrow();
  });

  it('borra los ítems de una lista cuando se borra la lista', () => {
    const { list, item } = setup();
    t.db
      .insert(schema.listItems)
      .values({ listId: list.id, catalogItemId: item.id, quantity: 1, unit: 'kg', unitPrice: 800, sortOrder: 0 })
      .run();
    t.sqlite.run(`DELETE FROM lists WHERE id = ${list.id}`);
    expect(firstColumn('SELECT id FROM list_items')).toEqual([]);
  });

  it('no permite borrar un ítem de la base que está en una lista', () => {
    const { list, item } = setup();
    t.db
      .insert(schema.listItems)
      .values({ listId: list.id, catalogItemId: item.id, quantity: 1, unit: 'kg', unitPrice: 800, sortOrder: 0 })
      .run();
    expect(() => t.sqlite.run(`DELETE FROM catalog_items WHERE id = ${item.id}`)).toThrow();
  });
});

describe('restricciones de los registros de precio', () => {
  it('rechaza un precio menor que 1', () => {
    const parent = insertParentTag();
    const item = insertCatalogItem();
    expect(() =>
      t.db
        .insert(schema.priceRecords)
        .values({
          catalogItemId: item.id,
          parentTagId: parent.id,
          price: 0,
          priceBasis: 'kg',
          recordedDate: TODAY,
          recordedAt: NOW,
        })
        .run(),
    ).toThrow();
  });

  it('acepta un registro válido sin lista', () => {
    const parent = insertParentTag();
    const item = insertCatalogItem();
    const row = t.db
      .insert(schema.priceRecords)
      .values({
        catalogItemId: item.id,
        parentTagId: parent.id,
        price: 900,
        priceBasis: 'kg',
        recordedDate: TODAY,
        recordedAt: NOW,
      })
      .returning()
      .get();
    expect(row.listId).toBeNull();
  });
});
