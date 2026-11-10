import { toLocalDate, toTimestamp } from './clock';

describe('toLocalDate', () => {
  it('usa la fecha local del teléfono y no la fecha UTC', () => {
    // Fecha simulada: en el teléfono es 10 de noviembre, pero en UTC ya es el 11.
    // No depende de la zona horaria de la máquina que corre las pruebas.
    const fake = {
      getFullYear: () => 2026,
      getMonth: () => 10,
      getDate: () => 10,
      toISOString: () => '2026-11-11T02:30:00.000Z',
    } as unknown as Date;
    expect(toLocalDate(fake)).toBe('2026-11-10');
  });

  it('rellena mes y día con ceros', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});

describe('toTimestamp', () => {
  it('devuelve el instante en ISO 8601 (UTC)', () => {
    expect(toTimestamp(new Date('2026-11-10T15:30:00.000Z'))).toBe('2026-11-10T15:30:00.000Z');
  });
});
