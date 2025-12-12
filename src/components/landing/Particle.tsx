import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withDelay,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleProps {
    delay: number;
}

export const Particle: React.FC<ParticleProps> = ({ delay }) => {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    // Random initial position
    const left = useMemo(() => Math.random() * SCREEN_WIDTH, []);
    const size = useMemo(() => Math.random() * 4 + 2, []); // 2-6px

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(-SCREEN_HEIGHT, {
                    duration: 8000 + Math.random() * 4000,
                    easing: Easing.linear
                }),
                -1,
                false
            )
        );

        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.35, { duration: 1000 }),
                    withTiming(0.12, { duration: 2000 }),
                    withTiming(0, { duration: 1000 })
                ),
                -1,
                true
            )
        );
    }, [delay, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    bottom: -20,
                    left,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.whiteAlpha20,
                },
                animatedStyle,
            ]}
        />
    );
};
