/**
 * Friends Screen Layout
 */
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function FriendsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.dark.background,
        },
        headerTitleStyle: {
          color: colors.dark.text,
          fontWeight: '600',
        },
        headerTintColor: colors.dark.text,
        contentStyle: {
          backgroundColor: colors.dark.background,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Friends',
          headerLargeTitle: true,
        }} 
      />
    </Stack>
  );
}
