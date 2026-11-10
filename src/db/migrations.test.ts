import fs from 'fs';
import os from 'os';
import path from 'path';

import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs, { type Database } from 'sql.js';

const REAL_MIGRATIONS = path.join(__dirname, '..', '..', 'drizzle');

let folder: string;
let sqlite: Database;

beforeEach(async () => {
  folder = fs.mkdtempSync(path.join(os.tmpdir(), 'lista-de-feria-migrations-'));
  fs.mkdirSync(path.join(folder, 'meta'));
  const SQL = await initSqlJs();
  sqlite = new SQL.Database();
  sqlite.run('PRAGMA foreign_keys = ON');
});

afterEach(() => {
  sqlite.close();
  fs.rmSync(folder, { recursive: true, force: true });
});

function writeMigrations(extra?: { tag: string; sql: string }) {
  const journal = JSON.parse(fs.readFileSync(path.join(REAL_MIGRATIONS, 'meta', '_journal.json'), 'utf8'));
  const first = journal.entries[0];
  fs.copyFileSync(path.join(REAL_MIGRATIONS, `${first.tag}.sql`), path.join(folder, `${first.tag}.sql`));
  const entries = [first];
  if (extra) {
    fs.writeFileSync(path.join(folder, `${extra.tag}.sql`), extra.sql);
    entries.push({ idx: 1, version: first.version, when: first.when + 1000, tag: extra.tag, breakpoints: true });
  }
  fs.writeFileSync(path.join(folder, 'meta', '_journal.json'), JSON.stringify({ ...journal, entries }));
}

const tagColumns = () => sqlite.exec('PRAGMA table_info(tags)')[0].values.map((row) => String(row[1]));
const tagCount = () => Number(sqlite.exec('SELECT COUNT(*) FROM tags')[0].values[0][0]);

describe('migraciones de la base de datos', () => {
  it('la migración inicial real se aplica sobre una base vacía', () => {
    writeMigrations();
    migrate(drizzle(sqlite), { migrationsFolder: folder });
    expect(tagColumns()).toEqual(['id', 'kind', 'slug', 'name', 'color', 'created_at']);
  });

  it('una migración que falla no modifica la estructura ni los datos existentes', () => {
    writeMigrations();
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: folder });
    sqlite.run("INSERT INTO tags (kind, slug, created_at) VALUES ('parent', 'feria', '2026-11-10T00:00:00.000Z')");
    sqlite.run(
      "INSERT INTO tags (kind, name, color, created_at) VALUES ('site', 'feria las condes', '#2E7D32', '2026-11-10T00:00:00.000Z')",
    );

    // La primera sentencia es válida; la segunda falla. Todo debe deshacerse.
    writeMigrations({
      tag: '0001_falla',
      sql: 'ALTER TABLE `tags` ADD `extra` text;--> statement-breakpoint\nINSERT INTO `tabla_que_no_existe` VALUES (1);',
    });
    expect(() => migrate(db, { migrationsFolder: folder })).toThrow();

    expect(tagColumns()).not.toContain('extra');
    expect(tagCount()).toBe(2);
    expect(sqlite.exec('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('volver a migrar sin cambios no repite ni rompe nada', () => {
    writeMigrations();
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: folder });
    sqlite.run("INSERT INTO tags (kind, slug, created_at) VALUES ('parent', 'feria', '2026-11-10T00:00:00.000Z')");
    migrate(db, { migrationsFolder: folder });
    expect(tagCount()).toBe(1);
  });
});
