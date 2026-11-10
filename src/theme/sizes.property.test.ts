import * as fc from 'fast-check';

import { MIN_TOUCH_TARGET, SIZES, scaleFontSize } from './sizes';

describe('escalas de tamaño', () => {
  it('el alto de botón es al menos 48 en ambos modos', () => {
    expect(SIZES.normal.buttonMinHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(SIZES.large.buttonMinHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(MIN_TOUCH_TARGET).toBe(48);
  });

  it('el modo grande nunca es menor que el normal en ninguna medida', () => {
    const keys = Object.keys(SIZES.normal) as (keyof typeof SIZES.normal)[];
    for (const key of keys) {
      expect(SIZES.large[key]).toBeGreaterThanOrEqual(SIZES.normal[key]);
    }
  });

  it('para cualquier tamaño de fuente base, el modo grande es >= al normal', () => {
    fc.assert(
      fc.property(fc.double({ min: 8, max: 48, noNaN: true }), (base) => {
        const normal = scaleFontSize(base, SIZES.normal);
        const large = scaleFontSize(base, SIZES.large);
        return large >= normal && normal === base;
      }),
    );
  });
});
