/**
 * StreakFireIcon
 * 
 * Animated fire icon that appears in the dashboard header.
 * Shows subtle breathing animation when there's an active streak.
 * Respects reduced motion preferences.
 */
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';

interface StreakFireIconProps {
  /** Current streak count */
  streak: number;
  /** Whether user has any active streaks */
  hasActiveStreak?: boolean;
  /** Callback when pressed */
  onPress?: () => void;
  /** Size of the icon container */
  size?: number;
}

const StreakFireIcon: React.FC<StreakFireIconProps> = ({
  streak,
  hasActiveStreak = true,
  onPress,
  size = 40,
}) => {
  const reduceMotion = useReducedMotion() ?? false;
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);

  // Subtle breathing animation - only if streak is active and not reduced motion
  useEffect(() => {
    if (reduceMotion || !hasActiveStreak || streak === 0) {
      scale.value = 1;
      glowOpacity.value = 0.2;
      return;
    }

    // Very subtle scale animation: 1.0 → 1.03
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Subtle glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reduceMotion, hasActiveStreak, streak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Determine fire color based on streak length
  const fireColor = useMemo(() => {
    if (streak === 0) return colors.dark.textTertiary;
    if (streak >= 100) return '#ff6b35'; // Epic orange
    if (streak >= 30) return colors.dark.warning; // Strong yellow/orange
    if (streak >= 7) return '#fbbf24'; // Yellow
    return '#fb923c'; // Light orange for new streaks
  }, [streak]);

  const iconSize = Math.floor(size * 0.55);
  const borderRadius = Math.floor(size * 0.3);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Streak: ${streak} days. Tap to view streaks.`}
    >
      {/* Glow effect */}
      {hasActiveStreak && streak > 0 && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: fireColor,
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size * 0.75,
            },
            glowStyle,
          ]}
        />
      )}

      {/* Icon container */}
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <View
          style={[
            styles.iconBackground,
            {
              width: size,
              height: size,
              borderRadius,
              backgroundColor:
                streak > 0
                  ? fireColor + '25'
                  : colors.dark.surface,
            },
          ]}
        >
          <Ionicons
            name={streak > 0 ? 'flame' : 'flame-outline'}
            size={iconSize}
            color={fireColor}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StreakFireIcon;
