import type { Season, SeedItem } from './catalogSeedTypes';
import type { Unit } from '../constants';

/*
 * Ítems de feria de la base inicial (frutas, verduras y otros productos típicos de feria).
 *
 * Investigación del 10 de noviembre de 2026. La lista y las estaciones se armaron combinando:
 *  - ODEPA, "Mejores Alimentos de Temporada" (semana del 2 al 6 de noviembre de 2026), que
 *    muestra qué productos se monitorean en ferias y supermercados y sus unidades de venta;
 *  - guías de temporada de Meteored (verano, otoño, mayo, junio, noviembre) y notas de
 *    ODEPA y prensa sobre los alimentos de temporada de cada estación;
 *  - conocimiento general de lo que se vende en las ferias libres de la zona central.
 * No existe un calendario oficial completo mes a mes: las estaciones indican cuándo cada
 * producto está en su mejor momento en la zona central, y un ítem sin estaciones se vende
 * todo el año.
 *
 * Los precios de este archivo son PROVISORIOS (`estimado`). Los precios con fuente se aplican
 * encima en `odepaPrices.ts`. En ambos casos son aproximados y el usuario puede corregirlos.
 */

type Extra = { aliases?: readonly string[]; note?: string };

const fruta = (name: string, defaultUnit: Unit, referencePrice: number, seasons: readonly Season[], extra: Extra = {}): SeedItem => ({
  name, defaultUnit, referencePrice, category: 'fruta', seasons, priceSource: 'estimado', ...extra,
});

const verdura = (name: string, defaultUnit: Unit, referencePrice: number, seasons: readonly Season[], extra: Extra = {}): SeedItem => ({
  name, defaultUnit, referencePrice, category: 'verdura', seasons, priceSource: 'estimado', ...extra,
});

const otro = (name: string, defaultUnit: Unit, referencePrice: number, seasons: readonly Season[], extra: Extra = {}): SeedItem => ({
  name, defaultUnit, referencePrice, category: 'otro-feria', seasons, priceSource: 'estimado', ...extra,
});

