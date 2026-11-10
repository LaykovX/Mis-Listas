import { eq } from 'drizzle-orm';
import { render, screen } from '@testing-library/react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import React from 'react';
import { Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { t } from '@/strings';

import { DatabaseProvider, useDb, type DatabaseConnection } from './DatabaseProvider';
import * as schema from './schema';
import { createTestDb, type TestDb } from './testing/createTestDb';

jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({ useMigrations: jest.fn() }));
jest.mock('../../drizzle/migrations', () => ({ __esModule: true, default: { journal: { entries: [] }, migrations: {} } }));

const mockUseMigrations = useMigrations as jest.Mock;

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  testDb.close();
  jest.restoreAllMocks();
  mockUseMigrations.mockReset();
});

const asConnection = () => testDb.db as unknown as DatabaseConnection;

function Probe() {
  const db = useDb();
  const count = db.select().from(schema.tags).where(eq(schema.tags.kind, 'parent')).all().length;
  return <Text testID="probe">{`etiquetas madre: ${count}`}</Text>;
}

function renderProvider(openDb: () => DatabaseConnection) {
  return render(
    <PaperProvider>
      <DatabaseProvider openDb={openDb}>
        <Probe />
      </DatabaseProvider>
    </PaperProvider>,
  );
}

describe('DatabaseProvider', () => {
  it('no muestra las pantallas mientras la base se prepara', async () => {
    mockUseMigrations.mockReturnValue({ success: false, error: undefined });
    await renderProvider(asConnection);
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(screen.getByTestId('database-loading')).toBeTruthy();
  });

  it('muestra las pantallas cuando la migración termina y crea las etiquetas madre', async () => {
    mockUseMigrations.mockReturnValue({ success: true, error: undefined });
    await renderProvider(asConnection);
    expect(await screen.findByText('etiquetas madre: 2')).toBeTruthy();
  });

  it('muestra la pantalla de error en español si falla la migración', async () => {
    mockUseMigrations.mockReturnValue({ success: false, error: new Error('detalle interno secreto') });
    await renderProvider(asConnection);
    expect(await screen.findByTestId('database-error-screen')).toBeTruthy();
    expect(screen.getByText(t.database.errorTitle)).toBeTruthy();
    expect(screen.getByText(t.database.errorHint)).toBeTruthy();
    expect(screen.queryByTestId('probe')).toBeNull();
    // No se filtran detalles técnicos al usuario.
    expect(screen.queryByText(/secreto/)).toBeNull();
  });

  it('registra el error de migración una sola vez aunque la pantalla se vuelva a dibujar', async () => {
    mockUseMigrations.mockReturnValue({ success: false, error: new Error('fallo') });
    const view = await renderProvider(asConnection);
    await screen.findByTestId('database-error-screen');
    await view.rerender(
      <PaperProvider>
        <DatabaseProvider openDb={asConnection}>
          <Probe />
        </DatabaseProvider>
      </PaperProvider>,
    );
    const logged = (console.error as jest.Mock).mock.calls.filter((call) => String(call[0]).includes('migración'));
    expect(logged).toHaveLength(1);
  });

  // Ojo: este test solo comprueba que el proveedor no escribe nada al mostrar el error. Que una
  // migración fallida no dañe los datos lo cubre migrations.test.ts, con una migración real.
  it('mostrar la pantalla de error no escribe nada en la base', async () => {
    testDb.db
      .insert(schema.tags)
      .values({ kind: 'site', name: 'feria las condes', color: '#2E7D32', createdAt: '2026-01-01T00:00:00.000Z' })
      .run();
    mockUseMigrations.mockReturnValue({ success: false, error: new Error('fallo') });
    await renderProvider(asConnection);
    await screen.findByTestId('database-error-screen');
    expect(testDb.db.select().from(schema.tags).all()).toHaveLength(1);
  });

  it('muestra la pantalla de error si no se puede abrir la base', async () => {
    mockUseMigrations.mockReturnValue({ success: false, error: undefined });
    await renderProvider(() => {
      throw new Error('no se pudo abrir');
    });
    expect(await screen.findByTestId('database-error-screen')).toBeTruthy();
  });

  it('useDb fuera del proveedor lanza un error claro', async () => {
    function Orphan() {
      useDb();
      return null;
    }
    await expect(render(<Orphan />)).rejects.toThrow(/DatabaseProvider/);
  });
});
