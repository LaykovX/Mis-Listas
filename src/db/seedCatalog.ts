import { count } from 'drizzle-orm';

import { systemClock, toTimestamp, type Clock } from './clock';
import { DbValidationError } from './errors';
import { normalizeName } from './normalize';
import { validateName, validatePrice, validateUnit } from './repositories/validation';
import { catalogItems } from './schema';
import { ALL_SEED_ITEMS, type SeedItem } from './seedData';
import type { Db } from './types';

/** Filas por sentencia: 100 × 7 columnas = 700 parámetros, bajo el límite de 999 de SQLite. */
const CHUNK_SIZE = 100;

function countCatalogItems(db: Db): number {
  return db.select({ value: count() }).from(catalogItems).get()?.value ?? 0;
}

/**
 * Carga en la base los ítems iniciales de feria y supermercado que falten (REQ-04.1). Es seguro
 * ejecutarla en cada arranque:
 *  - solo inserta los ítems cuyo nombre normalizado todavía no existe;
 *  - nunca modifica una fila existente: si el usuario cambió un precio de referencia o creó un
 *    ítem propio con el mismo nombre, se conserva (REQ-05.3);
 *  - todo ocurre en una transacción: si algo falla no queda nada a medias.
 * OJO con borrar o renombrar ítems iniciales en el futuro: como se repone por nombre en cada
 * arranque, un ítem inicial borrado volvería a aparecer y uno renombrado se duplicaría. Si se
 * agrega esa función, hay que registrar qué ítems iniciales ya se cargaron (por ejemplo, con una
 * versión de los datos) en vez de reponerlos siempre.
 *
 * Valida cada ítem antes de insertar y rechaza una lista con nombres repetidos. Solo se
 * guardan nombre, unidad y precio; la categoría, las estaciones, la fuente y los sinónimos
 * viven en el código. Devuelve cuántos ítems insertó.
 */
export function ensureCatalogSeed(
  db: Db,
  items: readonly SeedItem[] = ALL_SEED_ITEMS,
  clock: Clock = systemClock,
): number {
  const timestamp = toTimestamp(clock());
  const seen = new Set<string>();

  const rows = items.map((item) => {
    const name = validateName(item.name);
    const normalizedName = normalizeName(name);
    if (normalizedName.length === 0) throw new DbValidationError('INVALID_NAME');
    if (seen.has(normalizedName)) throw new DbValidationError('DUPLICATE_ITEM', `Ítem inicial repetido: ${name}`);
    seen.add(normalizedName);

    return {
      name,
      normalizedName,
      defaultUnit: validateUnit(item.defaultUnit),
      referencePrice: validatePrice(item.referencePrice),
      isUserAdded: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
  if (rows.length === 0) return 0;

  return db.transaction((tx) => {
    const before = countCatalogItems(tx);
    for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
      tx.insert(catalogItems)
        .values(rows.slice(start, start + CHUNK_SIZE))
        .onConflictDoNothing()
        .run();
    }
    return countCatalogItems(tx) - before;
  });
}
