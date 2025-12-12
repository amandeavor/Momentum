import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';

type GlassVariant = 'default' | 'gradient' | 'accent' | 'glow';
type GlassPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  variant?: GlassVariant;
  padding?: GlassPadding;
  accentColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  glowColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const paddingMap: Record<GlassPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  disabled,
  variant = 'default',
  padding = 'md',
  accentColor,
  gradientColors,
  glowColor,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const defaultGradient: readonly [string, string] = [
    'rgba(255,255,255,0.08)',
    'rgba(255,255,255,0.02)',
  ];

  const accentGradient: readonly [string, string] = accentColor
    ? [`${accentColor}25`, `${accentColor}08`]
    : defaultGradient;

  const gradient = gradientColors || (variant === 'accent' ? accentGradient : defaultGradient);

  const glowStyle = variant === 'glow' && glowColor ? {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } : {};

  const content = (
    <View style={[styles.container, glowStyle, { padding: paddingMap[padding] }, style]}>
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassOverlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(18,20,23,0.85)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  content: {
    position: 'relative',
  },
});

export default GlassCard;
