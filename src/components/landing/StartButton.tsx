import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StartButtonProps {
    onPress: () => void;
}

export const StartButton: React.FC<StartButtonProps> = ({ onPress }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withTiming(0.92, { duration: 150, easing: Easing.out(Easing.quad) });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
        onPress();
    };

    return (
        <AnimatedPressable
            style={[styles.startButton, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Text style={styles.startButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={24} color="#000" />
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    startButton: {
        height: 64,
        paddingHorizontal: 36,
        borderRadius: 32,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    startButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: -0.4,
    },
});
