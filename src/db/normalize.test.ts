import * as fc from 'fast-check';

import { normalizeName } from './normalize';

describe('normalizeName', () => {
  it.each([
    ['Tomate', 'tomate'],
    ['  papa   nueva ', 'papa nueva'],
    ['ÁRBOL', 'arbol'],
    ['Piña', 'pina'],
    ['Limón', 'limon'],
    ['', ''],
    ['   ', ''],
  ])('"%s" se normaliza a "%s"', (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });

  it('dos escrituras del mismo nombre dan el mismo resultado', () => {
    expect(normalizeName('Frutilla ')).toBe(normalizeName('frutilla'));
    expect(normalizeName('Pimentón')).toBe(normalizeName('PIMENTON'));
  });

  it('para cualquier texto, normalizar dos veces da lo mismo que una', () => {
    fc.assert(fc.property(fc.string(), (text) => normalizeName(normalizeName(text)) === normalizeName(text)));
  });

  it('para cualquier texto, el resultado no tiene espacios en los bordes ni dobles', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = normalizeName(text);
        return result === result.trim() && !/\s{2,}/.test(result);
      }),
    );
  });
});