export const FERIA_ITEMS: readonly SeedItem[] = [
  // ── Frutas ────────────────────────────────────────────────────────────────────────────
  fruta('Manzana', 'kg', 1500, ['otono', 'invierno']),
  fruta('Pera', 'kg', 1600, ['verano', 'otono', 'invierno']),
  fruta('Naranja', 'kg', 1000, ['invierno', 'primavera']),
  fruta('Limón', 'kg', 700, ['invierno']),
  fruta('Mandarina', 'kg', 1050, ['otono', 'invierno']),
  fruta('Pomelo', 'kg', 1300, ['invierno']),
  fruta('Kiwi', 'kg', 2500, ['otono', 'invierno']),
  fruta('Palta', 'kg', 4000, [], { note: 'Hass; también se vende por unidad' }),
  fruta('Plátano', 'kg', 1500, [], { aliases: ['Banana'] }),
  fruta('Frutilla', 'kg', 2500, ['primavera', 'verano'], { aliases: ['Fresa'] }),
  fruta('Arándano', 'kg', 7000, ['primavera', 'verano']),
  fruta('Frambuesa', 'kg', 8000, ['verano']),
  fruta('Mora', 'kg', 6000, ['verano']),
  fruta('Cereza', 'kg', 6000, ['primavera', 'verano']),
  fruta('Durazno', 'kg', 1800, ['verano']),
  fruta('Damasco', 'kg', 2000, ['verano']),
  fruta('Ciruela', 'kg', 1700, ['verano']),
  fruta('Nectarín', 'kg', 2000, ['verano'], { aliases: ['Nectarina'] }),
  fruta('Sandía', 'unit', 5000, ['verano'], { note: 'unidad grande' }),
  fruta('Melón', 'unit', 2500, ['verano'], { aliases: ['Melón calameño'] }),
  fruta('Melón tuna', 'unit', 2500, ['verano']),
  fruta('Uva', 'kg', 2500, ['verano', 'otono']),
  fruta('Higo', 'kg', 3000, ['verano', 'otono']),
  fruta('Tuna', 'kg', 1800, ['verano', 'otono']),
  fruta('Granada', 'kg', 3000, ['otono']),
  fruta('Membrillo', 'kg', 1500, ['otono']),
  fruta('Chirimoya', 'kg', 2500, ['otono', 'invierno']),
  fruta('Piña', 'unit', 2500, [], { note: 'unidad mediana' }),
  fruta('Mango', 'kg', 3000, ['primavera', 'verano']),
  fruta('Papaya', 'kg', 2500, []),
  fruta('Lúcuma', 'kg', 3000, ['verano', 'otono']),
  fruta('Níspero', 'kg', 2500, ['primavera']),
  fruta('Pepino dulce', 'kg', 2500, ['verano', 'otono']),
  fruta('Guinda', 'kg', 3000, ['verano']),

  // ── Verduras y hortalizas ──────────────────────────────────────────────────────────────
  verdura('Papa', 'kg', 1250, []),
  verdura('Camote', 'kg', 1500, ['otono', 'invierno']),
  verdura('Cebolla', 'kg', 1500, []),
  verdura('Cebolla morada', 'kg', 2000, []),
  verdura('Ajo', 'unit', 300, ['verano', 'otono'], { note: 'cabeza' }),
  verdura('Tomate', 'kg', 1750, ['verano', 'otono']),
  verdura('Tomate cherry', 'kg', 3500, ['verano']),
  verdura('Zanahoria', 'kg', 1500, ['otono', 'invierno', 'primavera']),
  verdura('Betarraga', 'kg', 1200, ['otono', 'invierno', 'primavera'], { aliases: ['Remolacha'] }),
  verdura('Nabo', 'kg', 1200, ['otono', 'invierno']),
  verdura('Rábano', 'unit', 800, ['invierno', 'primavera'], { note: 'atado' }),
  verdura('Apio', 'unit', 1600, ['invierno', 'primavera']),
  verdura('Puerro', 'unit', 1000, ['otono', 'invierno'], { aliases: ['Porrón'] }),
  verdura('Cebollín', 'unit', 700, ['primavera', 'verano'], { note: 'atado' }),
  verdura('Zapallo', 'kg', 2400, ['otono', 'invierno'], { aliases: ['Zapallo camote'] }),
  verdura('Zapallo italiano', 'unit', 400, ['primavera', 'verano']),
  verdura('Pepino', 'unit', 470, ['primavera', 'verano'], { aliases: ['Pepino ensalada'] }),
  verdura('Berenjena', 'kg', 2000, ['verano', 'otono']),
  verdura('Pimentón', 'unit', 1200, ['verano', 'otono'], { aliases: ['Pimiento'] }),
  verdura('Ají', 'kg', 3500, ['verano']),
  verdura('Choclo', 'unit', 1100, ['verano', 'otono'], { aliases: ['Maíz'] }),
  verdura('Poroto verde', 'kg', 2800, ['verano', 'otono']),
  verdura('Haba', 'kg', 1200, ['primavera']),
  verdura('Arveja', 'kg', 1750, ['primavera']),
  verdura('Poroto granado', 'kg', 2500, ['verano', 'otono']),
  verdura('Alcachofa', 'unit', 520, ['otono', 'invierno', 'primavera']),
  verdura('Espárrago', 'unit', 2500, ['primavera'], { note: 'atado' }),
  verdura('Brócoli', 'unit', 1320, ['otono', 'invierno', 'primavera']),
  verdura('Coliflor', 'unit', 1350, ['otono', 'invierno', 'primavera']),
  verdura('Repollo', 'unit', 2000, ['otono', 'invierno']),
  verdura('Repollo morado', 'unit', 2200, ['otono', 'invierno']),
  verdura('Repollito de Bruselas', 'kg', 4000, ['invierno'], { aliases: ['Col de Bruselas'] }),
  verdura('Lechuga', 'unit', 1240, ['otono', 'invierno', 'primavera', 'verano']),
  verdura('Escarola', 'unit', 1245, ['otono', 'invierno', 'primavera']),
  verdura('Espinaca', 'kg', 2400, ['otono', 'invierno', 'primavera']),
  verdura('Acelga', 'unit', 1000, ['otono', 'invierno', 'primavera'], { note: 'atado' }),
  verdura('Rúcula', 'unit', 800, ['primavera', 'verano'], { note: 'atado' }),
  verdura('Cilantro', 'unit', 500, [], { note: 'atado' }),
  verdura('Perejil', 'unit', 500, [], { note: 'atado' }),
  verdura('Albahaca', 'unit', 800, ['primavera', 'verano'], { note: 'atado' }),
  verdura('Menta', 'unit', 600, ['primavera', 'verano'], { note: 'atado' }),
  verdura('Romero', 'unit', 500, [], { note: 'atado' }),
  verdura('Champiñón', 'kg', 5000, []),
  verdura('Hinojo', 'unit', 1500, ['otono', 'invierno']),
  verdura('Jengibre', 'kg', 4000, []),

  // ── Otros productos de feria ───────────────────────────────────────────────────────────
  otro('Huevos', 'unit', 206, [], { note: 'precio por huevo; se venden por docena o bandeja' }),
  otro('Garbanzos', 'kg', 3300, []),
  otro('Lentejas', 'kg', 3200, []),
  otro('Poroto tórtola', 'kg', 3300, []),
  otro('Porotos negros', 'kg', 3500, [], { aliases: ['Poroto negro'] }),
  otro('Aceitunas', 'quarter_kg', 6000, [], { note: 'precio por kilo; se compran en cuartos' }),
  otro('Nueces', 'quarter_kg', 12000, ['otono'], { note: 'precio por kilo; se compran en cuartos' }),
  otro('Almendras', 'quarter_kg', 15000, [], { note: 'precio por kilo; se compran en cuartos' }),
  otro('Maní', 'quarter_kg', 5000, [], { note: 'precio por kilo; se compran en cuartos' }),
  otro('Pasas', 'quarter_kg', 6000, [], { note: 'precio por kilo; se compran en cuartos' }),
  otro('Ciruelas secas', 'quarter_kg', 7000, [], { aliases: ['Ciruelas deshidratadas'], note: 'precio por kilo; se compran en cuartos' }),
  otro('Orégano', 'unit', 1200, [], { note: 'bolsa de orégano seco' }),
  otro('Merkén', 'unit', 2500, [], { note: 'bolsa o pote pequeño' }),
  otro('Cochayuyo', 'unit', 1500, [], { note: 'atado' }),
  otro('Mote', 'kg', 2500, []),
  otro('Porotos blancos', 'kg', 3500, [], { aliases: ['Poroto blanco'] }),
];
