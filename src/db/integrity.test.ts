import {
  addListItem,
  createCatalogItem,
  createList,
  createSiteTag,
  deleteList,
  deleteSiteTag,
  getList,
  getPriceHistory,
  listListItems,
  recordPrice,
} from './repositories';
import { createSeededDb, type SeededDb } from './testing/seededTestDb';

let t: SeededDb;
let tomateId: number;

beforeEach(async () => {
  t = await createSeededDb();
  tomateId = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 }).id;
});

afterEach(() => {
  t.close();
});

const rows = (sqlText: string) => t.sqlite.exec(sqlText)[0]?.values ?? [];

describe('integridad al borrar listas', () => {
  it('borrar una lista deja price_records.list_id en nulo y conserva los registros', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' });
    deleteList(t.db, list.id);

    const history = getPriceHistory(t.db, tomateId);
    expect(history).toHaveLength(1);
    expect(history[0].listId).toBeNull();
    expect(history[0].parentTagId).toBe(t.feria.id);
  });

  it('borrar una lista borra sus ítems y no deja filas huérfanas', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    addListItem(t.db, { listId: list.id, catalogItemId: tomateId, quantity: 1, unit: 'kg', unitPrice: 800 });
    deleteList(t.db, list.id);
    expect(listListItems(t.db, list.id)).toEqual([]);
    expect(rows('SELECT * FROM list_items')).toEqual([]);
    expect(t.sqlite.exec('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('borrar una lista no borra el historial de otras listas', () => {
    const a = createList(t.db, { name: 'A', parentTagId: t.feria.id });
    const b = createList(t.db, { name: 'B', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: a.id, catalogItemId: tomateId, price: 900, unit: 'kg' });
    recordPrice(t.db, { listId: b.id, catalogItemId: tomateId, price: 950, unit: 'kg' });
    deleteList(t.db, a.id);
    expect(getPriceHistory(t.db, tomateId).map((r) => r.price)).toEqual([900, 950]);
    expect(getList(t.db, b.id).name).toBe('B');
  });
});

describe('integridad al borrar etiquetas de sitio', () => {
  it('borrar una etiqueta de sitio conserva las listas y el historial, sin registros huérfanos', () => {
    const condes = createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [condes.id] });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' });

    deleteSiteTag(t.db, condes.id);

    expect(getList(t.db, list.id).siteTagIds).toEqual([]);
    const history = getPriceHistory(t.db, tomateId);
    expect(history).toHaveLength(1);
    expect(history[0].siteTagIds).toEqual([]);
    expect(t.sqlite.exec('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('solo se quita la etiqueta borrada, las demás siguen asociadas', () => {
    const a = createSiteTag(t.db, { name: 'a', color: '#2E7D32' });
    const b = createSiteTag(t.db, { name: 'b', color: '#1565C0' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [a.id, b.id] });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' });
    deleteSiteTag(t.db, a.id);
    expect(getList(t.db, list.id).siteTagIds).toEqual([b.id]);
    expect(getPriceHistory(t.db, tomateId)[0].siteTagIds).toEqual([b.id]);
  });
});

describe('restricciones que protegen los datos', () => {
  it('la base impide borrar una etiqueta madre que usa una lista', () => {
    createList(t.db, { name: 'L', parentTagId: t.feria.id });
    expect(() => t.sqlite.run(`DELETE FROM tags WHERE id = ${t.feria.id}`)).toThrow();
    expect(rows('SELECT id FROM tags WHERE kind = \'parent\'')).toHaveLength(2);
  });

  it('la base impide borrar un ítem de la base que tiene historial de precios', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' });
    expect(() => t.sqlite.run(`DELETE FROM catalog_items WHERE id = ${tomateId}`)).toThrow();
    expect(getPriceHistory(t.db, tomateId)).toHaveLength(1);
  });

  it('una operación que falla a mitad no deja datos a medias', () => {
    const site = createSiteTag(t.db, { name: 'sitio', color: '#2E7D32' });
    expect(() =>
      createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [site.id, 9999] }),
    ).toThrow();
    expect(rows('SELECT id FROM lists')).toEqual([]);
    expect(rows('SELECT * FROM list_site_tags')).toEqual([]);
  });
});
