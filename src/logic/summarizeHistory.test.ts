import { summarizeHistory } from './summarizeHistory';
import { makePricePoint } from './testing/pricePointBuilder';

const p = (id: number, price: number, date: string, over: Parameters<typeof makePricePoint>[0] extends infer T ? Partial<T> : never = {}) =>
  makePricePoint({ id, price, recordedDate: date, ...over });

describe('faltan datos (REQ-08.5)', () => {
  it('con 0 registros: faltan datos y no hay último precio', () => {
    expect(summarizeHistory([], 'kg')).toEqual({ status: 'insufficient-data', pointCount: 0, latest: null });
  });

  it('con 1 registro: faltan datos, pero igual entrega el último precio y su fecha (REQ-08.2)', () => {
    expect(summarizeHistory([p(1, 900, '2026-11-10')], 'kg')).toEqual({
      status: 'insufficient-data',
      pointCount: 1,
      latest: { price: 900, recordedDate: '2026-11-10' },
    });
  });

  it('solo cuenta los registros de la base pedida', () => {
    const history = [p(1, 900, '2026-11-03', { priceBasis: 'kg' }), p(2, 300, '2026-11-10', { priceBasis: 'unit' })];
    expect(summarizeHistory(history, 'kg')).toMatchObject({ status: 'insufficient-data', pointCount: 1 });
    expect(summarizeHistory(history, 'unit')).toMatchObject({
      status: 'insufficient-data',
      pointCount: 1,
      latest: { price: 300, recordedDate: '2026-11-10' },
    });
  });

  it('si todos los registros son de la otra base, no hay datos', () => {
    expect(summarizeHistory([p(1, 300, '2026-11-10', { priceBasis: 'unit' })], 'kg')).toEqual({
      status: 'insufficient-data',
      pointCount: 0,
      latest: null,
    });
  });
});

describe('con 2 o más registros (REQ-08.4)', () => {
  const history = [p(1, 800, '2026-11-03'), p(2, 900, '2026-11-10'), p(3, 1000, '2026-11-17')];

  it('entrega los puntos de más antiguo a más reciente, los pasos y la variación total', () => {
    const summary = summarizeHistory(history, 'kg');
    expect(summary.status).toBe('ok');
    if (summary.status !== 'ok') return;
    expect(summary.points.map((x) => x.price)).toEqual([800, 900, 1000]);
    expect(summary.steps).toEqual([
      { amount: 100, percent: 12.5, direction: 'up' },
      { amount: 100, percent: (100 / 900) * 100, direction: 'up' },
    ]);
    expect(summary.overall).toEqual({ amount: 200, percent: 25, direction: 'up' });
    expect(summary.latest).toEqual({ price: 1000, recordedDate: '2026-11-17' });
  });

  it('tiene n - 1 pasos entre registros consecutivos', () => {
    const summary = summarizeHistory(history, 'kg');
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.steps).toHaveLength(history.length - 1);
  });

  it('la suma de los pasos en pesos es igual a la variación total', () => {
    const mixed = [p(1, 800, '2026-11-03'), p(2, 1100, '2026-11-10'), p(3, 700, '2026-11-17'), p(4, 950, '2026-11-24')];
    const summary = summarizeHistory(mixed, 'kg');
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.steps.reduce((sum, step) => sum + step.amount, 0)).toBe(summary.overall.amount);
  });

  it('con dos registros iguales: variación "same"', () => {
    const summary = summarizeHistory([p(1, 900, '2026-11-03'), p(2, 900, '2026-11-10')], 'kg');
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.overall).toEqual({ amount: 0, percent: 0, direction: 'same' });
  });

  it('detecta una baja', () => {
    const summary = summarizeHistory([p(1, 1000, '2026-11-03'), p(2, 800, '2026-11-10')], 'kg');
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.overall).toEqual({ amount: -200, percent: -20, direction: 'down' });
  });
});

