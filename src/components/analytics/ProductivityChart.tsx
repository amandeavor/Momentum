import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '@/components/common/Card';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface ChartDataPoint {
  day: string;
  minutes: number;
}

interface ProductivityChartProps {
  data: ChartDataPoint[];
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({ data }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const maxMinutes = Math.max(...data.map(d => d.minutes), 60); // At least 60m scale
  const barWidth = 28;

  // Get today's day name to match with data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = days[new Date().getDay()];

  const handlePress = (index: number) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  // Find today's index in the data
  const todayIndex = data.findIndex(d => d.day === todayName);

  // Calculate display values
  const displayIndex = selectedIndex !== null ? selectedIndex : todayIndex;
  const displayItem = displayIndex >= 0 && displayIndex < data.length ? data[displayIndex] : null;
  const displayMinutes = displayItem?.minutes ?? 0;
  const displayHours = Math.floor(displayMinutes / 60);
  const displayMins = displayMinutes % 60;
  const timeDisplay = displayMinutes === 0 ? '0m' : displayHours > 0 ? `${displayHours}h ${displayMins}m` : `${displayMins}m`;

  return (
    <Card variant="surface" padding="lg">
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>
            {selectedIndex !== null ? data[selectedIndex].day : 'Today'}
          </Text>
          <Text style={styles.totalValue}>{timeDisplay}</Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Focus Time</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.gridLines}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>

        <View style={styles.bars}>
          {data.map((item, index) => {
            const isToday = item.day === todayName;
            const isSelected = selectedIndex === index;
            const barHeightPercentage = Math.max((item.minutes / maxMinutes) * 100, 4);

            return (
              <TouchableOpacity
                key={index}
                style={styles.barWrapper}
                onPress={() => handlePress(index)}
                activeOpacity={0.7}
              >
                <View style={styles.barBackground}>
                  <Animated.View
                    entering={FadeInDown.delay(index * 35).duration(260)}
                    style={[
                      styles.bar,
                      {
                        height: `${barHeightPercentage}%`,
                        width: barWidth,
                      },
                      isSelected && styles.barSelected,
                      isToday && !isSelected && styles.barToday,
                      !isToday && !isSelected && styles.barDefault,
                    ]}
                  >
                    {(isToday || isSelected) && (
                      <LinearGradient
                        colors={[colors.dark.whiteAlpha20, 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </Animated.View>
                </View>
                <Text style={[
                  styles.label,
                  isToday && styles.labelToday,
                  isSelected && styles.labelSelected
                ]}>{item.day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -0.5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dark.whiteAlpha06,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.pastelPurple,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textSecondary,
  },
  chartContainer: {
    height: 140,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    bottom: 24,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.dark.whiteAlpha06,
    width: '100%',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    paddingBottom: spacing.sm,
  },
  bar: {
    borderRadius: radii.sm,
    minHeight: 8,
  },
  barDefault: {
    backgroundColor: colors.dark.whiteAlpha12,
  },
  barToday: {
    backgroundColor: colors.dark.pastelPurple,
    shadowColor: colors.dark.pastelPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  barSelected: {
    backgroundColor: colors.dark.primary,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  label: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    fontSize: 11,
  },
  labelToday: {
    color: colors.dark.pastelPurple,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.dark.text,
    fontWeight: '700',
  },
});

export default ProductivityChart;