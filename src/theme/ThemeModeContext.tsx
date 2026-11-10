import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { loadThemeMode, saveThemeMode } from '@/settings/preferences';

import type { ThemeMode } from './themeMode';

interface ThemeModeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  /** Verdadero cuando ya se leyó el tema guardado. */
  isReady: boolean;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  themeMode: 'system',
  setThemeMode: () => {},
  isReady: false,
});

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);
  const changedByUser = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadThemeMode().then((saved) => {
      if (cancelled) return;
      // Si el usuario ya eligió un tema, no se pisa su elección con el valor guardado.
      if (!changedByUser.current) setThemeModeState(saved);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    changedByUser.current = true;
    setThemeModeState(mode);
    void saveThemeMode(mode);
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({ themeMode, setThemeMode, isReady }),
    [themeMode, setThemeMode, isReady],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}
