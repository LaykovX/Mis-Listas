import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

import { DatabaseErrorScreen } from '@/components/DatabaseErrorScreen';
import { t } from '@/strings';

import migrations from '../../drizzle/migrations';
import { openDatabase } from './client';
import { ensureDefaultTags } from './seed';
import type * as schema from './schema';
import type { Db } from './types';

export type DatabaseConnection = ExpoSQLiteDatabase<typeof schema>;

const DbContext = createContext<Db | null>(null);

/** Base de datos de la app. Solo se puede usar dentro de DatabaseProvider. */
export function useDb(): Db {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb debe usarse dentro de un DatabaseProvider');
  return db;
}

/** Entrega una base que ya está abierta a los componentes hijos. Se usa en las pruebas. */
export function DatabaseContextProvider({ db, children }: { db: Db; children: React.ReactNode }) {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

interface DatabaseProviderProps {
  children: React.ReactNode;
  /** Solo para pruebas: permite inyectar otra forma de abrir la base. */
  openDb?: () => DatabaseConnection;
}

function LoadingScreen() {
  const theme = useTheme();
  return (
    <View testID="database-loading" style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator animating accessibilityLabel={t.database.loading} />
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t.database.loading}
      </Text>
    </View>
  );
}

function MigratedDatabase({ db, children }: { db: DatabaseConnection; children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedFailed, setSeedFailed] = useState(false);

  useEffect(() => {
    if (!success || seeded) return;
    try {
      ensureDefaultTags(db);
      setSeeded(true);
    } catch (e) {
      console.error('No se pudieron crear las etiquetas iniciales', e);
      setSeedFailed(true);
    }
  }, [success, seeded, db]);

  useEffect(() => {
    if (error) console.error('Falló la migración de la base de datos', error);
  }, [error]);

  if (error) return <DatabaseErrorScreen />;
  if (seedFailed) return <DatabaseErrorScreen />;
  if (!success || !seeded) return <LoadingScreen />;

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function DatabaseProvider({ children, openDb = openDatabase }: DatabaseProviderProps) {
  const [connection] = useState<{ db: DatabaseConnection } | { failed: true }>(() => {
    try {
      return { db: openDb() };
    } catch (e) {
      console.error('No se pudo abrir la base de datos', e);
      return { failed: true };
    }
  });

  if ('failed' in connection) return <DatabaseErrorScreen />;
  return <MigratedDatabase db={connection.db}>{children}</MigratedDatabase>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
