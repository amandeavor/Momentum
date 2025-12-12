/**
 * Quick Tour Screen
 * 
 * Optional animated walkthrough of the app's key features.
 * Users can skip or take the tour to understand the app better.
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  Extrapolation,
  runOnJS,
  useReducedMotion,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/common/Button';
import Confetti from '@/components/common/Confetti';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppDispatch } from '@/store';
import { completeOnboarding } from '@/store/slices/settingsSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TourSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  features: string[];
}

const TOUR_SLIDES: TourSlide[] = [
  {
    id: 'dashboard',
    icon: 'home',
    title: 'Your Daily Hub',
    subtitle: 'See your progress at a glance. Tasks, focus time, and streaks all in one place.',
    color: colors.dark.accentBlue,
    features: ['Quick actions', 'Daily progress rings', 'Streak tracking'],
  },
  {
    id: 'focus',
    icon: 'timer',
    title: 'Deep Focus Sessions',
    subtitle: 'Pomodoro timer with ambient sounds to help you concentrate.',
    color: colors.dark.pastelPurple,
    features: ['25/5 minute cycles', 'White noise & sounds', 'Session history'],
  },
  {
    id: 'streaks',
    icon: 'flame',
    title: 'Build Momentum',
    subtitle: 'Track your daily consistency across tasks, habits, and journaling.',
    color: colors.dark.warning,
    features: ['Visual streaks', 'Milestone celebrations', 'Activity calendar'],
  },
  {
    id: 'bedtime',
    icon: 'moon',
    title: 'End Your Day Right',
    subtitle: 'Get reminded to journal and plan tomorrow before bed.',
    color: colors.dark.pastelPeach,
    features: ['Journal prompts', 'Tomorrow planning', 'Bedtime reminders'],
  },
  {
    id: 'ready',
    icon: 'rocket',
    title: "You're All Set!",
    subtitle: 'Start building momentum today. Small steps lead to big results.',
    color: colors.dark.success,
    features: [],
  },
];

// Animated icon component for each slide
const AnimatedSlideIcon = ({ 
  icon, 
  color, 
  isActive,
  reduceMotion,
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  color: string;
  isActive: boolean;
  reduceMotion: boolean;
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    if (!isActive || reduceMotion) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [isActive, reduceMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={styles.iconWrapper}>
      {!reduceMotion && (
        <Animated.View style={[styles.iconGlow, { backgroundColor: color }, glowStyle]} />
      )}
      <Animated.View style={[styles.iconCircle, { backgroundColor: color + '30' }, iconStyle]}>
        <LinearGradient
          colors={[color, color + 'CC']}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={48} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// Feature list item with animation
const FeatureItem = ({ text, delay }: { text: string; delay: number }) => (
  <Animated.View 
    entering={FadeInUp.delay(delay).duration(400)}
    style={styles.featureItem}
  >
    <View style={styles.featureDot} />
    <Text style={styles.featureText}>{text}</Text>
  </Animated.View>
);

// Slide content
const SlideContent = ({ 
  slide, 
  index, 
  scrollX,
  reduceMotion,
}: { 
  slide: TourSlide; 
  index: number; 
  scrollX: SharedValue<number>;
  reduceMotion: boolean;
}) => {
  const contentStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [30, 0, -30],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );

    return { opacity, transform: [{ translateY }, { scale }] };
  });

  const isActive = true; // Will be controlled by scroll position

  return (
    <Animated.View style={[styles.slideContent, contentStyle]}>
      <AnimatedSlideIcon 
        icon={slide.icon} 
        color={slide.color} 
        isActive={isActive}
        reduceMotion={reduceMotion}
      />
      
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      
      {slide.features.length > 0 && (
        <View style={styles.featuresList}>
          {slide.features.map((feature, i) => (
            <FeatureItem key={feature} text={feature} delay={i * 100} />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// Pagination dots
const PaginationDots = ({ 
  scrollX, 
  total,
}: { 
  scrollX: SharedValue<number>; 
  total: number;
}) => {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: total }).map((_, index) => {
        const dotStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];
          
          const width = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            Extrapolation.CLAMP
          );
          
          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.4, 1, 0.4],
            Extrapolation.CLAMP
          );

          return { width, opacity };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, dotStyle]}
          />
        );
      })}
    </View>
  );
};

export default function TourScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const reduceMotion = useReducedMotion() ?? false;
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const buttonScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      if (index !== currentIndex) {
        runOnJS(setCurrentIndex)(index);
      }
    },
  });

  // Show confetti on last slide
  useEffect(() => {
    if (currentIndex === TOUR_SLIDES.length - 1 && showTour) {
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [currentIndex, showTour]);

  const handleStartTour = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTour(true);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(completeOnboarding());
    router.replace('/(main)/dashboard');
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < TOUR_SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      // Finish tour
      dispatch(completeOnboarding());
      router.replace('/(main)/dashboard');
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const isLastSlide = currentIndex === TOUR_SLIDES.length - 1;

  // Initial choice screen
  if (!showTour) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.choiceHeader}>
          <Text style={styles.stepIndicator}>Step 4 of 4 · Optional</Text>
          <Text style={styles.choiceTitle}>Quick Tour?</Text>
          <Text style={styles.choiceSubtitle}>
            Take a quick look at what Momentum can do, or jump right in!
          </Text>
        </Animated.View>

        {/* Illustration */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.illustration}
        >
          <View style={styles.tourIconsRow}>
            <View style={[styles.tourIconCircle, { backgroundColor: colors.dark.accentBlue + '30' }]}>
              <Ionicons name="home" size={28} color={colors.dark.accentBlue} />
            </View>
            <View style={[styles.tourIconCircle, { backgroundColor: colors.dark.warning + '30' }]}>
              <Ionicons name="flame" size={28} color={colors.dark.warning} />
            </View>
            <View style={[styles.tourIconCircle, { backgroundColor: colors.dark.pastelPurple + '30' }]}>
              <Ionicons name="timer" size={28} color={colors.dark.pastelPurple} />
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(400)}
          style={[styles.choiceButtons, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <Button
            label="Take Quick Tour"
            onPress={handleStartTour}
            fullWidth
            icon={<Ionicons name="play" size={18} color={colors.dark.background} />}
          />
          <Pressable 
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip tour and start using the app"
          >
            <Text style={styles.skipText}>Skip & Start Using Momentum</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Tour slides
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Confetti for last slide */}
      {showConfetti && <Confetti />}
      
      {/* Skip button in corner */}
      {!isLastSlide && (
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={[styles.skipCorner, { top: insets.top + spacing.md }]}
        >
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipCornerText}>Skip</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Scrollable slides */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + spacing.xxl }}
      >
        {TOUR_SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <SlideContent 
              slide={slide} 
              index={index} 
              scrollX={scrollX}
              reduceMotion={reduceMotion}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Pagination */}
        <PaginationDots scrollX={scrollX} total={TOUR_SLIDES.length} />

        {/* Next/Finish button */}
        <AnimatedPressable
          onPress={handleNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.nextButton, buttonStyle]}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? "Let's Go" : 'Next'}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Let's Go!" : 'Next'}
          </Text>
          <Ionicons 
            name={isLastSlide ? 'rocket' : 'chevron-forward'} 
            size={18} 
            color={colors.dark.background} 
            style={{ marginLeft: spacing.xs }}
          />
        </AnimatedPressable>

        {/* Swipe hint */}
        {!isLastSlide && (
          <Text style={styles.swipeHint}>Swipe to continue</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  choiceHeader: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  stepIndicator: {
    ...typography.caption,
    color: colors.dark.pastelBlue,
    marginBottom: spacing.sm,
  },
  choiceTitle: {
    ...typography.h1,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  choiceSubtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: '85%',
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourIconsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  tourIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceButtons: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.dark.textTertiary,
  },
  skipCorner: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 10,
  },
  skipCornerText: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
  },
  slideContent: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideTitle: {
    ...typography.h2,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  slideSubtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 24,
  },
  featuresList: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dark.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.success,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.dark.text,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dark.primary,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.full,
    width: '100%',
    minHeight: 52,
  },
  nextButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.dark.background,
  },
  swipeHint: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.md,
  },
});
