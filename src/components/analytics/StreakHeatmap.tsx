import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '@/store';
import { selectActivityDates } from '@/store/slices/analyticsSlice';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import Card from '@/components/common/Card';

const WEEKS = 12; // Show 12 weeks (~3 months)
const CELL_SIZE = 14;
const CELL_GAP = 4;

const StreakHeatmap = () => {
    const activityDates = useAppSelector(selectActivityDates);

    // Generate grid data - organized by weeks (columns) with days (rows)
    const { columns, monthLabels, stats } = useMemo(() => {
        const today = new Date();
        const data: { date: Date; dateStr: string; level: number; isToday: boolean }[] = [];
        const todayStr = today.toISOString().split('T')[0];

        // Go back WEEKS * 7 days
        for (let i = (7 * WEEKS) - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const hasActivity = activityDates.includes(dateStr);

            data.push({
                date,
                dateStr,
                level: hasActivity ? 1 : 0,
                isToday: dateStr === todayStr
            });
        }

        // Group into weeks (columns of 7 days each)
        const cols: typeof data[] = [];
        for (let i = 0; i < data.length; i += 7) {
            cols.push(data.slice(i, i + 7));
        }

        // Generate month labels
        const labels: { text: string; x: number }[] = [];
        let currentMonth = -1;
        cols.forEach((week, index) => {
            const firstDay = week[0]?.date;
            if (firstDay) {
                const month = firstDay.getMonth();
                if (month !== currentMonth) {
                    currentMonth = month;
                    labels.push({
                        text: firstDay.toLocaleString('default', { month: 'short' }),
                        x: index * (CELL_SIZE + CELL_GAP)
                    });
                }
            }
        });

        // Calculate stats
        const activeDays = data.filter(d => d.level > 0).length;
        const currentStreak = calculateCurrentStreak(data);

        return {
            columns: cols,
            monthLabels: labels,
            stats: { activeDays, currentStreak }
        };
    }, [activityDates]);

    return (
        <Card variant="surface" padding="md">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.activeDays}</Text>
                            <Text style={styles.statLabel}>active days</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.currentStreak}</Text>
                            <Text style={styles.statLabel}>current streak</Text>
                        </View>
                    </View>
                    <View style={styles.legend}>
                        <Text style={styles.legendLabel}>Less</Text>
                        <View style={[styles.legendCell, styles.cellInactive]} />
                        <View style={[styles.legendCell, styles.cellActive]} />
                        <Text style={styles.legendLabel}>More</Text>
                    </View>
                </View>

                {/* Grid */}
                <View style={styles.gridWrapper}>
                    {/* Day labels */}
                    <View style={styles.dayLabels}>
                        <Text style={styles.dayLabel}>Mon</Text>
                        <Text style={styles.dayLabel}>Wed</Text>
                        <Text style={styles.dayLabel}>Fri</Text>
                    </View>

                    {/* Scrollable grid */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        nestedScrollEnabled={true}
                    >
                        <View>
                            {/* Month labels */}
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

                            {/* Cells grid */}
                            <View style={styles.grid}>
                                {columns.map((week, colIndex) => (
                                    <View key={colIndex} style={styles.column}>
                                        {week.map((day) => (
                                            <View
                                                key={day.dateStr}
                                                style={[
                                                    styles.cell,
                                                    day.level > 0 ? styles.cellActive : styles.cellInactive,
                                                    day.isToday && styles.cellToday
                                                ]}
                                            />
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Footer */}
                <Text style={styles.footerText}>Last {WEEKS} weeks of activity</Text>
            </View>
        </Card>
    );
};

// Calculate current streak from grid data
function calculateCurrentStreak(data: { dateStr: string; level: number }[]): number {
    let streak = 0;
    // Start from today and go backwards
    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].level > 0) {
            streak++;
        } else if (i < data.length - 1) {
            // Allow today to be inactive (streak continues from yesterday)
            break;
        }
    }
    return streak;
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    statItem: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.dark.text,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.dark.textTertiary,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.dark.whiteAlpha12,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendLabel: {
        fontSize: 10,
        color: colors.dark.textTertiary,
    },
    legendCell: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    gridWrapper: {
        flexDirection: 'row',
    },
    dayLabels: {
        width: 28,
        justifyContent: 'space-between',
        paddingTop: 16, // Account for month labels
        paddingBottom: 2,
    },
    dayLabel: {
        fontSize: 9,
        fontWeight: '500',
        color: colors.dark.textTertiary,
        height: (CELL_SIZE + CELL_GAP) * 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingRight: spacing.md,
    },
    monthRow: {
        height: 14,
        position: 'relative',
        marginBottom: 2,
    },
    monthLabel: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: '600',
        color: colors.dark.textTertiary,
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
        borderRadius: 2,
    },
    cellInactive: {
        backgroundColor: colors.dark.whiteAlpha06,
    },
    cellActive: {
        backgroundColor: colors.dark.pastelGreen,
    },
    cellToday: {
        borderWidth: 1,
        borderColor: colors.dark.text,
    },
    footerText: {
        fontSize: 10,
        color: colors.dark.textTertiary,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
});

export default StreakHeatmap;
