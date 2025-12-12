import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

/**
 * Profile section stack layout
 */
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.dark.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
