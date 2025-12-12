import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

/**
 * Journal section layout
 * Contains: Journal entries list
 */
export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
