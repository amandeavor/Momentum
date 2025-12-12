import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function AuthCallbackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
