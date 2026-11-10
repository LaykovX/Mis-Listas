import { createSeededDb, expectCode, type SeededDb } from '../testing/seededTestDb';

import { createSiteTag, deleteSiteTag, getTag, listParentTags, listSiteTags, updateSiteTag } from './tags';

let t: SeededDb;

beforeEach(async () => {
  t = await createSeededDb();
});

afterEach(() => {
  t.close();
});

describe('listParentTags', () => {
  it('devuelve las dos etiquetas madre', () => {
    expect(listParentTags(t.db).map((tag) => tag.slug)).toEqual(['feria', 'supermercado']);
  });
});

describe('createSiteTag', () => {
  it('crea una etiqueta de sitio con nombre y color', () => {
    const tag = createSiteTag(t.db, { name: '  feria las condes ', color: '#2e7d32' });
    expect(tag.kind).toBe('site');
    expect(tag.name).toBe('feria las condes');
    expect(tag.color).toBe('#2E7D32');
    expect(tag.slug).toBeNull();
  });

  it.each(['', '   ', 'x'.repeat(61)])('rechaza el nombre inválido "%s"', (name) => {
    expectCode(() => createSiteTag(t.db, { name, color: '#2E7D32' }), 'INVALID_NAME');
  });

  it.each(['verde', '#12345', '#GGGGGG', '', '2E7D32', '#2E7D32FF'])('rechaza el color inválido "%s"', (color) => {
    expectCode(() => createSiteTag(t.db, { name: 'feria', color }), 'INVALID_COLOR');
  });

  it('no crea nada cuando falla la validación', () => {
    expectCode(() => createSiteTag(t.db, { name: '', color: '#2E7D32' }), 'INVALID_NAME');
    expect(listSiteTags(t.db)).toHaveLength(0);
  });
});

describe('listSiteTags', () => {
  it('ordena por nombre sin distinguir mayúsculas', () => {
    createSiteTag(t.db, { name: 'feria las compañías', color: '#2E7D32' });
    createSiteTag(t.db, { name: 'Feria Las Condes', color: '#1565C0' });
    createSiteTag(t.db, { name: 'agro', color: '#C62828' });
    expect(listSiteTags(t.db).map((tag) => tag.name)).toEqual(['agro', 'feria las compañías', 'Feria Las Condes']);
  });

  it('no incluye las etiquetas madre', () => {
    expect(listSiteTags(t.db)).toEqual([]);
  });
});

describe('updateSiteTag', () => {
  it('renombra y cambia el color por separado', () => {
    const tag = createSiteTag(t.db, { name: 'feria', color: '#2E7D32' });
    expect(updateSiteTag(t.db, tag.id, { name: 'feria nueva' }).name).toBe('feria nueva');
    const recolored = updateSiteTag(t.db, tag.id, { color: '#1565c0' });
    expect(recolored.color).toBe('#1565C0');
    expect(recolored.name).toBe('feria nueva');
  });

  it('rechaza valores inválidos y deja la etiqueta como estaba', () => {
    const tag = createSiteTag(t.db, { name: 'feria', color: '#2E7D32' });
    expectCode(() => updateSiteTag(t.db, tag.id, { name: ' ' }), 'INVALID_NAME');
    expectCode(() => updateSiteTag(t.db, tag.id, { color: 'rojo' }), 'INVALID_COLOR');
    expect(getTag(t.db, tag.id).name).toBe('feria');
  });

  it('falla con NOT_FOUND si la etiqueta no existe', () => {
    expectCode(() => updateSiteTag(t.db, 9999, { name: 'x' }), 'NOT_FOUND');
  });

  it('no permite modificar una etiqueta madre', () => {
    expectCode(() => updateSiteTag(t.db, t.feria.id, { name: 'otra' }), 'PROTECTED_TAG');
  });
});

describe('deleteSiteTag', () => {
  it('borra una etiqueta de sitio', () => {
    const tag = createSiteTag(t.db, { name: 'feria', color: '#2E7D32' });
    deleteSiteTag(t.db, tag.id);
    expect(listSiteTags(t.db)).toHaveLength(0);
  });

  it('no permite borrar una etiqueta madre', () => {
    expectCode(() => deleteSiteTag(t.db, t.supermercado.id), 'PROTECTED_TAG');
    expect(listParentTags(t.db)).toHaveLength(2);
  });

  it('falla con NOT_FOUND si la etiqueta no existe', () => {
    expectCode(() => deleteSiteTag(t.db, 9999), 'NOT_FOUND');
  });
});
