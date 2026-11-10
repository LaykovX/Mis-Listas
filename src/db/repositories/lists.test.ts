import { createSeededDb, expectCode, fixedClock, type SeededDb } from '../testing/seededTestDb';

import { createCatalogItem } from './catalogItems';
import { addListItem, listListItems, updateListItem } from './listItems';
import {
  createList,
  deleteList,
  duplicateList,
  getList,
  listLists,
  markListUsed,
  renameList,
  setListSiteTags,
} from './lists';
import { createSiteTag } from './tags';

const NOV_10 = fixedClock('2026-11-10T15:30:00');
const NOV_17 = fixedClock('2026-11-17T09:00:00');

let t: SeededDb;

beforeEach(async () => {
  t = await createSeededDb();
});

afterEach(() => {
  t.close();
});

describe('createList', () => {
  it('crea una lista con etiqueta madre, fecha de creación de hoy y sin fecha de uso', () => {
    const list = createList(t.db, { name: ' Viernes ', parentTagId: t.feria.id }, NOV_10);
    expect(list.name).toBe('Viernes');
    expect(list.parentTagId).toBe(t.feria.id);
    expect(list.createdDate).toBe('2026-11-10');
    expect(list.usedDate).toBeNull();
    expect(list.siteTagIds).toEqual([]);
  });

  it('usa la fecha local del teléfono aunque en UTC ya sea otro día', () => {
    const lateNight = fixedClock('2026-11-10T23:59:00');
    expect(createList(t.db, { name: 'Noche', parentTagId: t.feria.id }, lateNight).createdDate).toBe('2026-11-10');
  });

  it('acepta cero o más etiquetas de sitio y elimina repetidas', () => {
    const a = createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const b = createSiteTag(t.db, { name: 'feria las compañías', color: '#1565C0' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [a.id, b.id, a.id] });
    expect([...list.siteTagIds].sort()).toEqual([a.id, b.id].sort());
  });

  it('exige etiqueta madre', () => {
    expectCode(
      () => createList(t.db, { name: 'L', parentTagId: undefined as unknown as number }),
      'PARENT_TAG_REQUIRED',
    );
  });

  it('rechaza una etiqueta madre que no existe, o que es de sitio', () => {
    const site = createSiteTag(t.db, { name: 'feria', color: '#2E7D32' });
    expectCode(() => createList(t.db, { name: 'L', parentTagId: 9999 }), 'NOT_FOUND');
    expectCode(() => createList(t.db, { name: 'L', parentTagId: site.id }), 'NOT_A_PARENT_TAG');
  });

  it('rechaza una etiqueta madre como etiqueta de sitio, o una que no existe', () => {
    expectCode(
      () => createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [t.supermercado.id] }),
      'NOT_A_SITE_TAG',
    );
    expectCode(() => createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [9999] }), 'NOT_FOUND');
  });

  it('rechaza nombres vacíos y no deja nada guardado cuando falla', () => {
    expectCode(() => createList(t.db, { name: '  ', parentTagId: t.feria.id }), 'INVALID_NAME');
    const site = createSiteTag(t.db, { name: 'feria', color: '#2E7D32' });
    expectCode(
      () => createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [site.id, 9999] }),
      'NOT_FOUND',
    );
    expect(listLists(t.db)).toHaveLength(0);
  });
});

describe('getList y listLists', () => {
  it('getList falla con NOT_FOUND si no existe', () => {
    expectCode(() => getList(t.db, 9999), 'NOT_FOUND');
  });

  it('listLists devuelve primero las más recientes', () => {
    const old = createList(t.db, { name: 'vieja', parentTagId: t.feria.id }, NOV_10);
    const recent = createList(t.db, { name: 'nueva', parentTagId: t.feria.id }, NOV_17);
    expect(listLists(t.db).map((l) => l.id)).toEqual([recent.id, old.id]);
  });
});

describe('listLists con fechas de creación indicadas a mano', () => {
  it('ordena por la fecha de creación que ve el usuario, no por el momento en que se guardó', () => {
    const later = createList(t.db, { name: 'creada después', parentTagId: t.feria.id, createdDate: '2026-11-17' }, NOV_10);
    const backdated = createList(t.db, { name: 'con fecha antigua', parentTagId: t.feria.id, createdDate: '2026-11-03' }, NOV_17);
    expect(listLists(t.db).map((l) => l.id)).toEqual([later.id, backdated.id]);
  });
});

describe('renameList', () => {
  it('cambia el nombre', () => {
    const list = createList(t.db, { name: 'a', parentTagId: t.feria.id }, NOV_10);
    expect(renameList(t.db, list.id, ' b ', NOV_17).name).toBe('b');
  });

  it('rechaza nombre inválido y lista inexistente', () => {
    const list = createList(t.db, { name: 'a', parentTagId: t.feria.id });
    expectCode(() => renameList(t.db, list.id, ''), 'INVALID_NAME');
    expectCode(() => renameList(t.db, 9999, 'x'), 'NOT_FOUND');
    expect(getList(t.db, list.id).name).toBe('a');
  });
});

