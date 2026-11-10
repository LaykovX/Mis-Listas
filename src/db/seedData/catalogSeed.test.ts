import { UNITS, priceBasisOf } from '../constants';
import { normalizeName } from '../normalize';
import { validateName, validatePrice } from '../repositories/validation';

import { SEASONS, type SeedItem } from './catalogSeedTypes';
import { ALL_SEED_ITEMS } from './index';

/**
 * Reglas de calidad de los datos iniciales. Son las que debe cumplir cualquier lista de
 * ítems: si alguien agrega o cambia datos, estas pruebas dicen qué corregir.
 */

const items: readonly SeedItem[] = ALL_SEED_ITEMS;

/** Marcas conocidas que no deben aparecer en nombres genéricos. */
const BRANDS = [
  'lucchetti', 'carozzi', 'soprole', 'colun', 'nestle', 'coca-cola', 'coca cola', 'pepsi', 'fanta',
  'sprite', 'costa', 'mckay', 'tucapel', 'belmont', 'cachantun', 'watts', 'iansa', 'lider', 'jumbo',
  'unimarc', 'tottus', 'santa isabel', 'nescafe', 'milo', 'maggi', 'knorr', 'ariel', 'omo', 'skip',
  'downy', 'clorox', 'virginia', 'elite', 'noble', 'ideal', 'bimbo', 'pf', 'sureña', 'surena',
  'san jorge', 'agrosuper', 'ariztia', 'loncoleche', 'calo', 'chef', 'maruchan', 'evercrisp',
];

const SIZE_IN_NAME = /\b\d+([.,]\d+)?\s?(g|gr|kg|ml|cc|l|lt|lts|unidades|un)\b/i;

const PRICE_RANGE = { kg: { min: 200, max: 30_000 }, unit: { min: 100, max: 50_000 } } as const;

const isFeria = (item: SeedItem) => item.category !== 'supermercado';

/** Devuelve los nombres de los ítems que no cumplen la condición, para mensajes de error claros. */
function offenders(predicate: (item: SeedItem) => boolean): string[] {
  return items.filter((item) => !predicate(item)).map((item) => item.name);
}

describe('cobertura mínima de la base inicial (REQ-04.1)', () => {
  it('tiene al menos 150 ítems en total', () => {
    expect(items.length).toBeGreaterThanOrEqual(150);
  });

  it('tiene al menos 90 ítems de feria: 30 frutas, 40 verduras y 10 otros', () => {
    expect(items.filter(isFeria).length).toBeGreaterThanOrEqual(90);
    expect(items.filter((i) => i.category === 'fruta').length).toBeGreaterThanOrEqual(30);
    expect(items.filter((i) => i.category === 'verdura').length).toBeGreaterThanOrEqual(40);
    expect(items.filter((i) => i.category === 'otro-feria').length).toBeGreaterThanOrEqual(10);
  });

  it('tiene al menos 60 ítems de supermercado', () => {
    expect(items.filter((i) => i.category === 'supermercado').length).toBeGreaterThanOrEqual(60);
  });

  it.each(SEASONS)('la estación %s tiene al menos 25 ítems de feria de temporada', (season) => {
    expect(items.filter((i) => isFeria(i) && i.seasons.includes(season)).length).toBeGreaterThanOrEqual(25);
  });

  it('los ítems de supermercado no tienen estaciones', () => {
    expect(items.filter((i) => i.category === 'supermercado' && i.seasons.length > 0).map((i) => i.name)).toEqual([]);
  });
});

