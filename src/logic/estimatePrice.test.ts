import type { Unit } from '@/db/constants';

import { estimatePrice } from './estimatePrice';
import type { EstimateContext, PricePoint, ReferencePrice } from './pricingTypes';
import { makePricePoint } from './testing/pricePointBuilder';

const FERIA = 1;
const SUPER = 2;
const CONDES = 10;
const COMPANIAS = 11;

const context: EstimateContext = { parentTagId: FERIA, siteTagIds: [CONDES] };
const reference: ReferencePrice = { price: 800, defaultUnit: 'kg' };

function estimate(history: readonly PricePoint[], over: { unit?: Unit; context?: EstimateContext; reference?: ReferencePrice } = {}) {
  return estimatePrice({
    unit: over.unit ?? 'kg',
    context: over.context ?? context,
    history,
    reference: over.reference ?? reference,
  });
}

describe('nivel 1: último precio del mismo sitio (REQ-07.2 a)', () => {
  it('usa el más reciente registrado en la misma etiqueta de sitio', () => {
    const history = [
      makePricePoint({ id: 1, price: 900, recordedDate: '2026-11-03', parentTagId: FERIA, siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 950, recordedDate: '2026-11-10', parentTagId: FERIA, siteTagIds: [CONDES] }),
    ];
    expect(estimate(history)).toEqual({ price: 950, source: 'site', basisMismatch: false, recordedDate: '2026-11-10' });
  });

  it('ignora los registros de otros sitios aunque sean más recientes', () => {
    const history = [
      makePricePoint({ id: 1, price: 900, recordedDate: '2026-11-03', siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 1200, recordedDate: '2026-11-17', siteTagIds: [COMPANIAS] }),
    ];
    expect(estimate(history)).toMatchObject({ price: 900, source: 'site' });
  });

  it('un registro de sitio antiguo gana sobre uno de la etiqueta madre más reciente', () => {
    const history = [
      makePricePoint({ id: 1, price: 900, recordedDate: '2026-10-01', siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 1200, recordedDate: '2026-11-17', siteTagIds: [] }),
    ];
    expect(estimate(history)).toMatchObject({ price: 900, source: 'site', recordedDate: '2026-10-01' });
  });

  it('coincide si comparte al menos una etiqueta de sitio con la lista', () => {
    const twoSites: EstimateContext = { parentTagId: FERIA, siteTagIds: [CONDES, COMPANIAS] };
    const history = [makePricePoint({ id: 1, price: 980, siteTagIds: [COMPANIAS, 99] })];
    expect(estimate(history, { context: twoSites })).toMatchObject({ price: 980, source: 'site' });
  });
});

describe('nivel 2: último precio de la misma etiqueta madre (REQ-07.2 b)', () => {
  it('usa el más reciente de la misma etiqueta madre aunque sea de otro sitio', () => {
    const history = [
      makePricePoint({ id: 1, price: 900, recordedDate: '2026-11-03', siteTagIds: [COMPANIAS] }),
      makePricePoint({ id: 2, price: 1100, recordedDate: '2026-11-10', siteTagIds: [] }),
    ];
    expect(estimate(history)).toEqual({ price: 1100, source: 'parent', basisMismatch: false, recordedDate: '2026-11-10' });
  });

  it('una lista sin etiquetas de sitio va directo al nivel de etiqueta madre', () => {
    const noSites: EstimateContext = { parentTagId: FERIA, siteTagIds: [] };
    const history = [makePricePoint({ id: 1, price: 900, siteTagIds: [CONDES] })];
    expect(estimate(history, { context: noSites })).toMatchObject({ price: 900, source: 'parent' });
  });

  it('nunca usa registros de otra etiqueta madre, tampoco si comparten sitio', () => {
    const history = [
      makePricePoint({ id: 1, price: 1500, parentTagId: SUPER, siteTagIds: [] }),
      makePricePoint({ id: 2, price: 1600, parentTagId: SUPER, siteTagIds: [CONDES] }),
    ];
    expect(estimate(history)).toMatchObject({ price: 800, source: 'reference' });
  });
});

