import { createSeededDb, expectCode, fixedClock, type SeededDb } from '../testing/seededTestDb';

import {
  createCatalogItem,
  findCatalogItemByName,
  getCatalogItem,
  updateReferencePrice,
} from './catalogItems';
import { createList } from './lists';
import { getPriceHistory, recordPrice } from './priceRecords';

const NOV_10 = fixedClock('2026-11-10T15:30:00');
const NOV_17 = fixedClock('2026-11-17T09:00:00');

let t: SeededDb;

beforeEach(async () => {
  t = await createSeededDb();
});

afterEach(() => {
  t.close();
});

describe('createCatalogItem', () => {
  it('crea un ítem propio con nombre normalizado', () => {
    const item = createCatalogItem(t.db, { name: '  Piña ', defaultUnit: 'unit', referencePrice: 1500 }, NOV_10);
    expect(item.name).toBe('Piña');
    expect(item.normalizedName).toBe('pina');
    expect(item.isUserAdded).toBe(true);
    expect(item.referencePrice).toBe(1500);
    expect(item.createdAt).toBe(item.updatedAt);
  });

  it('permite marcar un ítem como no propio (datos iniciales)', () => {
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800, isUserAdded: false });
    expect(item.isUserAdded).toBe(false);
  });

  it.each([0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rechaza el precio de referencia %s', (price) => {
    expectCode(() => createCatalogItem(t.db, { name: 'x', defaultUnit: 'kg', referencePrice: price }), 'INVALID_PRICE');
  });

  it('exige un precio de referencia (REQ-04.5)', () => {
    expectCode(
      () => createCatalogItem(t.db, { name: 'x', defaultUnit: 'kg', referencePrice: undefined as unknown as number }),
      'INVALID_PRICE',
    );
  });

  it('rechaza unidad y nombre inválidos', () => {
    expectCode(() => createCatalogItem(t.db, { name: 'x', defaultUnit: 'litro' as never, referencePrice: 100 }), 'INVALID_UNIT');
    expectCode(() => createCatalogItem(t.db, { name: ' ', defaultUnit: 'kg', referencePrice: 100 }), 'INVALID_NAME');
  });

  it('rechaza un nombre que queda vacío al normalizarlo (solo signos combinados)', () => {
    expectCode(() => createCatalogItem(t.db, { name: '́', defaultUnit: 'kg', referencePrice: 100 }), 'INVALID_NAME');
    expectCode(() => createCatalogItem(t.db, { name: '́̂', defaultUnit: 'kg', referencePrice: 100 }), 'INVALID_NAME');
  });

  it('rechaza duplicados aunque cambien mayúsculas o tildes', () => {
    createCatalogItem(t.db, { name: 'Limón', defaultUnit: 'kg', referencePrice: 2000 });
    expectCode(() => createCatalogItem(t.db, { name: 'limon', defaultUnit: 'kg', referencePrice: 2500 }), 'DUPLICATE_ITEM');
  });
});

describe('getCatalogItem y findCatalogItemByName', () => {
  it('getCatalogItem falla con NOT_FOUND', () => {
    expectCode(() => getCatalogItem(t.db, 9999), 'NOT_FOUND');
  });

  it('findCatalogItemByName encuentra por nombre normalizado y devuelve null si no hay', () => {
    const item = createCatalogItem(t.db, { name: 'Pimentón', defaultUnit: 'kg', referencePrice: 2000 });
    expect(findCatalogItemByName(t.db, 'PIMENTON')?.id).toBe(item.id);
    expect(findCatalogItemByName(t.db, 'zapallo')).toBeNull();
  });
});

describe('updateReferencePrice', () => {
  it('cambia el precio de referencia y la fecha de actualización', () => {
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 }, NOV_10);
    const updated = updateReferencePrice(t.db, item.id, 1600, NOV_17);
    expect(updated.referencePrice).toBe(1600);
    expect(updated.updatedAt).not.toBe(item.updatedAt);
    expect(updated.createdAt).toBe(item.createdAt);
  });

  it('no modifica ningún registro del historial de precios (REQ-05.3)', () => {
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: item.id, price: 900, unit: 'kg' }, NOV_10);
    recordPrice(t.db, { listId: list.id, catalogItemId: item.id, price: 950, unit: 'kg' }, NOV_17);
    const before = JSON.stringify(getPriceHistory(t.db, item.id));
    updateReferencePrice(t.db, item.id, 1600, NOV_17);
    expect(JSON.stringify(getPriceHistory(t.db, item.id))).toBe(before);
  });

  it.each([0, -1, 2.5, Number.NaN])('rechaza el precio %s y deja el anterior', (price) => {
    const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    expectCode(() => updateReferencePrice(t.db, item.id, price), 'INVALID_PRICE');
    expect(getCatalogItem(t.db, item.id).referencePrice).toBe(800);
  });

  it('falla con NOT_FOUND si el ítem no existe', () => {
    expectCode(() => updateReferencePrice(t.db, 9999, 100), 'NOT_FOUND');
  });
});
