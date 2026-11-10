import { PARENT_TAG_SLUGS } from '@/db/constants';

import { t } from './index';

describe('textos de la interfaz', () => {
  it('hay un texto visible para cada etiqueta madre', () => {
    for (const slug of PARENT_TAG_SLUGS) {
      expect(typeof t.tags[slug]).toBe('string');
      expect(t.tags[slug].length).toBeGreaterThan(0);
    }
  });

  it('hay textos para los estados de la base de datos', () => {
    expect(t.database.loading.length).toBeGreaterThan(0);
    expect(t.database.errorTitle.length).toBeGreaterThan(0);
    expect(t.database.errorHint.length).toBeGreaterThan(0);
  });
});
