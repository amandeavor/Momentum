import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

/**
 * Auth layout - handles login, register, forgot-password screens
 * Simple stack navigator with slide animations
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="terms" 
        options={{ 
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ 
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}