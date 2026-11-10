import type { PriceSource, SeedItem } from './catalogSeedTypes';

/*
 * Precios de referencia con fuente, tomados de ODEPA (Oficina de Estudios y Políticas Agrarias).
 *
 * Fuente: "Mejores Alimentos de Temporada" (https://www.odepa.gob.cl/precios/mejores-alimentos-de-temporada),
 * tabla de la Región Metropolitana, semana del 2 al 6 de noviembre de 2026 ("Reporte
 * actualizado al 06/11/2026"). La página publica, por producto, el "Precio promedio canal
 * tradicional" (ferias libres, carnicerías, panaderías, según corresponda) y el "Precio
 * promedio supermercados". Las cifras están en pesos, por kilo o por la unidad indicada.
 *
 * Cómo leer este archivo:
 *  - Cada fila es `[producto tal como lo publica ODEPA, unidad publicada, precio]`, copiada sin
 *    cambios. El precio de un ítem es el promedio de sus filas, dividido por `divisor` si la
 *    unidad publicada no es la del ítem (huevos por docena a por unidad; miel por kilo a frasco
 *    de medio kilo), redondeado al peso.
 *  - `canal`: `feria` usa el precio de canal tradicional; `supermercado`, el de supermercados.
 *    Algunos productos aparecen con un solo precio porque ODEPA solo lo publica en un canal
 *    (arveja, haba, choclo y cereza solo en canal tradicional; lácteos y abarrotes solo en
 *    supermercados): se usa la columna en que aparecen.
 *  - Solo se incluyen filas cuya transcripción es clara.
 *  - Verificación independiente del 10 de noviembre de 2026: las 66 filas de este archivo se
 *    compararon, una por una, con el HTML de la página y coinciden (nombres, unidades,
 *    cifras y columnas).
 *
 * Exclusiones deliberadas (cifra textual de ODEPA, pero incoherente):
 *  - Frutilla: ODEPA publica 1.332 por kilo en canal tradicional, y 8.150 en supermercados
 *    (otras regiones: 6.400 en Arica, 2.833 en Coquimbo). La cifra de feria parece un error
 *    de ODEPA, así que Frutilla queda como `estimado`.
 *  - Sandía: ODEPA publica 3.125 por unidad y 1.767 por kilo en canal tradicional, lo que
 *    implicaría una sandía de menos de 2 kg (una típica pesa entre 6 y 10 kg). Queda como
 *    `estimado`.
 *
 * Cobertura final de precios con fuente (sobre 165 ítems): feria 34 de 95 (35,8%) y supermercado
 * 21 de 70 (30,0%); los otros 110 ítems llevan un precio ESTIMADO, o sea la mayoría. Una prueba
 * (`odepaPrices.test.ts`) fija estas cifras para que el reporte no se desactualice.
 *
 * Son precios aproximados de una semana: el usuario puede corregirlos.
 *
 * Qué NO tiene fuente: los ítems que ODEPA no publica en esa tabla quedan como `estimado`.
 * El 10 de noviembre de 2026 se buscaron además precios minoristas de feria en prensa (DF y
 * notas de ODEPA) y en boletines mayoristas para esos ítems, y no se encontró ninguno que
 * indicara producto, unidad y fecha reciente de forma comparable: los resultados eran de otros
 * países, de precios mayoristas (que subestiman lo que se paga en feria) o sin unidad clara.
 * Por eso no se usaron. La serie semanal completa de precios de ferias de ODEPA está en un
 * panel dinámico (Power BI) que no se pudo leer.
 */

export const ODEPA_MONTH = '2026-11';

type Row = readonly [product: string, printedUnit: string, price: number];

export interface OdepaEntry {
  /** Nombre exacto del ítem en la lista de feria o de supermercado. */
  item: string;
  channel: 'feria' | 'supermercado';
  rows: readonly Row[];
  /** Para pasar del precio publicado al precio por la unidad del ítem. */
  divisor?: number;
}

