import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { loadLargeMode, saveLargeMode } from '@/settings/preferences';

import { SIZES, type Sizes } from './sizes';

interface SizeContextValue {
  largeMode: boolean;
  setLargeMode: (value: boolean) => void;
  sizes: Sizes;
  /** Verdadero cuando ya se leyó la preferencia guardada. */
  isReady: boolean;
}

const SizeContext = createContext<SizeContextValue>({
  largeMode: false,
  setLargeMode: () => {},
  sizes: SIZES.normal,
  isReady: false,
});

export function SizeProvider({ children }: { children: React.ReactNode }) {
  const [largeMode, setLargeModeState] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const changedByUser = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadLargeMode().then((saved) => {
      if (cancelled) return;
      // Si el usuario ya cambió el interruptor, no se pisa su elección con el valor guardado.
      if (!changedByUser.current) setLargeModeState(saved);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLargeMode = useCallback((value: boolean) => {
    changedByUser.current = true;
    setLargeModeState(value);
    void saveLargeMode(value);
  }, []);

  const value = useMemo<SizeContextValue>(
    () => ({
      largeMode,
      setLargeMode,
      sizes: largeMode ? SIZES.large : SIZES.normal,
      isReady,
    }),
    [largeMode, setLargeMode, isReady],
  );

  return <SizeContext.Provider value={value}>{children}</SizeContext.Provider>;
}

export function useSizes(): SizeContextValue {
  return useContext(SizeContext);
}
