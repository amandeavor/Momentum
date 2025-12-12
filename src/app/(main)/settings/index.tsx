import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, { FadeInDown } from 'react-native-reanimated';

import TimePickerModal from '@/components/common/TimePickerModal';
import { useAppSelector, useAppDispatch } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import {
  selectSettings,
  selectTimeblockViewStyle,
  setTheme,
  setHapticLevel,
  setNotificationsEnabled,
  setPomodoroFocusDuration,
  setPomodoroShortBreakDuration,
  setPomodoroLongBreakDuration,
  setPomodoroAutoStartBreaks,
  setPomodoroAutoStartFocus,
  setBedtime,
  setTimeblockViewStyle,
} from '@/store/slices/settingsSlice';
import {
  selectCapabilities,
  fetchCapabilities,
  toggleCapability,
} from '@/store/slices/capabilitiesSlice';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { profile } = useAuth();
  const settings = useAppSelector(selectSettings);
  const capabilities = useAppSelector(selectCapabilities);
  const timeblockViewStyle = useAppSelector(selectTimeblockViewStyle);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);

  useEffect(() => {
    dispatch(fetchCapabilities());
  }, [dispatch]);

  const FOCUS_DURATIONS = [15, 25, 30, 45, 60];
  const BREAK_DURATIONS = [5, 10, 15];

  const formatBedtime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.text} />
        </Pressable>
        <Text style={styles.pageTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <AnimatedReanimated.View entering={FadeInDown.delay(50).duration(400)}>
          <Pressable
            onPress={() => router.push('/(main)/profile')}
            style={styles.profileCardContainer}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <LinearGradient
                colors={['#ffffff', '#9ca3af']}
                style={styles.profileAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.profileInitial}>
                  {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.display_name || profile?.username || 'User'}
                </Text>
                <Text style={styles.profileEmail}>View Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.dark.textTertiary} />
            </LinearGradient>
          </Pressable>
        </AnimatedReanimated.View>

        {/* Features */}
        <AnimatedReanimated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.section}>
            <SettingToggle
              icon="document-text"
              label="Quick Notes"
              value={capabilities?.notes_enabled ?? false}
              onToggle={() => dispatch(toggleCapability('notes_enabled'))}
            />
          </View>
        </AnimatedReanimated.View>

        {/* Focus Timer */}
        <AnimatedReanimated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionTitle}>Focus Timer</Text>
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Focus Duration</Text>
              <View style={styles.pillGroup}>
                {FOCUS_DURATIONS.map(d => (
                  <Pressable
                    key={d}
                    style={[
                      styles.pill,
                      settings.pomodoro.focusDuration === d && styles.pillActive
                    ]}
                    onPress={() => dispatch(setPomodoroFocusDuration(d))}
                  >
                    <Text style={[
                      styles.pillText,
                      settings.pomodoro.focusDuration === d && styles.pillTextActive
                    ]}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Break Duration</Text>
              <View style={styles.pillGroup}>
                {BREAK_DURATIONS.map(d => (
                  <Pressable
                    key={d}
                    style={[
                      styles.pill,
                      settings.pomodoro.shortBreakDuration === d && styles.pillActive
                    ]}
                    onPress={() => dispatch(setPomodoroShortBreakDuration(d))}
                  >
                    <Text style={[
                      styles.pillText,
                      settings.pomodoro.shortBreakDuration === d && styles.pillTextActive
                    ]}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
            <SettingToggle
              icon="play-circle"
              label="Auto-start Breaks"
              value={settings.pomodoro.autoStartBreaks}
              onToggle={() => dispatch(setPomodoroAutoStartBreaks(!settings.pomodoro.autoStartBreaks))}
            />
          </View>
        </AnimatedReanimated.View>

        {/* Preferences */}
        <AnimatedReanimated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.section}>
            <SettingRow
              icon="moon"
              label="Bedtime"
              value={formatBedtime(settings.bedtime)}
              onPress={() => setShowBedtimePicker(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="contrast"
              label="Theme"
              value={settings.theme === 'dark' ? 'Dark' : settings.theme === 'light' ? 'Light' : 'System'}
              onPress={() => {
                const themes: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
                const idx = themes.indexOf(settings.theme);
                dispatch(setTheme(themes[(idx + 1) % themes.length]));
              }}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="hand-left"
              label="Haptics"
              value={settings.hapticLevel === 'full' ? 'Full' : settings.hapticLevel === 'reduced' ? 'Reduced' : 'Off'}
              onPress={() => {
                const levels: Array<'full' | 'reduced' | 'off'> = ['full', 'reduced', 'off'];
                const idx = levels.indexOf(settings.hapticLevel);
                dispatch(setHapticLevel(levels[(idx + 1) % levels.length]));
              }}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="notifications"
              label="Notifications"
              value={settings.notifications.enabled}
              onToggle={() => dispatch(setNotificationsEnabled(!settings.notifications.enabled))}
            />
          </View>
        </AnimatedReanimated.View>

        {/* About */}
        <AnimatedReanimated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.section}>
            <SettingRow icon="information-circle" label="Version" value="1.0.0" />
            <View style={styles.divider} />
            <SettingRow
              icon="star"
              label="Rate App"
              onPress={() => Alert.alert('Coming Soon', 'Rating coming soon!')}
              showChevron
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubble"
              label="Feedback"
              onPress={() => Alert.alert('Coming Soon', 'Feedback coming soon!')}
              showChevron
            />
          </View>
        </AnimatedReanimated.View>
      </ScrollView>

      <TimePickerModal
        visible={showBedtimePicker}
        onClose={() => setShowBedtimePicker(false)}
        value={settings.bedtime}
        onSave={(time) => dispatch(setBedtime(time))}
        title="Set Bedtime"
      />
    </View>
  );
};

// Setting Row Component
const SettingRow = ({ icon, label, value, onPress, showChevron }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) => (
  <Pressable
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingLeft}>
      <Ionicons name={icon as any} size={20} color={colors.dark.textSecondary} />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <View style={styles.settingRight}>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.dark.textTertiary} />}
    </View>
  </Pressable>
);

// Setting Toggle Component with Premium Design
const SettingToggle = ({ icon, label, value, onToggle }: {
  icon: string;
  label: string;
  value: boolean;
  onToggle: () => void;
}) => {
  const thumbPosition = React.useRef(new Animated.Value(value ? 27 : 3)).current;

  React.useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: value ? 27 : 3,
      damping: 15,
      stiffness: 150,
      mass: 0.8,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={colors.dark.textSecondary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Pressable
        onPress={onToggle}
        style={[styles.customToggle, value && styles.customToggleActive]}
      >
        <LinearGradient
          colors={value ? ['#ffffff', '#e5e5e5'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)'] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.customToggleThumb,
            { marginLeft: thumbPosition }
          ]}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  profileCardContainer: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textSecondary,
    marginTop: 2,
    letterSpacing: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
    opacity: 0.7,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.text,
    letterSpacing: -0.3,
  },
  settingValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textSecondary,
    letterSpacing: -0.2,
  },
  settingRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.lg,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 48,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textSecondary,
    letterSpacing: 0.1,
  },
  pillTextActive: {
    color: '#000',
    fontFamily: 'Inter_600SemiBold',
  },
  // Custom Toggle Styles
  toggleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  toggleIconContainerActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  customToggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  customToggleActive: {
    borderColor: '#fff',
  },
  customToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

});

export default SettingsScreen;