describe('nivel 3: precio de referencia (REQ-07.2 c, REQ-07.3)', () => {
  it('con historial vacío usa la referencia', () => {
    expect(estimate([])).toEqual({ price: 800, source: 'reference', basisMismatch: false, recordedDate: null });
  });

  it('siempre devuelve un entero mayor o igual a 1', () => {
    const result = estimate([], { reference: { price: 1, defaultUnit: 'kg' } });
    expect(Number.isInteger(result.price) && result.price >= 1).toBe(true);
  });
});

describe('base del precio: por kilo contra por unidad', () => {
  it('con unidades por kilo solo usa registros por kilo', () => {
    const history = [
      makePricePoint({ id: 1, price: 300, priceBasis: 'unit', recordedDate: '2026-11-17', siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 900, priceBasis: 'kg', recordedDate: '2026-11-03', siteTagIds: [CONDES] }),
    ];
    for (const unit of ['kg', 'half_kg', 'quarter_kg'] as const) {
      expect(estimate(history, { unit })).toMatchObject({ price: 900, source: 'site' });
    }
  });

  it('con unidad suelta solo usa registros por unidad', () => {
    const history = [
      makePricePoint({ id: 1, price: 300, priceBasis: 'unit', siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 900, priceBasis: 'kg', recordedDate: '2026-11-17', siteTagIds: [CONDES] }),
    ];
    expect(estimate(history, { unit: 'unit', reference: { price: 250, defaultUnit: 'unit' } })).toMatchObject({
      price: 300,
      source: 'site',
    });
  });

  it('si solo hay registros de la otra base, cae a la referencia', () => {
    const history = [makePricePoint({ id: 1, price: 900, priceBasis: 'kg', siteTagIds: [CONDES] })];
    expect(estimate(history, { unit: 'unit', reference: { price: 250, defaultUnit: 'unit' } })).toMatchObject({
      price: 250,
      source: 'reference',
      basisMismatch: false,
    });
  });
});

describe('referencia con base distinta (basisMismatch)', () => {
  it('usa la referencia igual, pero lo marca, si su base no coincide con la unidad del ítem', () => {
    expect(estimate([], { unit: 'unit', reference: { price: 800, defaultUnit: 'kg' } })).toEqual({
      price: 800,
      source: 'reference',
      basisMismatch: true,
      recordedDate: null,
    });
    expect(estimate([], { unit: 'quarter_kg', reference: { price: 300, defaultUnit: 'unit' } })).toMatchObject({
      price: 300,
      basisMismatch: true,
    });
  });

  it('no lo marca si las bases coinciden, aunque las unidades sean distintas', () => {
    expect(estimate([], { unit: 'half_kg', reference: { price: 800, defaultUnit: 'kg' } }).basisMismatch).toBe(false);
  });

  it('nunca lo marca cuando el precio sale del historial', () => {
    // Registro por kilo del mismo sitio, ítem por kilo: sale del historial y la referencia
    // (que está en otra base) ni se mira.
    const history = [makePricePoint({ id: 1, priceBasis: 'kg', siteTagIds: [CONDES] })];
    expect(estimate(history, { unit: 'kg', reference: { price: 300, defaultUnit: 'unit' } })).toMatchObject({
      source: 'site',
      basisMismatch: false,
    });
    expect(estimate([makePricePoint({ id: 2, priceBasis: 'unit' })], { unit: 'unit', reference: { price: 800, defaultUnit: 'kg' } })).toMatchObject({
      source: 'parent',
      basisMismatch: false,
    });
  });
});

describe('desempates', () => {
  it('misma fecha: gana el instante de registro más reciente, luego el id mayor', () => {
    const history = [
      makePricePoint({ id: 1, price: 900, recordedAt: '2026-11-10T09:00:00.000Z', siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 950, recordedAt: '2026-11-10T18:00:00.000Z', siteTagIds: [CONDES] }),
      makePricePoint({ id: 3, price: 970, recordedAt: '2026-11-10T18:00:00.000Z', siteTagIds: [CONDES] }),
    ];
    expect(estimate(history).price).toBe(970);
    expect(estimate([...history].reverse()).price).toBe(970);
  });
});

