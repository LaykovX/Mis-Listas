import type { Clock } from './clock';
import {
  addListItem,
  createCatalogItem,
  createList,
  createSiteTag,
  duplicateList,
  getList,
  getPriceHistory,
  listLists,
  listListItems,
  recordPrice,
  setListSiteTags,
} from './repositories';
import { createSeededDb, type SeededDb } from './testing/seededTestDb';

/**
 * Estas pruebas fuerzan un fallo EN MEDIO de una operación de varias escrituras (con un
 * disparador de SQLite que aborta una inserción) y comprueban que no queda nada a medias.
 * Si alguien quitara la transacción de un repositorio, estas pruebas fallarían.
 */

let t: SeededDb;

beforeEach(async () => {
  t = await createSeededDb();
});

afterEach(() => {
  t.close();
});

function failOnInsert(table: string) {
  t.sqlite.run(
    `CREATE TRIGGER fail_${table} BEFORE INSERT ON ${table} BEGIN SELECT RAISE(ABORT, 'fallo forzado'); END`,
  );
}

const count = (table: string) => Number(t.sqlite.exec(`SELECT COUNT(*) FROM ${table}`)[0].values[0][0]);

describe('las operaciones de varias escrituras son atómicas', () => {
  it('createList: si falla al guardar las etiquetas de sitio, no queda la lista', () => {
    const site = createSiteTag(t.db, { name: 'sitio', color: '#2E7D32' });
    failOnInsert('list_site_tags');
    expect(() => createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [site.id] })).toThrow(/fallo forzado/);
    expect(count('lists')).toBe(0);
  });

  it('duplicateList: si falla al copiar los ítems, no queda la copia', () => {
    const original = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    addListItem(t.db, { listId: original.id, catalogItemId: item.id, quantity: 1, unit: 'kg', unitPrice: 800 });
    failOnInsert('list_items');
    expect(() => duplicateList(t.db, original.id)).toThrow(/fallo forzado/);
    expect(listLists(t.db)).toHaveLength(1);
    expect(count('list_items')).toBe(1);
  });

  it('setListSiteTags: si falla a mitad, las etiquetas anteriores siguen intactas', () => {
    const a = createSiteTag(t.db, { name: 'a', color: '#2E7D32' });
    const b = createSiteTag(t.db, { name: 'b', color: '#1565C0' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [a.id] });
    const boom: Clock = () => {
      throw new Error('reloj roto');
    };
    expect(() => setListSiteTags(t.db, list.id, [b.id], boom)).toThrow(/reloj roto/);
    expect(getList(t.db, list.id).siteTagIds).toEqual([a.id]);
  });

  it('recordPrice: si falla al guardar las etiquetas del registro, no queda el registro', () => {
    const site = createSiteTag(t.db, { name: 'sitio', color: '#2E7D32' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [site.id] });
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    failOnInsert('price_record_sites');
    expect(() => recordPrice(t.db, { listId: list.id, catalogItemId: item.id, price: 900, unit: 'kg' })).toThrow(
      /fallo forzado/,
    );
    expect(getPriceHistory(t.db, item.id)).toEqual([]);
    expect(count('price_records')).toBe(0);
    expect(listListItems(t.db, list.id)).toEqual([]);
  });
});
