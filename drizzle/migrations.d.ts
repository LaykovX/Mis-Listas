// Tipos para drizzle/migrations.js, que genera drizzle-kit (y que no trae tipos).
declare const migrations: {
  journal: {
    entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
};

export default migrations;
