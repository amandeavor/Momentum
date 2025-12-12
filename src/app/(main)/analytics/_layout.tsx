import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function AnalyticsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
