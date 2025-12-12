import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function ScheduleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
