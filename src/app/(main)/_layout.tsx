import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useAppSelector } from '@/store';
import { selectHapticLevel } from '@/store/slices/settingsSlice';
import { selectFriendsEnabled } from '@/store/slices/capabilitiesSlice';
import { useAuth } from '@/hooks/useAuth';

/**
 * Main app layout with bottom tab navigation
 * 5 tabs: Home | Tasks | Focus | Habits | Profile
 */
export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuth();
  const hapticLevel = useAppSelector(selectHapticLevel);
  const friendsEnabled = useAppSelector(selectFriendsEnabled);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading]);

  const handleTabPress = () => {
    if (hapticLevel !== 'off') {
      Haptics.impactAsync(
        hapticLevel === 'full'
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Soft
      );
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark.surface,
          borderTopColor: colors.dark.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingHorizontal: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.dark.text,
        tabBarInactiveTintColor: colors.dark.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarButton: (props) => {
          const { style, onPress, ref, ...restProps } = props as any;
          return (
            <Pressable
              {...restProps}
              onPress={(e: any) => {
                handleTabPress();
                onPress?.(e);
              }}
              android_ripple={{ color: colors.dark.whiteAlpha12, borderless: true }}
              style={({ pressed }: { pressed: boolean }) => [
                style,
                { flex: 1 },
                pressed && { opacity: 0.7 },
              ]}
            />
          );
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'timer' : 'timer-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'trending-up' : 'trending-up-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden tabs - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="journal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Reserved for future use
});