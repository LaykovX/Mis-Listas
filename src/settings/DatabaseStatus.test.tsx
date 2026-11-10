import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { PaperProvider } from 'react-native-paper';

import { DatabaseContextProvider } from '@/db/DatabaseProvider';
import { createCatalogItem, createList } from '@/db/repositories';
import { createSeededDb, type SeededDb } from '@/db/testing/seededTestDb';
import { t } from '@/strings';

import { DatabaseStatus } from './DatabaseStatus';

let seeded: SeededDb;

beforeEach(async () => {
  seeded = await createSeededDb();
});

afterEach(() => {
  seeded.close();
});

function renderStatus() {
  return render(
    <PaperProvider>
      <DatabaseContextProvider db={seeded.db}>
        <DatabaseStatus />
      </DatabaseContextProvider>
    </PaperProvider>,
  );
}

describe('DatabaseStatus', () => {
  it('muestra que la base funciona y las dos etiquetas madre leídas de la base', async () => {
    await renderStatus();
    expect(await screen.findByTestId('settings-database-section')).toBeTruthy();
    expect(screen.getByText(t.settings.databaseOk)).toBeTruthy();
    const tags = screen.getByTestId('settings-database-parent-tags');
    expect(tags).toHaveTextContent(`${t.tags.feria}, ${t.tags.supermercado}`);
  });

  it('muestra los conteos en cero en una base recién creada', async () => {
    await renderStatus();
    expect(await screen.findByTestId('settings-database-lists-count')).toHaveTextContent('0');
    expect(screen.getByTestId('settings-database-items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('settings-database-prices-count')).toHaveTextContent('0');
  });

  it('muestra los conteos reales de la base', async () => {
    createList(seeded.db, { name: 'L', parentTagId: seeded.feria.id });
    createList(seeded.db, { name: 'M', parentTagId: seeded.feria.id });
    createCatalogItem(seeded.db, { name: 'tomate', defaultUnit: 'kg', referencePrice: 800 });
    await renderStatus();
    expect(await screen.findByTestId('settings-database-lists-count')).toHaveTextContent('2');
    expect(screen.getByTestId('settings-database-items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('settings-database-prices-count')).toHaveTextContent('0');
  });
});
