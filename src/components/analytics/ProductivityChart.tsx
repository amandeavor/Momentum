import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
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

  const { width } = Dimensions.get('window');
  const chartWidth = width - spacing.lg * 4;
  const barWidth = Math.min(chartWidth / data.length - spacing.sm, 32);
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0, Sun=6

  const handlePress = (index: number) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  return (
    <Card variant="surface" padding="lg">
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>
            {selectedIndex !== null ? data[selectedIndex].day : 'Today'}
          </Text>
          <Text style={styles.totalValue}>
            {selectedIndex !== null
              ? `${Math.floor(data[selectedIndex].minutes / 60)}h ${data[selectedIndex].minutes % 60}m`
              : `${Math.floor(data[dayIndex]?.minutes / 60 || 0)}h ${data[dayIndex]?.minutes % 60 || 0}m`
            }
          </Text>
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
            const isToday = index === dayIndex;
            const isSelected = selectedIndex === index;
            // Ensure at least a tiny sliver is visible so it's tappable
            const barHeightPercentage = Math.max((item.minutes / maxMinutes) * 100, 4);

            return (
              <Pressable
                key={index}
                style={styles.barWrapper}
                onPress={() => handlePress(index)}
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
              </Pressable>
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
    marginBottom: spacing.xl,
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
    height: 180,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    bottom: 24, // Leave space for labels
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
    paddingBottom: 4, // Slight bottom padding
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