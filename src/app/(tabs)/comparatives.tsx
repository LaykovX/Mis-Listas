import React from 'react';

import { EmptyState } from '@/components/EmptyState';
import { t } from '@/strings';

export default function ComparativesTab() {
  return (
    <EmptyState
      testID="comparatives-empty-state"
      icon="chart-line"
      title={t.empty.comparativesTitle}
      hint={t.empty.comparativesHint}
    />
  );
}
