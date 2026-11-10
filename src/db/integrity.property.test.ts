import * as fc from 'fast-check';

import { UNITS } from './constants';
import { DbValidationError } from './errors';
import {
  addListItem,
  createCatalogItem,
  createList,
  deleteSiteTag,
  getList,
  getPriceHistory,
  listLists,
  recordPrice,
  setListSiteTags,
  updateReferencePrice,
  createSiteTag,
} from './repositories';
import { createSeededDb, type SeededDb } from './testing/seededTestDb';

const NUM_RUNS = 25;

function count(t: SeededDb, table: string, where = ''): number {
  const result = t.sqlite.exec(`SELECT COUNT(*) FROM ${table} ${where}`);
  return Number(result[0].values[0][0]);
}

/** Datos aleatorios para armar un escenario: etiquetas de sitio, listas y registros de precio. */
const scenarioArb = fc.record({
  siteTagCount: fc.integer({ min: 1, max: 4 }),
  lists: fc.array(
    fc.record({
      parent: fc.constantFrom('feria', 'supermercado'),
      siteTagPicks: fc.array(fc.nat(3), { maxLength: 3 }),
    }),
    { minLength: 1, maxLength: 5 },
  ),
  records: fc.array(
    fc.record({
      listPick: fc.nat(4),
      price: fc.integer({ min: 1, max: 10_000 }),
      unit: fc.constantFrom(...UNITS),
    }),
    { maxLength: 8 },
  ),
  deletePick: fc.nat(3),
});

type Scenario = typeof scenarioArb extends fc.Arbitrary<infer T> ? T : never;

function buildScenario(t: SeededDb, scenario: Scenario) {
  const siteTags = Array.from({ length: scenario.siteTagCount }, (_, i) =>
    createSiteTag(t.db, { name: `sitio ${i}`, color: '#2E7D32' }),
  );
  const item = createCatalogItem(t.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });

  const createdLists = scenario.lists.map((spec, index) => {
    const siteTagIds = [...new Set(spec.siteTagPicks.map((pick) => siteTags[pick % siteTags.length].id))];
    const parent = spec.parent === 'feria' ? t.feria : t.supermercado;
    const list = createList(t.db, { name: `lista ${index}`, parentTagId: parent.id, siteTagIds });
    addListItem(t.db, { listId: list.id, catalogItemId: item.id, quantity: 1, unit: 'kg', unitPrice: 800 });
    return list;
  });

  for (const record of scenario.records) {
    const list = createdLists[record.listPick % createdLists.length];
    recordPrice(t.db, { listId: list.id, catalogItemId: item.id, price: record.price, unit: record.unit });
  }
  return { siteTags, item, createdLists };
}

