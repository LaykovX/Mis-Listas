import type { SeedItem } from './catalogSeedTypes';
import { FERIA_ITEMS } from './feriaItems';
import { applyOdepaPrices } from './odepaPrices';
import { SUPERMERCADO_ITEMS } from './supermercadoItems';

/**
 * Todos los ítems iniciales de la base: feria y supermercado, con los precios de ODEPA
 * aplicados donde hay fuente. El resto queda con su precio estimado.
 */
export const ALL_SEED_ITEMS: readonly SeedItem[] = applyOdepaPrices([...FERIA_ITEMS, ...SUPERMERCADO_ITEMS]);

export type { SeedItem } from './catalogSeedTypes';
