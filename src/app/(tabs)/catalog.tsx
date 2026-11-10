import React from 'react';

import { EmptyState } from '@/components/EmptyState';
import { t } from '@/strings';

export default function CatalogTab() {
  return (
    <EmptyState
      testID="catalog-empty-state"
      icon="food-apple-outline"
      title={t.empty.catalogTitle}
      hint={t.empty.catalogHint}
    />
  );
}
