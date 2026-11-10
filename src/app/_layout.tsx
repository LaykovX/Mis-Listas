import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { buildTheme } from '@/theme';
import { SizeProvider, useSizes } from '@/theme/SizeContext';
import { ThemeModeProvider, useThemeMode } from '@/theme/ThemeModeContext';
import { resolveScheme } from '@/theme/themeMode';

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const systemScheme = useColorScheme();
  const { sizes, isReady: sizesReady } = useSizes();
  const { themeMode, isReady: themeReady } = useThemeMode();
  const scheme = resolveScheme(themeMode, systemScheme);
  const theme = useMemo(() => buildTheme(scheme, sizes), [scheme, sizes]);
  const isReady = sizesReady && themeReady;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SizeProvider>
        <ThemeModeProvider>
          <ThemedApp />
        </ThemeModeProvider>
      </SizeProvider>
    </SafeAreaProvider>
  );
}
