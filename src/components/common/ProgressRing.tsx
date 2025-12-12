import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
  animated?: boolean;
  showLabel?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  backgroundColor = colors.elevated,
  progressColor = colors.primary,
  style,
  children,
  animated = true,
  showLabel = true,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const animatedProgress = useSharedValue(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(clampedProgress, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const renderContent = () => {
    if (children) {
      return children;
    }
    if (showLabel) {
      return (
        <Text style={styles.label}>
          {Math.round(clampedProgress * 100)}%
        </Text>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.h3,
    color: colors.dark.text,
  },
});

export default ProgressRing;
