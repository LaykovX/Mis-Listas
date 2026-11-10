import type { SeedItem } from './catalogSeedTypes';
import type { Unit } from '../constants';

/*
 * Ítems de supermercado de la base inicial: productos de uso cotidiano, con nombres genéricos
 * (sin marca ni tamaño). El tamaño más común va en `note`.
 *
 * Investigación del 10 de noviembre de 2026. La lista se armó a partir de:
 *  - ODEPA, "Mejores Alimentos de Temporada" (semana del 2 al 6 de noviembre de 2026), que
 *    monitorea productos de góndola (pan, huevos, lácteos, abarrotes, carnes y pollo) y sus
 *    unidades de venta;
 *  - el uso habitual de los hogares chilenos (abarrotes, lácteos, carnes, bebidas, aseo e
 *    higiene).
 *
 * Qué significa el precio: para `unit`, el precio de UNA unidad típica (un paquete, una caja o
 * una botella del tamaño de la nota); para `kg`, el precio por kilo. Los precios de este
 * archivo son PROVISORIOS (`estimado`); los precios con fuente se aplican encima en
 * `odepaPrices.ts`. En ambos casos son aproximados y el usuario puede corregirlos.
 */

type Extra = { aliases?: readonly string[]; note?: string };

const sm = (name: string, defaultUnit: Unit, referencePrice: number, extra: Extra = {}): SeedItem => ({
  name, defaultUnit, referencePrice, category: 'supermercado', seasons: [], priceSource: 'estimado', ...extra,
});