export const ODEPA_ENTRIES: readonly OdepaEntry[] = [
  // ── Frutas (canal tradicional) ─────────────────────────────────────────────────────────
  { item: 'Arándano', channel: 'feria', rows: [['Arándano (blue) Primera', 'kg', 7167]] },
  { item: 'Kiwi', channel: 'feria', rows: [['Kiwi Hayward Primera', 'kg', 2544]] },
  { item: 'Limón', channel: 'feria', rows: [['Limón 1a amarillo', 'kg', 657], ['Limón 1a plateado', 'kg', 736]] },
  { item: 'Mandarina', channel: 'feria', rows: [['Mandarina Murcott Primera', 'kg', 1048]] },
  { item: 'Manzana', channel: 'feria', rows: [['Manzana Fuji royal Primera', 'kg', 1577], ['Manzana Granny Smith Primera', 'kg', 1543]] },
  { item: 'Naranja', channel: 'feria', rows: [['Naranja Lane Late Primera', 'kg', 1002], ['Naranja Navel Late Primera', 'kg', 1002]] },
  { item: 'Palta', channel: 'feria', rows: [['Palta Hass Primera', 'kg', 4138]] },
  { item: 'Pera', channel: 'feria', rows: [['Pera Packham\'s Triumph Primera', 'kg', 1588]] },
  { item: 'Tuna', channel: 'feria', rows: [['Tuna Primera', 'kg', 1800]] },

  // ── Verduras y hortalizas (canal tradicional) ──────────────────────────────────────────
  { item: 'Alcachofa', channel: 'feria', rows: [['Alcachofa Argentina(o) Primera', 'und.', 510], ['Alcachofa Española Primera', 'und.', 526]] },
  { item: 'Apio', channel: 'feria', rows: [['Apio Americana (o) Primera', 'und.', 1632]] },
  { item: 'Brócoli', channel: 'feria', rows: [['Brócoli Primera', 'und.', 1320]] },
  { item: 'Cebolla', channel: 'feria', rows: [['Cebolla 1a (guarda)', 'kg', 1525]] },
  { item: 'Coliflor', channel: 'feria', rows: [['Coliflor Primera', 'und.', 1343]] },
  { item: 'Espinaca', channel: 'feria', rows: [['Espinaca Primera', 'kg', 2365]] },
  { item: 'Lechuga', channel: 'feria', rows: [['Lechuga Conconina(o) Primera', 'und.', 1240]] },
  { item: 'Escarola', channel: 'feria', rows: [['Lechuga Escarola Primera', 'und.', 1245]] },
  { item: 'Papa', channel: 'feria', rows: [['Papa Asterix Primera', 'kg', 1226], ['Papa Patagonia Primera', 'kg', 1229]] },
  { item: 'Pepino', channel: 'feria', rows: [['Pepino ensalada Primera', 'und.', 471]] },
  {
    item: 'Pimentón',
    channel: 'feria',
    rows: [['Pimiento Cuatro cascos verde Primera', 'und.', 1094], ['Pimiento Zafiro rojo Primera', 'und.', 1385], ['Pimiento Zafiro verde Primera', 'und.', 1183]],
  },
  { item: 'Poroto verde', channel: 'feria', rows: [['Poroto verde Magnum Primera', 'kg', 2744], ['Poroto verde Primera', 'kg', 2907]] },
  { item: 'Repollo', channel: 'feria', rows: [['Repollo Crespo record Primera', 'und.', 2571]] },
  { item: 'Tomate', channel: 'feria', rows: [['Tomate Larga vida Primera', 'kg', 1762]] },
  { item: 'Zanahoria', channel: 'feria', rows: [['Zanahoria Primera', 'kg', 1540]] },
  { item: 'Zapallo', channel: 'feria', rows: [['Zapallo Camote 1a (guarda)', 'kg', 2377]] },
  { item: 'Zapallo italiano', channel: 'feria', rows: [['Zapallo italiano Primera', 'und.', 407]] },

  // ── Otros productos de feria (canal tradicional) ───────────────────────────────────────
  { item: 'Huevos', channel: 'feria', rows: [['Huevo blanco', 'docena', 2470]], divisor: 12 },
  { item: 'Garbanzos', channel: 'feria', rows: [['Garbanzos sin piel', 'kg', 3290]] },
  { item: 'Lentejas', channel: 'feria', rows: [['Lentejas 6 mm', 'kg', 3190]] },
  { item: 'Poroto tórtola', channel: 'feria', rows: [['Poroto Tórtola', 'kg', 3277]] },

  // ── Feria: productos que ODEPA publica solo en canal tradicional ───────────────────────────────────────────
  { item: 'Arveja', channel: 'feria', rows: [['Arveja Verde', 'kg', 1752]] },
  { item: 'Haba', channel: 'feria', rows: [['Haba Primera', 'kg', 665]] },
  { item: 'Choclo', channel: 'feria', rows: [['Choclo Dulce o Americano Primera', 'und.', 1097]] },
  { item: 'Cereza', channel: 'feria', rows: [['Cereza Brooks Primera', 'kg', 3080], ['Cereza Sweet Heart Primera', 'kg', 3077]] },

  // ── Supermercado (precio de supermercados) ─────────────────────────────────────────────
  { item: 'Hallulla', channel: 'supermercado', rows: [['Hallulla corriente', 'kg', 2129]] },
  { item: 'Marraqueta', channel: 'supermercado', rows: [['Marraqueta', 'kg', 2136]] },
  { item: 'Pollo entero', channel: 'supermercado', rows: [['Pollo Entero', 'kg', 3702]] },
  { item: 'Pechuga de pollo', channel: 'supermercado', rows: [['Pollo Pechuga', 'kg', 4832]] },
  { item: 'Trutros de pollo', channel: 'supermercado', rows: [['Pollo Trutro Entero', 'kg', 3644]] },
  { item: 'Posta negra', channel: 'supermercado', rows: [['Posta Negra', 'kg', 12086]] },
  { item: 'Lomo liso', channel: 'supermercado', rows: [['Lomo Liso', 'kg', 16323]] },
  { item: 'Osobuco', channel: 'supermercado', rows: [['Osobuco', 'kg', 11890]] },
  { item: 'Asado de tira', channel: 'supermercado', rows: [['Asado de tira', 'kg', 19990]] },
  { item: 'Chuleta de cerdo', channel: 'supermercado', rows: [['Chuleta (centro)', 'kg', 5637], ['Chuleta (Parrillera)', 'kg', 5620]] },
  { item: 'Costillar de cerdo', channel: 'supermercado', rows: [['Cerdo Costillar', 'kg', 8783]] },
  { item: 'Lomo de cerdo', channel: 'supermercado', rows: [['Cerdo Lomo', 'kg', 7407]] },

  // ── Supermercado: productos que ODEPA publica solo en supermercados ────────────────────────────────────
  { item: 'Leche', channel: 'supermercado', rows: [['Leche Fluida Entera', 'L', 1123]] },
  { item: 'Leche en polvo', channel: 'supermercado', rows: [['Leche en Polvo Entera Bolsa 800 Grs', 'bolsa', 7458]] },
  { item: 'Margarina', channel: 'supermercado', rows: [['Margarina Pote 500 Gramos', 'pote', 2329]] },
  { item: 'Queso', channel: 'supermercado', rows: [['Queso Gauda', 'kg', 11082]] },
  { item: 'Yogur', channel: 'supermercado', rows: [['Yoghurt Bolsa 1 Kilo', 'bolsa', 1984]] },
  { item: 'Arroz', channel: 'supermercado', rows: [['Arroz grano ancho grado 1', 'kg', 2123]], divisor: 1 },
  { item: 'Harina', channel: 'supermercado', rows: [['Harina sin polvos de hornear', 'kg', 1313]], divisor: 1 },
  { item: 'Miel', channel: 'supermercado', rows: [['Miel', 'kg', 10212]], divisor: 2 },
  { item: 'Fideos', channel: 'supermercado', rows: [['Spaghetti N°5 Envase 400 Gramos', 'envase', 1012]] },
];

/**
 * Aplica los precios de ODEPA sobre una lista de ítems. Devuelve una lista nueva, en el mismo
 * orden; los ítems sin precio publicado no se tocan. No modifica la lista recibida.
 */
export function applyOdepaPrices(items: readonly SeedItem[]): SeedItem[] {
  const entries = new Map(ODEPA_ENTRIES.map((entry) => [entry.item, entry]));
  return items.map((item) => {
    const entry = entries.get(item.name);
    if (!entry) return item;

    const average = entry.rows.reduce((sum, [, , price]) => sum + price, 0) / entry.rows.length;
    const referencePrice = Math.round(average / (entry.divisor ?? 1));
    return {
      ...item,
      referencePrice,
      priceSource: (entry.channel === 'feria' ? 'odepa-feria' : 'odepa-supermercado') satisfies PriceSource,
      priceMonth: ODEPA_MONTH,
    };
  });
}
