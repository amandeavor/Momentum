import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = colors.elevated,
  progressColor = colors.primary,
  style,
  animated = true,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(clampedProgress, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.progress,
          { backgroundColor: progressColor },
          animatedStyle,
        ]}
      />
      {/* Shine effect */}
      <View style={styles.shine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.radiusFull,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    height: '100%',
    borderRadius: spacing.radiusFull,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: spacing.radiusFull,
    borderTopRightRadius: spacing.radiusFull,
  },
});

export default ProgressBar;
