import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Button from '@/components/common/Button';

export default function CapabilitiesScreen() {
  const insets = useSafeAreaInsets();
  
  const [features, setFeatures] = useState({
    journaling: true,
    notes: true,
    streaks: true,
    selfControl: false,
  });

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    // TODO: Save feature preferences
    router.push({ pathname: '/onboarding/theme', params: { selfControl: features.selfControl ? '1' : '0' } }); 
  };

  const CoreFeature = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
    <View style={styles.featureRow}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <View style={styles.checkContainer}>
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What do you want Momentum to handle for you?</Text>
        <Text style={styles.subtitle}>
          You can change these anytime in settings.
        </Text>

        {/* Core Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core capabilities (always on)</Text>
          <View style={styles.card}>
            <CoreFeature 
              icon="timer-outline" 
              title="Focus sessions (Pomodoro)" 
              description="Deep work timers with custom durations and breaks." 
            />
            <View style={styles.divider} />
            <CoreFeature 
              icon="calendar-outline" 
              title="Timeblocks for your day" 
              description="Plan tomorrow in advance so you know exactly what to do." 
            />
            <View style={styles.divider} />
            <CoreFeature 
              icon="checkbox-outline" 
              title="Smart todos" 
              description="Small tasks with time-based reminders." 
            />
          </View>
        </View>

        {/* Optional Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Turn extras on or off</Text>
          
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Daily journal</Text>
                <Text style={styles.toggleHelper}>Reflect at bedtime and export entries when you want feedback.</Text>
              </View>
              <Switch
                value={features.journaling}
                onValueChange={() => toggleFeature('journaling')}
                trackColor={{ false: colors.dark.surface, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : features.journaling ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Notes</Text>
                <Text style={styles.toggleHelper}>Quick notes with titles, separate from your journal.</Text>
              </View>
              <Switch
                value={features.notes}
                onValueChange={() => toggleFeature('notes')}
                trackColor={{ false: colors.dark.surface, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : features.notes ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Streaks & progress</Text>
                <Text style={styles.toggleHelper}>See how consistent you are with learning, focus, and other habits.</Text>
              </View>
              <Switch
                value={features.streaks}
                onValueChange={() => toggleFeature('streaks')}
                trackColor={{ false: colors.dark.surface, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : features.streaks ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Self-control mode</Text>
                <Text style={styles.toggleHelper}>Private tools for handling urges, streak tracking and breathing exercises.</Text>
              </View>
              <Switch
                value={features.selfControl}
                onValueChange={() => toggleFeature('selfControl')}
                trackColor={{ false: colors.dark.surface, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : features.selfControl ? '#fff' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.helperSmall}>Off by default. You can enable this later in settings.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={handleContinue}
            fullWidth
          />
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark.text,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
  checkContainer: {
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleHelper: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  helperSmall: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
