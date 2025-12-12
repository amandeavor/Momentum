import React from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import StreakDashboardCard from '@/components/analytics/StreakDashboardCard';

export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Immersive Background */}
      <LinearGradient
        colors={['#000000', '#120503']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.title}>Streak Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StreakDashboardCard />

        <View style={styles.infoSection}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.dark.textSecondary} />
            <Text style={styles.infoTitle}>How Streaks Work</Text>
          </View>
          <Text style={styles.infoText}>
            Complete at least one habit or task each day to keep your streak alive.
            Consistency is key to building long-term momentum.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  backIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoSection: {
    marginTop: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark.text,
  },
  infoText: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    lineHeight: 24,
  },
});
