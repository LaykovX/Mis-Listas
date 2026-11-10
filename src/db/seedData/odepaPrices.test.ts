import { priceBasisOf } from '../constants';

import type { SeedItem } from './catalogSeedTypes';
import { FERIA_ITEMS } from './feriaItems';
import { ODEPA_ENTRIES, ODEPA_MONTH, applyOdepaPrices } from './odepaPrices';
import { ALL_SEED_ITEMS } from './index';
import { SUPERMERCADO_ITEMS } from './supermercadoItems';

const BASE: readonly SeedItem[] = [...FERIA_ITEMS, ...SUPERMERCADO_ITEMS];
const byName = (items: readonly SeedItem[], name: string) => items.find((i) => i.name === name);

describe('tabla de ODEPA (Región Metropolitana, semana del 2 al 6 de noviembre de 2026)', () => {
  it('el mes de la referencia es noviembre de 2026', () => {
    expect(ODEPA_MONTH).toBe('2026-11');
  });

  it('cada entrada apunta a un ítem que existe, una sola vez', () => {
    const missing = ODEPA_ENTRIES.filter((e) => BASE.filter((i) => i.name === e.item).length !== 1).map((e) => e.item);
    expect(missing).toEqual([]);
  });

  it('ningún ítem tiene dos entradas', () => {
    const names = ODEPA_ENTRIES.map((e) => e.item);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('cada entrada tiene filas con precios enteros positivos', () => {
    const bad = ODEPA_ENTRIES.filter((e) => e.rows.length === 0 || e.rows.some(([, , price]) => !Number.isInteger(price) || price < 1));
    expect(bad.map((e) => e.item)).toEqual([]);
  });

  it('el canal de cada entrada corresponde a su categoría: la feria usa el precio de feria y el supermercado el de supermercado', () => {
    const wrong = ODEPA_ENTRIES.filter((e) => {
      const item = byName(BASE, e.item)!;
      return item.category === 'supermercado' ? e.channel !== 'supermercado' : e.channel !== 'feria';
    });
    expect(wrong.map((e) => e.item)).toEqual([]);
  });

  it('la unidad del precio publicado calza con la unidad del ítem (por kilo o por unidad)', () => {
    const wrong = ODEPA_ENTRIES.filter((e) => {
      const basis = priceBasisOf(byName(BASE, e.item)!.defaultUnit);
      const printed = e.rows[0][1];
      if (printed === 'kg') {
        // Por kilo en un ítem por kilo: sin conversión. En un ítem por envase (arroz, harina, miel): con divisor explícito.
        return basis === 'kg' ? e.divisor !== undefined : e.divisor === undefined;
      }
      // Por unidad, docena, litro, bolsa, pote o envase: el ítem es por unidad.
      return basis !== 'unit';
    });
    expect(wrong.map((e) => e.item)).toEqual([]);
  });

  it('todas las filas de una entrada se publican en la misma unidad', () => {
    const mixed = ODEPA_ENTRIES.filter((e) => new Set(e.rows.map(([, unit]) => unit)).size > 1);
    expect(mixed.map((e) => e.item)).toEqual([]);
  });
});

describe('applyOdepaPrices', () => {
  const result = applyOdepaPrices(BASE);

  it('devuelve los mismos ítems, en el mismo orden, sin perder ni agregar ninguno', () => {
    expect(result.map((i) => i.name)).toEqual(BASE.map((i) => i.name));
  });

  it('calcula el precio como el promedio de las filas publicadas, redondeado a pesos', () => {
    const price = (name: string) => byName(result, name)!.referencePrice;
    expect(price('Limón')).toBe(697); // (657 + 736) / 2 = 696,5
    expect(price('Manzana')).toBe(1560); // (1.577 + 1.543) / 2
    expect(price('Pimentón')).toBe(1221); // (1.094 + 1.385 + 1.183) / 3
    expect(price('Papa')).toBe(1228); // (1.226 + 1.229) / 2 = 1.227,5
    expect(price('Chuleta de cerdo')).toBe(5629); // (5.637 + 5.620) / 2 = 5.628,5
    expect(price('Arándano')).toBe(7167);
  });

  it('convierte la unidad publicada a la del ítem: huevos de docena a unidad y miel de kilo a frasco de medio kilo', () => {
    const price = (name: string) => byName(result, name)!.referencePrice;
    expect(price('Huevos')).toBe(206); // 2.470 por docena / 12
    expect(price('Miel')).toBe(5106); // 10.212 por kilo / 2
  });

  it('marca los ítems con precio de ODEPA con su fuente y el mes de la referencia', () => {
    const feria = byName(result, 'Limón')!;
    expect(feria.priceSource).toBe('odepa-feria');
    expect(feria.priceMonth).toBe('2026-11');
    const super1 = byName(result, 'Pollo entero')!;
    expect(super1.priceSource).toBe('odepa-supermercado');
    expect(super1.priceMonth).toBe('2026-11');
  });

  it('ninguna nota dice que el canal es desconocido: ODEPA siempre indica la columna de cada precio', () => {
    for (const item of result) {
      expect(item.note ?? '').not.toMatch(/un solo valor|canal no indicado/i);
    }
  });

  it('las filas con un solo precio usan la columna en que ODEPA las publica: feria para arveja, haba, choclo y cereza; supermercado para lácteos y abarrotes', () => {
    const channelOf = (name: string) => ODEPA_ENTRIES.find((e) => e.item === name)?.channel;
    for (const name of ['Arveja', 'Haba', 'Choclo', 'Cereza']) expect(channelOf(name)).toBe('feria');
    for (const name of ['Leche', 'Leche en polvo', 'Margarina', 'Queso', 'Yogur', 'Arroz', 'Harina', 'Miel', 'Fideos']) {
      expect(channelOf(name)).toBe('supermercado');
    }
  });

  it('Frutilla queda sin fuente: el precio de ODEPA (1.332) es incoherente con el de supermercado (8.150) y otras regiones', () => {
    expect(ODEPA_ENTRIES.some((e) => e.item === 'Frutilla')).toBe(false);
    const frutilla = byName(result, 'Frutilla')!;
    expect(frutilla.priceSource).toBe('estimado');
    expect(frutilla.referencePrice).toBeGreaterThanOrEqual(2000);
  });

  it('Sandía queda sin fuente: 3.125 por unidad con 1.767 por kilo implica una sandía de menos de 2 kg, poco creíble', () => {
    expect(ODEPA_ENTRIES.some((e) => e.item === 'Sandía')).toBe(false);
    const sandia = byName(result, 'Sandía')!;
    expect(sandia.priceSource).toBe('estimado');
    expect(sandia.referencePrice).toBeGreaterThanOrEqual(4000);
  });

  it('todas las entradas usan un canal válido: feria o supermercado', () => {
    expect(ODEPA_ENTRIES.filter((e) => e.channel !== 'feria' && e.channel !== 'supermercado').map((e) => e.item)).toEqual([]);
  });

  it('deja intactos, como estimados, los ítems sin precio publicado', () => {
    const withEntry = new Set(ODEPA_ENTRIES.map((e) => e.item));
    for (const item of result.filter((i) => !withEntry.has(i.name))) {
      expect(item).toEqual(byName(BASE, item.name));
      expect(item.priceSource).toBe('estimado');
    }
  });

  it('no modifica la lista original', () => {
    const before = JSON.stringify(BASE);
    applyOdepaPrices(BASE);
    expect(JSON.stringify(BASE)).toBe(before);
  });

  it('conserva la nota que ya tenía el ítem', () => {
    const palta = byName(result, 'Palta')!;
    expect(palta.note).toContain('Hass');
  });

  it('un precio con fuente no se aleja de la estimación original más de 3 veces (detecta errores de transcripción)', () => {
    const far = result
      .filter((i) => i.priceSource !== 'estimado')
      .filter((i) => {
        const ratio = i.referencePrice / byName(BASE, i.name)!.referencePrice;
        return ratio < 1 / 3 || ratio > 3;
      })
      .map((i) => i.name);
    expect(far).toEqual([]);
  });
});

describe('cobertura de precios con fuente (REQ-04.1, REQ-07.2 c)', () => {
  const feria = ALL_SEED_ITEMS.filter((i) => i.category !== 'supermercado');
  const supermercado = ALL_SEED_ITEMS.filter((i) => i.category === 'supermercado');
  const sourced = (items: readonly SeedItem[]) => items.filter((i) => i.priceSource !== 'estimado').length / items.length;

  it('al menos el 30% de los ítems de supermercado tiene precio con fuente', () => {
    expect(sourced(supermercado)).toBeGreaterThanOrEqual(0.3);
  });

  it('los ítems de feria con fuente son una parte significativa (al menos el 35%)', () => {
    expect(sourced(feria)).toBeGreaterThanOrEqual(0.35);
  });

  it('el resultado final usa los precios con fuente', () => {
    expect(byName(ALL_SEED_ITEMS, 'Limón')!.referencePrice).toBe(697);
    expect(byName(ALL_SEED_ITEMS, 'Limón')!.priceSource).toBe('odepa-feria');
  });

  it('los conteos de fuentes son exactamente los que se informan al usuario (si cambian los datos, hay que actualizar el reporte)', () => {
    // Honestidad: la MAYORÍA de los precios es estimada. ODEPA solo publica 34 de los 95 ítems de feria
    // y 21 de los 70 de supermercado; no se encontró otra fuente comparable y reciente para el resto.
    const count = (items: readonly SeedItem[]) => ({
      total: items.length,
      conFuente: items.filter((i) => i.priceSource !== 'estimado').length,
    });
    expect({ feria: count(feria), supermercado: count(supermercado) }).toEqual({
      feria: { total: 95, conFuente: 34 },
      supermercado: { total: 70, conFuente: 21 },
    });
    expect(ALL_SEED_ITEMS.filter((i) => i.priceSource === 'estimado')).toHaveLength(110);
  });
});
