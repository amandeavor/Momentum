import React from 'react';
import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useReducedMotion, Easing } from 'react-native-reanimated';
import { colors } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
    id: string;
    line1: string;
    highlight: string;
    subtitle: string | null;
}

interface SlideProps {
    item: SlideData;
}

export const Slide: React.FC<SlideProps> = ({ item }) => {
    const { width } = useWindowDimensions();
    const reduceMotion = useReducedMotion() ?? false;

    const titleFontSize = width < 360 ? 44 : width < 400 ? 48 : 52;
    const titleLineHeight = titleFontSize + 4;

    return (
        <View style={styles.slide}>
            <Animated.View
                entering={reduceMotion ? undefined : FadeInDown.delay(80).duration(450).easing(Easing.out(Easing.quad))}
                style={styles.titleContainer}
            >
                <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]}>
                    {item.line1}{'\n'}
                    <Text style={styles.highlight}>{item.highlight}</Text>
                </Text>
            </Animated.View>

            {item.subtitle && (
                <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(160).duration(450).easing(Easing.out(Easing.quad))}>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    slide: {
        justifyContent: 'center',
        paddingHorizontal: 32,
        width: SCREEN_WIDTH,
    },
    titleContainer: {
        marginBottom: 16,
    },
    title: {
        color: colors.text,
        fontSize: 52,
        lineHeight: 56,
        fontWeight: '700',
        letterSpacing: -2,
        textShadowColor: colors.blackAlpha40,
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    highlight: {
        color: colors.textTertiary,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 18,
        marginTop: 24,
        fontWeight: '400',
        lineHeight: 28,
        letterSpacing: -0.2,
        opacity: 0.8,
    },
});
