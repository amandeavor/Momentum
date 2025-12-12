import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Button from '@/components/common/Button';

type ThemeOption = 'system' | 'dark' | 'light';

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');

  const handleContinue = () => {
    // TODO: Save theme preference
    router.push({ pathname: '/onboarding/quick-preferences', params: { selfControl: params.selfControl ?? '0' } });
  };

  const ThemeCard = ({ type, label, icon }: { type: ThemeOption; label: string; icon: string }) => {
    const isSelected = selectedTheme === type;

    const previewBg =
      type === 'light'
        ? '#FFFFFF'
        : type === 'dark'
          ? '#000000'
          : systemColorScheme === 'dark'
            ? '#000000'
            : '#FFFFFF';
    const previewText =
      type === 'light'
        ? '#000000'
        : type === 'dark'
          ? '#FFFFFF'
          : systemColorScheme === 'dark'
            ? '#FFFFFF'
            : '#000000';
    const previewAccent = colors.primary;

    return (
      <TouchableOpacity
        style={[styles.themeCard, isSelected && styles.themeCardSelected]}
        onPress={() => setSelectedTheme(type)}
        activeOpacity={0.8}
      >
        <View style={[styles.previewContainer, { backgroundColor: previewBg }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewCircle, { backgroundColor: previewText, opacity: 0.2 }]} />
            <View style={[styles.previewBar, { backgroundColor: previewText, opacity: 0.1 }]} />
          </View>
          <View style={styles.previewContent}>
            <View style={[styles.previewCard, { backgroundColor: previewAccent, opacity: 0.2 }]} />
            <View style={[styles.previewCard, { backgroundColor: previewText, opacity: 0.05 }]} />
          </View>

          {isSelected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Ionicons
            name={icon as any}
            size={20}
            color={isSelected ? colors.primary : colors.dark.textSecondary}
          />
          <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.title}>How should Momentum look?</Text>
        <Text style={styles.subtitle}>
          Match your phone's theme or pick a fixed look. You can change this later in settings.
        </Text>

        <View style={styles.grid}>
          <ThemeCard type="system" label="Follow system (recommended)" icon="phone-portrait-outline" />
          <ThemeCard type="dark" label="Always dark" icon="moon-outline" />
          <ThemeCard type="light" label="Always light" icon="sunny-outline" />
        </View>

        <View style={styles.footer}>
          <Button label="Continue" onPress={handleContinue} fullWidth />
          <Button label="Skip for now" variant="ghost" onPress={handleContinue} fullWidth style={styles.skipButton} />
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
  grid: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  themeCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: colors.primary,
  },
  previewContainer: {
    height: 120,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  previewBar: {
    height: 8,
    width: 60,
    borderRadius: 4,
  },
  previewContent: {
    gap: spacing.sm,
  },
  previewCard: {
    height: 24,
    borderRadius: radii.sm,
    width: '100%',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.dark.textSecondary,
  },
  cardLabelSelected: {
    color: colors.primary,
  },
  footer: {
    marginTop: spacing.lg,
  },
  skipButton: {
    marginTop: spacing.sm,
  },
});
