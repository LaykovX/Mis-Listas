import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadLargeMode, loadThemeMode, saveLargeMode, saveThemeMode } from './preferences';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('preferencia de texto y botones grandes', () => {
  it('es falsa por defecto la primera vez', async () => {
    expect(await loadLargeMode()).toBe(false);
  });

  it('conserva el valor guardado', async () => {
    await saveLargeMode(true);
    expect(await loadLargeMode()).toBe(true);
    await saveLargeMode(false);
    expect(await loadLargeMode()).toBe(false);
  });

  it('devuelve falso si el almacenamiento falla al leer', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('fallo'));
    expect(await loadLargeMode()).toBe(false);
  });

  it('no lanza error si el almacenamiento falla al guardar', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('fallo'));
    await expect(saveLargeMode(true)).resolves.toBeUndefined();
  });
});

describe('preferencia de tema', () => {
  it('es automático por defecto la primera vez', async () => {
    expect(await loadThemeMode()).toBe('system');
  });

  it('conserva cada modo guardado', async () => {
    for (const mode of ['light', 'dark', 'system'] as const) {
      await saveThemeMode(mode);
      expect(await loadThemeMode()).toBe(mode);
    }
  });

  it('ignora un valor guardado que no es válido', async () => {
    await AsyncStorage.setItem('prefs.themeMode', 'morado');
    expect(await loadThemeMode()).toBe('system');
  });

  it('devuelve automático si el almacenamiento falla al leer', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('fallo'));
    expect(await loadThemeMode()).toBe('system');
  });

  it('no lanza error si el almacenamiento falla al guardar', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('fallo'));
    await expect(saveThemeMode('dark')).resolves.toBeUndefined();
  });
});
