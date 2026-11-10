import { createSeededDb, expectCode, type SeededDb } from '../testing/seededTestDb';

import { createCatalogItem } from './catalogItems';
import { addListItem, listListItems, removeListItem, updateListItem } from './listItems';
import { createList } from './lists';

let t: SeededDb;
let listId: number;
let tomateId: number;
let paltaId: number;

beforeEach(async () => {
  t = await createSeededDb();
  listId = createList(t.db, { name: 'L', parentTagId: t.feria.id }).id;
  tomateId = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 }).id;
  paltaId = createCatalogItem(t.db, { name: 'palta', defaultUnit: 'kg', referencePrice: 3000 }).id;
});

afterEach(() => {
  t.close();
});

const base = () => ({ listId, catalogItemId: tomateId, quantity: 1, unit: 'kg' as const, unitPrice: 800 });

describe('addListItem', () => {
  it('agrega un ítem con cantidad, unidad y precio', () => {
    const item = addListItem(t.db, { ...base(), quantity: 2, unit: 'half_kg', unitPrice: 900 });
    expect(item).toMatchObject({ listId, catalogItemId: tomateId, quantity: 2, unit: 'half_kg', unitPrice: 900 });
    expect(item.isPurchased).toBe(false);
    expect(item.manualPrice).toBeNull();
    expect(item.purchasedPrice).toBeNull();
  });

  it('acepta cantidades decimales mayores que 0', () => {
    expect(addListItem(t.db, { ...base(), quantity: 1.5 }).quantity).toBe(1.5);
  });

  it('asigna un orden creciente', () => {
    const a = addListItem(t.db, base());
    const b = addListItem(t.db, { ...base(), catalogItemId: paltaId });
    expect(b.sortOrder).toBeGreaterThan(a.sortOrder);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rechaza la cantidad %s', (quantity) => {
    expectCode(() => addListItem(t.db, { ...base(), quantity }), 'INVALID_QUANTITY');
  });

  it.each([0, -50, 10.5, Number.NaN])('rechaza el precio %s', (unitPrice) => {
    expectCode(() => addListItem(t.db, { ...base(), unitPrice }), 'INVALID_PRICE');
  });

  it('rechaza una unidad que no existe', () => {
    expectCode(() => addListItem(t.db, { ...base(), unit: 'litro' as never }), 'INVALID_UNIT');
  });

  it('falla con NOT_FOUND si la lista o el ítem de la base no existen', () => {
    expectCode(() => addListItem(t.db, { ...base(), listId: 9999 }), 'NOT_FOUND');
    expectCode(() => addListItem(t.db, { ...base(), catalogItemId: 9999 }), 'NOT_FOUND');
    expect(listListItems(t.db, listId)).toHaveLength(0);
  });
});

describe('updateListItem', () => {
  it('cambia solo los campos indicados', () => {
    const item = addListItem(t.db, base());
    const updated = updateListItem(t.db, item.id, { quantity: 3, unit: 'quarter_kg' });
    expect(updated).toMatchObject({ quantity: 3, unit: 'quarter_kg', unitPrice: 800 });
  });

  it('guarda y quita el precio manual', () => {
    const item = addListItem(t.db, base());
    expect(updateListItem(t.db, item.id, { manualPrice: 1000 }).manualPrice).toBe(1000);
    expect(updateListItem(t.db, item.id, { manualPrice: null }).manualPrice).toBeNull();
  });

  it('rechaza valores inválidos y deja el ítem como estaba', () => {
    const item = addListItem(t.db, base());
    expectCode(() => updateListItem(t.db, item.id, { quantity: 0 }), 'INVALID_QUANTITY');
    expectCode(() => updateListItem(t.db, item.id, { unitPrice: 0 }), 'INVALID_PRICE');
    expectCode(() => updateListItem(t.db, item.id, { manualPrice: -3 }), 'INVALID_PRICE');
    expectCode(() => updateListItem(t.db, item.id, { unit: 'x' as never }), 'INVALID_UNIT');
    expect(listListItems(t.db, listId)[0]).toMatchObject({ quantity: 1, unitPrice: 800, manualPrice: null });
  });

  it('falla con NOT_FOUND si el ítem no existe', () => {
    expectCode(() => updateListItem(t.db, 9999, { quantity: 2 }), 'NOT_FOUND');
  });
});

describe('removeListItem y listListItems', () => {
  it('quita un ítem y lista los demás en orden', () => {
    const a = addListItem(t.db, base());
    const b = addListItem(t.db, { ...base(), catalogItemId: paltaId });
    expect(listListItems(t.db, listId).map((i) => i.id)).toEqual([a.id, b.id]);
    removeListItem(t.db, a.id);
    expect(listListItems(t.db, listId).map((i) => i.id)).toEqual([b.id]);
  });

  it('falla con NOT_FOUND si el ítem no existe', () => {
    expectCode(() => removeListItem(t.db, 9999), 'NOT_FOUND');
  });
});
