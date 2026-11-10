import * as fc from 'fast-check';

import { THEME_MODES, resolveScheme, type ThemeMode } from './themeMode';

describe('resolveScheme', () => {
  it('claro y oscuro ignoran el tema del teléfono', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('automático sigue el tema del teléfono', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('automático usa claro si el teléfono no informa su tema', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });

  it('para cualquier modo y tema del teléfono, el resultado es claro u oscuro', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ThemeMode>(...THEME_MODES),
        fc.constantFrom<'light' | 'dark' | null | undefined>('light', 'dark', null, undefined),
        (mode, system) => ['light', 'dark'].includes(resolveScheme(mode, system)),
      ),
    );
  });
});
