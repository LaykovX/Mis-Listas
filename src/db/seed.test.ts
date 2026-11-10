import { eq } from 'drizzle-orm';

import { PARENT_TAG_SLUGS } from './constants';
import * as schema from './schema';
import { ensureDefaultTags } from './seed';
import { createTestDb, type TestDb } from './testing/createTestDb';

let t: TestDb;

beforeEach(async () => {
  t = await createTestDb();
});

afterEach(() => {
  t.close();
});

describe('ensureDefaultTags', () => {
  it('crea exactamente las 2 etiquetas madre en una base vacía', () => {
    ensureDefaultTags(t.db);
    const parents = t.db.select().from(schema.tags).where(eq(schema.tags.kind, 'parent')).all();
    expect(parents.map((p) => p.slug).sort()).toEqual([...PARENT_TAG_SLUGS].sort());
    expect(parents).toHaveLength(2);
  });

  it('no crea duplicados si se ejecuta varias veces', () => {
    ensureDefaultTags(t.db);
    ensureDefaultTags(t.db);
    ensureDefaultTags(t.db);
    expect(t.db.select().from(schema.tags).all()).toHaveLength(2);
  });

  it('no modifica las etiquetas madre que ya existían', () => {
    ensureDefaultTags(t.db, () => '2026-01-01T00:00:00.000Z');
    ensureDefaultTags(t.db, () => '2026-12-31T00:00:00.000Z');
    const created = t.db.select().from(schema.tags).all().map((tag) => tag.createdAt);
    expect(created.every((date) => date === '2026-01-01T00:00:00.000Z')).toBe(true);
  });

  it('no toca las etiquetas de sitio del usuario', () => {
    t.db
      .insert(schema.tags)
      .values({ kind: 'site', name: 'feria las condes', color: '#2E7D32', createdAt: '2026-02-02T00:00:00.000Z' })
      .run();
    ensureDefaultTags(t.db);
    const sites = t.db.select().from(schema.tags).where(eq(schema.tags.kind, 'site')).all();
    expect(sites).toHaveLength(1);
    expect(sites[0].name).toBe('feria las condes');
  });

  it('completa solo la etiqueta madre que falte', () => {
    t.db.insert(schema.tags).values({ kind: 'parent', slug: 'feria', createdAt: '2026-03-03T00:00:00.000Z' }).run();
    ensureDefaultTags(t.db);
    const parents = t.db.select().from(schema.tags).all();
    expect(parents).toHaveLength(2);
    expect(parents.find((p) => p.slug === 'feria')?.createdAt).toBe('2026-03-03T00:00:00.000Z');
  });
});
