import React from 'react';
import { Button } from 'react-native-paper';

import { scaleFontSize } from '@/theme/sizes';
import { useSizes } from '@/theme/SizeContext';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text';
  disabled?: boolean;
  testID?: string;
}

/** Botón que respeta el alto mínimo táctil y la escala del modo "texto y botones grandes". */
export function AppButton({ label, onPress, mode = 'contained', disabled, testID }: AppButtonProps) {
  const { sizes } = useSizes();
  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={label}
      style={{ minHeight: sizes.buttonMinHeight, justifyContent: 'center' }}
      contentStyle={{ minHeight: sizes.buttonMinHeight }}
      labelStyle={{ fontSize: scaleFontSize(16, sizes) }}
    >
      {label}
    </Button>
  );
}