describe('pureza', () => {
  it('no modifica ni reordena el historial ni el contexto', () => {
    const history = Object.freeze([
      makePricePoint({ id: 2, price: 950, recordedDate: '2026-11-10', siteTagIds: Object.freeze([CONDES]) as number[] }),
      makePricePoint({ id: 1, price: 900, recordedDate: '2026-11-03', siteTagIds: Object.freeze([CONDES]) as number[] }),
    ]);
    const frozenContext = Object.freeze({ parentTagId: FERIA, siteTagIds: Object.freeze([CONDES]) }) as EstimateContext;
    const before = JSON.stringify(history);
    expect(() => estimate(history, { context: frozenContext })).not.toThrow();
    expect(JSON.stringify(history)).toBe(before);
  });

  it('da el mismo resultado cada vez', () => {
    const history = [makePricePoint({ id: 1, siteTagIds: [CONDES] })];
    expect(estimate(history)).toEqual(estimate(history));
  });
});

describe('entradas inválidas (fallar fuerte)', () => {
  it.each([0, -5, 12.5, Number.NaN])('rechaza la referencia con precio %s', (price) => {
    expect(() => estimate([], { reference: { price, defaultUnit: 'kg' } })).toThrow(RangeError);
  });

  it('rechaza una unidad o una unidad de referencia desconocidas', () => {
    expect(() => estimate([], { unit: 'litro' as never })).toThrow(RangeError);
    expect(() => estimate([], { reference: { price: 800, defaultUnit: 'litro' as never } })).toThrow(RangeError);
  });

  it('rechaza un historial con un precio inválido, aunque ese registro no se vaya a usar', () => {
    const history = [
      makePricePoint({ id: 1, price: 900, siteTagIds: [CONDES] }),
      makePricePoint({ id: 2, price: 0, parentTagId: SUPER }),
    ];
    expect(() => estimate(history)).toThrow(RangeError);
  });
});

describe('datos corruptos en el historial, el contexto o la referencia (RangeError, no TypeError ni ignorar)', () => {
  const good = makePricePoint({ id: 1, price: 900, siteTagIds: [CONDES] });

  it.each([
    ['una base de precio fuera de las permitidas', { priceBasis: 'lb' as never }],
    ['etiquetas de sitio que no son una lista', { siteTagIds: null as never }],
    ['etiquetas de sitio que no son enteros', { siteTagIds: ['a'] as never }],
    ['un id que no es un entero', { id: Number.NaN }],
    ['una etiqueta madre que no es un entero', { parentTagId: 1.5 }],
    ['una fecha mal formada', { recordedDate: '10-11-2026' }],
    ['un instante de registro que no es texto', { recordedAt: null as never }],
  ])('rechaza un registro con %s', (_name, bad) => {
    expect(() => estimate([good, { ...makePricePoint({ id: 2 }), ...bad }])).toThrow(RangeError);
  });

  it('rechaza etiquetas de sitio corruptas aunque la lista no tenga etiquetas de sitio', () => {
    const noSites: EstimateContext = { parentTagId: FERIA, siteTagIds: [] };
    expect(() => estimate([{ ...good, siteTagIds: 5 as never }], { context: noSites })).toThrow(RangeError);
  });

  it.each([
    ['sin etiquetas de sitio', { parentTagId: FERIA, siteTagIds: undefined as never }],
    ['con una etiqueta de sitio que no es entero', { parentTagId: FERIA, siteTagIds: ['x'] as never }],
    ['con una etiqueta madre que no es entero', { parentTagId: 'feria' as never, siteTagIds: [] }],
  ])('rechaza un contexto %s', (_name, badContext) => {
    expect(() => estimate([good], { context: badContext })).toThrow(RangeError);
  });

  it.each([undefined, null])('rechaza una referencia %s', (badReference) => {
    // Se llama a estimatePrice directamente: el auxiliar estimate() reemplaza undefined por la referencia por defecto.
    expect(() =>
      estimatePrice({ unit: 'kg', context, history: [good], reference: badReference as never }),
    ).toThrow(RangeError);
  });
});
