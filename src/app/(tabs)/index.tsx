import React from 'react';

import { EmptyState } from '@/components/EmptyState';
import { t } from '@/strings';

export default function ListsTab() {
  return (
    <EmptyState
      testID="lists-empty-state"
      icon="clipboard-list-outline"
      title={t.empty.listsTitle}
      hint={t.empty.listsHint}
    />
  );
}
