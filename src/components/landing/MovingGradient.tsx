import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Particle } from './Particle';
import { colors } from '@/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MovingGradient: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
    const scale1 = useSharedValue(1);
    const scale2 = useSharedValue(1);
    const scale3 = useSharedValue(1);
    const opacity1 = useSharedValue(0.25);
    const opacity2 = useSharedValue(0.18);
    const opacity3 = useSharedValue(0.12);

    useEffect(() => {
        if (!enabled) return;
        // Top Left
        scale1.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity1.value = withRepeat(
            withSequence(
                withTiming(0.32, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.18, { duration: 5000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Bottom Right
        scale2.value = withRepeat(
            withSequence(
                withTiming(1.3, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity2.value = withRepeat(
            withSequence(
                withTiming(0.24, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.12, { duration: 6000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Center/Random - Third Orb
        scale3.value = withRepeat(
            withSequence(
                withTiming(1.4, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity3.value = withRepeat(
            withSequence(
                withTiming(0.18, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.08, { duration: 7000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [opacity1, opacity2, opacity3, scale1, scale2, scale3]);

    const style1 = useAnimatedStyle(() => ({
        transform: [{ scale: scale1.value }],
        opacity: opacity1.value,
    }));

    const style2 = useAnimatedStyle(() => ({
        transform: [{ scale: scale2.value }],
        opacity: opacity2.value,
    }));

    const style3 = useAnimatedStyle(() => ({
        transform: [{ scale: scale3.value }],
        opacity: opacity3.value,
    }));

    // Generate particles (kept light for performance)
    const particles = useMemo(() => Array.from({ length: 12 }).map((_, i) => i), []);

    if (!enabled) {
        return (
            <View style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
                <LinearGradient
                    colors={[colors.whiteAlpha12, 'transparent', colors.whiteAlpha06]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>
        );
    }

    return (
        <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

            {/* Top Left */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: -SCREEN_WIDTH * 0.5,
                        left: -SCREEN_WIDTH * 0.3,
                        width: SCREEN_WIDTH * 1.5,
                        height: SCREEN_WIDTH * 1.5,
                        borderRadius: SCREEN_WIDTH * 0.75,
                    },
                    style1,
                ]}
            >
                <LinearGradient
                    colors={[colors.whiteAlpha12, 'transparent']}
                    style={{ flex: 1, borderRadius: SCREEN_WIDTH * 0.75 }}
                    start={{ x: 0.3, y: 0.3 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Bottom Right */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        bottom: -SCREEN_WIDTH * 0.5,
                        right: -SCREEN_WIDTH * 0.3,
                        width: SCREEN_WIDTH * 1.5,
                        height: SCREEN_WIDTH * 1.5,
                        borderRadius: SCREEN_WIDTH * 0.75,
                    },
                    style2,
                ]}
            >
                <LinearGradient
                    colors={[colors.whiteAlpha06, 'transparent']}
                    style={{ flex: 1, borderRadius: SCREEN_WIDTH * 0.75 }}
                    start={{ x: 0.7, y: 0.7 }}
                    end={{ x: 0, y: 0 }}
                />
            </Animated.View>

            {/* Center - Third Orb */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: SCREEN_HEIGHT * 0.3,
                        right: -SCREEN_WIDTH * 0.2,
                        width: SCREEN_WIDTH,
                        height: SCREEN_WIDTH,
                        borderRadius: SCREEN_WIDTH * 0.5,
                    },
                    style3,
                ]}
            >
                <LinearGradient
                    colors={[colors.whiteAlpha06, 'transparent']}
                    style={{ flex: 1, borderRadius: SCREEN_WIDTH * 0.5 }}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Particles Layer */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {particles.map((i) => (
                    <Particle key={i} delay={i * 500} />
                ))}
            </View>

            {/* Blur overlay */}
            <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
        </View>
    );
};
