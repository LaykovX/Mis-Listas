import fs from 'fs';
import path from 'path';

/**
 * Guardia de pureza: src/logic/ es lógica pura, sin base de datos, Expo ni React. Esta prueba
 * lee el código fuente y falla si alguien agrega un import que rompa esa regla.
 */

const LOGIC_DIR = __dirname;
const ALLOWED_ABSOLUTE = new Set(['@/db/constants']);

/** Devuelve los módulos importados que no están permitidos en src/logic/. */
export function findForbiddenImports(source: string): string[] {
  const modules = [
    ...source.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/import\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((match) => match[1]);

  return modules.filter((module) => {
    const isRelative = module.startsWith('./') || module.startsWith('../');
    return !isRelative && !ALLOWED_ABSOLUTE.has(module);
  });
}

function productionFiles(): string[] {
  return fs
    .readdirSync(LOGIC_DIR)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => path.join(LOGIC_DIR, name));
}

describe('findForbiddenImports (comprueba que la guardia detecta de verdad)', () => {
  it.each([
    ["import { eq } from 'drizzle-orm';", 'drizzle-orm'],
    ["import React from 'react';", 'react'],
    ["import { View } from 'react-native';", 'react-native'],
    ["import * as SQLite from 'expo-sqlite';", 'expo-sqlite'],
    ["import { db } from '@/db/schema';", '@/db/schema'],
    ["import type { Db } from '@/db/types';", '@/db/types'],
    ["export * from 'expo-router';", 'expo-router'],
    ["const x = require('react-native');", 'react-native'],
    ["const m = await import('drizzle-orm');", 'drizzle-orm'],
    ["import 'react-native-gesture-handler';", 'react-native-gesture-handler'],
  ])('detecta: %s', (source, expected) => {
    expect(findForbiddenImports(source)).toEqual([expected]);
  });

  it.each([
    "import { calcSubtotal } from './calcSubtotal';",
    "import type { PricePoint } from './pricingTypes';",
    "import { x } from '../otra';",
    "import { KG_PER_PORTION, type Unit } from '@/db/constants';",
    "export * from './index';",
  ])('permite: %s', (source) => {
    expect(findForbiddenImports(source)).toEqual([]);
  });
});

describe('src/logic es código puro', () => {
  it('hay archivos de producción que revisar', () => {
    expect(productionFiles().length).toBeGreaterThanOrEqual(8);
  });

  it('ningún archivo importa base de datos, Expo ni React (solo @/db/constants)', () => {
    const offenders = productionFiles()
      .map((file) => ({ file: path.basename(file), forbidden: findForbiddenImports(fs.readFileSync(file, 'utf8')) }))
      .filter((entry) => entry.forbidden.length > 0);
    expect(offenders).toEqual([]);
  });

  it('@/db/constants no importa nada: sigue siendo solo constantes y funciones puras', () => {
    const constants = fs.readFileSync(path.join(LOGIC_DIR, '..', 'db', 'constants.ts'), 'utf8');
    expect(constants).not.toMatch(/^\s*import\s/m);
    expect(constants).not.toMatch(/require\(/);
  });
});
