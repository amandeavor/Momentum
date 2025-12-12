import React, { useMemo } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Card from '@/components/common/Card';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppSelector } from '@/store';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StreakCalendarProps {
    /** Optional filter for specific activity types */
    activityType?: 'all' | 'journal' | 'focus' | 'habits';
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ activityType = 'all' }) => {
    const journalEntries = useAppSelector(state => state.journal.entries);
    const pomodoroSessions = useAppSelector(state => state.pomodoro.todaySessions);
    const habitCompletions = useAppSelector(state => state.habits.completions);
    const allPomodoroSessions = useAppSelector(state => state.pomodoro.sessions);

    // Generate last 28 days of activity data using ACTUAL data
    const activityData = useMemo(() => {
        const today = new Date();
        const days: { date: Date; hasActivity: boolean; level: number; dateStr: string }[] = [];

        for (let i = 27; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            let activityCount = 0;

            // Count journal entries on this date
            if (activityType === 'all' || activityType === 'journal') {
                const journalCount = journalEntries.filter(e =>
                    e.created_at?.startsWith(dateStr)
                ).length;
                activityCount += journalCount;
            }

            // Count completed pomodoro sessions on this date
            if (activityType === 'all' || activityType === 'focus') {
                const pomodoroCount = [...allPomodoroSessions, ...pomodoroSessions].filter(s =>
                    s.completed && s.started_at?.startsWith(dateStr)
                ).length;
                activityCount += pomodoroCount;
            }

            // Count habit completions on this date
            if (activityType === 'all' || activityType === 'habits') {
                const habitCount = Object.values(habitCompletions).flat().filter(c =>
                    c.completed_at?.startsWith(dateStr)
                ).length;
                activityCount += habitCount;
            }

            // Calculate activity level (0-3) based on activity count
            let level = 0;
            if (activityCount >= 5) level = 3;
            else if (activityCount >= 3) level = 2;
            else if (activityCount >= 1) level = 1;

            days.push({
                date,
                dateStr,
                hasActivity: level > 0,
                level,
            });
        }

        return days;
    }, [journalEntries, pomodoroSessions, allPomodoroSessions, habitCompletions, activityType]);

    // Split into weeks
    const weeks = useMemo(() => {
        const result: typeof activityData[] = [];
        for (let i = 0; i < activityData.length; i += 7) {
            result.push(activityData.slice(i, i + 7));
        }
        return result;
    }, [activityData]);

    const getActivityColor = (level: number) => {
        switch (level) {
            case 0: return colors.dark.elevated;
            case 1: return colors.dark.pastelGreen + '40';
            case 2: return colors.dark.pastelGreen + '80';
            case 3: return colors.dark.pastelGreen;
            default: return colors.dark.elevated;
        }
    };

    const activeDays = activityData.filter(d => d.hasActivity).length;
    const currentStreak = useMemo(() => {
        let streak = 0;
        for (let i = activityData.length - 1; i >= 0; i--) {
            if (activityData[i].hasActivity) streak++;
            else break;
        }
        return streak;
    }, [activityData]);

    return (
        <Card
            variant="surface"
            padding="lg"
        >
            {/* Stats */}
            <View style={styles.statsRow}>
                <View
                    style={styles.stat}
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`Current streak: ${currentStreak} days`}
                >
                    <Text style={styles.statValue}>{currentStreak}</Text>
                    <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View
                    style={styles.stat}
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`Active days: ${activeDays} out of 28`}
                >
                    <Text style={styles.statValue}>{activeDays}</Text>
                    <Text style={styles.statLabel}>Active Days</Text>
                </View>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabels} importantForAccessibility="no">
                {DAYS.map((day, index) => (
                    <Text key={day} style={styles.dayLabel}>
                        {index % 2 === 0 ? day.charAt(0) : ''}
                    </Text>
                ))}
            </View>

            {/* Activity Grid */}
            <View
                style={styles.grid}
                accessible
                accessibilityRole="none"
                accessibilityLabel="28-day activity heatmap"
            >
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.week}>
                        {week.map((day, dayIndex) => (
                            <View
                                key={dayIndex}
                                style={[
                                    styles.dayCell,
                                    { backgroundColor: getActivityColor(day.level) },
                                ]}
                                accessible
                                accessibilityLabel={`${day.date.toLocaleDateString()}: ${day.level === 0 ? 'no activity' : `activity level ${day.level}`}`}
                            />
                        ))}
                    </View>
                ))}
            </View>

            {/* Legend */}
            <View
                style={styles.legend}
                accessible
                accessibilityLabel="Legend: from less activity to more activity"
            >
                <Text style={styles.legendLabel}>Less</Text>
                {[0, 1, 2, 3].map((level) => (
                    <View
                        key={level}
                        style={[
                            styles.legendCell,
                            { backgroundColor: getActivityColor(level) },
                        ]}
                    />
                ))}
                <Text style={styles.legendLabel}>More</Text>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.xl,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        ...typography.h2,
        color: colors.dark.text,
    },
    statLabel: {
        ...typography.caption,
        color: colors.dark.textTertiary,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.dark.border,
    },
    dayLabels: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.xs,
    },
    dayLabel: {
        ...typography.caption,
        color: colors.dark.textTertiary,
        width: 28,
        textAlign: 'center',
        fontSize: 10,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.xs,
    },
    week: {
        gap: spacing.xs,
    },
    dayCell: {
        width: 28,
        height: 28,
        borderRadius: radii.sm,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: spacing.xs,
    },
    legendCell: {
        width: 14,
        height: 14,
        borderRadius: 3,
    },
    legendLabel: {
        ...typography.caption,
        color: colors.dark.textTertiary,
        fontSize: 10,
    },
});

export default StreakCalendar;