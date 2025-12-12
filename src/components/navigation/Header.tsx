import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface HeaderProps {
  title?: string;
  greeting?: boolean;
  userName?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const Header: React.FC<HeaderProps> = ({
  title,
  greeting = false,
  userName,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.content}>
        {/* Left */}
        <View style={styles.left}>
          {showBack && onBack && (
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.dark.text} />
            </Pressable>
          )}
        </View>

        {/* Center / Title */}
        <View style={styles.center}>
          {greeting ? (
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {userName || 'there'}
              </Text>
            </View>
          ) : title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right */}
        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.background,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  left: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  right: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: 18,
  },
  title: {
    ...typography.h3,
    color: colors.dark.text,
    textAlign: 'center',
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greeting: {
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
  userName: {
    ...typography.h3,
    color: colors.dark.text,
  },
});

// Named export for destructuring import
export { Header };

export default Header;