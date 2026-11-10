import type { Clock } from '../clock';
import { DbValidationError, type DbErrorCode } from '../errors';
import { listParentTags } from '../repositories/tags';
import { ensureDefaultTags } from '../seed';
import type { Tag } from '../types';
import { createTestDb, type TestDb } from './createTestDb';

/** Reloj fijo. Recibe una fecha y hora local, por ejemplo '2026-11-10T15:30:00'. */
export function fixedClock(localDateTime: string): Clock {
  return () => new Date(localDateTime);
}

/** Comprueba que la función lance un DbValidationError con el código indicado. */
export function expectCode(fn: () => unknown, code: DbErrorCode): void {
  let thrown: unknown;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(DbValidationError);
  expect((thrown as DbValidationError).code).toBe(code);
}

export interface SeededDb extends TestDb {
  feria: Tag;
  supermercado: Tag;
}

/** Base de pruebas con las etiquetas madre ya creadas. */
export async function createSeededDb(): Promise<SeededDb> {
  const t = await createTestDb();
  ensureDefaultTags(t.db);
  const parents = listParentTags(t.db);
  const feria = parents.find((tag) => tag.slug === 'feria');
  const supermercado = parents.find((tag) => tag.slug === 'supermercado');
  if (!feria || !supermercado) throw new Error('Faltan las etiquetas madre en la base de pruebas');
  return { ...t, feria, supermercado };
}
