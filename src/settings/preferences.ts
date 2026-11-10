import AsyncStorage from '@react-native-async-storage/async-storage';

import { isThemeMode, type ThemeMode } from '@/theme/themeMode';

// Solo para preferencias de la interfaz. Los datos de la app van en SQLite (Fase 2).
const LARGE_MODE_KEY = 'prefs.largeMode';
const THEME_MODE_KEY = 'prefs.themeMode';

/** Lee si el modo de texto y botones grandes está activo. Por defecto: apagado. */
export async function loadLargeMode(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LARGE_MODE_KEY)) === 'true';
  } catch {
    return false;
  }
}

/** Guarda la preferencia. Si falla, la app sigue funcionando con el valor en memoria. */
export async function saveLargeMode(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(LARGE_MODE_KEY, String(value));
  } catch {
    // La preferencia no se conservará al cerrar la app, pero no se interrumpe al usuario.
  }
}

/** Lee el modo de tema elegido. Por defecto (o si el valor guardado no es válido): automático. */
export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const saved = await AsyncStorage.getItem(THEME_MODE_KEY);
    return isThemeMode(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

/** Guarda el modo de tema. Si falla, la app sigue con el valor en memoria. */
export async function saveThemeMode(value: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_MODE_KEY, value);
  } catch {
    // El tema no se conservará al cerrar la app, pero no se interrumpe al usuario.
  }
}
