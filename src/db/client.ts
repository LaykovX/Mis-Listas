import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'lista-de-feria.db';

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const sqlite = openDatabaseSync(DATABASE_NAME);
  try {
    sqlite.execSync('PRAGMA foreign_keys = ON');
    return drizzle(sqlite, { schema });
  } catch (error) {
    // No dejar una conexión abierta a medias: un reintento abriría otra sobre el mismo archivo.
    sqlite.closeSync();
    throw error;
  }
}

/**
 * Abre la base SQLite local del teléfono (sin red) con las claves foráneas activas.
 * La app usa una sola conexión: llamarla varias veces devuelve la misma. Si abrirla falla,
 * no se guarda nada y una llamada posterior vuelve a intentarlo.
 */
export function openDatabase() {
  database ??= createDatabase();
  return database;
}
