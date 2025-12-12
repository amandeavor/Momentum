import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useAppSelector } from '@/store';
import { selectActivityDates } from '@/store/slices/analyticsSlice';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Card from '@/components/common/Card';

const DAYS = 7;
const WEEKS = 12; // Last 12 weeks (~3 months)
const CELL_SIZE = 14;
const CELL_GAP = 5;

const StreakHeatmap = () => {
    const activityDates = useAppSelector(selectActivityDates);
    const { width } = Dimensions.get('window');

    // Generate grid data
    const gridData = useMemo(() => {
        const today = new Date();
        // Adjust to end on Saturday/Sunday depending on locale, for now end on Today
        const data = [];

        // We want to show WEEKS * 7 days
        for (let i = (DAYS * WEEKS) - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Check activity level based on multiple entries? 
            // Currently activityDates is just a set of dates with ANY activity.
            // So level is binary: 0 or 1. If we want intensity, we need more data.
            // For now, let's stick to binary or simple presence.
            const hasActivity = activityDates.includes(dateStr);

            data.push({
                date,
                dateStr,
                level: hasActivity ? 1 : 0
            });
        }
        return data;
    }, [activityDates]);

    // Group by columns (weeks)
    const columns = useMemo(() => {
        const cols = [];
        for (let i = 0; i < gridData.length; i += 7) {
            cols.push(gridData.slice(i, i + 7));
        }
        return cols;
    }, [gridData]);

    const monthLabels = useMemo(() => {
        const labels: { text: string; x: number }[] = [];
        let currentMonth = -1;

        columns.forEach((week, index) => {
            const firstDayOfWeek = week[0].date;
            const month = firstDayOfWeek.getMonth();

            if (month !== currentMonth) {
                currentMonth = month;
                // Only show label if there's enough space (e.g., at least 2 weeks of this month visible)
                // Simplified: just add label
                labels.push({
                    text: firstDayOfWeek.toLocaleString('default', { month: 'short' }),
                    x: index * (CELL_SIZE + CELL_GAP)
                });
            }
        });
        return labels;
    }, [columns]);

    return (
        <Card variant="surface" padding="lg">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.statsValue}>{activityDates.length}</Text>
                        <Text style={styles.statsLabel}>Active days</Text>
                    </View>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.legendDotInactive]} />
                            <Text style={styles.legendText}>No activity</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.legendDotActive]} />
                            <Text style={styles.legendText}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* Month Labels */}
                <View style={styles.monthRow}>
                    {monthLabels.map((label, i) => (
                        <Text
                            key={i}
                            style={[styles.monthLabel, { left: label.x }]}
                        >
                            {label.text}
                        </Text>
                    ))}
                </View>

                <View style={styles.gridContainer}>
                    {/* Day Labels (Mon/Wed/Fri) */}
                    <View style={styles.dayLabels}>
                        <Text style={styles.dayLabel}>M</Text>
                        <Text style={styles.dayLabel}>W</Text>
                        <Text style={styles.dayLabel}>F</Text>
                    </View>

                    {/* Heatmap Grid */}
                    <View style={styles.grid}>
                        {columns.map((week, colIndex) => (
                            <View key={colIndex} style={styles.column}>
                                {week.map((day, rowIndex) => (
                                    <View
                                        key={day.dateStr}
                                        style={[
                                            styles.cell,
                                            day.level > 0 && styles.cellActive
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Last {WEEKS} weeks</Text>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    statsValue: {
        ...typography.styles.h2,
        fontSize: 28,
        color: colors.dark.text,
        lineHeight: 32,
    },
    statsLabel: {
        ...typography.styles.caption,
        fontSize: 12,
        color: colors.dark.textTertiary,
        marginTop: 2,
    },
    legend: {
        gap: spacing.sm,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    legendDotInactive: {
        backgroundColor: colors.dark.whiteAlpha06,
    },
    legendDotActive: {
        backgroundColor: colors.dark.pastelGreen,
    },
    legendText: {
        ...typography.styles.caption,
        fontSize: 11,
        color: colors.dark.textTertiary,
    },
    monthRow: {
        height: 18,
        position: 'relative',
        marginBottom: spacing.xs,
        marginLeft: 20,
    },
    monthLabel: {
        position: 'absolute',
        ...typography.styles.caption,
        fontSize: 10,
        color: colors.dark.textTertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    gridContainer: {
        flexDirection: 'row',
    },
    dayLabels: {
        width: 20,
        justifyContent: 'space-between',
        paddingVertical: 2,
        marginRight: spacing.xs,
    },
    dayLabel: {
        ...typography.styles.caption,
        fontSize: 9,
        color: colors.dark.textTertiary,
        height: CELL_SIZE + CELL_GAP,
        lineHeight: CELL_SIZE + CELL_GAP,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        gap: CELL_GAP,
    },
    column: {
        gap: CELL_GAP,
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: 3,
        backgroundColor: colors.dark.whiteAlpha06,
    },
    cellActive: {
        backgroundColor: colors.dark.pastelGreen,
        shadowColor: colors.dark.pastelGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: spacing.xs,
    },
    footerText: {
        ...typography.styles.caption,
        fontSize: 10,
        color: colors.dark.textTertiary,
    }
});

export default StreakHeatmap;
