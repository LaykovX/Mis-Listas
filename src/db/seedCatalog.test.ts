import fs from 'fs';
import path from 'path';

import { asc } from 'drizzle-orm';

import { DbValidationError } from './errors';
import { normalizeName } from './normalize';
import { createCatalogItem, findCatalogItemByName, getCatalogItem, updateReferencePrice } from './repositories';
import * as schema from './schema';
import { ALL_SEED_ITEMS, type SeedItem } from './seedData';
import { ensureCatalogSeed } from './seedCatalog';
import { createTestDb, type TestDb } from './testing/createTestDb';

let t: TestDb;

beforeEach(async () => {
  t = await createTestDb();
});

afterEach(() => {
  t.close();
});

const allRows = () => t.db.select().from(schema.catalogItems).orderBy(asc(schema.catalogItems.id)).all();
const count = () => allRows().length;

const makeItem = (n: number): SeedItem => ({
  name: `Producto ${String.fromCharCode(65 + (n % 26))}${n}`,
  defaultUnit: 'unit',
  referencePrice: 100 + n,
  category: 'supermercado',
  seasons: [],
  priceSource: 'estimado',
});

describe('ensureCatalogSeed en una base vacía (REQ-04.1)', () => {
  it('inserta exactamente todos los ítems iniciales y devuelve cuántos insertó', () => {
    const inserted = ensureCatalogSeed(t.db);
    expect(inserted).toBe(ALL_SEED_ITEMS.length);
    expect(count()).toBe(ALL_SEED_ITEMS.length);
  });

  it('guarda cada ítem con su nombre, unidad y precio, y como ítem inicial (no del usuario)', () => {
    ensureCatalogSeed(t.db);
    for (const seed of ALL_SEED_ITEMS) {
      const row = findCatalogItemByName(t.db, seed.name);
      expect(row).not.toBeNull();
      expect(row).toMatchObject({
        name: seed.name,
        normalizedName: normalizeName(seed.name),
        defaultUnit: seed.defaultUnit,
        referencePrice: seed.referencePrice,
        isUserAdded: false,
      });
    }
  });

  it('no guarda los campos que solo sirven para la investigación (categoría, estaciones, fuente, sinónimos)', () => {
    ensureCatalogSeed(t.db);
    expect(Object.keys(allRows()[0]).sort()).toEqual(
      ['createdAt', 'defaultUnit', 'id', 'isUserAdded', 'name', 'normalizedName', 'referencePrice', 'updatedAt'].sort(),
    );
  });

  it('usa el reloj recibido para las fechas de creación y actualización', () => {
    ensureCatalogSeed(t.db, [makeItem(1)], () => new Date('2026-11-10T15:00:00.000Z'));
    expect(allRows()[0]).toMatchObject({ createdAt: '2026-11-10T15:00:00.000Z', updatedAt: '2026-11-10T15:00:00.000Z' });
  });

  it('con una lista vacía no hace nada', () => {
    expect(ensureCatalogSeed(t.db, [])).toBe(0);
    expect(count()).toBe(0);
  });

  it('inserta listas grandes (cientos de ítems) sin pasar el límite de parámetros de SQLite', () => {
    const many = Array.from({ length: 1000 }, (_, n) => makeItem(n));
    expect(ensureCatalogSeed(t.db, many)).toBe(1000);
    expect(count()).toBe(1000);
  });

  it('la carga completa tarda menos de 1 segundo', () => {
    const started = Date.now();
    ensureCatalogSeed(t.db);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('es idempotente y no pisa lo del usuario', () => {
  it('ejecutarla de nuevo inserta 0 y no cambia ninguna fila', () => {
    ensureCatalogSeed(t.db);
    const before = JSON.stringify(allRows());
    expect(ensureCatalogSeed(t.db)).toBe(0);
    expect(ensureCatalogSeed(t.db)).toBe(0);
    expect(JSON.stringify(allRows())).toBe(before);
  });

  it('conserva el precio de referencia que el usuario cambió (REQ-05.3)', () => {
    ensureCatalogSeed(t.db);
    const tomate = findCatalogItemByName(t.db, 'Tomate')!;
    updateReferencePrice(t.db, tomate.id, 2222);
    ensureCatalogSeed(t.db);
    expect(getCatalogItem(t.db, tomate.id).referencePrice).toBe(2222);
  });

  it('conserva un ítem propio con el mismo nombre normalizado y no inserta el inicial', () => {
    createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'unit', referencePrice: 333 });
    const inserted = ensureCatalogSeed(t.db);
    expect(inserted).toBe(ALL_SEED_ITEMS.length - 1);
    const tomate = findCatalogItemByName(t.db, 'Tomate')!;
    expect(tomate).toMatchObject({ name: 'tomate', isUserAdded: true, referencePrice: 333, defaultUnit: 'unit' });
  });

  it('si falta un ítem inicial, lo repone sin tocar los demás', () => {
    ensureCatalogSeed(t.db);
    const limon = findCatalogItemByName(t.db, 'Limón')!;
    t.sqlite.run(`DELETE FROM catalog_items WHERE id = ${limon.id}`);
    expect(count()).toBe(ALL_SEED_ITEMS.length - 1);
    expect(ensureCatalogSeed(t.db)).toBe(1);
    expect(count()).toBe(ALL_SEED_ITEMS.length);
    expect(findCatalogItemByName(t.db, 'Limón')).not.toBeNull();
  });

  it('los ítems del usuario no se cuentan como iniciales', () => {
    ensureCatalogSeed(t.db);
    createCatalogItem(t.db, { name: 'Ítem propio', defaultUnit: 'kg', referencePrice: 500 });
    ensureCatalogSeed(t.db);
    expect(allRows().filter((r) => r.isUserAdded)).toHaveLength(1);
  });
});

describe('es atómica y valida los datos', () => {
  it('si un ítem falla al insertarse, no queda ninguna fila a medias', () => {
    t.sqlite.run(
      `CREATE TRIGGER fail_one_item BEFORE INSERT ON catalog_items WHEN NEW.name = 'Zapallo' BEGIN SELECT RAISE(ABORT, 'fallo forzado'); END`,
    );
    expect(() => ensureCatalogSeed(t.db)).toThrow(/fallo forzado/);
    expect(count()).toBe(0);
  });

  it('si falla en un bloque posterior, también se deshacen los bloques anteriores', () => {
    t.sqlite.run(
      `CREATE TRIGGER fail_late_item BEFORE INSERT ON catalog_items WHEN NEW.name = 'Producto Z999' BEGIN SELECT RAISE(ABORT, 'fallo tardío'); END`,
    );
    const many = Array.from({ length: 1000 }, (_, n) => makeItem(n)).map((item, n) => (n === 999 ? { ...item, name: 'Producto Z999' } : item));
    expect(() => ensureCatalogSeed(t.db, many)).toThrow(/fallo tardío/);
    expect(count()).toBe(0);
  });

  it.each([
    ['un precio inválido', { referencePrice: 0 }],
    ['un precio con decimales', { referencePrice: 99.5 }],
    ['una unidad que no existe', { defaultUnit: 'litro' as never }],
    ['un nombre vacío', { name: '   ' }],
    ['un nombre que queda vacío al normalizarlo', { name: '́' }],
  ])('rechaza un ítem con %s y no inserta nada', (_name, bad) => {
    const items = [makeItem(1), { ...makeItem(2), ...bad }, makeItem(3)];
    expect(() => ensureCatalogSeed(t.db, items)).toThrow(DbValidationError);
    expect(count()).toBe(0);
  });

  it('rechaza una lista con dos ítems de igual nombre normalizado (datos mal armados)', () => {
    const items = [makeItem(1), { ...makeItem(1), name: makeItem(1).name.toUpperCase() }];
    expect(() => ensureCatalogSeed(t.db, items)).toThrow(DbValidationError);
    expect(count()).toBe(0);
  });

  it('no modifica la lista recibida', () => {
    const items = Object.freeze([Object.freeze(makeItem(1)), Object.freeze(makeItem(2))]);
    const before = JSON.stringify(items);
    expect(() => ensureCatalogSeed(t.db, items)).not.toThrow();
    expect(JSON.stringify(items)).toBe(before);
  });
});

describe('sin red ni archivos externos (REQ-10.1)', () => {
  // El código fuente de la carga y de los datos no debe poder tocar la red ni el disco: se revisa
  // lo que importa y usa, porque una prueba de ejecución no puede demostrar que algo no existe.
  const FORBIDDEN =
    /\b(fetch|XMLHttpRequest|WebSocket|readFile|readFileSync|writeFile)\b|\brequire\(|from '(fs|path|node:fs|expo-file-system|expo-asset|axios|http|https)'/;

  it('seedCatalog.ts y los archivos de datos no usan red ni lectura de archivos', () => {
    const dir = path.join(__dirname, 'seedData');
    const files = [
      path.join(__dirname, 'seedCatalog.ts'),
      ...fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')).map((f) => path.join(dir, f)),
    ];
    expect(files.length).toBeGreaterThanOrEqual(6);
    const offenders = files.filter((file) => FORBIDDEN.test(fs.readFileSync(file, 'utf8'))).map((f) => path.basename(f));
    expect(offenders).toEqual([]);
  });

  it('la prueba detecta de verdad un uso de red o de archivos', () => {
    expect(FORBIDDEN.test("const r = await fetch('https://x');")).toBe(true);
    expect(FORBIDDEN.test("import fs from 'fs';")).toBe(true);
    expect(FORBIDDEN.test("import { eq } from 'drizzle-orm';")).toBe(false);
  });
});
