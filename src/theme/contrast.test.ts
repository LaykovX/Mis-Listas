import { darkColors, lightColors } from './colors';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('es 21 para negro sobre blanco', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('es 1 para el mismo color', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('no depende del orden de los colores', () => {
    expect(contrastRatio('#1B6B3A', '#FFFFFF')).toBeCloseTo(
      contrastRatio('#FFFFFF', '#1B6B3A'),
      5,
    );
  });
});

const MIN_AA = 4.5;

const PAIRS = [
  ['onSurface', 'surface'],
  ['onSurface', 'background'],
  ['onSurfaceVariant', 'surface'],
  ['onPrimary', 'primary'],
  ['onPrimaryContainer', 'primaryContainer'],
  ['onError', 'error'],
  ['primary', 'background'],
] as const;

describe.each([
  ['claro', lightColors],
  ['oscuro', darkColors],
])('colores del tema %s cumplen WCAG AA', (_name, palette) => {
  it.each(PAIRS)('%s sobre %s tiene contraste >= 4.5', (fg, bg) => {
    expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(MIN_AA);
  });
});
