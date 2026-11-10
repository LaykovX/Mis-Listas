import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useTheme } from 'react-native-paper';

import { t } from '@/strings';
import { useSizes } from '@/theme/SizeContext';
import { scaleFontSize } from '@/theme/sizes';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function TabsLayout() {
  const theme = useTheme();
  const { sizes } = useSizes();

  const icon = (name: IconName) =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <MaterialCommunityIcons name={name} size={sizes.iconSize} color={color as string} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.onSurface, fontSize: scaleFontSize(20, sizes) },
        tabBarStyle: { backgroundColor: theme.colors.surface, height: sizes.tabBarHeight },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontSize: scaleFontSize(12, sizes) },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.lists,
          tabBarIcon: icon('clipboard-list-outline'),
          tabBarButtonTestID: 'tab-lists',
        }}
      />
      <Tabs.Screen
        name="comparatives"
        options={{
          title: t.tabs.comparatives,
          tabBarIcon: icon('chart-line'),
          tabBarButtonTestID: 'tab-comparatives',
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t.tabs.catalog,
          tabBarIcon: icon('food-apple-outline'),
          tabBarButtonTestID: 'tab-catalog',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: icon('cog-outline'),
          tabBarButtonTestID: 'tab-settings',
        }}
      />
    </Tabs>
  );
}
