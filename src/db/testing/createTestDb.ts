import fs from 'fs';
import path from 'path';

import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

import * as schema from '../schema';

export interface TestDb {
  db: SQLJsDatabase<typeof schema>;
  /** Acceso directo a SQLite para consultas crudas en las pruebas. */
  sqlite: Database;
  close: () => void;
}

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'drizzle');

let sqlJs: Promise<SqlJsStatic> | undefined;

function loadSqlJs(): Promise<SqlJsStatic> {
  sqlJs ??= initSqlJs();
  return sqlJs;
}

/** Lee los archivos .sql de drizzle/ en el orden que indica el diario de migraciones. */
function readMigrationFiles(): string[] {
  const journalPath = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as { entries: { tag: string }[] };
  return journal.entries.map((entry) =>
    fs.readFileSync(path.join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf8'),
  );
}

/**
 * Crea una base SQLite en memoria con las migraciones reales de la app y las claves
 * foráneas activas. Cada prueba recibe una base nueva y vacía.
 */
export async function createTestDb(): Promise<TestDb> {
  const SQL = await loadSqlJs();
  const sqlite = new SQL.Database();
  sqlite.run('PRAGMA foreign_keys = ON');
  for (const migration of readMigrationFiles()) {
    sqlite.exec(migration.replace(/--> statement-breakpoint/g, ''));
  }
  const db = drizzle(sqlite, { schema });
  return { db, sqlite, close: () => sqlite.close() };
}
