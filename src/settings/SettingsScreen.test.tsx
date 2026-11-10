import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { PaperProvider } from 'react-native-paper';

import { DatabaseContextProvider } from '@/db/DatabaseProvider';
import { createSeededDb, type SeededDb } from '@/db/testing/seededTestDb';
import { SizeProvider } from '@/theme/SizeContext';
import { ThemeModeProvider } from '@/theme/ThemeModeContext';
import { SIZES } from '@/theme/sizes';
import { t } from '@/strings';

import { SettingsScreen } from './SettingsScreen';

let seeded: SeededDb;

function renderScreen() {
  return render(
    <SizeProvider>
      <ThemeModeProvider>
        <PaperProvider>
          <DatabaseContextProvider db={seeded.db}>
            <SettingsScreen />
          </DatabaseContextProvider>
        </PaperProvider>
      </ThemeModeProvider>
    </SizeProvider>,
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  seeded = await createSeededDb();
});

afterEach(() => {
  seeded.close();
});

describe('SettingsScreen', () => {
  it('muestra el interruptor apagado la primera vez', async () => {
    await renderScreen();
    const toggle = await screen.findByTestId('settings-large-mode-switch');
    expect(toggle.props.value).toBe(false);
    expect(screen.getByText(t.settings.largeMode)).toBeTruthy();
  });

  it('al activarlo guarda la preferencia y agranda la fila', async () => {
    await renderScreen();
    const row = await screen.findByTestId('settings-large-mode-row');
    expect(row).toHaveStyle({ minHeight: SIZES.normal.buttonMinHeight });

    await fireEvent(screen.getByTestId('settings-large-mode-switch'), 'valueChange', true);

    await waitFor(() =>
      expect(screen.getByTestId('settings-large-mode-row')).toHaveStyle({
        minHeight: SIZES.large.buttonMinHeight,
      }),
    );
    expect(await AsyncStorage.getItem('prefs.largeMode')).toBe('true');
  });

  it('recupera la preferencia guardada al abrir la app', async () => {
    await AsyncStorage.setItem('prefs.largeMode', 'true');
    await renderScreen();
    await waitFor(() =>
      expect(screen.getByTestId('settings-large-mode-switch').props.value).toBe(true),
    );
  });

  it('incluye la sección de base de datos con las etiquetas madre', async () => {
    await renderScreen();
    expect(await screen.findByTestId('settings-database-section')).toBeTruthy();
    expect(screen.getByText(t.settings.databaseOk)).toBeTruthy();
  });

  it('muestra el tema automático seleccionado la primera vez', async () => {
    await renderScreen();
    const system = await screen.findByTestId('settings-theme-system');
    expect(system.props.accessibilityState?.checked ?? system.props['aria-checked']).toBe(true);
    expect(screen.getByText(t.settings.themeLight)).toBeTruthy();
    expect(screen.getByText(t.settings.themeDark)).toBeTruthy();
  });

  it('al elegir oscuro guarda el tema y lo marca como seleccionado', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByTestId('settings-theme-dark'));
    await waitFor(async () => expect(await AsyncStorage.getItem('prefs.themeMode')).toBe('dark'));
    const dark = screen.getByTestId('settings-theme-dark');
    expect(dark.props.accessibilityState?.checked ?? dark.props['aria-checked']).toBe(true);
  });

  it('recupera el tema guardado al abrir la app', async () => {
    await AsyncStorage.setItem('prefs.themeMode', 'light');
    await renderScreen();
    await waitFor(() => {
      const light = screen.getByTestId('settings-theme-light');
      expect(light.props.accessibilityState?.checked ?? light.props['aria-checked']).toBe(true);
    });
  });
});
