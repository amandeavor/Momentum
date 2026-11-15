import React, { useState, forwardRef, useEffect } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  TextInputProps,
  StyleProp,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';


export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      secureTextEntry,
      activeBorderColor = colors.primary,
      inactiveBorderColor = colors.separator,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const focusAnimation = useSharedValue(0);
    const errorAnimation = useSharedValue(0);
    const labelScale = useSharedValue(1);

    useEffect(() => {
      focusAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
      labelScale.value = withSpring(isFocused ? 0.95 : 1);
    }, [isFocused]);

    useEffect(() => {
      errorAnimation.value = withSpring(error ? 1 : 0);
    }, [error]);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const containerAnimatedStyle = useAnimatedStyle(() => {
      const borderColor = error
        ? colors.error
        : interpolateColor(
          focusAnimation.value,
          [0, 1],
          [inactiveBorderColor, activeBorderColor]
        );

      return {
        borderColor,
        transform: [{ scale: withSpring(errorAnimation.value > 0 ? 1 : 1) }],
      };
    });

    const labelAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: labelScale.value }],
    }));

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.container, containerStyle]}
      >
        {label && (
          <Animated.Text style={[styles.label, labelAnimatedStyle]}>
            {label}
          </Animated.Text>
        )}

        <Animated.View
          style={[
            styles.inputContainer,
            containerAnimatedStyle,
            error && styles.inputError,

          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon ? styles.inputWithLeftIcon : null,
              (rightIcon || secureTextEntry) ? styles.inputWithRightIcon : null,
              inputStyle,
            ] as any}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            {...props}
          />

          {secureTextEntry && (
            <Pressable
              onPress={togglePasswordVisibility}
              style={styles.iconRight}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              accessibilityHint="Double tap to toggle password visibility"
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}

          {rightIcon && !secureTextEntry && (
            <View style={styles.iconRight}>{rightIcon}</View>
          )}
        </Animated.View>

        {(error || helperText) && (
          <Animated.Text
            entering={FadeIn.duration(200)}
            style={[styles.helperText, error && styles.errorText]}
          >
            {error || helperText}
          </Animated.Text>
        )}
      </Animated.View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.styles.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.inputHeight,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  iconLeft: {
    paddingLeft: spacing.lg,
  },
  iconRight: {
    paddingRight: spacing.lg,
  },
  helperText: {
    ...typography.styles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
});

export default Input;