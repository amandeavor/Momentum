import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/**
 * Props for the StatItem component.
 */
interface StatItemProps {
    /** The value to display (e.g., "12", "45m"). */
    value: string | number;
    /** The label describing the value (e.g., "Completed", "Focus"). */
    label: string;
}

/**
 * StatItem Component
 * 
 * Displays a single statistic with a large value and a smaller label.
 * Designed for the floating stats row in the Dashboard.
 * 
 * @component
 * @example
 * <StatItem value={5} label="Tasks" />
 */
const StatItem = ({ value, label }: StatItemProps) => (
    <View style={styles.statItem}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    statValue: {
        fontSize: 26,
        fontFamily: 'Inter_700Bold',
        color: colors.dark.text,
        letterSpacing: -0.8,
        textShadowColor: 'rgba(255,255,255,0.1)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    statLabel: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        color: colors.dark.textTertiary,
        letterSpacing: 0.1,
    },
});

export default memo(StatItem);
