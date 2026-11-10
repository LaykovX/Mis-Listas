import { createSeededDb, expectCode, fixedClock, type SeededDb } from '../testing/seededTestDb';

import { createCatalogItem } from './catalogItems';
import { createList, deleteList, setListSiteTags } from './lists';
import { getPriceHistory, recordPrice } from './priceRecords';
import { createSiteTag } from './tags';

const NOV_10 = fixedClock('2026-11-10T15:30:00');
const NOV_17 = fixedClock('2026-11-17T09:00:00');

let t: SeededDb;
let tomateId: number;

beforeEach(async () => {
  t = await createSeededDb();
  tomateId = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 }).id;
});

afterEach(() => {
  t.close();
});

describe('recordPrice', () => {
  it('copia la etiqueta madre y las de sitio de la lista, y guarda la fecha (REQ-06.4)', () => {
    const condes = createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [condes.id] });
    const record = recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' }, NOV_10);
    expect(record).toMatchObject({
      catalogItemId: tomateId,
      listId: list.id,
      parentTagId: t.feria.id,
      price: 900,
      priceBasis: 'kg',
      recordedDate: '2026-11-10',
    });
    expect(record.siteTagIds).toEqual([condes.id]);
  });

  it.each([
    ['unit', 'unit'],
    ['kg', 'kg'],
    ['half_kg', 'kg'],
    ['quarter_kg', 'kg'],
  ] as const)('con la unidad %s el precio es por %s', (unit, basis) => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    expect(recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit }).priceBasis).toBe(basis);
  });

  it('acepta una fecha indicada', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    const record = recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg', recordedDate: '2026-11-06' });
    expect(record.recordedDate).toBe('2026-11-06');
  });

  it('rechaza precio, unidad y fecha inválidos sin guardar nada', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    const ok = { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' as const };
    expectCode(() => recordPrice(t.db, { ...ok, price: 0 }), 'INVALID_PRICE');
    expectCode(() => recordPrice(t.db, { ...ok, price: 99.5 }), 'INVALID_PRICE');
    expectCode(() => recordPrice(t.db, { ...ok, unit: 'x' as never }), 'INVALID_UNIT');
    expectCode(() => recordPrice(t.db, { ...ok, recordedDate: '2026-02-31' }), 'INVALID_DATE');
    expect(getPriceHistory(t.db, tomateId)).toHaveLength(0);
  });

  it('falla con NOT_FOUND si la lista o el ítem no existen', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    expectCode(() => recordPrice(t.db, { listId: 9999, catalogItemId: tomateId, price: 900, unit: 'kg' }), 'NOT_FOUND');
    expectCode(() => recordPrice(t.db, { listId: list.id, catalogItemId: 9999, price: 900, unit: 'kg' }), 'NOT_FOUND');
    expect(getPriceHistory(t.db, tomateId)).toHaveLength(0);
  });

  it('conserva las etiquetas originales aunque la lista cambie de etiquetas después', () => {
    const condes = createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const otra = createSiteTag(t.db, { name: 'otra feria', color: '#1565C0' });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id, siteTagIds: [condes.id] });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' }, NOV_10);
    setListSiteTags(t.db, list.id, [otra.id]);
    expect(getPriceHistory(t.db, tomateId)[0].siteTagIds).toEqual([condes.id]);
  });

  it('el registro sigue existiendo, sin lista, si la lista se borra', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' }, NOV_10);
    deleteList(t.db, list.id);
    const history = getPriceHistory(t.db, tomateId);
    expect(history).toHaveLength(1);
    expect(history[0].listId).toBeNull();
  });
});

describe('getPriceHistory', () => {
  it('devuelve el historial de más antiguo a más reciente', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 1000, unit: 'kg', recordedDate: '2026-11-17' }, NOV_17);
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 800, unit: 'kg', recordedDate: '2026-11-03' }, NOV_10);
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg', recordedDate: '2026-11-10' }, NOV_10);
    expect(getPriceHistory(t.db, tomateId).map((r) => r.price)).toEqual([800, 900, 1000]);
  });

  it('desempata por el orden de registro cuando la fecha es la misma', () => {
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' }, NOV_10);
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 950, unit: 'kg' }, NOV_10);
    expect(getPriceHistory(t.db, tomateId).map((r) => r.price)).toEqual([900, 950]);
  });

  it('solo incluye los registros del ítem pedido', () => {
    const palta = createCatalogItem(t.db, { name: 'palta', defaultUnit: 'kg', referencePrice: 3000 });
    const list = createList(t.db, { name: 'L', parentTagId: t.feria.id });
    recordPrice(t.db, { listId: list.id, catalogItemId: tomateId, price: 900, unit: 'kg' });
    recordPrice(t.db, { listId: list.id, catalogItemId: palta.id, price: 3200, unit: 'kg' });
    expect(getPriceHistory(t.db, palta.id).map((r) => r.price)).toEqual([3200]);
  });

  it('filtra por etiqueta madre y por etiqueta de sitio', () => {
    const condes = createSiteTag(t.db, { name: 'feria las condes', color: '#2E7D32' });
    const feriaCondes = createList(t.db, { name: 'F', parentTagId: t.feria.id, siteTagIds: [condes.id] });
    const feriaSola = createList(t.db, { name: 'G', parentTagId: t.feria.id });
    const super1 = createList(t.db, { name: 'S', parentTagId: t.supermercado.id });
    recordPrice(t.db, { listId: feriaCondes.id, catalogItemId: tomateId, price: 900, unit: 'kg' }, NOV_10);
    recordPrice(t.db, { listId: feriaSola.id, catalogItemId: tomateId, price: 950, unit: 'kg' }, NOV_10);
    recordPrice(t.db, { listId: super1.id, catalogItemId: tomateId, price: 1500, unit: 'kg' }, NOV_10);
    expect(getPriceHistory(t.db, tomateId, { parentTagId: t.feria.id }).map((r) => r.price).sort()).toEqual([900, 950]);
    expect(getPriceHistory(t.db, tomateId, { parentTagId: t.supermercado.id }).map((r) => r.price)).toEqual([1500]);
    expect(getPriceHistory(t.db, tomateId, { siteTagId: condes.id }).map((r) => r.price)).toEqual([900]);
  });
});
