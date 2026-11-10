/** Cómo elige la app su tema: según el teléfono, o fijo en claro u oscuro. */
export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type SchemeName = 'light' | 'dark';

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

/** Tema que se debe mostrar según la elección del usuario y el tema del teléfono. */
export function resolveScheme(mode: ThemeMode, system: SchemeName | null | undefined): SchemeName {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}
