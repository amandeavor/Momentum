import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AvatarPicker from '@/components/common/AvatarPicker';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectSettings,
  setTheme,
  setHapticLevel,
} from '@/store/slices/settingsSlice';
import {
  selectTodosStats,
  selectJournalStreak,
  selectPomodoroHistory,
} from '@/store/selectors';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Preset avatar colors
const PRESET_AVATARS: Record<string, string[]> = {
  gradient1: ['#8fcfff', '#c4b5fd'],
  gradient2: ['#ffb3c7', '#fcd5b5'],
};

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { session, profile, signOut, loading } = useAuth();
  const settings = useAppSelector(selectSettings);
  const haptics = useHaptics();
  const taskStats = useAppSelector(selectTodosStats);
  const journalStreak = useAppSelector(selectJournalStreak);
  const journalEntries = useAppSelector(state => state.journal?.entries || []);
  const pomodoroHistory = useAppSelector(selectPomodoroHistory);

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
  const [editName, setEditName] = useState(profile?.display_name || '');

  const totalFocusMinutes = pomodoroHistory.reduce(
    (total, session) => total + session.duration_minutes,
    0
  );
  const totalFocusHours = Math.floor(totalFocusMinutes / 60);

  const isAnonymous = !profile?.username;
  const displayName = profile?.display_name || profile?.username || 'Guest';
  const initials = displayName.charAt(0).toUpperCase();

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

  const handleUpgradeAccount = () => {
    router.push('/(auth)/register');
  };

  const handleOpenSettings = () => {
    router.push('/(main)/settings');
  };

  const handleAvatarSelect = (uri: string | null, type: 'preset' | 'custom') => {
    setAvatarUri(uri);
    haptics.success();
  };

  const handleSaveProfile = () => {
    setShowEditProfile(false);
    haptics.success();
  };

  const renderAvatar = () => {
    if (avatarUri?.startsWith('file://') || avatarUri?.startsWith('http')) {
      return <Image source={{ uri: avatarUri }} style={styles.avatarImage} />;
    }

    // Default monochrome gradient for avatar
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
      {/* Hero Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <Pressable onPress={() => setShowAvatarPicker(true)} style={styles.avatarContainer}>
                  <View style={styles.avatarGlow} />
                  {renderAvatar()}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={12} color="#000" />
                  </View>
                </Pressable>
                <View style={styles.profileInfo}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <Text style={styles.email}>
                    {profile?.username || 'Guest Account'}
                  </Text>
                </View>
              </View>

              {isAnonymous && (
                <View style={styles.upgradePrompt}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.upgradeText}>
                    Create an account to sync your data
                  </Text>
                </View>
              )}

              <Pressable
                style={styles.profileButton}
                onPress={isAnonymous ? handleUpgradeAccount : () => setShowEditProfile(true)}
              >
                <LinearGradient
                  colors={['#ffffff', '#e5e5e5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.profileButtonGradient}
                >
                  <Text style={styles.profileButtonText}>
                    {isAnonymous ? 'Create Account' : 'Edit Profile'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>
        </Animated.View>





        {/* Quick Settings Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.sectionHeader}>Quick Settings</Text>

          <View style={styles.bentoGrid}>
            {/* Top Row - Large Featured Tile */}
            <BentoTile
              icon="settings-outline"
              label="All Settings"
              size="large"
              onPress={handleOpenSettings}
              hapticFeedback={haptics.medium}
            />

            {/* Bottom Row - Two Small Tiles */}
            <View style={styles.bentoRow}>
              <BentoTile
                icon="contrast-outline"
                label="Theme"
                value={settings.theme === 'dark' ? 'Dark' : settings.theme === 'light' ? 'Light' : 'System'}
                size="small"
                onPress={() => {
                  const next = settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark';
                  dispatch(setTheme(next));
                }}
                hapticFeedback={haptics.selection}
              />
              <BentoTile
                icon="hand-left-outline"
                label="Haptics"
                value={settings.hapticLevel === 'full' ? 'Full' : settings.hapticLevel === 'reduced' ? 'Reduced' : 'Off'}
                size="small"
                onPress={() => {
                  const next = settings.hapticLevel === 'full' ? 'reduced' : settings.hapticLevel === 'reduced' ? 'off' : 'full';
                  dispatch(setHapticLevel(next));
                }}
                hapticFeedback={haptics.success}
              />
            </View>
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={styles.sectionHeader}>Support</Text>

          <View style={styles.bentoGrid}>
            {/* Top Row - Two Medium Tiles */}
            <View style={styles.bentoRow}>
              <BentoTile
                icon="help-circle-outline"
                label="Help & FAQ"
                size="medium"
                onPress={() => Alert.alert('Help', 'Help documentation coming soon!')}
                hapticFeedback={haptics.light}
              />
              <BentoTile
                icon="chatbubble-outline"
                label="Feedback"
                size="medium"
                onPress={() => Alert.alert('Feedback', 'Feedback form coming soon!')}
                hapticFeedback={haptics.light}
              />
            </View>
          </View>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          <Text style={styles.version}>Momentum v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={avatarUri}
        onSelectAvatar={handleAvatarSelect}
        userName={displayName}
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
                colors={[colors.dark.pastelBlue, colors.dark.pastelPurple]}
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

// Settings Row Component
interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  showChevron?: boolean;
  onPress: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  showChevron = false,
  onPress,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.settingsRow,
      pressed && styles.settingsRowPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.settingsLeft}>
      <View style={styles.settingsIconContainer}>
        <Ionicons name={icon} size={20} color={colors.dark.textSecondary} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
    </View>
    <View style={styles.settingsRight}>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.dark.textTertiary} />
      )}
    </View>
  </Pressable>
);