describe('orden y base', () => {
  it('ordena por fecha, instante e id aunque la entrada venga desordenada', () => {
    const shuffled = [
      p(3, 1000, '2026-11-17'),
      p(2, 950, '2026-11-10', { recordedAt: '2026-11-10T20:00:00.000Z' }),
      p(1, 800, '2026-11-03'),
      p(4, 900, '2026-11-10', { recordedAt: '2026-11-10T09:00:00.000Z' }),
    ];
    const summary = summarizeHistory(shuffled, 'kg');
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.points.map((x) => x.id)).toEqual([1, 4, 2, 3]);
  });

  it('con la misma fecha y el mismo instante, desempata por id', () => {
    const same = { recordedAt: '2026-11-10T12:00:00.000Z' };
    const summary = summarizeHistory(
      [p(9, 950, '2026-11-10', same), p(3, 900, '2026-11-10', same), p(5, 920, '2026-11-10', same)],
      'kg',
    );
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.points.map((x) => x.id)).toEqual([3, 5, 9]);
    expect(summary.latest.price).toBe(950);
  });

  it('da el mismo resultado con el historial en cualquier orden', () => {
    const history = [p(1, 800, '2026-11-03'), p(2, 900, '2026-11-10'), p(3, 1000, '2026-11-17')];
    expect(summarizeHistory([...history].reverse(), 'kg')).toEqual(summarizeHistory(history, 'kg'));
  });

  it('un historial mixto se resume solo para la base pedida', () => {
    const history = [
      p(1, 800, '2026-11-03', { priceBasis: 'kg' }),
      p(2, 300, '2026-11-04', { priceBasis: 'unit' }),
      p(3, 1000, '2026-11-10', { priceBasis: 'kg' }),
      p(4, 350, '2026-11-11', { priceBasis: 'unit' }),
    ];
    const kg = summarizeHistory(history, 'kg');
    const unit = summarizeHistory(history, 'unit');
    if (kg.status !== 'ok' || unit.status !== 'ok') throw new Error('se esperaba status ok');
    expect(kg.points.map((x) => x.price)).toEqual([800, 1000]);
    expect(unit.points.map((x) => x.price)).toEqual([300, 350]);
    expect(kg.overall.amount).toBe(200);
    expect(unit.overall.amount).toBe(50);
  });

  it('no modifica ni reordena el arreglo recibido', () => {
    const history = Object.freeze([p(2, 900, '2026-11-10'), p(1, 800, '2026-11-03')]);
    const before = JSON.stringify(history);
    expect(() => summarizeHistory(history, 'kg')).not.toThrow();
    expect(JSON.stringify(history)).toBe(before);
  });

  it('los puntos devueltos son una copia, no el mismo arreglo', () => {
    const history = [p(1, 800, '2026-11-03'), p(2, 900, '2026-11-10')];
    const summary = summarizeHistory(history, 'kg');
    if (summary.status !== 'ok') throw new Error('se esperaba status ok');
    expect(summary.points).not.toBe(history);
  });
});

describe('entradas inválidas (fallar fuerte)', () => {
  it('rechaza un historial con un precio inválido, también si es de la otra base', () => {
    expect(() => summarizeHistory([p(1, 0, '2026-11-03', { priceBasis: 'unit' }), p(2, 900, '2026-11-10')], 'kg')).toThrow(RangeError);
  });

  it.each([
    ['una base de precio fuera de las permitidas', { priceBasis: 'lb' as never }],
    ['etiquetas de sitio que no son una lista', { siteTagIds: null as never }],
    ['un id que no es un entero', { id: Number.NaN }],
    ['una fecha mal formada', { recordedDate: '10-11-2026' }],
    ['una fecha vacía', { recordedDate: '' }],
    ['un instante de registro que no es texto', { recordedAt: 12345 as never }],
  ])('rechaza un registro con %s, en vez de ignorarlo o fallar con otro error', (_name, bad) => {
    expect(() => summarizeHistory([p(1, 900, '2026-11-03'), { ...p(2, 900, '2026-11-10'), ...bad }], 'kg')).toThrow(
      RangeError,
    );
  });

  it('rechaza una base desconocida', () => {
    expect(() => summarizeHistory([], 'litro' as never)).toThrow(RangeError);
  });
});
