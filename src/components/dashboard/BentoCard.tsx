import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

/**
 * Props for the BentoCard component.
 */
interface BentoCardProps {
    /** The content to display inside the card. */
    children?: React.ReactNode;
    /** Optional custom styles for the card container. */
    style?: StyleProp<ViewStyle>;
    /** Function to call when the card is pressed. If undefined, card is not pressable. */
    onPress?: () => void;
    /** Optional title to display in the header. */
    title?: string;
    /** Optional icon to display in the header. */
    icon?: keyof typeof Ionicons.glyphMap;
    /** If true, uses an accented pearl/metallic gradient background. Defaults to false. */
    accent?: boolean;
    /** Fixed height for the card. */
    height?: number;
    /** Grid column span (1 or 2). Defaults to 1. */
    colSpan?: 1 | 2;
}

/**
 * BentoCard Component
 * 
 * A versatile container component used in the Bento Grid layout.
 * Supports glassmorphism effects, gradients, and press interactions.
 * 
 * @component
 * @example
 * <BentoCard title="Tasks" icon="checkbox-outline" onPress={handlePress}>
 *   <Content />
 * </BentoCard>
 */
const BentoCard = ({
    children,
    style,
    onPress,
    title,
    icon,
    accent = false,
    height,
    colSpan = 1,
}: BentoCardProps) => {
    // Surface Gradient: Richer glass effect for standard cards
    const surfaceGradient = ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'];

    // Accent Gradient: Pearl/Metallic for active/highlighted states
    const accentGradient = ['#FFFFFF', '#E0E0E0'];

    /**
     * The inner content of the card, wrapped in the visual container.
     */
    const content = (
        <View style={[
            styles.bentoCardContainer,
            height ? { height } : undefined,
            colSpan === 2 ? { width: '100%' } : { flex: 1 },
            style
        ]}>
            {/* Background Gradient */}
            <LinearGradient
                colors={accent ? accentGradient as any : surfaceGradient as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <View style={styles.bentoContent}>
                {(title || icon) && (
                    <View style={styles.bentoHeader}>
                        {icon && (
                            <View style={[
                                styles.iconContainer,
                                accent ? { backgroundColor: 'rgba(0,0,0,0.1)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }
                            ]}>
                                <Ionicons
                                    name={icon}
                                    size={18}
                                    color={accent ? colors.dark.background : colors.dark.textSecondary}
                                />
                            </View>
                        )}
                        {title && (
                            <Text style={[
                                styles.bentoTitle,
                                accent && styles.bentoTitleAccent
                            ]}>{title}</Text>
                        )}
                    </View>
                )}
                {children}
            </View>
        </View>
    );

    // If onPress is provided, wrap in Pressable for interaction
    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    colSpan === 2 ? { width: '100%' } : { flex: 1 },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
                ]}
            >
                {content}
            </Pressable>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    bentoCardContainer: {
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    bentoContent: {
        flex: 1,
        padding: spacing.md,
    },
    bentoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bentoTitle: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: colors.dark.textSecondary,
        letterSpacing: 0.1,
    },
    bentoTitleAccent: {
        color: colors.dark.background,
    },
});

export default memo(BentoCard);
