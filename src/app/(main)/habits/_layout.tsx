import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function HabitsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="habits-list"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="goals-list"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}