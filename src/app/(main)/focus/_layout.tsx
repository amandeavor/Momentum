import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

/**
 * Focus section layout
 * Contains: Pomodoro timer, breathing exercises, urge surfing, focus sessions
 */
export default function FocusLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="breathing" 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="urge-surfing" 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}