describe('deleteList', () => {
  it('borra la lista y sus ítems', () => {
    const list = createList(t.db, { name: 'a', parentTagId: t.feria.id });
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    addListItem(t.db, { listId: list.id, catalogItemId: item.id, quantity: 1, unit: 'kg', unitPrice: 800 });
    deleteList(t.db, list.id);
    expectCode(() => getList(t.db, list.id), 'NOT_FOUND');
    expect(listListItems(t.db, list.id)).toEqual([]);
  });

  it('falla con NOT_FOUND si no existe', () => {
    expectCode(() => deleteList(t.db, 9999), 'NOT_FOUND');
  });
});

describe('duplicateList', () => {
  function buildOriginal() {
    const site = createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const original = createList(t.db, { name: 'Viernes', parentTagId: t.feria.id, siteTagIds: [site.id] }, NOV_10);
    markListUsed(t.db, original.id, '2026-11-10', NOV_10);
    const tomate = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    const palta = createCatalogItem(t.db, { name: 'palta', defaultUnit: 'kg', referencePrice: 3000 });
    const first = addListItem(t.db, { listId: original.id, catalogItemId: tomate.id, quantity: 2, unit: 'half_kg', unitPrice: 900 });
    addListItem(t.db, { listId: original.id, catalogItemId: palta.id, quantity: 1, unit: 'kg', unitPrice: 3200 });
    updateListItem(t.db, first.id, { manualPrice: 950 });
    return { original, site };
  }

  it('copia ítems y etiquetas, con fecha de creación nueva y sin fecha de uso', () => {
    const { original, site } = buildOriginal();
    const copy = duplicateList(t.db, original.id, {}, NOV_17);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Viernes');
    expect(copy.createdDate).toBe('2026-11-17');
    expect(copy.usedDate).toBeNull();
    expect(copy.parentTagId).toBe(t.feria.id);
    expect(copy.siteTagIds).toEqual([site.id]);
    const items = listListItems(t.db, copy.id);
    expect(items.map((i) => [i.quantity, i.unit, i.unitPrice])).toEqual([
      [2, 'half_kg', 900],
      [1, 'kg', 3200],
    ]);
  });

  it('deja los ítems copiados sin compra ni precio manual', () => {
    const { original } = buildOriginal();
    const copy = duplicateList(t.db, original.id, {}, NOV_17);
    for (const item of listListItems(t.db, copy.id)) {
      expect(item.isPurchased).toBe(false);
      expect(item.purchasedPrice).toBeNull();
      expect(item.manualPrice).toBeNull();
    }
  });

  it('no modifica la lista original', () => {
    const { original } = buildOriginal();
    duplicateList(t.db, original.id, {}, NOV_17);
    expect(getList(t.db, original.id).usedDate).toBe('2026-11-10');
    expect(listListItems(t.db, original.id)[0].manualPrice).toBe(950);
    expect(listLists(t.db)).toHaveLength(2);
  });

  it('permite darle otro nombre y falla si el original no existe', () => {
    const { original } = buildOriginal();
    expect(duplicateList(t.db, original.id, { name: 'Viernes 17' }, NOV_17).name).toBe('Viernes 17');
    expectCode(() => duplicateList(t.db, 9999), 'NOT_FOUND');
  });
});

describe('markListUsed', () => {
  it('guarda la fecha de hoy por defecto y la fecha indicada si se da', () => {
    const list = createList(t.db, { name: 'a', parentTagId: t.feria.id }, NOV_10);
    expect(markListUsed(t.db, list.id, undefined, NOV_17).usedDate).toBe('2026-11-17');
    expect(markListUsed(t.db, list.id, '2026-11-12').usedDate).toBe('2026-11-12');
  });

  it.each(['10-11-2026', '2026-13-01', '2026-02-30', 'hoy', ''])('rechaza la fecha inválida "%s"', (date) => {
    const list = createList(t.db, { name: 'a', parentTagId: t.feria.id });
    expectCode(() => markListUsed(t.db, list.id, date), 'INVALID_DATE');
    expect(getList(t.db, list.id).usedDate).toBeNull();
  });

  it('falla con NOT_FOUND si la lista no existe', () => {
    expectCode(() => markListUsed(t.db, 9999), 'NOT_FOUND');
  });
});

describe('setListSiteTags', () => {
  it('reemplaza las etiquetas de sitio y rechaza etiquetas madre', () => {
    const a = createSiteTag(t.db, { name: 'a', color: '#2E7D32' });
    const b = createSiteTag(t.db, { name: 'b', color: '#1565C0' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [a.id] });
    expect(setListSiteTags(t.db, list.id, [b.id]).siteTagIds).toEqual([b.id]);
    expectCode(() => setListSiteTags(t.db, list.id, [t.feria.id]), 'NOT_A_SITE_TAG');
    expect(getList(t.db, list.id).siteTagIds).toEqual([b.id]);
    expect(setListSiteTags(t.db, list.id, []).siteTagIds).toEqual([]);
  });
});
