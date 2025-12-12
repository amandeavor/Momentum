import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, { FadeInDown } from 'react-native-reanimated';

import AvatarPicker from '@/components/common/AvatarPicker';
import TimePickerModal from '@/components/common/TimePickerModal';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectSettings,
  setTheme,
  setHapticLevel,
  setNotificationsEnabled,
  setPomodoroFocusDuration,
  setPomodoroShortBreakDuration,
  setPomodoroAutoStartBreaks,
  setBedtime,
} from '@/store/slices/settingsSlice';
import {
  selectCapabilities,
  fetchCapabilities,
  toggleCapability,
} from '@/store/slices/capabilitiesSlice';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { session, profile, signOut, isAnonymous: authIsAnonymous, updateUserProfile } = useAuth();
  const settings = useAppSelector(selectSettings);
  const capabilities = useAppSelector(selectCapabilities);
  const haptics = useHaptics();

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
  const [editName, setEditName] = useState(profile?.display_name || '');

  // Fetch capabilities on mount
  useEffect(() => {
    dispatch(fetchCapabilities());
  }, [dispatch]);

  // Sync editName when profile changes
  useEffect(() => {
    if (profile?.display_name) {
      setEditName(profile.display_name);
    }
  }, [profile?.display_name]);

  // Use auth hook's isAnonymous or fallback to checking if user has no email
  const isAnonymous = authIsAnonymous || !session?.user?.email;
  const displayName = profile?.display_name || profile?.username || session?.user?.email?.split('@')[0] || 'Guest';
  const initials = displayName.charAt(0).toUpperCase();

  const FOCUS_DURATIONS = [15, 25, 30, 45, 60];
  const BREAK_DURATIONS = [5, 10, 15];

  const formatBedtime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleProfileCardPress = () => {
    haptics.light();
    setShowEditProfile(true);
  };

  const handleAvatarSelect = (uri: string | null, type: 'preset' | 'custom') => {
    setAvatarUri(uri);
    haptics.success();
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({ display_name: editName });
      setShowEditProfile(false);
      haptics.success();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const renderAvatar = () => {
    if (avatarUri?.startsWith('file://') || avatarUri?.startsWith('http')) {
      return <Image source={{ uri: avatarUri }} style={styles.avatarImage} />;
    }

    return (
      <LinearGradient
        colors={['#ffffff', '#9ca3af']}
        style={styles.avatarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.avatarInitials}>{initials}</Text>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.pageTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card - Click to Edit */}
        <AnimatedReanimated.View entering={FadeInDown.delay(50).duration(400)}>
          <Pressable onPress={handleProfileCardPress} style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileRow}>
                <View style={styles.avatarContainer}>
                  {renderAvatar()}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <Text style={styles.email}>
                    {session?.user?.email || 'Tap to edit profile'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.dark.textTertiary} />
              </View>

              {isAnonymous && (
                <View style={styles.upgradePrompt}>
                  <Ionicons name="alert-circle-outline" size={16} color="#fbbf24" />
                  <Text style={styles.upgradeText}>
                    Create an account to sync your data
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </AnimatedReanimated.View>

        {/* Features Section */}
        <AnimatedReanimated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionHeader}>Features</Text>
          <View style={styles.section}>
            <SettingToggle
              icon="document-text"
              label="Quick Notes"
              value={capabilities?.notes_enabled ?? false}
              onToggle={() => dispatch(toggleCapability('notes_enabled'))}
            />
          </View>
        </AnimatedReanimated.View>

        {/* Focus Timer Section */}
        <AnimatedReanimated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionHeader}>Focus Timer</Text>
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

        {/* Preferences Section */}
        <AnimatedReanimated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.section}>
            <SettingItem
              icon="moon"
              label="Bedtime"
              value={formatBedtime(settings.bedtime)}
              onPress={() => setShowBedtimePicker(true)}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="contrast"
              label="Theme"
              value={settings.theme === 'dark' ? 'Dark' : settings.theme === 'light' ? 'Light' : 'System'}
              onPress={() => {
                const themes: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
                const idx = themes.indexOf(settings.theme);
                dispatch(setTheme(themes[(idx + 1) % themes.length]));
                haptics.selection();
              }}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="hand-left"
              label="Haptics"
              value={settings.hapticLevel === 'full' ? 'Full' : settings.hapticLevel === 'reduced' ? 'Reduced' : 'Off'}
              onPress={() => {
                const levels: Array<'full' | 'reduced' | 'off'> = ['full', 'reduced', 'off'];
                const idx = levels.indexOf(settings.hapticLevel);
                dispatch(setHapticLevel(levels[(idx + 1) % levels.length]));
                haptics.selection();
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

        {/* About Section */}
        <AnimatedReanimated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.sectionHeader}>About</Text>
          <View style={styles.section}>
            <SettingItem icon="information-circle" label="Version" value="1.0.0" />
            <View style={styles.divider} />
            <SettingItem
              icon="star"
              label="Rate App"
              onPress={() => Alert.alert('Coming Soon', 'Rating coming soon!')}
              showChevron
            />
            <View style={styles.divider} />
            <SettingItem
              icon="chatbubble"
              label="Feedback"
              onPress={() => Alert.alert('Coming Soon', 'Feedback coming soon!')}
              showChevron
            />
          </View>
        </AnimatedReanimated.View>

        {/* Sign Out */}
        <AnimatedReanimated.View entering={FadeInDown.delay(300).duration(400)}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          <Text style={styles.version}>Momentum v1.0.0</Text>
        </AnimatedReanimated.View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={avatarUri}
        onSelectAvatar={handleAvatarSelect}
        userName={displayName}
      />

      {/* Bedtime Picker Modal */}
      <TimePickerModal
        visible={showBedtimePicker}
        onClose={() => setShowBedtimePicker(false)}
        value={settings.bedtime}
        onSave={(time) => dispatch(setBedtime(time))}
        title="Set Bedtime"
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEditProfile(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditProfile(false)}>
          <Pressable style={styles.editModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setShowEditProfile(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
              </Pressable>
            </View>

            {/* Avatar in modal */}
            <Pressable
              onPress={() => {
                setShowEditProfile(false);
                setTimeout(() => setShowAvatarPicker(true), 300);
              }}
              style={styles.editAvatarContainer}
            >
              {renderAvatar()}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={14} color="#000" />
              </View>
            </Pressable>

            <Text style={styles.editLabel}>Display Name</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={colors.dark.textTertiary}
            />

            <Pressable style={styles.editSaveButton} onPress={handleSaveProfile}>
              <LinearGradient
                colors={['#ffffff', '#e5e5e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editSaveGradient}
              >
                <Text style={styles.editSaveText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// Setting Item Component (clickable row)
const SettingItem = ({ icon, label, value, onPress, showChevron }: {
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
  const thumbPosition = useRef(new Animated.Value(value ? 27 : 3)).current;

  useEffect(() => {
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  // Profile Card
  profileCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  upgradeText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#fbbf24',
    flex: 1,
  },
  // Sections
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    opacity: 0.7,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
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
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textSecondary,
  },
  pillTextActive: {
    color: '#000',
  },
  // Toggle
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
  },
  // Sign Out
  signOutButton: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.error,
    letterSpacing: -0.2,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    opacity: 0.6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  editModal: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  editModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -0.5,
  },
  editAvatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark.surface,
  },
  editLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textTertiary,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.dark.text,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  editSaveButton: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  editSaveGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  editSaveText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
    letterSpacing: -0.2,
  },
});

export default ProfileScreen;
