export type SizeMode = 'normal' | 'large';

/** Tamaño mínimo recomendado de un elemento tocable (en puntos). */
export const MIN_TOUCH_TARGET = 48;

export interface Sizes {
  /** Multiplicador aplicado a todos los tamaños de texto. */
  fontScale: number;
  buttonMinHeight: number;
  /** Espacio entre botones o filas tocables. */
  buttonGap: number;
  iconSize: number;
  tabBarHeight: number;
}

export const SIZES: Record<SizeMode, Sizes> = {
  normal: {
    fontScale: 1,
    buttonMinHeight: MIN_TOUCH_TARGET,
    buttonGap: 8,
    iconSize: 24,
    tabBarHeight: 64,
  },
  large: {
    fontScale: 1.3,
    buttonMinHeight: 64,
    buttonGap: 12,
    iconSize: 32,
    tabBarHeight: 84,
  },
};

export function scaleFontSize(base: number, sizes: Sizes): number {
  return base * sizes.fontScale;
}
