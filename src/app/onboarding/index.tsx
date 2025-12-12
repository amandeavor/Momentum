/**
 * Onboarding Welcome Screen
 * 
 * First screen users see after registration.
 * Introduces the app and leads to profile setup.
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();
  const buttonScale = useSharedValue(1);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/profile-setup' as any);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(143,207,255,0.1)', 'transparent', 'rgba(196,181,253,0.1)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Logo & Title */}
      <Animated.View 
        entering={FadeIn.delay(200).duration(600)}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#8FCFFF', '#C4B5FD']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="flash" size={48} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Momentum</Text>
        <Text style={styles.subtitle}>Build the life you want,{'\n'}one choice at a time.</Text>
      </Animated.View>

      {/* Features */}
      <Animated.View 
        entering={FadeInUp.delay(400).duration(600)}
        style={styles.features}
      >
        <FeatureItem
          icon="timer-outline"
          title="Focus Sessions"
          description="Deep work with Pomodoro & white noise"
          delay={500}
        />
        <FeatureItem
          icon="calendar-outline"
          title="Time Blocking"
          description="Plan your day intentionally"
          delay={600}
        />
        <FeatureItem
          icon="flame-outline"
          title="Streak Tracking"
          description="Build momentum with daily streaks"
          delay={700}
        />
        <FeatureItem
          icon="book-outline"
          title="Journaling"
          description="Reflect and grow with daily entries"
          delay={800}
        />
      </Animated.View>

      {/* CTA Button */}
      <Animated.View
        entering={FadeInUp.delay(900).duration(600)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <AnimatedPressable
          onPress={handleStart}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.ctaButton, buttonAnimatedStyle]}
          accessibilityRole="button"
          accessibilityLabel="Get started with Momentum"
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.dark.background} />
        </AnimatedPressable>

        <Text style={styles.footerNote}>
          Setup takes less than 2 minutes
        </Text>
      </Animated.View>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, delay }) => (
  <Animated.View 
    entering={FadeInUp.delay(delay).duration(500)}
    style={styles.featureItem}
    accessibilityRole="text"
    accessibilityLabel={`${title}: ${description}`}
  >
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={colors.dark.pastelBlue} />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.dark.pastelBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...typography.bodySmall,
    color: colors.dark.textTertiary,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dark.text,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.full,
    width: '100%',
    minHeight: spacing.buttonHeight,
  },
  ctaText: {
    ...typography.body,
    color: colors.dark.background,
    fontWeight: '600',
  },
  footerNote: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
});
