import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/common/Card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description,
  icon,
  iconColor = colors.dark.text,
}) => {
  return (
    <Card variant="surface" padding="md">
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h2,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.caption,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
});

export default StatsCard;