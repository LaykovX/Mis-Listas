import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { useDb } from '@/db/DatabaseProvider';
import { getDatabaseStats } from '@/db/repositories';
import { t } from '@/strings';
import { useSizes } from '@/theme/SizeContext';

/**
 * Sección de comprobación: muestra lo que realmente hay guardado en la base del teléfono.
 * Es de diagnóstico y se puede quitar cuando ya no haga falta.
 */
export function DatabaseStatus() {
  const theme = useTheme();
  const { sizes } = useSizes();
  const db = useDb();
  const stats = useMemo(() => getDatabaseStats(db), [db]);

  const parentTagNames = stats.parentTags.map((tag) => (tag.slug ? t.tags[tag.slug] : '')).join(', ');

  const rows: { label: string; value: string; testID: string }[] = [
    { label: t.settings.databaseParentTags, value: parentTagNames, testID: 'settings-database-parent-tags' },
    { label: t.settings.databaseSiteTags, value: String(stats.siteTagCount), testID: 'settings-database-site-tags-count' },
    { label: t.settings.databaseLists, value: String(stats.listCount), testID: 'settings-database-lists-count' },
    { label: t.settings.databaseItems, value: String(stats.catalogItemCount), testID: 'settings-database-items-count' },
    { label: t.settings.databasePrices, value: String(stats.priceRecordCount), testID: 'settings-database-prices-count' },
  ];

  return (
    <View testID="settings-database-section" style={{ paddingHorizontal: 16, paddingVertical: sizes.buttonGap, gap: sizes.buttonGap }}>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {t.settings.database}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t.settings.databaseOk}
      </Text>
      {rows.map((row) => (
        <View key={row.testID} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flexShrink: 1 }}>
            {row.label}
          </Text>
          <Text
            testID={row.testID}
            variant="bodyLarge"
            style={{ color: theme.colors.onSurface, fontWeight: '600', textAlign: 'right', flexShrink: 1 }}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
