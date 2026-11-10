import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { darkColors, lightColors } from './colors';
import { scaleFontSize, type Sizes } from './sizes';

export type ColorSchemeName = 'light' | 'dark';

/** Construye el tema de Paper para el esquema de color y la escala de tamaños activos. */
export function buildTheme(scheme: ColorSchemeName, sizes: Sizes): MD3Theme {
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const palette = scheme === 'dark' ? darkColors : lightColors;

  const fonts = Object.fromEntries(
    Object.entries(base.fonts).map(([name, font]) => {
      if (typeof font !== 'object' || font === null || !('fontSize' in font)) {
        return [name, font];
      }
      return [
        name,
        {
          ...font,
          fontSize: scaleFontSize(font.fontSize, sizes),
          lineHeight: scaleFontSize(font.lineHeight, sizes),
        },
      ];
    }),
  ) as MD3Theme['fonts'];

  return {
    ...base,
    colors: { ...base.colors, ...palette },
    fonts,
  };
}
