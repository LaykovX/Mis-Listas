export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  onError: string;
}

/** Paleta clara. Los pares texto/fondo cumplen contraste WCAG AA (>= 4.5). */
export const lightColors: ThemeColors = {
  primary: '#1B6B3A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#A8F3B5',
  onPrimaryContainer: '#00210C',
  background: '#FBFDF8',
  onBackground: '#1A1C19',
  surface: '#FBFDF8',
  onSurface: '#1A1C19',
  surfaceVariant: '#DEE5D9',
  onSurfaceVariant: '#424940',
  outline: '#72796F',
  error: '#BA1A1A',
  onError: '#FFFFFF',
};

/** Paleta oscura. Los pares texto/fondo cumplen contraste WCAG AA (>= 4.5). */
export const darkColors: ThemeColors = {
  primary: '#8DD89B',
  onPrimary: '#00391A',
  primaryContainer: '#00522A',
  onPrimaryContainer: '#A8F3B5',
  background: '#1A1C19',
  onBackground: '#E2E3DD',
  surface: '#1A1C19',
  onSurface: '#E2E3DD',
  surfaceVariant: '#424940',
  onSurfaceVariant: '#C2C9BD',
  outline: '#8C9388',
  error: '#FFB4AB',
  onError: '#690005',
};
