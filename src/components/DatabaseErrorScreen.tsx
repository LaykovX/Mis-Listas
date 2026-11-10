import React from 'react';

import { EmptyState } from '@/components/EmptyState';
import { t } from '@/strings';

/** Se muestra si la base de datos no se puede abrir o actualizar. No expone detalles técnicos. */
export function DatabaseErrorScreen() {
  return (
    <EmptyState
      testID="database-error-screen"
      icon="database-alert-outline"
      title={t.database.errorTitle}
      hint={t.database.errorHint}
    />
  );
}
