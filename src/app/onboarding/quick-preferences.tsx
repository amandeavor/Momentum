import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Button from '@/components/common/Button';
import { useAppDispatch } from '@/store';
import { completeOnboarding } from '@/store/slices/settingsSlice';

const PRIORITY_OPTIONS = [
  {
    id: 'focus',
    title: 'Staying focused (pomodoro)',
    description: 'Dial in with focus and break timers.',
  },
  {
    id: 'planning',
    title: 'Planning my day (timeblocks)',
    description: 'Plan tomorrow so you know exactly what to do.',
  },
  {
    id: 'todos',
    title: 'Remembering tasks (todos)',
    description: 'Keep small tasks on schedule with reminders.',
  },
  {
    id: 'streaks',
    title: 'Building streaks',
    description: 'Stay consistent and see your progress.',
  },
];

export default function QuickPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const selfControlEnabled = useMemo(() => params.selfControl === '1' || params.selfControl === 'true', [params.selfControl]);

  const options = useMemo(() => {
    if (!selfControlEnabled) return PRIORITY_OPTIONS;
    return [
      ...PRIORITY_OPTIONS,
      {
        id: 'self_control',
        title: 'Self-control & urges',
        description: 'Keep urges in check and track your streak privately.',
      },
    ];
  }, [selfControlEnabled]);

  const [selection, setSelection] = useState<string>(options[0]?.id ?? 'focus');

  const handleFinish = () => {
    // TODO: Save quick preference and use to highlight dashboard defaults
    dispatch(completeOnboarding());
    router.replace('/(main)/dashboard');
  };

  const OptionCard = ({ id, title, description }: { id: string; title: string; description: string }) => {
    const isSelected = selection === id;
    return (
      <Pressable
        onPress={() => setSelection(id)}
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      >
        <View style={styles.optionHeader}>
          <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{title}</Text>
          {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
        </View>
        <Text style={styles.optionDescription}>{description}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>      
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Make Momentum yours</Text>
        <Text style={styles.subtitle}>We’ll highlight what matters most on your dashboard.</Text>

        <Text style={styles.label}>What’s the main thing you want Momentum to help you with right now?</Text>

        <View style={styles.optionsList}>
          {options.map(opt => (
            <OptionCard key={opt.id} {...opt} />
          ))}
        </View>

        <View style={styles.footer}>
          <Button label="Finish setup" onPress={handleFinish} fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.dark.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.dark.surface,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  optionTitle: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  footer: {
    marginTop: spacing.xl,
  },
});