interface BentoTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  size?: 'small' | 'medium' | 'large';
  onPress: () => void;
  hapticFeedback?: () => void;
}

const BentoTile: React.FC<BentoTileProps> = ({ icon, label, value, size = 'medium', onPress, hapticFeedback }) => {
  const getTileStyle = () => {
    switch (size) {
      case 'small':
        return styles.bentoTileSmall;
      case 'large':
        return styles.bentoTileLarge;
      default:
        return styles.bentoTileMedium;
    }
  };


  const getGradientColors = () => {
    switch (size) {
      case 'large':
        // Metallic pearl/silver gradient - polished finish
        return ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#e9ecef'] as const;
      case 'small':
        return ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const;
      default:
        return ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.025)'] as const;
    }
  };

  const isLarge = size === 'large';

  const handlePress = () => {
    hapticFeedback?.();
    onPress();
  };

  return (
    <Pressable
      style={[styles.bentoTile, getTileStyle()]}
      onPress={handlePress}
      android_ripple={{ color: isLarge ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
    >
      {/* Glow effect for large tiles */}
      {isLarge && <View style={styles.bentoGlow} />}

      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bentoTileGradient, isLarge && styles.bentoTileGradientLarge]}
      >
        {/* Metallic shimmer overlay for reflective effect */}
        {isLarge && (
          <>
            {/* Primary metallic reflection */}
            <LinearGradient
              colors={['rgba(255,255,255,0.4)', 'transparent', 'rgba(255,255,255,0.15)', 'transparent'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bentoShimmer}
            />
            {/* Secondary cool metallic accent */}
            <LinearGradient
              colors={['transparent', 'rgba(203,213,225,0.12)', 'transparent'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.bentoShimmer, { opacity: 0.5 }]}
            />
          </>
        )}
        {/* Border effect */}
        <View style={[styles.bentoTileBorder, isLarge && styles.bentoTileBorderLarge]} />
        <View style={[styles.bentoIconContainer, isLarge && styles.bentoIconContainerLarge]}>
          <Ionicons name={icon} size={isLarge ? 32 : 24} color={isLarge ? '#0b0b0d' : '#fff'} />
        </View>
        <View style={styles.bentoTextContainer}>
          <Text style={[styles.bentoLabel, isLarge && styles.bentoLabelLarge]}>{label}</Text>
          {value && <Text style={styles.bentoValue}>{value}</Text>}
        </View>
      </LinearGradient>
    </Pressable>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Deep black
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
    marginBottom: 6,
    lineHeight: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  avatarEditBadge: {
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
    borderColor: '#000',
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  upgradeText: {
    ...typography.bodySmall,
    color: '#fff',
    flex: 1,
  },
  profileButton: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  profileButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  profileButtonText: {
    ...typography.body,
    color: '#000',
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  settingsRowPressed: {
    opacity: 0.7,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#fff',
    letterSpacing: -0.2,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingsValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textSecondary,
    letterSpacing: -0.1,
  },
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
    letterSpacing: 0.2,
    opacity: 0.6,
  },
  // Modal styles
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
    color: colors.dark.background,
    letterSpacing: -0.2,
  },
  // Bento Grid Styles
  bentoGrid: {
    gap: spacing.md,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoTile: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoTileSmall: {
    flex: 1,
    height: 140,
  },
  bentoTileMedium: {
    flex: 1,
    height: 160,
  },
  bentoTileLarge: {
    width: '100%',
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  // Glow effect for large tiles
  bentoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Subtle white metallic glow
    opacity: 0.5,
    zIndex: -1,
  },
  bentoTileGradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    position: 'relative',
  },
  bentoTileGradientLarge: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)', // Polished metallic edge
    padding: spacing.xl,
  },
  // Shimmer overlay for large tiles
  bentoShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.xl,
    pointerEvents: 'none',
  },
  bentoTileBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    pointerEvents: 'none',
  },
  bentoTileBorderLarge: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', // Metallic silver border
  },
  bentoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bentoIconContainerLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.05)', // Subtle metallic background
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bentoTextContainer: {
    gap: 4,
  },
  bentoLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bentoLabelLarge: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.7)', // Dark text for white background
    letterSpacing: 1.5,
    fontFamily: 'Inter_700Bold',
  },
  bentoValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
});

export default ProfileScreen;
