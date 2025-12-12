import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

import { store, persistor } from '@/store';
import { ThemeProvider } from '@/theme';
import { AuthProvider } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';
import { applySupabaseAuthSessionFromUrl } from '@/services/supabase';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Handle deep links for auth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      await applySupabaseAuthSessionFromUrl(event.url);
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider initialMode="dark">
              <AuthProvider>
                <StatusBar style="light" backgroundColor={colors.background} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'fade',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="streak" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
                  <Stack.Screen name="auth" options={{ animation: 'fade' }} />
                </Stack>
              </AuthProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
