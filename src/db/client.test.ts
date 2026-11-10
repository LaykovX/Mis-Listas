const mockExecSync = jest.fn();
const mockCloseSync = jest.fn();
const mockOpenDatabaseSync = jest.fn();
const mockDrizzle = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (...args: unknown[]) => mockOpenDatabaseSync(...args),
}));
jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: (...args: unknown[]) => mockDrizzle(...args),
}));

/** Carga el módulo desde cero, para que cada prueba tenga su propio estado (la conexión guardada). */
function loadClient(): typeof import('./client') {
  let client!: typeof import('./client');
  jest.isolateModules(() => {
    client = require('./client');
  });
  return client;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOpenDatabaseSync.mockReturnValue({ execSync: mockExecSync, closeSync: mockCloseSync });
  mockDrizzle.mockImplementation((sqlite: unknown) => ({ sqlite }));
});

describe('openDatabase', () => {
  it('abre la base local con el nombre de la app y activa las claves foráneas', () => {
    const { openDatabase, DATABASE_NAME } = loadClient();
    openDatabase();
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith(DATABASE_NAME);
    expect(mockExecSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
  });

  it('abre una sola conexión aunque se llame varias veces', () => {
    const { openDatabase } = loadClient();
    const first = openDatabase();
    const second = openDatabase();
    expect(second).toBe(first);
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(1);
    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });

  it('si abrir falla, no guarda nada y un reintento posterior funciona', () => {
    mockOpenDatabaseSync.mockImplementationOnce(() => {
      throw new Error('disco ocupado');
    });
    const { openDatabase } = loadClient();
    expect(() => openDatabase()).toThrow(/disco ocupado/);
    expect(() => openDatabase()).not.toThrow();
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(2);
  });

  it('si falla la configuración, cierra la conexión y un reintento abre otra limpia', () => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('pragma falló');
    });
    const { openDatabase } = loadClient();
    expect(() => openDatabase()).toThrow(/pragma falló/);
    expect(mockCloseSync).toHaveBeenCalledTimes(1);
    expect(() => openDatabase()).not.toThrow();
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(2);
  });
});
