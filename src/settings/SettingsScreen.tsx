import React from 'react';
import { ScrollView, View } from 'react-native';
import { List, SegmentedButtons, Switch, Text, useTheme } from 'react-native-paper';

import { t } from '@/strings';
import { DatabaseStatus } from './DatabaseStatus';
import { useSizes } from '@/theme/SizeContext';
import { scaleFontSize } from '@/theme/sizes';
import { useThemeMode } from '@/theme/ThemeModeContext';
import { isThemeMode } from '@/theme/themeMode';

export function SettingsScreen() {
  const theme = useTheme();
  const { largeMode, setLargeMode, sizes } = useSizes();
  const { themeMode, setThemeMode } = useThemeMode();

  const segment = {
    style: { minHeight: sizes.buttonMinHeight },
    labelStyle: { fontSize: scaleFontSize(14, sizes) },
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <List.Item
        testID="settings-large-mode-row"
        title={t.settings.largeMode}
        description={t.settings.largeModeHint}
        descriptionNumberOfLines={3}
        onPress={() => setLargeMode(!largeMode)}
        accessibilityRole="switch"
        accessibilityState={{ checked: largeMode }}
        style={{ minHeight: sizes.buttonMinHeight, justifyContent: 'center' }}
        right={() => (
          <Switch
            testID="settings-large-mode-switch"
            value={largeMode}
            onValueChange={setLargeMode}
            accessibilityLabel={t.settings.largeMode}
          />
        )}
      />

      <View style={{ paddingHorizontal: 16, paddingVertical: sizes.buttonGap, gap: sizes.buttonGap }}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {t.settings.theme}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t.settings.themeHint}
        </Text>
        <SegmentedButtons
          value={themeMode}
          onValueChange={(value) => {
            if (isThemeMode(value)) setThemeMode(value);
          }}
          buttons={[
            {
              value: 'system',
              label: t.settings.themeSystem,
              testID: 'settings-theme-system',
              accessibilityLabel: t.settings.themeSystem,
              ...segment,
            },
            {
              value: 'light',
              label: t.settings.themeLight,
              testID: 'settings-theme-light',
              accessibilityLabel: t.settings.themeLight,
              ...segment,
            },
            {
              value: 'dark',
              label: t.settings.themeDark,
              testID: 'settings-theme-dark',
              accessibilityLabel: t.settings.themeDark,
              ...segment,
            },
          ]}
        />
      </View>

      <DatabaseStatus />
    </ScrollView>
  );
}