export const SUPERMERCADO_ITEMS: readonly SeedItem[] = [
  // ── Abarrotes ──────────────────────────────────────────────────────────────────────────
  sm('Arroz', 'unit', 2000, { note: 'paquete de 1 kg' }),
  sm('Fideos', 'unit', 1000, { note: 'paquete de 400 g', aliases: ['Tallarines', 'Espagueti'] }),
  sm('Azúcar', 'unit', 1300, { note: 'paquete de 1 kg' }),
  sm('Harina', 'unit', 1300, { note: 'paquete de 1 kg' }),
  sm('Sal', 'unit', 600, { note: 'paquete de 1 kg' }),
  sm('Aceite', 'unit', 3200, { note: 'botella de 1 litro' }),
  sm('Vinagre', 'unit', 900, { note: 'botella de 500 ml' }),
  sm('Salsa de tomate', 'unit', 700, { note: 'bolsa de 200 g' }),
  sm('Atún en conserva', 'unit', 1500, { note: 'lata de 170 g' }),
  sm('Sardinas en conserva', 'unit', 1200, { note: 'lata' }),
  sm('Mayonesa', 'unit', 2200, { note: 'pote de 400 g' }),
  sm('Ketchup', 'unit', 1900, { note: 'botella de 400 g' }),
  sm('Mostaza', 'unit', 1500, { note: 'pote de 250 g' }),
  sm('Mermelada', 'unit', 2000, { note: 'frasco de 250 g' }),
  sm('Manjar', 'unit', 1500, { note: 'pote de 250 g', aliases: ['Dulce de leche'] }),
  sm('Miel', 'unit', 5000, { note: 'frasco de 500 g' }),
  sm('Café', 'unit', 6500, { note: 'frasco de 170 g' }),
  sm('Té', 'unit', 1500, { note: 'caja de 20 bolsitas' }),
  sm('Cereal', 'unit', 4000, { note: 'caja de 500 g' }),
  sm('Avena', 'unit', 1800, { note: 'bolsa de 500 g' }),
  sm('Galletas', 'unit', 900, { note: 'paquete' }),
  sm('Chocolate', 'unit', 1500, { note: 'barra de 100 g' }),
  sm('Papas fritas', 'unit', 1200, { note: 'bolsa' }),

  // ── Panadería ──────────────────────────────────────────────────────────────────────────
  sm('Marraqueta', 'kg', 2400, { aliases: ['Pan batido'] }),
  sm('Hallulla', 'kg', 2500),
  sm('Pan de molde', 'unit', 2500, { note: 'bolsa de 500 g' }),

  // ── Lácteos ────────────────────────────────────────────────────────────────────────────
  sm('Leche', 'unit', 1100, { note: 'caja de 1 litro' }),
  sm('Leche en polvo', 'unit', 7500, { note: 'bolsa de 800 g' }),
  sm('Yogur', 'unit', 2000, { note: 'bolsa de 1 kg', aliases: ['Yoghurt'] }),
  sm('Queso', 'kg', 11000, { aliases: ['Queso gauda'] }),
  sm('Mantequilla', 'unit', 3200, { note: 'barra de 250 g' }),
  sm('Margarina', 'unit', 2300, { note: 'pote de 500 g' }),
  sm('Crema', 'unit', 1300, { note: 'caja de 200 ml' }),

  // ── Carnes y aves ──────────────────────────────────────────────────────────────────────
  sm('Pollo entero', 'kg', 4100),
  sm('Pechuga de pollo', 'kg', 4500),
  sm('Trutros de pollo', 'kg', 3500, { aliases: ['Trutro de pollo'] }),
  sm('Carne molida', 'kg', 7500),
  sm('Posta negra', 'kg', 12800),
  sm('Asado de tira', 'kg', 12900),
  sm('Lomo liso', 'kg', 17200),
  sm('Osobuco', 'kg', 11500),
  sm('Chuleta de cerdo', 'kg', 4800),
  sm('Costillar de cerdo', 'kg', 7400),
  sm('Lomo de cerdo', 'kg', 7000),

  // ── Embutidos ──────────────────────────────────────────────────────────────────────────
  sm('Jamón', 'unit', 2500, { note: 'paquete de 250 g' }),
  sm('Vienesas', 'unit', 2200, { note: 'paquete' }),
  sm('Longaniza', 'kg', 6500),

  // ── Bebidas ────────────────────────────────────────────────────────────────────────────
  sm('Bebida gaseosa', 'unit', 1800, { note: 'botella de 1,5 litros', aliases: ['Bebida'] }),
  sm('Jugo', 'unit', 1500, { note: 'caja de 1 litro' }),
  sm('Agua mineral', 'unit', 800, { note: 'botella de 1,5 litros' }),
  sm('Cerveza', 'unit', 1100, { note: 'lata' }),
  sm('Vino', 'unit', 4500, { note: 'botella' }),

  // ── Aseo del hogar ─────────────────────────────────────────────────────────────────────
  sm('Detergente', 'unit', 7500, { note: 'bolsa de 3 kg, para ropa', aliases: ['Detergente para ropa'] }),
  sm('Lavalozas', 'unit', 2000, { note: 'botella de 750 ml', aliases: ['Lavaloza'] }),
  sm('Cloro', 'unit', 1000, { note: 'botella de 1 litro' }),
  sm('Limpiador de piso', 'unit', 2000, { note: 'botella' }),
  sm('Suavizante', 'unit', 4000, { note: 'botella' }),
  sm('Papel higiénico', 'unit', 4500, { note: 'paquete de 8 rollos' }),
  sm('Toalla de papel', 'unit', 2500, { note: 'paquete' }),
  sm('Bolsas de basura', 'unit', 2200, { note: 'paquete' }),
  sm('Esponja', 'unit', 1200, { note: 'paquete' }),

  // ── Higiene personal ───────────────────────────────────────────────────────────────────
  sm('Champú', 'unit', 3000, { note: 'botella', aliases: ['Shampoo'] }),
  sm('Jabón', 'unit', 2500, { note: 'paquete de barras' }),
  sm('Pasta de dientes', 'unit', 1800, { note: 'tubo', aliases: ['Dentífrico'] }),
  sm('Cepillo de dientes', 'unit', 1500),
  sm('Desodorante', 'unit', 3000),
  sm('Toallas higiénicas', 'unit', 2500, { note: 'paquete' }),
  sm('Pañales', 'unit', 9000, { note: 'paquete' }),

  // ── Congelados y otros ─────────────────────────────────────────────────────────────────
  sm('Helado', 'unit', 3500, { note: 'pote de 1 litro' }),
  sm('Arvejas congeladas', 'unit', 1800, { note: 'bolsa' }),
];