describe('nombres y sinónimos', () => {
  it('ningún nombre se repite después de normalizarlo (sin tildes ni mayúsculas)', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const item of items) {
      const key = normalizeName(item.name);
      if (seen.has(key)) duplicates.push(`${item.name} = ${seen.get(key)}`);
      seen.set(key, item.name);
    }
    expect(duplicates).toEqual([]);
  });

  it('ningún sinónimo coincide con el nombre de otro ítem ni con otro sinónimo', () => {
    const names = new Set(items.map((i) => normalizeName(i.name)));
    const seenAliases = new Map<string, string>();
    const problems: string[] = [];
    for (const item of items) {
      for (const alias of item.aliases ?? []) {
        const key = normalizeName(alias);
        if (key === normalizeName(item.name)) problems.push(`${item.name}: el sinónimo "${alias}" es el mismo nombre`);
        else if (names.has(key)) problems.push(`${item.name}: el sinónimo "${alias}" ya es el nombre de otro ítem`);
        if (seenAliases.has(key) && seenAliases.get(key) !== item.name) {
          problems.push(`${item.name}: el sinónimo "${alias}" también lo usa ${seenAliases.get(key)}`);
        }
        seenAliases.set(key, item.name);
      }
    }
    expect(problems).toEqual([]);
  });

  it('ningún sinónimo es ambiguo ni de uso ajeno al chileno (revisión del 10-nov-2026)', () => {
    // 'Pollo' sirve igual a la pechuga y a los trutros; 'Salchichas' en Chile no son las vienesas;
    // el resto son términos de España o México que no usa un comprador chileno.
    const banned = ['pollo', 'salchichas', 'morron', 'ejote', 'calabaza', 'judia verde', 'batata', 'cebolleta', 'melocoton', 'albaricoque', 'calabacin'];
    const found = items.flatMap((i) => (i.aliases ?? []).filter((a) => banned.includes(normalizeName(a))).map((a) => `${i.name}: ${a}`));
    expect(found).toEqual([]);
  });

  it('las especias que se compran en bolsa o pote (merkén, orégano) no van en cuartos de kilo', () => {
    const wrong = items.filter((i) => ['Merkén', 'Orégano'].includes(i.name) && i.defaultUnit !== 'unit').map((i) => i.name);
    expect(wrong).toEqual([]);
  });

  it('papa y cebolla se venden todo el año: no se marcan solo como de una estación', () => {
    expect(items.filter((i) => ['Papa', 'Cebolla'].includes(i.name) && i.seasons.length > 0).map((i) => i.name)).toEqual([]);
  });

  it('todo nombre es válido para la base (1 a 60 caracteres)', () => {
    expect(
      offenders((i) => {
        try {
          validateName(i.name);
          return true;
        } catch {
          return false;
        }
      }),
    ).toEqual([]);
  });

  it('todo nombre empieza con mayúscula y no tiene espacios en los bordes ni dobles', () => {
    expect(offenders((i) => /^[A-ZÁÉÍÓÚÑ]/.test(i.name) && i.name === i.name.trim() && !/\s{2}/.test(i.name))).toEqual([]);
  });

  it('ningún nombre ni sinónimo contiene una marca conocida', () => {
    const hasBrand = (text: string) => {
      const words = ` ${normalizeName(text).replace(/[^a-z0-9 -]/g, ' ')} `;
      return BRANDS.some((brand) => words.includes(` ${normalizeName(brand)} `));
    };
    expect(offenders((i) => !hasBrand(i.name) && !(i.aliases ?? []).some(hasBrand))).toEqual([]);
  });

  it('ningún nombre incluye un tamaño o una cantidad (eso va en la nota)', () => {
    expect(offenders((i) => !SIZE_IN_NAME.test(i.name))).toEqual([]);
  });
});

describe('unidades y precios', () => {
  it('toda unidad por defecto es una de las unidades de venta', () => {
    expect(offenders((i) => (UNITS as readonly string[]).includes(i.defaultUnit))).toEqual([]);
  });

  it('todo precio de referencia es un entero válido para la base de datos', () => {
    expect(
      offenders((i) => {
        try {
          validatePrice(i.referencePrice);
          return true;
        } catch {
          return false;
        }
      }),
    ).toEqual([]);
  });

  it('todo precio está dentro del rango de cordura según su base (por kilo o por unidad)', () => {
    expect(
      offenders((i) => {
        const range = PRICE_RANGE[priceBasisOf(i.defaultUnit)];
        return i.referencePrice >= range.min && i.referencePrice <= range.max;
      }),
    ).toEqual([]);
  });

  it('todo ítem con fuente de precio indica el mes de la referencia (AAAA-MM)', () => {
    expect(
      offenders((i) => i.priceSource === 'estimado' || /^\d{4}-(0[1-9]|1[0-2])$/.test(i.priceMonth ?? '')),
    ).toEqual([]);
  });
});
