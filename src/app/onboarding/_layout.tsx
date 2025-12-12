import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="bedtime" />
      <Stack.Screen name="capabilities" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="quick-preferences" />
    </Stack>
  );
}
