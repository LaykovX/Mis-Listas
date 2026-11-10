import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { PaperProvider } from 'react-native-paper';

import { SizeProvider } from '@/theme/SizeContext';
import { MIN_TOUCH_TARGET, SIZES } from '@/theme/sizes';

import { AppButton } from './AppButton';

/** Recorre el árbol renderizado y devuelve el mayor `minHeight` encontrado en algún estilo. */
function maxMinHeight(node: unknown): number {
  if (!node || typeof node !== 'object') return 0;
  const n = node as { props?: { style?: unknown }; children?: unknown[] };
  const styles = ([] as unknown[]).concat(n.props?.style ?? []).flat(Infinity);
  let max = 0;
  for (const s of styles) {
    if (s && typeof s === 'object' && 'minHeight' in s) {
      const value = (s as { minHeight?: number }).minHeight;
      if (typeof value === 'number') max = Math.max(max, value);
    }
  }
  for (const child of n.children ?? []) max = Math.max(max, maxMinHeight(child));
  return max;
}

function renderButton() {
  return render(
    <SizeProvider>
      <PaperProvider>
        <AppButton testID="demo-button" label="Probar" onPress={() => {}} />
      </PaperProvider>
    </SizeProvider>,
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('AppButton', () => {
  it('se muestra como botón accesible con su etiqueta', async () => {
    await renderButton();
    expect(await screen.findByTestId('demo-button')).toBeTruthy();
    expect(screen.getByText('Probar')).toBeTruthy();
  });

  it('tiene al menos 48 de alto en modo normal', async () => {
    await renderButton();
    await screen.findByTestId('demo-button');
    const height = maxMinHeight(screen.toJSON());
    expect(height).toBe(SIZES.normal.buttonMinHeight);
    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('crece en modo grande y sigue siendo al menos 48', async () => {
    await AsyncStorage.setItem('prefs.largeMode', 'true');
    await renderButton();
    await waitFor(() =>
      expect(maxMinHeight(screen.toJSON())).toBe(SIZES.large.buttonMinHeight),
    );
    expect(SIZES.large.buttonMinHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });
});
