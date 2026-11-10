import { PARENT_TAG_SLUGS } from './constants';
import { tags } from './schema';
import type { Db } from './types';

/**
 * Crea las etiquetas madre (Feria y Supermercado) que falten. Es seguro ejecutarla en cada
 * arranque: las que ya existen no se tocan (REQ-02.1).
 */
export function ensureDefaultTags(db: Db, now: () => string = () => new Date().toISOString()): void {
  for (const slug of PARENT_TAG_SLUGS) {
    db.insert(tags).values({ kind: 'parent', slug, createdAt: now() }).onConflictDoNothing().run();
  }
}
