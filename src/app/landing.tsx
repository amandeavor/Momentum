import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  Pressable,
  Text,
  ScrollView,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { MovingGradient } from '@/components/landing/MovingGradient';
import { Slide } from '@/components/landing/Slide';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const SLIDES = [
  {
    id: 'welcome',
    line1: 'Get into',
    highlight: 'Momentum',
    subtitle: null,
  },
  {
    id: 'focus',
    line1: 'Master Your',
    highlight: 'Focus',
    subtitle: "Achieve flow state with customizable timers.",
  },
  {
    id: 'habits',
    line1: 'Build Better',
    highlight: 'Habits',
    subtitle: "Track streaks and reach your daily goals.",
  },
  {
    id: 'analytics',
    line1: 'Measure',
    highlight: 'Growth',
    subtitle: "Gain insights into your productivity trends.",
  },
];

type SlideItem = (typeof SLIDES)[number];

function PaginationDot({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndex.value - index);
    const t = Math.max(0, 1 - Math.min(distance, 1));

    return {
      width: interpolate(t, [0, 1], [6, 24]),
      opacity: interpolate(t, [0, 1], [0.55, 1]),
      backgroundColor: interpolateColor(t, [0, 1], [colors.whiteAlpha20, colors.primary]),
    };
  }, [index]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function LandingPage() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() ?? false;
  const { loginWithProvider } = useAuth();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexSv = useSharedValue(0);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const flatListRef = useRef<FlatList<SlideItem>>(null);

  useEffect(() => {
    if (reduceMotion) {
      activeIndexSv.value = activeIndex;
      return;
    }
    activeIndexSv.value = withTiming(activeIndex, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [activeIndex, reduceMotion, activeIndexSv]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  const handleCreateAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  const handleGoogle = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loginWithProvider('google', 'login');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    []
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === 'number') setActiveIndex(index);
    }
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <MovingGradient enabled={!reduceMotion} />

      {/* Main Content Slider */}
      <View style={styles.content}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item }) => <Slide item={item} />}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
          bounces={false}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={2}
          removeClippedSubviews
        />
      </View>

      {/* Footer Navigation */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(120).duration(450).easing(Easing.out(Easing.quad))}
          style={styles.ctaStack}
        >
          {/* Pagination Dots (kept close to CTAs so it never overlaps content) */}
          <View style={styles.pagination} accessibilityLabel={`Slide ${activeIndex + 1} of ${SLIDES.length}`}>
            {SLIDES.map((_, index) => (
              <PaginationDot key={index} index={index} activeIndex={activeIndexSv} />
            ))}
          </View>

          <Button
            label="Create account"
            onPress={handleCreateAccount}
            variant="primary"
            size="large"
          />
          <Button
            label="Sign in"
            onPress={handleSignIn}
            variant="outline"
            size="large"
          />
          <Button
            label="Continue with Google"
            onPress={handleGoogle}
            variant="secondary"
            iconName="logo-google"
            size="large"
          />

          <View style={styles.legalRow}>
            <Pressable onPress={() => setShowTerms(true)} hitSlop={8}>
              <Text style={styles.legalText}>Terms</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => setShowPrivacy(true)} hitSlop={8}>
              <Text style={styles.legalText}>Privacy</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using Momentum, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>

          <Text style={styles.sectionTitle}>2. Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily download one copy of the materials (information or software) on Momentum for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Text>
          <Text style={styles.paragraph}>
            - modify or copy the materials;{'\n'}
            - use the materials for any commercial purpose, or for any public display (commercial or non-commercial);{'\n'}
            - attempt to decompile or reverse engineer any software contained on Momentum;{'\n'}
            - remove any copyright or other proprietary notations from the materials; or{'\n'}
            - transfer the materials to another person or "mirror" the materials on any other server.
          </Text>

          <Text style={styles.sectionTitle}>3. Disclaimer</Text>
          <Text style={styles.paragraph}>
            The materials on Momentum are provided "as is". Momentum makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Text>
        </ScrollView>
      </Modal>

      <Modal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us, such as when you create an account, update your profile, or use our features. This may include your name, email address, and usage data.
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect Momentum and our users. We also use this information to offer you tailored content – like giving you more relevant search results and ads.
          </Text>

          <Text style={styles.sectionTitle}>3. Information We Share</Text>
          <Text style={styles.paragraph}>
            We do not share your personal information with companies, organizations, or individuals outside of Momentum except in the following cases:
          </Text>
          <Text style={styles.paragraph}>
            - With your consent.{'\n'}
            - For external processing.{'\n'}
            - For legal reasons.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We work hard to protect Momentum and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
          </Text>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
  ctaStack: {
    gap: 12,
  },
  legalRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  legalText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  legalDot: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  modalScroll: {
    // flex: 1, // Removed to allow content to determine height
  },
  modalContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.dark.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
});
