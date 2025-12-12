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
            <Stack.Screen name="profile" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="capabilities" />
        </Stack>
    );
}
