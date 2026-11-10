import { createSeededDb, type SeededDb } from '../testing/seededTestDb';

import { createCatalogItem } from './catalogItems';
import { createList } from './lists';
import { recordPrice } from './priceRecords';
import { getDatabaseStats } from './stats';
import { createSiteTag } from './tags';

let t: SeededDb;

beforeEach(async () => {
  t = await createSeededDb();
});

afterEach(() => {
  t.close();
});

describe('getDatabaseStats', () => {
  it('en una base recién creada hay solo las 2 etiquetas madre y todo lo demás en cero', () => {
    const stats = getDatabaseStats(t.db);
    expect(stats.parentTags.map((tag) => tag.slug)).toEqual(['feria', 'supermercado']);
    expect(stats.siteTagCount).toBe(0);
    expect(stats.listCount).toBe(0);
    expect(stats.catalogItemCount).toBe(0);
    expect(stats.priceRecordCount).toBe(0);
  });

  it('cuenta lo que se va guardando', () => {
    createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    createList(t.db, { name: 'M', parentTagId: t.supermercado.id });
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    recordPrice(t.db, { listId: list.id, catalogItemId: item.id, price: 900, unit: 'kg' });
    recordPrice(t.db, { listId: list.id, catalogItemId: item.id, price: 950, unit: 'kg' });

    const stats = getDatabaseStats(t.db);
    expect(stats.siteTagCount).toBe(1);
    expect(stats.listCount).toBe(2);
    expect(stats.catalogItemCount).toBe(1);
    expect(stats.priceRecordCount).toBe(2);
    expect(stats.parentTags).toHaveLength(2);
  });
});