describe('propiedades de integridad (design.md, propiedades 5, 6 y 7)', () => {
  it('propiedad 7: borrar una etiqueta de sitio conserva listas, ítems e historial (REQ-02.6)', async () => {
    await fc.assert(
      fc.asyncProperty(scenarioArb, async (scenario) => {
        const t = await createSeededDb();
        try {
          const { siteTags } = buildScenario(t, scenario);
          const doomed = siteTags[scenario.deletePick % siteTags.length];

          const before = {
            lists: count(t, 'lists'),
            listItems: count(t, 'list_items'),
            records: count(t, 'price_records'),
            listLinksKept: count(t, 'list_site_tags', `WHERE tag_id != ${doomed.id}`),
            recordLinksKept: count(t, 'price_record_sites', `WHERE tag_id != ${doomed.id}`),
          };

          deleteSiteTag(t.db, doomed.id);

          expect(count(t, 'lists')).toBe(before.lists);
          expect(count(t, 'list_items')).toBe(before.listItems);
          expect(count(t, 'price_records')).toBe(before.records);
          expect(count(t, 'list_site_tags', `WHERE tag_id = ${doomed.id}`)).toBe(0);
          expect(count(t, 'price_record_sites', `WHERE tag_id = ${doomed.id}`)).toBe(0);
          expect(count(t, 'list_site_tags')).toBe(before.listLinksKept);
          expect(count(t, 'price_record_sites')).toBe(before.recordLinksKept);
          expect(t.sqlite.exec('PRAGMA foreign_key_check')).toEqual([]);
        } finally {
          t.close();
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('propiedad 6: toda lista tiene exactamente una etiqueta madre, pase lo que pase', async () => {
    const parentChoice = fc.constantFrom<'feria' | 'supermercado' | 'sitio' | 'inexistente' | 'ninguna'>(
      'feria',
      'supermercado',
      'sitio',
      'inexistente',
      'ninguna',
    );
    const siteChoice = fc.array(fc.constantFrom<'sitio' | 'madre' | 'inexistente'>('sitio', 'madre', 'inexistente'), {
      maxLength: 3,
    });

    await fc.assert(
      fc.asyncProperty(fc.array(fc.record({ parent: parentChoice, sites: siteChoice }), { maxLength: 8 }), async (attempts) => {
        const t = await createSeededDb();
        try {
          const site = createSiteTag(t.db, { name: 'sitio', color: '#2E7D32' });
          const idFor = (kind: 'feria' | 'supermercado' | 'sitio' | 'inexistente' | 'ninguna' | 'madre') => {
            switch (kind) {
              case 'feria':
                return t.feria.id;
              case 'supermercado':
                return t.supermercado.id;
              case 'sitio':
                return site.id;
              case 'madre':
                return t.feria.id;
              case 'inexistente':
                return 9999;
              case 'ninguna':
                return undefined as unknown as number;
            }
          };

          let created = 0;
          for (const [index, attempt] of attempts.entries()) {
            try {
              createList(t.db, {
                name: `lista ${index}`,
                parentTagId: idFor(attempt.parent),
                siteTagIds: attempt.sites.map(idFor),
              });
              created += 1;
            } catch (error) {
              expect(error).toBeInstanceOf(DbValidationError);
            }
          }

          // Reasignar etiquetas de sitio tampoco puede dejar una lista sin madre.
          for (const list of listLists(t.db)) {
            try {
              setListSiteTags(t.db, list.id, [t.feria.id]);
            } catch (error) {
              expect(error).toBeInstanceOf(DbValidationError);
            }
            setListSiteTags(t.db, list.id, [site.id]);
          }

          expect(count(t, 'lists')).toBe(created);
          expect(count(t, 'lists', 'WHERE parent_tag_id IS NULL')).toBe(0);
          expect(
            count(t, 'lists', "WHERE parent_tag_id NOT IN (SELECT id FROM tags WHERE kind = 'parent')"),
          ).toBe(0);
          for (const list of listLists(t.db)) {
            expect(getList(t.db, list.id).siteTagIds).not.toContain(list.parentTagId);
          }
        } finally {
          t.close();
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('propiedad 5: cambiar el precio de referencia nunca altera el historial de precios (REQ-05.3)', async () => {
    const priceChange = fc.oneof(fc.integer({ min: 1, max: 100_000 }), fc.constantFrom(0, -1, 1.5, Number.NaN));

    await fc.assert(
      fc.asyncProperty(scenarioArb, fc.array(priceChange, { minLength: 1, maxLength: 6 }), async (scenario, changes) => {
        const t = await createSeededDb();
        try {
          const { item } = buildScenario(t, scenario);
          const before = JSON.stringify(getPriceHistory(t.db, item.id));
          const rowsBefore = JSON.stringify(t.sqlite.exec('SELECT * FROM price_records ORDER BY id'));

          for (const price of changes) {
            try {
              updateReferencePrice(t.db, item.id, price);
            } catch (error) {
              expect(error).toBeInstanceOf(DbValidationError);
            }
          }

          expect(JSON.stringify(getPriceHistory(t.db, item.id))).toBe(before);
          expect(JSON.stringify(t.sqlite.exec('SELECT * FROM price_records ORDER BY id'))).toBe(rowsBefore);
        } finally {
          t.close();
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
