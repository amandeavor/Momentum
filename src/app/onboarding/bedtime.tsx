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
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Button from '@/components/common/Button';

export default function BedtimeScreen() {
  const insets = useSafeAreaInsets();
  const [bedtime, setBedtime] = useState(new Date(new Date().setHours(22, 30, 0, 0)));
  
  const [notifications, setNotifications] = useState({
    dailyCheckIn: true,
    pomodoro: true,
    todos: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    // TODO: Save bedtime and notification preferences
    router.push('/onboarding/capabilities');
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
        <Text style={styles.title}>When do you usually sleep?</Text>

        {/* Bedtime Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>What time do you usually go to bed?</Text>
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={bedtime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => date && setBedtime(date)}
              textColor={colors.dark.text}
              themeVariant="dark"
            />
          </View>
          <Text style={styles.helperText}>
            We'll remind you to journal and plan tomorrow before this time.
          </Text>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What should we remind you about?</Text>
          
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Daily bedtime check-in</Text>
              <Text style={styles.toggleHelper}>Journal + plan your timeblocks for tomorrow.</Text>
            </View>
            <Switch
              value={notifications.dailyCheckIn}
              onValueChange={() => toggleNotification('dailyCheckIn')}
              trackColor={{ false: colors.dark.surface, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : notifications.dailyCheckIn ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Pomodoro session reminders</Text>
              <Text style={styles.toggleHelper}>When focus or break sessions end.</Text>
            </View>
            <Switch
              value={notifications.pomodoro}
              onValueChange={() => toggleNotification('pomodoro')}
              trackColor={{ false: colors.dark.surface, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : notifications.pomodoro ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Todo reminders</Text>
              <Text style={styles.toggleHelper}>When it's time to do small tasks like calls, shopping, workout.</Text>
            </View>
            <Switch
              value={notifications.todos}
              onValueChange={() => toggleNotification('todos')}
              trackColor={{ false: colors.dark.surface, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : notifications.todos ? '#fff' : '#f4f3f4'}
            />
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
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark.text,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.dark.text,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  helperText: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.sm,
  },
  pickerContainer: {
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  toggleInfo: {
    flex: 1,
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
  footer: {
    marginTop: spacing.lg,
  },
});
