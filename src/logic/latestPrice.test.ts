import { comparePricePoints, latestOf } from './latestPrice';
import { makePricePoint } from './testing/pricePointBuilder';

describe('latestOf', () => {
  it('devuelve null si no hay registros', () => {
    expect(latestOf([])).toBeNull();
  });

  it('devuelve el único registro si hay uno', () => {
    const only = makePricePoint({ id: 1 });
    expect(latestOf([only])).toBe(only);
  });

  it('elige el de fecha más reciente', () => {
    const old = makePricePoint({ id: 1, recordedDate: '2026-11-03', price: 800 });
    const recent = makePricePoint({ id: 2, recordedDate: '2026-11-17', price: 1000 });
    const middle = makePricePoint({ id: 3, recordedDate: '2026-11-10', price: 900 });
    expect(latestOf([old, recent, middle])?.id).toBe(2);
  });

  it('con la misma fecha, gana el instante de registro más reciente', () => {
    const morning = makePricePoint({ id: 5, recordedDate: '2026-11-10', recordedAt: '2026-11-10T09:00:00.000Z' });
    const evening = makePricePoint({ id: 1, recordedDate: '2026-11-10', recordedAt: '2026-11-10T20:00:00.000Z' });
    expect(latestOf([morning, evening])?.id).toBe(1);
  });

  it('con la misma fecha e instante, gana el id mayor', () => {
    const a = makePricePoint({ id: 7 });
    const b = makePricePoint({ id: 9 });
    expect(latestOf([a, b])?.id).toBe(9);
    expect(latestOf([b, a])?.id).toBe(9);
  });

  it('da el mismo resultado sin importar el orden de la lista', () => {
    const points = [
      makePricePoint({ id: 1, recordedDate: '2026-11-03' }),
      makePricePoint({ id: 2, recordedDate: '2026-11-17' }),
      makePricePoint({ id: 3, recordedDate: '2026-11-10' }),
    ];
    expect(latestOf([...points].reverse())?.id).toBe(latestOf(points)?.id);
  });

  it('no modifica ni reordena el arreglo recibido', () => {
    const points = Object.freeze([
      makePricePoint({ id: 1, recordedDate: '2026-11-17' }),
      makePricePoint({ id: 2, recordedDate: '2026-11-03' }),
    ]);
    expect(() => latestOf(points)).not.toThrow();
    expect(points.map((p) => p.id)).toEqual([1, 2]);
  });
});

describe('comparePricePoints', () => {
  it('ordena de más antiguo a más reciente por fecha, instante e id', () => {
    const points = [
      makePricePoint({ id: 4, recordedDate: '2026-11-10', recordedAt: '2026-11-10T20:00:00.000Z' }),
      makePricePoint({ id: 2, recordedDate: '2026-11-03' }),
      makePricePoint({ id: 3, recordedDate: '2026-11-10', recordedAt: '2026-11-10T09:00:00.000Z' }),
      makePricePoint({ id: 1, recordedDate: '2026-11-10', recordedAt: '2026-11-10T09:00:00.000Z' }),
    ];
    expect([...points].sort(comparePricePoints).map((p) => p.id)).toEqual([2, 1, 3, 4]);
  });

  it('devuelve 0 solo para el mismo registro', () => {
    const a = makePricePoint({ id: 1 });
    expect(comparePricePoints(a, a)).toBe(0);
    expect(comparePricePoints(a, makePricePoint({ id: 2 }))).toBeLessThan(0);
  });
});
