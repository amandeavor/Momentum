/**
 * Confetti Component for Momentum
 * 
 * Reusable celebration animation for milestones, streak achievements,
 * and pomodoro completions.
 */
import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Preset configurations for different celebration types
export type ConfettiPreset = 'milestone' | 'streak' | 'pomodoro' | 'achievement' | 'custom';

interface ConfettiConfig {
  count: number;
  origin: { x: number; y: number };
  fadeOut: boolean;
  explosionSpeed: number;
  fallSpeed: number;
  colors?: string[];
}

const PRESET_CONFIGS: Record<ConfettiPreset, ConfettiConfig> = {
  milestone: {
    count: 150,
    origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT },
    fadeOut: true,
    explosionSpeed: 400,
    fallSpeed: 3000,
    colors: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#9370DB', '#00CED1'],
  },
  streak: {
    count: 100,
    origin: { x: SCREEN_WIDTH / 2, y: -20 },
    fadeOut: true,
    explosionSpeed: 300,
    fallSpeed: 2500,
    colors: ['#FF4500', '#FF6B35', '#FFD93D', '#FF8C00'],
  },
  pomodoro: {
    count: 80,
    origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
    fadeOut: true,
    explosionSpeed: 350,
    fallSpeed: 2800,
    colors: ['#FFFFFF', '#C4B5FD', '#8FCFFF', '#B8F2C2'],
  },
  achievement: {
    count: 200,
    origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT },
    fadeOut: true,
    explosionSpeed: 450,
    fallSpeed: 3500,
    colors: ['#FFD700', '#C0C0C0', '#CD7F32', '#FFFFFF'],
  },
  custom: {
    count: 100,
    origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT },
    fadeOut: true,
    explosionSpeed: 350,
    fallSpeed: 3000,
  },
};

export interface ConfettiRef {
  fire: (preset?: ConfettiPreset) => void;
  stop: () => void;
}

interface ConfettiProps {
  /** Called when confetti animation completes */
  onComplete?: () => void;
  /** Enable haptic feedback when confetti fires */
  enableHaptics?: boolean;
  /** Custom colors (only used with 'custom' preset) */
  customColors?: string[];
}

const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ onComplete, enableHaptics = true, customColors }, ref) => {
    const confettiRef = useRef<any>(null);
    const [isActive, setIsActive] = React.useState(false);
    const [currentConfig, setCurrentConfig] = React.useState<ConfettiConfig>(
      PRESET_CONFIGS.pomodoro
    );

    const fire = useCallback((preset: ConfettiPreset = 'pomodoro') => {
      const config = { ...PRESET_CONFIGS[preset] };
      
      // Apply custom colors if using custom preset
      if (preset === 'custom' && customColors) {
        config.colors = customColors;
      }
      
      setCurrentConfig(config);
      setIsActive(true);

      // Trigger haptic pattern for celebration
      if (enableHaptics) {
        // Wave pattern - three pulses
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 150);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 300);
      }

      // Reset after animation
      setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current.start();
        }
      }, 50);
    }, [enableHaptics, customColors]);

    const stop = useCallback(() => {
      setIsActive(false);
    }, []);

    useImperativeHandle(ref, () => ({
      fire,
      stop,
    }), [fire, stop]);

    const handleComplete = useCallback(() => {
      setIsActive(false);
      onComplete?.();
    }, [onComplete]);

    if (!isActive) return null;

    return (
      <View style={styles.container} pointerEvents="none">
        <ConfettiCannon
          ref={confettiRef}
          count={currentConfig.count}
          origin={currentConfig.origin}
          fadeOut={currentConfig.fadeOut}
          explosionSpeed={currentConfig.explosionSpeed}
          fallSpeed={currentConfig.fallSpeed}
          colors={currentConfig.colors}
          autoStart={true}
          onAnimationEnd={handleComplete}
        />
      </View>
    );
  }
);

Confetti.displayName = 'Confetti';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default Confetti;
