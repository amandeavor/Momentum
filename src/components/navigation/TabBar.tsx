import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItem {
  name: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

const tabs: TabItem[] = [
  { name: 'Home', route: '/dashboard', icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'Tasks', route: '/tasks', icon: 'checkbox-outline', iconFocused: 'checkbox' },
  { name: 'Focus', route: '/focus', icon: 'timer-outline', iconFocused: 'timer' },
  { name: 'Habits', route: '/habits', icon: 'trending-up-outline', iconFocused: 'trending-up' },
  { name: 'Profile', route: '/profile', icon: 'person-outline', iconFocused: 'person' },
];

interface TabBarItemProps {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
}

const TabBarItem: React.FC<TabBarItemProps> = ({ item, isActive, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedStyle]}
    >
      <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
        <Ionicons
          name={isActive ? item.iconFocused : item.icon}
          size={22}
          color={isActive ? colors.dark.background : colors.dark.textTertiary}
        />
      </View>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {item.name}
      </Text>
    </AnimatedPressable>
  );
};

const TabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    const cleanPath = pathname.replace('/(main)', '');
    return cleanPath === route || cleanPath.startsWith(route + '/');
  };

  const handleTabPress = (route: string) => {
    router.push(`/(main)${route}` as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabsWrapper}>
        {tabs.map((tab) => (
          <TabBarItem
            key={tab.name}
            item={tab}
            isActive={isActive(tab.route)}
            onPress={() => handleTabPress(tab.route)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: spacing.sm,
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.dark.primary,
  },
  tabLabel: {
    ...typography.styles.caption,
    fontSize: 10,
    color: colors.dark.textTertiary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.dark.text,
    fontWeight: '600',
  },
});

export { TabBar };
export default TabBar;