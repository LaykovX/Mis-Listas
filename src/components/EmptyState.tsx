import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { useSizes } from '@/theme/SizeContext';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  hint: string;
  testID?: string;
}

/** Pantalla vacía con ícono, título y una frase de ayuda. */
export function EmptyState({ icon, title, hint, testID }: EmptyStateProps) {
  const theme = useTheme();
  const { sizes } = useSizes();
  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: theme.colors.background, padding: sizes.buttonGap * 3 }]}
    >
      <MaterialCommunityIcons name={icon} size={sizes.iconSize * 2} color={theme.colors.onSurfaceVariant} />
      <Text variant="titleLarge" style={[styles.text, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text variant="bodyLarge" style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { textAlign: 'center' },
});
