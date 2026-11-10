import { asc, eq } from 'drizzle-orm';

import { systemClock, toTimestamp, type Clock } from '../clock';
import { DbValidationError } from '../errors';
import { normalizeName } from '../normalize';
import { tags } from '../schema';
import type { Db, Tag } from '../types';
import { validateColor, validateName } from './validation';

/** Las etiquetas madre incluidas en la app (Feria y Supermercado). */
export function listParentTags(db: Db): Tag[] {
  return db.select().from(tags).where(eq(tags.kind, 'parent')).orderBy(asc(tags.id)).all();
}

/** Las etiquetas de sitio del usuario, ordenadas por nombre sin distinguir mayúsculas ni tildes. */
export function listSiteTags(db: Db): Tag[] {
  const rows = db.select().from(tags).where(eq(tags.kind, 'site')).all();
  return rows.sort((a, b) => {
    const left = normalizeName(a.name ?? '');
    const right = normalizeName(b.name ?? '');
    return left < right ? -1 : left > right ? 1 : a.id - b.id;
  });
}

export function getTag(db: Db, id: number): Tag {
  const tag = db.select().from(tags).where(eq(tags.id, id)).get();
  if (!tag) throw new DbValidationError('NOT_FOUND');
  return tag;
}

/** Crea una etiqueta de sitio con nombre y color (REQ-02.3). */
export function createSiteTag(db: Db, input: { name: string; color: string }, clock: Clock = systemClock): Tag {
  const name = validateName(input.name);
  const color = validateColor(input.color);
  return db
    .insert(tags)
    .values({ kind: 'site', name, color, createdAt: toTimestamp(clock()) })
    .returning()
    .get();
}

/** Renombra o cambia el color de una etiqueta de sitio (REQ-02.5). Las madre no se tocan. */
export function updateSiteTag(db: Db, id: number, patch: { name?: string; color?: string }): Tag {
  const tag = getTag(db, id);
  if (tag.kind === 'parent') throw new DbValidationError('PROTECTED_TAG');

  const changes: { name?: string; color?: string } = {};
  if (patch.name !== undefined) changes.name = validateName(patch.name);
  if (patch.color !== undefined) changes.color = validateColor(patch.color);
  if (Object.keys(changes).length === 0) return tag;

  return db.update(tags).set(changes).where(eq(tags.id, id)).returning().get();
}

/**
 * Borra una etiqueta de sitio (REQ-02.5). Las listas y el historial de precios se conservan:
 * solo desaparece su asociación con la etiqueta (REQ-02.6).
 */
export function deleteSiteTag(db: Db, id: number): void {
  const tag = getTag(db, id);
  if (tag.kind === 'parent') throw new DbValidationError('PROTECTED_TAG');
  db.delete(tags).where(eq(tags.id, id)).run();
}
