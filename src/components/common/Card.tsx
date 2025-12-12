import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type CardVariant = 'default' | 'surface' | 'elevated' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  elevated?: boolean;
  variant?: CardVariant;
  padding?: CardPadding;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const paddingMap: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress, 
  disabled,
  elevated = false,
  variant = 'default',
  padding = 'lg',
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue((elevated || variant === 'elevated') ? 0.15 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      shadowOpacity.value = withTiming(0.25, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      shadowOpacity.value = withTiming((elevated || variant === 'elevated') ? 0.15 : 0, { duration: 150 });
    }
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'surface':
        return styles.surface;
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      default:
        return null;
    }
  };

  const cardStyle = [
    styles.card,
    getVariantStyle(),
    elevated && styles.elevated,
    { padding: paddingMap[padding] },
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[cardStyle, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  surface: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
  },
  elevated: {
    backgroundColor: colors.dark.elevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    borderColor: 'transparent',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.dark.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Card;
