import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
export type ButtonSize = 'xs' | 'small' | 'medium' | 'large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconName,
  iconPosition = 'left',
  fullWidth = true,
  rounded = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getButtonStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.base, styles[size]];

    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }

    if (rounded) {
      baseStyles.push(styles.rounded);
    }

    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primaryBg);
        break;
      case 'secondary':
        baseStyles.push(styles.secondaryBg);
        break;
      case 'ghost':
        baseStyles.push(styles.ghostBg);
        break;
      case 'danger':
        baseStyles.push(styles.dangerBg);
        break;
      case 'outline':
        baseStyles.push(styles.outlineBg);
        break;
      case 'success':
        baseStyles.push(styles.successBg);
        break;
    }

    if (disabled || loading) {
      baseStyles.push(styles.disabled);
    }

    return baseStyles;
  };

  const getTextStyles = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.text, styles[`${size}Text`]];

    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyles.push(styles.secondaryText);
        break;
      case 'ghost':
        baseStyles.push(styles.ghostText);
        break;
      case 'danger':
        baseStyles.push(styles.dangerText);
        break;
      case 'outline':
        baseStyles.push(styles.outlineText);
        break;
      case 'success':
        baseStyles.push(styles.successText);
        break;
    }

    if (disabled) {
      baseStyles.push(styles.disabledText);
    }

    return baseStyles;
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs': return 14;
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 22;
      default: return 18;
    }
  };

  const getIconColor = () => {
    if (disabled) return colors.textSubtle;
    switch (variant) {
      case 'primary': return colors.onPrimary;
      case 'secondary': return colors.textPrimary;
      case 'ghost': return colors.primary;
      case 'danger': return colors.onPrimary;
      case 'outline': return colors.primary;
      case 'success': return colors.onPrimary;
      default: return colors.onPrimary;
    }
  };

  const renderIcon = () => {
    if (icon) return icon;
    if (iconName) {
      return (
        <Ionicons
          name={iconName}
          size={getIconSize()}
          color={getIconColor()}
        />
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.onPrimary : colors.primary}
        />
      );
    }

    const iconElement = renderIcon();

    return (
      <View style={styles.contentRow}>
        {iconElement && iconPosition === 'left' && iconElement}
        <Text style={[...getTextStyles(), textStyle]}>{label}</Text>
        {iconElement && iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, ...getButtonStyles(), style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {renderContent()}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.radiusFull,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  rounded: {
    borderRadius: 50,
  },
  xs: {
    height: 28,
    paddingHorizontal: spacing.md,
  },
  small: {
    height: 36,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    height: 44,
    paddingHorizontal: spacing.xl,
  },
  large: {
    height: 52,
    paddingHorizontal: spacing.xxl,
  },
  primaryBg: {
    backgroundColor: colors.primary,
  },
  secondaryBg: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  ghostBg: {
    backgroundColor: 'transparent',
  },
  dangerBg: {
    backgroundColor: colors.error,
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  successBg: {
    backgroundColor: colors.success,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.fontFamily.semiBold,
  },
  xsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  smallText: {
    ...typography.styles.buttonSmall,
  },
  mediumText: {
    ...typography.styles.button,
  },
  largeText: {
    fontSize: 17,
    lineHeight: 22,
  },
  primaryText: {
    color: colors.onPrimary,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.onPrimary,
  },
  outlineText: {
    color: colors.primary,
  },
  successText: {
    color: colors.onPrimary,
  },
  disabledText: {
    color: colors.textSubtle,
  },
});

export default Button;
